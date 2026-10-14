import { readFile } from 'node:fs/promises';
import { AnimationMixer, LoopOnce, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { expect, it } from 'vitest';
import { alignSeatClip } from '../apps/web/seat-animation';
import { bindHeadClip } from '../apps/web/head-clipping';

it('places the actual seated pelvis on the seat and keeps the spine clear of the backrest', async () => {
  const bytes = await readFile('public/models/characters/quaternius/tavern-actions.glb');
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  const pelvis = gltf.scene.getObjectByName('pelvis')!;
  const spine = gltf.scene.getObjectByName('spine_03')!;
  const head = gltf.scene.getObjectByName('Head')!;
  const headClip = bindHeadClip(head);
  const restClearance = headClip.plane.distanceToPoint(head.getWorldPosition(new Vector3()));
  for (const source of gltf.animations.filter((clip) => clip.name.startsWith('Sitting_'))) {
    const original = Array.from(source.tracks.find((track) => track.name === 'pelvis.position')!.values);
    const mixer = new AnimationMixer(gltf.scene);
    const clip = alignSeatClip(source);
    const action = mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    for (let frame = 0; frame <= 60; frame++) {
      mixer.setTime((clip.duration * frame) / 60);
      gltf.scene.updateMatrixWorld(true);
      const hip = pelvis.getWorldPosition(new Vector3());
      const chest = spine.getWorldPosition(new Vector3());
      headClip.update();
      expect(headClip.plane.distanceToPoint(head.getWorldPosition(new Vector3()))).toBeCloseTo(
        restClearance,
        5,
      );
      // Include a 12 cm torso radius; the front of the backrest is at -0.17 m.
      expect(chest.z - 0.12, `${clip.name} frame ${frame}`).toBeGreaterThan(-0.17);
      if (hip.y < 0.56) expect(Math.abs(hip.z)).toBeLessThan(0.025);
    }
    expect(Array.from(source.tracks.find((track) => track.name === 'pelvis.position')!.values)).toEqual(
      original,
    );
    mixer.stopAllAction();
  }
});
