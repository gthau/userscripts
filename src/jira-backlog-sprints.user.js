// ==UserScript==
// @name         Jira Backlog Sprints
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Hide the sprints that belong to other boards on the Jira Backlog, and bring them back one board at a time.
// @author       gthau
// @match        https://*.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-backlog-sprints.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-backlog-sprints.user.js
// @grant        none
// ==/UserScript==

/**
 * The Backlog view lists every sprint that any member of the board's team takes
 * part in, not the sprints of the board. One cross-team member is therefore
 * enough to add twenty sprints from four other boards to the page. This script
 * hides them, and puts a control in the board header to bring them back.
 *
 * - `N sprints hidden ▾` beside the board actions. The label is the state, so
 *   there is no way to leave the filter on and forget about it.
 * - The panel has one switch for the whole filter, and one checkbox for each
 *   other board, with the number of sprints it contributes.
 *
 * A sprint belongs to another board when its row carries Atlassian's
 * "Origin Board" marker -- the accessible name of the small board icon in front
 * of the board name. That is a property of the row rather than of its text, so
 * it holds when sprints are renamed, which they are every two weeks.
 *
 * Hiding is one CSS rule and no JavaScript. The rule asks whether a row carries
 * the marker, which is true or false before anything has been scanned, counted
 * or read from storage, so the rule is written at `document-start` and the rows
 * never flash into view. Three consequences, in order of how much they matter:
 *
 * 1. If the scan below breaks, every foreign sprint stays hidden. That is the
 *    default, and the safe answer.
 * 2. If the panel breaks, hiding is unaffected.
 * 3. Nothing about the sprints is ever cached. A month-old session cannot show
 *    a stale list, because there is no list.
 *
 * JavaScript is needed for two things only: the board names and counts in the
 * panel, and subtracting the boards you revealed from that one rule.
 *
 * Sprints native to this board are never touched, and neither is the backlog's
 * own card list at the bottom of the page.
 *
 * `@match` covers the whole site rather than the backlog path, because it only
 * governs injection, and Tampermonkey evaluates it on document load and not on
 * history rewrites: arriving from another Jira page would otherwise never
 * inject the script. The route gate decides whether the control exists.
 *
 * Reordering the sprints is deliberately not here. See the ADR beside this file.
 */
(function () {
  "use strict";

  // ----------------------------------------------------------------- helpers

  const LOGGER_PREFIX = "[Jira Backlog] ";
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

  // Jira re-renders under us constantly, so any node we read may be gone by the
  // time we touch it. One failure should cost the caller, not the session.
  function guard(fn) {
    try {
      return fn();
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
  // and never again. FILTER_STYLE_ID is the one rule that hides sprints, and it
  // is rewritten whenever the set of revealed boards changes.
  const STYLE_ID = "gt-backlog-style";
  const FILTER_STYLE_ID = "gt-backlog-filter-style";

  const CONTROL_ID = "gt-backlog-control";
  const TOGGLE_ID = "gt-backlog-toggle";
  const PANEL_ID = "gt-backlog-panel";
  const BOARDS_ID = "gt-backlog-boards";
  const MASTER_ID = "gt-backlog-master";
  const BADGE_ID = "gt-backlog-badge";
  const MOUNT_ANIMATION = "gt-backlog-mount";
  const ANCHOR_NAME = "--gt-backlog-actions";

  // Both backstops exist for the case where the event-driven path missed
  // something, not as the primary mechanism. They cost a querySelectorAll each.
  const MOUNT_BACKSTOP_MS = 5_000;
  const ROUTE_BACKSTOP_MS = 2_000;

  // Shown in the panel for a foreign sprint whose board name could not be read.
  // It is still hidden -- the marker proves it is foreign -- and grouping it
  // under a label keeps it revealable rather than stranded.
  const UNKNOWN_BOARD = "(board name unavailable)";

  const CARD_LIST_PREFIX = "software-backlog.card-list.container.";

  const SEL = {
    scrollable: '[data-testid="software-backlog.backlog-content.scrollable"]',
    // One per sprint, and one for the backlog itself. The sprint ones end in the
    // Jira sprint id; the backlog one ends in BACKLOG, which is why every count
    // and every generated rule below requires digits.
    cardList: `[data-testid^="${CARD_LIST_PREFIX}"]`,
    // The marker that says "this sprint belongs to another board". Atlassian
    // writes it as the accessible name of the board icon in front of the board
    // name. If it is renamed or translated, no sprint is classified as foreign,
    // nothing is hidden, and `checkContract` reports it on the page.
    originBoard: '[aria-label="Origin Board"]',
    // The element around that icon, whose text is the board name. It is a
    // <button role="link">, not an <a>, so there is no href and no board id to
    // read -- which is why preferences are keyed by board name. It is also the
    // second witness `checkContract` uses.
    originLink: 'button[role="link"]',
    // Anchor for the control. Its last child is the group of action buttons at
    // the right end of the header, pushed there by an automatic margin; the
    // control sits in the empty space to the left of it.
    boardHeader: '[data-testid="horizontal-nav-header.ui.board-header.header"]',
  };

  // ------------------------------------------------------------------- route

  // Anchored on the path, and it yields the board id rather than a yes/no. The
  // id is also the preference key. Returning null away from the backlog is what
  // makes "Backlog -> Reports" count as a route change even though the board
  // did not change: the control has to go away.
  const BACKLOG_PATH_RE = /\/boards\/(\d+)\/backlog(?:\/|$)/;

  function getBoardId(url) {
    try {
      return (
        new URL(url, location.href).pathname.match(BACKLOG_PATH_RE)?.[1] ?? null
      );
    } catch {
      return null;
    }
  }

  let currentBoard = getBoardId(location.href);

  // Jira is a single-page app: it rewrites history instead of loading pages, and
  // `history.pushState` emits no event of its own. Three layers feed one
  // callback, deduplicated on the board id so overlap is free. Same shape as the
  // issue script's route watcher.
  function watchRoute(onChange) {
    const notify = (url) => {
      const board = getBoardId(url ?? location.href);
      if (board === currentBoard) return;
      logger.debug(`route: ${currentBoard} -> ${board}`);
      currentBoard = board;
      onChange();
    };

    if (typeof window.navigation?.addEventListener === "function") {
      // The Navigation API reports pushState, replaceState, back/forward and
      // link clicks through one event. It fires before the navigation commits,
      // hence reading the URL off the event rather than off `location`.
      window.navigation.addEventListener("navigate", (event) =>
        guard(() => notify(event.destination.url)),
      );
    } else {
      // Everywhere else, patch the two methods. `@grant none` runs us in the
      // page context, so this is the same `history` object Jira's router calls.
      // Call through first and report after: `location` is updated by then, and
      // the router still gets its own return value untouched.
      for (const name of ["pushState", "replaceState"]) {
        const original = history[name];
        history[name] = function (...args) {
          const result = original.apply(this, args);
          guard(() => notify());
          return result;
        };
      }
    }

    window.addEventListener("popstate", () => guard(() => notify()));
    window.addEventListener("hashchange", () => guard(() => notify()));

    // Backstop, and the correction for a `navigate` event fired for a
    // navigation the router then cancelled.
    setInterval(() => guard(() => notify()), ROUTE_BACKSTOP_MS);
  }

  // ------------------------------------------------------------ preferences

  // Keyed by board id, because "the other boards I also want to see" is a fact
  // about one backlog. A single global list would leak Rundown's choices onto
  // every other board's backlog.
  //
  // Both preferences persist. The issue script deliberately forgets its lock at
  // every navigation, because leaving a description editable behind you is a
  // hazard; leaving sprints visible is not, and the button label says so at all
  // times. Re-ticking a board on every page load would make the filter more
  // annoying than the problem it removes.
  const PREFS_KEY = "gt-jira-backlog.prefs";
  const DEFAULT_BOARD_PREFS = { enabled: true, reveal: [] };

  const prefs = (() => {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    } catch (e) {
      logger.warn("could not read stored preferences, using defaults", e);
      return {};
    }
  })();

  // Only known keys, so a preference that has since been retired stops being
  // written back out. `reveal` is copied and filtered rather than used as it is:
  // it arrives from localStorage, and it decides which sprints stay visible.
  function boardPrefs() {
    const stored = prefs[currentBoard] ?? {};
    return {
      enabled: stored.enabled ?? DEFAULT_BOARD_PREFS.enabled,
      reveal: Array.isArray(stored.reveal)
        ? stored.reveal.filter((name) => typeof name === "string")
        : [...DEFAULT_BOARD_PREFS.reveal],
    };
  }

  function setBoardPref(name, value) {
    if (!currentBoard) return;
    prefs[currentBoard] = { ...boardPrefs(), [name]: value };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      logger.warn("could not persist preferences", e);
    }
    render();
  }

  // Whether the panel is open answers "are you looking at it right now", so it
  // lives in memory and starts closed.
  let panelOpen = false;

  // ------------------------------------------------------------------- mount

  // The browser knows the instant React inserts a sprint row or the board
  // header, and will say so through `animationstart`, which bubbles. That beats
  // polling on three counts: no dead time before a first tick, no permanent
  // subtree observer over a heavy React page, and it fires again on every
  // remount -- a filter change, an expanded sprint, a virtualised re-render --
  // so none of those need noticing separately. Same lever as the issue script.
  function watchMounts(onMount) {
    document.addEventListener(
      "animationstart",
      (event) => {
        if (event.animationName !== MOUNT_ANIMATION) return;
        onMount();
      },
      true,
    );

    // Backstop for the one thing the animation trick cannot survive: page CSS
    // winning over `animation` on a target.
    setInterval(() => guard(render), MOUNT_BACKSTOP_MS);
  }

  // A backlog holds around thirty sprint rows, and each one fires its own
  // `animationstart` on load, so the mount signal arrives thirty times in a
  // frame. `render` is idempotent and would survive that, but it would also do
  // thirty full scans to produce one result. Coalescing into a frame keeps one
  // description of the page while paying for it once.
  let renderScheduled = false;

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      guard(render);
    });
  }

  // -------------------------------------------------------------------- scan

  /**
   * Read the sprint rows on the page. Returns the foreign ones with their board
   * names, plus the two counts `checkContract` compares.
   */
  function scanSprints() {
    const rows = document.querySelectorAll(`${SEL.scrollable} ${SEL.cardList}`);
    const foreign = [];
    let linkRows = 0;
    let nameless = 0;

    for (const row of rows) {
      const id = row.dataset.testid.slice(CARD_LIST_PREFIX.length);
      // The backlog's own card list is `...container.BACKLOG`. Requiring digits
      // keeps it out of every count and out of every generated selector, and
      // means a future non-sprint card list is ignored rather than mangled.
      if (!/^\d+$/.test(id)) continue;

      if (row.querySelector(SEL.originLink)) linkRows += 1;

      const marker = row.querySelector(SEL.originBoard);
      if (!marker) continue; // native to this board, and never touched

      const board = (marker.closest(SEL.originLink) ?? marker.parentElement)
        ?.textContent?.trim();
      if (!board) nameless += 1;

      foreign.push({ id, board: board || UNKNOWN_BOARD });
    }

    return { foreign, linkRows, nameless };
  }

  // Insertion order is page order, so the panel lists boards in the order their
  // first sprint appears rather than in whatever order a Map happens to hold.
  function groupByBoard(foreign) {
    const counts = new Map();
    for (const { board } of foreign) {
      counts.set(board, (counts.get(board) ?? 0) + 1);
    }
    return counts;
  }

  // ------------------------------------------------------------------ filter

  // Rewriting a <style> makes the browser re-parse the sheet and recalculate
  // style for the page, even when the text is identical. `render` runs on every
  // mount, so the rule is compared before it is written.
  let filterCss = null;

  function applyFilterCss(revealedIds) {
    const css = buildFilterCss(revealedIds);
    if (css === filterCss) return;
    filterCss = css;
    injectStyle(FILTER_STYLE_ID, css);
  }

  function buildFilterCss(revealedIds) {
    const exclusions = revealedIds
      .map((id) => `:not(:has(> div[data-testid="${CARD_LIST_PREFIX}${id}"]))`)
      .join("");

    return `/* The whole of the hiding. The test is structural -- does this row
   carry the "belongs to another board" marker -- so it is already correct
   before anything has been scanned, counted or read from storage. That is why
   it can be written at document-start, and why the foreign rows never flash
   into view. The backlog's own card list carries no marker, so it cannot match.

   Revealed boards are subtracted from this selector rather than un-hidden by a
   later rule. An un-hide would have to name a display value, and the right
   value is whatever Jira gives the <li>, which is not ours to guess.

   Only sprint ids reach this string, and each one is a run of digits taken from
   a data-testid. Board names, which come from localStorage, never do. */
html[data-gt-backlog-filter="on"] ${SEL.scrollable} li:has(> div${SEL.cardList} ${SEL.originBoard})${exclusions} {
  display: none;
}`;
  }

  // ------------------------------------------------------------- diagnostics

  /**
   * A `console.warn` nobody reads is not a report: the devtools are closed while
   * you are actually planning a sprint, and a filter whose marker has rotted
   * looks exactly like a backlog with nothing to hide. Say it on the page.
   * Borrowed from the Bitbucket script.
   */
  function reportBrokenContract(reason) {
    logger.warn(`DOM contract broken: ${reason}`);
    if (document.getElementById(BADGE_ID)) return;

    const badge = document.createElement("div");
    badge.id = BADGE_ID;
    badge.textContent = `⚠️ Jira Backlog script: ${reason}`;
    badge.title = "This userscript's selectors need updating. Click to dismiss.";
    badge.addEventListener("click", () => badge.remove());
    (document.body ?? document.documentElement).append(badge);
  }

  /**
   * The dangerous drift is a renamed or translated "Origin Board" label. The
   * script would then classify every sprint as native, hide nothing, and report
   * `0 sprints hidden` -- which is indistinguishable from a backlog that
   * genuinely has no foreign sprints, so no count can catch it on its own.
   *
   * The board-name button is the second witness. If rows name another board and
   * none of them matches the marker, it is the marker that moved. Requiring the
   * marker count to be zero keeps this quiet in the case where Jira adds an
   * unrelated link button to a sprint row: the mechanism is demonstrably
   * working then, so there is nothing to report.
   */
  function checkContract({ foreign, linkRows, nameless }) {
    if (foreign.length === 0 && linkRows > 0) {
      reportBrokenContract(
        `${linkRows} sprint rows name another board, but none matches ${SEL.originBoard}`,
      );
      return;
    }
    if (nameless > 0) {
      reportBrokenContract(
        `${nameless} foreign sprint rows have no readable board name`,
      );
    }
  }

  // ----------------------------------------------------------------- control

  // The board rows are rebuilt only when the set of boards or their counts
  // changes, never on a preference change. Ticking a board rewrites the filter
  // rule and re-renders; replacing the rows each time would take the focus off
  // the checkbox you are still using.
  let boardsSignature = null;

  function ensureControl() {
    const existing = document.getElementById(CONTROL_ID);

    if (!currentBoard) {
      existing?.remove();
      return null;
    }

    if (existing?.isConnected) return existing;

    // The control is a child of `#jira-frontend`, not of the header. React
    // controls the header and can delete its children; a stylesheet reaching in
    // to anchor against it cannot be deleted. Without the header there is no
    // anchor, so wait for it rather than mount into the corner -- a later mount
    // event brings us straight back here.
    const header = document.querySelector(SEL.boardHeader);
    const mount = document.getElementById("jira-frontend") ?? document.body;
    if (!header || !mount) return null;

    const control = document.createElement("div");
    control.id = CONTROL_ID;

    const toggle = document.createElement("button");
    toggle.id = TOGGLE_ID;
    toggle.type = "button";
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-controls", PANEL_ID);
    const label = document.createElement("span");
    label.className = "gt-backlog-label";
    const caret = document.createElement("span");
    caret.className = "gt-backlog-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "▾";
    toggle.append(label, caret);
    toggle.addEventListener("click", () =>
      guard(() => {
        panelOpen = !panelOpen;
        render();
      }),
    );

    const panel = document.createElement("div");
    panel.id = PANEL_ID;

    const master = document.createElement("label");
    master.className = "gt-backlog-master";
    const masterInput = document.createElement("input");
    masterInput.id = MASTER_ID;
    masterInput.type = "checkbox";
    const masterText = document.createElement("span");
    masterText.textContent = "Hide sprints from other boards";
    master.append(masterInput, masterText);

    const boards = document.createElement("div");
    boards.id = BOARDS_ID;
    // A fresh control has an empty list of boards. Forget the signature, or
    // `ensureBoardRows` compares the counts against the rows of the control that
    // this one replaces and decides it has nothing to do.
    boardsSignature = null;

    // One delegated listener on the panel rather than one per checkbox, so
    // rebuilding the board rows has nothing to re-wire and nothing to leak.
    panel.addEventListener("change", (event) =>
      guard(() => onPanelChange(event.target)),
    );

    panel.append(master, boards);
    control.append(toggle, panel);
    mount.prepend(control);
    logger.debug(`control built for board ${currentBoard}`);
    return control;
  }

  function onPanelChange(input) {
    if (input?.id === MASTER_ID) {
      setBoardPref("enabled", input.checked);
      return;
    }

    const board = input?.dataset?.gtBoard;
    if (!board) return;

    const { reveal } = boardPrefs();
    setBoardPref(
      "reveal",
      input.checked
        ? reveal.includes(board)
          ? reveal
          : [...reveal, board]
        : reveal.filter((name) => name !== board),
    );
  }

  function ensureBoardRows(counts) {
    const signature = JSON.stringify([...counts]);
    if (signature === boardsSignature) return;
    boardsSignature = signature;

    const container = document.getElementById(BOARDS_ID);
    if (!container) return;
    container.replaceChildren();

    if (counts.size === 0) {
      const empty = document.createElement("p");
      empty.className = "gt-backlog-empty";
      empty.textContent = "No sprints from other boards on this backlog.";
      container.append(empty);
      return;
    }

    for (const [board, count] of counts) {
      const row = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.gtBoard = board;
      const name = document.createElement("span");
      name.className = "gt-backlog-name";
      name.textContent = board;
      const badge = document.createElement("span");
      badge.className = "gt-backlog-count";
      badge.textContent = String(count);
      row.append(input, name, badge);
      container.append(row);
    }
  }

  function closePanel() {
    if (!panelOpen) return;
    panelOpen = false;
    guard(render);
  }

  function onDocumentClick(event) {
    if (!panelOpen) return;
    // A click on the control is the control's own business, including the click
    // that just opened the panel.
    if (event.target?.closest?.(`#${CONTROL_ID}`)) return;
    closePanel();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") closePanel();
  }

  // ------------------------------------------------------------------ render

  // Idempotent, and the only way state reaches the page. Every signal -- route
  // change, mount, preference toggle, backstop tick -- calls this and nothing
  // else, so there is one description of what the page should look like rather
  // than a set of branches that have to agree with each other.
  function render() {
    const { enabled, reveal } = boardPrefs();

    // Written before anything else, and correct without a scan.
    document.documentElement.dataset.gtBacklogFilter =
      currentBoard && enabled ? "on" : "off";

    if (!currentBoard) {
      ensureControl();
      return;
    }

    const scan = scanSprints();
    const counts = groupByBoard(scan.foreign);

    const revealedIds = scan.foreign
      .filter(({ board }) => reveal.includes(board))
      .map(({ id }) => id);
    applyFilterCss(revealedIds);

    checkContract(scan);

    const control = ensureControl();
    if (!control) return;

    const hidden = enabled ? scan.foreign.length - revealedIds.length : 0;
    control.querySelector(".gt-backlog-label").textContent = enabled
      ? `${hidden} sprint${hidden === 1 ? "" : "s"} hidden`
      : "all sprints shown";

    const toggle = document.getElementById(TOGGLE_ID);
    toggle.title = enabled
      ? "Sprints from other boards are hidden. Click to choose which boards to show."
      : "Every sprint on this board is shown. Click to filter them again.";
    toggle.setAttribute("aria-expanded", String(panelOpen));

    ensureBoardRows(counts);
    document.getElementById(MASTER_ID).checked = enabled;
    for (const input of control.querySelectorAll("input[data-gt-board]")) {
      input.checked = reveal.includes(input.dataset.gtBoard);
    }

    document.getElementById(PANEL_ID).hidden = !panelOpen;
  }

  // ----------------------------------------------------------------- startup

  injectStyle(
    STYLE_ID,
    `@keyframes ${MOUNT_ANIMATION} {
  from { outline-color: currentColor; }
  to { outline-color: currentColor; }
}

/* Detection only: an animation that changes nothing visible, so the browser
   fires animationstart the moment a sprint row or the board header is inserted
   or re-inserted. */
${SEL.cardList},
${SEL.boardHeader} {
  animation: ${MOUNT_ANIMATION} 1ms linear;
}

/* Colours come from Atlassian's design tokens, so the control tracks whatever
   theme the user has set without having to detect it. The fallbacks are the
   token values themselves, for the case where Jira stops publishing them; the
   dark block below only swaps those fallbacks, since a live token already
   carries the right value for the active theme. */
div#${CONTROL_ID} {
  --gt-bg: var(--ds-background-neutral, #091e420f);
  --gt-bg-hover: var(--ds-background-neutral-hovered, #091e4224);
  --gt-bg-active: var(--ds-background-neutral-pressed, #091e424f);
  --gt-bg-selected: var(--ds-background-selected, #e9f2ff);
  --gt-surface: var(--ds-surface-overlay, #ffffff);
  --gt-border: var(--ds-border, #091e4224);
  --gt-shadow: var(--ds-shadow-overlay, 0 4px 8px #091e4226);
  --gt-text: var(--ds-text-subtle, #44546f);
  --gt-text-hover: var(--ds-text, #172b4d);
  --gt-text-selected: var(--ds-text-selected, #0c66e4);
  --gt-focus: var(--ds-border-focused, #388bff);

  /* Without anchor positioning the control goes to the top right corner. Not as
     good, but usable, and it cannot land on top of the board title. */
  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  /* Above the backlog list, so the panel is not cut off by it. */
  z-index: 10;
}

@media (prefers-color-scheme: dark) {
  div#${CONTROL_ID} {
    --gt-bg: var(--ds-background-neutral, #a1bdd914);
    --gt-bg-hover: var(--ds-background-neutral-hovered, #a6c5e229);
    --gt-bg-active: var(--ds-background-neutral-pressed, #bfdbf847);
    --gt-bg-selected: var(--ds-background-selected, #1c2b41);
    --gt-surface: var(--ds-surface-overlay, #282e33);
    --gt-border: var(--ds-border, #a6c5e229);
    --gt-shadow: var(--ds-shadow-overlay, 0 4px 8px #03040442);
    --gt-text: var(--ds-text-subtle, #9fadbc);
    --gt-text-hover: var(--ds-text, #b6c2cf);
    --gt-text-selected: var(--ds-text-selected, #579dff);
  }
}

/* Sized to sit inside the header line rather than tower over it, like the issue
   script's toolbar. The width cap plus the ellipsis is what keeps the label off
   the board title if the window gets narrow enough to close the gap. */
div#${CONTROL_ID} button#${TOGGLE_ID} {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-inline-size: 24ch;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: 3px;
  background: var(--gt-bg);
  color: var(--gt-text);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background 100ms ease-out, color 100ms ease-out;
}
div#${CONTROL_ID} button#${TOGGLE_ID}:hover {
  background: var(--gt-bg-hover);
  color: var(--gt-text-hover);
}
div#${CONTROL_ID} button#${TOGGLE_ID}:active {
  background: var(--gt-bg-active);
}
/* The button is keyboard-reachable, so the focus ring has to be visible.
   :focus-visible keeps it off the mouse path. */
div#${CONTROL_ID} button#${TOGGLE_ID}:focus-visible {
  outline: 2px solid var(--gt-focus);
  outline-offset: 1px;
}

/* The filter reads as pressed straight off the state attribute render already
   sets, so "is the filter on" is answerable without reading the label. */
html[data-gt-backlog-filter="on"] div#${CONTROL_ID} button#${TOGGLE_ID} {
  background: var(--gt-bg-selected);
  color: var(--gt-text-selected);
}

div#${CONTROL_ID} div#${PANEL_ID} {
  position: absolute;
  inset-block-start: calc(100% + 4px);
  inset-inline-end: 0;
  min-inline-size: 15rem;
  max-inline-size: 22rem;
  max-block-size: 60vh;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--gt-border);
  border-radius: 4px;
  background: var(--gt-surface);
  box-shadow: var(--gt-shadow);
  color: var(--gt-text-hover);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
}
div#${CONTROL_ID} div#${PANEL_ID}[hidden] {
  display: none;
}

div#${CONTROL_ID} div#${PANEL_ID} label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 3px;
  cursor: pointer;
}
div#${CONTROL_ID} div#${PANEL_ID} label:hover {
  background: var(--gt-bg-hover);
}
div#${CONTROL_ID} div#${PANEL_ID} input {
  flex: none;
  margin: 0;
  cursor: pointer;
}
div#${CONTROL_ID} label.gt-backlog-master {
  font-weight: 600;
  border-block-end: 1px solid var(--gt-border);
  border-radius: 3px 3px 0 0;
  margin-block-end: 4px;
}
div#${CONTROL_ID} span.gt-backlog-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* The count is why the panel is worth opening: it says how much each board is
   costing you before you decide to let it back in. */
div#${CONTROL_ID} span.gt-backlog-count {
  flex: none;
  padding: 0 6px;
  border-radius: 8px;
  background: var(--gt-bg);
  color: var(--gt-text);
  font-variant-numeric: tabular-nums;
}
div#${CONTROL_ID} p.gt-backlog-empty {
  margin: 0;
  padding: 4px 6px;
  color: var(--gt-text);
}

#${BADGE_ID} {
  position: fixed;
  inset-block-end: 1rem;
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

/* Anchored to the last child of the header -- the group of action buttons at
   its right end -- and placed in the free space to its left. :last-child
   rather than :nth-child(3) because it self-corrects: if Atlassian adds
   another element to the header, the anchor follows whatever is rightmost, and
   the control still sits to the left of it. Only Chromium supports this today,
   so every rule that is not about position stays outside the block. */
@supports (anchor-name: ${ANCHOR_NAME}) {
  ${SEL.boardHeader} > div:last-child {
    anchor-name: ${ANCHOR_NAME};
  }

  div#${CONTROL_ID} {
    position: absolute;
    position-anchor: ${ANCHOR_NAME};
    position-area: center left;
    inset-block-start: auto;
    inset-inline-end: auto;
    margin-inline-end: 6px;
  }
}`,
  );

  // Written before the first scan, and before React has built the list. The
  // selector is structural, so it is already right: no cached sprint data, and
  // therefore no stale month-old list, is involved in getting the first paint
  // correct. If `render` never runs at all, this is what stays on the page --
  // every foreign sprint hidden, which is the default and the safe answer.
  // Guarded, because at document-start this is the earliest the script touches
  // the document. A throw here must not take out the listeners below, which are
  // what would bring `render` back.
  guard(() => {
    applyFilterCss([]);
    document.documentElement.dataset.gtBacklogFilter =
      currentBoard && boardPrefs().enabled ? "on" : "off";
  });

  document.addEventListener("click", onDocumentClick, true);
  // Capture, because Jira binds Escape of its own and may stop the event.
  // Closing the panel does not call `preventDefault`, so Jira still gets it.
  document.addEventListener("keydown", onKeyDown, true);

  // Leaving the backlog closes the panel and forgets which boards were listed:
  // the next backlog is a different board with a different set of them.
  watchRoute(() => {
    panelOpen = false;
    boardsSignature = null;
    scheduleRender();
  });
  watchMounts(scheduleRender);
  guard(render);
})();
