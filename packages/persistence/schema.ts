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
  blockedSince: z.number().finite().optional(),
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
    economyHour: z.number().int().default(-1),
    workshop: z
      .object({
        wood: z.number().int().nonnegative(),
        strings: z.number().int().nonnegative(),
        craftedLutes: z.number().int().nonnegative(),
        suppliedWood: z.number().int().nonnegative(),
        suppliedStrings: z.number().int().nonnegative(),
        delivered: z.boolean(),
      })
      .default({
        wood: 0,
        strings: 0,
        craftedLutes: 0,
        suppliedWood: 0,
        suppliedStrings: 0,
        delivered: false,
      }),
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
        fulfilled: z.boolean().optional(),
      }),
    ),
    directorNext: z.number(),
    directorEnabled: z.boolean(),
    completedCommands: z.array(z.string()),
    directorTurn: z.number().int().nonnegative().default(0),
    disabledActions: z.array(z.enum(actions)).default([]),
    musicNext: z.number().default(0),
    musicGroups: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          members: z.tuple([z.string(), z.string()]),
          commandIds: z.tuple([z.string(), z.string()]),
          status: z.enum(['gathering', 'performing', 'resting']),
          created: z.number(),
          startedAt: z.number(),
          until: z.number(),
          performances: z.number().int().nonnegative(),
          outcome: z.string(),
        }),
      )
      .max(8)
      .default([]),
  })
  .superRefine((world, ctx) => {
    if (new Set(world.inhabitants.map((n) => n.id)).size !== 15)
      ctx.addIssue({ code: 'custom', message: 'Duplicate inhabitant identities' });
    if (world.stock + world.consumedAle !== world.suppliedAle)
      ctx.addIssue({ code: 'custom', message: 'Ale provenance does not balance' });
    if (
      world.workshop.wood + 3 * world.workshop.craftedLutes !== world.workshop.suppliedWood ||
      world.workshop.strings + world.workshop.craftedLutes !== world.workshop.suppliedStrings
    )
      ctx.addIssue({ code: 'custom', message: 'Workshop provenance does not balance' });
    if (
      world.workshop.suppliedWood !== (world.workshop.delivered ? 3 : 0) ||
      world.workshop.suppliedStrings !== (world.workshop.delivered ? 1 : 0)
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Workshop must contain exactly one delivered starter kit or no supplies yet',
      });
    if (
      world.inhabitants.filter((npc) => npc.instrument === 'lute').length !==
      1 + world.workshop.craftedLutes
    )
      ctx.addIssue({ code: 'custom', message: 'Crafted lute ownership does not balance' });
    const activeMembers = new Set<string>();
    for (const group of world.musicGroups) {
      if (
        new Set(group.members).size !== 2 ||
        group.members.some((id) => !world.inhabitants.some((n) => n.id === id))
      )
        ctx.addIssue({ code: 'custom', message: 'Invalid duet members' });
      if (group.status !== 'resting')
        for (const id of group.members) {
          if (activeMembers.has(id))
            ctx.addIssue({ code: 'custom', message: 'A musician belongs to overlapping performances' });
          activeMembers.add(id);
        }
    }
    if (new Set(world.musicGroups.map((g) => g.id)).size !== world.musicGroups.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate music group identities' });
  });
