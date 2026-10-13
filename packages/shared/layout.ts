import type { Point } from './world';
export const tables: Point[] = [
  [-2.6, 0],
  [2.4, 0.3],
  [0, 3.4],
];
export const barSpots: Point[] = [
  [1.5, -3.2],
  [2.5, -3.2],
  [3.5, -3.2],
  [4.5, -3.2],
  [5.5, -3.2],
];
export const seats: Point[] = [
  [-4.2, 0.2],
  [-2.6, 1.65],
  [-1.1, -0.25],
  [2.4, 1.9],
  [4, 0.5],
  [1.05, -0.7],
  [-1.55, 3.55],
  [1.55, 3.55],
  [0, 5],
];
export const stageSpots: Point[] = [
  [-5.7, -4.35],
  [-4.55, -4.35],
];
export const danceSpots: Point[] = [
  [-4.6, -2.15],
  [-3.4, -2.1],
  [-5.3, -1.15],
];
export const hearthSpots: Point[] = [
  [-5.5, 2.4],
  [-5.3, 3.6],
];
export function isWalkable([x, z]: Point, margin = 0.35): boolean {
  if (x < -6.4 || x > 6.65 || z < -5.15 || z > 5.2) return false;
  if (x > 1 && x < 6.5 && z < -3.65) return false;
  if (x < -6.2 && z > 1 && z < 4.2) return false;
  if (x > 5.1 && z > 3.45 && z < 5) return false;
  return !tables.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 1 + margin);
}
export const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const workbenchSpot: Point = [6.2, 3.1];
