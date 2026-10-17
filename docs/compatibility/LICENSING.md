# Provenance and distribution decisions

This records observed notices and project implementation policy, not a claim that all bundled third-party material has received separate permission.

## Source code

The audited `game/game.c` header credits James McCombe (1999) and The Vexed Source Forge Project Team (2006), and explicitly offers GPL version 2 **or any later version**. `game/license.txt` contains GPLv2. Other inspected game/converter files include equivalent notices; see the source manifest for exact hashes.

Decision: use a source-informed port and GPL-2.0-or-later for derived reference tooling and future derived engine work. Do not describe this as a clean-room implementation. Preserve upstream notices, mark modifications, include the license, and make corresponding source available with any public distributed build. A GPLv2 copy is retained at `LICENSES/GPL-2.0.txt`. The reference tool compiles original function bodies with a documented replacement presentation layer.

## Level packs

Classic INI credits **James A. McCombe**; other authors and exact file hashes are in `pack-audit.json`. General metadata is attribution, not an explicit license grant. The source archive bundles INI/PDB packs alongside the GPL game, but the audited pack files do not themselves establish a separate unambiguous pack-specific redistribution grant.

Follow-up evidence resolves the **Classic board layouts**: the original Vexed 1.3 `globals.c` explicitly carries James McCombe's GPL-2.0-or-later notice above its embedded board array. All 59 boards match the 2.2 Classic INI exactly, as verified by `scripts/audit_classic_provenance.py` and [classic-provenance.json](classic-provenance.json). This supports using those layouts under GPL-2.0-or-later with their notices; it does not automatically cover later level titles, encoded solutions or contributor packs.

Decision: the MVP may use the 59 GPL-covered Classic layouts, generic numbered titles and newly recorded/derived solutions. Keep later metadata and contributor packs out of a public build until their applicable terms are established. Existing private reference fixtures contain original titles/solution strings and are research evidence, not automatically cleared runtime assets. Retain original archives locally in ignored `.reference/`.

The [official project history](https://vexed.sourceforge.net/page7/vexedproject.html) corroborates the GPL release of 1.3. The [official FAQ](https://vexed.sourceforge.net/page3/page5/faq.html) expressly describes sharing Vexed together with a level pack by beaming, but does not specify terms for modified web data. The [level-pack page](https://vexed.sourceforge.net/page3/page6/levelpacks.html) is unfinished. Searches of the pinned pack INI/text files did not find a separate license notice. These observations support provenance research, not a blanket license assertion.

## Graphics, audio and other material

`game/credits.txt` names graphics contributors Matt McClintock, David Croy, and Lukasz Grupa. Do not import original bitmaps, artwork or Palm binaries into the web bundle yet. Prefer newly authored CSS/SVG patterns and optional newly authored sounds for the initial implementation. Preserve other credits if upstream material is later reused.

## Publication follow-up

- Classic layouts are traced to explicitly GPL-covered source. Continue provenance work for contributor packs, later Classic titles and encoded solutions; use the scoped board-only MVP policy in the meantime.
- Verify each shipped asset and dependency's notices; publish source, modification notices and credits with the build.
- Keep fixtures and reference tooling attribution distinct from newly authored UI assets.
- No top-level license is assigned retroactively to the supplied planning documents by this audit.

## Emulator research assets

The official Cloudpilot example session is used locally as a test environment only. Its availability is not treated as permission to redistribute a Palm ROM/session; neither is committed or shipped. EMULATOR.md records its hash and origin. Screenshots document the original app in this private research repository.
