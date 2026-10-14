# 005 — A shared spatial world with licensed character assets

## Decision

The tavern keeps a single server-owned 2D floor plan. Furniture positions, walkability, and activity destinations come from `packages/shared/layout.ts`; Recast builds its navigation mesh from that plan. The browser draws the corresponding 3D room and interpolates confirmed positions. It does not decide where an inhabitant has walked or whether an action succeeded.

The common room is extended around the existing stage, bar, workbench, and saved inhabitant positions. New tables, chairs, benches, rugs, shelving, banners, lanterns, and storage fill the added floor area. The innkeeper remains behind the counter; serving gestures occur only while a confirmed customer is drinking there. Chairs face their nearest table. A rest action at a chair blends to a seated pose with bent hips and knees; a rest action by the hearth stays standing. Walking cadence follows rendered displacement, and arms/head/torso respond to the confirmed action. Reduced-motion mode suppresses repeated expressive movement while preserving the action pose.

Each walking simulation step checks the next point against static walkability and current inhabitant positions. It tries short, deterministic side steps when a person blocks the route, skips a near waypoint occupied by another person, and abandons a route that stops making progress for four seconds so the actor can replan. Destination reservation also considers standing inhabitants. Duet stage assignments minimize the two participants' total travel distance, preserving a musician's current spot where possible. These rules remain deterministic under seeded replay and survive old snapshots; the optional obstruction timestamp is shifted over long offline recovery.

## Assets and provenance

`public/textures/oak-planks.webp` and `public/textures/lime-stone.webp` were generated for this project with OpenAI's built-in image generation tool on 2026-10-13, then converted to WebP at 1024×1024 using Pillow. They are original generated assets, not copied from a third-party game, stock library, or repository. Room geometry, environmental surfaces, tabletop props, and action poses are authored in this repository. No external runtime package was introduced.

The 15 inhabitants now combine the male/female base heads from Quaternius Universal Base Characters with four compatible outfits: male/female Peasant and Ranger. The official pack pages identify the downloads as CC0 1.0 Universal; the corresponding downloaded notices remain in `public/models/characters/quaternius/`. The source archive hashes, exact pack URLs, modified texture formats/resolutions, and current 16.7 MB runtime size are recorded in `assets/PROVENANCE.md`. Textures are loaded through the existing GLTF pipeline; no runtime dependency was added. Separate cloned skeletons map walking, seated rest, serving/drinking, chat, trade, music, dance, and crafting onto each inhabitant, while server state remains authoritative.

Tabletop food, game pieces, fruit, and writing materials are procedural and vary by stable table index, so the room feels populated without nondeterministic render-time placement.

## Tradeoffs

The scene and game-ready character packs remain stylized rather than photorealistic scans, and the downloaded character assets do not provide motion clips; action motion is authored against their shared skeleton. The small optimized set is downloaded once and cached by GLTFLoader, with separate skeleton instances per inhabitant. Dynamic steering uses nearby current positions rather than a crowd planner; congested plans can pause and replan. The low-quality setting remains available for weaker devices.

## Chair clearance and locomotion follow-up

Recast now excludes chair footprints as well as tables and benches. A shared swept-segment predicate validates mesh connectors and authoritative movement, so older persisted paths cannot bypass the new chair obstacles. Access to a chair centre is reserved for its seating destination; an actor already inside a chair clearance may move outward. This is an explicit seat interaction exception, not removal of chairs from the general navigation mesh. The renderer's short chair slide remains visual and fits within the conservative travel footprint.

Steering uses bounded 20 cm substeps with smaller angular alternatives before large detours. Presentation measures confirmed-position interpolation to choose gait cadence and idle/walk weights, and limits turning speed. No client simulation, new physics engine, migration, or runtime dependency is introduced. Full foot planting, anticipatory crowd velocity planning, and coordinated stand-up departure remain outside this incremental change.

Departure timing is canonical: a new travel plan from a resting chair stores an optional `departAt` timestamp and holds its position for 1.8 seconds, including duet journeys. This interval covers the shipped stand-up clip under reduced playback speed and applies with no viewers connected. The snapshot schema accepts the optional timestamp, older snapshots remain readable, and long skipped recovery shifts it along with other active deadlines. Animation and chair motion consume the resulting confirmed pause; neither determines server action effects.

Stationary crowd traps now trigger one bounded visibility-graph detour attempt per blocked episode after one second. Twelve candidate points surround the nearby people; all graph edges use the existing furniture-aware navigator and swept person clearance. The chosen multi-waypoint route preserves the confirmed action and destination. The optional attempt flag survives snapshots. This handles clusters that the local angular steering could not pass, without adding a browser simulation or a new navigation dependency.

The browser retains at most eight confirmed position samples and presents them with a 250 ms interpolation delay. It holds the latest confirmation during gaps instead of extrapolating; reconnection resets stale samples. This intentionally trades a small observation delay for steadier visual velocity.
