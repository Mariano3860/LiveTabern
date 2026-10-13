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
