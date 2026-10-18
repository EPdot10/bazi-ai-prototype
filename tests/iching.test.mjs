import assert from 'node:assert/strict';
import test from 'node:test';
import {
  castingDayGanzhi,
  deriveCoinReading,
  isCastContext,
  isCoinLines,
} from '../lib/iching.ts';

const SYDNEY_CONTEXT = {
  castAt: '2026-10-17T14:00:00.000Z',
  timeZone: 'Australia/Sydney',
};

test('six solid and six broken lines map to Qian and Kun', () => {
  assert.equal(deriveCoinReading([7, 7, 7, 7, 7, 7]).original.number, 1);
  assert.equal(deriveCoinReading([8, 8, 8, 8, 8, 8]).original.number, 2);
});

test('upper/lower trigram axes distinguish Tai and Fou', () => {
  assert.equal(deriveCoinReading([7, 7, 7, 8, 8, 8]).original.number, 11);
  assert.equal(deriveCoinReading([8, 8, 8, 7, 7, 7]).original.number, 12);
  assert.equal(deriveCoinReading([8, 7, 7, 7, 7, 7]).original.number, 44);
  assert.equal(deriveCoinReading([7, 7, 7, 8, 7, 7]).original.number, 9);
});

test('moving lines transform 6 and 9, bottom to top', () => {
  const reading = deriveCoinReading([9, 9, 9, 9, 9, 9]);
  assert.equal(reading.original.number, 1);
  assert.equal(reading.changed.number, 2);
  assert.deepEqual(reading.movingLines, [1, 2, 3, 4, 5, 6]);
  const oneLine = deriveCoinReading([9, 7, 7, 7, 7, 7]);
  assert.equal(oneLine.changed.number, 44);
});

test('all 64 line combinations map to unique King Wen numbers and the expected eight palaces', () => {
  const expectedPalaces = [
    [1, 44, 33, 12, 20, 23, 35, 14],
    [58, 47, 45, 31, 39, 15, 62, 54],
    [30, 56, 50, 64, 4, 59, 6, 13],
    [51, 16, 40, 32, 46, 48, 28, 17],
    [57, 9, 37, 42, 25, 21, 27, 18],
    [29, 60, 3, 63, 49, 55, 36, 7],
    [52, 22, 26, 41, 38, 10, 61, 53],
    [2, 24, 19, 11, 34, 43, 5, 8],
  ];
  const expectedSequence = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
  const expectedShi = [6, 1, 2, 3, 4, 5, 4, 3];
  const observed = new Map();
  for (let mask = 0; mask < 64; mask += 1) {
    const lines = Array.from({ length: 6 }, (_, index) =>
      mask & (1 << index) ? 7 : 8,
    );
    const reading = deriveCoinReading(lines).original;
    observed.set(reading.number, reading);
  }
  assert.deepEqual(
    [...observed.keys()].sort((a, b) => a - b),
    Array.from({ length: 64 }, (_, index) => index + 1),
  );
  expectedPalaces.forEach((group, palaceIndex) => {
    group.forEach((number, sequenceIndex) => {
      const reading = observed.get(number);
      assert.ok(reading, `missing hexagram ${number}`);
      assert.equal(reading.palace, ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'][palaceIndex]);
      assert.equal(reading.sequence, expectedSequence[sequenceIndex]);
      assert.equal(reading.shi, expectedShi[sequenceIndex]);
      assert.equal(reading.ying, ((expectedShi[sequenceIndex] + 2) % 6) + 1);
    });
  });
});

test('Qian palace receives Najia, five kin, shi/ying, and hidden kin consistently', () => {
  const qian = deriveCoinReading([7, 7, 7, 7, 7, 7]).original;
  assert.equal(qian.palace, '乾');
  assert.equal(qian.palaceElement, 'metal');
  assert.equal(qian.sequence, '本宫');
  assert.equal(qian.shi, 6);
  assert.equal(qian.ying, 3);
  assert.deepEqual(
    qian.yao.map(({ stem, branch, element, kin }) => [stem, branch, element, kin]),
    [
      ['甲', '子', 'water', '子孙'],
      ['甲', '寅', 'wood', '妻财'],
      ['甲', '辰', 'earth', '父母'],
      ['壬', '午', 'fire', '官鬼'],
      ['壬', '申', 'metal', '兄弟'],
      ['壬', '戌', 'earth', '父母'],
    ],
  );
  assert.equal(qian.hiddenKinCandidates.length, 0);
});

test('Tai is a Kun-palace third-generation hexagram and supplies hidden parents', () => {
  const tai = deriveCoinReading([7, 7, 7, 8, 8, 8]).original;
  assert.equal(tai.number, 11);
  assert.equal(tai.palace, '坤');
  assert.equal(tai.palaceElement, 'earth');
  assert.equal(tai.sequence, '三世');
  assert.equal(tai.shi, 3);
  assert.equal(tai.ying, 6);
  assert.deepEqual(tai.hiddenKinCandidates, [
    { kin: '父母', position: 2, stem: '乙', branch: '巳', element: 'fire' },
  ]);
});

test('cast-day local date and six spirits follow the selected timezone', () => {
  assert.deepEqual(castingDayGanzhi(SYDNEY_CONTEXT), {
    localDate: '2026-10-18',
    dayGanzhi: '乙丑',
    dayStem: '乙',
  });
  const reading = deriveCoinReading([7, 7, 7, 7, 7, 7], SYDNEY_CONTEXT);
  assert.deepEqual(reading.original.yao.map((line) => line.spirit), [
    '青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武',
  ]);
  assert.equal(reading.castingDay.ganzhi, '乙丑');
});

test('moving and changed chart lines are re-Najia with the original palace kin reference', () => {
  const reading = deriveCoinReading([9, 7, 8, 7, 8, 7], SYDNEY_CONTEXT);
  assert.deepEqual(reading.movingLines, [1]);
  assert.equal(reading.original.yao[0].isMoving, true);
  assert.equal(reading.changed.yao[0].isMoving, true);
  assert.notEqual(reading.changed.yao[0].branch, reading.original.yao[0].branch);
  assert.notEqual(reading.changed.yao[0].kin, reading.original.yao[0].kin);
  assert.equal(reading.changed.yao[0].spirit, reading.original.yao[0].spirit);
});

test('未济 with moving first and fourth lines changes to 损', () => {
  const reading = deriveCoinReading([6, 7, 8, 9, 8, 7]);
  assert.equal(reading.original.number, 64);
  assert.equal(reading.changed.number, 41);
  assert.deepEqual(reading.movingLines, [1, 4]);
});

test('rejects malformed casts and cast contexts', () => {
  assert.equal(isCoinLines([6, 7, 8]), false);
  assert.equal(isCoinLines([6, 7, 8, 9, 7, 10]), false);
  assert.throws(() => deriveCoinReading([7, 7, 7]));
  assert.equal(isCastContext(SYDNEY_CONTEXT), true);
  assert.equal(isCastContext({ castAt: 'not-a-date', timeZone: 'Australia/Sydney' }), false);
  assert.equal(isCastContext({ castAt: new Date().toISOString(), timeZone: 'Mars/Olympus' }), false);
  assert.throws(() => deriveCoinReading([7, 7, 7, 7, 7, 7], { castAt: 'bad', timeZone: 'UTC' }));
});
