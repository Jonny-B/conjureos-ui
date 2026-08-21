# `@conjureos/ui` documentation

Technical documentation for **`@conjureos/ui`** — the ConjureOS design system.
Current published version: **0.3.1**.

| Page | What's in it |
|---|---|
| **README.md** (this page) | What the package is, why it exists, quick start, what's actually in the repo |
| [tokens.md](tokens.md) | Every CSS custom property in `src/tokens.css`, with values and intended use |
| [components.md](components.md) | Every `cui-*` class in `src/ui.css`, the markup it expects, and a copy-pasteable example |
| [usage.md](usage.md) | Consuming it: from an app inside ConjureOS, from a third-party/standalone app, from the shell itself, from anchor apps — plus gotchas |
| [contributing.md](contributing.md) | Build script, how to add a token or primitive without breaking consumers, release runbook, version history |

Related documents that live outside `docs/`:

- [`../MODERN_WHIMSY.md`](../MODERN_WHIMSY.md) — the canonical **style guide** (palette rationale, surface idioms, voice, known drift). Its final `## For agents` section is inline-imported into the ConjureOS Dev agent's system prompt. This is prose/judgment; `docs/` here is reference.
- [`../README.md`](../README.md) — the npm-facing readme (short).
- [`../CHANGELOG.md`](../CHANGELOG.md) — per-release notes.
- [`../demo.html`](../demo.html) — a static page rendering the primitives. Open it in a browser. (It has not been updated since 0.1.3, so the 0.2.0/0.3.0 additions are missing from it — [components.md](components.md) is the complete list.)
- ConjureOS repo: `PHASE_21_DESIGN.md` (why this package exists), `NPM_PACKAGES.md` (the release runbook).

---

<a id="what-this-package-is"></a>
## What this package is

A **CSS-only** package. No JavaScript, no React components, no build-time framework
integration, no dependencies. It ships:

1. **`src/tokens.css`** — 73 semantic CSS custom properties (`--cui-*`): colors,
   typography, spacing, radii, shadows, motion.
2. **`src/ui.css`** — **45** primitive classes (`.cui-*`): card, button, pill, chip,
   input, field, select, slider, toggle, tabs, tooltip, modal, stacks, typography
   helpers, divider. (46 `.cui-*` names appear in the file; the 46th is the `.cui-ui`
   wrapper itself, which is not a primitive.)
3. **`src/index.css`** — a public entry that `@import`s both, in that order.
4. **`scripts/build.mjs`** — concatenates `tokens.css` + `ui.css` into `dist/ui.css`
   with a version header, and regenerates the primitive list inside `MODERN_WHIMSY.md`.

That is the entire runtime surface. There is nothing else — no `dist/*.js`, no
`exports` map, no TypeScript types. `package.json`'s `main` points at `dist/ui.css`.

> **`dist/` is gitignored.** A fresh clone has no `dist/ui.css` until you run
> `npm run build`. The published npm tarball *does* contain `dist/` (see the
> `files` array in `package.json`: `dist`, `src`, `README.md`, `MODERN_WHIMSY.md`,
> `CHANGELOG.md`, `LICENSE`).

<a id="why-it-exists"></a>
## Why it exists

It came out of **ConjureOS Phase 21 ("ConjureOS Identity")**, shipped 2026-05-22 at
ConjureOS `0.5.31`. The trigger, quoting `PHASE_21_DESIGN.md`:

> AI-generated apps don't visually feel like ConjureOS; they look like whatever the
> AI happens to generate, which varies prompt-to-prompt.

So the visual language was pulled out of the shell's stylesheet into its own
versioned repo, and the **AI Dev agent was taught it**. Today the ConjureOS Dev
agent's system prompt inline-imports the `## For agents` appendix of
`MODERN_WHIMSY.md` at build time (Vite `?raw`), so a generated app links
`/_conjureos/ui/v1.css`, wraps `<body class="cui-ui">`, and reaches for `cui-*`
classes **by default**. A user who says "make it look like a Game Boy" gets an app
with the wrapper class omitted — that's the designed opt-out.

Two things widened the audience after Phase 21:

- **The shell itself adopted it** (the "cui adoption" phases, 2026-06 onward,
  recorded in ConjureOS `DECISIONS_ARCHIVE.md`). ConjureOS's `app.css` now does
  `@import "@conjureos/ui/dist/ui.css"` and `index.html` carries
  `<html lang="en" class="cui-tokens cui-ui">`. The shell's own `:root` tokens are
  aliases onto `--cui-*`. This **reversed** an earlier decision where the shell
  mirrored the library with parallel `.conjureos-*` classes.
- **Anchor apps consume it**, but not identically. `conjureos-fitness` takes it as an
  ordinary runtime npm dependency (`^0.1.1`) and imports `@conjureos/ui/dist/ui.css`.
  `conjureos-app-recipes` keeps it as a **devDependency** (`^0.1.2`) and imports a
  **vendored copy** committed at `src/conjureos-ui.css`, because the store bundler
  externalizes bare imports to a CDN that cannot serve a CSS-only package. Details in
  [usage.md path 4](usage.md#4-anchor-apps).

So the library is now the design system for *the whole platform*, not just
generated apps.

<a id="quick-start"></a>
## Quick start

Inside ConjureOS (the common case — the shell already serves the CSS):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <link rel="stylesheet" href="/_conjureos/ui/v1.css" />
</head>
<body class="cui-ui">
  <main class="cui-stack-v" style="padding: 24px">
    <h1 class="cui-heading">My ConjureOS App</h1>
    <p class="cui-muted">Looks like ConjureOS with three classes.</p>
    <div class="cui-card cui-stack-v">
      <label class="cui-field">
        <span class="cui-field__label">Name</span>
        <input class="cui-input" placeholder="Ada" />
      </label>
      <div class="cui-stack-h cui-stack-h--between">
        <button class="cui-button cui-button--ghost">Cancel</button>
        <button class="cui-button cui-button--primary cui-button--pill">Save</button>
      </div>
    </div>
  </main>
</body>
</html>
```

Outside ConjureOS:

```bash
npm install @conjureos/ui
```

```js
import "@conjureos/ui/dist/ui.css";
```

…then put `cui-ui` on `<body>` (or `<html>`) exactly as above. Full detail and the
per-bundler caveats are in [usage.md](usage.md).

<a id="the-two-opt-in-modes-and-the-opt-out"></a>
## The two opt-in modes (and the opt-out)

**Nothing in this stylesheet applies until an element opts in.** Every rule is
scoped under `.cui-tokens` or `.cui-ui`. Linking the CSS with neither class present
is a visual no-op.

| Wrapper class | You get | Use when |
|---|---|---|
| `class="cui-tokens"` | The 73 `--cui-*` custom properties, plus a baseline `font-family` / `font-size: 14px` / `line-height: 1.5` / `color` / `background` on the wrapper element | You want the ConjureOS palette but your own component CSS |
| `class="cui-ui"` | Everything `cui-tokens` gives **plus** the `.cui-*` primitive classes | The default for generated apps and most hand-written ones |
| *(no class)* | Nothing | Deliberate off-brand styling. Leave the `<link>` in place if you like; it has no effect |

`.cui-ui` is **not** nested inside `.cui-tokens` in the CSS — the token block's
selector is literally `.cui-tokens, .cui-ui { … }`, so `cui-ui` alone is enough.
Putting both on one element (as the shell does) is harmless.

<a id="compatibility-notes"></a>
## Compatibility notes

- **Dark theme only.** There is no light theme, no `prefers-color-scheme` handling,
  and no theme-switching API in 0.3.1. `tokens.css` says so in its header comment:
  *"Dark is the canonical theme; light-theme work lives in v2."* If you need light,
  you override the tokens yourself. See [tokens.md → Light and dark](tokens.md#light-and-dark).
- **Reduced motion** *is* handled: `@media (prefers-reduced-motion: reduce)` zeroes
  the three duration tokens.
- **Touch** is handled for form controls: `@media (pointer: coarse)` bumps
  `.cui-input` / `.cui-select` to 16px so iOS Safari doesn't zoom on focus (the
  0.3.1 fix).
- **Focus indicators are incomplete** — four interactive primitives have no focus
  rule and three suppress the UA outline (`src/ui.css:268`, `:366`, `:404`), against
  exactly one `:focus-visible` rule in the file. A package **defect**, not a design
  choice: tracked as
  [conjureos-ui#4](https://github.com/Jonny-B/conjureos-ui/issues/4), with a consumer
  mitigation in
  [components.md → Accessibility status](components.md#accessibility-status).
- Modern-CSS features used: custom properties, `inset`, `backdrop-filter`
  (`-webkit-` prefixed too), `appearance`, `::-webkit-slider-thumb` /
  `::-moz-range-thumb`, `:focus-within`, `:focus-visible`, `font-variant-numeric`.
  No `@layer`, no `:has()`, no container queries, no nesting.

<a id="how-these-docs-are-structured"></a>
## How these docs are structured (porting note)

Each file is a flat list of level-2 sections, and **every `##` heading is preceded by
an explicit `<a id="kebab-case-id"></a>` anchor**. Those ids are the stable handles:
they do not change when a heading is reworded, and they are what cross-file links in
these docs point at. A port to another surface — the in-app "ConjureOS Internals"
doc, for instance — can therefore split each file on `^## ` and take the preceding
anchor as the section id, with no slug-guessing and no punctuation heuristics.

Rules if you edit these files:

- One `##` = one section. Keep sections self-contained; don't split a topic across
  two of them for length reasons.
- Adding a section means adding its anchor line in the same edit.
- **Never change an existing id**, even when you reword its heading — inbound links
  and any ported copy key off it. Add a second anchor above the first if a new name
  is genuinely needed.
- `###` sub-headings have no explicit anchors and rely on GitHub's auto-slug, so
  links to them are the fragile ones. Two such links exist today, both inside
  `contributing.md`'s release history.
