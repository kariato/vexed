# Phase 6 — release candidate and evidence

Candidate: 1.0.0-rc.1. The automated hardening work is ready; this is not a claim that every physical-device or manual accessibility release gate has passed.

## Changes found by the audit

- Increased the low-contrast guide label to pass normal-text contrast checks.
- Explicitly return focus to the originating replay/solution button after modal dismissal. Capturing document focus after an asynchronous load had lost the opener when that button was temporarily disabled.
- Allow headings, settings controls and help/credits to wrap with doubled text sizes. Both themes retain labelled block identities, keyboard navigation and reduced-motion behavior.
- Production CSP limits scripts, connections, workers, fonts and manifests to the same origin, blocks inline scripts/eval, plugins and forms, and permits inline styles needed by sprite transforms. This is an HTML meta policy: GitHub Pages does not provide configurable response headers, and no unsupported meta frame-ancestors claim is made. See [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).
- Save writes now reject payloads beyond restoration bounds before touching the previous valid record. This finishes the interrupted Phase 5 change.
- Offline readiness verifies the actual required cache entries through the active worker. Online reload/resume repairs missing/evicted cached assets without resetting IndexedDB, rather than treating worker activation alone as proof of cached content. Entire-origin data eviction can still remove saves; the game cannot recover data the browser has erased.
- Added About/version, credits/license links, release notes and retained browser reports/screenshots/traces.

## Automated evidence

Local checks: 197 unit/reference tests, 89 passing gameplay/accessibility browser scenarios (6 intentional Chromium-protocol skips), and 27 passing production PWA scenarios. The dependency audit reported zero known vulnerabilities in the installed lockfile snapshot. These are test results, not a claim of complete security or accessibility coverage.

The gameplay suite covers Chromium desktop, Chromium touch tablet/360px phone, WebKit touch tablet and desktop Firefox. It exercises first-puzzle completion, cross-row taps, dragging/cancellation, rotation/resize, keyboard, undo, memory, replay restoration, solution scoring, progression, themes, enlarged text and accessibility scans. Chromium-protocol multi-contact tests intentionally skip unsupported projects; normal pointer/tap behavior is exercised across engines.

Production offline tests run Chromium, WebKit and Firefox against /vexed/. They cover offline saves/recall/settings/penalties, corrupt and denied storage, installation assets/source scope, explicit worker updates, CSP enforcement and cache-eviction recovery. Initial/root production builds and source-archive rebuilding remain supported. Historical 4,016 solution replays and all 59 fresh runtime paths remain mandatory.

Axe checks WCAG 2 A/AA, 2.1 AA and 2.2 AA tags across Classic, expanded Modern/settings/help and the solution dialog, plus an explicit focus-return test. This is automated coverage, not WCAG certification or a replacement for assistive-technology testing; see [Playwright's accessibility guidance](https://playwright.dev/docs/accessibility-testing).

CI retains JSON reports, review screenshots and failure traces under browser-release-evidence / pages-release-evidence for 14 days. Local artifacts are under test-results/reports, test-results/gameplay and test-results/pwa. Run:

```sh
npm ci
npx playwright install chromium webkit firefox
npm run release:check
```

## Physical/manual gate record

| Environment | Evidence | Status |
| --- | --- | --- |
| User's phone, public Pages URL | User reported that the game worked; model/browser and exact actions were not supplied | Basic play confirmed; platform-specific coverage unverified |
| Android phone/tablet Chrome | Actual finger drag/tap, rotation cancellation, home-screen installation, offline reload/update | Pending physical-device check |
| iPhone Safari | Actual finger controls, installed mode, offline resume, update and viewport behavior | Pending physical-device check |
| iPad Safari | Portrait/landscape layout, installed mode, offline save/solution viewing | Pending physical-device check |
| VoiceOver / TalkBack / desktop screen reader | Grid/cell announcements, keyboard/gesture navigation, modal focus, score/save announcements | Pending manual assistive-technology check |
| Physical stylus | Selection/drag/cancel and no page-scroll conflicts | Pending physical input check |

Use a disposable test profile/attempt for destructive storage experiments; do not clear a player's real site data. For each device, record OS/browser version, date and pass/fail for: open the public URL, solve a level, undo/restart, memorize/recall, rotate mid-drag, confirm saved status, reload offline, view/exit a solution, install/launch, apply an offered update and confirm identical saved state. Record reproducible failures as issues before promoting the candidate to a final release.

## Content and publication

The repository was made public at the user's explicit request after Phase 5. Earlier reports describing private research fixtures record the policy at that time. Publishing the repository does not retroactively grant contributor-pack rights or expand the game's content scope. The runtime and corresponding-source archive continue to exclude historical INI/PDB/PRC research fixtures, catalogue, original encoded solutions and reference binaries; only the cleared Classic layouts and new solution paths are shipped. GPL notices and runtime dependency notices remain included.

The candidate can be deployed through the existing tested Pages workflow. The stacked phase PRs still require integration/review into main. Final 1.0.0 promotion should wait for the physical/manual gates above; no final release tag is created by this phase's automated checks.
