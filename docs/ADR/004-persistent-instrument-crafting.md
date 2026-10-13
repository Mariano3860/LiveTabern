# Persistent instrument crafting

## Decision

Implement the apprentice's first instrument with the existing authoritative action planner and existing chest used as a workbench. No new dependency, generated code, external asset, or model call is required. The recipe is three pieces of wood and one set of strings for one lute.

A persisted delivery flag introduces exactly one starter kit through a durable system event on the first tick. Legacy snapshots default to an empty, undelivered workshop. Existing identity, possessions, and history stay intact. Snapshot validation balances supplied materials against remaining materials and completed lutes, and balances lute ownership against the original instrument plus crafted instruments.

Pip must walk to the shared workbench position and have at least thirty energy. Arrival starts a twelve-second deadline without consuming materials or creating an instrument. Completion revalidates location, role, ownership, energy, materials, enabled capability, matching plan ID, and command watermark. It consumes the recipe, creates the owned lute, charges ten energy, and records a completion event and participant memory together. Disabling crafting cancels work without spending materials. A cancelled attempt must start the full work duration again.

The unfinished plan and its deadline survive snapshots. Bounded recovery uses normal ticks; extended time skipping shifts only active deadlines, preserving zero as the marker for work not yet started. This also preserves arrival semantics for other walking plans.

Confirmed working state drives the tool pose. Confirmed instrument ownership enables the existing music action and lute geometry. Public profiles show instruments, the workshop panel shows material totals, and older crafting demands can be marked fulfilled. Available musicians can pair with the new performer; the first two cast members do not monopolize selection when three are available.

## Limits

Only the apprentice's first lute is supported. The starter kit is finite, with no crafting trade, recurring supplies, damage, additional recipes, larger bands, or player commands. The server still owns all decisions. Further inventory features must extend the provenance equations and snapshot migration deliberately.

## Verification

Simulation checks cover the actual navigation path, premature and forged commands, completion timing, duplicate protection after cache trimming, disabled work, missing materials, insufficient energy, role constraints, subsequent music, fulfilled wishes, snapshot reopening, old-world delivery, ownership validation, and long-absence recovery. The seven-day soak also balances workshop resources and requires exactly one crafted lute.

The browser acceptance world starts Pip away from the bench and stage. It observes walking, unfinished work with materials intact, the tool animation, completed ownership, and subsequent live music. Captures come from the real journey rather than a final-pose injection.
