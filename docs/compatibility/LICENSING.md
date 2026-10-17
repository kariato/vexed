# Provenance and distribution decisions

This records observed notices and project implementation policy, not a claim that all bundled third-party material has received separate permission.

## Source code

The audited `game/game.c` header credits James McCombe (1999) and The Vexed Source Forge Project Team (2006), and explicitly offers GPL version 2 **or any later version**. `game/license.txt` contains GPLv2. Other inspected game/converter files include equivalent notices; see the source manifest for exact hashes.

Decision: use a source-informed port and GPL-2.0-or-later for derived reference tooling and future derived engine work. Do not describe this as a clean-room implementation. Preserve upstream notices, mark modifications, include the license, and make corresponding source available with any public distributed build. A GPLv2 copy is retained at `LICENSES/GPL-2.0.txt`. The reference tool compiles original function bodies with a documented replacement presentation layer.

## Level packs

Classic INI credits **James A. McCombe**; other authors and exact file hashes are in `pack-audit.json`. General metadata is attribution, not an explicit license grant. The source archive bundles INI/PDB packs alongside the GPL game, but the audited pack files do not themselves establish a separate unambiguous pack-specific redistribution grant.

Decision: retain downloaded originals locally in ignored `.reference/`; commit provenance, bounded compatibility fixtures and audit output to this private research repository. Do not publish the original catalogue or promise that every pack is redistributable until project-level pack licensing evidence is recorded. Generated fixture boards are derived puzzle data and also need inclusion in that publication review. Public Pages release remains gated on this; private research progress can continue.

## Graphics, audio and other material

`game/credits.txt` names graphics contributors Matt McClintock, David Croy, and Lukasz Grupa. Do not import original bitmaps, artwork or Palm binaries into the web bundle yet. Prefer newly authored CSS/SVG patterns and optional newly authored sounds for the initial implementation. Preserve other credits if upstream material is later reused.

## Publication follow-up

- Find an authoritative statement covering puzzle-pack redistribution, including contributor packs and Classic titles.
- Verify each shipped asset and dependency's notices; publish source, modification notices and credits with the build.
- Keep fixtures and reference tooling attribution distinct from newly authored UI assets.
- No top-level license is assigned retroactively to the supplied planning documents by this audit.
