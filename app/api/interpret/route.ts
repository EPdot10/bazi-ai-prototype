import { calculateBaziChart } from '@/lib/bazi/calculate';
import type { BirthTimeConfidence } from '@/lib/bazi/types';
import { generateInterpretation } from '@/lib/deepseek';
import { resolveBirthPlace } from '@/lib/geocode';

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
    pastPatterns: selectedSignals.map((signal) => {
      const hasClash = signal.relations.some((relation) =>
        relation.includes('clashes'),
      );
      const hasRepeat = signal.relations.some((relation) =>
        relation.includes('repeats'),
      );
      const possibilities = hasClash
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
        possibilities,
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
  const pastPatterns = Array.isArray(candidate.pastPatterns)
    ? candidate.pastPatterns
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const pattern = item as Record<string, unknown>;
          return {
            period: textValue(pattern.period, 'Earlier period'),
            headline: textValue(pattern.headline, 'A period worth checking'),
            possibilities: Array.isArray(pattern.possibilities)
              ? pattern.possibilities
                  .filter((possibility) => typeof possibility === 'string')
                  .slice(0, 3)
              : [],
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

  return {
    summary:
      typeof candidate.summary === 'string'
        ? candidate.summary
        : fallback.summary,
    pastPatterns: pastPatterns.length ? pastPatterns : fallback.pastPatterns,
    insights: insights.length ? insights : fallback.insights,
    reflectionQuestions: Array.isArray(candidate.reflectionQuestions)
      ? candidate.reflectionQuestions.map(String).slice(0, 5)
      : fallback.reflectionQuestions,
    limitations,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      birthDate?: string;
      birthTime?: string;
      birthTimeConfidence?: BirthTimeConfidence;
      birthPlace?: string;
      topic?: 'overview' | 'career' | 'relationships' | 'year-ahead';
      tier?: 'free' | 'premium';
    };

    const confidence = body.birthTimeConfidence;
    const topic = body.topic ?? 'overview';
    if (
      !body.birthDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate) ||
      !body.birthPlace?.trim() ||
      !confidence ||
      !validConfidence.has(confidence) ||
      !validTopics.has(topic) ||
      (confidence !== 'unknown' && !/^\d{2}:\d{2}$/.test(body.birthTime ?? ''))
    ) {
      return Response.json(
        { error: 'Please provide a valid date, place and birth-time choice.' },
        { status: 400 },
      );
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
            },
          },
          body.tier === 'premium' ? 'premium' : 'free',
        ),
        localReading,
      );
      interpretationSource = 'deepseek';
    } catch (error) {
      modelNotice =
        error instanceof Error && error.message.includes('not configured')
          ? 'AI interpretation is not configured; showing the calculated local reading.'
          : 'The AI interpretation was unavailable; showing the calculated local reading.';
    }

    return Response.json({
      resolvedPlace,
      chart,
      interpretation,
      interpretationSource,
      modelNotice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PLACE_NOT_FOUND') {
      return Response.json(
        { error: 'We could not find that place. Try “City, State, Country”.' },
        { status: 422 },
      );
    }
    if (message === 'PLACE_SERVICE_UNAVAILABLE') {
      return Response.json(
        { error: 'Place lookup is temporarily unavailable. Please try again.' },
        { status: 503 },
      );
    }
    return Response.json(
      { error: 'We could not create this reading. Please check the details.' },
      { status: 500 },
    );
  }
}
