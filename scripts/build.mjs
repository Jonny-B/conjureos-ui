#!/usr/bin/env node
/**
 * Build script for @conjureos/ui.
 *
 * v1 is deliberately tiny: concatenate src/tokens.css + src/ui.css
 * into dist/ui.css with a version header. No PostCSS pipeline yet;
 * the source is already vanilla CSS and small enough that minification
 * is not worth the dependency cost.
 *
 * `--watch` re-runs on source change for local dev round-trips. Uses
 * Node's fs.watch which is good-enough on Windows + macOS; for Linux
 * users it falls through to polling if inotify is exhausted.
 *
 * Add postcss / lightningcss + a real minifier when the CSS surface
 * outgrows hand-management.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { watch } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const srcDir = resolve(repo, "src");
const distDir = resolve(repo, "dist");
const distFile = resolve(distDir, "ui.css");
const themeSrc = resolve(srcDir, "theme.js");
const themeOut = resolve(distDir, "theme.js");
const styleGuideFile = resolve(repo, "MODERN_WHIMSY.md");
const designSystemSrc = resolve(repo, "design-system.html");
const designSystemOut = resolve(distDir, "design-system.html");

const pkg = JSON.parse(await readFile(resolve(repo, "package.json"), "utf-8"));

/**
 * Walk ui.css and group primitive classes under their section headers.
 * A section header looks like `/* ---- Section Name ---- *\/` and a
 * primitive class is `.cui-ui .cui-NAME` (we capture NAME). Classes that
 * appear in multiple selectors per section are deduplicated; order matches
 * declaration order. Sections with no primitive classes (e.g. a comment
 * block that only contains tokens or keyframes) are dropped.
 *
 * Output: [{ name: "Card", classes: ["cui-card", "cui-card--interactive"] }, ...]
 *
 * This is consumed by the AUTOGEN block in MODERN_WHIMSY.md so the
 * Dev agent's prompt never drifts from the actual primitives shipped.
 */
const extractPrimitives = (uiCss) => {
  const sectionRe = /\/\*\s*-{3,}\s*(.+?)\s*-{3,}\s*\*\//g;
  const headers = [...uiCss.matchAll(sectionRe)];
  const sections = [];
  for (let i = 0; i < headers.length; i++) {
    const name = headers[i][1].trim();
    const start = headers[i].index + headers[i][0].length;
    const end = i + 1 < headers.length ? headers[i + 1].index : uiCss.length;
    const body = uiCss.slice(start, end);
    // Take EVERY cui- class in the selector, not just the one directly
    // after `.cui-ui`. A rule like `.cui-ui .cui-pagination > .cui-is-current`
    // defines two primitives, and the old pattern dropped the second, so it
    // never reached the agent appendix.
    const selectorRe = /^\s*\.cui-ui\s+([^{}]+)\{/gm;
    const inSelector = /\.(cui-[\w-]+)/g;
    const seen = new Set();
    const classes = [];
    for (const m of body.matchAll(selectorRe)) {
      for (const c of m[1].matchAll(inSelector)) {
        if (c[1] === "cui-ui") continue;
        if (!seen.has(c[1])) {
          seen.add(c[1]);
          classes.push(c[1]);
        }
      }
    }
    if (classes.length > 0) sections.push({ name, classes });
  }
  return sections;
};

const formatPrimitivesMd = (sections) =>
  sections
    .map((s) => `- ${s.name}: ${s.classes.map((c) => `\`${c}\``).join(", ")}`)
    .join("\n");

/**
 * Inject the auto-generated primitive list into MODERN_WHIMSY.md by
 * replacing whatever sits between the AUTOGEN markers. Idempotent: a
 * no-op rebuild produces no diff. If the markers are missing the function
 * warns + skips so a misconfigured style guide doesn't break the css build.
 */
const updateStyleGuide = async (sections) => {
  let md;
  try {
    md = await readFile(styleGuideFile, "utf-8");
  } catch (err) {
    console.warn(`[conjureos-ui] MODERN_WHIMSY.md not found; skipping autogen.`);
    return;
  }
  const markerRe = /<!--\s*AUTOGEN:primitives\s*-->[\s\S]*?<!--\s*\/AUTOGEN\s*-->/;
  if (!markerRe.test(md)) {
    console.warn(`[conjureos-ui] AUTOGEN markers not found in MODERN_WHIMSY.md; skipping.`);
    return;
  }
  // The doc can sit in the tree with CRLF, so match whatever it already uses.
  const eol = md.includes("\r\n") ? "\r\n" : "\n";
  const block = [
    `<!-- AUTOGEN:primitives -->`,
    formatPrimitivesMd(sections),
    `<!-- /AUTOGEN -->`,
  ]
    .join(eol)
    .replace(/(?<!\r)\n/g, eol);
  const next = md.replace(markerRe, block);
  if (next === md) {
    console.log(`[conjureos-ui] MODERN_WHIMSY.md primitives unchanged.`);
    return;
  }
  await writeFile(styleGuideFile, next, "utf-8");
  console.log(`[conjureos-ui] MODERN_WHIMSY.md primitives autogen updated (${sections.length} sections).`);
};

const build = async () => {
  const tokens = await readFile(resolve(srcDir, "tokens.css"), "utf-8");
  const ui = await readFile(resolve(srcDir, "ui.css"), "utf-8");

  const header =
    `/*!\n` +
    ` * @conjureos/ui v${pkg.version}\n` +
    ` * MIT License, https://github.com/Jonny-B/conjureos-ui\n` +
    ` */\n\n`;

  const out = header + tokens + "\n\n" + ui;

  await mkdir(distDir, { recursive: true });
  await writeFile(distFile, out, "utf-8");

  console.log(`[conjureos-ui] built v${pkg.version} → ${distFile} (${out.length} bytes)`);

  // The optional theme resolver. Copied rather than bundled: it is a plain
  // script with no imports, and apps load it with a <script> tag.
  let theme = null;
  try {
    theme = await readFile(themeSrc, "utf-8");
  } catch {
    console.warn("[conjureos-ui] src/theme.js not found; skipping theme resolver.");
  }
  if (theme !== null) {
  const themeHeader =
    `/*!
` +
    ` * @conjureos/ui theme resolver v${pkg.version}
` +
    ` * MIT License, https://github.com/Jonny-B/conjureos-ui
` +
    ` */
`;
    await writeFile(themeOut, themeHeader + theme, "utf-8");
    console.log(`[conjureos-ui] built theme.js → ${themeOut} (${theme.length} bytes)`);
  }

  // The interactive design-system reference. The source file, opened
  // directly from the repo root, links `dist/ui.css` and `dist/theme.js`
  // so it works with zero server, same as demo.html. The build rewrites
  // those two hrefs to `v1.css` / `theme.js` (no `dist/` prefix), because
  // the emitted copy ships beside those files at ConjureOS's served
  // /_conjureos/ui/ path rather than beside a dist/ folder. Also stamps the
  // version into the page's own header.
  let designSystem = null;
  try {
    designSystem = await readFile(designSystemSrc, "utf-8");
  } catch {
    console.warn("[conjureos-ui] design-system.html not found; skipping.");
  }
  if (designSystem !== null) {
    const rewritten = designSystem
      .replace('href="dist/ui.css"', 'href="v1.css"')
      .replace('src="dist/theme.js"', 'src="theme.js"')
      .replace("%%CUI_VERSION%%", pkg.version);
    await writeFile(designSystemOut, rewritten, "utf-8");
    console.log(`[conjureos-ui] built design-system.html → ${designSystemOut} (${rewritten.length} bytes)`);
  }

  // A primitive that exists but never reaches the list is exactly the bug
  // the extractor just had, so say so rather than silently under-report.
  const sections = extractPrimitives(ui);
  const listed = new Set(sections.flatMap((s) => s.classes));
  const all = new Set(
    [...ui.matchAll(/^\s*\.cui-ui\s+[^{}]*?\.(cui-[\w-]+)/gm)]
      .map((m) => m[1])
      .filter((c) => c !== "cui-ui")
  );
  const dropped = [...all].filter((c) => !listed.has(c));
  if (dropped.length > 0) {
    console.warn(`[conjureos-ui] WARNING: defined but unlisted: ${dropped.join(", ")}`);
  }

  await updateStyleGuide(sections);
};

const watchMode = process.argv.includes("--watch");

await build();

if (watchMode) {
  console.log("[conjureos-ui] watching src/ for changes…");
  watch(srcDir, { recursive: false }, async (_event, filename) => {
    if (!filename || !(filename.endsWith(".css") || filename.endsWith(".js"))) return;
    try {
      await build();
    } catch (err) {
      console.error("[conjureos-ui] build failed:", err.message);
    }
  });
}
