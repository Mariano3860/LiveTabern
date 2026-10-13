import { schema, t, type SchemaType } from '@colyseus/schema';
export const PersonState = schema(
  {
    id: t.string(),
    name: t.string(),
    role: t.string(),
    description: t.string(),
    color: t.string(),
    x: t.number(),
    z: t.number(),
    tx: t.number(),
    tz: t.number(),
    action: t.string(),
    phase: t.string(),
    coins: t.number(),
    energy: t.number(),
    mood: t.number(),
    instrument: t.string(),
    partnerId: t.string(),
    until: t.number(),
  },
  'TavernPerson',
);
export const TavernState = schema(
  {
    id: t.string(),
    version: t.number(),
    time: t.number(),
    startedAt: t.number(),
    viewers: t.number(),
    stock: t.number(),
    inhabitants: t.map(PersonState),
    events: t.string(),
    opportunities: t.string(),
    demands: t.string(),
    musicGroups: t.string(),
  },
  'TavernWorld',
);
export type TavernState = SchemaType<typeof TavernState>;
