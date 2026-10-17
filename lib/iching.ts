export type CoinLine = 6 | 7 | 8 | 9;

export interface Hexagram {
  number: number;
  name: string;
  lines: boolean[];
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
  '乾',
  '坤',
  '屯',
  '蒙',
  '需',
  '讼',
  '师',
  '比',
  '小畜',
  '履',
  '泰',
  '否',
  '同人',
  '大有',
  '谦',
  '豫',
  '随',
  '蛊',
  '临',
  '观',
  '噬嗑',
  '贲',
  '剥',
  '复',
  '无妄',
  '大畜',
  '颐',
  '大过',
  '坎',
  '离',
  '咸',
  '恒',
  '遁',
  '大壮',
  '晋',
  '明夷',
  '家人',
  '睽',
  '蹇',
  '解',
  '损',
  '益',
  '夬',
  '姤',
  '萃',
  '升',
  '困',
  '井',
  '革',
  '鼎',
  '震',
  '艮',
  '渐',
  '归妹',
  '丰',
  '旅',
  '巽',
  '兑',
  '涣',
  '节',
  '中孚',
  '小过',
  '既济',
  '未济',
] as const;

export function isCoinLines(value: unknown): value is CoinLine[] {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every((line) => line === 6 || line === 7 || line === 8 || line === 9)
  );
}

export function castCoinLine(): CoinLine {
  const coins = new Uint8Array(3);
  crypto.getRandomValues(coins);
  return (6 + (coins[0] & 1) + (coins[1] & 1) + (coins[2] & 1)) as CoinLine;
}

function hexagramFromLines(lines: boolean[]): Hexagram {
  const lower = lines.slice(0, 3).map(Number).join('');
  const upper = lines.slice(3).map(Number).join('');
  const row = TRIGRAM_ORDER.indexOf(upper as (typeof TRIGRAM_ORDER)[number]);
  const column = TRIGRAM_ORDER.indexOf(lower as (typeof TRIGRAM_ORDER)[number]);
  if (row < 0 || column < 0) throw new Error('Invalid hexagram lines');
  const number = HEXAGRAM_NUMBERS[row][column];
  return { number, name: HEXAGRAM_NAMES[number - 1], lines };
}

export function deriveCoinReading(throws: CoinLine[]) {
  if (!isCoinLines(throws))
    throw new Error('Six valid coin lines are required');
  // The first throw is the bottom line. 6 and 9 are moving lines.
  const originalLines = throws.map((line) => line === 7 || line === 9);
  const movingLines = throws.flatMap((line, index) =>
    line === 6 || line === 9 ? [index + 1] : [],
  );
  const changedLines = throws.map((line) => line === 7 || line === 6);
  return {
    original: hexagramFromLines(originalLines),
    changed: movingLines.length ? hexagramFromLines(changedLines) : null,
    movingLines,
    throws: [...throws],
  };
}
