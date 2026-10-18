# Release notes

## 1.0.0-rc.2 — October 2026

Adds all 48 archived packs / 2,878 puzzle entries, a touchscreen pack selector, isolated per-pack saves and progression, direct pack links, full solution playback, and offline caching of the complete collection. Classic’s existing save key and derived solutions are preserved. Other solution paths are converted from the canonical PDB data and verified through the strict engine; one documented Classic II no-op is removed without changing par.

The owner directed inclusion of packs without an explicit reproduction restriction. Pack-specific unresolved terms and attribution are preserved in PACK_NOTICES.txt and the license review; the application GPL is not asserted over all archived data. The manual release gates below remain pending.

## 1.0.0-rc.1 — October 2026

The first release candidate includes all 59 Classic puzzles with faithful Palm rules, touch/keyboard controls, two themes, animations, original scoring, checkpoints, isolated replay/solution viewing, local saves and optional offline installation at https://kariato.github.io/vexed/.

Release hardening fixes contrast, replay focus return, enlarged-text wrapping, oversized-save protection and offline cache-eviction recovery. Chromium, WebKit and Firefox have automated gameplay, accessibility and production offline coverage. A same-origin production CSP and a rebuildable GPL source download are included.

Known release gates: physical Android/iPhone/iPad installation and offline/update checks, stylus verification and manual screen-reader assessment are still pending. User feedback confirms basic play on a phone of unspecified model/browser. This is a candidate, not a declaration that those gates have passed.
