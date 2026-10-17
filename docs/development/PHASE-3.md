# Phase 3 — touch-first Classic gameplay

All 59 runtime Classic puzzles are now playable. The screen loads the validated pack from Vite's configured base path; load failures offer a retry. All player input uses the existing strict applyGesture/applyCommand reducers. No original encoded solutions or research catalogue enter the application bundle.

## Controls and input contract

- Drag a block sideways, then release inside the board. Vertical finger drift is projected onto the source row. An 8 CSS-pixel threshold separates dragging from tap jitter. The destination expresses intent; the engine determines the actual stopping point and atomic move count.
- Tap a block, then an empty destination, including a different row. Tapping the selected block clears selection; tapping another block changes selection. Invalid moves give feedback without changing the board.
- Large left/right buttons move the selected block one space. Undo restores the previous complete gesture, up to 15 gestures. Restart and leaving an in-progress puzzle require a dismissible confirmation.
- Tab to the grid; arrows move the active cell, Enter/Space selects or commits, Escape clears selection, Z undoes, R restarts. The grid has one tab stop, labelled cells, an active descendant, a visible cursor and selection. Letters distinguish blocks independently of colour.
- Pointer capture keeps tracking a drag outside its starting cell. Only the primary contact commits, once on release; secondary releases cannot clear its pending intent. There is no click handler that could double-commit a synthetic touch click.
- Pointer cancellation, lost capture, blur, visibility changes and resize discard the pending gesture. Release outside the board cancels. Release also compares board and viewport dimensions against pointer-down, closing the race before a resize event arrives. Changing levels remounts the input surface. Undo/restart keyboard actions cancel pending pointer intent.
- Only the board uses touch-action:none. Scrolling and browser zoom remain available outside it; the viewport meta tag does not disable zoom. The grid uses its exact bounding rectangle, with cell spacing inside that rectangle, so pointer mapping remains independent of borders and responsive scale.

## Presentation and progression

The Palm-inspired board uses CSS Grid and labelled blocks. At tablet portrait widths the controls sit below the board; compact tablet landscape sizing keeps the board and controls in view. A 360px phone layout avoids horizontal page scrolling and retains 46px alternative movement buttons, though its board tiles are necessarily smaller. There are no game-state-dependent animation timers in this phase.

All Classic levels are selectable for practice. Solving records a tab-local completion mark and reveals Next puzzle; undo remains available after a win. Revisiting starts a fresh board, while completion marks remain for the tab. This is a deliberate web navigation policy, not a claim to reproduce Palm unlock menus. Refreshing loses progress. Scores beyond move/par display, durable progress, themes, animations, replay/hints and offline installation remain later work.

## Verification

- npm run check: lint, strict app/domain/test/tool typechecks, 186 unit/reference tests, deterministic conversion/replay audit, production build.
- npm run test:e2e: Chromium desktop, emulated tablet and 360×640 touch phone against /vexed/; first original puzzle solved in four moves, next level, cross-row tap, undo, arrow controls, keyboard, invalid destinations, cancel/confirm restart, drag release, resize cancellation, touch cancellation, secondary touches, loading retry and tablet landscape fit.
- Browser touch tests dispatch real Chromium touch input through CDP; mouse tests exercise native Pointer Events and capture. Mobile projects exercise actual touch taps rather than mouse-only clicks on cells.
- Local browser visual review covers tablet portrait (768×1024), landscape (1024×768), and phone (360×640). Native preview dragging also confirms the first Classic move and gravity.
- CI runs engine/build checks on Node 22 and 24, plus Chromium browser checks on Node 24. Both build and browser tests exercise the GitHub Pages subpath.

Emulation does not replace real-device testing. Physical Android Chrome, iPad/iPhone Safari, assistive technology and final release accessibility checks remain Phase 6 work. This phase prepares the static GitHub Pages app; it does not publish or configure hosting.
