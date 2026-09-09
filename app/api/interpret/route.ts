import { calculateBaziChart } from '@/lib/bazi/calculate';
import type { BirthTimeConfidence } from '@/lib/bazi/types';
import { generateInterpretation } from '@/lib/deepseek';
import { getTestReading } from '@/lib/fixtures/test-readings';
import { resolveBirthPlace } from '@/lib/geocode';
import {
  jsonWithRequestId,
  readJsonBody,
  requestId,
  withinRateLimit,
} from '@/lib/request-guard';
import { verifyTurnstile } from '@/lib/turnstile';

const validConfidence = new Set<BirthTimeConfidence>([
  'exact',
  'approximate',
  'unknown',
]);
const validTopics = new Set([
  'overview',
  'career',
  'relationships',
  'year-ahead',
]);

function localInterpretation(
  chart: ReturnType<typeof calculateBaziChart>,
  topic: string,
) {
  const pillars = Object.values(chart.pillars).join(' · ');
  const missingHour = chart.birthTimeConfidence === 'unknown';
  const selectedSignals = chart.timingSignals.reduce(
    (selected, signal) => {
      if (
        selected.length < 5 &&
        selected.every((item) => Math.abs(item.year - signal.year) >= 3)
      ) {
        selected.push(signal);
      }
      return selected;
    },
    [] as typeof chart.timingSignals,
  );
  return {
    summary: `Your ${missingHour ? 'three visible pillars' : 'four pillars'} are ${pillars}. Your Day Master is ${chart.dayMaster}. This is a reflective reading of traditional BaZi patterns, not a factual or scientific prediction.`,
    pastOverview: {
      characterSentence: `You may present as measured and self-controlled, while privately testing every rule against your own experience before you trust it.`,
      trajectorySentence: `Your path so far may have moved through alternating periods of stability and sharp redirection, with each disruption asking for greater independence.`,
    },
    pastPatterns: selectedSignals.map((signal) => {
      const hasClash = signal.relations.some((relation) =>
        relation.includes('clashes'),
      );
      const hasRepeat = signal.relations.some((relation) =>
        relation.includes('repeats'),
      );
      const lifeStage =
        signal.age < 13
          ? 'childhood'
          : signal.age < 19
            ? 'adolescence'
            : 'adult';
      const possibilities =
        lifeStage === 'childhood'
          ? hasClash
            ? [
                'A change involving school, home, caregivers, or close friends may have unsettled your usual routine.',
                'You may have had to become more adaptable or self-reliant than before.',
              ]
            : [
                'A teacher, friendship, family expectation, or new activity may have become especially important.',
                'You may have received more attention or responsibility within your everyday world.',
              ]
          : lifeStage === 'adolescence'
            ? hasClash
              ? [
                  'A shift in studies, friendships, family expectations, or identity may have broken an established rhythm.',
                  'A disagreement or separation may have pushed you toward a more independent choice.',
                ]
              : [
                  'A new friendship, mentor, study direction, or personal goal may have changed your priorities.',
                  'You may have taken on a stronger identity or responsibility among peers or family.',
                ]
            : hasClash
              ? [
                  'A change in school, work, home, or your usual social circle may have disrupted an established routine.',
                  'A disagreement, separation, or new pressure may have forced a more independent decision.',
                ]
              : hasRepeat
                ? [
                    'An existing family, study, or work theme may have intensified and demanded more responsibility.',
                    'You may have become more visible or decisive, while also feeling that an old pattern was repeating.',
                  ]
                : [
                    'A new friendship, team, mentor, or relationship may have opened a different direction.',
                    'An agreement or opportunity may have made progress easier, but required adapting to another person.',
                  ];
      return {
        period: `${signal.year} · around age ${signal.age}`,
        headline: hasClash
          ? 'A break from the previous rhythm'
          : hasRepeat
            ? 'An existing theme became harder to ignore'
            : 'A new connection or direction',
        narrative: `${possibilities.join(' ')} The lasting effect may have been less about the event itself and more about how you learned to respond: by clarifying priorities, relying on your own judgement, or changing the boundaries around a relationship or responsibility. Treat this as a period to check rather than a fixed claim; the useful question is whether the rhythm of change feels recognisable.`,
        possibilities,
        principle: `${signal.annualPillar} activated your visible chart through ${signal.relations.join(' and ')}, traditionally read as a period when an existing pattern becomes harder to ignore.`,
        basis: `${signal.annualPillar}: ${signal.relations.join('; ')}`,
        confidence: signal.strength === 'strong' ? 'medium' : 'low',
      };
    }),
    insights: [
      {
        title: 'Your central reference point',
        interpretation: `In BaZi, the ${chart.dayMaster} Day Master is used as the centre of the chart. A fuller interpretation compares it with season, elements and the other pillars rather than treating it as a personality label.`,
        basis: `Day pillar ${chart.pillars.day}`,
        confidence: 'high',
      },
      {
        title: `${topic.replace('-', ' ')} reflection`,
        interpretation: missingHour
          ? 'Without a birth hour, this reading intentionally stays with broad patterns. It does not make claims that depend on the hour pillar.'
          : 'The supplied birth hour is included, allowing the reading to consider all four visible pillars.',
        basis: `Birth-time confidence: ${chart.birthTimeConfidence}`,
        confidence: missingHour ? 'medium' : 'high',
      },
    ],
    lifeAreas: {
      character: {
        headline: 'How you tend to meet the world',
        narrative: `The ${chart.dayMaster} Day Master is the chart's central reference point. Your visible pillars suggest a preference for building clarity through experience rather than accepting a label at face value. You may appear composed when the situation is uncertain, then process the real weight of it later and in private. Standards matter to you, but the deeper pattern is not rigidity—it is a need to understand what is dependable before committing your energy.`,
        signals: [
          'You may work best when expectations are explicit.',
          'Pressure can sharpen your decisions, but too much structure may feel restrictive.',
          'You may reveal vulnerability selectively and value consistency over dramatic reassurance.',
          'Once a decision feels internally settled, you can be difficult to redirect.',
        ],
        guidance:
          'Notice where principle helps you—and where flexibility would help more.',
        basis: `Day pillar ${chart.pillars.day}; visible three-pillar structure.`,
        confidence: missingHour ? 'medium' : 'high',
      },
      career: {
        headline: 'Work, contribution, and resources',
        narrative:
          'The visible chart points to a practical relationship with responsibility and resources. This is better read as a working tendency than as a fixed profession. You may be most convincing when you can turn a vague problem into a workable structure, especially where judgement and follow-through matter. Recognition may arrive later than effort because you tend to build credibility through repeated results rather than self-promotion. The risk is carrying responsibility long after the role has stopped rewarding growth.',
        signals: [
          'Roles with visible standards and room to improve systems may feel satisfying.',
          'You may prefer progress that can be measured over purely abstract status.',
          'You may be trusted with difficult work before you are formally rewarded for it.',
          'A clear boundary between responsibility and over-functioning is important.',
        ],
        guidance:
          'Choose environments that reward judgement as well as persistence.',
        basis: `Visible element balance: ${JSON.stringify(chart.elementBalance)}.`,
        confidence: 'medium',
      },
      relationships: {
        headline: 'How closeness and independence interact',
        narrative:
          'Your visible pillars suggest that reliability may matter as much as emotional intensity. Relationship status and private history cannot be inferred from the chart. You may take time to trust, then invest through practical attention, memory, and consistency. When disappointed, the first response may be to become more self-sufficient rather than ask directly for reassurance. This can make you look less affected than you really are and create distance precisely when greater clarity would help.',
        signals: [
          'You may show care through practical follow-through.',
          'Clear boundaries can make closeness feel safer rather than colder.',
          'You may need respect and dependability before emotional intensity feels meaningful.',
          'Silence can protect dignity, but it may also leave the other person guessing.',
        ],
        guidance:
          'Say what support looks like instead of expecting it to be inferred.',
        basis: `Visible pillars ${pillars}; hour pillar ${missingHour ? 'omitted' : 'included'}.`,
        confidence: missingHour ? 'low' : 'medium',
      },
      timing: {
        headline: 'The phase you are moving through',
        narrative:
          'Timing is presented as periods of emphasis, not promised events. The strongest available signals are shown in the retrospective section so they can be checked first. Repeating periods often bring an unfinished theme back in a more visible form; clashing periods tend to ask for movement, renegotiation, or a decision that cannot be postponed forever. The useful value is preparation: recognising which kind of pressure is increasing and deciding where you still have agency.',
        signals: [
          'Periods of repetition may intensify an unfinished theme.',
          'Periods of clash may coincide with decisions, movement, or renegotiated boundaries.',
          'A quieter phase can be used to consolidate skills and relationships before expansion.',
          'When several signals overlap, reduce irreversible decisions made only to escape pressure.',
        ],
        guidance:
          'Use timing themes to prepare options, not to surrender agency.',
        basis: `${chart.timingSignals.length} supplied annual branch-relation signals.`,
        confidence: missingHour ? 'low' : 'medium',
      },
    },
    reflectionQuestions: [
      'Which parts of this description feel useful rather than merely familiar?',
      'What current decision would benefit from a slower, more structured reflection?',
    ],
    limitations: missingHour
      ? 'The hour pillar is omitted. Timing claims and hour-sensitive themes are not included.'
      : 'BaZi is a traditional interpretive practice and should not replace professional advice.',
  };
}

function normalizeInterpretation(
  value: unknown,
  fallback: ReturnType<typeof localInterpretation>,
) {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Record<string, unknown>;
  const textValue = (input: unknown, fallbackValue: string) =>
    typeof input === 'string' ? input : fallbackValue;
  const insights = Array.isArray(candidate.insights)
    ? candidate.insights
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const insight = item as Record<string, unknown>;
          return {
            title: textValue(insight.title, 'Chart pattern'),
            interpretation: textValue(insight.interpretation, ''),
            basis: textValue(insight.basis, 'Visible chart facts'),
            confidence: ['high', 'medium', 'low'].includes(
              String(insight.confidence).toLowerCase(),
            )
              ? String(insight.confidence).toLowerCase()
              : 'low',
          };
        })
        .filter((item) => item.interpretation)
    : fallback.insights;
  const rawPastOverview =
    candidate.pastOverview && typeof candidate.pastOverview === 'object'
      ? (candidate.pastOverview as Record<string, unknown>)
      : {};
  const pastOverview = {
    characterSentence: textValue(
      rawPastOverview.characterSentence,
      fallback.pastOverview.characterSentence,
    ),
    trajectorySentence: textValue(
      rawPastOverview.trajectorySentence,
      fallback.pastOverview.trajectorySentence,
    ),
  };
  const pastPatterns = Array.isArray(candidate.pastPatterns)
    ? candidate.pastPatterns
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const pattern = item as Record<string, unknown>;
          const fallbackPattern =
            fallback.pastPatterns[index] ?? fallback.pastPatterns[0];
          return {
            period: textValue(pattern.period, 'Earlier period'),
            headline: textValue(pattern.headline, 'A period worth checking'),
            narrative: textValue(
              pattern.narrative,
              fallbackPattern?.narrative ?? '',
            ),
            possibilities: Array.isArray(pattern.possibilities)
              ? pattern.possibilities
                  .filter((possibility) => typeof possibility === 'string')
                  .slice(0, 3)
              : [],
            principle: textValue(
              pattern.principle,
              fallbackPattern?.principle ?? '',
            ),
            basis: textValue(pattern.basis, 'Supplied annual timing signal'),
            confidence: ['high', 'medium', 'low'].includes(
              textValue(pattern.confidence, 'low').toLowerCase(),
            )
              ? textValue(pattern.confidence, 'low').toLowerCase()
              : 'low',
          };
        })
        .filter((pattern) => pattern.possibilities.length)
        .slice(0, 6)
    : fallback.pastPatterns;
  const limitations = Array.isArray(candidate.limitations)
    ? candidate.limitations.map(String).join(' ')
    : typeof candidate.limitations === 'string'
      ? candidate.limitations
      : fallback.limitations;
  const candidateAreas =
    candidate.lifeAreas && typeof candidate.lifeAreas === 'object'
      ? (candidate.lifeAreas as Record<string, unknown>)
      : {};
  const areaKeys = ['character', 'career', 'relationships', 'timing'] as const;
  const lifeAreas = Object.fromEntries(
    areaKeys.map((key) => {
      const fallbackArea = fallback.lifeAreas[key];
      const rawArea =
        candidateAreas[key] && typeof candidateAreas[key] === 'object'
          ? (candidateAreas[key] as Record<string, unknown>)
          : {};
      return [
        key,
        {
          headline: textValue(rawArea.headline, fallbackArea.headline),
          narrative: textValue(rawArea.narrative, fallbackArea.narrative),
          signals: Array.isArray(rawArea.signals)
            ? rawArea.signals
                .filter((signal) => typeof signal === 'string')
                .slice(0, 4)
            : fallbackArea.signals,
          guidance: textValue(rawArea.guidance, fallbackArea.guidance),
          basis: textValue(rawArea.basis, fallbackArea.basis),
          confidence: ['high', 'medium', 'low'].includes(
            textValue(
              rawArea.confidence,
              fallbackArea.confidence,
            ).toLowerCase(),
          )
            ? textValue(
                rawArea.confidence,
                fallbackArea.confidence,
              ).toLowerCase()
            : fallbackArea.confidence,
        },
      ];
    }),
  ) as typeof fallback.lifeAreas;

  return {
    summary:
      typeof candidate.summary === 'string'
        ? candidate.summary
        : fallback.summary,
    pastOverview,
    pastPatterns: pastPatterns.length ? pastPatterns : fallback.pastPatterns,
    insights: insights.length ? insights : fallback.insights,
    lifeAreas,
    reflectionQuestions: Array.isArray(candidate.reflectionQuestions)
      ? candidate.reflectionQuestions.map(String).slice(0, 5)
      : fallback.reflectionQuestions,
    limitations,
  };
}

export async function POST(request: Request) {
  const id = requestId();
  try {
    if (!withinRateLimit(request, 'interpret', 4, 10 * 60_000)) {
      return jsonWithRequestId(
        { error: 'Too many readings. Please wait a few minutes and try again.' },
        id,
        429,
        { 'Retry-After': '600' },
      );
    }

    const body = await readJsonBody<{
      birthDate?: string;
      birthTime?: string;
      birthTimeConfidence?: BirthTimeConfidence;
      birthPlace?: string;
      name?: string;
      gender?: 'male' | 'female' | 'undisclosed';
      topic?: 'overview' | 'career' | 'relationships' | 'year-ahead';
      tier?: 'free' | 'premium';
      turnstileToken?: string;
      shareForImprovement?: boolean;
    }>(request);

    const confidence = body.birthTimeConfidence;
    const topic = body.topic ?? 'overview';
    const parsedBirthDate = body.birthDate
      ? new Date(`${body.birthDate}T00:00:00Z`)
      : null;
    if (
      !body.birthDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate) ||
      !parsedBirthDate ||
      Number.isNaN(parsedBirthDate.getTime()) ||
      parsedBirthDate.getTime() > Date.now() ||
      !body.birthPlace?.trim() ||
      (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length > 80)) ||
      !['male', 'female', 'undisclosed'].includes(body.gender ?? 'undisclosed') ||
      !confidence ||
      !validConfidence.has(confidence) ||
      !validTopics.has(topic) ||
      (confidence !== 'unknown' && !/^\d{2}:\d{2}$/.test(body.birthTime ?? ''))
    ) {
      return jsonWithRequestId(
        { error: 'Please provide a valid date, place and birth-time choice.' },
        id,
        400,
      );
    }

    if (body.birthPlace.trim().length > 100) {
      return jsonWithRequestId(
        { error: 'Please keep the city name under 100 characters.' },
        id,
        400,
      );
    }

    const turnstile = await verifyTurnstile(body.turnstileToken, request);
    if (!turnstile.ok) {
      return jsonWithRequestId(
        { error: 'Please complete the bot-protection check and try again.' },
        id,
        403,
      );
    }

    const testReading = getTestReading(body.birthDate);
    if (testReading) {
      return jsonWithRequestId(testReading, id, 200, {
        'X-Ming-Test-Fixture': body.birthDate,
      });
    }

    const resolvedPlace = await resolveBirthPlace(body.birthPlace);
    const chart = calculateBaziChart({
      birthDate: body.birthDate,
      birthTime: confidence === 'unknown' ? undefined : body.birthTime,
      birthTimeConfidence: confidence,
      birthPlace: resolvedPlace,
    });

    const localReading = localInterpretation(chart, topic);
    let interpretation = localReading;
    let interpretationSource: 'deepseek' | 'local' = 'local';
    let modelNotice: string | undefined;

    try {
      interpretation = normalizeInterpretation(
        await generateInterpretation(
          {
            chart,
            topic,
            locale: 'en',
            birthContext: {
              birthDate: body.birthDate,
              readingDate: new Date().toISOString().slice(0, 10),
              resolvedPlace,
              name: body.name?.trim() || undefined,
              gender: body.gender ?? 'undisclosed',
            },
          },
          body.tier === 'premium' ? 'premium' : 'free',
        ),
        localReading,
      );
      interpretationSource = 'deepseek';
    } catch (error) {
      console.warn(
        '[interpretation-fallback]',
        error instanceof Error ? error.message : 'unknown model error',
      );
      modelNotice =
        error instanceof Error && error.message.includes('not configured')
          ? 'AI interpretation is not configured; showing the calculated local reading.'
          : 'The AI interpretation was unavailable; showing the calculated local reading.';
    }

    return jsonWithRequestId({
      resolvedPlace,
      chart,
      interpretation,
      interpretationSource,
      modelNotice,
    }, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'REQUEST_TOO_LARGE') {
      return jsonWithRequestId({ error: 'Request is too large.' }, id, 413);
    }
    if (message.includes('JSON')) {
      return jsonWithRequestId({ error: 'Invalid request body.' }, id, 400);
    }
    if (message === 'PLACE_NOT_FOUND') {
      return jsonWithRequestId(
        { error: 'We could not find that place. Try “City, State, Country”.' },
        id,
        422,
      );
    }
    if (message === 'PLACE_SERVICE_UNAVAILABLE') {
      return jsonWithRequestId(
        { error: 'Place lookup is temporarily unavailable. Please try again.' },
        id,
        503,
      );
    }
    return jsonWithRequestId(
      { error: 'We could not create this reading. Please check the details.' },
      id,
      500,
    );
  }
}
