import {
  actions,
  type Action,
  type Inhabitant,
  type Point,
  type World,
  type WorldEvent,
} from '../shared/world';
import { crowdDetour } from '../navigation/crowd-detour';
import {
  barSpots,
  danceSpots,
  distance,
  hearthSpots,
  isWalkable,
  isTravelWalkable,
  isTravelSegmentClear,
  usesChairPose,
  seats,
  stageSpots,
  workbenchSpot,
} from '../shared/layout';
export const CRAFT_DURATION = 12000;
export const SEAT_DEPARTURE_DURATION = 1800;
const steeringOffsets = [
  Math.PI / 12,
  -Math.PI / 12,
  Math.PI / 6,
  -Math.PI / 6,
  Math.PI / 3,
  -Math.PI / 3,
  Math.PI / 2,
  -Math.PI / 2,
];
export interface Navigation {
  path(start: Point, end: Point): Point[];
}
const cast = [
  ['Borin', 'Innkeeper', 'A patient host who remembers your favorite drink.', '#ac7948'],
  ['Elena', 'Singer', 'Collects melodies and stories from passing travelers.', '#af5368'],
  ['Finch', 'Lute player', 'A shy musician searching for a second voice.', '#58947e'],
  ['Mara', 'Merchant', 'Arrived with tonics, bright ribbons, and a talent for bargaining.', '#c3984c'],
  ['Orin', 'Ranger', 'Prefers the quiet corner, but never misses a good song.', '#53734e'],
  ['Tilda', 'Herbalist', 'Listens carefully and remembers small acts of kindness.', '#8b9957'],
  ['Rook', 'Carpenter', 'Finds comfort in sturdy furniture and honest company.', '#a87559'],
  ['Sylva', 'Scholar', 'Writes down the little things others forget.', '#737fae'],
  ['Dain', 'Guard', 'Off duty, with a weakness for dancing.', '#6c899c'],
  ['Nessa', 'Traveler', 'Arrived with dusty boots and a handful of tales.', '#c07954'],
  ['Pip', 'Apprentice', 'Curious about every instrument in the room.', '#c6a76e'],
  ['Asha', 'Cook', 'Makes time for company after a long evening at the stove.', '#ad6047'],
  ['Garrick', 'Blacksmith', 'Has a booming laugh and very little patience for bad ale.', '#7b8588'],
  ['Lumi', 'Dancer', 'Hears a rhythm in almost everything.', '#9672ac'],
  ['Edda', 'Storyteller', 'Has crossed more roads than she can count.', '#a49070'],
];
const starts: Point[] = [
  [3.3, -5.1],
  [-5.7, -4.35],
  [-4.55, -4.35],
  [5, 2.8],
  [-5.3, 3.6],
  [-4.2, 0.2],
  [1, 2],
  [4, 0.5],
  [-3.4, -2.1],
  [5.5, 1],
  [-1.55, 3.55],
  [4.5, -3.2],
  [-2.6, 1.65],
  [-4.6, -2.15],
  [1.55, 3.55],
];
export function createWorld(now: number, seed = 1729): World {
  const world: World = {
    schemaVersion: 1,
    id: 'wandering-ember',
    version: 0,
    time: now,
    startedAt: now,
    rng: seed,
    sequence: 0,
    commandSequence: 0,
    events: [],
    stock: 240,
    consumedAle: 0,
    suppliedAle: 240,
    supplyDay: Math.floor(now / 86400000),
    economyHour: Math.floor(now / 3600000),
    workshop: { wood: 0, strings: 0, craftedLutes: 0, suppliedWood: 0, suppliedStrings: 0, delivered: false },
    opportunities: [],
    demands: [],
    directorNext: now + 15000,
    directorEnabled: true,
    completedCommands: [],
    directorTurn: 0,
    disabledActions: [],
    musicGroups: [],
    musicNext: now + 1000,
    inhabitants: cast.map(([name, role, description, color], i) => ({
      id: `npc-${i + 1}`,
      name,
      role,
      description,
      color,
      position: [...starts[i]],
      target: [...starts[i]],
      action: 'rest',
      energy: 65 + i,
      thirst: 25 + i * 3,
      coins: 16 + i,
      sociability: 0.25 + (i % 5) * 0.15,
      creativity: i === 1 || i === 2 ? 0.95 : 0.3 + (i % 4) * 0.15,
      mood: 65,
      socialNeed: 20 + i * 3,
      inventory: { ale: 0, tonic: i === 3 ? 24 : 0 },
      instrument: i === 1 ? 'voice' : i === 2 ? 'lute' : 'none',
      memories: [],
      relationships: {},
      plan: null,
      lastCommand: 0,
      nextDecision: now + 1000 + i * 900,
    })),
  };
  emit(world, 'system', [], 'The hearth is lit. Fifteen travelers settle into the Wandering Ember.');
  return world;
}
export function random(world: World) {
  world.rng = (Math.imul(1664525, world.rng) + 1013904223) >>> 0;
  return world.rng / 4294967296;
}
export function emit(
  world: World,
  category: WorldEvent['category'],
  actors: string[],
  text: string,
  detail?: string,
) {
  const event: WorldEvent = {
    id: `${world.id}:${++world.sequence}`,
    sequence: world.sequence,
    time: world.time,
    actorId: actors[0] ?? '',
    actors,
    category,
    text,
    detail,
  };
  world.events.push(event);
  world.events = world.events.slice(-240);
  if (!['wander', 'rest', 'system'].includes(category))
    for (const id of actors) {
      const npc = world.inhabitants.find((n) => n.id === id);
      if (npc) {
        npc.memories.push({
          eventId: event.id,
          time: event.time,
          summary: text,
          with: actors.filter((a) => a !== id),
        });
        npc.memories = npc.memories.slice(-12);
      }
    }
  return event;
}
export function demand(world: World, npcId: string, id: string, reason: string) {
  const existing = world.demands.find((d) => d.id === id);
  if (existing) {
    existing.count++;
    existing.lastSeen = world.time;
    existing.priority = Math.min(100, 40 + existing.count * 5);
  } else {
    world.demands.push({ id, actorId: npcId, count: 1, reason, priority: 45, lastSeen: world.time });
    emit(
      world,
      'capability',
      [npcId],
      `${world.inhabitants.find((n) => n.id === npcId)?.name ?? 'A traveler'} hopes to ${id.replaceAll('_', ' ')}.`,
      'This ability is not available; no world effect was applied.',
    );
  }
}
export function canExecute(world: World, npc: Inhabitant, action: Action, partnerId?: string): string | null {
  if (!actions.includes(action) || world.disabledActions.includes(action)) return 'Capability is unavailable';
  const partner = world.inhabitants.find((n) => n.id === partnerId);
  if (action === 'craft_instrument') {
    const unavailable = craftPrerequisite(world, npc);
    if (unavailable) return unavailable;
    if (
      npc.plan?.action !== action ||
      npc.plan.phase !== 'performing' ||
      npc.plan.until === 0 ||
      world.time < npc.plan.until
    )
      return 'Must finish working at the bench';
  }
  if (action === 'drink') {
    if (npc.coins < 1 || world.stock < 1) return 'No coins or ale available';
    if (!barSpots.some((p) => distance(npc.position, p) < 0.55)) return 'Must reach the bar';
  }
  if (action === 'chat' || action === 'trade') {
    if (!partner || partner.id === npc.id || distance(npc.position, partner.position) > 1.5)
      return 'Partner must be nearby';
    if (partner.plan && partner.plan.targetId !== npc.id) return 'Partner is busy';
  }
  if (action === 'trade' && (!partner || partner.inventory.tonic < 1 || npc.coins < 2))
    return 'No stock or payment';
  if (
    action === 'play_music' &&
    (npc.instrument === 'none' || !stageSpots.some((p) => distance(npc.position, p) < 0.65))
  )
    return 'Must reach the stage with an instrument or voice';
  if (
    action === 'dance' &&
    !world.inhabitants.some(
      (n) => n.action === 'play_music' && n.plan?.phase === 'performing' && n.plan.applied,
    )
  )
    return 'There must be live music';
  return null;
}
function craftPrerequisite(world: World, npc: Inhabitant): string | null {
  if (npc.role !== 'Apprentice' || npc.instrument !== 'none')
    return 'Only an apprentice without an instrument needs this kit';
  if (npc.energy < 30) return 'Not enough energy';
  if (world.workshop.wood < 3 || world.workshop.strings < 1) return 'Missing wood or strings';
  if (distance(npc.position, workbenchSpot) >= 0.55) return 'Must reach the workbench';
  return null;
}
export function executeAction(
  world: World,
  npcId: string,
  action: Action,
  commandId: string,
  partnerId?: string,
): boolean {
  const npc = world.inhabitants.find((n) => n.id === npcId);
  const commandNumber = /^command:(\d+)$/.exec(commandId);
  if (
    !npc ||
    (commandNumber && Number(commandNumber[1]) <= npc.lastCommand) ||
    world.completedCommands.includes(commandId) ||
    (action === 'craft_instrument' && npc.plan?.id !== commandId) ||
    canExecute(world, npc, action, partnerId)
  )
    return false;
  const partner = world.inhabitants.find((n) => n.id === partnerId);
  world.completedCommands.push(commandId);
  world.completedCommands = world.completedCommands.slice(-2000);
  if (commandNumber) npc.lastCommand = Number(commandNumber[1]);
  npc.action = action;
  if (action === 'drink') {
    npc.coins--;
    world.inhabitants[0].coins++;
    world.stock--;
    world.consumedAle++;
    npc.thirst = Math.max(0, npc.thirst - 45);
    npc.mood = Math.min(100, npc.mood + 3);
    emit(
      world,
      action,
      [npc.id, world.inhabitants[0].id],
      `${npc.name} buys a mug of amber ale from Borin.`,
      '1 coin transferred; 1 serving consumed.',
    );
  } else if (action === 'chat' && partner) {
    const topics = [
      'the roads beyond the valley',
      'an old song they both remember',
      'the strange lights above the mountains',
      'a story from the market',
      'the warmth of a familiar hearth',
    ];
    const topic = topics[Math.floor(random(world) * topics.length)];
    npc.socialNeed = Math.max(0, npc.socialNeed - 30);
    partner.socialNeed = Math.max(0, partner.socialNeed - 25);
    npc.relationships[partner.id] = Math.min(100, (npc.relationships[partner.id] ?? 0) + 3);
    partner.relationships[npc.id] = Math.min(100, (partner.relationships[npc.id] ?? 0) + 3);
    partner.action = 'chat';
    partner.nextDecision = world.time + 9000;
    partner.plan = {
      id: `${commandId}:partner`,
      action: 'chat',
      targetId: npc.id,
      destination: [...partner.position],
      path: [],
      phase: 'performing',
      until: world.time + 8000,
      applied: true,
    };
    emit(
      world,
      action,
      [npc.id, partner.id],
      `${npc.name} and ${partner.name} talk about ${topic}.`,
      'A shared memory and a little more mutual trust.',
    );
  } else if (action === 'trade' && partner) {
    npc.coins -= 2;
    partner.coins += 2;
    partner.inventory.tonic--;
    npc.inventory.tonic++;
    partner.action = 'trade';
    partner.nextDecision = world.time + 7000;
    partner.plan = {
      id: `${commandId}:partner`,
      action: 'trade',
      targetId: npc.id,
      destination: [...partner.position],
      path: [],
      phase: 'performing',
      until: world.time + 6000,
      applied: true,
    };
    emit(
      world,
      action,
      [npc.id, partner.id],
      `${npc.name} buys a herbal tonic from ${partner.name}.`,
      '2 coins and 1 tonic transferred between owners.',
    );
  } else if (action === 'play_music') {
    npc.mood = Math.min(100, npc.mood + 4);
    emit(
      world,
      action,
      [npc.id],
      npc.instrument === 'voice'
        ? `${npc.name} sings “The Road Leads Home” by the hearthlight.`
        : `${npc.name} fills the common room with a wandering lute melody.`,
    );
  } else if (action === 'craft_instrument') {
    world.workshop.wood -= 3;
    world.workshop.strings--;
    world.workshop.craftedLutes++;
    npc.instrument = 'lute';
    npc.energy -= 10;
    npc.mood = Math.min(100, npc.mood + 10);
    const wish = world.demands.find((d) => d.id === action);
    if (wish) {
      wish.fulfilled = true;
      wish.priority = 0;
      wish.lastSeen = world.time;
      wish.reason = `${npc.name} built a lute and can now join the musicians.`;
    }
    emit(
      world,
      action,
      [npc.id],
      `${npc.name} finishes a handmade lute.`,
      '3 pieces of wood and 1 set of strings consumed; 1 lute created after twelve seconds of work.',
    );
  } else if (action === 'dance') {
    npc.energy = Math.max(0, npc.energy - 2);
    npc.mood = Math.min(100, npc.mood + 5);
    emit(world, action, [npc.id], `${npc.name} dances to the music drifting from the little stage.`);
  } else if (action === 'rest') emit(world, action, [npc.id], `${npc.name} takes a quiet moment to rest.`);
  return true;
}
export function executeIntent(
  world: World,
  npcId: string,
  action: string,
  commandId: string,
  partnerId?: string,
) {
  if (!actions.includes(action as Action)) {
    demand(world, npcId, action, 'An inhabitant requested an action outside the enabled catalogue.');
    return false;
  }
  return executeAction(world, npcId, action as Action, commandId, partnerId);
}
export function chooseAction(npc: Inhabitant, novelty: number, disabled: Action[] = []): Action {
  const scores: Record<Action, number> = {
    rest: ((100 - npc.energy) / 100) * 1.4,
    drink: npc.coins > 0 ? (npc.thirst / 100) * 1.4 : -1,
    play_music: npc.instrument !== 'none' ? npc.creativity * 0.85 : -1,
    dance: npc.role === 'Dancer' ? 0.8 : npc.role === 'Guard' ? 0.42 : 0.12,
    chat: (npc.socialNeed / 100) * (0.5 + npc.sociability),
    trade: npc.inventory.tonic === 0 && npc.coins > 3 ? 0.35 : -1,
    wander: 0.3,
    craft_instrument: npc.role === 'Apprentice' && npc.instrument === 'none' && npc.energy >= 31 ? 1.05 : -1,
  };
  // Bounded novelty varies choices without replacing needs and stable personality.
  return actions
    .filter((action) => !disabled.includes(action))
    .reduce(
      (best, action) =>
        scores[action] + ((novelty * (actions.indexOf(action) + 3)) % 1) * 0.3 >
        scores[best] + ((novelty * (actions.indexOf(best) + 3)) % 1) * 0.3
          ? action
          : best,
      actions.find((action) => !disabled.includes(action)) ?? 'wander',
    );
}
function available(world: World, points: Point[], npc: Inhabitant): Point | undefined {
  return points.find(
    (p) =>
      !world.inhabitants.some(
        (n) =>
          n.id !== npc.id &&
          (distance(n.position, p) < 0.55 || (n.plan && distance(n.plan.destination, p) < 0.6)),
      ),
  );
}
function planAction(world: World, npc: Inhabitant, navigation: Navigation) {
  if (
    actions.every((action) => world.disabledActions.includes(action)) ||
    (npc.id === 'npc-1' && world.disabledActions.includes('rest'))
  ) {
    npc.nextDecision = world.time + 4000;
    return;
  }
  let action = chooseAction(npc, random(world), world.disabledActions);
  let destination: Point | undefined, targetId: string | undefined;
  if (npc.id === 'npc-1') {
    action = 'rest';
    destination = [3.3, -5.1];
  } else if (action === 'drink') destination = available(world, barSpots, npc);
  else if (action === 'play_music') destination = available(world, stageSpots, npc);
  else if (action === 'craft_instrument' && world.workshop.wood >= 3 && world.workshop.strings >= 1)
    destination = available(world, [workbenchSpot], npc);
  else if (action === 'dance') {
    if (
      world.inhabitants.some(
        (n) => n.action === 'play_music' && n.plan?.phase === 'performing' && n.plan.applied,
      )
    )
      destination = available(world, danceSpots, npc);
  } else if (action === 'chat' || action === 'trade') {
    const partner = world.inhabitants
      .filter(
        (n) =>
          n.id !== npc.id &&
          !n.plan &&
          n.id !== 'npc-1' &&
          (action !== 'trade' || (n.id === 'npc-4' && n.inventory.tonic > 0)),
      )
      .sort((a, b) => distance(npc.position, a.position) - distance(npc.position, b.position))[0];
    if (partner) {
      const angle = Math.atan2(npc.position[1] - partner.position[1], npc.position[0] - partner.position[0]);
      const nearby: Point = [
        partner.position[0] + Math.cos(angle) * 0.85,
        partner.position[1] + Math.sin(angle) * 0.85,
      ];
      if (isTravelWalkable(nearby)) {
        destination = nearby;
        targetId = partner.id;
        partner.nextDecision = world.time + 15000;
      }
    }
  } else if (action === 'rest') destination = available(world, [...seats, ...hearthSpots], npc);
  if (!destination) {
    if (world.disabledActions.includes('wander')) {
      npc.nextDecision = world.time + 2000;
      return;
    }
    action = 'wander';
    for (let i = 0; i < 30; i++) {
      const p: Point = [-8.1 + random(world) * 16.2, -4.8 + random(world) * 12.3];
      if (isWalkable(p, 0.55) && isTravelWalkable(p)) {
        destination = p;
        break;
      }
    }
  }
  if (!destination) {
    npc.nextDecision = world.time + 1000;
    return;
  }
  const path = npc.id === 'npc-1' ? [] : navigation.path(npc.position, destination);
  if (distance(npc.position, destination) > 0.25 && !path.length) {
    npc.nextDecision = world.time + 2000;
    return;
  }
  npc.target = destination;
  const leavingSeat = usesChairPose(npc.action) && seats.some((seat) => distance(seat, npc.position) < 0.35);
  npc.action = action;
  npc.plan = {
    id: `command:${++world.commandSequence}`,
    action,
    targetId,
    destination,
    path,
    phase: path.length ? 'walking' : 'performing',
    until: 0,
    applied: false,
    departAt: leavingSeat && path.length ? world.time + SEAT_DEPARTURE_DURATION : undefined,
  };
}
export function inviteDuet(world: World, firstId: string, secondId: string, navigation: Navigation): boolean {
  const first = world.inhabitants.find((n) => n.id === firstId),
    second = world.inhabitants.find((n) => n.id === secondId);
  if (
    world.time < world.musicNext ||
    world.disabledActions.includes('play_music') ||
    !first ||
    !second ||
    first === second ||
    [first, second].some((n) => n.instrument === 'none' || n.plan || n.energy < 45 || n.thirst > 80) ||
    world.musicGroups.some(
      (g) => g.status !== 'resting' && g.members.some((id) => id === firstId || id === secondId),
    )
  )
    return false;
  const spots = stageSpots.filter(
    (point) =>
      !world.inhabitants.some(
        (n) =>
          n.id !== firstId &&
          n.id !== secondId &&
          (distance(n.position, point) < 0.55 || (n.plan && distance(n.plan.destination, point) < 0.6)),
      ),
  );
  if (spots.length < 2) return false;
  const assignments = spots
    .flatMap((firstSpot) =>
      spots.filter((spot) => spot !== firstSpot).map((secondSpot) => [firstSpot, secondSpot] as const),
    )
    .sort(
      (a, b) =>
        distance(first.position, a[0]) +
        distance(second.position, a[1]) -
        distance(first.position, b[0]) -
        distance(second.position, b[1]),
    )[0];
  world.musicNext = world.time + 60000;
  const willing = [first, second].map((n, i) => {
    const partner = i === 0 ? second : first;
    const chance = Math.max(
      0,
      Math.min(1, n.creativity * 0.75 + n.sociability * 0.25 + (n.relationships[partner.id] ?? 0) / 500),
    );
    return random(world) < chance;
  });
  if (willing.some((accept) => !accept)) {
    const reluctant = willing[0] ? second : first;
    emit(
      world,
      'story',
      [firstId, secondId],
      `${reluctant.name} declines a duet invitation. There will be another evening.`,
    );
    return false;
  }
  const paths = [first, second].map((n, i) => navigation.path(n.position, assignments[i]));
  if (paths.some((path, i) => !path.length && distance([first, second][i].position, assignments[i]) > 0.25)) {
    emit(
      world,
      'story',
      [firstId, secondId],
      `${first.name} and ${second.name} agree to a duet, but cannot reach the stage.`,
    );
    return false;
  }
  const members: [string, string] = [firstId, secondId],
    id = `duet:${[...members].sort().join(':')}`;
  let group = world.musicGroups.find((g) => g.id === id);
  if (!group) {
    if (world.musicGroups.length >= 8) {
      const oldest = world.musicGroups.findIndex((g) => g.status === 'resting');
      if (oldest < 0) return false;
      world.musicGroups.splice(oldest, 1);
    }
    group = {
      id,
      name: `${first.name} & ${second.name}`,
      members,
      commandIds: ['', ''],
      status: 'resting',
      created: world.time,
      startedAt: 0,
      until: 0,
      performances: 0,
      outcome: '',
    };
    world.musicGroups.push(group);
  }
  group.members = members;
  group.status = 'gathering';
  group.until = world.time + 30000;
  group.outcome = 'Both musicians accept and make their way to the stage.';
  for (const [i, npc] of [first, second].entries()) {
    const command = `command:${++world.commandSequence}`;
    group.commandIds[i] = command;
    const leavingSeat =
      usesChairPose(npc.action) && seats.some((seat) => distance(seat, npc.position) < 0.35);
    npc.action = 'play_music';
    npc.target = [...assignments[i]];
    npc.plan = {
      id: command,
      action: 'play_music',
      destination: [...assignments[i]],
      path: paths[i],
      phase: paths[i].length ? 'walking' : 'performing',
      until: 0,
      applied: false,
      departAt: leavingSeat && paths[i].length ? world.time + SEAT_DEPARTURE_DURATION : undefined,
    };
  }
  emit(world, 'story', members, `${group.name} agree to play a duet and head for the little stage.`);
  return true;
}
function updateDuets(world: World) {
  for (const group of world.musicGroups) {
    if (group.status === 'resting') continue;
    const members = group.members.map((id) => world.inhabitants.find((n) => n.id === id)!);
    const plansIntact = members.every((n, i) => n.plan?.id === group.commandIds[i]);
    let outcome: string | undefined;
    if (!plansIntact || world.disabledActions.includes('play_music'))
      outcome = 'The duet pauses before its next phrase.';
    else if (group.status === 'gathering' && world.time >= group.until)
      outcome = 'The musicians could not gather in time.';
    else if (group.status === 'performing' && world.time >= group.until)
      outcome = 'Their final notes settle gently into the common room.';
    else if (group.status === 'gathering' && members.every((n) => n.plan!.phase === 'performing')) {
      if (
        members.some(
          (n, i) =>
            n.energy < 40 ||
            n.thirst > 85 ||
            canExecute(world, n, 'play_music') ||
            world.completedCommands.includes(group.commandIds[i]) ||
            Number(group.commandIds[i].slice(8)) <= n.lastCommand,
        )
      ) {
        outcome = 'The musicians choose to rest before playing together.';
      } else {
        // Both arrival checks pass before either confirmed music effect is applied.
        for (const [i, n] of members.entries()) {
          executeAction(world, n.id, 'play_music', group.commandIds[i]);
          n.plan!.applied = true;
          n.plan!.until = world.time + 32000;
        }
        group.status = 'performing';
        group.startedAt = world.time;
        group.until = world.time + 32000;
        group.performances++;
        group.outcome = 'Two musicians share the same song.';
        for (const [i, n] of members.entries()) {
          const partner = members[1 - i];
          n.relationships[partner.id] = Math.min(100, (n.relationships[partner.id] ?? 0) + 4);
          n.socialNeed = Math.max(0, n.socialNeed - 20);
        }
        emit(
          world,
          'play_music',
          group.members,
          `${group.name} begin “The Road Leads Home” together.`,
          'Two willing musicians; one shared performance.',
        );
      }
    }
    if (outcome) {
      group.status = 'resting';
      group.outcome = outcome;
      group.until = world.time;
      for (const [i, n] of members.entries())
        if (n.plan?.id === group.commandIds[i]) {
          n.plan = null;
          n.nextDecision = world.time + 3000;
        }
      emit(world, 'story', group.members, `${group.name}: ${outcome}`);
    }
  }
}
export function offerOpportunity(world: World, kind: 'music' | 'market' | 'hearth') {
  const id = `opportunity:${world.version}:${world.opportunities.length}`;
  const titles = {
    music: 'A song for the road',
    market: 'A merchant’s invitation',
    hearth: 'Stories around the fire',
  };
  const opportunity = {
    id,
    kind,
    created: world.time,
    expires: world.time + 75000,
    status: 'open' as const,
    cast: [] as string[],
    title: titles[kind],
  };
  world.opportunities.push(opportunity);
  world.opportunities = world.opportunities.slice(-12);
  emit(
    world,
    'story',
    [],
    kind === 'music'
      ? 'A passing traveler asks whether anyone knows a song for the long road home.'
      : kind === 'market'
        ? 'Mara offers to share the stories behind her wares.'
        : 'The fire settles low. There is room for an old story beside the hearth.',
  );
  return opportunity;
}
export function respondToOpportunity(world: World, id: string, npcId: string, accept: boolean) {
  const opportunity = world.opportunities.find(
    (o) => o.id === id && o.status === 'open' && o.expires > world.time,
  );
  const npc = world.inhabitants.find((n) => n.id === npcId);
  if (!opportunity || !npc) return false;
  opportunity.status = accept ? 'accepted' : 'declined';
  opportunity.cast = [npcId];
  opportunity.outcome = accept ? `${npc.name} takes an interest.` : `${npc.name} prefers a quiet evening.`;
  emit(world, 'story', [npcId], opportunity.outcome);
  if (accept) {
    npc.socialNeed = Math.min(100, npc.socialNeed + 15);
    if (opportunity.kind === 'music' && npc.instrument !== 'none') npc.nextDecision = world.time;
  }
  return true;
}
export function tickWorld(world: World, now: number, navigation: Navigation): WorldEvent[] {
  if (now <= world.time) return [];
  const elapsed = Math.min((now - world.time) / 1000, 1),
    sequence = world.sequence;
  world.time = now;
  world.version++;
  if (!world.workshop.delivered) {
    Object.assign(world.workshop, {
      wood: 3,
      strings: 1,
      suppliedWood: 3,
      suppliedStrings: 1,
      delivered: true,
    });
    emit(
      world,
      'system',
      [],
      'The workshop receives three pieces of wood and a set of lute strings.',
      'A single starter kit was delivered; material provenance recorded.',
    );
  }
  if (now >= world.musicNext && !world.disabledActions.includes('play_music')) {
    const musicians = world.inhabitants.filter(
      (n) => n.instrument !== 'none' && !n.plan && n.energy >= 45 && n.thirst <= 80,
    );
    if (musicians.length >= 2) {
      const offset = musicians.length > 2 ? Math.floor(random(world) * musicians.length) : 0;
      inviteDuet(world, musicians[offset].id, musicians[(offset + 1) % musicians.length].id, navigation);
    }
  }
  const hour = Math.floor(now / 3600000);
  if (hour > world.economyHour) {
    world.economyHour = hour;
    world.supplyDay = Math.floor(now / 86400000);
    const delivery = Math.max(0, 240 - world.stock);
    if (delivery) {
      world.stock += delivery;
      world.suppliedAle += delivery;
      emit(
        world,
        'system',
        ['npc-1'],
        `A fresh cask arrives with ${delivery} servings of ale.`,
        'Hourly delivery fills the reserve to 240 servings; stock and provenance updated together.',
      );
    }
    const host = world.inhabitants[0],
      regulars = world.inhabitants.slice(1);
    const share = Math.min(3, Math.floor(Math.max(0, host.coins - 4) / regulars.length));
    if (share > 0) {
      host.coins -= share * regulars.length;
      for (const npc of regulars) npc.coins += share;
      emit(
        world,
        'system',
        [host.id],
        `Borin shares ${share * regulars.length} coins from the tavern's takings with the regulars.`,
        `${share} coins transferred to each of ${regulars.length} regulars; no new money created.`,
      );
    }
  }
  for (const npc of world.inhabitants) {
    npc.thirst = Math.min(100, npc.thirst + elapsed * 0.035);
    npc.socialNeed = Math.min(100, npc.socialNeed + elapsed * 0.13);
    npc.energy = Math.max(
      0,
      Math.min(
        100,
        npc.energy + (npc.plan?.phase === 'performing' && npc.action === 'rest' ? 0.5 : -0.035) * elapsed,
      ),
    );
    const plan = npc.plan;
    if (plan && world.disabledActions.includes(plan.action)) {
      if (plan.action === 'craft_instrument' && plan.until > 0 && !plan.applied)
        emit(
          world,
          'story',
          [npc.id],
          `${npc.name} puts the unfinished lute aside.`,
          'Crafting was disabled; no materials were consumed.',
        );
      npc.plan = null;
      npc.nextDecision = now + 2000;
      continue;
    }
    if (!plan && now >= npc.nextDecision) {
      planAction(world, npc, navigation);
      continue;
    }
    if (!plan) continue;
    if (plan.phase === 'walking') {
      if (plan.departAt && now < plan.departAt) continue;
      let budget = elapsed * (npc.role === 'Apprentice' ? 1.05 : 0.85);
      const previousWaypoint = plan.path[0];
      const previousDistance = previousWaypoint ? distance(npc.position, previousWaypoint) : 0;
      const previousPathLength = plan.path.length;
      while (plan.path.length && budget > 0) {
        const p = plan.path[0],
          d = distance(npc.position, p);
        if (d < 0.02) {
          plan.path.shift();
          continue;
        }
        if (
          d < 0.42 &&
          plan.path.length > 1 &&
          world.inhabitants.some((other) => other.id !== npc.id && distance(other.position, p) < 0.55)
        ) {
          plan.path.shift();
          continue;
        }
        const step = Math.min(d, budget, 0.2);
        const clear = (candidate: Point) =>
          isTravelSegmentClear(
            npc.position,
            candidate,
            plan.action === 'rest' ? plan.destination : undefined,
          ) &&
          world.inhabitants.every(
            (other) =>
              other.id === npc.id ||
              distance(candidate, other.position) >= 0.46 ||
              distance(candidate, other.position) > distance(npc.position, other.position) + 0.01,
          );
        // A short local steering step respects both furniture and the current positions of other people.
        // Fixed angle order keeps replay deterministic, including when two people meet head-on.
        const direct: Point = [
          npc.position[0] + ((p[0] - npc.position[0]) * step) / d,
          npc.position[1] + ((p[1] - npc.position[1]) * step) / d,
        ];
        let next: Point | undefined = clear(direct) ? direct : undefined;
        if (!next) {
          const heading = Math.atan2(p[1] - npc.position[1], p[0] - npc.position[0]);
          for (const angle of steeringOffsets) {
            const candidate: Point = [
              npc.position[0] + Math.cos(heading + angle) * step,
              npc.position[1] + Math.sin(heading + angle) * step,
            ];
            if (clear(candidate)) {
              next = candidate;
              break;
            }
          }
        }
        if (!next) break;
        npc.position = next;
        budget -= step;
        if (distance(npc.position, p) < 0.04) plan.path.shift();
      }
      if (
        plan.path.length &&
        previousWaypoint &&
        previousPathLength === plan.path.length &&
        distance(npc.position, previousWaypoint) >= previousDistance - 0.01
      ) {
        plan.blockedSince ??= now;
        if (!plan.detourAttempted && now - plan.blockedSince >= 1000) {
          plan.detourAttempted = true;
          const blockers = world.inhabitants.filter(
            (other) => other.id !== npc.id && distance(other.position, npc.position) < 1.3,
          );
          const best = crowdDetour(
            navigation,
            npc.position,
            plan.destination,
            blockers.map((other) => other.position),
          );
          if (best.length) {
            plan.path = best;
            plan.blockedSince = undefined;
            plan.detourAttempted = undefined;
          }
        }
        if (plan.blockedSince && now - plan.blockedSince > 4000) {
          npc.plan = null;
          npc.nextDecision = now + 1000;
          continue;
        }
      } else {
        plan.blockedSince = undefined;
        plan.detourAttempted = undefined;
      }
      if (!plan.path.length) plan.phase = 'performing';
    }
    if (plan.phase === 'performing') {
      if (world.musicGroups.some((g) => g.status !== 'resting' && g.members.includes(npc.id))) continue;
      if (plan.action === 'craft_instrument' && !plan.applied) {
        if (craftPrerequisite(world, npc)) {
          emit(
            world,
            'story',
            [npc.id],
            `${npc.name} cannot continue the lute.`,
            'The workshop prerequisites are no longer satisfied; no materials were consumed.',
          );
          npc.plan = null;
          npc.nextDecision = now + 4000;
          continue;
        }
        if (plan.until === 0) {
          plan.until = now + CRAFT_DURATION;
          emit(
            world,
            'craft_instrument',
            [npc.id],
            `${npc.name} begins shaping a lute at the workbench.`,
            'Work started; the instrument and materials have not changed yet.',
          );
        }
        if (now < plan.until) continue;
      }
      if (!plan.applied) {
        if (!executeAction(world, npc.id, plan.action, plan.id, plan.targetId)) {
          npc.plan = null;
          npc.nextDecision = now + 4000;
          continue;
        }
        plan.applied = true;
        plan.until =
          now +
          (plan.action === 'craft_instrument'
            ? 0
            : plan.action === 'play_music'
              ? 32000
              : plan.action === 'rest'
                ? 16000
                : 8000);
      }
      if (now >= plan.until) {
        npc.plan = null;
        npc.nextDecision = now + 2000 + random(world) * 5000;
      }
    }
  }
  updateDuets(world);
  if (world.directorEnabled && now >= world.directorNext) {
    const kinds = ['music', 'market', 'hearth'] as const;
    const opportunity = offerOpportunity(world, kinds[world.directorTurn++ % 3]);
    const candidate = world.inhabitants.find((n) =>
      opportunity.kind === 'music' ? n.instrument !== 'none' : n.sociability > 0.6,
    )!;
    respondToOpportunity(
      world,
      opportunity.id,
      candidate.id,
      candidate.energy > 40 &&
        random(world) < (opportunity.kind === 'music' ? candidate.creativity : candidate.sociability),
    );
    if (
      opportunity.kind === 'music' &&
      world.inhabitants[10].instrument === 'none' &&
      world.disabledActions.includes('craft_instrument')
    )
      demand(
        world,
        'npc-11',
        'craft_instrument',
        'Pip would like to join the musicians, but instrument crafting is currently disabled.',
      );
    world.directorNext = now + 120000;
  }
  for (const opportunity of world.opportunities)
    if (opportunity.expires <= now && opportunity.status !== 'resolved') {
      opportunity.status = 'resolved';
      opportunity.outcome ??= 'The moment passes quietly.';
      emit(world, 'story', opportunity.cast, `${opportunity.title}: ${opportunity.outcome}`);
    }
  return world.events.filter((event) => event.sequence > sequence);
}
