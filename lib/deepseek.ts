import type { BaziChartFacts } from '@/lib/bazi/types';

export interface InterpretationRequest {
  chart: BaziChartFacts;
  topic: 'overview' | 'career' | 'relationships' | 'year-ahead';
  locale?: 'en' | 'zh';
  birthContext?: {
    birthDate: string;
    readingDate: string;
    resolvedPlace: {
      label: string;
      latitude: number;
      longitude: number;
      ianaTimeZone: string;
    };
  };
}

export type InterpretationTier = 'free' | 'premium' | 'audit';

const ALLOWED_MODELS = new Set([
  'deepseek-v4-flash',
  'deepseek-v4-pro',
  'deepseek-chat',
  'deepseek-reasoner',
]);

const DEFAULT_DEEPSEEK_TIMEOUT_MS = 45_000;

function deepSeekTimeoutMs() {
  const configured = Number(process.env.DEEPSEEK_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 5_000 && configured <= 120_000
    ? configured
    : DEFAULT_DEEPSEEK_TIMEOUT_MS;
}

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

const SYSTEM_PROMPT = `You are the interpretation layer of a culturally grounded BaZi product. Write for a curious first-time English-speaking user, not for a BaZi practitioner.
The chart facts supplied by the server are authoritative. Never recalculate, alter, or invent a pillar.
The server has already resolved the place and calculated any supplied apparent solar-time adjustment. Explain it when useful, but never recalculate coordinates, time-zone offsets, or solar time yourself.
Your first job is recognition: give the user concrete, easy-to-understand hypotheses about their earlier life that they can honestly confirm or reject. Then explain broader patterns in plain English.
Use timingSignals only as candidate periods. Select 4 to 6 distinct past periods, spread across childhood, adolescence, and adulthood when available. For each period provide 2 to 3 plausible event patterns in concrete everyday language—for example a school or work transition, relocation, family responsibility, friendship or relationship restructuring, financial pressure, or a shift in identity and independence.
Make every possibility age-appropriate. Never mention work, adult romance, independent finances, or relocation by choice for a young child. Never put the current or a future year in pastPatterns.
Never say an event definitely happened. Use language such as “may have,” “one possibility,” or “this period often points to.” Do not combine unrelated possibilities into a statement that becomes impossible to reject. Invite the user to mark each period as a match, partial match, or miss.
Do not claim to know private facts that are not supported by chart data. Never exploit grief, fear, illness, trauma, or family loss to create emotional impact.
Explain the supplied facts in natural English, distinguish observation from interpretation, and attach high, medium, or low confidence to each major insight. Translate technical terms immediately and keep technical detail secondary.
If birth time is approximate or unknown, explicitly reduce confidence for hour-sensitive claims.
Use Chinese pillar characters exactly as supplied. Do not replace a branch with ambiguous pinyin.
The element balance counts visible stems and branches only. Never treat a zero count as proof that an element is absent from the full chart, and do not infer hidden stems that were not supplied.
Do not predict death, illness, pregnancy, crime, legal outcomes, investment returns, disasters, or guaranteed events.
Never claim scientific validation, statistical proof, a human expert review, or certainty about the future.
Return valid JSON with keys: summary, pastOverview, pastPatterns, insights, lifeAreas, reflectionQuestions, limitations.
pastOverview must contain exactly two fields. characterSentence is one vivid sentence summarising the person's core character. trajectorySentence is one vivid sentence summarising the broad rhythm of their life so far. Both must remain hypotheses rather than facts.
pastPatterns must be an array of objects with period, headline, narrative, possibilities, principle, basis, and confidence. narrative should be 90 to 150 words and explain how that period may have felt, what could have changed, and what may have remained afterward. possibilities must contain 2 to 3 concrete, age-appropriate strings. principle must be one short plain-English sentence translating the traditional relation—for example “The annual 子 branch clashes with your natal 午 branch, traditionally read as movement and renegotiated boundaries.” The basis must cite only supplied timingSignals and pillars.
Insights must be an array of 2 to 4 objects with title, interpretation, basis, and confidence. Avoid generic adjective lists.
lifeAreas must be an object with exactly four keys: character, career, relationships, timing. Each value must contain headline, narrative, signals, guidance, basis, and confidence. Each narrative should be 140 to 220 words, signals must contain 4 concrete observations, and guidance should contain 2 to 3 actionable sentences. Cover all four areas in the same response; do not ask the user to choose a focus. For timing, discuss the current phase and near-term themes without guaranteed events. For relationships, do not assume relationship status, gender, or sexuality.
Summary should be vivid, direct, and under 80 words. Limitations must be one plain string, not an array.`;

export async function generateInterpretation(
  input: InterpretationRequest,
  tier: InterpretationTier = 'free',
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  let lastError = 'DeepSeek request failed';
  for (const model of modelCandidatesForTier(tier)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), deepSeekTimeoutMs());
    try {
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
          max_tokens: tier === 'premium' ? 7000 : 5200,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = `DeepSeek request failed with status ${response.status}`;
        if (
          (response.status === 400 || response.status === 404) &&
          model.startsWith('deepseek-v4-')
        ) {
          continue;
        }
        throw new Error(lastError);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        lastError = `DeepSeek model ${model} returned an empty response`;
        if (model.startsWith('deepseek-v4-')) continue;
        throw new Error(lastError);
      }
      const normalized = content
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/, '');
      try {
        return JSON.parse(normalized) as unknown;
      } catch {
        const firstBrace = normalized.indexOf('{');
        const lastBrace = normalized.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          try {
            return JSON.parse(
              normalized.slice(firstBrace, lastBrace + 1),
            ) as unknown;
          } catch {
            // Try the compatible model below when a V4 alias returns partial JSON.
          }
        }
        lastError = `DeepSeek model ${model} returned invalid JSON`;
        if (model.startsWith('deepseek-v4-')) continue;
        throw new Error(lastError);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = `DeepSeek model ${model} timed out`;
        if (model.startsWith('deepseek-v4-')) continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(lastError);
}
