// Adapted from pmndrs/maath's MIT-licensed critical spring solver.
// Source revision and notice: assets/MAATH_MOTION_LICENSE.txt.
export interface MotionSpring {
  value: number;
  velocity: number;
}
export function stepMotionSpring(state: MotionSpring, target: number, smoothTime: number, delta: number) {
  const omega = 2 / Math.max(0.0001, smoothTime);
  const e = Math.exp(-omega * Math.min(delta, 0.25));
  const dt = Math.min(delta, 0.25);
  const displacement = state.value - target;
  state.value = target + e * (1 + omega * dt) * displacement + e * dt * state.velocity;
  state.velocity = -e * omega * omega * dt * displacement + e * (1 - omega * dt) * state.velocity;
}
