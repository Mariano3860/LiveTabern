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

### Sustainable closed economy — P1-003

Per-day analysis showed that all 345 coins reached Borin and drink purchases stopped from the third day. Duets also stopped because thirst could not be resolved. Hourly sharing now transfers up to three existing coins per regular while leaving the host a reserve. Hourly ale delivery adds only the amount needed to reach 240 servings, with explicit provenance; legacy excess is preserved. Thirst growth is calibrated to sustain the closed cycle. Persisted hourly watermarks prevent repeated rewards, and skipped hours are not multiplied into retrospective payments. No new currency is created.

The full 38-test suite passed, including strengthened seven-day requirements for activity on every day, conservation, bounded stock, and group uniqueness. The same seeded analysis now records 994 drink purchases and 433 duet starts on day seven, compared with zero before. ADR 003 records the exact policy, baseline, migration, and remaining finite trade inventory. TypeScript, lint, formatting, and production build passed. Browser behavior is unchanged by these private simulation fields; CI still executes the existing five browser tests.

### Reviewed portable development skills — P1-004

The user's requested tools were evaluated from primary repositories and skill files. Ponytail and Vercel React Best Practices were copied at pinned revisions, with provenance and compatibility in docs/AGENT_SKILLS.md. Both passed the Codex skill validator after removing Ponytail's unsupported argument-hint metadata. Their relevant rules were applied to connection-local parsing caches, memoized chronicle filtering, and independent administrator fetches. No runtime dependency was added, and no global profiles or hooks were configured. Graphify and OmniRoute remain evaluated follow-ups with distinct purposes.

The networking regression verifies that 100 identical payload reads cause one parse, new confirmed data invalidates the cache, connections remain independent, and malformed JSON does not replace a valid cached result. Lint, TypeScript, formatting, production build, and five actual browser tests passed after the change. This validates avoided repeated work and preserved behavior, not an FPS or token-cost benchmark.

### Verified local backups and diagnostics — P1-005

The native Node/SQLite online backup command pins a WAL read snapshot, uses an exclusive new destination, and verifies schema, full history, AI reservations, integrity, and checksum before accepting the result. Restore creates another new path and verifies identical bytes; it never switches the running world. Pending WAL files cannot be restored through file copying. Failure cleanup touches only the new destination owned by the operation.

Tests cover an open WAL writer, retained charged AI usage after restoration, overwrite/self-copy refusal, missing sources, and rejection/removal of a copy with incomplete history. A real running-world backup was also created and restored separately: version 30,786, fifteen inhabitants, 2,092 durable events, 345 coins, and matching SHA-256. The server remained healthy. Private database artifacts stay in `.local/` and outside Git. Protected metrics now report snapshot age and full public projection size; they do not claim delta bandwidth. See docs/BACKUPS.md for operational limits and the restore procedure.

### Persistent instrument crafting — P1-006

Pip can now fulfill the old instrument wish: walk to the corner workbench, work for twelve seconds, consume three pieces of wood and one set of strings, and keep a lute for subsequent music. The one-time starter kit is a durable delivery, including for old snapshots. Materials and owned instruments are validated through provenance equations. The action rechecks prerequisites at arrival and completion, honors disabled capabilities, and uses the existing command watermark and participant memories. Older crafting demands are retained and marked fulfilled. The workshop panel and profiles expose confirmed resources and ownership; original procedural geometry provides a hammer pose and the existing lute performance.

Reopening unfinished work preserves its deadline. Review found that extended downtime shifted zero deadlines on walking plans; recovery now preserves the unstarted marker, with a regression that creates a real walking plan at the catch-up boundary. The browser acceptance follows the actual journey and subsequent music. The live local world also upgraded without resetting: version 40,135 contained one crafted lute and balanced consumed materials. The seven-day soak passed independently in 98 seconds; an earlier run alongside Chromium exceeded its 120-second budget, so sustained simulation and browser validation run sequentially.

The finite starter kit and single apprentice recipe are intentional limits. Richer crafting, supplies, instrument trading, bands, and external AI remain future work. See ADR 004 for migration and execution details.

TypeScript, lint, formatting, and the production build passed. The full 47-test simulation suite passed, followed by the additional crafted-instrument duet regression. All six browser tests passed together with stable source files, including reconnection and mobile layout; an earlier reconnection deadline failure passed on isolated repeat before the complete rerun. The workshop and subsequent lute-performance captures were visually inspected.

PR review strengthened snapshot validation to require exactly one starter kit after delivery, added a completion interruption outside the workshop, and corrected singular material copy. CI passed the full 48-test suite and six browser tests before these review refinements; the updated head is checked again before merging.

### Chronicle request cancellation — P1-007

Browser reproduction confirmed that an archive response arriving after a filter change replaced the new search cursor: an unfiltered request starting before sequence 3,107 returned cursor 7, and the subsequent Pip request incorrectly started before 7. The client now aborts old requests when filters change or the view unmounts and guards record, cursor, error, and loading updates by request identity. A new search can proceed immediately, and an aborted request cannot clear its loading indicator.

Browser regressions delay both old and current responses, change the traveler and category filters, verify the new request's parameters and subsequent confirmed cursor, and preserve visible errors and successful retry for the active request. The archive API is mocked only for controlled timing; the existing server history and real world remain unchanged. No dependency or new endpoint was introduced.

TypeScript, lint, formatting, and the production build passed. The three archive regressions and the three existing tavern browser checks passed together, including real spectator reconnection and narrow layout. CI runs the complete simulation and browser suites for the PR before merging.

### Spatial and visual tavern upgrade — P2-001

The common room is wider and deeper while the persistent stage, bar, and workshop remain in place. Original generated oak and stone textures replace flat surfaces. New tables, backed chairs, benches, rugs, heraldic banners, herb shelves, hanging lanterns, and storage fill the expanded space. The lowered and shifted counter gives Borin a visible place behind the bar, with an apron and a serving gesture while a confirmed customer drinks. An additional bar camera shows the service area. The character rig now has smaller facial proportions, clothing detail, knee joints, smoothed turns and sitting transitions, displacement-driven gait, and distinct gestures for rest, drinking, conversation, trade, music, dancing, crafting, and service.

The shared floor plan and Recast mesh cover the added space and its furniture. Authoritative walking checks current occupant positions, tries deterministic side steps, skips a near waypoint occupied by someone else, and abandons a route after four seconds without progress. Destination reservation includes standing people. Duets choose two clear stage spots with the shortest combined journey, preserving on-stage musicians where possible. An optional obstruction timestamp is compatible with older snapshots and shifted over skipped downtime. The ten-minute seeded movement replay kept every pair at least 0.46 units apart; the regression asserts 0.45. A stationary blocker test verifies a walker still reaches the destination.

TypeScript, lint, formatting, and the production build passed. The complete 49-test suite passed, including seven-day activity and persistent crafting. All nine Playwright browser tests passed with real desktop/mobile rendering, live crafting, shared music, reconnection, and bar camera. The room, bar, hearth, and an actual seated character were visually inspected in Chromium. A 1440×900 high-quality browser sample reported 904 draw calls, 87,222 triangles, and a 17.3 ms frame interval; this is a sample, not a device-wide performance guarantee. The rendered character style remains handcrafted and stylized rather than photorealistic; ADR 005 records asset provenance and the spatial tradeoffs.
