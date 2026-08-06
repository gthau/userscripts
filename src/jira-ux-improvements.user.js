// ==UserScript==
// @name         Jira UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  A toolbar on Jira issues: block click-to-edit, collapse the description, copy the key, name or link, and jump around the page. Fork of "Disable Jira Click Edit" by fanuch (https://gist.github.com/fanuch/1511dd5423e0c68bb9d66f63b3a9c875)
// @author       gthau
// @match        https://*.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-ux-improvements.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-ux-improvements.user.js
// @grant        none
// ==/UserScript==

/**
 * A toolbar beside the issue breadcrumbs. Each button has an Alt+Shift
 * shortcut, listed in its tooltip.
 *
 * - 🔒 / ✏️      block or allow Jira's click-to-edit on the Description.
 *                Locked outlines the field in red; media inside it stays
 *                clickable, so attachments still open and videos still play.
 * - ⏬ / ⏩      expand or collapse the Description, for quicker access to the
 *                child issues below it.
 * - 📃 name      copy "[ABC-123] Summary".
 * - 📃 name/URL  the same, plus the issue URL.
 * - 🔗 link      markdown when pasted as text, a live link when pasted into
 *                anything that takes HTML.
 * - 🔑 key       "ABC-123" on its own, for branch names and commit messages.
 * - ⤵️ desc.     scroll past the Description.
 * - ⤴️ top       scroll back to the top.
 *
 * The lock and collapse choices persist across issues and sessions.
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

  // Lock and collapse are the only real state here -- everything else is read
  // back off the DOM. They used to reset on every navigation, which made
  // locking the description a per-issue chore.
  const PREFS_KEY = "gt-jira-ux.prefs";
  const DEFAULT_PREFS = { locked: true, collapsed: false };

  const prefs = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      return { ...DEFAULT_PREFS, ...stored };
    } catch (e) {
      logger.warn("could not read stored preferences, using defaults", e);
      return { ...DEFAULT_PREFS };
    }
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

  // ------------------------------------------------------------------- route

  // Anchored on the path, and it yields the key rather than a yes/no. Comparing
  // "ABC-123" with "ABC-123" means a `?focusedCommentId=`, a tab change or an
  // anchor is no longer mistaken for navigating to a different issue -- the old
  // check compared whole URLs and rebuilt everything each time one appeared.
  const ISSUE_PATH_RE = /^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)\/?$/;

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

  function jumpDescHandler() {
    const field = document.querySelector(SEL.descriptionField);
    if (!field) return;

    // Land on whatever follows the description -- child issues, attachments.
    // Scrolling the container to the description's own `scrollHeight` used a
    // length as though it were a position: with content above it a short
    // description never cleared itself, and a collapsed one reported the height
    // it would have had expanded and overshot.
    const target = field.nextElementSibling ?? field;
    target.scrollIntoView({ block: "start", behavior: "smooth" });
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
        // link rather than the markup for one. Square brackets are dropped from
        // the label because they would not survive markdown link syntax.
        return {
          text: `[${[key, summary].filter(Boolean).join(" ")}](${url})`,
          html: `<a href="${escapeHtml(url)}">${escapeHtml(
            [key, summary].filter(Boolean).join(" "),
          )}</a>`,
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
  async function copyIssue(button, kind) {
    try {
      await writeClipboard(buildClipboard(kind));
      flash(button, "✅");
    } catch (e) {
      logger.error("clipboard write failed", e);
      flash(button, "⚠️");
    }
  }

  // Both clipboard callbacks used to be empty, so a failed copy and a
  // successful one looked identical from the outside: nothing happened either
  // way. `render` puts the real label back.
  function flash(button, label) {
    button.textContent = label;
    setTimeout(() => guard(render), COPY_FEEDBACK_MS);
  }

  // One capture-phase listener on the document, rather than one attached to the
  // description and re-attached on every remount. It cannot go stale, there is
  // no teardown to get wrong, and the mismatched `removeEventListener` that used
  // to throw halfway through cleanup has nothing left to be mismatched about.
  function blockClickToEdit(event) {
    if (!prefs.locked || !currentKey) return;
    if (!event.target?.closest?.(SEL.description)) return;
    if (event.target.closest(SEL.media)) return;

    event.stopPropagation();
    logger.debug(
      "blocked click-edit of the issue description. You're welcome.",
    );
  }

  // ----------------------------------------------------------------- toolbar

  // Labels and tooltips are functions of the current state rather than values
  // written at build time, so `render` cannot leave a button showing one thing
  // while the state says another.
  const BUTTONS = [
    {
      id: "gt-toggle-lock",
      needsDescription: true,
      label: () => (prefs.locked ? "🔒" : "✏️"),
      title: () =>
        prefs.locked
          ? "Description is locked: click-to-edit is blocked"
          : "Description is editable: click to lock it",
      onClick: () => setPref("locked", !prefs.locked),
    },
    {
      id: "gt-toggle-collapse",
      needsDescription: true,
      label: () => (prefs.collapsed ? "⏩" : "⏬"),
      title: () =>
        prefs.collapsed
          ? "Description is collapsed: click to expand it"
          : "Description is expanded: click to collapse it",
      onClick: () => setPref("collapsed", !prefs.collapsed),
    },
    {
      id: "gt-copy-name",
      label: () => "📃 name",
      title: () => "Copy the issue key and summary",
      onClick: (button) => copyIssue(button, "name"),
    },
    {
      id: "gt-copy-name-url",
      label: () => "📃 name/URL",
      title: () => "Copy the issue key, summary and URL",
      onClick: (button) => copyIssue(button, "url"),
    },
    {
      id: "gt-copy-link",
      label: () => "🔗 link",
      title: () =>
        "Copy as a link: markdown when pasted as text, a live link when pasted into an editor",
      onClick: (button) => copyIssue(button, "link"),
    },
    {
      id: "gt-copy-key",
      label: () => "🔑 key",
      title: () => "Copy the issue key on its own, for branches and commits",
      onClick: (button) => copyIssue(button, "key"),
    },
    {
      id: "gt-jump-description",
      needsDescription: true,
      label: () => "⤵️ desc.",
      title: () => "Scroll past the description",
      onClick: jumpDescHandler,
    },
    {
      id: "gt-go-top",
      label: () => "⤴️ top",
      title: () => "Scroll back to the top",
      onClick: goToTopHandler,
    },
  ];

  // --------------------------------------------------------------- shortcuts

  // Alt+Shift rather than bare letters: Jira binds plenty of single keys of its
  // own. Each one names a button rather than a handler, so the disabled state,
  // the flash feedback and the toolbar's own wiring are shared rather than
  // reimplemented -- and a shortcut does nothing on a page with no toolbar.
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
    const button = document.getElementById(SHORTCUTS[event.code] ?? "");
    if (!button || button.disabled) return;

    event.preventDefault();
    button.click();
  }

  function ensureToolbar() {
    const existing = document.getElementById(TOOLBAR_ID);

    if (!currentKey) {
      existing?.remove();
      return null;
    }

    if (existing?.isConnected) return existing;

    const breadcrumbs = document
      .getElementById("jira-issue-header")
      ?.querySelector(SEL.breadcrumbs);
    const mount = document.getElementById("jira-frontend") ?? document.body;
    // Not up yet. A later mount event brings us straight back here, which is
    // exactly what the old one-shot `setTimeout(..., 1000)` could not do: it
    // lost the race on a slow load and never tried again, so a missing toolbar
    // stayed missing for the life of the tab.
    if (!breadcrumbs || !mount) return null;

    const toolbar = document.createElement("div");
    toolbar.id = TOOLBAR_ID;

    for (const spec of BUTTONS) {
      const button = document.createElement("button");
      button.id = spec.id;
      button.type = "button";
      button.addEventListener("click", () => guard(() => spec.onClick(button)));
      toolbar.append(button);
    }

    mount.prepend(toolbar);
    logger.debug(`toolbar built for ${currentKey}`);
    return toolbar;
  }

  // Idempotent, and the only way state reaches the page. Every signal -- route
  // change, mount, preference toggle, backstop tick -- calls this and nothing
  // else, so there is one description of what the page should look like rather
  // than a set of branches that have to agree with each other.
  function render() {
    const root = document.documentElement;
    root.dataset.gtJiraLocked = String(prefs.locked);
    root.dataset.gtJiraCollapsed = String(prefs.collapsed);

    const toolbar = ensureToolbar();
    if (!toolbar) return;

    // Nothing to lock, collapse or scroll past until the description mounts.
    const hasDescription = !!document.querySelector(SEL.description);

    for (const spec of BUTTONS) {
      const button = toolbar.querySelector(`#${spec.id}`);
      if (!button) continue;
      const hint = SHORTCUT_HINT[spec.id];
      button.textContent = spec.label();
      button.title = hint ? `${spec.title()} (${hint})` : spec.title();
      button.disabled = Boolean(spec.needsDescription) && !hasDescription;
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
  outline: 1px solid red;
  outline-offset: 2px;
}

html[data-gt-jira-collapsed="true"] ${SEL.description} {
  max-height: ${COLLAPSED_HEIGHT};
  overflow-y: auto;
}

/* Everything except the positioning applies everywhere. All of it used to sit
   inside the @supports block, so a browser without CSS anchor positioning --
   which is everything but Chromium today -- got unstyled buttons in an
   unpositioned block at the top of the app. The corner is a worse place than
   beside the breadcrumbs, but it is a usable one. The gap replaces the
   whitespace the old parsed markup happened to put between the buttons. */
div#${TOOLBAR_ID} {
  position: fixed;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
  z-index: 1;
  display: inline-flex;
  gap: 2px;
}
div#${TOOLBAR_ID} button {
  padding: 5px;
  border-radius: 4px;
}
div#${TOOLBAR_ID} button:hover {
  background: #eee;
  cursor: pointer;
}
div#${TOOLBAR_ID} button[disabled] {
  opacity: 0.3;
}
div#${TOOLBAR_ID} button[disabled]:hover {
  cursor: not-allowed;
}
div#${TOOLBAR_ID} button:active {
  border: 1px solid #89ceef;
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
  }
}`,
  );

  document.addEventListener("click", blockClickToEdit, true);
  document.addEventListener("keydown", onKeyDown, true);
  watchRoute(render);
  watchMounts(render);
  guard(render);
})();
