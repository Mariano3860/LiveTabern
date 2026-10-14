import { expect, it } from 'vitest';
import { locomotionBlend } from '../apps/web/locomotion';

it('blends waiting into idle and matches step cadence to visible travel speed', () => {
  expect(locomotionBlend(0).walkWeight).toBe(0);
  expect(locomotionBlend(0.175).walkWeight).toBeCloseTo(0.5);
  expect(locomotionBlend(0.85).walkWeight).toBe(1);
  expect(locomotionBlend(0.475).cadence).toBeCloseTo(0.5);
  expect(locomotionBlend(0.95).cadence).toBe(1);
  expect(locomotionBlend(8).cadence).toBe(1.5);
});
