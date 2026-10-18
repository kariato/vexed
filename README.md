# Vexed Web

A planned touch-first TypeScript/Vite port of Palm OS Vexed 2.2, designed for GitHub Pages and tablet browsers. Application implementation has not started.

- [Design](DESIGN.md)
- [Implementation plan](Vexed_Web_TypeScript_Vite_Implementation_Plan.md)
- [Phase 0 source and verification report](docs/compatibility/REFERENCE.md)
- [Rules contract](docs/compatibility/RULES.md)
- [Licensing findings](docs/compatibility/LICENSING.md)

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

Next: implement the TypeScript domain against these fixtures, with dedicated gesture/undo/scoring tests before the tablet UI.
