# Design token reference

Every CSS custom property defined by `@conjureos/ui` 0.3.1. Source of truth:
[`../src/tokens.css`](../src/tokens.css) (165 lines). **73 tokens**, in four
buckets: color, typography, space/radius/border, motion.

## How the tokens are scoped

They are **not** on `:root`. The declaration block is:

```css
.cui-tokens,
.cui-ui {
  --cui-accent: #7c6af7;
  /* …71 more… */

  /* plus a baseline applied to the wrapper element itself: */
  font-family: var(--cui-font-sans);
  font-size: var(--cui-text-base);   /* 14px */
  line-height: var(--cui-leading-normal);  /* 1.5 */
  color: var(--cui-fg);
  background: var(--cui-bg);
}
```

Two consequences worth internalizing:

1. **A custom property is only readable on the element that declares it or on its
   descendants.** If your wrapper class is on `<body>`, then `:root { --x: var(--cui-accent) }`
   resolves to *nothing* — `html` is the parent of `body`, not a descendant. This
   is a real bug both anchor apps hit; see [usage.md → Gotchas](usage.md#gotchas).
   Redefine your aliases on `.cui-ui` instead, or put the wrapper class on `<html>`
   (which is what the ConjureOS shell does).
2. **Opting in changes your base type.** The wrapper element gets 14px/1.5. If your
   app assumes a 16px base, neutralize it (the shell does exactly that with
   `html.cui-tokens { font-size: 16px; line-height: normal; }`).

---

## 1. Color

### Accent

The purple/blue brand. Six tokens.

| Token | Value | Use |
|---|---|---|
| `--cui-accent` | `#7c6af7` | Primary accent — buttons, focus rings, the dominant brand color |
| `--cui-accent-soft` | `#a5b4fc` | Secondary accent — icons, captions, "big number" displays |
| `--cui-accent-mute` | `rgba(124,106,247,0.18)` | Soft tinted **background** (chip-active, pill backing, ghost-button hover) |
| `--cui-accent-tint` | `rgba(124,106,247,0.28)` | Soft tinted **border** for accent surfaces; also the slider's focus ring |
| `--cui-accent-hover` | `#8e7df8` | The accent one notch lighter, for `:hover` fills. Distinct from `-soft`, which is a lighter *secondary* role. Added 0.3.0 |
| `--cui-accent-pink` | `#c780f7` | Third brand accent (magenta) — a gradient stop, playful flourishes. Added 0.3.0 |

> `--cui-accent-hover` and `--cui-accent-pink` are **not consumed by any primitive**
> in `ui.css` — they exist because the ConjureOS shell needed them tokenized. Both
> are yours to use. Note `--cui-accent-pink` *is* consumed one level up, inside
> `tokens.css` itself, as the third stop of `--cui-brand-gradient`; it is not dead.

### Backgrounds (opaque, layered deepest → highest)

| Token | Value | Use |
|---|---|---|
| `--cui-bg` | `#0b0e14` | Root canvas |
| `--cui-bg-1` | `#11151d` | Primary surface — cards |
| `--cui-bg-2` | `#1a1f2b` | Raised surface — hovered cards, modals, base buttons |
| `--cui-bg-3` | `#232938` | Highest — popovers, selected rows, tooltips, toggle track |

### Translucent "glass" surfaces

Alpha values, so a blurred backdrop or live content shows through. Reach for these
when a panel floats *over* something. Added 0.3.0.

| Token | Value | Use |
|---|---|---|
| `--cui-surface` | `rgba(20,22,30,0.85)` | Primary glass panel |
| `--cui-surface-2` | `rgba(28,30,40,0.75)` | Raised glass panel |
| `--cui-surface-hover` | `rgba(255,255,255,0.06)` | Additive white wash for hover over any surface. Also the fill of `.cui-pill--neutral` |

### Foreground (three text tiers — do not invent a fourth)

| Token | Value | Use |
|---|---|---|
| `--cui-fg` | `#e5e9f0` | Primary text, headings |
| `--cui-fg-mute` | `#9ca3af` | Secondary text, labels, placeholders |
| `--cui-fg-dim` | `#6b7280` | Tertiary text, disabled, input placeholders, field hints |

### Borders

| Token | Value | Use |
|---|---|---|
| `--cui-border` | `rgba(255,255,255,0.08)` | The default hairline. Surfaces define edges by light tinting, not heavy lines |
| `--cui-border-strong` | `rgba(255,255,255,0.16)` | Hover/active edge for interactive surfaces; tooltip border |

### Status colors (pill-weight tints)

Lighter "on dark surface" shades — readable as *text* on a low-alpha fill. Consumed
by the `.cui-pill--*` variants.

| Token | Value |
|---|---|
| `--cui-success` | `#34d399` |
| `--cui-warn` | `#fbbf24` |
| `--cui-error` | `#f87171` |
| `--cui-info` | `var(--cui-accent-soft)` → `#a5b4fc` |

### Semantic button colors (button-weight fills)

Deliberately more saturated than the pill tints above, so a solid fill keeps its
label legible. Added 0.2.0. `--cui-accent` already serves "primary", so there is no
`--cui-primary`.

| Token | Value | Use |
|---|---|---|
| `--cui-secondary` | `#3b4252` | Neutral slate fill |
| `--cui-secondary-hover` | `#474f63` | …its hover |
| `--cui-danger` | `#ef4444` | Destructive red |
| `--cui-danger-hover` | `#dc2626` | …its hover |
| `--cui-warning` | `#f59e0b` | Amber, "are you sure" |
| `--cui-warning-hover` | `#d97706` | …its hover |
| `--cui-info-strong` | `#4a9eff` | Button-weight info blue. Also the second stop of `--cui-brand-gradient`. **Not** referenced by `--cui-accent-gradient`, which hardcodes the same hue as `rgba(74,158,255,0.18)` — overriding this token moves one gradient and not the other |
| `--cui-info-strong-hover` | `#2f8aee` | …its hover |
| `--cui-link` | `var(--cui-accent-soft)` | Link-style button text |
| `--cui-link-hover` | `var(--cui-accent)` | …its hover |

> Note the deliberate split: `--cui-warn` (`#fbbf24`, pill) vs `--cui-warning`
> (`#f59e0b`, button); `--cui-error` (`#f87171`, pill) vs `--cui-danger`
> (`#ef4444`, button); `--cui-info` (soft indigo) vs `--cui-info-strong` (blue).
> These name pairs are one letter apart and mean different weights. Don't
> "consolidate" them.

### Gradients

| Token | Value | Use |
|---|---|---|
| `--cui-accent-gradient` | `linear-gradient(135deg, rgba(124,106,247,0.28), rgba(74,158,255,0.18))` | **Translucent overlay** tint. Layer it over a surface — hero cards, header tiles, icon badges. Used by `.cui-card--hero` |
| `--cui-brand-gradient` | `linear-gradient(120deg, var(--cui-accent) 0%, var(--cui-info-strong) 35%, var(--cui-accent-pink) 70%, var(--cui-accent) 100%)` | **Opaque 4-stop brand sweep.** Animated accent bars, primary-button fills, hero spans. Added 0.3.0; not consumed by any primitive |

The two are easy to confuse. Rule of thumb: `-accent-gradient` sits *on top of*
something and lets it show through; `-brand-gradient` *is* the fill.

---

## 2. Typography

### Font stacks

| Token | Value |
|---|---|
| `--cui-font-sans` | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif` |
| `--cui-font-mono` | `ui-monospace, SFMono-Regular, "JetBrains Mono", Consolas, "Liberation Mono", monospace` |

System fonts only. The package loads no web fonts and makes no network requests.

### Size scale (7 steps)

| Token | Value | Typical use |
|---|---|---|
| `--cui-text-xs` | `11px` | Pills, field hints, tooltips |
| `--cui-text-sm` | `12px` | Secondary text, labels, chips, tabs, subheadings |
| `--cui-text-base` | `14px` | **Body default.** Buttons, inputs, selects |
| `--cui-text-lg` | `16px` | Emphasized body |
| `--cui-text-xl` | `20px` | Section headings |
| `--cui-text-2xl` | `24px` | `.cui-heading` |
| `--cui-text-3xl` | `32px` | "Big number" moments (a counter, a hero metric) — not page headings |

`--cui-text-lg`, `--cui-text-xl` and `--cui-text-3xl` are consumed by **no primitive**
in `ui.css` (the primitives only use `xs`/`sm`/`base`/`2xl`). They are there for your
CSS.

### Weight (4 steps)

| Token | Value | Convention |
|---|---|---|
| `--cui-weight-regular` | `400` | Body |
| `--cui-weight-medium` | `500` | Labels, buttons, tabs, pills |
| `--cui-weight-semibold` | `600` | Headings |
| `--cui-weight-bold` | `700` | "Big number" displays only — avoid elsewhere |

### Leading (3 steps)

| Token | Value | Use |
|---|---|---|
| `--cui-leading-tight` | `1.2` | Headings |
| `--cui-leading-normal` | `1.5` | Body (and the wrapper's baseline) |
| `--cui-leading-loose` | `1.7` | Long-form reading |

---

## 3. Space, radius, border, shadow

### Spacing ladder (9 steps)

Powers of 4. The numeric suffix is the multiple of 4px, so `--cui-space-6` is 24px.
Note the gaps: there is no `-7`, `-9`, `-10`, `-11`.

| Token | Value |
|---|---|
| `--cui-space-0` | `0` |
| `--cui-space-1` | `4px` |
| `--cui-space-2` | `8px` |
| `--cui-space-3` | `12px` |
| `--cui-space-4` | `16px` |
| `--cui-space-5` | `20px` |
| `--cui-space-6` | `24px` |
| `--cui-space-8` | `32px` |
| `--cui-space-12` | `48px` |

Defaults worth knowing: stacks gap at `-3` (12px), `.cui-card` pads at `-4` (16px),
`.cui-modal` pads at `-6` (24px).

### Radius (4 steps)

| Token | Value | Use |
|---|---|---|
| `--cui-radius-sm` | `6px` | Inputs, selects, tooltips |
| `--cui-radius` | `10px` | Default — cards, buttons, panels |
| `--cui-radius-lg` | `14px` | Modals. `.cui-modal` is its **only** consumer — `.cui-card--hero` sets no radius of its own and keeps `.cui-card`'s 10px |
| `--cui-radius-pill` | `999px` | Pills, pill-buttons, chips, tabs, toggle, slider track |

### Border width

| Token | Value |
|---|---|
| `--cui-border-width` | `1px` |

Modern Whimsy does not use thicker borders. If you need more separation, use
background contrast, not a heavier line.

### Shadows (4 tiers)

| Token | Value | Use |
|---|---|---|
| `--cui-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle elevation on small elements |
| `--cui-shadow` | `0 4px 12px rgba(0,0,0,0.4)` | Cards, dropdowns; `.cui-modal` |
| `--cui-shadow-accent` | `0 6px 20px rgba(124,106,247,0.25)` | The signature **colored** hover lift on interactive cards |
| `--cui-shadow-lg` | `0 10px 40px rgba(0,0,0,0.45)` | Large ambient drop for floating popovers/menus/overlay panels. Added 0.3.0; not consumed by any primitive |

---

## 4. Motion

### Durations

| Token | Value | Use |
|---|---|---|
| `--cui-duration-fast` | `120ms` | The button press (`transform`) and the slider thumb's hover/focus. `MODERN_WHIMSY.md` names 120ms the dominant value for hover/focus generally, but in `ui.css` most hovers — chips included — actually transition at `--cui-duration` |
| `--cui-duration` | `180ms` | Background changes, layout shifts — the default in `ui.css` |
| `--cui-duration-slow` | `320ms` | Entrance animations (modal rise) |

### Easings

| Token | Value | Use |
|---|---|---|
| `--cui-ease` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | General-purpose. Default to this |
| `--cui-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Decelerating motion — entrances, lifts |

`MODERN_WHIMSY.md` also names a bouncy curve `cubic-bezier(0.34, 1.56, 0.64, 1)`
for moments that should *land* with character (error banners). It is **not a
token** — it is hand-rolled at its call sites in the ConjureOS shell. If you use it,
you type the literal.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .cui-tokens,
  .cui-ui {
    --cui-duration-fast: 0ms;
    --cui-duration: 0ms;
    --cui-duration-slow: 0ms;
  }
}
```

The media query only reassigns three variables — it touches no `transition` or
`animation` property directly. It works because everything in `ui.css` reads those
variables: every primitive's `transition` does, and so do the modal's two
`animation` shorthands (`cui-modal-backdrop-in var(--cui-duration)` and
`cui-modal-in var(--cui-duration-slow)`). So transitions *and* the modal entrance
both collapse to 0ms.

The corollary: any animation of yours that hardcodes its duration keeps running.
Read the tokens, or check `prefers-reduced-motion` yourself.

---

## Light and dark

**There is only dark.** As of 0.3.1:

- No `@media (prefers-color-scheme: light)` block exists anywhere in the package.
- No `[data-theme]` / `.cui-light` / theme-attribute hook exists.
- The token file header states the position explicitly: *"Dark is the canonical
  theme; light-theme work lives in v2."* The `README.md` Roadmap lists "light theme
  support" as upcoming, tracked on the ConjureOS UI project board.

If you need a light surface today, you can redefine the tokens on a scope inside the
wrapper — but read the limits below **before** you ship it. Most of the library
follows a token override; a specific, enumerable set of rules does not, and two of
them are user-facing enough to sink the attempt.

```css
/* Your app's stylesheet, loaded AFTER ui.css */
@media (prefers-color-scheme: light) {
  .cui-ui {
    --cui-bg: #f7f8fa;
    --cui-bg-1: #ffffff;
    --cui-bg-2: #eef0f4;
    --cui-bg-3: #e3e6ec;
    --cui-fg: #11151d;
    --cui-fg-mute: #4b5563;
    --cui-fg-dim: #9ca3af;
    --cui-border: rgba(0,0,0,0.10);
    --cui-border-strong: rgba(0,0,0,0.20);
    --cui-surface: rgba(255,255,255,0.85);
    --cui-surface-2: rgba(255,255,255,0.75);
    --cui-surface-hover: rgba(0,0,0,0.05);
  }
}
```

**What follows the override:** every background, foreground, and border on cards,
stacks, base buttons, chips, inputs, selects, fields, headings, dividers, the toggle
track, the tabs container, and the tooltip. Also `.cui-button--primary:hover`, which
sets `color: var(--cui-bg)` and therefore tracks your value.

**What does NOT follow the override.** `src/ui.css` hardcodes values in **12 places**,
catalogued in full at
[components.md → Hardcoded values](components.md#hardcoded-values-not-tokenized).
Seven of those are colors; three of the seven break a light theme outright:

| Source | Literal | What you get on a light surface |
|---|---|---|
| `.cui-pill--success/--warn/--error/--danger` (`src/ui.css:212-217`) | 8 literals — `rgba(52,211,153,0.14)` fill + `rgba(52,211,153,0.35)` border, and the equivalents for warn/error/danger | Status pills tuned for a dark card. A 0.14-alpha tint on white is close to invisible, and the text colors (`--cui-success` `#34d399`, `--cui-warn` `#fbbf24`) are low-contrast on white |
| `.cui-tab--active` (`:522-527`) | `linear-gradient(135deg, rgba(124,106,247,0.55), rgba(74,158,255,0.4))`, `box-shadow: 0 4px 12px rgba(124,106,247,0.25)`, `color: white` | A saturated purple/blue pill with a white label sitting in a light tab bar. Legible, but off-palette and visually louder than everything around it |
| `.cui-modal-backdrop` (`:569`) | `rgba(0, 0, 0, 0.6)` + `blur(4px)` | A 60%-black scrim over light chrome — correct for dark, heavy-handed for light |

Four more will not follow it either, though they degrade gracefully rather than
break: `color: white` on `--primary`/`--danger`/`--info` buttons (`:106,148,153,169,174`),
`color: #1a1206` on `--warning` (`:159`), `background: white` on the checked toggle
thumb (`:485`), and the `.cui-select` chevron, whose stroke `#9ca3af` is baked into a
data-URI SVG (`:368`) and cannot read a `var()`. The remaining literals in that table
are geometry and z-index, not color, and are theme-neutral.

**So:** backgrounds, foregrounds and borders follow; **status pills, the active tab,
and the modal scrim do not.** If you go ahead anyway, plan on hand-overriding those
three yourself. A real light theme is a package change (v2), not an app-side hack.
