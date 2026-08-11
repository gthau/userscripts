// ==UserScript==
// @name         Bitbucket Collapse Trivy Messages
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Collapses the Trivy report comments on a Bitbucket pull request, so the comments written by humans are reachable without scrolling past them
// @author       gthau
// @match        https://bitbucket.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/bitbucket-collapse-trivy.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/bitbucket-collapse-trivy.user.js
// @grant        none
// ==/UserScript==

/**
 * The Trivy reports posted on a pull request are long enough to bury every
 * human comment under them. This collapses each one, once, using the comment's
 * own collapse toggle.
 *
 * Bitbucket is a single-page app: opening a pull request from the repository's
 * PR list, or stepping between two pull requests, rewrites history rather than
 * loading a page. Two things follow, and the script is shaped by both.
 *
 * `@match` covers the whole site rather than the pull request page, because it
 * only governs injection and Tampermonkey evaluates it when the document
 * loads, never again on a history rewrite. Landing on the PR list and clicking
 * into a pull request would otherwise never inject the script at all -- and no
 * code in the page can correct that afterwards. The selectors below are the
 * real gate: on any other page they match nothing.
 *
 * Work is driven by the mount, not by the page load. Bitbucket tells us when a
 * comment appears -- through `animationstart`, see `watchMounts` -- and that
 * fires just the same on a soft navigation, on the "load more" pagination of
 * older activity, and on any re-render, so none of those need handling of
 * their own.
 */
(function () {
  "use strict";

  // ----------------------------------------------------------------- helpers

  const LOGGER_PREFIX = "[Bitbucket Collapse Trivy Messages] ";
  const logger = {
    log: (message, ...objects) =>
      console.log(LOGGER_PREFIX + message, ...objects),
    debug: (message, ...objects) =>
      console.debug(LOGGER_PREFIX + message, ...objects),
    error: (message, ...objects) =>
      console.error(LOGGER_PREFIX + message, ...objects),
  };

  // Bitbucket re-renders under us, so any node we read may be gone by the time
  // we touch it. One failure should cost that pass, not the session.
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

  const STYLE_ID = "gt-bb-trivy-style";
  const MOUNT_ANIMATION = "gt-bb-trivy-mounted";

  const SEL = {
    activity: '[data-qa="pull-request-overview-activity-content"]',
    collapseButton: 'button span[aria-label="collapse"]',
  };

  const TRIVY_MARKER = "Trivy found some issues";

  // Backstop only, for the case where the event-driven path missed something.
  // It costs one querySelectorAll, and only on a pull request page.
  const MOUNT_BACKSTOP_MS = 3_000;

  // Cheap enough to run on every backstop tick, and it keeps the scan off the
  // rest of Bitbucket, which `@match` no longer excludes. A trailing segment is
  // allowed and ignored: the overview, the diff and the commits tab of one pull
  // request are all the same page as far as this script is concerned.
  const PR_PATH_RE = /^\/[^/]+\/[^/]+\/pull-requests\/\d+(?:\/|$)/;

  // -------------------------------------------------------------- collapsing

  // Clicked once per comment, ever. Two reasons, and either alone is enough:
  // an expand the reader did by hand has to stick, and re-clicking a toggle we
  // have already used would put it straight back where it was.
  const handled = new WeakSet();

  function collapseTrivyMessages() {
    let found = 0;
    let collapsed = 0;

    for (const node of document.querySelectorAll(SEL.activity)) {
      if (!node.textContent.includes(TRIVY_MARKER)) continue;
      found++;

      if (handled.has(node)) continue;

      // Either the comment is already collapsed, and there is nothing to do, or
      // it mounted ahead of its toggle -- in which case the toggle's own mount,
      // or failing that the backstop, comes back to it.
      const button = node.querySelector(SEL.collapseButton);
      if (!button) continue;

      // Marked before the click, so a click that throws cannot leave us
      // clicking the same toggle on every pass.
      handled.add(node);
      button.click();
      collapsed++;
    }

    if (collapsed) {
      logger.debug(`collapsed ${collapsed} of ${found} Trivy report(s)`);
    }
  }

  // A single mount can bring in a whole page of activity, and every one of
  // those nodes reports itself. Coalesce into one scan per frame.
  let scanScheduled = false;

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      guard(collapseTrivyMessages);
    });
  }

  // ------------------------------------------------------------------- mount

  // The browser knows the instant Bitbucket inserts an activity comment or a
  // collapse toggle, and will say so through `animationstart`, which bubbles.
  // That beats polling on three counts: no dead time before a first tick, no
  // permanent subtree observer over a heavy React page, and it fires again on
  // every remount -- so a soft navigation from another Bitbucket page needs no
  // handling at all. Same lever as the Bitbucket UX script's picker detection.
  // `outline-color` is animated because it changes nothing visible.
  //
  // Both selectors are watched because they mount in either order: the comment
  // may arrive before the toggle inside it, and on a re-render the toggle may
  // arrive into a comment that was already there.
  function watchMounts(onMount) {
    injectStyle(
      STYLE_ID,
      `@keyframes ${MOUNT_ANIMATION} {
  from { outline-color: currentColor; }
  to { outline-color: currentColor; }
}
${SEL.activity},
${SEL.collapseButton} { animation: ${MOUNT_ANIMATION} 1ms linear; }`,
    );

    document.addEventListener(
      "animationstart",
      (event) => {
        if (event.animationName !== MOUNT_ANIMATION) return;
        onMount();
      },
      true,
    );

    // Backstop for the one thing the animation trick cannot survive: page CSS
    // winning over `animation` on the target.
    setInterval(() => {
      if (PR_PATH_RE.test(location.pathname)) guard(collapseTrivyMessages);
    }, MOUNT_BACKSTOP_MS);
  }

  // ----------------------------------------------------------------- startup

  watchMounts(scheduleScan);
})();
