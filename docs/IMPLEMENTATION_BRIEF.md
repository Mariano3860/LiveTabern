# Implementation brief

This is an English implementation summary derived from the original Spanish design document. It is not a complete translation. The original remains local and is excluded from publication.

## Experience

LiveTabern is an observed social ecosystem, initially without player avatars. A single fantasy tavern contains 15 persistent inhabitants with individual roles, traits, needs, goals, inventory, money, relationships, and private knowledge. Public profiles expose only appropriate information.

The initial executable action catalogue is wander, rest, drink, chat, trade, play_music, and dance. Utility-based choices account for constraints and personality. Music groups, richer negotiations, and spectator interventions follow after the core is stable.

## Architecture

Use a small TypeScript monorepo with apps/web, apps/server, and packages/shared and packages/simulation. Introduce further packages when their boundaries become useful. One authoritative world writer runs independently of browser connections. Use one WebSocket transport for initial snapshots, ordered deltas, confirmed events, and resynchronization.

Persist state and ordered unique events transactionally. Recovery restores confirmed progress and uses an explicit, bounded offline catch-up policy. Keep real UTC time separate from simulation time; start at a 1:1 pace. PostgreSQL is the production persistence target; SQLite is acceptable for a local prototype if the choice and migration boundary are documented.

## Narrative and capabilities

The initial director uses deterministic rules, cooldowns, contextual constraints, and thematic diversity. It proposes opportunities rather than forcing social outcomes. Acceptances, rejections, failures, and consequences update the chronicle and relevant personal memories.

Action definitions have versioned identifiers, prerequisites, validation, effects, visual and audio references, and fallbacks. Unsupported intentions create traceable capability demands. New capabilities require tests and publication approval; simulated inhabitants cannot execute generated code or modify production.

## AI policy

Default to external AI off. Everyday movement and decisions use ordinary code. Later introduce an adapter with mock responses, schema validation, bounded context, caching, concurrency limits, timeouts, circuit breaking, and hard daily and monthly budgets. Provider failure or exhausted budget must not stop simulation. Verify current provider pricing before estimating costs.

## Visual quality and operation

Start with a warm stylized interior: bar, fireplace, tables, and music area. Reuse geometries and materials, interpolate movement, and provide graphics quality controls. Audio is opt-in; provide readable captions, keyboard-accessible UI controls, and reduced-motion support. Record external asset licenses. Protect administrator metrics and controls.

## Acceptance evidence

1. Two browsers observe the same world version and confirmed actions.
2. The world advances while no viewers are connected.
3. Restarting preserves character IDs, inventories, memories, and confirmed events.
4. Trading conserves authorized money and items without unintended negative balances.
5. Seeded simulation with injected time reproduces logical results.
6. An inhabitant can reject a director opportunity.
7. Unsupported instrument crafting records demand without creating an instrument.
8. Reconnection restores state without duplicate inhabitants or effects.
9. AI off, malformed responses, provider failure, and exhausted budget preserve normal operation.

Track simulation duration, snapshot age, viewers, reconnections, bandwidth, frame times, draw calls, repeated events, and external AI usage. A local prototype is not a public 24/7 deployment; hosting follows measured resource use and separate authorization.
