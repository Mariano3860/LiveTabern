import { z } from 'zod';
import type { PublicWorld } from '../shared/world';

export const contextSchema = z
  .object({
    worldId: z.string().max(80),
    events: z
      .array(
        z
          .object({
            id: z.string().max(80),
            text: z.string().max(220),
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();
export const annotationSchema = z
  .object({
    sourceEventId: z.string().min(1).max(80),
    caption: z
      .string()
      .trim()
      .min(1)
      .max(320)
      .refine((text) => !/[<>]/.test(text) && !Array.from(text).some((char) => char.charCodeAt(0) < 32)),
  })
  .strict();
export type NarrativeContext = z.infer<typeof contextSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export interface NarrativeProvider {
  readonly id: string;
  // This upper bound must include every input, output, and retry cost before a paid adapter can be used.
  readonly maxRequestMicroUsd: number;
  generate(context: NarrativeContext, signal: AbortSignal): Promise<unknown>;
}
export function narrativeContext(world: PublicWorld): NarrativeContext | null {
  const events = world.events.slice(-8).map((event) => ({ id: event.id, text: event.text.slice(0, 220) }));
  return events.length ? contextSchema.parse({ worldId: world.id, events }) : null;
}
export const mockProvider: NarrativeProvider = {
  id: 'mock-v1',
  maxRequestMicroUsd: 0,
  async generate(context) {
    const event = context.events.at(-1)!;
    return { sourceEventId: event.id, caption: `From the chronicler's notebook: ${event.text}` };
  },
};
