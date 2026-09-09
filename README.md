# @conjureos/ui

ConjureOS design tokens and primitive UI classes. The **Modern Whimsy** visual language packaged as a versioned CSS bundle.

This is the design library AI-generated ConjureOS apps consume so they visually feel like ConjureOS by default. Lives in its own repo so the visual language can evolve on its own cadence; built into ConjureOS as a dependency.

[![npm](https://img.shields.io/npm/v/@conjureos/ui.svg)](https://www.npmjs.com/package/@conjureos/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## See it live

Run `npm run build`, then open [`demo.html`](demo.html) in any browser. No server, no framework, no dependencies.

The page renders every primitive in all nine themes and both flavors, with a theme dropdown at the top and the markup for each component in a collapsible block beside it. It loads the real `dist/ui.css`, so what you see is exactly what your app gets; anything wrong on that page is wrong in the package.

## Style guide

[MODERN_WHIMSY.md](MODERN_WHIMSY.md) is the canonical reference for the visual language: the theming contract, all nine palettes with their values, the full token reference, every component with its markup, surface idioms, voice, and known drift. The final `## For agents` section is inline-imported by the ConjureOS Dev agent's system prompt, so edits to that section flow straight into AI-generated apps.

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

## Theming

Two attributes, set on `<html>`.

```html
<html lang="en" data-theme="spr" data-flavor="dark">
```

`data-theme` picks one of nine palettes: `cnj` (Conjure, the default), `hal`, `fal`, `win`, `spr`, `sum`, `xms`, `est`, `cnd`. `data-flavor` is `dark` or `light`.

Both are optional. Omit `data-theme` and the app inherits Conjure; omit `data-flavor` and it follows the browser's light/dark preference. Every one of the eighteen resulting token sets meets WCAG 2.1 AA.

To follow the ConjureOS theme and offer users a picker in your own settings, load the optional resolver:

```html
<script src="/_conjureos/ui/theme.js"></script>
<script>ConjureTheme.init({ theme: "spr" });</script>
```

See [MODERN_WHIMSY.md](MODERN_WHIMSY.md) for the precedence rules, the settings-panel pattern, and the full token reference.

## Token reference

Thirty five colour tokens, redefined by every theme in both flavors, plus theme-independent type, space, radius and motion tokens. Never hardcode a hex value; it will be wrong in eight of the nine themes.

The most-reached-for:

| Token | Use |
|---|---|
| `--cui-bg` / `-1` / `-2` / `-3` | Ground layers, deepest to highest |
| `--cui-fg` / `-mute` / `-dim` | The only three text tiers |
| `--cui-accent` | The lead hue as a fill |
| `--cui-on-accent` | The label on that fill. Never `white`. |
| `--cui-link` | The lead hue as text. A different value from `--cui-accent`. |
| `--cui-support` / `--cui-third` | The palette's other two hues, each with `-text` / `-tint` / `-line` |
| `--cui-hero-bg` / `-fg` | The featured card and its own foreground |
| `--cui-border` | Hairline |
| `--cui-radius` | `10px` default corner |
| `--cui-radius-pill` | `999px` |

Full set in `src/tokens.css`, documented in [MODERN_WHIMSY.md](MODERN_WHIMSY.md).

## Primitive class reference

Around fifty primitives across buttons, form controls, feedback, pills and chips, navigation, data display and surfaces. The complete list is autogenerated into [MODERN_WHIMSY.md](MODERN_WHIMSY.md) at build time, and every one is rendered with its markup in [`demo.html`](demo.html).

## Build

```bash
npm run build
```

Produces `dist/ui.css`, a single concatenated stylesheet with a version header, and `dist/theme.js`, the optional theme resolver. It also refreshes the autogenerated primitive list inside `MODERN_WHIMSY.md`. v1 keeps the build dead simple; PostCSS and minification can layer in when the surface grows.

```bash
npm run dev
```

Same as `build` but re-runs on source changes for round-trips during local dev.

## Versioning

The major version is reflected in the built filename ConjureOS serves: `/_conjureos/ui/v1.css`. Breaking changes ship as a parallel `v2.css` so existing apps don't regress. Minor and patch updates land within the same major-version URL.

The npm package follows standard semver. Pin with `^1.0.0` to take every 1.x release; those are additive by contract.

Upgrading from 0.3.x is a breaking change. 1.0.0 retired the purple brand gradient, split the accent into separate fill and text tokens, and changed which token supplies a filled control's label, so it is not a drop-in for markup that hardcoded colours. Read the changelog first.

## Stability

1.0 makes the token names and primitive classes a contract. A breaking change to either ships as 2.0 at a parallel `v2.css` URL, never silently inside 1.x.

What that does not cover: the palette values themselves. A colour may be retuned in a minor release when it fails a contrast check, which is a fix, not a break. Depend on the token, never on the hex it happens to resolve to today.

## Roadmap

See the [ConjureOS UI project board](https://github.com/users/Jonny-B/projects/12) for what is done, in flight, and queued. Light and dark flavors and the nine-palette theme system shipped in 0.4.0. Highlights for upcoming work: the ConjureOS shell half of the theme handshake, animation utility classes, and an optional Web Components layer.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).
