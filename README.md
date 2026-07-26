# @conjureos/ui

ConjureOS design tokens and primitive UI classes. The **Mystical Fall** visual language packaged as a versioned CSS bundle.

This is the design library AI-generated ConjureOS apps consume so they visually feel like ConjureOS by default. Lives in its own repo so the visual language can evolve on its own cadence; built into ConjureOS as a dependency.

[![npm](https://img.shields.io/npm/v/@conjureos/ui.svg)](https://www.npmjs.com/package/@conjureos/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## See it live

Open [`demo.html`](demo.html) in any browser. The page renders every primitive class and color token in one place with copy-pasteable code snippets beside each example. No build step, no JS framework, no dependencies; the file pulls the published CSS from the unpkg CDN at load time so a fresh `git clone` works immediately.

To preview a local working copy of the library instead (e.g. while developing new tokens), swap `demo.html`'s `<link>` tag from `https://unpkg.com/@conjureos/ui/dist/ui.css` to `./dist/ui.css` and run `npm run build` first.

## Style guide

[MODERN_WHIMSY.md](MODERN_WHIMSY.md) is the canonical reference for the visual language: palette, type, motion, surface idioms, voice, and known drift. The final `## For agents` section is inline-imported by the ConjureOS Dev agent's system prompt, so edits to that section flow straight into AI-generated apps.

## Install

There are two consumption paths depending on where your app lives.

### Inside ConjureOS (the common case)

ConjureOS serves the built CSS at a stable URL inside its shell. No install needed. Just link it and wrap your body:

```html
<link rel="stylesheet" href="/_conjureos/ui/v1.css" />
<body class="cui-ui">
```

That URL is served from the deployed ConjureOS shell. Your app's iframe can reach it because they share the same origin.

### Outside ConjureOS (standalone build, bundler, npm-aware tooling)

```bash
npm install @conjureos/ui
```

Then import it into your build (Vite, webpack, esbuild, and friends):

```js
import '@conjureos/ui/dist/ui.css';
```

Or copy `node_modules/@conjureos/ui/dist/ui.css` into your own static assets and link it directly. Useful for sandboxed previews, dev playgrounds, or building anchor apps outside the ConjureOS shell.

## Quick start

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/_conjureos/ui/v1.css" />
</head>
<body class="cui-ui">
  <main class="cui-stack-v">
    <h1 class="cui-heading">My ConjureOS App</h1>
    <p class="cui-muted">Looks like ConjureOS with three classes.</p>
    <div class="cui-card">
      <button class="cui-button cui-button--primary cui-button--pill">Click me</button>
    </div>
  </main>
</body>
</html>
```

## Two opt-in modes

- `<body class="cui-tokens">`: CSS custom properties only. Bring your own classes and reach for `var(--cui-accent)` etc.
- `<body class="cui-ui">`: Tokens plus primitive classes (`.cui-card`, `.cui-button`, `.cui-pill`, `.cui-chip`, `.cui-input`, `.cui-stack-v`, `.cui-stack-h`, `.cui-heading`, `.cui-divider`, ...).

Apps that want to go off-brand entirely just omit the wrapper class.

## Token reference (the most-reached-for ones)

| Token | Value | Use |
|---|---|---|
| `--cui-accent` | `#7d4bb3` | Primary accent (buttons, focus rings) — mystic purple |
| `--cui-accent-soft` | `#c9a6ec` | Secondary accent (icons, captions) — light lavender |
| `--cui-bg` | `#130f19` | Root canvas — warm aubergine near-black |
| `--cui-bg-1` | `#1c1626` | Cards |
| `--cui-bg-2` | `#251d31` | Hover / modal surface |
| `--cui-fg` | `#ece5dd` | Primary text — warm parchment-white |
| `--cui-fg-mute` | `#a99f97` | Secondary text |
| `--cui-radius` | `10px` | Default corner |
| `--cui-radius-pill` | `999px` | Pill shapes |
| `--cui-accent-gradient` | `linear-gradient(135deg, ...)` | Hero surface backing (mystic → ember) |

Full set in `src/tokens.css`.

## Primitive class reference

- **Layout:** `cui-stack-v`, `cui-stack-h`, `cui-stack-h--between`
- **Card:** `cui-card`, `cui-card--interactive`, `cui-card--hero`
- **Button:** `cui-button`, `cui-button--primary`, `cui-button--ghost`, `cui-button--pill`
- **Status pill:** `cui-pill`, `cui-pill--success`, `cui-pill--warn`, `cui-pill--error`
- **Chip:** `cui-chip`, `cui-chip--active`
- **Input:** `cui-input`, `cui-label`
- **Typography:** `cui-heading`, `cui-subheading`, `cui-muted`, `cui-dim`
- **Divider:** `cui-divider`

## Build

```bash
npm run build
```

Produces `dist/ui.css`, a single concatenated stylesheet with a version header. v1 keeps the build dead simple; PostCSS / minification can layer in when the surface grows.

```bash
npm run dev
```

Same as `build` but re-runs on source changes for round-trips during local dev.

## Versioning

The major version is reflected in the built filename ConjureOS serves: `/_conjureos/ui/v1.css`. Breaking changes ship as a parallel `v2.css` so existing apps don't regress. Minor and patch updates land within the same major-version URL.

The npm package follows standard semver. Pin to `^0.1.0` to get every 0.1.x update automatically without surprise major bumps.

## Stability

Pre-1.0. The token names and primitive classes are stable for v1 but not yet contractually guaranteed. Any breaking change will ship as v2 at a parallel URL, never silently inside an existing major version.

## Roadmap

See the [ConjureOS UI project board](https://github.com/users/Jonny-B/projects/12) for what is done, in flight, and queued. Highlights for upcoming work: light theme support, animation utility classes, form primitives beyond input, an optional Web Components layer.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).
