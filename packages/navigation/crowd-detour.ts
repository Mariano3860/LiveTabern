import type { Navigation } from '../simulation/engine';
import type { Point } from '../shared/world';
import { distance, isTravelWalkable, isTravelSegmentClear, seats } from '../shared/layout';

export function crowdDetour(navigation: Navigation, start: Point, end: Point, blockers: Point[]): Point[] {
  if (!blockers.length) return [];
  const centre: Point = [0, 0];
  for (const point of blockers) {
    centre[0] += point[0] / blockers.length;
    centre[1] += point[1] / blockers.length;
  }
  const radius = 0.65 + Math.max(...blockers.map((point) => distance(point, centre)));
  const nodes: Point[] = [start, end];
  for (let i = 0; i < 12; i++) {
    const point: Point = [
      centre[0] + Math.cos((i * Math.PI) / 6) * radius,
      centre[1] + Math.sin((i * Math.PI) / 6) * radius,
    ];
    if (isTravelWalkable(point)) nodes.push(point);
  }
  const costs = nodes.map(() => Infinity),
    routes: Point[][] = nodes.map(() => []),
    visited = new Set<number>();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i;
    if (current < 0 || !Number.isFinite(costs[current])) return [];
    if (current === 1) return routes[1];
    visited.add(current);
    for (let next = 1; next < nodes.length; next++) {
      if (visited.has(next)) continue;
      const assignedSeat = next === 1 ? seats.find((seat) => distance(seat, end) < 0.02) : undefined;
      const path = isTravelSegmentClear(nodes[current], nodes[next], assignedSeat)
        ? [nodes[next]]
        : navigation.path(nodes[current], nodes[next]);
      if (!path.length) continue;
      let previous = nodes[current],
        length = 0,
        clear = true;
      for (const point of path) {
        const dx = point[0] - previous[0],
          dz = point[1] - previous[1],
          squared = dx * dx + dz * dz;
        for (const blocker of blockers) {
          const sx = previous[0] - blocker[0],
            sz = previous[1] - blocker[1];
          const t = squared > 0 ? Math.max(0, Math.min(1, -(sx * dx + sz * dz) / squared)) : 0;
          if ((sx + dx * t) ** 2 + (sz + dz * t) ** 2 < 0.46 ** 2) clear = false;
        }
        if (!clear) break;
        length += Math.sqrt(squared);
        previous = point;
      }
      if (clear && costs[current] + length < costs[next]) {
        costs[next] = costs[current] + length;
        routes[next] = [...routes[current], ...path];
      }
    }
  }
  return [];
}
