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

const pkg = JSON.parse(await readFile(resolve(repo, "package.json"), "utf-8"));

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
