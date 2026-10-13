import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import {
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Group,
  PointLight,
  Vector3,
  RepeatWrapping,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import type { PublicInhabitant, PublicWorld } from '../../packages/shared/world';
import { benches, distance, seats, tables } from '../../packages/shared/layout';

const cube = new BoxGeometry(1, 1, 1),
  cylinder = new CylinderGeometry(1, 1, 1, 10),
  sphere = new SphereGeometry(1, 12, 8);
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
function Table({ x, z }: { x: number; z: number }) {
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
      {tables.map(([x, z]) => (
        <Table key={x} x={x} z={z} />
      ))}
      {seats.map(([x, z], i) => (
        <Chair key={i} x={x} z={z} />
      ))}
      <Fire reduced={reduced} />
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
    body = useRef<Group>(null),
    leftArm = useRef<Group>(null),
    rightArm = useRef<Group>(null),
    leftLeg = useRef<Group>(null),
    rightLeg = useRef<Group>(null),
    leftKnee = useRef<Group>(null),
    rightKnee = useRef<Group>(null),
    head = useRef<Group>(null),
    stride = useRef(0);
  const initial = useRef<[number, number, number]>([npc.position[0], 0, npc.position[1]]),
    [hover, setHover] = useState(false);
  const skin = ['#d8b58b', '#a87b59', '#bd916b', '#e2be99'][Number(npc.id.slice(4)) % 4];
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
  const hair = ['#3e2b25', '#6e4b2e', '#2e3030', '#9a7951'][Number(npc.id.slice(4)) % 4];
  useFrame(({ clock }, dt) => {
    if (!group.current || !body.current) return;
    const t = clock.elapsedTime + Number(npc.id.slice(4)),
      smooth = Math.min(1, dt * 10);
    const oldX = group.current.position.x,
      oldZ = group.current.position.z;
    group.current.position.x += (npc.position[0] - oldX) * smooth;
    group.current.position.z += (npc.position[1] - oldZ) * smooth;
    if (moving)
      stride.current += Math.hypot(group.current.position.x - oldX, group.current.position.z - oldZ) * 9;
    const onStage =
      npc.position[0] > -7.4 && npc.position[0] < -2.6 && npc.position[1] > -5.65 && npc.position[1] < -3.45;
    group.current.position.y +=
      ((onStage ? 0.36 : npc.id === 'npc-1' ? 0.32 : 0.05) - group.current.position.y) * smooth;
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
      Math.min(1, dt * 7);
    const dancing = performing && npc.action === 'dance',
      gait = reduced ? 0 : Math.sin(stride.current);
    const bodyY = sitting
      ? -0.18
      : dancing && !reduced
        ? Math.abs(Math.sin(t * 4)) * 0.13
        : moving && !reduced
          ? Math.abs(gait) * 0.027
          : Math.sin(t * 1.5) * 0.006;
    body.current.position.y += (bodyY - body.current.position.y) * smooth;
    body.current.rotation.z +=
      ((!reduced && dancing ? Math.sin(t * 3) * 0.16 : 0) - body.current.rotation.z) * smooth;
    body.current.rotation.x += ((sitting ? 0.08 : 0) - body.current.rotation.x) * smooth;
    if (leftLeg.current)
      leftLeg.current.rotation.x +=
        ((sitting ? -1.35 : moving ? gait * 0.52 : dancing ? Math.sin(t * 4) * 0.23 : 0) -
          leftLeg.current.rotation.x) *
        smooth;
    if (rightLeg.current)
      rightLeg.current.rotation.x +=
        ((sitting ? -1.35 : moving ? -gait * 0.52 : dancing ? -Math.sin(t * 4) * 0.23 : 0) -
          rightLeg.current.rotation.x) *
        smooth;
    if (leftKnee.current)
      leftKnee.current.rotation.x +=
        ((sitting ? 1.37 : moving ? Math.max(0, -gait) * 0.4 : 0) - leftKnee.current.rotation.x) * smooth;
    if (rightKnee.current)
      rightKnee.current.rotation.x +=
        ((sitting ? 1.37 : moving ? Math.max(0, gait) * 0.4 : 0) - rightKnee.current.rotation.x) * smooth;
    const leftGesture = dancing
      ? -1.45 + Math.sin(t * 4) * 0.3
      : performing && npc.action === 'play_music'
        ? -0.85
        : performing && npc.action === 'craft_instrument'
          ? -0.62
          : performing && npc.action === 'chat'
            ? -0.3 + Math.sin(t * 2.2) * 0.18
            : sitting
              ? -0.35
              : moving
                ? -gait * 0.36
                : 0.1;
    if (leftArm.current) leftArm.current.rotation.x += (leftGesture - leftArm.current.rotation.x) * smooth;
    const rightGesture = serving
      ? -0.85 + (reduced ? 0 : Math.sin(t * 3) * 0.18)
      : performing && npc.action === 'drink'
        ? -0.9 - (reduced ? 0 : Math.sin(t * 2.2) * 0.48)
        : performing && npc.action === 'trade'
          ? -1.05 + (reduced ? 0 : Math.sin(t * 2) * 0.12)
          : performing && npc.action === 'craft_instrument'
            ? -0.95 + (reduced ? 0 : Math.sin(t * 7) * 0.38)
            : performing && npc.action === 'play_music'
              ? -0.6 + (reduced ? 0 : Math.sin(t * 8) * 0.2)
              : performing && npc.action === 'chat'
                ? -0.4 + (reduced ? 0 : Math.sin(t * 2.8) * 0.25)
                : dancing
                  ? -1.4 - Math.sin(t * 4) * 0.3
                  : sitting
                    ? -0.35
                    : moving
                      ? gait * 0.36
                      : 0.1;
    if (rightArm.current)
      rightArm.current.rotation.x += (rightGesture - rightArm.current.rotation.x) * smooth;
    if (head.current)
      head.current.rotation.z +=
        ((performing && npc.action === 'chat' && !reduced ? Math.sin(t * 2) * 0.07 : 0) -
          head.current.rotation.z) *
        smooth;
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
        <group ref={leftLeg} position={[-0.15, 0.7, 0]}>
          <Shape p={[0, -0.17, 0]} s={[0.115, 0.22, 0.13]} c="#3e3b35" />
          <group ref={leftKnee} position={[0, -0.36, 0]}>
            <Orb p={[0, 0, 0]} radius={0.105} c="#353632" />
            <Shape p={[0, -0.19, 0]} s={[0.095, 0.22, 0.105]} c="#474842" />
            <Shape p={[0, -0.39, 0.065]} s={[0.12, 0.095, 0.2]} c="#493225" />
          </group>
        </group>
        <group ref={rightLeg} position={[0.15, 0.7, 0]}>
          <Shape p={[0, -0.17, 0]} s={[0.115, 0.22, 0.13]} c="#3e3b35" />
          <group ref={rightKnee} position={[0, -0.36, 0]}>
            <Orb p={[0, 0, 0]} radius={0.105} c="#353632" />
            <Shape p={[0, -0.19, 0]} s={[0.095, 0.22, 0.105]} c="#474842" />
            <Shape p={[0, -0.39, 0.065]} s={[0.12, 0.095, 0.2]} c="#493225" />
          </group>
        </group>
        <Shape p={[0, 0.91, 0]} s={[0.29, 0.41, 0.18]} c={npc.color} />
        <Shape p={[0, 0.67, 0]} s={[0.25, 0.13, 0.18]} c="#453423" />
        <Round p={[0, 0.66, 0]} s={[0.255, 0.045, 0.19]} c="#453423" />
        <Box p={[0, 0.66, 0.18]} s={[0.11, 0.07, 0.035]} c="#d1b66b" />
        <Shape p={[0, 1.3, 0]} s={[0.1, 0.11, 0.1]} c={skin} />
        <group ref={head} position={[0, 1.49, 0]} scale={0.6}>
          <Shape p={[0, 0, 0]} s={[0.22, 0.28, 0.21]} c={skin} />
          <mesh position={[0, 0.15, -0.015]}>
            <sphereGeometry args={[0.232, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hair} roughness={0.95} />
          </mesh>
          <Shape p={[-0.22, -0.035, 0]} s={[0.035, 0.075, 0.055]} c={skin} />
          <Shape p={[0.22, -0.035, 0]} s={[0.035, 0.075, 0.055]} c={skin} />
          {[-1, 1].map((side) => (
            <group key={side}>
              <Shape p={[side * 0.082, 0.015, 0.195]} s={[0.035, 0.026, 0.018]} c="#ded5b9" />
              <Orb p={[side * 0.082, 0.015, 0.213]} radius={0.014} c="#252722" />
              <Box p={[side * 0.08, 0.075, 0.183]} s={[0.088, 0.014, 0.016]} c={hair} />
            </group>
          ))}
          <Shape p={[0, -0.08, 0.215]} s={[0.048, 0.072, 0.054]} c={skin} />
          <Shape p={[0, -0.175, 0.179]} s={[0.075, 0.012, 0.015]} c="#75493e" />
          {npc.id === 'npc-1' && <Shape p={[0, -0.18, 0.125]} s={[0.16, 0.1, 0.11]} c={hair} />}
        </group>
        <Shape p={[0, 1.1, 0.153]} s={[0.16, 0.075, 0.035]} c="#e6d4b3" />
        {npc.id === 'npc-1' && (
          <group>
            <Box p={[0, 0.86, 0.195]} s={[0.36, 0.48, 0.05]} c="#d4c6a1" />
            <Box p={[0, 0.54, 0.19]} s={[0.39, 0.16, 0.06]} c="#d4c6a1" />
            <Box p={[-0.19, 1.07, 0.08]} s={[0.065, 0.28, 0.06]} c="#d4c6a1" />
            <Box p={[0.19, 1.07, 0.08]} s={[0.065, 0.28, 0.06]} c="#d4c6a1" />
          </group>
        )}
        {npc.role === 'Scholar' && (
          <mesh position={[0, 1.7, -0.04]}>
            <coneGeometry args={[0.25, 0.42, 8]} />
            <meshStandardMaterial color={npc.color} />
          </mesh>
        )}
        {npc.role === 'Ranger' && <Round p={[0, 1.72, 0]} s={[0.32, 0.08, 0.3]} c="#476241" />}
        <group ref={leftArm} position={[-0.3, 1.05, 0]}>
          <Shape p={[-0.025, -0.16, 0]} s={[0.11, 0.23, 0.12]} c={npc.color} />
          <Shape p={[0, -0.39, 0]} s={[0.08, 0.16, 0.09]} c={skin} />
          <Orb p={[0, -0.54, 0]} radius={0.075} c={skin} />
        </group>
        <group ref={rightArm} position={[0.3, 1.05, 0]}>
          <Shape p={[0.025, -0.16, 0]} s={[0.11, 0.23, 0.12]} c={npc.color} />
          <Shape p={[0, -0.39, 0]} s={[0.08, 0.16, 0.09]} c={skin} />
          <Orb p={[0, -0.54, 0]} radius={0.075} c={skin} />
          {(serving || (performing && npc.action === 'drink')) && <Mug p={[0, -0.56, 0.08]} />}
          {performing && npc.action === 'trade' && (
            <Round p={[0, -0.4, 0.08]} s={[0.07, 0.2, 0.07]} c="#75a884" />
          )}
          {performing && npc.action === 'craft_instrument' && (
            <group position={[0, -0.4, 0.09]}>
              <Box p={[0, 0, 0]} s={[0.06, 0.28, 0.06]} c="#67452b" />
              <Box p={[0, -0.13, 0]} s={[0.2, 0.1, 0.1]} c="#939894" />
            </group>
          )}
        </group>
        {performing && npc.action === 'play_music' && npc.instrument === 'lute' && (
          <group position={[0.08, 0.9, 0.32]} rotation={[0, 0, -0.6]}>
            <mesh geometry={sphere} material={material('#bb8548')} scale={[0.22, 0.3, 0.08]} />
            <Box p={[0, 0.35, 0]} s={[0.065, 0.48, 0.06]} c="#664329" />
            <Box p={[0, 0.15, 0.08]} s={[0.025, 0.62, 0.01]} c="#d4c298" />
          </group>
        )}
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
      dpr={quality === 'high' ? [1, 1.5] : 1}
      camera={{ position: [15.5, 12.5, 20], fov: 42 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
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
      <Camera view={view} selected={selected} world={world} reduced={reduced} />
      <Metrics />
    </Canvas>
  );
}
