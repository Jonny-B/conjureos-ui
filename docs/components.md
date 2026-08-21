# Primitive class reference

Every `cui-*` class shipped by `@conjureos/ui` 0.3.1. Source of truth:
[`../src/ui.css`](../src/ui.css) (601 lines).

**Everything on this page requires an ancestor with `class="cui-ui"`.** Every rule
is written as `.cui-ui .cui-thing { … }`. `class="cui-tokens"` gives you variables
only — the classes below will do nothing under it.

> **The wrapper class and a primitive class can never sit on the same element.**
> Every rule in `src/ui.css` uses the descendant combinator — there is not a single
> `.cui-ui.cui-thing` (no-space) rule in the file. So
> `<body class="cui-ui cui-stack-v">` applies **no stack**, and
> `<div class="cui-ui cui-card">` renders **no card**: the element carrying `.cui-ui`
> is never its own descendant. Put the wrapper on `<html>` or `<body>`, the
> primitives on elements inside it. This is the most common way an adoption on a
> sub-tree goes silently wrong.

To see them rendered, open [`../demo.html`](../demo.html) in a browser — but note
that page has not been updated since 0.1.3, so it has **no** examples of the 0.2.0
semantic button/pill variants or the 0.3.0 `cui-field` family. This page is the
complete list; the demo is not.

## The whole surface at a glance

| Group | Classes |
|---|---|
| Layout helpers | `cui-stack-v`, `cui-stack-h`, `cui-stack-h--between` |
| Card | `cui-card`, `cui-card--interactive`, `cui-card--hero` |
| Button | `cui-button`, `cui-button--primary`, `cui-button--ghost`, `cui-button--pill`, `cui-button--secondary`, `cui-button--danger`, `cui-button--warning`, `cui-button--info`, `cui-button--link` |
| Pill (status/tag) | `cui-pill`, `cui-pill--success`, `cui-pill--warn`, `cui-pill--error`, `cui-pill--danger`, `cui-pill--info`, `cui-pill--neutral`, `cui-pill--plain` |
| Chip (interactive tag) | `cui-chip`, `cui-chip--active` |
| Input | `cui-input`, `cui-label` |
| Field | `cui-field`, `cui-field__label`, `cui-field__hint` |
| Heading | `cui-heading`, `cui-subheading` |
| Divider | `cui-divider` |
| Muted helper text | `cui-muted`, `cui-dim` |
| Select | `cui-select` |
| Slider | `cui-slider` |
| Toggle | `cui-toggle`, `cui-toggle__track` |
| Tabs | `cui-tabs`, `cui-tab`, `cui-tab--active` |
| Tooltip | `cui-tooltip` (+ a `data-tooltip` attribute) |
| Modal | `cui-modal-backdrop`, `cui-modal` |

Plus two keyframe names in the global namespace: `cui-modal-backdrop-in` and
`cui-modal-in`.

Naming: `cui-block`, `cui-block--modifier` (BEM-ish double dash),
`cui-block__element` (double underscore). The prefix is `cui-` and not
`conjureos-` because the shell already owns `.conjureos-*` — this guarantees zero
collision if an app inspects the parent frame.

---

## Layout helpers

### `cui-stack-v`

A vertical flex column with a 12px gap.

```css
display: flex; flex-direction: column; gap: var(--cui-space-3);
```

### `cui-stack-h`

A horizontal flex row, vertically centered, 12px gap.

```css
display: flex; flex-direction: row; align-items: center; gap: var(--cui-space-3);
```

### `cui-stack-h--between`

Modifier: adds `justify-content: space-between`. Works on `cui-stack-h`, but it is
just one declaration — it also composes onto `cui-stack-v` if you want that.

```html
<div class="cui-stack-v">
  <div class="cui-stack-h cui-stack-h--between">
    <span class="cui-muted">Total</span>
    <strong>42</strong>
  </div>
  <hr class="cui-divider" />
  <div class="cui-stack-h">
    <span class="cui-pill">New</span>
    <span class="cui-pill cui-pill--success">Synced</span>
  </div>
</div>
```

These are deliberately the only layout classes. There is no grid helper, no spacing
utility scale, no `cui-p-4`. For anything else, write CSS using the space tokens.

---

## Card

### `cui-card`

The boxed surface. `--cui-bg-1` fill, hairline border, 10px radius, 16px padding,
and a transition on border-color / background / transform / box-shadow so the
modifiers below can animate.

### `cui-card--interactive`

Adds `cursor: pointer` and, on hover: stronger border, `--cui-bg-2` fill,
`translateY(-1px)`, and the accent-tinted shadow. This is the signature "lift."

### `cui-card--hero`

Layers `--cui-accent-gradient` over `--cui-bg-1` and switches the border to
`--cui-accent-tint`. Use for the one card on a screen that should read as the
headline.

```html
<div class="cui-card cui-card--hero cui-stack-v">
  <h2 class="cui-heading">Welcome back</h2>
  <p class="cui-subheading">3 apps installed</p>
</div>

<div class="cui-card cui-card--interactive" tabindex="0">
  <strong>Recipes</strong>
  <p class="cui-muted">Tap to open</p>
</div>
```

> `cui-card--interactive` styles hover only. It adds no focus ring and no keyboard
> behavior. If the card is genuinely clickable, make it a `<button>` or add
> `tabindex` + a key handler + your own `:focus-visible` style.

---

## Button

### `cui-button` (base)

`inline-flex`, centered, 8px gap between icon and label, 8px/16px padding,
`--cui-bg-2` fill, hairline border, 10px radius, 14px medium weight, `line-height: 1`.

States built in:

| State | Effect |
|---|---|
| `:hover` | fill → `--cui-bg-3`, border → `--cui-border-strong` |
| `:active` | `translateY(1px)` (a press) |
| `:disabled` | `opacity: 0.5`, `cursor: not-allowed`, no transform |

The `:disabled` rule only matches real disabled form controls. On an `<a>` styled as
a button it does nothing.

### Variants

All variants are **fills** except `--ghost`, `--link`, and `--pill` (a shape).
Every one of them composes with `--pill`.

| Class | Fill | Label | Hover |
|---|---|---|---|
| `cui-button--primary` | `--cui-accent` | `white` | fill → `--cui-accent-soft`, label → `--cui-bg` |
| `cui-button--secondary` | `--cui-secondary` | `--cui-fg` | `--cui-secondary-hover` |
| `cui-button--danger` | `--cui-danger` | `white` | `--cui-danger-hover` |
| `cui-button--warning` | `--cui-warning` | `#1a1206` (dark, for contrast on amber) | `--cui-warning-hover` |
| `cui-button--info` | `--cui-info-strong` | `white` | `--cui-info-strong-hover` |
| `cui-button--ghost` | transparent, transparent border | inherited `--cui-fg` | fill → `--cui-accent-mute` |
| `cui-button--link` | transparent, 4px side padding | `--cui-link` | `--cui-link-hover` + `text-decoration: underline` |
| `cui-button--pill` | *(shape only)* radius → 999px, padding → 8px/20px | — | — |

```html
<div class="cui-stack-h">
  <button class="cui-button">Default</button>
  <button class="cui-button cui-button--primary">Primary</button>
  <button class="cui-button cui-button--secondary">Secondary</button>
  <button class="cui-button cui-button--danger">Delete</button>
  <button class="cui-button cui-button--warning">Are you sure?</button>
  <button class="cui-button cui-button--info">Details</button>
  <button class="cui-button cui-button--ghost">Cancel</button>
  <button class="cui-button cui-button--link">Learn more</button>
  <button class="cui-button cui-button--primary cui-button--pill">Save</button>
  <button class="cui-button" disabled>Disabled</button>
</div>
```

Intent guide (from `MODERN_WHIMSY.md`): `primary` for the one main action,
`secondary` for the quiet alternative beside it, `danger` for destructive,
`warning` for "are you sure", `info` for neutral-positive, `ghost` for
cancel/dismiss, `link` for inline navigation that still needs button semantics.

> **No focus ring.** `cui-button` defines no `:focus` or `:focus-visible` style, so
> keyboard users get the browser default outline (which some resets kill). If you
> care about keyboard accessibility, add your own:
> `.cui-ui .cui-button:focus-visible { box-shadow: 0 0 0 3px var(--cui-accent-tint); }`

---

## Pill (status / tag)

### `cui-pill`

A small non-interactive status label: `inline-flex`, 2px/12px padding, accent-mute
fill, accent-tint border, 999px radius, `--cui-accent-soft` text, 11px medium,
**uppercase with 0.04em letter-spacing**.

### Variants

| Class | Fill | Border | Text |
|---|---|---|---|
| *(base)* | `--cui-accent-mute` | `--cui-accent-tint` | `--cui-accent-soft` |
| `cui-pill--success` | `rgba(52,211,153,0.14)` | `rgba(52,211,153,0.35)` | `--cui-success` |
| `cui-pill--warn` | `rgba(251,191,36,0.14)` | `rgba(251,191,36,0.35)` | `--cui-warn` |
| `cui-pill--error` | `rgba(248,113,113,0.14)` | `rgba(248,113,113,0.35)` | `--cui-error` |
| `cui-pill--danger` | `rgba(239,68,68,0.14)` | `rgba(239,68,68,0.4)` | `--cui-error` |
| `cui-pill--info` | `--cui-accent-mute` | `--cui-accent-tint` | `--cui-info` |
| `cui-pill--neutral` | `--cui-surface-hover` | `--cui-border` | `--cui-fg-mute` |
| `cui-pill--plain` | *(no color change)* | — | — |

Two notes on the near-duplicates:

- `--danger` is a **naming-parity alias** of `--error` (so the pill vocabulary
  matches the button vocabulary). Its fill/border are the slightly stronger
  `#ef4444`-based tints; its text is still `--cui-error`. Either is fine.
- `--info` renders identically to the base pill today (both use accent-mute /
  accent-tint, and `--cui-info` *is* `--cui-accent-soft`). It exists to round out
  the semantic set and to give you a stable name if the info hue diverges later.

`cui-pill--plain` is a **behavior** modifier, not a color one: it drops
`text-transform: uppercase` and the letter-spacing and switches to
`font-variant-numeric: tabular-nums`. Use it whenever the content is mixed-case or
numeric ("v3 -> v4", "1,204 rows"). It composes with `--neutral` (that pairing is
the intended one for quiet metadata).

```html
<span class="cui-pill">New</span>
<span class="cui-pill cui-pill--success">Synced</span>
<span class="cui-pill cui-pill--warn">Stale</span>
<span class="cui-pill cui-pill--error">Failed</span>
<span class="cui-pill cui-pill--danger">Destructive</span>
<span class="cui-pill cui-pill--info">Info</span>
<span class="cui-pill cui-pill--neutral">Advanced</span>
<span class="cui-pill cui-pill--neutral cui-pill--plain">v3 -&gt; v4</span>
```

---

## Chip (interactive tag)

`cui-chip` is the clickable cousin of the pill: 4px/12px padding, `--cui-bg-2`
fill, hairline border, 999px radius, 12px muted text, `cursor: pointer`, and a
hover that brightens fill + text. `cui-chip--active` switches it to the accent
tint (accent-mute fill, accent-tint border, accent-soft text).

Use for filter selections and toggleable tags. Unlike the pill it is **not**
uppercased.

```html
<div class="cui-stack-h">
  <button class="cui-chip cui-chip--active">All</button>
  <button class="cui-chip">Breakfast</button>
  <button class="cui-chip">Dinner</button>
</div>
```

Render it as a `<button>` (or add `role`/`tabindex`) — the class supplies looks, not
semantics, and defines no focus style.

---

## Input

### `cui-input`

A full-width block form control: 8px/12px padding, `--cui-bg` fill, hairline
border, 6px radius, `--cui-fg` text, `font-family: inherit`, **14px on desktop but
16px under `@media (pointer: coarse)`** (the iOS focus-zoom guard — read
[usage.md gotcha 7](usage.md#gotchas) before overriding `font-size`),
`outline: none`, with a border-color transition. `:focus` turns the border `--cui-accent`.
`::placeholder` is `--cui-fg-dim`.

Because it is `display: block; width: 100%`, drop it in a stack rather than trying
to inline it.

Works on `<input>` of any text-ish type and on `<textarea>`.

### `cui-label`

A **wrapper**, not a text style: a flex column with a 4px gap, 12px muted text.
Wrap a label and its control in it.

```html
<label class="cui-label">
  Name
  <input class="cui-input" placeholder="Ada" />
</label>
```

> **Known defect:** `outline: none` (`src/ui.css:268`) removes the browser's focus
> indicator and replaces it with a 1px border-color change. That is very likely
> below the 3:1 non-text contrast WCAG 2.4.11 asks for, and it is the package's
> problem, not yours. Until it is fixed, put the ring back — the ConjureOS shell
> does exactly this:
> `.cui-ui .cui-input:focus { box-shadow: 0 0 0 3px var(--cui-accent-tint); }`.
> See [Accessibility status](#accessibility-status).

---

## Field (labeled control with a hint)

Added 0.3.0. `cui-label` is label-plus-control only; `cui-field` is what real forms
want, because it has a hint slot.

- `cui-field` — flex column, 4px gap.
- `cui-field__label` — 12px, medium weight, **full-strength `--cui-fg`** (brighter
  than `cui-label`'s muted text).
- `cui-field__hint` — 11px, `--cui-fg-dim`, 1.5 leading.

Order matters only for how it reads; the CSS does not care. The canonical order
(from the source comment) is label, hint, control:

```html
<label class="cui-field">
  <span class="cui-field__label">Display name</span>
  <span class="cui-field__hint">Shown on the card</span>
  <input class="cui-input" />
</label>

<label class="cui-field">
  <span class="cui-field__label">Visibility</span>
  <select class="cui-select">
    <option>Private</option>
    <option>Unlisted</option>
  </select>
</label>
```

---

## Select

`cui-select` styles a native `<select>`: `appearance: none` (and `-webkit-`), full
width, 8px/12px padding with extra right padding for the chevron, `--cui-bg` fill,
6px radius, **14px on desktop but 16px under `@media (pointer: coarse)`** (same
iOS focus-zoom guard as `cui-input`), accent border on `:focus`, `opacity: 0.5` +
not-allowed on `:disabled`.

The chevron is an inline `data:image/svg+xml` background image, positioned right
with a `no-repeat`, stroked in `#9ca3af`.

```html
<select class="cui-select">
  <option>Newest</option>
  <option>Oldest</option>
</select>
```

> **Gotcha (learned the hard way in the ConjureOS shell, fixed at shell 0.8.6):**
> if you override the select's background, use the `background-color` **longhand**.
> The `background` shorthand resets `background-image: none`, which erases the
> chevron. Same applies to any `:focus` override you write.

The `<option>` list itself is rendered by the OS and cannot be styled by this
package.

---

## Slider

`cui-slider` styles a native `<input type="range">`: full width, 4px track in
`--cui-bg-2` with a pill radius, `appearance: none`.

Thumb: 16px circle, `--cui-accent` fill, 2px `--cui-fg` border, pill radius.
Implemented twice — `::-webkit-slider-thumb` and `::-moz-range-thumb` — because the
pseudo-elements cannot be combined in one selector list.

Interaction (WebKit/Blink only, since the two hooks are `-webkit-`):
`:hover` scales the thumb to 1.1; `:focus` gives it a `0 0 0 4px var(--cui-accent-tint)`
ring. Firefox gets the static thumb — a known, accepted asymmetry.

```html
<input class="cui-slider" type="range" min="0" max="100" value="60" />
```

---

## Toggle

A checkbox rendered as an on/off switch. Three parts, and the **markup order is
load-bearing** — the checked rules use the adjacent-sibling combinator
`input:checked + .cui-toggle__track`, so the `<input>` must come immediately before
the track element.

- `cui-toggle` — the wrapper `<label>`: inline-flex, 8px gap, pointer cursor, 12px
  muted text.
- `.cui-toggle input` (element selector, no class needed) — visually hidden but
  focusable: absolutely positioned, `opacity: 0`, 1x1px, `pointer-events: none`.
- `cui-toggle__track` — 36x20 pill, `--cui-bg-3` fill, hairline border, with a
  16px `::after` thumb in `--cui-fg`.

Checked: track fills `--cui-accent`, thumb slides `translateX(16px)` and turns
`white`. `input:focus-visible` puts a 2px accent-tint ring on the track.

```html
<label class="cui-toggle">
  <input type="checkbox" checked />
  <span class="cui-toggle__track"></span>
  Enable sync
</label>
```

Put the visible text after the track (as above) or anywhere else in the label — only
the input→track adjacency matters.

---

## Tabs

A pill-shaped segmented control.

- `cui-tabs` — the container: inline-flex, 4px gap, `--cui-bg-2` fill, hairline
  border, pill radius, 3px padding.
- `cui-tab` — a button inside it: 8px/16px padding, transparent, pill radius, 12px
  medium muted text; `:hover` brightens the text.
- `cui-tab--active` — backs it with the signature
  `linear-gradient(135deg, rgba(124,106,247,0.55), rgba(74,158,255,0.4))`, white
  text, and a `0 4px 12px rgba(124,106,247,0.25)` glow. (These are literals in the
  source, not tokens — see below.)
- `cui-tab--active:hover` — a fourth rule you don't write but should know about
  (`src/ui.css:529-531`): it re-pins the label to `white` so the base
  `.cui-tab:hover` (which sets `color: var(--cui-fg)`) can't dim the active tab.
  Your own `.cui-tab:hover` override will collide with it.

```html
<div class="cui-tabs" role="tablist">
  <button class="cui-tab cui-tab--active" role="tab" aria-selected="true">Recent</button>
  <button class="cui-tab" role="tab" aria-selected="false">All</button>
  <button class="cui-tab" role="tab" aria-selected="false">Archived</button>
</div>
```

You supply the ARIA and the click handling; the classes are purely visual.

---

## Tooltip

Pure CSS, no JavaScript. Put `cui-tooltip` on a wrapper *and* give it a
`data-tooltip="…"` attribute — the selector is `.cui-tooltip[data-tooltip]`, so
without the attribute nothing renders.

The tip is a `::after` pseudo-element with `content: attr(data-tooltip)`, positioned
above the wrapper (`bottom: calc(100% + 6px)`, centered), `--cui-bg-3` fill, strong
border, 6px radius, 11px text, `white-space: nowrap`, `z-index: 10`. It fades in on
`:hover` **and** `:focus-within`.

```html
<span class="cui-tooltip" data-tooltip="Runs the sync now">
  <button class="cui-button">Sync</button>
</span>
```

Limitations, all by design: top position only (no `--bottom`/`--left`/`--right`
variants), single line (`nowrap`, so long text overflows the viewport), and it
clips inside any ancestor with `overflow: hidden`. It is also invisible to screen
readers — add `aria-label` or `title` if the text carries meaning.

---

## Modal

Two classes plus two keyframes.

- `cui-modal-backdrop` — `position: fixed; inset: 0`, `rgba(0,0,0,0.6)` with a 4px
  `backdrop-filter: blur(4px)` (and the `-webkit-` prefix), flex-centered, 16px
  padding, `z-index: 1000`, animated in with `cui-modal-backdrop-in`.
- `cui-modal` — the card: `--cui-bg-2` fill, hairline border, 14px radius, 24px
  padding, `max-width: 480px`, `width: 100%`, `max-height: calc(100vh - 64px)`,
  `overflow-y: auto`, `--cui-shadow`, animated in with `cui-modal-in`
  (opacity + 8px rise).

```html
<div class="cui-modal-backdrop">
  <div class="cui-modal cui-stack-v" role="dialog" aria-modal="true" aria-label="Delete app">
    <h2 class="cui-heading">Delete app?</h2>
    <p class="cui-muted">This removes it and its files. You can reinstall later.</p>
    <div class="cui-stack-h cui-stack-h--between">
      <button class="cui-button cui-button--ghost">Cancel</button>
      <button class="cui-button cui-button--danger">Delete</button>
    </div>
  </div>
</div>
```

Behavior is entirely yours: mount/unmount, Escape to close, click-outside, focus
trap, `aria-modal`, restoring focus on close. The classes only paint.

> The ConjureOS shell **does not use `cui-modal`** — it keeps its own modal system
> (no backdrop blur, `height: 100svh` for an iOS bug, an opaque flex-column card
> that pins the action footer). Recorded as a deliberate deferral in ConjureOS
> `DECISIONS_ARCHIVE.md`. On iOS, `backdrop-filter` over a scrolling page has been
> a repeated source of trouble; test before you lean on it.

---

## Typography and divider helpers

| Class | What it does |
|---|---|
| `cui-heading` | `margin: 0`, 24px, semibold, 1.2 leading, `--cui-fg`. Put it on your real heading tag (`<h1>`/`<h2>`) — it carries no semantics itself |
| `cui-subheading` | `margin: 0`, 12px, `--cui-fg-mute` |
| `cui-muted` | `color: var(--cui-fg-mute)` — nothing else |
| `cui-dim` | `color: var(--cui-fg-dim)` — nothing else |
| `cui-divider` | 1px `--cui-border` bar, 12px vertical margin, `border: 0`. Designed for `<hr>` but works on a `<div>` |

```html
<h1 class="cui-heading">Recipes</h1>
<p class="cui-subheading">128 saved</p>
<hr class="cui-divider" />
<p class="cui-muted">Secondary text.</p>
<p class="cui-dim">Tertiary text.</p>
```

There is **no** `cui-text-lg`-style size utility, no `cui-mono`, no `cui-bold`.
Reach for the tokens in your own CSS instead.

---

## Hardcoded values (not tokenized)

Places where `ui.css` writes a literal instead of a token. Useful to know when you
retheme, and a checklist for anyone extending the package:

Twelve places in `src/ui.css`. **Seven are colors** (marked ●) and will not follow a
token override — that is the constraint behind
[tokens.md → Light and dark](tokens.md#light-and-dark). The other five are geometry
or z-index and are theme-neutral.

| | Where (`src/ui.css`) | Literal | Why |
|---|---|---|---|
| ● | `.cui-button--primary`, `--danger`, `--info` (`:106,148,153,169,174`) | `color: white` | White label on a saturated fill |
| ● | `.cui-button--warning` (`:159`) | `color: #1a1206` | Dark label for contrast on amber |
| ● | `.cui-pill--success/--warn/--error/--danger` (`:212-217`) | 8 literals: `rgba(...)` fills **and** borders derived from the status hexes | No alpha-of-token mechanism in plain CSS |
| ● | `.cui-select` chevron (`:368`) | data-URI SVG stroked `%239ca3af` | Can't put a `var()` inside a `url()` data URI |
| | `.cui-slider` thumb (`:408-427`) | `16px`, `2px` border | Fixed control geometry |
| | `.cui-toggle__track` (`:453-486`) | `36px` x `20px`, `16px` thumb, `translateX(16px)` | Fixed control geometry |
| ● | `.cui-toggle input:checked + .cui-toggle__track::after` (`:485`) | `background: white` | Contrast on the accent fill |
| ● | `.cui-tab--active` (`:522-527`) | `linear-gradient(135deg, rgba(124,106,247,0.55), rgba(74,158,255,0.4))`, `box-shadow: 0 4px 12px rgba(124,106,247,0.25)`, `color: white` | The active-state gradient is not a token; `--cui-accent-gradient` is a different (weaker) mix |
| ● | `.cui-modal-backdrop` (`:569`) | `rgba(0,0,0,0.6)` (plus `blur(4px)`, `z-index: 1000`) | — |
| | `.cui-tooltip::after` (`:546-556`) | `4px 10px` padding, `6px` offset, `z-index: 10` | — |
| | `.cui-modal` (`:585-587`) | `max-width: 480px`, `calc(100vh - 64px)` | — |
| | `@media (pointer: coarse)` (`:388-393`) | `font-size: 16px` | The iOS zoom threshold is literally 16px; a token would invite someone to change it |

## Accessibility status

Not a non-goal — a **known defect of the package**, recorded here so consumers can
compensate and so nobody documents it as intentional. Audited against every
`:focus` / `:focus-visible` / `outline` occurrence in `src/ui.css`.

Of the eight interactive primitives:

| Primitive | Focus indicator | Verdict |
|---|---|---|
| `cui-input` | `:focus` → `border-color: var(--cui-accent)` only, **after** `outline: none` (`:268`, `:272`) | **Defect.** A 1px border-color shift replacing the UA outline; unlikely to meet WCAG 2.4.11 (3:1 non-text contrast) |
| `cui-select` | Same pattern (`:366`, `:374`) | **Defect.** Same reasoning |
| `cui-slider` | `outline: none` (`:404`), then `:focus::-webkit-slider-thumb` → `0 0 0 4px var(--cui-accent-tint)` (`:430`) | **Partial.** A real ring in WebKit/Blink. In Firefox the `-webkit-` hook never matches, so the outline is suppressed and nothing replaces it |
| `cui-toggle` | `input:focus-visible + .cui-toggle__track` → 2px accent-tint ring (`:488`) | **OK.** The genuinely well-handled one |
| `cui-button` | none | **Missing.** Keyboard visibility survives only because nothing sets `outline: none` on it — i.e. by accident, and any consumer reset kills it |
| `cui-chip` | none | **Missing.** Same accident. The examples on this page render it as a `<button>` |
| `cui-tab` | none | **Missing.** Same |
| `cui-card--interactive` | none | **Missing.** Also has no keyboard activation at all |

`cui-tooltip` is a separate case: `:focus-within` reveals the tip (`:560`), which is
good, but the tip is a `::after` with no accessible name, so screen readers never
get it. Add `aria-label` / `title` yourself.

Until the package fixes this, the safe consumer mitigation is one rule:

```css
/* your stylesheet, loaded after ui.css */
.cui-ui .cui-button:focus-visible,
.cui-ui .cui-chip:focus-visible,
.cui-ui .cui-tab:focus-visible,
.cui-ui .cui-card--interactive:focus-visible,
.cui-ui .cui-input:focus-visible,
.cui-ui .cui-select:focus-visible {
  box-shadow: 0 0 0 3px var(--cui-accent-tint);
  outline: 2px solid transparent;  /* keeps a visible ring in forced-colors mode */
  outline-offset: 2px;
}
```

Nothing else about accessibility is handled either: the classes carry no ARIA, no
roles, no keyboard handlers, no focus trap on `cui-modal`, no `prefers-contrast`
support. Those are legitimately the consumer's job; the focus indicators are not.

## Deliberate non-goals

Things people look for and won't find in 0.3.1, so you can stop searching. (Focus
rings are **not** in this list — see [Accessibility status](#accessibility-status).)

- No table, list, avatar, badge-with-count, breadcrumb, accordion, dropdown menu,
  popover, toast, spinner, skeleton, or progress bar.
- No textarea-specific class (use `cui-input`), no checkbox/radio class (use
  `cui-toggle` or native), no button-group.
- No spacing/color utility classes.
- No animation utility classes (the README roadmap lists them as future work).
- No JS, no Web Components (also roadmap), no React bindings.
