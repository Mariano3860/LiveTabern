import type { Point } from '../../packages/shared/world';

export interface PositionSample {
  time: number;
  position: Point;
}
export const POSITION_DELAY_MS = 250;
export function samplePosition(samples: PositionSample[], time: number): Point {
  if (time <= samples[0].time) return samples[0].position;
  for (let i = 1; i < samples.length; i++) {
    const next = samples[i],
      previous = samples[i - 1];
    if (time <= next.time) {
      const blend = (time - previous.time) / Math.max(1, next.time - previous.time);
      return [
        previous.position[0] + (next.position[0] - previous.position[0]) * blend,
        previous.position[1] + (next.position[1] - previous.position[1]) * blend,
      ];
    }
  }
  return samples[samples.length - 1].position;
}
