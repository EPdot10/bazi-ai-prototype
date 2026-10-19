import { generateReadingFollowup } from '@/lib/deepseek';
import {
  jsonWithRequestId,
  readJsonBody,
  requestId,
  rateLimitsEnabled,
  withinRateLimit,
} from '@/lib/request-guard';
import { verifyTurnstile } from '@/lib/turnstile';

interface FollowupBody {
  question?: unknown;
  context?: unknown;
  locale?: unknown;
  turnstileToken?: unknown;
}

const maxQuestionLength = 240;
const maxContextLength = 8_000;

export async function POST(request: Request) {
  const id = requestId();
  if (rateLimitsEnabled() && !withinRateLimit(request, 'reading-followup', 4, 10 * 60_000)) {
    return jsonWithRequestId(
      { error: 'Too many follow-up questions. Please wait and try again.', requestId: id },
      id,
      429,
    );
  }

  if (
    request.headers.has('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  ) {
    return jsonWithRequestId({ error: 'Invalid request origin.', requestId: id }, id, 403);
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonWithRequestId({ error: 'Expected application/json.', requestId: id }, id, 415);
  }

  let body: FollowupBody;
  try {
    body = await readJsonBody<FollowupBody>(request, 12_000);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'REQUEST_TOO_LARGE';
    return jsonWithRequestId(
      {
        error: tooLarge ? 'Request body is too large.' : 'Request body must be valid JSON.',
        requestId: id,
      },
      id,
      tooLarge ? 413 : 400,
    );
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const context = typeof body.context === 'string' ? body.context.trim() : '';
  if (
    question.length < 4 ||
    question.length > maxQuestionLength ||
    context.length < 20 ||
    context.length > maxContextLength ||
    (body.locale !== 'en' && body.locale !== 'zh')
  ) {
    return jsonWithRequestId(
      {
        error: `Question must be 4–${maxQuestionLength} characters; reading context must be present and under ${maxContextLength} characters.`,
        requestId: id,
      },
      id,
      400,
    );
  }

  const hostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.TURNSTILE_SECRET_KEY || hostnames.size === 0)
  ) {
    return jsonWithRequestId(
      { error: 'Bot protection is not configured.', requestId: id },
      id,
      503,
    );
  }
  const verification = await verifyTurnstile(
    typeof body.turnstileToken === 'string' ? body.turnstileToken : undefined,
    request,
    { expectedAction: 'reading-followup', expectedHostnames: hostnames },
  );
  if (!verification.ok) {
    return jsonWithRequestId(
      { error: 'Bot verification failed. Please complete it and try again.', requestId: id },
      id,
      403,
    );
  }

  try {
    const answer = await generateReadingFollowup({
      question,
      analysisContext: context,
      locale: body.locale,
    });
    return jsonWithRequestId({ answer, requestId: id }, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(JSON.stringify({ event: 'reading_followup_failed', requestId: id, error: message }));
    return jsonWithRequestId(
      { error: 'AI follow-up failed. Please try again later.', requestId: id },
      id,
      502,
    );
  }
}
