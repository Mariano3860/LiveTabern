import type { Point } from './world';
export const tables: Point[] = [
  [-2.6, 0],
  [2.4, 0.3],
  [0, 3.4],
  [-5.8, 5.9],
  [4.7, 6.0],
];
export const benches: Point[] = [
  [-8.45, 6.75],
  [7.7, 1.9],
  [7.6, 7.2],
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
  [-4.1, 5.9],
  [-4.6, 7.1],
  [-4.6, 4.7],
  [3, 6],
  [3.5, 7.2],
  [3.5, 4.8],
];
export const stageSpots: Point[] = [
  [-5.7, -4.35],
  [-4.55, -4.35],
  [-3.25, -4.35],
];
export const danceSpots: Point[] = [
  [-4.6, -2.15],
  [-3.4, -2.1],
  [-5.3, -1.15],
];
export const hearthSpots: Point[] = [
  [-7.8, 2.4],
  [-7.7, 3.6],
];
export function isWalkable([x, z]: Point, margin = 0.35): boolean {
  if (x < -8.5 || x > 8.5 || z < -5.15 || z > 7.85) return false;
  if (x > 1 && x < 6.5 && z < -3.5) return false;
  if (x < -8.25 && z > 1 && z < 4.2) return false;
  if (x > 5.1 && z > 3.45 && z < 5) return false;
  if (x > 7.3 && z < -4.4) return false;
  if (benches.some(([bx, bz]) => Math.abs(x - bx) < 0.85 + margin && Math.abs(z - bz) < 0.35 + margin))
    return false;
  return !tables.some(([tx, tz]) => (x - tx) ** 2 + (z - tz) ** 2 < (1 + margin) ** 2);
}
export const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// Includes the chair footprint, its short pullback, and a travel clearance.
export const chairClearance = 0.68;
export function isTravelWalkable(point: Point): boolean {
  return (
    isWalkable(point, 0.42) &&
    seats.every((seat) => (point[0] - seat[0]) ** 2 + (point[1] - seat[1]) ** 2 >= chairClearance ** 2)
  );
}
export function isTravelSegmentClear(from: Point, to: Point, assignedSeat?: Point): boolean {
  const length = distance(from, to);
  const samples = Math.max(1, Math.ceil(length / 0.08));
  for (let i = 1; i <= samples; i++) {
    const point: Point = [
      from[0] + ((to[0] - from[0]) * i) / samples,
      from[1] + ((to[1] - from[1]) * i) / samples,
    ];
    if (!isWalkable(point, 0.42)) return false;
  }
  const dx = to[0] - from[0],
    dz = to[1] - from[1];
  for (const seat of seats) {
    if (assignedSeat && (seat[0] - assignedSeat[0]) ** 2 + (seat[1] - assignedSeat[1]) ** 2 < 0.02 ** 2)
      continue;
    const sx = from[0] - seat[0],
      sz = from[1] - seat[1];
    // A seated or restored actor may leave an overlap, but never move deeper into it.
    if (sx * sx + sz * sz < chairClearance ** 2 && sx * dx + sz * dz >= -0.000001) continue;
    const t = length > 0 ? Math.max(0, Math.min(1, -(sx * dx + sz * dz) / (length * length))) : 0;
    if ((sx + dx * t) ** 2 + (sz + dz * t) ** 2 < (chairClearance - 0.000001) ** 2) return false;
  }
  return true;
}
export const workbenchSpot: Point = [6.2, 3.1];
