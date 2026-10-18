# Phase 4 — presentation, scoring and progression

## Delivered

- Classic Palm and Modern themes share one strict engine. New CSS patterns/letters identify blocks without relying on colour. Normal/Fast/Off motion settings respect reduced motion automatically.
- Original audited pack-score calculation, best completion records and repeated five-point solution penalties are wired to the screen. Cancelled, missing or invalid solutions are free; a previous at/below-par completion makes viewing free. Player/previous replays never charge.
- Default progression unlocks one beyond the highest solved level; the labelled Practice setting opens all 59. Returning from an in-progress locked practice level asks before discarding it. Completion records survive restart/undo/recall for the tab and keep best moves. This replaces Phase 3's unrestricted default picker.
- Memorize/Recall use the audited engine checkpoint commands. Recall restores board/moves/command log and clears undo history; restart clears the checkpoint. Normal undo retains 15 complete gestures.
- Current and previous attempt playback use recorded committed commands. The modal supports stepping backward/forward, play/pause, start over and Escape/Return. Native dialog focus management prevents interaction with the underlying game; closing restores focus. Player engine state is never replaced by playback state.
- All 59 puzzles have full, freshly derived solution paths. The modal starts at the original board. The score penalty is applied after availability/validation and confirmation, before opening, and remains even after early exit. Newly derived paths can exceed historical par, which remains unchanged.
- Settings and help explain controls, original scoring, memory, penalties and progression. Progress and settings remain in memory for this tab. Saved progress/offline/hosting remain Phase 5; no deployment is performed here.

## Motion and interaction boundary

`presentation.ts` projects engine events onto stable block identities: slide, simultaneous falling passes and removal. Frames neither recompute rules nor mutate engine state. The final board/counters are committed before animation. Visual sprites sit above the labelled logical grid; engine coordinates remain the hit-testing authority.

While sprites resolve, the grid reports busy/disabled and rejects fresh gameplay gestures. An in-flight action is never committed twice. Undo can interrupt motion immediately and restore the authoritative snapshot. Settings, tab hiding or a newly enabled reduced-motion preference fast-forward to the committed result. Timers and media listeners are cleaned up on changes/unmount. Replay has its own step timer, pauses when hidden, and never changes player counters/history/checkpoint/completions.

## Solution authoring and validation

`npm run solutions:derive` requires Node and a C++17 compiler named `c++`. It builds a temporary binary, searches only the cleared runtime Classic boards, and verifies each output command through the strict TypeScript engine. The binary and search queue never enter the web bundle. Search has state/time bounds and a second heuristic; failure aborts without writing a partial runtime asset. It produces valid paths, not necessarily optimal paths. Equal-cost search ordering can differ between native standard libraries; validity and provenance are the contract, not cross-platform byte-identical search output.

The committed JSON records schema/rules version 1, GPL-2.0-or-later, board-only origin and source runtime pack SHA-256. CI checks that hash and replays every path. Browser loading validates supported schema, pack/level IDs, complete unique coverage, bounded command lengths, coordinates/directions, single-cell moves and final completion before offering the viewer or charging. Original recorded solutions remain research fixtures and continue to power compatibility tests, not the shipped viewer.

`replayData.ts` reconstructs playback states from initial level plus strict commands. The modal receives those states, not a writable player session. Duplicate DOM IDs are avoided with a replay-grid prefix. No runtime solver, progressive hints, original artwork or audio was added.

## Validation

`npm run check` covers lint, strict app/domain/test/tool types, presentation identity and simultaneous-motion tests, isolated replay/invalid-data tests, all 59 newly derived solutions, existing original-C fixtures, all 4,016 historical solution audits and build. `npm run test:e2e` covers desktop, emulated tablet and 360px phone against the GitHub Pages subpath.

Browser scenarios include four-move original completion; unlocks and free at-par viewing; repeated/cancelled solution penalties; exact board/move restoration plus preserved undo/checkpoint; current/previous replay; checkpoint recall; theme switching; Practice; reduced motion; rapid pointer input with a deterministic clock; load/schema failure without penalty; and prior touch cancellation/multi-touch/resize coverage. Touch-only scenarios skip desktop. Local native browser review covers Modern settings and the solution modal. Emulated coverage does not replace the physical-device and assistive-technology release checks in Phase 6.
