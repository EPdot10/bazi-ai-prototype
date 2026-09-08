import type { BaziChartFacts } from '@/lib/bazi/types';

export interface InterpretationRequest {
  chart: BaziChartFacts;
  topic: 'overview' | 'career' | 'relationships' | 'year-ahead';
  locale?: 'en' | 'zh';
}

export type InterpretationTier = 'free' | 'premium' | 'audit';

const ALLOWED_MODELS = new Set([
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-chat',
  'deepseek-reasoner',
]);

function configuredModel(name: string, fallback: string) {
  const value = process.env[name] ?? fallback;
  if (!ALLOWED_MODELS.has(value)) {
    throw new Error(`${name} must be deepseek-v4-flash or deepseek-v4-pro`);
  }
  return value;
}

export function resolveModelForTier(tier: InterpretationTier) {
  switch (tier) {
    case 'premium':
      return configuredModel('DEEPSEEK_PREMIUM_MODEL', 'deepseek-v4-pro');
    case 'audit':
      return configuredModel('DEEPSEEK_AUDIT_MODEL', 'deepseek-v4-flash');
    default:
      return configuredModel('DEEPSEEK_FREE_MODEL', 'deepseek-v4-flash');
  }
}

function modelCandidatesForTier(tier: InterpretationTier) {
  const configured = resolveModelForTier(tier);
  const compatible = tier === 'premium' ? 'deepseek-reasoner' : 'deepseek-chat';
  return configured === compatible ? [configured] : [configured, compatible];
}

const SYSTEM_PROMPT = `You are the interpretation layer of a culturally grounded BaZi product.
The chart facts supplied by the server are authoritative. Never recalculate, alter, or invent a pillar.
Explain the supplied facts in natural English, distinguish observation from interpretation, and attach high, medium, or low confidence to each major insight.
If birth time is approximate or unknown, explicitly reduce confidence for hour-sensitive claims.
Use Chinese pillar characters exactly as supplied. Do not replace a branch with ambiguous pinyin.
The element balance counts visible stems and branches only. Never treat a zero count as proof that an element is absent from the full chart, and do not infer hidden stems that were not supplied.
Do not predict death, illness, pregnancy, crime, legal outcomes, investment returns, disasters, or guaranteed events.
Never claim scientific validation, statistical proof, a human expert review, or certainty about the future.
Return valid JSON with keys: summary, insights, reflectionQuestions, limitations. Insights must be an array of objects with title, interpretation, basis, and confidence. Limitations must be one plain string, not an array.`;

export async function generateInterpretation(
  input: InterpretationRequest,
  tier: InterpretationTier = 'free',
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    let lastStatus = 500;
    for (const model of modelCandidatesForTier(tier)) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(input) },
          ],
          temperature: 0.35,
          max_tokens: 3200,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastStatus = response.status;
        if (
          (response.status === 400 || response.status === 404) &&
          model.startsWith('deepseek-v4-')
        ) {
          continue;
        }
        throw new Error(
          `DeepSeek request failed with status ${response.status}`,
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error('DeepSeek returned an empty response');
      const normalized = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '');
      return JSON.parse(normalized) as unknown;
    }
    throw new Error(`DeepSeek request failed with status ${lastStatus}`);
  } finally {
    clearTimeout(timeout);
  }
}
