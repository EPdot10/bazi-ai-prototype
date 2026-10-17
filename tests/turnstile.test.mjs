import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyTurnstile } from '../lib/turnstile.ts';

const request = new Request('https://example.com/api/iching');
const options = {
  expectedAction: 'iching',
  expectedHostnames: new Set(['example.com']),
};

test('siteverify must match success, action and hostname', async () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;
  const originalFetch = globalThis.fetch;
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  try {
    globalThis.fetch = async () => Response.json({ success: true, action: 'iching', hostname: 'example.com' });
    assert.equal((await verifyTurnstile('fresh-token', request, options)).ok, true);
    globalThis.fetch = async () => Response.json({ success: true, action: 'other', hostname: 'example.com' });
    assert.equal((await verifyTurnstile('fresh-token', request, options)).ok, false);
    globalThis.fetch = async () => Response.json({ success: true, action: 'iching', hostname: 'other.example' });
    assert.equal((await verifyTurnstile('fresh-token', request, options)).ok, false);
    assert.equal((await verifyTurnstile('', request, options)).ok, false);
    assert.equal((await verifyTurnstile('x'.repeat(2_049), request, options)).ok, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = originalSecret;
  }
});
