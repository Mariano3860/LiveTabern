# LiveTabern

A persistent, shared 3D fantasy tavern for the web. Watch autonomous inhabitants socialize, trade, drink, dance, and make music while their stories continue between visits.

## Status

Project foundation only. There is no runnable application yet.

## Product principles

- One authoritative server simulates the same world for every spectator.
- Stable character identities, memories, relationships, and history survive restarts.
- Deterministic rules drive everyday behavior; external AI is optional and disabled by default.
- An invisible narrative director creates opportunities that inhabitants can accept or reject.
- Unavailable actions create capability requests instead of fictional effects.

## Planned stack

React, TypeScript, Vite, React Three Fiber, and Drei for the browser; Node.js and TypeScript for the authoritative server; PostgreSQL for persistence; Vitest and Playwright for verification. Start with one real-time transport and one world writer.

## First playable milestone

A warm, stylized tavern with 15 distinct inhabitants, seven represented actions, camera controls, public character profiles, and an event chronicle. Two browser sessions must observe the same world; closing them must not pause simulation; restarting the server must preserve confirmed progress.

See [the implementation brief](docs/IMPLEMENTATION_BRIEF.md), [the backlog](planning/backlog.json), and [agent instructions](AGENTS.md).
