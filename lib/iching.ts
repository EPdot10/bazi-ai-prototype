export type CoinLine = 6 | 7 | 8 | 9;
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type SixKin = '兄弟' | '子孙' | '妻财' | '官鬼' | '父母';
export type SixSpirit = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武';

export interface CastContext {
  castAt: string;
  timeZone: string;
}

export interface NaJiaLine {
  position: number;
  yang: boolean;
  stem: string;
  branch: string;
  element: FiveElement;
  kin: SixKin;
  spirit?: SixSpirit;
  isMoving: boolean;
  isShi: boolean;
  isYing: boolean;
}

export interface Hexagram {
  number: number;
  name: string;
  lines: boolean[];
  palace: string;
  palaceElement: FiveElement;
  sequence: string;
  shi: number;
  ying: number;
  yao: NaJiaLine[];
  hiddenKinCandidates: Array<{
    kin: SixKin;
    position: number;
    stem: string;
    branch: string;
    element: FiveElement;
  }>;
}

const TRIGRAM_ORDER = [
  '111',
  '110',
  '101',
  '100',
  '011',
  '010',
  '001',
  '000',
] as const;

// Rows are the upper trigram; columns are the lower trigram. King Wen order.
const HEXAGRAM_NUMBERS = [
  [1, 10, 13, 25, 44, 6, 33, 12],
  [43, 58, 49, 17, 28, 47, 31, 45],
  [14, 38, 30, 21, 50, 64, 56, 35],
  [34, 54, 55, 51, 32, 40, 62, 16],
  [9, 61, 37, 42, 57, 59, 53, 20],
  [5, 60, 63, 3, 48, 29, 39, 8],
  [26, 41, 22, 27, 18, 4, 52, 23],
  [11, 19, 36, 24, 46, 7, 15, 2],
] as const;

const HEXAGRAM_NAMES = [
  '乾', '坤', '屯', '蒙', '需', '讼', '师', '比', '小畜', '履', '泰', '否',
  '同人', '大有', '谦', '豫', '随', '蛊', '临', '观', '噬嗑', '贲', '剥', '复',
  '无妄', '大畜', '颐', '大过', '坎', '离', '咸', '恒', '遁', '大壮', '晋', '明夷',
  '家人', '睽', '蹇', '解', '损', '益', '夬', '姤', '萃', '升', '困', '井', '革',
  '鼎', '震', '艮', '渐', '归妹', '丰', '旅', '巽', '兑', '涣', '节', '中孚',
  '小过', '既济', '未济',
] as const;

const BRANCH_ELEMENT: Record<string, FiveElement> = {
  子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood', 辰: 'earth', 巳: 'fire',
  午: 'fire', 未: 'earth', 申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
};

const TRIGRAM_NAJIA: Record<
  string,
  { innerStem: string; innerBranches: string[]; outerStem: string; outerBranches: string[] }
> = {
  '111': { innerStem: '甲', innerBranches: ['子', '寅', '辰'], outerStem: '壬', outerBranches: ['午', '申', '戌'] },
  '010': { innerStem: '戊', innerBranches: ['寅', '辰', '午'], outerStem: '戊', outerBranches: ['申', '戌', '子'] },
  '001': { innerStem: '丙', innerBranches: ['辰', '午', '申'], outerStem: '丙', outerBranches: ['戌', '子', '寅'] },
  '100': { innerStem: '庚', innerBranches: ['子', '寅', '辰'], outerStem: '庚', outerBranches: ['午', '申', '戌'] },
  '011': { innerStem: '辛', innerBranches: ['丑', '亥', '酉'], outerStem: '辛', outerBranches: ['未', '巳', '卯'] },
  '101': { innerStem: '己', innerBranches: ['卯', '丑', '亥'], outerStem: '己', outerBranches: ['酉', '未', '巳'] },
  '000': { innerStem: '乙', innerBranches: ['未', '巳', '卯'], outerStem: '癸', outerBranches: ['丑', '亥', '酉'] },
  '110': { innerStem: '丁', innerBranches: ['巳', '卯', '丑'], outerStem: '丁', outerBranches: ['亥', '酉', '未'] },
};

const PALACE_GROUPS: Array<{
  palace: string;
  element: FiveElement;
  hexagrams: number[];
}> = [
  { palace: '乾', element: 'metal', hexagrams: [1, 44, 33, 12, 20, 23, 35, 14] },
  { palace: '兑', element: 'metal', hexagrams: [58, 47, 45, 31, 39, 15, 62, 54] },
  { palace: '离', element: 'fire', hexagrams: [30, 56, 50, 64, 4, 59, 6, 13] },
  { palace: '震', element: 'wood', hexagrams: [51, 16, 40, 32, 46, 48, 28, 17] },
  { palace: '巽', element: 'wood', hexagrams: [57, 9, 37, 42, 25, 21, 27, 18] },
  { palace: '坎', element: 'water', hexagrams: [29, 60, 3, 63, 49, 55, 36, 7] },
  { palace: '艮', element: 'earth', hexagrams: [52, 22, 26, 41, 38, 10, 61, 53] },
  { palace: '坤', element: 'earth', hexagrams: [2, 24, 19, 11, 34, 43, 5, 8] },
];

const PALACE_SEQUENCE = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
const SHI_BY_SEQUENCE = [6, 1, 2, 3, 4, 5, 4, 3];
const DAY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DAY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SIX_SPIRITS: SixSpirit[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
const FIRST_SPIRIT_BY_DAY_STEM: Record<string, number> = {
  甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5,
};
const FIVE_KIN: SixKin[] = ['兄弟', '子孙', '妻财', '官鬼', '父母'];
const FIVE_ELEMENT_ORDER: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

const numberToBits = new Map<number, boolean[]>();
const palaceByHexagram = new Map<number, { palace: string; element: FiveElement; sequence: number }>();
for (let upper = 0; upper < TRIGRAM_ORDER.length; upper += 1) {
  for (let lower = 0; lower < TRIGRAM_ORDER.length; lower += 1) {
    numberToBits.set(
      HEXAGRAM_NUMBERS[upper][lower],
      `${TRIGRAM_ORDER[lower]}${TRIGRAM_ORDER[upper]}`.split('').map((bit) => bit === '1'),
    );
  }
}
for (const group of PALACE_GROUPS) {
  group.hexagrams.forEach((number, sequence) => {
    palaceByHexagram.set(number, { palace: group.palace, element: group.element, sequence });
  });
}

export function isCoinLines(value: unknown): value is CoinLine[] {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every((line) => line === 6 || line === 7 || line === 8 || line === 9)
  );
}

export function isCastContext(value: unknown): value is CastContext {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.castAt === 'string' &&
    Number.isFinite(Date.parse(candidate.castAt)) &&
    typeof candidate.timeZone === 'string' &&
    candidate.timeZone.length > 0 &&
    candidate.timeZone.length <= 80 &&
    isValidTimeZone(candidate.timeZone)
  );
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function castCoinLine(): CoinLine {
  const coins = new Uint8Array(3);
  crypto.getRandomValues(coins);
  return (6 + (coins[0] & 1) + (coins[1] & 1) + (coins[2] & 1)) as CoinLine;
}

export function castingDayGanzhi(context: CastContext) {
  if (!isCastContext(context)) throw new Error('A valid cast time and time zone are required');
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: context.timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(context.castAt));
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const year = part('year');
  const month = part('month');
  const day = part('day');
  const a = Math.floor((14 - month) / 12);
  const adjustedYear = year + 4800 - a;
  const adjustedMonth = month + 12 * a - 3;
  const julianDay =
    day +
    Math.floor((153 * adjustedMonth + 2) / 5) +
    365 * adjustedYear +
    Math.floor(adjustedYear / 4) -
    Math.floor(adjustedYear / 100) +
    Math.floor(adjustedYear / 400) -
    32045;
  const cycleIndex = ((julianDay + 49) % 60 + 60) % 60;
  return {
    localDate: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    dayGanzhi: `${DAY_STEMS[cycleIndex % 10]}${DAY_BRANCHES[cycleIndex % 12]}`,
    dayStem: DAY_STEMS[cycleIndex % 10],
  };
}

function hexagramFromLines(lines: boolean[]) {
  const lower = lines.slice(0, 3).map(Number).join('');
  const upper = lines.slice(3).map(Number).join('');
  const row = TRIGRAM_ORDER.indexOf(upper as (typeof TRIGRAM_ORDER)[number]);
  const column = TRIGRAM_ORDER.indexOf(lower as (typeof TRIGRAM_ORDER)[number]);
  if (row < 0 || column < 0) throw new Error('Invalid hexagram lines');
  const number = HEXAGRAM_NUMBERS[row][column];
  const membership = palaceByHexagram.get(number);
  if (!membership) throw new Error('Hexagram palace mapping is incomplete');
  return {
    number,
    name: HEXAGRAM_NAMES[number - 1],
    lines,
    ...membership,
  };
}

function kinFor(palaceElement: FiveElement, lineElement: FiveElement): SixKin {
  const palaceIndex = FIVE_ELEMENT_ORDER.indexOf(palaceElement);
  const lineIndex = FIVE_ELEMENT_ORDER.indexOf(lineElement);
  if (lineIndex === palaceIndex) return '兄弟';
  if ((lineIndex + 1) % 5 === palaceIndex) return '父母';
  if ((palaceIndex + 1) % 5 === lineIndex) return '子孙';
  if ((palaceIndex + 2) % 5 === lineIndex) return '妻财';
  return '官鬼';
}

function decorateLines(
  lines: boolean[],
  palaceElement: FiveElement,
  shi: number,
  ying: number,
  movingLines: number[],
  dayStem?: string,
) {
  return lines.map((yang, index) => {
    const upper = index >= 3;
    const trigramBits = lines.slice(upper ? 3 : 0, upper ? 6 : 3).map(Number).join('');
    const trigram = TRIGRAM_NAJIA[trigramBits];
    const innerIndex = index % 3;
    const stem = upper ? trigram.outerStem : trigram.innerStem;
    const branch = upper ? trigram.outerBranches[innerIndex] : trigram.innerBranches[innerIndex];
    const spiritStart = dayStem ? FIRST_SPIRIT_BY_DAY_STEM[dayStem] : undefined;
    return {
      position: index + 1,
      yang,
      stem,
      branch,
      element: BRANCH_ELEMENT[branch],
      kin: kinFor(palaceElement, BRANCH_ELEMENT[branch]),
      spirit: spiritStart === undefined ? undefined : SIX_SPIRITS[(spiritStart + index) % 6],
      isMoving: movingLines.includes(index + 1),
      isShi: shi === index + 1,
      isYing: ying === index + 1,
    } satisfies NaJiaLine;
  });
}

function fullHexagram(
  number: number,
  lines: boolean[],
  movingLines: number[],
  dayStem?: string,
) {
  const base = hexagramFromLines(lines);
  const shi = SHI_BY_SEQUENCE[base.sequence];
  const ying = ((shi + 2) % 6) + 1;
  const yao = decorateLines(lines, base.element, shi, ying, movingLines, dayStem);
  const presentKin = new Set(yao.map((line) => line.kin));
  const palacePureNumber = PALACE_GROUPS.find((group) => group.palace === base.palace)?.hexagrams[0];
  const palacePureLines = numberToBits.get(palacePureNumber ?? 0);
  const hiddenKinCandidates = palacePureLines
    ? decorateLines(palacePureLines, base.element, shi, ying, [], dayStem)
        .filter((line) => !presentKin.has(line.kin))
        .filter((line, index, all) => all.findIndex((candidate) => candidate.kin === line.kin) === index)
        .map(({ kin, position, stem, branch, element }) => ({ kin, position, stem, branch, element }))
    : [];
  return {
    number,
    name: HEXAGRAM_NAMES[number - 1],
    lines,
    palace: base.palace,
    palaceElement: base.element,
    sequence: PALACE_SEQUENCE[base.sequence],
    shi,
    ying,
    yao,
    hiddenKinCandidates,
  };
}

export function deriveCoinReading(throws: CoinLine[], context?: CastContext) {
  if (!isCoinLines(throws)) throw new Error('Six valid coin lines are required');
  if (context && !isCastContext(context)) throw new Error('Invalid cast context');
  // The first throw is the bottom line. 6 and 9 are moving lines.
  const originalLines = throws.map((line) => line === 7 || line === 9);
  const movingLines = throws.flatMap((line, index) =>
    line === 6 || line === 9 ? [index + 1] : [],
  );
  const changedLines = throws.map((line) => line === 7 || line === 6);
  const day = context ? castingDayGanzhi(context) : undefined;
  const originalBase = hexagramFromLines(originalLines);
  const original = fullHexagram(
    originalBase.number,
    originalLines,
    movingLines,
    day?.dayStem,
  );
  const changedBase = movingLines.length ? hexagramFromLines(changedLines) : null;
  const changed = changedBase
    ? {
        number: changedBase.number,
        name: changedBase.name,
        lines: changedLines,
        yao: decorateLines(
          changedLines,
          original.palaceElement,
          original.shi,
          original.ying,
          movingLines,
          day?.dayStem,
        ),
      }
    : null;
  return {
    original,
    changed,
    movingLines,
    throws: [...throws],
    castingDay: day ? { localDate: day.localDate, ganzhi: day.dayGanzhi } : null,
  };
}

export const HEXAGRAM_COUNT = 64;
export const SIX_KIN_VALUES = FIVE_KIN;
