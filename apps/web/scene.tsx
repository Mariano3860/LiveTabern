import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import {
  BoxGeometry,
  BufferGeometry,
  AnimationMixer,
  CylinderGeometry,
  Plane,
  SphereGeometry,
  MeshStandardMaterial,
  Group,
  InstancedMesh,
  LoopOnce,
  LoopRepeat,
  Object3D,
  PointLight,
  Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import type { AnimationAction } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import { characterAnimationFor, type CharacterAnimationPlan } from './character-animation';
import type { PublicInhabitant, PublicWorld } from '../../packages/shared/world';
import { benches, distance, seats, tables } from '../../packages/shared/layout';

const cube = new BoxGeometry(1, 1, 1),
  cylinder = new CylinderGeometry(1, 1, 1, 14),
  sphere = new SphereGeometry(1, 16, 12);
const materials = new Map<string, MeshStandardMaterial>();
function material(color: string) {
  if (!materials.has(color)) materials.set(color, new MeshStandardMaterial({ color, roughness: 0.85 }));
  return materials.get(color)!;
}
function Box({
  p,
  s,
  c,
  r = 0,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
  r?: number;
}) {
  return (
    <mesh
      geometry={cube}
      material={material(c)}
      position={p}
      scale={s}
      rotation={[0, 0, r]}
      castShadow
      receiveShadow
    />
  );
}
function Round({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return <mesh geometry={cylinder} material={material(c)} position={p} scale={s} castShadow receiveShadow />;
}
function Orb({ p, radius, c }: { p: [number, number, number]; radius: number; c: string }) {
  return <mesh geometry={sphere} material={material(c)} position={p} scale={radius} castShadow />;
}
function Shape({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return <mesh geometry={sphere} material={material(c)} position={p} scale={s} castShadow />;
}
function Mug({ p = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={p}>
      <Round p={[0, 0, 0]} s={[0.11, 0.22, 0.11]} c="#bb9263" />
      <Round p={[0, 0.12, 0]} s={[0.085, 0.018, 0.085]} c="#e7cf8c" />
      <mesh position={[0.14, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.085, 0.025, 5, 10]} />
        <meshStandardMaterial color="#bb9263" />
      </mesh>
    </group>
  );
}
function Candle({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      <Round p={[0, 0, 0]} s={[0.12, 0.045, 0.12]} c="#5a432d" />
      <Round p={[0, 0.15, 0]} s={[0.055, 0.28, 0.055]} c="#ede2b8" />
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.065, 6, 6]} />
        <meshBasicMaterial color="#ffcc6d" />
      </mesh>
    </group>
  );
}
function TableTreat({ variant }: { variant: number }) {
  if (variant % 4 === 0)
    return (
      <group position={[-0.16, 1.03, -0.36]} rotation={[0, -0.28, 0]}>
        <Shape p={[0, 0.02, 0]} s={[0.2, 0.11, 0.27]} c="#c89555" />
        {[-0.11, 0, 0.11].map((x) => (
          <Box key={x} p={[x, 0.112, 0]} s={[0.018, 0.009, 0.37]} c="#8c5a32" />
        ))}
        <Shape p={[0.34, -0.005, 0.04]} s={[0.11, 0.08, 0.12]} c="#dbbb73" />
      </group>
    );
  if (variant % 4 === 1)
    return (
      <group position={[-0.15, 1.04, -0.37]} rotation={[0, 0.21, 0]}>
        <Box p={[0, 0, 0]} s={[0.34, 0.045, 0.43]} c="#573b2b" />
        <Box p={[0, 0.026, 0]} s={[0.3, 0.015, 0.38]} c="#c7ad7f" />
        <Box p={[0, 0.035, 0]} s={[0.018, 0.009, 0.38]} c="#827050" />
        <Round p={[0.31, 0.04, 0.04]} s={[0.035, 0.09, 0.035]} c="#a88f62" />
      </group>
    );
  if (variant % 4 === 2)
    return (
      <group position={[-0.18, 1.02, -0.36]} rotation={[0, -0.15, 0]}>
        <Box p={[-0.07, 0.012, 0]} s={[0.18, 0.025, 0.29]} c="#e0d2ae" />
        <Box p={[0.08, 0.02, -0.03]} s={[0.18, 0.025, 0.29]} c="#874d42" />
        <Box p={[0.28, 0.035, 0.03]} s={[0.11, 0.07, 0.11]} c="#d6c69e" />
        <Orb p={[0.26, 0.08, 0.02]} radius={0.018} c="#7d4940" />
        <Orb p={[0.3, 0.08, 0.045]} radius={0.018} c="#7d4940" />
      </group>
    );
  return (
    <group position={[-0.18, 1.03, -0.34]}>
      <Round p={[0, 0, 0]} s={[0.19, 0.035, 0.19]} c="#b99560" />
      <Orb p={[-0.045, 0.11, 0]} radius={0.105} c="#a84e36" />
      <Orb p={[0.075, 0.09, 0.025]} radius={0.085} c="#d5ad48" />
      <Orb p={[0.01, 0.08, -0.075]} radius={0.08} c="#66834b" />
    </group>
  );
}
function Table({ x, z, index }: { x: number; z: number; index: number }) {
  return (
    <group position={[x, 0, z]}>
      <Round p={[0, 0.92, 0]} s={[1, 0.15, 1]} c="#98673e" />
      <Round p={[0, 0.88, 0]} s={[0.92, 0.11, 0.92]} c="#543a28" />
      <Box p={[0, 0.43, 0]} s={[0.21, 0.82, 0.21]} c="#553822" />
      <Box p={[0, 0.1, 0]} s={[0.75, 0.15, 0.2]} c="#553822" />
      <Candle x={0.05} y={1.02} z={0} />
      <Mug p={[-0.44, 1.13, 0.18]} />
      <Mug p={[0.35, 1.13, -0.24]} />
      <Round p={[0.4, 1.01, 0.4]} s={[0.18, 0.035, 0.18]} c="#c2ad80" />
      <TableTreat variant={index} />
    </group>
  );
}
function Chair({ x, z }: { x: number; z: number }) {
  const nearest = tables.reduce((best, table) =>
    distance([x, z], table) < distance([x, z], best) ? table : best,
  );
  const facing = Math.atan2(nearest[0] - x, nearest[1] - z);
  return (
    <group position={[x, 0, z]} rotation={[0, facing, 0]}>
      <Round p={[0, 0.46, 0]} s={[0.37, 0.1, 0.35]} c="#865d39" />
      {[-1, 1].flatMap((a) =>
        [-1, 1].map((b) => (
          <Box key={`${a}${b}`} p={[a * 0.23, 0.24, b * 0.2]} s={[0.075, 0.46, 0.075]} c="#5e402b" />
        )),
      )}
      {[-1, 1].map((side) => (
        <Box key={side} p={[side * 0.23, 0.78, -0.21]} s={[0.08, 0.64, 0.08]} c="#5e402b" />
      ))}
      <Box p={[0, 0.85, -0.21]} s={[0.55, 0.3, 0.08]} c="#9d7149" />
    </group>
  );
}
function Barrel({ x, z, y = 0, scale = 1 }: { x: number; z: number; y?: number; scale?: number }) {
  return (
    <group position={[x, y, z]} scale={scale}>
      <Round p={[0, 0.52, 0]} s={[0.4, 0.95, 0.4]} c="#83552d" />
      {[0.17, 0.78].map((h) => (
        <Round key={h} p={[0, h, 0]} s={[0.42, 0.06, 0.42]} c="#373b36" />
      ))}
      <Round p={[0, 1.015, 0]} s={[0.37, 0.035, 0.37]} c="#a17446" />
    </group>
  );
}
function Fire({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null),
    light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    if (group.current) group.current.scale.y = 1 + Math.sin(t * 8) * 0.07;
    if (light.current) light.current.intensity = 19 + Math.sin(t * 7) * 1.4;
  });
  return (
    <group position={[-9.15, 0, 2.6]}>
      <Box p={[-0.4, 1, 0]} s={[0.25, 2, 2.5]} c="#777569" />
      {[-1, 1].map((sign) => (
        <Box key={sign} p={[0, 0.82, sign * 0.98]} s={[0.9, 1.65, 0.32]} c="#777569" />
      ))}
      <Box p={[0, 1.73, 0]} s={[1, 0.32, 2.55]} c="#898679" />
      <Box p={[-0.25, 2.85, 0]} s={[0.5, 2, 1.6]} c="#6d6d63" />
      <Box p={[0, 0.1, 0]} s={[1.15, 0.2, 2.6]} c="#888377" />
      <group ref={group}>
        {[-0.4, 0, 0.4].map((z, i) => (
          <group key={z}>
            <mesh position={[0.3, 0.5, z]}>
              <coneGeometry args={[0.24, 0.8 + i * 0.15, 7]} />
              <meshBasicMaterial color={i === 1 ? '#ffdf83' : '#ef802c'} />
            </mesh>
            <Box p={[0.1, 0.22, z]} s={[0.45, 0.15, 0.3]} c="#38231b" />
          </group>
        ))}
      </group>
      <pointLight ref={light} position={[0.9, 1, 0]} color="#ffa84c" intensity={19} distance={10} />
      <Candle x={0} y={1.95} z={-0.65} />
    </group>
  );
}
type Ember = { x: number; z: number; phase: number; speed: number; sway: number };
function EmberField({ reduced }: { reduced: boolean }) {
  const instances = useRef<InstancedMesh>(null);
  const particle = useMemo(() => new Object3D(), []);
  const embers = useMemo<Ember[]>(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: -8.8 + ((i * 37) % 100) * 0.16,
        z: -4.8 + ((i * 61) % 100) * 0.11,
        phase: (((i * 23) % 97) / 97) * 2.3,
        speed: 0.18 + ((i * 17) % 5) * 0.045,
        sway: 0.08 + ((i * 19) % 5) * 0.025,
      })),
    [],
  );
  useFrame(({ clock }) => {
    if (!instances.current) return;
    const elapsed = reduced ? 0 : clock.elapsedTime;
    for (const [index, ember] of embers.entries()) {
      const rise = (elapsed * ember.speed + ember.phase) % 2.3;
      particle.position.set(
        ember.x + Math.sin(elapsed * 0.55 + ember.phase) * ember.sway,
        0.55 + rise,
        ember.z + Math.cos(elapsed * 0.37 + ember.phase) * ember.sway * 0.7,
      );
      particle.scale.setScalar(0.68 + (Math.sin(elapsed * 1.7 + ember.phase) + 1) * 0.12);
      particle.updateMatrix();
      instances.current.setMatrixAt(index, particle.matrix);
    }
    instances.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={instances} args={[undefined, undefined, embers.length]} frustumCulled={false}>
      <sphereGeometry args={[0.028, 8, 6]} />
      <meshBasicMaterial color="#ffd087" transparent opacity={0.62} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
function Rug({
  x,
  z,
  width,
  depth,
  color,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  color: string;
}) {
  return (
    <group position={[x, 0.052, z]}>
      <Box p={[0, 0, 0]} s={[width, 0.025, depth]} c="#b89563" />
      <Box p={[0, 0.013, 0]} s={[width - 0.17, 0.025, depth - 0.17]} c={color} />
      <Box p={[0, 0.028, 0]} s={[width - 0.48, 0.025, depth - 0.46]} c="#ae8156" />
      <Box p={[0, 0.042, 0]} s={[width - 0.7, 0.025, depth - 0.69]} c={color} />
    </group>
  );
}
function WallBanner({ x, color }: { x: number; color: string }) {
  return (
    <group position={[x, 2.55, -5.74]}>
      <Box p={[0, 0, 0.03]} s={[0.78, 1.53, 0.06]} c={color} />
      <Box p={[0, 0.5, 0.08]} s={[0.58, 0.08, 0.03]} c="#d7b26b" />
      <Box p={[0, -0.18, 0.08]} s={[0.1, 0.7, 0.03]} c="#d7b26b" />
      <Orb p={[0, -0.14, 0.1]} radius={0.15} c="#e4c886" />
      <Box p={[0, 0.84, 0.02]} s={[0.97, 0.08, 0.12]} c="#513a26" />
    </group>
  );
}
function HerbRack() {
  return (
    <group position={[-7.7, 0, -5.5]}>
      {[1.1, 2.4].map((height) => (
        <Box key={height} p={[0, height, 0]} s={[2.35, 0.11, 0.45]} c="#6c462b" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[-0.95 + (i % 5) * 0.47, i < 5 ? 1.33 : 2.64, 0.1]}>
          <Round p={[0, 0.08, 0]} s={[0.13, 0.23, 0.13]} c={i % 3 ? '#806349' : '#566b43'} />
          <Orb p={[0, 0.24, 0]} radius={0.09} c={i % 2 ? '#7f9352' : '#9c7248'} />
        </group>
      ))}
    </group>
  );
}
function Tavern({ reduced }: { reduced: boolean }) {
  const wood = useTexture('/textures/oak-planks.webp');
  const stone = useTexture('/textures/lime-stone.webp');
  const floorMap = useMemo(() => {
    const map = wood.clone();
    map.colorSpace = SRGBColorSpace;
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(2.5, 2);
    map.needsUpdate = true;
    return map;
  }, [wood]);
  const wallMap = useMemo(() => {
    const map = stone.clone();
    map.colorSpace = SRGBColorSpace;
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(4, 1);
    map.needsUpdate = true;
    return map;
  }, [stone]);
  useEffect(
    () => () => {
      floorMap.dispose();
      wallMap.dispose();
    },
    [floorMap, wallMap],
  );
  return (
    <group>
      <Box p={[0, -0.35, 1.1]} s={[20.2, 0.7, 15.7]} c="#352c23" />
      <mesh position={[0, 0.011, 1.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[19.95, 15.45]} />
        <meshStandardMaterial map={floorMap} roughness={0.94} color="#bda582" />
      </mesh>
      <mesh position={[0, 2, -6]} receiveShadow>
        <boxGeometry args={[20, 4, 0.3]} />
        <meshStandardMaterial map={wallMap} roughness={1} color="#c7b49a" />
      </mesh>
      <mesh position={[-10, 2, 1.1]} receiveShadow>
        <boxGeometry args={[0.3, 4, 15.5]} />
        <meshStandardMaterial map={wallMap} roughness={1} color="#c7b49a" />
      </mesh>
      {[-9.7, -7.1, -2.4, 2.2, 7.1, 9.7].map((x) => (
        <Box key={x} p={[x, 2, -5.77]} s={[0.3, 4, 0.35]} c="#423024" />
      ))}
      <Box p={[0, 3.8, -5.74]} s={[20, 0.35, 0.4]} c="#453125" />
      <Box p={[-9.75, 3.8, 1.1]} s={[0.35, 0.35, 15.5]} c="#453125" />
      {[-5.3, 0, 5.3].map((z) => (
        <Box key={z} p={[-9.74, 2, z]} s={[0.34, 4, 0.23]} c="#423024" />
      ))}
      {[-5.4, -0.1].map((x) => (
        <group key={x}>
          <Box p={[x, 2.35, -5.78]} s={[1.9, 1.8, 0.12]} c="#342d26" />
          <Box p={[x, 2.35, -5.67]} s={[1.55, 1.5, 0.06]} c="#3f636d" />
          <Box p={[x, 2.35, -5.6]} s={[0.07, 1.5, 0.08]} c="#b3905c" />
          <Box p={[x, 2.35, -5.6]} s={[1.55, 0.07, 0.08]} c="#b3905c" />
          <Box p={[x, 1.4, -5.5]} s={[2.1, 0.15, 0.5]} c="#58402b" />
        </group>
      ))}
      <Box p={[-9.8, 1.8, -2.5]} s={[0.1, 2.5, 1.9]} c="#523725" />
      <Box p={[-9.7, 1.8, -2.5]} s={[0.1, 2.1, 1.5]} c="#755032" />
      <WallBanner x={-8.7} color="#824641" />
      <WallBanner x={8.6} color="#3e6071" />
      <HerbRack />
      <Rug x={-2.7} z={-1.9} width={4.2} depth={2.4} color="#703e3b" />
      <Rug x={3.4} z={3.8} width={3.6} depth={2.1} color="#405b58" />
      <Rug x={-3.9} z={5.8} width={4.5} depth={2.2} color="#6b5638" />
      {benches.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box p={[0, 0.41, 0]} s={[1.4, 0.14, 0.48]} c="#7b5333" />
          <Box p={[0, 0.72, -0.21]} s={[1.4, 0.65, 0.12]} c="#6a462e" />
          {[-0.58, 0.58].map((side) => (
            <Box key={side} p={[side, 0.22, 0]} s={[0.11, 0.43, 0.43]} c="#543723" />
          ))}
        </group>
      ))}
      {[-8.1, -3.2, 2.2, 7.4].map((x) => (
        <group key={x} position={[x, 3.65, -5.3]}>
          <Box p={[0, 0, 0]} s={[0.08, 0.65, 0.08]} c="#493b2d" />
          <Round p={[0, -0.36, 0]} s={[0.34, 0.1, 0.34]} c="#71583b" />
          <pointLight position={[0, -0.35, 0]} color="#ffc77f" intensity={3} distance={4.2} />
        </group>
      ))}
      <Box p={[3.8, 0.49, -4.15]} s={[5.3, 0.98, 1.25]} c="#724826" />
      <mesh position={[3.8, 1.08, -4.15]} castShadow receiveShadow>
        <boxGeometry args={[5.55, 0.17, 1.5]} />
        <meshStandardMaterial map={floorMap} color="#c9a77c" roughness={0.7} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} p={[1.25 + i * 0.45, 0.51, -3.53]} s={[0.025, 0.8, 0.04]} c="#a87940" />
      ))}
      {[2.1, 3.4].map((y) => (
        <Box key={y} p={[4.65, y, -5.57]} s={[3.8, 0.12, 0.7]} c="#4d3424" />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <group key={i}>
          <Round
            p={[3 + (i % 7) * 0.48, i < 7 ? 2.4 : 3.66, -5.5]}
            s={[0.085, 0.42, 0.085]}
            c={['#496c51', '#9d5d32', '#7a5548'][i % 3]}
          />
          <Round p={[3 + (i % 7) * 0.48, i < 7 ? 2.66 : 3.92, -5.5]} s={[0.035, 0.13, 0.035]} c="#bbaa6e" />
        </group>
      ))}
      {[2, 3.8, 5.8].map((x) => (
        <Mug key={x} p={[x, 1.29, -3.88]} />
      ))}
      <Candle x={1.25} y={1.18} z={-4.33} />
      <Candle x={6.1} y={1.18} z={-4.33} />
      <Box p={[-5, 0.18, -4.55]} s={[4.8, 0.36, 2.2]} c="#875b39" />
      {[-5.8, -4.4].map((x) => (
        <Box key={x} p={[x, 0.4, -5.4]} s={[0.08, 0.8, 0.08]} c="#b99659" />
      ))}
      <mesh position={[-4.9, 0.38, -4.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 1.65]} />
        <meshStandardMaterial color="#854a3c" />
      </mesh>
      {tables.map(([x, z], index) => (
        <Table key={x} x={x} z={z} index={index} />
      ))}
      {seats.map(([x, z], i) => (
        <Chair key={i} x={x} z={z} />
      ))}
      <Fire reduced={reduced} />
      <EmberField reduced={reduced} />
      <Barrel x={6.6} z={-4.9} scale={0.8} />
      <Barrel x={6.8} z={-3.8} scale={0.65} />
      <Barrel x={-9.2} z={-4.8} scale={0.75} />
      <Barrel x={8.9} z={6.9} scale={0.9} />
      <Barrel x={-8.9} z={7.3} scale={0.72} />
      <group position={[8.15, 0, -4.95]}>
        <Box p={[0, 0.95, 0]} s={[1.1, 1.9, 0.85]} c="#715238" />
        <Box p={[0, 1.93, 0]} s={[1.27, 0.1, 1.02]} c="#a47b4c" />
        <Box p={[0, 0.95, 0.45]} s={[0.08, 1.6, 0.03]} c="#382b22" />
        <Candle x={0.3} y={2.02} z={0.12} />
      </group>
      <Box p={[6.2, 0.5, 4.3]} s={[1.6, 0.9, 0.65]} c="#675038" />
      <Box p={[6.2, 1.01, 4.3]} s={[1.7, 0.14, 0.72]} c="#a07546" />
      <Box p={[6.2, 0.72, 3.96]} s={[0.18, 0.18, 0.04]} c="#bb9c56" />
      <Box p={[6.15, 1.12, 4.25]} s={[0.7, 0.06, 0.3]} c="#c79558" />
      <Box p={[6.65, 1.16, 4.3]} s={[0.07, 0.08, 0.4]} c="#493225" />
      <Box p={[6.65, 1.19, 4.13]} s={[0.22, 0.1, 0.1]} c="#7b8588" />
      <group position={[0, 3.9, -0.8]}>
        <Round p={[0, 0, 0]} s={[1.05, 0.07, 1.05]} c="#44382d" />
        <Box p={[0, 0.6, 0]} s={[0.07, 1.2, 0.07]} c="#55412d" />
        {Array.from({ length: 6 }, (_, i) => (
          <Candle
            key={i}
            x={Math.cos((i * Math.PI) / 3) * 0.95}
            y={0.06}
            z={Math.sin((i * Math.PI) / 3) * 0.95}
          />
        ))}
      </group>
    </group>
  );
}
type CharacterRig = {
  root: Object3D;
  bones: Map<string, Object3D>;
};
function makeCharacterRig(source: Object3D): CharacterRig {
  const root = cloneSkinned(source);
  const bones = new Map<string, Object3D>();
  root.traverse((object) => {
    if (object.name) bones.set(object.name, object);
    if ('isMesh' in object && object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return { root, bones };
}
const headGeometryCache = new WeakMap<BufferGeometry, BufferGeometry>();
function headOnlyGeometry(source: BufferGeometry) {
  const cached = headGeometryCache.get(source);
  if (cached) return cached;
  const positions = source.getAttribute('position');
  const indices = source.index?.array;
  const kept: number[] = [];
  const triangles = indices ? indices.length / 3 : positions.count / 3;
  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const a = indices ? indices[triangle * 3] : triangle * 3;
    const b = indices ? indices[triangle * 3 + 1] : triangle * 3 + 1;
    const c = indices ? indices[triangle * 3 + 2] : triangle * 3 + 2;
    const height = (positions.getY(a) + positions.getY(b) + positions.getY(c)) / 3;
    if (height >= 1.42) kept.push(a, b, c);
  }
  const geometry = source.clone();
  geometry.clearGroups();
  geometry.setIndex(kept);
  headGeometryCache.set(source, geometry);
  return geometry;
}
function CharacterModel({
  variant,
  npc,
  action,
  moving,
  sitting,
  serving,
  reduced,
}: {
  variant: number;
  npc: PublicInhabitant;
  action: PublicInhabitant['action'] | '';
  moving: boolean;
  sitting: boolean;
  serving: boolean;
  reduced: boolean;
}) {
  const gender = variant % 2 === 0 ? 'female' : 'male';
  const outfit = variant % 3 === 0 ? 'ranger' : 'peasant';
  const base = useGLTF(`/models/characters/quaternius/${gender}-base.gltf`);
  const clothes = useGLTF(`/models/characters/quaternius/${gender}-${outfit}.gltf`);
  const library = useGLTF('/models/characters/quaternius/tavern-actions.glb');
  const modelRoot = useRef<Group>(null);
  const clippingPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), -1.53), []);
  const worldPosition = useMemo(() => new Vector3(), []);
  const rigs = useMemo(() => {
    const head = makeCharacterRig(base.scene);
    const outfitRig = makeCharacterRig(clothes.scene);
    const bodyMesh = head.root.getObjectByName(gender === 'male' ? 'SuperHero_Male' : 'Superhero_Female');
    if (bodyMesh && 'isMesh' in bodyMesh && bodyMesh.isMesh) {
      const skinned = bodyMesh as typeof bodyMesh & {
        geometry: BufferGeometry;
        material: MeshStandardMaterial | MeshStandardMaterial[];
      };
      skinned.geometry = headOnlyGeometry(skinned.geometry);
      const clipMaterial = (original: MeshStandardMaterial) => {
        const clone = original.clone();
        clone.clippingPlanes = [clippingPlane];
        clone.clipShadows = true;
        return clone;
      };
      skinned.material = Array.isArray(skinned.material)
        ? skinned.material.map(clipMaterial)
        : clipMaterial(skinned.material);
    }
    return [head, outfitRig] as const;
  }, [base.scene, clothes.scene, clippingPlane, gender]);
  const mixers = useMemo(
    () => [new AnimationMixer(rigs[0].root), new AnimationMixer(rigs[1].root)] as const,
    [rigs],
  );
  const active = useRef<{ actions: [AnimationAction, AnimationAction]; plan: CharacterAnimationPlan } | null>(
    null,
  );
  const repeatCountdown = useRef(0);
  const playPlanRef = useRef<(plan: CharacterAnimationPlan) => void>(() => {});
  const playPlan = useMemo(() => {
    const clips = new Map(library.animations.map((clip) => [clip.name, clip]));
    return (plan: CharacterAnimationPlan) => {
      const clip = clips.get(plan.clip);
      if (!clip) return;
      const current = active.current;
      if (
        current?.plan.mode === plan.mode &&
        current.plan.clip === plan.clip &&
        current.plan.loop === plan.loop
      )
        return;
      const next = mixers.map((mixer) => mixer.clipAction(clip)) as [AnimationAction, AnimationAction];
      next.forEach((animation) => {
        animation.reset();
        animation.enabled = true;
        animation.clampWhenFinished = !plan.loop;
        animation.setLoop(plan.loop ? LoopRepeat : LoopOnce, plan.loop ? Infinity : 1);
        animation.setEffectiveTimeScale(plan.speed);
        animation.setEffectiveWeight(1);
        if (plan.loop && clip.duration > 0) animation.time = (variant * 0.37) % clip.duration;
        animation.play();
      });
      if (current)
        current.actions.forEach((animation, index) => animation.crossFadeTo(next[index], 0.32, false));
      else next.forEach((animation) => animation.fadeIn(0.32));
      active.current = { actions: next, plan };
      repeatCountdown.current = plan.repeatDelay ?? 0;
    };
  }, [library.animations, mixers, variant]);
  playPlanRef.current = playPlan;

  useEffect(() => {
    const onFinished = (event: { action: AnimationAction }) => {
      const current = active.current;
      if (current?.actions[0] !== event.action || !current.plan.after) return;
      playPlanRef.current({
        ...current.plan,
        clip: current.plan.after,
        loop: true,
        after: undefined,
      });
    };
    mixers[0].addEventListener('finished', onFinished);
    return () => {
      mixers[0].removeEventListener('finished', onFinished);
      mixers.forEach((mixer) => mixer.stopAllAction());
    };
  }, [mixers]);
  useEffect(() => {
    mixers.forEach((mixer) => (mixer.timeScale = reduced ? 0.72 : 1));
  }, [mixers, reduced]);
  const wasSitting = useRef(false);
  useEffect(() => {
    const plan = characterAnimationFor({
      action: action || 'wander',
      moving,
      sitting,
      serving,
      wasSitting: wasSitting.current,
      variant,
      instrument: npc.instrument,
    });
    wasSitting.current = sitting;
    playPlanRef.current(plan);
  }, [action, moving, sitting, serving, variant, npc.instrument]);
  useFrame(({ clock }, dt) => {
    const frameDelta = Math.min(dt, 0.05);
    mixers[0].update(frameDelta);
    mixers[1].update(frameDelta);
    const current = active.current;
    if (current?.plan.loop && current.plan.repeat && current.plan.clip === 'Idle_Torch_Loop') {
      repeatCountdown.current -= dt;
      if (repeatCountdown.current <= 0)
        playPlanRef.current({
          ...current.plan,
          clip: current.plan.repeat,
          loop: false,
          after: current.plan.clip,
        });
    }
    if (action === 'play_music' && !reduced) {
      const rightHand = rigs[1].bones.get('hand_r');
      const leftHand = rigs[1].bones.get('hand_l');
      if (rightHand) rightHand.rotation.x += Math.sin(clock.elapsedTime * 7 + variant) * 0.035;
      if (leftHand) leftHand.rotation.z += Math.sin(clock.elapsedTime * 2.8 + variant) * 0.018;
    }
    if (modelRoot.current) {
      modelRoot.current.getWorldPosition(worldPosition);
      clippingPlane.constant = -(worldPosition.y + 1.53);
    }
  });

  const hand = rigs[1].bones.get('hand_r');
  return (
    <group ref={modelRoot} scale={[0.98 + (variant % 3) * 0.02, 1, 0.98 + (variant % 3) * 0.02]}>
      <primitive object={rigs[0].root} />
      <primitive object={rigs[1].root} />
      {hand &&
        (serving || action === 'drink') &&
        createPortal(
          <group position={[0, -0.03, 0.025]} scale={0.58}>
            <Mug />
          </group>,
          hand,
        )}
      {action === 'trade' &&
        createPortal(<Round p={[0, 0, 0.03]} s={[0.055, 0.09, 0.055]} c="#b89754" />, hand ?? rigs[1].root)}
      {action === 'craft_instrument' &&
        createPortal(
          <group rotation={[0.25, 0, -0.2]}>
            <Box p={[0, 0, 0]} s={[0.035, 0.26, 0.035]} c="#69452b" />
            <Box p={[0, -0.12, 0]} s={[0.16, 0.07, 0.075]} c="#91958e" />
          </group>,
          hand ?? rigs[1].root,
        )}
      {npc.instrument === 'lute' && action === 'play_music' && (
        <group position={[0.11, 1.02, 0.24]} rotation={[0.12, 0, -0.45]}>
          <mesh geometry={sphere} material={material('#a8713e')} scale={[0.18, 0.25, 0.075]} />
          <Box p={[0, 0.29, 0]} s={[0.055, 0.43, 0.055]} c="#603c24" />
          <Box p={[0, 0.12, 0.076]} s={[0.018, 0.55, 0.008]} c="#e4d6b6" />
        </group>
      )}
      {npc.id === 'npc-1' && (
        <group position={[0, 0.97, 0.15]}>
          <Box p={[0, -0.12, 0]} s={[0.38, 0.54, 0.045]} c="#e0d3b7" />
          <Box p={[0, -0.42, 0.015]} s={[0.4, 0.13, 0.055]} c="#e0d3b7" />
          <Box p={[-0.2, 0, -0.02]} s={[0.045, 0.34, 0.035]} c="#c0aa7f" />
          <Box p={[0.2, 0, -0.02]} s={[0.045, 0.34, 0.035]} c="#c0aa7f" />
        </group>
      )}
    </group>
  );
}
function CharacterPlaceholder({ npc }: { npc: PublicInhabitant }) {
  return (
    <group position={[npc.position[0], 0.05, npc.position[1]]}>
      <Shape p={[0, 0.89, 0]} s={[0.25, 0.37, 0.16]} c={npc.color} />
      <Orb p={[0, 1.48, 0]} radius={0.17} c="#d1aa7f" />
      <Shape p={[-0.26, 0.96, 0]} s={[0.08, 0.31, 0.09]} c={npc.color} />
      <Shape p={[0.26, 0.96, 0]} s={[0.08, 0.31, 0.09]} c={npc.color} />
      <Shape p={[-0.12, 0.34, 0]} s={[0.085, 0.29, 0.09]} c="#493b31" />
      <Shape p={[0.12, 0.34, 0]} s={[0.085, 0.29, 0.09]} c="#493b31" />
    </group>
  );
}
function Person({
  npc,
  world,
  selected,
  select,
  reduced,
}: {
  npc: PublicInhabitant;
  world: PublicWorld;
  selected: boolean;
  select(): void;
  reduced: boolean;
}) {
  const group = useRef<Group>(null),
    body = useRef<Group>(null);
  const initial = useRef<[number, number, number]>([npc.position[0], 0, npc.position[1]]),
    [hover, setHover] = useState(false);
  const variant = Number(npc.id.slice(4)) || 0;
  const moving = npc.phase === 'walking',
    performing = npc.phase === 'performing';
  const sitting =
    performing &&
    npc.action === 'rest' &&
    npc.id !== 'npc-1' &&
    seats.some((seat) => distance(seat, npc.position) < 0.35);
  const serving =
    npc.id === 'npc-1' &&
    world.inhabitants.some(
      (other) => other.action === 'drink' && other.phase === 'performing' && other.position[1] < -2.7,
    );
  useFrame(({ clock }, dt) => {
    if (!group.current || !body.current) return;
    const blend = 1 - Math.exp(-dt * 9);
    group.current.position.x += (npc.position[0] - group.current.position.x) * blend;
    group.current.position.z += (npc.position[1] - group.current.position.z) * blend;
    const onStage =
      npc.position[0] > -7.4 && npc.position[0] < -2.6 && npc.position[1] > -5.65 && npc.position[1] < -3.45;
    group.current.position.y +=
      ((onStage ? 0.36 : npc.id === 'npc-1' ? 0.32 : 0.05) - group.current.position.y) * blend;
    let facing = group.current.rotation.y;
    if (moving)
      facing = Math.atan2(
        npc.position[0] - group.current.position.x,
        npc.position[1] - group.current.position.z,
      );
    else if (npc.partnerId) {
      const partner = world.inhabitants.find((n) => n.id === npc.partnerId);
      if (partner)
        facing = Math.atan2(partner.position[0] - npc.position[0], partner.position[1] - npc.position[1]);
    } else if (sitting) {
      const nearest = tables.reduce((best, table) =>
        distance(npc.position, table) < distance(npc.position, best) ? table : best,
      );
      facing = Math.atan2(nearest[0] - npc.position[0], nearest[1] - npc.position[1]);
    } else if (npc.action === 'play_music') facing = 0.15;
    else if (npc.action === 'craft_instrument')
      facing = Math.atan2(6.2 - npc.position[0], 4.3 - npc.position[1]);
    group.current.rotation.y +=
      Math.atan2(Math.sin(facing - group.current.rotation.y), Math.cos(facing - group.current.rotation.y)) *
      (1 - Math.exp(-dt * 5.5));
    body.current.position.y += (0 - body.current.position.y) * blend;
    body.current.rotation.set(0, 0, 0);
    const breathing =
      !reduced && !moving && !performing ? Math.sin(clock.elapsedTime * 1.5 + variant) * 0.003 : 0;
    body.current.scale.y += (1 + breathing - body.current.scale.y) * blend;
  });
  return (
    <group
      ref={group}
      position={initial.current}
      onClick={(e) => {
        e.stopPropagation();
        select();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      <group ref={body}>
        <CharacterModel
          variant={variant}
          npc={npc}
          action={performing ? npc.action : ''}
          moving={moving}
          sitting={sitting}
          serving={serving}
          reduced={reduced}
        />
      </group>
      {(selected || hover) && (
        <Html position={[0, 1.95, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="npc-label">
            <strong>{npc.name}</strong>
            <span>
              {moving
                ? 'Walking'
                : npc.phase === 'idle'
                  ? 'Taking a moment'
                  : npc.action.replaceAll('_', ' ')}
            </span>
            {world.musicGroups.find(
              (music) => music.status !== 'resting' && music.members.includes(npc.id),
            ) && (
              <span>
                Duet with{' '}
                {
                  world.inhabitants.find(
                    (other) =>
                      other.id !== npc.id &&
                      world.musicGroups.some(
                        (music) =>
                          music.status !== 'resting' &&
                          music.members.includes(npc.id) &&
                          music.members.includes(other.id),
                      ),
                  )?.name
                }
              </span>
            )}
          </div>
        </Html>
      )}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.44, 32]} />
          <meshBasicMaterial color="#f1cf83" />
        </mesh>
      )}
    </group>
  );
}
function Camera({
  view,
  selected,
  world,
  reduced,
}: {
  view: string;
  selected: string | null;
  world: PublicWorld;
  reduced: boolean;
}) {
  const controls = useRef<Controls>(null),
    { camera, size } = useThree(),
    transitioning = useRef(true);
  useEffect(() => {
    transitioning.current = true;
  }, [view, selected, size.width, size.height]);
  useFrame((_, dt) => {
    const n = world.inhabitants.find((npc) => npc.id === selected);
    if (!controls.current || (!transitioning.current && view !== 'follow')) return;
    const target =
      view === 'hearth'
        ? new Vector3(-4, 0.9, 2)
        : view === 'bar'
          ? new Vector3(3.7, 1.1, -4.5)
          : view === 'stage'
            ? new Vector3(-4.8, 1.1, -3.5)
            : view === 'follow' && n
              ? new Vector3(n.position[0], 1, n.position[1])
              : new Vector3(0, 0.8, 1);
    const position =
      view === 'hearth'
        ? new Vector3(0, 6, 10)
        : view === 'bar'
          ? new Vector3(7.5, 4.7, 1)
          : view === 'stage'
            ? new Vector3(1, 4.5, 5.5)
            : view === 'follow' && n
              ? new Vector3(n.position[0] + 5, 4, n.position[1] + 7)
              : new Vector3(15.5, 12.5, 20);
    if (view === 'room' && size.width / size.height < 1) position.multiplyScalar(1.45);
    const blend = reduced ? 1 : Math.min(1, dt * 3);
    controls.current.target.lerp(target, blend);
    camera.position.lerp(position, blend);
    controls.current.update();
    if (camera.position.distanceTo(position) < 0.03) transitioning.current = false;
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.8, 1]}
      minDistance={4}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={0.25}
      onStart={() => {
        transitioning.current = false;
      }}
    />
  );
}
function Metrics() {
  const frames = useRef(0);
  useFrame(({ gl }, dt) => {
    if (window.__TAVERN__ && ++frames.current % 30 === 0)
      window.__TAVERN__.rendering = {
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        frames: frames.current,
        lastFrameMs: dt * 1000,
      };
  });
  return null;
}
export default function TavernScene({
  world,
  selected,
  select,
  quality,
  view,
  reduced,
}: {
  world: PublicWorld;
  selected: string | null;
  select(id: string): void;
  quality: string;
  view: string;
  reduced: boolean;
}) {
  return (
    <Canvas
      shadows={quality === 'high'}
      dpr={quality === 'high' ? [1, 1.6] : 1}
      camera={{ position: [15.5, 12.5, 20], fov: 42 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
        gl.localClippingEnabled = true;
      }}
      fallback={<div className="scene-error">WebGL is unavailable. You can still follow the chronicle.</div>}
    >
      <color attach="background" args={['#22251e']} />
      <fog attach="fog" args={['#22251e', 36, 62]} />
      <ambientLight color="#ffdfb0" intensity={0.7} />
      <hemisphereLight args={['#b6c2c4', '#704a2e', 0.8]} />
      <directionalLight
        position={[1, 12, 6]}
        color="#ffe0a5"
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-normalBias={0.03}
      />
      <pointLight position={[0, 3.4, -0.8]} color="#ffc379" intensity={14} distance={13} />
      <pointLight position={[4.7, 2, -4.5]} color="#ffc88f" intensity={6} distance={6} />
      <Tavern reduced={reduced} />
      <Suspense
        fallback={world.inhabitants.map((npc) => (
          <CharacterPlaceholder key={npc.id} npc={npc} />
        ))}
      >
        {world.inhabitants.map((n) => (
          <Person
            key={n.id}
            npc={n}
            world={world}
            selected={selected === n.id}
            select={() => select(n.id)}
            reduced={reduced}
          />
        ))}
      </Suspense>
      <Camera view={view} selected={selected} world={world} reduced={reduced} />
      <Metrics />
    </Canvas>
  );
}
