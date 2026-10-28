#!/usr/bin/env node
/**
 * Source test for src/tokens.css: where flavor-sensitive tokens are resolved.
 *
 * The file header's rule is that a token written as
 * `var(--cui-d, dark) var(--cui-l, light)` is substituted on the element that
 * DECLARES it, so it only follows a nested data-flavor if the declaration sits
 * in the 1b resolution block, which re-runs on every [data-theme] and
 * [data-flavor] element. The `.cui-tokens, .cui-ui` block is the wrong place:
 * anything resolved there is frozen on the .cui-ui element and inherited as a
 * finished value by every descendant, including a nested `data-flavor="light"`
 * div. The two shadow tokens were left there when the rest moved.
 *
 * Plain Node, no framework, reads the SOURCE file (no build needed). A rendered
 * check needs a browser, which the package deliberately does not depend on.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, "..", "src", "tokens.css"), "utf-8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

let failures = 0;
const ok = (cond, what) => {
  if (cond) return;
  failures++;
  console.error(`  FAIL  ${what}`);
};

/** Every { selector, body } rule in the file, descending into @media. */
function rules(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
      j++;
    }
    const selector = text.slice(i, open).trim();
    const body = text.slice(open + 1, j - 1);
    if (selector.startsWith("@")) out.push(...rules(body));
    else out.push({ selector, body });
    i = j;
  }
  return out;
}

const all = rules(css);
const resolution = all.find(
  (r) => /(^|,)\s*:root\s*,/.test(r.selector) && /\[data-flavor\]/.test(r.selector) && /\[data-theme\]/.test(r.selector),
);
ok(resolution, "found the 1b resolution block (:root, [data-theme], [data-flavor], ...)");

// 1. Nothing outside the resolution block may read the flavor pair.
const flavorRead = /var\(\s*--cui-[dl]\s*,/;
for (const r of all) {
  if (r === resolution) continue;
  ok(
    !flavorRead.test(r.body),
    `"${r.selector.replace(/\s+/g, " ")}" resolves var(--cui-d/--cui-l) outside the 1b block, so a nested data-flavor cannot re-resolve it`,
  );
}

// 2. The flavor-aware shadows must live in it, with both halves.
if (resolution) {
  for (const t of ["--cui-shadow-accent", "--cui-shadow-lg"]) {
    const decl = resolution.body.match(new RegExp(`${t}\\s*:([^;]+);`));
    ok(decl, `${t} is declared in the 1b resolution block`);
    ok(decl && /var\(\s*--cui-d\s*,/.test(decl[1]) && /var\(\s*--cui-l\s*,/.test(decl[1]),
      `${t} in the 1b block carries both the dark and the light half`);
  }
}

// 3. The flavor-agnostic shadows stay where they are; they need no re-resolving.
const base = all.find((r) => /(^|,)\s*\.cui-ui\s*$/.test(r.selector) && /--cui-shadow-sm\s*:/.test(r.body));
ok(base && /--cui-shadow\s*:/.test(base.body), "--cui-shadow-sm and --cui-shadow remain in the .cui-tokens/.cui-ui block");
ok(base && !/--cui-shadow-(accent|lg)\s*:/.test(base.body),
  "--cui-shadow-accent / --cui-shadow-lg are not redeclared in the .cui-tokens/.cui-ui block (it comes later and would re-freeze them)");

if (failures) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("tokens-resolution: ok");
