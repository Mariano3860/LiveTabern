import { describe, expect, it } from 'vitest';
import { actions } from '../packages/shared/world';
import { animationByAction, characterAnimationFor } from '../apps/web/character-animation';

describe('tavern animation catalogue', () => {
  it('has a real clip for every enabled NPC action', () => {
    expect(Object.keys(animationByAction).sort()).toEqual([...actions].sort());
    expect(Object.values(animationByAction)).toContain('Consume');
  });

  it('uses a slow in-place walk and plays the seat transitions', () => {
    expect(
      characterAnimationFor({
        action: 'wander',
        moving: true,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 3,
      }),
    ).toMatchObject({ clip: 'Walk_Loop', loop: true, mode: 'walking' });
    expect(
      characterAnimationFor({
        action: 'wander',
        moving: true,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 3,
      }).speed,
    ).toBeCloseTo(0.925);
    expect(
      characterAnimationFor({
        action: 'rest',
        moving: false,
        sitting: true,
        serving: false,
        wasSitting: false,
        variant: 1,
      }),
    ).toMatchObject({ clip: 'Sitting_Enter', after: 'Sitting_Idle_Loop', loop: false });
    expect(
      characterAnimationFor({
        action: 'rest',
        moving: true,
        sitting: false,
        serving: false,
        wasSitting: true,
        variant: 1,
      }),
    ).toMatchObject({ clip: 'Sitting_Exit', after: 'Walk_Loop', loop: false });
  });

  it('gives sipping a pause between repeated sips and distinct clips for social, music, and work', () => {
    const drink = characterAnimationFor({
      action: 'drink',
      moving: false,
      sitting: false,
      serving: false,
      wasSitting: false,
      variant: 4,
    });
    expect(drink).toMatchObject({
      clip: 'Consume',
      after: 'Idle_Torch_Loop',
      repeat: 'Consume',
      loop: false,
    });
    expect(drink.repeatDelay).toBeGreaterThan(2.35);
    expect(
      characterAnimationFor({
        action: 'chat',
        moving: false,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 1,
      }).clip,
    ).toBe('Idle_Talking_Loop');
    expect(
      characterAnimationFor({
        action: 'trade',
        moving: false,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 1,
      }).clip,
    ).toBe('Interact');
    expect(
      characterAnimationFor({
        action: 'play_music',
        moving: false,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 1,
        instrument: 'lute',
      }).clip,
    ).toBe('Idle_Lantern_Loop');
    expect(
      characterAnimationFor({
        action: 'play_music',
        moving: false,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 1,
        instrument: 'voice',
      }).clip,
    ).toBe('Idle_Talking_Loop');
    expect(
      characterAnimationFor({
        action: 'dance',
        moving: false,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 1,
      }).clip,
    ).toBe('Dance_Loop');
    expect(
      characterAnimationFor({
        action: 'craft_instrument',
        moving: false,
        sitting: false,
        serving: false,
        wasSitting: false,
        variant: 1,
      }).clip,
    ).toBe('Fixing_Kneeling');
  });
});
