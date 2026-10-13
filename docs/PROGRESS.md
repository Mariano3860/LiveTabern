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

| Original case               | Evidence / limit                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| AT-01 Persistent identity   | Store reopen test and actual server restart test                                                              |
| AT-02 Shared world          | Two Colyseus clients and two browser contexts                                                                 |
| AT-03 Autonomous progress   | Server test with zero connected clients                                                                       |
| AT-04 Economy               | Transaction regression tests and seven-day conservation checks                                                |
| AT-05 Non-coercive director | Explicit rejection test and persisted opportunity outcomes                                                    |
| AT-06 Missing capability    | Unsupported intent records demand without inventory effects                                                   |
| AT-07 AI off                | No external AI adapter is configured or invoked; metrics show zero calls                                      |
| AT-08 Exhausted quota       | Durable daily/monthly request and spend reservations tested with mock/injected adapters; no paid provider     |
| AT-09 Reproduction          | Same seed and injected clock reproduce logical state using the pinned navigation version                      |
| AT-10 Reconnection          | Client and browser recovery checks, fifteen unique identities                                                 |
| AT-11 Provider failure      | Injected failures, cancellation, circuit opening, and late-output rejection; real external transport deferred |
| AT-12 Safe publication      | Registered capability flags and CI foundation; generated-code and asset-review pipeline remains future work   |

### Remaining product work

Production PostgreSQL and migrations, durable deployment supervision/backups, external HTTPS/WSS hosting, advanced story arcs/calendar, richer inventory/economy, bands and rehearsals, generative dialogue with quotas, detailed capability forecasting, and development-agent PR generation. External services and public deployment require their existing authorization boundaries.

The original specification remains intact locally. English implementation and research documents are summaries; the above table makes partial cases explicit. No production service or paid provider was configured.

### PR review correction

A public matchmaking request could create a second room and replace the active projection, interrupting updates to existing spectators. The server now rejects additional tavern creation. The integration regression checks rejection, the unchanged canonical room ID, and continued updates to connected clients.

### Optional AI gateway — P1-001

The server now provides an optional chronicler annotation preview through an authenticated administrator endpoint. Modes are off and local mock. The provider interface validates bounded public context and exact structured outputs, validates source IDs, reserves daily/monthly calls and worst-case spend in durable SQLite tables before dispatch, caches bounded results, limits concurrency, cancels timeouts, and opens a failure circuit. Failures preserve reservations and never block simulation. No external API provider, key, or paid service is connected. Preview text never becomes a world action or canonical event.

The full existing simulation/persistence suite passed with the gateway tests, including the seven-day soak. Real server integration covers off/mock requests, unauthorized and malformed requests, quota exhaustion, and restart-retained usage. Browser coverage uses mocked administrator endpoints for UI behavior; actual server authorization is verified separately. Four browser tests passed, and the administrator screenshot was visually inspected. LF attributes prevent Windows checkout conversion from breaking the formatter; Vite cache is excluded from Git. See ADR 002 for the exact boundary and deferred live-provider work.

### Persistent musical duets — P1-002

Two available musicians with sufficient energy and manageable thirst can consent independently to a duet. A seeded invitation can be declined; it has a one-minute cooldown. Accepted musicians reserve distinct stage destinations and follow normal Recast paths. Both arrival checks and command watermarks must pass before shared performance begins. An early arrival waits without being represented as live music. The same group identity accumulates performances, mutual trust, and participant memories. Groups survive snapshot reopening and bounded recovery. Completed groups remain as a bounded public record; private command IDs are omitted.

The browser shows the shared performance, group records and profile membership. Audio adds a second synthesized voice to a confirmed duet. The browser test starts an isolated persisted world with willing musicians away from the stage and follows their actual journey to the performance before checking the profile and screenshot. The screenshot is a real browser view of that test world. Solo music remains available. Groups are limited to eight records, the current cast has only two instrumental/voice performers, and richer bands/rehearsals remain future work.

Tests verify rejection, cooldown, arrival waiting, shared memories, recovery without replay, repeated group identity, duplicate-command protection, cancellation when music is disabled, and legacy snapshot defaults. The full simulation suite and five browser tests are checked. The seven-day soak now also requires shared performance occurrence and no overlapping group memberships. Disabling an action cancels pending movement and activity; all-disabled worlds remain idle. The server preallocates a larger encoder buffer for the bounded public chronicle. Long-term needs and economic activity require the next sustainability task; merely conserving totals does not establish a lively world on every day.

CI browser workers run serially because software WebGL for simultaneous worlds exhausted the whole-test time budget despite passing individual assertions locally. The bounded long-absence skip shifts active duet timers alongside actor plans, keeping their phases aligned.
