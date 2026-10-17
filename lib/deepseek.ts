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

export type InterpretationPhase =
  | 'past'
  | 'future'
  | 'character'
  | 'career'
  | 'relationships'
  | 'timing';

const ALLOWED_FLASH_MODELS = new Set([
  'deepseek-flash',
  'deepseek-v4-flash',
  'deepseek-v4-flash-vision-exp',
]);

const DEFAULT_DEEPSEEK_TIMEOUT_MS = 60_000;

function deepSeekTimeoutMs() {
  const configured = Number(process.env.DEEPSEEK_TIMEOUT_MS);
  return Number.isFinite(configured) &&
    configured >= 5_000 &&
    configured <= 60_000
    ? configured
    : DEFAULT_DEEPSEEK_TIMEOUT_MS;
}

function configuredModel() {
  const configuredValue =
    process.env.DEEPSEEK_FREE_MODEL ??
    process.env.DEEPSEEK_MODEL ??
    'deepseek-v4-flash';
  // Older deployments used the generic alias. Keep the deployment compatible
  // while routing it to the current Flash model requested for this pass.
  const value =
    configuredValue === 'deepseek-flash'
      ? 'deepseek-v4-flash'
      : configuredValue;
  if (!ALLOWED_FLASH_MODELS.has(value)) {
    throw new Error(
      'DEEPSEEK_FREE_MODEL/DEEPSEEK_MODEL must be an allowed Flash model',
    );
  }
  return value;
}

const SYSTEM_PROMPT = `You are the interpretation layer of a culturally grounded BaZi product for first-time users. Follow locale exactly: Simplified Chinese for "zh", English for "en".

FACT BOUNDARY
- Server chart facts are authoritative. Never recalculate or alter pillars, place, time zone, or solar-time correction.
- Use only pillars, seasonalStrength, hiddenStems, tenGods, structuralRelations, timingSignals, eventCandidates, and futureSignals as evidence.
- Birthplace identifies where the birth occurred. It does not reveal where the person grew up, lives now, studied, or worked. Name and gender are supplied context, never predicted discoveries.
- systems.ziwei is "not-calculated". Never invent Ziwei Dou Shu palaces, stars, Four Transformations, Da Yun, or major periods. It is a future experimental direction, not evidence in this reading.
- Visible element counts exclude hidden stems. A visible zero never proves complete absence.
- Reduce confidence for approximate time and omit hour-dependent claims for unknown time.

VOICE AND HONESTY
- Be specific, balanced, and direct rather than flattering. Every life area must name a genuine strength, a friction, a stress behaviour, and a plausible cost.
- Negative material must be an evidence-linked risk, not fear theatre. State the condition that could activate it and an action that preserves agency.
- Never claim an event definitely happened or will happen. Use "may", "more exposed to", or "if this is already present".
- Never predict death, illness, pregnancy, crime, legal outcomes, investment returns, disasters, guaranteed job loss, or guaranteed relationship failure. Never exploit grief, trauma, or fear.
- Do not claim scientific validation, certainty, or human expert review.
- Traditional time and seasonal patterns are an interpretive lens, not proof that celestial motion predicts personal events. Translate a chart clue into a conditional modern-life hypothesis, then say what could change its expression: era, local culture, resources, circumstances, and personal choices. Do not turn the familiar seasons-and-clothing analogy into an accuracy claim.
- User-facing prose should lead with the practical meaning in everyday language. Put concise traditional reasoning in basis or principle; do not fill narratives with unexplained stem, branch, or Ten God terminology.

PAST PATTERNS
- Use every supplied eventCandidate, and no other year. Sort chronologically. Quality outranks a fixed count.
- Begin each narrative with its year and approximate age. Give one primary, checkable hypothesis and at most one clearly differentiated alternative tied to the supplied domain and mechanism. State the situation and possible consequence rather than stacking vague possibilities.
- Do not infer a school system, university, migration, marriage, parenthood, retirement, or profession from age, gender, or birthplace alone. A relevant chart domain may support a conditional hypothesis, not a factual claim. Prefer the adult and later-life evidence when it is supplied.
- Adjacent entries must differ in primary scene, opening, mechanism, and consequence. Avoid generic headlines such as "major transition" or "changed circles".
- Across the full timeline, avoid filling most entries with school, career, and social-circle transitions. If the supplied clues cannot support a distinctive scene, describe the narrower tension honestly instead of inventing an event.

LIFE AREAS
- lifeAreas has exactly character, career, relationships, timing.
- Each area contains headline, narrative, strengths (2–3 strings), frictions (2–3), stressPattern, possibleCost, actions (2–3), basis, confidence.
- Character covers motives, outward style, inner tension, blind spots, and behaviour under pressure.
- Career covers suitable and unsuitable environments, resource habits, failure modes, and boundaries; never prescribe a fixed profession.
- Relationships covers closeness, conflict defence, needs, boundaries, and recurring costs without assuming status, gender, or sexuality.
- Timing explains the current strategic posture. Do not duplicate the year-by-year future section.

FUTURE
- Create one futureForecast object for every supplied futureSignal, in chronological order, and no unsupported year.
- Each object contains year, age, theme, opportunity, pressure, riskScenario, triggerConditions (2 strings), earlySignals (2), actions (2–3), avoid (1–2), basis, confidence, hourSensitive.
- Translate opportunityScore and pressureScore into emphasis, not probabilities. A strong year may contain opportunity and cost at once.
- riskScenario must be concrete but conditional: describe how an unresolved pattern could worsen, never a guaranteed event.

OUTPUT
Return valid JSON with exactly these top-level keys: summary, pastOverview, pastPatterns, insights, lifeAreas, futureOverview, futureForecasts, reflectionQuestions, limitations.
- summary: vivid and under 80 words.
- pastOverview: characterSentence and trajectorySentence, both hypotheses.
- pastPatterns: objects with period, headline, narrative, possibilities, principle, basis, confidence.
- insights: 2–4 objects with title, interpretation, basis, confidence.
- futureOverview: 2–3 sentences describing the range, strongest opportunity, and strongest pressure without certainty.
- reflectionQuestions: 2–4 specific questions.
- limitations: one plain string.

FINAL SILENT AUDIT
Rewrite any sentence that could fit almost anyone, flatters without a cost, predicts certainty, cites unsupplied evidence, repeats another section, or mistakes user-provided context for a prediction. Every adverse claim must have a basis, trigger condition, and useful response. Every user-visible value must use the requested language; retain only Chinese pillar characters and proper nouns when writing English.`;

const PHASE_PROMPTS: Record<InterpretationPhase, string> = {
  past: `PHASE OUTPUT: Generate only the retrospective page. Return JSON with exactly these keys: summary, pastOverview, pastPatterns, insights, reflectionQuestions, limitations. Do not include lifeAreas, futureOverview, or futureForecasts. Use every supplied eventCandidate. Cover later adulthood when present; do not cluster scenes around universal school or first-job ages. Make adjacent periods materially different. Each narrative should lead with the conditional, everyday-life hypothesis; principle and basis hold the short technical explanation.`,
  future: `PHASE OUTPUT: Generate only the outlook page. Return JSON with exactly these keys: futureOverview, futureForecasts. Create one forecast for every supplied futureSignal and no unsupported year.`,
  character: `PHASE OUTPUT: Generate only the character life area. Return JSON with exactly one top-level key: lifeAreas. Inside it include only character. The character object must contain headline, narrative, strengths, frictions, stressPattern, possibleCost, actions, basis, confidence.`,
  career: `PHASE OUTPUT: Generate only the career life area. Return JSON with exactly one top-level key: lifeAreas. Inside it include only career. The career object must contain headline, narrative, strengths, frictions, stressPattern, possibleCost, actions, basis, confidence.`,
  relationships: `PHASE OUTPUT: Generate only the relationships life area. Return JSON with exactly one top-level key: lifeAreas. Inside it include only relationships. The relationships object must contain headline, narrative, strengths, frictions, stressPattern, possibleCost, actions, basis, confidence.`,
  timing: `PHASE OUTPUT: Generate only the timing life area. Return JSON with exactly one top-level key: lifeAreas. Inside it include only timing. The timing object must contain headline, narrative, strengths, frictions, stressPattern, possibleCost, actions, basis, confidence.`,
};

export async function generateInterpretation(
  input: InterpretationRequest,
  options: { repairSchema?: boolean; phase?: InterpretationPhase } = {},
) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  const model = configuredModel();
  const phase = options.phase;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deepSeekTimeoutMs());
  try {
    const schemaInstruction = options.repairSchema
      ? phase
        ? `SCHEMA REPAIR PASS FOR ${phase}: Return only the phase JSON contract. Keep every property name exactly as specified in English; translate string values only. Do not add commentary or markdown.`
        : 'SCHEMA REPAIR PASS: The previous response did not satisfy the contract. Return a complete JSON object now. Keep every property name exactly as specified in English; translate string values only. Do not omit any of the four lifeAreas or any required child field. Do not add commentary or markdown.'
      : phase
        ? `SCHEMA LOCK FOR ${phase}: Keep every property name exactly as specified in English. Translate string values only; never translate, rename, or omit keys. ${PHASE_PROMPTS[phase]}`
        : 'SCHEMA LOCK: Every JSON property name must remain exactly as specified in English, including character, career, relationships, timing, headline, narrative, strengths, frictions, stressPattern, possibleCost, actions, basis, confidence, futureForecasts, and all other keys. Translate string values only; never translate, rename, or omit keys.';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        // Keep the public reading path in Flash non-thinking mode. It is
        // materially faster and guarantees a final JSON content payload;
        // failures are surfaced instead of replaced by a local reading.
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: phase
              ? `${SYSTEM_PROMPT}\n\n${PHASE_PROMPTS[phase]}`
              : SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: JSON.stringify({
              ...input,
              requestedPhase: phase ?? 'complete',
              outputLanguageInstruction:
                input.locale === 'zh'
                  ? 'MANDATORY: every user-visible field in the JSON, including summary, pastOverview, pastPatterns, insights, lifeAreas, futureOverview, futureForecasts, reflectionQuestions, and limitations, must be written in Simplified Chinese. Keep pillar characters and technical terms, but explain them in Chinese.'
                  : 'MANDATORY: every user-visible field in the JSON must be written in English.',
              schemaInstruction,
            }),
          },
        ],
        temperature: 0.5,
        max_tokens:
          phase === 'past'
            ? 4_200
            : phase === 'future'
              ? 5_000
              : phase
                ? 2_600
                : 9_000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DeepSeek request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`DeepSeek model ${model} returned an empty response`);
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
          // Preserve the provider failure so the caller can report it honestly.
        }
      }
      throw new Error(`DeepSeek model ${model} returned invalid JSON`);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`DeepSeek model ${model} timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
