// ==UserScript==
// @name         Jira UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.4.1
// @description  A toolbar on Jira issues that folds to fit the breadcrumb line: block click-to-edit, collapse the description, copy the key, name or link, and jump around the page. Fork of "Disable Jira Click Edit" by fanuch (https://gist.github.com/fanuch/1511dd5423e0c68bb9d66f63b3a9c875)
// @author       gthau
// @match        https://*.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-ux-improvements.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-ux-improvements.user.js
// @grant        none
// ==/UserScript==

/**
 * A toolbar beside the issue breadcrumbs: one small card with eight actions
 * segmented inside it, in three groups. Every action has an Alt+Shift shortcut,
 * listed in its tooltip.
 *
 * - padlock         block or allow Jira's click-to-edit on the Description.
 *                   Locked outlines the field in red; media inside it stays
 *                   clickable, so attachments still open and videos still play.
 * - chevrons        expand or collapse the Description, for quicker access to
 *                   the child issues below it.
 * - name            copy "[ABC-123] Summary".
 * - name/URL        the same, plus the issue URL.
 * - link            markdown when pasted as text, a live link when pasted into
 *                   anything that takes HTML.
 * - key             "ABC-123" on its own, for branch names and commit messages.
 * - desc.           scroll past the Description.
 * - top             scroll back to the top.
 *
 * The icons are drawn here, as strokes in `currentColor`. Emoji were the
 * previous answer: a colour nobody chose, a different drawing on every
 * platform, and no way to take the disabled colour.
 *
 * THE BREADCRUMB LINE IS NOT A FIXED AMOUNT OF ROOM -- a parent chain can be one
 * crumb or five, in any window width. So the toolbar is drawn at the widest of
 * four rungs that fits the space after the breadcrumbs, and folds a group at a
 * time as that space runs out: the four copy formats collapse into one menu,
 * then the two jumps drop their labels, then everything but the two toggles
 * goes behind a single overflow menu. Which rung fits is measured, not guessed:
 * each one is built into the real toolbar and its box read back, once, and
 * again after a resize. The two toggles never fold -- they answer a question
 * about what is on screen right now.
 *
 * The collapse choice persists across issues and sessions. The lock does not:
 * every issue starts locked, and an unlock lasts only while you are on that
 * issue, so browsing on never leaves a description editable behind you.
 *
 * Jira is a single-page app: it rewrites history rather than loading pages, and
 * it remounts the issue view on its own for tab switches, saved edits and
 * virtualised re-renders. So there are two signals and everything else is
 * derived from them -- the route (which issue, if any) and the mount (has the
 * description appeared). Both feed `render`, which is idempotent and is the
 * only thing that writes to the page.
 *
 * `@match` covers the whole site rather than /browse/ because it only governs
 * injection, and Tampermonkey evaluates it on document load, not on history
 * rewrites: landing on a board and clicking into an issue would otherwise never
 * inject the script at all. The route gate decides whether the toolbar exists.
 *
 * Fork of "Disable Jira Click Edit" by fanuch
 * (https://gist.github.com/fanuch/1511dd5423e0c68bb9d66f63b3a9c875)
 */
(function () {
  "use strict";

  // ----------------------------------------------------------------- helpers

  const LOGGER_PREFIX = "[Jira UX] ";
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

  const STYLE_ID = "gt-jira-ux-style";
  const TOOLBAR_ID = "gt-extra-buttons";
  const MOUNT_ANIMATION = "gt-jira-ux-mount";
  const COLLAPSED_HEIGHT = "200px";
  const COPY_FEEDBACK_MS = 900;

  // Breathing room between the end of the breadcrumbs and the toolbar, and the
  // amount the collapse ladder holds back when it measures the room it has.
  const TOOLBAR_GAP = 16;

  // Which of the two positions this browser gets, asked once. Chromium anchors
  // the toolbar to the breadcrumbs; everyone else gets the fixed corner, where
  // the breadcrumbs are not what bounds the space.
  const ANCHORED =
    typeof CSS !== "undefined" &&
    CSS.supports?.("anchor-name", "--gt-breadcrumbs") === true;

  // Both backstops exist for the case where the event-driven path missed
  // something, not as the primary mechanism. They cost a querySelector each.
  const MOUNT_BACKSTOP_MS = 5_000;
  const ROUTE_BACKSTOP_MS = 2_000;

  const DESCRIPTION_FIELD =
    '[data-testid="issue.views.field.rich-text.description"]';

  const SEL = {
    breadcrumbs: '[data-component-selector="breadcrumbs-wrapper"]',
    descriptionField: DESCRIPTION_FIELD,
    description: `${DESCRIPTION_FIELD} .ak-renderer-document`,
    scroller:
      '[data-testid="issue.views.issue-details.issue-layout.container-left"]',
    // Only used to build a nicer copy string; `document.title` is the fallback
    // if Jira renames this one.
    summary:
      '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
    // Jira renders attachments and inline media as interactive cards inside the
    // description. Opening a file or playing a video is a real click, not an
    // accidental edit, so the lock has to let these through.
    media: [
      '[data-testid="media-file-card-loaded-view"]',
      '[data-testid="media-file-card-view"]',
      '[data-testid="media-card-inline-player"]',
      '[data-node-type="mediaInline"]',
    ].join(","),
  };

  // ------------------------------------------------------------ preferences

  // Collapse is a standing preference: it says how you like to read a
  // description, so it persists across issues and sessions.
  const PREFS_KEY = "gt-jira-ux.prefs";
  const DEFAULT_PREFS = { collapsed: false };

  const prefs = (() => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    } catch (e) {
      logger.warn("could not read stored preferences, using defaults", e);
    }
    // Only known keys, so a preference that has since been retired -- `locked`
    // was one -- stops being written back out.
    return Object.fromEntries(
      Object.keys(DEFAULT_PREFS).map((name) => [
        name,
        stored[name] ?? DEFAULT_PREFS[name],
      ]),
    );
  })();

  function setPref(name, value) {
    prefs[name] = value;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      logger.warn("could not persist preferences", e);
    }
    render();
  }

  // Lock is deliberately not a preference. It answers "am I done poking at
  // *this* description", so it starts locked on every issue and every reload,
  // and an unlock lasts only as long as you are looking at that issue.
  let locked = true;

  function setLocked(value) {
    locked = value;
    render();
  }

  // ------------------------------------------------------------------- route

  // Anchored on the path, and it yields the key rather than a yes/no. Comparing
  // "ABC-123" with "ABC-123" means a `?focusedCommentId=`, a tab change or an
  // anchor is no longer mistaken for navigating to a different issue -- the old
  // check compared whole URLs and rebuilt everything each time one appeared.
  // A trailing segment is allowed and ignored, so a sub-tab under the same
  // issue resolves to the same key and does not count as a navigation.
  const ISSUE_PATH_RE = /^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/;

  function getIssueKey(url) {
    try {
      return (
        new URL(url, location.href).pathname.match(ISSUE_PATH_RE)?.[1] ?? null
      );
    } catch {
      return null;
    }
  }

  let currentKey = getIssueKey(location.href);

  // Jira is a single-page app: it rewrites history instead of loading pages, and
  // `history.pushState` emits no event of its own. Three layers feed one
  // callback, deduplicated on the issue key so overlap is free.
  function watchRoute(onChange) {
    const notify = (url) => {
      const key = getIssueKey(url ?? location.href);
      if (key === currentKey) return;
      logger.debug(`route: ${currentKey} -> ${key}`);
      currentKey = key;
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

  // ------------------------------------------------------------------- mount

  // The browser knows the instant React inserts the breadcrumbs or the
  // description, and will say so through `animationstart`, which bubbles. That
  // beats polling on three counts: no dead time before a first tick, no
  // permanent subtree observer over a heavy React page, and it fires again on
  // every remount -- switching issue tabs, saving an edit, a virtualised
  // re-render -- so none of those need noticing separately. Same lever as the
  // Bitbucket script's picker detection.
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

  // ---------------------------------------------------------------- handlers

  // Put the bottom edge of the description at the top of the scroll container,
  // so whatever follows it -- child issues, attachments -- comes into view.
  //
  // Measured as a position rather than taken from a height. Scrolling the
  // container to the description's own `scrollHeight` was close enough while
  // the description sat near the top and was expanded, but it drifts by however
  // much content is above it and overshoots badly once collapsed, since the
  // node still reports the height it would have had. Aligning the field's *top*
  // instead is worse again: the description already starts near the top, so
  // there is barely anything to scroll.
  function jumpDescHandler() {
    const field = document.querySelector(SEL.descriptionField);
    if (!field) return;

    const fieldBottom = field.getBoundingClientRect().bottom;
    const scroller = document.querySelector(SEL.scroller);

    if (!scroller) {
      window.scroll({ top: fieldBottom + window.scrollY, behavior: "smooth" });
      return;
    }

    scroller.scroll({
      top:
        fieldBottom - scroller.getBoundingClientRect().top + scroller.scrollTop,
      behavior: "smooth",
    });
  }

  function goToTopHandler() {
    const scroller = document.querySelector(SEL.scroller) ?? window;
    scroller.scroll({ top: 0, behavior: "smooth" });
  }

  function getIssueParts() {
    const summary = document.querySelector(SEL.summary)?.textContent?.trim();
    if (currentKey && summary) return { key: currentKey, summary };

    // Jira titles read "[ABC-123] Summary - Jira". Anchored, so a summary that
    // happens to contain " - Jira" survives; splitting on the first occurrence
    // truncated it.
    const title = document.title.replace(/\s+-\s+Jira\s*$/, "");
    const bracketed = title.match(/^\[([^\]]+)\]\s*(.*)$/);

    return bracketed
      ? { key: bracketed[1], summary: bracketed[2] }
      : { key: currentKey, summary: title };
  }

  const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  };

  function escapeHtml(text) {
    return text.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
  }

  function buildClipboard(kind) {
    const { key, summary } = getIssueParts();
    const name = key ? `[${key}] ${summary}` : summary;
    const url = location.href;

    switch (kind) {
      case "key":
        return { text: key ?? name };
      case "name":
        return { text: name };
      case "url":
        return { text: `${name} - ${url}` };
      case "link":
        // Markdown for plain-text targets and an anchor for anything that takes
        // HTML, so pasting into Confluence, Slack or a PR body yields a live
        // link rather than the markup for one. Only the key is linked and the
        // summary trails outside it: a `[KEY] Summary` label would not survive
        // markdown link syntax, which cannot nest square brackets.
        return {
          text: `[${key}](${url}) ${summary}`,
          html: `<a href="${escapeHtml(url)}">${escapeHtml(
            key,
          )}</a>&nbsp;${escapeHtml(summary)}`,
        };
      default:
        return { text: name };
    }
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

    await navigator.clipboard.writeText(text);
  }

  // No `navigator.permissions.query({name: "clipboard-write"})` gate: Firefox
  // and Safari do not recognise that permission name, so the promise rejected,
  // nothing caught it, and the copy silently never happened. Inside a click
  // handler the write needs no gate anyway.
  async function copyIssue(action, kind) {
    try {
      await writeClipboard(buildClipboard(kind));
      flash(action.id, "check");
    } catch (e) {
      logger.error("clipboard write failed", e);
      flash(action.id, "warn");
    }
  }

  // Both clipboard callbacks used to be empty, so a failed copy and a
  // successful one looked identical from the outside: nothing happened either
  // way.
  //
  // The feedback is state rather than a write straight into a button, because
  // the control an action belongs to is not always a button of its own: at a
  // narrow rung the copy formats live behind a fold, and a copy fired by its
  // shortcut from inside a closed menu still has to show something. `render` is
  // the one thing that knows where that something goes.
  let flashing = null;

  function flash(id, iconName) {
    flashing = { id, icon: iconName };
    render();
    setTimeout(
      () =>
        guard(() => {
          if (flashing?.id !== id) return;
          flashing = null;
          render();
        }),
      COPY_FEEDBACK_MS,
    );
  }

  // One capture-phase listener on the document, rather than one attached to the
  // description and re-attached on every remount. It cannot go stale, there is
  // no teardown to get wrong, and the mismatched `removeEventListener` that used
  // to throw halfway through cleanup has nothing left to be mismatched about.
  function blockClickToEdit(event) {
    if (!locked || !currentKey) return;
    if (!event.target?.closest?.(SEL.description)) return;
    if (event.target.closest(SEL.media)) return;

    event.stopPropagation();
    logger.debug(
      "blocked click-edit of the issue description. You're welcome.",
    );
  }

  // ------------------------------------------------------------------- icons

  // One 16px stroke set, drawn in `currentColor`. Emoji were the previous
  // answer and they were the wrong one: they arrive in a colour nobody here
  // chose, they are a different drawing on every platform -- three of the eight
  // fell back to a flat blue glyph on Windows -- and they cannot take the
  // disabled colour, so a disabled button still had a bright yellow key on it.
  // A stroke in `currentColor` inherits all three for free.
  //
  // THE TWO TOGGLE ICONS SAY WHAT IS, NOT WHAT A CLICK DOES. Each of them is an
  // ARIA toggle with a pressed fill, and a pressed control drawn with the icon
  // of the opposite action contradicts both the fill and what a screen reader
  // announces. Neither toggle carries a text label either, so the icon is the
  // only thing on the toolbar that can report the state at all -- the
  // description's red outline is off-screen the moment you scroll. Both pairs
  // are therefore drawn in one vocabulary: closed padlock against open padlock,
  // chevrons apart against chevrons together.
  //
  // Built with `createElementNS` rather than `innerHTML`. Namespace, because an
  // SVG built through the HTML parser is not an SVG element and does not draw
  // -- the same trap that made the toolbar's buttons stop being buttons before
  // 0.3.0. And no `innerHTML`, because a page that turns on Trusted Types would
  // make every assignment throw.
  const SVG_NS = "http://www.w3.org/2000/svg";

  const ICONS = {
    lock: [
      "M4.75 7h6.5a1.5 1.5 0 0 1 1.5 1.5v3.5a1.5 1.5 0 0 1-1.5 1.5h-6.5a1.5 1.5 0 0 1-1.5-1.5v-3.5a1.5 1.5 0 0 1 1.5-1.5z",
      "M5.5 7V4.9a2.5 2.5 0 0 1 5 0V7",
    ],
    // The same body, and a shackle that has swung open: the arc still leaves the
    // left of the body, but it stops in the air instead of coming back down.
    // The first draft of this set drew a pencil here, which put two vocabularies
    // in one pair -- a padlock says what IS, a pencil says what a click DOES --
    // so whichever way the pair was read, one of the two was lying. Both are
    // padlocks now.
    unlock: [
      "M4.75 7h6.5a1.5 1.5 0 0 1 1.5 1.5v3.5a1.5 1.5 0 0 1-1.5 1.5h-6.5a1.5 1.5 0 0 1-1.5-1.5v-3.5a1.5 1.5 0 0 1 1.5-1.5z",
      "M5.5 7V4.9a2.5 2.5 0 0 1 4.9-1",
    ],
    // The chevrons say which way the description currently stands: apart for a
    // description at full height, together for one that is folded.
    expanded: ["M4.5 5.5 8 2l3.5 3.5", "M4.5 10.5 8 14l3.5-3.5"],
    collapsed: ["M4.5 2.5 8 6l3.5-3.5", "M4.5 13.5 8 10l3.5 3.5"],
    docName: [
      "M5 2.25h6a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-8.5A1.5 1.5 0 0 1 5 2.25z",
      "M6 5.75h4M6 8h4M6 10.25h2.5",
    ],
    docUrl: [
      "M11 7.75v4.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 3 12.25v-7.5a1.5 1.5 0 0 1 1.5-1.5H8",
      "M5.5 7.25h3M5.5 9.75h3",
      "M10.5 2.25h3.25V5.5M13.75 2.25 9.75 6.25",
    ],
    link: [
      "M6.9 9.1a2.6 2.6 0 0 0 3.7 0l2-2a2.6 2.6 0 1 0-3.7-3.7l-.9.9",
      "M9.1 6.9a2.6 2.6 0 0 0-3.7 0l-2 2a2.6 2.6 0 1 0 3.7 3.7l.9-.9",
    ],
    key: ["M8.55 10.3a2.85 2.85 0 1 1-5.7 0 2.85 2.85 0 0 1 5.7 0z", "M7.7 8.3 13.2 2.8", "M10.6 5.4l1.7 1.7"],
    jumpDown: ["M8 2.5v7.6", "M4.9 7.3 8 10.4l3.1-3.1", "M3.5 13.4h9"],
    jumpTop: ["M3.5 2.6h9", "M8 13.5V5.9", "M4.9 9 8 5.9 11.1 9"],
    copy: [
      "M7.25 5.75h4.5a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-4.5a1.5 1.5 0 0 1-1.5-1.5v-4.5a1.5 1.5 0 0 1 1.5-1.5z",
      "M10.25 3.25h-6a1.5 1.5 0 0 0-1.5 1.5v6",
    ],
    // Three dots, drawn as three zero-length segments with a round cap. A dot
    // per `<circle>` would need a second element type in `icon` below.
    more: ["M3.6 8h.01", "M8 8h.01", "M12.4 8h.01"],
    chevron: ["M4.5 6.5 8 10l3.5-3.5"],
    check: ["M3 8.6 6.3 12 13 4.6"],
    warn: ["M8 2.8 14 13H2z", "M8 6.6v3", "M8 11.2h.01"],
  };

  function icon(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("data-gt-icon", name);
    svg.setAttribute("class", "gt-icon");

    for (const d of ICONS[name] ?? []) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return svg;
  }

  // ----------------------------------------------------------------- actions

  // Eight actions, in three groups. A group is not decoration: it is the unit
  // the ladder below folds, and the unit the separators draw.
  //
  // Labels and icons are functions of the current state rather than values
  // written at build time, so a redraw cannot leave a control showing one thing
  // while the state says another.
  const ACTIONS = [
    {
      id: "gt-toggle-lock",
      group: "state",
      needsDescription: true,
      icon: () => (locked ? "lock" : "unlock"),
      label: () => "",
      pressed: () => locked,
      menuLabel: () => (locked ? "Allow click-to-edit" : "Block click-to-edit"),
      title: () =>
        locked
          ? "Description is locked: click-to-edit is blocked"
          : "Description is editable: click to lock it, or just browse to another issue",
      run: () => setLocked(!locked),
    },
    {
      id: "gt-toggle-collapse",
      group: "state",
      needsDescription: true,
      icon: () => (prefs.collapsed ? "collapsed" : "expanded"),
      label: () => "",
      pressed: () => prefs.collapsed,
      menuLabel: () => (prefs.collapsed ? "Expand the description" : "Collapse the description"),
      title: () =>
        prefs.collapsed
          ? "Description is collapsed: click to expand it"
          : "Description is expanded: click to collapse it",
      run: () => setPref("collapsed", !prefs.collapsed),
    },
    {
      id: "gt-copy-name",
      group: "copy",
      icon: () => "docName",
      label: () => "name",
      menuLabel: () => "Copy the key and summary",
      title: () => "Copy the issue key and summary",
      run: (action) => copyIssue(action, "name"),
    },
    {
      id: "gt-copy-name-url",
      group: "copy",
      icon: () => "docUrl",
      label: () => "name/URL",
      menuLabel: () => "Copy the key, summary and URL",
      title: () => "Copy the issue key, summary and URL",
      run: (action) => copyIssue(action, "url"),
    },
    {
      id: "gt-copy-link",
      group: "copy",
      icon: () => "link",
      label: () => "link",
      menuLabel: () => "Copy as a link",
      title: () =>
        "Copy as a link: markdown when pasted as text, a live link when pasted into an editor",
      run: (action) => copyIssue(action, "link"),
    },
    {
      id: "gt-copy-key",
      group: "copy",
      icon: () => "key",
      label: () => "key",
      menuLabel: () => "Copy the key on its own",
      title: () => "Copy the issue key on its own, for branches and commits",
      run: (action) => copyIssue(action, "key"),
    },
    {
      id: "gt-jump-description",
      group: "move",
      needsDescription: true,
      icon: () => "jumpDown",
      label: () => "desc.",
      menuLabel: () => "Scroll past the description",
      title: () => "Scroll past the description",
      run: jumpDescHandler,
    },
    {
      id: "gt-go-top",
      group: "move",
      icon: () => "jumpTop",
      label: () => "top",
      menuLabel: () => "Scroll back to the top",
      title: () => "Scroll back to the top",
      run: goToTopHandler,
    },
  ];

  const actionsIn = (group) => ACTIONS.filter((action) => action.group === group);
  const actionById = (id) => ACTIONS.find((action) => action.id === id);

  // Set once per render, so eight enabled-checks and up to six menu items do not
  // each run their own querySelector.
  let described = false;

  const isEnabled = (action) => !(action.needsDescription && !described);

  // --------------------------------------------------------------- the ladder

  // The breadcrumb line is not a fixed amount of room. It is whatever is left
  // after a parent chain that can be one crumb or five, in a window that can be
  // any width, beside a sidebar that opens and closes. So the toolbar is drawn
  // at the widest rung that fits and folds a group at a time as the room runs
  // out. The two toggles never fold: they are the ones that answer a question
  // about what is on screen right now.
  const TIERS = [
    { key: "full", copy: "buttons", move: "labels" },
    { key: "tight", copy: "menu", move: "labels" },
    { key: "compact", copy: "menu", move: "icons" },
    { key: "minimal", copy: "overflow", move: "overflow" },
  ];

  const COPY_TRIGGER_ID = "gt-copy-menu";
  const MORE_TRIGGER_ID = "gt-more-menu";

  // Which rung a width buys is measured, never guessed: each rung is built into
  // the real toolbar and its box is read back. Building four and keeping one
  // costs nothing visible, because layout is synchronous and no frame is painted
  // in the middle of it -- and the measurement is of the real element, with the
  // real font and the real border, rather than of a copy that would have to be
  // kept in step with the sheet.
  //
  // Measured once and cached. Nothing about a rung's width depends on the
  // state: the labels are fixed strings and a disabled button is the same size
  // as an enabled one. A resize is the one thing that can invalidate it, and it
  // says so by clearing this.
  let tierWidths = null;

  function measureTiers(toolbar) {
    const widths = {};
    for (const tier of TIERS) {
      fillToolbar(toolbar, tier.key, null);
      widths[tier.key] = toolbar.getBoundingClientRect().width;
    }
    // Whatever is in the toolbar now is the last probe, not a choice.
    builtSignature = null;
    return widths;
  }

  // The two boxes the measurement reads. Looked up once per render and passed
  // along, because the observer below has to watch exactly these and nothing
  // else.
  function roomNodes() {
    const header = document.getElementById("jira-issue-header");
    return {
      header,
      breadcrumbs: header?.querySelector(SEL.breadcrumbs) ?? null,
    };
  }

  // The room the toolbar has: from where the breadcrumbs end to where their
  // header ends. Not the window -- a deep parent chain eats this space without
  // the window changing at all, and that is the common case rather than the
  // exotic one.
  function availableWidth({ header, breadcrumbs }) {
    // In the fixed corner the breadcrumbs are not the constraint; the viewport
    // is, and there is plenty of it.
    if (!ANCHORED || !header || !breadcrumbs) {
      return document.documentElement.clientWidth - TOOLBAR_GAP * 2;
    }

    return (
      header.getBoundingClientRect().right -
      breadcrumbs.getBoundingClientRect().right -
      TOOLBAR_GAP
    );
  }

  function chooseTier(toolbar, nodes) {
    tierWidths ??= measureTiers(toolbar);
    const room = availableWidth(nodes);
    const fits = TIERS.find((tier) => tierWidths[tier.key] <= room);
    return (fits ?? TIERS[TIERS.length - 1]).key;
  }

  // WATCHING THE ROOM, not the window. 0.4.0 listened for `resize` and nothing
  // else, which answers a different question than the one the ladder asks: the
  // space after the breadcrumbs changes when a sidebar opens, when a panel
  // closes, and when Jira's own layout lands a few frames after a window
  // resize has already been reported. None of those is a `resize` event, so
  // the only thing that noticed was the five-second backstop -- measured at a
  // full five seconds of a toolbar left at the wrong rung.
  //
  // A ResizeObserver answers the question that was actually asked, and it
  // reports AFTER layout rather than before it. It is not the observer §4 of
  // the document rejects: that one watches a React subtree for mutations. This
  // one watches two boxes.
  //
  // It cannot feed itself. The toolbar is absolutely positioned in the anchored
  // branch and fixed in the other, so it is out of flow either way and its own
  // size can never change the box of the header or of the breadcrumbs.
  const roomObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => scheduleRender())
      : null;

  let observedHeader = null;
  let observedBreadcrumbs = null;

  // React replaces both of these on a remount, and an observer left on a
  // detached node reports nothing, so every render checks whether the node it
  // is watching is still the node on the page.
  function watchRoom({ header, breadcrumbs }) {
    if (!roomObserver) return;

    if (header !== observedHeader) {
      if (observedHeader) roomObserver.unobserve(observedHeader);
      observedHeader = header;
      if (header) roomObserver.observe(header);
    }

    if (breadcrumbs !== observedBreadcrumbs) {
      if (observedBreadcrumbs) roomObserver.unobserve(observedBreadcrumbs);
      observedBreadcrumbs = breadcrumbs;
      if (breadcrumbs) roomObserver.observe(breadcrumbs);
    }
  }

  // One redraw per turn at most, however many signals arrive in it. A zoom
  // changes what each rung measures, so that path says so; a box that changed
  // size does not.
  //
  // A timeout and not `requestAnimationFrame`, for two reasons pointing the
  // same way. A hidden tab runs no animation frames, so a sidebar dragged and
  // the tab switched back would have waited for the backstop anyway. And the
  // observer above already reports after layout, so there is nothing left to
  // wait a frame for -- deferring out of the observer's own callback is also
  // what stops a write from feeding back into it.
  let renderTimer = null;

  function scheduleRender({ remeasure = false } = {}) {
    if (remeasure) tierWidths = null;
    if (renderTimer) return;
    renderTimer = setTimeout(() => {
      renderTimer = null;
      guard(render);
    }, 0);
  }

  // ----------------------------------------------------------------- toolbar

  // Which menu is open, by the id of the control that opens it. Part of the
  // state like everything else, so `render` draws it rather than a click
  // handler reaching into the page behind `render`'s back.
  let menuOpen = null;

  // What the toolbar currently holds, as `tier|menu`. `render` runs on two
  // backstop timers, and rebuilding the toolbar twice a second would flicker,
  // drop hover and close a menu under the pointer. So a redraw that changes
  // neither only refreshes the labels.
  let builtSignature = null;

  function separator() {
    const span = document.createElement("span");
    span.className = "gt-sep";
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  function control(action, labelled) {
    const button = document.createElement("button");
    button.id = action.id;
    button.type = "button";
    if (!labelled) button.className = "gt-icon-only";
    button.append(icon(action.icon()));

    if (labelled) {
      const label = document.createElement("span");
      label.className = "gt-label";
      label.textContent = action.label();
      button.append(label);
    }

    button.addEventListener("click", () => guard(() => activate(action.id)));
    return button;
  }

  // A fold: one button that stands for several actions. It carries the ids it
  // holds, which is how a shortcut for a folded action finds something to flash
  // and how the menu knows what to list.
  function foldTrigger(id, iconName, title, held) {
    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.className = "gt-icon-only gt-fold";
    button.title = title;
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", String(menuOpen === id));
    button.dataset.gtHolds = held.map((action) => action.id).join(" ");
    button.append(icon(iconName), icon("chevron"));

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      guard(() => {
        menuOpen = menuOpen === id ? null : id;
        render();
      });
    });
    return button;
  }

  function menuFor(trigger) {
    const menu = document.createElement("div");
    menu.className = "gt-menu";
    menu.setAttribute("role", "menu");

    let group = null;
    for (const id of trigger.dataset.gtHolds.split(" ")) {
      const action = actionById(id);
      if (!action) continue;

      if (group !== null && action.group !== group) {
        const rule = document.createElement("hr");
        rule.setAttribute("aria-hidden", "true");
        menu.append(rule);
      }
      group = action.group;

      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.dataset.gtFor = action.id;
      item.disabled = !isEnabled(action);
      item.append(icon(action.icon()));

      const label = document.createElement("span");
      label.className = "gt-label";
      label.textContent = action.menuLabel();

      const hint = document.createElement("span");
      hint.className = "gt-hint";
      hint.textContent = SHORTCUT_HINT[action.id] ?? "";

      item.append(label, hint);
      // `activate` redraws, and `menuOpen` is already null by then, so the menu
      // closes on the way out.
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        guard(() => {
          menuOpen = null;
          activate(action.id);
        });
      });
      menu.append(item);
    }
    return menu;
  }

  function fillToolbar(toolbar, tierKey, openMenu) {
    const tier = TIERS.find((entry) => entry.key === tierKey) ?? TIERS[0];
    toolbar.replaceChildren();
    toolbar.dataset.gtTier = tier.key;

    for (const action of actionsIn("state")) toolbar.append(control(action, false));

    if (tier.copy === "buttons") {
      toolbar.append(separator());
      for (const action of actionsIn("copy")) toolbar.append(control(action, true));
    } else if (tier.copy === "menu") {
      toolbar.append(separator());
      toolbar.append(
        foldTrigger(COPY_TRIGGER_ID, "copy", "Copy this issue", actionsIn("copy")),
      );
    }

    toolbar.append(separator());

    if (tier.move === "overflow") {
      toolbar.append(
        foldTrigger(
          MORE_TRIGGER_ID,
          "more",
          "The rest of the toolbar",
          actionsIn("copy").concat(actionsIn("move")),
        ),
      );
    } else {
      for (const action of actionsIn("move")) {
        toolbar.append(control(action, tier.move === "labels"));
      }
    }

    // The menu is a child of the toolbar, so it is positioned against it and
    // goes away with it. `data-gt-menu` lifts the toolbar's z-index while it is
    // open: beside the breadcrumbs the toolbar deliberately sits at z-index 1,
    // which is under anything of Jira's that paints over the page.
    const trigger = openMenu ? toolbar.querySelector(`#${openMenu}`) : null;
    toolbar.dataset.gtMenu = trigger ? "open" : "closed";
    if (trigger) toolbar.append(menuFor(trigger));
  }

  // The one door. A click and a shortcut both come through here, so the
  // disabled rule, the copy feedback and the fold are described once -- and a
  // shortcut still works for an action that the current rung has folded into a
  // menu, which is the thing that would otherwise have quietly broken.
  function activate(id) {
    const action = actionById(id);
    if (action && isEnabled(action)) action.run(action);
    // Unconditionally, and not left to the action: two of the eight only scroll,
    // and a scroll changes no state, so nothing else would redraw. An action
    // reached from an open menu would then leave that menu on the screen.
    render();
  }

  // Where an action's feedback shows: its own button, or the fold that holds it.
  function controlFor(id) {
    const toolbar = document.getElementById(TOOLBAR_ID);
    if (!toolbar) return null;
    return (
      toolbar.querySelector(`#${id}`) ??
      toolbar.querySelector(`[data-gt-holds~="${id}"]`)
    );
  }

  // --------------------------------------------------------------- shortcuts

  // Alt+Shift rather than bare letters: Jira binds plenty of single keys of its
  // own. Each one names an action, and `activate` is the same door a click uses.
  const SHORTCUTS = {
    KeyL: "gt-toggle-lock",
    KeyE: "gt-toggle-collapse",
    KeyN: "gt-copy-name",
    KeyU: "gt-copy-name-url",
    KeyM: "gt-copy-link",
    KeyI: "gt-copy-key",
    KeyD: "gt-jump-description",
    KeyT: "gt-go-top",
  };

  const SHORTCUT_HINT = Object.fromEntries(
    Object.entries(SHORTCUTS).map(([code, id]) => [
      id,
      `Alt+Shift+${code.replace("Key", "")}`,
    ]),
  );

  function onKeyDown(event) {
    if (event.key === "Escape" && menuOpen) {
      menuOpen = null;
      guard(render);
      return;
    }

    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    // Never steal a key from a field the user is typing in. Jira has plenty.
    const target = event.target;
    if (
      target?.isContentEditable ||
      /^(?:INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "")
    ) {
      return;
    }

    // `event.code`, not `event.key`: Option+Shift on macOS produces a different
    // character altogether.
    const id = SHORTCUTS[event.code];
    if (!id || !currentKey || !document.getElementById(TOOLBAR_ID)) return;

    event.preventDefault();
    menuOpen = null;
    guard(() => activate(id));
  }

  // A click anywhere else closes an open menu. The toolbar's own clicks stop at
  // their handlers, so this only ever sees the outside.
  function onDocumentClick(event) {
    if (!menuOpen) return;
    if (event.target?.closest?.(`#${TOOLBAR_ID}`)) return;
    menuOpen = null;
    guard(render);
  }

  function ensureToolbar() {
    const existing = document.getElementById(TOOLBAR_ID);

    if (!currentKey) {
      existing?.remove();
      builtSignature = null;
      menuOpen = null;
      return null;
    }

    if (existing?.isConnected) return existing;

    const breadcrumbs = document
      .getElementById("jira-issue-header")
      ?.querySelector(SEL.breadcrumbs);
    // <body>, not `#jira-frontend`. `#jira-frontend` is the container React
    // hydrates the server-rendered page into, and a node prepended ahead of
    // that server markup is a hydration mismatch: React throws the whole
    // server tree away and rebuilds it on the client. That is the skeleton
    // coming back a second after the issue was already readable, and the two
    // to three seconds spent filling it in again. The toolbar went with it, so
    // the backstop rebuilt it and the damage looked like it had come from
    // somewhere else. Confirmed against React 18 in a headless Chrome:
    // prepending into the container reports "the entire root will switch to
    // client rendering" and replaces the server node; appending to <body>
    // hydrates clean. Anchor positioning does not care who the parent is --
    // only that the breadcrumbs carry the anchor name -- so the toolbar still
    // lands in the same place, measured both ways in the same harness.
    const mount = document.body;
    // Not up yet. A later mount event brings us straight back here, which is
    // exactly what the old one-shot `setTimeout(..., 1000)` could not do: it
    // lost the race on a slow load and never tried again, so a missing toolbar
    // stayed missing for the life of the tab.
    if (!breadcrumbs || !mount) return null;

    const toolbar = document.createElement("div");
    toolbar.id = TOOLBAR_ID;
    mount.append(toolbar);

    // A new element, so nothing measured about the old one still holds.
    builtSignature = null;
    tierWidths = null;

    logger.debug(`toolbar built for ${currentKey}`);
    return toolbar;
  }

  // Idempotent, and the only way state reaches the page. Every signal -- route
  // change, mount, preference toggle, resize, backstop tick -- calls this and
  // nothing else, so there is one description of what the page should look like
  // rather than a set of branches that have to agree with each other.
  function render() {
    const root = document.documentElement;
    root.dataset.gtJiraLocked = String(locked);
    root.dataset.gtJiraCollapsed = String(prefs.collapsed);

    const toolbar = ensureToolbar();
    if (!toolbar) return;

    // Nothing to lock, collapse or scroll past until the description mounts.
    described = !!document.querySelector(SEL.description);

    const nodes = roomNodes();
    watchRoom(nodes);

    const tier = chooseTier(toolbar, nodes);
    const signature = `${tier}|${menuOpen ?? ""}`;
    if (signature !== builtSignature) {
      fillToolbar(toolbar, tier, menuOpen);
      builtSignature = signature;
    }

    for (const action of ACTIONS) {
      const button = toolbar.querySelector(`#${action.id}`);
      if (!button) continue;
      const hint = SHORTCUT_HINT[action.id];
      button.title = hint ? `${action.title()} (${hint})` : action.title();
      button.disabled = !isEnabled(action);
      if (action.pressed) button.setAttribute("aria-pressed", String(action.pressed()));
      button.replaceChild(icon(action.icon()), button.firstChild);
    }

    for (const item of toolbar.querySelectorAll("[data-gt-for]")) {
      const action = actionById(item.dataset.gtFor);
      if (!action) continue;
      item.disabled = !isEnabled(action);
      item.replaceChild(icon(action.icon()), item.firstChild);
    }

    // Last, so it wins over the icon each control has just been given back.
    if (flashing) {
      const button = controlFor(flashing.id);
      if (button) button.replaceChild(icon(flashing.icon), button.firstChild);
    }
  }

  // ----------------------------------------------------------------- startup

  injectStyle(
    STYLE_ID,
    `@keyframes ${MOUNT_ANIMATION} {
  from { outline-color: currentColor; }
  to { outline-color: currentColor; }
}

/* Detection only: an animation that changes nothing visible, so the browser
   fires animationstart the moment either node is inserted or re-inserted. */
${SEL.breadcrumbs},
${SEL.description} {
  animation: ${MOUNT_ANIMATION} 1ms linear;
}

/* Lock and collapse are rules keyed off the root element rather than inline
   styles written onto the description. A stylesheet is applied by the browser
   to every matching node, including the ones React has not created yet, so both
   survive remounts for free -- the same lever the fixVersion script uses for
   its ::after rules. Outline rather than border, so locking does not reflow
   the description. */
html[data-gt-jira-locked="true"] ${SEL.description} {
  outline: 1px solid var(--ds-border-danger, #e2483d);
  outline-offset: 2px;
  border-radius: 3px;
}

html[data-gt-jira-collapsed="true"] ${SEL.description} {
  max-height: ${COLLAPSED_HEIGHT};
  overflow-y: auto;
}

/* Colours come from Atlassian's design tokens, so the toolbar tracks whatever
   theme the user has set without having to detect it. The fallbacks are the
   token values themselves, for the case where Jira stops publishing them; the
   dark block below only swaps those fallbacks, since a live token already
   carries the right value for the active theme. */
div#${TOOLBAR_ID} {
  --gt-surface: var(--ds-surface-overlay, #ffffff);
  --gt-border: var(--ds-border, #091e4224);
  --gt-shadow: var(--ds-shadow-overlay, 0 4px 8px #091e4226);
  --gt-text: var(--ds-text-subtle, #44546f);
  --gt-text-strong: var(--ds-text, #172b4d);
  --gt-text-disabled: var(--ds-text-disabled, #091e424f);
  --gt-text-hint: var(--ds-text-subtlest, #626f86);
  --gt-hover: var(--ds-background-neutral-subtle-hovered, #091e4214);
  --gt-pressed: var(--ds-background-neutral-hovered, #091e4224);
  --gt-selected: var(--ds-background-selected, #e9f2ff);
  --gt-selected-text: var(--ds-text-selected, #0c66e4);
  --gt-focus: var(--ds-border-focused, #388bff);

  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  /* This corner is inside Jira's own global navigation band, which paints above
     a low z-index: at z-index 1 the toolbar was not merely in a poor position,
     it was invisible. Only the fallback path reaches this rule, so no Chromium
     user has ever seen it -- Firefox users see nothing else. 9999 is the value
     a separate harness confirmed nothing of Jira's covers. The anchored branch
     below keeps z-index 1, so the position that Chromium uses is unchanged and
     the toolbar still cannot paint over one of Jira's own dialogs. */
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 0;

  /* One surface with the buttons segmented inside it, rather than eight
     separately filled chips. It reads as a single tool, it is findable at a
     glance, and in the fixed corner -- where it floats over the navigation band
     and over whatever colour happens to be under it -- the surface is what makes
     it legible at all. */
  padding: 2px;
  border: 1px solid var(--gt-border);
  border-radius: 6px;
  background: var(--gt-surface);
  box-shadow: var(--gt-shadow);
  box-sizing: border-box;
  font-family: inherit;
}

@media (prefers-color-scheme: dark) {
  div#${TOOLBAR_ID} {
    --gt-surface: var(--ds-surface-overlay, #282e33);
    --gt-border: var(--ds-border, #a6c5e229);
    --gt-shadow: var(--ds-shadow-overlay, 0 4px 8px #03040442);
    --gt-text: var(--ds-text-subtle, #9fadbc);
    --gt-text-strong: var(--ds-text, #b6c2cf);
    --gt-text-disabled: var(--ds-text-disabled, #bfdbf847);
    --gt-text-hint: var(--ds-text-subtlest, #8c9bab);
    --gt-hover: var(--ds-background-neutral-subtle-hovered, #a6c5e21f);
    --gt-pressed: var(--ds-background-neutral-hovered, #a6c5e229);
    --gt-selected: var(--ds-background-selected, #1c2b41);
    --gt-selected-text: var(--ds-text-selected, #579dff);
  }
}

/* Sized to sit inside the breadcrumb line rather than tower over it: 26px tall,
   no border of its own, and the label at the breadcrumbs' own weight. */
div#${TOOLBAR_ID} button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 26px;
  padding: 0 7px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--gt-text);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 100ms ease-out, color 100ms ease-out;
}
div#${TOOLBAR_ID} button.gt-icon-only {
  padding: 0;
  min-width: 26px;
}
div#${TOOLBAR_ID} button.gt-fold {
  min-width: 34px;
  gap: 1px;
}
div#${TOOLBAR_ID} button:hover:not(:disabled) {
  background: var(--gt-hover);
  color: var(--gt-text-strong);
}
div#${TOOLBAR_ID} button:active:not(:disabled) {
  background: var(--gt-pressed);
}
/* The buttons are keyboard-reachable, so the focus ring has to be visible.
   :focus-visible keeps it off the mouse path. */
div#${TOOLBAR_ID} button:focus-visible {
  outline: 2px solid var(--gt-focus);
  outline-offset: 1px;
}
/* The two toggles read as pressed straight off the ARIA state, so "is it
   locked" is answerable without reading the icon. */
div#${TOOLBAR_ID} button[aria-pressed="true"]:not(:disabled),
div#${TOOLBAR_ID} button[aria-expanded="true"]:not(:disabled) {
  background: var(--gt-selected);
  color: var(--gt-selected-text);
}
/* Last, because a disabled button still matches :hover. */
div#${TOOLBAR_ID} button:disabled {
  background: transparent;
  color: var(--gt-text-disabled);
  cursor: not-allowed;
}

div#${TOOLBAR_ID} .gt-icon {
  flex: none;
  display: block;
}
/* Three dots want a fatter stroke than three lines do. */
div#${TOOLBAR_ID} .gt-icon[data-gt-icon="more"] {
  stroke-width: 2;
}
div#${TOOLBAR_ID} .gt-icon[data-gt-icon="chevron"] {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

/* The separators are what turn eight controls into three groups. */
div#${TOOLBAR_ID} .gt-sep {
  flex: none;
  align-self: stretch;
  width: 1px;
  margin: 3px 5px;
  background: var(--gt-border);
}

/* The fold. A menu of the actions this rung had no room for. */
div#${TOOLBAR_ID} .gt-menu {
  position: absolute;
  inset-block-start: calc(100% + 5px);
  inset-inline-end: 0;
  min-width: 250px;
  padding: 4px;
  border: 1px solid var(--gt-border);
  border-radius: 6px;
  background: var(--gt-surface);
  box-shadow: var(--gt-shadow);
  display: flex;
  flex-direction: column;
}
div#${TOOLBAR_ID} .gt-menu button {
  justify-content: flex-start;
  gap: 9px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  color: var(--gt-text-strong);
  font-size: 14px;
  font-weight: 400;
}
div#${TOOLBAR_ID} .gt-menu .gt-hint {
  margin-inline-start: auto;
  padding-inline-start: 14px;
  color: var(--gt-text-hint);
  font-size: 11px;
}
div#${TOOLBAR_ID} .gt-menu hr {
  width: calc(100% - 4px);
  margin: 4px 2px;
  border: none;
  border-block-start: 1px solid var(--gt-border);
}

/* The anchor name is namespaced because this rule matches every breadcrumbs
   wrapper on the page, not just the issue header's. */
@supports (anchor-name: --gt-breadcrumbs) {
  ${SEL.breadcrumbs} {
    anchor-name: --gt-breadcrumbs;
  }

  div#${TOOLBAR_ID} {
    position: absolute;
    position-anchor: --gt-breadcrumbs;
    position-area: center right;
    inset-block-start: auto;
    inset-inline-end: auto;
    margin-inline-start: 8px;
    /* Back to 1. The toolbar sits beside the breadcrumbs here, inside Jira's
       own tree, where it must not paint over a dialog. The high value above is
       for the fixed corner only. */
    z-index: 1;
  }

  /* Except while a menu is open, which is a thing the user asked for and has to
     be able to see. It goes back down the moment the menu closes. */
  div#${TOOLBAR_ID}[data-gt-menu="open"] {
    z-index: 20;
  }
}`,
  );

  document.addEventListener("click", blockClickToEdit, true);
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeyDown, true);

  // A remount within one issue leaves the lock alone -- saving an edit should
  // not slam the description shut under you -- but arriving at a different
  // issue starts locked again.
  watchRoute(() => {
    locked = true;
    menuOpen = null;
    render();
  });
  watchMounts(render);

  // The observer above catches a window resize too, by way of the header it
  // resizes. This one is still here for the case the observer cannot see: a
  // zoom, which changes what every rung measures without necessarily changing
  // any box the observer watches.
  window.addEventListener("resize", () => scheduleRender({ remeasure: true }));

  guard(render);

  // The first measurement happens in whatever font is resolved at that moment.
  // If Jira's own face arrives later, every label is a different width and the
  // rung chosen was chosen against the wrong numbers.
  document.fonts?.ready.then(() => scheduleRender({ remeasure: true }));
})();
