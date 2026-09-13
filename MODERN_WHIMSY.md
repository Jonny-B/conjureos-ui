# Modern Whimsy

The design language of ConjureOS, packaged as `@conjureos/ui`.

This doc is the single source of truth for what Modern Whimsy is, what it looks like, and how to apply it. The human-readable sections come first; an agent-ready appendix lives at the bottom and is inline-imported by the ConjureOS Dev agent's system prompt.

## The brief

Modern Whimsy is accent-led and lightly playful. Translucent surfaces sit on hairline borders, active states go pill-shaped, hovers lift 120ms, and personality is reserved for the moments that warrant it: a wand glyph instead of a warning triangle on an error banner, a gentle bounce-in on an empty state. It avoids heavy chrome, favors generous radii (10px default, 999px for pills), and keeps three text tiers rather than five.

As of 0.4.0 it is **nine palettes across two flavors**, not one dark purple theme. The purple-to-blue brand gradient is retired. Every colour a component paints now comes from a token that resolves per theme and per flavor, so the same markup renders as Halloween dark or Summer light without touching a class name.

## Seeing it

Prose cannot show you a palette. Two places can:

- **`demo.html`** in this repo. Open it directly, no build step, no server. It loads the real `dist/ui.css`, so what renders is exactly what your app gets. There is a theme dropdown and a dark/light toggle at the top, and every primitive below with its markup in a collapsible block.
- Run `npm run build` first if `dist/` is stale.

Read this doc for the rules; open `demo.html` to see the result.

## The theming contract

### Two axes

Two attributes, independent of each other.

| Attribute | Values | Meaning |
| --- | --- | --- |
| `data-theme` | `cnj` `hal` `fal` `win` `spr` `sum` `xms` `est` `cnd` | Which palette |
| `data-flavor` | `dark` `light` | Which end of that palette |

Nine themes times two flavors is eighteen complete token sets. Every one of them was checked against WCAG 2.1 AA: body text at or above 4.5:1 on its own ground, and interactive fills at or above 3:1 per 1.4.11.

### Absence means inherit

Neither attribute is required. Both resolve through normal custom-property inheritance, so leaving one off means "whatever my ancestor said."

| Markup | Result |
| --- | --- |
| `<html>` | Conjure palette; browser's light/dark preference picks the flavor |
| `<html data-flavor="dark">` | Conjure, locked dark |
| `<html data-theme="spr">` | Spring; browser picks the flavor |
| `<html data-theme="spr" data-flavor="light">` | Spring light, locked |
| `<div data-theme="hal">` inside a Spring page | that subtree only is Halloween |

This is why the switch is attribute-based rather than class-based: a subtree can override its parent and everything under it follows, with no cascade fights and no JavaScript.

Either attribute can be set on its own, at any depth. A `data-flavor` with no `data-theme` beside it flips just the flavor and keeps the palette it inherited. That works because tokens are stored and resolved in two steps: each theme declares inert `--cui-bg-d` / `--cui-bg-l` pairs that inherit intact, and a single resolution rule matching every element carrying either attribute collapses each pair to the half the current flavor wants. A token written to read the flavor directly would be substituted once, high in the tree, and could never react to a change below it.

`data-theme="system"` returns a subtree to Conjure, the ConjureOS default. Use it to clear a theme an ancestor set. It is the one value that is not inheritance: omitting the attribute inherits, `system` resets.

### Who decides, and in what order

Three parties have an opinion about what your app should look like. Highest wins.

1. **The user**, through a control in your app's settings. Always beats everything.
2. **ConjureOS**, when your app is running inside it and the user has not overridden it in your app.
3. **Your app's default**, the palette you chose because it suits the subject. A recipes app picking Spring is a reasonable default; it should not be a life sentence.

An app opened outside ConjureOS simply never hears from level 2 and falls through to its own default. Nothing breaks, nothing needs a conditional.

Flavor follows the same ladder, with one addition at the bottom: if nobody has an opinion, the browser's `prefers-color-scheme` decides. That is the **only** thing the operating system's own setting controls. It never picks a palette.

## Wiring theming into your app

Read this section if you are building an app that runs in ConjureOS. It is the part app authors have to actually do work for.

### If you only want a fixed look

One attribute in your HTML. You are done, and you can skip the rest of this section.

```html
<html lang="en" data-theme="spr">
```

### If you want your app to follow ConjureOS

Apps run in an iframe, and CSS custom properties do not inherit across an iframe boundary. The shell therefore has to tell the app what the current theme is, and the app has to listen. The package ships the app's half of that conversation:

```html
<link rel="stylesheet" href="/_conjureos/ui/v1.css" />
<script src="/_conjureos/ui/theme.js"></script>
<script>
  ConjureTheme.init({ theme: "spr" });   // your app's default
</script>
```

That single call does all of it: reads the user's saved choice, picks up the OS theme ConjureOS injected at `window.__conjureos.appearance`, listens for later changes, falls back to your default, and writes the attributes onto `<html>`. Put the `<script>` in `<head>` so the attributes land before first paint and the page does not flash the wrong palette.

> **Status:** both halves ship. ConjureOS broadcasts its theme and answers the subscribe, so `ConjureTheme.init()` resolves against a live OS layer inside the shell. Outside the shell nothing answers and the OS layer is simply silent, which is exactly how a standalone app should behave.

### The settings section your app should have

Two controls. Not more.

**Theme**, a select with ten options: "Use ConjureOS theme" plus the nine palettes. The first option is the default and means "follow level 2."

**Appearance**, a three-way choice: System, Dark, Light. System means "follow the browser."

```html
<div class="cui-card cui-stack-v">
  <h2 class="cui-heading">Appearance</h2>

  <label class="cui-field">
    <span class="cui-field__label">Theme</span>
    <select class="cui-select" id="theme-select"></select>
    <span class="cui-field__hint">Follows ConjureOS unless you pick one here.</span>
  </label>

  <div class="cui-field">
    <span class="cui-field__label">Light or dark</span>
    <div class="cui-button-group" id="flavor-group">
      <button class="cui-button" data-flavor="">System</button>
      <button class="cui-button" data-flavor="dark">Dark</button>
      <button class="cui-button" data-flavor="light">Light</button>
    </div>
  </div>
</div>
```

```js
const sel = document.getElementById("theme-select");

// "Use ConjureOS theme" is the empty value, which maps to null, which means
// "stop overriding and follow the level above me."
sel.append(new Option("Use ConjureOS theme", ""));
for (const t of ConjureTheme.THEMES) sel.append(new Option(t.label, t.id));

sel.onchange = () => ConjureTheme.setTheme(sel.value || null);

for (const b of document.querySelectorAll("#flavor-group [data-flavor]")) {
  b.onclick = () => ConjureTheme.setFlavor(b.dataset.flavor || null);
}

// Reflect the resolved state back into the controls, including changes that
// came from ConjureOS rather than from this panel.
ConjureTheme.subscribe((s) => {
  sel.value = s.following ? "" : s.theme;
  for (const b of document.querySelectorAll("#flavor-group [data-flavor]")) {
    b.classList.toggle("cui-button--primary", b.dataset.flavor === (s.userFlavor || ""));
  }
});
```

The important detail is that **"follow ConjureOS" is a real, selectable state**, not the absence of a choice. A user who tries Halloween and then wants to go back needs a way back. If your select only lists nine palettes, there is no way back.

### `ConjureTheme` API

| Call | Does |
| --- | --- |
| `init({ theme, flavor, storageKey, root, lock })` | Resolve and apply. All options optional. Returns the resolved state. |
| `setTheme(id \| null)` | User picks a palette. `null` means follow ConjureOS. Persists. |
| `setFlavor("dark" \| "light" \| null)` | `null` means follow the browser. Persists. |
| `get()` | `{ theme, flavor, source, following, locked, userTheme, userFlavor, osTheme, osFlavor }`. `source` is `"user"`, `"os"`, or `"app"`; `osTheme` / `osFlavor` are what ConjureOS last said, whether or not it won. |
| `subscribe(fn)` | Called on every change. Returns an unsubscribe function. |
| `THEMES` | `[{ id, label }]` for the nine, in canonical order. Build your picker from this. |

Choices persist to `localStorage` under `conjureos.theme` by default. Pass `storageKey` to give your app its own slot, or `storageKey: null` to not persist at all.

### If your app must not change appearance

Some apps only work in one palette. Pass `lock: true` and the ladder collapses to your default:

```js
ConjureTheme.init({ theme: "win", flavor: "dark", lock: true });
```

ConjureOS and any stored user choice are still **received** — `get().osTheme` and `get().osFlavor` tell you what the shell is wearing — but neither is ever applied, and `setTheme` / `setFlavor` do nothing and warn once. Read `get().locked` and do not render a picker.

Lock because the design genuinely needs one palette, not to avoid the work: a locked app is the one place a user's ConjureOS theme visibly does not apply, and they have no control that explains why. Say so in your settings copy.

### Doing it without the helper

Nothing above is magic. If you would rather not load another script:

```js
document.documentElement.dataset.theme = "spr";      // or delete to inherit
document.documentElement.dataset.flavor = "dark";    // or delete to follow the browser
```

The helper exists because the precedence rules, the persistence, and the iframe handshake are the parts that go subtly wrong when three apps each implement them separately.

### The protocol, for whoever builds the shell side

The app posts this to its parent on init:

```js
{ type: "conjureos:theme:subscribe" }
```

The shell replies, and re-sends on every OS theme change:

```js
{ type: "conjureos:theme", theme: "spr", flavor: "dark" }
```

`theme` and `flavor` may each be `null`, meaning "no opinion, use the app's default." The app ignores messages that do not come from its own parent, and ignores theme ids it does not recognise. A static fallback is also read: `?cui-theme=spr&cui-flavor=dark` on the iframe URL, which covers first paint before any message arrives.

## The nine themes

Each theme is a full token set in both flavors. The tables below list the ten tokens that give a theme its identity; the other twenty five are derived from these and listed in the token reference. Open `demo.html` to see any of them rendered.

### Conjure  `data-theme="cnj"`

The default, and the only one that is not a season. Deep blue-black ground, teal lead, blue support, green third. Deliberately quiet: it has to sit under any app without asserting a mood the app did not ask for.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#0b0e14` | `#f1f3f5` |
| Card | `--cui-bg-1` | `#11151d` | `#ffffff` |
| Text | `--cui-fg` | `#e5e9f0` | `#16191f` |
| Secondary text | `--cui-fg-mute` | `#9ca3af` | `#5b6472` |
| Lead | `--cui-accent` | `#0f766e` | `#0f766e` |
| On lead | `--cui-on-accent` | `#fff` | `#fff` |
| Link | `--cui-link` | `#38bdf8` | `#0f766e` |
| Support | `--cui-support` | `#60a5fa` | `#075985` |
| Third | `--cui-third` | `#34d399` | `#036348` |
| Featured card | `--cui-hero-bg` | `#243b59` | `#dae4ea` |

Contrast: Dark: text 15.9:1, secondary 7.6:1, link 8.5:1, button label 5.5:1. Light: text 15.8:1, secondary 5.4:1, link 5.5:1, button label 5.5:1.

### Halloween  `data-theme="hal"`

Burnt orange lead on a near-black warm ground, purple carrying the featured card, muted moss green as the third note. The light flavor is bone and parchment rather than white, because Halloween on a white page reads as a safety notice.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#0c0b09` | `#d9d1bd` |
| Card | `--cui-bg-1` | `#15140f` | `#e7e0cf` |
| Text | `--cui-fg` | `#f0ece2` | `#1a1813` |
| Secondary text | `--cui-fg-mute` | `#a8a294` | `#55503f` |
| Lead | `--cui-accent` | `#c2410c` | `#a8380a` |
| On lead | `--cui-on-accent` | `#fff` | `#fff` |
| Link | `--cui-link` | `#e8934f` | `#8f3208` |
| Support | `--cui-support` | `#6d4482` | `#573268` |
| Third | `--cui-third` | `#5f7a3a` | `#445f29` |
| Featured card | `--cui-hero-bg` | `#4a2f56` | `#c7b4a8` |

Contrast: Dark: text 16.7:1, secondary 7.7:1, link 7.7:1, button label 5.2:1. Light: text 11.7:1, secondary 5.3:1, link 6.1:1, button label 6.5:1.

### Fall  `data-theme="fal"`

Goldenrod lead over dark cocoa, rust support, deep pine third. The ground is warm but low chroma; push its saturation up and it slides straight into mud.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#19140f` | `#f0dab0` |
| Card | `--cui-bg-1` | `#231d17` | `#faeeda` |
| Text | `--cui-fg` | `#f5efe3` | `#211a11` |
| Secondary text | `--cui-fg-mute` | `#bbae98` | `#655b40` |
| Lead | `--cui-accent` | `#c2820a` | `#a35207` |
| On lead | `--cui-on-accent` | `#14100c` | `#fff` |
| Link | `--cui-link` | `#e8b53f` | `#994d06` |
| Support | `--cui-support` | `#b04728` | `#8a3418` |
| Third | `--cui-third` | `#2f5d3f` | `#245036` |
| Featured card | `--cui-hero-bg` | `#5b2a1a` | `#e0bf98` |

Contrast: Dark: text 16.0:1, secondary 8.4:1, link 8.8:1, button label 5.9:1. Light: text 12.6:1, secondary 4.9:1, link 5.4:1, button label 5.6:1.

### Winter  `data-theme="win"`

Ice blue on deep midnight teal, indigo support, cranberry third. The red is there to keep the palette from reading as a single cold wash.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#0a1d26` | `#e6ecf4` |
| Card | `--cui-bg-1` | `#12262f` | `#f8fafd` |
| Text | `--cui-fg` | `#eef2f7` | `#111820` |
| Secondary text | `--cui-fg-mute` | `#9fabb9` | `#4f5b68` |
| Lead | `--cui-accent` | `#4a90b8` | `#2b6d92` |
| On lead | `--cui-on-accent` | `#0a0f14` | `#fff` |
| Link | `--cui-link` | `#7cc0e0` | `#245f80` |
| Support | `--cui-support` | `#3f4894` | `#3a3f80` |
| Third | `--cui-third` | `#a34a5e` | `#8e3a4e` |
| Featured card | `--cui-hero-bg` | `#2b386a` | `#ccd2e3` |

Contrast: Dark: text 15.4:1, secondary 7.4:1, link 7.8:1, button label 5.5:1. Light: text 15.0:1, secondary 5.8:1, link 6.6:1, button label 5.7:1.

### Spring  `data-theme="spr"`

Fresh green lead, magenta-pink support, daffodil third. The light flavor is near-white with a green cast, the brightest ground of the nine.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#131a17` | `#ebf1e6` |
| Card | `--cui-bg-1` | `#1c2620` | `#f9fbf7` |
| Text | `--cui-fg` | `#f0f4ea` | `#131810` |
| Secondary text | `--cui-fg-mute` | `#a8b39c` | `#4f5a46` |
| Lead | `--cui-accent` | `#6aa32e` | `#47801a` |
| On lead | `--cui-on-accent` | `#0d1108` | `#fff` |
| Link | `--cui-link` | `#a8d95f` | `#3d6d16` |
| Support | `--cui-support` | `#c4629b` | `#a53d7a` |
| Third | `--cui-third` | `#e0c33f` | `#705708` |
| Featured card | `--cui-hero-bg` | `#613a51` | `#e0d6d6` |

Contrast: Dark: text 15.9:1, secondary 8.1:1, link 9.5:1, button label 6.3:1. Light: text 15.7:1, secondary 6.3:1, link 5.9:1, button label 4.8:1.

### Summer  `data-theme="sum"`

The one dark flavor that is not near-black: a deep teal sea. The featured card is coral and sits LIGHTER than its ground, which is why hero surfaces carry their own foreground pair instead of inheriting the panel's.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#123434` | `#f7edde` |
| Card | `--cui-bg-1` | `#1a4242` | `#fdf8f0` |
| Text | `--cui-fg` | `#eaf7f6` | `#1a1610` |
| Secondary text | `--cui-fg-mute` | `#a3c0bf` | `#5a5346` |
| Lead | `--cui-accent` | `#43b5b2` | `#1d6764` |
| On lead | `--cui-on-accent` | `#04161a` | `#fff` |
| Link | `--cui-link` | `#6fd0cd` | `#175553` |
| Support | `--cui-support` | `#e88b6f` | `#a4482c` |
| Third | `--cui-third` | `#0f7ec1` | `#035996` |
| Featured card | `--cui-hero-bg` | `#c67d66` | `#e8cfbe` |

Contrast: Dark: text 12.2:1, secondary 6.9:1, link 6.1:1, button label 7.5:1. Light: text 15.5:1, secondary 6.6:1, link 8.1:1, button label 6.6:1.

### Christmas  `data-theme="xms"`

Fir green holds the ground so red reads as ornament rather than alarm. Lead and support are the same red on purpose; sage is the third, and the featured tile goes gold. Putting red on the ground was the version that failed.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#0e1f14` | `#d6e5cf` |
| Card | `--cui-bg-1` | `#16291c` | `#eaf2e5` |
| Text | `--cui-fg` | `#f2f5ef` | `#131a10` |
| Secondary text | `--cui-fg-mute` | `#a8bcac` | `#4e5949` |
| Lead | `--cui-accent` | `#ce2229` | `#ce2229` |
| On lead | `--cui-on-accent` | `#fff` | `#fff` |
| Link | `--cui-link` | `#f89a86` | `#9e2318` |
| Support | `--cui-support` | `#ce2229` | `#ce2229` |
| Third | `--cui-third` | `#a0c356` | `#a0c356` |
| Featured card | `--cui-hero-bg` | `#7d1a18` | `#f0bcb2` |

Contrast: Dark: text 15.6:1, secondary 8.5:1, link 7.3:1, button label 5.4:1. Light: text 13.5:1, secondary 5.6:1, link 6.8:1, button label 5.4:1.

### Easter  `data-theme="est"`

Soft violet ground, orchid lead, cotton-candy pink support, pale butter third. Light flips to a mint ground so it does not become a second Spring.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#1c1524` | `#d9eeed` |
| Card | `--cui-bg-1` | `#271e31` | `#eef8f7` |
| Text | `--cui-fg` | `#f4eff7` | `#12191a` |
| Secondary text | `--cui-fg-mute` | `#b6acbe` | `#4b5757` |
| Lead | `--cui-accent` | `#ae71d4` | `#9e4aa6` |
| On lead | `--cui-on-accent` | `#170f1c` | `#fff` |
| Link | `--cui-link` | `#d4aeee` | `#8a3d92` |
| Support | `--cui-support` | `#febfd0` | `#febfd0` |
| Third | `--cui-third` | `#fbf49a` | `#fbf49a` |
| Featured card | `--cui-hero-bg` | `#644b5b` | `#efd2dc` |

Contrast: Dark: text 15.7:1, secondary 8.1:1, link 8.4:1, button label 5.5:1. Light: text 14.8:1, secondary 6.2:1, link 6.1:1, button label 5.3:1.

### Candyland  `data-theme="cnd"`

Deep raspberry ground, bubblegum lead, cyan support, lime third. The most saturated of the nine. The featured card goes cyan specifically to break the pink, which is what separates it from Easter.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Ground | `--cui-bg` | `#2d0a1e` | `#ffd6e6` |
| Card | `--cui-bg-1` | `#3a1128` | `#fff0f6` |
| Text | `--cui-fg` | `#f8eef4` | `#1a1016` |
| Secondary text | `--cui-fg-mute` | `#c0a8b6` | `#5f4b55` |
| Lead | `--cui-accent` | `#ff70a6` | `#d1207a` |
| On lead | `--cui-on-accent` | `#2a0715` | `#fff` |
| Link | `--cui-link` | `#ffa3c6` | `#a0175c` |
| Support | `--cui-support` | `#4ee9e9` | `#4ee9e9` |
| Third | `--cui-third` | `#e9ff70` | `#e9ff70` |
| Featured card | `--cui-hero-bg` | `#0f5560` | `#93e2e7` |

Contrast: Dark: text 15.8:1, secondary 8.1:1, link 8.8:1, button label 7.1:1. Light: text 14.2:1, secondary 6.1:1, link 6.9:1, button label 5.0:1.

## Token reference

Thirty five colour tokens, redefined by every theme in both flavors. Reach for the token, never the literal. If you find yourself writing a hex value in an app, the palette you picked will be wrong for eight of the nine themes.

### Ground

Four layers, deepest to highest. On a light flavor these still run deepest to highest, they just start near white.

| Token | Use |
| --- | --- |
| `--cui-bg` | Root canvas, behind everything |
| `--cui-bg-1` | Primary card surface |
| `--cui-bg-2` | Raised surface: hovered card, modal, input |
| `--cui-bg-3` | Highest tier: popover, selected row |

### Text

Three tiers. Do not introduce a fourth; if you need one, you need a different layout.

| Token | Use |
| --- | --- |
| `--cui-fg` | Body text and headings |
| `--cui-fg-mute` | Secondary text, labels, placeholders |
| `--cui-fg-dim` | Tertiary text, disabled states |

### Border

| Token | Use |
| --- | --- |
| `--cui-border` | The default hairline. Surfaces define edges by light tinting, not heavy lines. |
| `--cui-border-strong` | Hover and active state for interactive surfaces |

Both are alpha values derived from the theme's text colour, not from white, so a warm theme gets a warm hairline.

### Lead

The one hue that carries the theme. Primary buttons, focus rings, the selected tab.

| Token | Use |
| --- | --- |
| `--cui-accent` | The lead colour as a fill |
| `--cui-accent-hover` | Its hover state |
| `--cui-on-accent` | The label that goes ON that fill. **Never hardcode `white` here.** |
| `--cui-link` | The lead as *text*, which is a different value from the lead as a *fill* |
| `--cui-link-hover` | Its hover state |

The split between `--cui-accent` and `--cui-link` is the single most load-bearing idea in the token set. A colour bright enough to be legible as text on a dark ground is usually too light to carry a white label as a fill, and a colour dark enough to carry white is usually too dark to read as text. Six of the nine themes need a dark `--cui-on-accent`; Fall's goldenrod takes white at 3.24:1, under the 4.5:1 AA needs, and near-black at 5.85:1. One token cannot do both jobs.

### Support

The second hue. Carries the featured card, active chips, and focus washes.

| Token | Use |
| --- | --- |
| `--cui-support` | The support hue as a fill |
| `--cui-support-text` | The support hue as text |
| `--cui-support-tint` | A soft wash of it, for chip and pill backgrounds |
| `--cui-support-line` | A soft border of it |

### Third

The third hue. Use it sparingly; it is a note, not a voice. A tag category, a secondary stat, an accent on one card in a grid.

| Token | Use |
| --- | --- |
| `--cui-third` | Fill |
| `--cui-third-text` | Text |
| `--cui-third-tint` | Wash |
| `--cui-third-line` | Border |

### Featured surface

The hero card. It gets its own foreground pair because in Summer it renders *lighter* than the panel behind it, so inheriting the page's text colour would put light text on a light card.

| Token | Use |
| --- | --- |
| `--cui-hero-bg` | The featured card's background |
| `--cui-hero-fg` | Text on it |
| `--cui-hero-mute` | Secondary text on it |
| `--cui-hero-line` | Its border |
| `--cui-tile` | The app-icon tile inside it |
| `--cui-tile-line` | That tile's border |
| `--cui-glyph` | The icon inside that tile |

The tile tokens exist because of a specific failure: painting an app icon as a solid block of the lead hue at icon size reads as a screaming rectangle. The fix was area, not value. The tile is a translucent wash and the hue survives as a small glyph.

### Status and elevation

| Token | Use |
| --- | --- |
| `--cui-success` `--cui-warning` `--cui-error` `--cui-info` | Status fills and text |
| `--cui-onstatus` | The label on a status fill. Near-black on dark flavors, white on light. |
| `--cui-secondary` | The quiet button fill, next to a primary |

Status colours are theme-aware, not fixed. The core green at `#34d399` fails as text on every one of the nine light grounds, from 1.26:1 on Halloween to 1.73:1 on Conjure, so light flavors get a deepened set.

### Everything else

Type, space, radius, motion and shadow tokens are theme-independent. They are defined once on `.cui-tokens` and `.cui-ui` and never change with the palette.

### Deprecated aliases

Sixteen aliases still resolve, mapped onto their nearest successor, so 0.3.x markup keeps rendering. They are declared in the resolution block rather than on a bare `:root`, so they track the active theme; declared once at the root they would substitute against Conjure and freeze there.

| Alias | Use instead |
| --- | --- |
| `--cui-accent-soft` | `--cui-link` |
| `--cui-accent-mute` | `--cui-support-tint` |
| `--cui-accent-tint` | `--cui-support-line` |
| `--cui-accent-pink` | `--cui-third` |
| `--cui-warn` | `--cui-warning` |
| `--cui-danger` | `--cui-error` |
| `--cui-danger-hover` | `--cui-error` |
| `--cui-warning-hover` | `--cui-warning` |
| `--cui-info-strong` | `--cui-info` |
| `--cui-info-strong-hover` | `--cui-info` |
| `--cui-secondary-hover` | `--cui-bg-3` |
| `--cui-surface` | `--cui-bg-1` |
| `--cui-surface-2` | `--cui-bg-2` |
| `--cui-surface-hover` | `--cui-bg-2` |
| `--cui-accent-gradient` | `--cui-accent` |
| `--cui-brand-gradient` | `--cui-accent` |

Both gradient tokens now resolve to a flat `--cui-accent` fill rather than the retired purple-to-blue sweep. All sixteen go away in 2.0. They were originally scheduled for 1.0, but the ConjureOS shell still reads eight of them and has not been migrated, so removing them now would break the thing the library exists to style. Move off them.

## The rules the palettes follow

Useful if you are building a theme of your own, or wondering why a colour you expected is not there.

**Every hue has exactly one job.** Lead, support, third. A palette with four voices has none. When Christmas needed red in two places, lead and support were set to the *same* red rather than adding a fourth hue.

**The ground decides whether a coloured card can exist.** Not the hue gap between them, and not their overall colour distance: the *chroma of the ground*. Below about 4, a ground asserts no hue of its own and any coloured card reads cleanly against it. Above that, the ground starts competing and the card has to move further away than a season's palette usually allows.

**Warm dark grounds have a mud band.** At Lab hue 60 to 85, a dark surface with chroma above roughly 5.5 stops reading as "warm dark" and starts reading as mud. Fall's ground sits deliberately under that line. This is a chroma limit, not a lightness limit; darkening does not rescue it.

**Complementary hues cannot composite.** Layering a translucent tint of one hue over its complement passes through grey on the way. Summer and Candyland therefore carry pre-composited opaque tints where a naive system would use `rgba()`; the other seven keep enough hue distance for alpha to composite cleanly.

**Bright colours are fills in light flavors, never text.** A colour bright enough to feel seasonal on a white ground cannot also be legible on it. Light flavors keep the bright value for fills and pair it with a separately deepened text value. This is why `--cui-support` and `--cui-support-text` diverge sharply on light and barely at all on dark.

**Contrast is checked, not eyeballed.** Every one of the eighteen sets was computed: 4.5:1 for text per WCAG 2.1 AA, 3:1 for interactive boundaries per 1.4.11. Several palettes that looked right failed and were retuned.

## Type

System fonts; no web fonts. Two stacks: `--cui-font-sans` (Apple / Segoe / system UI fallback chain) and `--cui-font-mono` (SF Mono / JetBrains Mono / Consolas).

### Size scale

Seven steps, 11px through 32px. Bias toward 14px (base) for body and 12px (`text-sm`) for secondary text. The 32px `text-3xl` is for "big number" moments, a counter value or a hero metric, not for page headings.

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

Four: 400 / 500 / 600 / 700. Body 400, labels and buttons 500, headings 600, big-number displays 700. Avoid 700 anywhere else.

### Leading

`--cui-leading-tight` (1.2) for headings, `--cui-leading-normal` (1.5) for body, `--cui-leading-loose` (1.7) for long-form reading.

### Recurring type idioms

**Uppercased label with letter-spacing.** The signature treatment for small structural labels: `text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600`. Use it when a label needs to *announce itself as structure* rather than as content. A button does not need it; a section divider does. Settings section headers use a lighter 0.04em; console level chips use 0.06em.

**Slight tightening on headings.** `letter-spacing: -0.01em` on h2-scale headings keeps display text from feeling spread thin.

## Space, radius, border

### Spacing ladder

Powers of 4 with named intermediates.

`--cui-space-0` (0) / `-1` (4px) / `-2` (8px) / `-3` (12px) / `-4` (16px) / `-5` (20px) / `-6` (24px) / `-8` (32px) / `-12` (48px).

Default `gap` on `cui-stack-v` and `cui-stack-h` is `--cui-space-3` (12px). Default `padding` on `cui-card` is `--cui-space-4` (16px). Reach for the named token, not a literal pixel value.

### Radius

| Token | Value | Use |
| --- | --- | --- |
| `--cui-radius-sm` | `6px` | Inputs, small chips, tightly grouped controls |
| `--cui-radius` | `10px` | The default. Cards, buttons, panels. |
| `--cui-radius-lg` | `14px` | Modals, large containers |
| `--cui-radius-pill` | `999px` | Pills, chips, active states, avatar |

### Border width

`--cui-border-width` is `1px`. Hairlines only. Modern Whimsy defines edges with light tinting, not with weight.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--cui-duration-fast` | `120ms` | The dominant case. Hover, focus, colour change. |
| `--cui-duration` | `200ms` | Panel and disclosure transitions |
| `--cui-duration-slow` | `320ms` | Entrances, modal open |
| `--cui-ease` | `cubic-bezier(0.2, 0.7, 0.3, 1)` | Default |
| `--cui-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances and exits |
| `--cui-ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reserved for moments that need character |

120ms is fast enough to feel responsive and slow enough to read as deliberate. Zero to full opacity in one frame feels cheap; 300ms feels sluggish.

### Reduced motion

`tokens.css` zeroes every duration token inside `@media (prefers-reduced-motion: reduce)`. Animations defined outside the token system should check `prefers-reduced-motion: no-preference` before running.

## Components

Every primitive the package ships. The markup below is the same markup `demo.html` renders, so anything you copy here is what you see there.

All of it is class-only. There are no required wrappers beyond `cui-ui` on an ancestor, no JavaScript, and no build step.

### Buttons

Every variant reads `--cui-accent` and `--cui-on-accent`. Six of the nine themes have a lead hue too light for a white label, so the label is a token rather than a literal.

**When to use.** Reach for `--primary` once per view. If two buttons are both primary, neither is. `--secondary` is the quiet alternative beside it, `--ghost` is for toolbar density, and `--link` is for an action that is really a navigation.

*Intent*

```html
<div class="cui-stack-h">
  <button class="cui-button cui-button--primary">Primary</button>
  <button class="cui-button cui-button--secondary">Secondary</button>
  <button class="cui-button cui-button--ghost">Ghost</button>
  <button class="cui-button cui-button--link">Link</button>
  <button class="cui-button cui-button--primary cui-button--pill">Pill</button>
  <button class="cui-button cui-button--primary" disabled>Disabled</button>
</div>
```

*Status*

```html
<div class="cui-stack-h">
  <button class="cui-button cui-button--danger">Delete</button>
  <button class="cui-button cui-button--warning">Review</button>
  <button class="cui-button cui-button--info">Details</button>
</div>
```

*Size, icon and group (new in 0.4.0)*

```html
<div class="cui-stack-h">
  <button class="cui-button cui-button--primary cui-button--sm">Small</button>
  <button class="cui-button cui-button--primary">Medium</button>
  <button class="cui-button cui-button--primary cui-button--lg">Large</button>
  <button class="cui-button cui-button--secondary cui-button--icon" aria-label="Favourite"><svg><!-- any icon --></svg></button>
  <span class="cui-button-group">
    <button class="cui-button cui-button--secondary">Day</button>
    <button class="cui-button cui-button--secondary">Week</button>
    <button class="cui-button cui-button--secondary">Month</button>
  </span>
</div>
```

### Form controls

Input, select, slider, toggle, label and field already shipped. Textarea, checkbox, radio and help text are new.

**When to use.** Wrap each control in `cui-field` so the label, the control and the hint stay associated. Add `cui-help--error` plus the matching `--error` class on the control for validation state; the error colour is a token, so it stays legible in every theme.

*Text and choice*

```html
<div class="cui-stack-v">
  <label class="cui-field">
    <span class="cui-label">Recipe name</span>
    <input class="cui-input" value="Pumpkin soup">
  </label>
  <label class="cui-field">
    <span class="cui-label">Category</span>
    <select class="cui-select"><option>Soups and stews</option></select>
  </label>
  <label class="cui-field">
    <span class="cui-label">Servings</span>
    <input class="cui-input cui-input--error" value="0">
    <span class="cui-help cui-help--error">Must be at least one.</span>
  </label>
  <label class="cui-field">
    <span class="cui-label">Method</span>
    <textarea class="cui-textarea">Sweat the onion, add the squash.</textarea>
  </label>
</div>
```

*Toggles (checkbox and radio are new)*

```html
<div class="cui-stack-h">
  <label class="cui-choice"><input type="checkbox" checked><span class="cui-checkbox"></span>Vegetarian</label>
  <label class="cui-choice"><input type="checkbox"><span class="cui-checkbox"></span>Contains nuts</label>
  <label class="cui-choice"><input type="radio" name="units" checked><span class="cui-radio"></span>Metric</label>
  <label class="cui-choice"><input type="radio" name="units"><span class="cui-radio"></span>Imperial</label>
  <label class="cui-toggle"><input type="checkbox" checked><span class="cui-toggle__track"></span>Auto-save</label>
</div>
<div style="max-width:230px;margin-top:12px"><input class="cui-slider" type="range" value="60"></div>
```

### Feedback

None of this existed before 0.4.0. The alert keeps a neutral fill and carries the status colour on a left stripe, so the text keeps full contrast on any of the nine grounds.

**When to use.** `cui-alert` is inline and persistent, `cui-toast` is floating and transient. `cui-spinner` is for an unknown wait, `cui-progress` for a known one, and `cui-skeleton` for content whose shape you already know.

*Alerts*

```html
<div class="cui-stack-v">
  <div class="cui-alert cui-alert--success"><div><b>Saved</b>Your recipe is published to the store.</div></div>
  <div class="cui-alert cui-alert--warning"><div><b>Check the servings</b>This recipe scales oddly below four.</div></div>
  <div class="cui-alert cui-alert--error"><div><b>Upload failed</b>The image exceeded the 4 MB limit.</div></div>
  <div class="cui-alert cui-alert--info"><div><b>New version</b>A newer build is available.</div></div>
</div>
```

*Toast, progress, spinner and skeleton*

```html
<div class="cui-stack-h">
  <span class="cui-toast"><span class="cui-spinner"></span>Publishing to the store</span>
  <span class="cui-tooltip" data-tooltip="Ctrl S">Save</span>
</div>
<div style="max-width:280px;margin-top:12px">
  <div class="cui-progress"><span class="cui-progress__bar" style="width:62%"></span></div>
  <div class="cui-stack-v" style="gap:6px;margin-top:12px">
    <div class="cui-skeleton"></div>
    <div class="cui-skeleton" style="width:60%"></div>
  </div>
</div>
```

### Pills and chips

The status variants shipped already. `--support` and `--third` are new: they carry the palette&rsquo;s two non-lead hues, so a pill picks up the theme rather than only the status.

**When to use.** A pill is a label. A chip is a control. If it responds to a click, it is a chip. `--support` and `--third` carry the palette's two non-lead hues; use `--third` sparingly.

*All variants*

```html
<div class="cui-stack-h">
  <span class="cui-pill cui-pill--support">Support</span>
  <span class="cui-pill cui-pill--third">Third note</span>
  <span class="cui-pill cui-pill--neutral">Neutral</span>
  <span class="cui-pill cui-pill--success">Published</span>
  <span class="cui-pill cui-pill--warn">In review</span>
  <span class="cui-pill cui-pill--error">Rejected</span>
  <span class="cui-pill cui-pill--info">Draft</span>
</div>
<div class="cui-stack-h" style="margin-top:10px">
  <span class="cui-chip cui-chip--active">Autumn</span>
  <span class="cui-chip">Quick</span>
  <span class="cui-chip">Vegetarian</span>
</div>
```

### Navigation

Tabs shipped already, though its active state was two hardcoded purple literals until 0.4.0. Breadcrumb, menu and pagination are new.

**When to use.** Tabs for switching views inside one surface, breadcrumb for depth, menu for a command list, pagination for long results.

*Tabs*

```html
<div class="cui-tabs">
  <button class="cui-tab cui-tab--active">Overview</button>
  <button class="cui-tab">Ingredients</button>
  <button class="cui-tab">Method</button>
</div>
```

*Breadcrumb, menu and pagination (new)*

```html
<div class="cui-breadcrumb">Recipes<span>/</span>Autumn<span>/</span><b>Pumpkin soup</b></div>
<div class="cui-stack-h" style="align-items:flex-start;margin-top:12px">
  <div class="cui-menu">
    <div class="cui-menu-item cui-menu-item--active">Open<span class="cui-menu-key">Enter</span></div>
    <div class="cui-menu-item">Duplicate<span class="cui-menu-key">Ctrl D</span></div>
    <div class="cui-menu-sep"></div>
    <div class="cui-menu-item">Delete<span class="cui-menu-key">Del</span></div>
  </div>
  <div class="cui-pagination"><span>1</span><span class="cui-is-current">2</span><span>3</span><span>&rsaquo;</span></div>
</div>
```

### Data display

Table, avatar, avatar stack and stat are all new in 0.4.0.

**When to use.** `cui-stat` is the big-number moment and the one place 700 weight belongs. `cui-table` stays hairline-ruled; do not add vertical rules.

*Table and stats*

```html
<div class="cui-card" style="padding:0;overflow:hidden">
  <table class="cui-table">
    <thead><tr><th>Recipe</th><th>Status</th><th>Rating</th></tr></thead>
    <tbody>
      <tr><td>Pumpkin soup</td><td><span class="cui-pill cui-pill--success">Published</span></td><td class="cui-muted">4.6</td></tr>
      <tr><td>Roast squash</td><td><span class="cui-pill cui-pill--warn">In review</span></td><td class="cui-muted">4.1</td></tr>
    </tbody>
  </table>
</div>
<div class="cui-stack-h" style="margin-top:12px">
  <span class="cui-avatar-stack">
    <span class="cui-avatar">JB</span><span class="cui-avatar">MK</span><span class="cui-avatar">+4</span>
  </span>
</div>
<div class="demo-g3" style="margin-top:12px">
  <dl class="cui-stat"><dt>Installs</dt><dd>12,480</dd></dl>
  <dl class="cui-stat"><dt>Rating</dt><dd>4.6</dd></dl>
  <dl class="cui-stat"><dt>Revenue</dt><dd>$1,204</dd></dl>
</div>
```

### Surfaces

Card and modal shipped already. The hero card now uses its own `--cui-hero-*` group, because on Summer the featured card is lighter than its ground and needs its own foreground pair. The tile and empty state are new.

**When to use.** `cui-card` is the default container. `cui-card--hero` is the featured surface and carries its own foreground tokens, so text inside it must use `--cui-hero-fg` rather than the page's `--cui-fg`. `cui-empty` is an invitation, not a status report.

*Cards*

```html
<div class="cui-stack-v">
  <div class="cui-card cui-card--hero cui-stack-h">
    <span class="cui-tile"><svg><!-- any icon --></svg></span>
    <span><b>Featured app</b><br><span class="cui-muted">Support carries the hero</span></span>
  </div>
  <div class="cui-card cui-card--interactive cui-stack-h">
    <span class="cui-tile"></span>
    <span><b>Conjure Recipes</b><br><span class="cui-muted">Third note on the icon tile</span></span>
  </div>
  <div class="cui-empty">
    <b class="cui-muted">No recipes yet</b>
    <p class="cui-dim" style="margin:4px 0 10px">Anything you create shows up here.</p>
    <button class="cui-button cui-button--primary cui-button--sm">Create one</button>
  </div>
</div>
```

*Modal*

```html
<div class="cui-modal-backdrop" style="position:static;padding:22px;display:flex;justify-content:center">
  <div class="cui-modal" style="position:static;transform:none;max-width:330px">
    <b>Delete this recipe?</b>
    <p class="cui-muted" style="margin:7px 0 14px">This removes it from the store. People who already installed it keep their copy.</p>
    <div class="cui-stack-h" style="justify-content:flex-end">
      <button class="cui-button cui-button--ghost cui-button--sm">Cancel</button>
      <button class="cui-button cui-button--danger cui-button--sm">Delete</button>
    </div>
  </div>
</div>
```

## Surface idioms

Named patterns that recur across the shell. Reach for these by name.

### Featured surface

A card that is visually promoted above its siblings. It does not use a gradient any more; it uses the theme's featured tokens, which is what lets Summer render it lighter than its ground while every other theme renders it darker.

```css
.thing-hero {
  background: var(--cui-hero-bg);
  border: 1px solid var(--cui-hero-line);
  color: var(--cui-hero-fg);
  border-radius: var(--cui-radius-lg);
}
.thing-hero .caption { color: var(--cui-hero-mute); }
```

The rule that matters: **text inside a featured surface reads `--cui-hero-fg`, not `--cui-fg`.** Inheriting the page's foreground is the bug that puts light text on Summer's coral card. Use the `cui-card--hero` primitive and this is handled for you.

### Icon tile

An app or category icon inside a card. The hue is carried by a translucent tile and a small glyph, not by a solid block of colour.

```css
.thing-tile {
  background: var(--cui-tile);
  border: 1px solid var(--cui-tile-line);
  border-radius: var(--cui-radius);
}
.thing-tile svg { fill: var(--cui-glyph); }
```

This exists because a solid lead-hue rectangle at icon size reads as a warning light. Brightness was not the problem; area was.

### Layered surface with a hairline

Cards, sidebars and preview panes are layers of the same material, separated by a step on the ground ladder and a hairline, not by heavy borders or drop shadows.

```css
.thing-panel {
  background: var(--cui-bg-1);
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-radius);
}
```

Older shell code writes this as `rgba(255,255,255,0.025)`. Do not copy that: a white wash is invisible on a light flavor. Use the ground tokens.

### Pill-shaped active state

When an option is selected, switch its radius to `var(--cui-radius-pill)` and fill it with the lead hue.

```css
.thing-option--active {
  border-radius: var(--cui-radius-pill);
  background: var(--cui-accent);
  color: var(--cui-on-accent);
}
```

### Card hover lift

`transform: translateY(-1px)` plus `box-shadow: var(--cui-shadow)`, over `--cui-duration-fast`. The lift is gentle. An optional 3px left stripe in `--cui-accent` via `::before` is the bold version, for the one card that deserves it.

## Voice

What Modern Whimsy sounds and feels like, beyond the palette.

**Wand glyph, not warning triangle.** Errors surface as soft rounded cards with a gentle bounce-in and a small wand icon. The error is still legible and dismissible; the framing is "something went sideways" rather than "DANGER."

**Friendly empty states.** An empty state is an invitation, not a status report. "Nothing here yet, start a chat" beats "No items to display." Pair it with a single call to action, not a wall of help text.

**Structural labels announce themselves.** Uppercase with 0.14em tracking marks something as structure rather than content. Use it on lane prefixes and section dividers, not on buttons.

**Hover is a wink, not a flash.** 120ms. Faster feels cheap, slower feels sluggish.

**Icons are Font Awesome, never emoji.** Inline the solid SVG path.

## Consuming the library

The library ships a built CSS bundle at `dist/ui.css`. ConjureOS serves it at `/_conjureos/ui/v1.css`. Apps opt in by linking the stylesheet and wrapping their content.

**Mode 1: tokens only.**

```html
<link rel="stylesheet" href="/_conjureos/ui/v1.css" />
<body class="cui-tokens">
  <!-- CSS variables only; style your own components -->
</body>
```

**Mode 2: tokens plus primitives.** The default for generated apps.

```html
<link rel="stylesheet" href="/_conjureos/ui/v1.css" />
<body class="cui-ui">
  <!-- use cui-* classes -->
</body>
```

**Opt out.** Omit the wrapper class. The stylesheet has no rendering effect without `.cui-tokens` or `.cui-ui`, so it is safe to leave the `<link>` in place.

**Theme attributes go on `<html>`, not on the wrapper.** The wrapper class turns the system on; `data-theme` and `data-flavor` choose which palette it resolves to. Putting them on `<html>` means the page background, form controls and scrollbars all follow too.

For the full distribution model, see [PHASE_21_DESIGN.md](../ConjureOS/PHASE_21_DESIGN.md) in the ConjureOS repo.

## Known drift

The ConjureOS shell predates the token system and deviates from it in known ways. Listed so contributors do not propagate them.

- **Hard-coded dark hex** (`#14161e`, `#16161c`, `#0a0a0c`) in older shell components instead of the ground tokens. These pin those components to a dark purple that no longer exists in any palette.
- **Hand-rolled `rgba(124,106,247,X)` opacities** appear 50+ times across the shell. That purple is the retired brand accent; every one of them is now a literal with no theme behind it.
- **`rgba(255,255,255,0.025)` surfaces** work on dark and vanish on light.
- **Hero negative-margin magic number** (`-24px -24px 16px`) repeated across at least three hero headers. A `--cui-hero-inset` token would let the inset adapt to a panel's real padding.

The first two are now migration work rather than tidying: the shell will not theme correctly until they are tokenized. Tracked separately; do not add to the list.

## For agents

This section is inline-imported into the ConjureOS Dev agent's system prompt. Keep it self-contained, prescriptive, and dense; do not depend on prose from the sections above.

CONJUREOS UI TOKENS, default visual language (Modern Whimsy):

Generated apps should LOOK like ConjureOS unless the user explicitly asks for a different style ("make it look like a Game Boy", "retro typewriter feel", "all hot pink"). The shell serves a stylesheet at `/_conjureos/ui/v1.css` with semantic CSS variables and primitive classes.

To opt in (default for almost every app), add this `<link>` to `<head>` and wrap `<body>` with `cui-ui`:

```html
<head>
  <link rel="stylesheet" href="/_conjureos/ui/v1.css" />
</head>
<body class="cui-ui">
  ...
</body>
```

THEMES. The stylesheet carries nine palettes (`cnj` Conjure, `hal` Halloween, `fal` Fall, `win` Winter, `spr` Spring, `sum` Summer, `xms` Christmas, `est` Easter, `cnd` Candyland) in two flavors (`dark`, `light`). Set them as attributes on `<html>`:

```html
<html lang="en" data-theme="spr" data-flavor="dark">
```

**Do not set either attribute unless the user asked for a specific look.** With both absent the app inherits the Conjure palette and follows the browser's light/dark preference, which is the correct default. Set `data-theme` when the app has an obvious seasonal or subject fit the user asked for. Never set `data-flavor` just to force dark; that takes the choice away from the user.

If the app should follow the OS theme and offer its own picker, load the optional resolver and give the app a settings control with a "Use ConjureOS theme" option plus System / Dark / Light:

```html
<script src="/_conjureos/ui/theme.js"></script>
<script>ConjureTheme.init({ theme: "spr" });</script>
```

`ConjureTheme.setTheme(id | null)`, `.setFlavor("dark" | "light" | null)`, `.THEMES`, `.subscribe(fn)`. `null` means "follow the level above."

NEVER hardcode a colour. Every hex literal you write will be wrong in eight of the nine themes. This includes `color: white` on a filled button: use `var(--cui-on-accent)`.

Key tokens (most-reached-for):
- `var(--cui-bg)` / `--cui-bg-1` / `--cui-bg-2` / `--cui-bg-3`, ground layers, deepest to highest
- `var(--cui-fg)` / `--cui-fg-mute` / `--cui-fg-dim`, the only three text tiers
- `var(--cui-accent)` the lead hue as a FILL; `var(--cui-on-accent)` the label ON that fill
- `var(--cui-link)` the lead hue as TEXT. Different value from `--cui-accent`; not interchangeable.
- `var(--cui-support)` / `--cui-support-text` / `--cui-support-tint` / `--cui-support-line`, second hue
- `var(--cui-third)` / `--cui-third-text` / `--cui-third-tint` / `--cui-third-line`, third hue, use sparingly
- `var(--cui-hero-bg)` / `--cui-hero-fg` / `--cui-hero-mute` / `--cui-hero-line`, the featured card. Text on it MUST use `--cui-hero-fg`, not `--cui-fg`.
- `var(--cui-tile)` / `--cui-tile-line` / `--cui-glyph`, icon tiles inside a featured card
- `var(--cui-success)` / `var(--cui-warning)` / `var(--cui-error)` / `var(--cui-info)` plus `var(--cui-onstatus)` for labels on them
- `var(--cui-border)` hairline; `var(--cui-border-strong)` hover
- `var(--cui-radius)` 10px; `var(--cui-radius-pill)` 999px; `var(--cui-space-3)` 12px; `var(--cui-duration-fast)` 120ms

Primitive classes (compose these into your UI):
<!-- AUTOGEN:primitives -->
- Layout helpers: `cui-stack-v`, `cui-stack-h`, `cui-stack-h--between`
- Card: `cui-card`, `cui-card--interactive`, `cui-card--hero`, `cui-muted`, `cui-dim`
- Button: `cui-button`, `cui-button--primary`, `cui-button--ghost`, `cui-button--pill`, `cui-button--secondary`, `cui-button--danger`, `cui-button--warning`, `cui-button--info`, `cui-button--link`
- Pill (status / tag): `cui-pill`, `cui-pill--success`, `cui-pill--warn`, `cui-pill--error`, `cui-pill--danger`, `cui-pill--info`, `cui-pill--support`, `cui-pill--third`, `cui-pill--neutral`, `cui-pill--plain`
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
- Button size + icon variants: `cui-button--sm`, `cui-button--lg`, `cui-button--icon`
- Button group: `cui-button-group`, `cui-button`
- Textarea: `cui-textarea`
- Checkbox + radio: `cui-choice`, `cui-checkbox`, `cui-radio`
- Help text: `cui-help`, `cui-help--error`, `cui-input--error`, `cui-textarea--error`, `cui-select--error`
- Alert: `cui-alert`, `cui-alert--success`, `cui-alert--warning`, `cui-alert--error`, `cui-alert--info`
- Toast: `cui-toast`
- Progress: `cui-progress`, `cui-progress__bar`
- Spinner: `cui-spinner`
- Skeleton: `cui-skeleton`
- Table: `cui-table`
- Avatar: `cui-avatar`, `cui-avatar-stack`
- Stat: `cui-stat`
- Breadcrumb: `cui-breadcrumb`
- Menu: `cui-menu`, `cui-menu-item`, `cui-menu-item--active`, `cui-menu-sep`, `cui-menu-key`
- Pagination: `cui-pagination`, `cui-is-current`
- Tile: `cui-tile`, `cui-card--hero`
- Empty state: `cui-empty`
<!-- /AUTOGEN -->

Signature idioms (reach for these when the situation fits):
- Featured surface: `background: var(--cui-hero-bg); border: 1px solid var(--cui-hero-line); color: var(--cui-hero-fg)`. Use `cui-card--hero` and it is handled.
- Icon tile: `background: var(--cui-tile)` with the glyph in `var(--cui-glyph)`. Never a solid block of `--cui-accent` at icon size.
- Layered surface: `background: var(--cui-bg-1); border: 1px solid var(--cui-border)`. Not a white rgba wash; that vanishes on light flavors.
- Pill-shaped active state: switch radius to `var(--cui-radius-pill)` and fill with `var(--cui-accent)`, label `var(--cui-on-accent)`.
- Card hover lift: `translateY(-1px)` plus `var(--cui-shadow)` over `var(--cui-duration-fast)`.
- Hover and focus transitions: 120ms with `var(--cui-ease)`. Faster feels cheap; slower feels sluggish.

Voice:
- Errors are soft rounded cards with a wand glyph, not warning triangles.
- Empty states are invitations ("Nothing here yet, start a chat"), not status reports.
- Icons are Font Awesome solid SVG paths, inlined. Never emoji.
- Reserve bouncy easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for moments that need character. Default to `var(--cui-ease)`.

Example, a small form using primitives:
```html
<div class="cui-card cui-stack-v">
  <h2 class="cui-heading">Add a recipe</h2>
  <label class="cui-field">
    <span class="cui-field__label">Name</span>
    <input class="cui-input" />
  </label>
  <div class="cui-stack-h cui-stack-h--between">
    <button class="cui-button cui-button--ghost">Cancel</button>
    <button class="cui-button cui-button--primary cui-button--pill">Save</button>
  </div>
</div>
```

Example, a fully-styled simple counter. This is what "simple app" looks like done right; the buttons and heading use cui-* primitives even though the JS is six lines:
```html
<!doctype html>
<!-- Generated by ConjureOS, https://conjureos.com -->
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
      font-size: var(--cui-text-3xl);
      font-weight: var(--cui-weight-bold);
      color: var(--cui-link);
      line-height: 1;
      margin: 16px 0 24px;
    }
    .counter-label {
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--cui-fg-mute);
      font-size: var(--cui-text-sm);
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
    const value = document.getElementById("value");
    const draw = () => { value.textContent = n; };
    document.getElementById("inc").onclick = () => { n++; draw(); };
    document.getElementById("reset").onclick = () => { n = 0; draw(); };
  </script>
</body>
</html>
```
