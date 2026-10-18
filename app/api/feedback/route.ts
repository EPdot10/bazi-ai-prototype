import {
  jsonWithRequestId,
  readJsonBody,
  requestId,
  rateLimitsEnabled,
  withinRateLimit,
} from '@/lib/request-guard';

const choices = new Set(['Match', 'Partial', 'Miss', 'CannotJudge']);

export async function POST(request: Request) {
  const id = requestId();
  try {
    if (
      rateLimitsEnabled() &&
      !withinRateLimit(request, 'feedback', 20, 60 * 60_000)
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
    }>(request, 2_048);

    if (
      body.consent !== true ||
      !body.period ||
      body.period.length > 80 ||
      (body.claimId !== undefined && !/^[a-f0-9]{64}$/.test(body.claimId)) ||
      (body.calibrationVersion !== undefined && body.calibrationVersion !== 2) ||
      !body.choice ||
      !choices.has(body.choice) ||
      !['en', 'zh'].includes(body.locale ?? 'en')
    ) {
      return jsonWithRequestId({ error: 'Invalid feedback.' }, id, 400);
    }

    // Deliberately do not accept birth date, name, city, or chart data here.
    // Cloudflare logs can be used for aggregate calibration only after consent.
    console.log('[ming-feedback]', {
      requestId: id,
      period: body.period,
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
