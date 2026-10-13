# Implementation progress

## October 13, 2026 — persistent local MVP

The five local P0 backlog tickets are implemented and verified. This describes the bounded local milestone, not every requirement in the full product vision or a production deployment.

### Delivered

- Fifteen stable inhabitants with roles, needs, personality factors, possessions, relationships, and twelve recent personal memories.
- Deterministic utility ranking, injected simulation time, seeded randomness, and seven executable actions. Purchases require arrival, stock, and payment; exchanges transfer items and coins; conversations update both participants and their memories.
- Recast server navigation around tables and the bar, with route checks. Destination reservations avoid competing for service points. Crowd separation between moving characters remains a refinement.
- A process-owned world that runs without viewers. Colyseus exposes only public state and synchronizes property changes; the single room is created at startup and does not auto-dispose when empty.
- SQLite WAL snapshots and unique events committed transactionally before publication. Version fencing rejects stale writers. Bounded fixed-step recovery preserves saved data and explicitly records long skipped downtime.
- A deterministic director with cooldowns, rotating opportunity types, acceptance/rejection records, and expiry outcomes. This is a simple director, not full long-term narrative planning. Unsupported crafting creates a demand without creating an item.
- A detailed procedural diorama, character gestures and props, fireplace lighting, room/hearth/stage/follow cameras, profiles, paginated chronicle, participant/category filters, low graphics quality, and reduced motion.
- Opt-in synthesized ambience and melody. Musical phrase selection follows world time; precise cross-browser audio phase alignment is future work.
- Token-protected administrator metrics and audited director/capability toggles. Only registered existing actions can be enabled; flags do not install generated code.
- A project-local tavern-capability skill, validated with the skill-creator validator. CI configuration includes lint, formatting, build, simulation, dependency audit, and browser tests.

### Verification

The implementation has been checked with strict TypeScript and a production frontend build. Twelve simulation/integration tests and three browser tests passed, including a seven-day accelerated simulation and the idempotence regression.

The seven-day accelerated test covers finite positions, bounded needs/memories/history, conservation of coins and tonic ownership, ale supply/consumption balance, unique event IDs, and occurrence of conversation, trade, music, and dance. It is a logic simulation, not a seven-day production uptime test.

The server integration test starts an isolated process and database, connects two Colyseus clients, checks one shared world and private-state exclusion, leaves both clients, verifies progress, reconnects, restarts, and checks restored identity and possessions. Administration tests verify unauthorized access rejection, strict body validation, and refusing unknown capabilities.

Browser tests cover rendering, profiles, camera controls, audio toggle, filtering, two spectator contexts, network loss/recovery, and a narrow layout. Desktop and mobile screenshots were generated; visual inspection is separate from logical acceptance.

The final dependency installation omits unused peer integrations and reports zero vulnerabilities under that installation policy. Three.js remains a large lazy-loaded renderer bundle. SQLite emits Node's experimental-feature warning on Node 22.19; storage is isolated behind WorldStore.

### Local acceptance mapping

| Original case               | Evidence / limit                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| AT-01 Persistent identity   | Store reopen test and actual server restart test                                                            |
| AT-02 Shared world          | Two Colyseus clients and two browser contexts                                                               |
| AT-03 Autonomous progress   | Server test with zero connected clients                                                                     |
| AT-04 Economy               | Transaction regression tests and seven-day conservation checks                                              |
| AT-05 Non-coercive director | Explicit rejection test and persisted opportunity outcomes                                                  |
| AT-06 Missing capability    | Unsupported intent records demand without inventory effects                                                 |
| AT-07 AI off                | No external AI adapter is configured or invoked; metrics show zero calls                                    |
| AT-08 Exhausted quota       | Deferred with the optional AI gateway                                                                       |
| AT-09 Reproduction          | Same seed and injected clock reproduce logical state using the pinned navigation version                    |
| AT-10 Reconnection          | Client and browser recovery checks, fifteen unique identities                                               |
| AT-11 Provider failure      | Deferred with the optional AI gateway                                                                       |
| AT-12 Safe publication      | Registered capability flags and CI foundation; generated-code and asset-review pipeline remains future work |

### Remaining product work

Production PostgreSQL and migrations, durable deployment supervision/backups, external HTTPS/WSS hosting, advanced story arcs/calendar, richer inventory/economy, bands and rehearsals, generative dialogue with quotas, detailed capability forecasting, and development-agent PR generation. External services and public deployment require their existing authorization boundaries.

The original specification remains intact locally. English implementation and research documents are summaries; the above table makes partial cases explicit. No production service or paid provider was configured.
