# Character and animation catalogue

Updated: 2026-10-13

This catalogue separates executable world actions from the motions shown by the browser. It
also records external character assets worth testing, including their formats, licenses, and
gaps.

## LiveTabern actions and visuals

The eight action IDs live in [world.ts](../packages/shared/world.ts). Character geometry and
motion are currently procedural in [scene.tsx](../apps/web/scene.tsx); the project has no
imported humanoid model or animation clips yet. The client derives its poses from the
server-confirmed action and phase.

| Action | Current visual |
| --- | --- |
| `wander` | Walking gait, smooth turning, and a brief idle when the route ends. |
| `rest` | Seated pose near a seat with relaxed arms and subtle breathing. |
| `drink` | Mug in hand and repeated hand-to-mouth movement. |
| `chat` | Turns toward a partner, gestures, and nods. |
| `trade` | Faces a partner and reaches out with a small exchange prop. |
| `play_music` | Holds and strums a procedural lute; opt-in audio is generated separately. |
| `dance` | Sways, bounces, and moves both arms and legs to a rhythm. |
| `craft_instrument` | Faces the workbench and repeats a hammering gesture. |

Borin's serving pose is inferred from a guest performing `drink`. It is a visual cue, not a
ninth executable action. Likewise, `capabilityCatalogue.animation` currently stores a
symbolic action ID, not the name of a clip inside a 3D asset.

## Public assets worth evaluating

### Innerscene: realistic human GLBs

[Locomotion collection - Maya](https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-maya-3d-person-animated-1499b2fd)
is the strongest first web-ready candidate found. The page offers a 20.3 MB GLB with a skinned
character, a 53-bone rig, and seven named looping motions: idle, relaxed walk, brisk walk,
jog, run, carrying, and sit/stand. It is CC0 and built from MakeHuman/MPFB assets. The
motions are authored pose loops, not motion capture, and Maya wears modern casual clothes.
The library lists this file until 2029-10-08, so any adopted model must be stored with the
project rather than fetched at runtime.

[Slow body roll](https://www.innerscene.com/tools/library/3d-parts/slow-body-roll-dancing-3d-person-animated-39377175)
is a separate 19.6 MB, four-second dance loop at 120 BPM, also CC0 and using a 53-bone rig.
It is a useful dance candidate. Its skeleton compatibility with the selected character still
needs an import test.

Innerscene also has useful reference poses such as
[Seated conversation](https://www.innerscene.com/tools/library/3d-parts/seated-conversation-3d-person-seated-c5931842)
and [Seated holding a cup](https://www.innerscene.com/tools/library/3d-parts/seated-holding-a-cup-3d-person-seated-0d6b7ac6).
These are CC0 static meshes without an armature or animation. They can guide the design of
a taberna pose, but they cannot be played as runtime clips. Its library also lists standing
gestures, seated/resting figures, and everyday-task poses.

### Other animation sources

[Adobe Mixamo](https://helpx.adobe.com/creative-cloud/help/mixamo-rigging-animation.html)
offers a broad humanoid rigging and animation workflow. Adobe's FAQ says an Adobe ID is
enough, and that its characters and animations may be used royalty-free in games. It is
limited to bipedal humanoids and needs an FBX import/export step for this project. The FAQ
was last updated in 2021, so recheck the live terms when downloading. Treat these as
licensed project assets, not CC0 source files.

[Quaternius Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html)
and [Library 2](https://quaternius.com/packs/universalanimationlibrary2.html) offer 120+
and 130+ CC0 retargetable humanoid motions, respectively. They are promising for a
consistent stylized direction and broad background coverage. Pair them with the
[Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html),
which average 13k triangles and are explicitly compatible with the library. Their art
direction is low-poly/stylized, so they do not meet the more realistic character goal by
themselves.

## Action-to-animation coverage

| Action | Existing project motion | Reusable candidate found | Work still needed |
| --- | --- | --- | --- |
| `wander` | Procedural walk and idle | Maya: relaxed walk, brisk walk, idle | Match clip speed to server path speed and test turns. |
| `rest` | Procedural sitting pose | Maya: sit/stand transition and idle | Align seat height; add a held seated pose and safe recovery. |
| `drink` | Procedural mug gesture | Static seated-cup pose only | Animate pickup, sip, and lower; keep the mug in the hand. |
| `chat` | Paired facing, gestures, and nod | Static seated-conversation pose only | Add a paired conversation loop and varied gestures. |
| `trade` | Procedural reach and token | None verified | Animate a timed, two-person handoff. |
| `play_music` | Procedural lute strumming | None verified for lute playing | Author or source a compatible lute performance; retain prop alignment. |
| `dance` | Procedural sway and bounce | Innerscene slow body roll | Test retargeting and add one or two tavern-friendly variations. |
| `craft_instrument` | Procedural hammer gesture | None verified for hammering | Author a work loop that contacts the workbench and tool. |

The realistic pack fills locomotion and one dance style. Drinking, conversation, item
handover, lute playing, and hammering need authored or separately sourced clips. A pose image
or static seated GLB does not count as a reusable animation.

## Recommended integration standard

1. Start with one locally stored, CC0 rigged character. Test the Maya model in the room and
   check its scale, clothing fit, skinning, shadows, and seat height before changing the cast.
2. Keep movement on the server. Use in-place walk clips while the browser interpolates
   server-confirmed positions, so the character root cannot disagree with collision and path
   results.
3. Define an explicit mapping from each action phase to preparation, loop, and recovery clips.
   Cross-fade transitions and align hands, instruments, cups, tools, seats, and partners.
4. Synchronize clip time from confirmed world time and stable character/action identity so
   two spectators see the same moment. Keep visual animation separate from economic effects.
5. Optimize the GLB and textures, share geometry across character clones, and measure load
   size, draw calls, and frame time with all 15 inhabitants on desktop and mobile.
6. Record each source URL, exact filename, license, retrieval date, transformation, and
   checksum in [PROVENANCE.md](../assets/PROVENANCE.md). Vendor assets locally; do not make
   a production scene depend on a third-party download URL.

A warm semi-realistic look is the best fit for this tavern: human proportions and cloth
materials, with restrained face detail and colors that still belong beside the handcrafted
wood, stone, and candlelight. A photoreal business outfit would make the medieval scene feel
less coherent. Keep the current procedural characters as a fallback until the new model and
the action transitions pass visual review.
