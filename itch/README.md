# Vexed for itch.io

This is a separate export of the game, sharing the existing read-only engine, board controls, styles and pack data. itch/App.tsx is an isolated presentation fork of src/App.tsx at d830944; only this fork awaits in-game confirmation dialogs because browser modals can be blocked in embeds. The GitHub Pages entry page, source files, PWA builder and deployment workflow are unchanged. This export also replaces the PWA controls with a link to https://kariato.github.io/vexed/ for installation and offline play. It registers no service worker and makes no offline-readiness claim in the itch.io iframe.

## Build the upload

Use Node 24, npm 11 and Python 3. Install the existing pinned dependencies from the repository root:

```sh
npm ci
npm --prefix itch run package
```

Upload `itch/releases/vexed-itch.zip`. It has index.html at its root, relative asset URLs, all 48 packs / 2,878 entries, pack attribution and license notices, and a matching application-source ZIP. Builds write only to itch/dist and itch/releases; they do not overwrite the Pages dist directory. No separate dependency installation or package-lock is needed in itch/.

## itch.io settings

Create an HTML game project and upload the ZIP as the browser-playable game. Enable Mobile Friendly. Prefer Click to launch in fullscreen so the responsive page has room to scroll on phones and tablets; if embedding inline, allow scrollbars. Preview as a draft before publishing. See https://itch.io/docs/creators/html5.

The install link opens the GitHub Pages application in a new tab. Use the browser's Install app or Share → Add to Home Screen there. itch.io saves and the GitHub Pages installation do not sync. Saves are scoped to the itch.io hosting origin and upload directory, so a changed upload URL or browser storage restrictions can affect persistence; do not promise saves survive every reupload or private browsing session.

## Source, notices and verification

The outer ZIP includes vexed-source.zip with the source needed to rebuild this variant, the existing dependency lock, and BUILD-ITCH.txt. Raw PDB/INI research fixtures, Palm binaries and reference catalogues are excluded. Original pack terms and attribution remain in PACK_NOTICES.txt; this export does not expand their license grants.

```sh
npm --prefix itch test
```

The test server serves only extracted ZIP members below a nested directory and rejects directory requests. Tests embed that page in an iframe, exercise pack switching and reload, and check installation/source links and the absence of PWA registration. Uploading or publishing on itch.io is a separate account action; this command creates a ZIP locally.

Verified on 2026-10-18: 16 extracted-ZIP iframe tests passed across Chromium desktop/phone, WebKit tablet and Firefox, covering actual gameplay, independent pack saves and outer-page reloads, solution penalty/cancellation, restart cancellation, denied-storage confirmation, the external installation link, source download, no worker/manifest, responsive layout and automated accessibility. The test sandbox intentionally omits allow-modals, so browser-native confirmations cannot mask embed issues. Reviewed the phone screenshot. Actual itch.io account upload/draft preview and physical-device testing remain separate checks.
