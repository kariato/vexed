# Palm Vexed 2.2 rules contract — Phase 0

Audit date: 2026-10-17. Evidence: files inside the SHA-256-pinned source archive in [REFERENCE.md](REFERENCE.md). Line references below refer to that archive, not the web implementation. This is a source-based contract; no Palm emulator or physical Palm has been exercised.

## Board and content

`game/protos.h:30–33,65–66`: 10 columns, 8 rows; top-left origin, x rightwards, y downwards. Air = 0, block types = 1–8, wall = 9. `game/pack.c:211–330` validates eight equal ten-cell rows. INI notation uses `/` for rows, `~` for air, `a`–`h` for blocks and decimal runs for walls. Multi-digit wall runs must be parsed as one number.

Packs have one `[General]` section and repeated `[Level]` sections, preserving their file order as zero-based indices. Properties include `board`, `solution`, `title`; General includes Author, URL, Description. A normal unique-section INI parser is unsuitable. `game/pack.c:164–167` sets par to solution string length divided by two; missing solution gives -1 internally (use explicit unavailable metadata in the web model).

## Atomic movement and settling

`game/game.c:201–270` (`MoveBlock`): a non-air, non-wall block slides one cell left/right only into air, without pushing. Collision sets a stop flag. Downward movement advances one row into air and also sets the stop flag.

`game/game.c:273–285` (`CheckGravity`): visit rows bottom-up, columns right-to-left, moving eligible blocks down one row per pass. Repeat passes until the board stops changing. Match detection does not occur between these falling passes.

`game/game.c:288–330` (`CheckMatches`): mark every block with an equal orthogonal neighbor against the same board, then remove every marked block. This is simultaneous logical removal; diagonals do not match. Groups of three and odd block counts are valid.

`game/game.c:375–424` (`PlayerMakeMove2`): after each attempted horizontal step, fully settle gravity, remove matches, and repeat gravity/matching until stable. Any gravity or removal anywhere on the board ends further horizontal steps in that gesture. Victory is zero remaining non-air, non-wall cells (`CountBlocksRemaining`). Drawing and sound are not authoritative.

## Gesture semantics

`game/vexed.c:1063–1178` processes release coordinates, not pointer-move event frequency:

- Drag: origin is a block, endpoint is air, and endpoint row equals origin row. Requested distance is the absolute column difference.
- Tap-tap: first tap selects a block; second tap must be air. Destination row can differ; only its column determines horizontal direction and distance. It does not teleport the block or request vertical movement.
- Same-column tap destination requests no horizontal move and clears the pending selection.
- Intermediate collisions can stop a request before its endpoint. Falling or removal anywhere stops it after the current step.
- A three-cell slide with no falling/removal counts as three moves, not one gesture move.

## Undo and rejected moves — important discrepancy

`game/vexed.c:1094–1113,1142–1162` snapshots board and move count once before a gesture. `game/vexed.c:997–1017` restores that gesture snapshot. The ring has capacity 15 (`UndoSize` in protos.h). Therefore **undo unit and scoring unit differ**. Replace the blueprint's assumption that undo is necessarily one counted step.

`PlayerMakeMove2` increments the move count even when an attempted horizontal step is blocked. UI validation rejects occupied endpoints, but an empty endpoint behind an intervening block can still reach this behavior. The collision fixture captures it. This is a source-confirmed legacy quirk, not a recommended generic rejection policy.

Web policy: reject malformed commands and invalid pointer endpoints without mutation. For otherwise valid Classic gestures whose path collides, retain the source's attempted-step counting. Do not silently normalize this in the compatibility engine. A future forgiving mode would need a separate explicit policy.

Original undo/memorize/replay buffers do not survive application exit (official instructions). Persisting them in the web app is a deliberate recoverability enhancement, not original parity. Native fixtures do not yet execute the Palm undo event handler.

## Solutions and scoring

`game/vexed.c:599–650`: solution pairs encode x and y as letters, zero-based `a`/`A` = 0. Uppercase x means left; uppercase y means right. Each pair executes distance 1. Example `fF` is x=5, y=5, right. All audited solutions have exactly one uppercase letter per pair. Reject malformed pairs rather than emulating uninitialized direction behavior.

`game/vexed.c:503–542` stores best completion moves for the first 60 score records, updates highest solved, then advances. Later levels aggregate into base counters. The web app should retain per-level records without copying Palm integer truncation/storage limits.

`game/game.c:506–548` (`CalcScore`) is more involved than sum(completed moves − par):

1. Start with base made minus base par (includes solution penalties).
2. Add recorded completed-level differences where stored made is nonzero.
3. For the active level, use current made, or the smaller of previous best and current made if already solved.
4. Add only the positive excess of that active count over active par.

This can add an active-level excess while an earlier result for that level is already in the completed sum. Preserve a dedicated score fixture before implementing or simplifying this behavior.

`game/vexed.c:1227–1259`: solution viewing adds five to persistent base made on each confirmed penalized opening. It is free if already solved at or below par (`<=`, despite a nearby comment saying less than par). Cancelled confirmation and missing solution incur no penalty. Re-solving does not erase base penalties. `ExitSolution` and the solution form save/restore player state; the penalty remains.

Level access is up to one past highest solved. Replay/memorize interactions use shared Palm buffers; the web design's independent safe restoration is an intentional improvement, not a literal implementation of those UI internals.

## Executable evidence and remaining verification

[audit_reference.py](../../scripts/audit_reference.py) compiles the actual `MoveBlock`, gravity, match, comparison, copy, block-count and player-move function bodies from the pinned source. Palm drawing/sound/delay are stubbed; `MoveAnimation` only performs its final board mutation. Solution mode bypasses replay-buffer writes. This is a native core reference, not an independently invented engine.

- All 1,138 INI solution sequences and 2,878 PDB solution sequences reach an empty board; INI/PDB overlap means 4,016 runs are not 4,016 distinct puzzles.
- Thirty Classic levels retain initial and every intermediate board for future TypeScript parity tests.
- Four synthetic fixtures cover multi-cell counts, blocked attempts, gravity stop and removal stop.
- Scoring, undo, tap event dispatch, replay buffers, persisted preferences, animation, and real touch behavior are inspected in source but not executed by this harness. Add targeted tests/emulator observations before claiming complete Palm compatibility.
