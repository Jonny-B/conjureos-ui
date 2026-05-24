# @conjureos/ui

ConjureOS design tokens and primitive UI classes — the **Modern Whimsy** visual language packaged as a versioned CSS bundle.

This is the design library AI-generated ConjureOS apps consume so they visually feel like ConjureOS by default. Lives in its own repo so the visual language can evolve on its own cadence; built into ConjureOS as a dependency.

## Quick start

Inside a ConjureOS app's `index.html`:

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

- `<body class="cui-tokens">` — CSS custom properties only. Bring your own classes; reach for `var(--cui-accent)` etc.
- `<body class="cui-ui">` — Tokens + primitive classes (`.cui-card`, `.cui-button`, `.cui-pill`, `.cui-chip`, `.cui-input`, `.cui-stack-v`, `.cui-stack-h`, `.cui-heading`, `.cui-divider`, ...).

Apps that want to go off-brand entirely just omit the wrapper class.

## Token reference (the most-reached-for ones)

| Token | Value | Use |
|---|---|---|
| `--cui-accent` | `#7c6af7` | Primary accent (buttons, focus rings) |
| `--cui-accent-soft` | `#a5b4fc` | Secondary accent (icons, captions) |
| `--cui-bg` | `#0b0e14` | Root canvas |
| `--cui-bg-1` | `#11151d` | Cards |
| `--cui-bg-2` | `#1a1f2b` | Hover / modal surface |
| `--cui-fg` | `#e5e9f0` | Primary text |
| `--cui-fg-mute` | `#9ca3af` | Secondary text |
| `--cui-radius` | `10px` | Default corner |
| `--cui-radius-pill` | `999px` | Pill shapes |
| `--cui-accent-gradient` | `linear-gradient(135deg, ...)` | Hero surface backing |

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

```
npm run build
```

Produces `dist/ui.css` — a single concatenated stylesheet with a version header. v1 keeps the build dead simple; PostCSS / minification can layer in when the surface grows.

```
npm run dev
```

Same as `build` but re-runs on source changes for round-trips during local dev.

## Versioning

The major version is reflected in the built filename ConjureOS serves: `/_conjureos/ui/v1.css`. Breaking changes ship as a parallel `v2.css` so existing apps don't regress. Minor + patch updates land within the same major-version URL.

## License

MIT — see `LICENSE`.
