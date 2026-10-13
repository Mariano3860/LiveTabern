# Open-source reuse decisions

Date: October 13, 2026. Status: assessment completed; selected reuse decisions implemented. See PROGRESS.md for current evidence.

This memo assesses the user-supplied Open-Source Reuse Map against the original specification and the current local prototype. The attachment's internal citation identifiers are not independently resolvable in this chat; the critical recommendations below were checked against linked primary sources. Popularity counts, commit dates, every referenced source path, and every repository license were not re-audited.

## Practical value

The map supplies concrete integration candidates beyond the earlier workflow research. The useful combination is direct reuse of rendering, networking, navigation, asset processing, and test tools; adaptation of social-agent patterns; and a small project-owned simulation and capability model.

This can avoid substantial infrastructure work. It does not eliminate integration, art production, behavior design, persistence, or verification. No speedup percentage is established.

## Reuse matrix

| Component                                      | Decision                                                                       | Integration gate                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| React Three Fiber, Three.js, Drei              | Keep the existing implementation foundation                                    | Improve scene structure and measure actual render costs                                                      |
| AI Town                                        | Study its asynchronous operations and conversation membership patterns         | Adapt concepts to our TypeScript domain; do not import the Convex application                                |
| Colyseus                                       | Preferred candidate to replace the temporary full-snapshot WebSocket transport | Verify one shared world, zero-viewer continuity, reconnection, public-state projection, and restart recovery |
| Recast Navigation JS                           | Candidate for authoritative obstacle-aware movement                            | Test a server-side path around furniture and a fixed-step replay before broad adoption                       |
| glTF Transform and Meshoptimizer               | Evaluate when the selected first GLB assets exist                              | Compare size, visual fidelity, skeleton/animation integrity, and browser rendering before/after              |
| XState                                         | Optional for complex multi-step actions                                        | Introduce only if an explicit action state machine becomes difficult to maintain directly                    |
| Generative Agents                              | Conceptual reference for perception, retrieval, planning, and reflection       | Keep routine decisions deterministic and memory scoped to each inhabitant                                    |
| ElizaOS and Yuka                               | Pattern references                                                             | Preserve one project-owned action and utility model rather than overlapping agent runtimes                   |
| Tone.js                                        | Optional for structured musical scheduling                                     | Verify opt-in audio, late joining, clock offset, and synchronization with confirmed performance events       |
| Mem0, LangGraph, pgvector, external Agents SDK | Defer                                                                          | Require a concrete missing capability that justifies their overhead                                          |
| VRM and Rapier                                 | Defer pending asset and physical interaction needs                             | Keep persistent effects on the authoritative server                                                          |
| Project-local skills                           | Create after a representative capability workflow is verified                  | Use real package scripts and established interfaces, not hypothetical commands                               |

## Confirmed architectural findings

AI Town separates simulation inputs and ticks from long-running agent operations. Its conversation memberships distinguish an invitation, approaching the partner, and actual participation. That is useful for replacing our current placeholder chat label with a real social interaction. Its storage and scheduling are Convex-specific, so this is architectural adaptation rather than a drop-in module. [AI Town architecture](https://raw.githubusercontent.com/a16z-infra/ai-town/main/ARCHITECTURE.md)

Colyseus sends a full state on joining and tracks property changes for subsequent synchronization. That could replace custom delta encoding and reduce the prototype's recurring full-world broadcasts. It does not by itself establish durable world recovery or single-writer ownership across processes. [State synchronization](https://docs.colyseus.io/state)

Colyseus defaults to `autoDispose: true`, disposing a room after its last client leaves. The world must be initialized independently of the first viewer and must continue without viewers. Keep the authoritative simulation owned by a world service; use a controlled persistent room as its public projection. Disable disposal where needed and test the empty-room lifecycle. Restart recovery remains a persistence concern. [Room configuration](https://docs.colyseus.io/room)

Recast Navigation JS supports Node and browser environments, navigation queries, crowds, and temporary obstacles. Its documentation explicitly warns that variable-step crowd updates are non-deterministic. Use controlled fixed steps and verify results under the selected version; fixed steps alone are not proof of identical replay across all environments. Its README also points to the author's newer pure-JavaScript navcat alternative. Evaluate one route fixture before selecting either implementation. [Recast Navigation JS](https://github.com/isaac-mason/recast-navigation-js)

glTF Transform provides tooling for processing glTF assets, and XState provides state machines and actors. Both address real potential needs, but neither should be added until there is a representative asset or complex action to validate. [glTF Transform](https://gltf-transform.dev/), [XState](https://github.com/statelyai/xstate)

## Corrections to the supplied proposal

- Preserve the original MVP target of **15 NPCs and seven executable actions**. The attachment's ten-NPC/twenty-capability target is a different proposed milestone, not an authorized replacement.
- Discard the illustrative Gantt durations as estimates. Integration order must follow actual dependencies and verified progress.
- A navigation mesh finds routes; selecting and reserving an empty chair, choosing a partner, and reaching an action location also require domain rules.
- Validate asynchronous AI results again when applying them. Attach actor/job IDs, a world revision or relevant preconditions, expiry, and deduplication. A plausible decision can become invalid while the request is pending.
- Do not await model calls inside the tick. Prefer synchronous deterministic precondition/effect evaluation at the world boundary. If a capability requires asynchronous preparation, model it as a job followed by a revalidated command.
- A generic `structured<T>` interface does not provide runtime validation. Parse actual model output against an explicit schema before accepting a proposal.
- Keep actor knowledge separate from the public chronicle and server-wide state. Only relevant observations and memories should enter that actor's context.
- Network state patches are not a durable event log. Persist confirmed significant transitions separately and maintain ordered IDs and explicit recovery rules.
- Tone.js scheduling does not automatically synchronize separate browsers. Define the world-to-local clock mapping and seek/late-join policy.
- Test fixtures that can mutate the world must be isolated to test instances or protected development tooling, never public spectator endpoints.
- The attachment's `pnpm` commands are illustrative. This project currently uses npm and lacks several named specialized scripts; a skill must use commands that actually exist.
- Review the license and provenance of exact source files and assets before copying them. Repository-level popularity and license labels are insufficient for all embedded or externally referenced assets.

## Proposed pilot before wider integration

Build one real drink-purchase journey once implementation resumes:

1. An inhabitant decides to buy a drink from its needs and available resources.
2. Server-side navigation reaches an available service point around furniture.
3. The capability validator checks location, stock, money, and actor availability.
4. The transaction transfers authorized resources and records a confirmed event.
5. The browser represents walking, obtaining the mug, and drinking.
6. A second viewer sees the same confirmed outcome.
7. Disconnecting viewers leaves the world running; restarting restores the result.

This pilot exercises navigation, capability contracts, rendering, synchronization, and persistence together. It establishes a useful integration pattern before scaling to conversations, performances, or capability generation.

## Next planning step

Set the art direction and one compatible character asset; translate the full specification into a traceable acceptance map; define world ownership, action lifecycle, and persistence contracts; then use the drink-purchase pilot to test Colyseus and navigation. Keep the current local prototype for comparison. No dependencies, code, agent delegation, paid services, or deployment were changed by this assessment.
