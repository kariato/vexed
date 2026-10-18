# Phase 5 — persistent, installable offline game

## Persistence

The game saves its current level/command log, exact undo boundary, checkpoint, previous replay, best completions, scoring penalties and settings in IndexedDB. Keys include the configured Vite base path and pack ID. Database version 1 and saved schema/rules version 1 are explicit; no unversioned legacy saves existed to migrate.

Restore validates version, pack/level identity, preferences, scoring metadata, log bounds and undo ordering. Every saved command and checkpoint is replayed through the strict engine against the current cleared board; board, move count and status are derived, never trusted from serialized data. Undo snapshots are reconstructed only at the saved command-prefix lengths. Replay viewers and transient animations/selections are not saved. Reload returns to the player board, including penalties from viewing a solution.

Writes are serialized. The visible Saved status corresponds to the exact current payload and only appears after its transaction commits; state changes immediately display Saving. Worker updates are disabled until that latest payload is saved. Opening failures, blocked storage and quota/write errors retain a playable session and expose a retry/status instead of claiming durability. Invalid/unsupported saves remain untouched and pause autosave; replacing one requires the explicit Start a new save confirmation. Browsers may remove local site data; saves are device/browser-local, without cloud sync. Use one active game tab to avoid conflicting edits from multiple tabs.

## Offline and installation

The production post-build script generates a scoped web manifest, authored 192/512 PNG icons, .nojekyll, a corresponding-source archive and a service worker. DEV does not register a worker. Root and /vexed/ builds are supported through VITE_BASE_PATH. The manifest start URL, scope, icons, worker registration, cached URLs, source link and pack loading all use the same base.

The worker hash covers the actual release bytes. Installation precaches the entire shell, bundled Classic boards, all 59 freshly derived solutions, license notices, icons and application-source download. Failed precaching deletes the incomplete new cache and leaves an existing worker intact. Ready offline is shown only after activation. The first visit needs connectivity; no installation is required for browser play.

A replacement worker waits. It never forces activation during a puzzle. The Update button requires a saved, idle player session, then explicitly activates the waiting worker and reloads into the saved state. Activation removes only this app/base's obsolete caches, never IndexedDB or unrelated sites' caches. Hiding the tab does not update/reload it. Install prompts are optional; Safari Share → Add to Home Screen and Android browser instructions are available when a native prompt is absent.

## Public deployment boundary

The repository and original research fixtures remain private. GitHub Pages publishes only dist, under https://kariato.github.io/vexed/. The Pages environment allows main and the Phase 5 release branch; it was not opened to arbitrary branches. The workflow runs check, browser interactions and production offline tests before building/uploading/deploying the artifact. Future main updates follow the same gate.

GPL corresponding source is provided directly as vexed-source.tar.gz, including application/domain/storage/UI code, cleared runtime JSON, new solution-generation tools, licenses, dependency lockfile and required build configs/scripts. BUILD.txt explains npm ci and the base-path build. The archive uses a fixed whitelist and refuses symlinks; tests reject research/fixture paths. It excludes original INI/PDB/PRC inputs, encoded historical solutions, reference catalogue, Git data and local archives. An extracted-source clean install/build was verified without the private checkout. Runtime notices identify the modified Palm routines and newly authored assets/paths.

## Validation

- Unit checks cover exact checkpoint/history/replay save roundtrips, recall's empty-history policy and invalid version/rules/pack/score/commands/history rejection.
- Production Chromium tests cover offline reload, settings/checkpoint restoration, offline solution viewing and penalty retention, malformed future-save preservation, storage denial, manifest/icons/source/cache scope, a real waiting-worker update and public-source boundaries.
- Existing desktop/tablet/360px interaction tests and all historical/new solution audits continue to run.
- CI verifies Node 22 and 24, the Pages subpath, browser controls and the production worker. Physical iPad/Android installation, eviction behavior and release accessibility validation remain Phase 6.
