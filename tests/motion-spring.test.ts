import { expect, it } from 'vitest';
import { stepMotionSpring } from '../apps/web/motion-spring';

it('accelerates smoothly, settles without overshoot, and preserves speed when interrupted', () => {
  const spring = { value: 0, velocity: 0 };
  stepMotionSpring(spring, 1, 0.3, 1 / 60);
  expect(spring.value).toBeGreaterThan(0);
  expect(spring.value).toBeLessThan(0.02);
  for (let frame = 0; frame < 120; frame++) {
    stepMotionSpring(spring, 1, 0.3, 1 / 60);
    expect(spring.value).toBeLessThanOrEqual(1);
  }
  expect(spring.value).toBeCloseTo(1, 4);
  const coarse = { value: 0, velocity: 0 },
    fine = { value: 0, velocity: 0 };
  for (let i = 0; i < 10; i++) stepMotionSpring(coarse, 1, 0.3, 0.1);
  for (let i = 0; i < 60; i++) stepMotionSpring(fine, 1, 0.3, 1 / 60);
  expect(coarse.value).toBeCloseTo(fine.value, 10);
  const velocity = fine.velocity;
  stepMotionSpring(fine, 0, 0.3, 0);
  expect(fine.velocity).toBe(velocity);
});
