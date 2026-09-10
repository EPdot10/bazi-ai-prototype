import { calculateBaziChart } from '@/lib/bazi/calculate';
import type { BirthTimeConfidence } from '@/lib/bazi/types';
import { generateInterpretation } from '@/lib/deepseek';
import { getTestReading } from '@/lib/fixtures/test-readings';
import { resolveBirthPlace } from '@/lib/geocode';
import {
  jsonWithRequestId,
  readJsonBody,
  requestId,
  rateLimitsEnabled,
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
// Keep the old fixtures in the repository for future QA, but do not serve them
// during the current model evaluation pass.
const ENABLE_TEST_FIXTURES = false;

function localInterpretation(
  chart: ReturnType<typeof calculateBaziChart>,
  topic: string,
  locale: 'en' | 'zh' = 'en',
) {
  const pillars = Object.values(chart.pillars).join(' · ');
  const missingHour = chart.birthTimeConfidence === 'unknown';
  const selectedSignals = chart.eventCandidates.reduce(
    (selected, signal) => {
      if (
        selected.length < 5 &&
        selected.every((item) => Math.abs(item.year - signal.year) >= 3)
      ) {
        selected.push(signal);
      }
      return selected;
    },
    [] as typeof chart.eventCandidates,
  );
  const result = {
    summary: `Your ${missingHour ? 'three visible pillars' : 'four pillars'} are ${pillars}. ${chart.dayMaster} is your Day Master, read here as ${chart.seasonalStrength} in its seasonal context. This is a reflective reading of traditional BaZi patterns, not a factual or scientific prediction.`,
    pastOverview: {
      characterSentence: `You may present as measured and self-controlled, while privately testing every rule against your own experience before you trust it; the chart's ${chart.dayMasterElement} Day Master makes clarity and inner standards especially important themes.`,
      trajectorySentence: `Your path so far may have moved through alternating periods of consolidation and redirection, with the strongest candidate windows pointing to moments when an old pattern had to be renegotiated.`,
    },
    pastPatterns: selectedSignals.map((candidate) => {
      const signal = chart.timingSignals.find(
        (item) => item.year === candidate.year,
      );
      const relations = signal?.relations ?? candidate.evidence;
      const hasClash = signal?.relationTypes.includes('clash') ?? false;
      const hasRepeat = signal?.relationTypes.includes('repeat') ?? false;
      const lifeStage =
        candidate.age < 13
          ? 'childhood'
          : candidate.age < 19
            ? 'adolescence'
            : 'adult';
      const themeHint = candidate.themes[0] ?? 'a change in priorities';
      const possibilities =
        lifeStage === 'childhood'
          ? hasClash
            ? [
                `A change involving school, home, caregivers, or close friends may have unsettled your usual routine, especially around ${themeHint}.`,
                'You may have had to become more adaptable or self-reliant than before.',
              ]
            : [
                'A teacher, friendship, family expectation, or new activity may have become especially important.',
                'You may have received more attention or responsibility within your everyday world.',
              ]
          : lifeStage === 'adolescence'
            ? hasClash
              ? [
                  `A shift in studies, friendships, family expectations, or identity may have broken an established rhythm, with ${themeHint} becoming harder to ignore.`,
                  'A disagreement or separation may have pushed you toward a more independent choice.',
                ]
              : [
                  'A new friendship, mentor, study direction, or personal goal may have changed your priorities.',
                  'You may have taken on a stronger identity or responsibility among peers or family.',
                ]
            : hasClash
              ? [
                  `A change in school, work, home, or your usual social circle may have disrupted an established routine, particularly around ${themeHint}.`,
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
        period: candidate.window,
        headline: hasClash
          ? 'A break from the previous rhythm'
          : hasRepeat
            ? 'An existing theme became harder to ignore'
            : 'A new connection or direction',
        narrative: `${possibilities.join(' ')} The lasting effect may have been less about the event itself and more about how you learned to respond: by clarifying priorities, relying on your own judgement, or changing the boundaries around a relationship or responsibility. Treat this as a period to check rather than a fixed claim; the useful question is whether the rhythm of change feels recognisable.`,
        possibilities,
        principle: `${candidate.evidence[0]} activated the chart through ${relations.join(' and ')}, traditionally read as a period when ${themeHint} becomes harder to ignore.`,
        basis: `${candidate.evidence.join('; ')}${candidate.themes.length ? ` · themes: ${candidate.themes.join(', ')}` : ''}`,
        confidence: candidate.confidence === 'high' ? 'medium' : 'low',
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

  if (locale === 'zh') {
    return {
      ...result,
      summary: `你的${missingHour ? '三柱' : '四柱'}为 ${pillars}。日主为${chart.dayMaster}，在当前季节格局中属于${chart.seasonalStrength === 'supported' ? '得势' : chart.seasonalStrength === 'balanced' ? '中和' : '受制'}。以下内容是传统八字的反思性解读，不是事实或科学预测。`,
      pastOverview: {
        characterSentence: `你可能外表克制、做事讲原则，但会在真正信任一套规则之前反复用自己的经历验证它；${chart.dayMasterElement}日主让“看清结构、守住内在标准”成为重要主题。`,
        trajectorySentence:
          '你过去的轨迹可能不是单纯一路上升，而是在几次环境、关系或责任重新排列之后，逐渐把主动权收回到自己手里。',
      },
      pastPatterns: (() => {
        const usedDomainLabels = new Set<string>();
        const domainAlternatives = [
          '家庭与归属',
          '学习与规则',
          '亲密关系与边界',
          '事业与资源',
          '个人目标与表达',
        ];
        return result.pastPatterns.map((pattern, index) => {
          const candidate = selectedSignals[index];
          const signal = chart.timingSignals.find(
            (item) => item.year === candidate?.year,
          );
          const domain = candidate?.domains?.[0] ?? '生活中的一个重要领域';
          const detectedDomainLabel = domain.includes('family')
            ? '家庭与归属'
            : domain.includes('school') || domain.includes('authority')
              ? '学习与规则'
              : domain.includes('relationship') || domain.includes('close')
                ? '亲密关系与边界'
                : domain.includes('career') || domain.includes('resource')
                  ? '事业与资源'
                  : '个人目标与表达';
          const domainLabel = usedDomainLabels.has(detectedDomainLabel)
            ? (domainAlternatives.find((item) => !usedDomainLabels.has(item)) ??
              detectedDomainLabel)
            : detectedDomainLabel;
          usedDomainLabels.add(domainLabel);
          const relation = signal?.relationTypes[0];
          const headline =
            relation === 'clash'
              ? `${domainLabel}：旧秩序被打破`
              : relation === 'repeat'
                ? `${domainLabel}：旧主题再次浮现`
                : relation === 'combination'
                  ? `${domainLabel}：新的连接形成`
                  : `${domainLabel}：责任与表达变得清晰`;
          const relationReading =
            relation === 'clash'
              ? '冲突信号把原本默认的安排推到台前，要求你重新谈判边界或做出取舍。'
              : relation === 'repeat'
                ? '重复信号让一个旧主题再次变得具体，像是同一道题换了场景重新出现。'
                : relation === 'combination'
                  ? '连接信号带来新的协作、支持或入口，但也要求你适应别人的节奏。'
                  : '这一窗口更像把一个原本隐约的责任或愿望照亮，让你开始认真命名它。';
          const sceneDetail =
            domainLabel === '家庭与归属'
              ? '家中的规则、照顾方式，或你对“我属于哪里”的感受'
              : domainLabel === '学习与规则'
                ? '学校、考试、导师或家人对你能力的具体要求'
                : domainLabel === '亲密关系与边界'
                  ? '一段重要关系里的距离、信任与表达方式'
                  : domainLabel === '事业与资源'
                    ? '工作分工、金钱安排，或别人如何评价你的可靠性'
                    : '一个你想独立完成的目标，以及你愿意为它承担的代价';
          return {
            ...pattern,
            headline,
            narrative: `在${pattern.period}前后，最值得核对的不是泛泛的“发生变化”，而是${sceneDetail}是否突然需要你亲自处理。${relationReading}这可能表现为一次具体的选择、一次谈话、一个新的责任，或你对某件事的态度从配合变成有条件地答应。事情过去之后，留下来的往往不是表面结果，而是你开始用不同的标准判断谁值得信任、什么值得投入，以及哪些安排不能再由别人替你决定。`,
            possibilities: [
              `${domainLabel}方面可能出现一个必须由你回应的具体节点，而不是继续顺其自然。`,
              `${sceneDetail}可能从“默认如此”变成需要说清楚、重新安排或设定边界。`,
              '回头看，这段经历可能改变了你之后做决定时最看重的标准。',
            ],
            principle: `依据${candidate?.signature ?? '流年与命盘关系'}，传统上更像“${candidate?.themes?.join('、') ?? '主题被激活'}”的窗口，而不是一个保证发生的事件。`,
            basis: candidate?.evidence?.join('；') ?? pattern.basis,
          };
        });
      })(),
      insights: [
        {
          title: '日主与季节的张力',
          interpretation: `八字以${chart.dayMaster}日主作为观察中心。当前结构显示它与出生月份的力量并非简单强弱标签，而是会让你在压力、资源与自主之间不断寻找可持续的平衡。`,
          basis: chart.strengthNotes?.join('；') ?? `日柱 ${chart.pillars.day}`,
          confidence: 'high',
        },
        {
          title: '重复结构带来的“回声”',
          interpretation: chart.structuralRelations?.length
            ? `命盘中出现${chart.structuralRelations.join('、')}。这类结构常让某些主题在不同年龄阶段以不同形式回来，值得用真实经历逐段核对。`
            : '当前命盘没有被计算出的重复或冲合结构，因此历史窗口应以较低确定性阅读。',
          basis: chart.structuralRelations?.join('；') ?? '结构关系为空',
          confidence: chart.structuralRelations?.length ? 'medium' : 'low',
        },
      ],
      lifeAreas: {
        character: {
          headline: '你如何面对世界',
          narrative: `你可能习惯先观察规则是否可靠，再决定投入多少自己。${chart.dayMaster}日主并不等于固定性格，但结合季节强弱与藏干后，可以看到你更在意判断是否站得住，而不是马上得到别人的认可。`,
          signals: [
            '你可能在标准明确时发挥更稳定。',
            '压力会逼出判断力，但过度控制会让你疲惫。',
            '你倾向用持续行动而不是即时表达证明在乎。',
            '一旦内在判断完成，你通常不容易被轻易改变。',
          ],
          guidance: '区分真正的原则与暂时的防御。为自己留下试错和调整的空间。',
          basis: `日柱 ${chart.pillars.day}；季节强弱 ${chart.seasonalStrength ?? '未提供'}`,
          confidence: missingHour ? '中' : '高',
        },
        career: {
          headline: '工作、贡献与资源',
          narrative:
            '你可能更适合把模糊问题变成可执行结构的环境。真正的优势不一定是抢先表现，而是持续把复杂事情理顺。需要留意的是，不要因为别人信任你处理难题，就长期承担没有回报的责任。',
          signals: [
            '适合有标准又允许改善流程的环境。',
            '你可能更重视可验证的进展，而不是抽象头衔。',
            '责任常常先于正式回报到来。',
            '资源和边界需要被明确写出来。',
          ],
          guidance:
            '选择同时奖励判断力与持续性的环境。把责任、时间和回报提前说清楚。',
          basis: `可见五行分布：${JSON.stringify(chart.elementBalance)}`,
          confidence: '中',
        },
        relationships: {
          headline: '亲密与独立如何共存',
          narrative:
            '你可能需要可靠、清晰和可持续的相处方式，才会真正放下防备。失望时，你的第一反应可能是变得更自立，而不是直接提出需要，这会让别人误以为你并不在意。',
          signals: [
            '你常用实际行动表达关心。',
            '清楚的边界反而会让亲密更安全。',
            '尊重和稳定可能比强烈情绪更重要。',
            '沉默能保护体面，也可能制造误解。',
          ],
          guidance: '把“我需要什么支持”说出来，不要要求对方猜。',
          basis: `可见柱：${pillars}；时柱${missingHour ? '未提供' : '已纳入'}`,
          confidence: missingHour ? '低' : '中',
        },
        timing: {
          headline: '你正在经历的阶段',
          narrative:
            '时机只表示某类主题更容易被看见，不代表事件必然发生。重复通常放大旧问题，冲突通常迫使你移动、谈判或重新划边界。真正有用的是提前准备选择，而不是把决定权交给年份。',
          signals: [
            '重复年份可能让未完成的主题重新出现。',
            '冲合年份可能对应移动、协商或关系重组。',
            '安静阶段适合积累能力和资源。',
            '当多个信号叠加时，避免只为逃离压力而做不可逆决定。',
          ],
          guidance: '把年份当作检查清单，不要当作命令。',
          basis: `${chart.timingSignals.length} 个流年结构信号；${chart.eventCandidates.length} 个候选窗口`,
          confidence: missingHour ? '低' : '中',
        },
      },
      reflectionQuestions: [
        '哪些年份的主题最接近你的真实经历？',
        '哪一个结构关系值得你提供更多背景来继续核对？',
      ],
      limitations: missingHour
        ? '出生时辰未知，时柱相关判断不纳入。八字属于传统解释体系，不替代专业建议。'
        : '八字属于传统解释体系，不替代专业建议。',
    };
  }

  return result;
}

function requireInterpretation(
  value: unknown,
  chart: ReturnType<typeof calculateBaziChart>,
) {
  if (!value || typeof value !== 'object') {
    throw new Error('DeepSeek returned a non-object interpretation');
  }
  const candidate = value as Record<string, unknown>;
  const requiredKeys = [
    'summary',
    'pastOverview',
    'pastPatterns',
    'insights',
    'lifeAreas',
    'futureOverview',
    'futureForecasts',
    'reflectionQuestions',
    'limitations',
  ];
  if (requiredKeys.some((key) => !(key in candidate))) {
    throw new Error('DeepSeek returned incomplete interpretation JSON');
  }
  if (
    typeof candidate.summary !== 'string' ||
    !candidate.pastOverview ||
    !Array.isArray(candidate.pastPatterns) ||
    !Array.isArray(candidate.insights) ||
    !candidate.lifeAreas ||
    typeof candidate.futureOverview !== 'string' ||
    !Array.isArray(candidate.futureForecasts) ||
    !Array.isArray(candidate.reflectionQuestions) ||
    typeof candidate.limitations !== 'string'
  ) {
    throw new Error('DeepSeek returned an invalid interpretation shape');
  }

  const lifeAreas = candidate.lifeAreas as Record<string, unknown>;
  const stringArray = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  const validArea = (area: unknown) => {
    if (!area || typeof area !== 'object') return false;
    const item = area as Record<string, unknown>;
    return (
      typeof item.headline === 'string' &&
      typeof item.narrative === 'string' &&
      typeof item.basis === 'string' &&
      typeof item.confidence === 'string'
    );
  };
  const areaKeys = ['character', 'career', 'relationships', 'timing'] as const;
  const invalidAreaKeys = areaKeys.filter((key) => !validArea(lifeAreas[key]));
  if (invalidAreaKeys.length) {
    throw new Error(
      `DeepSeek returned incomplete life-area analysis (${invalidAreaKeys.join(', ')})`,
    );
  }
  // Keep the model response as the source of truth, but accept the older
  // signals/guidance shape and optional omissions so one missing enrichment
  // field cannot block the entire reading. The UI already handles these
  // normalized arrays without inventing a chart interpretation.
  candidate.lifeAreas = Object.fromEntries(
    areaKeys.map((key) => {
      const item = lifeAreas[key] as Record<string, unknown>;
      const signals = stringArray(item.signals);
      const strengths = stringArray(item.strengths);
      const frictions = stringArray(item.frictions);
      const actions = stringArray(item.actions);
      return [
        key,
        {
          ...item,
          strengths: strengths.length ? strengths : signals.slice(0, 2),
          frictions: frictions.length ? frictions : signals.slice(2),
          actions:
            actions.length || typeof item.guidance !== 'string'
              ? actions
              : [item.guidance],
          stressPattern:
            typeof item.stressPattern === 'string' ? item.stressPattern : '',
          possibleCost:
            typeof item.possibleCost === 'string' ? item.possibleCost : '',
        },
      ];
    }),
  );

  const validForecast = candidate.futureForecasts.every((forecast) => {
    if (!forecast || typeof forecast !== 'object') return false;
    const item = forecast as Record<string, unknown>;
    return (
      typeof item.year === 'number' &&
      typeof item.theme === 'string' &&
      typeof item.opportunity === 'string' &&
      typeof item.pressure === 'string' &&
      typeof item.riskScenario === 'string' &&
      Array.isArray(item.triggerConditions) &&
      Array.isArray(item.earlySignals) &&
      Array.isArray(item.actions) &&
      Array.isArray(item.avoid) &&
      typeof item.basis === 'string' &&
      typeof item.confidence === 'string'
    );
  });
  if (!validForecast) {
    throw new Error('DeepSeek returned invalid future forecasts');
  }

  const expectedFutureYears = chart.futureSignals.map((signal) => signal.year);
  const returnedFutureYears = candidate.futureForecasts.map(
    (forecast) => (forecast as Record<string, unknown>).year,
  );
  if (
    expectedFutureYears.length !== returnedFutureYears.length ||
    expectedFutureYears.some((year) => !returnedFutureYears.includes(year))
  ) {
    throw new Error('DeepSeek returned unsupported or missing future years');
  }

  return value;
}

// Retained only as a migration reference for the old fixture implementation;
// the request path above never calls this fallback normalizer anymore.
// eslint-disable-next-line no-unused-vars
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
    if (
      rateLimitsEnabled() &&
      !withinRateLimit(request, 'interpret', 4, 10 * 60_000)
    ) {
      return jsonWithRequestId(
        {
          error: 'Too many readings. Please wait a few minutes and try again.',
        },
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
      locale?: 'en' | 'zh';
      topic?: 'overview' | 'career' | 'relationships' | 'year-ahead';
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
      (body.name !== undefined &&
        (typeof body.name !== 'string' || body.name.trim().length > 80)) ||
      !['male', 'female', 'undisclosed'].includes(
        body.gender ?? 'undisclosed',
      ) ||
      !['en', 'zh'].includes(body.locale ?? 'en') ||
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

    if (ENABLE_TEST_FIXTURES) {
      const testReading = getTestReading(body.birthDate);
      if (testReading) {
        return jsonWithRequestId(testReading, id, 200, {
          'X-Ming-Test-Fixture': body.birthDate,
        });
      }
    }

    const resolvedPlace = await resolveBirthPlace(body.birthPlace);
    const chart = calculateBaziChart({
      birthDate: body.birthDate,
      birthTime: confidence === 'unknown' ? undefined : body.birthTime,
      birthTimeConfidence: confidence,
      birthPlace: resolvedPlace,
    });

    try {
      const interpretationRequest = {
        chart,
        topic,
        locale: body.locale ?? 'en',
        birthContext: {
          birthDate: body.birthDate,
          readingDate: new Date().toISOString().slice(0, 10),
          resolvedPlace,
          name: body.name?.trim() || undefined,
          gender: body.gender ?? 'undisclosed',
        },
      } as const;
      let rawInterpretation = await generateInterpretation(
        interpretationRequest,
      );
      let interpretation;
      try {
        interpretation = requireInterpretation(rawInterpretation, chart);
      } catch (firstError) {
        const schemaFailure =
          firstError instanceof Error &&
          firstError.message.startsWith('DeepSeek returned');
        if (!schemaFailure) throw firstError;
        rawInterpretation = await generateInterpretation(
          interpretationRequest,
          { repairSchema: true },
        );
        interpretation = requireInterpretation(rawInterpretation, chart);
      }
      return jsonWithRequestId(
        {
          resolvedPlace,
          chart,
          interpretation,
          interpretationSource: 'deepseek',
        },
        id,
      );
    } catch (error) {
      console.warn(
        '[interpretation-error]',
        error instanceof Error ? error.message : 'unknown model error',
      );
      const detail =
        error instanceof Error ? error.message : 'unknown model error';
      return jsonWithRequestId(
        { error: `AI interpretation failed: ${detail}` },
        id,
        502,
      );
    }
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
