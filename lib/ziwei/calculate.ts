import { Solar } from 'lunar-javascript';

export const ZIWEI_CONVENTION = 'ziwei-quanshu-volume-2-v1';

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '交友', '官禄', '田宅', '福德', '父母',
] as const;
const TIGER_STEM_BY_YEAR_STEM: Record<string, number> = {
  甲: 2, 己: 2, 乙: 4, 庚: 4, 丙: 6, 辛: 6, 丁: 8, 壬: 8, 戊: 0, 癸: 0,
};
const NAYIN_ELEMENTS = [
  'metal', 'fire', 'wood', 'earth', 'metal', 'fire', 'water', 'earth', 'metal', 'wood',
  'water', 'earth', 'fire', 'wood', 'water', 'metal', 'fire', 'wood', 'earth', 'metal',
  'fire', 'water', 'earth', 'metal', 'wood', 'water', 'earth', 'fire', 'wood', 'water',
] as const;
const BUREAU_BY_ELEMENT = {
  water: 2,
  wood: 3,
  metal: 4,
  earth: 5,
  fire: 6,
} as const;
const FOUR_TRANSFORMATIONS: Record<
  string,
  readonly [string, string, string, string]
> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
};
const TRANSFORMATION_NAMES = ['化禄', '化权', '化科', '化忌'] as const;

interface LunarDateApi {
  getYear(): number;
  getMonth(): number;
  getDay(): number;
  getYearGan(): string;
  getYearZhi(): string;
}

export interface ZiweiChartInput {
  birthDate: string;
  birthTime?: string;
  birthTimeConfidence: 'exact' | 'approximate' | 'unknown';
  timeZone: string;
}

export interface ZiweiChartFacts {
  complete: true;
  convention: typeof ZIWEI_CONVENTION;
  input: { birthDate: string; birthTime: string; timeZone: string };
  lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean };
  yearGanzhi: string;
  birthHourBranch: string;
  mingBranch: string;
  shenBranch: string;
  bureau: { element: keyof typeof BUREAU_BY_ELEMENT; number: number };
  ziweiBranch: string;
  tianfuBranch: string;
  palaces: Array<{
    name: (typeof PALACE_NAMES)[number];
    branch: string;
    ganzhi: string;
    isMing: boolean;
    isShen: boolean;
    stars: string[];
    transformations: string[];
  }>;
  transformations: Array<{
    star: string;
    transformation: (typeof TRANSFORMATION_NAMES)[number];
    branch: string;
  }>;
  notes: string[];
}

export interface IncompleteZiweiChart {
  complete: false;
  convention: typeof ZIWEI_CONVENTION;
  reason: 'birth_time_required';
  lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean };
  yearGanzhi: string;
  notes: string[];
}

export type ZiweiCalculation = ZiweiChartFacts | IncompleteZiweiChart;

function mod(value: number, base: number) {
  return ((value % base) + base) % base;
}

function parseBirthDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Birth date must use YYYY-MM-DD');
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (
    year < 1900 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(Date.UTC(year, month, 0)).getUTCDate()
  ) {
    throw new Error('Birth date is outside the supported calendar range');
  }
  return { year, month, day };
}

function parseBirthTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Birth time must use HH:mm');
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error('Birth time is invalid');
  return { hour, minute };
}

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function localLunarDate(date: ReturnType<typeof parseBirthDate>, time = { hour: 12, minute: 0 }) {
  const lunar = Solar.fromYmdHms(
    date.year,
    date.month,
    date.day,
    time.hour,
    time.minute,
    0,
  ).getLunar() as unknown as LunarDateApi;
  const rawMonth = lunar.getMonth();
  return {
    year: lunar.getYear(),
    month: Math.abs(rawMonth),
    day: lunar.getDay(),
    isLeapMonth: rawMonth < 0,
    yearGan: lunar.getYearGan(),
    yearZhi: lunar.getYearZhi(),
  };
}

function hourBranchIndex(hour: number) {
  return Math.floor(((hour + 1) % 24) / 2);
}

function palaceStemIndex(yearGan: string, branch: string) {
  const tigerStem = TIGER_STEM_BY_YEAR_STEM[yearGan];
  const branchIndex = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  if (tigerStem === undefined || branchIndex < 0) {
    throw new Error('Could not derive palace stem');
  }
  const offsetFromTiger = mod(branchIndex - BRANCHES.indexOf('寅'), 12);
  return mod(tigerStem + offsetFromTiger, 10);
}

function bureauFor(yearGan: string, branch: string) {
  const stemIndex = STEMS.indexOf(yearGan as (typeof STEMS)[number]);
  const branchIndex = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  const ganzhiIndex = Array.from({ length: 60 }, (_, index) => index).find(
    (index) => index % 10 === stemIndex && index % 12 === branchIndex,
  );
  if (ganzhiIndex === undefined) throw new Error('Invalid palace ganzhi');
  const element = NAYIN_ELEMENTS[Math.floor(ganzhiIndex / 2)];
  return {
    element,
    number: BUREAU_BY_ELEMENT[element],
  };
}

function ziweiIndexFor(day: number, bureauNumber: number) {
  const divisibleDay = Math.ceil(day / bureauNumber) * bureauNumber;
  const countFromYin = divisibleDay / bureauNumber;
  const remainder = divisibleDay - day;
  const baseIndex = mod(BRANCHES.indexOf('寅') + countFromYin - 1, 12);
  return mod(baseIndex + (remainder % 2 === 0 ? remainder : -remainder), 12);
}

function putStar(starsByBranch: Map<string, string[]>, branchIndex: number, star: string) {
  const branch = BRANCHES[mod(branchIndex, 12)];
  const stars = starsByBranch.get(branch) ?? [];
  stars.push(star);
  starsByBranch.set(branch, stars);
}

export function calculateZiweiChart(input: ZiweiChartInput): ZiweiCalculation {
  const date = parseBirthDate(input.birthDate);
  if (!isValidTimeZone(input.timeZone)) throw new Error('A valid IANA time zone is required');
  if (!['exact', 'approximate', 'unknown'].includes(input.birthTimeConfidence)) {
    throw new Error('Birth-time confidence is invalid');
  }
  const lunar = localLunarDate(date);
  const lunarDate = {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.isLeapMonth,
  };
  const yearGanzhi = `${lunar.yearGan}${lunar.yearZhi}`;
  if (input.birthTimeConfidence === 'unknown' || !input.birthTime) {
    return {
      complete: false,
      convention: ZIWEI_CONVENTION,
      reason: 'birth_time_required',
      lunarDate,
      yearGanzhi,
      notes: [
        'Birth hour is required for 命宫、身宫 and the main-star chart; those positions are not guessed.',
        'Enter the birth date and clock time as recorded at the birthplace. The IANA time zone is validated and retained as context; it does not convert UTC or apply longitude/true-solar-time correction.',
        'The fixed convention is 《紫微斗数全书》卷二 style.',
      ],
    };
  }

  const { hour, minute } = parseBirthTime(input.birthTime);
  const lunarWithHour = localLunarDate(date, { hour, minute });
  const effectiveMonth = lunarWithHour.isLeapMonth
    ? (lunarWithHour.month % 12) + 1
    : lunarWithHour.month;
  const monthPalaceIndex = mod(BRANCHES.indexOf('寅') + effectiveMonth - 1, 12);
  const hourIndex = hourBranchIndex(hour);
  const mingIndex = mod(monthPalaceIndex - hourIndex, 12);
  const shenIndex = mod(monthPalaceIndex + hourIndex, 12);
  const mingBranch = BRANCHES[mingIndex];
  const shenBranch = BRANCHES[shenIndex];
  const mingStemIndex = palaceStemIndex(lunarWithHour.yearGan, mingBranch);
  const bureau = bureauFor(STEMS[mingStemIndex], mingBranch);
  const ziweiIndex = ziweiIndexFor(lunarWithHour.day, bureau.number);
  const tianfuIndex = mod(4 - ziweiIndex, 12);
  const starsByBranch = new Map<string, string[]>();

  [
    ['紫微', 0],
    ['天机', -1],
    ['太阳', -3],
    ['武曲', -4],
    ['天同', -5],
    ['廉贞', -8],
  ].forEach(([star, offset]) => putStar(starsByBranch, ziweiIndex + Number(offset), String(star)));
  [
    ['天府', 0],
    ['太阴', 1],
    ['贪狼', 2],
    ['巨门', 3],
    ['天相', 4],
    ['天梁', 5],
    ['七杀', 6],
    ['破军', 10],
  ].forEach(([star, offset]) => putStar(starsByBranch, tianfuIndex + Number(offset), String(star)));

  const lunarMonthOffset = effectiveMonth - 1;
  const auxiliaryBranches = {
    文昌: mod(BRANCHES.indexOf('戌') - hourIndex, 12),
    文曲: mod(BRANCHES.indexOf('辰') + hourIndex, 12),
    左辅: mod(BRANCHES.indexOf('辰') + lunarMonthOffset, 12),
    右弼: mod(BRANCHES.indexOf('戌') - lunarMonthOffset, 12),
  };
  FOUR_TRANSFORMATIONS[lunarWithHour.yearGan].forEach((star) => {
    const branchIndex = auxiliaryBranches[star as keyof typeof auxiliaryBranches];
    if (branchIndex !== undefined) putStar(starsByBranch, branchIndex, star);
  });

  const palaceNameByBranch = new Map<string, (typeof PALACE_NAMES)[number]>();
  PALACE_NAMES.forEach((name, offset) => {
    palaceNameByBranch.set(BRANCHES[mod(mingIndex - offset, 12)], name);
  });
  const transformations = FOUR_TRANSFORMATIONS[lunarWithHour.yearGan].map(
    (star, index) => ({
      star,
      transformation: TRANSFORMATION_NAMES[index],
      branch:
        Array.from(starsByBranch.entries()).find(([, stars]) => stars.includes(star))?.[0] ?? '',
    }),
  );
  const transformationByStar = new Map(
    transformations.map((item) => [item.star, item.transformation]),
  );
  const palaces = BRANCHES.map((branch, branchIndex) => {
    const stemIndex = palaceStemIndex(lunarWithHour.yearGan, branch);
    const stars = starsByBranch.get(branch) ?? [];
    return {
      name: palaceNameByBranch.get(branch) ?? '命宫',
      branch,
      ganzhi: `${STEMS[stemIndex]}${branch}`,
      isMing: branchIndex === mingIndex,
      isShen: branchIndex === shenIndex,
      stars,
      transformations: stars
        .map((star) => transformationByStar.get(star))
        .filter((value): value is (typeof TRANSFORMATION_NAMES)[number] => Boolean(value)),
    };
  });
  const notes = [
    'Enter the birth date and clock time as recorded at the birthplace. The IANA time zone is validated and retained as context; it does not convert UTC or apply longitude/true-solar-time correction.',
    'Leap lunar months follow the selected 《紫微斗数全书》卷二 example: count the leap month as the next month for 命身宫; no 15-day split is used.',
    'Birth time is mapped to the traditional two-hour Earthly Branch; 子时 is 23:00–00:59 and the civil-date lunar day is retained.',
    'The chart places the 14 main stars and birth-year four transformations. It calculates only the auxiliary-star positions needed to locate those transformations, not a complete auxiliary-star chart; brightness, major periods, and annual/monthly charts are not calculated.',
    ...(input.birthTimeConfidence === 'approximate'
      ? ['Birth time is approximate; 命身宫 and hour-dependent placements may change if the recorded hour is wrong.']
      : []),
  ];

  return {
    complete: true,
    convention: ZIWEI_CONVENTION,
    input: { birthDate: input.birthDate, birthTime: input.birthTime, timeZone: input.timeZone },
    lunarDate: {
      year: lunarWithHour.year,
      month: lunarWithHour.month,
      day: lunarWithHour.day,
      isLeapMonth: lunarWithHour.isLeapMonth,
    },
    yearGanzhi,
    birthHourBranch: BRANCHES[hourIndex],
    mingBranch,
    shenBranch,
    bureau,
    ziweiBranch: BRANCHES[ziweiIndex],
    tianfuBranch: BRANCHES[tianfuIndex],
    palaces,
    transformations,
    notes,
  };
}
