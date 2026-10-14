import { Suspense, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Chair, CharacterModel } from '../../apps/web/scene';
import type { PublicWorld } from '../../packages/shared/world';
import { seats, tables, distance } from '../../packages/shared/layout';

function Ready() {
  let frames = 0;
  const { scene } = useThree();
  useFrame(() => {
    const head = scene.getObjectByName('Head');
    if (head) document.body.dataset.headHeight = String(head.getWorldPosition(new Vector3()).y);
    if (++frames === 150) document.body.dataset.ready = 'true';
  });
  return null;
}

export function preview(world: PublicWorld) {
  createRoot(document.getElementById('root')!).render(<PosePreview world={world} />);
}

function PosePreview({ world }: { world: PublicWorld }) {
  const [pose, setPose] = useState<'rest' | 'pause' | 'exit'>('rest');
  const locomotion = useRef({ speed: 0, seatReady: true });
  const [x, z] = seats[0];
  const table = tables.reduce((best, item) =>
    distance(item, [x, z]) < distance(best, [x, z]) ? item : best,
  );
  const facing = Math.atan2(table[0] - x, table[1] - z);
  const chairWorld: PublicWorld = {
    ...world,
    inhabitants: [
      {
        ...world.inhabitants[1],
        position: [x, z],
        action: pose === 'exit' ? 'wander' : 'rest',
        phase: pose === 'exit' ? 'walking' : pose === 'pause' ? 'idle' : 'performing',
      },
    ],
  };
  return (
    <>
      <div style={{ position: 'absolute', zIndex: 10 }}>
        {(['rest', 'pause', 'exit'] as const).map((value) => (
          <button
            key={value}
            onClick={() => {
              document.body.dataset.ready = 'false';
              setPose(value);
            }}
          >
            {value}
          </button>
        ))}
      </div>
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
              <Chair x={x} z={z} world={chairWorld} reduced={false} />
            </group>
            <group position={[0, 0.05, 0]} rotation={[0, facing, 0]}>
              <CharacterModel
                variant={2}
                npc={world.inhabitants[1]}
                action={pose === 'rest' ? 'rest' : ''}
                moving={pose === 'exit'}
                sitting={pose !== 'exit'}
                serving={false}
                reduced={false}
                locomotion={locomotion}
              />
            </group>
          </group>
          <Ready key={pose} />
        </Suspense>
      </Canvas>
      ,
    </>
  );
}
