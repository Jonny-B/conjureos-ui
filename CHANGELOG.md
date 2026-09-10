# Changelog

All notable changes to `@conjureos/ui` are documented here. The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.3 (2026-09-10)

Contrast fixes found by a second, independent design review (9 themes x 2 flavors, screenshots plus a structural grep of the shell, cross-checked by hand against real contrast math before anything was applied).

### Fixed

- **`--cui-accent-hover` failed AA as a button label on two dark themes.** Both darken on hover while keeping a dark on-accent label, so darkening cost contrast: Winter dropped to 3.88:1, Spring to 4.23:1 (floor 4.5:1). Winter's hover is now `#5a9fc6` (6.61:1), Spring's `#5f9427` (5.23:1); same hue, one step lighter instead of darker.
- **Summer dark's `--cui-bg-3` was roughly twice as bright as any sibling's**, the root of several Summer-only failures on that surface: `fg-mute` 3.45:1, `link` 3.68:1, `warning`/`info` 4.00:1. Deepened to `#2b5b5d` (same hue), and `fg-mute` (`#b3cdcc`) and `link`/`link-hover` (`#7cd6d3`) deepened alongside it; all now clear 4.5:1 on every Summer dark ground.
- **Summer dark's error red failed as text on its own grounds** (2.75-3.99:1 across bg through bg-3) even after the bg-3 fix, because the status reds are one shared hex across all nine themes and Summer's grounds are brighter than the value was set against. Summer dark alone now gets `#fca5a5` (5.82-4.60:1 across its grounds); every other theme is unchanged.

## 1.0.0 (2026-09-09)

Nine themes across two flavors, replacing the single dark purple palette. Developed as 0.4.0 and released as 1.0.0 without an intermediate publish: the change is breaking, and shipping it under a 0.x minor would have let consumers take it through a caret range that promises compatibility.

1.0 also makes the token names and primitive classes a contract. The deprecated aliases were originally scheduled for removal here; they now go in 2.0, because the ConjureOS shell still reads eight of them and has not been migrated.

Markup that hardcoded a colour will be wrong in most themes. See Migration at the end of this entry.

### Added

- **Nine palettes**, selected with `data-theme` on any element: `cnj` (Conjure, the default), `hal` (Halloween), `fal` (Fall), `win` (Winter), `spr` (Spring), `sum` (Summer), `xms` (Christmas), `est` (Easter), `cnd` (Candyland).
- **Two flavors**, selected with `data-flavor`: `dark` and `light`. Light theme was previously deferred; it now ships for all nine. Omitting the attribute follows the browser's `prefers-color-scheme`, which is the only thing the OS setting controls. It never picks a palette.
- Eighteen complete token sets, every one checked against WCAG 2.1 AA: 4.5:1 for text, 3:1 for interactive boundaries per 1.4.11.
- Both attributes inherit, so a subtree can override its ancestor and everything under it follows. Omitting an attribute means "inherit"; `data-theme="system"` spells that explicitly. Single-element helper classes `cui-t-<theme>-<flavor>` are available where an attribute is impractical.
- **`dist/theme.js`**, an optional theme resolver. Apps run in an iframe and custom properties do not inherit across that boundary, so an app that wants to follow the ConjureOS theme needs to be told. This implements the app's half: precedence (user choice, then ConjureOS, then the app default), persistence, and the postMessage handshake. `ConjureTheme.init()`, `.setTheme()`, `.setFlavor()`, `.subscribe()`, `.THEMES`. Safe to adopt now; the shell half is not built yet, and until it is the OS layer is simply silent.
- New role tokens: `--cui-on-accent` (the label on an accent fill), `--cui-support*` and `--cui-third*` (the palette's other two hues, each with `-text` / `-tint` / `-line`), `--cui-hero-bg` / `-fg` / `-mute` / `-line` (the featured card, which carries its own foreground pair), `--cui-tile` / `-line` / `--cui-glyph` (icon tiles), `--cui-onstatus`, and `--cui-ease-bounce`.
- Eighteen new primitives: `cui-button--sm` / `--lg` / `--icon`, `cui-button-group`, `cui-textarea`, `cui-choice` with `cui-checkbox` / `cui-radio`, `cui-help`, `cui-alert` (+ four variants), `cui-toast`, `cui-progress`, `cui-spinner`, `cui-skeleton`, `cui-table`, `cui-avatar` / `cui-avatar-stack`, `cui-stat`, `cui-breadcrumb`, `cui-menu`, `cui-pagination`, `cui-tile`, `cui-empty`.
- `cui-pill--support` and `cui-pill--third`.

### Changed

- **The purple-to-blue brand gradient is retired.** `--cui-accent-gradient` still resolves, now to a flat `--cui-accent` fill.
- `cui-tab--active` no longer paints two hardcoded purple literals. It was the one component with the brand gradient baked into its rule; it now reads `--cui-accent` and `--cui-on-accent`.
- Filled buttons take their label from a token instead of `white`. Six of the nine themes have a lead hue too light to carry a white label; Fall's goldenrod takes white at 3.24:1 and near-black at 5.85:1. One literal could not serve both.
- `cui-card--hero` reads the featured tokens rather than a gradient over `--cui-bg-1`, and sets its own `color`. On Summer the featured card renders lighter than its ground, so inheriting the page foreground would put light text on a light card.
- Status colours are now theme-aware. The core green at `#34d399` fails as text on all nine light grounds, from 1.26:1 on Halloween to 1.73:1 on Conjure, so light flavors carry a deepened set.
- `--cui-border` and `--cui-border-strong` derive from each theme's text colour rather than from white, so a warm theme gets a warm hairline and a light flavor gets a visible one.
- `demo.html` rebuilt: it now loads the local `dist/ui.css` rather than the unpkg CDN, and carries a theme dropdown, a dark/light toggle, every primitive with its markup, and a ConjureOS shell mock.
- `MODERN_WHIMSY.md` rewritten around the theming contract, the nine palettes, the token taxonomy, and per-component usage, including the settings-panel pattern an app should offer.

### Fixed

Found by a scoped agent sweep of this release before it shipped, then verified against the code.

- **Setting only `data-flavor` on a nested element did nothing.** Tokens were written to read the flavor inline, and a custom property containing `var()` is substituted on the element that declares it, so the value was already resolved and inherited by the time a descendant flipped the flavor. Tokens are now stored as inert `--cui-bg-d` / `--cui-bg-l` pairs and collapsed by a single resolution rule matching every element that carries either attribute, so changing one re-resolves all 35 against the palette it inherited.
- **Every deprecated alias was frozen to Conjure.** Declared once on a bare `:root`, they substituted there and inherited that finished value into every themed subtree, so eight of the nine themes rendered a 0.3.x consumer the wrong colour. They now live in the resolution block and track the active theme.
- **`data-theme="system"` was a no-op.** The rule had an empty body, so it could not clear an ancestor's theme the way the docs claimed. It now declares the Conjure values and genuinely resets.
- **Fall light failed WCAG AA.** Its link colour was 4.49:1 on its own ground, under the 4.5:1 minimum. It clears on a card, which is what the published contrast table happened to measure. Now `#8f4705` at 5.00:1, and the tables measure against the page ground.
- The toggle's checked knob painted a literal `white` on the accent fill: 2.47:1 on Summer, 2.59:1 on Candyland, both under the 3:1 that 1.4.11 asks of a control indicator. It reads `--cui-on-accent`.
- `cui-card--hero` remapped `.cui-muted` but not `.cui-dim`, leaving the third text tier calibrated for the page rather than the card.
- Status pills were pinned to the dark-flavor status colours as raw rgba, so on a light flavor the border washed out and the fill no longer related to its own label. They derive from the status token via `color-mix`.
- A bare `cui-tile` never set its glyph colour, so a non-hero tile icon fell back to SVG black.
- `cui-menu-item` and `cui-pagination` shipped without focus-visible states.
- The primitive extractor only captured the first class in a selector, so `cui-is-current` was defined but never reached the agent appendix. It now takes every class, and the build warns if any primitive goes unlisted.
- Added `prepublishOnly`, since `dist/` is gitignored and `files` includes it: publishing from a fresh clone shipped a package with no stylesheet.
- The build stamped a wall-clock timestamp into every bundle, so no two builds were byte-identical.
- Corrected three figures: Fall's gold takes white at 3.24:1 (not 2.5:1), the core green fails as text on all nine light grounds (not five), and two themes carry pre-composited opaque tints (not five).

### Deprecated

Still resolving, mapped onto their nearest successor, to be removed in 2.0: `--cui-accent-soft` (use `--cui-link`), `--cui-accent-mute` and `--cui-accent-tint` (use `--cui-support-tint` / `-line`), `--cui-accent-gradient`, `--cui-warn` (use `--cui-warning`), `--cui-danger` (use `--cui-error`), `--cui-info-strong` (use `--cui-info`), `--cui-surface-hover` (use `--cui-bg-2`).

### Migration

Search your app for hex literals, `rgba(124,106,247,...)`, `color: white` on a filled control, and `rgba(255,255,255,0.0X)` surfaces. Each is a value with no theme behind it: correct under the old dark purple palette and wrong under most of the nine. Replace with the role token. Apps that already used tokens throughout need no changes.

## 0.3.0 (2026-06-13)

Form-field wrapper, quiet/plain pill variants, and the surface + brand tokens the ConjureOS shell needs to stop hand-rolling them. Purely additive: no existing class or token changes, so it's drop-in for every consumer.

### Added

- `cui-field` (+ `cui-field__label`, `cui-field__hint`): a vertical labeled-control wrapper with a muted hint slot. `cui-label` is label+control only; `cui-field` is what real forms reach for (label, optional hint, then a `cui-input` / `cui-select`).
- Pill variants: `cui-pill--neutral` (grey, no accent, for calm metadata tags) and `cui-pill--plain` (drops uppercase + letter-spacing and uses tabular figures, so mixed-case / numeric content like "v3 -> v4" reads naturally). `--plain` composes with `--neutral`.
- Tokens: `--cui-accent-hover` (#8e7df8, the accent one notch lighter for hover fills), `--cui-accent-pink` (#c780f7, the third brand accent), `--cui-brand-gradient` (the opaque 4-stop brand sweep, distinct from the translucent `--cui-accent-gradient` overlay), translucent glass surfaces `--cui-surface` / `--cui-surface-2` / `--cui-surface-hover` (alpha, so a blurred backdrop shows through), and `--cui-shadow-lg` (the large ambient drop for floating panels).

## 0.2.0 (2026-06-06)

Semantic color + button vocabulary. The button primitive grows beyond `primary` / `ghost` into the full intent set so apps don't hand-roll a danger button.

### Added

- Semantic color tokens in `tokens.css`: `--cui-secondary`, `--cui-danger`, `--cui-warning`, `--cui-info-strong`, `--cui-link` (plus `-hover` variants). These are button-weight shades, a touch more saturated than the existing lighter pill tints (`--cui-success/warn/error`), so a filled button reads as solid with a legible label.
- Button variants: `cui-button--secondary` (neutral slate fill), `cui-button--danger` (destructive red), `cui-button--warning` (amber, dark label), `cui-button--info` (blue), and `cui-button--link` (chrome-less, underline-on-hover, keeps button semantics). They sit beside the existing `--primary` / `--ghost` / `--pill`.
- Pill parity: `cui-pill--danger` (alias of `--error` for naming consistency) and `cui-pill--info`, rounding out the `--success` / `--warn` / `--error` set.

## 0.1.3 (2026-05-25)

Six new CSS primitives (`select`, `slider`, `toggle`, `tabs`, `tooltip`, `modal`) and a build-time autogen for the agent appendix.

### Added

- `cui-select`: styled native `<select>` with a chevron and the standard accent focus ring. Drop-in replacement for `<input>` ergonomics.
- `cui-slider`: styled native `<input type="range">`. Accent thumb, scale-on-hover, focus ring via `--cui-accent-tint`.
- `cui-toggle` + `cui-toggle__track`: checkbox-style on/off switch. Accent fill when checked, animated thumb slide.
- `cui-tabs` + `cui-tab` + `cui-tab--active`: pill-shaped segmented control. Active state uses the signature 135deg purple/blue gradient matching the shell's Settings tabs.
- `cui-tooltip` with `data-tooltip="..."` attribute: pure-CSS hover/focus tooltip, no JS required.
- `cui-modal-backdrop` + `cui-modal`: blurred-backdrop overlay with a centered card. Entrance animations via the existing rise keyframes.
- New demo sections in `demo.html` for each of the six primitives, with copy-pasteable code snippets.

### Changed

- `scripts/build.mjs`: parses `src/ui.css` for `/* ---- Section ---- */` headers + `.cui-ui .cui-NAME` selectors and injects a bullet list between `<!-- AUTOGEN:primitives -->` and `<!-- /AUTOGEN -->` markers in `MODERN_WHIMSY.md`. The Dev agent's `?raw` import of the appendix now reflects the actual primitives shipped, automatically, on every build. No more "did I remember to update the appendix" drift.
- `MODERN_WHIMSY.md`: the hand-written "Primitive classes" bullet list in the `## For agents` appendix is now generated by the build script. The surrounding prose (tokens, signature idioms, voice, examples, opt-out) stays hand-written because that's judgment, not facts.

## 0.1.2 (2026-05-27)

Modern Whimsy style guide moves into the library so the visual language has one canonical document instead of three drifting summaries (tokens.css, the Dev agent's hand-written prompt block, and scattered `// Modern-Whimsy facelift` comments in the ConjureOS shell).

### Added

- [`MODERN_WHIMSY.md`](MODERN_WHIMSY.md): the canonical style guide. Covers palette, type, space, motion, surface idioms (hero strip, translucent surface, pill active state, card hover lift, entrance rise), voice (wand-glyph errors, invitation empty states), how to consume, and known drift. Ends with a `## For agents` appendix that is inline-imported by the ConjureOS Dev agent's system prompt via Vite `?raw`, so future edits to the agent-facing spec only need to happen here.
- `MODERN_WHIMSY.md` added to the package `files` array so the doc ships with the published package and is resolvable from consumers via `@conjureos/ui/MODERN_WHIMSY.md?raw`.
- README: a "Style guide" section pointing at the new doc.

## 0.1.1 (2026-05-25)

Documentation polish for the first public release. No code changes; the tokens, primitive classes, and build script are byte-identical to 0.1.0.

### Added

- `demo.html`: a single static page at the repo root that renders every primitive class and color token, with copy-pasteable code snippets beside each example. Open in any browser after `npm run build`, no JS framework required. Doubles as a smoke-test page for verifying the published CSS.
- README: a "See it live" section pointing at `demo.html`.
- README: explicit `npm install @conjureos/ui` path for consumers outside the ConjureOS shell, alongside the existing `<link>` instructions for in-shell apps.
- README: shields.io badges for the npm version and the MIT license.
- README: a Stability section that flags pre-1.0 status and the no-silent-breakage versioning promise.
- README: a Roadmap pointer to the [ConjureOS UI project board](https://github.com/users/Jonny-B/projects/12) so consumers can see what is queued.
- This `CHANGELOG.md` file.

### Changed

- README: small copy edits for clarity; replaced em-dash punctuation with commas, colons, and parentheses to match the project's writing-style rule.

## 0.1.0 (2026-05-22)

Initial public release. First package under the `@conjureos` npm org.

### Added

- `src/tokens.css`: semantic CSS custom properties (color, typography, space, radius, motion). Wrap content in `.cui-tokens` to pick up the palette without primitive classes.
- `src/ui.css`: primitive component classes (card, button, pill, chip, input, stack, heading, divider). Wrap in `.cui-ui` for tokens plus primitives.
- `src/index.css`: public entry that imports both.
- `scripts/build.mjs`: concatenates `src/*.css` into `dist/ui.css` with a version header. Supports `--watch` for local dev.
- Two opt-in modes via wrapper classes: `cui-tokens` for variables only, `cui-ui` for variables plus primitive classes. Apps that want to go off-brand just omit the wrapper.
- MIT license.
- Consumed by the main ConjureOS shell via a `file:../conjureos-ui` link in its `package.json` and a Vite plugin that copies `dist/ui.css` to `public/_conjureos/ui/v1.css` at build start, so the deployed shell serves it at a stable URL apps can `<link>` from inside their iframes.
