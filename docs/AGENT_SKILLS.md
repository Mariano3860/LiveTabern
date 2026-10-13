# Reviewed development skills

Skills are development instructions; they are not part of the running tavern, and they do not give NPCs permission to generate or execute code. Project instructions, user scope, authoritative state, tests, and trust boundaries still apply.

Two reviewed imports live in `.agents/skills/` and are available to Codex in subsequent turns. Their main instructions can also be read directly. Only the relevant supporting React rules are loaded for a task; the full compiled reference is not a required context dump.

| Skill                       | Source revision                                                                                                                                              | Decision                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ponytail                    | [DietrichGebert/ponytail at 2961b52](https://github.com/DietrichGebert/ponytail/tree/2961b52fc1fe6a5a87c7a959a79512e5c2f3ffe5/skills/ponytail)               | Use the smallest complete change, prefer existing code and standard libraries, retain validation and meaningful checks. MIT license copied from upstream. |
| Vercel React Best Practices | [vercel-labs/agent-skills at 063bee9](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) | Use relevant React/client rules; this is a Vite app, so Next.js-specific instructions do not apply. Upstream metadata declares MIT and author Vercel.     |

The installer copied reviewed skill directories without running upstream plugins, hooks, or setup scripts. The optional `argument-hint` frontmatter entry was removed from Ponytail to pass the Codex skill validator; its core instructions and license are retained. Vercel content is copied unchanged. The repository does not auto-update these imports; a revision change requires another review.

The first application removes repeated parsing of unchanged chronicle, opportunity, demand, and group payloads during movement patches. A connection-local one-entry cache preserves array identity, and chronicle filtering/sorting recomputes only when its data or filters change. Independent administrator reads start together. A regression exercises 100 movement-equivalent payload reads with one parse, fresh confirmed data, independent connections, and invalid JSON. This establishes avoided repeated work; it does not establish a hardware FPS or token-cost improvement.

## Evaluated separately

- [Graphify](https://github.com/Graphify-Labs/graphify) supports Codex and deterministic local code graphs. It can become useful for cross-module impact analysis as this repository grows. Its current Python package includes many language parsers; installing it and maintaining generated graph artifacts is deferred until a concrete mapping task justifies that cost. A graph does not replace simulation or browser tests.
- [OmniRoute](https://github.com/diegosouzapw/OmniRoute) is a separately operated model gateway with provider routing and fallback. It is not a Markdown skill. Multi-provider routing is deferred because LiveTabern currently supports off/local-mock annotation previews. No existing Codex profile, credentials, or provider routes were changed.

Compatibility follows the [Agent Skills specification](https://agentskills.io/specification), but host-specific tools, hooks, scripts, and metadata still need inspection. Published benchmark and token-saving claims are upstream reports, not measurements for LiveTabern. If “agent skills” refers to another particular collection, its exact repository should be evaluated separately.
