# Vexed Web — Design Document

**Implementation blueprint · Version 1.1 · October 2026**

## Phase 0 audit update

The original 2.2 sources have now been acquired and the core has been exercised through a native reference harness. See [REFERENCE.md](docs/compatibility/REFERENCE.md), [RULES.md](docs/compatibility/RULES.md), and [LICENSING.md](docs/compatibility/LICENSING.md). The rules contract supersedes earlier assumptions below, especially undo grouping, blocked-step counting, scoring, and solution penalties. Representative Palm UI behavior is now verified in CloudpilotEmu, and all 59 Classic board layouts are traced to explicitly GPL-covered 1.3 source. Later pack metadata/contributor-pack distribution and exhaustive device validation remain open items.

## Objective

Recreate the original Palm OS Vexed as a modern, installable web application, preserving its puzzles and gameplay while providing excellent touchscreen support for Android, iPhone, tablets, and desktop browsers.

Players must be able to open the GitHub Pages (`github.io`) URL on an iPad or Android tablet and play immediately with finger input, without installation, an account, or an attached keyboard. Installation remains optional.

The application will offer **Classic Palm** and **Modern** presentation modes. Both modes will use the same game engine, game state, puzzle data, and scoring rules.

## Scope and principles

- Preserve original puzzle compatibility and gameplay before adding presentation enhancements.
- Keep the game self-contained: no backend, database service, authentication, or runtime cloud dependency.
- Produce a static application deployable to GitHub Pages, with Firebase Hosting retained as an alternative.
- Support mouse, stylus, finger, and keyboard interaction.
- Support offline play and persistent local progress.
- Avoid a game framework unless a demonstrated requirement warrants one.

GitHub Pages is the primary deployment target; gameplay must not require connectivity after the application and relevant packs have been cached.

## Requirements and verification status

The supplied planning text reports that original documentation describes the following features. These are compatibility requirements, but their precise implementation must be verified during the original-source audit.

| Requirement | Design implication | Audit needed |
| --- | --- | --- |
| 10 × 8 board | Fixed logical grid with responsive visual scaling | Confirm coordinate conventions and cell encoding |
| Stylus dragging | Pointer Events support for mouse, stylus, and touch | Confirm drag stop and movement rules |
| Alternative two-tap movement | Select a block, then select its destination | Confirm interpretation of destinations on a different row |
| Move-based par scoring | Track moves and compare against level par | Confirm move counting, penalties, and aggregation |
| 15-move undo | Bounded history of reversible game states | Confirm history boundaries and counting semantics |
| Level packs | Import and select multiple puzzle collections | Confirm formats, metadata, and redistribution rights |
| Replayable solutions | Deterministic move recording and playback | Confirm solution encoding and timing semantics |

The Palm source archive was not inspected during the initial planning pass; the subsequent Phase 0 audit now supplies source-based findings in RULES.md. Exact gravity, matching, collision, cascade, gesture, and scoring behavior must therefore remain explicit audit items rather than assumptions.

## Architecture decisions

| Component | Technology | Decision |
| --- | --- | --- |
| Language | TypeScript, strict mode | Entire application |
| Build | Vite | Static production build |
| UI | React + CSS | Menus, game screen, and settings |
| Game engine | Pure TypeScript | No React or browser dependencies |
| Graphics | CSS Grid + SVG | Scalable, animated blocks |
| Touch | Pointer Events | Mouse, stylus, and finger |
| Tests | Vitest + Playwright | Engine parity and mobile interaction |
| Storage | IndexedDB / localStorage | Offline level data, progress, and saves |
| Deployment | GitHub Pages; optional Firebase Hosting | Static build; no backend required |
| Offline | Service worker / PWA | Installable mobile experience |

### Module boundaries

**Engine:** Owns legal movement, board resolution, move accounting, completion detection, undo, and deterministic replay. It consumes puzzle data and logical commands and returns state plus events for presentation.

**Input controller:** Converts pointer or keyboard interactions into logical commands. It owns selection, gesture tracking, cancellation, and destination intent, while the engine remains authoritative about legality.

**Presentation:** Renders the board, menus, feedback, and animations. Classic Palm and Modern themes share engine behavior. Animation completion must not determine game outcomes.

**Content pipeline:** Converts original level packs and recorded solutions into validated application assets, preserving provenance and stable identifiers.

**Persistence and offline layer:** Stores settings, progress, saves, and cached content locally. It handles schema versions and service-worker updates without changing engine behavior.

## Engine design

### Deterministic state

Represent the board and all gameplay-relevant counters explicitly. Keep rendering details, pointer coordinates, browser APIs, and animation timers outside engine state. Identical initial states and command sequences must produce identical results.

Puzzle definitions should include stable pack and level identifiers, initial board data, available par information, and source provenance. Save files and replay records should include schema and rules versions so incompatible data can be detected.

### Atomic movement versus user gestures

A single drag can cross multiple spaces. The Palm game also has special rules governing where a drag stops. The engine must therefore distinguish an **atomic block movement** from a **user gesture**.

Do not assume that every swipe equals a one-cell move or that each internal board step increments the score. Phase 0 must establish how a gesture maps to movement, resolution, undo history, and move accounting.

### Resolution

Implement movement, collision, gravity, matching, and cascades in the order established by the source audit. Expose meaningful transition events so the UI can animate an authoritative result without duplicating rules.

Reject malformed commands and invalid UI endpoints without partially mutating state. Preserve the audited Classic behavior in which a blocked intermediate step on an otherwise valid gesture can increment the move count. Define a stable point at which another command is accepted, and verify the original game's handling of continued dragging during resolution.

### Undo and replay

Implement 15 gesture snapshots for undo, restoring board and prior move count. A multi-cell gesture can count several horizontal steps but has a single undo entry, as confirmed by the Phase 0 source audit. Replay must use the same engine command path as interactive play. Original recorded solutions will provide compatibility fixtures wherever available and legally usable.

## Interaction and responsive presentation

### Pointer interaction

Use a single Pointer Events controller for mouse, stylus, and finger. Track idle, selected, dragging, and cancelled interactions explicitly. Handle pointer capture, release outside the board, pointer cancellation, and interrupted gestures.

Drag thresholds, destination mapping, and stop behavior must preserve audited mechanics while remaining usable on small screens. Prevent browser scrolling only where necessary for board interaction.

### Tap-to-move

Allow users to select a block and then tap a destination, including a destination on another row when supported by the original rules. Provide clear selection and legal-movement feedback. Destination interpretation belongs to a shared logical command path, so drag and tap interactions cannot diverge in gameplay behavior.

### Tablet touchscreen play

Support iPad Safari and Android tablet Chrome in portrait and landscape, including browser tabs and optional installed PWA mode. The complete play loop—pack and level selection, dragging, tap-to-move, undo, restart, settings, and solution playback—must be operable with one finger and without hover.

- Scale the 10 × 8 board from available width and height with square cells; reflow controls beside or below it as space permits. Keep the board and essential controls visible at common tablet sizes, including 768 × 1024 and 1024 × 768 CSS pixels.
- Use at least 44 × 44 CSS-pixel toolbar and menu targets. Keep selection and destination feedback visible despite finger occlusion. Test narrower split-screen layouts with the phone layout fallback.
- Apply `touch-action: none` only to the interactive board. Preserve normal scrolling and browser zoom outside it. Do not disable zoom globally.
- Capture the active pointer and ignore additional contacts during a gesture. Cancel uncommitted moves on pointer cancellation, rotation, resize, or backgrounding; preserve the settled board and score.
- Recompute hit testing after layout changes and account for browser chrome and safe areas. Taps and multi-cell drags must retain the same engine semantics in either orientation.

### Keyboard and accessibility

Provide keyboard selection and movement, visible focus, accessible controls, readable status feedback, and reduced-motion support. Distinguish block types through shapes or symbols as well as color. Verify operation at phone, tablet, and desktop sizes in both themes.

### Themes and animations

Classic Palm should evoke the original presentation; Modern should provide a contemporary visual treatment. Both must retain identical puzzle layouts, legal moves, scoring, and completion behavior. Animate engine events and support reduced motion without affecting deterministic results.

## Content conversion and compatibility

1. Obtain and inventory the Palm 2.2 source, level packs, and available solutions.
2. Record source locations, versions, and applicable licenses.
3. Audit board encoding, movement, resolution order, scoring, undo, and replay.
4. Convert approved packs into versioned JSON with stable identifiers.
5. Validate dimensions, cell values, metadata, and solution references.
6. Replay original solutions against the TypeScript engine.
7. Investigate discrepancies before declaring a pack compatible.

Do not redistribute original code, artwork, levels, or solutions until applicable rights have been established.

## Progress, scoring, and offline behavior

Persist local settings, selected pack and level, current saves, completion records, and audited scoring data. Use localStorage for small preferences and IndexedDB for structured progress, saves, and any downloaded packs. Define versioned migrations and recovery behavior for invalid saves.

Cache the application shell and bundled content for offline play. Clearly identify any packs that require a download before offline use. Service-worker activation must preserve valid saved progress and avoid disrupting an active game.

## GitHub Pages deployment

Publish the built `dist/` directory as a static GitHub Pages site. The expected project URL is `https://<owner>.github.io/<repository>/`; owner and repository remain configuration values until the repository is chosen. Also support a root user/organization site.

### Build and URL handling

Set Vite `base` to `/<repository>/` for a project site and `/` for a root site. Resolve runtime pack URLs through `import.meta.env.BASE_URL`; ensure icons, theme assets, manifest URLs, and service-worker registration respect the same deployment base. These settings follow the [Vite static deployment guide](https://vite.dev/guide/static-deploy.html).

Use hash navigation if shareable app routes are needed, or keep navigation within the single entry page. Refreshing a level URL must work without a server-side SPA rewrite. No gameplay code may depend on Firebase APIs.

### Publishing and offline scope

Use GitHub Actions to run the required checks, build, upload the Pages artifact, and deploy via the Pages environment, following [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Record the published URL and build version. Adding this design requirement does not publish the site.

Set manifest `start_url` and `scope`, service-worker location and scope, and cached asset URLs to the deployment base. Scope cache cleanup to this application. Namespace saves and caches by application/deployment because multiple project sites can share a `github.io` origin. Progress remains local to the browser and origin; switching hosting origins does not transfer it automatically.

The first visit requires connectivity. Once the shell and selected pack are cached, tablet users must be able to reload and resume offline. Ordinary browser play must work even when PWA installation is unavailable or declined.

### Deployment acceptance criteria

- Open the actual HTTPS Pages URL on an iPad and Android tablet and complete a puzzle using only touch.
- Confirm scripts, styles, SVG, icons, manifest, and lazy-loaded packs load beneath the repository subpath without 404s.
- Refresh a level link, rotate during a drag, reload after a committed move, and resume a cached pack offline without changing the saved board or score.
- Deploy an updated build and verify that service-worker updates preserve progress and do not serve incompatible asset versions.

## Implementation roadmap

| Phase | Deliverables | Exit criteria |
| --- | --- | --- |
| 0 — Original source and rules audit | Source inventory, licensing findings, documented rules, compatibility fixtures | Rules and redistribution constraints are recorded; unresolved behavior is explicit |
| 1 — Pure TypeScript engine | Movement, gravity, matching, cascades, undo, deterministic tests | Audited mechanics pass focused engine tests |
| 2 — Original level conversion | Validated JSON packs and solution replay tooling | Target Classic puzzles and available solutions pass compatibility checks |
| 3 — Touch-first playable game | Responsive board, dragging, tap-to-move, keyboard | Main play loop works with finger input on portrait and landscape tablets and across other target input methods |
| 4 — Full gameplay experience | Themes, animations, scores, progression, replay, solutions | Features preserve audited mechanics and saved progress |
| 5 — Offline PWA | Persistence, caching, installability, GitHub Pages workflow and base-path configuration | Pages build loads under its repository path; cached content plays offline and updates preserve progress |
| 6 — Compatibility and release testing | Pack validation, real-device tests, accessibility review | Release checks pass and approved content can be published |

Progressive hints and a solver are post-v1 enhancements. Full reference-solution playback is in v1; its historical penalty and restoration behavior require source verification.

## Validation strategy

- **Vitest:** Test deterministic engine transitions, legal and illegal moves, resolution ordering, move counting, completion, undo boundaries, and replay.
- **Compatibility fixtures:** Replay available original solutions and compare expected results. Record any unsupported or unverified packs.
- **Playwright:** Exercise dragging, multi-space gestures, tap destinations, cancellation, keyboard controls, responsive layouts, persistence, and offline behavior.
- **Real devices:** Test the published GitHub Pages URL on iPad Safari and Android tablet Chrome in portrait and landscape; verify finger-only play, rotation cancellation, save/resume, and offline reload. Also validate phone, desktop, and optional installation behavior.
- **Hosting regression:** Build and serve under a repository subpath; verify asset/pack loading, hash-link refresh, manifest and service-worker scope. Use Playwright tablet viewports as automated coverage alongside physical tablet checks.
- **Accessibility:** Verify focus, keyboard operation, non-color identification, readable feedback, and reduced motion.

The first meaningful milestone is a TypeScript engine that reliably reproduces the original Classic puzzles. Presentation work can proceed alongside the audit, but unverified prototype behavior must not become the compatibility specification.

## Recommended development approach

Adopt **preservation-first development**, with a small playable prototype alongside the audit if useful. Examine the Palm 2.2 engine, document its exact behavior, implement those rules in TypeScript, and validate against original solutions.

A prototype-first approach can produce playable results sooner but carries greater risk of reworking movement and scoring. The surviving source makes source-based verification the preferred foundation.

## Open decisions and risks

| Item | Required resolution |
| --- | --- |
| Source availability | Obtain and inspect the original engine archive |
| Licensing | Establish rights for each redistributed asset and pack |
| Gesture semantics | Confirm multi-space movement, drag stops, and cross-row tap destinations |
| Resolution semantics | Confirm gravity, matching, collision, and cascade ordering |
| Scoring and undo | Confirm move boundaries, par calculation, and history restoration |
| Solution coverage | Inventory replayable solutions and define compatibility coverage |
| Hints | Decide whether to use recorded solutions, search, or a narrower initial feature |
| Browser support | Set supported versions and validate installation on target devices |

## Relationship to the supplied planning text

This document provides the high-level design. The accompanying [TypeScript/Vite Implementation Plan](Vexed_Web_TypeScript_Vite_Implementation_Plan.md) supplies the detailed repository layout, proposed interfaces, input state machine, conversion pipeline, release gates, and prioritized backlog VX-001 through VX-022. Use its section 13 for the canonical Phase 0–6 implementation sequence; some topical section headings in that plan use different phase numbers.

The implementation plan is the original supplied blueprint. Source inspection and a native reference harness have since been completed as documented in the Phase 0 report; the web application has not been implemented. Its proposed types, settling order, scoring details, and solution codec remain subject to the Phase 0 source audit. Where scope differs, follow its release cuts: one verified pack for MVP; validated redistributable packs, themes, scoring, replay/solutions, and PWA for v1; editor, user pack import, progressive hints, and solver afterward. No implementation work is initiated by adding these planning documents.

The GitHub Pages and tablet requirements in this design supersede Firebase-only deployment wording in the accompanying implementation plan.

Phase 0 follow-up: visible level labels use one-based numbering as confirmed by the original 2.2 binary; stable IDs remain zero-based. The initial public MVP content policy is GPL-covered Classic board layouts with generic labels and newly recorded/derived solutions, pending separate clearance of later metadata and contributor packs. See the audit report for 23 handler tests and emulator screenshots.

## Phase 1 implementation status

The strict Vite/React scaffold and DOM-free TypeScript engine are implemented. Movement, settling, matching, cascades, gesture-level undo, restart, checkpoints, the solution codec and pure pack scoring are covered by unit and frozen-reference tests. The browser shell is an authored engine demonstration; full pack conversion, tablet input, persistence and deployment remain later phases. See [implementation notes](docs/development/PHASE-1.md).

## Phase 2 implementation status

Both original formats are now converted with pinned source hashes, stable IDs and strict validation. All 4,016 source solution sequences pass through the TypeScript replay audit, including a documented reference-only empty move; the two datasets overlap. Classic has all 59 final-solution regression tests and a generated runtime pack using generic labels and par counts. The canonical private research catalogue has 48 PDB packs and 2,878 entries. See [Phase 2 notes](docs/development/PHASE-2.md). Full touchscreen play remains Phase 3.


## Phase 3 and 4 implementation status — October 2026

Classic's 59 puzzles now support tablet drag/tap input, keyboard navigation and responsive layouts. Phase 4 adds Classic Palm/Modern presentation, event-projected animations, original audited pack scoring and solution penalties, best completion records, progression with a labelled Practice option, memorize/recall, isolated player/previous replay, full solution viewing, settings and help. All 59 runtime solution paths are newly derived from cleared board layouts, not copied from historical solution strings. Engine state is authoritative before motion starts; Undo can interrupt motion safely. Progress and settings remain tab-local until Phase 5. See [Phase 3](docs/development/PHASE-3.md) and [Phase 4](docs/development/PHASE-4.md). Existing phase reports above describe their historical completion snapshots.
