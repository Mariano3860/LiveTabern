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

### High-detail character wardrobes and lived-in tables — P2-002

The 15 inhabitants now combine Quaternius' CC0 male/female heads with compatible Peasant and Ranger clothing. Their six GLTFs share a 65-bone skeleton and use independent clones per inhabitant. The base torso is clipped below the neck to avoid a second body showing through the clothes. Walk, seated rest, drinking/service, chat, trade, lute playing, dance, and crafting drive their appropriate bones; mugs, coins, and the hammer attach to the right hand. Small idle breathing and head turns remain. Different tables get stable bread/cheese, fruit, book/ink, or card-and-dice arrangements instead of identical empty surfaces.

The standard CC0 files are optimized to 2K color and 2K normal/roughness/ORM maps; the larger maps use quality-98 WebP. The full runtime set is 16.7 MB and is served from the existing static asset path with no added dependency. Asset URLs, retained CC0 notices, archive hashes, and transformations are recorded in `assets/PROVENANCE.md`. The assets give the cast detailed game-ready faces, hair, boots, and layered clothing, while remaining stylized rather than photorealistic. No world rules or authoritative action state changed.

Chromium loaded all six character GLTFs and WebP materials from the live preview with HTTP 200 and no console or page errors. The 1440×900 bar and room views were visually inspected after correcting the model's mirrored shoulder axes; the bar capture is saved in `docs/screenshots/tavern-character-wardrobes.png`. The production build, lint, formatting, 50 simulation tests, and all nine isolated Playwright E2E tests pass. E2E uses a dedicated web/API port and a per-run SQLite file; the two-client recovery test exercises the WebGL-unavailable fallback so it does not overload software rendering with two HD scenes.

In headless software WebGL, a fully loaded high-detail frame sample measured roughly 2–3 FPS. That sample is specific to this software-rendered test environment; performance on a hardware-accelerated desktop browser still needs measurement. The quality toggle and lower-geometry silhouettes remain available while assets load.

### Relaxed skeletal action library — P2-003

The original stiff procedural gait is replaced by sixteen curated CC0 full-body clips retargeted onto the cast's matching 65-joint skeleton: in-place walking, several idles, conversation, sitting down/up/idle, drinking, pickup/service, interaction, music, dancing, and kneeling craft work. Every enabled server action has a typed presentation mapping. Walking is slowed per inhabitant and offset around its cycle so the crowd does not move in lockstep. Seat entry/exit, drink sip pauses, service-to-holding, and trade-to-conversation use 0.32-second crossfades. Lute players get a two-hand performance pose while singers use the conversation gesture. The two rendered rig clones have independent mixers bound by their own bones. No server action, path, position, collision, or economic consequence changed.

The browser fetches a 3.13 MiB action-only GLB assembled by the checked-in pack script. Source archive digests, CC0 notices, retained clips, and the extraction are documented in `assets/PROVENANCE.md`; the human-readable action/clip map lives in `docs/ANIMATIONS.md`. Unit tests cover the full action map, slow walking, transitions, sip rhythm, and the separate singer/lute performance. The nine Playwright journeys pass in a Chromium instance with local SwiftShader enabled, including real scene frames, GLB fetch, crafting, and a close bar screenshot; the two-client reconnection scenario still explicitly exercises the no-WebGL fallback.

The complete 53-test suite, TypeScript, lint, formatting, production build, and all nine E2E tests pass. The bar-camera browser capture is saved at `docs/screenshots/tavern-action-library-bar.png`. The current 3D production chunk remains about 1 MB minified; the build reports its existing 500 KB advisory. SwiftShader makes browser checks deterministic but is substantially slower than a hardware GPU, so desktop-device performance remains an open measurement rather than a guarantee.

### Live action and movement catalogue — P2-004

The spectator sidebar now includes **Actions & motion**, with all eight typed activities, readable prerequisites, and descriptions of their existing animation and prop behavior. Native disclosure cards distinguish confirmed performers from travelers still approaching and exclude idle residents. **Watch** opens the selected participant's profile and follows them with the existing camera. Counts are derived from the shared public world at render time; disconnection labels the retained snapshot as last confirmed activity. No simulation, effect, capability flag, provider, dependency, or persistent format changed.

The new Chromium regression verifies all eight groups against the actual shared snapshot, excludes idle residents, observes continued world updates, opens disclosures with the keyboard, follows a participant, disconnects/reconnects, and checks a 390-pixel layout. The existing real-WebGL journey also opens the catalogue and saves a viewport capture alongside the scene. The in-app browser panel was visually inspected; that browser reports WebGL unavailable, so the actual 3D check was performed separately in Chromium using software WebGL. The retained rendered capture is docs/screenshots/tavern-action-catalogue.png.

Executed npm run build, npm run lint, npm run format:check, and npm test (53 passed). The first new browser attempt exposed a changing selector in the test, which was corrected. The complete browser run then passed 9/10 journeys; the existing HD-texture check timed out at its five-second default. That wait now uses the same bounded 30-second allowance as the other assets. A rerun reached the final screenshot but exceeded the overall 180-second deadline; replacing redundant full-page captures with a single catalogue viewport capture allowed the affected journey to pass in 2.9 minutes. The other nine journeys, including the new live catalogue regression, had passed in the full run. The first CI run passed 9/10 and timed out on the remaining duplicate scene-only screenshot after the catalogue viewport capture had succeeded. The final test keeps one catalogue capture containing the real 3D scene and removes the two redundant scene-only exports while preserving all rendering, resource, camera, and error assertions. CI runs the complete ten-test suite on the final PR head before merging. Hardware GPU performance remains unmeasured; the existing large Three.js chunk still triggers the build size advisory.

Software-WebGL follow-up: removing exports alone did not make the full spectator journey consistently fit its deadline; a later local run exhausted 180 seconds before finishing the UI controls. The journey now selects the existing low graphics preset before loading/rendering the detailed cast, rather than compiling high-quality shadows first and switching later. It still requires all six GLTFs, the real animation GLB and material map, thirty rendered frames, every existing UI/camera check, zero page errors, and the rendered catalogue capture. The application's default remains high. The affected local journey passed in 2.0 minutes (2.2 minutes including startup). This test exercises browser correctness, not high-quality hardware performance.

### Exact chair arrivals and seat choreography — P2-005

Resting travelers now reach the exact center of a chair. The navigation query previously accepted a nearest polygon point up to 65 cm from its requested destination and stopped there; it now adds the short final leg only when that segment remains clear. Six outer chair spots were moved into reachable floor space while keeping all fifteen seats. A route test checks each seat is walkable and reached within 1 cm, and a Chromium scene test confirms a performing resting traveler is within 2 cm of one.

When a resting guest approaches, the chair eases 14 cm away from the table, glides back as the guest settles, and slides out briefly when that guest stands before returning home. The motion reads only the confirmed shared action and position and remains client-side; reduced-motion mode keeps the chair still. The pure choreography test covers approach, seating, exit clearance, and return. `npm run build`, `npm run lint`, `npm run format:check`, and all 55 unit/integration tests pass. The Chromium real-scene journey passes with its six character models and action library loaded. The build retains the existing advisory for the 1 MB Three.js scene chunk.

### Seat clip calibration follow-up

The reported backrest penetration reproduced in the shipped animation data: Sitting_Idle_Loop places the pelvis at local world Z = -0.331 m, behind the chair backrest at -0.21 m. Exact navigation arrivals alone did not verify body alignment. The renderer now clones the four sitting clips and translates their pelvis tracks into the chair-centred coordinate system, preserving their authored relative movement and crossfades. Original cached clips are not mutated. A regression samples 61 poses per clip using the real GLB, checks seated hip centring and torso clearance, and checks source immutability.

References reviewed: [Three.js skeletal blending example](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_animation_skinning_blending.html) and [ecctrl controller documentation](https://github.com/pmndrs/ecctrl/blob/main/readme.md). These inform transition coordination; no controller dependency or third-party code was imported. Remaining visual work includes a close-up entry/exit review, matching departure translation to stand-up completion, and speed-driven walking cadence. The previous wide scene screenshot does not establish those acceptance criteria.

Follow-up verification: `npx vitest run tests/seat-animation.test.ts` passed (1 test, 244 sampled poses); `npm run build`, `npm run typecheck`, and `npm run lint` passed. The existing real-scene Chromium journey passed (1 test, 2.6 minutes). The new isolated character/chair Chromium fixture passed (1 test, 33.1 seconds); its close-up was visually inspected and shows the seated body forward of the backrest, supported by the seat. Capture: `test-results/seat-closeup.png`. Entry/exit timing with live canonical travel remains unfinished, so P2-005 stays in progress and PR #14 remains unmerged.
