# Development instructions

Use English for code, comments, documentation, UI copy, commits, and pull requests.

Use the reviewed project-local Ponytail and Vercel React skills when relevant. Apply React client rules to this Vite app; Next.js rules are not architecture requirements. See docs/AGENT_SKILLS.md for pinned revisions and compatibility decisions. Imported skills do not override the user's scope or these simulation and verification requirements.

Read README.md, docs/IMPLEMENTATION_BRIEF.md, and planning/backlog.json before implementation. Select the first unfinished task whose dependencies are satisfied. Complete and verify one end-to-end task before starting another.

Keep canonical decisions and mutations on the server. The browser interpolates confirmed state and never runs an independent canonical simulation. Simulation must run without viewers and without an external AI provider.

Inject time and a seeded random source into simulation code. Preserve stable IDs and record meaningful confirmed mutations durably. Validate action preconditions and economic invariants. Never apply an effect for an unavailable capability.

Use strict TypeScript. Test behavior and invariants, including persistence, reconnection, and shared-world consistency. Report actual commands and results; never describe unexecuted checks as passing. Browser validation is separate from build and unit tests.

Use procedural placeholders initially and record the provenance and license of external assets before publication. Keep API secrets on the server and outside Git. Do not add paid services without explicit authorization.

Keep changes scoped. Stage files explicitly. Do not merge pull requests or deploy without user authorization. Update backlog status only when acceptance criteria are verified. Record material architecture decisions in docs/ADR and leave a concise progress record for resuming work.
