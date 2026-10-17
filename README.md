# Vexed Web

A planned touch-first TypeScript/Vite port of Palm OS Vexed 2.2, designed for GitHub Pages and tablet browsers. Phase 1 includes a pure TypeScript engine, strict Vite/React scaffold, CI and an authored engine preview. Phase 2 adds validated pack conversion, complete original-solution audits and a 59-level Classic runtime asset; tablet controls follow in Phase 3.

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

The preview demonstrates a match, undo and reset. It is not yet a full playable pack.
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

Next: Phase 3 connects the Classic runtime pack to a playable board with Pointer Events drag/tap and keyboard controls.


## Pack conversion and complete replay

```sh
npm run packs:convert
npm run packs:audit
npm run packs:check
```

Phase 2 validates 67 original INI/PDB inputs and replays all 4,016 solution sequences (overlapping formats). The canonical research catalogue contains 48 packs / 2,878 level entries. The runtime bundle contains 59 GPL-traced Classic layouts with generic labels and par counts; original titles/solution strings remain research fixtures.

See [Phase 2 notes](docs/development/PHASE-2.md) for reproducibility, reports, the Classic II par variant and its original-C-verified empty move.
