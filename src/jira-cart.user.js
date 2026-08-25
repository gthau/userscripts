// ==UserScript==
// @name         Jira Cart
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  Collect Jira issue links while you work: hover an issue key, click the +, and the collection follows you across pages, tabs and logouts. Drag the drawer's rows to set the order a paste comes out in, or drag one straight into Slack or an editor. Or press the 🔗 beside a key to copy that one link without opening the issue.
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
 * What it gives you:
 *
 * - A loud floating `+` to the left of any issue link you hover, on every Jira
 *   view. Click it and the issue joins the active collection.
 * - The same button reports the state at a distance: a green `✓` on a link that
 *   is already collected, and a red `−` while the pointer is on the button,
 *   which is the click that removes it. The warning arrives before the click,
 *   because a removal has no undo.
 * - A `🔗` BESIDE THAT `+` SINCE 1.3.0, on the outside of it. It puts that one
 *   issue on the clipboard -- in whatever shape `Issue reference` names, so the
 *   same bytes 🔗 Links would give for it, plain and rich -- and it never opens
 *   the issue. It flashes `✅`. The `+` did not move a pixel to make room: the
 *   copy button is further from the link, on both sides. Turn it off on the
 *   ⚙ Appearance tab and the hovered rail is the single `+` it was at 1.2.0.
 * - EVERY ROW IN THE COLLECTION DRAGS, SINCE 1.4.0. Grab a row anywhere in the
 *   drawer -- the key included -- and drop it above or below another row to move
 *   it. The collection's array order is what every copy emits, so this is how you
 *   decide what a paste says first. A ⠿ appears on whichever row the pointer is
 *   over; the key still opens the issue on a click, and the ✕ still removes it.
 *   Pointer only, and the only undo is dragging it back.
 * - THE SAME DRAG GOES OUT OF THE DRAWER. Drop a row into Slack, an editor or a
 *   note and you get that issue in whatever shape `Issue reference` names -- the
 *   same bytes the `🔗` gives, plain and rich. It is a real link drag, so a
 *   mis-drop onto the Jira page can navigate the tab to that issue.
 * - Every collected link is tinted green on the page, including in the rows
 *   React has not built yet, so scrolling a virtualised list costs nothing and
 *   re-applies nothing.
 * - The summary is taken from the page beside the key, in six tiers. An item is
 *   valid with a key alone, so an add never waits on the network.
 * - 🛒 `Scratch 3 ▾` in the bottom-right corner: the active collection's name
 *   and its item count. It survives navigation, a reload, another tab, and a
 *   logout, because the collections live in Tampermonkey's own storage.
 * - A drawer behind that badge, holding the two standing sections. `On this
 *   page` mirrors the issue links drawn right now, and the whole row is the
 *   button. Below it is the active collection, with its name editable in place,
 *   a ↻ that asks Jira for every summary again, chips for the other
 *   collections, and six buttons at the foot: 🔗 Links, 📃 Names and 🔑 Keys
 *   copy the collection, 📋 Details fetches and then copies a richer list,
 *   📊 Report copies that list grouped under headings, and 🔍 Search opens
 *   the whole of it in Jira's own issue search, in a new tab.
 * - 📋 Details and 📊 Report each take TWO presses: the first asks Jira for
 *   type, status, priority, assignee, team, fix version, time remaining and
 *   parent, and the label changes to say it has them; the second copies. Nothing
 *   either fetches is ever stored, so a detailed list cannot be pasted with last
 *   week's status in it.
 * - An item that reached the collection with no summary is filled in from
 *   Jira's API while the drawer is open. An item is valid with a key alone, so
 *   nothing waits for it.
 * - A ⚙ in the drawer's head, which since 1.2.0 opens a whole SETTINGS SCREEN
 *   rather than a strip: it replaces the two sections and the foot, and the head
 *   reads `⚙ Settings` while it is up. Press it again to go back.
 * - THREE THINGS ABOUT THE EXPORTS ARE YOURS TO SET, and the defaults are exactly
 *   what 1.1.0 emitted, so an existing user sees no change until they ask for
 *   one:
 *     - `Issue reference` — one of five named shapes for how an issue is written
 *       at the head of a line, from the markdown link 1.1.0 shipped to the plain
 *       `KEY: Summary - url` a destination that does not render markdown wants.
 *       It governs 🔗 Links, 📋 Details and 📊 Report together.
 *     - Which fields 📋 Details and 📊 Report print, and in what order. Each
 *       has its own ordered list over the same eight fields, on its own tab, with
 *       a checkbox per field and a drag to reorder. Zero ticked is allowed — the
 *       line is then the issue reference alone.
 *     - How 📊 Report is banded: `Group by` and `Then by`, over seven fields,
 *       where 1.1.0 could only do priority and then team.
 *   ↺ `Restore export defaults` puts all five back. The appearance switches —
 *   sections, corner, the `🔗` beside the `+`, and the right-click menu, which
 *   still ships off — are on their own tab and it leaves them alone.
 * - If you do switch the right-click menu on, it now has THREE entries: add or
 *   remove, `Open link in new tab`, and `Copy link to KEY`. The last two are
 *   the two things the interception takes away, given back.
 *
 * What is still absent: keyboard shortcuts, multi-select, copying a row out of
 * the drawer, importing a JQL query into a collection, and any SORTING or
 * grouping of the COLLECTION itself. 📊 Report groups a document built from the
 * collection; the collection's own array is what every format emits, and since
 * 1.4.0 that array is insertion order UNTIL YOU DRAG SOMETHING.
 *
 * Two entries left that list in one direction only, which is worth reading
 * carefully before assuming either is closed. "Per-row copy" left it at 1.3.0 and
 * again at 1.4.0, and it is now nearly gone: copying ONE HOVERED ISSUE off the page
 * is what the `🔗` does, and since 1.4.0 DRAGGING A ROW OUT of the drawer drops
 * that issue into another application, in the same bytes. What is still refused is
 * a per-row copy CONTROL -- no ✕-sized 🔗 on each row, no tick boxes -- because the
 * collection is the selection (§2.9). "Ordering" left it at 1.4.0: a hand-made
 * order is now expressible, and a sort by key or a grouping of the drawer's own
 * list is still not (§6 item 7).
 *
 * The reasons for all of it are in `jira-cart.user.md` beside this file. Read
 * that before changing anything here: it lists 72 rejected alternatives, and
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
  // THE RAIL IS THE BOX THAT FLOATS; THE BUTTONS INSIDE IT DO NOT POSITION
  // THEMSELVES. Until 1.3.0 the `+` was the floating element itself. It has a
  // neighbour now, and two independently placed fixed buttons would leave a gap
  // between them that belongs to the page: a `pointerover` landing in that gap
  // reaches whatever is underneath, which starts the grace timer and takes the
  // affordance away while the pointer is travelling between its own two halves.
  // One box means the gap is inside our own element, so `closest` still answers
  // (§2.7.1).
  const RAIL_ID = "gt-cart-rail";
  const TOGGLE_ID = "gt-cart-toggle";
  const COPY_ID = "gt-cart-copy";
  const DRAWER_ID = "gt-cart-drawer";
  const MENU_ID = "gt-cart-menu";
  const WARNING_ID = "gt-cart-warning";
  const MOUNT_ANIMATION = "gt-cart-mount";

  // EVERY element of our own carries this attribute, so the scan can exclude the
  // Cart's own UI with one selector (§2.3). `closest` walks up, so the rail carrying
  // it answers for the two buttons inside it as well -- they carry it anyway, because
  // it costs nothing and a button that is reparented later must not lose it.
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

  // The gap BETWEEN the two buttons on the rail, and it is smaller than the gap
  // between the rail and the link on purpose: 4px reads as two buttons that
  // belong together, and the 6px above reads as the rail standing off the row.
  // Nothing measures the rail, so this number is also arithmetic -- see
  // `positionRail`.
  const RAIL_GAP = 4;

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
    // THE TEAM'S OWN TIMELINE TAB, and it is an EIGHTH VIEW the survey of `02`
    // never saw: it sits beside Backlog and Active sprints, and it is NOT the
    // Plans timeline two rows above. Added on 2026-08-18, from the row's own
    // outerHTML on a live page, after 37 keys with no row around them tripped the
    // contract check.
    //
    // Its leaf ENDS WITH THE ISSUE'S NUMERIC ID -- `container-576933` -- exactly
    // as the backlog's leaf ends with the key, so this is a substring match with
    // a trailing hyphen. Three segments and not the leaf, for the reason the
    // linked-work-items card needs two: `container-` alone is generic, and this
    // row also contains `...list-item.expand-button.container-576933` on a span
    // inside it, which a shorter match would seize first and turn one row into
    // two groups.
    //
    // Note that this view draws from TWO component libraries: the row is
    // `roadmap.timeline-table.components.*` and the key and title inside it are
    // `roadmap.timeline-table-kit.ui.*`. Do not assume one prefix covers both.
    '[data-testid*="timeline-table.components.list-item.container-"]',
    // ROVO SEARCH, AND IT IS THE NINTH VIEW risk 19 said to expect. Added on
    // 2026-08-25, after the contract check reported 42 keys and NOT ONE ROW on
    // `/jira/rovo-search`. The check was right and the page still worked, which is
    // §7 step 5's case exactly: the `+` and the `🔗` appear on any `/browse/`
    // anchor, row or no row, because `groupFor` falls back to the hovered anchor.
    // What was lost was the summary -- a press on this table stored a BARE KEY.
    //
    // THIS PAGE HAS TWO ISSUE-LINK REGIONS AND THEY ARE NOT THE SAME. This entry is
    // the table in the answer card (`jira-nl-to-jql-card-wrapper`), 20 rows of 2
    // anchors. The other is `search-page-result`, 30 results of 1 anchor whose text
    // is `KEY: summary`, so tier 4 already answers there and it is named in
    // KNOWN_REGION instead -- see the note on it there.
    //
    // Its leaf ends with an ARI, `...--row-ari:cloud:jira:<site>:issue/564570`, so
    // like the backlog and the timeline this is a substring match with a trailing
    // hyphen. The hyphen is what keeps it off `datasource-table-view--body` and the
    // table itself; the cells say `--cell-N` and never collide.
    //
    // NOT A JIRA LIST COMPONENT. This is the smart-link datasource table, so the
    // entry also pays wherever one is embedded -- an issue description, a
    // Confluence page -- and none of those were surveyed. Expect a tenth view.
    '[data-testid*="datasource-table-view--row-"]',
  ].join(",");

  const ISSUE_HEADING = '[data-testid$="foundation.summary.heading"]';

  const SUMMARY_SELECTOR = [
    '[data-testid$="summary-field-static.content"]', // backlog
    '[data-testid$="issue-summary.issue-summary-cell"]', // search, epic children
    // The board's summary testid contains no word "summary". Do not look for one.
    '[data-testid$="single-line-text.container.box"]', // board
    '[data-testid$="inline-read.link-item"]', // issue links
    // The Team's Timeline tab. Two segments rather than the leaf, because
    // `summary.title` on its own is the kind of name any view could take; scoped
    // to a row this reads the one title beside the one key (§2.2, tier 1).
    '[data-testid$="list-item-content.summary.title"]',
    // Rovo search's table, and IT SHIPS WITH THE ROW ABOVE OR NEITHER SHIPS. The
    // row on its own changed nothing: measured on 2026-08-25, the cascade went tier
    // 0 to tier 0 with the row added and to TIER 1 only once this line was there
    // too. Tiers 1, 2, 3 and 5 are all behind `if (row)`, and tier 4 reads the
    // anchor, whose text is the key -- so with no summary field named, a row buys
    // this view nothing at all.
    //
    // `$=` and not the two-segment widening the cards above needed: the renderer
    // gives every cell a `link-datasource-render-type--*` name, and the leaf is
    // what separates the summary from `--icon-text`, `--status--text` and
    // `--datetime`.
    //
    // THE KNOWN LIMIT: it is the COLUMN ORDER that makes this the summary, not the
    // name -- `--text` is the renderer's generic text cell, and the first non-empty
    // match in document order wins. A table configured with another text column to
    // the left of Summary would read that instead. The row's own `aria-label` says
    // `"<text>, Summary field, edit"` and would settle it by name, but tier 2 wants
    // a label that STARTS with the key and this one starts with the value, so
    // using it means a new tier rather than a new selector. Not built: a wrong
    // column is a wrong summary, and §2.2 already says an item is valid with a key
    // alone.
    '[data-testid$="link-datasource-render-type--text"]',
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
    // The Team's Timeline tab, whose row is now in the list above. This entry
    // matches the ANCHOR ITSELF -- it carries
    // `roadmap.timeline-table-kit.ui.list-item-content.summary.key` -- so like the
    // `issue-line-card` entry above it earns its place only if the longer row
    // name rots while this one holds. What it buys then is silence rather than a
    // false warning on a view that has 37 keys and is not broken.
    '[data-testid*="roadmap.timeline-table-kit"]',
    // ROVO SEARCH'S RESULTS LIST, and it is here rather than in ROW_SELECTOR on
    // purpose. Each result holds ONE anchor whose text is `KEY: summary`, so tier 4
    // strips the key and answers correctly today -- confirmed by a live press on
    // 2026-08-25, which logged `(tier 4)` with the right title. A row would put
    // tiers 1, 2 and 3 in front of that, and tier 2 takes any `aria-label` in the
    // row that starts with the key; nothing has measured what those labels say
    // here, so promoting this to a row could only trade a summary that works for
    // one that might. Naming it a region buys the one thing needed -- silence from
    // the contract check on a search that returns no answer table -- and changes no
    // summary. Promote it if a result ever grows a second anchor.
    '[data-testid$="search-page-result"]',
    // The cells of the table two entries above. Same bargain as the two entries
    // above this one: it earns its place only if the longer row name rots while
    // this one holds, and what it buys then is silence instead of a false warning
    // on a view that is not broken.
    '[data-testid*="datasource-table-view--cell-"]',
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

  // Use the `GM_*` functions. NEVER the `GM.*` functions. `GM_setValue` is
  // synchronous; `GM.setValue` is promise-based, and the dotted form would put
  // an `await` in the copy handler, where a clipboard write after an `await`
  // lands outside its transient user activation -- intermittent, silent failure
  // (§2.5, §2.8). `copyActive` below is the handler that would break.

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
  // collection the first run creates does not change under the drawer's chips
  // while the first write is still pending.
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

  // --------------------------------------------------- the export vocabulary

  /* WHAT THE EXPORT PREFERENCES ARE ALLOWED TO SAY. Four lists of ids, and they are
     the whole vocabulary: a stored preference that names something absent from them
     is not honoured (see `normalisePrefs`).

     ONE CATALOGUE, TWO SELECTIONS -- the answer to the question configurability
     raises, which is what stops 📋 Details and 📊 Report drifting apart once each
     has its own field list. The ids and their labels live HERE, once. Every measured
     style stays in `detailChip`, once. A preference can only say WHICH fields a
     document uses and IN WHAT ORDER, so nothing a user can click reaches the styling
     the five paste rules of §2.14 protect.

     WHY THESE LISTS SIT ABOVE THE PREFERENCES AND NOT BESIDE THE RENDERERS THAT DRAW
     THEM. `DEFAULT_PREFS` is BUILT from the catalogue, and a `const` declared further
     down the file is in its temporal dead zone at that line -- the script would throw
     on load. The renderers read these from below, which costs nothing.

     They are also the SINGLE SOURCE for the tickets that fill them in: the shape
     table, the band accessors and the ⚙ panel each build OVER these ids rather than
     restating them. A second list of ids beside one of these would be two values that
     can disagree, which is principle 1 and the reason the store has no active
     pointer. */

  // The row fields, in the reading order §2.14 chose -- what it is, how it is going,
  // how urgent, who has it, when it ships, where it belongs -- plus `team`.
  //
  // `team` is NEW as a row field. It is fetched today for the report's headings
  // only, and 📋 Details has no headings, so the field is currently unreachable from
  // that export. Off by default in both lists, so no output changes.
  //
  // The labels are the ⚙ panel's. They are here rather than in the panel because the
  // panel is the second reader: `detailBits` already owns the id, and a label kept
  // beside the checkbox instead would be a second place a field is named.
  const FIELD_CATALOGUE = [
    { id: "type", label: "Type" },
    { id: "status", label: "Status" },
    { id: "priority", label: "Priority" },
    { id: "assignee", label: "Assignee" },
    { id: "team", label: "Team" },
    { id: "fixv", label: "Fix version" },
    { id: "remaining", label: "Time remaining" },
    { id: "parent", label: "Parent" },
  ];

  // A default field list is DERIVED from the catalogue rather than written out, so a
  // field added to the catalogue later arrives in both defaults automatically, and
  // arrives OFF unless it is named here. That is the same rule `normaliseFieldList`
  // applies to a stored list, and having one rule rather than two is the point.
  function defaultFieldList(on) {
    return FIELD_CATALOGUE.map((field) => ({
      id: field.id,
      on: on.includes(field.id),
    }));
  }

  /* The named shapes the issue reference can take. ONE PREFERENCE, SHARED BY ALL
     THREE EXPORTS, so §2.14's promise that 📋 Details' head is 🔗 Links' line stays
     true; a per-export override is left in §6 and costs one nullable key each.

     Ids only, here. The bytes each shape emits -- and it must define BOTH FLAVOURS,
     or it silently does nothing in Outlook, Word, Teams and Confluence, which all
     take the HTML -- belong beside the formatters that emit them. This list is what
     a stored value is checked against, and it is the list a shape is added to or
     dropped from: drop one and every blob naming it falls back to `markdown` on the
     next read, with nothing else to change.

     FIVE, AND ALL FIVE SURVIVED A REAL PASTE (appendix A.9.1, 2026-08-24). Every
     shape read correctly in the paste targets and a visible URL arrived clickable,
     which is what makes the three URL-bearing ones available on all three exports
     rather than on 🔗 Links alone.

       markdown          [KEY](url) Summary -- what 1.1.0 shipped
       markdown-key      [KEY](url) -- the link with no summary. ASKED FOR BY THE
                         PASTE rather than offered by the prototype, which had no
                         such row
       key-summary-url   KEY: Summary - url
       key-url           KEY - url
       url               url

     Ticket 03 owns the bytes. It must assert that its shape table and this list name
     the same ids, because a table with an id this list lacks is unreachable and an id
     with no table is a preference that renders nothing. */
  const LINE_SHAPE_IDS = [
    "markdown",
    "markdown-key",
    "key-summary-url",
    "key-url",
    "url",
  ];

  /* The fields that may BAND 📊 Report. Seven, where the catalogue above has eight,
     and both differences carry their reason so that a later session cannot quietly
     erase them on the reasonable-sounding grounds that a field is a field.

     TIME REMAINING MAY NOT BAND. Its band order would be string order over
     durations, and "10m" < "2d" < "9h" means nothing -- a report that reads as broken
     rather than as configured.

     STATUS BANDS BY CATEGORY AND NEVER BY NAME, which is why the id here is
     `category` where the row field is `status`. The names are this instance's own,
     and `Dev In progress` < `Dev Resolved` < `To Do` is alphabetical noise dressed as
     a workflow. The three categories are Atlassian's own fixed vocabulary, which is
     exactly why they may carry a rank where §2.15 refused priority one: a rank over
     this instance's priority names could only fall out of step with Jira.

     `fixv` is MULTI-VALUED, and an issue in two releases appears in both bands --
     the one place a paste has a line per issue-and-band rather than per issue. */
  const BAND_IDS = [
    "priority",
    "team",
    "category",
    "assignee",
    "type",
    "fixv",
    "parent",
  ];

  // Band 2 only. A report with no bands at all IS 📋 Details, so band 1 has no
  // `none` and `normalisePrefs` sends one back to the default.
  const NO_BAND = "none";

  /* WHICH ROW A BAND IS THE SAME FIELD AS, and it is one entry rather than none
     because of the one place the two vocabularies use different words: status bands
     by CATEGORY and the row field is called `status` (see `BAND_IDS`). Every other
     band id IS a field id, so this map is a lookup with a fallback rather than a
     second catalogue.

     It exists for the ⚙ panel alone, which MARKS a field that is also a heading.
     THE MARK IS A STATEMENT AND NOT A VETO (decision 8): a ticked field is printed
     whether or not it bands, because a field that appears only in a heading is a
     field whose meaning depends on the row's position, and §2.14 rule 4 is about
     exactly that -- somebody who drags a line out of its band in the pasted mail
     can choose to keep the value readable on the row. Ticket 05 makes the bands
     settable; nothing here decides what a band does. */
  const BAND_ROW_FIELD = { category: "status" };

  /* The ⚙ panel's tabs. THE LAST TAB IS A STORED PREFERENCE, on §2.9's precedent for
     the drawer's own `open`: a reload is not the end of a sitting, and being thrown
     to the first tab every time you come back is the same complaint.

     ONE VALUE, RANGE-CHECKED, and an id this build does not recognise falls back to
     the FIRST tab rather than to a blank screen -- what `layout` and `corner` already
     do. There is no open/closed set to keep: a tab bar shows every tab whether it has
     ever been pressed or not, so a tab added later is visible the moment it exists.
     A NEW TAB THEREFORE ARRIVES VISIBLE WHERE A NEW FIELD ARRIVES OFF, and the
     asymmetry is deliberate -- see `normaliseFieldList`.

     Three, because `Issue reference` governs all three exports: a tab that owned it
     would tell a small lie about its scope, so it is pinned above the bar and each
     export tab stays at about eight rows, which is the only structure that fits the
     drawer's 215px floor without scrolling. The cost, stated rather than hidden:
     `appearance` sits as a peer of two export tabs, which is not a clean taxonomy.
     Changing the structure is changing this list and nothing else.

     `exports` says whether the tab holds anything `Restore export defaults` reaches,
     and it is what decides where that button shows. On the appearance tab it would
     be an offer to reset something you are not looking at (decision 22).

     `fields` NAMES THE PREFERENCE THE TAB'S FIELD LIST EDITS, so the panel builds
     both lists from this table and there is no second place that says which tab owns
     which key. It is NOT the same thing as `exports` and the two are deliberately
     not one flag: `exports` asks whether `Restore` should show, and the pinned
     `Issue reference` row is an export setting on no tab at all -- so a tab could
     hold an export setting and no field list.

     `bands` NAMES THE PREFERENCES WHOSE VALUES PUT A FIELD IN A HEADING, and it is
     what lets the panel mark a row `also a heading` without a literal `"report"`
     inside the renderer -- which would be a second place the structure is decided.
     Only 📊 Report has any; 📋 Details has no headings at all, which is why `team`
     was unreachable from it before 1.2.0. TICKET 05 OWNS THE BANDS THEMSELVES and
     puts its two dropdowns on that tab; this list is the seam it needs. */
  const SETTINGS_TABS = [
    { id: "appearance", label: "Appearance", exports: false },
    { id: "details", label: "📋 Details", exports: true, fields: "detailsFields" },
    {
      id: "report",
      label: "📊 Report",
      exports: true,
      fields: "reportFields",
      bands: ["reportBand1", "reportBand2"],
    },
  ];

  // DERIVED, so the vocabulary `normalisePrefs` range-checks against cannot name a
  // tab the bar does not draw. The list above is the only place the structure is
  // written down.
  const SETTINGS_TAB_IDS = SETTINGS_TABS.map((tab) => tab.id);

  // ------------------------------------------------------------ preferences

  /* The UI's own switches, in their own key. The user's data and the UI's
     settings are different kinds of state -- the distinction
     `jira-ux-improvements` already draws between its lock and its collapse -- and
     separating them means A MALFORMED PREFERENCE CAN NEVER TAKE A COLLECTION WITH
     IT (§2.4).

     Everything about this path is the OPPOSITE of the collections' path, and
     deliberately: a preference that does not parse falls back to the defaults,
     because a preference is regenerated by clicking a switch. A collection is
     not. Do not let any of this near `load` (§2.4, last migration row). */
  const DEFAULT_PREFS = {
    open: false,
    corner: "bottom-right",
    layout: "auto",
    rightClickMenu: false,
    // ON BY DEFAULT, WHICH MAKES IT THE FIRST SWITCH HERE THAT IS. Every other
    // boolean above ships off, and each reads "anything that is not exactly `true`
    // is off". This one is the mirror of that -- "anything that is not exactly
    // `false` is on" -- and the asymmetry is the point rather than an oversight: a
    // switch ships off when turning it on TAKES SOMETHING AWAY, which is the
    // right-click menu's whole story (§2.7). The copy button takes nothing away,
    // so it ships on, and the switch exists for the one cost it does have: the
    // rail is about 52px wide instead of 24px, so it covers more of the row's own
    // left margin (§2.7.1).
    copyButton: true,
    size: null,
    basisStacked: null,
    basisSplit: null,
    // Six keys for the configurable exports, added in 1.2.0. `v` IS NOT BUMPED and
    // there is no migration: preferences are not versioned, and nothing about a
    // stored item changed shape (§2.4).
    //
    // EVERY DEFAULT HERE REPRODUCES 1.1.0'S OUTPUT BYTE FOR BYTE. That is the whole
    // requirement of the defaults: an install that never opens ⚙ must not be able to
    // tell that any of this exists.
    //
    // The literal `markdown` and not `LINE_SHAPE_IDS[0]`: this is the shape 1.1.0
    // shipped, which is a fact about the output rather than about a list's order.
    lineShape: "markdown",
    detailsFields: defaultFieldList([
      "type",
      "status",
      "priority",
      "assignee",
      "fixv",
      "remaining",
      "parent",
    ]),
    // The same list with `priority` off, because priority is the report's first band
    // and a band leaves the row. `team` is off in both, as the new field.
    reportFields: defaultFieldList([
      "type",
      "status",
      "assignee",
      "fixv",
      "remaining",
      "parent",
    ]),
    reportBand1: "priority",
    reportBand2: "team",
    // Whichever tab is first. A default that named a tab would be a second place the
    // structure is decided.
    settingsTab: SETTINGS_TAB_IDS[0],
  };

  const LAYOUTS = ["auto", "stacked", "split"];

  /* WHAT `Restore export defaults` REACHES, and it is a list rather than five
     literals in the handler so that a seventh export preference is one entry here
     and nothing to remember (decision 22).

     What it deliberately leaves alone, each for its own reason. The FOUR APPEARANCE
     switches -- three until 1.3.0 added the copy button's -- because the drawer's
     size is in the same key and a dragged size is only recoverable by dragging the
     grip again (risk 10) -- so a control
     called "restore" that silently resized the drawer would be the worst kind of
     surprise. And `settingsTab`, because which tab you are on is not an export
     setting: throwing you to another tab because you reset a field list would be a
     second change you did not ask for. */
  const EXPORT_PREF_KEYS = [
    "lineShape",
    "detailsFields",
    "reportFields",
    "reportBand1",
    "reportBand2",
  ];

  /* WHETHER THE DRAWER IS OPEN IS A STORED PREFERENCE. Reversed on 2026-08-18, at
     the user's request, after using 0.4.0.
     
     It was a variable in memory until then, and §2.9 had the reason: it answers
     *am I collecting right now*, which reads as a question about this sitting
     rather than a standing preference. USE SAID OTHERWISE. A reload is not the end
     of a sitting -- it is a link you clicked, a save, a page that reloaded itself --
     and closing the drawer each time made the reload cost more than the reload.
     
     This is a FUNCTION and not a variable, deliberately: a variable beside the
     stored value is two values that can disagree, which is the one thing this
     design deletes everywhere else (principle 1). Every reader asks storage, the
     way `corner` and `layout` already do, so there is nothing to keep in step.
     
     Two costs, both accepted and neither hidden: a NEW TAB opens with the drawer
     already open, because it reads the same preference; and a drawer left open a
     week ago is open when you come back. Both follow from it being a preference,
     which is what it now is. */
  function drawerIsOpen() {
    return loadPrefs().open;
  }

  function loadPrefs() {
    let stored = {};
    try {
      const raw = GM_getValue(PREFS_KEY, null);
      stored = (typeof raw === "string" ? JSON.parse(raw) : raw) ?? {};
    } catch (e) {
      logger.warn("could not read stored preferences, using defaults", e);
      stored = {};
    }
    return normalisePrefs(stored);
  }

  // Only known keys survive a read, so a preference that has since been retired
  // stops being carried, the way both sibling scripts do it. Every value is also
  // range-checked here rather than at each use, so the rest of the script can
  // treat the result as a fact.
  function normalisePrefs(stored) {
    const source = stored && typeof stored === "object" ? stored : {};

    /* THE TWO BANDS ARE RESOLVED UP HERE, because they are the one pair of keys in
       this function with a rule BETWEEN them and an object literal has no place to
       put one. Each is checked against the vocabulary on its own first, exactly as
       every key below is, and then the one cross-key rule is applied once.

       THE TWO MAY NOT NAME THE SAME FIELD -- reversed on 2026-08-25, from use.
       Ticket 05 shipped it allowed, on the reasoning that `Team` under `Team` is
       useless, truthful and visible the moment it is pasted, so refusing it was more
       machinery than the mistake was worth. THE USER PRESSED IT AND REPORTED IT AS A
       DEFECT, which is what it is: a report whose every sub-heading repeats the
       heading above it is not a configuration anybody chose, and "you can see that it
       is wrong" is not the same as "you meant it" (§2.15).

       BAND 2 IS THE ONE THAT GIVES WAY, always, and never band 1: band 1 is required
       and band 2 is optional, so the optional one is the one that can yield without
       producing a state no click can make. That includes the case where band 2's own
       DEFAULT is what would duplicate -- a hand-edited blob naming `team` for band 1
       and nonsense for band 2 must not have `team` put back underneath itself. */
    const band1 = BAND_IDS.includes(source.reportBand1)
      ? source.reportBand1
      : DEFAULT_PREFS.reportBand1;
    const band2 =
      source.reportBand2 === NO_BAND
        ? NO_BAND
        : BAND_IDS.includes(source.reportBand2)
          ? source.reportBand2
          : DEFAULT_PREFS.reportBand2;

    // The order matches DEFAULT_PREFS above, so the two read as one list.
    return {
      // The drawer starts closed on a fresh install and is remembered after that.
      // Anything that is not exactly `true` is closed, so a hand-edited blob cannot
      // leave the drawer in a state no click produced.
      open: source.open === true,
      // The Cart takes a BOTTOM corner: bottom-right is the default, and the
      // top-right belongs to the two other scripts, where it is unusable for a
      // fixed element anyway (§2.9).
      corner:
        source.corner === "bottom-left" ? "bottom-left" : DEFAULT_PREFS.corner,
      layout: LAYOUTS.includes(source.layout)
        ? source.layout
        : DEFAULT_PREFS.layout,
      // Off by default, and it is the one preference that TAKES SOMETHING AWAY
      // (§2.7). Anything that is not exactly `true` is off.
      rightClickMenu: source.rightClickMenu === true,
      // AND THIS ONE IS THE MIRROR, because it is the one switch that ships ON:
      // anything that is not exactly `false` is on. Written this way round rather
      // than as `source.copyButton ?? true` so that a hand-edited blob holding a
      // string, a number or a null cannot leave the rail in a state no click
      // produced -- which is the rule every boolean above already follows, in the
      // other direction (§2.4).
      copyButton: source.copyButton !== false,
      size: readStoredSize(source.size),
      basisStacked: readStoredBasis(source.basisStacked),
      basisSplit: readStoredBasis(source.basisSplit),
      // The six export keys. Each is checked against the vocabulary above, and an id
      // this build does not know falls back to that key's default -- the same
      // treatment `layout` and `corner` get, and the OPPOSITE of what a collection
      // gets, which is the whole reason the two live in different keys.
      lineShape: LINE_SHAPE_IDS.includes(source.lineShape)
        ? source.lineShape
        : DEFAULT_PREFS.lineShape,
      detailsFields: normaliseFieldList(
        source.detailsFields,
        DEFAULT_PREFS.detailsFields,
      ),
      reportFields: normaliseFieldList(
        source.reportFields,
        DEFAULT_PREFS.reportFields,
      ),
      // NEVER `none`. A report with no bands at all is 📋 Details, so a blob asking
      // for one gets the default band back rather than a second copy of another
      // export.
      reportBand1: band1,
      // `none` IS honoured here, and it is the single-level report -- and it is also
      // where a duplicate lands, for the reason written above the two.
      reportBand2: band2 === band1 ? NO_BAND : band2,
      // The first tab, never blank: an id that is not a tab any more must not leave
      // the panel with nothing on it.
      settingsTab: SETTINGS_TAB_IDS.includes(source.settingsTab)
        ? source.settingsTab
        : SETTINGS_TAB_IDS[0],
    };
  }

  /* ONE FUNCTION, BOTH FIELD LISTS. A list is stored as an ORDERED array of
     `{ id, on }`, and the alternative -- a plain array of the enabled ids, with order
     carried by the array and "off" meaning absent -- was considered and rejected:
     unticking a field would lose its position and re-ticking it would send it to the
     end, so somebody toggling one field to compare two outputs would find their order
     quietly rearranged.

     A STORED LIST MAY DISAGREE WITH THE CATALOGUE, AND THE CODE WINS. That is the one
     rule here that is new in kind for this key, and it is applied in this order:

       1. not an array          -> the default for that key, copied
       2. an id the catalogue does not name -> DROPPED, silently, the way
          `normalisePrefs` already drops a retired key
       3. a duplicate id        -> collapsed, the first wins
       4. `on` is `true` only when it is exactly `true`, so a hand-edited blob cannot
          produce a state no click made -- `open` and `rightClickMenu` already read
          this way
       5. a catalogue field the stored list never mentions -> APPENDED AT THE END,
          OFF

     STEP 5 IS WHY A NEW FIELD ARRIVES OFF WHERE A NEW TAB ARRIVES VISIBLE. The two
     differ on purpose: a tab appearing changes nothing about what a button emits,
     where a field appearing TICKED would change what a button produces without being
     asked, which is what §2.8 and §2.14 both warn against. It is still in the list,
     so it is findable, and one click turns it on.

     AN EMPTY SELECTION SURVIVES, AND THE LISTING IS STILL COMPLETED. Zero ticked
     fields is a real state -- the line is the head alone, which is always there,
     because the head is the issue reference and not a field -- so nothing here turns
     an unticked list back on. What step 5 does to a stored `[]` is fill in the
     catalogue's names, all off, and it is unconditional for a reason: the ⚙ panel
     draws its rows FROM this list, so a list that mentions nothing would draw a panel
     with no rows and no click could get back to a field. The export is identical
     either way, and the tie is broken by which one keeps every field findable --
     step 5's own argument.

     The catalogue is not a parameter. There is exactly one, and passing it would
     invite a second. What differs between the two keys is the DEFAULT, so that is
     what is passed. */
  function normaliseFieldList(stored, fallback) {
    // A copy of every ENTRY and not just of the array: `loadPrefs` hands the default
    // out on every malformed blob, so one entry unticked in place by a caller would
    // be unticked for every later read in this tab.
    if (!Array.isArray(stored)) return fallback.map((field) => ({ ...field }));

    const list = [];
    const seen = new Set();
    for (const entry of stored) {
      const id = entry?.id;
      if (!FIELD_CATALOGUE.some((field) => field.id === id)) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      list.push({ id, on: entry.on === true });
    }
    for (const field of FIELD_CATALOGUE) {
      if (!seen.has(field.id)) list.push({ id: field.id, on: false });
    }
    return list;
  }

  /* THE SELECTION, IN ORDER. The stored list carries every catalogue field with a
     flag; what a document prints is the ticked ones, in the order they are stored.
     One function, both keys, and it is what `format` hands the two renderers -- so
     a renderer never sees the flags and cannot be tempted to decide anything about
     an unticked field.

     ZERO IS A REAL ANSWER (decision 9). An empty selection is a state somebody
     clicked their way to, so nothing here fills it back in: the line becomes the
     head alone, with no em dash, which is the shape the renderer already produces
     for an issue Jira said nothing about. */
  function enabledFields(list) {
    return list.filter((field) => field.on).map((field) => field.id);
  }

  /* THE REORDER, AS A PURE FUNCTION, and that is the point rather than the style.

     BOTH DRAGS USE IT. The ⚙ screen's two field lists (§2.14) and, since 1.4.0, the
     collection's own item list (§2.9). It was called `moveField` until 1.4.0 and it
     never touched a field: it is an array move. A second copy of it for items would
     have been a second off-by-one to re-derive and a second set of checks to keep in
     step, which is the drift these harnesses exist to prevent.

     THE CLAIM THAT USED TO STAND HERE IS RETIRED, and it is worth knowing what
     replaced it. This block said no harness in this repository could drive a drag.
     That was true when it was written. It stopped being true at 1.4.0: `boot-smoke`
     keeps the delegated listeners it registers and lets a rect be stubbed per node,
     so the item drag is driven there end to end -- `dragstart`, a `dragover` in a
     NAMED HALF of a named row, and `drop` -- and the write it makes is asserted.
     What no harness drives is the POINTER itself: whether a row is comfortable to
     grab, and whether a long list scrolls when a drag reaches its edge. §7 step 39
     is the browser pass for those two, and step 31 remains the one for the fields.

     ITS CHECKS LIVE IN `smoke.mjs` since 1.4.0, moved there with the rename, because
     a pure helper two features share is that file's whole subject.

     A NEW ARRAY, never the one passed in. `loadPrefs` hands out a fresh object on
     every read, so mutating would be harmless today and would stop being harmless
     the first time a caller held a list across a write.

     `to` IS AN INSERTION POINT AND NOT A DESTINATION INDEX -- it is the gap the row
     lands in, so dropping below the last row is `list.length`. That is what makes
     the caller's arithmetic `index + (after ? 1 : 0)` and nothing more, and it is
     where the off-by-one lives: removing the row first shifts every gap after it
     down by one, which is the `to > from` correction below. Both ends are clamped,
     so an index from a stale row cannot throw on a path that ends in a preference
     write. */
  function moveInList(list, from, to) {
    // `Number.isInteger` and not `>= 0`, because a drop reads its index off a
    // dataset, where every value is a string: `"3" >= 0` is true and
    // `splice("3", 1)` would work, but `NaN` passes both comparisons and
    // `splice(NaN, 1)` silently moves the FIRST row. A move nobody asked for is
    // worse than a move that does not happen.
    if (!Number.isInteger(from) || from < 0 || from >= list.length) {
      return list.slice();
    }
    const next = list.slice();
    const [entry] = next.splice(from, 1);
    const target = Number.isInteger(to) ? (to > from ? to - 1 : to) : next.length;
    next.splice(clamp(target, 0, next.length), 0, entry);
    return next;
  }

  function readStoredBasis(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return clamp(Math.round(value), BASIS_MIN, BASIS_MAX);
  }

  function readStoredSize(value) {
    if (!value || typeof value !== "object") return null;
    const inline = Number(value.inline);
    const block = Number(value.block);
    if (!Number.isFinite(inline) || !Number.isFinite(block)) return null;
    // Clamped against THIS window, not the one the size was taken in. A size
    // dragged on a large monitor must not put the grip off-screen on a laptop,
    // because the grip is the only way to get the size back (risk 10).
    return {
      inline: clamp(
        Math.round(inline),
        MIN_INLINE,
        Math.max(MIN_INLINE, window.innerWidth - 32),
      ),
      block: clamp(
        Math.round(block),
        MIN_BLOCK,
        Math.max(MIN_BLOCK, window.innerHeight - 32),
      ),
    };
  }

  // A read-modify-write, like the store's, and for the same reason: a tab that has
  // been open since this morning must not write a stale corner over a layout
  // changed since (§2.5). A FAILED PREFERENCE WRITE DOES NOT SET `writeFailed` --
  // that flag is the collections' and its sentence is about the collections.
  function savePrefs(patch) {
    const next = normalisePrefs({ ...loadPrefs(), ...patch });
    try {
      GM_setValue(PREFS_KEY, JSON.stringify(next));
    } catch (e) {
      logger.error("could not write the preferences", e);
    }
    scheduleRender();
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
   * Returns the tier as well. It reaches no UI: it is written to the console at
   * debug level, which is how §7 step 5 is checked on each of the NINE views --
   * seven from the survey, plus the Team's Timeline tab and Rovo search, both of
   * which USING the Cart found (§2.1). Risk 19 now expects a tenth, and names a
   * candidate: the table this file's ROW_SELECTOR calls `datasource-table-view` is
   * a smart-link table, so it is embedded in places no survey has opened.
   *
   * ROVO SEARCH IS WHY TIER 1's PAIRING WITH A ROW IS SPELLED OUT HERE. Four of the
   * six tiers -- 1, 2, 3 and 5 -- are behind `if (row)`, so naming a row for a view
   * whose summary field is NOT also named moves nothing: measured on 2026-08-25, the
   * cascade went tier 0 to tier 0, and reached tier 1 only when both were there. A
   * row entry without a summary entry is a change that looks like a fix.
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
   * ONE PASS over the issue anchors on the page, feeding both jobs: the contract
   * check, and the live list of §2.3. They walk the same anchors and exclude the
   * same UI, so they share the walk.
   *
   * An anchor count is never compared with anything. It is not an issue count,
   * and it means something different per view: a backlog card carries two
   * anchors to one issue and a board card carries one, so a check built on
   * anchors would report a defect on the backlog every time it ran (§2.1).
   *
   * `live` is ONE ROW PER KEY FOR THE WHOLE DOCUMENT, in an insertion-ordered
   * Map, SO PAGE ORDER SURVIVES. The same issue has several DOM homes -- a
   * backlog card carries the visible key and a screen-reader twin -- and the
   * representative is the WIDEST anchor, which on the backlog is the visible key.
   * That selects the right element without naming `…screen-reader-key`, and so
   * without adding a testid to the list of things that can rot (§2.3).
   *
   * NOTE THAT THIS IS NOT §2.7's GROUP RULE. The floating button groups by (row,
   * key) and places itself beside the anchor that says nothing but the key. The
   * live list deduplicates across the whole document and READS from the widest.
   * The two rules answer different questions and must not be merged.
   *
   * `wantLive` is what keeps a closed drawer costing exactly what it cost before
   * the drawer existed: the widths are the only part that forces layout, and
   * nothing reads them until there is a list to draw.
   */
  function scanPage(wantLive) {
    const keys = new Set();
    const rows = new Set();
    const unexplained = new Set();
    const live = new Map();

    for (const anchor of document.querySelectorAll(ISSUE_ANCHOR)) {
      // The Cart's own UI is excluded from the scan, and SINCE 0.4.0 THIS LINE IS
      // WHAT STOPS THE LIVE LIST SCANNING ITSELF. §2.3 wrote it when the drawer
      // held no `/browse/` anchors at all and called it a guard rather than a fix;
      // the drawer's rows now carry one link per key, so without this every row
      // would find itself, the count would double, and the whole thing would be
      // diagnosed as a Jira change rather than as our own bug.
      if (anchor.closest(UI_SELECTOR)) continue;

      const key = keyFromHref(anchor.getAttribute("href"));
      if (!key) continue;
      keys.add(key);

      if (wantLive) {
        const width = anchor.getBoundingClientRect().width;
        const seen = live.get(key);
        // Mutated in place rather than re-set, so the Map keeps the position of
        // the FIRST anchor for this key and the list stays in page order.
        if (!seen) live.set(key, { anchor, width });
        else if (width > seen.width) {
          seen.anchor = anchor;
          seen.width = width;
        }
      }

      const row = anchor.closest(ROW_SELECTOR);
      if (row) {
        rows.add(row);
        continue;
      }
      if (!anchor.closest(KNOWN_REGION)) unexplained.add(key);
    }

    return { keys, rows, unexplained, live };
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
      //
      // AN ANCHOR WITH NO TEXT AT ALL DOES NOT COUNT, and that guard arrived with
      // rovo search's table on 2026-08-25. Its first cell is an issue-type ICON
      // wrapped in a link to the same issue, and an empty string strips to an empty
      // string -- so document order handed the rail to the icon and the `+` sat
      // beside a picture instead of beside the key. "Says nothing but the key"
      // means its text IS the key, never that it has none. The views that already
      // relied on this test still pass it: the timeline's `RDC-21069, (opens new
      // window)` and the backlog's visible key both have text.
      const otherText = cleanText(other.textContent);
      if (!keyed && otherText && stripKeyPrefix(otherText, key) === "") {
        keyed = other;
      }
    }

    return { place: keyed ?? widest, read: widest };
  }

  function onPointerOver(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest(`#${RAIL_ID}`)) {
      // The pointer is on the rail, so the hover is kept alive whichever of the
      // two buttons it is over -- that is the whole reason the two share one box.
      //
      // WHETHER THE `+` GOES RED IS DECIDED BY THE BUTTON AND NOT BY THE RAIL. On
      // a collected link, the pointer on the `+` names removal, so the label goes
      // red BEFORE any click: removal is the one destructive thing this gesture
      // does and there is no undo, so the warning is the safety margin, and it
      // costs one CSS rule (§2.7). The pointer on the COPY button must not make
      // that offer -- it is a different action on the same issue -- so the test is
      // against the toggle's own id and not the rail's.
      cancelGrace();
      setHover(
        hoveredAnchor,
        hoveredReadAnchor,
        !!target.closest(`#${TOGGLE_ID}`),
      );
      return;
    }

    // OUR OWN UI NEVER SUMMONS THE FLOATING BUTTON, and since 0.4.0 that is
    // load-bearing rather than defensive: the drawer's rows hold real issue links
    // now, so hovering a key in the live list would otherwise park the `+` beside
    // it and offer to collect what is already collected. The rail's own check is
    // above this one, because the rail carries the same attribute.
    if (target.closest(UI_SELECTOR)) {
      startGrace();
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

  /**
   * ONE RAIL, TWO BUTTONS, AND THE `+` DOES NOT MOVE. That last part is the
   * constraint the whole geometry is built around: the `+` has sat exactly
   * `TOGGLE_GAP` from the hovered key since 0.1.1, its SIDE was reversed into after
   * a day of use, and it has been reached for daily since. So the copy button is
   * added on the OUTSIDE of it -- further from the link -- and the `+` keeps the
   * position it already had, to the pixel (§2.7.1).
   *
   * `positionRail` and the sheet's `row-reverse` rule are the two halves of that:
   * the rail's right edge sits where the `+`'s right edge used to, and when there
   * is no room on the left and the rail flips to the other side of the link, the
   * flex direction flips with it so the `+` is STILL the button next to the key.
   *
   * The copy button is a preference and ships on (see `DEFAULT_PREFS`). With it
   * off the rail holds one button and is the width it always was, so the switch
   * gives back the 1.2.0 geometry exactly.
   */
  function ensureRail() {
    const existing = document.getElementById(RAIL_ID);
    if (existing?.isConnected) return existing;

    const mount = document.body;
    // At document-start there is no <body> yet. A later signal brings us
    // straight back here.
    if (!mount) return null;

    const rail = document.createElement("div");
    rail.id = RAIL_ID;
    rail.hidden = true;
    // The rail carries it, which is what makes the exclusion work for everything
    // inside it: `closest` walks up. The two buttons carry their own as well, so
    // neither can lose the exclusion if it is ever reparented (§2.3).
    rail.setAttribute(UI_ATTRIBUTE, "");

    // Document order is copy, then toggle, and the sheet turns that into
    // `[🔗][+] link` on the left and `link [+][🔗]` on the right. Neither order is
    // written twice: there is one DOM order and one CSS rule that reverses it.
    rail.append(buildCopy(), buildToggle());

    mount.append(rail);
    logger.debug("hover rail built");
    return rail;
  }

  /**
   * The copy button. It puts the hovered issue on the clipboard at ITEM SCOPE, in
   * whatever shape `Issue reference` names, and it never opens the issue -- which
   * is the whole request: the link of a ticket, without a page load (1.3.0).
   *
   * THE GLYPH IS TYPED, NOT DRAWN, and that is not a reversal of the `+`'s rule.
   * The `+` is drawn because a plus is laid out on the font's math axis and reads
   * as sitting low; `🔗`, `✅` and `⚠️` are emoji with their own metrics and their
   * own colour, and flex centring is exact for them. They are also not new
   * vocabulary: `🔗` is the label the drawer's own button for these bytes already
   * carries, and `✅`/`⚠️` are the two outcomes the foot already flashes (§2.8).
   */
  function buildCopy() {
    const copy = document.createElement("button");
    copy.id = COPY_ID;
    copy.type = "button";
    copy.setAttribute(UI_ATTRIBUTE, "");
    copy.addEventListener("click", (event) =>
      guard(() => {
        // The rail sits over whatever is under the pointer, so this click must
        // not reach Jira's own row handlers either.
        event.preventDefault();
        event.stopPropagation();
        // RETURNED, not called and dropped: `copyOneIssue` is async, and `guard`
        // only catches what it is handed. Its own `try` already reports a failed
        // write, so this is the belt for anything thrown before that.
        return copyOneIssue(
          hoveredAnchor ? keyFromHref(hoveredAnchor.getAttribute("href")) : null,
          hoveredReadAnchor ?? hoveredAnchor,
        );
      }),
    );
    return copy;
  }

  function buildToggle() {
    const toggle = document.createElement("button");
    toggle.id = TOGGLE_ID;
    toggle.type = "button";
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

    return toggle;
  }

  // Lists scroll inside their own containers, so the rail is REPOSITIONED on
  // scroll rather than hidden: hiding on scroll made a one-notch wheel nudge kill
  // the affordance (§2.7).
  function positionRail(rail, withCopy) {
    if (!hoveredAnchor) return false;

    // A virtualised row can unmount under the pointer. A detached or hidden node
    // reports a zero rect, which would park the button in a corner.
    const rect = hoveredAnchor.getBoundingClientRect();
    if (!hoveredAnchor.isConnected || (rect.width === 0 && rect.height === 0)) {
      hoveredSource = null;
      setHover(null, null, false);
      return false;
    }

    // THE RAIL'S WIDTH IS ARITHMETIC AND NEVER A MEASUREMENT. Asking the rail for
    // a rect is wrong twice over: while it is hidden it reports zero, and after it
    // is shown the read is a forced layout in the middle of a pointer move. Two
    // constants and a boolean give the same number with neither cost -- and it is
    // the same reason the `top` below uses `TOGGLE_SIZE` rather than the rail's own
    // height. The buttons are square and the same size, so the rail's height IS
    // `TOGGLE_SIZE`.
    const width = TOGGLE_SIZE + (withCopy ? RAIL_GAP + TOGGLE_SIZE : 0);

    // Left, not right. It was built on the right, and the user asked for the
    // left after a day of use: on every list view surveyed the key sits at the
    // row's left edge and the summary runs off to the right, so a button on the
    // right lands on the busiest part of the row while one on the left sits in
    // the row's own margin, where nothing else is. It also meets the pointer on
    // the way in. It flips to the right only when there is no room at all (§2.7).
    //
    // `width` AND NOT `TOGGLE_SIZE` IS WHAT KEEPS THE `+` STILL. The rail's right
    // edge lands where the `+`'s right edge landed at 1.2.0, so the `+` -- the
    // rail's last child, and its rightmost on this side -- is exactly where it has
    // always been, and the copy button is the thing that occupies the new pixels.
    // Subtracting `TOGGLE_SIZE` here instead would move the `+` 28px further from
    // the key, which is the one outcome this whole arrangement is arranged to
    // avoid.
    //
    // Physical `left`/`top` rather than the logical properties, because this is
    // pixel maths against a viewport rectangle.
    let side = "left";
    let left = rect.left - TOGGLE_GAP - width;
    if (left < EDGE_MARGIN) {
      side = "right";
      left = Math.min(
        rect.right + TOGGLE_GAP,
        window.innerWidth - width - EDGE_MARGIN,
      );
    }
    const top = Math.min(
      Math.max(rect.top + (rect.height - TOGGLE_SIZE) / 2, EDGE_MARGIN),
      window.innerHeight - TOGGLE_SIZE - EDGE_MARGIN,
    );

    // WHICH SIDE THE RAIL IS ON IS AN ATTRIBUTE, AND THE SHEET READS IT. On the
    // right, `flex-direction: row-reverse` puts the first child at the far end, so
    // the `+` -- the second child -- is the one beside the key again. The
    // alternative was a second DOM order, which is two orders that can disagree.
    rail.dataset.gtSide = side;
    rail.style.left = `${Math.round(left)}px`;
    rail.style.top = `${Math.round(top)}px`;
    return true;
  }

  let scrollScheduled = false;

  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() =>
      guard(() => {
        scrollScheduled = false;
        const rail = document.getElementById(RAIL_ID);
        // The preference is read here rather than remembered, the way every other
        // reader of it does: a scroll after the switch was flipped in another tab
        // has to place the width the rail actually has.
        if (rail && !rail.hidden) positionRail(rail, loadPrefs().copyButton);
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

    logAdd(key, outcome, written);
  }

  /* THE THREE GLYPHS THE COPY BUTTON CAN SHOW, and they are all borrowed rather
     than invented. `🔗` is the drawer's own label for these exact bytes, and `✅`
     and `⚠️` are the two outcomes the foot already flashes for a copy, so there is
     one vocabulary for one operation whichever control performs it (§2.8).

     Keyed by the flash state so the idle glyph is an entry in the same table
     rather than a fallback beside it. */
  const COPY_GLYPHS = { idle: "🔗", done: "✅", failed: "⚠️" };

  function renderRail(state, prefs) {
    const rail = ensureRail();
    if (!rail) return;
    const toggle = document.getElementById(TOGGLE_ID);
    const copy = document.getElementById(COPY_ID);
    // Both are built with the rail and neither is ever removed, so this cannot be
    // false. It is here because everything below writes to both, and a missing one
    // would be a `TypeError` inside `render`.
    if (!toggle || !copy) return;

    // THE SWITCH IS READ ON EVERY RENDER, like every other preference, so it lands
    // from another tab with nothing to re-wire. Hiding the button rather than
    // leaving it out of the rail is what makes that possible: there is nothing to
    // build or tear down, and the rail's width is told to `positionRail` from the
    // same read.
    copy.hidden = !prefs.copyButton;

    const key = hoveredAnchor
      ? keyFromHref(hoveredAnchor.getAttribute("href"))
      : null;
    if (!key || !positionRail(rail, prefs.copyButton)) {
      rail.hidden = true;
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

    /* THE COPY BUTTON'S GLYPH IS DERIVED HERE, AND THAT IS THE WHOLE REASON THE
       FLASH IS A VALUE RATHER THAN A LABEL. `flash` in the foot writes `✅`
       straight onto the button and gets away with it because `renderFoot` is the
       only thing that rebuilds that label. This button is different in kind: the
       rail is re-rendered by every signal the script has, because its POSITION is
       derived from the hovered anchor -- so a glyph written on the click would be
       replaced by the next `animationstart` React fires, which on a busy page is
       within a frame or two.

       So `copyFlash` is a value `render` reads, and the receipt lasts the full
       900 ms. That is stronger than the foot's, whose `✅` an unrelated re-render
       can still clear early (§2.8 calls it a blink, not a receipt, and says so).
       The two are inconsistent and the inconsistency is recorded rather than
       resolved -- see §6. Nothing here is in storage, which is the part they DO
       agree on. */
    const flashState = copyFlash ?? "idle";
    copy.dataset.gtState = flashState;
    copy.textContent = COPY_GLYPHS[flashState];
    copy.setAttribute(
      "aria-label",
      flashState === "done"
        ? `Copied the link to ${key}`
        : flashState === "failed"
          ? `Could not copy the link to ${key}`
          : `Copy the link to ${key}`,
    );
    // The tooltip names the setting, because what this button emits is not fixed:
    // somebody who set `URL only` gets a bare URL from it, and the button has to
    // say where that came from or it looks broken.
    copy.title =
      flashState === "idle"
        ? `Copy the link to ${key}, in the shape ⚙ Issue reference names. The issue is not opened.`
        : flashState === "done"
          ? `${key} is on the clipboard`
          : "The clipboard write was refused. Press again.";

    rail.hidden = false;
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
    // The badge names the drawer it opens. L1 left both of these off deliberately,
    // because they would have pointed at nothing.
    badge.setAttribute("aria-controls", DRAWER_ID);
    badge.addEventListener("click", () =>
      guard(() => setDrawerOpen(!drawerIsOpen())),
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
    let title = `The Cart: ${count} item${count === 1 ? "" : "s"} in ${collection.name}. Click to ${drawerIsOpen() ? "close" : "open"} the drawer.`;
    let badgeState = "ok";

    // ⚠️ ON THE BADGE, AND THE SENTENCE IN THE DRAWER. Version 0.1.1 put both
    // sentences here because there was no drawer to hold them; §2.9's table gives
    // the badge the symbol and the drawer the words, and a tooltip alone was
    // rejected for those states.
    if (alertLine(state, writeFailed)) {
      badgeState = "failed";
      label = `⚠️ 🛒 ${collection.name} ${count} ▾`;
      title =
        "Something could not be saved or read. Open the Cart: the reason is at the top of the drawer.";
    }

    badge.textContent = label;
    badge.title = title;
    badge.dataset.gtState = badgeState;
    badge.setAttribute("aria-expanded", String(drawerIsOpen()));
  }

  // ---------------------------------------------------------------- copy-out

  // Copied UNCHANGED from `jira-ux-improvements`, because §2.8 says so:
  // `escapeHtml`, `writeClipboard`, `flash`, the 900 ms, and the comment that
  // explains the missing permission gate. `escapeHtml` carries more weight here
  // than it does there: the summary is read off a Jira page and STORED, so an
  // ampersand or an angle bracket in an issue title reaches the clipboard path.
  const COPY_FEEDBACK_MS = 900;

  const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  };

  function escapeHtml(text) {
    return text.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
  }

  async function writeClipboard({ text, html }) {
    if (html && typeof ClipboardItem === "function") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return;
    }

    // No `ClipboardItem`: Links loses its HTML twin and keeps a valid markdown
    // list, which is a complete artifact. Principle 4 is satisfied by the
    // existing function, and §2.8 says this case is still a ✅ with a
    // `logger.debug`, never a ⚠️.
    await navigator.clipboard.writeText(text);
  }

  // Both clipboard callbacks used to be empty in the script this comes from, so a
  // failed copy and a successful one looked identical from the outside: nothing
  // happened either way. `render` puts the real label back, which is why §2.8
  // insists the label is DERIVED INSIDE `render` -- a label written once at
  // construction would keep the ✅ for ever.
  //
  // There is no flash state in storage. The Cart re-renders when another tab
  // writes, so an unrelated change can clear the ✅ early. The fix would be a
  // stored "flashing until" timestamp, which is exactly the kind of value both
  // existing ADRs deleted. The feedback is a blink, not a receipt (§2.8).
  function flash(button, label) {
    button.textContent = label;
    setTimeout(() => guard(render), COPY_FEEDBACK_MS);
  }

  function issueUrl(key) {
    return `${location.origin}/browse/${key}`;
  }

  /* THE ONE STYLE A COPIED LIST CARRIES, and it was measured rather than chosen.
     With a bare `<li>` Outlook gives a wrapped list item no leading and no gap
     after it, so a six-item report arrives as one dense block and the user was
     selecting 1.5 line spacing by hand every time (2026-08-20).

     TWO PROBLEMS, TWO PROPERTIES, and only one of them is what "tight" usually
     means. `line-height` fixes the leading INSIDE a line that wraps.
     `margin-bottom` is what makes one issue read as one block, which
     `line-height` alone does not do. Both were pasted before either was written
     down.

     EVERY FORMAT THAT EMITS A LIST GETS IT -- 🔗 Links as well as 📋 Details.
     Links was excluded for one day on the reasoning that its line is only a key
     and a summary and so does not wrap. THAT PREMISE WAS WRONG: real summaries on
     this instance run 60 to 100 characters, which wraps in any email column, so
     Links had the same fault and the same remedy. Corrected at the user's
     instruction on 2026-08-20 (§2.8, §2.14).

     `mso-line-height-rule` is deliberately ABSENT. Word sometimes needs it to
     honour `line-height`, and if this ever stops taking in Outlook that is the
     next thing to try -- but §2.14 rule 5 is exactly why only one thing changes at
     a time on this path.

     At single-item scope there is no `<ul>` and no `<li>`, so there is nothing for
     this to sit on. */
  const LIST_ITEM_STYLE = "line-height:1.5;margin-bottom:8px";

  /* The two-step ladder's words, in one place and deliberately SHORT.

     The button's box is reserved in the stylesheet so that changing its label can
     never move its neighbours, and the reservation has to fit the longest of these
     plus an emoji. A longer word here would either overflow the box or reopen the
     reflow the reservation exists to stop, which is why they live together rather
     than inline at the point of use.

     THE ITEM COUNT IS DELIBERATELY ABSENT. `Copy 12 items` was the widest label in
     the foot and `✅` the narrowest, a swing of about 90px on a 360px row, which is
     exactly where `flex-wrap` flips -- so pressing the button rearranged the row and
     pressing it again rearranged it back. The count is already on the collection's
     own heading, two lines above (§2.9), so nothing is lost by taking it out of a
     label that has to stay a fixed width. */
  const STEP_LABELS = { busy: "Fetching…", ready: "Copy" };

  /**
   * The four formats of §2.8, as four functions with one signature:
   *
   *     (items, scope, shape) -> { text, html? }
   *
   * `shape` ARRIVES AS AN ARGUMENT AND IS NEVER READ HERE. `format` reads the
   * preference once and hands the same shape to all three consumers, so the head
   * of a line cannot differ between 🔗 Links, 📋 Details and 📊 Report -- there is
   * no second read to fall out of step (§2.8, decision 5). It also keeps these
   * functions PURE, which is what lets `format-smoke` assert their bytes for every
   * shape without a store to stand up. The three formats with no head ignore it,
   * the same way they already ignore `scope`.
   *
   * The four are a SPANNING SET, not a wish list: one rich list a person reads,
   * one plain list a person reads, one list of identifiers, one query. Every
   * other candidate collapses into one of the four.
   *
   * `scope` is "collection", "selection" or "item", and it decides exactly one
   * thing: the `- ` bullet. Markdown's `- ` is list syntax, and one item is not a
   * list, so the GESTURE decides it and nothing has to count the items. The Cart
   * ships only the collection scope today -- the collection IS the selection, and
   * there is no per-row copy (§2.9) -- and the other two are honoured here
   * because they are the seam that makes a fifth format one entry in a list.
   *
   * NO FORMAT EVER DROPS AN ITEM. The lines in a paste always equal the items
   * copied, so a paste is checkable at a glance, and nothing that is pending or
   * broken can be hidden by omitting it.
   *
   * NO FORMAT EMITS THE COLLECTION'S NAME AS A HEADING. It is redundant wherever
   * you paste, wrong for a selection, and invalid inside Keys and JQL.
   */
  function formatLinks(items, scope, shape) {
    const bullet = scope === "item" ? "" : "- ";

    // THE LINE IS THE SHAPE, and it was a literal here until 1.2.0. `markdown` is
    // the shape that literal was, so a default install emits the same bytes it did
    // at 1.1.0 -- which is the whole requirement of these defaults (§2.8, SHAPES).
    //
    // What every shape has to honour, and each does it in its own conditional:
    // THE SEPARATOR GOES WITH ITS VALUE. The code Links comes from writes
    // `${key}](${url}) ${summary}` unconditionally, which leaves a trailing space
    // when there is no summary. That is harmless in `jira-ux`, where a summary is
    // always derived from `document.title`. Here it is not (§2.8).
    const text = items.map((item) => `${bullet}${shape.text(item)}`).join("\n");

    // Only Links writes a rich version among the four. The W3C Clipboard API names
    // exactly three mandatory types -- `text/plain`, `text/html`, `image/png` --
    // and the Cart has no image, so `text/plain` + `text/html` is the whole
    // surface (§2.8).
    //
    // `false`, so the key's anchor is bare. 📋 Details and 📊 Report pass `true`
    // and bold it, because their lines run long and the bold marks where one issue
    // starts; this line is a key and a summary, so there is nothing to find. The
    // two heads have differed here since 📋 Details shipped, and §2.14 said
    // otherwise until it was corrected on 2026-08-25.
    const cell = (item) => shape.html(item, false);

    // The two versions must agree about what the document is: `- ` bullets on the
    // text side, `<ul><li>` on the HTML side. At single-item scope there is no
    // bullet, so there is no `<ul>` either, and the output lands exactly on
    // `jira-ux`'s own 🔗 button. `<ul>`, not `<ol>`: document order already
    // carries the collection's order, and numbering would imply a ranking that
    // does not exist (§2.8).
    const html =
      scope === "item"
        ? cell(items[0])
        : `<ul>${items
            .map((item) => `<li style="${LIST_ITEM_STYLE}">${cell(item)}</li>`)
            .join("")}</ul>`;

    return { text, html };
  }

  // NAMES DROPS ITS BRACKETS WITH THE SUMMARY, and that is not cosmetic: the
  // brackets separate the key from the summary, and with no summary they separate
  // nothing, while `[GLX-402] ` carries a trailing space (§2.8).
  //
  // No rich version, and that is the point of Names: a `<ul>` twin would put
  // bullets into Confluence that were not asked for, and wanting unadorned lines
  // is the reason to choose Names over Links. Plain text alone is not a
  // degradation -- a rich editor renders the line breaks, which is the request.
  function formatNames(items) {
    return {
      text: items
        .map((item) =>
          item.summary ? `[${item.key}] ${item.summary}` : item.key,
        )
        .join("\n"),
    };
  }

  // One line of identifiers with nothing to mark up.
  function formatKeys(items) {
    return { text: items.map((item) => item.key).join(", ") };
  }

  // The query slot of the spanning set, and it keeps its place on utility: it is
  // the way to turn a collection back into something Jira can filter, bulk-edit,
  // save and share. Its target is a search input, so no rich version (§2.8).
  //
  // The QUERY is unchanged. Only its DESTINATION changed on 2026-08-18: the button
  // opens Jira's issue search on it rather than putting it on the clipboard, so
  // filter, bulk-edit, save and share are one click away instead of two. This
  // function is still where the query is built, so there is one source of truth
  // for it and it is still checkable on its own.
  function formatJql(items) {
    return { text: `key in (${items.map((item) => item.key).join(", ")})` };
  }

  /* ------------------------------------------------------------ 📋 Details
     The fifth format, and the only one whose payload is not in storage: it is
     built from what the fetch step is holding in memory (§2.14).

     EVERY COLOUR HERE WAS MEASURED IN A REAL PASTE, on 2026-08-20, into Outlook
     with "keep source formatting" and into Teams in both skins. Four rules came
     out of those pastes, and each one is a change a later session would
     otherwise make on reasonable-sounding instinct:

       1. A SEPARATOR MUST BE A CHARACTER, NEVER A BOX. Outlook strips an inline
          `border`. Two bordered fix-version chips divided by a space arrived as
          `Flex 2026.6.x (LTS track) Flex 2026.9.0` -- one nonsense version. So
          the versions are joined by a comma, in ONE span.
       2. NOTHING MAY DEPEND ON `opacity`. Outlook and Teams both strip it, and
          every muted field came back full-strength black with no hierarchy at
          all. Hence one named grey.
       3. A COLOUR MUST BRING ITS OWN BACKGROUND, AND THAT BACKGROUND MUST BE
          PALE. Teams KEEPS a pale ground and DISCARDS a saturated one, then
          re-maps the white text to its own skin -- so a bold pill loses its
          ground AND its colour and lands as bold black. Making the pill bolder
          so it survives is exactly backwards. The fix for an invisible pill is a
          stronger tint.
       4. NOTHING MAY DEPEND ON A ROW'S POSITION. The list is reshuffled by hand
          after it is pasted, so "print the epic's name only the first time" is
          wrong the moment somebody moves a line, with nothing to say so.
       5. NO `font-size`, AND ESPECIALLY NOT A PERCENTAGE. This is the worst of
          the five and it was found last. Teams DELETED THE CONTENT of every span
          carrying `font-size:88%` -- type, status, priority, assignee, fix
          version, time remaining and the parent link all vanished, leaving a row
          of bare `·` separators. What survived had no `font-size` at all: the
          separators, the key link, the summary and the em dash. The correlation
          was exact across seven field types and four rows.
          **So the hierarchy rests on `color` and `font-weight`, which every
          target keeps.** The metadata is the same SIZE as the summary now. That
          is a real loss and it is the right trade: a quieter line is worth less
          than a line that exists.
          If a size difference is ever wanted back, `em` is the thing to test --
          and it must be TESTED, in Teams, not reasoned about.

     Teams also re-maps `color` to whatever skin it is in, so the light/dark
     question does not arise there; the grey below is for Outlook, and costs
     nothing in Teams. */

  // 4.1:1 on white and 4.1:1 on charcoal. Deliberately mediocre on both rather
  // than ideal on one and unreadable on the other -- the export cannot know which
  // ground it landed on, and rule 2 above took away the adaptive answer.
  const MUTED_INK = "#737c89";

  // One step up Atlassian's own scale from the 100-level tints. The 100-level
  // green was the actual fault: #dcfff1 is a near-white mint that could not be
  // seen on white paper, so `Done` never read as a pill. Each pairing measures
  // above 4.9:1 text-on-ground, and each ground is opaque, so the pill carries
  // its own contrast wherever it lands (rule 3).
  const LOZENGE = {
    new: { bg: "#dcdfe4", fg: "#44546f" },
    indeterminate: { bg: "#cce0ff", fg: "#0055cc" },
    done: { bg: "#baf3db", fg: "#216e4e" },
  };

  // COLOUR MEANS URGENCY, so only the urgent ones are named and everything else
  // is muted. That is honest as well as contrast-safe: P2 is this instance's
  // default, so colouring it said nothing. Atlassian's own #ae2e24 measured
  // 2.1:1 on a dark ground and could not be kept.
  const PRIORITY_INK = { P0: "#d94136", P1: "#d94136" };

  /**
   * ONE FIELD'S VALUE, in both flavours, and it is a switch over `FIELD_CATALOGUE`
   * rather than a list built top to bottom because the ORDER IS NO LONGER HERE. It
   * is in the preference, and this function answers one question about one id.
   *
   * Each bit carries BOTH forms, because the parent is a reference rather than a
   * value -- markdown on the text side, an anchor on the HTML side. One string
   * could not serve both: escaping the markdown would print the brackets.
   *
   * `null` FOR AN ABSENT VALUE, which is how an absent value drops out along with
   * its separator -- the list's version of §2.8's rule that the separator goes with
   * the summary.
   *
   * A CATALOGUE ID WITH NO CASE HERE IS A FIELD THAT CAN BE TICKED AND DRAWS
   * NOTHING, which is the same defect shape as a shape id with no entry in `SHAPES`,
   * and `format-smoke` holds the two together the same way: it ticks every id in the
   * catalogue against an item carrying every field and requires a bit back. The
   * `default` is here so that a mismatch is a field that renders nothing rather than
   * a THROW on the copy path -- a copy that silently never happened is the failure
   * §2.8's scar is about.
   */
  function detailBit(id, item) {
    const bit = (text, html) =>
      text ? { id, text, html: html ?? escapeHtml(text) } : null;

    switch (id) {
      case "type":
        return bit(item.type);
      case "status":
        return bit(item.status);
      case "priority":
        return bit(item.priority);
      case "assignee":
        return bit(item.assignee);
      // NEW AS A ROW FIELD AT 1.2.0 (decision 10), and off by default in both
      // lists. It has been fetched since 1.1.0 for 📊 Report's sub-band headings,
      // and 📋 Details has no headings -- so until this line the field was fetched
      // on every press of either button and unreachable from one of them.
      case "team":
        return bit(item.team);
      // ONE SPAN AND A COMMA (rule 1). An issue can carry several fix versions and
      // the box that used to divide them does not exist in Outlook.
      case "fixv":
        return bit((item.fixVersions ?? []).join(", "));
      // `timetracking.remainingEstimate` prints the same string Jira's own backlog
      // badge shows -- `0m`, `2d`, `1h` -- so the column matches the row it came
      // from. Blank when the issue has no time tracking, and blank on a board that
      // estimates in story points, which is a custom field whose id differs per
      // instance and is out of scope (§2.14).
      case "remaining":
        return bit(item.remaining ? `${item.remaining} left` : "");
      case "parent":
        // THE KEY ALONE, AND IT IS A LINK. The epic's name repeats identically
        // down a list built from one epic -- three identical tails in a six-item
        // sample, each pushing its row onto a second wrapped line -- and the key
        // being a link puts the name one click away instead. Rule 4 rules out the
        // clever alternative of naming it only on its first appearance.
        //
        // The anchor's colour is NAMED, because a link does not inherit the colour
        // of the span around it: the browser's own stylesheet wins, and without
        // this the parent would arrive as a bright blue link competing with the
        // issue's own key, which is the one link on the line that matters.
        return item.parent
          ? bit(
              `↳ [${item.parent.key}](${issueUrl(item.parent.key)})`,
              `↳&nbsp;<a href="${escapeHtml(issueUrl(item.parent.key))}" style="color:${MUTED_INK}">${escapeHtml(item.parent.key)}</a>`,
            )
          : null;
      default:
        return null;
    }
  }

  /**
   * The fields after the summary, IN THE ORDER THE PREFERENCE STORES THEM.
   *
   * `fields` is the ticked selection of §2.14's one catalogue -- ids, in order --
   * and it arrives from `format`, which reads it once per copy. It replaced a
   * `skip` list at 1.2.0, and the direction matters: a skip list says which fields
   * a FORMAT declines, so the format owns the answer; a selection says which fields
   * a DOCUMENT uses, so the preference does and the two documents can differ
   * without either of them knowing about the other.
   *
   * ONE CATALOGUE, TWO SELECTIONS. The ids, their labels and every measured style
   * live once -- in `FIELD_CATALOGUE`, `detailBit` and `detailChip` -- and a
   * preference can only say which of them a document uses and in what order. That
   * is what stops 📋 Details and 📊 Report drifting now that each has its own list,
   * and it is why the five paste rules cannot be reached by a click: they are
   * properties of the paste target rather than of a format, so one copy of them is
   * the only safe number.
   *
   * AN EMPTY SELECTION RETURNS AN EMPTY LIST, and both renderers already draw that:
   * the line is the head alone, with no em dash, which is exactly what they emit for
   * an issue Jira returned nothing about (decision 9).
   */
  function detailBits(item, fields) {
    const bits = [];
    for (const id of fields) {
      const bit = detailBit(id, item);
      if (bit) bits.push(bit);
    }
    return bits;
  }

  /**
   * One field, drawn. SHARED BY 📋 Details AND 📊 Report, because the five rules of
   * §2.14 are properties of the paste target and not of a format -- two copies of
   * this would let one drift and the other stay right, and only a real paste would
   * ever say so.
   */
  function detailChip(bit, item) {
    if (bit.id === "status") {
      const paint = LOZENGE[item.category] ?? LOZENGE.new;
      return `<span style="background:${paint.bg};color:${paint.fg};border-radius:3px;padding:0 6px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">${bit.html}</span>`;
    }
    if (bit.id === "priority") {
      const ink = PRIORITY_INK[item.priority] ?? MUTED_INK;
      return `<span style="color:${ink};font-weight:700">${bit.html}</span>`;
    }
    if (bit.id === "type") {
      // JUST THE WORD, in the same grey as every other field. There was a coloured
      // ■ in front of it, and a real paste killed it on 2026-08-20: the argument
      // for it was "a dim square is still a square, where dim text is not still
      // readable", which holds only where the colour survives. Where it does not --
      // and that is most places, because Teams re-maps colour and a reader scanning
      // text sees none of it -- it is a BARE BLACK BOX in front of a word that
      // already says everything. It read as a broken glyph. The type is emphasised
      // by weight instead, which every target keeps.
      return `<span style="color:${MUTED_INK};font-weight:600">${bit.html}</span>`;
    }
    return `<span style="color:${MUTED_INK}">${bit.html}</span>`;
  }

  /**
   * §2.14's format, and the reason it is a fifth slot rather than a sixth column
   * on an existing one: the other four each serve ONE destination, and this one
   * has to survive six with different renderers -- two of which (Teams, Slack)
   * cannot draw a table at all.
   *
   * ONE ISSUE IS ONE LINE, so it is one thing to drag when the list is reshuffled
   * in the editor it was pasted into. That is a stated requirement, not a
   * preference.
   *
   * `items` arrive ALREADY CARRYING their fetched fields, so this function stays a
   * pure function of its arguments and is as testable as the other four. The merge
   * happens in `detailedItems`, which is the only place that knows the fetch is
   * being held in memory.
   *
   * `fields` IS THE TICKED SELECTION, read once by `format` and handed down. It is
   * applied HERE, at render, and never at fetch -- `DETAIL_FIELDS` asks for all nine
   * whatever the preference says (§2.14).
   */
  function formatDetails(items, scope, shape, fields) {
    const bullet = scope === "item" ? "" : "- ";
    const dot = `<span style="color:${MUTED_INK}"> · </span>`;

    const text = items
      .map((item) => {
        // THE HEAD IS 🔗 LINKS' LINE, and now it is that by construction rather
        // than by two copies of one string agreeing (§2.14, decision 5).
        const head = `${bullet}${shape.text(item)}`;
        const bits = detailBits(item, fields).map((bit) => bit.text);
        /* The em dash earns its place: without it the metadata runs into the
           summary with only a `·` between them, and a summary can contain dashes.

           WITH A PLAIN SHAPE THE EM DASH LANDS AFTER A URL, and the separator
           before that URL is a hyphen the summary may itself contain -- which is
           the exact defect the em dash was invented to prevent, reintroduced by
           the preset. IT IS ACCEPTED, on the user's ground and in the user's
           words: these documents are READ AND NEVER PARSED. Nothing regex-parses
           a pasted report, so the ambiguity costs a machine and not a reader, and
           the em dash still marks where the metadata starts. Both alternatives
           are declined rather than untried (A.9.1, decision 28). Do not "fix"
           this by giving the plain shapes their own separator without pasting
           one first. */
        return bits.length ? `${head} — ${bits.join(" · ")}` : head;
      })
      .join("\n");

    const cell = (item) => {
      const bits = detailBits(item, fields);
      const tail = bits.length
        ? `<span style="color:${MUTED_INK}"> — </span>` +
          bits.map((bit) => detailChip(bit, item)).join(dot)
        : "";
      // `true` BOLDS THE KEY, and 🔗 Links passes `false`. That is the one place
      // the two heads differ, it has been true since this format shipped, and it
      // is deliberate: this line carries a field tail and runs long, so the bold
      // key is what says where one issue starts (§2.14, corrected 2026-08-25).
      return shape.html(item, true) + tail;
    };

    // The two versions must agree about what the document is, exactly as Links
    // does: `- ` bullets on the text side, `<ul><li>` on the HTML side, and the
    // same measured `LIST_ITEM_STYLE` on each item (§2.8).
    const html =
      scope === "item"
        ? cell(items[0])
        : `<ul>${items
            .map((item) => `<li style="${LIST_ITEM_STYLE}">${cell(item)}</li>`)
            .join("")}</ul>`;

    return { text, html };
  }

  /* ------------------------------------------------------------- 📊 Report
     §2.15. The same data as 📋 Details, arranged for the audience that asked for
     it: the Technology Portfolio Office sends these to team leads, grouped BY
     PRIORITY AND THEN BY TEAM. That order is the user's, corrected on 2026-08-20
     from an earlier note that had it the other way round -- and since 1.2.0 it is
     the DEFAULT PAIR rather than the only one. Two dropdowns choose the bands
     (decision 12), and the shipped values are still priority then team, so an
     install that never opens ⚙ gets 1.1.0's bytes.

     WHY A SIXTH BUTTON AND NOT A SETTING ON 📋 Details, AND THE REASONING SURVIVES
     THE BANDS BECOMING SETTABLE. Headings over grouped rows is a different DOCUMENT
     from a flat list, not a different arrangement of one -- it reorders the items,
     moves fields into headings, and cannot be checked by "lines equals items". A
     switch that silently decided which of those a button produced is exactly what
     §2.8 warns against. What the two dropdowns configure is THAT document; they do
     not turn one document into the other, which is why a report with NO bands at
     all is not on offer -- it would be 📋 Details spelled differently, so band 1 has
     no `none` and only band 2 does (decision 12).

     THE BUTTON YOU PRESS IS THE BUTTON THAT ANSWERS. `detailsHeld` carries the KIND
     that produced it and a button offers a copy only for its own kind -- reversed
     on 2026-08-21, from use, after a day of one press arming both stepped buttons.
     The held result really does describe the collection rather than a button, and
     that argument was right about the DATA and wrong about the CONTROL: watching a
     button you did not press walk through `Fetching…` is broken however correct its
     state is. What the two exports still share is the FETCH, which is why one field
     list serves both requests (§2.14, §2.15).

     A TICKED FIELD IS PRINTED, BAND OR NOT (decision 8). `DEFAULT_PREFS.reportFields`
     leaves priority and team unticked, so the report emits exactly what 1.1.0
     emitted: type, status, assignee, fix version, time remaining and the parent. The
     ⚙ panel MARKS a field that is also a heading; it does not veto it. A field that
     appeared only in a heading would be a field whose meaning depends on the row's
     position, which is what §2.14 rule 4 is about, and these lists are reshuffled by
     hand after they are pasted. */

  /* THE NAME AN ABSENT VALUE TAKES, one per band, and it is a NAME rather than a
     blank heading because a fact about the issue must not read as a failure. Said
     once, in the heading, rather than repeated down a column.

     These two are constants where the other five are literals in `BANDS` below, and
     the reason is that these two are what the SHIPPED DEFAULTS emit: §2.15's worked
     example names them, and `format-smoke` asserts that example byte for byte
     against these identifiers. */
  const NO_PRIORITY = "No priority";
  const NO_TEAM = "No team";

  /* THE THREE STATUS CATEGORIES, IN THEIR ORDER. This is the only rank table in the
     file, and IT DOES NOT REOPEN §2.15's REFUSAL OF ONE FOR PRIORITY -- the
     difference is the whole reason it is safe. Priority names are THIS INSTANCE's
     own and already sort correctly as strings, so a rank over them could only fall
     out of step with Jira's own scheme. These three are ATLASSIAN's fixed
     vocabulary: `new`, `indeterminate` and `done` are the only values the field
     returns, they are finite, and they do not sort meaningfully as strings in either
     direction.

     BANDING BY STATUS NAME IS WHAT THIS AVOIDS, and it is why the band id is
     `category` where the row field is `status`. The names are this instance's
     wording, so a band on them gives `Dev In progress`, `Dev Resolved`, `To Do` --
     alphabetical noise dressed as a workflow (decision 13).

     ONE LIST GIVES BOTH THE LABEL AND THE RANK, so a heading and its position cannot
     come to disagree. A key this list does not name ranks LAST, which is where an
     absent value goes in every band. */
  const STATUS_BANDS = [
    ["new", "To do"],
    ["indeterminate", "In progress"],
    ["done", "Done"],
  ];

  /* THE SEVEN BANDS, and each answers two questions about an item: WHICH GROUP it
     joins, and WHAT THAT GROUP IS CALLED. They are separate answers on purpose --
     GROUP BY ID, LABEL BY NAME. Two teams can be given the same name and a heading
     that silently merged them would be a WRONG report rather than an ugly one
     (appendix C.4), which is the same shape of decision as §2.4's opaque collection
     id against its editable name. Where a value IS its own identity, as a priority
     name is, the two answers are the same string and nothing is spent saying so.

     `of` RETURNS A LIST, because one band is multi-valued. Six of the seven return
     exactly one entry. `fixv` returns ONE PER RELEASE, so an issue in two releases
     appears in two bands and the paste then has a line per issue-and-band rather
     than per issue -- the one place `lines equals items` is not the check (decision
     15). §2.14's rule that NO FORMAT EVER DROPS AN ITEM is untouched by that:
     nothing vanishes, something repeats, and the two must not be conflated.

     AN EMPTY `label` IS AN ABSENT VALUE. It takes `empty` as its heading and it
     sorts LAST, because "not set" is not a peer of a real value.

     `rank` IS OPTIONAL AND ONLY `category` HAS ONE. Everything else sorts by its
     label as a plain string, which is already right for priority (`P0` before `P1`),
     for names, and for release names.

     THE IDS AND THEIR ORDER MUST MATCH `BAND_IDS`, which is what a stored value is
     range-checked against and what the ⚙ dropdowns are built from. `format-smoke`
     holds the two together the way it holds `SHAPES` against `LINE_SHAPE_IDS`: a
     band this table lacks is a preference that groups nothing, and one `BAND_IDS`
     lacks is unreachable. They are two lists rather than one because `BAND_IDS` is
     read by `normalisePrefs`, hundreds of lines above anything that can render.

     TIME REMAINING IS ABSENT, AND THAT IS THE POINT. Its band order would be string
     order over durations -- `"10m" < "2d" < "9h"` -- which reads as a broken report
     rather than a configured one, so it is a row field and never a band (decision
     14). Do not add it back on the reasonable-sounding grounds that a field is a
     field. */
  const BANDS = [
    {
      id: "priority",
      label: "Priority",
      empty: NO_PRIORITY,
      of: (item) => [{ key: item.priority ?? "", label: item.priority ?? "" }],
    },
    {
      id: "team",
      label: "Team",
      empty: NO_TEAM,
      // The id is a UUID and is exact. A team that came back with a name and no id
      // still gets its own group rather than joining the nameless one, which is
      // what the `name:` prefix is for -- it cannot collide with a UUID.
      of: (item) => [
        {
          key: item.teamId || (item.team ? `name:${item.team}` : ""),
          label: item.team ?? "",
        },
      ],
    },
    {
      id: "category",
      label: "Status category",
      empty: "No status",
      of: (item) => [
        {
          key: item.category ?? "",
          label: STATUS_BANDS.find(([key]) => key === item.category)?.[1] ?? "",
        },
      ],
      rank: (key) => {
        const at = STATUS_BANDS.findIndex(([one]) => one === key);
        return at < 0 ? STATUS_BANDS.length : at;
      },
    },
    {
      id: "assignee",
      label: "Assignee",
      // The one absent-value name that is not "No …", because English already has
      // the word and a report that said `No assignee` would be saying it worse.
      empty: "Unassigned",
      // GROUPED BY ACCOUNT ID, LABELLED BY DISPLAY NAME, for the reason the team is:
      // two people can carry the same display name, and a heading that merged them
      // would be a wrong report rather than an ugly one. The id costs nothing --
      // `accountId` arrives inside the assignee object the Cart already asks for.
      of: (item) => [
        {
          key: item.assigneeId || (item.assignee ? `name:${item.assignee}` : ""),
          label: item.assignee ?? "",
        },
      ],
    },
    {
      id: "type",
      label: "Type",
      empty: "No type",
      of: (item) => [{ key: item.type ?? "", label: item.type ?? "" }],
    },
    {
      id: "fixv",
      label: "Fix version",
      empty: "No fix version",
      // THE FLAG IS ON THE BAND AND NOT IN THE ⚙ PANEL, so the note that tells the
      // user what a multi-valued band costs is a question asked of this table rather
      // than a literal `"fixv"` somewhere else that would have to be remembered if a
      // second one ever arrived. Nothing in the RENDERER reads it: `of` returning a
      // list is what actually makes the band multi-valued, and this only says so.
      multi: true,
      // THE MULTI-VALUED ONE. An issue in two releases yields two entries and so
      // appears under both headings, which is the only reason to group by release at
      // all: a per-release section that listed an issue under `Flex 2026.6.x (LTS
      // track), Flex 2026.9.0` would not be listing that release. The alternatives
      // are in §4 and both were weighed rather than skipped.
      of: (item) => {
        const versions = item.fixVersions ?? [];
        return versions.length
          ? versions.map((name) => ({ key: name, label: name }))
          : [{ key: "", label: "" }];
      },
    },
    {
      id: "parent",
      label: "Parent",
      // `No epic` and not `No parent`: the field is the parent and the thing a
      // report is grouped by is the epic, which is the word the reader uses.
      empty: "No epic",
      /* GROUPED BY KEY, LABELLED BY KEY AND SUMMARY. The key is exact and the
         summary is what a section heading has to say -- `RDC-26701` alone tells a
         team lead nothing, and Jira's own issue header is this same pair in this
         same order.

         §2.14 REJECTED THE EPIC'S SUMMARY ON THE ROW and that rejection does not
         reach here: its ground was REPETITION -- 21 characters a line, identical on
         three of six rows, pushing rows onto a second wrapped line -- and a heading
         says it once, for the whole group.

         THE BAND COMES FROM `bulkfetch` AND NEVER FROM THE DOM. §6 item 7's warning
         is that a board card renders its parent epic's SUMMARY TEXT and not its key,
         so grouping read off the page would join on a display string: two epics with
         the same summary would merge, and one epic renamed mid-list would split. */
      of: (item) =>
        item.parent
          ? [
              {
                key: item.parent.key,
                label: item.parent.summary
                  ? `${item.parent.key} ${item.parent.summary}`
                  : item.parent.key,
              },
            ]
          : [{ key: "", label: "" }],
    },
  ];

  /* WHICH BAND A STORED ID MEANS, and `undefined` for `none` and for anything this
     build does not know. Both are handled the same way one line down, and neither
     can THROW on the copy path -- the same reason `detailBit` has a `default` that
     returns null. `none` is the ordinary case for band 2; an unknown id cannot
     normally arrive at all, because `normalisePrefs` range-checks both keys against
     `BAND_IDS` on the way in and on the way out (ticket 01). */
  function bandFor(id) {
    return BANDS.find((band) => band.id === id);
  }

  /**
   * WHAT ONE BAND DROPDOWN WRITES, AND IT IS SOMETIMES TWO KEYS. Pure, and it is
   * pure for the reason `moveInList` is: it is the whole of a rule that a user reaches
   * through a control, so the harness can hold the rule directly and the handler
   * stays one line.
   *
   * THE TWO BANDS MAY NOT NAME THE SAME FIELD (§2.15, reversed from use on
   * 2026-08-25). Two things enforce that between them and neither is enough alone:
   * `Then by` never OFFERS the field `Group by` holds, so band 2 cannot make a
   * duplicate at all; and moving `Group by` onto the field `Then by` holds SWAPS the
   * two, which is this function.
   *
   * A SWAP AND NOT A REFUSAL, and not band 2 cleared either. Somebody who asks to
   * group by the field that was the sub-band is reordering the report, which is the
   * one thing the two dropdowns exist to do, and the swap is that reorder in one
   * press with nothing thrown away. It is the only place on this screen where a
   * press moves a control other than the one pressed, so it is worth being able to
   * say why: the second control does not acquire a value nobody chose -- it receives
   * the one the FIRST control just gave up, in the same gesture.
   *
   * THE GUARD IS THAT BAND 1 MAY NEVER RECEIVE `none`. It cannot arise from a click,
   * because band 2's dropdown does not offer band 1's field; it is here so that the
   * rule is a property of the function rather than of the options list, which is a
   * thing a later session can change.
   *
   * The pair comes from `SETTINGS_TABS`, which is the one place the structure is
   * written down, and the OTHER band is found by which one already holds the value
   * rather than by being "the one that is not this one" -- so a third band would need
   * no line here.
   */
  function bandPatch(key, value, prefs) {
    const pair = SETTINGS_TABS.find((tab) => tab.bands?.includes(key))?.bands ?? [];
    const held = pair.find((one) => one !== key && prefs[one] === value);
    return held && prefs[key] !== NO_BAND
      ? { [key]: value, [held]: prefs[key] }
      : { [key]: value };
  }

  // P0 before P1 before P2: the plain string sort is already right, which is why
  // there is no rank table for a priority to fall out of step with Jira's own
  // scheme. An empty value sorts LAST in every band, because "not set" is not a peer
  // of a real value.
  function byLabel(a, b) {
    if (a === b) return 0;
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  }

  /**
   * ONE LEVEL OF GROUPING. Every group carries the heading it will print and the
   * items under it, in the collection's own order -- which survives inside a group
   * in every format, as it always has.
   *
   * NO BAND IS ONE GROUP WITH NO HEADING, and that single line answers two cases at
   * once: band 2 set to `None`, which is the one-level report decision 12 offers,
   * and a band 1 that somehow named something this build cannot resolve, which
   * degrades to a flat list rather than throwing while a copy is in flight.
   *
   * A MULTI-VALUED BAND PUTS ONE ITEM IN SEVERAL GROUPS. That is `fixv` and nothing
   * else today, and it is the stated exception to `lines equals items` (decision
   * 15). It falls out of `of` returning a list and needs no branch here.
   */
  function bandGroups(items, band) {
    if (!band) return [{ key: "", heading: null, items }];

    const groups = new Map();
    for (const item of items) {
      for (const value of band.of(item)) {
        if (!groups.has(value.key)) {
          groups.set(value.key, {
            key: value.key,
            heading: value.label || band.empty,
            label: value.label,
            items: [],
          });
        }
        groups.get(value.key).items.push(item);
      }
    }

    // Sorted by the RANK where a band has one and by the LABEL where it does not,
    // and never by the key -- a key is an opaque UUID for the team and an
    // Atlassian keyword for the category, so sorting on it would be arbitrary in one
    // band and alphabetical noise in the other.
    return [...groups.values()].sort(
      band.rank
        ? (a, b) => band.rank(a.key) - band.rank(b.key)
        : (a, b) => byLabel(a.label, b.label),
    );
  }

  /**
   * The two bands, outer then inner, and the collection's own order inside.
   *
   * `bands` IS THE STORED PAIR, read once by `format` and handed down, exactly as
   * the field selection and the line shape are. Nothing in here reads storage, so
   * the whole report stays a pure function of its arguments and is as testable as
   * the other five formats.
   */
  function reportGroups(items, bands) {
    const [outer, inner] = (bands ?? []).map(bandFor);
    return bandGroups(items, outer).map((band) => ({
      key: band.key,
      heading: band.heading,
      groups: bandGroups(band.items, inner),
    }));
  }

  function formatReport(items, scope, shape, fields, bands) {
    const groups = reportGroups(items, bands);

    const text = groups
      .map((band) =>
        [
          ...(band.heading === null ? [] : [`**${band.heading}**`]),
          ...band.groups.map((group) =>
            [
              ...(group.heading === null ? [] : [`*${group.heading}*`]),
              ...group.items.map((item) => {
                const bits = detailBits(item, fields).map((bit) => bit.text);
                // The same head as the other two exports, from the same one
                // preference. The bullet is a literal here because a report is a
                // list of lists and there is no item scope to reach it (§2.15).
                const head = `- ${shape.text(item)}`;
                return bits.length ? `${head} — ${bits.join(" · ")}` : head;
              }),
            ].join("\n"),
          ),
        ].join("\n\n"),
      )
      .join("\n\n");

    /* `<strong>` and `<em>` are TAGS rather than styles, deliberately: §2.14 rule 5
       is what a paste does to a styled span, and a tag cannot be stripped the same
       way. `<p>` carries only a margin, which is the most ordinary property in
       email HTML.

       `<p><strong>` and not `<h3>`: a pasted heading joins the host document's
       outline, and a status mail should not add sections to somebody's page. */
    const html = groups
      .map((band) => {
        const head =
          band.heading === null
            ? ""
            : `<p style="margin:14px 0 2px"><strong>${escapeHtml(band.heading)}</strong></p>`;
        return (
          head +
          band.groups
            .map((group) => {
              const sub =
                group.heading === null
                  ? ""
                  : `<p style="margin:8px 0 2px"><em>${escapeHtml(group.heading)}</em></p>`;
              const rows = group.items
                .map((item) => {
                  const bits = detailBits(item, fields);
                  const tail = bits.length
                    ? `<span style="color:${MUTED_INK}"> — </span>` +
                      bits
                        .map((bit) => detailChip(bit, item))
                        .join(`<span style="color:${MUTED_INK}"> · </span>`)
                    : "";
                  return (
                    `<li style="${LIST_ITEM_STYLE}">` +
                    shape.html(item, true) +
                    tail +
                    "</li>"
                  );
                })
                .join("");
              return `${sub}<ul>${rows}</ul>`;
            })
            .join("")
        );
      })
      .join("");

    return { text, html };
  }

  // Jira's own issue navigator, and the path is the user's, read off their instance
  // on 2026-08-18. `encodeURIComponent` and not a hand-rolled escape: the query
  // carries spaces, commas and parentheses, and one of them unencoded is a search
  // that silently returns the wrong set.
  //
  // THIS PATH HAS A CEILING THAT `bulkfetch` DOES NOT (§2.6): a URL can be too
  // long, where a POST body cannot. At the expected 20 to 50 items the query is a
  // few hundred characters, which is nowhere near any browser's limit, so the
  // ceiling is recorded rather than guarded (risk 5).
  function searchUrl(jql) {
    return `${location.origin}/issues/?jql=${encodeURIComponent(jql)}`;
  }

  /* ------------------------------------------------------- the line shapes
     THE HEAD OF A LINE, AS FIVE NAMED SHAPES. §2.8 shipped one -- `[KEY](url)
     Summary` -- and 1.2.0 makes it a preference. ONE PREFERENCE, READ ONCE IN
     `format` AND HANDED TO ALL THREE CONSUMERS, so §2.14's promise that
     📋 Details' head is 🔗 Links' line stays true by construction: there is no
     second value to keep in step. A per-export override is left in §6 and costs
     one nullable key each (decision 5).

     THIS IS A PRESET LIST AND NOT A TEMPLATE, and §2.8's finding is untouched. A
     shape is a pair of functions in this file, so `detailChip` is still the one
     place styling is written and no preference can reach it -- which is what keeps
     the five measured paste rules of §2.14 enforceable. A fill-in-the-blanks
     template would put user-written HTML on the clipboard and leave those rules
     nothing to hold on to (§2.8, decision 2).

     EVERY SHAPE DEFINES BOTH FLAVOURS (decision 6). One that changed only
     `text/plain` would silently do nothing in Outlook, Word, Teams and Confluence,
     which all take the HTML -- a setting that quietly fails to apply, which is the
     thing §2.14 warns about.

     `bold` IS THE ONE PLACE THE THREE HEADS DIFFER, and the difference is
     deliberate rather than an oversight. 📋 Details and 📊 Report put
     `font-weight:600` on the key and 🔗 Links does not, because their lines carry a
     field tail and run long, so the bold key is what marks where one issue starts.
     Links' line is a key and a summary, so there is nothing to find. §2.14 claimed
     the two heads were identical; they never were on the HTML side, and that claim
     is corrected there rather than made true here (2026-08-25).

     ALL FIVE SURVIVED A REAL PASTE on 2026-08-24 (appendix A.9.1). Every shape read
     correctly and a visible URL arrived clickable, which is what makes the three
     URL-bearing shapes available on all three exports rather than on 🔗 Links alone.
     `markdown-key` was asked for BY that paste; the prototype had no such row.

     THE EM DASH COLLISION IS ACCEPTED, on the user's ground and in the user's
     words: THESE DOCUMENTS ARE READ AND NEVER PARSED. `RDC-1513`'s real summary
     contains ` - ` itself, so `key-summary-url` uses the summary's own punctuation
     as its URL separator, and 📋 Details' em dash then lands after 45 characters of
     link. Nothing regex-parses a pasted report, so that costs a machine's ambiguity
     rather than a reader's, and the em dash still marks where the metadata starts.
     Both alternatives -- a different separator before the URL, and withholding the
     plain shapes from the two exports that carry a field tail -- are DECLINED
     rather than untried (appendix A.9.1, decision 28).

     THE SEPARATOR GOES WITH ITS VALUE, in every shape and both flavours. `GLX-402`
     has no summary, so `key-summary-url` must emit `GLX-402 - url` and never
     `GLX-402: - url`. That is §2.8's oldest rule about this line and it is why each
     shape builds its own conditional instead of joining a list of parts.

     THE IDS HERE ARE `LINE_SHAPE_IDS`, IN THIS ORDER, and `format-smoke` asserts it.
     Two lists rather than one derived from the other, and the reason is load order:
     the vocabulary has to exist ABOVE `DEFAULT_PREFS`, which is built at load, and
     these bytes have to live beside the formatters that emit them -- a `const` up
     there reading `SHAPES` down here would be a temporal dead zone and the script
     would throw on load. So the harness holds the two together instead. A table
     naming an id the list lacks is an unreachable shape; an id with no table is a
     preference that renders nothing. */
  const SHAPES = [
    {
      // WHAT 1.1.0 SHIPPED, and the default. `[KEY](url) Summary`, where the key
      // alone is the link and the summary sits outside it -- a syntax limit rather
      // than a taste, because MARKDOWN CANNOT NEST SQUARE BRACKETS, so a
      // `[KEY] Summary` label cannot be a link label (§2.8).
      id: "markdown",
      label: "Markdown link on the key",
      text: (item) =>
        `[${item.key}](${issueUrl(item.key)})${item.summary ? ` ${item.summary}` : ""}`,
      // The `&nbsp;` after the anchor is taken verbatim from `jira-ux`, and it drops
      // with the summary for the same reason the space above does.
      html: (item, bold) =>
        `<a href="${escapeHtml(issueUrl(item.key))}"${bold ? ` style="font-weight:600"` : ""}>${escapeHtml(item.key)}</a>` +
        (item.summary ? `&nbsp;${escapeHtml(item.summary)}` : ""),
    },
    {
      // ASKED FOR BY THE PASTE, not offered by the prototype (A.9.1, decision 27).
      // The markdown counterpart of `key-url`: a link column and nothing else, for
      // a list that is scanned down its keys. The summary is DROPPED rather than
      // absent, so this is the one shape whose output does not depend on it.
      id: "markdown-key",
      label: "Markdown link, no summary",
      text: (item) => `[${item.key}](${issueUrl(item.key)})`,
      html: (item, bold) =>
        `<a href="${escapeHtml(issueUrl(item.key))}"${bold ? ` style="font-weight:600"` : ""}>${escapeHtml(item.key)}</a>`,
    },
    {
      // THE SHAPE §4 REJECTED, AND THE REJECTION IS OVERTURNED (decision 4). Its
      // ground was "its only distinct paste target cannot be named"; the user named
      // it -- A DESTINATION THAT DOES NOT RENDER MARKDOWN, where `[KEY](url)`
      // arrives as its own source code and the URL is not there to click.
      //
      // The punctuation is NOT §4's `[KEY] Summary — URL`, and both differences are
      // deliberate. No brackets, because in the destination this shape exists for
      // they read as the leftover markdown it is meant to avoid. And a hyphen
      // rather than an em dash before the URL, because 📋 Details and 📊 Report
      // already spend the em dash on the boundary between the line and its fields.
      id: "key-summary-url",
      label: "Key, summary, then the URL",
      text: (item) =>
        `${item.key}${item.summary ? `: ${item.summary}` : ""} - ${issueUrl(item.key)}`,
      // THE URL IS THE ANCHOR'S OWN VISIBLE LABEL. That is the whole point of the
      // shape and it is what the paste had to confirm: it arrives displayed AND
      // clickable, so one shape serves a reader who can follow a link and a reader
      // who is looking at printed text (A.9.1).
      //
      // The anchor names no colour, exactly as the key's does not: this is the one
      // link on the line that matters, and it should look like one. The PARENT's
      // anchor is the one that has to name a colour, for the opposite reason
      // (§2.14).
      html: (item, bold) =>
        (bold
          ? `<span style="font-weight:600">${escapeHtml(item.key)}</span>`
          : escapeHtml(item.key)) +
        (item.summary ? `: ${escapeHtml(item.summary)}` : "") +
        ` - <a href="${escapeHtml(issueUrl(item.key))}">${escapeHtml(issueUrl(item.key))}</a>`,
    },
    {
      // The key as an identifier and the URL as a link, for the same destination as
      // the shape above with the summary left off -- a short, uniform column when
      // the summaries are noise.
      id: "key-url",
      label: "Key and URL, no summary",
      text: (item) => `${item.key} - ${issueUrl(item.key)}`,
      html: (item, bold) =>
        (bold
          ? `<span style="font-weight:600">${escapeHtml(item.key)}</span>`
          : escapeHtml(item.key)) +
        ` - <a href="${escapeHtml(issueUrl(item.key))}">${escapeHtml(issueUrl(item.key))}</a>`,
    },
    {
      // §4 rejected "bare URLs, one per line" on the same ground as the shape above,
      // and the same naming answers it. THE ONLY SHAPE WITH NO KEY AT ALL, which is
      // why it ignores `bold`: the bold marks the key, and there is no key here.
      // The URL carries the key in its own last segment, so nothing is lost that a
      // reader cannot see.
      id: "url",
      label: "URL only",
      text: (item) => issueUrl(item.key),
      html: (item) =>
        `<a href="${escapeHtml(issueUrl(item.key))}">${escapeHtml(issueUrl(item.key))}</a>`,
    },
  ];

  // `normalisePrefs` has already turned an id this build does not know into
  // `markdown`, and the harness asserts this table names every id it may return, so
  // the fallback below cannot fire. It is here anyway because this is the COPY path:
  // a `TypeError` here is a copy that silently never happened, which is the failure
  // §2.8's scar is about.
  function shapeFor(id) {
    return SHAPES.find((shape) => shape.id === id) ?? SHAPES[0];
  }

  /* The foot's four controls. THREE COPY AND ONE OPENS, which is why this is not
     called COPY_FORMATS any more: a name that promised a copy while one entry
     navigated is the kind of small lie that costs the next reader an afternoon.
     
     The four are still §2.8's SPANNING SET -- one rich list a person reads, one
     plain list a person reads, one list of identifiers, one query -- and `build`
     still produces the same four payloads. `opens` is what says the fourth one's
     destination is Jira rather than the clipboard. */
  const EXPORTS = [
    {
      kind: "links",
      label: "🔗 Links",
      title:
        "Copy the whole collection as a markdown list, and as live links when pasted into an editor",
      build: formatLinks,
      // WHICH FORMAT THE SINGLE-ISSUE GESTURES MEAN, and it is a flag for the same
      // reason `opens` is one: the rail's copy button and the right-click menu's
      // `Copy link` both want "one issue, written the way this collection would
      // write it", and a literal `"links"` inside each of them would be two more
      // places that decide which of six formats that is (§2.7.1).
      //
      // Links is the entry that can carry it because it is the one format with a
      // rich flavour AND no field tail: 📃 Names and 🔑 Keys emit no URL at all, so
      // neither is a link; 📋 Details and 📊 Report would put a field tail and a
      // heading on a single hovered issue; and 🔍 Search has no single-item form by
      // §2.8's own rule. `format-smoke` asserts exactly one entry carries this.
      single: true,
    },
    {
      kind: "names",
      label: "📃 Names",
      title: "Copy [KEY] Summary, one line per item",
      build: formatNames,
    },
    {
      kind: "keys",
      label: "🔑 Keys",
      title: "Copy KEY, KEY, KEY on one line, for a commit message or a form field",
      build: formatKeys,
    },
    {
      kind: "details",
      label: "📋 Details",
      title:
        "Ask Jira for every detail it has, then copy the collection as a rich list of the fields the 📋 Details tab has ticked, in the order that tab has them. Two presses: the first fetches, the second copies",
      build: formatDetails,
      // WHICH FIELD LIST THIS DOCUMENT READS. One catalogue, two selections
      // (§2.14): the key is named here rather than inside the renderer so that
      // `format` performs the one read, the way it already does for the line shape.
      // `SETTINGS_TABS` names the same two keys, because that is where they are
      // EDITED, and `format-smoke` asserts the two tables name the same set -- a key
      // a tab edits and no export reads is a control that changes nothing, and a key
      // an export reads and no tab edits is a preference with no way to reach it.
      fields: "detailsFields",
      // The one entry that cannot be served from storage. Its payload is fetched
      // per press and never written down, so a detailed list cannot carry last
      // week's status -- which is the whole reason it takes two presses (§2.14).
      // `renderFoot` reads this to know it owns a label ladder rather than a
      // fixed label, and the foot's builder reads it to give the button its own
      // action instead of the plain `copy` one.
      needsDetails: true,
    },
    {
      kind: "report",
      label: "📊 Report",
      title:
        "Ask Jira, then copy the collection grouped under headings — the shape the Technology Portfolio Office sends to team leads. The two 📊 Report dropdowns choose which fields band it, and its rows carry the fields that tab has ticked. Two presses: the first fetches, the second copies",
      build: formatReport,
      fields: "reportFields",
      // WHICH BANDS THIS DOCUMENT READS, and the same seam `fields` is: the keys are
      // named here so `format` performs the one read, rather than the renderer
      // reaching into storage. `SETTINGS_TABS` names the same two keys, because that
      // is where they are EDITED, and `format-smoke` asserts the two tables agree --
      // a band key a tab edits and no export reads is a dropdown that changes
      // nothing, and one an export reads and no tab edits is a preference with no
      // way to reach it (§2.15, ticket 05).
      bands: ["reportBand1", "reportBand2"],
      // The same fetch as 📋 Details, because the held result belongs to the
      // collection rather than to a button -- so one field list serves both
      // requests. THE ARMING IS NOT SHARED: a press arms its own button and nothing
      // else, reversed from use on 2026-08-21 (§2.15).
      needsDetails: true,
    },
    {
      kind: "jql",
      label: "🔍 Search",
      title:
        "Open the whole collection in Jira's own issue search, in a new tab. From there it can be filtered, bulk-edited, saved as a filter or shared",
      build: formatJql,
      // The one entry that does not touch the clipboard. It NAVIGATES, which is
      // the whole reason §2.8 gave JQL its slot: turning a collection back into
      // something Jira can act on. Doing it rather than describing it removes the
      // paste (added 2026-08-18, at the user's request).
      opens: searchUrl,
      // JQL is the one format with no single-item form. `key in (RDC-14817)` is a
      // worse way to reach one issue than the URL the other three carry, and the
      // idiomatic `key = RDC-14817` would mean two shapes behind one menu entry
      // (§2.8).
      scopes: ["collection", "selection"],
    },
  ];

  /**
   * The dispatch table, and it should be called that and nothing more.
   *
   * THERE IS NO TEMPLATE SEAM. Do not write that there is one. A
   * fill-in-the-blanks template handles Keys and JQL and then dies on Names: the
   * template `[{key}] {summary}` yields `[GLX-402] ` where the answer is
   * `GLX-402`. That is a DIFFERENT LINE SHAPE, not a substituted value, so it
   * needs a conditional inside the template -- and then a second output channel
   * with a `<ul>` wrapper and different escaping, a bullet that appears only at
   * list scope, and JQL being unavailable at item scope. The "template" has become
   * a small programming language written to serve four instances (§2.8).
   *
   * Adding a fifth format is one entry in the list above, which is how `jira-ux`'s
   * own BUTTONS array already works.
   *
   * 1.2.0 ADDS A SECOND TABLE BESIDE THIS ONE AND NOT A SEAM INSIDE IT. `SHAPES`
   * is a list of named presets, each a pair of functions in this file, so the
   * paragraph above still holds: there is no template, `detailChip` is still the
   * one place styling is written, and nothing a user can click reaches it.
   *
   * THE PREFERENCES ARE READ HERE, ONCE PER COPY, AND NOWHERE ELSE. Three exports
   * build their head from the one line shape, so §2.14's promise that 📋 Details'
   * head is 🔗 Links' line cannot be broken by one of them reading a different value
   * -- there is only one read. They are read at the press rather than held in a
   * variable, for the reason `drawerIsOpen` is a function: a copy beside the stored
   * value is two values that can disagree, and this one would disagree silently, in
   * bytes already on somebody's clipboard (principle 1, §2.8).
   *
   * THE BANDS ARE READ IN THE SAME BREATH, for the same reason and with the same
   * consequence: a report is grouped by whatever the two dropdowns said at the
   * moment of the press, and no renderer below this line asks storage anything
   * (§2.15).
   *
   * THE FIELD SELECTION IS APPLIED AT RENDER AND NEVER AT FETCH, and the opposite is
   * the obvious-looking optimisation. Narrowing `DETAIL_FIELDS` to the ticked fields
   * would cost three things at once: the constant could fall out of step with a
   * preference; changing a preference would invalidate a held fetch, so a `📋 Copy`
   * you had already armed would stop being copyable and a field list changed in
   * ANOTHER TAB would disarm this one; and §2.14's "nothing fetched is ever stored"
   * would need re-arguing. The held rows carry every field, so a re-render is all a
   * preference change costs (§2.14).
   *
   * Returns null rather than an empty payload, so no caller can write nothing to
   * the clipboard by accident.
   */
  function format(kind, items, scope) {
    const entry = EXPORTS.find((one) => one.kind === kind);
    if (!entry) return null;
    // A COPY OF ZERO ITEMS MUST NOT WRITE AT ALL. An empty collection would put
    // an empty string on the clipboard, destroy whatever was there, and show a ✅
    // claiming success. The precondition for any copy is at least one item (§2.8).
    if (!items.length) return null;
    if (entry.scopes && !entry.scopes.includes(scope)) return null;
    const prefs = loadPrefs();
    return entry.build(
      items,
      scope,
      shapeFor(prefs.lineShape),
      // `undefined` for the four exports that carry no field tail, which is what
      // they already ignored. `normalisePrefs` has completed the list against the
      // catalogue on the way out, so a stored blob missing a field, naming one this
      // build does not have, or holding none at all cannot reach a renderer.
      entry.fields ? enabledFields(prefs[entry.fields]) : undefined,
      // And the bands, for the one export that has any. Read HERE, in the same one
      // read as the shape and the field list, so `formatReport` stays a pure
      // function of its arguments and a copy cannot be built from two different
      // versions of the preferences (§2.15).
      entry.bands ? entry.bands.map((key) => prefs[key]) : undefined,
    );
  }

  /**
   * Copy-out is SYNCHRONOUS and never awaits the network. It writes what is in
   * storage at the moment of the click. A handler that awaited `bulkfetch` to
   * fill a missing summary would put the clipboard write after a network round
   * trip -- inside Chromium's activation window most of the time, and never in
   * Safari -- which is intermittent, silent copy failure. So an item with no
   * summary copies as a bare key, and ↻ is a separate visible action rather than
   * a hidden step inside a copy (§2.8). This is also why §2.5 forbids
   * `GM.setValue`: an `await` anywhere on this path is the same bug.
   *
   * No `navigator.permissions.query({name: "clipboard-write"})` gate: Firefox and
   * Safari do not recognise that permission name, so the promise rejected,
   * nothing caught it, and the copy silently never happened. Inside a click
   * handler the write needs no gate anyway.
   */
  async function copyActive(button, kind) {
    const payload = format(kind, activeCollection(load()).items, "collection");
    if (!payload) return;
    try {
      await writeClipboard(payload);
      // A copy that contains items with no summary is still ✅: that is a fact
      // about the collection, not about the write, and the two have different
      // remedies. ⚠️ means press it again; a thin item means refresh, or that
      // issue is gone. Partial success does not exist -- one operation, one
      // outcome, two symbols and no third (§2.8).
      flash(button, "✅");
    } catch (e) {
      logger.error("clipboard write failed", e);
      flash(button, "⚠️");
    }
  }

  /* THE RAIL'S RECEIPT, as a value rather than as a label. `renderRail` says why
     this cannot be `flash`: the rail is re-rendered by every signal the script
     has, so a glyph written onto the button is gone within a frame or two.

     NOT IN STORAGE, and that part is the same rule the foot's `✅` follows: a
     flash is a blink, and a stored "flashing until" timestamp is exactly the kind
     of value the two earlier ADRs deleted (§2.8).

     ONE TIMER, RESTARTED. Two copies in quick succession must not leave the first
     one's timer to clear the second one's `✅` early. */
  let copyFlash = null;
  let copyFlashTimer = null;

  function flashCopy(state) {
    copyFlash = state;
    if (copyFlashTimer !== null) clearTimeout(copyFlashTimer);
    copyFlashTimer = setTimeout(
      () =>
        guard(() => {
          copyFlash = null;
          copyFlashTimer = null;
          render();
        }),
      COPY_FEEDBACK_MS,
    );
    scheduleRender();
  }

  /**
   * ONE ISSUE ON THE CLIPBOARD, WITHOUT OPENING IT. The gesture asked for at
   * 1.3.0, and it is served by both the rail's copy button and the right-click
   * menu's `Copy link` entry.
   *
   * THIS IS THE FIRST CALLER `format`'s ITEM SCOPE HAS EVER HAD. §2.8 built the
   * three scopes when there was only one gesture, and said in as many words that
   * the other two were "the seam that makes a fifth format one entry in a list".
   * Item scope has been asserted byte for byte by `format-smoke` since 1.2.0 and
   * reached by nothing. Nothing had to be added to it here, which is the only
   * evidence that the seam was the right shape: the bullet drops, the `<ul>` drops,
   * and the bytes land exactly on `jira-ux-improvements`' own 🔗 button.
   *
   * WHICH EXPORT IT USES IS A FLAG ON THE ENTRY, not the literal `"links"`. The
   * same treatment `opens` gets for 🔍 Search, and for the same reason: a literal
   * here would be a second place that decides which of six formats a gesture
   * means. `format-smoke` asserts exactly one entry carries it.
   *
   * THE SUMMARY COMES FROM THE PAGE, through the same six tiers the `+` uses, and
   * the reason is that the two gestures have to agree about what the issue is
   * called. The alternative -- read the stored summary when the issue happens to be
   * collected -- was declined: the same hover would then copy different bytes
   * before and after an add, which reads as a defect (§4). The cost is stated
   * rather than hidden: on a link with no row around it the page gives no summary,
   * so the copy is the reference alone, even when that issue sits in the collection
   * with a summary beside it.
   *
   * SYNCHRONOUS UP TO THE WRITE, like every other copy in this file. `readSummary`
   * and `format` touch no network, so `navigator.clipboard.write` is called inside
   * the click's own transient user activation. An `await` before it is the bug
   * §2.5 forbids by name.
   */
  async function copyOneIssue(key, readAnchor) {
    if (!key) return;

    const { summary, tier } = readAnchor
      ? readSummary(readAnchor, key)
      : { summary: "", tier: 0 };
    const item = { key };
    // An absent summary is not an empty summary, exactly as in the store: each
    // shape drops the separator with the value, so a bare key is a correct line
    // and never a line with a dangling colon (§2.8).
    if (summary) item.summary = summary;

    const entry = EXPORTS.find((one) => one.single);
    const payload = format(entry?.kind, [item], "item");
    // `format` returns null rather than an empty payload, so a refusal here is a
    // copy that never happened instead of a clipboard that was destroyed.
    if (!payload) return;

    try {
      await writeClipboard(payload);
      // The tier is in the debug line for the same reason the add's is: it is how
      // §7's per-view check is run without a UI that reports it.
      logger.debug(`copied the link to ${key} at tier ${tier}`);
      flashCopy("done");
    } catch (e) {
      logger.error("clipboard write failed", e);
      flashCopy("failed");
    }
  }

  /**
   * The fourth button, and it is the only control in the foot that writes nothing.
   * There is no ✅: THE NEW TAB IS THE FEEDBACK, which is a stronger receipt than
   * a blink on a button, and there is nothing here that can half-succeed.
   *
   * A NEW TAB, not this one. A same-tab navigation would take away the page the
   * live list is mirroring, and the mirror is the reason the drawer is open. The
   * drawer itself now survives a reload -- 0.5.0 made its open state a stored
   * preference (§2.9) -- so the cost is the page you were reading rather than the
   * sitting, which is still a cost worth not paying for a search you can have
   * beside it.
   *
   * `window.open` inside a click handler carries the transient user activation a
   * popup blocker asks for, the same as the right-click menu's own entry (§2.7).
   * ITS RETURN VALUE CANNOT BE TESTED: passing `noopener` makes it return null BY
   * SPECIFICATION, whether it worked or not. So there is no success check and no
   * fallback, and a `null` here means nothing at all.
   */
  function openSearch() {
    const entry = EXPORTS.find((one) => one.opens);
    const payload = format(entry?.kind, activeCollection(load()).items, "collection");
    if (!entry || !payload) return;
    const url = entry.opens(payload.text);
    logger.debug(`opening Jira's search on ${payload.text}`);
    window.open(url, "_blank", "noopener");
  }

  // ----------------------------------------------------------------- the API

  // One endpoint, and it was verified live under `@grant none` and again inside
  // Tampermonkey's sandbox under a grant. Use it rather than a JQL search: the
  // keys go in directly, so there is no JQL string to build or escape, no
  // URL-length ceiling and no `key in (…)` value limit. `GET /rest/api/3/search`
  // is GONE, not deprecated -- do not write against it (§2.6).
  const BULKFETCH_PATH = "/rest/api/3/issue/bulkfetch";

  // One request per 100 references or fewer. NEVER per key: a whole collection
  // refreshes in one request at the expected scale, and the Cart stays far from
  // any rate limit (§2.6, rule 4).
  const BULKFETCH_CHUNK = 100;

  // Adding five links to an open drawer is one `bulkfetch`, not five (§2.6,
  // guard 3).
  const GAP_FILL_DEBOUNCE_MS = 400;

  /* ALWAYS PASS `fields` EXPLICITLY: omitting it gives you ids back, which is the
     most likely way a naive port returns nothing usable (§2.6).

     Two lists, because the two callers want different things and neither should
     pay for the other. Gap-fill and ↻ need one field; 📋 Details needs seven and
     runs only when somebody presses it.

     A field that was requested and is absent from the response is NORMAL, not an
     error -- `parent` was requested on an Epic and was simply not there (§2.6) --
     so every reader below defaults rather than complains. */
  // Atlassian Teams field, `schema.type: "team"`, populated on 16,697 RDC issues.
  // Its value is ONE OBJECT carrying `id`, `name` and `title` -- not an id alone,
  // so a heading needs no second call (appendix C.4).
  const TEAM_FIELD = "customfield_15541";

  const SUMMARY_FIELDS = ["summary"];
  const DETAIL_FIELDS = [
    "summary",
    "issuetype",
    "status",
    "priority",
    "assignee",
    "fixVersions",
    "parent",
    // §2.15's grouping key. It is in the SHARED list rather than a list of its own,
    // so one fetch serves both 📋 Details and 📊 Report -- the fetch belongs to the
    // collection, not to a button. Details never prints it.
    //
    // BY ID AND NEVER BY NAME: this instance has more than one field called Team,
    // so a name reference says only that A field answered (appendix C.4). The id is
    // instance-specific, which is a stated limit: on another Jira the report's team
    // headings go quiet rather than wrong, because §2.14's rule that an absent value
    // drops out with its separator applies to a heading too.
    TEAM_FIELD,
    // Asked for by name, and kept even though it is the noisiest field here: it
    // read `0m` on four of the six issues the format was designed against,
    // because a finished issue has nothing remaining. Dropping a field the user
    // requested on our own taste would be the wrong call -- but the cost is
    // recorded, and removing it is this line plus one `add` below.
    "timetracking",
  ];

  /* Three per-session sets, and NONE of them is stored.
   *
   * `askedFor` is guard 1: NEVER ASK TWICE FOR THE SAME KEY. An item that came
   * back empty has no summary, so a naive state trigger would re-request it on
   * every render for ever. WRITE THIS DOWN OR A BUILD SESSION DELETES IT AS
   * DECORATION -- §2.6 says exactly that, in those words. The remedy for a key
   * this set is holding wrongly is the ↻ control, which is the user asking again
   * and ignores it.
   *
   * `inFlight` is guard 2: a re-render during a request must not duplicate it.
   *
   * `unreadable` is THE ONE FAILED STATE, and it is derived rather than stored.
   * "Cannot read this item" is the result of the last attempt, not a property of
   * the item: an issue that is unreadable this morning may be readable this
   * afternoon, and a stored `failed: true` is exactly a flag that can disagree
   * with the world (§2.6). Atlassian conflates absent and forbidden in its own
   * 404 text, on purpose, so there is ONE state and it MAY NEVER SAY "DELETED".
   */
  const askedFor = new Set();
  const inFlight = new Set();
  const unreadable = new Set();

  let gapFillTimer = null;
  let refreshing = false;

  /**
   * §2.6 rule 2, and it is three lines that remove a whole class of silent
   * corruption. LOGGED OUT, A GET ON THIS API RETURNED `200` WITH `text/html` AND
   * ATLASSIAN'S LOGIN PAGE. A client that trusts `response.ok` stores login-page
   * HTML as an issue summary.
   *
   * A response is data only when all three hold: `ok`, a content type that starts
   * with `application/json`, and a body of the expected shape. Kept pure and
   * separate from the request so that a harness can run it.
   *
   * Returns the issues array, or null when the response is not data.
   */
  function bulkfetchIssues(ok, contentType, body) {
    if (!ok) return null;
    if (!String(contentType ?? "").toLowerCase().startsWith("application/json")) {
      return null;
    }
    if (!body || typeof body !== "object" || !Array.isArray(body.issues)) {
      return null;
    }
    return body.issues;
  }

  /**
   * What one response says, keyed by BOTH the numeric id and the key, because a
   * request may have sent either (§2.4).
   *
   * `issueErrors` is not read at all. It came back as `[]` for an unparseable key,
   * for a real project with an absent number, on all four runs, and again under a
   * grant. ABSENCE IS THE SIGNAL, and nothing may depend on that array being
   * populated (§2.6, rule 3).
   */
  function readIssues(issues) {
    const found = new Map();
    for (const issue of issues) {
      const key =
        typeof issue?.key === "string" ? issue.key.toUpperCase() : null;
      if (!key || !SAFE_KEY_RE.test(key)) continue;

      const id =
        typeof issue?.id === "string" && issue.id
          ? issue.id
          : typeof issue?.id === "number"
            ? String(issue.id)
            : null;

      // A field that was requested and is absent from the response is NORMAL, not
      // an error: `parent` was requested on an Epic and was simply not there
      // (§2.6). An entry with no summary still counts as an answer, so the row
      // does not carry the failed note. Every field below defaults for the same
      // reason -- and they are all absent, harmlessly, on a summary-only request.
      const fields = issue?.fields ?? {};
      const summary =
        typeof fields.summary === "string" ? cleanText(fields.summary) : "";

      // Jira wraps most of these in an object whose display value is `name`.
      const named = (value) =>
        typeof value?.name === "string" ? cleanText(value.name) : "";

      const parentKey =
        typeof fields.parent?.key === "string"
          ? fields.parent.key.toUpperCase()
          : null;

      const entry = {
        key,
        id,
        summary,
        // §2.14's fields. NOTHING BELOW EVER REACHES STORAGE: `applySummaries`
        // copies `key`, `issueId` and `summary` and nothing else, which is what
        // keeps a stale status off the clipboard by construction.
        type: named(fields.issuetype),
        status: named(fields.status),
        // The category, not the name: `Dev Resolved` is this instance's wording
        // and only the category says which of the three colours it takes.
        category:
          typeof fields.status?.statusCategory?.key === "string"
            ? fields.status.statusCategory.key
            : "",
        priority: named(fields.priority),
        assignee:
          typeof fields.assignee?.displayName === "string"
            ? cleanText(fields.assignee.displayName)
            : "",
        // GROUP BY `assigneeId`, LABEL BY `assignee`, the same split the team gets
        // and for the same reason: two people can carry one display name, and an
        // assignee band that merged them would be a WRONG report rather than an ugly
        // one (§2.15, appendix C.4). It costs nothing to keep -- `accountId` arrives
        // inside the assignee object the Cart already asks for, so there is no extra
        // field in `DETAIL_FIELDS` and no extra request. Nothing below reaches
        // storage, so it is not a migration either (§2.14).
        assigneeId:
          typeof fields.assignee?.accountId === "string"
            ? fields.assignee.accountId
            : "",
        fixVersions: Array.isArray(fields.fixVersions)
          ? fields.fixVersions.map(named).filter(Boolean)
          : [],
        // The formatted string rather than the seconds: Jira returns both, and
        // the formatted one is what its own badge shows.
        remaining:
          typeof fields.timetracking?.remainingEstimate === "string"
            ? cleanText(fields.timetracking.remainingEstimate)
            : "",
        // GROUP BY `teamId`, LABEL BY `team`. The id is a UUID and is exact, where
        // two teams can be given the same name and a heading that silently merged
        // them would be a wrong report rather than an ugly one -- the same shape of
        // decision as §2.4's opaque collection id against its editable name.
        // `name` and `title` held the same string, so `name` is the one read and
        // `title` is not a second source to reconcile (appendix C.4).
        team:
          typeof fields[TEAM_FIELD]?.name === "string"
            ? cleanText(fields[TEAM_FIELD].name)
            : "",
        teamId:
          typeof fields[TEAM_FIELD]?.id === "string" ? fields[TEAM_FIELD].id : "",
        // Validated the same way the item's own key is, so a malformed parent
        // cannot put a broken link on the clipboard.
        parent:
          parentKey && SAFE_KEY_RE.test(parentKey)
            ? {
                key: parentKey,
                summary:
                  typeof fields.parent?.fields?.summary === "string"
                    ? cleanText(fields.parent.fields.summary)
                    : "",
              }
            : null,
      };
      found.set(key, entry);
      if (id) found.set(id, entry);
    }
    return found;
  }

  async function postBulkfetch(idsOrKeys, fields) {
    // Same-origin, on the session cookie, which is what Jira's own front end
    // does. No token and no `credentials` option -- verified live, and again from
    // inside the sandbox, which is the run that could have killed the grant
    // (§2.6, §2.12). That auth is undocumented and unsupported by Atlassian, and
    // it is why §2.2 makes the DOM the primary source of a summary (risk 2).
    const response = await fetch(location.origin + BULKFETCH_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Whether the POST requires this was never isolated, so keep sending it.
        // It is one header and it cannot hurt (§2.6).
        "X-Atlassian-Token": "no-check",
      },
      body: JSON.stringify({
        issueIdsOrKeys: idsOrKeys,
        // ALWAYS PASS `fields` EXPLICITLY. On the current API, omitting it gives
        // you ids back, and that is the most likely way a naive port returns
        // nothing usable (§2.6). The caller chooses which list, and there is no
        // default here on purpose: a default would let a new caller ask for the
        // wrong one silently.
        fields,
        fieldsByKeys: false,
      }),
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      // Not JSON at all, which is the login-page case. The validation below
      // declines it on the same grounds, so there is one refusal path and not two.
    }
    return bulkfetchIssues(
      response.ok,
      response.headers.get("content-type"),
      body,
    );
  }

  /**
   * Sends what it is given, and reports what came back plus what it was able to
   * DECIDE anything about.
   *
   * `sent` holds ids and keys mixed, because an item that carries an `issueId` is
   * asked for by id: a moved issue keeps its numeric id and loses its key, so from
   * the second refresh onward an item whose issue changed project repairs its own
   * key silently (§2.4).
   *
   * A chunk whose response is not data contributes NOTHING -- not a summary, and
   * not a failure either. The diff is what marks an item unreadable, and "Jira
   * returned nothing for this key" is a claim about that key, not about a login
   * page or a dropped connection. There is one failed state, so it may never be
   * stretched to cover the transport. This is also what §7 step 20 requires:
   * logged out, a summary-less item must simply stay bare.
   */
  async function askJira(sent, fields) {
    const found = new Map();
    const decided = new Set();
    let refused = 0;

    for (let at = 0; at < sent.length; at += BULKFETCH_CHUNK) {
      const chunk = sent.slice(at, at + BULKFETCH_CHUNK);
      let issues = null;
      try {
        issues = await postBulkfetch(chunk, fields);
      } catch (e) {
        // Offline, a dropped connection, a redirect to the login host.
        logger.warn("the bulkfetch request failed", e);
      }
      if (issues === null) {
        refused += chunk.length;
        continue;
      }
      for (const reference of chunk) decided.add(reference);
      for (const [reference, entry] of readIssues(issues)) {
        found.set(reference, entry);
      }
    }

    if (refused) {
      logger.warn(
        `Jira did not answer with usable JSON about ${refused} of ${sent.length} references, so nothing was decided about them`,
      );
    }
    return { found, decided };
  }

  // The failed state, derived from the last attempt and cleared by the next one
  // that works. Only a reference the API actually answered about is judged, which
  // is what keeps a login page or an offline moment from labelling a collection
  // (§2.6).
  function markUnreadable(asked, found, decided) {
    for (const [key, reference] of asked) {
      if (!decided.has(reference)) continue;
      if (found.has(reference)) unreadable.delete(key);
      else unreadable.add(key);
    }
  }

  /**
   * The write-back, and it is a read-modify-write that PATCHES ONLY KEYS STILL
   * PRESENT. The add gesture is a toggle, so a response that lands after an item
   * was removed must not bring it back (§2.6).
   *
   * A REFRESH MAY REPLACE A SUMMARY. IT MAY NEVER DELETE ONE. If Jira returned
   * nothing for a reference the stored summary is kept and the row carries the
   * failed note, because otherwise one network blip strips the titles off a
   * collection built over a week. That makes refresh safe by construction: it can
   * only improve or leave alone.
   *
   * Two riders from §2.4 live here. A key repaired from an id is written back, and
   * if the repaired key collides with a key already in the collection the two
   * items MERGE INTO ONE -- which is why this rebuilds the array rather than
   * assigning in place.
   */
  function applySummaries(collectionId, asked, found) {
    let patched = 0;
    // Nothing came back, so there is nothing to patch -- and no write. A write that
    // changes nothing still costs the store a serialisation, still lands a
    // value-change event on every other tab, and would still report a failure if
    // the quota were full. An offline moment must cost nothing (§2.5).
    if (found.size === 0) return patched;

    update((blob) => {
      const collection = blob.collections.find((one) => one.id === collectionId);
      // The collection was deleted, or another tab reshuffled it, while the
      // request was out. Nothing to patch, and nothing to repair either: the
      // read-modify-write means this tab writes back what it just read.
      if (!collection) return;

      const merged = [];
      const seenAt = new Map();

      for (const item of collection.items) {
        const reference = asked.get(item.key);
        const answer = reference ? found.get(reference) : undefined;
        const next = { ...item };

        if (answer) {
          if (answer.key !== next.key) {
            logger.log(
              `${next.key} answers to ${answer.key} now, so the stored key was repaired`,
            );
            next.key = answer.key;
          }
          if (answer.id) next.issueId = answer.id;
          if (answer.summary) next.summary = answer.summary;
          patched += 1;
        }

        const already = seenAt.get(next.key);
        if (already === undefined) {
          seenAt.set(next.key, merged.length);
          merged.push(next);
        } else {
          merged[already] = { ...merged[already], ...next };
        }
      }

      collection.items = merged;
    });

    return patched;
  }

  /**
   * GAP-FILL'S TRIGGER IS A STATE, NOT AN EVENT, and `render` is what evaluates
   * it. An earlier design fired it when the drawer opened, and the user found the
   * hole: if the drawer is ALREADY open and you add a link whose summary is not on
   * the page, nothing fires, and the item stays bare until the drawer is closed
   * and opened again. One rule covers both cases, rather than two event handlers
   * that must be kept in agreement (§2.6).
   */
  function considerGapFill(state) {
    if (!drawerIsOpen()) return;
    // Nothing may fetch what it cannot store. On the two migration rows that
    // refuse to write, the patch would be declined and the request wasted (§2.4).
    if (!state.writable) return;
    if (refreshing) return;
    // 📋 Details asks for the summary too, so a gap-fill alongside it would be a
    // second request for the same field and a second write of the same value.
    if (fetchingDetails) return;
    if (gapFillTimer !== null) return;
    if (!missingSummaries(state).length) return;

    // The set is recomputed when the timer fires rather than captured here, so
    // five adds inside the window are one request for five keys.
    gapFillTimer = setTimeout(
      () =>
        guard(() => {
          gapFillTimer = null;
          return runGapFill();
        }),
      GAP_FILL_DEBOUNCE_MS,
    );
  }

  function missingSummaries(state) {
    return activeCollection(state).items.filter(
      (item) =>
        !item.summary && !askedFor.has(item.key) && !inFlight.has(item.key),
    );
  }

  async function runGapFill() {
    const state = load();
    if (!state.writable) return;
    const collection = activeCollection(state);
    const wanted = missingSummaries(state);
    if (!wanted.length) return;

    const asked = new Map();
    for (const item of wanted) {
      askedFor.add(item.key);
      inFlight.add(item.key);
      asked.set(item.key, item.issueId ?? item.key);
    }
    scheduleRender();

    try {
      const { found, decided } = await askJira([...new Set(asked.values())], SUMMARY_FIELDS);
      markUnreadable(asked, found, decided);
      const patched = applySummaries(collection.id, asked, found);
      logger.debug(
        `gap-fill asked Jira about ${asked.size} item${asked.size === 1 ? "" : "s"} with no summary, and ${patched} came back`,
      );
    } finally {
      for (const key of asked.keys()) inFlight.delete(key);
      scheduleRender();
    }
  }

  // The ↻ in the collection's heading, and the only remedy for a stale title. An
  // action on the named thing sits next to its name, and the foot row stays about
  // getting data out (§2.9). It is the user asking again, so it ignores `askedFor`
  // on the way in and refreshes it on the way out.
  async function refreshActive() {
    if (refreshing || fetchingDetails) return;
    const state = load();
    if (!state.writable) return;
    const collection = activeCollection(state);
    if (!collection.items.length) return;

    refreshing = true;
    const asked = new Map();
    for (const item of collection.items) {
      askedFor.add(item.key);
      inFlight.add(item.key);
      asked.set(item.key, item.issueId ?? item.key);
    }
    scheduleRender();

    try {
      const { found, decided } = await askJira([...new Set(asked.values())], SUMMARY_FIELDS);
      markUnreadable(asked, found, decided);
      const patched = applySummaries(collection.id, asked, found);
      logger.log(
        `refreshed ${collection.name}: ${asked.size} reference${asked.size === 1 ? "" : "s"} sent, ${patched} answered`,
      );
    } finally {
      refreshing = false;
      for (const key of asked.keys()) inFlight.delete(key);
      scheduleRender();
    }
  }

  /* ------------------------------------------------- 📋 Details, the two steps

     WHY TWO PRESSES, AND WHY NOTHING IS STORED (§2.14).

     Copy-out is synchronous and may never await the network (§2.8): a clipboard
     write after an `await` lands outside its transient user activation, which is
     intermittent silent failure. So whatever the detailed list prints has to be
     in hand BEFORE the press that copies it. One press fetches, the next copies,
     and each press is its own user activation.

     Storing the fields instead would have bought one press and cost the thing
     that matters: status, assignee and priority change hourly, so a stored
     detail is a claim about last week that looks like a claim about today. Held
     in memory and dropped after use, it cannot be stale -- everything pasted was
     fetched seconds earlier, by construction rather than by discipline.

     Three further things fall out of storing nothing, and they are why this was
     the cheap choice as well as the honest one: §2.4's schema is untouched, so
     there is no migration and no version bump; an older build cannot silently
     drop fields it does not know; and ADDING A FIELD LATER is one id in
     `DETAIL_FIELDS`, one entry in `FIELD_CATALOGUE` and one `case` in `detailBit`.
     Team was that field, and it cost exactly those three at 1.1.0 and 1.2.0.

     THIS LIST DOES NOT NARROW WHEN A FIELD IS UNTICKED, and that is a decision
     rather than an oversight (§2.14, 1.2.0). All nine are fetched whatever the two
     field lists say, so the constant cannot fall out of step with a preference,
     a held fetch stays valid across a preference change -- including one made in
     another tab -- and "nothing fetched is ever stored" needs no re-arguing. The
     selection is applied at RENDER, in `format`. */

  /* { signature, rows, kind } or null. NOT a "ready" flag beside it: the signature
     IS the validity test, so there is no second value that could disagree with the
     collection (principle 1).

     `kind` is which button's press produced it, and it exists because of a
     REVERSAL on 2026-08-21. The fetch was shared: one press armed BOTH stepped
     buttons, on the reasoning that the held result describes the collection rather
     than a button. That reasoning is still true of the DATA and was wrong about the
     CONTROL -- the user pressed one button and watched the other one change, and
     reported it as a bug, which is what it is. THE BUTTON YOU PRESS IS THE BUTTON
     THAT ANSWERS.

     What stays shared is everything that cannot be seen: one FETCHED field list, so
     neither document can be fetched with fields the other lacks -- the two field
     PREFERENCES of 1.2.0 select over that one fetch and never narrow it -- and one
     `detailChip`, so the five rules of §2.14 cannot hold in one format and drift in
     the other.
     What costs a second request is pressing both in turn, which is one extra
     `bulkfetch` and no more (§2.6 rule 4). */
  let detailsHeld = null;

  // The kind being fetched, or null. Holding the KIND rather than a flag is what
  // lets only the pressed button say `Fetching…` while the other stands down.
  let fetchingDetails = null;

  /* The collection this fetch describes. THE KEY LIST, NOT THE WHOLE BLOB: the
     fetch writes summaries back through `applySummaries`, and comparing the blob
     would make our own write look like a change and cancel the button we just
     armed. A summary changing is not a different set of issues; a key changing
     is, and a repaired key lands here correctly for that reason. */
  function detailSignature(state) {
    const collection = activeCollection(state);
    return `${collection.id}|${collection.items.map((item) => item.key).join(",")}`;
  }

  // Derived, never cached. Add, remove, empty, switch collection, or another tab
  // writing -- any of them changes the signature and the held fetch stops being
  // an answer about this collection. Nothing has to notice and invalidate it.
  function detailsFor(state, kind) {
    if (detailsHeld === null) return null;
    if (detailsHeld.kind !== kind) return null;
    return detailsHeld.signature === detailSignature(state) ? detailsHeld : null;
  }

  // The one place that knows the fetch is in memory, which is what lets
  // `formatDetails` keep the same `(items, scope)` signature as the other four
  // and stay as testable as they are. The stored item wins on `key` and
  // `summary`: storage is the record of what is collected, and §2.6 already says
  // a summary may be replaced but never deleted.
  function detailedItems(state, held) {
    return activeCollection(state).items.map((item) => ({
      ...(held.rows.get(item.key) ?? {}),
      ...item,
    }));
  }

  // Looked up fresh rather than captured: the fetch is async, and a React remount
  // can rebuild the whole drawer while it is out, which would leave a captured
  // node detached and the feedback invisible.
  function detailsButton(kind) {
    const foot = document.getElementById(FOOT_ID);
    return foot ? foot.querySelector(`[data-gt-format="${kind}"]`) : null;
  }

  /**
   * Step one. Asks Jira about the whole active collection, writes the summaries
   * back through the path that already exists, and holds the rest in memory.
   *
   * It is the user asking, so like ↻ it ignores `askedFor` on the way in and
   * refreshes it on the way out.
   *
   * ARMS ONLY IF SOMETHING CAME BACK. Nothing at all -- logged out, offline, a
   * login page instead of JSON -- means there is nothing to copy, so the button
   * stays idle and says ⚠️. A partial answer DOES arm: the rows Jira said nothing
   * about keep their key and their stored summary, and `markUnreadable` has
   * already put `(cannot read)` on those drawer rows, which is where that news
   * belongs (§2.6). Refusing the whole copy for one unreadable issue would make
   * the format unreachable for as long as that issue is in the collection.
   */
  async function fetchDetails(kind) {
    if (fetchingDetails || refreshing) return;
    const state = load();
    const collection = activeCollection(state);
    if (!collection.items.length) return;

    fetchingDetails = kind;
    const asked = new Map();
    for (const item of collection.items) {
      askedFor.add(item.key);
      inFlight.add(item.key);
      asked.set(item.key, item.issueId ?? item.key);
    }
    scheduleRender();

    let failed = false;
    try {
      const { found, decided } = await askJira(
        [...new Set(asked.values())],
        DETAIL_FIELDS,
      );
      markUnreadable(asked, found, decided);
      // The same write-back ↻ uses, so a press of 📋 also improves the drawer's
      // rows and what 🔗 Links copies, and repairs a key that changed project.
      // It patches only `summary`, `issueId` and `key`; the rest is not stored.
      applySummaries(collection.id, asked, found);

      if (found.size === 0) {
        failed = true;
        logger.warn(
          "Jira answered nothing usable about this collection, so no details are held",
        );
      } else {
        // Keyed by BOTH the answered key and the reference sent, because an item
        // carrying an `issueId` was asked for by id. The signature is taken from
        // a FRESH read, after the write-back: `applySummaries` may have repaired
        // a key, and the signature has to describe the collection as it now is.
        const rows = new Map();
        for (const [reference, entry] of found) {
          rows.set(reference, entry);
          rows.set(entry.key, entry);
        }
        detailsHeld = { signature: detailSignature(load()), rows, kind };
        logger.log(
          `details in hand for ${collection.name}: ${asked.size} reference${asked.size === 1 ? "" : "s"} sent, ${found.size} answered`,
        );
      }
    } catch (e) {
      failed = true;
      logger.error("the details fetch failed", e);
    } finally {
      fetchingDetails = null;
      for (const key of asked.keys()) inFlight.delete(key);
      // `render`, not `scheduleRender`: the flash below has to be written AFTER
      // the labels are rebuilt, or the next frame wipes it (§2.8).
      render();
    }

    if (failed) {
      // Looked up by kind, so the ⚠️ lands on the button that was pressed.
      const button = detailsButton(kind);
      if (button) flash(button, "⚠️");
    }
  }

  /**
   * Step two, and it is as synchronous as the other three copies: everything it
   * prints is already in memory, so there is no `await` before the clipboard
   * write except the write itself (§2.8).
   *
   * THE HELD FETCH IS SPENT BY THE COPY. Without that, a button left armed could
   * be pressed the next morning and paste yesterday's statuses -- the exact
   * failure the two-step design exists to remove. So every paste was fetched by
   * the press before it.
   */
  async function copyDetails(button, kind) {
    const state = load();
    const held = detailsFor(state, kind);
    if (!held) return;

    const payload = format(kind, detailedItems(state, held), "collection");
    if (!payload) return;

    try {
      await writeClipboard(payload);
      detailsHeld = null;
      /* No render before the flash any more, and the reason is worth keeping: it
         was here because both buttons derived their label from one held fetch, so
         spending it left the OTHER one saying "Copy" while a press would fetch.
         Arming per button removed the second reader, and with it the need. One
         reversal, two things simpler. */
      flash(button, "✅");
    } catch (e) {
      logger.error("clipboard write failed", e);
      flash(button, "⚠️");
    }
  }

  // One control, two steps, and the state decides which -- the label says which
  // one it is about to do, so there is nothing to remember (§3).
  function onDetails(button) {
    if (fetchingDetails) return undefined;
    // The entry that owns the button decides which document comes out; the fetch
    // behind them is one and the same (§2.15).
    const kind = button.dataset.gtFormat;
    return detailsFor(load(), kind)
      ? copyDetails(button, kind)
      : fetchDetails(kind);
  }

  // -------------------------------------------------------------- the origins

  /* Each live-list row records a COARSE ORIGIN: "where they generally come from,
     e.g. 'from comments' (not which specific comment)". It is a region category,
     never an instance, it is found by walking up from the anchor, and the first
     match wins (§2.3).

     Two limits, stated rather than hidden. `.ak-renderer-document` renders the
     description AND the comment stream, so one label serves both until a probe
     separates them (§6 item 3, appendix C.2). Search results and an epic's
     children are the same component, so one label serves both.

     A REGION THAT CANNOT BE IDENTIFIED GIVES A ROW WITH NO LABEL. It never gives
     a guess, because a `data-testid` is never invented (§2.1).

     The origin is NOT STORED. It is a property of the live-list row, not of the
     item (§2.3). */
  const ORIGINS = [
    [CURRENT_ISSUE, "this work item"],
    ['[data-testid*="card-list.card.content-container."]', "backlog"],
    ['[data-testid$="ui.card.card"]', "board"],
    ['[data-testid$="ui.issue-row"]', "work-item table"],
    ['[data-testid$="scope.issues.issue.row"]', "timeline"],
    // The Team's own Timeline tab, whose whole view is `sr-timeline` -- read off a
    // live page on 2026-08-18. It takes the SAME label as the Plans timeline, the
    // way one label already serves search results and an epic's children: the
    // label names a region, and both of these are a timeline to the person
    // reading the row.
    //
    // It names the whole VIEW, and that is exactly the right scope for a label and
    // the wrong scope for anything else: a summary read from here would find the
    // first title in the entire timeline for every key, which is the wrong-summary
    // bug §2.2 walks up from the anchor to avoid. The row above is what tier 1
    // uses.
    ['[data-testid="sr-timeline"]', "timeline"],
    // ROVO SEARCH, and it names the whole VIEW for the same reason `sr-timeline`
    // above it does: the page has TWO issue-link regions -- the answer card's
    // datasource table and the results list -- and both are "the search page" to
    // the person reading the drawer. Added on 2026-08-25 with the ninth view. All
    // 70 of that page's anchors were measured inside this one container, so it
    // labels every row on it and nothing off it.
    //
    // IT IS DELIBERATELY NOT IN KNOWN_REGION, and the difference is worth keeping
    // straight. A label is cosmetic: naming a whole view costs a coarse label at
    // worst. A KNOWN_REGION entry this wide would tell the contract check that
    // every key on the page is explained, for ever, including on the day both row
    // names rot -- which is the one thing the check exists to catch.
    //
    // It sits ABOVE the two entries below it, so anything nested inside a search
    // result still reads as "search". Nothing inside a result has been measured;
    // the coarse answer is the honest one until something has.
    ['[data-testid="search-page-body"]', "search"],
    ['[data-testid*="issue-line-card"]', "linked work items"],
    [".ak-renderer-document", "description or comments"],
  ];

  function originOf(anchor) {
    for (const [selector, label] of ORIGINS) {
      if (anchor.closest(selector)) return label;
    }
    return "";
  }

  // ------------------------------------------------------------------ drawer

  /* The drawer is NON-MODAL, and it must stay that way. No backdrop, no focus
     trap, no light dismiss, and nothing that closes it when the page is clicked.
     ESCAPE DOES NOT CLOSE IT: Jira binds Escape all over its own UI, and a drawer
     that vanished under an Escape aimed at one of Jira's dialogs would read as a
     bug. The user kept it open throughout a collecting session, which is the
     verdict -- THE LIVE LIST IS THE REASON IT STAYS OPEN, so the drawer is a
     companion and not a review surface opened at the end (§2.9).

     Plain `z-index`, not the top layer. `popover="manual"` was built into the
     prototype as a switch and never earned its place: nothing of Jira's ever
     covered the drawer at 9999 on any view tried, and the top layer made no
     difference to the one overlap that does exist, because being above everything
     includes being above your neighbours. It is also one less mechanism that
     behaves unlike the rest of the UI. (If anything later does ask
     `matches(":popover-open")`, note that the pseudo-class THROWS on an engine
     that does not know it, so it needs a feature test first.) */

  // The parts `render` has to find again. Ids rather than classes for those, the
  // way the backlog script names its panel and its board list; classes for the
  // things there are many of.
  const HEAD_ID = "gt-cart-head";
  const ALERT_ID = "gt-cart-alert";
  const PREFS_ID = "gt-cart-prefs";
  const PREFS_BUTTON_ID = "gt-cart-prefs-button";
  const PREF_RIGHT_CLICK_ID = "gt-cart-pref-right-click";
  const PREF_COPY_ID = "gt-cart-pref-copy";
  const PREF_LAYOUT_ID = "gt-cart-pref-layout";
  const PREF_CORNER_ID = "gt-cart-pref-corner";
  const PREF_SHAPE_ID = "gt-cart-pref-shape";
  /* THE ONE NAME FOR "THE SETTINGS ARE OPEN", and it is a constant because it is
     used TWICE: `render` writes it on the ⚙, and the stylesheet's selector paints
     the button from it. Two literals would be two values that can disagree, and the
     way they disagree is silent -- the attribute keeps flipping and the paint stops
     following it, which is how the ⚙ was already inert for two versions (§2.11).
     Interpolated into the sheet, so one edit moves both.

     `aria-pressed`, AND IT WAS `aria-expanded` UNTIL 1.2.0. The line above is why
     the change cost one edit: while ⚙ showed and hid a strip inside the drawer it
     was a disclosure, and it carried an `aria-controls` naming the region. Now it
     replaces the drawer's body, so the panel is not a region BESIDE the content --
     it IS the content, which is a mode toggle. `aria-controls` went with the
     rename, because there is no longer a region beside the button to name. */
  const PREFS_STATE_ATTR = "aria-pressed";

  const TITLE_ID = "gt-cart-head-title";
  const TABS_ID = "gt-cart-tabs";
  const RESTORE_ID = "gt-cart-restore";
  // One place each of the panel's per-tab ids is spelled, so the bar's
  // `aria-controls` and the panel's `aria-labelledby` cannot come to name different
  // elements as tabs are added.
  const tabButtonId = (id) => `gt-cart-tab-${id}`;
  const tabPanelId = (id) => `gt-cart-tabpanel-${id}`;
  const fieldListId = (id) => `gt-cart-fields-${id}`;
  /* THE BAND DROPDOWNS' IDS, DERIVED FROM THE PREFERENCE KEY THEY WRITE, so a third
     band would be one more entry in `SETTINGS_TABS` and nothing to name here. The
     lowercase is only house style -- every other id in this file is lowercase -- and
     it is derived rather than spelled out so there is no second name to keep in step
     with `reportBand1`.

     `render` finds them by id. What a CHANGE on one writes is carried by the
     dataset attribute below instead of parsed back out of the id, which is the same
     split the field rows already use: an id is for finding, an attribute is for
     saying what a control is.

     The note is per TAB and not per band, because it describes the pair. */
  const bandSelectId = (key) => `gt-cart-pref-${key.toLowerCase()}`;
  const bandNoteId = (id) => `gt-cart-bandnote-${id}`;
  const BAND_KEY_ATTR = "gtBand";

  /* A FIELD ROW'S FOUR ATTRIBUTES. The first two say what the row IS, and they are
     on the row AND on its checkbox: the delegated `change` listener is handed the
     input and the delegated drag listeners are handed the row, and neither should
     have to walk the other's way up or down the tree to find out which list it is in.

     `gt-list` HOLDS THE PREFERENCE KEY, not the tab id. What a click or a drop does
     is write a preference, so the thing it carries is the name of the key it writes. */
  const FIELD_LIST_ATTR = "gtList";
  const FIELD_ID_ATTR = "gtField";
  /* The two transient ones, written by a drag and painted by the stylesheet: which
     row is being dragged, and which edge of which row it would land on.

     THEY ARE NOT NAMED FOR THE FIELDS, because since 1.4.0 they are not the fields'.
     The collection's item rows wear the same two attributes and the stylesheet paints
     them the same way (§2.9.1). Everything above this line is a field row's; these two
     belong to whatever is being dragged. */
  const DRAG_ATTR = "gtDragging";
  const DROP_ATTR = "gtDrop";

  /* THE DRAG'S PAYLOAD TYPE, AND IT IS NOT `text/plain`. Firefox will not start a
     drag whose `dataTransfer` carries nothing, so something has to be written -- and
     writing it as plain text means a row dropped into Jira's own search box pastes
     `detailsFields:type` into it. A custom type is inert everywhere except here,
     which is the whole of what this payload is for. The logic reads `fieldDrag`
     rather than this, because `getData` is unreadable during `dragover`. */
  const FIELD_DRAG_TYPE = "application/x-gt-cart-field";

  /* AN ITEM ROW'S ATTRIBUTE (§2.9.1, 1.4.0). `gt-key` says which issue the row is, and
     it is what the drag carries -- an id and never an index, for the reason the block
     above `onItemDragStart` gives. The transient pair is `DRAG_ATTR` and `DROP_ATTR`
     above, shared with the field rows.

     Its payload type is separate from the fields' for the reason the fields' is
     separate from `text/plain`: a type is the cheapest possible refusal. Neither list
     is ever on screen while the other is -- the ⚙ panel replaces the body -- so this
     is belt and braces, and it costs one string. */
  const ITEM_KEY_ATTR = "gtKey";
  const ITEM_DRAG_TYPE = "application/x-gt-cart-item";

  const BODY_ID = "gt-cart-body";
  const LIVE_HEAD_ID = "gt-cart-live-head";
  const LIVE_LIST_ID = "gt-cart-live-list";
  const DIVIDER_ID = "gt-cart-divider";
  const NAME_ID = "gt-cart-name";
  const RENAME_ID = "gt-cart-rename";
  const COUNT_ID = "gt-cart-count";
  const REFRESH_ID = "gt-cart-refresh";
  const EMPTY_ID = "gt-cart-empty";
  const ITEM_LIST_ID = "gt-cart-item-list";
  const CHIPS_ID = "gt-cart-chips";
  const CREATE_ID = "gt-cart-create";
  const FOOT_ID = "gt-cart-foot";
  const GRIP_ID = "gt-cart-grip";

  // The drawer's own minimum. The width is still a chosen floor rather than a
  // measurement. THE HEIGHT IS DERIVED, and it was 160 until 1.0.0: at 160 the
  // collection section was left about 42 pixels for the 135 its own fixed parts
  // need, so the create field and all four copy buttons were clipped away
  // (risk 10, measured off this stylesheet). 215 is the height at which BOTH
  // sections' fixed parts fit -- the head, the two section headings, the divider,
  // the chips, the create field and the foot -- so below it something must be
  // clipped whatever the basis does.
  const MIN_INLINE = 300;
  const MIN_BLOCK = 215;

  // What the collection section cannot shrink below, PLUS the 5px divider that
  // comes out of the same reserve, and the live section's basis yields to the sum
  // (see the stylesheet). Its parts, read off the rules below: the section heading
  // 32, one row of chips 29, the create field 35, the foot 38, and its own top
  // border 1 -- 135. With the divider that is 140, and the last five are headroom
  // for the fractional line boxes those numbers round off.
  //
  // ONE ROW OF CHIPS. Enough collections wrap that row, and every extra row asks
  // for about 27 pixels more, which this number does not know about: the floor for
  // "nothing is clipped" then rises with it. That is stated in risk 10 rather than
  // guarded, because the alternative is sizing a fixed part from its own content,
  // which is defect 2 of §2.11 in a new costume.
  //
  // IT IS A MAGIC NUMBER, and the only one in the layout. It has to be kept in
  // step with the four rules above it: a fifth fixed part in this section makes it
  // stale and the clipping comes back silently. `css-smoke` counts the flex: none
  // list for exactly that reason.
  const COLLECTION_FIXED_PX = 145;

  // The divider's travel. A fraction outside this cannot be dragged back, because
  // the section it collapsed would have no grab area left.
  const BASIS_MIN = 20;
  const BASIS_MAX = 85;

  function clamp(value, low, high) {
    return Math.min(Math.max(value, low), high);
  }

  // Sugar over `document.createElement`, and nothing more. Buttons and every
  // other node are still made with `createElement` and NEVER with `DOMParser`:
  // that way produced elements with no namespace, which the Tab key skipped,
  // Enter did not operate, and `disabled` did not affect
  // (`jira-ux-improvements.user.md` §2.9).
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Every control in the drawer names an action instead of carrying a listener.
  // One delegated listener on the drawer then serves all of them, so rebuilding a
  // list has nothing to re-wire and nothing to leak -- the lever
  // `jira-backlog-sprints` uses for its board checkboxes.
  function actionButton(className, action, title) {
    const node = el("button", className);
    node.type = "button";
    node.dataset.gtAction = action;
    if (title) node.title = title;
    return node;
  }

  // Jira binds plenty of bare keys, and a keystroke that opened Jira's
  // quick-search while you were naming a collection would be diagnosed as our bug.
  // ALL THREE events are stopped, because a handler on any one of them is enough
  // to do the damage (§2.9). `stopPropagation` and not `preventDefault`: the
  // keystroke must still reach the field it was typed into.
  function stopKeys(input) {
    for (const type of ["keydown", "keypress", "keyup"]) {
      input.addEventListener(type, (event) => event.stopPropagation());
    }
  }

  function textField(id, placeholder, label) {
    const input = el("input");
    input.id = id;
    input.type = "text";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", label);
    input.autocomplete = "off";
    input.spellcheck = false;
    stopKeys(input);
    return input;
  }

  function select(id, label, options) {
    const node = el("select");
    node.id = id;
    node.setAttribute("aria-label", label);
    for (const [value, text] of options) {
      const option = el("option", null, text);
      option.value = value;
      node.append(option);
    }
    return node;
  }

  // The rows and the chips are rebuilt only when what they SAY changes, never on
  // every render. Replacing them on each mount burst would take the focus off a
  // control you are still using, and on a backlog you are scrolling it would throw
  // the live list's scroll position away several times a second (the signature
  // trick from `jira-backlog-sprints`).
  let liveSignature = null;
  let itemSignature = null;
  let chipSignature = null;

  // The drawer's own in-memory state. None of it is stored, and none of it lives
  // on a node React owns.
  let prefsOpen = false;
  let renaming = null;
  let dragging = null;

  /* THE TWO DESTRUCTIVE CONTROLS ARE ARMED BEFORE THEY FIRE. Added on 2026-08-18,
     at the user's request: emptying a collection meant clicking ✕ on every row,
     and deleting one was not possible at all -- §2.4 designed the delete and §2.9
     never gave it a control.
     
     Neither is a plain click, and the reason is §2.9's own argument for the
     per-row ✕: "a mis-click on a whole row would delete something and there is no
     undo". These remove twelve things, or a whole named collection, so the same
     argument applies with more force. The first click ARMS and says what the
     second one will do; the second commits; anything else disarms. That is the
     pre-click warning the floating button and the live row already give, in the
     one shape a heading and a chip can carry (§2.7, §2.9).
     
     ONLY ONE THING IS EVER ARMED, AND SINCE 1.2.0 THAT IS LITERALLY ONE VARIABLE.
     It was a boolean beside a nullable id, kept exclusive by `arm` -- which worked,
     and which principle 1 says not to write: two values that must agree. The third
     armed control (`↺ Restore export defaults`, §2.9) is what made the pair a
     triple and paid for the change. It holds `null`, `"empty"`, `"restore"`, or a
     collection's id, and a collection id is a `crypto.randomUUID()`, so neither
     word can ever collide with one. */
  let armed = null;
  let armTimer = null;

  // The three controls whose FIRST click arms rather than acts. Every other click
  // inside the drawer disarms, which is how walking away works (§2.9).
  const ARMING_ACTIONS = new Set([
    "empty-collection",
    "delete-collection",
    "restore-exports",
  ]);

  // Long enough to read the question, short enough that a forgotten armed button
  // cannot be committed by a click you meant for something else half a minute
  // later. Chosen, not measured -- the same standing as the hover grace period.
  const ARM_TIMEOUT_MS = 6_000;

  function arm(what) {
    armed = what;
    if (armTimer !== null) clearTimeout(armTimer);
    armTimer = setTimeout(() => guard(disarm), ARM_TIMEOUT_MS);
    render();
  }

  function disarm() {
    if (armTimer !== null) {
      clearTimeout(armTimer);
      armTimer = null;
    }
    if (armed === null) return;
    armed = null;
    scheduleRender();
  }

  // The representative anchor per key, from the last scan. It is derived from the
  // page on every render rather than remembered, so it is not a buffer that can
  // disagree with the page (§2.3).
  let liveAnchors = new Map();

  /* ONE TAB'S BAND DROPDOWNS, BUILT ONCE AND NEVER REBUILT, like everything else on
     this screen: `render` sets a value and a note, and replaces nothing (decision
     25).

     THE POSITION IS THE MEANING. `tab.bands` is an ORDERED list of preference keys,
     so the first one is the band and every later one is a sub-band -- which is why
     the first has no `None` and the rest do. That is decision 12 expressed as a
     structure rather than as a literal `"reportBand1"` in here: a report with no
     bands at all is 📋 Details spelled differently, so band 1 must be a field.

     THE OPTIONS COME FROM `BANDS`, so a band added or dropped there moves both
     dropdowns with it and there is no second list of names to keep in step -- the
     same reason the tab bar is built from `SETTINGS_TABS` and the shape dropdown
     from `SHAPES`. `Time remaining` is absent from both because it is absent from
     `BANDS`, and the reason lives there.

     THE PAIR MAY NOT NAME THE SAME FIELD -- reversed from use on 2026-08-25, having
     shipped the other way. The argument for allowing it was that `Team` then `Team`
     is a report where every sub-heading repeats the heading above it: useless,
     truthful, and visible the moment it is pasted. The user pressed it and reported
     it as a defect, and the argument had weighed the wrong thing -- nobody arrives at
     that pair deliberately, they arrive at it by moving one dropdown and not noticing
     the other.

     THE OPTIONS ARE BUILT WHOLE HERE AND `renderBands` GREYS ONE OUT, rather than
     this list being filtered: the panel is built once and never rebuilt, so an option
     list that grew and shrank would be the one thing on this screen that is replaced.
     `bandPatch` carries the other half of the rule, and `normalisePrefs` the half
     that no click can reach. */
  function bandControls(tab) {
    const wrap = el("div", "gt-cart-bands");

    tab.bands.forEach((key, at) => {
      const row = el("label", "gt-cart-pref");
      row.title =
        at === 0
          ? "Which field 📊 Report groups by. Its value becomes a heading, and the issues carrying it are listed under it."
          : "A second heading inside each group. None gives a report with one level of headings.";
      row.append(el("span", "gt-cart-pref-label", at === 0 ? "Group by" : "Then by"));
      const node = select(
        bandSelectId(key),
        at === 0
          ? "Which field 📊 Report groups by"
          : "Which field 📊 Report groups by inside each group",
        [
          // Band 2's `None` is FIRST because it is the short answer to "and then?",
          // not because it is the default -- the default is `team` and `render`
          // reads that off storage like every other value on this screen.
          ...(at === 0 ? [] : [[NO_BAND, "None"]]),
          ...BANDS.map((band) => [band.id, band.label]),
        ],
      );
      // WHAT A CHANGE WRITES, carried by the control rather than parsed back out of
      // its id -- the same split the field checkboxes use, and the reason
      // `onPrefsChange` needs one branch for however many bands a tab has.
      node.dataset[BAND_KEY_ATTR] = key;
      row.append(node);
      wrap.append(row);
    });

    /* THE ONE PROPERTY A BAND CAN COST, said where the band is chosen. `fixv` is
       multi-valued, so an issue in two releases is listed under both and the paste
       then has a line per issue-and-band rather than per issue (decision 15). THAT
       PROPERTY IS WHAT MAKES A PASTE VERIFIABLE AT A GLANCE -- count the lines,
       count the items -- so losing it has to be said out loud rather than
       discovered.

       IT IS NOT A WARNING AND THERE IS NOTHING TO DISMISS. It is a description of
       what the chosen pair produces, and it is DERIVED on every render from the
       stored bands, so it appears when a fix-version band does and goes when it
       goes. Empty until `render` fills it, and `:empty` hides it, so there is no
       `hidden` attribute beside the text saying the same thing (see the field
       rows' own note). */
    const note = el("p", "gt-cart-band-note");
    note.id = bandNoteId(tab.id);
    wrap.append(note);

    return wrap;
  }

  /* ONE TAB'S FIELD LIST, BUILT ONCE AND NEVER REBUILT. Every catalogue field gets a
     row whether it is ticked or not, so a field is always findable and one click
     turns it on -- which is the other half of `normaliseFieldList`'s step 5 and the
     reason a stored empty list is still completed with the catalogue's names.

     THE ORDER HERE IS THE CATALOGUE'S AND THE ORDER ON SCREEN IS THE PREFERENCE'S.
     They agree on a fresh install, because `defaultFieldList` maps the catalogue, and
     `renderFieldList` puts the rows in the stored order after that. It REORDERS
     rather than rebuilds: no row is ever destroyed, so a drag has something stable to
     hold on to and a re-render cannot take the checkbox you are clicking away from
     you (§2.9, decision 25).

     NO `note` FROM THE PROTOTYPE'S CATALOGUE. It marked `team` as "new", and a label
     that is true for one version and wrong for every version after it is a value
     nothing updates. The one note that ships is `also a heading`, which is a function
     of the stored bands and so cannot go stale. */
  function fieldList(tab) {
    const wrap = el("div", "gt-cart-fields");
    wrap.id = fieldListId(tab.id);

    for (const field of FIELD_CATALOGUE) {
      const row = el("div", "gt-cart-field");
      // HTML5 drag and drop, which is what the prototype the user pressed used, and
      // NOT the pointer plumbing the grip and the divider share. Two reasons, and
      // the second is the load-bearing one: a reorder wants a drag image and a
      // drop target, which the platform gives away here and which `trackDrag` would
      // have to grow; and Jira's own board and backlog drags are pointer-based, so
      // this is the mechanism LEAST likely to collide with them on a page we do not
      // own. There is no keyboard path, deliberately -- the block above
      // `onFieldDragStart` says why, and §6 item 4 is the limit it rests on.
      row.setAttribute("draggable", "true");
      row.dataset[FIELD_LIST_ATTR] = tab.fields;
      row.dataset[FIELD_ID_ATTR] = field.id;

      const grip = el("span", "gt-cart-grip", "⠿");
      // The grip is decoration: the whole row is the drag target, so a name read
      // aloud beside every field would be eight repetitions of nothing.
      grip.setAttribute("aria-hidden", "true");

      const name = el("label", "gt-cart-field-name");
      const box = el("input");
      box.type = "checkbox";
      box.dataset[FIELD_LIST_ATTR] = tab.fields;
      box.dataset[FIELD_ID_ATTR] = field.id;
      // The label comes from `FIELD_CATALOGUE`, which is the one place a field is
      // named. A string here would be a second name that can disagree with the id
      // the renderer draws.
      name.append(box, el("span", null, ` ${field.label}`));

      // Empty until `render` fills it, and `:empty` hides it, so there is no
      // `hidden` to keep in step with the text it would be hiding.
      const note = el("span", "gt-cart-field-note");

      row.append(grip, name, note);
      wrap.append(row);
    }

    return wrap;
  }

  function ensureDrawer() {
    const existing = document.getElementById(DRAWER_ID);
    if (existing?.isConnected) return existing;

    // <body>, not `#jira-frontend`: the Cart is never anchored to a Jira element,
    // and outside React's own root there is nothing that can decide to remove it
    // (§2.9). At document-start there is no <body> yet, and a later signal brings
    // us straight back here.
    const mount = document.body;
    if (!mount) return null;

    // Built whether or not it is open, so that the badge's `aria-controls` names
    // something real from the first paint. L1 left both ARIA attributes off for
    // exactly that reason: they would have pointed at nothing.
    const drawer = el("aside");
    drawer.id = DRAWER_ID;
    drawer.setAttribute(UI_ATTRIBUTE, "");
    drawer.setAttribute("aria-label", "Jira Cart");

    // -- the head. Its controls sit on the side the drawer IS anchored to, and the
    // grip on the corner it is NOT: one attribute on <html> generates both
    // placements, which is what stops the ✕ and the grip landing on the same spot
    // on a bottom-left dock (§2.9, §2.11 defect 5).
    const head = el("div", "gt-cart-head");
    head.id = HEAD_ID;
    const controls = el("div", "gt-cart-head-controls");
    // No `aria-controls`, and no title written here: both are `render`'s. The
    // button is a MODE TOGGLE since 1.2.0 -- it does not disclose a region beside
    // the content, it swaps what the content is -- so there is nothing beside it to
    // name, and its tooltip is a function of state like every other label (§2.8).
    const prefsButton = actionButton("gt-cart-icon", "prefs");
    prefsButton.id = PREFS_BUTTON_ID;
    prefsButton.textContent = "⚙";
    // ✕ KEEPS EXACTLY ONE MEANING ON BOTH SCREENS: close the drawer. A ✕ that went
    // back from the settings instead would be two values that disagree wearing a
    // different hat, and it would leave no way to close the Cart from the settings
    // screen at all (§2.9).
    const closeButton = actionButton("gt-cart-icon", "close", "Close the Cart");
    closeButton.textContent = "✕";
    controls.append(prefsButton, closeButton);
    // The words are `render`'s, because the head NAMES THE SCREEN YOU ARE ON: it
    // reads `⚙ Settings` while the panel is up and `🛒 Cart` once it is down. The
    // repo's convention is that the label IS the state (§2.14, §3), and that won
    // over the argument that a head is an identity rather than a state.
    const title = el("span", "gt-cart-title");
    title.id = TITLE_ID;
    head.append(title, controls);

    // -- the line that carries a failure. A tooltip alone was rejected: an add
    // that silently did nothing is the outcome that rule exists to prevent (§2.9).
    const alert = el("p", "gt-cart-alert");
    alert.id = ALERT_ID;
    alert.hidden = true;

    // -- ⚙ IS A SCREEN, NOT A STRIP (§2.9, decision 17). It was three checkboxes
    // above the sections until 1.2.0; the configurable exports bring about twenty-
    // two controls, and this drawer can be 300x215 with every container on
    // `overflow: clip`, so a panel sharing the box with the sections would be
    // SILENTLY TRUNCATED with no scrollbar to say so. That is a measurement rather
    // than a preference, and it is what makes this a mode over the whole body.
    const prefs = el("div", "gt-cart-prefs");
    prefs.id = PREFS_ID;
    prefs.hidden = true;
    // One delegated `change` listener on the area rather than one per control.
    prefs.addEventListener("change", (event) =>
      guard(() => onPrefsChange(event.target)),
    );
    /* THE FIELD LISTS' DRAG, DELEGATED THE SAME WAY. Four listeners on the panel
       rather than four on each of sixteen rows, so a reorder has nothing to re-wire
       -- and the rows are moved rather than replaced, so there would be nothing to
       re-wire even if they were not.

       `dragover` is here because a drop target that never calls `preventDefault` is
       a drop that never happens: the platform's default is to refuse. That is also
       what REFUSES A CROSS-LIST DROP for free -- see `onFieldOver`. */
    prefs.addEventListener("dragstart", (event) =>
      guard(() => onFieldDragStart(event)),
    );
    prefs.addEventListener("dragover", (event) => guard(() => onFieldOver(event)));
    prefs.addEventListener("drop", (event) => guard(() => onFieldDrop(event)));
    prefs.addEventListener("dragend", (event) => guard(() => onFieldDragEnd(event)));

    /* THE COPY BUTTON'S SWITCH, and it is the only checkbox on this tab that ships
       ON. The two are not the same kind of switch and the labels say so: the
       right-click one is named by what it TAKES AWAY, because that is the whole
       question about it; this one is named by what it PUTS THERE, because it takes
       nothing away and the only reason to turn it off is the room the second button
       occupies.

       ABOVE the right-click row, which is the one place on this tab where order was
       chosen rather than inherited: this switch is on for everybody and the one below
       it is off for everybody, so the tab reads from the mild control to the
       expensive one instead of the other way round (§2.7.1). */
    const copyPref = el("label", "gt-cart-pref");
    copyPref.title =
      "A 🔗 beside the + on any issue link you hover. It puts that one issue on the clipboard in the shape ⚙ Issue reference names — the same bytes 🔗 Links would give for it — and it never opens the issue. Turn it off and the hovered rail is the single + it was before, which is worth doing if the wider rail covers something in your rows.";
    const copyInput = el("input");
    copyInput.type = "checkbox";
    copyInput.id = PREF_COPY_ID;
    copyPref.append(
      copyInput,
      el(
        "span",
        null,
        "A 🔗 beside the + copies the hovered issue's link, without opening it",
      ),
    );

    const rightClick = el("label", "gt-cart-pref");
    // Labelled by WHAT IT TAKES AWAY, which is the words §2.9 gives it, and the
    // tooltip carries the whole trade from §2.7. It ships OFF.
    rightClick.title =
      "While this is on, right-clicking an issue link no longer gives you the browser's own menu: no Open link in new window, no Copy link address, no Save link as, no Search with…, and none of your extensions' entries. Open link in new tab and Copy link are given back inside the Cart's menu. On Chromium there is no way to bypass it.";
    const rightClickInput = el("input");
    rightClickInput.type = "checkbox";
    rightClickInput.id = PREF_RIGHT_CLICK_ID;
    rightClick.append(
      rightClickInput,
      el(
        "span",
        null,
        "Right-click an issue link opens the Cart's menu instead of the browser's",
      ),
    );

    // The layout is ONE preference with three states, rather than a layout flag
    // sitting beside a remembered size that could contradict it. `auto` is
    // answered by a container query on the drawer's own width, so the two pinned
    // values are the only thing a control has to say (§2.9).
    const layout = el("label", "gt-cart-pref");
    layout.append(el("span", "gt-cart-pref-label", "Sections"));
    layout.append(
      select(PREF_LAYOUT_ID, "How the two sections are arranged", [
        ["auto", "Automatic (side by side when wide)"],
        ["stacked", "Always stacked"],
        ["split", "Always side by side"],
      ]),
    );

    // The Cart takes a BOTTOM corner and is never anchored to a Jira element. The
    // top-right belongs to the two sibling scripts, and it is unusable for a fixed
    // element anyway (§2.9).
    const corner = el("label", "gt-cart-pref");
    corner.append(el("span", "gt-cart-pref-label", "Corner"));
    corner.append(
      select(PREF_CORNER_ID, "Which bottom corner the Cart sits in", [
        ["bottom-right", "Bottom right"],
        ["bottom-left", "Bottom left"],
      ]),
    );

    /* THE PANEL IS BUILT ONCE AND NEVER REBUILT, and that is a rule rather than an
       optimisation. Every add re-renders the drawer -- including an add made from
       the page while ⚙ is up, which decision 25 requires to keep working -- so a
       panel that rebuilt itself on render would take the focus off the select you
       were using, and would destroy ticket 04's field-list drag mid-gesture. What
       `render` does instead is SET: an attribute per tab, `hidden` per panel, and a
       value per control. Nothing in here is replaced.

       PINNED ABOVE THE BAR: `Issue reference` governs all three exports, so a tab
       that owned it would tell a small lie about its scope (decision 29). */
    const pinned = el("div", "gt-cart-group");
    pinned.append(el("div", "gt-cart-group-head", "Every export"));

    /* ONE SETTING, THREE CONSUMERS. 🔗 Links' whole line, and the head of every
       line in 📋 Details and 📊 Report, all come from this one control, which is
       what keeps §2.14's promise that the three agree about what a collected issue
       looks like (decision 5). A per-export override is left in §6.

       The options are BUILT FROM `SHAPES`, so a shape added or dropped there moves
       this dropdown with it and there is no second list of names to keep in step --
       the same reason the tab bar is built from `SETTINGS_TABS`.

       Same markup as `Sections` and `Corner` above, so it costs no new CSS and sits
       on the same grid. */
    const shape = el("label", "gt-cart-pref");
    shape.title =
      "How every export writes the issue at the head of a line. 🔗 Links, 📋 Details and 📊 Report all use it, so the three agree about what a collected issue looks like. The markdown shapes arrive as live links where markdown is rendered and as their own source code where it is not; the shapes that show a URL arrive readable and clickable in both.";
    shape.append(el("span", "gt-cart-pref-label", "Issue reference"));
    shape.append(
      select(
        PREF_SHAPE_ID,
        "How an issue is written at the head of a line, in every export",
        SHAPES.map((one) => [one.id, one.label]),
      ),
    );
    pinned.append(shape);
    prefs.append(pinned);

    // The bar shows EVERY tab whether it has ever been pressed or not, so there is
    // no open/closed set to store and a tab added later is visible the moment it
    // exists (decision 20). That is the whole difference from the collapsible
    // layout the prototype tried and use reversed.
    const bar = el("div", "gt-cart-tabs");
    bar.id = TABS_ID;
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Settings sections");
    for (const tab of SETTINGS_TABS) {
      const button = actionButton("gt-cart-tab", "settings-tab");
      button.id = tabButtonId(tab.id);
      button.dataset.gtTab = tab.id;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", tabPanelId(tab.id));
      button.textContent = tab.label;
      bar.append(button);
    }
    prefs.append(bar);

    // A GROUP HEADING ONLY WHERE A TAB HOLDS MORE THAN ONE GROUP. All three hold
    // exactly one today, so a heading would repeat the tab label immediately below
    // it. The pinned group above keeps its heading because it is NOT under a tab.
    for (const tab of SETTINGS_TABS) {
      const panel = el("div", "gt-cart-tabpanel");
      panel.id = tabPanelId(tab.id);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabButtonId(tab.id));
      panel.hidden = true;
      if (tab.id === "appearance") {
        panel.append(copyPref, rightClick, layout, corner);
      }
      // THE BANDS GO ABOVE THE LIST, because a band is what takes a field into a
      // heading and the list is what says what is left on the row -- so the panel
      // reads in the order the document is built. Both are driven off
      // `SETTINGS_TABS`, so a tab with bands and no field list, or the reverse,
      // costs nothing here.
      if (tab.bands) panel.append(bandControls(tab));
      if (tab.fields) panel.append(fieldList(tab));
      prefs.append(panel);
    }

    /* ↺ RESTORE EXPORT DEFAULTS, armed before it fires, by §3's own convention --
       ⌫ becomes `Empty 3?` before it will empty anything. Its label and its armed
       state are derived in `render` for the reason every other label is: one
       written on the click is a value that has to agree with `armed` and can stop
       agreeing (§2.8). */
    const restore = actionButton("gt-cart-restore", "restore-exports");
    restore.id = RESTORE_ID;
    restore.hidden = true;
    prefs.append(restore);

    // -- the two standing sections. There is no third drawer mode and no scan
    // button: SCANNING IS NOT AN ACTION (§2.3).
    const body = el("div", "gt-cart-body");
    body.id = BODY_ID;

    const live = el("section", "gt-cart-section gt-cart-live");
    const liveHead = el("h2", "gt-cart-section-head");
    liveHead.id = LIVE_HEAD_ID;
    const liveList = el("div", "gt-cart-list");
    liveList.id = LIVE_LIST_ID;
    live.append(liveHead, liveList);

    const divider = el("div", "gt-cart-divider");
    divider.id = DIVIDER_ID;
    divider.setAttribute("role", "separator");
    divider.title =
      "Drag to give one section more room. Double-click to hand it back.";
    divider.addEventListener("pointerdown", (event) =>
      guard(() => onDividerDown(event)),
    );
    divider.addEventListener("dblclick", () =>
      guard(() => resetDivider()),
    );

    const collection = el("section", "gt-cart-section gt-cart-collection");
    const collectionHead = el("h2", "gt-cart-section-head");
    // Click the name in the heading and edit it in place: THE THING YOU CLICK IS
    // THE THING YOU CHANGE. Enter or blur commits, Escape cancels (§2.9).
    const name = actionButton(
      "gt-cart-name",
      "rename",
      "Click to rename this collection. Enter or clicking away commits, Escape cancels",
    );
    name.id = NAME_ID;
    const rename = textField(RENAME_ID, "", "Rename this collection");
    rename.hidden = true;
    rename.addEventListener("keydown", (event) =>
      guard(() => {
        if (event.key === "Enter") commitRename();
        else if (event.key === "Escape") cancelRename();
      }),
    );
    // Blur commits. Escape has already cleared `renaming` by the time hiding the
    // field produces a blur, so a cancel cannot be undone by it.
    rename.addEventListener("blur", () => guard(commitRename));
    const count = el("span", "gt-cart-count");
    count.id = COUNT_ID;
    // ⌫ empties, ↻ refreshes, and they sit together at the far end of the heading:
    // both act on the NAMED THING, which is why §2.9 puts an action on a
    // collection next to its name rather than in the foot row, where everything is
    // about getting data out.
    const empty = actionButton("gt-cart-icon", "empty-collection");
    empty.id = EMPTY_ID;
    const refresh = actionButton("gt-cart-icon", "refresh");
    refresh.id = REFRESH_ID;
    refresh.textContent = "↻";
    collectionHead.append(name, rename, count, empty, refresh);

    const itemList = el("div", "gt-cart-list");
    itemList.id = ITEM_LIST_ID;
    /* THE REORDER'S FOUR LISTENERS, ON THE LIST AND NOT ON THE ROWS (§2.9.1).
       The rows are replaced on every rebuild and this box never is, so delegation
       here is the only registration that cannot go stale -- and it is what makes
       `dragend` reach us at all. `dragover` is not optional: a drop target that
       never calls `preventDefault` is a drop that never happens, because the
       platform's default is to refuse. */
    itemList.addEventListener("dragstart", (event) =>
      guard(() => onItemDragStart(event)),
    );
    itemList.addEventListener("dragover", (event) => guard(() => onItemOver(event)));
    itemList.addEventListener("drop", (event) => guard(() => onItemDrop(event)));
    itemList.addEventListener("dragend", () => guard(() => onItemDragEnd()));

    const chips = el("div", "gt-cart-chips");
    chips.id = CHIPS_ID;

    // The create field is a sibling of the chips rather than a child, so a chip
    // rebuild can never replace the field you are typing into.
    const create = el("div", "gt-cart-create");
    const createInput = textField(
      CREATE_ID,
      "new collection…",
      "Name a new collection",
    );
    createInput.addEventListener("keydown", (event) =>
      guard(() => {
        if (event.key === "Enter") createCollection();
      }),
    );
    const createButton = actionButton(
      "gt-cart-button",
      "create",
      "Create this collection and make it active",
    );
    createButton.textContent = "＋";
    create.append(createInput, createButton);

    const foot = el("div", "gt-cart-foot");
    foot.id = FOOT_ID;
    for (const spec of EXPORTS) {
      // The entry names its own action, so the one that navigates cannot end up on
      // the clipboard path by accident, and the one that has to fetch first cannot
      // reach the plain copy path at all.
      const button = actionButton(
        "gt-cart-copy",
        spec.opens ? "search" : spec.needsDetails ? "details" : "copy",
      );
      button.dataset.gtFormat = spec.kind;
      // The stylesheet reserves the width of a button whose label is a ladder, so
      // that changing the label cannot move the buttons beside it.
      if (spec.needsDetails) button.dataset.gtSteps = "true";
      // The label and the title are set by `render`, never here: a label written
      // once at construction keeps the ✅ for ever (§2.8).
      foot.append(button);
    }

    collection.append(collectionHead, itemList, chips, create, foot);
    body.append(live, divider, collection);

    // -- our own grip, on the free corner, and NEVER `resize: both` (§2.11
    // defect 4). Pointer-only: it is not a button, because a focusable control
    // with no keyboard action would promise something the drawer does not have
    // yet (§6 item 4).
    const grip = el("div", "gt-cart-grip");
    grip.id = GRIP_ID;
    grip.setAttribute("aria-hidden", "true");
    grip.title = "Drag to resize. Double-click to let the drawer size itself again.";
    grip.addEventListener("pointerdown", (event) =>
      guard(() => onGripDown(event)),
    );
    grip.addEventListener("dblclick", () => guard(() => resetSize()));

    drawer.append(head, alert, prefs, body, grip);

    // One delegated click listener for every control in the drawer.
    drawer.addEventListener("click", (event) =>
      guard(() => {
        const target =
          event.target instanceof Element
            ? event.target.closest("[data-gt-action]")
            : null;
        const action = target?.disabled ? null : target?.dataset.gtAction;
        // Disarmed HERE rather than inside `onDrawerAction`, so that a click on a
        // heading, on a row's dead space, or on a disabled control counts as
        // walking away as well. Only the three arming controls survive it, and they
        // are a named set rather than a chain of `!==` because the third one is
        // what made the chain worth reading twice.
        if (!ARMING_ACTIONS.has(action)) disarm();
        if (!action) return;
        onDrawerAction(action, target);
      }),
    );

    // A fresh drawer has no rows and no chips. Forget the signatures, or the next
    // render compares against the drawer this one replaces and decides it has
    // nothing to do.
    liveSignature = null;
    itemSignature = null;
    chipSignature = null;

    mount.append(drawer);
    logger.debug("drawer built");
    return drawer;
  }

  // ANYTHING THAT IS NOT THE SECOND HALF OF AN ARMING PAIR DISARMS, and the
  // drawer's own click listener is where that happens, so dead space counts too.
  function onDrawerAction(action, node) {
    switch (action) {
      case "empty-collection":
        if (armed === "empty") {
          disarm();
          emptyActive();
        } else {
          arm("empty");
        }
        return;
      case "delete-collection":
        if (armed === node.dataset.gtId) {
          disarm();
          deleteCollection(node.dataset.gtId);
        } else {
          arm(node.dataset.gtId);
        }
        return;
      case "close":
        setDrawerOpen(false);
        return;
      case "prefs":
        prefsOpen = !prefsOpen;
        render();
        return;
      case "settings-tab":
        // THE WRITE IS WHAT MAKES IT REAL, here as everywhere else: nothing holds a
        // copy of which tab is open, `render` reads it back out of storage, and
        // `savePrefs` schedules that render (§2.5, principle 1).
        savePrefs({ settingsTab: node.dataset.gtTab });
        return;
      case "restore-exports":
        if (armed === "restore") {
          disarm();
          restoreExportDefaults();
        } else {
          arm("restore");
        }
        return;
      case "toggle-item":
        toggleKey(node.dataset.gtKey);
        return;
      case "remove-item":
        removeKey(node.dataset.gtKey);
        return;
      case "refresh":
        guard(refreshActive);
        return;
      case "copy":
        guard(() => copyActive(node, node.dataset.gtFormat));
        return;
      case "details":
        guard(() => onDetails(node));
        return;
      case "search":
        guard(openSearch);
        return;
      case "activate":
        activateCollection(node.dataset.gtId);
        return;
      case "create":
        createCollection();
        return;
      case "rename":
        startRename();
        return;
      default:
        return;
    }
  }

  /**
   * `Restore export defaults`, committed. It reaches EXACTLY the keys
   * `EXPORT_PREF_KEYS` names -- the line shape, both field lists and both bands --
   * and the list is there so that this function does not have to be the place a
   * seventh export preference is remembered.
   *
   * One `savePrefs`, so one read-modify-write and one value-change event: a tab
   * that has been open since this morning cannot write a stale appearance switch
   * over one changed since (§2.5). And `settingsTab` is not in the patch, so the
   * panel does not move out from under the press that restored.
   */
  function restoreExportDefaults() {
    savePrefs(
      Object.fromEntries(EXPORT_PREF_KEYS.map((key) => [key, DEFAULT_PREFS[key]])),
    );
    logger.log("the export settings are back at their defaults");
  }

  function setDrawerOpen(open) {
    if (drawerIsOpen() === open) return;
    // The write is what makes it real, here as everywhere else. `savePrefs`
    // schedules a render of its own; the direct call below is what puts the drawer
    // on the page in the same frame as the click rather than the next one.
    savePrefs({ open });
    // A control left armed must not still be armed when the drawer comes back.
    disarm();
    // Re-read when the drawer opens, which is free: `render` always reads storage,
    // so there is no in-memory copy to refresh (§2.5, rule 3).
    render();
  }

  /**
   * THE WHOLE LIVE-LIST ROW IS THE CONTROL. The live list is the only add path for
   * anyone who cannot hover, so the target is the row and not a small `+` inside
   * it (§2.9). `07`'s constraint is honoured: the same item is removable in BOTH
   * sections, never removable in one and inert in the other.
   */
  function toggleKey(key) {
    if (!key) return;

    // Which way the click goes is derived from STORAGE, inside the
    // read-modify-write, exactly as the floating button does it: a label made
    // stale by another tab cannot cause the wrong operation (§2.7).
    let outcome = null;
    const written = update((blob) => {
      const collection = blob.collections[0];
      const at = collection.items.findIndex((item) => item.key === key);

      if (at >= 0) {
        collection.items.splice(at, 1);
        outcome = { action: "removed", name: collection.name };
        return;
      }

      // Read from the representative anchor of the last scan -- the group's
      // reading anchor, which is the WIDEST (§2.3, §2.7). If that row unmounted
      // between the render and the click, there is no summary and the key is
      // stored on its own, which is a valid item (§2.6, rule 1).
      const anchor = liveAnchors.get(key)?.anchor;
      const found = anchor
        ? readSummary(anchor, key)
        : { summary: "", tier: 0 };
      const item = { key };
      if (found.summary) item.summary = found.summary;
      collection.items.push(item);
      outcome = {
        action: "added",
        name: collection.name,
        summary: found.summary,
        tier: found.tier,
      };
    });

    logAdd(key, outcome, written);
  }

  // A collection row keeps a plainer explicit ✕, because in a thirty-item list a
  // mis-click on a whole row would delete something and there is no undo (§2.9).
  function removeKey(key) {
    if (!key) return;
    const written = update((blob) => {
      const collection = blob.collections[0];
      const at = collection.items.findIndex((item) => item.key === key);
      if (at >= 0) collection.items.splice(at, 1);
    });
    if (written) logger.debug(`removed ${key}`);
  }

  /**
   * Empties the active collection and KEEPS THE COLLECTION AND ITS NAME. That is
   * the whole reason it is a separate control from the chip's ✕: a collection you
   * refill every sprint is worth keeping, and deleting it to clear it would mean
   * typing its name again (§2.9, added 2026-08-18).
   */
  function emptyActive() {
    let emptied = 0;
    const written = update((blob) => {
      const collection = blob.collections[0];
      emptied = collection.items.length;
      collection.items = [];
    });
    if (written) logger.log(`emptied ${emptied} item(s) from the active collection`);
  }

  /**
   * Deletes a collection, and §2.4 already decided both halves of what that means.
   *
   * `collections` IS NEVER EMPTY, so deleting the last one EMPTIES IT INSTEAD of
   * removing it. With that invariant *the active collection* stays total: it always
   * resolves, and no code path anywhere handles "there is no active collection".
   *
   * And there is no active pointer, so nothing has to be repaired: the active
   * collection is `collections[0]`, so removing it PROMOTES THE NEXT ONE BY
   * CONSTRUCTION. No id can dangle, because no id is stored anywhere.
   */
  function deleteCollection(id) {
    if (!id) return;
    let outcome = null;
    const written = update((blob) => {
      const at = blob.collections.findIndex((one) => one.id === id);
      if (at < 0) return;
      const target = blob.collections[at];
      if (blob.collections.length === 1) {
        outcome = { action: "emptied", name: target.name, count: target.items.length };
        target.items = [];
        return;
      }
      outcome = { action: "deleted", name: target.name, count: target.items.length };
      blob.collections.splice(at, 1);
    });
    if (!written || !outcome) return;
    logger.log(
      outcome.action === "deleted"
        ? `deleted the collection ${outcome.name} and its ${outcome.count} item(s)`
        : `emptied ${outcome.name}: it is the only collection, so it was not removed`,
    );
  }

  // A DEBUG line, not a log. It was a log in version 0.1.1 only because the
  // console was the only way to see what the cascade had captured; the drawer
  // replaces it. THE TIER STAYS IN THE LINE, because it is how §7 step 5 is
  // checked.
  function logAdd(key, outcome, written) {
    if (!written || !outcome) {
      logger.warn(`${key} was not stored: the collections were not written`);
      return;
    }
    if (outcome.action === "removed") {
      logger.debug(`removed ${key} from ${outcome.name}`);
      return;
    }
    logger.debug(
      outcome.summary
        ? `added ${key} to ${outcome.name}: "${outcome.summary}" (tier ${outcome.tier})`
        : `added ${key} to ${outcome.name}: no summary on the page, so the key is stored on its own`,
    );
  }

  // Activating a collection MOVES IT TO THE FRONT, because the active collection
  // is `collections[0]` and there is no pointer that could dangle (§2.4). The cost
  // is accepted knowingly: the list of collections reshuffles when you switch, and
  // a hand-chosen order cannot be expressed.
  function activateCollection(id) {
    if (!id) return;
    update((blob) => {
      const at = blob.collections.findIndex((one) => one.id === id);
      if (at <= 0) return;
      const [moved] = blob.collections.splice(at, 1);
      blob.collections.unshift(moved);
    });
  }

  /**
   * Duplicate names are PREVENTED, by appending a number: ` 2`, then ` 3`, lowest
   * free wins, a clash ignores case, and it is THE SAME RULE ON CREATE AND ON
   * RENAME (§2.9).
   *
   * The cost is known and accepted: a collection genuinely called `Sprint 2`
   * duplicates to `Sprint 2 2`, because incrementing the trailing number would
   * silently name it after a different sprint.
   */
  function uniqueName(name, collections, exceptId) {
    const taken = new Set(
      collections
        .filter((one) => one.id !== exceptId)
        .map((one) => one.name.trim().toLowerCase()),
    );
    const base = name.trim();
    if (!taken.has(base.toLowerCase())) return base;
    // Bounded by the number of names already taken, so it terminates.
    for (let n = 2; n <= taken.size + 2; n += 1) {
      const candidate = `${base} ${n}`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
    return base;
  }

  function createCollection() {
    const input = document.getElementById(CREATE_ID);
    const typed = (input?.value ?? "").trim();
    // An empty field is not a collection. Nothing is written and the field keeps
    // the focus: the placeholder already says what belongs there.
    if (!typed) {
      input?.focus();
      return;
    }
    const written = update((blob) => {
      // A new collection is created AND MADE ACTIVE, which is the front of the
      // array (§2.4, §3).
      blob.collections.unshift({
        // Opaque, generated once, and never derived from the name, so renaming is
        // free (§2.4).
        id: crypto.randomUUID(),
        name: uniqueName(typed, blob.collections),
        items: [],
      });
    });
    if (written && input) input.value = "";
  }

  function startRename() {
    const state = load();
    if (!state.writable) return;
    const collection = activeCollection(state);
    renaming = collection.id;
    // Rendered synchronously, because the field has to exist before it can be
    // focused.
    render();
    const input = document.getElementById(RENAME_ID);
    if (!input) return;
    // The value is set HERE and never by `render`: while the field is open it
    // belongs to the keyboard, and a render in the middle of typing must not put
    // the stored name back (§2.10).
    input.value = collection.name;
    input.focus();
    input.select();
  }

  function commitRename() {
    const id = renaming;
    const input = document.getElementById(RENAME_ID);
    if (!id || !input) return;
    renaming = null;

    const typed = input.value.trim();
    // An empty name would leave the badge reading `🛒  7 ▾`. Nothing is written
    // and the previous name stands, because the safe default is what remains
    // (principle 4). The ADR does not name this case; it names no other reading
    // either.
    if (!typed) {
      render();
      return;
    }
    update((blob) => {
      const collection = blob.collections.find((one) => one.id === id);
      if (!collection) return;
      collection.name = uniqueName(typed, blob.collections, id);
    });
    render();
  }

  function cancelRename() {
    if (renaming === null) return;
    renaming = null;
    render();
  }

  function onPrefsChange(input) {
    if (!input) return;
    if (input.id === PREF_RIGHT_CLICK_ID) {
      savePrefs({ rightClickMenu: input.checked === true });
      return;
    }
    // `=== true` here as well, even though this preference reads `!== false` on the
    // way out. A checkbox can only produce a boolean, and writing the raw property
    // would put whatever the DOM handed us into storage; `normalisePrefs` is what
    // decides what a stored non-boolean means, and it must not be the only guard
    // (§2.4).
    if (input.id === PREF_COPY_ID) {
      savePrefs({ copyButton: input.checked === true });
      return;
    }
    if (input.id === PREF_LAYOUT_ID) {
      savePrefs({ layout: input.value });
      return;
    }
    if (input.id === PREF_CORNER_ID) {
      savePrefs({ corner: input.value });
      return;
    }
    // Not range-checked here. `savePrefs` normalises on the way in and `loadPrefs`
    // again on the way out, so a value this build does not know falls back to
    // `markdown` rather than reaching a formatter (§2.4, ticket 01).
    if (input.id === PREF_SHAPE_ID) {
      savePrefs({ lineShape: input.value });
      return;
    }
    /* A BAND. The dropdown carries the preference key it writes, so one branch
       serves both of them and a third band would need no line here -- the same
       reason the field checkboxes carry theirs.

       NOT RANGE-CHECKED HERE, for the reason the line shape is not: `savePrefs`
       normalises on the way in and `loadPrefs` again on the way out, so a value this
       build does not know falls back to the default rather than reaching a renderer.
       Band 1 has no `None` in its options, and `normalisePrefs` is what makes that a
       rule rather than a fact about a dropdown (§2.4, ticket 01).

       BEFORE THE FIELD TICK BELOW, because both are dataset-driven and this one is
       the narrower test. */
    const band = input.dataset[BAND_KEY_ATTR];
    if (band) {
      // ONE PRESS, SOMETIMES TWO KEYS -- `bandPatch` owns the rule and says why.
      // Read-modify-write over the STORED pair rather than over what is on screen,
      // for the reason the field ticks are: another tab may have moved a band since
      // this panel was drawn (§2.5).
      savePrefs(bandPatch(band, input.value, loadPrefs()));
      return;
    }
    /* A FIELD'S TICK. The checkbox carries the key it writes and the id it is, so
       one branch serves both lists and a third list would need no line here.

       READ-MODIFY-WRITE OVER THE STORED LIST, never over a copy held since the panel
       was built: another tab may have reordered this list since, and rebuilding it
       from what is on screen would write that reorder away. `savePrefs` reads
       storage again on top of this, so the window is the same microseconds every
       other write in this file lives with (§2.5).

       A TICK IS NOT A REORDER. The entry keeps its place, which is the whole reason
       the list stores `{ id, on }` in order rather than an array of enabled ids:
       unticking a field would otherwise lose its position and re-ticking it would
       send it to the end, so somebody toggling one field to compare two outputs
       would find their order quietly rearranged (see `normaliseFieldList`). */
    const key = input.dataset[FIELD_LIST_ATTR];
    const id = input.dataset[FIELD_ID_ATTR];
    if (key && id && Array.isArray(loadPrefs()[key])) {
      savePrefs({
        [key]: loadPrefs()[key].map((field) =>
          field.id === id ? { id: field.id, on: input.checked === true } : field,
        ),
      });
    }
  }

  /* -- the field lists' drag (§2.14, decision 11).
   *
   * NOTHING DRIVES THIS ONE, AND THE REASON IS NARROWER THAN IT USED TO SAY. This
   * block claimed no harness in this repository COULD drive a drag. That stopped
   * being true at 1.4.0: `boot-smoke` keeps the delegated listeners it registers and
   * lets a rect be stubbed per node, and the collection's drag (§2.9) is driven there
   * end to end. What is true is that nothing drives THIS drag, which is a gap in the
   * harness rather than a property of the platform -- retro-fitting the same
   * synthetic drag to these rows was offered on 2026-08-25 and declined as out of
   * scope. So the cost of decision 11 is still paid in two instalments here:
   * `moveInList` is pure so the state change is covered, and §7 step 31 is the
   * browser pass for the rest. Do not read the quiet here as coverage.
   *
   * WHAT IS HELD IS AN ID, NEVER AN INDEX -- AND THE REASON THIS BLOCK GAVE FOR THAT
   * WAS WRONG. Corrected 2026-08-25, when the collection's drag was designed and the
   * same argument was put to the user, who took it apart in one sentence: A PERSON
   * HAS ONE PAIR OF HANDS. They cannot click in another tab, or on the page's `+`,
   * while holding a mouse button down in this one. So "every add calls `render`",
   * "an add from the page keeps working while ⚙ is up" and "another tab writing this
   * very list" are all hand-driven, and NONE of them can land mid-drag. Nothing
   * writes a preference without a click, so this list's stored order cannot change
   * while a row of it is in the air.
   *
   * The ONE thing in the Cart that writes with no hand on it is `runGapFill` -- a
   * timer and a fetch -- and it writes COLLECTIONS, not preferences. It can re-render
   * us mid-drag, and this panel survives that because it MOVES its rows rather than
   * rebuilding them. The collection's list is rebuilt, which is why that drag needed
   * a freeze and this one does not.
   *
   * So the id stays, and it is now honestly a cheap handle rather than a defence:
   * both ends are resolved against the STORED LIST at drop time, no index is kept,
   * and there is nothing to go stale. The drag still needs no entry in `dragging`,
   * because it still owns no property that `render` puts back (§2.10, §2.11
   * defect 4).
   *
   * THERE IS NO KEYBOARD PATH, AND THAT IS A DECISION RATHER THAN AN OMISSION. §6
   * item 4 states the limit: the Cart is not intended to be operated by keyboard
   * input, and the drawer's other drags are pointer-only for the same reason -- two
   * of them when this was written, three since 1.4.0. Adding one here would be the
   * first keyboard-only affordance in the file and would say the limit had moved when
   * it has not.
   */
  // Which row is being dragged, as { list, id }. It is a variable and not read back
  // out of `dataTransfer`, because `getData` is UNREADABLE during `dragover` in
  // every engine -- the protected mode the spec requires -- and `dragover` is where
  // the decision to accept or refuse the drop is made.
  let fieldDrag = null;

  function fieldRowOf(target) {
    return target instanceof Element ? target.closest(".gt-cart-field") : null;
  }

  // The panel's rows, from the panel rather than from a list: a drag that started in
  // one list and wandered into the other has to be able to clear the indicator it
  // left behind in the first.
  function clearFieldDrop(except) {
    const panel = document.getElementById(PREFS_ID);
    if (!panel) return;
    // Read before writing, and leave the row that is about to be marked alone.
    // `dragover` fires continuously while the pointer moves, so this runs tens of
    // times a second over sixteen rows, and writing an attribute that already says
    // what it says still invalidates the element's style. With both guards a pointer
    // sitting still in one half of one row writes nothing at all.
    for (const row of panel.querySelectorAll(".gt-cart-field")) {
      if (row !== except && row.dataset[DROP_ATTR]) {
        row.dataset[DROP_ATTR] = "";
      }
    }
  }

  function onFieldDragStart(event) {
    const row = fieldRowOf(event.target);
    if (!row) return;
    fieldDrag = {
      list: row.dataset[FIELD_LIST_ATTR],
      id: row.dataset[FIELD_ID_ATTR],
    };
    // Written for the platform rather than for us -- see `FIELD_DRAG_TYPE`.
    if (event.dataTransfer) {
      event.dataTransfer.setData(
        FIELD_DRAG_TYPE,
        `${fieldDrag.list}:${fieldDrag.id}`,
      );
      event.dataTransfer.effectAllowed = "move";
    }
    row.dataset[DRAG_ATTR] = "true";
  }

  function onFieldDragEnd() {
    fieldDrag = null;
    clearFieldDrop();
    const panel = document.getElementById(PREFS_ID);
    for (const row of panel?.querySelectorAll(".gt-cart-field") ?? []) {
      if (row.dataset[DRAG_ATTR]) row.dataset[DRAG_ATTR] = "";
    }
  }

  // WHICH HALF OF THE ROW THE POINTER IS IN decides before or after, which is the
  // one thing that makes a drop between two rows expressible at all: a row has two
  // gaps and a pointer has one position.
  function dropsAfter(row, event) {
    const box = row.getBoundingClientRect();
    return event.clientY > box.top + box.height / 2;
  }

  function onFieldOver(event) {
    const row = fieldRowOf(event.target);
    /* A DROP FROM ONE LIST INTO THE OTHER IS REFUSED, not silently reinterpreted.
       Returning without `preventDefault` leaves the platform's own refusal in place,
       so the cursor says no and `drop` never fires -- the refusal is VISIBLE, which
       a silent no-op would not be. Reinterpreting it as "tick this field in that
       list" was the tempting alternative and it would be a write nobody asked for. */
    if (!row || !fieldDrag || row.dataset[FIELD_LIST_ATTR] !== fieldDrag.list) return;
    event.preventDefault();
    // Or the cursor offers a COPY, which is what the platform assumes by default and
    // is a promise nothing here keeps: there is one row and it moves.
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    // Cleared and re-set on every move rather than removed on `dragleave`: the
    // pointer crosses a boundary far more often than it leaves the list, and one
    // indicator that follows it cannot get out of step with itself.
    const edge = dropsAfter(row, event) ? "after" : "before";
    clearFieldDrop(row);
    if (row.dataset[DROP_ATTR] !== edge) row.dataset[DROP_ATTR] = edge;
  }

  function onFieldDrop(event) {
    const row = fieldRowOf(event.target);
    if (!row || !fieldDrag || row.dataset[FIELD_LIST_ATTR] !== fieldDrag.list) return;
    event.preventDefault();

    const key = fieldDrag.list;
    const stored = loadPrefs()[key];
    const from = stored.findIndex((field) => field.id === fieldDrag.id);
    const onto = stored.findIndex(
      (field) => field.id === row.dataset[FIELD_ID_ATTR],
    );
    clearFieldDrop();
    // Either id gone means the catalogue changed under a drag that was already in
    // flight, which is a build having been swapped mid-gesture. Nothing to write.
    if (from < 0 || onto < 0) return;

    // `onto + 1` is the gap BELOW the row, which is what "after" means. `moveInList`
    // owns the off-by-one that removing the dragged row first creates.
    savePrefs({ [key]: moveInList(stored, from, onto + (dropsAfter(row, event) ? 1 : 0)) });
  }

  /* -- the collection's own drag (§2.9.1), added at 1.4.0.
   *
   * THE SAME MECHANISM AS THE FIELD LISTS, DELIBERATELY: HTML5 drag and drop, an id
   * rather than an index, and which half of the row the pointer is in decides which
   * gap it lands in. Where it differs from §2.14's is exactly where the two lists
   * differ, and there are three places.
   *
   * ONE. THIS LIST IS REBUILT AND THE PANEL'S IS NOT. `renderCollection` calls
   * `replaceChildren`; the ⚙ panel moves its existing rows instead. So this drag
   * cannot own nothing the way the field drag does -- a rebuild would take the row
   * out from under the pointer. `renderCollection` freezes instead, and the block
   * there names the one thing that can write while a hand is on the mouse.
   *
   * TWO. IT WRITES THE COLLECTION AND NOT A PREFERENCE, so it goes through `update`,
   * the one read-modify-write there is (§2.5). Both ends are resolved BY KEY against
   * the array that read returns, so what lands is a move of the stored list and not
   * of the list that happened to be on screen when the drag began.
   *
   * THREE. THIS LIST SCROLLS AND CAN BE LONG. The field lists are eight rows and
   * always fit; a collection can be fifty. Nothing here scrolls the list when a drag
   * reaches its edge, on purpose: the platform does that itself, and §7 step 39 is
   * where that gets measured rather than assumed. If it comes back not working, this
   * is the block that grows.
   *
   * NO KEYBOARD PATH, which is §6 item 4 and not an omission. This is the fourth
   * pointer-only drag in the drawer, and the limit says all four move together.
   */
  let itemDrag = null;

  function itemRowOf(target) {
    return target instanceof Element ? target.closest(".gt-cart-item") : null;
  }

  function clearItemDrop(except) {
    const list = document.getElementById(ITEM_LIST_ID);
    if (!list) return;
    // Read before writing, and leave the row that is about to be marked alone. Both
    // guards are the field rows' and they matter more here: `dragover` fires tens of
    // times a second, and this list can be fifty rows rather than eight.
    for (const row of list.querySelectorAll(".gt-cart-item")) {
      if (row !== except && row.dataset[DROP_ATTR]) row.dataset[DROP_ATTR] = "";
    }
  }

  function onItemDragStart(event) {
    const row = itemRowOf(event.target);
    if (!row) return;
    // THE KEY, NEVER THE INDEX. The index is in fact stable here -- nothing can add
    // or remove an item while a mouse button is held down -- but the key costs the
    // same and it is what the drop resolves against, so there is no second thing to
    // keep in step. See the correction in §2.14's own block: the cross-tab race that
    // one gives as its reason cannot happen either.
    itemDrag = { key: row.dataset[ITEM_KEY_ATTR] };
    if (event.dataTransfer) {
      // Ours, and inert everywhere else. `onItemOver` reads the variable rather than
      // this, because `getData` is unreadable during `dragover`.
      event.dataTransfer.setData(ITEM_DRAG_TYPE, itemDrag.key);
      writeDragPayload(event.dataTransfer, itemDrag.key);
      // NOT "move". An external target that means to COPY will refuse a move-only
      // drag, and taking the row out of the collection is never what a drop into
      // Notepad meant. Our own `dragover` still sets `dropEffect = "move"`, so
      // inside this list the gesture and its cursor are unchanged -- what
      // `copyMove` adds is that the cursor tells the truth on the way out (§2.9.1).
      event.dataTransfer.effectAllowed = "copyMove";
    }
    row.dataset[DRAG_ATTR] = "true";
  }

  /* THE ROW IS ALSO A LINK ON THE WAY OUT (§2.9.1, and it is the user's correction to
     the first draft of it). `setData` takes one payload PER TYPE, so the same drag
     that reorders inside the drawer can hand an external application something worth
     dropping -- which is what the key link's own native drag did before the whole row
     became draggable, and what taking it away would have cost for no reason.

     THE BYTES ARE THE `🔗` BUTTON'S, from the same call. One issue leaving the Cart
     has ONE shape wherever it leaves from, and that shape is the `Issue reference`
     setting rather than a literal in here -- the exact defect §4 rejected when it
     refused "a fixed shape for the copy button". The five paste rules of §2.14 cover
     these bytes already, because they are the same bytes.

     THE SOURCE IS THE STORE, not the row on screen. The row's summary is drawn from
     the same place, but the store is what a copy reads and a drag out is a copy.

     `text/uri-list` IS THE ONE WITH A COST, and the user took it with the cost named:
     it makes this a real link drag, which is the widest set of targets -- and it
     means a drop onto the Jira page itself can make the browser navigate the tab to
     that issue, losing the page the live list is mirroring. That hazard existed
     before 1.4.0 through the anchor; what is new is that the whole row is the target
     now, so a mis-drop is easier to make. §7 step 39 is where it gets looked at. */
  function writeDragPayload(dataTransfer, key) {
    const item = activeCollection(load()).items.find((one) => one.key === key);
    if (!item) return;
    const entry = EXPORTS.find((one) => one.single);
    // An absent summary is not an empty one: each shape drops its separator with the
    // value, so a bare key is a correct line (§2.8). This is `copyOneIssue`'s own
    // shape of call, and the only difference is where the item comes from.
    const payload = format(entry?.kind, [{ key, ...(item.summary ? { summary: item.summary } : {}) }], "item");
    if (!payload) return;
    dataTransfer.setData("text/plain", payload.text);
    if (payload.html) dataTransfer.setData("text/html", payload.html);
    dataTransfer.setData("text/uri-list", issueUrl(key));
  }

  function onItemDragEnd() {
    itemDrag = null;
    clearItemDrop();
    const list = document.getElementById(ITEM_LIST_ID);
    for (const row of list?.querySelectorAll(".gt-cart-item") ?? []) {
      if (row.dataset[DRAG_ATTR]) row.dataset[DRAG_ATTR] = "";
    }
    // THE FREEZE IS LIFTED HERE, so this render is not decoration. `update` schedules
    // its own after a drop, but a drag that ends WITHOUT one -- Escape, or a release
    // off the edge of the list -- writes nothing, and the list would stay frozen
    // until something else happened to change.
    scheduleRender();
  }

  function onItemOver(event) {
    const row = itemRowOf(event.target);
    /* Returning without `preventDefault` leaves the platform's own refusal standing,
       so the cursor says no and `drop` never fires. That is what refuses everything
       this list is not for -- an issue link dragged in off the page, a file, a field
       row. Adding by drop is §6 item 6 and is not this feature. */
    if (!row || !itemDrag) return;
    event.preventDefault();
    // Or the cursor offers a COPY, which is what the platform assumes by default and
    // is a promise nothing here keeps: there is one row and it moves.
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const edge = dropsAfter(row, event) ? "after" : "before";
    clearItemDrop(row);
    if (row.dataset[DROP_ATTR] !== edge) row.dataset[DROP_ATTR] = edge;
  }

  function onItemDrop(event) {
    const row = itemRowOf(event.target);
    if (!row || !itemDrag) return;
    // Or the browser follows the link it believes it is dropping, and navigates the
    // tab away from Jira.
    event.preventDefault();

    const moved = itemDrag.key;
    const onto = row.dataset[ITEM_KEY_ATTR];
    const after = dropsAfter(row, event);
    clearItemDrop();

    const written = update((blob) => {
      const collection = blob.collections[0];
      const from = collection.items.findIndex((item) => item.key === moved);
      const at = collection.items.findIndex((item) => item.key === onto);
      // Neither key can be gone: removing an item takes a click, and a hand that is
      // holding this row is not clicking anything. The guard is here because
      // `findIndex` answers -1, and a -1 that reached a splice would move the wrong
      // row -- the same shape of "a move nobody asked for" that `moveInList` refuses
      // a non-integer for.
      if (from < 0 || at < 0) return;
      // `at + 1` is the gap BELOW the row, which is what "after" means; below the
      // last row that is `items.length`, the append. `moveInList` owns the off-by-one
      // that removing the dragged row first creates.
      collection.items = moveInList(collection.items, from, at + (after ? 1 : 0));
    });
    if (written) logger.debug(`moved ${moved} ${after ? "after" : "before"} ${onto}`);
  }

  /* -- the two POINTER drags: the grip and the divider. There are four drags in the
   * drawer since 1.4.0 and only these two are built this way; the field lists' and
   * the collection's are HTML5 drag and drop, above.
   *
   * A pointer drag WRITES THE VALUE DIRECTLY and holds it in a variable that
   * outranks the stored one, because `render` can fire in the middle of a drag --
   * on a mount burst, on a backstop tick, on another tab's write. `render` then
   * puts the stored value back after the rebuild. AN IDEMPOTENT RENDER MUST NOT
   * RESET A PROPERTY SOMETHING ELSE OWNS: clearing the inline size on every render
   * is exactly what erased the drag when the browser's own `resize: both` was
   * tried (§2.10, §2.11 defect 4).
   *
   * `resize: both` also took two more bugs down with it. The UA handle is ALWAYS
   * at the bottom-right, which on the default dock is the PINNED corner, so the
   * box grew away from the pointer -- the corner that can move is the one you
   * drag. And a `pointerdown` guard on it could never fire, because grabbing the
   * UA handle is an overflow-control interaction, like dragging a scrollbar, which
   * Blink handles without dispatching a pointer event. Our grip is an ordinary
   * element, so its events are ordinary. */

  function trackDrag(node, event, kind, onMove, onDone) {
    dragging = kind;
    // Pointer capture, so the drag survives the pointer leaving the 14px grip and
    // crossing anything Jira has drawn.
    node.setPointerCapture?.(event.pointerId);
    const move = (moveEvent) => guard(() => onMove(moveEvent));
    const finish = () =>
      guard(() => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", finish);
        node.removeEventListener("pointercancel", finish);
        dragging = null;
        onDone();
      });
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", finish);
    node.addEventListener("pointercancel", finish);
    event.preventDefault();
  }

  function onGripDown(event) {
    const drawer = document.getElementById(DRAWER_ID);
    const grip = document.getElementById(GRIP_ID);
    if (!drawer || !grip) return;

    const rect = drawer.getBoundingClientRect();
    // WHICH WAY THE POINTER MUST MOVE IS DERIVED FROM THE ANCHORED CORNER, not
    // hard-coded: a right-anchored drawer grows as the pointer goes left (§2.11).
    const toTheLeft = loadPrefs().corner === "bottom-left";
    const start = { x: event.clientX, y: event.clientY };
    const from = { inline: rect.width, block: rect.height };
    // Null until the pointer actually moves, so a stray CLICK on the grip does not
    // pin the current size -- which would silently lift the height cap and make a
    // later double-click the only way back.
    let size = null;

    trackDrag(
      grip,
      event,
      "size",
      (moveEvent) => {
        const dx = toTheLeft
          ? moveEvent.clientX - start.x
          : start.x - moveEvent.clientX;
        // Both docks are BOTTOM docks, so the free corner is always a top corner
        // and up is always bigger.
        const dy = start.y - moveEvent.clientY;
        size = {
          inline: Math.round(
            clamp(from.inline + dx, MIN_INLINE, window.innerWidth - 16),
          ),
          block: Math.round(
            clamp(from.block + dy, MIN_BLOCK, window.innerHeight - 16),
          ),
        };
        applySize(drawer, size);
      },
      () => {
        if (size) savePrefs({ size });
      },
    );
  }

  function applySize(drawer, size) {
    drawer.style.inlineSize = `${size.inline}px`;
    drawer.style.blockSize = `${size.block}px`;
    // A DRAGGED SIZE LIFTS THE DEFAULT HEIGHT CAP. Keeping the cap as a limit made
    // the grip look broken in one direction (§2.11 defect 4).
    drawer.style.maxBlockSize = "none";
  }

  // Double-clicking the grip HANDS THE SIZE BACK (§2.9).
  function resetSize() {
    savePrefs({ size: null });
  }

  // Which axis the divider moves in is read off the RESOLVED layout rather than
  // recomputed here: `flex-direction` is the answer the browser already gave,
  // including the container query that decides `auto`. Deriving it means no second
  // value that could disagree with the one CSS used (principle 1, §2.9).
  function dividerAxis() {
    const body = document.getElementById(BODY_ID);
    if (!body) return "stacked";
    return getComputedStyle(body).flexDirection.startsWith("row")
      ? "split"
      : "stacked";
  }

  function onDividerDown(event) {
    const drawer = document.getElementById(DRAWER_ID);
    const body = document.getElementById(BODY_ID);
    const divider = document.getElementById(DIVIDER_ID);
    if (!drawer || !body || !divider) return;

    const axis = dividerAxis();
    let percent = null;

    trackDrag(
      divider,
      event,
      "divider",
      (moveEvent) => {
        const rect = body.getBoundingClientRect();
        const fraction =
          axis === "split"
            ? (moveEvent.clientX - rect.left) / rect.width
            : (moveEvent.clientY - rect.top) / rect.height;
        percent = Math.round(clamp(fraction * 100, BASIS_MIN, BASIS_MAX));
        drawer.style.setProperty(`--gt-cart-basis-${axis}`, `${percent}%`);
      },
      () => {
        if (percent === null) return;
        // Remembered PER LAYOUT (§2.9), so pinning the sections side by side does
        // not inherit a fraction that was chosen while they were stacked.
        savePrefs(
          axis === "split"
            ? { basisSplit: percent }
            : { basisStacked: percent },
        );
      },
    );
  }

  function resetDivider() {
    savePrefs(
      dividerAxis() === "split" ? { basisSplit: null } : { basisStacked: null },
    );
  }

  /**
   * The two failure states of §2.9 have words, and THE DRAWER IS WHERE THE
   * SENTENCE LIVES. The badge carries only the ⚠️. Version 0.1.1 put both
   * sentences into the badge's label and tooltip because there was no drawer to
   * hold them.
   *
   * Pure, so a harness can check the wording against the ADR.
   */
  function alertLine(state, failedWrite) {
    if (state.status === "unreadable") {
      return "The stored collections could not be read, so the Cart started empty. The stored value was NOT overwritten: recover it from Tampermonkey's storage view for this script.";
    }
    if (state.status === "future") {
      return `These collections were written by a newer version of the Cart (v${state.version}), so nothing can be added, removed or renamed. They are shown read-only: writing them back would silently drop what this version does not understand.`;
    }
    if (failedWrite) {
      return "This site's browser storage is full, so nothing new can be saved. Copy this collection out, then remove some items.";
    }
    return "";
  }

  function renderDrawer(state, scan) {
    const drawer = ensureDrawer();
    if (!drawer) return;

    // The size is put back from storage on every render, EXCEPT while a drag owns
    // it (§2.10).
    const prefs = loadPrefs();
    if (dragging !== "size") {
      if (prefs.size) {
        applySize(drawer, prefs.size);
      } else {
        // Handed back: the stylesheet's own default size applies again, cap and all.
        drawer.style.inlineSize = "";
        drawer.style.blockSize = "";
        drawer.style.maxBlockSize = "";
      }
    }
    if (dragging !== "divider") {
      setBasis(drawer, "stacked", prefs.basisStacked);
      setBasis(drawer, "split", prefs.basisSplit);
    }

    // Whether it is visible is one CSS rule keyed off one attribute on <html>, the
    // same lever the badge's corner uses: right on the first paint, and nothing a
    // React remount can take away (§2.9, §2.11). Since 0.5.0 that attribute is
    // written from a stored preference, so the drawer is open on the FIRST paint of
    // a reload rather than opening a moment later.
    if (!prefs.open) return;

    const alert = document.getElementById(ALERT_ID);
    if (alert) {
      const line = alertLine(state, writeFailed);
      alert.textContent = line;
      alert.hidden = line === "";
    }

    renderSettings(prefs);
    renderLiveList(state, scan);
    renderCollection(state);
    renderChips(state);
    renderFoot(state);
  }

  /**
   * ⚙ IS A MODE OVER THE DRAWER'S BODY, NOT A THIRD SECTION (§2.9, decision 17).
   *
   * ONE BOOLEAN MOVES EVERYTHING, which is the whole reason the button's state
   * cannot disagree with what is on screen. And it costs one `hidden` rather than
   * three, because the foot is a child of the collection section and the sections
   * are children of the body: hiding the body takes the two standing sections and
   * all six foot buttons with it. The foot going too is deliberate -- six buttons
   * and a border is about 40px, a fifth of the drawer at `MIN_BLOCK`, and none of
   * them can act on anything while the panel is up. The accepted cost is one press
   * to get back.
   *
   * WHAT IS STILL RUNNING BEHIND IT: collecting from the page. `renderRail` reads
   * the hovered anchor and the active collection and nothing about the drawer's
   * body, so the floating `+`, the badge count, the right-click entry and the page
   * decoration all keep working while ⚙ is up (decision 25). An add re-renders the
   * drawer, and because this function only SETS -- it never rebuilds the panel --
   * the add lands without closing the panel or moving the tab.
   *
   * `prefsOpen` STAYS IN MEMORY, and that is deliberate against §2.9's precedent
   * for the drawer's own `open`, which use moved into storage. A reload landing you
   * in Settings would be wrong, because Settings is not where you work. Do not
   * "fix" the inconsistency.
   */
  function renderSettings(prefs) {
    // THE HEAD NAMES THE SCREEN YOU ARE ON. The repo's convention is that the label
    // IS the state (§2.14, §3), and it won over the argument that a head is an
    // identity -- `jira-ux`'s toolbar does not rename itself when its padlock is on.
    // The stated cost: while the panel is up the drawer stops naming the collection
    // you are collecting into. THE BADGE STILL DOES, which is what makes it
    // acceptable (decision 24, 2026-08-24).
    const title = document.getElementById(TITLE_ID);
    if (title) title.textContent = prefsOpen ? "⚙ Settings" : "🛒 Cart";

    /* THE BUTTON SAYS WHETHER THE SETTINGS ARE OPEN, and it says it HERE -- on the
       line above the one that hides the body, so the two cannot drift apart. Added
       on 2026-08-25 from a use report, and the report is worth keeping because the
       diagnosis is not what it looks like: the ⚙ appeared to be "bordered in blue
       after clicking", which read as a state and was not one. It was the FOCUS ring,
       which is why it appeared whether the click had opened the settings or closed
       them, and why clicking anywhere else took it away. The button carried no state
       at all -- `prefsOpen` lived in memory and nothing on screen was a function of
       it.
       So the fix is not to the ring. It is that the state now exists on the button,
       and the stylesheet paints it with the same pair the active collection chip
       uses (see the sheet). A label being a function of state is §2.8's rule; this
       is the same rule applied to an attribute -- and to the tooltip below it. */
    const prefsButton = document.getElementById(PREFS_BUTTON_ID);
    if (prefsButton) {
      prefsButton.setAttribute(PREFS_STATE_ATTR, String(prefsOpen));
      prefsButton.title = prefsOpen
        ? "Settings. Press again to go back to the collection"
        : "Settings";
    }

    const panel = document.getElementById(PREFS_ID);
    if (panel) panel.hidden = !prefsOpen;
    const body = document.getElementById(BODY_ID);
    if (body) body.hidden = prefsOpen;

    // Set, not rebuilt: a rebuild would take the focus off the control being used,
    // and these three are the controls most likely to be mid-interaction.
    const copyBox = document.getElementById(PREF_COPY_ID);
    if (copyBox) copyBox.checked = prefs.copyButton;
    const rightClick = document.getElementById(PREF_RIGHT_CLICK_ID);
    if (rightClick) rightClick.checked = prefs.rightClickMenu;
    const layout = document.getElementById(PREF_LAYOUT_ID);
    if (layout) layout.value = prefs.layout;
    const corner = document.getElementById(PREF_CORNER_ID);
    if (corner) corner.value = prefs.corner;
    // Read back out of storage like the rest, so `Restore export defaults` and
    // another tab's write both land on this control without either of them having
    // to know it is here.
    const shape = document.getElementById(PREF_SHAPE_ID);
    if (shape) shape.value = prefs.lineShape;

    // WHICH TAB, READ BACK OUT OF STORAGE on every render, so nothing holds a copy
    // that could disagree with it -- the same treatment `corner` and `layout` get.
    // `normalisePrefs` has already turned an id this build does not know into the
    // first tab, so the panel can never be blank (decision 20).
    const current = prefs.settingsTab;
    for (const tab of SETTINGS_TABS) {
      const button = document.getElementById(tabButtonId(tab.id));
      if (button) button.setAttribute("aria-selected", String(tab.id === current));
      const tabPanel = document.getElementById(tabPanelId(tab.id));
      if (tabPanel) tabPanel.hidden = tab.id !== current;
    }

    // Both lists on every render, and NOT only the tab on screen. A hidden tab is
    // still built, so leaving it stale would mean the moment you switched to it you
    // would be looking at whatever the last render of it said -- and the switch
    // itself renders, so it would be right again by the time you looked. A state
    // that is only ever wrong while nobody can see it is still a second value.
    for (const tab of SETTINGS_TABS) {
      if (tab.bands) renderBands(tab, prefs);
      if (tab.fields) renderFieldList(tab, prefs);
    }

    const restore = document.getElementById(RESTORE_ID);
    if (restore) {
      // ON THE TABS THAT HOLD EXPORT SETTINGS AND NOWHERE ELSE. On the appearance
      // tab it is an offer to reset something you are not looking at (decision 22).
      restore.hidden = !SETTINGS_TABS.find((tab) => tab.id === current)?.exports;
      // The label IS the state, disarmed an offer and armed the question, exactly
      // as ⌫ becomes `Empty 3?` (§3). Derived here, so the armed state cannot
      // outlive a render that should have cleared it.
      const armedNow = armed === "restore";
      restore.textContent = armedNow ? "Restore?" : "↺ Restore export defaults";
      restore.dataset.gtArmed = String(armedNow);
      restore.title = armedNow
        ? "Click again to put the line shape, both field lists and both bands back to what 1.1.0 emitted. There is no undo."
        : "Put the line shape, both field lists and both bands back to what 1.1.0 emitted. The appearance switches and the tab you are on are left alone.";
    }
  }

  /* ONE TAB'S BANDS, SET RATHER THAN REBUILT, and both things written here are a
     function of storage: each dropdown's value, and whether the pair costs `lines
     equals items`.

     READ BACK OUT OF STORAGE ON EVERY RENDER, so `Restore export defaults` and
     another tab's write both land on these controls without either of them having
     to know they exist -- the same treatment `corner`, `layout` and the line shape
     get. `normalisePrefs` has already turned an id this build does not know into the
     default, so a dropdown can never be left showing nothing.

     THE NOTE IS DERIVED AND NEVER REMEMBERED. A flag set when the dropdown changed
     would be a second value that has to agree with the preference, and it would
     disagree the moment another tab changed the band (principle 1). */
  function renderBands(tab, prefs) {
    /* WHICH FIELDS ARE ALREADY SPOKEN FOR, AND ONLY BY A BAND ABOVE THIS ONE. The two
       bands may not name the same field (§2.15, reversed from use on 2026-08-25), and
       this is one half of that rule; `bandPatch` is the other.

       THE DIRECTION IS THE WHOLE DESIGN, so it is worth spelling out. A band greys
       out what the bands ABOVE it hold and never what the bands below it hold -- so
       `Then by` cannot be set to `Group by`'s field, while `Group by` still offers
       all seven. That asymmetry is what leaves the SWAP reachable: moving `Group by`
       onto the field `Then by` holds is how a report is reordered, and it takes one
       press. Greying it in both directions would have cost three, through an
       intermediate state, which is the version that was tried on paper and dropped.
       It is also the same rule the labels already carry: position is the meaning, the
       first band is the one that must be a field, and a later band is the one that
       gives way.

       DISABLED AND NOT REMOVED, for two reasons. The panel is built once and never
       rebuilt, so an option list that grew and shrank on every render would be the
       one thing on this screen that IS replaced -- and a greyed row that still reads
       `Team` says WHY it cannot be chosen, where a row that quietly vanished would
       leave somebody hunting for a field the dropdown had a moment ago.

       AND IT IS A VETO WHERE THE FIELD LIST'S MARK IS ONLY A STATEMENT (decision 8),
       which is not an inconsistency. That mark refuses to veto because §2.14 rule 4
       gives a banded field a real use on the row: somebody who drags a line out of
       its band in the pasted mail still wants the value readable. A duplicate BAND
       has no such reading -- every sub-heading would repeat the heading above it --
       so there is nothing to leave open. */
    const claimed = tab.bands.map((key) => prefs[key]);

    tab.bands.forEach((key, at) => {
      const node = document.getElementById(bandSelectId(key));
      if (!node) return;
      const above = claimed.slice(0, at);
      for (const option of node.children) {
        // `none` is never claimed: it is not a field, and it is the answer to "and
        // then?" rather than a field's name -- though only band 2 is offered it.
        option.disabled =
          option.value !== NO_BAND && above.includes(option.value);
      }
      // AFTER the disabling and not before. The value this control is SUPPOSED to
      // show can never be one of the claimed ones -- `normalisePrefs` collapses a
      // duplicate to `None` on the way out of storage -- and setting it last means a
      // browser that declines to select a disabled option cannot leave the control
      // showing whatever sat above it.
      node.value = prefs[key];
    });

    const note = document.getElementById(bandNoteId(tab.id));
    if (!note) return;
    // Which of the bands is multi-valued is asked of `BANDS` rather than compared
    // against a literal `"fixv"`, so a second multi-valued band would light this
    // note up without a line changing here.
    const multi = tab.bands
      .map((key) => bandFor(prefs[key]))
      .filter((band) => band?.multi);
    note.textContent = multi.length
      ? `An issue with two ${multi[0].label.toLowerCase()}s is listed under both, so this report has more lines than issues.`
      : "";
  }

  /* ONE FIELD LIST, SET RATHER THAN REBUILT. Three things are written here and each
     is a function of storage: the order of the rows, each box's tick, and whether the
     field is also one of 📊 Report's headings.

     THE ORDER IS COMPARED AGAINST WHAT IS ON SCREEN AND NOT AGAINST A REMEMBERED
     SIGNATURE. The live list and the chips keep a signature because they compare
     CONTENT that would cost something to rebuild; here the comparison is eight ids
     long, and deriving it means there is no variable to reset when `ensureDrawer`
     builds a fresh drawer -- which is the bug a remembered signature would have,
     silently, in the one case where the rows are back in catalogue order and the
     signature says they are not (principle 1).

     `replaceChildren` MOVES THE ROWS AND DESTROYS NONE OF THEM, which is what keeps
     the panel's build-once rule true: a rebuilt row would take the focus off the box
     you are clicking and would pull the floor out from under a drag in flight. */
  function renderFieldList(tab, prefs) {
    const wrap = document.getElementById(fieldListId(tab.id));
    if (!wrap) return;
    const list = prefs[tab.fields];
    const rows = new Map(
      [...wrap.children].map((row) => [row.dataset[FIELD_ID_ATTR], row]),
    );

    const order = list.map((field) => field.id).join(",");
    const onScreen = [...wrap.children]
      .map((row) => row.dataset[FIELD_ID_ATTR])
      .join(",");
    if (order !== onScreen) {
      wrap.replaceChildren(
        ...list.map((field) => rows.get(field.id)).filter(Boolean),
      );
    }

    /* WHICH FIELDS ARE ALSO HEADINGS. The tab names the preferences rather than the
       renderer naming the tab, so there is no `"report"` literal here to disagree
       with `SETTINGS_TABS`. The mark is a STATEMENT AND NOT A VETO -- a ticked field
       is printed band or not (decision 8) -- and it is read off the stored bands, so
       ticket 05 making them settable moves this with it and costs nothing here. */
    const heading = new Set(
      (tab.bands ?? [])
        .map((key) => prefs[key])
        .filter((band) => band && band !== NO_BAND)
        .map((band) => BAND_ROW_FIELD[band] ?? band),
    );

    for (const field of list) {
      const row = rows.get(field.id);
      if (!row) continue;
      const box = row.querySelector("input");
      if (box) box.checked = field.on;
      const note = row.querySelector(".gt-cart-field-note");
      if (note) note.textContent = heading.has(field.id) ? "also a heading" : "";
    }
  }

  function setBasis(drawer, which, value) {
    const property = `--gt-cart-basis-${which}`;
    if (value === null) drawer.style.removeProperty(property);
    else drawer.style.setProperty(property, `${value}%`);
  }

  /**
   * The live list is a STRICT MIRROR of the page. Rows enter it when they mount and
   * leave it when they unmount, and NOTHING IS REMEMBERED, so no buffer can
   * disagree with the page. The design holds together on one sentence: THE
   * COLLECTION IS THE ACCUMULATOR, SO THE LIVE LIST DOES NOT HAVE TO BE (§2.3).
   *
   * The label states the scope: `On this page (n)`. It does not borrow Jira's own
   * `(7 of 27 work items visible)` -- that text is already on screen a few
   * centimetres away, the witness exists on two views out of seven, and reading it
   * means a regex over a localised string with no testid behind it, whose failure
   * mode is A WRONG NUMBER IN THE UI. A wrong number is worse than no number
   * (§2.3).
   */
  function renderLiveList(state, scan) {
    const heading = document.getElementById(LIVE_HEAD_ID);
    const list = document.getElementById(LIVE_LIST_ID);
    if (!heading || !list) return;

    heading.textContent = `On this page (${scan.live.size})`;

    const collection = activeCollection(state);
    const collected = new Set(collection.items.map((item) => item.key));

    // One row per key for the whole document, in the scan's insertion-ordered Map,
    // SO PAGE ORDER SURVIVES (§2.3).
    const rows = [];
    for (const [key, seen] of scan.live) {
      rows.push({
        key,
        // Read from the representative anchor, which is the WIDEST one: on the
        // backlog that is the visible key rather than the screen-reader twin, which
        // selects the right element without naming `…screen-reader-key` and so
        // without adding a testid to the list of things that can rot (§2.3, §2.7).
        summary: readSummary(seen.anchor, key).summary,
        origin: originOf(seen.anchor),
        collected: collected.has(key),
      });
    }

    const signature = JSON.stringify([rows, collection.name]);
    if (signature === liveSignature) return;
    liveSignature = signature;

    // Our own scroller, put back by hand. NOT `scrollIntoView`, which scrolls EVERY
    // scrollable ancestor and once slid a heading out of sight -- and `overflow:
    // hidden` is still programmatically scrollable, which is why the drawer's
    // containers are `overflow: clip` (§2.11).
    const top = list.scrollTop;
    list.replaceChildren();

    if (!rows.length) {
      list.append(
        el(
          "p",
          "gt-cart-empty",
          "No issue links are drawn on this page right now.",
        ),
      );
      return;
    }

    for (const row of rows) {
      list.append(liveRow(row, collection.name));
    }
    list.scrollTop = top;
  }

  /**
   * THE KEY IS A REAL LINK, in both sections. Added on 2026-08-18, at the user's
   * request: click opens the issue, and middle-click or Ctrl-click opens it in a
   * new tab -- the two gestures every other link on the page already answers, and
   * neither of them is something a script should reimplement.
   *
   * It is a SIBLING of any button beside it and never a child: an anchor inside a
   * button is invalid HTML and the parser hoists it out, which is the same trap
   * the collection chips hit.
   *
   * `setAttribute` rather than the property, so the value is in the attribute the
   * rest of this script reads with `getAttribute` -- and so that our own links look
   * exactly like Jira's to anything that inspects them.
   */
  function keyLink(key) {
    const link = el("a", "gt-cart-row-key", key);
    link.setAttribute("href", issueUrl(key));
    link.title = `Open ${key}. Middle-click or Ctrl-click for a new tab.`;
    return link;
  }

  function liveRow(row, collectionName) {
    // A DIV now, with the link and the toggle as siblings inside it. The row was a
    // single button until the key became a link.
    const node = el("div", "gt-cart-row");
    node.dataset.gtCollected = String(row.collected);
    // THE FULL SUMMARY IS IN THE TOOLTIP: a 380px drawer cannot show a Jira title,
    // so the row ellipsises and the hover carries the rest -- `KEY — summary` on
    // one line, and what the click will do on the next (§2.9).
    node.title = summaryTooltip(row.key, row.summary, [
      row.collected
        ? `Click the row to remove it from ${collectionName}`
        : `Click the row to add it to ${collectionName}`,
    ]);
    node.append(keyLink(row.key));

    // EVERYTHING EXCEPT THE KEY IS THE TOGGLE. §2.9 made the whole row the control
    // because the live list is the only add path for anyone who cannot hover, and
    // that reason is unchanged: the target is still most of the row rather than a
    // small `+` inside it. The key is the one part that now does something else,
    // and it says so by being a link.
    const body = actionButton("gt-cart-row-body", "toggle-item");
    body.dataset.gtKey = row.key;
    body.append(el("span", "gt-cart-row-summary", row.summary));
    if (row.origin) body.append(el("span", "gt-cart-row-origin", row.origin));
    // The mark is drawn by CSS from `data-gt-collected` and `:hover`, so the
    // pre-click warning costs no JavaScript and cannot lag behind the pointer. A
    // typed `+` is right here, unlike the floating button's: this one sits on a
    // text line rather than centred in a 24px circle (§2.7).
    body.append(el("span", "gt-cart-row-mark"));
    node.append(body);
    return node;
  }

  // Jira's summary field is MANDATORY, so an item with no summary never means "this
  // issue has no title". It always means the Cart did not capture one, and the UI
  // must not suggest otherwise (§2.2).
  function summaryTooltip(key, summary, lines) {
    const head = summary ? `${key} — ${summary}` : key;
    const note = summary ? [] : ["The Cart captured no summary for this key yet."];
    return [head, ...note, ...lines].join("\n");
  }

  function renderCollection(state) {
    const collection = activeCollection(state);
    const editing = renaming === collection.id;

    const name = document.getElementById(NAME_ID);
    const rename = document.getElementById(RENAME_ID);
    if (name && rename) {
      name.hidden = editing;
      rename.hidden = !editing;
      // The name is written only while the field is closed. While it is open the
      // value belongs to the keyboard (§2.10).
      if (!editing) name.textContent = collection.name;
    }

    const count = document.getElementById(COUNT_ID);
    if (count) count.textContent = String(collection.items.length);

    const empty = document.getElementById(EMPTY_ID);
    if (empty) {
      const count = collection.items.length;
      // The label IS the state, which is the convention this repository uses
      // everywhere: disarmed it is an icon, armed it is the question (§3).
      const armedNow = armed === "empty";
      empty.textContent = armedNow ? `Empty ${count}?` : "⌫";
      empty.dataset.gtArmed = String(armedNow);
      empty.disabled = !state.writable || count === 0;
      empty.title = armedNow
        ? `Click again to remove all ${count} item${count === 1 ? "" : "s"}. There is no undo.`
        : `Remove every item from ${collection.name}. The collection and its name stay.`;
    }

    const refresh = document.getElementById(REFRESH_ID);
    if (refresh) {
      refresh.disabled =
        refreshing ||
        fetchingDetails ||
        !state.writable ||
        collection.items.length === 0;
      refresh.title = refreshing
        ? "Asking Jira for every summary in this collection…"
        : "Refresh every summary in this collection from Jira. It can replace a summary and never deletes one.";
    }

    const list = document.getElementById(ITEM_LIST_ID);
    if (!list) return;

    /* THE FREEZE, ADDED AT 1.4.0 WITH THE REORDER (§2.9.1). While a row is being
       dragged this list is left exactly as it stands, and `itemSignature` is
       deliberately NOT updated -- so the render that follows `dragend` rebuilds from
       whatever storage holds by then, and nothing is lost, only deferred.

       WHAT IT PROTECTS AGAINST IS GAP-FILL, and naming it matters because the
       obvious answer is wrong. It is NOT another tab: a person has one pair of
       hands, and they cannot click in another tab while holding a mouse button down
       in this one, so nothing a HAND does anywhere can land mid-drag. `runGapFill`
       needs no hand. It is a timer and a fetch, it writes a summary or marks a key
       unreadable, and either changes the signature below -- which would call
       `replaceChildren` and destroy the row the pointer is holding.

       It buys a second thing for free. A `dragend` fired on a node that has already
       been detached does not reach this list's delegated listener, so `itemDrag`
       would never be cleared and every later drag would start stale. With the source
       row still in the tree, that cannot happen. */
    if (itemDrag) return;

    // Collection rows are in ARRAY ORDER. That was insertion order until 1.4.0 and
    // it is now insertion order UNTIL SOMETHING IS MOVED, because the reorder writes
    // this array. WHAT IT HAS ALWAYS BEEN IS THE ORDER A COPY EMITS, and that is the
    // half that must not move: newest-first would read better in the drawer and
    // would disagree with the paste, which is a worse thing to be (§2.9).
    const rows = collection.items.map((item) => ({
      key: item.key,
      summary: item.summary ?? "",
      failed: unreadable.has(item.key),
    }));

    // `writable` is in the signature because it is in the ROWS: a store that cannot
    // be written draws rows that cannot be dragged, and nothing else in this list
    // would change to trigger the rebuild that puts that right.
    const signature = JSON.stringify([rows, collection.name, state.writable]);
    if (signature === itemSignature) return;
    itemSignature = signature;

    const top = list.scrollTop;
    list.replaceChildren();

    if (!rows.length) {
      list.append(
        el(
          "p",
          "gt-cart-empty",
          "Nothing collected yet. Click a row above, or the floating + beside any issue link.",
        ),
      );
      return;
    }

    for (const row of rows) {
      list.append(itemRow(row, collection.name, state.writable));
    }
    list.scrollTop = top;
  }

  function itemRow(row, collectionName, writable) {
    const node = el("div", "gt-cart-item");
    node.dataset[ITEM_KEY_ATTR] = row.key;

    /* THE WHOLE ROW IS THE DRAG (§2.9.1), and the key link is opted out of its own.
       An `<a href>` is draggable by default, so without the `draggable="false"` on
       the key below, the most obvious place to grab a row -- the key -- would start
       the browser's link drag and the reorder would look broken exactly
       where it is most likely to be tried. Opting the anchor out does not kill the
       gesture: the platform walks up to the nearest draggable ancestor, which is this
       row.

       WHAT THIS COSTS IS ONE THING AND IT WAS TWO. Selecting a summary with the
       mouse goes, to the `user-select: none` the drag needs -- without it the browser
       offers the text selection to drag instead of the row. The second cost was
       going to be the key link's native drag-out, which used to drop that issue's URL
       into Slack or an editor for free. **It is not paid**: `setData` takes one
       payload per type, so `writeDragPayload` hands the platform the `🔗` button's
       own bytes and the drag out is better than the one it replaced -- the
       `Issue reference` shape instead of a bare URL, with a rich flavour beside it.
       The user caught that; the first draft of this shipped the loss as a cost.

       A row is draggable only when the store is writable, which is the same rule the
       ⌫ and ↻ in the heading follow: a control that cannot do what it offers does
       not offer it. */
    node.setAttribute("draggable", String(writable));
    // The whole sentence is one hover away, and it MIRRORS ATLASSIAN'S OWN
    // MESSAGE, which is required: the API conflates absent and forbidden, so the
    // UI may never claim deletion (§2.6, §2.9). It is on this row and not on a
    // live-list row, because this is the row whose rebuild signature carries the
    // failed state -- a tooltip that is not in a signature goes stale.
    node.title = summaryTooltip(row.key, row.summary, [
      ...(row.failed
        ? [
            "Jira returned nothing for this key: it does not exist, or you do not have permission to see it.",
          ]
        : []),
      ...(writable ? ["Drag the row to reorder it"] : []),
      `✕ removes it from ${collectionName}`,
    ]);

    /* The grip is decoration -- the whole row is the target, so a name read aloud
       beside every key would be twenty repetitions of nothing -- and it is ALWAYS in
       the row, painted only on hover. That is the decision, and the reserved width is
       what it costs: a glyph that ARRIVED with the pointer would re-ellipsise the
       summary under the hand about to grab it, and reflow under a moving pointer is
       the defect §2.14 spent a day removing from the drawer's foot. So the space is
       held always and only `visibility` changes (§2.9.1). */
    const grip = el("span", "gt-cart-grip", "⠿");
    grip.setAttribute("aria-hidden", "true");
    node.append(grip);

    const key = keyLink(row.key);
    key.setAttribute("draggable", "false");
    node.append(key);
    node.append(el("span", "gt-cart-row-summary", row.summary));

    // The short form keeps a twenty-item list scannable and the honest full version
    // is one hover away. It mirrors Atlassian's own message, which is required: the
    // API conflates absent and forbidden, so the UI MAY NEVER CLAIM DELETION
    // (§2.6, §2.9).
    // Gap-fill is automatic and has NO CONTROL OF ITS OWN (§2.6), so a row says
    // nothing while a request is out: a progress hint on the row would be a state
    // §2.9 does not name. The ↻ says it for the refresh, because that one was
    // asked for.
    if (row.failed) {
      node.append(el("span", "gt-cart-item-note", "(cannot read)"));
    }

    const remove = actionButton(
      "gt-cart-x",
      "remove-item",
      `Remove ${row.key} from ${collectionName}`,
    );
    remove.dataset.gtKey = row.key;
    remove.textContent = "✕";
    node.append(remove);
    return node;
  }

  // The collection switcher is a row of chips, each carrying a name and its own
  // count (§2.9).
  function renderChips(state) {
    const chips = document.getElementById(CHIPS_ID);
    if (!chips) return;

    const rows = state.collections.map((one, at) => ({
      id: one.id,
      name: one.name,
      count: one.items.length,
      active: at === 0,
      armed: armed === one.id,
      // §2.4: `collections` is never empty, so deleting the last one empties it
      // instead of removing it. The chip says which of the two its ✕ will do.
      only: state.collections.length === 1,
    }));

    const signature = JSON.stringify(rows);
    if (signature === chipSignature) return;
    chipSignature = signature;

    chips.replaceChildren();
    for (const row of rows) {
      // The pill is a DIV holding two buttons, not a button holding a button: the
      // nested form is invalid HTML and the parser hoists the inner one out of it.
      // Two siblings also mean the delegated listener needs no `stopPropagation`
      // to tell "activate this" from "delete this" -- `closest` finds whichever
      // one was actually clicked.
      const chip = el("div", "gt-cart-chip");
      chip.dataset.gtActive = String(row.active);
      chip.dataset.gtArmed = String(row.armed);

      const main = actionButton(
        "gt-cart-chip-main",
        "activate",
        row.active
          ? `${row.name} is the active collection`
          : `Make ${row.name} the active collection`,
      );
      main.dataset.gtId = row.id;
      main.append(el("span", "gt-cart-chip-name", row.name));
      // THE COUNT IS A SEPARATE ELEMENT FROM THE NAME AND NEVER TRUNCATES. It is
      // the one thing on a chip that cannot be reconstructed from a shortened
      // label (§2.9).
      main.append(el("span", "gt-cart-chip-count", String(row.count)));

      // Deleting a collection happens where the collection is NAMED. Armed first:
      // the chip turns red and its tooltip says what the second click removes, so
      // the warning arrives before the click that cannot be undone.
      const remove = actionButton(
        "gt-cart-chip-x",
        "delete-collection",
        row.armed
          ? `Click again to delete ${row.name} and its ${row.count} item${row.count === 1 ? "" : "s"}. There is no undo.`
          : row.only
            ? `Empty ${row.name}. It is the only collection, so it cannot be removed.`
            : `Delete ${row.name}`,
      );
      remove.dataset.gtId = row.id;
      remove.textContent = "✕";

      chip.append(main, remove);
      chips.append(chip);
    }
  }

  function renderFoot(state) {
    const foot = document.getElementById(FOOT_ID);
    if (!foot) return;
    const empty = activeCollection(state).items.length === 0;

    for (const spec of EXPORTS) {
      const button = foot.querySelector(`[data-gt-format="${spec.kind}"]`);
      if (!button) continue;
      // THE LABEL IS DERIVED HERE. `flash` works only because every label is
      // rebuilt from state; one written at construction keeps the ✅ for ever
      // (§2.8).
      button.textContent = spec.label;
      button.title = spec.title;

      /* 📋 Details is the one control in the foot whose label is a LADDER rather
         than a name, and the whole ladder is derived from state here, for the same
         reason the ✅ is: a label written anywhere else would be a value that has
         to agree with `fetchingDetails` and `detailsHeld`, and could stop
         agreeing. The convention is the repo's own -- ⌫ becomes `Empty 3?` before
         it will empty anything (§3). */
      if (spec.needsDetails) {
        // Asked for THIS button's kind, so a fetch armed by the other one leaves
        // this label alone (§2.15, reversed 2026-08-21).
        const held = detailsFor(state, spec.kind);
        const count = activeCollection(state).items.length;
        // THE ICON COMES FROM THE ENTRY'S OWN LABEL, not from a literal. It was a
        // literal 📋, which meant 📊 Report showed 📋 Fetching… -- a defect that
        // arrived with the sixth export and that only a second stepped button could
        // expose. Deriving it means the next one is correct without being touched.
        const icon = spec.label.split(" ")[0];
        if (fetchingDetails === spec.kind) {
          button.textContent = `${icon} ${STEP_LABELS.busy}`;
          button.title = "Asking Jira about every issue in this collection…";
        } else if (held) {
          button.textContent = `${icon} ${STEP_LABELS.ready}`;
          // The count leaves the LABEL, whose width is fixed, and lands in the
          // sentence, which has no width to keep.
          button.title = `Copy ${count} item${count === 1 ? "" : "s"}. The next press fetches again, so nothing you paste is older than the press before it`;
        }
        // Nothing may fetch what it cannot store: the write-back is declined on
        // the two migration rows that refuse to write, so the request would be
        // wasted (§2.4). And ↻ and 📋 each stand down while the other is out --
        // both write summaries, and one request at a time is enough.
        button.disabled =
          empty || refreshing || fetchingDetails || !state.writable;
        continue;
      }
      // Disabled and dimmed while the collection is empty, the convention
      // `jira-ux` already uses for the buttons that need a description. A copy of
      // zero items must not write at all, and `key in ()` is not valid JQL, so the
      // same rule serves both kinds of button (§2.8).
      button.disabled = empty;
    }
  }

  // ------------------------------------------------------- the right-click menu

  /* A userscript CANNOT add an entry to the browser's native right-click menu.
     Nothing can, from a page. So this feature means intercepting `contextmenu`,
     cancelling it, and drawing our own -- and on the elements it intercepts the
     user loses *Open link in new window*, *Copy link address*, *Save link as*,
     *Search with…*, and every extension's own entries. *Open link in new tab* is
     given back as a menu item so that the trade is VISIBLE, and it was not enough:
     the user asked for a switch, because they expect to be able to use the
     browser's menu whenever they want. On Chromium there is no escape hatch --
     Firefox lets Shift+right-click bypass a page's handler and Chromium does not.
     So it ships OFF (§2.7).

     One asymmetry the design owns while it is on: on the backlog, right-clicking
     the key gives our menu and right-clicking the summary two centimetres away
     gives Jira's own card menu. WIDENING THE INTERCEPTION TO THE WHOLE ROW would
     swallow Jira's card menu instead, which is a bigger loss. */
  let menuAt = null;

  function onContextMenu(event) {
    // Read from storage at event time, so a switch flipped in another tab needs
    // nothing re-wired here.
    if (!loadPrefs().rightClickMenu) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    // Our own UI keeps the browser's menu: there is nothing to add to a cart row.
    if (target.closest(UI_SELECTOR)) return;

    const anchor = target.closest(ISSUE_ANCHOR);
    if (!anchor) return;
    const key = keyFromHref(anchor.getAttribute("href"));
    if (!key) return;

    event.preventDefault();
    // And stopped, not merely cancelled. Jira's own card menu listens on the row,
    // which CONTAINS the key, so leaving the event to propagate would open both
    // menus on the one element this feature is about (§2.7).
    event.stopPropagation();
    /* `read` IS THE GROUP'S READING ANCHOR AND NOT THE ONE THAT WAS CLICKED, and
       it is resolved here rather than at the copy, for one reason: the group is a
       fact about the page at the moment of the gesture, and by the time the menu is
       clicked React may have replaced the row. One node is held rather than two --
       the key is on the object already, and `groupFor` guarantees the reading
       anchor points at that same key, so nothing else is needed to copy from it
       (§2.7). A node held across a render is the same bet the drag already makes;
       if it has been detached, `readSummary` falls through to the tiers that read
       the anchor itself. */
    menuAt = {
      x: event.clientX,
      y: event.clientY,
      key,
      href: anchor.href,
      read: groupFor(anchor, key).read,
    };
    render();
  }

  function closeMenu() {
    if (menuAt === null) return;
    menuAt = null;
    scheduleRender();
  }

  /**
   * Unlike the drawer, THIS one is light-dismissed and Escape closes it. That is
   * not an inconsistency: a menu that stays open after you click elsewhere is
   * broken in a way a companion panel is not, and every native menu behaves this
   * way (§2.9 forbids light dismiss for the DRAWER, and gives its reason as Jira's
   * own Escape bindings).
   */
  function renderMenu(state) {
    const existing = document.getElementById(MENU_ID);
    if (menuAt === null) {
      existing?.remove();
      return;
    }

    const mount = document.body;
    if (!mount) return;

    const menu = existing?.isConnected ? existing : el("div");
    menu.id = MENU_ID;
    menu.setAttribute(UI_ATTRIBUTE, "");
    menu.setAttribute("role", "menu");
    menu.replaceChildren();

    const collection = activeCollection(state);
    const collected = collection.items.some((item) => item.key === menuAt.key);

    const toggle = actionButton("gt-cart-menu-item", "menu-toggle");
    // The label is derived from storage, like every other label in this script, and
    // the click derives the direction again inside the read-modify-write (§2.7).
    toggle.textContent = collected
      ? `Remove ${menuAt.key} from ${collection.name}`
      : `Add ${menuAt.key} to ${collection.name}`;
    const open = actionButton("gt-cart-menu-item", "menu-open");
    open.textContent = "Open link in new tab";

    /* THE SECOND GIVE-BACK, added at 1.3.0. Switching this menu on costs the
       browser's own entries, and §2.7 lists them by name: *Open link in new window*,
       *Copy link address*, *Save link as*, *Search with…*. `Open link in new tab`
       has been here since the menu was built so that the trade would be visible;
       this entry gives back the other one that has an answer inside the Cart.

       It is NOT `Copy link address`, and the label does not pretend to be: it copies
       the issue in the shape ⚙ names, which on a default install is a markdown link
       rather than a bare URL. Somebody who wants Chrome's exact bytes has `URL only`
       on that dropdown.

       IN THE BROWSER'S OWN ORDER -- the Cart's action first, then the two entries
       the browser would have offered, open before copy, as Chromium lists them. */
    const copyLink = actionButton("gt-cart-menu-item", "menu-copy");
    copyLink.textContent = `Copy link to ${menuAt.key}`;
    menu.append(toggle, open, copyLink);

    if (!menu.isConnected) {
      menu.addEventListener("click", (event) =>
        guard(() => {
          const target =
            event.target instanceof Element
              ? event.target.closest("[data-gt-action]")
              : null;
          if (!target) return;
          // RETURNED, so `guard` sees the promise the copy entry hands back. It was
          // a bare call while every entry was synchronous.
          return onMenuAction(target.dataset.gtAction);
        }),
      );
      mount.append(menu);
    }

    // Placed at the pointer and kept inside the viewport. Measured after it is in
    // the document, because a menu that has not been laid out has no size.
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.round(clamp(menuAt.x, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerWidth - rect.width - EDGE_MARGIN)))}px`;
    menu.style.top = `${Math.round(clamp(menuAt.y, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerHeight - rect.height - EDGE_MARGIN)))}px`;
  }

  function onMenuAction(action) {
    const at = menuAt;
    if (!at) return;
    menuAt = null;

    if (action === "menu-open") {
      // Inside a click handler, so it carries the user activation a popup blocker
      // asks for. `noopener` because nothing here wants the other tab's `opener`.
      window.open(at.href, "_blank", "noopener");
      scheduleRender();
      return;
    }
    if (action === "menu-toggle") {
      toggleKey(at.key);
      return;
    }
    /* THE MENU CLOSES AND THE RECEIPT IS ON THE RAIL. Every entry here closes the
       menu -- §2.9 calls a menu that stays open after a click broken -- so there is
       nowhere in the menu to put a `✅`. `copyOneIssue` sets the rail's flash
       instead, and the rail is up: reaching this entry means right-clicking an issue
       link, which means the pointer is on that link, which is what summons the rail.

       THE ONE COMBINATION WITH NO RECEIPT AT ALL is this menu on and the copy button
       switched off, because then the rail has no button to flash. It is a corner of
       a preference that itself ships off, the remedy is the switch, and a failed
       write is still on the console -- so it is recorded here rather than paid for
       with a toast this script has no other use for (§2.7). */
    if (action === "menu-copy") {
      scheduleRender();
      return copyOneIssue(at.key, at.read);
    }
    scheduleRender();
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
    const prefs = loadPrefs();
    root.dataset.gtCartCorner = prefs.corner;
    root.dataset.gtCartOpen = String(prefs.open);
    // `auto`, `stacked` or `split`. `auto` is answered by a container query on the
    // drawer's own width, so this attribute only says which of the three was
    // asked for -- one preference with three states, and no layout flag that could
    // contradict the remembered size beside it (§2.9).
    root.dataset.gtCartLayout = prefs.layout;

    // Confluence Cloud shares this origin, and `@match` covers the whole site
    // because it governs injection only. Nothing of the Cart belongs on a page
    // that says it is a different Atlassian product; capture from Confluence is
    // future work and needs a DOM survey that does not exist (§6, item 8).
    if (!onJira()) {
      document.getElementById(BADGE_ID)?.remove();
      // THE RAIL, NOT THE TWO BUTTONS. Removing the box removes what is in it, and
      // naming the children here would be a list that a third button silently falls
      // off (§2.7).
      document.getElementById(RAIL_ID)?.remove();
      document.getElementById(DRAWER_ID)?.remove();
      document.getElementById(MENU_ID)?.remove();
      applyCollectedCss([]);
      return;
    }

    const state = load();
    applyCollectedCss(activeCollection(state).items.map((item) => item.key));
    renderBadge(state);
    // The preferences are handed down rather than read again: the rail needs the
    // copy button's switch, and `render` has already performed the one read.
    renderRail(state, prefs);

    // One walk, two jobs (§2.1, §2.3). The widths the live list needs are measured
    // only while the drawer is open.
    const scan = scanPage(prefs.open);
    liveAnchors = scan.live;
    checkContract(scan);
    renderDrawer(state, scan);
    renderMenu(state);

    // A STATE, NOT AN EVENT, and this is the line that evaluates it: an item with
    // no summary in an open drawer is asked about, whether the drawer opened a
    // moment ago or the item arrived a moment ago (§2.6).
    considerGapFill(state);
  }

  // ----------------------------------------------------------------- startup

  // A note for whoever edits the sheet below: it is a template literal, so one
  // backtick in a CSS comment ends it. That cost twenty minutes once (§2.11).
  //
  // Short, because it prefixes about sixty rules: an id in the selector is how the
  // sibling scripts beat Jira's own opinions about `button` without an
  // `!important` anywhere.
  const D = `aside#${DRAWER_ID}`;

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
  --gt-cart-muted: var(--ds-text-subtlest, #626f86);
  --gt-cart-hover: var(--ds-background-neutral-subtle-hovered, #091e4214);
  --gt-cart-input-bg: var(--ds-surface, #ffffff);
  --gt-cart-selected-bg: var(--ds-background-selected, #e9f2ff);
  --gt-cart-selected-text: var(--ds-text-selected, #0c66e4);
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
    --gt-cart-muted: var(--ds-text-subtlest, #9fadbc);
    --gt-cart-hover: var(--ds-background-neutral-subtle-hovered, #a6c5e21f);
    --gt-cart-input-bg: var(--ds-surface, #1d2125);
    --gt-cart-selected-bg: var(--ds-background-selected, #1c2b41);
    --gt-cart-selected-text: var(--ds-text-selected, #579dff);
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

/* THE RAIL IS THE ONLY FIXED BOX HERE SINCE 1.3.0, and the buttons inside it are
   laid out by flex. The plus was the fixed element until it acquired a neighbour;
   two independently placed fixed buttons would leave a gap between them that
   belongs to the page, and a pointerover in that gap takes the affordance away
   while the pointer is crossing from one half of its own control to the other.
   NO BACKTICKS IN THIS SHEET: it is one template literal, so a stray one ends the
   extraction and every rule after it (§2.7, and test/jira-cart/README.md). */
div#${RAIL_ID} {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: ${RAIL_GAP}px;
}
div#${RAIL_ID}[hidden] {
  display: none;
}
/* THE ONE RULE THAT KEEPS THE PLUS BESIDE THE KEY ON BOTH SIDES. positionRail puts
   the rail's right edge where the plus's right edge used to be, so on the left the
   plus -- the second child -- is already the one next to the link. When there is no
   room and the rail flips to the right of the link, the row reverses with it, so the
   second child is the near one again. The alternative was a second DOM order built
   for the flipped case, which is two orders that can disagree. */
div#${RAIL_ID}[data-gt-side="right"] {
  flex-direction: row-reverse;
}

/* Loud, not subtle. The first build was an outlined chip in the subtle palette,
   and the verdict was that it cannot be picked out. This is a solid bold fill
   with a ring in the page's own surface colour and a drop shadow, which reads
   against any Jira background in both themes (§2.7). */
button#${TOGGLE_ID} {
  /* RELATIVE, AND IT WAS FIXED UNTIL 1.3.0. The two bars that draw the plus are
     position: absolute with inset: 0, so this button HAS TO BE A CONTAINING BLOCK.
     Fixed provided one for free; a flex child provides none, so dropping the
     property without putting relative in its place would send both bars to the
     viewport's own corner and leave the button blank. That is the whole visible
     consequence, and it is why css-smoke asserts this button is positioned. */
  position: relative;
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
button#${TOGGLE_ID}:focus-visible {
  outline: 2px solid var(--gt-cart-focus);
  outline-offset: 2px;
}

/* THE COPY BUTTON IS SECONDARY ON PURPOSE, and it is the one place §2.7's "loud,
   not subtle" is deliberately not followed. That finding was about a LONE
   affordance that nothing else on the page pointed at. This button never appears
   alone: it is always flush against the bold blue circle, so the eye finds the pair
   and then reads the pair. Two equally loud circles would compete, and adding an
   issue to the Cart is what the Cart is for.

   So: the page's own surface, a hairline in the page's own border colour, and the
   same drop shadow. THE RISK IS NAMED RATHER THAN ARGUED AWAY, because it is not
   measured: §2.7 killed exactly this treatment once, for the plus, on the report
   that it could not be picked out -- and if this button turns out the same way, this
   rule is the remedy and nothing else has to change. §7 step 37 is the press.

   THE TWO RINGS NEARLY TOUCH, AND THAT IS ALLOWED. The plus carries a 2px ring and
   this button a 1px one, so 3px of the 4px gap between them is ring. That reads as
   one control with two halves, which is what the paragraph above wants; it is
   written down because it looks like an oversight and is not. Widening RAIL_GAP is
   the change if it reads as cramped.

   NO POSITION PROPERTY, because it needs no containing block: its glyph is text
   centred by flex, not two absolute bars. */
button#${COPY_ID} {
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: ${TOGGLE_SIZE}px;
  block-size: ${TOGGLE_SIZE}px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--gt-cart-surface);
  color: var(--gt-cart-text);
  box-shadow: 0 0 0 1px var(--gt-cart-border), var(--gt-cart-shadow);
  font-family: inherit;
  /* 13px and not the toggle's 14px, and the reason is which glyph has to fit. This
     button usually shows a chain link, but the two it shows at the moment that
     matters are a tick and a warning triangle, and colour emoji are typically drawn
     wider than their em box. A point smaller buys the margin. NOT MEASURED -- the
     press is §7 step 37, along with whether the button can be picked out at all. */
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}
button#${COPY_ID}[hidden] {
  display: none;
}
button#${COPY_ID}:focus-visible {
  outline: 2px solid var(--gt-cart-focus);
  outline-offset: 2px;
}
/* THE GROUND DOES NOT MOVE WHEN THE GLYPH DOES. The tick and the warning triangle
   carry their own colour, so a green ground under a green tick is mud and a yellow
   one under a yellow triangle is worse. The foot's four buttons flash by swapping
   the label and leaving the button alone; this is the same rule, and it is why there
   is no data-gt-state paint here at all. The attribute is still written, because a
   state that is on the element is a state a harness can read (§2.8). */
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
}
/* ------------------------------------------------------------------ the drawer

   Every rule below is prefixed with the drawer's own id, the way the sibling
   scripts prefix theirs: Jira's stylesheet has opinions about button, input and
   h2, and an id beats them without an !important anywhere.

   The four layout rules of §2.11 are here, each with the defect it prevents.
   Read them before changing a single flex value: none of the six defects would
   have come out of an argument, and three of them are one mistake in three
   costumes -- a box given a size by something that knew nothing about that box. */
${D} {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;

  /* RULE 1. Flex all the way down, and min-block-size: 0 everywhere. The live
     list was CUT rather than scrolled past about fifteen links, because the lists
     were capped with a viewport-relative height -- a number that knows nothing
     about the drawer it is inside -- and a grid row sizes to its content and does
     not shrink. Flex shrinks. Every box from here down to the list can now go
     below its content size, so a section heading can never be pushed out.

     THE DRAWER ITSELF IS THE ONE EXCEPTION, and its min-block-size is below with
     the other sizes. Rule 1 is about what a box may do as a FLEX ITEM of the box
     above it, and this one is not a flex item of anything: it is position: fixed.
     Its own floor is rule 7's business. */
  min-inline-size: 0;

  inline-size: 380px;
  block-size: 520px;
  /* The default height leaves the badge's corner clear (§2.9). A DRAGGED size
     lifts this cap, in JavaScript, because keeping it as a limit made the grip
     look broken in one direction (§2.11 defect 4). */
  max-block-size: 70vh;
  max-inline-size: calc(100vw - 2rem);

  /* THE FLOOR IS IN THE SHEET AND NOT ONLY IN THE DRAG. Added at 1.0.0 with rule
     7: MIN_BLOCK was enforced by the grip's clamp alone, so on a window shorter
     than about 307px the 70vh cap above went under it and the clipping rule 7
     exists to prevent came back. A min-block-size beats a max-block-size in CSS,
     which is what makes the guarantee hold at EVERY size the drawer can reach
     rather than only at the ones a drag produces.

     There is deliberately no min-inline-size to match. max-inline-size is there to
     keep the drawer inside a narrow viewport, and a width floor fighting it would
     push the drawer off-screen -- where the grip, the only way to get the size
     back, goes with it (risk 10). The width has no clipping problem to solve. */
  min-block-size: ${MIN_BLOCK}px;

  /* overflow: clip, NOT hidden. hidden is still PROGRAMMATICALLY scrollable, and
     scrollIntoView scrolls EVERY scrollable ancestor: one call on a row in here
     silently scrolled the drawer itself and slid a heading out of sight. clip is
     genuinely not a scroll container, which makes the whole class of bug
     unrepresentable rather than patched. There is no scrollIntoView anywhere in
     this file (§2.11). */
  overflow: clip;

  /* The drawer's own width answers the the auto layout, with no JavaScript deciding
     the shape (§2.9). A container query needs a containment context, and this box
     has an explicit inline size, so nothing in it can depend on its own width. An
     engine that does not know @container simply keeps the stacked layout, which
     is the safe default -- principle 4. */
  container-type: inline-size;
  container-name: gt-cart-drawer;

  border: 1px solid var(--gt-cart-border);
  border-radius: 8px;
  background: var(--gt-cart-surface);
  color: var(--gt-cart-text);
  box-shadow: var(--gt-cart-shadow);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
}

/* Open and closed is ONE attribute on html and one rule, the same lever the
   badge's corner uses. The state behind it is a STORED PREFERENCE since 0.5.0, so
   this rule is written from storage at document-start and a drawer you left open is
   open on the FIRST PAINT of a reload rather than a frame later (§2.9, reversed
   from the original in-memory answer after use). */
html[data-gt-cart-open="false"] ${D} {
  display: none;
}

/* The chrome mirrors the anchored corner, and both placements come off this one
   attribute: the head's controls on the side the drawer IS anchored to, the grip
   on the corner it is NOT. Two features that were each correct alone collided
   before this rule existed -- on a left dock the ✕ sat exactly where the grip
   lands (§2.9, §2.11 defect 5). */
html[data-gt-cart-corner="bottom-right"] ${D} {
  inset-block-end: 3.5rem;
  inset-inline-end: 1rem;
}
html[data-gt-cart-corner="bottom-left"] ${D} {
  inset-block-end: 3.5rem;
  inset-inline-start: 1rem;
}
html[data-gt-cart-corner="bottom-left"] ${D} div#${HEAD_ID} {
  flex-direction: row-reverse;
}
/* Clearance for the grip, on whichever corner it took. */
html[data-gt-cart-corner="bottom-right"] ${D} div#${HEAD_ID} {
  padding-inline-start: 20px;
}
html[data-gt-cart-corner="bottom-left"] ${D} div#${HEAD_ID} {
  padding-inline-end: 20px;
}

/* The hidden attribute hides ONLY where nothing more specific sets display. Its
   own rule lives in the UA stylesheet, and any author display beats a UA one, so
   this author rule exists to put the hiding back -- but it is itself only
   (1,1,1), and every rule below that names an id is more specific than that. SO
   ANY ELEMENT WHOSE OWN RULE SETS display NEEDS THE ATTRIBUTE IN ITS OWN
   SELECTOR, the way the floating toggle already does.

   That is not hypothetical: the preferences area set display: flex at (2,0,2) and
   won, so the area was permanently visible and the gear toggled an attribute that
   changed nothing. Reported in use at 0.3.0 and fixed below. */
${D} [hidden] {
  display: none;
}

/* RULE 3. A fixed part of the drawer gets flex: none. The section heading was
   SLICED along its top edge, and the first diagnosis blamed a scroll and was
   wrong. The real cause is worth carrying: a flex item cannot normally shrink
   below its content, but that automatic minimum applies ONLY WHILE overflow IS
   VISIBLE -- and the heading needs overflow: hidden for its ellipsis, which
   removed the minimum and let it be squashed. flex: none says the same thing as a
   min-height with no magic number (§2.11 defect 3). */
${D} div#${HEAD_ID},
${D} p.gt-cart-alert,
${D} h2.gt-cart-section-head,
${D} div#${DIVIDER_ID},
${D} div.gt-cart-chips,
${D} div.gt-cart-create,
${D} div#${FOOT_ID} {
  flex: none;
}

${D} div#${HEAD_ID} {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-block-end: 1px solid var(--gt-cart-border);
}
${D} span.gt-cart-title {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
}
${D} div.gt-cart-head-controls {
  display: flex;
  gap: 4px;
}

${D} p.gt-cart-alert {
  margin: 0;
  padding: 6px 10px;
  border-block-end: 1px solid var(--gt-cart-warning-border);
  background: var(--gt-cart-warning-bg);
  color: var(--gt-cart-warning-text);
  font-size: 12px;
}

/* The pair. Both selectors name the same two ids, so the one with the attribute
   is strictly more specific and the area hides when it is told to. */
${D} div#${PREFS_ID}[hidden] {
  display: none;
}
/* THE SETTINGS PANEL IS THE DRAWER'S ONE SCROLLER WHILE IT IS UP. §2.11 rule 1 is
   unchanged and holds exactly as written -- one scroller, a different occupant --
   and the drawer around it stays overflow: clip, NOT hidden, because hidden is
   still programmatically scrollable.

   IT IS A SCROLLER BECAUSE IT WAS MEASURED, not because a scroll was preferred.
   About twenty-two controls go in here, and the drawer can be 300x215 with every
   container on overflow: clip -- so a panel that shared the box with the sections
   would be truncated with NO SCROLLBAR TO SAY SO. That is the whole reason a strip
   became a screen (§2.9, decision 17).

   It was flex: none above with a bottom border until 1.2.0. Both are gone: it is
   the flexible child now, and there is nothing below it to be divided from. */
${D} div#${PREFS_ID} {
  flex: 1;
  min-block-size: 0;
  overflow: hidden auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 10px 12px;
  font-size: 12px;
}

/* A group of settings, and its heading. THE HEADING APPEARS ONLY WHERE A TAB HOLDS
   MORE THAN ONE GROUP -- with one group it would repeat the tab label immediately
   below it -- so today the only one is the pinned group above the bar. */
${D} div.gt-cart-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
${D} div.gt-cart-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gt-cart-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
${D} div.gt-cart-group-head::after {
  content: "";
  flex: 1;
  block-size: 1px;
  background: var(--gt-cart-border);
}

/* THE BAR SHOWS EVERY TAB, PRESSED OR NOT, which is why there is no open/closed set
   to store and why a tab added later is visible the moment it exists (decision 20).
   flex: none, because it is a fixed part of the panel and the panel is the
   scroller: a tab bar that scrolled away would be a bar you cannot get back to. */
${D} div#${TABS_ID} {
  flex: none;
  display: flex;
  gap: 2px;
  border-block-end: 1px solid var(--gt-cart-border);
}
${D} button.gt-cart-tab {
  padding: 3px 9px;
  border: 0;
  border-block-end: 2px solid transparent;
  background: none;
  color: var(--gt-cart-muted);
  font-family: inherit;
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
}
${D} button.gt-cart-tab:hover:not(:disabled) {
  color: var(--gt-cart-text);
}
/* The selected tab wears the same pair as the active collection chip and the open
   ⚙: this is the Cart's one word for "this is the one that is on". It has to beat
   the hover rule above, which is (1,3,2), or the selected tab would go quiet under
   the pointer -- the same trap the ⚙'s own state rule hit, so the selector is
   repeated with :hover here for the same reason and css-smoke asserts the win. */
${D} button.gt-cart-tab[aria-selected="true"],
${D} button.gt-cart-tab[aria-selected="true"]:hover:not(:disabled) {
  border-block-end-color: var(--gt-cart-selected-text);
  color: var(--gt-cart-selected-text);
  font-weight: 600;
}

/* The pair again, and for the same reason: this rule sets display, so the generic
   [hidden] rule at (1,1,1) cannot reach it and the panel needs the attribute in its
   own selector. That is the trap that left the ⚙ inert at 0.3.0 (§2.11). */
${D} div.gt-cart-tabpanel[hidden] {
  display: none;
}
${D} div.gt-cart-tabpanel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* THE TWO FIELD LISTS. Eight rows each, ticked and dragged, and everything about
   them is inside the panel -- the one scroller the drawer has while ⚙ is up, so a
   list longer than the box scrolls rather than clipping (§2.11 rule 1). */
${D} div.gt-cart-fields {
  display: flex;
  flex-direction: column;
  /* 1px, not the panel's 8: the gap is where the drop indicator is drawn, and rows
     far enough apart to be separate things make the indicator ambiguous about which
     gap it belongs to. */
  gap: 1px;
}
${D} div.gt-cart-field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  /* A TRANSPARENT BORDER ON ALL FOUR SIDES, always. The drop indicator only paints
     one edge of it, so the row does not change height at the moment the indicator
     appears -- which is a reflow under a pointer that is mid-drag, and reflow under
     a pointer is the defect §2.14 spent a day removing from the foot. */
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: grab;
  /* Without this a drag across the labels selects their text instead, and the
     selection is what the browser then offers to drag. */
  user-select: none;
}
${D} div.gt-cart-field:hover {
  background: var(--gt-cart-hover);
}
/* THE ROW BEING DRAGGED, and the selector is repeated with :hover for the reason the
   ⚙ and the selected tab both repeat theirs: the plain hover rule above is the same
   specificity, so this would win only on source order, and the pointer is by
   definition over this row while it is being dragged. That is the trap this sheet has
   already been caught by twice, and the fix is one selector rather than a note. */
${D} div.gt-cart-field[data-gt-dragging="true"],
${D} div.gt-cart-field[data-gt-dragging="true"]:hover {
  cursor: grabbing;
  background: var(--gt-cart-selected-bg);
}
/* The same token the selected tab, the active chip and the open ⚙ wear: this is the
   Cart's one word for "this is the one", and a drop indicator is exactly that. */
${D} div.gt-cart-field[data-gt-drop="before"] {
  border-block-start-color: var(--gt-cart-selected-text);
}
${D} div.gt-cart-field[data-gt-drop="after"] {
  border-block-end-color: var(--gt-cart-selected-text);
}
${D} span.gt-cart-grip {
  flex: none;
  color: var(--gt-cart-muted);
  letter-spacing: -1px;
  cursor: grab;
}
${D} div.gt-cart-field input {
  margin: 0;
  cursor: pointer;
}
/* The name takes the room and gives it back: at the drawer's 300px floor "Time
   remaining" beside "also a heading" is the widest row this panel has, and it is the
   NAME that ellipsises, because the note is the part you can lose. */
${D} label.gt-cart-field-name {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}
${D} span.gt-cart-field-note {
  flex: none;
  color: var(--gt-cart-muted);
  font-size: 10px;
  font-style: italic;
}
/* :empty AND NOT A hidden ATTRIBUTE. The note is written as text on every
   render, so an attribute beside it would be a second value saying the same thing,
   and the flex gap before an empty span is what it would exist to remove. */
${D} span.gt-cart-field-note:empty {
  display: none;
}

/* THE TWO BAND DROPDOWNS AND WHAT THEIR PAIR COSTS. The rows are ordinary
   gt-cart-pref labels, so they sit on the same grid as Sections, Corner and Issue
   reference and cost no new rule; the wrapper exists only to keep the note with the
   pair it describes. NO BACKTICK IN THIS SHEET -- it is a template literal, and one
   here ends it (see the test README). */
${D} div.gt-cart-bands {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* IT WRAPS, where a field row's note ellipsises. A sentence about what the export
   will do is worth two lines of the panel at the 300px floor -- it is read once,
   when the band is chosen, and a truncated one would be worse than none. */
${D} p.gt-cart-band-note {
  margin: 0;
  color: var(--gt-cart-muted);
  font-size: 10px;
  font-style: italic;
}
${D} p.gt-cart-band-note:empty {
  display: none;
}

/* ↺ Restore export defaults. Armed it carries the same red the armed ⌫ and the
   armed chip carry, because it is the same gesture at a different scope (§2.9). */
${D} button.gt-cart-restore[hidden] {
  display: none;
}
${D} button.gt-cart-restore {
  display: inline-block;
  align-self: start;
  padding: 2px 8px;
  border: 1px solid var(--gt-cart-border);
  border-radius: 3px;
  background: var(--gt-cart-input-bg);
  color: var(--gt-cart-text);
  font-family: inherit;
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
}
${D} button.gt-cart-restore:hover:not(:disabled) {
  background: var(--gt-cart-hover);
}
${D} button.gt-cart-restore[data-gt-armed="true"],
${D} button.gt-cart-restore[data-gt-armed="true"]:hover:not(:disabled) {
  border-color: var(--gt-cart-remove);
  background: var(--gt-cart-remove);
  color: var(--gt-cart-on-bold);
  font-weight: 600;
}
${D} label.gt-cart-pref {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
${D} span.gt-cart-pref-label {
  flex: none;
  min-inline-size: 4.5rem;
}
${D} label.gt-cart-pref select {
  flex: 1;
  min-inline-size: 0;
  padding: 2px 4px;
  border: 1px solid var(--gt-cart-border);
  border-radius: 3px;
  background: var(--gt-cart-input-bg);
  color: var(--gt-cart-text);
  font: inherit;
}

/* THE PAIR ONE MORE TIME. ⚙ replaces the whole body, so the body is now something
   that gets hidden -- and its own rule below sets display: flex, which beats the
   generic [hidden] rule. Without this line pressing ⚙ would draw the settings panel
   and leave the two sections underneath it (§2.11). */
${D} div#${BODY_ID}[hidden] {
  display: none;
}
${D} div#${BODY_ID} {
  flex: 1;
  min-block-size: 0;
  min-inline-size: 0;
  display: flex;
  flex-direction: column;
  overflow: clip;
  /* RULE 2. The sections DO NOT COMPETE BY CONTENT SIZE. A 30-item collection
     STARVED the live list, until "On this page" was its own heading and nothing
     else: sections that shrink in proportion to their content mean the section
     you pick INTO squeezes the section you pick FROM. A fixed basis is the fix,
     so the split cannot shift under you as the collection fills, and it is CSS
     rather than JavaScript, so it is right on the first paint (§2.9, §2.11).

     62% is the user's proportion: a collection is expected to hold around twenty
     items and to be emptied, while the mirror is what you read to decide. The
     dragged value is remembered PER LAYOUT, which is why there are two variables
     and CSS picks between them -- the container query decides the layout, so
     JavaScript is not in a position to choose. */
  --gt-cart-basis: var(--gt-cart-basis-stacked, 62%);
}

${D} section.gt-cart-section {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: clip;
}
/* RULE 7, and it is the one place the fixed basis BENDS. Added at 1.0.0, for
   risk 10.

   The basis is still fixed, so rule 2 stands: the split does not shift as the
   collection fills, because the number below is a CONSTANT and not the
   collection's content size. What it says is that the live list may not take room
   the collection cannot do without -- the collection's fixed parts are
   unshrinkable by rule 3, so whatever they do not get is CLIPPED, and at the old
   300x160 minimum that was the create field and all four copy buttons.

   It is a NO-OP on any drawer taller than about 406px, which is where 62% of the
   body and (the body minus 140) cross. So the default 520 and everything above it
   behaves exactly as it did before this rule existed; only a short drawer yields,
   and it yields the section that scrolls rather than the section that cannot.

   THE FIX IS NOT A min-height ON THE COLLECTION SECTION. Defect 3 above is the
   argument against exactly that: the section's own heading needs overflow: hidden
   for its ellipsis, which removes the automatic minimum, and a min-height there
   would re-introduce the magic number one level lower down, where it fights
   flex: none instead of cooperating with it.

   max(0px, ...) is load-bearing: a negative flex-basis is invalid, and on a drawer
   short enough for the subtraction to go below zero the whole declaration would be
   dropped -- which falls back to flex: 0 1 auto and brings DEFECT 2 back, sections
   competing by content size. An engine with no min() or max() in calc does the
   same, and there is no such Chromium (§2.11, risk 10). */
${D} section.gt-cart-live {
  flex: 0 0 max(0px, min(var(--gt-cart-basis), calc(100% - ${COLLECTION_FIXED_PX}px)));
}
${D} section.gt-cart-collection {
  flex: 1 1 0;
  border-block-start: 1px solid var(--gt-cart-border);
}

/* Automatic stacks the sections below 560px and puts them side by side above it. The
   two pinned states are the user overriding it, which is ONE preference with three
   states rather than a layout flag beside a remembered size that could contradict
   it (§2.9). Split mode escapes defect 2 by itself, because there the sections
   divide the width instead of the height. */
@container gt-cart-drawer (min-width: 560px) {
  html[data-gt-cart-layout="auto"] ${D} div#${BODY_ID} {
    flex-direction: row;
    --gt-cart-basis: var(--gt-cart-basis-split, 62%);
  }
  html[data-gt-cart-layout="auto"] ${D} section.gt-cart-collection {
    border-block-start: none;
    border-inline-start: 1px solid var(--gt-cart-border);
  }
  /* RULE 7 IS UNDONE SIDE BY SIDE, and that is not an exception to it: the basis
     is the INLINE size here, while the parts it protects stack vertically. Left
     in, it would steal width from the live list to buy height the collection
     already has -- side by side, each section is the whole body tall, so the
     minimum height is the only thing that has to hold and MIN_BLOCK is what holds
     it (risk 10). This selector is (1,2,3) against the base rule's (1,1,2), so it
     wins wherever the container query applies. */
  html[data-gt-cart-layout="auto"] ${D} section.gt-cart-live {
    flex: 0 0 var(--gt-cart-basis);
  }
  html[data-gt-cart-layout="auto"] ${D} div#${DIVIDER_ID} {
    block-size: auto;
    inline-size: 5px;
    cursor: col-resize;
  }
}
html[data-gt-cart-layout="split"] ${D} div#${BODY_ID} {
  flex-direction: row;
  --gt-cart-basis: var(--gt-cart-basis-split, 62%);
}
html[data-gt-cart-layout="split"] ${D} section.gt-cart-collection {
  border-block-start: none;
  border-inline-start: 1px solid var(--gt-cart-border);
}
/* Rule 7 undone for the pinned split, for the reason the container query above
   gives: side by side the basis is a width, and the parts it protects are a
   height. */
html[data-gt-cart-layout="split"] ${D} section.gt-cart-live {
  flex: 0 0 var(--gt-cart-basis);
}
html[data-gt-cart-layout="split"] ${D} div#${DIVIDER_ID} {
  block-size: auto;
  inline-size: 5px;
  cursor: col-resize;
}

${D} div#${DIVIDER_ID} {
  block-size: 5px;
  cursor: row-resize;
  background: transparent;
  /* The pointer owns this element for the length of a drag, so the browser must
     not decide to scroll or pan instead. */
  touch-action: none;
}
${D} div#${DIVIDER_ID}:hover {
  background: var(--gt-cart-focus);
}

${D} h2.gt-cart-section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 10px 4px;
  /* The ellipsis this needs is what removed the automatic minimum size and let
     the heading be sliced. flex: none above is what puts the floor back. */
  overflow: hidden;
  color: var(--gt-cart-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* RULE 1, the other half: ONE SCROLLER PER SECTION, and nothing else in the
   drawer scrolls. Everything above and below it is flex: none, and every
   container is overflow: clip. */
${D} div.gt-cart-list {
  flex: 1;
  min-block-size: 0;
  overflow: hidden auto;
  padding: 0 6px 6px;
}
${D} p.gt-cart-empty {
  margin: 6px 4px;
  color: var(--gt-cart-muted);
  font-size: 12px;
}

${D} div.gt-cart-row,
${D} div.gt-cart-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  /* 2px 5px AND A TRANSPARENT 1px BORDER, which comes to the 3px 6px box these rows
     had before 1.4.0. The border is where the item list's drop indicator paints, and
     it is on all four sides and always present so that a row does not change height
     at the moment the indicator appears -- a reflow under a pointer that is mid-drag,
     which is the field rows' own rule and the defect §2.14 spent a day removing from
     the foot. The live rows take it too, and paint nothing into it: one rule keeps
     the two lists the same size, which is worth more than saving a declaration on a
     list that cannot be dragged. */
  padding: 2px 5px;
  border: 1px solid transparent;
  border-radius: 4px;
}
/* Everything except the key is the toggle, so the button is what fills the row
   rather than being the row. The key beside it is a link (see renderLiveList). */
${D} button.gt-cart-row-body {
  flex: 1;
  min-inline-size: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}
${D} div.gt-cart-row:hover,
${D} div.gt-cart-item:hover {
  background: var(--gt-cart-hover);
}

/* -- THE COLLECTION'S ROWS ARE DRAGGABLE (§2.9.1), and everything below is the
   field rows' visual language reused rather than a second one invented.

   1px between rows, and NOT the 8px this drawer uses elsewhere: the gap is where the
   indicator is drawn, and rows far enough apart to read as separate things make it
   ambiguous which gap the line belongs to. It is a margin on the second row onward
   rather than a gap on the list, because the list is a block container that also
   holds the empty-state paragraph, and turning it into a flex column to gain one
   pixel would change how that paragraph and the scroller behave. */
${D} div.gt-cart-item + div.gt-cart-item {
  margin-block-start: 1px;
}
${D} div.gt-cart-item[draggable="true"] {
  cursor: grab;
  /* Without this a drag across the summary selects its text instead, and the
     selection is then what the browser offers to drag. It costs mouse selection of a
     summary, which §2.9.1 accepts as the price of the whole row being the target. */
  user-select: none;
}
/* THE DRAGGED ROW, and the selector is repeated with :hover for the reason the field
   rows, the ⚙ and the selected tab all repeat theirs: the plain hover rule above is
   the same specificity, so this would win on source order alone -- and the pointer is
   by definition over this row while it is being dragged. That trap has now been hit
   three times in this sheet and the fix is one selector, never a note. */
${D} div.gt-cart-item[data-gt-dragging="true"],
${D} div.gt-cart-item[data-gt-dragging="true"]:hover {
  cursor: grabbing;
  background: var(--gt-cart-selected-bg);
}
/* The same token the selected tab, the active chip, the open ⚙ and the field rows'
   own indicator wear: this is the Cart's one word for "this is the one". */
${D} div.gt-cart-item[data-gt-drop="before"] {
  border-block-start-color: var(--gt-cart-selected-text);
}
${D} div.gt-cart-item[data-gt-drop="after"] {
  border-block-end-color: var(--gt-cart-selected-text);
}
/* THE GRIP IS RESERVED ALWAYS AND PAINTED ON HOVER -- visibility, never display,
   and that is the whole decision (§2.9). The row is tight and the summary already
   ellipsises, so the glyph is quiet until the pointer arrives; but taking its width
   away when it is quiet would re-ellipsise the summary under the hand about to grab
   the row. So the space is held and only the paint changes (§2.9.1). A row that cannot be
   dragged holds the same space and never paints, which keeps a read-only store's
   rows the same size as a writable one's. */
${D} div.gt-cart-item span.gt-cart-grip {
  visibility: hidden;
  font-size: 11px;
}
${D} div.gt-cart-item[draggable="true"]:hover span.gt-cart-grip,
${D} div.gt-cart-item[data-gt-dragging="true"] span.gt-cart-grip {
  visibility: visible;
}
/* The key is the one thing in the row that is not the drag: it is a link, it opts out
   of draggable in itemRow, and its cursor has to say so over a row that is
   otherwise saying grab. */
${D} div.gt-cart-item a.gt-cart-row-key {
  cursor: pointer;
}
/* THE DRAWER OWNS ITS OWN FOCUS APPEARANCE. The Cart is not in a shadow root, so
   Atlassian's stylesheet has every right to style a focused button inside it -- the
   same argument the row-key rule below makes about the generated sheet -- and a host
   rule on :focus paints on a MOUSE click, where the Cart's own ring is deliberately
   :focus-visible and does not. That difference is invisible until somebody reads a
   blue ring as a state, which is exactly what happened on 2026-08-25.

   So :focus is cleared and :focus-visible puts the Cart's ring back. This rule is
   (1,1,1) and every ring below names a class or an element as well, so each of them
   strictly beats it -- asserted in css-smoke, because a ring this rule silently ate
   would be a keyboard user losing their place with nothing to say so. */
${D} :focus {
  outline: none;
}
${D} button.gt-cart-row-body:focus-visible,
${D} a.gt-cart-row-key:focus-visible,
${D} button.gt-cart-chip-main:focus-visible,
${D} button.gt-cart-chip-x:focus-visible,
${D} button.gt-cart-copy:focus-visible,
${D} button.gt-cart-icon:focus-visible,
${D} button.gt-cart-x:focus-visible,
${D} button.gt-cart-name:focus-visible,
${D} button.gt-cart-button:focus-visible,
${D} input:focus-visible,
${D} select:focus-visible {
  outline: 2px solid var(--gt-cart-focus);
  outline-offset: 1px;
}

/* The key is a link, and these five declarations are all about NOT being styled
   by two sheets that have every right to style it.

   The generated collected-keys sheet (§2.7) matches a[href$="/browse/KEY"] at
   (0,1,1) and would paint every collected key in the drawer green -- including on
   the red hover below, where green on red is unreadable. Naming the drawer's id
   makes this (1,1,2), which wins whichever of the two sheets the browser parsed
   last, so the tint stays on the page where it belongs.

   And color: inherit is what lets the same link read correctly on a plain row, on
   a collected row, and on the red one. */
${D} a.gt-cart-row-key {
  flex: none;
  background: none;
  color: inherit;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
}
${D} a.gt-cart-row-key:hover {
  text-decoration: underline;
}
/* The mount detector must not fire on our own links either. That animation is how
   the script learns Jira inserted an issue link (§2.10), and our rows are not
   Jira: without this, every rebuild of a row announces itself and costs one more
   render for nothing. */
${D} a {
  animation: none;
}
${D} span.gt-cart-row-summary {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
${D} span.gt-cart-row-origin {
  flex: none;
  color: var(--gt-cart-muted);
  font-size: 11px;
}
${D} span.gt-cart-item-note {
  flex: none;
  color: var(--gt-cart-muted);
  font-size: 11px;
}

/* A collected row is tinted with the same success colours the page's own links
   get, so the two sections agree about what "collected" looks like. */
${D} div.gt-cart-row[data-gt-collected="true"] {
  background: var(--gt-cart-collected-bg);
  color: var(--gt-cart-collected-text);
}
${D} span.gt-cart-row-mark {
  flex: none;
  inline-size: 1em;
  text-align: center;
  font-weight: 700;
}
${D} div.gt-cart-row[data-gt-collected="false"] span.gt-cart-row-mark::after {
  content: "+";
}
${D} div.gt-cart-row[data-gt-collected="true"] span.gt-cart-row-mark::after {
  content: "✓";
}
/* The same pre-click warning the floating button gives: red, and it names removal
   BEFORE any click, because removal is the one destructive thing these gestures do
   and there is no undo (§2.9, §2.7).

   It reddens THE TOGGLE AND NOT THE WHOLE ROW, which is new in 0.4.0 and is the
   honest form: the key beside it opens the issue rather than removing it, so a red
   row would promise a removal on a click that navigates instead. The warning
   belongs where the click it warns about lands. */
${D} div.gt-cart-row[data-gt-collected="true"] button.gt-cart-row-body:hover {
  background: var(--gt-cart-remove);
  color: var(--gt-cart-on-bold);
}
${D} div.gt-cart-row[data-gt-collected="true"] button.gt-cart-row-body:hover span.gt-cart-row-mark::after {
  content: "−";
}

${D} button.gt-cart-name {
  padding: 0;
  border: none;
  background: none;
  color: var(--gt-cart-text);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: text;
}
${D} button.gt-cart-name:hover {
  text-decoration: underline dotted;
}
${D} input#${RENAME_ID} {
  flex: 1;
  min-inline-size: 0;
  padding: 1px 4px;
  border: 1px solid var(--gt-cart-focus);
  border-radius: 3px;
  background: var(--gt-cart-input-bg);
  color: var(--gt-cart-text);
  font: inherit;
  font-size: 12px;
  text-transform: none;
}
${D} span#${COUNT_ID} {
  flex: none;
  color: var(--gt-cart-muted);
  font-variant-numeric: tabular-nums;
}
/* ⌫ and ↻ sit together at the far end of the heading. The auto margin is on the
   FIRST of the pair, so adding a third control later does not need a new rule. */
${D} button#${EMPTY_ID} {
  margin-inline-start: auto;
}
/* Armed, it stops being an icon and becomes the question, so it needs the width
   its text asks for. Red, because that is what this repository's UI uses for the
   click that removes something (§2.7, §2.9). */
${D} button#${EMPTY_ID}[data-gt-armed="true"] {
  inline-size: auto;
  padding: 0 6px;
  background: var(--gt-cart-remove);
  color: var(--gt-cart-on-bold);
  font-size: 11px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}
${D} button#${EMPTY_ID}[data-gt-armed="true"]:hover:not(:disabled) {
  background: var(--gt-cart-remove);
}

${D} button.gt-cart-icon,
${D} button.gt-cart-button {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 22px;
  block-size: 22px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--gt-cart-text);
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}
${D} button.gt-cart-icon:hover:not(:disabled),
${D} button.gt-cart-button:hover:not(:disabled) {
  background: var(--gt-cart-hover);
}

/* THE GEAR IS BIGGER THAN ITS NEIGHBOURS, ON PURPOSE. Added on 2026-08-24, from
   the first report this effort has had from a THIRD PARTY: a beta tester on 1.1.0
   did not find the settings at all. At 13px it is a grey pictograph in a
   transparent box, next to a ✕, which is the one glyph every reader already knows.

   NO BACKTICKS IN THIS COMMENT, and none anywhere in this sheet: it is one template
   literal, so a backtick in a comment ends it. Writing one here cost a syntax error
   while this rule was being added, which is the third time (§2.11).

   ONLY THE GEAR, and never the gt-cart-icon class itself: that class also dresses
   ✕, ⌫ and ↻, and growing all four would leave the gear exactly as prominent
   RELATIVE to them as it was, which is the whole complaint.

   THE BOX STAYS 22px, AND THAT IS WHY THIS IS A FONT-SIZE ALONE. A 16px glyph fits
   a 22px box at line-height 1, and the head's height is what the drawer's 215px
   floor is derived from -- css-smoke computes it with HEAD = 35, which is this
   button's 22 plus the head's own padding and border. A 24px button would
   re-derive MIN_BLOCK, and that floor exists because going under it clipped the
   create field and all four copy buttons away (§2.11 rule 7).

   Two other candidates were weighed and not taken, recorded so neither is
   rediscovered as new. A resting border and fill would make it read as a button,
   and would spend the contrast the pressed state needs once ⚙ becomes a mode
   toggle. A "⚙ Settings" LABEL is what appendix A.9's ■ finding argues for -- a
   word survives where a dim pictograph does not -- and it costs head width, so the
   collection's name truncates sooner. This one costs neither height nor width. If
   the button is still missed once it also carries a pressed state, the label is the
   next thing to try. */
${D} button.gt-cart-icon[data-gt-action="prefs"] {
  font-size: 16px;
}

/* WHILE THE SETTINGS ARE OPEN, THE GEAR IS ON. Added on 2026-08-25 from a use
   report: the button appeared to be "bordered in blue after clicking", and that read
   as a state without being one. It was the FOCUS ring -- which is why it arrived
   whether the click had opened the settings or closed them, and why clicking
   anywhere else took it away. The button carried NO state, so nothing on screen was
   a function of whether the panel was up.

   THE SAME THREE DECLARATIONS THE ACTIVE COLLECTION CHIP USES, and not a new blue:
   this pair of tokens is already the Cart's word for "this one is on", and
   jira-ux-improvements dresses its locked padlock with it too. A fourth blue would
   be a fourth thing to keep in step.

   THE SELECTOR IS REPEATED WITH :hover ON PURPOSE. The hover rule above is
   (1,3,2) -- the class, :hover, and :not(:disabled) -- and the state on its own
   would be (1,2,2), so hovering an open gear would paint the plain hover tint over
   the state and the button would go quiet under the pointer. Equal specificity plus
   document order is not good enough here: this sheet's own history is a rule that
   lost the cascade and left the gear inert for two versions (§2.11). css-smoke
   asserts the win rather than trusting the order.

   The attribute name is interpolated and never typed: the render writes the same
   constant on the button, so this rule cannot be left painting an attribute the
   script has stopped writing. */
${D} button.gt-cart-icon[${PREFS_STATE_ATTR}="true"],
${D} button.gt-cart-icon[${PREFS_STATE_ATTR}="true"]:hover:not(:disabled) {
  border-color: var(--gt-cart-selected-text);
  background: var(--gt-cart-selected-bg);
  color: var(--gt-cart-selected-text);
}
${D} button.gt-cart-x {
  flex: none;
  inline-size: 18px;
  block-size: 18px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--gt-cart-muted);
  font-family: inherit;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}
${D} button.gt-cart-x:hover {
  background: var(--gt-cart-remove);
  color: var(--gt-cart-on-bold);
}

${D} div.gt-cart-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 10px 0;
}
/* The pill is the DIV; the two buttons inside it are transparent. A button inside
   a button is invalid HTML and the parser hoists the inner one out, which is why
   this is not one control with a decoration (see renderChips). */
${D} div.gt-cart-chip {
  display: inline-flex;
  align-items: stretch;
  max-inline-size: 100%;
  border: 1px solid var(--gt-cart-border);
  border-radius: 11px;
  background: var(--gt-cart-surface);
  color: var(--gt-cart-text);
  font-size: 12px;
  line-height: 1.4;
}
${D} div.gt-cart-chip[data-gt-active="true"] {
  border-color: var(--gt-cart-selected-text);
  background: var(--gt-cart-selected-bg);
  color: var(--gt-cart-selected-text);
  font-weight: 600;
}
/* Armed: the whole pill goes red, and the tooltip carries the sentence. The same
   pre-click warning the floating button and the live row give, in the one shape a
   chip can carry (§2.7, §2.9). */
${D} div.gt-cart-chip[data-gt-armed="true"] {
  border-color: var(--gt-cart-remove);
  background: var(--gt-cart-remove);
  color: var(--gt-cart-on-bold);
}
${D} button.gt-cart-chip-main {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  min-inline-size: 0;
  padding: 2px 4px 2px 8px;
  border: none;
  border-radius: 11px 0 0 11px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
${D} button.gt-cart-chip-x {
  flex: none;
  padding: 2px 7px 2px 3px;
  border: none;
  border-radius: 0 11px 11px 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 10px;
  line-height: 1.4;
  opacity: 0.6;
  cursor: pointer;
}
${D} button.gt-cart-chip-x:hover,
${D} div.gt-cart-chip[data-gt-armed="true"] button.gt-cart-chip-x {
  opacity: 1;
}
${D} button.gt-cart-chip-x:hover {
  background: var(--gt-cart-remove);
  color: var(--gt-cart-on-bold);
}
${D} span.gt-cart-chip-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* The count NEVER TRUNCATES: it is the one thing on a chip that cannot be
   reconstructed from a shortened label (§2.9). */
${D} span.gt-cart-chip-count {
  flex: none;
  color: inherit;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

${D} div.gt-cart-create {
  display: flex;
  gap: 4px;
  padding: 6px 10px;
}
${D} input#${CREATE_ID} {
  flex: 1;
  min-inline-size: 0;
  padding: 2px 6px;
  border: 1px solid var(--gt-cart-border);
  border-radius: 4px;
  background: var(--gt-cart-input-bg);
  color: var(--gt-cart-text);
  font: inherit;
  font-size: 12px;
}

${D} div#${FOOT_ID} {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 10px;
  border-block-start: 1px solid var(--gt-cart-border);
}
${D} button.gt-cart-copy {
  padding: 3px 8px;
  border: 1px solid var(--gt-cart-border);
  border-radius: 4px;
  background: var(--gt-cart-surface);
  color: var(--gt-cart-text);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
}
/* A LABEL THAT CHANGES MUST NOT CHANGE THE ROW. The two stepped buttons cycle
   through Details, Fetching..., Copy and a tick, and the foot wraps, so without a
   reserved box each press rearranged the row and the next press put it back. 11ch
   fits the longest of those plus its emoji at this font size; the button is
   content-box, so the 8px padding sits outside it. Centred text, which buttons are
   by default, is what makes the spare room read as a box rather than a gap.
   NO BACKTICKS IN THIS SHEET: it is one template literal, and a backtick in a
   comment ends it. That cost a syntax error once. */
${D} button.gt-cart-copy[data-gt-steps] {
  min-inline-size: 11ch;
}
${D} button.gt-cart-copy:hover:not(:disabled) {
  background: var(--gt-cart-hover);
}
${D} button:disabled {
  opacity: 0.45;
  cursor: default;
}

/* Our own grip, on the corner that can MOVE, which is the one you drag. The two
   borders it shows are mirrored with the dock, so it always reads as the free
   corner rather than as a stray square (§2.11 defect 4, §2.9). */
${D} div#${GRIP_ID} {
  position: absolute;
  inline-size: 12px;
  block-size: 12px;
  border: 0 solid var(--gt-cart-muted);
  opacity: 0.55;
  touch-action: none;
}
${D} div#${GRIP_ID}:hover {
  opacity: 1;
}
html[data-gt-cart-corner="bottom-right"] ${D} div#${GRIP_ID} {
  inset-block-start: 3px;
  inset-inline-start: 3px;
  border-block-start-width: 2px;
  border-inline-start-width: 2px;
  border-start-start-radius: 4px;
  cursor: nwse-resize;
}
html[data-gt-cart-corner="bottom-left"] ${D} div#${GRIP_ID} {
  inset-block-start: 3px;
  inset-inline-end: 3px;
  border-block-start-width: 2px;
  border-inline-end-width: 2px;
  border-start-end-radius: 4px;
  cursor: nesw-resize;
}

/* The Cart's own right-click menu, above the drawer and still a plain z-index:
   the top layer earned nothing for the drawer and earns nothing here (§2.9). */
div#${MENU_ID} {
  position: fixed;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  min-inline-size: 12rem;
  padding: 4px;
  border: 1px solid var(--gt-cart-border);
  border-radius: 6px;
  background: var(--gt-cart-surface);
  color: var(--gt-cart-text);
  box-shadow: var(--gt-cart-shadow);
  font-family: inherit;
  font-size: 13px;
}
div#${MENU_ID} button.gt-cart-menu-item {
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: start;
  white-space: nowrap;
  cursor: pointer;
}
div#${MENU_ID} button.gt-cart-menu-item:hover {
  background: var(--gt-cart-hover);
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
    const prefs = loadPrefs();
    root.dataset.gtCartCorner = prefs.corner;
    root.dataset.gtCartLayout = prefs.layout;
    // Written from the STORED state, so a drawer you left open is open on the first
    // paint of a reload rather than appearing a frame later (§2.9, reversed 0.5.0).
    // The element it governs does not exist yet, and does not need to: the rule is
    // ready for it.
    root.dataset.gtCartOpen = String(prefs.open);
    applyCollectedCss(activeCollection(load()).items.map((item) => item.key));
  });

  guard(writeFirstRun);

  // Cross-tab freshness, and it is ONLY that: correctness is the read-modify-
  // write in `update`. Registered on our own keys, so it hears them and nothing
  // else. One path -- event, load, render -- so the event's own values never
  // become a second way in. It is better than the `storage` event, which tells a
  // tab about its own write by NOT firing (§2.5).
  //
  // BOTH KEYS, and the second one was missing until 1.0.0. Found by running the
  // whole script twice over one store: only the collections were listened for, so
  // a preference changed in one tab did not reach the other WHEN IT HAPPENED -- it
  // arrived at that tab's next render for some unrelated reason, a mount burst or
  // the backstop tick. Since 0.5.0 the drawer's open state is one of those
  // preferences (§2.9), so the other tab's drawer closed by itself, seconds later,
  // with nobody having touched it there. The state was shared and the propagation
  // was not. The size, the divider, the corner and the layout all had it too.
  if (typeof GM_addValueChangeListener === "function") {
    GM_addValueChangeListener(STORE_KEY, () => guard(scheduleRender));
    // `render` only READS, so a notification cannot start a write that notifies
    // again: there is no loop to break here.
    GM_addValueChangeListener(PREFS_KEY, () => guard(scheduleRender));
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
  // does not bubble. It also dismisses the Cart's own menu, which cannot follow
  // the link it was opened on.
  document.addEventListener(
    "scroll",
    () =>
      guard(() => {
        onScroll();
        closeMenu();
      }),
    true,
  );

  // The right-click menu, and it does nothing at all unless the preference is on
  // (§2.7). Capture, so the interception lands before Jira's own handlers on the
  // row -- and the target test keeps it to the anchor, never the whole row.
  document.addEventListener(
    "contextmenu",
    (event) => guard(() => onContextMenu(event)),
    true,
  );

  // The MENU is light-dismissed and Escape closes it. THE DRAWER IS NEITHER: no
  // light dismiss, and Escape does not close it, because Jira binds Escape all
  // over its own UI and a drawer that vanished under an Escape aimed at one of
  // Jira's dialogs would read as a bug (§2.9). Nothing below opens or closes it.
  document.addEventListener(
    "pointerdown",
    (event) =>
      guard(() => {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest(`#${MENU_ID}`)) return;
        closeMenu();
        // Going back to the page is walking away from a half-pressed destructive
        // control. The drawer's own listener handles the clicks inside it.
        if (!target?.closest(`#${DRAWER_ID}`)) disarm();
      }),
    true,
  );
  document.addEventListener("keydown", (event) =>
    guard(() => {
      if (event.key === "Escape") closeMenu();
    }),
  );

  // The badge is not anchored to a Jira element, so nothing Jira builds announces
  // when it can exist: a <body> is the whole requirement. Without this the first
  // badge on a view with no issue links would wait for the backstop.
  document.addEventListener("DOMContentLoaded", () => guard(scheduleRender));

  watchMounts(scheduleRender);
  guard(render);
})();
