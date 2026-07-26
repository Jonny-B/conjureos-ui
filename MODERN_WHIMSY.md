# Mystical Fall

The design language of ConjureOS, packaged as `@conjureos/ui`.

This doc is the single source of truth for what Mystical Fall is, what it looks like, and how to apply it. The human-readable sections come first; an agent-ready appendix lives at the bottom and is inline-imported by the ConjureOS Dev agent's system prompt.

## The brief

Mystical Fall is dark, accent-led, and lightly playful — a warm autumn palette with mystic purple at its heart, deliberately steering clear of the generic indigo-500 gradient that reads as AI-generated. The signature is a mystic-purple accent (`#7d4bb3`) that spills into a wine → ember → gold arc on hero surfaces, pill-shaped affordances on active states, translucent surfaces sitting on hairline borders, and 120ms lifts on hover. Backgrounds are a warm aubergine near-black (a purple undertone, not blue-black); text is a warm parchment-white. It avoids heavy chrome (no thick borders, no drop shadows on every card), favors generous radii (10px default, 999px for pills), and reserves personality for the moments that warrant it (a wand glyph instead of a warning triangle on error banners; gentle bounce-in entrances on empty states). It is a dark theme by canon; light theme is deferred to v2.

## Palette

All colors are exposed as CSS custom properties on `.cui-tokens` and `.cui-ui` (see [src/tokens.css](src/tokens.css)). Reach for the token, not the literal.

### Accent

The brand color and its supporting tints.

| Token | Value | Use |
| --- | --- | --- |
| `--cui-accent` | `#7d4bb3` | Primary buttons, focus rings, the dominant brand color (mystic purple) |
| `--cui-accent-soft` | `#c9a6ec` | Icons, captions, "big number" displays, secondary highlights (light lavender) |
| `--cui-accent-mute` | `rgba(125,75,179,0.18)` | Soft tinted backgrounds (chip-active, pill backing, hover wash) |
| `--cui-accent-tint` | `rgba(125,75,179,0.30)` | Soft tinted borders for accent surfaces |
| `--cui-accent-pink` | `#a83d63` | Third accent (Spellbound berry) — gradient stop, playful flourishes |
| `--cui-accent-gradient` | `linear-gradient(135deg, rgba(125,75,179,0.30), rgba(200,104,0,0.16))` | The signature mystic → ember wash on hero surfaces and hero cards |
| `--cui-brand-gradient` | `linear-gradient(120deg, #552e75, #83224c, #c86800, #d8a155)` | Full autumn arc (Mystic → Spellbound → Phoenix → Wandgold) for accent bars and primary fills |

### Surfaces

Layered dark backgrounds, deepest to highest. Warm aubergine near-black.

| Token | Value | Use |
| --- | --- | --- |
| `--cui-bg` | `#130f19` | Root canvas; behind everything |
| `--cui-bg-1` | `#1c1626` | Primary card surface |
| `--cui-bg-2` | `#251d31` | Raised surface (hovered cards, modals) |
| `--cui-bg-3` | `#30243f` | Highest tier (popovers, selected rows) |

### Foreground

Three text tiers. Don't introduce a fourth. Warm parchment-white.

| Token | Value | Use |
| --- | --- | --- |
| `--cui-fg` | `#ece5dd` | Body text, headings |
| `--cui-fg-mute` | `#a99f97` | Secondary text, placeholders, labels |
| `--cui-fg-dim` | `#786f68` | Tertiary text, disabled states |

### Borders

| Token | Value | Use |
| --- | --- | --- |
| `--cui-border` | `rgba(216,177,136,0.10)` | The default parchment-tinted hairline. Surfaces define edges by light tinting, not heavy lines. |
| `--cui-border-strong` | `rgba(216,177,136,0.20)` | Hover/active state for interactive surfaces |

### Status

For pills, level chips, and error banners. Pair the color with `cui-pill--*` variants.

| Token | Value |
| --- | --- |
| `--cui-success` | `#4fb477` |
| `--cui-warn` | `#d8a155` |
| `--cui-error` | `#e0555f` |
| `--cui-info` | `var(--cui-accent-soft)` |

## Type

System fonts; no web fonts. The library defines two stacks: `--cui-font-sans` (Apple/Segoe/system UI fallback chain) and `--cui-font-mono` (SF Mono / JetBrains Mono / Consolas).

### Size scale

Seven steps, 11px through 32px. Bias toward 14px (base) for body and 12px (`text-sm`) for secondary text. The 32px `text-3xl` is for "big number" moments (a counter value, a hero metric) not page headings.

| Token | Value |
| --- | --- |
| `--cui-text-xs` | `11px` |
| `--cui-text-sm` | `12px` |
| `--cui-text-base` | `14px` |
| `--cui-text-lg` | `16px` |
| `--cui-text-xl` | `20px` |
| `--cui-text-2xl` | `24px` |
| `--cui-text-3xl` | `32px` |

### Weight

Four weights: 400 / 500 / 600 / 700. Body is 400, labels and buttons are 500, headings are 600, "big number" displays are 700. Avoid 700 anywhere else.

### Leading

`--cui-leading-tight` (1.2) for headings, `--cui-leading-normal` (1.5) for body, `--cui-leading-loose` (1.7) for long-form reading.

### Recurring type idioms

**Uppercased label with letter-spacing.** A signature treatment for small structural labels. Examples in the shell:

- Home chat lane prefix (`try:` / `do:` / `build:` / `edit:`): `text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600`. Source: [.conjureos-wm-prompt-slideshow-prefix in src/shell/ui/app.css:1084](../ConjureOS/src/shell/ui/app.css).
- Settings section headers: `text-transform: uppercase; letter-spacing: 0.04em`. Source: [src/shell/ui/app.css:3805](../ConjureOS/src/shell/ui/app.css).
- Console level chips: `text-transform: uppercase; letter-spacing: 0.06em`.

Use this when you need a label to *announce itself as structure* rather than as content. A button doesn't need it; a section divider does.

**Slight tightening on headings.** `letter-spacing: -0.01em` on h2-class headings (see [.conjureos-launcher-header h2 in src/shell/ui/app.css:3671](../ConjureOS/src/shell/ui/app.css)). Keeps display text from feeling spread thin.

## Space, radius, border

### Spacing ladder

Powers of 4 with named intermediates.

`--cui-space-0` (0) / `-1` (4px) / `-2` (8px) / `-3` (12px) / `-4` (16px) / `-5` (20px) / `-6` (24px) / `-8` (32px) / `-12` (48px).

Default `gap` on `cui-stack-v` and `cui-stack-h` is `--cui-space-3` (12px). Default `padding` on `cui-card` is `--cui-space-4` (16px). Reach for the named token, not a literal pixel value.

### Radius

Three steps plus pill.

| Token | Value | Use |
| --- | --- | --- |
| `--cui-radius-sm` | `6px` | Inputs, small chips, tightly-grouped controls |
| `--cui-radius` | `10px` | Default for cards, buttons, panels |
| `--cui-radius-lg` | `14px` | Hero cards, larger modal surfaces |
| `--cui-radius-pill` | `999px` | Pills, pill-buttons, chip filters |

### Border

`--cui-border-width: 1px`. Mystical Fall doesn't use thicker borders. If you need more separation, use background contrast or a soft inner shadow, not a thicker line.

### Shadows

Three tiers, accent-tinted on the heaviest.

| Token | Value | Use |
| --- | --- | --- |
| `--cui-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle elevation on small elements |
| `--cui-shadow` | `0 4px 12px rgba(0,0,0,0.4)` | Cards, dropdowns |
| `--cui-shadow-accent` | `0 6px 20px rgba(125,75,179,0.28)` | The signature lift on hover for interactive cards |

`--cui-shadow-accent` is the one that makes interactive surfaces feel *mystical*: the lift is colored (mystic purple), not neutral.

## Motion

### Durations

| Token | Value | Use |
| --- | --- | --- |
| `--cui-duration-fast` | `120ms` | The dominant value. Hover-state color shifts, focus rings, chip toggles. |
| `--cui-duration` | `180ms` | Heavier transitions (background changes, layout shifts) |
| `--cui-duration-slow` | `320ms` | Entrance animations (panel rise, modal in) |

### Easing

| Token | Value | Use |
| --- | --- | --- |
| `--cui-ease` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | The general-purpose curve. Use this by default. |
| `--cui-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Decelerating motion (entrances, lifts) |

There is also a hand-rolled bouncy curve used in two places for personality (the error banner's bounce-in rise): `cubic-bezier(0.34, 1.56, 0.64, 1)`. Reserve this for moments that should *land* with character. Don't apply it to every animation; the contrast is the point.

### Reduced motion

`tokens.css` zeroes all duration tokens inside `@media (prefers-reduced-motion: reduce)`. Personality animations defined outside the token system (the error wand wiggle, the prompt-prefix gradient drift) should also check `prefers-reduced-motion: no-preference` before animating.

## Surface idioms

These are the named patterns that show up over and over in the shell. When generating UI, reach for these by name.

### Accent-gradient hero strip

A soft accent gradient (`linear-gradient(180deg, rgba(125,75,179,0.14), rgba(200,104,0,0.05) 60%, transparent)`) extending edge-to-edge across the top of a panel via negative margins on the header element. Used by the Launcher header, the App Store hero, the Settings hero, and the File Explorer topbar.

Pattern:

```css
.thing-header {
  margin: -24px -24px 16px;
  padding: 20px 24px 16px;
  background: linear-gradient(180deg,
    rgba(124, 106, 247, 0.12),
    rgba(74, 158, 255, 0.04) 60%,
    transparent);
  border-bottom: 1px solid var(--cui-border);
}
```

The negative margin "bleeds" the gradient past the panel's internal padding so it touches the panel's edge. Reference: [.conjureos-launcher-header in src/shell/ui/app.css:3660](../ConjureOS/src/shell/ui/app.css).

### Translucent surface + hairline border

Cards, sidebars, and preview panes are drawn as low-opacity translucent surfaces with a hairline border, not solid filled boxes. This keeps multiple surfaces feeling like layers of the same glass.

```css
.thing-panel {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-radius);
}
```

Reference: `.conjureos-appstore-card` at [src/shell/ui/app.css:8897](../ConjureOS/src/shell/ui/app.css), `.conjureos-wm-chat` at [src/shell/ui/app.css:1158](../ConjureOS/src/shell/ui/app.css).

### Pill-shaped active state

When an option becomes the active selection (settings tab, filter chip, primary action), the affordance becomes a pill with an accent-gradient backing and a soft glow.

```css
.thing-tab.active {
  background: linear-gradient(135deg,
    rgba(124, 106, 247, 0.55),
    rgba(74, 158, 255, 0.4));
  border-radius: var(--cui-radius-pill);
  box-shadow: 0 0 0 1px var(--cui-accent-tint),
              0 4px 12px rgba(124, 106, 247, 0.25);
}
```

Reference: `.conjureos-settings-tabs button.active` at [src/shell/ui/app.css:744](../ConjureOS/src/shell/ui/app.css).

### Card hover: accent lift with left stripe

Interactive cards lift on hover with `transform: translateY(-1px)`, an accent-tinted shadow, and a 3px left stripe revealed via a pseudo-element. The lift is gentle (1px, not 4px); the stripe is bold (full-saturation accent gradient).

```css
.thing-card {
  position: relative;
  transition: transform var(--cui-duration) var(--cui-ease),
              box-shadow var(--cui-duration) var(--cui-ease);
}
.thing-card::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg,
    rgba(124, 106, 247, 0.95),
    rgba(74, 158, 255, 0.7));
  opacity: 0;
  transition: opacity var(--cui-duration) var(--cui-ease);
}
.thing-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--cui-shadow-accent);
}
.thing-card:hover::before { opacity: 1; }
```

Reference: `.conjureos-appstore-card` and `.conjureos-appstore-card::before` at [src/shell/ui/app.css:8897](../ConjureOS/src/shell/ui/app.css).

### Entrance rise

Empty states and dismissible banners enter with an 8px upward translate plus opacity. Use `ease-out` (180-320ms) for routine entrances; the bouncy curve `cubic-bezier(0.34, 1.56, 0.64, 1)` is reserved for error banners and similar "this needs attention" moments.

```css
@keyframes thing-rise {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.thing-empty {
  animation: thing-rise var(--cui-duration-slow) var(--cui-ease-out) both;
}
```

Reference: `@keyframes conjureos-wm-empty-rise` at [src/shell/ui/app.css:1716](../ConjureOS/src/shell/ui/app.css); `@keyframes conjureos-wm-chat-error-rise` at [src/shell/ui/app.css:1691](../ConjureOS/src/shell/ui/app.css).

## Voice

What Mystical Fall sounds and *feels* like, beyond the palette.

**Wand glyph, not warning triangle.** Errors surface as soft rounded cards with a gentle bounce-in and a small wand icon, not a triangle/exclamation. The comment at [src/shell/ui/app.css:1609](../ConjureOS/src/shell/ui/app.css) puts it plainly: "Style is 'modern whimsy': soft rounded card, gentle bounce-in, wand glyph instead of a warning triangle, dismissible." The error is still legible and dismissible; the framing is "something went sideways" rather than "DANGER."

**Friendly empty states.** Empty states use the rise animation and an invitation, not a status report. "Nothing here yet, start a chat" beats "No items to display." Pair with a single CTA, not a wall of help text.

**Gradient lane labels.** The home chat's `try:` / `do:` / `build:` / `edit:` orchestrator labels use a gradient text fill matching the home chat pill so the palette feels unified across surfaces. The labels are uppercased with 0.14em letter-spacing (the signature "structural label" treatment).

**Hover is a wink, not a flash.** 120ms is fast enough to feel responsive but slow enough to read as deliberate. Transitions that go from 0 to full-opacity in a single frame feel cheap; transitions that take 300ms feel sluggish. Stick to 120ms for the dominant case.

## Consuming Mystical Fall

The library ships a built CSS bundle at `dist/ui.css`. ConjureOS serves it at `/_conjureos/ui/v1.css`. Apps opt in by linking the stylesheet and wrapping their content.

**Mode 1: tokens only.**

```html
<link rel="stylesheet" href="/_conjureos/ui/v1.css" />
<body class="cui-tokens">
  <!-- get CSS variables, style your own components -->
</body>
```

**Mode 2: tokens + primitives (default for AI-generated apps).**

```html
<link rel="stylesheet" href="/_conjureos/ui/v1.css" />
<body class="cui-ui">
  <!-- use cui-* classes -->
</body>
```

**Opt out.** Omit the wrapper class. The stylesheet has no rendering effect without `.cui-tokens` or `.cui-ui`, so it's safe to leave the `<link>` in place.

For the full distribution model (how the bundle is built, served, and versioned), see [PHASE_21_DESIGN.md](../ConjureOS/PHASE_21_DESIGN.md) in the ConjureOS repo.

## Known drift

The ConjureOS shell predates parts of the token system and deviates from the canonical palette in known ways. Listed here so contributors don't propagate the patterns:

- **Hard-coded dark hex** (`#14161e`, `#16161c`, `#0a0a0c`) appears in older shell components instead of `--cui-bg-1` / `--cui-bg-2`. See [src/shell/ui/app.css:621, :1326, :5918](../ConjureOS/src/shell/ui/app.css). Newer components correctly use `var(--cui-bg-1)` etc.
- **Hand-rolled accent opacities** appear 50+ times across the shell instead of `--cui-accent-mute` / `--cui-accent-tint` / `--cui-accent-gradient`. The Mystical Fall retune (0.4.0) chased every literal to the current values (`rgba(125,75,179,X)`), so they're no longer stale — but they're still hand-rolled rather than tokenized, so a future retune would again have to chase them. Prefer the token in new code.
- **Hero negative-margin magic number** (`-24px -24px 16px`) is repeated across at least three hero headers. A future `--cui-hero-inset` token would let the inset adapt to a panel's actual padding.

These are documented as follow-up, not blocking. Don't add to the list; do prefer the tokenized equivalent in new code.

## For agents

This section is inline-imported into the ConjureOS Dev agent's system prompt. Keep it self-contained, prescriptive, and dense; don't depend on prose from the sections above.

CONJUREOS UI TOKENS, default visual language (Mystical Fall):

Generated apps should LOOK like ConjureOS unless the user explicitly asks for a different style ("make it look like a Game Boy", "retro typewriter feel", "all hot pink", etc.). The shell serves a stylesheet at `/_conjureos/ui/v1.css` with semantic CSS variables + primitive classes.

To opt in (default for almost every app), add this `<link>` to <head> and wrap <body> with the `cui-ui` class:

```html
<head>
  <link rel="stylesheet" href="/_conjureos/ui/v1.css" />
</head>
<body class="cui-ui">
  ...
</body>
```

Key tokens (most-reached-for):
- `var(--cui-accent)` purple primary, buttons, focus, links
- `var(--cui-accent-soft)` light-lavender secondary, icons, captions
- `var(--cui-bg)` / `var(--cui-bg-1)` / `var(--cui-bg-2)`, root / card / hover
- `var(--cui-fg)` / `var(--cui-fg-mute)` / `var(--cui-fg-dim)`, text tiers
- `var(--cui-border)` hairline; `var(--cui-radius)` 10px; `var(--cui-radius-pill)` 999px
- `var(--cui-accent-gradient)`, the mystic → ember 135deg gradient on hero surfaces

Primitive classes (compose these into your UI):
<!-- AUTOGEN:primitives -->
- Layout helpers: `cui-stack-v`, `cui-stack-h`, `cui-stack-h--between`
- Card: `cui-card`, `cui-card--interactive`, `cui-card--hero`
- Button: `cui-button`, `cui-button--primary`, `cui-button--ghost`, `cui-button--pill`, `cui-button--secondary`, `cui-button--danger`, `cui-button--warning`, `cui-button--info`, `cui-button--link`
- Pill (status / tag): `cui-pill`, `cui-pill--success`, `cui-pill--warn`, `cui-pill--error`, `cui-pill--danger`, `cui-pill--info`, `cui-pill--neutral`, `cui-pill--plain`
- Chip (interactive tag, e.g. filter selection): `cui-chip`, `cui-chip--active`
- Input: `cui-input`, `cui-label`
- Field (labeled control with an optional hint): `cui-field`, `cui-field__label`, `cui-field__hint`
- Heading: `cui-heading`, `cui-subheading`
- Divider: `cui-divider`
- Muted helper text: `cui-muted`, `cui-dim`
- Select: `cui-select`, `cui-input`
- Slider: `cui-slider`
- Toggle: `cui-toggle`, `cui-toggle__track`
- Tabs: `cui-tabs`, `cui-tab`, `cui-tab--active`
- Tooltip: `cui-tooltip`
- Modal: `cui-modal-backdrop`, `cui-modal`
<!-- /AUTOGEN -->

Signature idioms (reach for these when the situation fits):
- Hero strip: an accent-gradient bar at the top of a panel, bled edge-to-edge via negative margins on the header. Use for the top of any primary panel.
- Translucent surface + hairline border: `background: rgba(255,255,255,0.025); border: 1px solid var(--cui-border)`. Use for cards, sidebars, preview panes. Avoid solid filled boxes.
- Pill-shaped active state: when an option is selected, switch its border-radius to `var(--cui-radius-pill)` and back it with `linear-gradient(135deg, rgba(125,75,179,0.55), rgba(200,104,0,0.4))`. Use for tabs, filter chips, segmented controls.
- Card hover lift: `transform: translateY(-1px)` plus `box-shadow: var(--cui-shadow-accent)` plus an optional 3px accent-gradient left stripe via `::before`. The lift is gentle; the stripe is bold.
- Hover and focus transitions: 120ms with `var(--cui-ease)`. Faster feels cheap; slower feels sluggish.

Voice:
- Errors are soft rounded cards with a wand glyph, not warning triangles.
- Empty states are invitations ("Nothing here yet, start a chat"), not status reports.
- Reserve bouncy easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for moments that need character. Default to `var(--cui-ease)`.

Example, a small form using primitives:
```html
<div class="cui-card cui-stack-v">
  <h2 class="cui-heading">Add a recipe</h2>
  <label class="cui-label">Name <input class="cui-input" /></label>
  <div class="cui-stack-h cui-stack-h--between">
    <button class="cui-button cui-button--ghost">Cancel</button>
    <button class="cui-button cui-button--primary cui-button--pill">Save</button>
  </div>
</div>
```

Example, a fully-styled simple counter. This is what "simple app" looks like done right; the buttons + heading use cui-* primitives even though the JS is six lines:
```html
<!doctype html>
<!-- Generated by ConjureOS · https://conjureos.com -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Counter</title>
  <link rel="stylesheet" href="/_conjureos/ui/v1.css" />
  <style>
    body { margin: 0; min-height: 100dvh; display: grid; place-items: center; }
    .counter { text-align: center; }
    .counter-value {
      font-size: 96px;
      font-weight: 700;
      color: var(--cui-accent-soft);
      line-height: 1;
      margin: 16px 0 24px;
    }
    .counter-label {
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--cui-fg-mute);
      font-size: 12px;
    }
  </style>
</head>
<body class="cui-ui">
  <div class="cui-card counter cui-stack-v" style="padding: 32px 48px; gap: 12px;">
    <div class="counter-label">Count</div>
    <div class="counter-value" id="value">0</div>
    <div class="cui-stack-h cui-stack-h--between" style="gap: 8px;">
      <button class="cui-button cui-button--ghost cui-button--pill" id="reset">Reset</button>
      <button class="cui-button cui-button--primary cui-button--pill" id="inc">+ Increment</button>
    </div>
  </div>
  <script>
    let n = 0;
    const v = document.getElementById('value');
    document.getElementById('inc').onclick = () => { n++; v.textContent = n; };
    document.getElementById('reset').onclick = () => { n = 0; v.textContent = n; };
  </script>
</body>
</html>
```

Notice the styled counter uses cui-card for the boxed surface, cui-button for both buttons (primary for the main action, ghost for the secondary), cui-stack-v / cui-stack-h--between for layout, and the cui-* CSS variables (var(--cui-accent-soft), var(--cui-fg-mute)) for the custom display number. No raw <button>, no inline hard-coded colors. THIS is the baseline for every generated app, even a "minimal" one. If your output reaches for a bare <button> or a hard-coded #333 color, stop and reach for cui-button / var(--cui-fg) instead.

OPT-OUT: when the user wants a different visual language, just don't add the `cui-ui` class. Style freely with your own CSS / Tailwind / anything. The link can stay (no rendering effect without the wrapper class) or be removed.
