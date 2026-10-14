import type { AnimationClip } from 'three';

// Quaternius authored these clips with the seat 33.1 cm behind the actor origin.
// The tavern's confirmed rest destination is the seat centre instead.
export function alignSeatClip(source: AnimationClip, forward = 0.331): AnimationClip {
  if (!source.name.startsWith('Sitting_')) return source;
  const clip = source.clone();
  const pelvis = clip.tracks.find((track) => track.name === 'pelvis.position');
  if (!pelvis) throw new Error(`Missing pelvis translation in ${source.name}`);
  // The source armature rotates local +Y into world -Z (backwards).
  for (let index = 1; index < pelvis.values.length; index += 3) pelvis.values[index] -= forward;
  return clip;
}

export function standingSeatClip(source: AnimationClip): AnimationClip {
  const clip = source.clone();
  clip.name = 'Sitting_Stand_Idle';
  // The relaxed idle has a trailing foot 27 cm behind its origin.
  return alignSeatClip(clip, 0.6);
}
