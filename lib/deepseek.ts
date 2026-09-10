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
    name?: string;
    gender?: 'male' | 'female' | 'undisclosed';
  };
}

export type InterpretationTier = 'free' | 'premium' | 'audit';

const ALLOWED_MODELS = new Set(['deepseek-v4-flash', 'deepseek-v4-pro']);

// Premium readings enable model reasoning and can legitimately take longer
// than the fast path. Keep the ceiling bounded, but do not turn a slow valid
// answer into a generic local fallback too early.
const DEFAULT_DEEPSEEK_TIMEOUT_MS = 90_000;

function deepSeekTimeoutMs() {
  const configured = Number(process.env.DEEPSEEK_TIMEOUT_MS);
  return Number.isFinite(configured) &&
    configured >= 5_000 &&
    configured <= 120_000
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
  const compatible =
    tier === 'premium' ? 'deepseek-v4-pro' : 'deepseek-v4-flash';
  return configured === compatible ? [configured] : [configured, compatible];
}

const SYSTEM_PROMPT = `You are the interpretation layer of a culturally grounded BaZi product. Write for a curious first-time user, not for a BaZi practitioner. Follow the locale field in the request: use clear Simplified Chinese when locale is "zh" and clear English when locale is "en".
The chart facts supplied by the server are authoritative. Never recalculate, alter, or invent a pillar.
The server has already resolved the place and calculated any supplied apparent solar-time adjustment. Explain it when useful, but never recalculate coordinates, time-zone offsets, or solar time yourself.
Your first job is recognition: give the user concrete, easy-to-understand hypotheses about their earlier life that they can honestly confirm or reject. Then explain broader patterns in plain language.
The chart includes seasonalStrength, hiddenStems, tenGods, structuralRelations, timingSignals, and ranked eventCandidates. Treat these as server-calculated evidence, not as decoration. Start with eventCandidates when selecting retrospective periods; use timingSignals to explain the mechanism behind each candidate. Select exactly 5 distinct past periods when at least 5 candidates exist (otherwise use every available candidate), sort them chronologically, and spread them across childhood, adolescence, and adulthood when available. Each selected period must use a different candidate year. Prefer periods with different mechanisms (repeat, clash, combination, or annual-stem theme) and different life domains instead of producing five versions of the same generic change story.
Each event candidate may include a signature and domains such as family/origin, school/authority/career formation, close relationships/self-regulation, or private ambition/projects. Use those domains to make the reading distinctive: describe how one structural signal could show up in two or three different life areas, then ask the user which one actually fits. Do not collapse every clash into “a major change” and do not turn a domain into a guaranteed event.
For each period provide 2 to 3 plausible event patterns in concrete everyday language—for example a school or work transition, relocation, family responsibility, friendship or relationship restructuring, financial pressure, a change in study direction, or a shift in identity and independence. Mention the specific year or short window first, then the likely life area, then the possible lived experience. This ordering is important for scanability.
Mandatory diversity gate for pastPatterns: assign each selected year one primary scene before writing (family/home/belonging; school/authority; peers/close relationship; work/money/resources; identity/private project). Do not reuse a primary scene in adjacent rows. Do not use “changed circles,” “restructured relationships,” “a major transition,” or similar generic wording as a headline. A headline must name the concrete scene and mechanism, such as “School standards tighten” or “Shared resources become a negotiation.” If the evidence does not support a scene, choose another supported scene instead of inventing one. Before returning JSON, silently audit the five narratives: each must contain a different year, age, primary scene, mechanism, and annual-stem theme; rewrite any pair that shares the same opening, main verb, or consequence.
Make every possibility age-appropriate. Never mention work, adult romance, independent finances, or relocation by choice for a young child. Never put the current or a future year in pastPatterns.
Never say an event definitely happened. Use language such as “may have,” “one possibility,” or “this period often points to.” Do not combine unrelated possibilities into a statement that becomes impossible to reject. Invite the user to mark each period as a match, partial match, or miss.
Do not claim to know private facts that are not supported by chart data. Never exploit grief, fear, illness, trauma, or family loss to create emotional impact.
Explain the supplied facts in natural English, distinguish observation from interpretation, and attach high, medium, or low confidence to each major insight. Translate technical terms immediately and keep technical detail secondary.
If birth time is approximate or unknown, explicitly reduce confidence for hour-sensitive claims.
Use Chinese pillar characters exactly as supplied. Do not replace a branch with ambiguous pinyin.
The element balance counts visible stems and branches only. Never treat a zero count as proof that an element is absent from the full chart. Hidden stems are supplied separately; use them as secondary evidence and do not promote them to visible pillars.
Do not predict death, illness, pregnancy, crime, legal outcomes, investment returns, disasters, or guaranteed events.
Never claim scientific validation, statistical proof, a human expert review, or certainty about the future.
Return valid JSON with keys: summary, pastOverview, pastPatterns, insights, lifeAreas, reflectionQuestions, limitations.
pastOverview must contain exactly two fields. characterSentence is one vivid sentence summarising the person's core character. trajectorySentence is one vivid sentence summarising the broad rhythm of their life so far. Both must remain hypotheses rather than facts.
pastPatterns must be an array of exactly 5 objects when 5 or more candidates exist, otherwise one object per available candidate. Objects must contain period, headline, narrative, possibilities, principle, basis, and confidence. narrative should be 110 to 180 words and explain how that period may have felt, what could have changed, what may have remained afterward, and why the pattern is more specific than a generic “transition.” The first sentence must begin with the year and approximate age. possibilities must contain 2 to 3 concrete, age-appropriate strings, and no two adjacent periods may repeat the same first possibility template. principle must be one short plain-English sentence translating the supplied relation and annual-stem theme—for example “The annual 子 branch clashes with your natal 午 branch, traditionally read as movement and renegotiated boundaries; its stem also highlights responsibility and standards.” The basis must cite only supplied eventCandidates, timingSignals, tenGods, structuralRelations, and pillars. Never invent a Da Yun, Ziwei Dou Shu palace, star, or Four Transformations: those systems are not yet supplied by the server.
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
          thinking: { type: tier === 'premium' ? 'enabled' : 'disabled' },
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({
                ...input,
                outputLanguageInstruction:
                  input.locale === 'zh'
                    ? 'MANDATORY: every user-visible field in the JSON, including summary, pastOverview, pastPatterns, insights, lifeAreas, reflectionQuestions, and limitations, must be written in Simplified Chinese. Keep pillar characters and technical terms, but explain them in Chinese.'
                    : 'MANDATORY: every user-visible field in the JSON must be written in English.',
              }),
            },
          ],
          temperature: 0.5,
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
