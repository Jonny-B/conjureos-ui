# Changelog

All notable changes to `@conjureos/ui` are documented here. The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.1 (2026-05-25)

Documentation polish for the first public release. No code changes; the tokens, primitive classes, and build script are byte-identical to 0.1.0.

### Added

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
