import { Solar } from 'lunar-javascript';

import type {
  BaziChartFacts,
  BirthProfile,
  BirthTimeConfidence,
} from '@/lib/bazi/types';

const elementByCharacter: Record<
  string,
  keyof BaziChartFacts['elementBalance']
> = {
  甲: 'wood',
  乙: 'wood',
  寅: 'wood',
  卯: 'wood',
  丙: 'fire',
  丁: 'fire',
  巳: 'fire',
  午: 'fire',
  戊: 'earth',
  己: 'earth',
  辰: 'earth',
  戌: 'earth',
  丑: 'earth',
  未: 'earth',
  庚: 'metal',
  辛: 'metal',
  申: 'metal',
  酉: 'metal',
  壬: 'water',
  癸: 'water',
  亥: 'water',
  子: 'water',
};

const branchClashes: Record<string, string> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
};

const branchCombinations: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
};

const stemElements: Record<string, keyof BaziChartFacts['elementBalance']> = {
  甲: 'wood',
  乙: 'wood',
  丙: 'fire',
  丁: 'fire',
  戊: 'earth',
  己: 'earth',
  庚: 'metal',
  辛: 'metal',
  壬: 'water',
  癸: 'water',
};

const stemPolarity: Record<string, 'yang' | 'yin'> = {
  甲: 'yang',
  乙: 'yin',
  丙: 'yang',
  丁: 'yin',
  戊: 'yang',
  己: 'yin',
  庚: 'yang',
  辛: 'yin',
  壬: 'yang',
  癸: 'yin',
};

const hiddenStemsByBranch: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

const relationNames = {
  same: '比肩',
  peer: '劫财',
  output: '食神',
  challenge: '伤官',
  wealth: '偏财',
  directWealth: '正财',
  pressure: '七杀',
  authority: '正官',
  resource: '偏印',
  directResource: '正印',
};

function tenGod(dayMaster: string, stem: string) {
  const dayElement = stemElements[dayMaster];
  const element = stemElements[stem];
  const samePolarity = stemPolarity[dayMaster] === stemPolarity[stem];
  if (dayElement === element)
    return samePolarity ? relationNames.same : relationNames.peer;
  const generates: Record<string, string> = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood',
  };
  const controls: Record<string, string> = {
    wood: 'earth',
    fire: 'metal',
    earth: 'water',
    metal: 'wood',
    water: 'fire',
  };
  const controlledBy: Record<string, string> = {
    wood: 'metal',
    fire: 'water',
    earth: 'wood',
    metal: 'fire',
    water: 'earth',
  };
  if (generates[dayElement] === element)
    return samePolarity ? relationNames.output : relationNames.challenge;
  if (controls[dayElement] === element)
    return samePolarity ? relationNames.wealth : relationNames.directWealth;
  if (controlledBy[dayElement] === element)
    return samePolarity ? relationNames.pressure : relationNames.authority;
  return samePolarity ? relationNames.resource : relationNames.directResource;
}

function tenGodTheme(god: string) {
  switch (god) {
    case relationNames.same:
    case relationNames.peer:
      return 'autonomy, peers, and how resources are shared';
    case relationNames.output:
    case relationNames.challenge:
      return 'learning, expression, and making something visible';
    case relationNames.wealth:
    case relationNames.directWealth:
      return 'resources, opportunity, and practical commitments';
    case relationNames.pressure:
    case relationNames.authority:
      return 'standards, responsibility, and pressure to choose';
    default:
      return 'support, study, and the people or systems that sustain you';
  }
}

function annualOpportunity(god: string) {
  switch (god) {
    case relationNames.same:
    case relationNames.peer:
      return 'Build alliances without giving away ownership of your priorities.';
    case relationNames.output:
    case relationNames.challenge:
      return 'Make work, ideas, or a point of view more visible.';
    case relationNames.wealth:
    case relationNames.directWealth:
      return 'Turn a practical opening into a durable resource or commitment.';
    case relationNames.pressure:
    case relationNames.authority:
      return 'Earn trust by handling a demanding standard or responsibility well.';
    default:
      return 'Use study, support, or preparation to strengthen the next decision.';
  }
}

function annualRisk(god: string) {
  switch (god) {
    case relationNames.same:
    case relationNames.peer:
      return 'Competition or blurred ownership can strain money, credit, or trust.';
    case relationNames.output:
    case relationNames.challenge:
      return 'Speaking or acting too quickly can turn a useful challenge into conflict.';
    case relationNames.wealth:
    case relationNames.directWealth:
      return 'An attractive opportunity can create more cost or obligation than expected.';
    case relationNames.pressure:
    case relationNames.authority:
      return 'Prolonged pressure can lead to rigid choices, overwork, or a late abrupt exit.';
    default:
      return 'Preparation can become avoidance if support is used to postpone a decision.';
  }
}

const pillarDomains: Record<string, string> = {
  year: 'family, origin, and belonging',
  month: 'responsibilities, institutions, and work settings',
  day: 'close relationships and self-regulation',
  hour: 'private ambition, future plans, and personal projects',
};

function structuralRelations(pillars: BaziChartFacts['pillars']) {
  const branches = Object.values(pillars).map((pillar) => pillar.slice(1));
  const relations: string[] = [];
  branches.forEach((branch, index) => {
    branches.slice(index + 1).forEach((other) => {
      if (branchClashes[branch] === other)
        relations.push(`${branch}${other} clash`);
      if (branchCombinations[branch] === other)
        relations.push(`${branch}${other} combination`);
    });
    if (branches.filter((item) => item === branch).length > 1) {
      relations.push(`${branch} repeats in the natal branches`);
    }
  });
  return [...new Set(relations)];
}

function calculateTimingSignals(
  birthYear: number,
  pillars: BaziChartFacts['pillars'],
  dayMaster: string,
) {
  const pillarEntries = Object.entries(pillars) as Array<
    [keyof BaziChartFacts['pillars'], string]
  >;
  const currentYear = new Date().getUTCFullYear();
  const signals: BaziChartFacts['timingSignals'] = [];

  const firstAnalysedYear = Math.min(birthYear + 6, currentYear);
  for (let year = firstAnalysedYear; year <= currentYear + 5; year += 1) {
    const annualPillar = Solar.fromYmdHms(year, 7, 1, 12, 0, 0)
      .getLunar()
      .getEightChar()
      .getYear();
    const annualBranch = annualPillar.slice(1);
    const annualStem = annualPillar.slice(0, 1);
    const annualTenGod = tenGod(dayMaster, annualStem);
    const relations: string[] = [];
    const relationTypes: string[] = [];
    const themes: string[] = [];
    const domains: string[] = [];
    const activatedPillars: string[] = [];
    let score = 0;
    let opportunityScore = 0;
    let pressureScore = 0;

    // The annual stem gives a second, independent clue about the kind of
    // pressure or opportunity present in a year. It is only surfaced when
    // the branch also creates a timing signal, so the output stays selective.

    pillarEntries.forEach(([pillarName, pillar]) => {
      const natalBranch = pillar.slice(1);
      if (annualBranch === natalBranch) {
        relations.push(
          `${annualBranch} repeats the ${pillarName} branch ${natalBranch}`,
        );
        relationTypes.push('repeat');
        themes.push('an existing theme becomes more visible');
        domains.push(pillarDomains[pillarName]);
        activatedPillars.push(pillarName);
        score += 3;
        pressureScore += 2;
        opportunityScore += 1;
      } else if (branchClashes[annualBranch] === natalBranch) {
        relations.push(
          `${annualBranch} clashes with the ${pillarName} branch ${natalBranch}`,
        );
        relationTypes.push('clash');
        themes.push('movement, renegotiation, or a break from routine');
        domains.push(pillarDomains[pillarName]);
        activatedPillars.push(pillarName);
        score += 3;
        pressureScore += 3;
      } else if (branchCombinations[annualBranch] === natalBranch) {
        relations.push(
          `${annualBranch} combines with the ${pillarName} branch ${natalBranch}`,
        );
        relationTypes.push('combination');
        themes.push('connection, agreement, or cooperation');
        domains.push(pillarDomains[pillarName]);
        activatedPillars.push(pillarName);
        score += 2;
        opportunityScore += 2;
      }
    });

    if (score >= 2) {
      relationTypes.push('annual-stem');
      themes.push(tenGodTheme(annualTenGod));
      relations.push(
        `${annualStem} is read as ${annualTenGod} in relation to the Day Master`,
      );
      const uniqueDomains = [...new Set(domains)];
      const uniqueRelationTypes = [...new Set(relationTypes)];
      const uniqueActivatedPillars = [...new Set(activatedPillars)];
      const opportunities = [annualOpportunity(annualTenGod)];
      const risks = [annualRisk(annualTenGod)];
      if (uniqueRelationTypes.includes('combination')) {
        opportunities.push(
          'Cooperation is easier to begin, provided expectations are made explicit.',
        );
      }
      if (uniqueRelationTypes.includes('clash')) {
        risks.push(
          'An unresolved issue is more likely to demand movement, renegotiation, or a clean boundary.',
        );
      }
      if (uniqueRelationTypes.includes('repeat')) {
        risks.push(
          'A familiar pattern can intensify; repeating the old response may repeat its cost.',
        );
      }
      signals.push({
        year,
        age: year - birthYear,
        annualPillar,
        relations,
        relationTypes: uniqueRelationTypes,
        themes: [...new Set(themes)],
        domains: uniqueDomains,
        signature: `${annualPillar} activates ${uniqueDomains.join(' and ') || 'a visible chart theme'} through ${uniqueRelationTypes.join(', ')}.`,
        strength: score >= 5 ? 'strong' : 'moderate',
        score,
        opportunityScore,
        pressureScore,
        opportunities,
        risks,
        activatedPillars: uniqueActivatedPillars,
        hourSensitive: uniqueActivatedPillars.includes('hour'),
      });
    }
  }

  return signals.sort((left, right) => {
    const strengthDifference =
      Number(right.strength === 'strong') - Number(left.strength === 'strong');
    return strengthDifference || left.year - right.year;
  });
}

function deriveEventCandidates(signals: BaziChartFacts['timingSignals']) {
  const currentYear = new Date().getUTCFullYear();
  // 2020–21 changes were widespread enough that a "hit" can be explained by
  // the era rather than this individual's chart. Keep those years in the raw
  // timing signals, but do not score them as distinctive retrospective clues.
  const past = signals.filter(
    (signal) =>
      signal.year < currentYear && signal.year !== 2020 && signal.year !== 2021,
  );
  const selected: typeof past = [];
  const ageBands = [
    { min: 60, max: Infinity, limit: 1 },
    { min: 45, max: 59, limit: 1 },
    { min: 30, max: 44, limit: 1 },
    { min: 18, max: 29, limit: 1 },
    { min: 0, max: 17, limit: 1 },
  ];
  const ranked = [...past].sort(
    (left, right) => right.score - left.score || right.year - left.year,
  );
  const canSelect = (signal: (typeof past)[number]) => {
    const repeatedPrimaryDomain =
      selected.filter((item) => item.domains[0] === signal.domains[0]).length >=
      2;
    const tooClose = selected.some(
      (item) => Math.abs(item.year - signal.year) < 3,
    );
    const sameSignature = selected.some(
      (item) =>
        [...item.relationTypes].sort().join('|') ===
          [...signal.relationTypes].sort().join('|') &&
        [...item.domains].sort().join('|') ===
          [...signal.domains].sort().join('|'),
    );
    return !repeatedPrimaryDomain && !tooClose && !sameSignature;
  };

  // Offer a useful range of testable hypotheses while keeping the timeline
  // diverse. One candidate per age band gives adults and later-life users
  // something more relevant than a timeline made only of school/work milestones.
  for (const band of ageBands) {
    if (selected.length === 5) break;
    const candidate = ranked.find(
      (signal) =>
        signal.age >= band.min && signal.age <= band.max && canSelect(signal),
    );
    if (candidate) selected.push(candidate);
  }

  if (selected.length < 5) {
    for (const signal of ranked) {
      if (!selected.includes(signal) && canSelect(signal)) {
        selected.push(signal);
      }
      if (selected.length === 5) break;
    }
  }

  return selected
    .sort((a, b) => a.year - b.year)
    .map((signal) => ({
      year: signal.year,
      age: signal.age,
      window: `${signal.year} · around age ${signal.age}`,
      themes: signal.themes,
      domains: signal.domains,
      signature: signal.signature,
      evidence: [signal.annualPillar, ...signal.relations],
      confidence:
        signal.strength === 'strong' ? ('high' as const) : ('medium' as const),
    }));
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) throw new Error('INVALID_BIRTH_DATE');
  return { year, month, day };
}

function parseTime(value: string | undefined, confidence: BirthTimeConfidence) {
  if (confidence === 'unknown') return { hour: 12, minute: 0 };
  const [hour, minute] = (value ?? '').split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('BIRTH_TIME_REQUIRED');
  }
  return { hour, minute };
}

function offsetAt(timeZone: string, instant: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return Math.round((representedAsUtc - instant.getTime()) / 60_000);
}

function calculateApparentSolarAdjustment(
  year: number,
  month: number,
  day: number,
  longitude: number,
  timeZone: string,
) {
  const januaryOffset = offsetAt(
    timeZone,
    new Date(Date.UTC(year, 0, 15, 12, 0, 0)),
  );
  const julyOffset = offsetAt(
    timeZone,
    new Date(Date.UTC(year, 6, 15, 12, 0, 0)),
  );
  const standardOffsetMinutes = Math.min(januaryOffset, julyOffset);
  const standardMeridian = (standardOffsetMinutes / 60) * 15;
  const startOfYear = Date.UTC(year, 0, 1);
  const currentDay = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.floor((currentDay - startOfYear) / 86_400_000) + 1;
  const angle = ((2 * Math.PI) / 365) * (dayOfYear - 81);
  const equationOfTime =
    9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
  return Math.round(4 * (longitude - standardMeridian) + equationOfTime);
}

function adjustedClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  adjustmentMinutes: number,
) {
  const adjusted = new Date(
    Date.UTC(year, month - 1, day, hour, minute) + adjustmentMinutes * 60_000,
  );
  return {
    year: adjusted.getUTCFullYear(),
    month: adjusted.getUTCMonth() + 1,
    day: adjusted.getUTCDate(),
    hour: adjusted.getUTCHours(),
    minute: adjusted.getUTCMinutes(),
    label: `${String(adjusted.getUTCHours()).padStart(2, '0')}:${String(adjusted.getUTCMinutes()).padStart(2, '0')}`,
  };
}

export function calculateBaziChart(profile: BirthProfile): BaziChartFacts {
  const { year, month, day } = parseDate(profile.birthDate);
  const { hour, minute } = parseTime(
    profile.birthTime,
    profile.birthTimeConfidence,
  );
  const adjustmentMinutes = calculateApparentSolarAdjustment(
    year,
    month,
    day,
    profile.birthPlace.longitude,
    profile.birthPlace.ianaTimeZone,
  );
  const adjusted = adjustedClock(
    year,
    month,
    day,
    hour,
    minute,
    adjustmentMinutes,
  );
  const solar = Solar.fromYmdHms(
    adjusted.year,
    adjusted.month,
    adjusted.day,
    adjusted.hour,
    adjusted.minute,
    0,
  );
  const eightChar = solar.getLunar().getEightChar();

  const pillars: BaziChartFacts['pillars'] = {
    year: eightChar.getYear(),
    month: eightChar.getMonth(),
    day: eightChar.getDay(),
  };
  if (profile.birthTimeConfidence !== 'unknown') {
    pillars.hour = eightChar.getTime();
  }

  const elementBalance: BaziChartFacts['elementBalance'] = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  Object.values(pillars)
    .join('')
    .split('')
    .forEach((character) => {
      const element = elementByCharacter[character];
      if (element) elementBalance[element] += 1;
    });

  const calculationNotes = [
    `Birth place resolved as ${profile.birthPlace.label}.`,
    `Civil time zone: ${profile.birthPlace.ianaTimeZone}.`,
    'Pillars use the solar-term BaZi calendar; element counts cover visible stems and branches only.',
    `Apparent solar-time adjustment: ${adjustmentMinutes >= 0 ? '+' : ''}${adjustmentMinutes} minutes, calculated from longitude and the equation of time.`,
  ];
  if (profile.birthTimeConfidence === 'unknown') {
    calculationNotes.push(
      'Birth hour is unknown, so the hour pillar is omitted and hour-sensitive claims are excluded.',
    );
  } else if (profile.birthTimeConfidence === 'approximate') {
    calculationNotes.push(
      'Birth time is approximate, so the hour pillar and hour-sensitive claims have reduced confidence.',
    );
  }

  const dayMaster = eightChar.getDayGan();
  const dayMasterElement = stemElements[dayMaster];
  const hiddenStems = Object.fromEntries(
    Object.values(pillars).map((pillar) => [
      pillar.slice(1),
      hiddenStemsByBranch[pillar.slice(1)] ?? [],
    ]),
  );
  const tenGods = Object.fromEntries(
    Object.entries(pillars).flatMap(([pillarName, pillar]) => {
      const stem = pillar.slice(0, 1);
      const hidden = hiddenStems[pillar.slice(1)] ?? [];
      return [
        [`${pillarName} stem ${stem}`, tenGod(dayMaster, stem)],
        ...hidden.map((hiddenStem) => [
          `${pillarName} hidden ${hiddenStem}`,
          tenGod(dayMaster, hiddenStem),
        ]),
      ];
    }),
  );
  const seasonalElement = elementByCharacter[pillars.month.slice(1)];
  const supportingElements = [dayMasterElement, seasonalElement];
  const supportScore =
    supportingElements.filter((element) => element === dayMasterElement)
      .length + (elementBalance[dayMasterElement] >= 3 ? 1 : 0);
  const seasonalStrength =
    supportScore >= 3
      ? ('supported' as const)
      : supportScore === 2
        ? ('balanced' as const)
        : ('challenged' as const);
  const strengthNotes = [
    `Day Master ${dayMaster} is ${dayMasterElement}; month branch ${pillars.month.slice(1)} is ${seasonalElement}.`,
    `Visible ${dayMasterElement} count is ${elementBalance[dayMasterElement]}; hidden stems are included separately.`,
    `Seasonal strength is treated as ${seasonalStrength}, not as a fixed personality verdict.`,
  ];
  const signals = calculateTimingSignals(year, pillars, dayMaster);
  const currentYear = new Date().getUTCFullYear();

  return {
    pillars,
    dayMaster,
    elementBalance,
    birthTimeConfidence: profile.birthTimeConfidence,
    calculationNotes,
    verifiedObservations: [
      `Day Master: ${dayMaster} (${dayMasterElement}).`,
      `Visible pillars: ${Object.values(pillars).join(' · ')}.`,
    ],
    dayMasterElement,
    seasonalStrength,
    strengthNotes,
    hiddenStems,
    tenGods,
    structuralRelations: structuralRelations(pillars),
    timeAdjustment: {
      minutes: adjustmentMinutes,
      adjustedLocalTime:
        profile.birthTimeConfidence === 'unknown' ? undefined : adjusted.label,
      method: 'longitude-and-equation-of-time',
    },
    timingSignals: signals,
    eventCandidates: deriveEventCandidates(signals),
    futureSignals: signals
      .filter((signal) => signal.year >= currentYear)
      .sort((left, right) => left.year - right.year),
    systems: {
      bazi: 'calculated',
      ziwei: 'not-calculated',
      ziweiNote:
        'Ziwei Dou Shu is reserved for a separately calculated chart layer. The interpretation must not invent palaces, stars, transformations, or major periods.',
    },
  };
}
