export async function verifyTurnstile(
  token: string | undefined,
  request: Request,
  options: { expectedAction?: string; expectedHostnames?: Set<string> } = {},
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (
    !token ||
    token.length > 2_048 ||
    (options.expectedHostnames && options.expectedHostnames.size === 0)
  ) {
    return { ok: false, skipped: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const form = new URLSearchParams({
      secret,
      response: token,
    });
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) form.set('remoteip', ip);
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: form,
        signal: controller.signal,
      },
    );
    if (!response.ok) return { ok: false, skipped: false };
    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    return {
      ok:
        result.success === true &&
        (!options.expectedAction || result.action === options.expectedAction) &&
        (!options.expectedHostnames ||
          options.expectedHostnames.has(result.hostname ?? '')),
      skipped: false,
    };
  } catch {
    return { ok: false, skipped: false };
  } finally {
    clearTimeout(timeout);
  }
}
