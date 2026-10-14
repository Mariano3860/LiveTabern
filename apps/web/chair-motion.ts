export type ChairActivity = 'approaching' | 'seated' | 'departing' | 'none';
export type ChairMotionPhase = 'idle' | 'approaching' | 'seated' | 'leaving';

export interface ChairMotionState {
  phase: ChairMotionPhase;
  elapsed: number;
}

export const initialChairMotion: ChairMotionState = { phase: 'idle', elapsed: 0 };
export const chairPullback = 0.14;
const leaveDuration = 1.65;
const leavePullDuration = 1.2;

export function stepChairMotion(
  state: ChairMotionState,
  activity: ChairActivity,
  delta: number,
): { state: ChairMotionState; offset: number } {
  if (activity === 'departing') return { state: { phase: 'leaving', elapsed: 0 }, offset: -chairPullback };
  if (state.phase === 'leaving') {
    const elapsed = state.elapsed + delta;
    if (elapsed >= leaveDuration) return { state: initialChairMotion, offset: 0 };
    return {
      state: { phase: 'leaving', elapsed },
      offset: elapsed < leavePullDuration ? -chairPullback : 0,
    };
  }
  if (activity === 'seated') return { state: { phase: 'seated', elapsed: 0 }, offset: 0 };
  if (activity === 'approaching')
    return { state: { phase: 'approaching', elapsed: 0 }, offset: -chairPullback };
  if (state.phase === 'seated') return { state: { phase: 'leaving', elapsed: 0 }, offset: -chairPullback };
  return { state: initialChairMotion, offset: 0 };
}
