# Vexed Web — TypeScript/Vite Implementation Plan

> **Phase 0 update (17 October 2026):** Original source audit and executable core evidence are now in [REFERENCE.md](docs/compatibility/REFERENCE.md). [RULES.md](docs/compatibility/RULES.md) supersedes the provisional movement, undo and scoring assumptions in this blueprint. [DESIGN.md](DESIGN.md) specifies GitHub Pages and tablet requirements. Remaining Palm UI and licensing checks are explicit; the web application is not implemented.

**Status:** Implementation blueprint (not implemented)  
**Date:** 17 October 2026  
**Target:** Responsive, touch-first, installable web port of Palm OS Vexed 2.2  
**Primary stack:** TypeScript (strict), Vite, React, CSS/SVG, Vitest, Playwright, PWA, Firebase Hosting  
**Design principle:** Faithful deterministic rules first; presentation, controls, and enhancements afterward.

---

## 1. Mission and boundaries

### Mission

Build a modern web game that preserves the original Vexed puzzle experience, including 10×8 board geometry, matching block elimination, gravity, chain reactions, level packs, par scoring, undo, restarts, and original solutions. It must feel natural with a finger on a modern phone and remain usable with mouse, stylus, and keyboard. Once installed and cached, it must run offline without an account or server.

### Non-negotiable outcomes

1. **Puzzle fidelity:** The same starting board and valid sequence of moves yield the same final state as the Palm game for every imported level that has a reference solution.
2. **Touch fidelity:** Players can drag blocks horizontally or select a block and tap a destination. Gestures work on narrow portrait screens without page scrolling, accidental moves, or ambiguous cell targeting.
3. **Determinism:** A pure TypeScript engine owns all rules. UI animations do not drive simulation.
4. **Recoverability:** Level, move count, score, options, and current board survive refresh, tab closure, and ordinary offline sessions.
5. **Original content:** Import authentic level packs and retain their names, authors, par values, and solution strings where available.
6. **Installable:** Build is a static PWA with an offline-capable first-party level catalogue and no required account.
7. **Auditable:** Full test suite, fixture-based parity tests, generated pack validation report, and an actionable list of source-compatibility discrepancies.

### Explicitly out of scope for v1

Accounts, cloud sync, leaderboards, multiplayer, AI-generated puzzles, server-side APIs, payments, analytics SDKs, full level editor, full general-purpose solver, dynamic multiplayer/realtime engine, and porting the Palm C UI wholesale.

### Recommended release cuts

- **MVP:** One verified pack, core engine, drag/tap controls, undo/restart, progression, autosave, mobile-responsive UI, keyboard fallback.
- **v1.0:** All legally redistributable validated packs, classic/modern skins, complete scoring, solution/replay, PWA, accessibility, documented source attribution.
- **v1.1+:** Pack importing, level editor, progressive hints, solver, diagnostics export, shareable challenge links.

---

## 2. Ground truth and source audit (Phase 0)

**Do this before writing the simulation.** Reference documentation can conflict with secondary ports on fine points of gesture and score accounting.

### Confirmed in official documentation

- Palm Vexed game board: **10 columns × 8 rows**.
- Move blocks by dragging horizontally; gravity pulls unsupported blocks down.
- A drag can advance more than one block/space and stops at the first actionable event or the drag endpoint (wording requires reference-code investigation).
- Palm 2.1+ also supports select-block-then-tap-open-destination, potentially at another row.
- Match and removal, falling, and repeating cascades are essential to play.
- Original features: 15-move undo, memorize/recall, restart, previous/current replay, solutions, per-pack progression, classic level number beginning at zero, cumulative golf-style par score.
- Viewing a solution adds a **five-point score penalty** in the original game.
- Historic levels may have nonoptimal par solutions: scores *below* par are allowed.

### Sources to retrieve and archive

1. Original Vexed 2.2 source (`vexed22_src.zip`) and 2.2 program/pack archive (`vexed22.zip`).
2. Reference code/level format from the newer **Vexed for Windows** C remake, which documents its INI packs and 2,900+ puzzles.
3. Flipper Zero remake for a small, understandable independent engine reference; do **not** assume its no-touch controls reproduce Palm gesture behavior.
4. Official instructions, release history, and project license; collect precise notices for pack assets and contributor-created levels.
5. Optional: execute Palm Vexed under CloudpilotEmu as a behavioral oracle for edge cases.

Reference URLs:
- Original instructions: https://vexed.sourceforge.net/page2/instructions.html
- Palm release downloads: https://vexed.sourceforge.net/page1/download.html
- Original GPL project: https://sourceforge.net/projects/vexed/
- Archived source versions: https://palmdb.net/app/vexed
- Windows remake: https://sourceforge.net/projects/vexed-for-windows/
- Flipper Zero remake: https://github.com/dlvoy/flipper-zero-vexed
- Explanation of encoded solutions: https://sourceforge.net/p/vexed/discussion/100685/thread/d461c5b3/

**Access note:** At blueprint time, public project pages and documentation were verified, but the source archive itself was not downloaded or compiled. Source file names and raw INI keys below must be confirmed against the downloaded archive, not treated as already inspected.

### Source audit deliverables

- `docs/compatibility/REFERENCE.md`: exact version(s), archive URLs, hashes, known differences.
- `docs/compatibility/RULES.md`: authoritative move/settling/scoring semantics, with code locations and screenshots/repro steps.
- `docs/compatibility/LICENSING.md`: original code, puzzle packs, graphics, music, artwork attribution and redistribution decisions.
- `test/fixtures/reference/`: a small set of manually confirmed start/intermediate/end boards and original solution examples.
- A written decision on whether port contains GPL-derived code/assets or a clean-room engine and on distribution obligations of each portion.

**Gate 0:** Do not call the game “Palm compatible” until ambiguous move, cascade, and scoring rules have been tested against reference software or source.

---

## 3. Architecture

Use a small modular client-side application, **not** a game engine framework. Grid geometry is tiny; React should manage shell/screen state, not simulation rules. CSS/SVG can render the board and transitions without Canvas. Canvas remains a fallback only if measured performance demonstrates a problem.

```text
Input (pointer/keyboard)
        |
        v
Input interpreter ---> Move command(s)
        |                   |
        |                   v
        |           Pure engine/reducer
        |               /       \
        |        next state    event trace
        |               \       /
        v                v     v
Presentation model --> React view + animations
                            |
                   save repository
                            |
                   localStorage / IndexedDB

Level INI/PDB -> offline conversion + validation -> versioned JSON packs
                                      |
                          reference solution replay tests
```

### Repository layout

```text
vexed-web/
  public/
    icons/
    themes/classic/
    packs/                   # generated pack JSON, per-pack manifests
  src/
    app/
      App.tsx
      routes.ts
      bootstrap.ts
    domain/
      types.ts
      board.ts
      movement.ts
      gravity.ts
      matching.ts
      resolve.ts
      reducer.ts
      commands.ts
      scoring.ts
      solutionCodec.ts
      invariants.ts
    input/
      pointerController.ts
      gestureInterpreter.ts
      keyboardController.ts
      hitTesting.ts
    components/
      GameScreen.tsx
      Board.tsx
      CellView.tsx
      Toolbar.tsx
      LevelPicker.tsx
      PackPicker.tsx
      SolutionPlayer.tsx
      Settings.tsx
    state/
      sessionStore.ts
      selectors.ts
      saveSchema.ts
      persistence.ts
    assets/
      themes.ts
      audio.ts
    data/
      manifest.ts
      packLoader.ts
      validatePack.ts
    styles/
      layout.css
      board.css
      themes.css
      accessibility.css
  scripts/
    convert-ini.ts
    convert-pdb.ts          # only if necessary after format audit
    audit-packs.ts
    replay-solutions.ts
  tests/
    unit/
    fixtures/
    regression/
    e2e/
  docs/
    compatibility/
    user-guide.md
    developer-guide.md
  package.json
  vite.config.ts
  tsconfig.json
  playwright.config.ts
  LICENSE
  README.md
```

The simulation must import nothing from `react`, `window`, `document`, rendering code, or storage APIs. The UI may call engine operations but not mutate boards directly.

---

## 4. Canonical types and commands

Use a stable **board coordinate convention**: zero-based `x` increasing left-to-right, `y` increasing top-to-bottom. Original UI level numbers begin at zero; optional human-visible numbering can be an accessibility setting, but must not corrupt identifiers.

```ts
export type Direction = -1 | 1;
export type Tile = null | '#' | string; // null empty; '#' wall; symbol block

export interface Position { x: number; y: number }
export interface Board {
  readonly width: 10;
  readonly height: 8;
  readonly cells: readonly (readonly Tile[])[]; // cells[y][x]
}

export interface LevelDefinition {
  id: string;                // `${packId}:${zeroBasedIndex}`
  packId: string;
  index: number;
  name: string;
  initialBoard: Board;
  par: number | null;
  encodedSolution?: string;
  attribution?: string;
}

export interface GameSession {
  levelId: string;
  board: Board;
  moveCount: number;
  status: 'playing' | 'won';
  history: readonly HistoryEntry[];
  redo: readonly HistoryEntry[];
  checkpoint?: SessionSnapshot;
  solutionPenalty: number;
}

export type GameCommand =
  | { type: 'move-one'; from: Position; direction: Direction }
  | { type: 'move-to'; from: Position; target: Position }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'restart' }
  | { type: 'memorize' }
  | { type: 'recall' };

export type EngineEvent =
  | { type: 'block-moved'; from: Position; to: Position; kind: string }
  | { type: 'blocks-fell'; moves: readonly { from: Position; to: Position; kind: string }[] }
  | { type: 'blocks-removed'; cells: readonly Position[]; kind: string }
  | { type: 'level-solved' };

export interface StepResult {
  accepted: boolean;
  state: GameSession;
  events: readonly EngineEvent[];
  rejectionReason?: 'wall' | 'occupied' | 'not-a-block' | 'out-of-bounds' | 'busy';
}
```

These types specify architecture, **not final Palm semantics**. The reference audit must decide how repeated one-cell movements are grouped into original move-count and undo units. `HistoryEntry` should capture board snapshots (only 80 cells), prior move/penalty values, and the action group; immutability is cheap here.

### Domain API requirements

```ts
validateBoard(board: Board): ValidationIssue[];
tryMoveOneCell(board: Board, from: Position, dir: Direction): BoardMove | null;
resolveBoard(board: Board): { board: Board; events: EngineEvent[] };
applyCommand(session: GameSession, cmd: GameCommand): StepResult;
applyGesture(session: GameSession, intent: GestureIntent): StepResult;
decodeReferenceSolution(encoded: string): AtomicMove[];
scoreLevel(session: GameSession, level: LevelDefinition): number | null;
serializeSession(session: GameSession): PersistedSession;
```

Do **not** overload `tryMoveOneCell` with touch or score semantics. `applyGesture` is the compatibility layer to be calibrated against original Palm dragging.

---

## 5. Deterministic gameplay engine (Phase 1)

### Basic rules

1. Walls never move; individual patterned blocks can slide left/right when the adjacent target is open.
2. Gravity moves unsupported blocks downward until supported by wall or another block.
3. Any orthogonally adjacent pair/group of the same type is eligible for removal. A group may contain more than two blocks.
4. Detect **all simultaneously removable groups** on a stable board. Remove simultaneously, then recompute gravity and matches until stable.
5. Win when no movable patterned blocks remain. A stuck puzzle is not necessarily mechanically terminal merely because a solver has not found a path.
6. Attempts rejected as invalid cannot modify board/history/score. Historical Palm bugs that counted some invalid actions should be documented separately; default is sane semantics unless strict fidelity explicitly requires reproduction.

### Recommended settling loop

```text
perform legal slide atomic operation
  -> apply gravity to a stable board
  -> find all orthogonally connected same-type groups of size >= 2
  -> remove all qualifying groups simultaneously
  -> if any removed: repeat gravity and matching
  -> if none removed: stable
  -> check victory
  -> return stable board plus ordered event trace
```

**Compatibility warning:** The ACM Vexed problem description specifies stable gravity and simultaneous match removal, but this is still a hypothesis for exact Palm edge-case ordering. Build reference fixtures before declaring the implementation correct, particularly if a block makes contact during an intermediate fall.

### Algorithm notes

- Gravity: iterate each interior column bottom-up; compact blocks into the nearest free support slots, respecting immovable walls that partition a column. Preserve vertical relative order of falling blocks.
- Matching: flood-fill/DFS or BFS by block type over four neighbors. Record groups with >=2 positions; remove all groups in the same wave.
- Cascades: iterate until a pass removes zero blocks; include a fail-safe iteration limit and invariant checks.
- Event trace: keep logical states and phase snapshots for smooth animations; events cannot change the authoritative outcome.
- Repeatability: no randomness in board simulation, scoring, solution replay, or persistence.
- Geometry: all algorithms should be tested with walls suspended mid-column, enclosed chambers, and stacked blocks.

### High-value edge cases

- Block at far left/right wall; collision with movable block; destination outside board.
- Moving a block from under another causing the upper block to fall.
- Multiple simultaneous matching groups (different colors or disconnected groups).
- Cascades continuing through several remove/fall cycles.
- A matching pair landing adjacent vertically, not just horizontally.
- Walls interrupting a gravity column; isolated same-colored blocks separated by walls.
- A finger drag that crosses 2+ cells, 2+ adjacent pieces, or reaches an actionable step early.
- Moves to empty space on a different row via two-tap control.
- Odd block counts: do **not** reject on parity alone; triple removals can make odd counts valid.
- Null/invalid puzzle, pre-won puzzle, no solution metadata, and corrupted save recovery.

### History semantics

Choose history unit to match original **move count** (not automatically per rendered animation). Support original 15-action undo in classic mode. Internally it is reasonable to retain a larger history for modern mode, but keep the policy configurable and test the user-visible score consequences.

---

## 6. Import original levels and solutions (Phase 2)

The largest asset is the **original puzzle catalogue**, not images. The 2020 Windows remake reports over 2,900 puzzles and uses INI packs. Original Palm builds package data as PDB, but the archived Palm source reportedly contains level-pack INI files. Prefer extracting plaintext source INI, then use Windows remake INI only as a fallback or cross-check.

### Import pipeline

```text
source INI files
  -> format-specific parser
  -> raw parse AST with source file/line/section
  -> normalization and explicit character mapping
  -> schema validation
  -> solution decoder
  -> optional solution replay through engine
  -> generated packs/*.json + pack manifest + audit report
```

**No invented INI schema:** Archive inspection must determine actual section names, board encoding, escape rules, encoding, par metadata and zero-based indices. Keep the raw fixture alongside converted output.

### Output schema example

```json
{
  "schemaVersion": 1,
  "id": "classic",
  "name": "Classic",
  "author": "As recorded in original pack",
  "source": { "filename": "original-file.ini", "sha256": "..." },
  "levels": [
    {
      "index": 0,
      "id": "classic:0",
      "name": "Original level title",
      "rows": ["##########", "#........#", "..."],
      "par": 5,
      "encodedSolution": "..."
    }
  ]
}
```

The row strings are **illustrative output**, not claims about original input syntax. Pick a canonical symbol map after auditing original data. The converter should throw contextual errors (`pack:section:line`) rather than silently substitute values.

### Original solution encoding

The Vexed project maintainer documented move pairs using two letters for column and row and capitalization for direction: **first character uppercase => left; second uppercase => right**. Example: `fF` means sixth column, sixth row, move right, using human 1-based positions. Write tests around known official examples. Establish how many atomic moves a pair implies and confirm 0/1-based conversion in real packs.

### Validation outputs

- Number of source packs/levels and converted packs/levels, exact matches required.
- Unknown characters, duplicate IDs, inconsistent board geometry and missing metadata reported.
- Parsed par and decoded solution length consistency checked (do not assume if gestures combine steps).
- Replay each available encoded solution; assert solved and expected move count if verified.
- Output a machine-readable failure list; do not drop failing packs silently.
- Stable, reproducible generated JSON and content hashes.
- Preserve provenance, original author attribution, licenses, and source hash in pack manifest.

### Runtime loading

Bundle one Classic pack with shell, load others on demand from static JSON. Provide a pack catalog with author, difficulty, number of puzzles, current progress and aggregate score. Store only references/IDs in saved game, not copies of all source packs. Cache packs during PWA install or on first use; ensure deliberately downloaded packs remain playable offline.

---

## 7. Touch input architecture (Phase 3)

**Do not emulate a mouse by hooking `touchstart` + synthetic click.** Use Pointer Events to cover finger, mouse and stylus consistently, then add keyboard commands as an independent adapter.

### Three interaction modes

**A. Drag (primary, default)**
- On `pointerdown`, hit-test a patterned block and begin `armed` gesture.
- Maintain pointer capture; apply a small movement threshold (e.g., 6–10 CSS px) before treating motion as a drag.
- Quantize local pointer position to grid coordinates via board bounding rectangle and current CSS transform/scale.
- Track desired horizontal direction/extent and display legal destination preview.
- On `pointerup`, commit the translated game intent through `applyGesture`; render resulting event trace.
- On `pointercancel`, losing capture, modal opening, level change or orientation change: cancel uncommitted intent and restore visual preview.
- If the original requires per-cell intermediate actions during dragging, use a dedicated compatibility policy verified from source/reference; never dispatch arbitrary extra moves just because `pointermove` fired many times.

**B. Tap-tap (essential fallback)**
- Tap block to select; highlight legal targets and show arrow affordances.
- Tap a valid empty target to request an original-compatible move. Do not require destination to share a row if the original accepts cross-row taps; the gesture adapter resolves target semantics.
- Tap selected block again or tap outside board to deselect.
- Invalid target produces quiet feedback (haptic if user-initiated and supported; optional visual cue), not a changed game state.

**C. Keyboard/mouse/stylus**
- Arrow keys move a selection cursor; Enter/Space selects; Left/Right requests move.
- Escape deselects; `Z` or Ctrl/Cmd+Z undoes, `R` restarts behind confirmation, `?` help.
- Mouse drag uses same Pointer Events interpreter; mouse double-click is not necessary.
- All controls have visible focus; do not override browser key shortcuts while user is in a text field.

### Touch-specific constraints

- `touch-action: none` on the **board interactive region**, not the entire page.
- `overscroll-behavior` and page containment where needed, without breaking normal settings-page scrolling.
- Minimum **44×44 CSS-pixel** interactive targets for controls and accessible touch affordances when possible.
- Responsive cell size derived from both available width and available height. Center board without distorting 10:8 cell geometry.
- If an individual game cell becomes too small, offer landscape suggestion or a zoomed/edge-to-edge board mode, not inaccessible micro-targets.
- Disable text selection/context menu **only on the game surface**; do not harm accessibility elsewhere.
- Avoid relying on hover, multi-touch gestures, or vibration.
- Respect device pixel ratio for sharp SVG/CSS icons; no global fixed 320px board.
- Support iOS Safari viewport resizing, Android browser chrome, screen rotation, `safe-area-inset-*`, and standalone PWA mode.
- On interruption (home gesture, incoming call, tab background): cancel input, finish/restore stable simulation state, save.

### Pointer input state machine

```text
idle
  -- pointerdown on movable block --> armed
armed
  -- threshold crossed --> dragging
  -- pointerup with small travel --> selected [tap mode]
  -- pointercancel --> idle
selected
  -- tap legal destination --> committing --> idle
  -- tap outside/escape --> idle
  -- pointerdown+drag --> dragging
dragging
  -- pointermove --> preview destination
  -- pointerup --> committing --> animating --> idle
  -- pointercancel --> idle
animating
  -- further input --> queue one permitted command OR ignore with explicit UI feedback
```

Keep transient pointer state OUT of save data and OUT of the domain engine. Use only discrete commands as persisted history.

---

## 8. Rendering and animation (Phase 4)

### Layout

```text
+--------------------------------------+
| VEXED      Classic / Settings / Help  |
| Classic Pack · Level 0: [name]        |
| Moves: 06   Par: 05   Score: +01      |
|                                      |
|   10 columns × 8 rows game board     |
|                                      |
|                                      |
| [Undo] [Restart] [Memory] [Hint]      |
| [Prev]       [Levels]         [Next]  |
|                                      |
| Tap a block, then tap destination     |
+--------------------------------------+
```

**Two themes, one engine:**
- **Classic:** Palm-like high-contrast block patterns, restrained grayscale/retro palette, historical icons where asset redistribution permits.
- **Modern:** clean blocks, colorblind-safe patterns and iconography, subtly animated gravity/removal, readable touch targets.

### Render choice

Use CSS Grid to size the board (`repeat(10, var(--cell-size))` × 8); use absolutely positioned block sprites keyed by **stable render identity** for transform transitions. Walls may be grid backgrounds or fixed tiles. SVG is well suited for crisp patterns; use CSS transforms for motion. Avoid tying animation intervals to engine computation.

### Animation event player

Engine outputs logical `EngineEvent[]`. Animation controller consumes events in order, with separate stages for slide, falling and removal, then marks presentation complete. Fast-forward immediately when tab visibility changes or reduced motion is requested. Model state is authoritative from the start; animation is a visual projection, not a second simulator.

**Default motion targets (tunable):** slides about 100–140ms, falls proportional to distance but capped around 250ms, removals around 120ms. Expose Off / Normal / Fast. These are UI choices, not game mechanics.

### Accessibility

- Pattern shape + color for block identity; never color alone.
- Screen reader: board label, level/score announcements, focused cell descriptions, selected block and legal actions. Consider a separate text/list navigation mode for full board access.
- `prefers-reduced-motion` support; disable nonessential animation.
- Large-text-friendly surrounding UI (board still square-celled), strong focus indicator and contrast.
- Sound optional and muted by default until explicit gesture; ensure audio never conveys required information alone.

---

## 9. Game shell, progression, and scoring (Phase 5)

### Main screens

1. Start/resume and pack library (recent pack, played count, score, difficulty).
2. Game screen (board, title, move count, par, score, original level index, controls).
3. Level picker (filter solved/unlocked, progress, current level).
4. Settings (theme, animation speed, sound, drag/tap preference, reduced motion).
5. Help (gesture diagrams, rules, scoring, credits/licenses).
6. Solution/replay modal with step controls, pause, resume and exit returning to the exact player board.

### Original scoring

The official rule is `(completed level moves - stored par)`, summed across the pack; scores can be negative. Viewing a full solution adds five points to the original score. Preserve exactly once-per-view semantics only after checking original edge cases (reopen penalty, early exit, previous solutions). Keep the score calculated from completion records rather than mutating a single opaque total.

**Design choice:** Classic scoring mode applies historical solution penalties. Optional modern-assist mode may distinguish assisted/unassisted completions rather than silently altering classic scores.

### Progression

Classic mode may access previously completed levels and up to **one beyond the highest solved**; modern free-play is an optional later setting. Save current pack and level and the current board, preserve completion records by pack+level ID, and avoid overwriting a previously better score with worse completion unless policy specifically requires it.

### Undo, memorize, replay

- Undo restores last logical counted move and previous counter state (initially historic 15-deep policy).
- Restart resets current level state but does not erase historical completion records.
- Memorize/recall stores a checkpoint for difficult levels.
- Replay uses recorded committed move commands from initial board; it never affects stored player state or score.
- Solution playback starts from original board and uses decoded reference commands. Exiting restores the exact pre-view snapshot.
- Distinguish a *hint preview* from a *full solution reveal* and specify penalty semantics before release.

---

## 10. Persistence, offline, deployment (Phase 6)

### Storage strategy

- `localStorage`: tiny settings and last-opened-pack ID, with schema version.
- IndexedDB: session snapshots/history, per-level completion records and downloaded pack cache if desired. For an initial MVP one small `localStorage` record is adequate; move to IndexedDB when the model warrants it.
- Persist **only settled authoritative board state** and committed history. Never persist a partially dragged or half-animated board.
- Use explicit `schemaVersion` and migrations, default-safe recovery, and backup before applying migrations.
- Auto-save immediately after accepted moves and important UI actions, plus on `visibilitychange` as a backup; writes should be idempotent.
- No service worker access to mutable session state; SW caches only versioned static assets and packs.

### Save schema

```ts
interface PersistedGameV1 {
  schemaVersion: 1;
  buildVersion: string;
  savedAt: string;
  activePackId: string;
  activeLevelId: string;
  current: {
    boardRows: string[];
    moves: number;
    penalty: number;
    commandHistory: SerializedCommand[];
    checkpoint?: SerializedSnapshot;
  };
  completions: Record<string, {
    bestMoves: number;
    par: number | null;
    assisted: boolean;
    finishedAt: string;
  }>;
}
```

Use a serialization-safe representation that doesn't confuse empty vs wall vs patterned block. Never trust deserialized state without schema and invariant validation.

### PWA

Use `vite-plugin-pwa` or a similarly maintained Vite integration for install manifest, icons, service worker registration and cache policy. Precache shell and Classic pack; cache additional packs on demand. Avoid stale HTML/JS mismatch by using Vite fingerprinted assets and a well-defined SW update prompt. Offline reload, offline resume, and offline pack play are release tests.

### Firebase Hosting

- Build output `dist/`; static hosting only.
- SPA fallback to `/index.html` if implementing client routing.
- Cache hashed JS/CSS assets immutably; cache `index.html`/service-worker entry conservatively.
- Set application security headers appropriate for assets (CSP that allows required static resources, X-Content-Type-Options, etc.).
- No Firebase Auth, Firestore, or backend functions in v1.
- Include build version in About menu and a link to complete source/license notices.

---

## 11. Testing and reference parity (Phase 7)

### Unit tests — Vitest

- Pure movement: legal and illegal directions, edges, blocked paths, walls.
- Gravity: different support arrangements, wall partitions, full/empty columns.
- Match removal: vertical/horizontal pair, 3+ group, simultaneous groups, no diagonal matching.
- Cascade: 1/2/3+ phases and trace order.
- State invariants: board dimensions never change, wall positions remain constant, block symbol set remains valid, no fabricated blocks, move count cannot change after rejected command.
- Reproducibility: same seed-level and command sequence always produce identical board/events.
- History: undo/restart/recall, score and penalty state, saved game roundtrip.
- Solution codec: officially documented `fF` mapping and representative real encoded strings.
- Converter: fixtures from real source archives, alternate encodings, missing fields, invalid syntax.

### Property-based tests — optional `fast-check`

Generate small valid boards, run legal commands and assert invariant preservation; check that solving replay is independent of animation flags; assert serializing/deserializing returns equivalent logical state. Never assume all random boards are solvable.

### Full-pack regression

For each imported reference solution: decode -> execute through the same command path as players -> assert final win -> assert expected par/move count when confirmed. Generate summary in CI:

```text
Packs found:               N
Levels parsed:             N
Levels with solutions:     N
Solution replays passed:   N
Missing/malformed:         N
Parity mismatches:         N
```

**Release bar:** zero unexplained failures among supported packs. A known original-data defect can be documented and excluded with a per-level exception fixture, never silently ignored.

### Touch E2E — Playwright

Use mobile Chromium plus WebKit emulation, and **real device smoke tests** on Android Chrome and iPhone Safari before release. Critical test scenarios:

1. Portrait 360×640: board visible, no horizontal overflow, touch action lands in expected cell.
2. Large phone 430×932: drag 1+ positions and tap-tap work with correct selections.
3. Tablet portrait and landscape: board scales with square cells.
4. Drag out of bounds, multi-touch/pointer cancellation, modal interrupts, rotation during drag -> no accidental move.
5. Page scroll outside game board works; browser scroll inside board does not steal gesture.
6. Slow animation + rapid touches do not duplicate moves.
7. Repeated 15+ undos/restarts produce sensible results.
8. Refresh after move preserves exact state, score and selection-reset policy.
9. Offline reload after first install works, including cached additional packs.
10. Keyboard-only play, screen reader descriptors, contrast and reduced-motion mode.

Playwright emulation cannot substitute for real iOS Safari touch input or Android display cutouts. Keep a short manual device matrix and record results.

### Performance budgets (goals, measure rather than assume)

- Domain engine operation ~1ms typical on current phones for one 80-cell board.
- Responsive 60fps animation on reasonable phones; never block input thread on solving.
- Small initial JS bundle; level packs lazy loaded after Classic.
- No visible cumulative layout shifts when board loads or browser chrome changes.
- No external tracking or network requirement after install.

---

## 12. CI/CD and quality gates

Use GitHub Actions or equivalent for PR and main-branch builds:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:reference
npm run build
npm run test:e2e
```

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test:unit": "vitest run tests/unit",
    "test:reference": "vitest run tests/regression",
    "test:e2e": "playwright test",
    "packs:convert": "tsx scripts/convert-ini.ts",
    "packs:audit": "tsx scripts/audit-packs.ts"
  }
}
```

Initialize with the current stable Vite React/TS template; **do not blindly pin guessed version numbers**. Commit lockfile, set Node engine range to tested LTS version, and record build reproducibility.

### Definition of done for any implementation PR

- Changes maintain pure-engine separation and strict TS types.
- Includes tests for changed logic and failure/edge cases.
- No licensing violations or unattributed assets.
- Passes desktop and mobile preview and accessibility checks.
- No behavior changes introduced solely by animation timing.
- Documentation/fixtures updated when game semantics change.

---

## 13. Phased work plan and acceptance criteria

### Phase 0 — Research and source compatibility (critical, 1–2 focused work sessions)

**Tasks:** Download original source/INI/PDB packs, collect hashes/licenses, read block/move/resolve/score/solution routines, exercise key actions in emulator or reference port, map source format, create 20–30 reference fixtures.  
**Exit:** Rules contract signed off, at least one source pack parsed manually, ambiguous gesture and scoring cases documented.  
**Do not skip:** Starting with visuals before this phase risks a rewrite.

### Phase 1 — Vite scaffold and pure engine (2–4 work sessions)

**Tasks:** Create Vite React+TS strict project; domain types; immutable board transformations; gravity; simultaneous matching; cascade; win; commands; engine event traces; unit tests.  
**Exit:** Headless test runner solves hand-authored fixtures, no DOM used in engine, invalid moves safe, cascades deterministic.

### Phase 2 — Real pack conversion and reference suite (2–4 work sessions)

**Tasks:** Parse real INI; normalize boards, metadata, solution pairs; generate JSON; replay solutions; fix any mismatches and retain regression fixtures; build audit report.  
**Exit:** Original Classic pack solutions replay, converter preserves data, all remaining failures enumerated and prioritized.

### Phase 3 — Playable UI and touch (2–4 work sessions)

**Tasks:** Responsive board, block/wall sprites, titlebar, pointer state machine, drag preview, tap-tap, invalid feedback, undo/restart, keyboard.  
**Exit:** Classic pack playable end-to-end on Android Chrome touchscreen and desktop; no browser scroll conflict; 360px screens workable.

### Phase 4 — Presentation, scoring and progression (2–4 work sessions)

**Tasks:** Event animations, classic + modern styling, move/par/pack score, completion state, level picker, memorize/recall, solution/replay, settings and help.  
**Exit:** No input is lost/doubled through animation; original scoring works on regression fixtures; user can traverse unlocked packs and replay solutions safely.

### Phase 5 — Persistence and PWA (1–3 work sessions)

**Tasks:** Versioned storage, migration/error recovery, pack loading/cache, installable manifest, service worker, offline support, Firebase configuration.  
**Exit:** Progress survives refresh; app resumes offline on phone; install/update experience works and no version mismatch corrupts saves.

### Phase 6 — Hardening and publication (2–4 work sessions)

**Tasks:** Full solution suite, E2E mobile, real-device verification, accessibility, CSP and licenses, README, About/credits, Firebase deploy.  
**Exit:** All release gates below satisfied. Avoid public “full 2,900+ puzzles” claim until importer count and reference tests prove it.

### Optional Phase 7 — Post-release enhancements

Add level editor, user pack import/export, solution-aware hint engine, opt-in unassisted leaderboard (requires backend), challenge URLs, data export, solver worker, translations. Keep all optional components outside the core engine API.

### Rough effort class

For one capable TypeScript developer assisted by coding agents: **roughly 10–25 focused work sessions** for a credible v1, depending mainly on legacy move rules and level data quality; **not** a delivery promise. The reference-compatibility work is the largest uncertainty, not the CSS.

---

## 14. Prioritized issue backlog (Codex-ready)

| ID | Priority | Issue | Acceptance check |
|---|---|---|---|
| VX-001 | P0 | Archive original source/data and build source manifest | Source URLs, hashes, licenses documented |
| VX-002 | P0 | Confirm Palm engine and gesture semantics | Rules contract + executable fixtures |
| VX-003 | P0 | Bootstrap strict Vite/React/TS app | CI build, lint, typecheck |
| VX-004 | P0 | Implement Board and engine primitives | Movement/gravity/matches/cascades unit tests |
| VX-005 | P0 | Implement gesture-to-engine adapter | Multi-cell drag and tap-tap parity fixtures |
| VX-006 | P0 | Parse Classic level pack | Metadata, board count and hashes checked |
| VX-007 | P0 | Decode reference solutions | Documented pairs decode and replay correctly |
| VX-008 | P0 | Implement responsive board renderer | Layout 320/360/430/768px screen tests |
| VX-009 | P0 | Implement Pointer Events input | Physical Android finger gestures and cancel test |
| VX-010 | P0 | Undo, restart and progression | Consistent board/move/score restoration |
| VX-011 | P1 | Import remaining level packs | Zero silent data loss; audit report produced |
| VX-012 | P1 | Score calculation and solution penalty | Historical scoring reference fixtures |
| VX-013 | P1 | Reference replay and solution viewer | Exact prior player state restored on exit |
| VX-014 | P1 | Classic and Modern themes | Same board state, different theme snapshot tests |
| VX-015 | P1 | Animate event trace | No engine dependency on frame rate or timing |
| VX-016 | P1 | Autosave/migrations | Reload, corruption and version test |
| VX-017 | P1 | Installable/offline PWA | Airplane mode offline resume test |
| VX-018 | P1 | Accessibility/keyboard/reduced motion | Manual + automated accessibility audit |
| VX-019 | P1 | CI mobile E2E + reference suite | Passing in PR pipeline |
| VX-020 | P1 | Credits, licenses and published source | Attribution complete, distributable assets reviewed |
| VX-021 | P2 | Local level editor and pack export | Generated level playable/importable |
| VX-022 | P2 | Worker-based solver/next-move hints | Non-blocking, bounded compute, legal move returned |

**Parallelization:** One agent can research/convert pack data, another can build UI, and another can create tests. Keep a **single owner** for domain rules; independent agents changing engine semantics without a fixture contract will produce subtle divergence. Merge only when compatibility tests pass.

---

## 15. Release checklist

- [ ] Original source, asset provenance, redistributable level data, and notices recorded.
- [ ] Board rules and gesture grouping compared with a Palm/reference implementation.
- [ ] At least Classic full pack reference solutions pass; all included packs audited.
- [ ] Mouse, stylus, drag, tap-tap, keyboard and undo work.
- [ ] 10×8 board fits narrow phone portrait or provides sensible zoom/landscape path.
- [ ] Touching the board does not scroll page or invoke unwanted browser gestures.
- [ ] Chain reactions, par, negative scores, penalties and restarts correct.
- [ ] Progress is stable through reload, offline reload and app update.
- [ ] All game operations deterministic and independent of animations.
- [ ] Strong color + pattern identities, keyboard focus, reduced motion supported.
- [ ] Fully installable Android/iOS-compatible PWA as feasible by browser.
- [ ] Licenses, contributor/pack credits, source repository and release notes published.
- [ ] Deployed build smoke-tested on desktop + real Android touch device + iPhone Safari.

---

## 16. Instructions to paste into Codex as the starting task

> **Project:** Vexed Web, a faithful Palm OS Vexed 2.2 port implemented with strict TypeScript, Vite and React, responsive CSS/SVG rendering and Pointer Events touch controls.
>
> **Read this entire plan before coding.** Work in phases; produce small reviewed changes and do not implement optional features. Start at Phase 0 by acquiring/inspecting original Vexed 2.2 source and level INI files, documenting exact movement, gravity, matching, par and encoded-solution behavior in `docs/compatibility/RULES.md`. If sources cannot be downloaded, explicitly record the blocker, use an independently documented temporary behavior, and **do not claim parity**.
>
> Then scaffold the Vite project and implement a pure, immutable, DOM-free TypeScript engine. Build unit tests, reference fixtures and original-solution replay before polishing UI. Implement touch input as a separate Pointer Events state machine supporting horizontal drag and the original tap-block/tap-destination method. Never make animation timing authoritative. Validate on mobile viewport sizes and later real phones. Add progress storage, PWA and Firebase Hosting only after the game is playable. Maintain GPL and level-pack source attribution, and make copyright/redistribution decisions explicit.
>
> **First deliverable:** repository skeleton, source audit, rules contract, domain types, first deterministic engine tests, and a report identifying all unresolved compatibility questions. Do not attempt to complete every phase in a single unreviewed change.

---

## 17. Architectural choices worth debating

**1. GPL-derived vs independent rules engine.** Starting from original code is likely faster for fidelity but creates clearer GPL redistribution obligations. Reimplementing rules without copying protected code gives more licensing flexibility, but reused level packs/art may separately constrain distribution. Either way, keep provenance and publish proper attribution; review the exact licenses before distributing.

**2. CSS/SVG vs Canvas.** CSS/SVG is easier to make accessible and responsive for 80 fixed cells and two skins. Canvas buys little until complex graphical effects are added. It would also demand more manual hit-testing and accessibility work.

**3. History per cell vs per drag.** This is a correctness and score issue, not a UI preference. Resolve against Palm source before coding progression/scoring. A superficially correct clone may still produce different par and solution replay if this is wrong.

**4. Original-only vs generalized board size.** The public game should preserve 10×8. Internally a parameterized board engine is tempting, but avoid expanding beyond original geometry until compatibility is proven. Generalization could be a later level-editor feature.

**5. Preserve original scoring or make forgiving hints?** Ship original Classic scoring intact; put modern assistance in a separately labeled mode so high scores remain comparable to the historical game.

---

## Research citations / links

- Official Palm Vexed instructions and controls: https://vexed.sourceforge.net/page2/instructions.html
- Original Vexed GPLv2 listing: https://sourceforge.net/projects/vexed/
- Original Vexed project history: https://vexed.sourceforge.net/page7/vexedproject.html
- Vexed 2.2 source archives: https://palmdb.net/app/vexed
- Original solution codec documented by maintainer: https://sourceforge.net/p/vexed/discussion/100685/thread/d461c5b3/
- Windows clean-room version and 2,900+ INI levels: https://sourceforge.net/projects/vexed-for-windows/
- Independent Flipper Zero remake / gravity and explosion description: https://github.com/dlvoy/flipper-zero-vexed
- 2001 ACM programming puzzle description of stable gravity/simultaneous removal: https://cs.uni-paderborn.de/fileadmin-eim/informatik/fg/ti/Lehre/WS_2016/ProEA/problems_01.pdf

