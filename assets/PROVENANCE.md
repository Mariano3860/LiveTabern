# Asset provenance

The room, furniture, characters, props, flames, and animations are original procedural geometry implemented in apps/web/scene.tsx. No external game models, textures, audio recordings, or extracted proprietary assets were imported.

Audio is generated with browser oscillators in apps/web/audio.ts; the melody is a short original eight-note loop. It is an initial sound representation, not a recorded band performance or generated vocal track.

The interface requests DM Sans and Playfair Display from Google Fonts, with system fallbacks. The fonts are external resources; their upstream source and license notices are available from the Google Fonts repositories. Self-hosting and recording exact font revisions is a production follow-up.

Before adding external runtime assets, record the source URL, exact file/version, license and notice file, transformations, and resulting size. A repository's source license does not automatically cover assets it links to.
