---
name: tavern-capability
description: Add or change an executable NPC action in LiveTabern, including its server consequences and visual representation.
---

# Tavern capabilities

An action is complete when the public representation agrees with a confirmed, durable server effect. An activity label alone does not implement the action.

The action IDs and versioned catalogue live in packages/shared/world.ts. Validation, deterministic effects, and lifecycle planning live in packages/simulation/engine.ts. Keep navigation through the injected Navigation interface. Shared room geometry is in packages/shared/layout.ts; rendering is in apps/web/scene.tsx. Private state is explicitly projected in publicWorld before Colyseus synchronization.

When changing state, also update packages/persistence/schema.ts and define how existing snapshots acquire the new fields. Preserve money/item provenance and validate again on arrival; a target can become busy while the actor is walking. Internal commands use a monotonic per-actor execution watermark and duplicate tracking. Unsupported intentions go to demand(), never to invented effects.

Use confirmed event IDs for participant memories and public history. Keep actor knowledge private. Disabled actions must remain non-executable without deleting saved data. Model requests, if introduced later, prepare proposals outside the tick and must never mutate world state directly.

Verify the changed behavior with relevant simulation tests; run npm run typecheck. Run persistence tests when saves or events change. For visible actions, exercise the actual journey and inspect the browser, rather than only injecting its final pose. The existing tests use npm test and npm run test:e2e; use their real paths and options. Record remaining placeholders explicitly in docs/PROGRESS.md.

Paid providers, new assets, repository publication, and deployment keep their existing authorization boundaries. This skill does not grant additional permissions.
