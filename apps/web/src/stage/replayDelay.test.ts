import { expect, test } from 'vitest';
import { replayDelay } from './replayDelay';

test('short programs replay at 30 ms per drawing, long ones fit in 3 s', () => {
  expect(replayDelay(10)).toBe(30);
  expect(replayDelay(100)).toBe(30);
  expect(replayDelay(5000) * 5000).toBeLessThanOrEqual(3000);
  expect(replayDelay(0)).toBe(30);
});
