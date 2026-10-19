import assert from 'node:assert/strict';
import test from 'node:test';

import { generateInterpretation } from '../lib/deepseek.ts';

test('interpretation prompt receives Zi Wei clues as an integrated lens', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.DEEPSEEK_API_KEY;
  const previousModel = process.env.DEEPSEEK_FREE_MODEL;
  let requestBody;

  process.env.DEEPSEEK_API_KEY = 'test-key';
  process.env.DEEPSEEK_FREE_MODEL = 'deepseek-v4-flash';
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: '{}' } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    await generateInterpretation(
      {
        chart: { dayMaster: '甲' },
        ziweiChart: {
          complete: true,
          mingBranch: '辰',
          shenBranch: '申',
          bureau: { element: 'water', number: 2 },
          transformations: [],
        },
        topic: 'overview',
        locale: 'zh',
      },
      { phase: 'character' },
    );

    const systemMessage = requestBody.messages.find(
      (message) => message.role === 'system',
    );
    const userMessage = requestBody.messages.find(
      (message) => message.role === 'user',
    );
    assert.match(
      systemMessage.content,
      /integrate the systems into one practical reading/i,
    );
    assert.match(
      systemMessage.content,
      /primarily about romantic and intimate connection/i,
    );
    assert.match(userMessage.content, /"mingBranch":"辰"/);
    assert.match(userMessage.content, /Simplified Chinese/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.DEEPSEEK_FREE_MODEL;
    else process.env.DEEPSEEK_FREE_MODEL = previousModel;
  }
});
