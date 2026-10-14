import { describe, expect, it } from 'vitest';
import { chairPullback, initialChairMotion, stepChairMotion } from '../apps/web/chair-motion';

describe('chair seating motion', () => {
  it('slides back for arrival, settles under the guest, and clears before departure', () => {
    const arrival = stepChairMotion(initialChairMotion, 'approaching', 0.05);
    expect(arrival.state.phase).toBe('approaching');
    expect(arrival.offset).toBe(-chairPullback);

    const seated = stepChairMotion(arrival.state, 'seated', 0.05);
    expect(seated.state.phase).toBe('seated');
    expect(seated.offset).toBe(0);

    const departure = stepChairMotion(seated.state, 'none', 0.05);
    expect(departure.state.phase).toBe('leaving');
    expect(departure.offset).toBe(-chairPullback);
    expect(stepChairMotion(departure.state, 'none', 0.35).offset).toBe(0);
    expect(stepChairMotion(departure.state, 'none', 0.8).state.phase).toBe('idle');
  });
});
