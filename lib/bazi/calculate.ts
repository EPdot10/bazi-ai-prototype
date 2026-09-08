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

function calculateTimingSignals(
  birthYear: number,
  pillars: BaziChartFacts['pillars'],
) {
  const pillarEntries = Object.entries(pillars) as Array<
    [keyof BaziChartFacts['pillars'], string]
  >;
  const currentYear = new Date().getUTCFullYear();
  const signals: BaziChartFacts['timingSignals'] = [];

  for (let year = birthYear + 6; year <= currentYear; year += 1) {
    const annualPillar = Solar.fromYmdHms(year, 7, 1, 12, 0, 0)
      .getLunar()
      .getEightChar()
      .getYear();
    const annualBranch = annualPillar.slice(1);
    const relations: string[] = [];
    let score = 0;

    pillarEntries.forEach(([pillarName, pillar]) => {
      const natalBranch = pillar.slice(1);
      if (annualBranch === natalBranch) {
        relations.push(
          `${annualBranch} repeats the ${pillarName} branch ${natalBranch}`,
        );
        score += 3;
      } else if (branchClashes[annualBranch] === natalBranch) {
        relations.push(
          `${annualBranch} clashes with the ${pillarName} branch ${natalBranch}`,
        );
        score += 3;
      } else if (branchCombinations[annualBranch] === natalBranch) {
        relations.push(
          `${annualBranch} combines with the ${pillarName} branch ${natalBranch}`,
        );
        score += 2;
      }
    });

    if (score >= 2) {
      signals.push({
        year,
        age: year - birthYear,
        annualPillar,
        relations,
        strength: score >= 5 ? 'strong' : 'moderate',
      });
    }
  }

  return signals
    .sort((left, right) => {
      const strengthDifference =
        Number(right.strength === 'strong') -
        Number(left.strength === 'strong');
      return strengthDifference || left.year - right.year;
    })
    .slice(0, 12);
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

export function calculateBaziChart(profile: BirthProfile): BaziChartFacts {
  const { year, month, day } = parseDate(profile.birthDate);
  const { hour, minute } = parseTime(
    profile.birthTime,
    profile.birthTimeConfidence,
  );
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
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

  return {
    pillars,
    dayMaster: eightChar.getDayGan(),
    elementBalance,
    birthTimeConfidence: profile.birthTimeConfidence,
    calculationNotes,
    verifiedObservations: [
      `Day Master: ${eightChar.getDayGan()} (${elementByCharacter[eightChar.getDayGan()]}).`,
      `Visible pillars: ${Object.values(pillars).join(' · ')}.`,
    ],
    timingSignals: calculateTimingSignals(year, pillars),
  };
}
