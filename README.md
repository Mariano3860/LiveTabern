# LiveTabern

A persistent, shared 3D fantasy tavern for the web. Watch fifteen travelers drink, trade, talk, rest, dance, and make music while their history continues between visits.

![The Wandering Ember tavern](docs/screenshots/tavern.png)

## Run locally

Use Node.js 22.19 or newer and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The frontend uses port 5173 and the world server uses port 3001. Keep the process running; closing the browser does not pause the world. Ctrl+C stops both services.

No model API keys or paid services are required. External AI is off.

Drag to orbit, scroll to zoom, and select a traveler or their card. Try the fireside and stage cameras, follow a character, filter the chronicle, or read earlier events. Sound is opt-in. Low graphics quality and reduced motion are available.

Willing musicians can form a persistent duet, walk to separate places on the stage, and begin a shared performance once both arrive. Watch the performance banner, open a musician's profile, or use **Under the roof** to see their group's history. Duets add a synthesized harmony when sound is enabled. The current cast supports Elena and Finch; larger bands and new instruments remain future work.

## Persistence and administration

The local world is stored in `.local/world.sqlite`, outside Git. Restarting restores confirmed progress, including identities, inventories, memories, and relationships. Recovery replays at most five minutes of downtime and explicitly records longer skipped intervals; the server must be running for continuous simulation.

For protected administration, copy `.env.example` to `.env`, set a long random `ADMIN_TOKEN`, and restart the server. Open http://127.0.0.1:5173/admin and enter that token. Metrics and director/capability controls require it. Tokens are not stored in browser local storage or URLs.

To exercise the optional chronicler boundary, set `AI_MODE=mock` and restart, then use **Preview annotation** in administration. This is a local template over confirmed public events, not a model call. It never changes the world. `AI_DAILY_CALLS` and `AI_MONTHLY_CALLS` limit attempts; reservations survive restart in the world database. Defaults allow 20 daily / 200 monthly attempts. Spend limits remain zero. `AI_MODE=off` is the default, and no paid provider is connected. See [the gateway decision](docs/ADR/002-optional-narrative-gateway.md) for timeout, caching, failure, and budget behavior.

After building, `npm start` serves the built frontend and world together at http://127.0.0.1:3001. It binds to loopback; this is a local launch, not a public deployment.

## Verify

```sh
npm run lint
npm run format:check
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm audit
```

Browser tests reuse a local development server or start an isolated test world when one is absent. `npm test` includes a seven-day accelerated simulation, persistence checks, and a server restart/reconnection test using temporary databases.

The project intentionally omits undeclared peer packages via `.npmrc`; required React, Three.js, Express, and Colyseus dependencies are declared explicitly. This avoids unused authentication and monitoring integrations. The lockfile pins installed versions.

## Scope

This is a working **local MVP**, with procedural art and deterministic social behavior. It is not a publicly hosted 24/7 service. Production PostgreSQL, richer story arcs and bands, generative dialogue, and automated capability PR generation remain future work. The renderer still has a large lazy-loaded Three.js bundle; browser correctness tests are not hardware FPS guarantees.

See [implementation and acceptance evidence](docs/PROGRESS.md), [the backlog](planning/backlog.json), [architecture decisions](docs/ADR/001-local-persistence.md), and [agent instructions](AGENTS.md).

Reviewed project-local [development skills](docs/AGENT_SKILLS.md) include Ponytail and Vercel React Best Practices. They guide development; they are not runtime AI providers.
