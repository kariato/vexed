# Phase 0 — source audit and compatibility evidence

**Date:** 2026-10-17  
**Status:** Original sources acquired; core behavior inspected and executable reference baseline established. Representative Palm UI behavior is now observed in CloudpilotEmu; exhaustive UI parity and publication clearance for later metadata/contributor packs remain open. No web application is implemented.

## Sources and exact identity

Retrieved from the [PalmDB Vexed archive](https://palmdb.net/app/vexed), which lists these as version 2.2. The [original project download page](https://vexed.sourceforge.net/page1/download.html) corroborates the 2.2 release and external packs. This audit pins the mirror payload; an archive name is not proof of an authenticated upstream release. No upstream signature was verified.

| Artifact | Download or nesting | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Source ZIP | https://palmdb.net/content/files/games-puzzle/vexed/vexed22_src.zip | 1,656,051 | `ef8cb01779ee340a6c5a354a8e3ac4f37760e78fb4668b95617993099d14f503` |
| Source TGZ | `vexed22_src.zip → vexed22_src.tgz` | 1,657,339 | `3eef78add151ef0b0159389e07ef02d81c466e39a99f714664409de2d1a6f58f` |
| Release wrapper ZIP | https://palmdb.net/content/files/games-puzzle/vexed/vexed22.zip | 889,791 | `8b468db6ec833df9479bcf8bc3c42eac5034a3ae4536c112945dbc7c51e33b2e` |
| Nested release ZIP | `vexed22.zip → vexed22.zip` | 295,905 | `6d0053b9ca007388ca0c191e4ae57f6e249e667fd5a99d61f1205ba18e5752b5` |

The mirror ZIPs include 2021 wrapper timestamps; inner release files include 2006/2007 timestamps. Do not infer engine version from a wrapper timestamp. Source has historical comments naming earlier versions; the pinned bytes are the audit authority.

[source-manifest.json](source-manifest.json) records hashes and sizes for every extracted source-tree file, including CVS metadata, original binaries and packs. Original archives and extracted files are cached locally in ignored `.reference/`; they are not published in Git. They can be retrieved again from the URLs and verified against these hashes.

Additional reference: [official instructions](https://vexed.sourceforge.net/page2/instructions.html). Source inspection resolves important details beyond those instructions. The Windows and Flipper remakes are not required for this baseline and have not been used as authoritative substitutes.

## Results

| Dataset | Packs | Levels/solution replays | Failures |
| --- | ---: | ---: | ---: |
| Source INI | 19 | 1,138 | 0 |
| Source PDB | 48 | 2,878 | 0 |

These sets overlap. **4,016 successful runs do not represent 4,016 unique puzzles.** The shipped PDB catalogue has 2,878 entries; no deduplication across levels/packs is claimed. All 48 release PDB files match corresponding source-tree PDB files byte for byte. Do not promise “2,900+” based on another port's catalogue.

Each board passes strict 10 × 8 validation. Each solution has an even number of characters, valid in-bounds coordinates, and one uppercase direction marker per pair. Every solution reaches a board containing no movable blocks using native original-C gameplay routines. Par is the number of encoded pairs. The harness's scored replay mode counts those attempted steps; the actual Palm solution UI uses its unscored path.

See [pack-audit.json](pack-audit.json) for per-file author, hash, count and failure results.

### Harness boundaries

The reference script extracts seven original C functions from `game/game.c` and compiles them locally with `cc`. Drawing, sound, delay, preference UI and replay storage are disabled. `MoveAnimation` is replaced with its final board assignment; all movement, settling, matching, stop and win logic comes from the original functions.

This is stronger evidence than replaying through a newly guessed rules engine, but it is not a Palm executable run. It additionally wraps original release/undo/solution event cases, `ExitSolution`, and `CalcScore` with controlled Palm-service stubs. Twenty-three assertion-backed handler cases pass. This does not reproduce the Palm event queue or physical tablet behavior. Separately, the original binary was run in CloudpilotEmu; [EMULATOR.md](EMULATOR.md) records setup, observations, and screenshots.

### Recorded fixtures

- `tests/fixtures/reference/classic.json`: levels 0–29, source hashes, original solution strings, decoded commands, and initial/every intermediate board.
- `tests/fixtures/reference/gestures.json`: four synthetic original-core cases (multi-cell scoring, blocked attempt, gravity stops drag, match stops drag).
- `tests/fixtures/reference/handlers.json`: 23 snapshots from original scoring, tap/drag, history and solution handlers, driven by assertion-backed `scripts/reference_handler_cases.c`.
- Fixture commands are `[x, y, direction, distance]`; direction 1 = left, 2 = right. Rows use `#` wall, `.` air, `a`–`h` blocks.

Thirty Classic fixtures are source-executed reference observations, not manually checked emulator screenshots. Four synthetic expectations also have hand-written assertions. Fixtures are versioned as generated evidence; do not regenerate them to conceal a TypeScript mismatch.

## Corrections to the blueprint

1. A gesture may count multiple horizontal steps but consumes only one undo snapshot.
2. Any gravity or match removal ends further steps, even if occurring away from the dragged block.
3. Gravity settles completely before simultaneous matching.
4. A blocked intermediate step can count a move in original Classic semantics.
5. Solution penalties have an at-or-below-par exemption; penalized repeated openings accumulate in base score.
6. The displayed active-level score is more complex than a sum of completed-level differences.
7. Original transient undo/memory/replay persistence differs from the web recoverability goal.
8. Visible 2.2 level labels are one-based (`game/gfx.c` and emulator), despite documentation describing zero-based labels; IDs remain zero-based.
9. There are only 19 plaintext INI packs in this archive; PDB parsing is necessary for the remaining source catalogue.

[RULES.md](RULES.md) supersedes unverified engine, scoring and undo assumptions in both planning documents. The design's GitHub Pages/tablet requirements remain unchanged.

## Decisions and next work

Use the original core as the reference contract and a source-informed GPL-2.0-or-later implementation path, with [licensing limitations](LICENSING.md) retained for packs/art. Keep the TypeScript simulation independent of DOM, React, storage and animations.

Phase 0 disposition and later release checks:

- Representative emulator checks for cross-row tap, gravity-stop drag, undo and solution-view restoration are complete. Native original-handler tests cover blocked intermediate paths. Extend coverage when a concrete discrepancy requires it.
- Score/undo event-case fixtures now cover repeated penalties, cancelled viewing and at/below-par exemption; original Palm queue timing and complete playback remain broader release validation tasks.
- All 59 Classic board layouts exactly match explicit GPL-covered Vexed 1.3 arrays; see [classic-provenance.json](classic-provenance.json). Later titles/solution strings and contributor packs still require independent provenance decisions before shipping them. The board-only MVP can use generic level labels and newly recorded/derived solutions.
- Compare original UI behavior at boundaries/cancellation with the safe Pointer Events policy. Preserve audited valid-move rules while rejecting malformed/out-of-bounds browser input.

**Phase 0 disposition:** The source/rules audit, representative native and emulator fixtures, and scoped Classic board provenance provide a usable contract for Phase 1. Remaining contributor-content decisions and broader compatibility checks are tracked release work, rather than reasons to guess the engine rules.

**Next implementation milestone:** Vite/strict TypeScript scaffold and pure engine tested against the frozen reference boards, plus gesture-level history and score tests. No TypeScript engine should be called compatible merely because hand-authored examples pass.

## Reproduction

From repository root with the pinned source extracted under `.reference/source/vexed`:

```sh
python3 scripts/audit_reference.py .reference/source/vexed --check
```

To verify the Classic board provenance after extracting the pinned Vexed 1.3 archive to `.reference/vexed13`:

```sh
python3 scripts/audit_classic_provenance.py .reference/vexed13 .reference/source/vexed --check
```

Original 1.3 source URL and archive/file hashes are in `classic-provenance.json`. All 59 boards match exactly; this is a scoped provenance comparison, not a license inference about unrelated metadata.

Requires Python 3 and `cc`; no third-party Python packages or historical executables are needed. Every source-tree file is checked against the source manifest before compiling. `--check` compares generated fixture/report bytes to committed outputs; without it, the tool regenerates them. Failed replays produce a nonzero exit status.

## Phase 2 follow-up

The TypeScript engine now passes every original source solution replay: 4,016 sequences and 74,589 counted steps across overlapping INI/PDB datasets. Conversion and replay reports are committed alongside this audit. The full comparison identified one Classic II alternative-solution/par variant and one empty-origin step appearing in both formats. Both are explicitly pinned and documented rather than ignored.

Selected raw INI/PDB inputs are now committed as private development fixtures so CI can reproduce conversion without ignored downloads. Archives, original game executables and the emulator session remain ignored. Runtime output is limited to the scoped 59-board Classic pack with generic labels and par counts.
