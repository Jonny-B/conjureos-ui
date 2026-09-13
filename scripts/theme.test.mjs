#!/usr/bin/env node
/**
 * Tests for dist/theme.js, the theme resolver.
 *
 * Plain Node, no test framework: the package has no runtime dependencies and
 * this is the only JavaScript it ships, so a harness would be most of the
 * weight of the thing it tests. Run `npm run build` first — this exercises the
 * BUILT file, which is what apps load.
 *
 * The resolver is a browser script, so each case gets a hand-built global with
 * just the four things it touches: a document element that records attributes,
 * a localStorage, a location, and a message listener. That also makes the
 * assertions read as "what ends up on <html>", which is the whole contract.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, "..", "dist", "theme.js"), "utf-8");

let failures = 0;
const ok = (cond, what) => {
  if (cond) return;
  failures++;
  console.error(`  FAIL  ${what}`);
};

/** A minimal browser-ish global plus handles for driving it. */
function makeEnv() {
  const attrs = {};
  const store = {};
  let onMessage = null;
  const g = {
    document: {
      documentElement: {
        setAttribute: (k, v) => { attrs[k] = v; },
        removeAttribute: (k) => { delete attrs[k]; },
      },
    },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = v; },
    },
    location: { search: "" },
    URLSearchParams,
    addEventListener: (type, fn) => { if (type === "message") onMessage = fn; },
    console: { warn: () => {} },
  };
  // Until a case says otherwise there is no embedder: parent === self is how
  // a standalone page looks, and the resolver must stay silent there.
  g.parent = g;
  return {
    g,
    attrs,
    store,
    /** Pretend ConjureOS exists, and push a theme from it. */
    embed: () => { g.parent = {}; },
    fromShell: (msg) => onMessage?.({ data: msg, source: g.parent }),
    fromElsewhere: (msg) => onMessage?.({ data: msg, source: {} }),
  };
}

/** Fresh resolver instance bound to `env`'s fake globals. */
function load(env) {
  const fn = new Function(
    "globalThis", "window", "module",
    `${src}\n;return globalThis.ConjureTheme;`,
  );
  return fn(env.g, env.g, { exports: null });
}

const OS_WIN = { type: "conjureos:theme", theme: "win", flavor: "light" };

const tests = {
  "app default applies when nothing else is set"() {
    const e = makeEnv();
    load(e).init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "spr", "data-theme is the app default");
    ok(!("data-flavor" in e.attrs), "no flavor means follow the browser");
  },

  "ConjureOS outranks the app default"() {
    const e = makeEnv();
    load(e).init({ theme: "spr" });
    e.embed();
    e.fromShell(OS_WIN);
    ok(e.attrs["data-theme"] === "win", "OS theme applied");
    ok(e.attrs["data-flavor"] === "light", "OS flavor applied");
  },

  "a message from anywhere but the embedder is ignored"() {
    const e = makeEnv();
    load(e).init({ theme: "spr" });
    e.embed();
    e.fromElsewhere(OS_WIN);
    ok(e.attrs["data-theme"] === "spr", "a page that is not the parent cannot restyle the app");
  },

  "the user outranks ConjureOS, and null hands it back"() {
    const e = makeEnv();
    const T = load(e);
    T.init({ theme: "spr" });
    e.embed();
    e.fromShell(OS_WIN);
    T.setTheme("hal");
    ok(e.attrs["data-theme"] === "hal", "user choice wins");
    ok(T.get().following === false, "following is false while overriding");
    ok(T.get().osTheme === "win", "what the OS said is still readable");
    T.setTheme(null);
    ok(e.attrs["data-theme"] === "win", "null falls back to the OS");
    ok(T.get().following === true, "following is true again");
  },

  "a stored choice survives a reload"() {
    const e = makeEnv();
    load(e).init({ theme: "spr" });
    e.store["conjureos.theme"] = JSON.stringify({ theme: "cnd", flavor: "light" });
    const T2 = load(e);
    T2.init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "cnd", "stored theme read back");
    ok(e.attrs["data-flavor"] === "light", "stored flavor read back");
  },

  "lock pins the app and ignores both layers above it"() {
    const e = makeEnv();
    e.store["conjureos.theme"] = JSON.stringify({ theme: "cnd", flavor: "light" });
    const T = load(e);
    const r = T.init({ theme: "win", flavor: "dark", lock: true });
    ok(r.locked === true, "get().locked is true");
    ok(r.source === "app", "source is the app's own level");
    ok(e.attrs["data-theme"] === "win", "a stored user choice does not apply");
    ok(e.attrs["data-flavor"] === "dark", "nor a stored flavor");
    e.embed();
    e.fromShell({ type: "conjureos:theme", theme: "hal", flavor: "light" });
    ok(e.attrs["data-theme"] === "win", "the OS theme does not apply");
    ok(e.attrs["data-flavor"] === "dark", "the OS flavor does not apply");
    ok(T.get().osTheme === "hal", "but the OS theme is still received");
    ok(T.get().osFlavor === "light", "and so is the flavor");
  },

  "a locked app's setters do nothing and write nothing"() {
    const e = makeEnv();
    const T = load(e);
    T.init({ theme: "win", flavor: "dark", lock: true });
    T.setTheme("hal");
    T.setFlavor("light");
    ok(e.attrs["data-theme"] === "win", "setTheme is a no-op");
    ok(e.attrs["data-flavor"] === "dark", "setFlavor is a no-op");
    ok(!("conjureos.theme" in e.store), "nothing is persisted");
  },

  "a bare lock leaves the attributes off and still hears the shell"() {
    const e = makeEnv();
    const T = load(e);
    T.init({ lock: true });
    ok(!("data-theme" in e.attrs), "no attribute means the Conjure default");
    ok(!("data-flavor" in e.attrs), "and the browser's light/dark preference");
    let seen = null;
    T.subscribe((s) => { seen = s; });
    e.embed();
    e.fromShell({ type: "conjureos:theme", theme: "xms", flavor: "dark" });
    ok(!("data-theme" in e.attrs), "the OS is still not applied");
    ok(seen?.osTheme === "xms", "subscribers are told about the change being ignored");
    ok(seen?.theme === null, "and the resolved theme did not move");
  },

  "the OS value ConjureOS injects is applied before any message arrives"() {
    // The flash this prevents: without it the app paints its own default and
    // only repaints once the subscribe round-trip returns.
    const e = makeEnv();
    e.g.__conjureos = { appearance: { theme: "xms", flavor: "light" } };
    const T = load(e);
    const r = T.init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "xms", "injected theme wins over the app default at boot");
    ok(r.source === "os", "and is reported as the OS layer");
  },

  "a URL parameter stands in when there is nothing injected"() {
    const e = makeEnv();
    e.g.location.search = "?cui-theme=fal&cui-flavor=dark";
    load(e).init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "fal", "URL theme read");
    ok(e.attrs["data-flavor"] === "dark", "URL flavor read");
  },

  "a stored choice still outranks what the host injected"() {
    const e = makeEnv();
    e.store["conjureos.theme"] = JSON.stringify({ theme: "cnd", flavor: null });
    e.g.__conjureos = { appearance: { theme: "xms", flavor: "light" } };
    load(e).init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "cnd", "the user's own override holds");
    ok(e.attrs["data-flavor"] === "light", "while the unset axis still follows the OS");
  },

  "a locked app ignores the injected value too"() {
    const e = makeEnv();
    e.g.__conjureos = { appearance: { theme: "xms", flavor: "light" } };
    const T = load(e);
    T.init({ theme: "win", flavor: "dark", lock: true });
    ok(e.attrs["data-theme"] === "win", "boot value does not slip past the lock");
    ok(T.get().osTheme === "xms", "but is still reported");
  },

  "an unknown theme id falls through instead of being written out"() {
    const e = makeEnv();
    const T = load(e);
    T.init({ theme: "spr" });
    T.setTheme("not-a-theme");
    ok(e.attrs["data-theme"] === "spr", "the app default still holds");
    ok(T.get().userTheme === null, "the junk id did not become the user layer");
  },

  // The three cases below all re-init the SAME loaded instance. Every case
  // above this point either inits once, or simulates a page reload with a
  // fresh load(e) — neither exercises a live init() called twice, which is
  // exactly the gap a second, unrelated init() call fell into.

  "a second init() cannot unlock an app that locked itself"() {
    const e = makeEnv();
    e.store["conjureos.theme"] = JSON.stringify({ theme: "cnd", flavor: "light" });
    const T = load(e);
    let warnCount = 0;
    e.g.console.warn = () => { warnCount++; };
    T.init({ theme: "win", flavor: "dark", lock: true });
    T.init({ theme: "win", flavor: "dark" });
    ok(T.get().locked === true, "get().locked stays true across a re-init that omits lock");
    ok(e.attrs["data-theme"] === "win", "the stored user choice still does not apply");
    ok(e.attrs["data-flavor"] === "dark", "nor the stored flavor");
    ok(warnCount === 1, "the re-init's attempt to unlock warns once");
    T.setTheme("hal"); // triggers the unrelated, already-tested lockedNoop warning
    ok(e.attrs["data-theme"] === "win", "setTheme is still a no-op after the re-init");
    const beforeThirdInit = warnCount;
    T.init({ theme: "win", flavor: "dark" });
    ok(warnCount === beforeThirdInit, "a further re-init does not warn again");
  },

  "a second init() does not revert an OS value a message already updated"() {
    const e = makeEnv();
    e.g.location.search = "?cui-theme=win";
    const T = load(e);
    T.init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "win", "the URL value applies at boot");
    e.embed();
    e.fromShell({ type: "conjureos:theme", theme: "spr", flavor: null });
    ok(e.attrs["data-theme"] === "spr", "a message updates the OS theme");
    T.init({ theme: "spr" });
    ok(e.attrs["data-theme"] === "spr", "a second init() does not revert to the stale URL value");
    ok(T.get().osTheme === "spr", "get().osTheme still reflects the message, not the boot snapshot");
  },

  "a second init() with no storage key clears a previously stored user theme"() {
    const e = makeEnv();
    e.store["conjureos.theme"] = JSON.stringify({ theme: "hal", flavor: null });
    const T = load(e);
    T.init({ theme: "spr" });
    ok(T.get().userTheme === "hal", "the stored choice is read on the first init");
    T.init({ theme: "spr", storageKey: null });
    ok(T.get().userTheme === null, "a re-init with no storage key clears the previous user theme");
    ok(e.attrs["data-theme"] === "spr", "so the app default applies again");
  },

  // A message is the shell's complete state, not one merged from several
  // sources (see the comment in onMessage), so an explicit null is not
  // "invalid" the way an unrecognised id is - it is the shell's own picker
  // telling the app to clear back to its default. Nothing above sent one.

  "a null broadcast clears the OS theme back to the app default"() {
    const e = makeEnv();
    const T = load(e);
    T.init({ theme: "spr" });
    e.embed();
    e.fromShell({ type: "conjureos:theme", theme: "hal", flavor: "dark" });
    ok(e.attrs["data-theme"] === "hal", "the OS theme applies first");
    e.fromShell({ type: "conjureos:theme", theme: null, flavor: null });
    ok(e.attrs["data-theme"] === "spr", "an explicit null clears back to the app default");
    ok(!("data-flavor" in e.attrs), "the flavor axis clears too, with no app default to fall back to");
    ok(T.get().osTheme === null, "get().osTheme reports the clear, not the abandoned palette");
  },

  "a null broadcast with no app default removes the attributes entirely"() {
    const e = makeEnv();
    const T = load(e);
    T.init({});
    e.embed();
    e.fromShell({ type: "conjureos:theme", theme: "hal", flavor: "dark" });
    ok(e.attrs["data-theme"] === "hal", "the OS theme applies first");
    e.fromShell({ type: "conjureos:theme", theme: null, flavor: null });
    ok(!("data-theme" in e.attrs), "no attribute means the Conjure default");
    ok(!("data-flavor" in e.attrs), "and the browser's light/dark preference");
  },
};

for (const [name, fn] of Object.entries(tests)) {
  const before = failures;
  fn();
  console.log(`${failures === before ? "ok  " : "FAIL"}  ${name}`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${Object.keys(tests).length} theme resolver tests passed.`);
