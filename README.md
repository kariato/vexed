# Vexed Web

An installable, offline-capable TypeScript/Vite port of Palm OS Vexed 2.2, designed for GitHub Pages and tablet browsers. Phase 4 adds Classic Palm/Modern themes, event animations, original pack scoring, progression, checkpoints, player replays and full solution playback to the 59 touch-playable Classic puzzles. The pure engine is checked against the original Palm implementation and solutions.

- [Design](DESIGN.md)
- [Implementation plan](Vexed_Web_TypeScript_Vite_Implementation_Plan.md)
- [Phase 0 source and verification report](docs/compatibility/REFERENCE.md)
- [Rules contract](docs/compatibility/RULES.md)
- [Licensing findings](docs/compatibility/LICENSING.md)

## Run and verify

Use Node 24 LTS (see `.nvmrc`) and npm 11. Supported runtime lines are Node 22.12+ and 24; CI checks both.

```sh
nvm use
npm ci
npm run check
npm run dev
```

The preview plays the Classic pack. Solve to unlock the next level, or enable Practice for all 59. Undo the last 15 gestures, memorize/recall a position, replay an attempt, or view a full solution with the original scoring penalty. Progress, settings, undo and checkpoints are saved on this device when browser storage is available.
`npm run check` runs lint, strict app/domain/test typechecks, unit/reference tests and a production build.

```sh
VITE_BASE_PATH=/vexed/ npm run build
VITE_BASE_PATH=/vexed/ npm run preview
```

This builds and locally previews the GitHub Pages project path; it does not deploy.
See [Phase 1 implementation notes](docs/development/PHASE-1.md) for API boundaries, validation and compatibility choices.

## Reproduce the source audit

Requires Python 3 and a C compiler available as `cc`. Download the two pinned archives described in REFERENCE.md. The source ZIP wraps `vexed22_src.tgz`; inspect and extract into a local ignored `.reference/` directory. Do not run historical bundled host-tool executables; the original Palm PRC is exercised only inside the isolated emulator.

```sh
python3 scripts/audit_reference.py .reference/source/vexed --check
```

The source argument must point to the extracted `vexed` directory containing `game/` and `levelpacks/`. Without `--check`, the script regenerates the committed audit report and fixtures. It compiles original gameplay functions with Palm presentation stubs in a temporary directory, validates all INI/PDB boards and solution strings, and replays their solutions. It also executes 23 original-handler cases for scoring, undo, tap/drag and solution behavior. It does not scaffold the web app or claim complete Palm UI compatibility. Representative emulator observations are in [EMULATOR.md](docs/compatibility/EMULATOR.md).

Classic board provenance can be reproduced after extracting the pinned 1.3 source:

```sh
python3 scripts/audit_classic_provenance.py .reference/vexed13 .reference/source/vexed --check
```

All 59 Classic layouts exactly match arrays with an explicit GPL notice. Later titles, encoded solutions and contributor packs remain separate content decisions.

## Browser interaction tests

```sh
npx playwright install chromium
npm run test:e2e
```

Browser checks use desktop, tablet and 360px phone configurations, with the `/vexed/` GitHub Pages base path. CI installs Chromium and runs these alongside the Node checks. See [Phase 3 notes](docs/development/PHASE-3.md) for controls, input cancellation and remaining device validation.

See [Phase 4 notes](docs/development/PHASE-4.md) for animation boundaries, scoring, progression and solution provenance. All 59 shipped solution paths are newly derived from cleared boards and replay-verified; historical reference strings remain development-only.

To regenerate solution content locally (requires a C++17 compiler named `c++`):

```sh
npm run solutions:derive
```

This offline authoring tool reads only the cleared runtime boards, performs bounded search, verifies every move through the strict engine and writes the complete asset after all 59 pass. Normal builds and CI use the checked-in asset and do not require a compiler or run search in the browser. Search finds valid solutions and does not guarantee historical par.

## Play and install

Open https://kariato.github.io/vexed/ on a tablet or desktop browser. After Ready offline appears, all 59 puzzles and solutions work without a network connection. Installation is optional; use Install Vexed when offered, Safari Share → Add to Home Screen, or the Android browser menu.

The Saved on this device indicator confirms the latest transaction. Unknown/corrupt saves are kept for recovery and pause autosave. Updates wait for a saved, idle game and require your reload action. See [Phase 5 notes](docs/development/PHASE-5.md).

```sh
npm run test:pwa
```

The Pages workflow publishes only the verified dist artifact. The repository/research fixtures stay private; the published site includes a GPL application-source download that rebuilds without those fixtures.

Next: Phase 6 covers compatibility, real tablets and release accessibility checks.


## Pack conversion and complete replay

```sh
npm run packs:convert
npm run packs:audit
npm run packs:check
```

Phase 2 validates 67 original INI/PDB inputs and replays all 4,016 solution sequences (overlapping formats). The canonical research catalogue contains 48 packs / 2,878 level entries. The runtime bundle contains 59 GPL-traced Classic layouts with generic labels and par counts; original titles/solution strings remain research fixtures.

See [Phase 2 notes](docs/development/PHASE-2.md) for reproducibility, reports, the Classic II par variant and its original-C-verified empty move.
