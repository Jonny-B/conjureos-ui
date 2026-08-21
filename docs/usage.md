# Consuming `@conjureos/ui`

Five real consumption paths exist today, and they are genuinely different. Find
yours, then read [Gotchas](#gotchas) — most of them bite regardless of path.

| You are… | Path |
|---|---|
| Writing an app that runs **inside the ConjureOS shell** (generated or hand-written) | [1. Link the served URL](#1-inside-conjureos-link-the-served-url) |
| Building a **standalone / third-party app** with a bundler | [2. npm install](#2-outside-conjureos-npm-install) |
| Working on **ConjureOS itself** | [3. How the shell consumes it](#3-how-the-conjureos-shell-consumes-it) |
| Working on an **anchor app** (`conjureos-app-recipes`, `conjureos-fitness`) | [4. Anchor apps](#4-anchor-apps) |
| Exporting an app out of the shell with `@conjureos/pack` | [5. Exported projects](#5-exported-projects-conjureospack) |

---

<a id="1-inside-conjureos-link-the-served-url"></a>
## 1. Inside ConjureOS: link the served URL

The shell serves the built stylesheet at a stable path. Nothing to install.

```html
<head>
  <link rel="stylesheet" href="/_conjureos/ui/v1.css" />
</head>
<body class="cui-ui">
```

Your app runs in an iframe served from the same origin as the shell, so the
absolute path resolves.

The `v1` is **real versioning**, not decoration. A future breaking redesign ships as
`v2.css` at a parallel URL; `v1.css` stays alive so already-generated apps don't
regress. Minor and patch releases land *inside* `v1.css` — which means bug fixes
propagate to every existing app on the next shell deploy without the apps changing
anything.

This is the path the AI Dev agent emits by default. Its system prompt (built from
`MODERN_WHIMSY.md`'s `## For agents` appendix) instructs it to add that `<link>`,
put `cui-ui` on `<body>`, and prefer `cui-*` classes over raw
`<button>`/`<h1>`/`<input>`. Asking for a different look ("make it look like a Game
Boy") makes it drop the wrapper class — that is the designed opt-out, and the
stylesheet is inert without the class.

<a id="2-outside-conjureos-npm-install"></a>
## 2. Outside ConjureOS: npm install

```bash
npm install @conjureos/ui
```

```js
// Vite, webpack, Parcel, Next, anything that understands CSS imports
import "@conjureos/ui/dist/ui.css";
```

Then put the wrapper class on `<body>` (or `<html>`):

```html
<body class="cui-ui">
```

Alternatives if your toolchain doesn't import CSS from `node_modules`:

- Copy `node_modules/@conjureos/ui/dist/ui.css` into your static assets and `<link>`
  it.
- Link the CDN copy: `https://unpkg.com/@conjureos/ui/dist/ui.css` (this is what
  `demo.html` does, and what exported projects use — see path 5). Pin a version in
  the URL if you care: `https://unpkg.com/@conjureos/ui@0.3.1/dist/ui.css`.

Package facts that matter here:

- `main` is `dist/ui.css`. There is **no `exports` map**, so deep paths like
  `@conjureos/ui/dist/ui.css` and `@conjureos/ui/MODERN_WHIMSY.md` both resolve.
- The tarball ships `dist/` **and** `src/`, so `@conjureos/ui/src/tokens.css` is
  importable if you want tokens without primitives.
- No `peerDependencies`, no runtime deps, no JS. `engines.node` is `>=18` (only
  relevant to running the build script).

<a id="3-how-the-conjureos-shell-consumes-it"></a>
## 3. How the ConjureOS shell consumes it

Two separate mechanisms, for two different audiences. Verified against
`ConjureOS/vite.config.ts` and `ConjureOS/src/shell/ui/app.css` at the time of
writing.

### (a) A Vite plugin copies the artifact for apps

`vite.config.ts` defines `conjureosUiPlugin()`:

```ts
const conjureosUiPlugin = (): Plugin => {
  const src = fileURLToPath(new URL("./node_modules/@conjureos/ui/dist/ui.css", import.meta.url));
  const dst = fileURLToPath(new URL("./public/_conjureos/ui/v1.css", import.meta.url));
  const copy = () => { /* mkdir -p + copyFileSync, warn-and-continue if src is missing */ };
  return { name: "conjureos-ui-copy", buildStart: copy, configureServer: copy };
};
```

It runs at **`buildStart`** (production build) and at **`configureServer`** (dev
server start), so a local round-trip works: `npm run build` in `conjureos-ui`, then
restart the ConjureOS dev server. Cloudflare Pages then serves
`public/_conjureos/ui/v1.css` at `https://<host>/_conjureos/ui/v1.css`.

If `node_modules/@conjureos/ui/dist/ui.css` is missing, the plugin **warns and
continues** — the shell build succeeds, apps just get no design library at that
URL. If a generated app suddenly renders unstyled, check the build log for
`[conjureos-ui] dist/ui.css not found`.

> **Historical note, since older docs say otherwise:** Phase 21a originally linked
> the library into ConjureOS via `"@conjureos/ui": "file:../conjureos-ui"` in
> `package.json`, so local edits round-tripped without publishing. That is **no
> longer the case** — ConjureOS's `package.json` now pins the published package
> (`"@conjureos/ui": "^0.3.0"` at the time of writing). The Vite plugin's source
> path (`node_modules/...`) is unchanged either way; only where `node_modules` gets
> its copy from changed.

### (b) An `@import` loads it into the shell document itself

`src/shell/ui/app.css` begins with:

```css
@import "@conjureos/ui/dist/ui.css";
```

and `index.html` carries the wrapper classes on the root element:

```html
<html lang="en" class="cui-tokens cui-ui">
```

`cui-tokens` makes `--cui-*` resolve shell-wide **including body-portaled modals**;
`cui-ui` additionally activates the `.cui-*` component classes. The shell's own
`:root` tokens are aliases (`--bg: var(--cui-bg)` and so on), and its buttons and
admin form fields are literally `cui-button` / `cui-field` / `cui-input` /
`cui-select`.

Two shell-side details worth copying if you build something similar:

- The 14px/1.5 baseline that comes with the wrapper class is neutralized back to the
  shell's 16px base: `html.cui-tokens { font-size: 16px; line-height: normal; }`.
- Shell-specific flourishes are layered as overrides placed **after** the `@import`
  so they win by source order at equal specificity — e.g. the gradient
  `.cui-ui .cui-button--primary` and the 3px glow on `.cui-ui .cui-input:focus`.

This whole arrangement (the "cui adoption" phases) **reversed** an earlier decision
where the shell mirrored the library with parallel `.conjureos-*` classes and a
duplicate token set. The root cause of that mirror: the CSS was only being copied to
`public/` for iframes, so `--cui-*` were undefined in the shell document and
unusable. Don't reintroduce a mirror.

<a id="4-anchor-apps"></a>
## 4. Anchor apps

The two first-party anchor apps consume it differently, and the difference is
instructive.

**`conjureos-fitness`** — a normal Vite app. Plain npm dependency, bare import:

```ts
// src/main.tsx
import "@conjureos/ui/dist/ui.css";
import "./styles.css";
```

with `<body class="cui-ui">` in `index.html`, and `styles.css` re-pointing the app's
own token names at `--cui-*` **on `.cui-ui`** (not `:root` — see Gotchas).

**`conjureos-app-recipes`** — no Vite; built by `@conjureos/pack`'s `bundle()` (the
same path App Store publishing uses). Its bundler **externalizes every bare import
to the jspm ESM CDN, which cannot serve a CSS-only package**. So the app keeps
`@conjureos/ui` as a **devDependency only**, *vendors* the built CSS into `src/`,
and imports it by relative path:

```ts
// src/main.tsx
import "./conjureos-ui.css";   // VENDORED copy of @conjureos/ui dist/ui.css
import "./styles.css";

// The @bundle path generates its own HTML shell and drops the body class,
// so set it at runtime too:
document.body.classList.add("cui-ui");
```

Re-sync procedure, from the file's own header comment:

```bash
node node_modules/@conjureos/ui/scripts/build.mjs
cp node_modules/@conjureos/ui/dist/ui.css src/conjureos-ui.css
```

Both notes generalize: **if your bundler externalizes bare imports, vendor the
CSS**, and **if your bundler generates the HTML, add the wrapper class at runtime**.

<a id="5-exported-projects-conjureos-pack"></a>
## 5. Exported projects (`@conjureos/pack`)

When an app is exported out of the shell (`unbundle()`), the scaffold:

- adds `"@conjureos/ui": "latest"` to `dependencies` (a deliberate "no-babysit" pin
  policy, recorded in ConjureOS `DECISIONS_ARCHIVE.md` — existing exported folders
  pick up fixes on their next `npm install`);
- **strips `/_conjureos/*` stylesheet links** from the exported HTML, because that
  path only resolves inside the shell and would 404 under `conj-pack dev`. It emits
  a warning listing the dropped paths;
- keeps a `https://unpkg.com/@conjureos/ui/dist/ui.css` link in the same template,
  so styling survives the export.

If you export an app and it looks unstyled, check that the unpkg link (or a local
import) is present and that `<body class="cui-ui">` survived.

---

<a id="gotchas"></a>
## Gotchas

**1. The tokens are not on `:root`.**
They are declared on `.cui-tokens, .cui-ui`. A custom property is only visible to the
declaring element and its descendants. So if your wrapper class is on `<body>`, this
silently fails:

```css
/* ✗ html is body's PARENT — --cui-accent is not defined here */
:root { --accent: var(--cui-accent); }
```

```css
/* ✓ alias on the same element that declares them */
.cui-ui { --accent: var(--cui-accent); }
```

Both anchor apps have a comment about this in their `styles.css`. The shell dodges it
by putting the classes on `<html>`.

**2. Nothing renders without a wrapper class.**
The stylesheet is a no-op until an ancestor has `cui-tokens` or `cui-ui`. If every
`var(--cui-*)` resolves to nothing and your app renders as black-text-on-white, the
class is missing. Symptom seen for real: the store-bundled Recipes app rendered
unstyled until `document.body.classList.add("cui-ui")` was added, because the
generated HTML shell dropped the class.

**3. `cui-tokens` alone does not enable the classes.**
Component rules are scoped `.cui-ui .cui-thing`. `cui-tokens` gives variables only.
Use `cui-ui` (or both) if you want `.cui-card` to do anything.

**4. Opting in changes your base font size to 14px.**
The wrapper element gets `font-size: var(--cui-text-base)` (14px) and
`line-height: 1.5`. If your layout assumed a 16px base, override it explicitly.

**5. Overriding a background? Use the longhand.**
`background: var(--cui-bg-2)` on `.cui-select` resets `background-image: none` and
erases the chevron. Use `background-color`. (Real bug, fixed in ConjureOS shell
0.8.6, caught in an adversarial review.)

**6. Specificity of your overrides.**
Package rules are `.cui-ui .cui-thing` — specificity (0,2,0). A bare `.cui-thing`
override (0,1,0) loses. Match the shape (`.cui-ui .cui-thing`) and load your CSS
**after** `ui.css`; equal specificity is decided by source order. For a hover state
you may need one extra step (the shell uses `.cui-ui .cui-button--primary:hover:not(:disabled)`
at (0,3,1) to beat the package's (0,2,1)). Avoid `!important`.

**7. Form controls become 16px on touch.**
`@media (pointer: coarse)` bumps `.cui-input` / `.cui-select` to 16px so iOS Safari
doesn't zoom the viewport on focus. If you override the font-size of those controls,
re-apply the coarse-pointer rule or you reintroduce the zoom. Do **not** "fix" it
with `user-scalable=no` — that fails WCAG 1.4.4.

**8. Dark only.**
No light theme in 0.3.1. See [tokens.md → Light and dark](tokens.md#light-and-dark).

**9. Focus indicators are a known defect; the rest of accessibility is your job.**
Four of the eight interactive primitives (`cui-button`, `cui-chip`, `cui-tab`,
`cui-card--interactive`) have no focus rule at all, and `cui-input` / `cui-select` /
`cui-slider` actively set `outline: none` — inputs and selects replacing it with only
a 1px border-color change, which will not meet WCAG 2.4.11. Treat that as a package
bug to compensate for, not as a design choice — it is filed as
[conjureos-ui#4](https://github.com/Jonny-B/conjureos-ui/issues/4) and unfixed as of
0.3.1. Paste the mitigation rule from
[components.md → Accessibility status](components.md#accessibility-status). ARIA,
roles, keyboard handling, and the modal focus trap genuinely are yours to supply.

**10. `dist/` is gitignored — and `demo.html` does not use it.**
A fresh clone of this repo has no built CSS until you run `npm run build`. Two
separate consequences, and one is a trap:

- The ConjureOS Vite plugin reads `node_modules/@conjureos/ui/dist/ui.css`. Missing
  → it logs `[conjureos-ui] dist/ui.css not found` and the shell builds without the
  design library.
- **`demo.html:14` links `https://unpkg.com/@conjureos/ui/dist/ui.css`, not
  `./dist/ui.css`.** That is deliberate (a fresh clone renders with no build step),
  but it means the demo shows the **published, unpinned** package from the CDN. Edit
  `src/ui.css`, run `npm run build`, open `demo.html` — and you see **no change**,
  because you are looking at npm's copy of 0.3.1. To review a local change you must
  temporarily repoint that `<link>` to `./dist/ui.css`, and not commit the edit. See
  [contributing.md → Verifying a change](contributing.md#verifying-a-change).

**11. The wrapper class and a primitive class can never share an element.**
Every rule in `src/ui.css` is a descendant selector (`.cui-ui .cui-thing`); there is
no `.cui-ui.cui-thing` rule anywhere. `<body class="cui-ui cui-stack-v">` gets no
stack; `<div class="cui-ui cui-card">` gets no card. The wrapper element is not its
own descendant. Wrapper on `<html>`/`<body>`, primitives inside.

**12. The wrapper paints its own background, and nothing else's.**
`src/tokens.css:149-154` applies `color` and `background: var(--cui-bg)` to the
element carrying `.cui-tokens` / `.cui-ui`. Put that class on a nested `<div>` and
the page canvas around it keeps the UA default white — white gutters beside your
layout, a white flash before paint, and white overscroll rubber-banding on iOS. Put
the wrapper on `<html>` or `<body>` (the shell uses `<html>`), or set
`background: var(--cui-bg)` on `html, body` yourself.

**13. `.json` imports and the store bundler.**
Unrelated to this package directly, but adjacent: `@conjureos/pack`'s store bundler
has no `.json` loader. Ship data as `.ts`. (From `conjureos-app-recipes/CLAUDE.md`.)
