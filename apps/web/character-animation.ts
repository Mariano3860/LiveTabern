import type { Action } from '../../packages/shared/world';

export type CharacterAnimationName =
  | 'Consume'
  | 'Dance_Loop'
  | 'Fixing_Kneeling'
  | 'Idle_FoldArms_Loop'
  | 'Idle_Lantern_Loop'
  | 'Idle_Loop'
  | 'Idle_Talking_Loop'
  | 'Idle_Torch_Loop'
  | 'Interact'
  | 'PickUp_Table'
  | 'Sitting_Enter'
  | 'Sitting_Exit'
  | 'Sitting_Stand_Idle'
  | 'Sitting_Idle_Loop'
  | 'Sitting_Talking_Loop'
  | 'Walk_Loop'
  | 'Yes';

export const animationByAction = {
  wander: 'Walk_Loop',
  rest: 'Sitting_Idle_Loop',
  drink: 'Consume',
  chat: 'Idle_Talking_Loop',
  trade: 'Interact',
  play_music: 'Idle_Lantern_Loop',
  dance: 'Dance_Loop',
  craft_instrument: 'Fixing_Kneeling',
} as const satisfies Record<Action, CharacterAnimationName>;

export interface CharacterAnimationPlan {
  mode: string;
  clip: CharacterAnimationName;
  loop: boolean;
  speed: number;
  after?: CharacterAnimationName;
  repeat?: CharacterAnimationName;
  repeatDelay?: number;
}

export function characterAnimationFor({
  action,
  moving,
  sitting,
  serving,
  wasSitting,
  variant,
  instrument,
}: {
  action: Action;
  moving: boolean;
  sitting: boolean;
  serving: boolean;
  wasSitting: boolean;
  variant: number;
  instrument?: 'voice' | 'lute' | 'none';
}): CharacterAnimationPlan {
  const walkSpeed = 0.82 + (variant % 4) * 0.035;
  const idle = 'Idle_Loop';

  if (moving)
    return wasSitting
      ? { mode: 'leaving-seat', clip: 'Sitting_Exit', loop: false, after: 'Walk_Loop', speed: 0.86 }
      : { mode: 'walking', clip: 'Walk_Loop', loop: true, speed: walkSpeed };
  if (serving)
    return {
      mode: 'serving',
      clip: 'PickUp_Table',
      loop: false,
      after: 'Idle_Loop',
      speed: 0.86,
    };
  if (sitting) {
    const seated = action === 'chat' ? 'Sitting_Talking_Loop' : 'Sitting_Idle_Loop';
    return wasSitting
      ? { mode: action === 'chat' ? 'sitting-chat' : 'sitting-rest', clip: seated, loop: true, speed: 0.84 }
      : { mode: 'sitting-down', clip: 'Sitting_Enter', loop: false, after: seated, speed: 0.9 };
  }
  if (action === 'drink')
    return {
      mode: 'drinking',
      clip: 'Consume',
      loop: false,
      after: 'Idle_Loop',
      repeat: 'Consume',
      repeatDelay: 2.35 + (variant % 5) * 0.23,
      speed: 0.84,
    };
  if (action === 'trade')
    return {
      mode: 'trading',
      clip: 'Interact',
      loop: false,
      after: 'Idle_Talking_Loop',
      speed: 0.88,
    };
  if (action === 'chat') return { mode: 'chatting', clip: 'Idle_Talking_Loop', loop: true, speed: 0.85 };
  if (action === 'play_music' && instrument === 'voice')
    return { mode: 'singing', clip: 'Idle_Talking_Loop', loop: true, speed: 0.9 };
  if (action === 'play_music')
    return { mode: 'playing-music', clip: 'Idle_Lantern_Loop', loop: true, speed: 0.92 };
  if (action === 'dance') return { mode: 'dancing', clip: 'Dance_Loop', loop: true, speed: 0.84 };
  if (action === 'craft_instrument')
    return { mode: 'crafting', clip: 'Fixing_Kneeling', loop: true, speed: 0.88 };
  return { mode: action === 'rest' ? 'resting' : 'wandering', clip: idle, loop: true, speed: 0.82 };
}
