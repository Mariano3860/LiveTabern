import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Chair, CharacterModel } from '../../apps/web/scene';
import type { PublicWorld } from '../../packages/shared/world';
import { seats, tables, distance } from '../../packages/shared/layout';

function Ready() {
  let frames = 0;
  useFrame(() => {
    if (++frames === 150) document.body.dataset.ready = 'true';
  });
  return null;
}

export function preview(world: PublicWorld) {
  const [x, z] = seats[0];
  const table = tables.reduce((best, item) =>
    distance(item, [x, z]) < distance(best, [x, z]) ? item : best,
  );
  const facing = Math.atan2(table[0] - x, table[1] - z);
  createRoot(document.getElementById('root')!).render(
    <Canvas
      camera={{ position: [3, 1.8, 3], fov: 35 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <color attach="background" args={['#ddd5c5']} />
      <ambientLight intensity={2} />
      <directionalLight position={[3, 5, 4]} intensity={3} />
      <Suspense fallback={null}>
        <group position={[0, -0.8, 0]} rotation={[0, -facing, 0]}>
          <group position={[-x, 0, -z]}>
            <Chair x={x} z={z} world={world} reduced />
          </group>
          <group position={[0, 0.05, 0]} rotation={[0, facing, 0]}>
            <CharacterModel
              variant={2}
              npc={world.inhabitants[1]}
              action="rest"
              moving={false}
              sitting
              serving={false}
              reduced={false}
            />
          </group>
        </group>
        <Ready />
      </Suspense>
    </Canvas>,
  );
}
