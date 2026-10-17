# Vexed Web

A planned touch-first TypeScript/Vite port of Palm OS Vexed 2.2, designed for GitHub Pages and tablet browsers. Application implementation has not started.

- [Design](DESIGN.md)
- [Implementation plan](Vexed_Web_TypeScript_Vite_Implementation_Plan.md)
- [Phase 0 source and verification report](docs/compatibility/REFERENCE.md)
- [Rules contract](docs/compatibility/RULES.md)
- [Licensing findings](docs/compatibility/LICENSING.md)

## Reproduce the source audit

Requires Python 3 and a C compiler available as `cc`. Download the two pinned archives described in REFERENCE.md. The source ZIP wraps `vexed22_src.tgz`; inspect and extract into a local ignored `.reference/` directory. Do not run the historical bundled executables.

```sh
python3 scripts/audit_reference.py .reference/source/vexed --check
```

The source argument must point to the extracted `vexed` directory containing `game/` and `levelpacks/`. Without `--check`, the script regenerates the committed audit report and fixtures. It compiles original gameplay functions with Palm presentation stubs in a temporary directory, validates all INI/PDB boards and solution strings, and replays their solutions. It does not scaffold the web app or claim complete Palm UI compatibility.

Next: implement the TypeScript domain against these fixtures, with dedicated gesture/undo/scoring tests before the tablet UI.
