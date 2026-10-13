# 005 — A shared spatial world with original visual assets

## Decision

The tavern keeps a single server-owned 2D floor plan. Furniture positions, walkability, and activity destinations come from `packages/shared/layout.ts`; Recast builds its navigation mesh from that plan. The browser draws the corresponding 3D room and interpolates confirmed positions. It does not decide where an inhabitant has walked or whether an action succeeded.

The common room is extended around the existing stage, bar, workbench, and saved inhabitant positions. New tables, chairs, benches, rugs, shelving, banners, lanterns, and storage fill the added floor area. The innkeeper remains behind the counter; serving gestures occur only while a confirmed customer is drinking there. Chairs face their nearest table. A rest action at a chair blends to a seated pose with bent hips and knees; a rest action by the hearth stays standing. Walking cadence follows rendered displacement, and arms/head/torso respond to the confirmed action. Reduced-motion mode suppresses repeated expressive movement while preserving the action pose.

Each walking simulation step checks the next point against static walkability and current inhabitant positions. It tries short, deterministic side steps when a person blocks the route, skips a near waypoint occupied by another person, and abandons a route that stops making progress for four seconds so the actor can replan. Destination reservation also considers standing inhabitants. Duet stage assignments minimize the two participants' total travel distance, preserving a musician's current spot where possible. These rules remain deterministic under seeded replay and survive old snapshots; the optional obstruction timestamp is shifted over long offline recovery.

## Assets and provenance

`public/textures/oak-planks.webp` and `public/textures/lime-stone.webp` were generated for this project with OpenAI's built-in image generation tool on 2026-10-13, then converted to WebP at 1024×1024 using Pillow. They are original generated assets, not copied from a third-party game, stock library, or repository. The remaining geometry, materials, and action rigs are authored in this repository using Three.js primitives. No external asset license or runtime package was introduced.

## Tradeoffs

This is a handcrafted, stylized 3D scene, not photogrammetry or motion-captured character animation. Articulated poses, textured surfaces, and purposeful props improve readability and consistency while avoiding a heavyweight character download for every viewer. Dynamic steering uses nearby current positions rather than a crowd planner; congested plans can pause and replan. The low-quality setting remains available for weaker devices.
