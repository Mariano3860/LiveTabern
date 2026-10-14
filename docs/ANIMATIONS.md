# Character animation catalogue

Open **Actions & motion** in the spectator sidebar to browse all eight supported activities. Each entry explains its prerequisites and visible movement, separates travelers currently performing from those still walking there, and offers **Watch** to open a participant's profile and follow them with the camera. Idle travelers are excluded. Counts come directly from the latest confirmed shared world; after a disconnect, the panel labels them as last confirmed activity until reconnection. Browsing and following never command an inhabitant or change the world.

The browser loads the curated CC0 Quaternius animation file and plays its in-place clips on the existing 65-joint character rigs. The authoritative world still owns action, position, collision avoidance, and arrival. Animation reacts to those confirmed states; it does not move an inhabitant or invent a server action.

| World action or state       | Character performance                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Walking                     | Full-body `Walk_Loop`, slowed per character to 0.82–0.925 playback speed. Each traveler starts at a different point in the loop, and the server remains responsible for movement.  |
| Idle / unseated rest        | `Idle_Loop` or `Idle_FoldArms_Loop`, with the existing restrained breathing motion.                                                                                                |
| Taking a seat / standing up | `Sitting_Enter` and `Sitting_Exit` crossfade into or out of the corresponding travel or seated loop.                                                                               |
| Seated rest / conversation  | `Sitting_Idle_Loop` or `Sitting_Talking_Loop`.                                                                                                                                     |
| Drinking                    | `Consume` animates each sip, followed by a relaxed held-mug pose and a character-specific pause before the next sip.                                                               |
| Serving at the bar          | `PickUp_Table` transitions into `Idle_Torch_Loop`, with the mug attached to the right hand.                                                                                        |
| Conversation / trade        | `Idle_Talking_Loop`; `Interact` leads into conversation for trade. A coin appears during a confirmed trade.                                                                        |
| Music / duet                | Lute players use the relaxed two-hand `Idle_Lantern_Loop` pose; singers use `Idle_Talking_Loop` as a light vocal gesture. Sound still only plays for a confirmed live performance. |
| Dancing                     | Looping `Dance_Loop`.                                                                                                                                                              |
| Instrument crafting         | Looping `Fixing_Kneeling` beside the existing workbench, with the hammer in hand.                                                                                                  |

Non-loop transitions blend over 0.32 seconds. Loop speeds and initial phases vary deterministically by inhabitant, so a crowd does not move in lockstep. Drink cycles and sitting transitions stay on the client presentation side. Reduced-motion mode slows the skeletal mixer and disables the extra hand motion and idle breathing.

The playable list is intentionally curated rather than mirroring every clip in the source packs. Source links, CC0 notices, archive digests, exact retained clips, and the reproducible extraction script are recorded in [`assets/PROVENANCE.md`](../assets/PROVENANCE.md). The catalog test checks every currently enabled world action; browser E2E confirms the runtime GLB is fetched alongside the character rigs.
