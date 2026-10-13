import { z } from 'zod';
import { actions } from '../shared/world';
const point = z.tuple([z.number().finite(), z.number().finite()]);
const bounded = z.number().min(0).max(100);
const memory = z.object({
  eventId: z.string(),
  time: z.number(),
  summary: z.string(),
  with: z.array(z.string()),
});
const plan = z.object({
  id: z.string(),
  action: z.enum(actions),
  targetId: z.string().optional(),
  destination: point,
  path: z.array(point),
  phase: z.enum(['walking', 'performing']),
  until: z.number(),
  applied: z.boolean(),
});
export const eventSchema = z.object({
  id: z.string(),
  sequence: z.number().int().positive(),
  time: z.number(),
  actorId: z.string(),
  actors: z.array(z.string()),
  text: z.string(),
  category: z.enum([...actions, 'story', 'system', 'capability']),
  detail: z.string().optional(),
});
export const worldSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string(),
    version: z.number().int().nonnegative(),
    time: z.number(),
    startedAt: z.number(),
    rng: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative(),
    commandSequence: z.number().int().nonnegative(),
    inhabitants: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          role: z.string(),
          description: z.string(),
          color: z.string(),
          position: point,
          target: point,
          action: z.enum(actions),
          energy: bounded,
          thirst: bounded,
          coins: z.number().int().nonnegative(),
          sociability: z.number(),
          creativity: z.number(),
          mood: bounded,
          socialNeed: bounded,
          inventory: z.object({ ale: z.number().int().nonnegative(), tonic: z.number().int().nonnegative() }),
          instrument: z.enum(['voice', 'lute', 'none']),
          memories: z.array(memory),
          relationships: z.record(z.string(), z.number()),
          plan: plan.nullable(),
          nextDecision: z.number(),
          lastCommand: z.number().int().nonnegative().default(0),
        }),
      )
      .length(15),
    events: z.array(eventSchema),
    stock: z.number().int().nonnegative(),
    consumedAle: z.number().int().nonnegative(),
    suppliedAle: z.number().int().nonnegative(),
    supplyDay: z.number().int(),
    opportunities: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(['music', 'market', 'hearth']),
        created: z.number(),
        expires: z.number(),
        status: z.enum(['open', 'accepted', 'declined', 'resolved']),
        cast: z.array(z.string()),
        title: z.string(),
        outcome: z.string().optional(),
      }),
    ),
    demands: z.array(
      z.object({
        id: z.string(),
        actorId: z.string(),
        count: z.number().int().positive(),
        reason: z.string(),
        priority: bounded,
        lastSeen: z.number(),
      }),
    ),
    directorNext: z.number(),
    directorEnabled: z.boolean(),
    completedCommands: z.array(z.string()),
    directorTurn: z.number().int().nonnegative().default(0),
    disabledActions: z.array(z.enum(actions)).default([]),
  })
  .superRefine((world, ctx) => {
    if (new Set(world.inhabitants.map((n) => n.id)).size !== 15)
      ctx.addIssue({ code: 'custom', message: 'Duplicate inhabitant identities' });
    if (world.stock + world.consumedAle !== world.suppliedAle)
      ctx.addIssue({ code: 'custom', message: 'Ale provenance does not balance' });
  });
