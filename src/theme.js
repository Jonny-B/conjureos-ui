/*
 * @conjureos/ui - theme resolver
 *
 * Optional. The CSS works without a line of JavaScript: set data-theme and
 * data-flavor on <html> and you are done. This file exists for the case the
 * CSS cannot cover on its own, which is an app running inside ConjureOS
 * wanting to follow the theme the user picked at the OS level.
 *
 * Apps run in an iframe, and custom-property inheritance does not cross an
 * iframe boundary, so the shell has to tell the app. This implements the
 * app's half of that conversation, plus the precedence rules, plus
 * persistence, so every app resolves the theme the same way instead of each
 * one inventing a slightly different answer.
 *
 * Precedence, highest first:
 *   1. what the user chose in THIS app's settings (localStorage)
 *   2. what ConjureOS says the OS theme is (its injected window.__conjureos
 *      .appearance at boot, then postMessage on every change; a host that
 *      cannot inject may pass ?cui-theme= / ?cui-flavor= instead)
 *   3. the default the app passed to init()
 *
 * Choosing "System" in an app's settings clears level 1, which lets level 2
 * through. An app opened outside ConjureOS gets no level 2, so it falls to
 * its own default and behaves exactly like a normal standalone site.
 *
 * An app that must not change appearance passes `lock: true` to init(), which
 * collapses the ladder to level 3 alone: levels 1 and 2 are still RECEIVED and
 * readable through get(), so the app can see what the OS is wearing, but
 * neither is ever applied and setTheme/setFlavor do nothing. Locking is for
 * apps whose design only works in one palette; it is not a way to opt out of
 * the handshake, which is why a locked app still subscribes.
 */
(function (global) {
  "use strict";

  var THEMES = [
    { id: "cnj", label: "Conjure" },
    { id: "hal", label: "Halloween" },
    { id: "fal", label: "Fall" },
    { id: "win", label: "Winter" },
    { id: "spr", label: "Spring" },
    { id: "sum", label: "Summer" },
    { id: "xms", label: "Christmas" },
    { id: "est", label: "Easter" },
    { id: "cnd", label: "Candyland" }
  ];
  var IDS = THEMES.map(function (t) { return t.id; });
  var FLAVORS = ["dark", "light"];
  var MSG = "conjureos:theme";

  function valid(id) { return IDS.indexOf(id) >= 0 ? id : null; }
  function validFlavor(f) { return FLAVORS.indexOf(f) >= 0 ? f : null; }

  function create() {
    var state = {
      root: null,
      key: null,
      appTheme: null,     // level 3
      appFlavor: null,
      osTheme: null,      // level 2
      osFlavor: null,
      userTheme: null,    // level 1, null means "follow the OS"
      userFlavor: null,
      locked: false,      // when true, only level 3 is ever applied
      warnedLocked: false,
      warnedRelock: false,
      started: false
    };
    var listeners = [];

    function readStore() {
      // Always start from "nothing stored," then let a hit repopulate it.
      // Without this, a second init() with no storage key (or one whose
      // stored value was removed) kept the previous instance's user layer.
      state.userTheme = null;
      state.userFlavor = null;
      if (!state.key) return;
      try {
        var raw = global.localStorage.getItem(state.key);
        if (!raw) return;
        var saved = JSON.parse(raw);
        state.userTheme = valid(saved.theme);
        state.userFlavor = validFlavor(saved.flavor);
      } catch (e) { /* private mode, or a corrupt value. Ignore both. */ }
    }

    function writeStore() {
      if (!state.key) return;
      try {
        global.localStorage.setItem(state.key, JSON.stringify({
          theme: state.userTheme,
          flavor: state.userFlavor
        }));
      } catch (e) { /* storage blocked. The choice still applies this session. */ }
    }

    /*
     * The OS layer as it stands at boot, before any message has arrived.
     * Called once, from the first init() only (see init()'s own comment) —
     * never again on a later init() on the same page — so there is no
     * later moment where it could run after a message and revert it.
     *
     * This matters because the subscribe is a round-trip: without a starting
     * value an app following ConjureOS paints once in its own default and
     * then repaints, which is a full-page colour flash on every launch.
     *
     * Two sources, both optional. ConjureOS injects window.__conjureos
     * .appearance into the app's page, which is the accurate one and needs no
     * cooperation from the app. A host that cannot inject can pass the same
     * two values as ?cui-theme= / ?cui-flavor= instead. Neither overwrites a
     * value a message has already set, since a message is always fresher.
     */
    function readBoot() {
      try {
        var injected = global.__conjureos && global.__conjureos.appearance;
        if (injected) {
          state.osTheme = valid(injected.theme) || state.osTheme;
          state.osFlavor = validFlavor(injected.flavor) || state.osFlavor;
        }
      } catch (e) { /* no host bridge. The URL and postMessage still work. */ }
      try {
        var q = new global.URLSearchParams(global.location.search);
        state.osTheme = valid(q.get("cui-theme")) || state.osTheme;
        state.osFlavor = validFlavor(q.get("cui-flavor")) || state.osFlavor;
      } catch (e) { /* no URL API. Fine, postMessage still works. */ }
    }

    function resolved() {
      // A locked app resolves to its own default and nothing else. The OS and
      // user layers are still reported below so it can show what it is
      // ignoring, but they never reach `theme` / `flavor`.
      if (state.locked) {
        return {
          theme: state.appTheme,
          flavor: state.appFlavor,
          source: "app",
          userTheme: null,
          userFlavor: null,
          following: false,
          locked: true,
          osTheme: state.osTheme,
          osFlavor: state.osFlavor
        };
      }
      return {
        theme: state.userTheme || state.osTheme || state.appTheme || null,
        flavor: state.userFlavor || state.osFlavor || state.appFlavor || null,
        source: state.userTheme ? "user" : (state.osTheme ? "os" : "app"),
        // A picker has to tell "System" apart from an explicit choice that
        // happens to match, so the raw user layer is exposed alongside the
        // resolved value. null on either means "following the level above".
        userTheme: state.userTheme,
        userFlavor: state.userFlavor,
        following: state.userTheme === null,
        locked: false,
        // What ConjureOS last said, regardless of whether it won. An app that
        // wants to show "ConjureOS is on Winter" next to its own override
        // reads these rather than guessing from `source`.
        osTheme: state.osTheme,
        osFlavor: state.osFlavor
      };
    }

    function apply() {
      var r = resolved();
      var el = state.root || global.document.documentElement;
      // Absent attribute means "inherit", which for the document root means
      // the Conjure default for the theme and the browser's preference for
      // the flavor. That is the intended behavior, so remove rather than
      // write an empty string.
      if (r.theme) el.setAttribute("data-theme", r.theme);
      else el.removeAttribute("data-theme");
      if (r.flavor) el.setAttribute("data-flavor", r.flavor);
      else el.removeAttribute("data-flavor");

      for (var i = 0; i < listeners.length; i++) {
        try { listeners[i](r); } catch (e) { /* one bad listener must not stop the rest */ }
      }
      return r;
    }

    function onMessage(ev) {
      var d = ev && ev.data;
      if (!d || d.type !== MSG) return;
      // Only the embedder can drive the OS layer. A message from anywhere
      // else is a page trying to restyle an app it does not own.
      if (global.parent && ev.source !== global.parent) return;
      // Unlike readBoot(), this does NOT preserve the previous value on an
      // invalid id. A message is the shell's complete current state, not a
      // value merged from several sources, so every field is authoritative
      // - including an explicit null, which is what the shell's own picker
      // sends to clear a user's choice back to this app's default. readBoot()
      // preserves on invalid only because it merges two independent optional
      // sources, where a missing second one must not erase a first one
      // already read; a message has no second source to merge with, so there
      // is nothing to preserve.
      var t = valid(d.theme);
      var f = validFlavor(d.flavor);
      if (t === state.osTheme && f === state.osFlavor) return;
      state.osTheme = t;
      state.osFlavor = f;
      apply();
    }

    /*
     * A set call on a locked app does nothing, which looks identical to a
     * broken picker from the outside. Say so once — a developer who wired a
     * picker into a locked app needs to know it was the lock, and a warning
     * per click would be noise.
     */
    function lockedNoop(fnName) {
      if (!state.warnedLocked && global.console && global.console.warn) {
        state.warnedLocked = true;
        global.console.warn(
          "[ConjureTheme] " + fnName + " ignored: this app called init({ lock: true }). " +
          "Read get().locked and hide the picker."
        );
      }
      return resolved();
    }

    /*
     * The lock is a decision about the app's design, not a per-call option:
     * once init({ lock: true }) has run, no later init() can unlock it, even
     * one that simply omits `lock` for some unrelated reason. Say so once,
     * same cadence as lockedNoop above.
     */
    function warnRelock() {
      if (!state.warnedRelock && global.console && global.console.warn) {
        state.warnedRelock = true;
        global.console.warn(
          "[ConjureTheme] init() cannot unlock this app: lock is permanent " +
          "once set with init({ lock: true }). Staying locked."
        );
      }
    }

    var api = {
      THEMES: THEMES.slice(),
      FLAVORS: FLAVORS.slice(),

      /*
       * opts.theme   default palette for this app, e.g. "spr". Optional; omit
       *              to use the Conjure default.
       * opts.flavor  "dark" | "light". Optional; omit to follow the browser.
       * opts.storageKey  where this app remembers the user's choice. Defaults
       *              to "conjureos.theme". Give each app its own key if you
       *              do not want the choice shared across same-origin apps.
       * opts.root    element to write the attributes on. Defaults to <html>.
       * opts.lock    true pins the app to opts.theme / opts.flavor. ConjureOS
       *              and any stored user choice are received but never
       *              applied, and setTheme / setFlavor become no-ops. For an
       *              app whose design only works in one palette.
       */
      init: function (opts) {
        opts = opts || {};
        state.root = opts.root || null;
        state.key = opts.storageKey === null ? null : (opts.storageKey || "conjureos.theme");
        state.appTheme = valid(opts.theme);
        state.appFlavor = validFlavor(opts.flavor);

        // Locking is one-way: once set, a later init() cannot unlock it,
        // even by simply omitting `lock`. Only a call that itself asks for
        // the lock may change state.locked while it is already true.
        if (state.locked && opts.lock !== true) warnRelock();
        else state.locked = opts.lock === true;

        // A locked app can never act on a stored choice, so it never reads
        // one. That also means it leaves no half-applied state behind if the
        // lock is lifted in a later release: level 1 starts empty.
        if (!state.locked) readStore();

        if (!state.started) {
          // The boot snapshot is read only here, on the first init() — see
          // readBoot()'s own comment for why it must never run again.
          readBoot();
          state.started = true;
          global.addEventListener("message", onMessage);
          // Announce to the shell that this app follows the OS theme. If
          // nothing is listening, nothing happens and we keep the app default.
          try {
            if (global.parent && global.parent !== global) {
              global.parent.postMessage({ type: MSG + ":subscribe" }, "*");
            }
          } catch (e) { /* cross-origin parent that refuses. Not fatal. */ }
        }
        return apply();
      },

      /* null means "follow ConjureOS", which is the System option in a picker. */
      setTheme: function (id) {
        if (state.locked) return lockedNoop("setTheme");
        state.userTheme = id === null ? null : valid(id);
        writeStore();
        return apply();
      },

      /* null means "follow the browser's light or dark preference". */
      setFlavor: function (f) {
        if (state.locked) return lockedNoop("setFlavor");
        state.userFlavor = f === null ? null : validFlavor(f);
        writeStore();
        return apply();
      },

      get: function () { return resolved(); },

      /* Returns an unsubscribe function. */
      subscribe: function (fn) {
        listeners.push(fn);
        return function () {
          var i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        };
      }
    };

    return api;
  }

  var instance = create();

  if (typeof module === "object" && module.exports) module.exports = instance;
  else global.ConjureTheme = instance;
})(typeof globalThis !== "undefined" ? globalThis : window);
