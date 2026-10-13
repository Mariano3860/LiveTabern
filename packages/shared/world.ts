export const actions = ['wander', 'rest', 'drink', 'chat', 'trade', 'play_music', 'dance'] as const;
export type Action = (typeof actions)[number];
export type Point = [number, number];
export type Category = Action | 'story' | 'system' | 'capability';
export interface Memory {
  eventId: string;
  time: number;
  summary: string;
  with: string[];
}
export interface Plan {
  id: string;
  action: Action;
  targetId?: string;
  destination: Point;
  path: Point[];
  phase: 'walking' | 'performing';
  until: number;
  applied: boolean;
}
export interface Inhabitant {
  id: string;
  name: string;
  role: string;
  description: string;
  color: string;
  position: Point;
  target: Point;
  action: Action;
  energy: number;
  thirst: number;
  coins: number;
  sociability: number;
  creativity: number;
  mood: number;
  socialNeed: number;
  inventory: { ale: number; tonic: number };
  instrument: 'voice' | 'lute' | 'none';
  memories: Memory[];
  relationships: Record<string, number>;
  plan: Plan | null;
  nextDecision: number;
  lastCommand: number;
}
export interface WorldEvent {
  id: string;
  sequence: number;
  time: number;
  actorId: string;
  actors: string[];
  text: string;
  category: Category;
  detail?: string;
}
export interface Opportunity {
  id: string;
  kind: 'music' | 'market' | 'hearth';
  created: number;
  expires: number;
  status: 'open' | 'accepted' | 'declined' | 'resolved';
  cast: string[];
  title: string;
  outcome?: string;
}
export interface CapabilityDemand {
  id: string;
  actorId: string;
  count: number;
  reason: string;
  priority: number;
  lastSeen: number;
}
export interface MusicGroup {
  id: string;
  name: string;
  members: [string, string];
  commandIds: [string, string];
  status: 'gathering' | 'performing' | 'resting';
  created: number;
  startedAt: number;
  until: number;
  performances: number;
  outcome: string;
}
export type PublicMusicGroup = Omit<MusicGroup, 'commandIds'>;
export interface World {
  schemaVersion: 1;
  id: string;
  version: number;
  time: number;
  startedAt: number;
  rng: number;
  sequence: number;
  commandSequence: number;
  inhabitants: Inhabitant[];
  events: WorldEvent[];
  stock: number;
  consumedAle: number;
  suppliedAle: number;
  supplyDay: number;
  opportunities: Opportunity[];
  demands: CapabilityDemand[];
  directorNext: number;
  directorEnabled: boolean;
  completedCommands: string[];
  directorTurn: number;
  disabledActions: Action[];
  musicGroups: MusicGroup[];
  musicNext: number;
}
export type PublicInhabitant = Pick<
  Inhabitant,
  | 'id'
  | 'name'
  | 'role'
  | 'description'
  | 'color'
  | 'position'
  | 'target'
  | 'action'
  | 'coins'
  | 'energy'
  | 'mood'
  | 'instrument'
> & { phase: 'walking' | 'performing' | 'idle'; partnerId?: string; until: number };
export interface PublicWorld {
  id: string;
  version: number;
  time: number;
  startedAt: number;
  inhabitants: PublicInhabitant[];
  events: WorldEvent[];
  opportunities: Opportunity[];
  demands: CapabilityDemand[];
  stock: number;
  musicGroups: PublicMusicGroup[];
}
export interface Snapshot {
  world: PublicWorld;
  viewers: number;
}
export const capabilityCatalogue = actions.map((id) => ({
  id,
  version: 1,
  animation: id,
  enabled: true,
  fallback: 'idle',
  prerequisites:
    id === 'drink'
      ? ['at_bar', 'coins', 'ale_stock']
      : id === 'chat' || id === 'trade'
        ? ['nearby_available_partner']
        : id === 'play_music'
          ? ['at_stage', 'instrument_or_voice']
          : id === 'dance'
            ? ['live_music']
            : [],
}));
export function publicWorld(world: World): PublicWorld {
  return {
    id: world.id,
    version: world.version,
    time: world.time,
    startedAt: world.startedAt,
    stock: world.stock,
    inhabitants: world.inhabitants.map((n) => ({
      id: n.id,
      name: n.name,
      role: n.role,
      description: n.description,
      color: n.color,
      position: [...n.position],
      target: [...n.target],
      action: n.action,
      coins: n.coins,
      energy: n.energy,
      mood: n.mood,
      instrument: n.instrument,
      phase: n.plan?.phase === 'performing' && !n.plan.applied ? 'idle' : (n.plan?.phase ?? 'idle'),
      partnerId: n.plan?.targetId,
      until: n.plan?.until ?? 0,
    })),
    events: world.events,
    opportunities: world.opportunities,
    demands: world.demands,
    musicGroups: world.musicGroups.map(({ commandIds: _commands, ...group }) => ({
      ...group,
      members: [...group.members] as [string, string],
    })),
  };
}
