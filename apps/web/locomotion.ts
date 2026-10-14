export function locomotionBlend(speed: number) {
  const weight = Math.max(0, Math.min(1, speed / 0.35));
  return {
    walkWeight: weight * weight * (3 - 2 * weight),
    cadence: Math.max(0.15, Math.min(1.5, speed / 0.95)),
  };
}
