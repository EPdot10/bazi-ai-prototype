import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateZiweiChart,
  ZIWEI_CONVENTION,
} from '../lib/ziwei/calculate.ts';

const chartFor = (birthTime, birthTimeConfidence = 'exact') =>
  calculateZiweiChart({
    birthDate: '1984-02-02',
    birthTime,
    birthTimeConfidence,
    timeZone: 'Australia/Sydney',
  });

test('classic 命宫/身宫 examples for 子、丑、寅时 are reproduced', () => {
  const zi = chartFor('23:00');
  const chou = chartFor('01:00');
  const yin = chartFor('03:00');
  assert.equal(zi.complete, true);
  assert.equal(zi.lunarDate.month, 1);
  assert.equal(zi.lunarDate.day, 1);
  assert.equal(zi.mingBranch, '寅');
  assert.equal(zi.shenBranch, '寅');
  assert.equal(chou.mingBranch, '丑');
  assert.equal(chou.shenBranch, '卯');
  assert.equal(yin.mingBranch, '子');
  assert.equal(yin.shenBranch, '辰');
});

test('甲年命宫寅, 火六局, lunar day one places 紫微 in 酉', () => {
  const chart = chartFor('23:00');
  assert.equal(chart.complete, true);
  assert.equal(chart.convention, ZIWEI_CONVENTION);
  assert.equal(chart.yearGanzhi, '甲子');
  assert.equal(chart.bureau.element, 'fire');
  assert.equal(chart.bureau.number, 6);
  assert.equal(chart.ziweiBranch, '酉');
  assert.deepEqual(
    chart.palaces.find((palace) => palace.isMing),
    chart.palaces.find((palace) => palace.branch === '寅'),
  );
});

test('leap lunar month follows the documented next-month convention', () => {
  const chart = calculateZiweiChart({
    birthDate: '2023-03-22',
    birthTime: '23:00',
    birthTimeConfidence: 'exact',
    timeZone: 'Asia/Shanghai',
  });
  assert.equal(chart.complete, true);
  assert.deepEqual(chart.lunarDate, {
    year: 2023,
    month: 2,
    day: 1,
    isLeapMonth: true,
  });
  assert.equal(chart.mingBranch, '辰');
});

test('十四主星 follow the selected 紫微系 and 天府系 offsets', () => {
  const chart = chartFor('23:00');
  assert.equal(chart.complete, true);
  const branchOf = (star) =>
    chart.palaces.find((palace) => palace.stars.includes(star))?.branch;
  assert.equal(chart.ziweiBranch, '酉');
  assert.equal(chart.tianfuBranch, '未');
  assert.deepEqual(
    Object.fromEntries(
      ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军']
        .map((star) => [star, branchOf(star)]),
    ),
    {
      紫微: '酉', 天机: '申', 太阳: '午', 武曲: '巳', 天同: '辰', 廉贞: '丑',
      天府: '未', 太阴: '申', 贪狼: '酉', 巨门: '戌', 天相: '亥', 天梁: '子', 七杀: '丑', 破军: '巳',
    },
  );
});

test('甲年四化 map to star locations without model interpretation', () => {
  const chart = chartFor('23:00');
  assert.equal(chart.complete, true);
  assert.deepEqual(chart.transformations, [
    { star: '廉贞', transformation: '化禄', branch: '丑' },
    { star: '破军', transformation: '化权', branch: '巳' },
    { star: '武曲', transformation: '化科', branch: '巳' },
    { star: '太阳', transformation: '化忌', branch: '午' },
  ]);
  assert.equal(chart.palaces.length, 12);
  assert.equal(new Set(chart.palaces.map((palace) => palace.branch)).size, 12);
});

test('birth-hour boundaries follow the declared 子时 convention', () => {
  const at = (birthTime) => calculateZiweiChart({
    birthDate: '1984-02-02',
    birthTime,
    birthTimeConfidence: 'exact',
    timeZone: 'Australia/Sydney',
  });
  assert.equal(at('22:59').birthHourBranch, '亥');
  assert.equal(at('23:00').birthHourBranch, '子');
  assert.equal(at('00:59').birthHourBranch, '子');
  assert.equal(at('01:00').birthHourBranch, '丑');
});

test('birth-year four transformations cover all ten heavenly stems', () => {
  const expectedByStem = {
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
  const stems = Object.keys(expectedByStem);
  for (const [index, stem] of stems.entries()) {
    const year = 1984 + index;
    const expected = expectedByStem[stem];
    const chart = calculateZiweiChart({
      birthDate: `${year}-06-15`,
      birthTime: '12:00',
      birthTimeConfidence: 'exact',
      timeZone: 'Australia/Sydney',
    });
    assert.equal(chart.complete, true);
    assert.equal(chart.yearGanzhi[0], stem);
    assert.deepEqual(chart.transformations.map(({ star }) => star), expected);
  }
});

test('unknown birth time returns an explicit incomplete chart, never a guessed hour', () => {
  const chart = chartFor(undefined, 'unknown');
  assert.equal(chart.complete, false);
  assert.equal(chart.reason, 'birth_time_required');
  assert.equal('palaces' in chart, false);
});

test('invalid date, time, and time zone are rejected', () => {
  assert.throws(() => calculateZiweiChart({ ...chartFor('23:00').input, birthDate: '1984-02-30', birthTimeConfidence: 'exact' }));
  assert.throws(() => calculateZiweiChart({ ...chartFor('23:00').input, birthTime: '24:00', birthTimeConfidence: 'exact' }));
  assert.throws(() => calculateZiweiChart({ ...chartFor('23:00').input, timeZone: 'Mars/Olympus', birthTimeConfidence: 'exact' }));
});
