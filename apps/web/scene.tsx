import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import {
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Group,
  PointLight,
  Vector3,
} from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import type { PublicInhabitant, PublicWorld } from '../../packages/shared/world';
import { seats, tables } from '../../packages/shared/layout';

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
  return (
    <group position={[x, 0, z]}>
      <Round p={[0, 0.48, 0]} s={[0.3, 0.13, 0.3]} c="#865d39" />
      {[-1, 1].flatMap((a) =>
        [-1, 1].map((b) => (
          <Box key={`${a}${b}`} p={[a * 0.17, 0.25, b * 0.17]} s={[0.07, 0.45, 0.07]} c="#5e402b" />
        )),
      )}
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
    <group position={[-6.4, 0, 2.6]}>
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
function Tavern({ reduced }: { reduced: boolean }) {
  return (
    <group>
      <Box p={[0, -0.35, 0]} s={[15.2, 0.7, 12.2]} c="#352c23" />
      {Array.from({ length: 30 }, (_, i) => (
        <Box
          key={i}
          p={[0, 0, -5.8 + i * 0.4]}
          s={[14.95, 0.09, 0.38]}
          c={['#795737', '#88613d', '#715035', '#936b42'][i % 4]}
        />
      ))}
      <Box p={[0, 2, -6]} s={[15, 4, 0.3]} c="#82755a" />
      <Box p={[-7.5, 2, 0]} s={[0.3, 4, 12]} c="#82755a" />
      {[-7.1, -2.4, 2.2, 7.1].map((x) => (
        <Box key={x} p={[x, 2, -5.77]} s={[0.3, 4, 0.35]} c="#423024" />
      ))}
      <Box p={[0, 3.8, -5.74]} s={[15, 0.35, 0.4]} c="#453125" />
      <Box p={[-7.25, 3.8, 0]} s={[0.35, 0.35, 12]} c="#453125" />
      {[-5.4, -0.1].map((x) => (
        <group key={x}>
          <Box p={[x, 2.35, -5.78]} s={[1.9, 1.8, 0.12]} c="#342d26" />
          <Box p={[x, 2.35, -5.67]} s={[1.55, 1.5, 0.06]} c="#3f636d" />
          <Box p={[x, 2.35, -5.6]} s={[0.07, 1.5, 0.08]} c="#b3905c" />
          <Box p={[x, 2.35, -5.6]} s={[1.55, 0.07, 0.08]} c="#b3905c" />
          <Box p={[x, 1.4, -5.5]} s={[2.1, 0.15, 0.5]} c="#58402b" />
        </group>
      ))}
      <Box p={[-7.24, 1.8, -2.5]} s={[0.1, 2.5, 1.9]} c="#523725" />
      <Box p={[-7.14, 1.8, -2.5]} s={[0.1, 2.1, 1.5]} c="#755032" />
      <Box p={[3.8, 0.72, -4.6]} s={[5.3, 1.44, 1.25]} c="#724826" />
      <Box p={[3.8, 1.53, -4.6]} s={[5.55, 0.17, 1.5]} c="#bd8c55" />
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} p={[1.25 + i * 0.45, 0.75, -3.93]} s={[0.025, 1.25, 0.04]} c="#a87940" />
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
        <Mug key={x} p={[x, 1.74, -4.2]} />
      ))}
      <Candle x={1.25} y={1.63} z={-4.7} />
      <Candle x={6.1} y={1.63} z={-4.7} />
      <Box p={[-5, 0.18, -4.55]} s={[3.3, 0.36, 2.2]} c="#875b39" />
      {[-5.8, -4.4].map((x) => (
        <Box key={x} p={[x, 0.4, -5.4]} s={[0.08, 0.8, 0.08]} c="#b99659" />
      ))}
      <mesh position={[-4.9, 0.38, -4.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.65]} />
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
      <Barrel x={-6.65} z={-4.8} scale={0.75} />
      <Box p={[6.2, 0.5, 4.3]} s={[1.6, 0.9, 0.65]} c="#675038" />
      <Box p={[6.2, 1.01, 4.3]} s={[1.7, 0.14, 0.72]} c="#a07546" />
      <Box p={[6.2, 0.72, 3.96]} s={[0.18, 0.18, 0.04]} c="#bb9c56" />
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
    rightLeg = useRef<Group>(null);
  const initial = useRef<[number, number, number]>([npc.position[0], 0, npc.position[1]]),
    [hover, setHover] = useState(false);
  const skin = ['#d8b58b', '#a87b59', '#bd916b', '#e2be99'][Number(npc.id.slice(4)) % 4];
  const moving = npc.phase === 'walking',
    performing = npc.phase === 'performing';
  useFrame(({ clock }, dt) => {
    if (!group.current || !body.current) return;
    const t = clock.elapsedTime + Number(npc.id.slice(4)),
      smooth = Math.min(1, dt * 10);
    group.current.position.x += (npc.position[0] - group.current.position.x) * smooth;
    group.current.position.z += (npc.position[1] - group.current.position.z) * smooth;
    const onStage = npc.position[0] < -3.5 && npc.position[1] < -3.5;
    group.current.position.y = onStage ? 0.36 : 0.05;
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
    } else if (npc.action === 'play_music') facing = 0.15;
    group.current.rotation.y = facing;
    const dancing = performing && npc.action === 'dance',
      seated = performing && npc.action === 'rest' && npc.id !== 'npc-1';
    body.current.position.y = seated
      ? -0.25
      : reduced
        ? 0
        : dancing
          ? Math.abs(Math.sin(t * 4)) * 0.15
          : moving
            ? Math.abs(Math.sin(t * 7)) * 0.035
            : Math.sin(t * 1.5) * 0.007;
    body.current.rotation.z = !reduced && dancing ? Math.sin(t * 3) * 0.13 : 0;
    if (leftLeg.current)
      leftLeg.current.rotation.x = seated ? -1.1 : !reduced && moving ? Math.sin(t * 7) * 0.45 : 0;
    if (rightLeg.current)
      rightLeg.current.rotation.x = seated ? -1.1 : !reduced && moving ? -Math.sin(t * 7) * 0.45 : 0;
    if (leftArm.current)
      leftArm.current.rotation.x =
        performing && npc.action === 'play_music'
          ? -0.7
          : dancing
            ? -1.8
            : !reduced && moving
              ? -Math.sin(t * 7) * 0.35
              : 0;
    if (rightArm.current)
      rightArm.current.rotation.x =
        performing && npc.action === 'drink'
          ? -1.3
          : performing && npc.action === 'trade'
            ? -0.8
            : !reduced && performing && ['chat', 'play_music'].includes(npc.action)
              ? -0.45 + Math.sin(t * 4) * 0.25
              : dancing
                ? -1.8
                : !reduced && moving
                  ? Math.sin(t * 7) * 0.35
                  : 0;
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
        <group ref={leftLeg} position={[-0.12, 0.52, 0]}>
          <Box p={[0, -0.22, 0]} s={[0.16, 0.44, 0.18]} c="#3e3b35" />
          <Box p={[0, -0.45, 0.06]} s={[0.19, 0.13, 0.3]} c="#493225" />
        </group>
        <group ref={rightLeg} position={[0.12, 0.52, 0]}>
          <Box p={[0, -0.22, 0]} s={[0.16, 0.44, 0.18]} c="#3e3b35" />
          <Box p={[0, -0.45, 0.06]} s={[0.19, 0.13, 0.3]} c="#493225" />
        </group>
        <Round p={[0, 0.86, 0]} s={[0.245, 0.64, 0.245]} c={npc.color} />
        <Round p={[0, 0.64, 0]} s={[0.252, 0.07, 0.252]} c="#453423" />
        <Box p={[0, 0.64, 0.245]} s={[0.1, 0.07, 0.035]} c="#d1b66b" />
        <Orb p={[0, 1.36, 0]} radius={0.225} c={skin} />
        <Orb p={[0, 1.47, -0.055]} radius={0.22} c={Number(npc.id.slice(4)) % 3 ? '#443024' : '#a08054'} />
        <Box p={[-0.08, 1.37, 0.2]} s={[0.035, 0.045, 0.015]} c="#282b26" />
        <Box p={[0.08, 1.37, 0.2]} s={[0.035, 0.045, 0.015]} c="#282b26" />
        <Orb p={[0, 1.32, 0.22]} radius={0.045} c={skin} />
        {npc.role === 'Scholar' && (
          <mesh position={[0, 1.7, -0.04]}>
            <coneGeometry args={[0.25, 0.42, 8]} />
            <meshStandardMaterial color={npc.color} />
          </mesh>
        )}
        {npc.role === 'Ranger' && <Round p={[0, 1.54, 0]} s={[0.33, 0.09, 0.3]} c="#476241" />}
        <group ref={leftArm} position={[-0.3, 1.05, 0]}>
          <Box p={[0, -0.16, 0]} s={[0.13, 0.36, 0.15]} c={npc.color} />
          <Orb p={[0, -0.4, 0]} radius={0.085} c={skin} />
        </group>
        <group ref={rightArm} position={[0.3, 1.05, 0]}>
          <Box p={[0, -0.16, 0]} s={[0.13, 0.36, 0.15]} c={npc.color} />
          <Orb p={[0, -0.4, 0]} radius={0.085} c={skin} />
          {performing && npc.action === 'drink' && <Mug p={[0, -0.4, 0.08]} />}{' '}
          {performing && npc.action === 'trade' && (
            <Round p={[0, -0.4, 0.08]} s={[0.07, 0.2, 0.07]} c="#75a884" />
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
        : view === 'stage'
          ? new Vector3(-4.8, 1.1, -3.5)
          : view === 'follow' && n
            ? new Vector3(n.position[0], 1, n.position[1])
            : new Vector3(0, 0.8, -0.4);
    const position =
      view === 'hearth'
        ? new Vector3(3, 5, 10)
        : view === 'stage'
          ? new Vector3(1, 4.5, 5.5)
          : view === 'follow' && n
            ? new Vector3(n.position[0] + 5, 4, n.position[1] + 7)
            : new Vector3(12, 10.5, 15.5);
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
      target={[0, 0.8, -0.4]}
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
      camera={{ position: [12, 10.5, 15.5], fov: 42 }}
      fallback={<div className="scene-error">WebGL is unavailable. You can still follow the chronicle.</div>}
    >
      <color attach="background" args={['#22251e']} />
      <fog attach="fog" args={['#22251e', 25, 48]} />
      <ambientLight color="#ffdfb0" intensity={0.7} />
      <hemisphereLight args={['#b6c2c4', '#704a2e', 0.8]} />
      <directionalLight
        position={[1, 12, 6]}
        color="#ffe0a5"
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
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
