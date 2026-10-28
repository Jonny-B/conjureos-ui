#!/usr/bin/env node
/**
 * Regression tests for src/ui.css, the primitive component classes.
 *
 * Plain Node, no test framework and no browser: the package has no
 * dependencies and playwright is not one of them. So instead of rendering, this
 * reads the stylesheet and checks the three things a render would have shown:
 * which rules exist, what they declare, and which of two rules wins the cascade
 * (higher specificity, then later in the file). That is enough to pin the bugs
 * below, because every one of them is a rule that LOSES the cascade, or one that
 * is missing.
 *
 * It reads src/ui.css, not dist/ui.css, so it does not depend on a build having
 * run. dist is src/tokens.css + src/ui.css concatenated, so the rules are the same.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, "..", "src", "ui.css"), "utf-8");

let failures = 0;
const ok = (cond, what) => {
  if (cond) return;
  failures++;
  console.error(`  FAIL  ${what}`);
};

/**
 * Flatten the stylesheet into style rules in source order. Each is
 * { selectors, body, media, order }; `media` is the enclosing @media prelude, if
 * any. @keyframes blocks are skipped, since their `from` / `to` are not selectors.
 */
function parse(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  const matchClose = (open) => {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}" && --depth === 0) return i;
    }
    throw new Error("unbalanced braces in ui.css");
  };
  const walk = (from, to, media) => {
    let pos = from;
    while (pos < to) {
      const open = text.indexOf("{", pos);
      if (open === -1 || open >= to) break;
      const prelude = text.slice(pos, open).trim();
      const close = matchClose(open);
      if (prelude.startsWith("@media")) {
        walk(open + 1, close, prelude);
      } else if (!prelude.startsWith("@")) {
        rules.push({
          selectors: prelude.split(",").map((s) => s.trim().replace(/\s+/g, " ")),
          body: text.slice(open + 1, close),
          media,
          order: rules.length,
        });
      }
      pos = close + 1;
    }
  };
  walk(0, text.length, null);
  return rules;
}

const rules = parse(css);

/** The rule that declares `selector` (exact, whitespace-normalised) and, if given, sits in `media`. */
const find = (selector, { media = null } = {}) =>
  rules.find((r) => r.media === media && r.selectors.includes(selector));

/** The value a rule gives `prop`, or undefined. */
const decl = (rule, prop) => {
  if (!rule) return undefined;
  const m = rule.body.match(new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`));
  return m ? m[1].trim() : undefined;
};

/** [ids, classes + pseudo-classes + attributes, elements]. Enough for this file's selectors. */
function specificity(selector) {
  const s = selector.replace(/::?[\w-]+\([^)]*\)/g, ":x");
  return [
    (s.match(/#[\w-]+/g) || []).length,
    (s.match(/\.[\w-]+|(?<!:):(?!:)[\w-]+|\[[^\]]+\]/g) || []).length,
    (s.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) || []).length + (s.match(/::[\w-]+/g) || []).length,
  ];
}

/** Does rule `a` (matching selector `sa`) beat rule `b` (matching `sb`) when both apply? */
function beats(a, sa, b, sb) {
  const x = specificity(sa);
  const y = specificity(sb);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return a.order > b.order;
}

// ---- pkg-ui#1: danger / warning / info keep their fill on hover ----
//
// `.cui-button:hover` sets a neutral background and border. The three variants
// only set `filter` in their own :hover rule, so the neutral grey replaced the
// fill and left an --cui-onstatus label (white or near-black) on it.

const baseHover = find(".cui-ui .cui-button:hover");
ok(baseHover, "base .cui-button:hover rule exists");

for (const [variant, fill] of [["danger", "--cui-error"], ["warning", "--cui-warning"], ["info", "--cui-info"]]) {
  const rest = find(`.cui-ui .cui-button--${variant}`);
  const sel = `.cui-ui .cui-button--${variant}:hover`;
  const hover = find(sel);
  ok(rest, `.cui-button--${variant} rule exists`);
  ok(hover, `${sel} rule exists`);
  ok(
    decl(hover, "background") === `var(${fill})`,
    `${sel} restates the fill (background: var(${fill})), got ${decl(hover, "background")}`
  );
  ok(
    decl(hover, "border-color") === `var(${fill})`,
    `${sel} restates the border (border-color: var(${fill})), got ${decl(hover, "border-color")}`
  );
  ok(
    decl(hover, "color") === decl(rest, "color"),
    `${sel} keeps the label colour ${decl(rest, "color")}, got ${decl(hover, "color")}`
  );
  ok(
    hover && baseHover && beats(hover, sel, baseHover, ".cui-ui .cui-button:hover"),
    `${sel} beats .cui-button:hover in the cascade`
  );
}

// ---- pkg-ui#2: sized primitives are border-box ----
//
// Their fixed sizes (a 36x20 toggle track, a 16px checkbox, a width:100% input
// with padding) only come out right under border-box, and the library never set
// it. A bare <input> / <textarea> / <a> is content-box, so the input overflowed
// its container by padding + border and the toggle track measured 38x22.

const sized = [
  ".cui-ui .cui-input",
  ".cui-ui .cui-textarea",
  ".cui-ui .cui-select",
  ".cui-ui .cui-toggle__track",
  ".cui-ui .cui-checkbox",
  ".cui-ui .cui-radio",
  ".cui-ui .cui-tile",
  ".cui-ui .cui-avatar",
  ".cui-ui .cui-pagination > *",
  ".cui-ui .cui-modal",
  ".cui-ui .cui-button--icon",
];
for (const sel of sized) {
  const withBoxSizing = rules.filter((r) => r.media === null && r.selectors.includes(sel) && decl(r, "box-sizing"));
  ok(withBoxSizing.length > 0, `${sel} declares box-sizing`);
  ok(
    withBoxSizing.every((r) => decl(r, "box-sizing") === "border-box"),
    `${sel} box-sizing is border-box`
  );
}

// Not a blanket reset. A `.cui-ui *` rule would re-lay-out every element an app
// puts inside the wrapper, which is a behaviour change to the published API.
ok(
  !rules.some((r) => r.selectors.some((s) => /^\.cui-ui\s+\*(?:::\w+)?$/.test(s)) && decl(r, "box-sizing")),
  "no .cui-ui * blanket box-sizing rule"
);

// ---- pkg-ui#4: textarea is 16px on touch ----
//
// The coarse-pointer block exists so iOS Safari does not zoom on focus (any
// control under 16px). It listed input and select only. The textarea's base rule
// sits far below that block and ties on specificity, so it needs its own block
// AFTER the base rule.

const textareaBase = find(".cui-ui .cui-textarea");
const textareaTouch = find(".cui-ui .cui-textarea", { media: "@media (pointer: coarse)" });
ok(textareaBase, "base .cui-textarea rule exists");
ok(textareaTouch, ".cui-textarea has a rule inside @media (pointer: coarse)");
ok(decl(textareaTouch, "font-size") === "16px", `touch .cui-textarea font-size is 16px, got ${decl(textareaTouch, "font-size")}`);
ok(
  textareaTouch && textareaBase && beats(textareaTouch, ".cui-ui .cui-textarea", textareaBase, ".cui-ui .cui-textarea"),
  "touch .cui-textarea rule beats the base .cui-textarea font-size (placed after it)"
);

// ---- pkg-ui#5: the active item keeps its look on hover ----
//
// `.cui-tab--active:hover` already guarded this. The chip, pagination and menu
// item did not, so hovering the current one swapped its active fill for the
// generic hover fill.

const activeCases = [
  // [active selector, generic hover selector it must beat, props the active rule sets that hover must keep]
  [".cui-ui .cui-chip--active", ".cui-ui .cui-chip:hover", ["background", "color"]],
  [".cui-ui .cui-pagination > .cui-is-current", ".cui-ui .cui-pagination > *:hover", ["background", "color"]],
  [".cui-ui .cui-menu-item--active", ".cui-ui .cui-menu-item:hover", ["background"]],
];
for (const [activeSel, genericHoverSel, props] of activeCases) {
  const active = find(activeSel);
  const generic = find(genericHoverSel);
  const sel = `${activeSel}:hover`;
  const hover = find(sel);
  ok(active, `${activeSel} rule exists`);
  ok(generic, `${genericHoverSel} rule exists`);
  ok(hover, `${sel} rule exists`);
  for (const prop of props) {
    ok(
      hover && decl(hover, prop) === decl(active, prop),
      `${sel} restates ${prop}: ${decl(active, prop)}, got ${decl(hover, prop)}`
    );
  }
  ok(
    hover && generic && beats(hover, sel, generic, genericHoverSel),
    `${sel} beats ${genericHoverSel} in the cascade`
  );
}

if (failures > 0) {
  console.error(`\nui-css.test: ${failures} failure(s)`);
  process.exit(1);
}
console.log("ui-css.test: all passed");
