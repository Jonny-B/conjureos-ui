# Plan: 1.2.0, the primitives Conjure Games' Daily hub needed and the kit did not have

Status: **proposed, awaiting the owner** (2026-09-28). Nothing here is built yet.

Conjure Games shipped its Daily hub (conjureos-games 0.22.0) on its own private classes
(`src/skins/daily.css`, `dl-*`), because this kit had no stat tile in a palette hue, no
day mark or calendar, no list row with media, no bottom tab bar, no priced button. Every one
of those is something any ConjureOS app with a "today" screen will want. This plan moves them
into the kit so the next app gets them for free, in all nine palettes, both flavors, with
accessibility proven rather than hoped for.

The v1 contract holds throughout: **additive only** (new classes, new modifiers, new tokens;
nothing existing changes meaning), every rule scoped `.cui-ui .cui-x`, colour only from
`--cui-*` tokens (black and white alphas for shadows and highlights are the one exception).
That makes it **1.2.0**, a minor.

## What the kit has, what Daily needed, and the call

| Daily element (conjureos-games) | Kit today | Plan |
|---|---|---|
| Record tile: a number, a label, a palette hue, optional icon and "/18" | `.cui-stat` (neutral, uppercase `dt`) | **Extend**: `.cui-stat--accent / --support / --third`, `.cui-stat__of`, `.cui-stat__icon`; `.cui-stat-row` (equal columns, 2 to 4) |
| Day mark: solved, played, missed, today, before a first play | none | **New** `.cui-mark` with `--done / --partial / --missed / --today / --empty`, `--sm`. One element paints each (rule 6 below). Colour from `--cui-mark-hue`, defaulting to the accent |
| This week strip + legend | none | **New** `.cui-week` (seven columns, day label under each mark, today's label in accent text) and `.cui-legend` (each entry drawn with the same mark) |
| Calendar month | none | **New** `.cui-calendar`: weekday header, `.cui-calendar__day` with `--today`, `--selected`, `--disabled`, `--outside`; room for up to two `.cui-mark--sm` under the date; month nav using `.cui-button--icon` |
| List row: square media, play badge, title, chip, hook, meta line | `.cui-tile` (36px), `.cui-card--interactive` | **New** `.cui-row` with `__media` (square, ring and inner highlight), `__badge` (round action badge over the media's corner), `__title`, `__body`, `__meta`, `__trail` |
| Hue chip (an item's own colour: a game's teal, a recipe tag) | `.cui-pill--support / --third / --neutral` | **Extend**: `.cui-pill--hue`, driven by `--cui-hue` (and optional `--cui-hue-hi` / `--cui-hue-lo`), mixing the hue into the surface for the ground and into `fg` for the text |
| Featured action card: accent fill, eyebrow, title, line, inverted pill, an art slot | `.cui-card--hero` (hero tokens, no art) | **Extend**: `.cui-card--feature` with `__eyebrow`, `__art` (clipped, behind content, `aria-hidden`), `__pill` (on-accent pill) |
| Banner: picture, floating back button, badge | none | **New** `.cui-banner` with `__media`, `__back` (44px round), `__badge` |
| How to play: numbered steps | none | **New** `.cui-steps` (an `ol` with number discs) |
| Priced button: "Conjure my puzzle ✦1", "Warm up Free" | buttons, pills | **New** `.cui-button__price`, styled per button kind; the price is part of the button's accessible name |
| Bottom tab bar | `.cui-tabs` (segmented pill tabs) | **New** `.cui-tabbar`: fixed to the bottom, safe-area padding, icon over label, active pill, `aria-current="page"`, blur that degrades under reduced transparency |
| Segmented control with a travelling thumb | `.cui-button-group` (joined buttons) | **New** `.cui-segmented`: a radiogroup, thumb driven by `:has(:checked)` so it needs no script |
| Switch at 52 × 30 | `.cui-toggle` (36 × 20) | **Extend**: `.cui-toggle--lg` |
| Settings list: rows of label + value or control in one inset group | `.cui-field` | **New** `.cui-list` with `__row`, `__label`, `__value`, `__hint`, hairline dividers |
| Bottom sheet on a phone | `.cui-modal` (centred) | **Extend**: `.cui-modal--sheet` (bottom-anchored under 560px, centred above) |
| Toast with a status cap | `.cui-toast` (neutral) | **Extend**: `.cui-toast--success / --warning / --error / --info` |
| Avatar, large and filled | `.cui-avatar` (30px, support tint) | **Extend**: `.cui-avatar--lg` (52px), `.cui-avatar--accent` |
| Screenshot gallery | none | **New** `.cui-carousel` (scroll-snap row, captions) |

Out of scope: the Doorway art (Conjure Games' own), the flame glyph, anything a game board wears.

## New tokens

The kit has `support` and `third` triplets (`-text`, `-tint`, `-line`) and **no accent triplet**.
Daily derived one at runtime (`color-mix` of accent into fg, 55% dark and 72% light). 1.2 adds
**`--cui-accent-text`, `--cui-accent-tint`, `--cui-accent-line`** as explicit `-d` / `-l` pairs
per palette, like every other colour token, each value checked by hand against every ground it
can sit on. Also `--cui-tint-amount` (20% dark, 13% light), the one number Daily needed per
flavor, and flavor-aware elevation (`--cui-shadow*` cast black on dark, accent-tinted on light).

## Acceptance: every new primitive, every palette, both flavors

A primitive ships only when all of this passes in all eighteen palette and flavor combinations:

1. **Text contrast, WCAG AA**: 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
2. **Non-text contrast, WCAG 1.4.11**: 3:1 for every mark, ring, control boundary and focus
   indicator against what it sits on. axe does not test this, so the suite samples it.
3. **Never colour alone (1.4.1)**: every state also differs in shape. A done mark carries a
   check, a partial mark a dot, today a ring, missed an empty well.
4. **Targets**: 44 × 44 CSS px for anything tappable, including the tab bar and the banner's back
   button. A visually small control gets its size from padding.
5. **Focus**: a visible ring on `:focus-visible` on every interactive primitive, at 3:1.
6. **Centred on screen, not only in layout** (the half-pixel rule). A mark inside a circle or
   a pill is painted by ONE element (a ring as `box-shadow`, a dot as a `radial-gradient` on the
   same box, or both shapes in one SVG), or its child sits a whole number of CSS pixels from the
   container's edge. Layout reports a half-pixel child as centred; the browser snaps the two boxes
   separately and it lands half a pixel off. Conjure Games shipped exactly this (its Played mark
   read 0.45 to 0.58px off at 1×, 2× and 3×) and caught it only because the owner looked.
7. **Reduced motion**: every transition collapses under `prefers-reduced-motion`.
8. **Hue-driven variants** (`--cui-hue`) meet 1 and 2 across a sweep of twelve hues round the
   wheel, and the docs state the range they hold for.

## How it is proven: the kit gets a test suite

The kit has none for CSS today (`scripts/theme.test.mjs` covers `theme.js` only), and ConjureOS's
contrast tests cover two tokens and four built-in apps. 1.2 adds `scripts/primitives.test.mjs`:
Playwright (a dev dependency; nothing ships to apps) loads a fixture page with every primitive in
every state, in all 18 combinations, and runs:

- axe `color-contrast` (1),
- a pixel sampler for non-text contrast (2), and the target-size and focus-ring checks (4, 5),
- the half-pixel audit (6): fractional child offsets inside mark containers, plus a pixel
  centroid of each ring mark's dot against its ring (limit 0.2px; the same method as
  conjureos-games `art/hub/tools/ring_offset.py`),
- a guard that every rule is scoped `.cui-ui .cui-x` and uses no colour literal outside the
  allowlist.

`npm test` runs it; a CI workflow runs it on every PR. It also runs over the existing primitives,
and whatever they fail is filed as its own issue rather than fixed silently inside 1.2.

## Order of work

1. **The suite first**, over today's primitives: a baseline, and the failures filed.
2. **Tokens**: the accent triplet, the tint amount, flavor-aware elevation.
3. **Records**: stat tones, `.cui-mark`, `.cui-week`, `.cui-legend`, `.cui-calendar`.
4. **Lists and navigation**: `.cui-row`, `.cui-list`, `.cui-tabbar`, `.cui-segmented`,
   `.cui-toggle--lg`, avatar sizes.
5. **Surfaces**: `.cui-card--feature`, `.cui-banner`, `.cui-steps`, `.cui-button__price`,
   `.cui-modal--sheet`, toast tones, `.cui-carousel`.
6. **Docs and release**: `MODERN_WHIMSY.md` (the autogenerated list, plus the half-pixel rule
   under Common mistakes), `demo.html`, the `design-system.html` gallery; CHANGELOG; publish
   1.2.0 (manual `npm publish`, ConjureOS `NPM_PACKAGES.md`). 1.1.2 is still unpublished; it goes
   first.
7. **Adoption**: ConjureOS picks up `v1.css` (its vite plugin and guard test), and Conjure Games
   swaps its `dl-*` classes for these, keeping only its game hues and the Doorway. Its own
   render audit (`art/hub/tools/render-app.mjs`) must stay clean across the swap.

Each step is its own PR, and the suite is green before the next begins.
