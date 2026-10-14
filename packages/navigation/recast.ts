import { init, NavMeshQuery } from 'recast-navigation';
import { generateSoloNavMesh } from 'recast-navigation/generators';
import { distance, isWalkable } from '../shared/layout';
import type { Point } from '../shared/world';
import type { Navigation } from '../simulation/engine';

export async function createNavigation(): Promise<Navigation & { dispose(): void }> {
  await init();
  const positions: number[] = [],
    indices: number[] = [];
  const step = 0.2;
  for (let x = -8.5; x < 8.5; x += step)
    for (let z = -5.1; z < 7.8; z += step) {
      if (
        ![
          [x, z],
          [x + step, z],
          [x + step, z + step],
          [x, z + step],
        ].every((p) => isWalkable(p as Point, 0.55))
      )
        continue;
      const base = positions.length / 3;
      positions.push(x, 0, z, x + step, 0, z, x + step, 0, z + step, x, 0, z + step);
      indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  const result = generateSoloNavMesh(positions, indices, {
    cs: 0.1,
    ch: 0.1,
    walkableRadius: 0,
    walkableHeight: 2,
    walkableClimb: 1,
    minRegionArea: 0,
    mergeRegionArea: 0,
    maxSimplificationError: 0.5,
  });
  if (!result.success) throw new Error('Tavern navigation mesh failed to build');
  const query = new NavMeshQuery(result.navMesh);
  return {
    path(start, end) {
      if (distance(start, end) < 0.1) return [];
      const route = query.computePath(
        { x: start[0], y: 0, z: start[1] },
        { x: end[0], y: 0, z: end[1] },
        { halfExtents: { x: 0.5, y: 1, z: 0.5 } },
      );
      if (!route.success || !route.path.length) return [];
      const points = route.path.map((p) => [p.x, p.z] as Point);
      const last = points.at(-1)!,
        remaining = distance(last, end);
      if (remaining > 0.65 || !isWalkable(end, 0.42)) return [];
      if (remaining > 0.001) {
        const samples = Math.ceil(remaining / 0.1);
        for (let i = 1; i <= samples; i++) {
          const fraction = i / samples;
          const point: Point = [
            last[0] + (end[0] - last[0]) * fraction,
            last[1] + (end[1] - last[1]) * fraction,
          ];
          if (!isWalkable(point, 0.42)) return [];
        }
        points.push([...end]);
      }
      return points.filter((p) => distance(p, start) > 0.05);
    },
    dispose() {
      query.destroy();
      result.navMesh.destroy();
    },
  };
}
