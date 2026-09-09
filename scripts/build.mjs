#!/usr/bin/env node
/**
 * Build script for @conjureos/ui.
 *
 * v1 is deliberately tiny: concatenate src/tokens.css + src/ui.css
 * into dist/ui.css with a version header. No PostCSS pipeline yet —
 * the source is already vanilla CSS and small enough that minification
 * isn't worth the dependency cost.
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
const styleGuideFile = resolve(repo, "MODERN_WHIMSY.md");

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
    const classRe = /^\s*\.cui-ui\s+\.(cui-[\w-]+)/gm;
    const seen = new Set();
    const classes = [];
    for (const m of body.matchAll(classRe)) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        classes.push(m[1]);
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
  const block =
    `<!-- AUTOGEN:primitives -->\n` +
    formatPrimitivesMd(sections) +
    `\n<!-- /AUTOGEN -->`;
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
    ` * Built ${new Date().toISOString()}\n` +
    ` * MIT License — https://github.com/Jonny-B/conjureos-ui\n` +
    ` */\n\n`;

  const out = header + tokens + "\n\n" + ui;

  await mkdir(distDir, { recursive: true });
  await writeFile(distFile, out, "utf-8");

  console.log(`[conjureos-ui] built v${pkg.version} → ${distFile} (${out.length} bytes)`);

  await updateStyleGuide(extractPrimitives(ui));
};

const watchMode = process.argv.includes("--watch");

await build();

if (watchMode) {
  console.log("[conjureos-ui] watching src/ for changes…");
  watch(srcDir, { recursive: false }, async (_event, filename) => {
    if (!filename || !filename.endsWith(".css")) return;
    try {
      await build();
    } catch (err) {
      console.error("[conjureos-ui] build failed:", err.message);
    }
  });
}
