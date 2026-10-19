import {
  jsonWithRequestId,
  readJsonBody,
  requestId,
  rateLimitsEnabled,
  withinRateLimit,
} from '@/lib/request-guard';

const choices = new Set(['Match', 'Partial', 'Miss', 'CannotJudge']);
const sections = new Set([
  'overview',
  'past',
  'future',
  'character',
  'career',
  'relationships',
  'timing',
  'method',
]);
const surveyOptions = new Set([
  'clear',
  'somewhat_clear',
  'unclear',
  'specific',
  'mixed',
  'generic',
  'more_examples',
  'more_reasoning',
  'more_timing',
]);

export async function POST(request: Request) {
  const id = requestId();
  try {
    if (
      rateLimitsEnabled() &&
      !withinRateLimit(request, 'feedback', 40, 60 * 60_000)
    ) {
      return jsonWithRequestId({ error: 'Feedback limit reached.' }, id, 429);
    }

    const body = await readJsonBody<{
      consent?: boolean;
      period?: string;
      claimId?: string;
      calibrationVersion?: number;
      choice?: string;
      locale?: 'en' | 'zh';
      feedbackType?: 'prediction' | 'survey';
      section?: string;
      answers?: Record<string, unknown>;
      comment?: string;
    }>(request, 4_096);

    if (body.feedbackType === 'survey') {
      const answers = body.answers;
      const validAnswers =
        answers !== undefined &&
        answers !== null &&
        typeof answers === 'object' &&
        !Array.isArray(answers) &&
        Object.keys(answers).length <= 3 &&
        Object.entries(answers).every(
          ([key, value]) =>
            ['clarity', 'specificity', 'next_step'].includes(key) &&
            typeof value === 'string' &&
            surveyOptions.has(value),
        );
      const comment = body.comment ?? '';
      if (
        body.consent !== true ||
        !body.section ||
        !sections.has(body.section) ||
        !validAnswers ||
        typeof comment !== 'string' ||
        comment.length > 500 ||
        (!Object.keys(answers ?? {}).length && !comment.trim()) ||
        !['en', 'zh'].includes(body.locale ?? 'en')
      ) {
        return jsonWithRequestId(
          { error: 'Invalid survey feedback.' },
          id,
          400,
        );
      }

      // This endpoint intentionally does not accept chart, birth, name, or
      // location data. Free text is opt-in and explicitly capped at 500 chars.
      console.log('[ming-feedback-survey]', {
        requestId: id,
        section: body.section,
        answers,
        comment: comment.trim() || null,
        locale: body.locale ?? 'en',
      });
      return jsonWithRequestId({ ok: true }, id);
    }

    if (
      body.consent !== true ||
      !body.period ||
      body.period.length > 80 ||
      (body.claimId !== undefined && !/^[a-f0-9]{64}$/.test(body.claimId)) ||
      (body.calibrationVersion !== undefined &&
        body.calibrationVersion !== 2) ||
      !body.choice ||
      !choices.has(body.choice) ||
      (body.section !== undefined && !sections.has(body.section)) ||
      !['en', 'zh'].includes(body.locale ?? 'en')
    ) {
      return jsonWithRequestId({ error: 'Invalid feedback.' }, id, 400);
    }

    // Deliberately do not accept birth date, name, city, or chart data here.
    // Cloudflare logs can be used for aggregate calibration only after consent.
    console.log('[ming-feedback]', {
      requestId: id,
      period: body.period,
      section: body.section ?? 'past',
      claimId: body.claimId ?? null,
      calibrationVersion: body.calibrationVersion ?? 1,
      choice: body.choice,
      locale: body.locale ?? 'en',
    });
    return jsonWithRequestId({ ok: true }, id);
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
      return jsonWithRequestId({ error: 'Feedback is too large.' }, id, 413);
    }
    return jsonWithRequestId({ error: 'Invalid feedback.' }, id, 400);
  }
}
