# Maintaining `@conjureos/ui`

For people changing the package itself: the build, the rules for adding tokens and
primitives without breaking consumers, the release runbook, and the history you need
to know before you touch anything.

<a id="repo-map"></a>
## Repo map

```
conjureos-ui/
  src/tokens.css        73 --cui-* custom properties on `.cui-tokens, .cui-ui`
  src/ui.css            45 primitive classes, all scoped `.cui-ui .cui-thing`
  src/index.css         @imports tokens.css then ui.css (the public entry)
  scripts/build.mjs     concatenate → dist/ui.css; regenerate the MODERN_WHIMSY autogen block
  MODERN_WHIMSY.md      canonical style guide; its `## For agents` tail is the Dev agent's prompt
  demo.html             static page rendering the primitives — loads the PUBLISHED CSS from unpkg, not dist/
  docs/                 this documentation
  CHANGELOG.md          per-release notes
  .github/workflows/publish-npm.yml   version-gated publish on push to main (see caveat below)
  dist/                 GITIGNORED build output
```

No `node_modules` are required to build (the build script uses only Node builtins),
no tests, no linter, no CI other than the publish workflow.

<a id="build"></a>
## Build

```bash
npm run build          # node scripts/build.mjs
npm run dev            # same, with --watch on src/*.css
```

`scripts/build.mjs` does exactly two things:

1. **Concatenates** `src/tokens.css` + `\n\n` + `src/ui.css` into `dist/ui.css`,
   prefixed with a header comment carrying the `package.json` version, an ISO build
   timestamp, and the license line. No PostCSS, no autoprefixer, no minification —
   deliberate for v1. Note `src/index.css` is **not** part of the build; it exists
   for consumers who want the `@import` entry.
2. **Regenerates the primitive list** inside `MODERN_WHIMSY.md`, between the
   `<!-- AUTOGEN:primitives -->` and `<!-- /AUTOGEN -->` markers.

Expected output:

```
[conjureos-ui] built v0.3.1 → …/dist/ui.css (NNNNN bytes)
[conjureos-ui] MODERN_WHIMSY.md primitives autogen updated (16 sections).
```

…or `MODERN_WHIMSY.md primitives unchanged.` when nothing moved. Both are idempotent
— rerunning produces the same bytes apart from the timestamp in the header.

If the AUTOGEN markers are missing, or `MODERN_WHIMSY.md` is absent, the script
**warns and continues**; the CSS build never fails because of the style guide.

### How the autogen works (and how to not break it)

`extractPrimitives()` parses `src/ui.css` with two regexes:

- Section headers: `/* ---- Section Name ---- */` (three or more dashes on each side).
- Primitive classes: `^\s*\.cui-ui\s+\.(cui-[\w-]+)` — i.e. a selector that **starts
  a line** with `.cui-ui ` followed by a `.cui-*` class.

Consequences you must respect when editing `ui.css`:

- A new group of primitives needs a `/* ---- Name ---- */` header, or its classes get
  filed under the previous section.
- Write each selector at the **start of a line**. A class that only ever appears
  mid-line (after a comma on the same line as another selector) is invisible to the
  autogen and will silently miss the agent's prompt.
- Only the **first** class in a compound selector is captured
  (`.cui-ui .cui-toggle input:checked + .cui-toggle__track` yields `cui-toggle`), so
  any element/modifier that needs to be advertised must also have its own top-level
  rule.
- Sections containing no matching selector are dropped from the list (that's how the
  `@keyframes` blocks avoid polluting it).
- The parser is **not** CSS-aware: it does not know about `@media` blocks. A selector
  nested inside a media query still counts, and it is filed under whichever
  `/* ---- … ---- */` header precedes it. This is currently a live wart — see
  [the 0.3.1 note below](#031-2026-06-24--the-ios-touch-zoom-fix).

**Always run `npm run build` and commit the resulting `MODERN_WHIMSY.md` diff** —
with one live exception, below. That file is the AI Dev agent's prompt: ConjureOS
imports it with `import modernWhimsyGuide from "@conjureos/ui/MODERN_WHIMSY.md?raw"`
(in both `src/ai/agents/dev.ts` and `src/ai/generation/devPromptV2.ts`) and slices
it at the `## For agents` header. If the autogen block is stale, the agent doesn't
know your new primitive exists.

> **Exception, as of 0.3.1 — read this before you commit that diff.** A build today
> produces one line you did **not** cause:
>
> ```diff
> -- Select: `cui-select`
> +- Select: `cui-select`, `cui-input`
> ```
>
> That is the pre-existing bug described in
> [Known gap 2](#known-gap-2--the-committed-modern_whimsymd-is-stale), not your
> change. Do not commit it blind, and do not hand-edit it back either (the next
> build re-adds it). Fix the cause first, then rebuild, so the diff you commit is
> your work plus a corrected Select line — see
> [Known gap 2](#known-gap-2--the-committed-modern_whimsymd-is-stale) for the two
> candidate fixes and why the obvious one is not quite right.

<a id="verifying-a-change"></a>
## Verifying a change

There is no test suite. The manual gate:

1. `npm run build`.
2. **Repoint `demo.html`'s `<link>` before you look at it.** As committed,
   `demo.html:14` loads `https://unpkg.com/@conjureos/ui/dist/ui.css` — the
   *published* package from the CDN. Open it without editing and you are reviewing
   npm's 0.3.1, not your working tree: your change appears to have done nothing.
   Swap the href to `./dist/ui.css`, reload, confirm every section still renders,
   then **revert the edit before committing** (the committed file points at unpkg on
   purpose, so a fresh clone renders with no build step).
3. Add a demo section for anything new (every primitive added in 0.1.3 got one).
   **`demo.html` is currently behind:** it has no examples of the 0.2.0 semantic
   button variants (`--secondary`/`--danger`/`--warning`/`--info`/`--link`), the
   0.2.0/0.3.0 pill variants (`--danger`/`--info`/`--neutral`/`--plain`), or the
   0.3.0 `cui-field` family — grepping it for `cui-field`, `cui-pill--neutral` or
   `cui-button--danger` returns zero hits. Catching that page up is a good starter
   task.
4. If the change is intended for the shell, `npm install` it into ConjureOS (or copy
   `dist/ui.css` into `ConjureOS/node_modules/@conjureos/ui/dist/`), restart the
   ConjureOS dev server, and check the shell — the shell consumes the same classes
   now, so a regression there is a real regression.

<a id="adding-a-token"></a>
## Adding a token

1. Put it in the right numbered bucket in `src/tokens.css` (1 Color / 2 Typography /
   3 Space+radius+border / 4 Motion), next to its neighbors.
2. Name it `--cui-<role>`, semantic not literal. Follow the existing weight
   convention: the pill-weight status names are `--cui-success/warn/error/info`; the
   button-weight ones are `--cui-secondary/danger/warning/info-strong`; a hover
   partner is `<name>-hover`.
3. Give it a trailing comment saying what it's for, especially if it is close to an
   existing token (the `--cui-accent-hover` vs `--cui-accent-soft` comment is the
   model to copy).
4. Prefer defining it in terms of an existing token (`--cui-info: var(--cui-accent-soft)`)
   when it is genuinely the same value in a different role.
5. Document it in [tokens.md](tokens.md) and, if it's one an app author would reach
   for, in `MODERN_WHIMSY.md`'s palette tables and the `Key tokens` bullet list in
   the `## For agents` section (that list is hand-written, not autogenerated).
6. Add it to `CHANGELOG.md` under an `### Added` heading.

**Never change an existing token's value or name in a minor/patch release.** Every
app generated since Phase 21 links `v1.css` from the *live* deploy, so a value change
retroactively restyles apps nobody is maintaining. Adding is safe; changing is not.

<a id="adding-a-primitive-class"></a>
## Adding a primitive class

1. New `/* ---- Name ---- */` section in `src/ui.css`, in a sensible position.
2. Scope every rule `.cui-ui .cui-thing`. Never write a bare `.cui-thing`, never
   attach rules to `.cui-tokens` (that mode is variables-only, by contract).
3. Consume tokens, not literals. If you need a literal, it should be for one of the
   reasons already catalogued in
   [components.md → Hardcoded values](components.md#hardcoded-values-not-tokenized) —
   fixed control geometry, contrast-critical labels, or something CSS can't
   parameterize (alpha of a token, a data-URI stroke).
4. Naming: `cui-block`, `cui-block--modifier`, `cui-block__element`.
5. Keep it a **primitive**. The stated scope is "looks like ConjureOS with three
   classes," not "every possible component." Composites belong in the consuming app.
6. Selector at line start, so the autogen sees it.
7. Add a `demo.html` section with a copy-pasteable snippet. Remember the committed
   page loads the **published** CSS from unpkg, so your new class renders as
   unstyled markup there until you temporarily repoint the `<link>` — see
   [Verifying a change](#verifying-a-change) step 2.
8. Document it in [components.md](components.md) and the `CHANGELOG.md`.
9. `npm run build` and commit the `MODERN_WHIMSY.md` autogen diff — check it for the
   known stale `Select` line first
   ([Known gap 2](#known-gap-2--the-committed-modern_whimsymd-is-stale)), which a
   build today re-adds whether or not you touched anything near it.

### The compatibility contract

The rule that governs every release, in one line: **only add, never change.**

- New tokens and new classes → **minor** bump. Safe for every consumer.
- Fixing a bug in a way that changes rendering → weigh it. 0.3.1 changed the rendered
  font-size of `.cui-input`/`.cui-select` on touch devices and shipped as a *patch*,
  because the old behavior was a defect.
- Renaming or removing a class, renaming a token, or restyling an existing primitive
  → **breaking**. That does not ship inside `v1`. It ships as `v2.css` at a parallel
  URL in ConjureOS, with `v1.css` left alive so existing generated apps don't
  regress.

Remember who your consumers are: the shell (which layers overrides on top of your
selectors and depends on their exact specificity), two anchor apps, every exported
project pinned at `latest`, and an unbounded set of AI-generated apps that nobody
will ever update.

<a id="release"></a>
## Release

The canonical runbook is **`ConjureOS/NPM_PACKAGES.md`** — read it before publishing.
Short version, per that document:

1. Bump `version` in `package.json` (npm refuses to republish an existing version).
2. Add a dated `CHANGELOG.md` entry. (`NPM_PACKAGES.md` scopes this step to
   `@conjureos/pack`, written before this package had a changelog worth keeping —
   it does now, and 0.3.1 shipping without an entry is exactly the failure mode.
   Do it here too.)
3. `npm run build`.
4. `npm whoami` / `npm login` if needed.
5. `npm publish --access public --no-provenance` and answer the 2FA OTP prompt.
   (`--no-provenance` is required because the repo is private.)
6. `npm view @conjureos/ui version` to verify.
7. **Commit and push `main` before or with the publish** (see the 0.2.0 incident
   below).
8. Bump the consumer's pin: `"@conjureos/ui": "^0.3.x"` in `ConjureOS/package.json`,
   `npm install`, commit `package.json` + `package-lock.json`.

A publish is **one-way**. npm's unpublish window is 72 hours and breaks consumers; if
a release is wrong, publish a patch forward.

### The CI workflow, and why you shouldn't trust it

`.github/workflows/publish-npm.yml` runs on push to `main`, skips if the version is
already on npm, otherwise builds and `npm publish`es with `NODE_AUTH_TOKEN` from an
`NPM_TOKEN` secret.

`ConjureOS/NPM_PACKAGES.md` describes this workflow as **dormant**: it no-ops when
the version already exists, and would fail at the publish step because the package's
publishing-access setting requires 2FA, which CI cannot answer. Making it real
requires an npm **Automation** token in `NPM_TOKEN` plus setting the package's
publishing access to "2FA *or* automation tokens" (keep account-level 2FA on).

Note a genuine inconsistency in the source material: ConjureOS's `DECISIONS_ARCHIVE.md`
says 0.3.0 was "published by the owner via the repo's auto-publish-on-push-to-main
workflow," while `NPM_PACKAGES.md` says manual publish is the real path and not to
rely on a push to `main`. **Treat manual publish as the path** and verify with
`npm view @conjureos/ui version` afterward either way. Do not assume a merge to
`main` shipped anything.

### Version coupling with ConjureOS

There is no lockstep requirement, but three couplings exist:

1. **ConjureOS pins the package** (`"@conjureos/ui": "^0.3.0"` at the time of
   writing, resolving 0.3.1). A new library version reaches apps only after ConjureOS
   reinstalls and redeploys, because the Vite plugin copies from
   `node_modules` at build time.
2. **The Dev agent's prompt is compiled from your `MODERN_WHIMSY.md`.** Editing that
   file changes AI-generated apps as soon as ConjureOS rebuilds against the new
   version. The V2 prompt additionally *slices* the appendix from the literal string
   `"Key tokens"` up to `"Example, a fully-styled simple counter"`
   (`src/ai/generation/devPromptV2.ts`). **Renaming either of those headings silently
   changes what the agent is taught.** Grep ConjureOS before rewording them.
3. **The served URL is `v1.css`.** As long as you stay additive, the shell keeps
   serving your latest build at that path and old apps benefit. A breaking change
   requires a coordinated ConjureOS change to add a `v2.css` mount.

Anchor-app pins drift and that's tolerated: `conjureos-app-recipes` is on `^0.1.2`
as a devDependency (and vendors a built copy of 0.1.2 in `src/conjureos-ui.css`),
`conjureos-fitness` on `^0.1.1` as a runtime dependency. Both predate the 0.2.0/0.3.0 additions, so those apps simply don't have the
newer variants. Bumping them is a per-app decision.

---

<a id="history-and-known-issues"></a>
## History and known issues

Full detail in [`../CHANGELOG.md`](../CHANGELOG.md); this is the "things that bit
someone" list.

### 0.3.1 (2026-06-24) — the iOS touch-zoom fix

`.cui-input` and `.cui-select` were 14px, with a source comment claiming that
"avoids iOS zoom on focus." **That comment was wrong** — iOS Safari zooms the
viewport on focus for *anything under 16px*. The fix adds, after both base rules:

```css
@media (pointer: coarse) {
  .cui-ui .cui-input,
  .cui-ui .cui-select {
    font-size: 16px;
  }
}
```

Touch only, so desktop keeps its denser 14px. Placed after the base rules so it wins
on source order without `!important`. Pinch-zoom stays available — no
`user-scalable=no`, which would fail WCAG 1.4.4. Both misleading comments were
corrected.

#### Known gap 1 — no 0.3.1 changelog entry

`CHANGELOG.md` has no `## 0.3.1` entry. The fix landed in commit
`9e6f148` and the version bump in `83d4dcc`, but the changelog was never updated.
Worth adding retroactively.

#### Known gap 2 — the committed `MODERN_WHIMSY.md` is stale

`npm run build` was not
run (or its output not committed) with the 0.3.1 fix, and re-running it now produces
a diff:

```diff
-- Select: `cui-select`
+- Select: `cui-select`, `cui-input`
```

Cause: the new `@media (pointer: coarse)` block sits under the `/* ---- Select ---- */`
header, and its selector list starts a line with `.cui-ui .cui-input,` — which the
autogen regex counts as a Select-section primitive. `cui-input` is now listed twice
in the agent's primitive list, once correctly under Input and once wrongly under
Select — and that list is compiled into the AI Dev agent's prompt, so a wrong entry
degrades what the agent generates for every user.

Two candidate fixes, and the obvious one is a trap:

- **Give the media query its own `/* ---- … ---- */` header.** Tempting, but verify
  what it actually produces before you commit. Reproduced against the current
  source: adding `/* ---- Touch sizing ---- */` above the block turns
  ``- Select: `cui-select`, `cui-input` `` into ``- Select: `cui-select` `` **plus a
  new bullet** ``- Touch sizing: `cui-input`, `cui-select` ``. The misattribution is
  gone,
  but the agent's primitive list now advertises a "Touch sizing" primitive that does
  not exist. Net: not a fix, a different wrong line.
- **Make the parser `@media`-aware** (`scripts/build.mjs`, `extractPrimitives()`).
  The regex `^\s*\.cui-ui\s+\.(cui-[\w-]+)` has no idea it is inside an at-rule.
  Strip `@media { … }` bodies from each section before matching (or skip lines whose
  brace depth inside the section is > 0) and the list becomes
  ``- Select: `cui-select` `` with no extra section — the correct output. This is the
  real fix and it is ~5 lines in the build script.

Do it with the next release rather than as a drive-by, and rebuild + commit
`MODERN_WHIMSY.md` in the same change.

### 0.3.0 (2026-06-13) — additive, for the shell's benefit

`cui-field` (+`__label`/`__hint`), `cui-pill--neutral`, `cui-pill--plain`, and seven
tokens (`--cui-accent-hover`, `--cui-accent-pink`, `--cui-brand-gradient`,
`--cui-surface`, `--cui-surface-2`, `--cui-surface-hover`, `--cui-shadow-lg`). This
release exists because the ConjureOS shell was hand-rolling those values; a fan-out
audit produced an explicit "publish boundary" list of what the library had to gain
before the shell could stop mirroring it. Verified adversarially as additions-only.

Four of those tokens (`--cui-accent-hover`, `--cui-accent-pink`,
`--cui-brand-gradient`, `--cui-shadow-lg`) are still **unused by any primitive** —
they exist for consumers.

### 0.2.0 (2026-06-06) — published from an uncommitted tree

The semantic button/pill vocabulary. Also the worst process failure in the package's
history: **0.2.0 was hand-published from an uncommitted working tree and never
committed.** npm had 0.2.0; the repo's `main` was stuck at 0.1.3, literally missing
the button variants the live shell depended on. It was recovered by copying the
published `src/` back out of a consumer's `node_modules` and committing it
(`7ebec60`, "chore: recover published 0.2.0 source into git").

**Lesson, and the reason step 7 exists in the release runbook: commit and push before
you publish.** A published version you cannot reproduce from git is a landmine.

### 0.1.3 (2026-05-25)

Six primitives (`select`, `slider`, `toggle`, `tabs`, `tooltip`, `modal`) and the
`MODERN_WHIMSY.md` autogen block, which exists specifically to end
"did-I-remember-to-update-the-appendix" drift.

### 0.1.2 (2026-05-27) — dated out of order

`MODERN_WHIMSY.md` moved into the library as the canonical style guide, replacing
three drifting summaries. Note the changelog dates 0.1.2 (2026-05-27) *after* 0.1.3
(2026-05-25); the ordering is a known changelog artifact, not a mystery to solve.

### 0.1.1 / 0.1.0 (2026-05-22 →) — Phase 21a

Initial release: tokens, primitives, the two-mode wrapper contract, the build script,
`demo.html`, MIT license.

### Standing defect: focus indicators

Not tied to any one release, and the thing to fix first if you want a
correctness-flavored contribution. Filed as
**[conjureos-ui#4](https://github.com/Jonny-B/conjureos-ui/issues/4)** (open, `bug` /
`accessibility`, pulled into ConjureOS Phase 44 / `ConjureOS#385`), which carries the
acceptance criteria — a `:focus-visible` indicator on every interactive primitive,
meeting WCAG 2.4.11 area *and* contrast, surviving a consumer reset, plus a new token
if the accent can't clear contrast on every surface it sits on. Audited across all of
`src/ui.css`:

- `.cui-button`, `.cui-chip`, `.cui-tab` and `.cui-card--interactive` have **no**
  `:focus` or `:focus-visible` rule. They stay keyboard-visible only because nothing
  happens to set `outline: none` on them — an accident, not a decision, and one that
  any consumer reset erases.
- `.cui-input` (`:268`) and `.cui-select` (`:366`) **do** set `outline: none` and
  replace it with a 1px `border-color` change on `:focus` — a contrast delta that
  will not satisfy WCAG 2.4.11 non-text contrast on its own.
- `.cui-slider` (`:404`) sets `outline: none` and restores a ring only through
  `::-webkit-slider-thumb` (`:430`), so Firefox gets no focus indicator at all.
- `.cui-toggle` (`:488`) is the one primitive that handles this properly.

The consumer-side mitigation and the per-primitive table live in
[components.md → Accessibility status](components.md#accessibility-status); it is
documented there as a package defect, not as a design decision, and the docs should
keep saying so until it is fixed. A fix is a candidate for the next minor: adding a
`:focus-visible` ring is additive for the four primitives that have nothing, but
changing the input/select focus treatment is a visible restyle — and note the
ConjureOS shell already layers its own glow ring on `.cui-ui .cui-input:focus`, so
coordinate before touching that one.

### Other things to know

- **Exported projects pin `"latest"`**, not a semver range (a deliberate ConjureOS
  call). A bad publish therefore reaches first-time installers of every exported
  folder. One more reason releases are one-way and additive.
- **The `/_conjureos/ui/v1.css` link only resolves inside the shell.**
  `@conjureos/pack`'s `unbundle()` strips it on export and substitutes the unpkg CDN
  link. Bundled built-ins in the shell (e.g. Jump Runner) were rewritten to be
  self-contained after the original store version "lost its title, score values and
  button fills" when that link didn't resolve.
- **Shell overrides depend on your selectors' specificity.** ConjureOS layers
  `.cui-ui .cui-button--primary` (gradient) and `.cui-ui .cui-input:focus` (glow ring)
  after the `@import`, relying on equal-specificity source order. Restructuring a
  package selector can silently flip which rule wins.
- **The roadmap** (from the README and the ConjureOS UI project board): light theme,
  animation utility classes, form primitives beyond input, an optional Web Components
  layer.
