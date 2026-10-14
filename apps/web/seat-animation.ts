import type { AnimationClip } from 'three';

// Quaternius authored these clips with the seat 33.1 cm behind the actor origin.
// The tavern's confirmed rest destination is the seat centre instead.
export function alignSeatClip(source: AnimationClip): AnimationClip {
  if (!source.name.startsWith('Sitting_')) return source;
  const clip = source.clone();
  const pelvis = clip.tracks.find((track) => track.name === 'pelvis.position');
  if (!pelvis) throw new Error(`Missing pelvis translation in ${source.name}`);
  // The source armature rotates local +Y into world -Z (backwards).
  for (let index = 1; index < pelvis.values.length; index += 3) pelvis.values[index] -= 0.331;
  return clip;
}
