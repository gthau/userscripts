// ==UserScript==
// @name         Jira Cart
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Collect Jira issue links while you work: hover an issue key, click the +, and the collection follows you across pages, tabs and logouts.
// @author       gthau
// @match        https://*.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-cart.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-cart.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

/**
 * The Cart collects issue references while you work in Jira, so that a list of
 * issues is built by clicking rather than by copying keys one at a time.
 *
 * This version is the engine. What it gives you:
 *
 * - A loud floating `+` to the left of any issue link you hover, on every Jira
 *   view. Click it and the issue joins the active collection.
 * - The same button reports the state at a distance: a green `✓` on a link that
 *   is already collected, and a red `−` while the pointer is on the button,
 *   which is the click that removes it. The warning arrives before the click,
 *   because a removal has no undo.
 * - Every collected link is tinted green on the page, including in the rows
 *   React has not built yet, so scrolling a virtualised list costs nothing and
 *   re-applies nothing.
 * - The summary is taken from the page beside the key, in six tiers. An item is
 *   valid with a key alone, so an add never waits on the network.
 * - 🛒 `Scratch 3 ▾` in the bottom-right corner: the active collection's name
 *   and its item count. It survives navigation, a reload, another tab, and a
 *   logout, because the collections live in Tampermonkey's own storage.
 *
 * What is deliberately NOT here yet, so that nothing below is read as a stub:
 * the drawer, and with it the live list of the links on the page, the four copy
 * formats, the collection chips, gap-fill from the API, the refresh control and
 * the preferences area. The badge's click records that you asked for the drawer
 * and nothing opens. Until the drawer exists, every add and every remove is
 * written to the console with the summary it captured and the tier it came
 * from, which is how you check what was stored.
 *
 * The reasons for all of it are in `jira-cart.user.md` beside this file. Read
 * that before changing anything here: it lists 38 rejected alternatives, and
 * most of the surprising lines below are one of them. The section numbers in
 * the comments point into it.
 *
 * The script takes a `@grant`, which puts it in Tampermonkey's sandbox and its
 * collections in Tampermonkey's storage. That is what survives a logout, which
 * `localStorage` on this site does not. `GM_setValue` is synchronous, and the
 * whole design rests on that (§2.5, §2.8).
 *
 * `@match` covers the whole site rather than a Jira path, because it only
 * governs injection, and Tampermonkey evaluates it when the document loads and
 * never again on a history rewrite: arriving from another Jira page would
 * otherwise never inject the script at all, and no code in the page can correct
 * that afterwards (§2.10).
 */
(function () {
  "use strict";

  // ----------------------------------------------------------------- helpers

  // These five helpers are copied into this script, as they are copied into
  // every script in this repository. That is deliberate and it is measured:
  // four divergences across five scripts, none of which has caused a fault, and
  // the one genuine defect sat in a script that reinvented a helper rather than
  // copying one. `@require` was rejected because Tampermonkey and GitHub's raw
  // server both cache the file, so an update does not reliably reach users
  // (§2.13). Do not "fix" this into a shared library.

  const LOGGER_PREFIX = "[Jira Cart] ";
  const logger = {
    log: (message, ...objects) =>
      console.log(LOGGER_PREFIX + message, ...objects),
    debug: (message, ...objects) =>
      console.debug(LOGGER_PREFIX + message, ...objects),
    warn: (message, ...objects) =>
      console.warn(LOGGER_PREFIX + message, ...objects),
    error: (message, ...objects) =>
      console.error(LOGGER_PREFIX + message, ...objects),
  };

  // The async-aware body, from `bitbucket-ux-improvements`, and NOT the
  // synchronous one in the two Jira scripts beside it. The Cart is the most
  // asynchronous of the four: `try { return fn(); } catch` catches nothing
  // thrown after the first `await`, so a failed fetch would become an unhandled
  // rejection while the guard reported success (§2.13). One uncaught throw must
  // not take out the listener that would recover.
  function guard(fn) {
    try {
      Promise.resolve(fn()).catch((e) => logger.error("failed", e));
    } catch (e) {
      logger.error("failed", e);
    }
  }

  function injectStyle(id, css) {
    const style =
      document.getElementById(id) ?? document.createElement("style");
    style.id = id;
    style.textContent = css;
    // At document-start there may be no <head> yet, and a <style> applies from
    // anywhere in the document.
    (document.head ?? document.documentElement).append(style);
  }

  // --------------------------------------------------------------- constants

  // Two sheets, because they have different lifetimes. STYLE_ID is written once
  // and never again. COLLECTED_STYLE_ID is regenerated from the active
  // collection whenever it changes.
  const STYLE_ID = "gt-cart-style";
  const COLLECTED_STYLE_ID = "gt-cart-collected-style";

  const BADGE_ID = "gt-cart-badge";
  const TOGGLE_ID = "gt-cart-toggle";
  const WARNING_ID = "gt-cart-warning";
  const MOUNT_ANIMATION = "gt-cart-mount";

  // Both of our own elements carry this attribute, so the scan can exclude the
  // Cart's own UI with one selector (§2.3).
  const UI_ATTRIBUTE = "data-gt-cart-ui";
  const UI_SELECTOR = `[${UI_ATTRIBUTE}]`;

  // The backstop exists for the case where the event-driven path missed
  // something, not as the primary mechanism. It costs a querySelectorAll.
  const MOUNT_BACKSTOP_MS = 5_000;

  // A grace period keeps the button alive for a moment after the pointer leaves
  // both it and the anchor, so the pointer can cross the gap without a steady
  // hand. The prototype used 200 ms. It was never complained about and never
  // isolated: if the affordance ever feels skittish, suspect this number first
  // (§2.7, not settled).
  const HOVER_GRACE_MS = 200;

  const TOGGLE_SIZE = 24;
  const TOGGLE_GAP = 6;
  const EDGE_MARGIN = 4;

  // The detector, and the whole of it. It found every issue reference on all
  // seven views of the live survey (§2.1). No text regex over the page: a key
  // typed as plain text is invisible to the Cart, which is the user's own
  // decision and removes a project allowlist, a region-exclusion list and a
  // whole class of false positive.
  const ISSUE_ANCHOR = 'a[href*="/browse/"]';

  // The anchored expression `jira-ux-improvements.user.js:177` already uses, so
  // a `/browse/` path that is not an issue cannot pass. A trailing segment is
  // allowed and ignored.
  const ISSUE_PATH_RE = /^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/;

  // The gate between stored text and a stylesheet the browser parses. Keys come
  // from storage, which a person can edit by hand (§2.7).
  const SAFE_KEY_RE = /^[A-Z][A-Z0-9]*-\d+$/;

  // Atlassian `data-testid` values have a second job only. They never find an
  // issue: they answer which row an anchor belongs to, and where the summary is.
  // When one of them rots, the Cart still finds the issue and loses a summary or
  // a decoration. That is principle 4 by construction (§2.1).
  //
  // Match the testid LEAF. Never the full dotted path: a backlog row's own
  // assignee fields drop the `software-` prefix that every sibling carries, and
  // a prefix match misses exactly that case (`09a` §4.3).
  const ROW_SELECTOR = [
    // The backlog row, two wrappers further out than ticket `02` first
    // nominated: the outer container encloses the row's own context menu, which
    // makes it the better anchor (`09a` §4.2). Its leaf ends with the key, so
    // this one is a substring match.
    '[data-testid*="card-list.card.content-container."]',
    '[data-testid$="ui.card.card"]', // board
    // Search results, an epic's children, and an issue's child work items. The
    // live name on all three is `native-issue-table.ui.issue-row`.
    '[data-testid$="ui.issue-row"]',
    '[data-testid$="scope.issues.issue.row"]', // timeline
    // Linked work items. ADDED ON 2026-08-18, from a probe on a live issue: this
    // panel's card carries TWO anchors to the same issue, and with no row around
    // them there is no group -- so the button sat beside whichever anchor the
    // pointer was on, and tier 1 could not run at all, which §2.2 says is where
    // this view's summary comes from.
    //
    // Two segments and not the leaf, which is the one place §2.1's leaf rule is
    // widened rather than followed: `card-container` on its own is generic, and
    // `*="issue-line-card"` would match the summary's own wrapper
    // (`...issue-line-card-view.summary`) before the card, which splits one card
    // into two groups and defeats the purpose.
    '[data-testid$="issue-line-card.card-container"]',
  ].join(",");

  const ISSUE_HEADING = '[data-testid$="foundation.summary.heading"]';

  const SUMMARY_SELECTOR = [
    '[data-testid$="summary-field-static.content"]', // backlog
    '[data-testid$="issue-summary.issue-summary-cell"]', // search, epic children
    // The board's summary testid contains no word "summary". Do not look for one.
    '[data-testid$="single-line-text.container.box"]', // board
    '[data-testid$="inline-read.link-item"]', // issue links
    ISSUE_HEADING, // the issue view. Tier 6 names it directly as well
  ].join(",");

  // The backlog's screen-reader twin anchor holds the key and the summary in one
  // string. It is named here for tier 3 only: the widest-anchor rule is what
  // keeps it out of the decoration and the positioning, so this name rotting
  // costs one tier and nothing else (§2.3).
  const SCREEN_READER_KEY = 'a[data-testid$="screen-reader-key"]';

  // The breadcrumb of the issue the page is about. Tier 6's second witness: the
  // detail panel over a board carries the issue view's own breadcrumb testids
  // while the path names the board (appendix A.2).
  //
  // §2.3's origin table named this `breadcrumbs.current-issue`, and that matches
  // NOTHING. The live name, read off the page on 2026-08-18, is
  // `issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container`.
  // With the wrong name the witness was dead and only the path answered, so the
  // detail panel over a board silently lost tier 6.
  const CURRENT_ISSUE = '[data-testid$="breadcrumb-current-issue-container"]';

  // Regions that legitimately hold issue links outside any row. They exist here
  // for the contract check, which must not report a defect on a page that has no
  // rows because it is not a list view (§2.1, and see `checkContract`).
  const KNOWN_REGION = [
    CURRENT_ISSUE,
    // Linked work items. The card container is now a row as well, so this entry
    // only earns its place if that longer name rots while this one holds.
    '[data-testid*="issue-line-card"]',
    ".ak-renderer-document", // a description or the comment stream
  ].join(",");

  const DEFAULT_COLLECTION_NAME = "Scratch";

  // ------------------------------------------------------------------- store

  // One key holds one JSON blob (§2.4). The other two keys live in the same
  // store, decided on 2026-08-18: a backup in `localStorage` is destroyed by a
  // logout, which is the exact event the `@grant` exists to survive and the
  // event a bad migration is most likely to follow. One store also means one
  // failure mode in the load path, and the Cart never touches `localStorage` on
  // this origin, whose wrapper is the hazard §2.5 describes. The separation of
  // the three keys is unchanged: a malformed preference cannot take a collection
  // with it.
  const STORE_KEY = "gt-jira-cart.collections";
  const BACKUP_KEY = "gt-jira-cart.collections.bak";
  const PREFS_KEY = "gt-jira-cart.prefs";

  // `v` is at the root and nowhere else. It is bumped only when an existing
  // field changes shape or meaning. ADDING AN OPTIONAL FIELD NEVER BUMPS IT, or
  // one new field becomes a migration and the reversibility evaporates (§2.4).
  const SCHEMA_VERSION = 1;

  // Freshness only, and never a source of truth: the raw string `load` last
  // parsed, so an unchanged blob costs a string comparison when the tab becomes
  // visible (§2.5, rule 4).
  let lastRaw = null;

  // The result of the LAST WRITE ATTEMPT, which is not a property of the store:
  // it is cleared by the next write that works. The badge says so (§2.9).
  let writeFailed = false;

  // Whether you asked for the drawer. It answers "am I looking at it right now",
  // so it lives in memory and starts closed, the same treatment the backlog
  // script gives its panel. NOTHING OPENS in this version.
  let drawerOpen = false;

  // Use the `GM_*` functions. NEVER the `GM.*` functions. `GM_setValue` is
  // synchronous; `GM.setValue` is promise-based, and the dotted form would put
  // an `await` in the copy handler, where a clipboard write after an `await`
  // lands outside its transient user activation -- intermittent, silent failure
  // (§2.5, §2.8). The rule is here even though the copy handler is not, because
  // this is the file where the habit is formed.

  // The blob is stored as a STRING, so that it can be compared raw and so that
  // an unparseable value is a thing that can exist and be preserved. A blob
  // edited through Tampermonkey's own storage view arrives as an object instead,
  // and is accepted by being put back into its string form.
  function readRaw() {
    try {
      const raw = GM_getValue(STORE_KEY, null);
      if (raw === null || raw === undefined || raw === "") return null;
      return typeof raw === "string" ? raw : JSON.stringify(raw);
    } catch (e) {
      logger.error("could not read the collections", e);
      return null;
    }
  }

  // Minted once per session rather than once per render, so that the id of the
  // collection the first run creates does not change under L2's chips while the
  // first write is still pending.
  let firstRunDefault = null;

  function defaultCollection() {
    // The default collection is `Scratch`: short enough for the badge, and it
    // names what the thing is -- working state that gets emptied. Not "Cart",
    // which is reserved for the UI itself (§2.9).
    firstRunDefault ??= {
      // Opaque, generated once, and never derived from the name, so renaming is
      // free (§2.4).
      id: crypto.randomUUID(),
      name: DEFAULT_COLLECTION_NAME,
      items: [],
    };
    return { ...firstRunDefault, items: [...firstRunDefault.items] };
  }

  /**
   * Coerces what a stored blob is allowed to be, and returns null when it is not
   * one of those things. Two coercions happen and neither can lose an item: a
   * key is uppercased, and a collection with no `id` is given one. Anything else
   * that is not the shape of §2.4 makes the WHOLE blob unreadable, which is the
   * last row of the migration table -- it is the user's data, so it is kept
   * untouched and the Cart starts empty. Dropping the items it could not read
   * and writing the rest back would be the data loss that row exists to prevent.
   */
  function normaliseCollections(value) {
    if (!Array.isArray(value)) return null;

    const collections = [];
    for (const entry of value) {
      if (!entry || typeof entry !== "object") return null;
      if (typeof entry.name !== "string") return null;
      if (!Array.isArray(entry.items)) return null;

      const items = [];
      for (const stored of entry.items) {
        if (!stored || typeof stored !== "object") return null;
        if (typeof stored.key !== "string") return null;

        // The key is uppercased. `/browse/` keys already are, so this is free
        // safety (§2.4, `05` §3).
        const key = stored.key.toUpperCase();
        if (!SAFE_KEY_RE.test(key)) return null;

        const item = { key };
        if (typeof stored.summary === "string" && stored.summary) {
          item.summary = stored.summary;
        }
        // Named `issueId`, not `id`, so it cannot be confused with the
        // collection's own. It earns its place on refresh: a moved issue keeps
        // its numeric id and loses its key (§2.4).
        if (typeof stored.issueId === "string" && stored.issueId) {
          item.issueId = stored.issueId;
        } else if (typeof stored.issueId === "number") {
          item.issueId = String(stored.issueId);
        }
        items.push(item);
      }

      collections.push({
        id:
          typeof entry.id === "string" && entry.id
            ? entry.id
            : crypto.randomUUID(),
        name: entry.name,
        items,
      });
    }
    return collections;
  }

  function snapshot(status, collections, raw, version) {
    lastRaw = raw;
    return {
      status,
      // `collections` is never empty, and the first run writes one. With that
      // invariant *the active collection* is total: it always resolves, and no
      // code path anywhere handles "there is no active collection" (§2.4). An
      // empty array from a hand-edited blob is repaired in memory here, and
      // persisted by the next real write.
      collections: collections.length ? collections : [defaultCollection()],
      raw,
      version,
      // The two rows of §2.4's migration table that refuse to write.
      writable: status === "ok" || status === "empty",
    };
  }

  /**
   * The load path, and the only place a stored blob is interpreted. The
   * migration lives here because this is the one place every read already goes
   * through, and it is lazy: an old blob is migrated IN MEMORY and persisted on
   * the next real write. So nothing is rewritten because you looked at it, and a
   * migration bug cannot destroy data before you have done anything (§2.4).
   *
   * Nothing is cached. `render` reads storage on every pass, so there is no
   * in-memory copy that can disagree with the store (§2.5).
   *
   * `status` is §2.4's migration table, row for row:
   *   "empty"       the key holds nothing. First run: create `Scratch`
   *   "ok"          `v` is this build's, or older and migrated in memory
   *   "future"      `v` is newer than this build. Read what it can. REFUSE TO WRITE
   *   "unreadable"  it does not parse. DO NOT OVERWRITE IT. Start empty, and say so
   */
  function load() {
    const raw = readRaw();
    if (raw === null) {
      return snapshot("empty", [defaultCollection()], null, null);
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // This row departs from this repo's convention on purpose. Both sibling
      // scripts catch a parse failure and fall back to defaults, which is
      // correct there, because a preference is regenerated by clicking a
      // checkbox. A COLLECTION IS NOT. It is the user's data, so an unreadable
      // blob is kept for manual recovery (§2.4).
      logger.error(
        "the stored collections do not parse. They are kept untouched and the Cart starts empty",
        e,
      );
      return snapshot("unreadable", [], raw, null);
    }

    const collections =
      parsed && typeof parsed === "object"
        ? normaliseCollections(parsed.collections)
        : null;
    if (collections === null) {
      logger.error(
        "the stored collections parse but are not the shape of ADR §2.4. They are kept untouched and the Cart starts empty",
      );
      return snapshot("unreadable", [], raw, null);
    }

    // An absent `v` is not newer than this build, so it migrates rather than
    // locking the store.
    const version = Number.isInteger(parsed.v) ? parsed.v : SCHEMA_VERSION;
    if (version > SCHEMA_VERSION) {
      // An old build that wrote a newer blob back would silently drop what it
      // did not understand. So the collections are still shown, and an add is
      // declined with a visible reason (§2.4).
      logger.warn(
        `the stored collections are v${version}, which is newer than this build's v${SCHEMA_VERSION}. They are read-only`,
      );
      return snapshot("future", collections, raw, version);
    }

    return snapshot("ok", collections, raw, version);
  }

  // The active collection is `collections[0]`. There is no active pointer, so no
  // id can dangle and no delete path has to repair anything: deleting the active
  // collection promotes the next one by construction (§2.4).
  function activeCollection(state) {
    return state.collections[0];
  }

  /**
   * The write is the commit (§2.5). The read-modify-write in `update` mutates a
   * copy, and only a successful write makes it real: nothing in memory is
   * updated first, so if this throws, storage still holds the previous
   * collection, whole.
   *
   * One catch, one path. No error is special-cased: the badge says the write
   * failed, and the next render reads storage again.
   */
  function save(blob, state) {
    try {
      // Before the first write under a new `v`, the old value is copied once.
      // Never read by the script, so it introduces no second value that must
      // agree with anything. It exists so that a bad migration is recoverable by
      // hand (§2.4).
      if (state.version !== null && state.version < SCHEMA_VERSION) {
        GM_setValue(BACKUP_KEY, state.raw);
        logger.log(
          `the stored v${state.version} blob was copied to ${BACKUP_KEY} before the first v${SCHEMA_VERSION} write`,
        );
      }

      const text = JSON.stringify(blob);
      GM_setValue(STORE_KEY, text);
      lastRaw = text;
      writeFailed = false;
      return true;
    } catch (e) {
      writeFailed = true;
      logger.error("could not write the collections", e);
      return false;
    } finally {
      // Re-render from storage either way (§2.5).
      scheduleRender();
    }
  }

  /**
   * Every write is a read-modify-write, and this is the only one there is:
   *
   *     read the blob -> apply the change to that copy -> write it back -> render
   *
   * Never write from an in-memory copy. The reason is staleness, not a race: a
   * tab opened this morning holds a stale copy, eleven items are added in
   * another tab, and one add from the old tab would write all eleven away. A tab
   * cannot destroy what it never read (§2.5).
   *
   * Returns true when the write landed.
   */
  function update(mutate) {
    const state = load();

    if (!state.writable) {
      logger.warn(
        state.status === "future"
          ? "declined: the stored collections were written by a newer version of the Cart"
          : "declined: the stored collections could not be read, and they will not be overwritten",
      );
      scheduleRender();
      return false;
    }

    // The change is applied to a copy of what was just read, and `v` is written
    // as this build's: that is what persists a lazy migration.
    const next = {
      v: SCHEMA_VERSION,
      collections: JSON.parse(JSON.stringify(state.collections)),
    };
    mutate(next);
    return save(next, state);
  }

  // §2.4's first row. `load` already creates `Scratch` in memory, so the Cart
  // works before this lands; the write is what makes it durable. It runs once
  // per install, because after it the key is no longer empty.
  function writeFirstRun() {
    const state = load();
    if (state.status !== "empty") return;
    logger.log(`first run: creating the ${DEFAULT_COLLECTION_NAME} collection`);
    save({ v: SCHEMA_VERSION, collections: state.collections }, state);
  }

  // ------------------------------------------------------------ preferences

  // The UI's own switches, in their own key. This version READS them and never
  // writes them: the preferences area is part of the drawer (§2.9). `corner` is
  // read here because the badge's placement rule needs it at document-start, and
  // it can only be changed by hand until the drawer exists.
  const DEFAULT_PREFS = { corner: "bottom-right" };

  function loadPrefs() {
    let stored = {};
    try {
      const raw = GM_getValue(PREFS_KEY, null);
      stored = (typeof raw === "string" ? JSON.parse(raw) : raw) ?? {};
    } catch (e) {
      // A preference is regenerated by clicking a switch, so falling back to the
      // defaults is right here -- and it is exactly what the store above must
      // NOT do (§2.4).
      logger.warn("could not read stored preferences, using defaults", e);
      stored = {};
    }

    // Only known keys are read, so a preference that has since been retired
    // stops being carried, the way both sibling scripts do it. The Cart takes a
    // BOTTOM corner: bottom-right is the default, and the top-right belongs to
    // the two other scripts (§2.9).
    return {
      corner:
        stored.corner === "bottom-left"
          ? "bottom-left"
          : DEFAULT_PREFS.corner,
    };
  }

  // ------------------------------------------------------------------- mount

  // The browser knows the instant React inserts an issue link, and will say so
  // through `animationstart`, which bubbles. That beats polling on three counts:
  // no dead time before a first tick, no permanent subtree observer over a heavy
  // React page, and it fires again on every remount -- a virtualised re-render, a
  // filter change, a saved edit -- so none of those need noticing separately.
  // Copied from `jira-ux-improvements.user.js:242`, and NOT from the backlog's,
  // whose backstop is fused to its own `render` (§2.13).
  function watchMounts(onMount) {
    document.addEventListener(
      "animationstart",
      (event) => {
        if (event.animationName !== MOUNT_ANIMATION) return;
        guard(onMount);
      },
      true,
    );

    // Backstop for the one thing the animation trick cannot survive: page CSS
    // winning over `animation` on the target.
    setInterval(() => guard(onMount), MOUNT_BACKSTOP_MS);
  }

  // A backlog draws about forty issue links, and each one fires its own
  // `animationstart` in the same frame. `render` is idempotent and would survive
  // that, but it would also do forty full scans to produce one result.
  // Coalescing into a frame keeps one description of the page while paying for it
  // once (§2.10).
  let renderScheduled = false;

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      guard(render);
    });
  }

  // ---------------------------------------------------------------- detector

  function keyFromHref(href) {
    try {
      const path = new URL(href ?? "", location.href).pathname;
      return path.match(ISSUE_PATH_RE)?.[1]?.toUpperCase() ?? null;
    } catch {
      return null;
    }
  }

  // The platform check is selector-free (§2.1). Absence counts as Jira for two
  // reasons: at document-start the <meta> is not parsed yet, and a renamed meta
  // must cost a Confluence page its badge rather than cost every Jira page the
  // whole Cart -- principle 4.
  function onJira() {
    const app = document.querySelector('meta[name="application-name"]')?.content;
    return app === undefined || app === null || app === "JIRA";
  }

  // `(opens new window)` is removed ANYWHERE in the string, not only at the end.
  // The timeline anchor is
  // `<a href="/browse/RDC-21069">RDC-21069<span>, (opens new window)</span></a>`,
  // and that trailing screen-reader text defeated the survey's own regex (`02c`).
  function cleanText(text) {
    return String(text ?? "")
      .replace(/\(opens new window\)/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Tiers 2 and 3 read text that starts with the key. The punctuation that
  // follows the key has to go with it, or every summary begins with ": ". The
  // word boundary is what stops `RDC-1420` from cutting into `RDC-14200`.
  function stripKeyPrefix(text, key) {
    return text
      .replace(new RegExp(`^${key}\\b[\\s:,.\\u2013\\u2014-]*`, "i"), "")
      .trim();
  }

  // The board's and the backlog's aria-labels end with ". Use the enter key to
  // load the work item." (`02` §1). Left in, that sentence becomes part of a
  // stored summary. Matched from "use the enter key" to the end, so a reworded
  // tail is still removed.
  function dropEnterKeyHint(text) {
    return text.replace(/[.\s]*use the enter key[^.]*\.?\s*$/i, "").trim();
  }

  // Tier 6's two witnesses. One of them is absent in each of the two places the
  // tier pays: the path carries the key on the issue view, and the detail panel
  // over a board keeps the issue view's own breadcrumb testids while the path
  // names the board (appendix A.2). Reading `location` here is not a route
  // watcher: there is none, and nothing is remembered across a navigation (§2.10).
  function isCurrentIssue(anchor, key) {
    if (keyFromHref(location.pathname) === key) return true;
    return !!anchor.closest(CURRENT_ISSUE);
  }

  /**
   * The summary comes from the page, in six tiers (§2.2). The first tier that
   * answers wins. The DOM holds the summary beside the key on every view, so the
   * DOM is first and the API is the fallback: AN ADD NEVER WAITS ON THE NETWORK.
   *
   * Everything here walks UP from the anchor. Walking down from the key is the
   * one direction that does not hold: on the board the element carrying the key
   * is the anchor's PARENT, and on the issue view the anchor is a descendant of
   * it. `closest()` on the row list is the only safe direction (§2.1).
   *
   * Returns the tier as well, because until the drawer exists the console is the
   * only place the captured summary can be checked (§7, step 5).
   */
  function readSummary(anchor, key) {
    const row = anchor.closest(ROW_SELECTOR);

    // Tier 1 -- the view's own summary field, scoped to the row. It pays on the
    // backlog, the board, search results, an epic's children and issue links.
    if (row) {
      for (const field of row.querySelectorAll(SUMMARY_SELECTOR)) {
        const text = stripKeyPrefix(cleanText(field.textContent), key);
        if (text) return { summary: text, tier: 1 };
      }
    }

    // Tier 2 -- an `aria-label` that starts with the key, on the row or inside
    // it. It works because the accessibility affordances are consistently the
    // richest text on a card (`02` §1).
    if (row) {
      for (const element of [row, ...row.querySelectorAll("[aria-label]")]) {
        const label = cleanText(element.getAttribute("aria-label"));
        if (!label.toUpperCase().startsWith(key)) continue;
        const text = stripKeyPrefix(dropEnterKeyHint(label), key);
        if (text) return { summary: text, tier: 2 };
      }
    }

    // Tier 3 -- the backlog's screen-reader twin anchor, which holds the key and
    // the summary in one string.
    const twin = row?.querySelector(SCREEN_READER_KEY);
    if (twin) {
      const text = stripKeyPrefix(cleanText(twin.textContent), key);
      if (text) return { summary: text, tier: 3 };
    }

    // Tier 4 -- the anchor's own text, when it is not the key. It pays on issue
    // links and an epic's children. Stripping the key first covers both cases at
    // once: an anchor that is only the key strips to nothing and falls through.
    const own = stripKeyPrefix(cleanText(anchor.textContent), key);
    if (own) return { summary: own, tier: 4 };

    // Tier 5 -- the parent's text, minus the anchor's own text. This is the
    // timeline, whose summary has no `data-testid` and no fixed position: it is a
    // sibling inside the anchor's own parent, so subtracting the anchor's text
    // yields exactly the title, with no invented testid and no dependence on a
    // child index (§2.2, §2.11 defect 6).
    //
    // INSIDE A KNOWN ROW ONLY, and that guard is load-bearing. Prose links are in
    // scope (§2.3), and outside a row this tier would read the paragraph around
    // the link and store the sentence as the summary. Inside a row, the only text
    // near an issue anchor is about that issue. The result is refused if it still
    // contains the key, so a mangled subtraction cannot become a summary.
    if (row) {
      const mine = cleanText(anchor.textContent);
      const whole = cleanText(anchor.parentElement?.textContent);
      const rest = mine ? cleanText(whole.replace(mine, " ")) : whole;
      if (rest && !rest.toUpperCase().includes(key)) {
        return { summary: rest, tier: 5 };
      }
    }

    // Tier 6 -- the page is about this issue.
    if (isCurrentIssue(anchor, key)) {
      const heading = stripKeyPrefix(
        cleanText(document.querySelector(ISSUE_HEADING)?.textContent),
        key,
      );
      if (heading) return { summary: heading, tier: 6 };

      // Jira titles read "[ABC-123] Summary - Jira". Anchored, so a summary that
      // happens to contain " - Jira" survives; splitting on the first occurrence
      // truncated it (copied from `jira-ux-improvements`).
      const title = document.title.replace(/\s+-\s+Jira\s*$/, "");
      const bracketed = title.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketed?.[1]?.toUpperCase() === key && bracketed[2]) {
        return { summary: cleanText(bracketed[2]), tier: 6 };
      }
    }

    // No summary is a correct answer. An item is valid with a key alone (§2.6,
    // rule 1). And because Jira's summary field is mandatory, an item with no
    // summary never means "this issue has no title": it always means the Cart did
    // not capture one, which is why nothing in the UI may suggest otherwise
    // (§2.2). Gap-fill asks the API later, in the version that has a drawer to be
    // open (§2.6).
    return { summary: "", tier: 0 };
  }

  /**
   * One pass over the issue anchors on the page, for the contract check.
   *
   * An anchor count is never compared with anything. It is not an issue count,
   * and it means something different per view: a backlog card carries two
   * anchors to one issue and a board card carries one, so a check built on
   * anchors would report a defect on the backlog every time it ran (§2.1).
   */
  function scanPage() {
    const keys = new Set();
    const rows = new Set();
    const unexplained = new Set();

    for (const anchor of document.querySelectorAll(ISSUE_ANCHOR)) {
      // The Cart's own UI is excluded from the scan. It holds no `/browse/`
      // anchors today, so this is a guard and not a fix: a live list that
      // scanned itself would be diagnosed as a Jira change rather than as our
      // own bug (§2.3).
      if (anchor.closest(UI_SELECTOR)) continue;

      const key = keyFromHref(anchor.getAttribute("href"));
      if (!key) continue;
      keys.add(key);

      const row = anchor.closest(ROW_SELECTOR);
      if (row) {
        rows.add(row);
        continue;
      }
      if (!anchor.closest(KNOWN_REGION)) unexplained.add(key);
    }

    return { keys, rows, unexplained };
  }

  // A `console.warn` nobody reads is not a report: the developer tools are closed
  // while you are collecting links, and a rotted testid looks exactly like a page
  // with nothing on it. Say it on the page. Borrowed from
  // `jira-backlog-sprints.user.js:392`, because the Cart's enrichment tiers rest
  // on Atlassian `data-testid` values, which is exactly the rot this announces
  // (§2.13, risk 1).
  function reportBrokenContract(reason) {
    logger.warn(`DOM contract broken: ${reason}`);
    if (document.getElementById(WARNING_ID)) return;

    const badge = document.createElement("div");
    badge.id = WARNING_ID;
    badge.setAttribute(UI_ATTRIBUTE, "");
    badge.textContent = `⚠️ Jira Cart script: ${reason}`;
    badge.title = "This userscript's selectors need updating. Click to dismiss.";
    badge.addEventListener("click", () => badge.remove());
    (document.body ?? document.documentElement).append(badge);
  }

  // How many keys in no container this script knows at all are enough to say the
  // row list has rotted. See `checkContract`.
  const UNEXPLAINED_KEYS_LIMIT = 12;

  /**
   * The comparison is DISTINCT KEYS AGAINST ROW CONTAINERS: keys were found and
   * no row was found around them, which means the row list has rotted and the
   * summaries and the decorations went with it (§2.1).
   *
   * Two guards, because that comparison on its own fires on views that
   * legitimately have no rows -- the issue view is breadcrumbs, prose and linked
   * work items. So a key counts only when it sits in no container this script
   * knows, and a report needs enough of them that a list view must be involved:
   * Jira's own quick-search dropdown draws a handful of issue links inside
   * nothing we name. The check therefore UNDER-REPORTS rather than announcing a
   * defect that is not there -- a filtered backlog drawing five rows will not
   * trip it -- which is the same trade §2.3 makes for the live list's label: a
   * wrong number in the UI is worse than no number.
   *
   * The two conditions are §2.1's, agreed and written into it on 2026-08-18. The
   * ADR specified the comparison alone, which cries wolf on the issue view; the
   * threshold is the one number in this script that a person chose rather than
   * measured, so it is a named constant.
   */
  function checkContract({ rows, unexplained }) {
    if (rows.size > 0) return;
    if (unexplained.size < UNEXPLAINED_KEYS_LIMIT) return;
    reportBrokenContract(
      `${unexplained.size} issue keys are on this page and none of them is inside a known row container`,
    );
  }

  // ------------------------------------------------------- collected, in CSS

  // Whether a link is collected is knowable from its `href` alone, so each
  // collected key becomes a selector in one regenerated stylesheet. That answers
  // for every matching anchor INCLUDING THE ONES REACT HAS NOT CREATED YET: no
  // per-row JavaScript, nothing to re-apply after a remount, and destructive
  // virtualisation costs nothing (§2.7). It is the same lever `jira-ux` uses for
  // its lock and `jira-show-fixversion-dates` for its `::after` rules, and it is
  // principle 3 taken at its word.
  let collectedCss = null;

  function applyCollectedCss(keys) {
    const css = buildCollectedCss(keys);
    // Rewriting a <style> makes the browser re-parse the sheet and recalculate
    // style for the page, even when the text is identical, and `render` runs on
    // every mount burst. So the rule is compared before it is written.
    if (css === collectedCss) return;
    collectedCss = css;
    injectStyle(COLLECTED_STYLE_ID, css);
  }

  function buildCollectedCss(keys) {
    const selectors = keys
      // Only a key that matches `^[A-Z][A-Z0-9]*-\d+$` reaches a stylesheet. The
      // keys come out of storage, which a person can edit by hand, so this is the
      // gate between stored text and a sheet the browser parses (§2.7).
      .filter((key) => SAFE_KEY_RE.test(key))
      // Each key is anchored four ways. A substring match would make `RDC-1`
      // match `RDC-123`.
      .flatMap((key) => [
        `a[href$="/browse/${key}"]`,
        `a[href*="/browse/${key}?"]`,
        `a[href*="/browse/${key}#"]`,
        `a[href*="/browse/${key}/"]`,
      ]);

    if (selectors.length === 0) {
      return `/* Nothing is in the active collection. The sheet stays in the
   document and matches nothing, so there is never anything to undo. */`;
    }

    // Colour only, and no box that takes room: nothing here may change a row's
    // height. That is the whole reason the affordance floats instead of being
    // injected into the row (§2.7).
    return `/* Regenerated from the active collection. One rule, every collected
   key, every anchor that points at one -- including the anchors React builds
   after this sheet was written. Generated, so do not edit it here; edit
   buildCollectedCss. */
${selectors.join(",\n")} {
  background: var(--gt-cart-collected-bg);
  color: var(--gt-cart-collected-text);
  border-radius: 3px;
}`;
  }

  // ------------------------------------------------------------------ toggle

  // One shared button follows the pointer, and NOTHING IS EVER INJECTED INTO A
  // JIRA ROW. An inline-level box about 20px tall, inserted next to the key,
  // raises the height of that row's line box, and the summary beside it
  // re-aligns as though it had been given `vertical-align: top`. That was
  // reported on four views independently. The escape route is worse than the
  // disease: taking the box out of the flow means writing `position: relative`
  // onto a node React owns, on the guess that none of Jira's own absolute
  // positioning depended on that node not being a containing block (§2.7).
  //
  // The floating form also wins three properties for free: no per-row cleanup,
  // destructive virtualisation costs it nothing, and the
  // did-you-mean-to-navigate failure is unreachable rather than merely
  // unobserved, because a separate element shares no click target with the link.

  // Three anchors, because one row can hold several that point at the same
  // issue: the one the button is placed against, the one the summary cascade
  // reads, and the raw one the pointer is actually over. See `groupFor`.
  let hoveredAnchor = null;
  let hoveredReadAnchor = null;
  let hoveredSource = null;
  let pointerOnToggle = false;
  let graceTimer = null;

  function setHover(anchor, readAnchor, onToggle) {
    if (
      anchor === hoveredAnchor &&
      readAnchor === hoveredReadAnchor &&
      onToggle === pointerOnToggle
    ) {
      return;
    }
    hoveredAnchor = anchor;
    hoveredReadAnchor = readAnchor;
    pointerOnToggle = onToggle;
    scheduleRender();
  }

  function cancelGrace() {
    if (graceTimer === null) return;
    clearTimeout(graceTimer);
    graceTimer = null;
  }

  function startGrace() {
    if (!hoveredAnchor || graceTimer !== null) return;
    graceTimer = setTimeout(
      () =>
        guard(() => {
          graceTimer = null;
          hoveredSource = null;
          setHover(null, null, false);
        }),
      HOVER_GRACE_MS,
    );
  }

  /**
   * The (row, key) group, and it has TWO answers rather than one.
   *
   * The grouping itself is §2.7: a backlog card carries two anchors to the SAME
   * issue, so a per-anchor rule decorates it twice, and a prose paragraph
   * carries anchors to DIFFERENT issues under one parent, so a per-row rule
   * would lose all but one. With no row there is no group, and the hovered
   * anchor is both answers.
   *
   * `place` is the anchor the button sits beside: the one that says NOTHING BUT
   * THE KEY. Corrected on 2026-08-18, from use. §2.7 said the widest anchor
   * served both purposes, which is true on the backlog, where the other anchor
   * is an invisible screen-reader twin. It is wrong wherever the summary is a
   * link to the same issue -- child work items, search results, an epic's
   * children, linked work items -- because the summary link is the wider one, so
   * the button landed in the middle of the row instead of in its left margin,
   * where §2.7 wants it and where nothing else is.
   *
   * `read` stays the WIDEST anchor, because that is where the text is: in those
   * same rows the summary comes from tier 4, which reads the anchor's own text.
   * Placing beside the key and reading from the key would have stored no summary
   * at all. One group, two roles, and neither is a testid.
   *
   * `stripKeyPrefix` decides "says nothing but the key" rather than an equality
   * test, so the timeline's `RDC-21069, (opens new window)` counts and the
   * backlog's screen-reader twin, which carries the key AND the summary, does
   * not.
   */
  function groupFor(anchor, key) {
    const row = anchor.closest(ROW_SELECTOR);
    if (!row) return { place: anchor, read: anchor };

    let widest = anchor;
    let widestWidth = anchor.getBoundingClientRect().width;
    let keyed = null;

    for (const other of row.querySelectorAll(ISSUE_ANCHOR)) {
      if (keyFromHref(other.getAttribute("href")) !== key) continue;
      const width = other.getBoundingClientRect().width;
      if (width > widestWidth) {
        widest = other;
        widestWidth = width;
      }
      // Document order decides, so the key column wins over anything later in
      // the row that also says only the key.
      if (!keyed && stripKeyPrefix(cleanText(other.textContent), key) === "") {
        keyed = other;
      }
    }

    return { place: keyed ?? widest, read: widest };
  }

  function onPointerOver(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest(`#${TOGGLE_ID}`)) {
      // The pointer is on the button. On a collected link that names removal, so
      // the label goes red BEFORE any click: removal is the one destructive
      // thing this gesture does and there is no undo, so the warning is the
      // safety margin, and it costs one CSS rule (§2.7).
      cancelGrace();
      setHover(hoveredAnchor, hoveredReadAnchor, true);
      return;
    }

    const anchor = target.closest(ISSUE_ANCHOR);
    if (anchor) {
      const key = keyFromHref(anchor.getAttribute("href"));
      if (!key) {
        startGrace();
        return;
      }
      cancelGrace();
      // `pointerover` fires for every element the pointer crosses, so the same
      // anchor arrives many times. Nothing is recomputed for it.
      if (anchor === hoveredSource) {
        setHover(hoveredAnchor, hoveredReadAnchor, false);
        return;
      }
      hoveredSource = anchor;
      const group = groupFor(anchor, key);
      setHover(group.place, group.read, false);
      return;
    }

    startGrace();
  }

  function ensureToggle() {
    const existing = document.getElementById(TOGGLE_ID);
    if (existing?.isConnected) return existing;

    const mount = document.body;
    // At document-start there is no <body> yet. A later signal brings us
    // straight back here.
    if (!mount) return null;

    const toggle = document.createElement("button");
    toggle.id = TOGGLE_ID;
    toggle.type = "button";
    toggle.hidden = true;
    toggle.setAttribute(UI_ATTRIBUTE, "");

    // Draw the `+`. Do not type it. The `+` read as sitting too low in its box
    // while the `✓` beside it read as centred -- same box, same flex centring.
    // Flex centres the line BOX; it cannot centre the glyph's ink inside that
    // box, and a `+` is drawn on the font's math axis. Two bars positioned with
    // `inset: 0; margin: auto` are exact, and independent of whatever font the
    // page resolves (§2.7). The `−` is the same horizontal bar on its own, for
    // the same reason. The `✓` stays as text, because it was already right.
    for (const kind of ["h", "v"]) {
      const bar = document.createElement("span");
      bar.className = `gt-cart-bar gt-cart-bar-${kind}`;
      bar.setAttribute("aria-hidden", "true");
      toggle.append(bar);
    }
    const tick = document.createElement("span");
    tick.className = "gt-cart-tick";
    tick.setAttribute("aria-hidden", "true");
    tick.textContent = "✓";
    toggle.append(tick);

    // Buttons are made with `document.createElement`, never with `DOMParser`:
    // the other way produced elements with no namespace, which the Tab key
    // skipped, Enter did not operate, and `disabled` did not affect
    // (`jira-ux-improvements.user.md` §2.9).
    toggle.addEventListener("click", (event) =>
      guard(() => {
        // The button sits over whatever is under the pointer, so the click must
        // not reach Jira's own row handlers as well.
        event.preventDefault();
        event.stopPropagation();
        onToggleClick();
      }),
    );

    mount.append(toggle);
    logger.debug("floating toggle built");
    return toggle;
  }

  // Lists scroll inside their own containers, so the button is REPOSITIONED on
  // scroll rather than hidden: hiding on scroll made a one-notch wheel nudge kill
  // the affordance (§2.7).
  function positionToggle(toggle) {
    if (!hoveredAnchor) return false;

    // A virtualised row can unmount under the pointer. A detached or hidden node
    // reports a zero rect, which would park the button in a corner.
    const rect = hoveredAnchor.getBoundingClientRect();
    if (!hoveredAnchor.isConnected || (rect.width === 0 && rect.height === 0)) {
      hoveredSource = null;
      setHover(null, null, false);
      return false;
    }

    // Left, not right. It was built on the right, and the user asked for the
    // left after a day of use: on every list view surveyed the key sits at the
    // row's left edge and the summary runs off to the right, so a button on the
    // right lands on the busiest part of the row while one on the left sits in
    // the row's own margin, where nothing else is. It also meets the pointer on
    // the way in. It flips to the right only when there is no room at all (§2.7).
    //
    // Physical `left`/`top` rather than the logical properties, because this is
    // pixel maths against a viewport rectangle.
    let left = rect.left - TOGGLE_GAP - TOGGLE_SIZE;
    if (left < EDGE_MARGIN) {
      left = Math.min(
        rect.right + TOGGLE_GAP,
        window.innerWidth - TOGGLE_SIZE - EDGE_MARGIN,
      );
    }
    const top = Math.min(
      Math.max(rect.top + (rect.height - TOGGLE_SIZE) / 2, EDGE_MARGIN),
      window.innerHeight - TOGGLE_SIZE - EDGE_MARGIN,
    );

    toggle.style.left = `${Math.round(left)}px`;
    toggle.style.top = `${Math.round(top)}px`;
    return true;
  }

  let scrollScheduled = false;

  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() =>
      guard(() => {
        scrollScheduled = false;
        const toggle = document.getElementById(TOGGLE_ID);
        if (toggle && !toggle.hidden) positionToggle(toggle);
      }),
    );
  }

  function onToggleClick() {
    const anchor = hoveredAnchor;
    const key = anchor ? keyFromHref(anchor.getAttribute("href")) : null;
    if (!key) return;

    // Which way the click goes is derived from STORAGE AT CLICK TIME, never from
    // what the button was showing. A label made stale by another tab cannot
    // cause the wrong operation (§2.7). That is why the direction is decided
    // inside the read-modify-write and not before it.
    let outcome = null;
    const written = update((blob) => {
      const collection = blob.collections[0];
      const at = collection.items.findIndex((item) => item.key === key);

      if (at >= 0) {
        collection.items.splice(at, 1);
        outcome = { action: "removed", name: collection.name };
        return;
      }

      // Read from the group's reading anchor, not from the one the button sits
      // beside: in a row whose summary is also a link, the text is on the wider
      // anchor (`groupFor`).
      const { summary, tier } = readSummary(hoveredReadAnchor ?? anchor, key);
      const item = { key };
      // An absent summary is not an empty summary: the field stays optional, so
      // the blob says what was captured and nothing more (§2.4).
      if (summary) item.summary = summary;
      // Adds append to the end of `items` (§2.4).
      collection.items.push(item);
      outcome = { action: "added", name: collection.name, summary, tier };
    });

    if (!written) {
      logger.warn(`${key} was not stored: the collections were not written`);
      return;
    }
    if (outcome?.action === "removed") {
      logger.log(`removed ${key} from ${outcome.name}`);
      return;
    }
    // Until the drawer exists, this line is the only way to see what the cascade
    // captured, so it is a `log` and not a `debug`.
    logger.log(
      outcome?.summary
        ? `added ${key} to ${outcome.name}: "${outcome.summary}" (tier ${outcome.tier})`
        : `added ${key} to ${outcome?.name}: no summary on the page, so the key is stored on its own`,
    );
  }

  function renderToggle(state) {
    const toggle = ensureToggle();
    if (!toggle) return;

    const key = hoveredAnchor
      ? keyFromHref(hoveredAnchor.getAttribute("href"))
      : null;
    if (!key || !positionToggle(toggle)) {
      toggle.hidden = true;
      return;
    }

    const collection = activeCollection(state);
    const collected = collection.items.some((item) => item.key === key);

    // Three states, and the button reports the state at a distance while naming
    // the action under the cursor (§2.7). The label is a function of storage, so
    // it cannot show one condition while the store holds another.
    const toggleState = !collected
      ? "add"
      : pointerOnToggle
        ? "remove"
        : "collected";
    toggle.dataset.gtState = toggleState;
    toggle.setAttribute(
      "aria-label",
      toggleState === "add"
        ? `Add ${key} to ${collection.name}`
        : toggleState === "remove"
          ? `Remove ${key} from ${collection.name}`
          : `${key} is in ${collection.name}`,
    );
    toggle.hidden = false;
  }

  // ------------------------------------------------------------------- badge

  function ensureBadge() {
    const existing = document.getElementById(BADGE_ID);
    if (existing?.isConnected) return existing;

    // <body>, not `#jira-frontend`: the Cart is never anchored to a Jira
    // element, and outside React's own root there is nothing that can decide to
    // remove it (§2.9). At document-start there is no <body> yet, and a later
    // signal brings us straight back here.
    const mount = document.body;
    if (!mount) return null;

    const badge = document.createElement("button");
    badge.id = BADGE_ID;
    badge.type = "button";
    badge.setAttribute(UI_ATTRIBUTE, "");
    badge.addEventListener("click", () =>
      guard(() => {
        drawerOpen = !drawerOpen;
        // NOTHING OPENS in this version. The state is here because the drawer's
        // rules will be keyed off it, and a placeholder drawer is a thing that
        // gets argued about as though it were a proposal.
        logger.log(
          `the drawer was asked to ${drawerOpen ? "open" : "close"}. There is no drawer in this version: ADR §2.9 and §2.11 are the next stage`,
        );
        scheduleRender();
      }),
    );

    mount.append(badge);
    logger.debug("badge built");
    return badge;
  }

  function renderBadge(state) {
    const badge = ensureBadge();
    if (!badge) return;

    const collection = activeCollection(state);
    const count = collection.items.length;

    // The badge counts the ACTIVE COLLECTION, and only that. So it cannot lie:
    // the honesty burden falls entirely on the live list, which reports what it
    // holds and labels its own scope (§3).
    let label = `🛒 ${collection.name} ${count} ▾`;
    let title = `The Cart: ${count} item${count === 1 ? "" : "s"} in ${collection.name}. The drawer arrives in the next version; until then each add is reported in the console.`;
    let badgeState = "ok";

    // The two failure states of §2.9, in the words the ADR gives them. In this
    // version the badge carries the sentence, because the line at the top of the
    // drawer needs a drawer.
    if (state.status === "unreadable") {
      badgeState = "failed";
      label = "⚠️ 🛒 stored data unreadable";
      title =
        "The stored collections could not be read, so the Cart started empty. The stored value was NOT overwritten: recover it from Tampermonkey's storage view for this script.";
    } else if (state.status === "future") {
      badgeState = "failed";
      label = `⚠️ 🛒 ${collection.name} ${count}`;
      title = `These collections were written by a newer version of the Cart (v${state.version}). They are shown and they are read-only: writing them back would silently drop what this version does not understand.`;
    } else if (writeFailed) {
      badgeState = "failed";
      label = `⚠️ 🛒 ${collection.name} ${count}`;
      title =
        "This site's browser storage is full, so nothing new can be saved. Copy this collection out, then remove some items.";
    }

    badge.textContent = label;
    badge.title = title;
    badge.dataset.gtState = badgeState;
  }

  // ------------------------------------------------------------------ render

  /**
   * Idempotent, and the only function that writes to the page. Every signal calls
   * this and nothing else: a mount, a click, a value-change event, a tab becoming
   * visible, the backstop tick (§2.10). Two properties follow, and both are
   * load-bearing here. A new signal is safe, because it can only call `render`.
   * And every label is a function of current state, so a button cannot show one
   * condition while storage holds another.
   *
   * Two things it must not do: reset a property that something else owns (§2.11,
   * defect 4 -- which is why the toggle's position is derived from the hovered
   * anchor here rather than cleared and rewritten), and be the only path for a
   * drag (there is none yet; the drawer's grip brings one).
   */
  function render() {
    const root = document.documentElement;

    // Written first, and correct before anything has been read from the DOM. The
    // badge's corner and the drawer's future rules are CSS keyed off these two
    // attributes, which is what makes them right on the first paint and after
    // every React remount -- principle 3, and the same lever `jira-ux` uses for
    // its lock (§2.9).
    root.dataset.gtCartCorner = loadPrefs().corner;
    root.dataset.gtCartOpen = String(drawerOpen);

    // Confluence Cloud shares this origin, and `@match` covers the whole site
    // because it governs injection only. Nothing of the Cart belongs on a page
    // that says it is a different Atlassian product; capture from Confluence is
    // future work and needs a DOM survey that does not exist (§6, item 8).
    if (!onJira()) {
      document.getElementById(BADGE_ID)?.remove();
      document.getElementById(TOGGLE_ID)?.remove();
      applyCollectedCss([]);
      return;
    }

    const state = load();
    applyCollectedCss(activeCollection(state).items.map((item) => item.key));
    renderBadge(state);
    renderToggle(state);
    checkContract(scanPage());
  }

  // ----------------------------------------------------------------- startup

  // A note for whoever edits the sheet below: it is a template literal, so one
  // backtick in a CSS comment ends it. That cost twenty minutes once (§2.11).
  injectStyle(
    STYLE_ID,
    `@keyframes ${MOUNT_ANIMATION} {
  from { outline-color: currentColor; }
  to { outline-color: currentColor; }
}

/* Detection only: an animation that changes nothing visible, so the browser
   fires animationstart the moment Jira inserts an issue link or re-inserts one.
   Issue links are precisely what this script cares about, so they are the
   signal (§2.10). A backlog sends dozens of them in one frame, which is why
   every signal goes through scheduleRender rather than into render. */
${ISSUE_ANCHOR} {
  animation: ${MOUNT_ANIMATION} 1ms linear;
}

/* Colours come from Atlassian's design tokens, so the Cart tracks whatever theme
   the user has set without having to detect it. The fallbacks are the token
   values themselves, for the case where Jira stops publishing them; the dark
   block below only swaps those fallbacks, since a live token already carries the
   right value for the active theme (§2.9).

   They are declared on :root rather than on our own elements because the
   generated collected-keys sheet needs them too, and that sheet holds selectors
   and nothing else.

   A bold fill takes the inverse text colour in Atlassian's system, and the two
   are always changed together: a bold background is LIGHT in dark mode, so
   pinning white text onto it would be unreadable exactly where the tokens are
   live. */
:root {
  --gt-cart-surface: var(--ds-surface-overlay, #ffffff);
  --gt-cart-border: var(--ds-border, #091e4224);
  --gt-cart-shadow: var(--ds-shadow-overlay, 0 4px 8px #091e4226);
  --gt-cart-text: var(--ds-text, #172b4d);
  --gt-cart-focus: var(--ds-border-focused, #388bff);
  --gt-cart-warning-bg: var(--ds-background-warning, #fff7d6);
  --gt-cart-warning-text: var(--ds-text-warning, #a54800);
  --gt-cart-warning-border: var(--ds-border-warning, #f5cd47);
  --gt-cart-collected-bg: var(--ds-background-success, #dcfff1);
  --gt-cart-collected-text: var(--ds-text-success, #216e4e);
  --gt-cart-on-bold: var(--ds-text-inverse, #ffffff);
  --gt-cart-add: var(--ds-background-brand-bold, #0c66e4);
  --gt-cart-collected: var(--ds-background-success-bold, #1f845a);
  --gt-cart-remove: var(--ds-background-danger-bold, #c9372c);
}

@media (prefers-color-scheme: dark) {
  :root {
    --gt-cart-surface: var(--ds-surface-overlay, #282e33);
    --gt-cart-border: var(--ds-border, #a6c5e229);
    --gt-cart-shadow: var(--ds-shadow-overlay, 0 4px 8px #03040442);
    --gt-cart-text: var(--ds-text, #b6c2cf);
    --gt-cart-warning-bg: var(--ds-background-warning, #533f04);
    --gt-cart-warning-text: var(--ds-text-warning, #f5cd47);
    --gt-cart-warning-border: var(--ds-border-warning, #cf9f02);
    --gt-cart-collected-bg: var(--ds-background-success, #164b35);
    --gt-cart-collected-text: var(--ds-text-success, #7ee2b8);
    --gt-cart-on-bold: var(--ds-text-inverse, #1d2125);
    --gt-cart-add: var(--ds-background-brand-bold, #579dff);
    --gt-cart-collected: var(--ds-background-success-bold, #7ee2b8);
    --gt-cart-remove: var(--ds-background-danger-bold, #f87168);
  }
}

/* The Cart takes a BOTTOM corner and is never anchored to a Jira element. The
   top-right is not merely contested, it is unusable for a fixed element: the two
   sibling scripts own it in both their positions, and Jira's own global
   navigation band paints over a low z-index there -- a toolbar at z-index 1 was
   invisible rather than badly placed. 9999 is the value a separate harness
   confirmed nothing of Jira's covers (§2.9).

   Which corner is a CSS rule keyed off an attribute on html, so it is right on
   the first paint and cannot be lost to a React remount. Only the two inset
   properties differ, so the rest of the badge is described once. */
button#${BADGE_ID} {
  position: fixed;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--gt-cart-border);
  border-radius: 14px;
  background: var(--gt-cart-surface);
  color: var(--gt-cart-text);
  box-shadow: var(--gt-cart-shadow);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}
html[data-gt-cart-corner="bottom-right"] button#${BADGE_ID} {
  inset-block-end: 1rem;
  inset-inline-end: 1rem;
}
html[data-gt-cart-corner="bottom-left"] button#${BADGE_ID} {
  inset-block-end: 1rem;
  inset-inline-start: 1rem;
}
button#${BADGE_ID}:focus-visible {
  outline: 2px solid var(--gt-cart-focus);
  outline-offset: 2px;
}
/* The last write failed, or the store cannot be read. The badge says so at a
   glance and its tooltip carries the whole sentence (§2.9). */
button#${BADGE_ID}[data-gt-state="failed"] {
  background: var(--gt-cart-warning-bg);
  border-color: var(--gt-cart-warning-border);
  color: var(--gt-cart-warning-text);
}

/* Loud, not subtle. The first build was an outlined chip in the subtle palette,
   and the verdict was that it cannot be picked out. This is a solid bold fill
   with a ring in the page's own surface colour and a drop shadow, which reads
   against any Jira background in both themes (§2.7). */
button#${TOGGLE_ID} {
  position: fixed;
  z-index: 9999;
  display: block;
  inline-size: ${TOGGLE_SIZE}px;
  block-size: ${TOGGLE_SIZE}px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--gt-cart-add);
  color: var(--gt-cart-on-bold);
  box-shadow: 0 0 0 2px var(--gt-cart-surface), var(--gt-cart-shadow);
  font-family: inherit;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
button#${TOGGLE_ID}[hidden] {
  display: none;
}
button#${TOGGLE_ID}:focus-visible {
  outline: 2px solid var(--gt-cart-focus);
  outline-offset: 2px;
}
button#${TOGGLE_ID}[data-gt-state="collected"] {
  background: var(--gt-cart-collected);
}
button#${TOGGLE_ID}[data-gt-state="remove"] {
  background: var(--gt-cart-remove);
}

/* The plus is DRAWN. Flex centres the line box and cannot centre a glyph's ink
   inside it, and a plus is drawn on the font's math axis, so the typed character
   read as sitting too low while the tick beside it read as centred. Two bars
   with inset 0 and auto margins are exact, and independent of whatever font the
   page resolves. The minus is the horizontal bar on its own (§2.7). */
button#${TOGGLE_ID} span.gt-cart-bar {
  position: absolute;
  inset: 0;
  margin: auto;
  background: currentColor;
  border-radius: 1px;
}
button#${TOGGLE_ID} span.gt-cart-bar-h {
  inline-size: 12px;
  block-size: 2px;
}
button#${TOGGLE_ID} span.gt-cart-bar-v {
  inline-size: 2px;
  block-size: 12px;
}
/* The tick stays as text, because it was already right. */
button#${TOGGLE_ID} span.gt-cart-tick {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
button#${TOGGLE_ID}[data-gt-state="add"] span.gt-cart-tick,
button#${TOGGLE_ID}[data-gt-state="collected"] span.gt-cart-bar,
button#${TOGGLE_ID}[data-gt-state="remove"] span.gt-cart-bar-v {
  display: none;
}

/* Copied from the sibling scripts, colours included, so that it is readable even
   if the design tokens are the thing that broke. It sits ABOVE the Cart's own
   badge rather than on it: risk 17 records the backlog script's warning badge
   landing on this same corner, and there is no reason for ours to repeat that on
   our own badge. */
div#${WARNING_ID} {
  position: fixed;
  inset-block-end: 4rem;
  inset-inline-end: 1rem;
  z-index: 2147483647;
  max-width: 24rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  background: #fff4e5;
  color: #442c00;
  border: 1px solid #f5cd90;
  font: 0.8rem/1.4 sans-serif;
  cursor: pointer;
}`,
  );

  // Written before React has built anything, so a collected link is green on the
  // first paint rather than a moment later. That is what document-start buys, and
  // it is the reason the decoration is a stylesheet and not a class on a node
  // (§2.10). Guarded, because this is the earliest the script touches the
  // document: a throw here must not take out the listeners below, which are what
  // would bring render back.
  guard(() => {
    const root = document.documentElement;
    root.dataset.gtCartCorner = loadPrefs().corner;
    root.dataset.gtCartOpen = "false";
    applyCollectedCss(activeCollection(load()).items.map((item) => item.key));
  });

  guard(writeFirstRun);

  // Cross-tab freshness, and it is ONLY that: correctness is the read-modify-
  // write in `update`. Registered on our key, so it hears our key and nothing
  // else. One path -- event, load, render -- so the event's own values never
  // become a second way in. It is better than the `storage` event, which tells a
  // tab about its own write by NOT firing (§2.5).
  if (typeof GM_addValueChangeListener === "function") {
    GM_addValueChangeListener(STORE_KEY, () => guard(scheduleRender));
  } else {
    logger.warn(
      "GM_addValueChangeListener is not available: another tab's changes will arrive when this tab becomes visible",
    );
  }

  // A frozen or discarded tab may never receive the notification above, so a tab
  // becoming visible re-reads. The raw string is compared with the last one
  // parsed, so an unchanged blob costs a string comparison (§2.5, rule 4).
  document.addEventListener("visibilitychange", () =>
    guard(() => {
      if (document.visibilityState !== "visible") return;
      if (readRaw() === lastRaw) return;
      scheduleRender();
    }),
  );

  // Capture on the document, rather than a listener per anchor that would have to
  // be re-attached after every remount. It cannot go stale and there is no
  // teardown to get wrong.
  document.addEventListener(
    "pointerover",
    (event) => guard(() => onPointerOver(event)),
    true,
  );
  // Leaving the window produces no `pointerover` on anything, so the grace period
  // needs this one case told to it.
  document.addEventListener(
    "pointerout",
    (event) =>
      guard(() => {
        if (!event.relatedTarget) startGrace();
      }),
    true,
  );
  // Capture, because a Jira list scrolls inside its own container and `scroll`
  // does not bubble.
  document.addEventListener("scroll", () => guard(onScroll), true);

  // The badge is not anchored to a Jira element, so nothing Jira builds announces
  // when it can exist: a <body> is the whole requirement. Without this the first
  // badge on a view with no issue links would wait for the backstop.
  document.addEventListener("DOMContentLoaded", () => guard(scheduleRender));

  watchMounts(scheduleRender);
  guard(render);
})();
