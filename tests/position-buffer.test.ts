import { expect, it } from 'vitest';
import { samplePosition } from '../apps/web/position-buffer';

it('interpolates confirmed positions and holds the last position without predicting the world', () => {
  const samples = [
    { time: 0, position: [0, 0] as [number, number] },
    { time: 250, position: [0.2, 0] as [number, number] },
    { time: 500, position: [0.4, 0] as [number, number] },
  ];
  expect(samplePosition(samples, -50)).toEqual([0, 0]);
  expect(samplePosition(samples, 125)).toEqual([0.1, 0]);
  expect(samplePosition(samples, 375)[0]).toBeCloseTo(0.3, 10);
  expect(samplePosition(samples, 1500)).toEqual([0.4, 0]);
});
