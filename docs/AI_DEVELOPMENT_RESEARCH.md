# AI-assisted development research and proposed LiveTabern workflow

Research date: October 13, 2026. Implementation was paused during this research and later resumed at the user's request. See PROGRESS.md for current evidence. This document proposes a process; it does not approve deployment, paid services, new agent orchestration, or plugin installation.

## Recommendation

Use a small, observable development workflow: a clear experience target, a compact requirements map, a reproducible local environment, a few task-specific skills, reusable licensed assets, and short implementation/verification cycles. Optimize verified progress and the quality of the experience, rather than lines of code, installed skills, or agent count.

For LiveTabern, the most valuable next investment is a visual and behavioral reference brief plus stronger acceptance evidence. Keep the current prototype as a baseline, without treating its placeholder actions as completed simulation features.

## Research method and limits

I inspected current vendor engineering articles, official documentation, repository READMEs, actual skill source files, and two skill-evaluation publications. Sources are linked next to claims. Vendor experiments are author-reported demonstrations, not independent guarantees. Repository popularity indicates adoption, not measured benefit for this project. No downloaded repository or candidate skill was installed or executed for this research.

The user has not yet supplied the specific viral repositories or posts they saw. The examples below are representative; they should not be mistaken for identification or verification of those exact posts. This is a practical research synthesis, not an exhaustive survey or a controlled productivity experiment on LiveTabern.

## What impressive examples actually demonstrate

### Long-running application development

OpenAI's documented design-tool experiment ran for about 25 hours and used roughly 13 million tokens. Its author describes the result as testable but not production-ready. Its durable artifacts separated requirements, milestones, execution guidance, and progress. This supports checkpointed autonomous execution; it does not establish that an arbitrary complete product takes a few hours. [OpenAI: Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex)

Anthropic describes a later planner/generator/evaluator workflow in which the evaluator exercises the live application using Playwright. Its design experiment used several iterations and sometimes preferred intermediate results over the final iteration. This is evidence for active evaluation and preserving good versions, not for endlessly increasing iteration count. [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)

### Large parallel-agent experiments

Cursor's browser experiment used hundreds of agents and ran for close to a week. Its coordination experiments encountered bottlenecks and drift before separating planning and execution responsibilities. [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)

The resulting FastRender repository explicitly identifies itself as experimental and unsuitable for production. Code volume and a convincing screenshot are therefore insufficient acceptance evidence. [FastRender repository](https://github.com/wilsonzlin/fastrender)

Anthropic's C-compiler experiment used 16 agents, nearly 2,000 sessions over two weeks, and just under $20,000 in API costs. That experiment is useful for understanding orchestration and verification, but its resource profile is not an economical starting template for a small tavern project. [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)

### A directly relevant game-development example

OpenAI's September 2026 game-development article describes starting from the intended player experience, using generated concept images, then giving the agent repeatable scenes, inspectable state, rendering counters, and browser tests. It explicitly distinguishes software-rendered headless measurements from performance on the user's GPU. [OpenAI: Building games with Astra](https://developers.openai.com/blog/how-to-build-games-with-astra)

Application to LiveTabern: define recognizable moments such as a drink purchase, a conversation, and a musical performance before choosing implementation details. Build repeatable scene fixtures and inspect both visible movement and confirmed server effects. A test scene makes failures reproducible; actual journey tests must still verify that the world can reach that scene naturally.

## Skills: useful, but not a multiplier by default

Recent official OpenAI guidance recommends narrow skill triggers, progressive disclosure, and removing unnecessary instructions. Excessive skill descriptions and rigid recipes can consume context or conflict. [OpenAI: Rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)

The SkillsBench 1.1 authors report a mean resolution improvement of 16.6 percentage points across their paper's configurations with curated skills. Their results vary by configuration and task; some tasks regress. [SkillsBench 1.1](https://www.skillsbench.ai/blogs/skillsbench-1-1)

A different March 2026 preprint, SWE-Skills-Bench, reports no pass-rate improvement for 39 of 49 evaluated skills and an average gain of 1.2%. It also reports cases of substantial token overhead and version-conflicting guidance. The benchmarks use different tasks and protocols, so their aggregate figures cannot be directly transferred to LiveTabern. [SWE-Skills-Bench](https://arxiv.org/abs/2603.15401)

My inference: select skills that supply missing domain knowledge or a repeatable tool workflow, and measure whether they reduce our rework. Do not treat installation count as an efficacy benchmark.

### Candidate selection

| Candidate                                  | Verified content and adoption signal                                                        | Proposed use                                           | Boundary                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Anthropic frontend-design                  | Actual source inspected; approximately 981K installs reported by skills.sh at research time | Art direction and UI composition                       | Does not author rigged 3D models or prove frame-rate quality                                   |
| Vercel vercel-react-best-practices         | Actual source inspected; approximately 795K installs reported by skills.sh                  | React data flow, bundle size, rendering costs          | Apply React/Vite advice selectively; Next.js server-component rules do not automatically apply |
| Superpowers systematic-debugging           | Actual source inspected; approximately 290K installs reported by skills.sh                  | Diagnosis of recurring or difficult failures           | Activate for real debugging, not as ritual overhead for every change                           |
| Superpowers verification-before-completion | Actual source inspected                                                                     | Evidence-backed completion reports                     | Relevant behavior checks still need to be designed for this project                            |
| Existing Imagegen capability               | Available in this session                                                                   | Concept references and selected raster assets          | Concept imagery is not a runtime 3D asset                                                      |
| Playwright                                 | Existing project dependency; initial browser tests already ran                              | Repeatable interaction, reconnection, and scene checks | Canvas presence alone cannot establish correct 3D behavior                                     |

Primary skill sources: [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [React best practices](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md), [systematic debugging](https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md), [verification before completion](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md). Adoption snapshots: [frontend-design](https://skills.sh/anthropics/skills/frontend-design), [React best practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices), [systematic debugging](https://skills.sh/obra/superpowers/systematic-debugging).

Installation commands for later review, not commands executed during this research:

```sh
npx skills add anthropics/skills --skill frontend-design
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add obra/superpowers --skill systematic-debugging
npx skills add obra/superpowers --skill verification-before-completion
```

Prefer a pinned reviewed revision and project-scoped installation when supported by the installer. Check resulting instructions, licenses, and compatibility before activation. Start with design and React guidance; add debugging and verification packages only if they offer value beyond existing instructions. No skill bundle has been approved or installed by this proposal.

## Process repositories worth understanding

| Repository                                                              | What it supplies                                                                             | Decision for LiveTabern                                                                  |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [obra/superpowers](https://github.com/obra/superpowers)                 | Composable development skills, design/planning, testing, debugging, and review workflows     | Borrow selected skills; do not install the whole methodology by default                  |
| [github/spec-kit](https://github.com/github/spec-kit)                   | A structured specification-to-plan-to-task implementation workflow                           | Useful alternative if we need a formal complete specification pipeline                   |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)           | Change artifacts linking proposals, requirements, design, implementation tasks, and archives | Consider when persistent requirements and later change tracking warrant a dedicated tool |
| [anthropics/skills](https://github.com/anthropics/skills)               | Published workflow packages, including frontend design                                       | Select relevant individual packages                                                      |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | React and interface guidance                                                                 | Use compatible parts; retain the current Vite architecture                               |
| [morluto/rea](https://github.com/morluto/rea)                           | Agent-connected inspection of binaries, application structure, and behavior                  | Research reference only; not required to build our original tavern                       |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | React renderer for Three.js                                                                  | Retain as the scene foundation                                                           |
| [microsoft/playwright](https://github.com/microsoft/playwright)         | Browser testing and automation                                                               | Retain as the interaction verification foundation                                        |

Superpowers includes a broad opinionated methodology. Spec Kit organizes specification-driven development; OpenSpec emphasizes iterative change artifacts. Installing all three would create multiple overlapping planning systems. My recommendation is to strengthen our existing brief/backlog first and adopt at most one formal specification framework if that proves insufficient.

## What reverse engineering contributes

REA documents connecting an agent to inspection tools and collecting evidence about app behavior. That is materially different from reproducing the complete original source tree from screenshots. A clone, a reconstructed implementation, recovered source, and an analysis toolkit are different deliverables. [REA](https://github.com/morluto/rea)

For this project, the transferable method is behavioral observation: inspect how a reference handles camera controls, characters, audio, and scene readability; document visible behavior; reproduce the desired experience in our own implementation. There is no identified proprietary format or binary dependency to reverse engineer. Evaluate licenses before incorporating reference code or assets into the public repository.

## Faster visual production

My recommendation is to choose a consistent visual target before expanding procedural art. Use a small asset family with compatible proportions and materials rather than unrelated impressive individual models. Candidate sources include Kenney's CC0 Furniture Kit and Quaternius's CC0 Universal Animation Library. Their availability does not establish that their style or skeletons fit our scene; test one character and one animation before adopting an entire pack. [Kenney](https://kenney.nl/assets/furniture-kit), [Quaternius](https://quaternius.com/packs/universalanimationlibrary.html)

Use custom modeling only where existing assets fail the visual target. Treat any Blender integration as a separate optional tool decision, not a prerequisite for an initial browser build. Record source URLs, license files, downloaded versions, scale, material count, rig compatibility, and exported asset sizes.

Keep rendering measurable. React Three Fiber documents geometry/material reuse, instancing, and avoiding unnecessary work in animation loops. [Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)

## Proposed working cycle

### 1. Set the visual and behavioral target

Prepare two or three distinct art directions for a single room: lighting, camera distance, character proportions, furniture, and interface placement. Select a concrete target before extensive scene refinement. The scene should dominate the experience; the chronicle supports it.

Write three visible journeys:

- A traveler reaches the bar, obtains a drink through a valid purchase, visibly drinks, and later remembers a relevant interaction.
- Two inhabitants meet, converse, and change a relationship through confirmed events.
- A musician offers an opportunity; another inhabitant can accept or decline; a valid performance has an appropriate visual and audio representation.

These journeys are proposed pilot scenarios, not evidence of behavior already implemented.

### 2. Make completion independently checkable

Map original requirement IDs to acceptance cases, code owners, and evidence. The current English implementation brief is only a summary; retain traceability to the full original specification rather than allowing omitted details to disappear.

Define fixtures for a quiet evening, a busy bar, a musical opportunity, and reconnecting spectators. Fixtures should use fixed seeds and injectable time. Keep browser-only diagnostics read-only and development-only; never expose a way for spectators to mutate the canonical world.

For each meaningful journey, inspect three layers:

| Layer               | Evidence                                                                             |
| ------------------- | ------------------------------------------------------------------------------------ |
| Domain              | Preconditions, effects, economic invariants, relationship and memory changes         |
| Persistence/network | Durable events, restart recovery, coherent two-client versions, reconnection         |
| Presentation        | A real visible gesture, camera usability, readable history, measured rendering costs |

An event saying someone traded is insufficient evidence of an inventory transfer. A screenshot of someone beside a table is insufficient evidence of obstacle avoidance. A rendering benchmark in headless Chromium is not a hardware FPS guarantee.

### 3. Execute one coherent slice at a time

Each slice gets a small objective, relevant context, constraints, and an explicit completion condition. This format is consistent with official Codex guidance. [Codex best practices](https://learn.chatgpt.com/guides/best-practices)

Plan, implement, run checks, inspect the result, repair observed failures, and record status. Reuse passing unchanged evidence instead of repeatedly running every tool. Save commands and error logs so a subsequent session can resume immediately. Anthropic's earlier harness work similarly emphasizes feature lists, incremental work, clean checkpoints, and browser verification. [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

### 4. Use parallel agents only when appropriate and authorized

This research did not spawn agents. If the user later authorizes delegation, split work after shared contracts are stable: simulation/persistence, scene/assets, and focused review or QA. Assign non-overlapping files or isolated worktrees. Keep one integration owner. A reviewer should look for missing acceptance evidence, rather than simply repeat the implementation's own assertions.

The number of agents should be limited by independent work and integration overhead. A tiny early codebase usually benefits more from stable contracts than simultaneous rewrites.

### 5. Inspect the actual experience and stop when the slice is sound

Evaluate visual identity, character legibility, believable motion, causal interactions, performance, and observer usability. Compare against saved references and inspect screenshots. Playwright assertions can retry until the expected UI condition holds, making state-based checks more useful than fixed arbitrary sleeps. [Playwright assertions](https://playwright.dev/docs/test-assertions)

Keep the best working version. More iterations are justified by a specific remaining defect or unmet criterion, not by an assumption that the latest result must be best.

## Applying this to the current prototype

Observed in this session before implementation was paused:

- Web and server started locally on ports 5173 and 3001.
- A frontend build and strict TypeScript check passed during setup.
- Two headless simulation tests passed; two Playwright UI tests subsequently passed.
- A desktop screenshot was inspected and shows a rendered procedural room and inhabitants.
- The last dependency installation reported zero npm-audit vulnerabilities.

These checks do not establish the complete MVP. The current code still uses placeholder chat and trade activity, has no persistent store, lacks obstacle avoidance and a narrative director, and sends full snapshots. The UI tests do not verify two-client world consistency or restart continuity. The build also reported a large frontend bundle. The public GitHub repository currently contains only the initial committed foundation; the subsequent prototype changes are local and uncommitted.

The proper next step is to use this prototype for rapid reference comparison and contract tests, then improve the missing behavior. Rewriting the stack or integrating an orchestration framework would require a specific demonstrated benefit.

## Proposed delivery sequence

| Delivery         | Visible outcome                                                           | Gate                                                              |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Preparation      | Chosen art direction, compatible sample assets, executable acceptance map | Visual target and pilot journeys are concrete                     |
| Core behavior    | Movement plus a valid drink purchase and real social interaction          | Preconditions and server consequences agree with visuals          |
| Continuity       | Persistent world and shared spectator state                               | Restart, no-viewer progress, reconnect, and two-client tests pass |
| Narrative        | Director opportunity with acceptance or rejection and memory              | No forced or invented outcome                                     |
| Visual polish    | Cohesive character animation, lighting, camera, opt-in audio              | Browser review and measured rendering costs                       |
| Public operation | Protected administration, deployment, backups, health checks              | Operational checks and user-authorized hosting                    |
| Optional AI      | Exceptional dialogue through a bounded gateway                            | Off/failure/quota modes verified                                  |

This sequence organizes the existing requirements; it does not reduce the original MVP definition or silently promote P1 features into P0.

## Time and efficiency expectations

A compelling single-room prototype in a few hours is a reasonable target to test, not a guaranteed schedule. A complete persistent service needs broader verification and operational work. Estimate after a pilot slice: record active agent time, human review time, environment delays, first-pass acceptance, repair iterations, and remaining acceptance cases. Report progress against named criteria, not an invented percentage of total code.

Keep development usage separate from future runtime NPC-model spending. Installing skills does not provide free inference or expand an account's limits. Autonomous code work and AI-driven inhabitants are distinct systems and budgets.

Productivity evidence should be interpreted carefully. METR's February 2026 update says newer tools likely accelerate developers more than its early-2025 study suggested, but selection effects make the magnitude uncertain. This supports measuring our actual workflow rather than borrowing a universal speedup claim. [METR update](https://metr.org/blog/2026-02-24-uplift-update/)

## Proposed execution prompt

> Build the next verified LiveTabern slice using the selected visual references and the requirement acceptance map. Keep all project artifacts in English. Preserve one authoritative persistent world and external AI off by default. Use only skills relevant to this slice. Run the application, inspect the real scene and interaction, verify the server consequences and persistence when affected, and repair observed failures before declaring completion. Record the exact evidence, remaining limitations, and the next executable step. Keep paid services and deployment separately authorized. Treat labeled placeholder activity as unfinished behavior.

## Decision to review before implementation resumes

Adopt the lean workflow and evaluate a small skill set; define the art direction and pilot journeys; then continue from the existing local prototype. Consider formal OpenSpec tracking only if the requirements map and backlog become insufficient. Preserve tests, visual references, and state diagnostics as the main accelerators of reliable autonomous work.
