import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveCoinReading, isCoinLines } from '../lib/iching.ts';

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

test('all 64 line combinations map to distinct King Wen numbers', () => {
  const numbers = new Set();
  for (let mask = 0; mask < 64; mask += 1) {
    const lines = Array.from({ length: 6 }, (_, index) =>
      mask & (1 << index) ? 7 : 8,
    );
    numbers.add(deriveCoinReading(lines).original.number);
  }
  assert.deepEqual(
    [...numbers].sort((a, b) => a - b),
    Array.from({ length: 64 }, (_, index) => index + 1),
  );
});

test('rejects malformed casts', () => {
  assert.equal(isCoinLines([6, 7, 8]), false);
  assert.equal(isCoinLines([6, 7, 8, 9, 7, 10]), false);
  assert.throws(() => deriveCoinReading([7, 7, 7]));
});
