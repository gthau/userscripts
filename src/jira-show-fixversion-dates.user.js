// ==UserScript==
// @name         Jira Show fixVersion dates
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  In plan timeline, shows the start, code freeze and release dates next to a fixVersion name
// @author       gthau
// @match        https://dalet.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-show-fixversion-dates.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-show-fixversion-dates.user.js
// @grant        none
// ==/UserScript==

/**
 * A plan timeline groups issues by fixVersion and shows the version name on its
 * own. This puts the dates that name stands for beside it -- start, code freeze,
 * release -- and, for a release still ahead, how far away it is.
 *
 * The dates are written as a stylesheet rather than into the group headers, for
 * the reason given above `buildReleaseDetailsCss`.
 *
 * `@match` covers the whole site rather than the timeline, because it only
 * governs injection, and Tampermonkey evaluates it on document load and not on
 * history rewrites. Jira is a single-page app, and a plan is normally reached
 * from somewhere else in Jira -- the sidebar, a search, another plan -- which
 * rewrites history and loads nothing, so the old `@match` on the timeline URL
 * meant the script was only ever injected when the timeline was the first page
 * of the session. The route gate below decides whether the dates are fetched;
 * the host stays named there because the project and the REST call are Dalet's.
 */
(function () {
  "use strict";

  // ----------------------------------------------------------------- helpers

  const LOGGER_PREFIX = "[Jira plan Versions] ";
  const logger = {
    log: (message, ...objects) =>
      console.log(LOGGER_PREFIX + message, ...objects),
    debug: (message, ...objects) =>
      console.debug(LOGGER_PREFIX + message, ...objects),
    warn: (message, ...objects) =>
      console.warn(LOGGER_PREFIX + message, ...objects),
    error: (message, ...objects) =>
      console.error(LOGGER_PREFIX + message, ...objects),
    trace: (message, ...objects) =>
      console.trace(LOGGER_PREFIX + message, ...objects),
  };

  // Now that the script outlives the page it was injected into, one bad release
  // -- or a browser without `Temporal` -- must cost that arrival and not the
  // listeners that would give the next one another go.
  function guard(fn) {
    try {
      return fn();
    } catch (e) {
      logger.error("failed", e);
    }
  }

  // --------------------------------------------------------------- constants

  const RELEASE_DOM_NODE_ID = "group-name-release-";
  const STYLE_DOM_NODE_ID = "gt-fixversion-dates-style";

  const VERSIONS_URL =
    "https://dalet.atlassian.net/rest/api/2/project/RDC/versions";

  // Backstop for the case where the event-driven path below missed something,
  // not the primary mechanism. It costs a regular expression test.
  const ROUTE_BACKSTOP_MS = 2_000;

  const QUARTER_RELEASE_RE = /202[678]\.Q[1234]/;
  const REAL_RELEASE_RE = /Pyr 202[678]\.\d+\.0.*/;

  const formatter = new Intl.DateTimeFormat(navigator.language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ------------------------------------------------------------------- route

  // The old `@match` -- `/jira/plans/`*`/scenarios/`*`/timeline?vid=`* --
  // translated literally, `*` and all, so the gate is written from the pattern
  // and not from a reading of what a plan URL looks like. A gate narrower than
  // the `@match` it replaces turns pages that used to work into pages where
  // nothing happens. Being a prefix, it accepts anything after `timeline`, and
  // it is case-insensitive because nothing forced the case of the path before.
  //
  // With one deliberate widening: `?vid=` is dropped. A match pattern's path is
  // compared against the query string too, so the old one demanded a view id --
  // and the query is Jira's to write, on its own schedule, after the route has
  // changed. Gating on it would mean arriving at a timeline and getting nothing
  // until Jira got round to naming a view -- the same silence, arrived at from
  // the other end, that this gate exists to end. What the widening costs is one
  // GET and a stylesheet whose every selector names a release group by id.
  const PLAN_TIMELINE_RE = /^\/jira\/plans\/.*\/scenarios\/.*\/timeline/i;

  // A yes/no rather than an id, unlike the sibling scripts' route gates: the
  // dates come from the project's versions, which are the same list whichever
  // plan, scenario or view is open. "Which timeline" is not a distinction this
  // script could act on, and making it one would refetch that same list every
  // time the timeline writes a view id or a filter into the query string.
  function onPlanTimeline(url) {
    try {
      return PLAN_TIMELINE_RE.test(new URL(url, location.href).pathname);
    } catch {
      return false;
    }
  }

  let onTimeline = onPlanTimeline(location.href);

  // Jira is a single-page app: it rewrites history instead of loading pages, and
  // `history.pushState` emits no event of its own. Three layers feed one
  // callback, deduplicated on the answer above so overlap is free. Same shape as
  // the issue and backlog scripts' route watchers.
  function watchRoute(onChange) {
    const notify = (url) => {
      const timeline = onPlanTimeline(url ?? location.href);
      if (timeline === onTimeline) return;
      logger.debug(`route: on timeline ${onTimeline} -> ${timeline}`);
      onTimeline = timeline;
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

  // ---------------------------------------------------------------- releases

  function isReleaseRelevant(release) {
    return (
      REAL_RELEASE_RE.test(release.name) ||
      QUARTER_RELEASE_RE.test(release.name)
    );
  }

  function isQuarterRelease(release) {
    return QUARTER_RELEASE_RE.test(release.name);
  }

  // Fetched again on every arrival, and nothing is kept between them. The
  // run-once version could have cached to its heart's content, because its
  // lifetime was one page view; this one lives as long as the tab, which for
  // Jira is days. A cache would be the thing quietly showing last week's dates
  // for a release that has since moved -- which is the one number anyone opens
  // the timeline to read. One GET per arrival at a plan timeline is not a rate
  // worth optimising: arrivals are as frequent as a person navigating.
  async function fetchReleases() {
    try {
      const releases = await fetch(VERSIONS_URL, {
        headers: { "content-type": "application/json" },
      })
        .then((res) => res.json())
        .then((releases) =>
          releases
            .filter((r) => {
              if (isReleaseRelevant(r)) {
                logger.debug(`relevant release: ${r.name}`, r);
                return true;
              }
              return false;
            })
            .toSorted((prev, curr) => prev.name.localeCompare(curr.name)),
        );
      const releasesById = new Map(releases.map((r) => [r.id, r]));
      logger.debug("releases", releasesById);
      return releasesById;
    } catch (e) {
      logger.error("failed to get Jira releases for project RDC", e.message);
      return;
    }
  }

  // ------------------------------------------------------------------- dates

  function getCodeFreezeDate(releaseDateStr) {
    const cfDate = Temporal.PlainDate.from(releaseDateStr).subtract({
      weeks: 2,
    });
    return new Date(cfDate.toString());
  }

  function getTimeFromNow(releaseDate) {
    const today = Temporal.Now.plainDateISO();
    const release = Temporal.PlainDate.from(releaseDate);

    const weeks = Math.round(
      today.until(release, { largestUnit: "week" }).weeks,
    );

    const rtf = new Intl.RelativeTimeFormat("en");
    return rtf.format(weeks, "week");
  }

  function formatDate(date) {
    return formatter.format(new Date(date));
  }

  // Read against the clock at the moment of the call -- "in 3 weeks", and
  // whether a code freeze is still ahead -- so it is built on arrival rather
  // than once. A tab left open over a fortnight would otherwise still be saying
  // three weeks.
  function buildReleaseDetails(release) {
    const isQRelease = isQuarterRelease(release);
    const cfDate = getCodeFreezeDate(release.releaseDate);
    const relativeTime =
      !isQRelease && new Date(release.releaseDate) > Date.now()
        ? getTimeFromNow(release.releaseDate)
        : "";

    const dateText = [
      ["Start", release.startDate],
      ["CF", !isQRelease && cfDate > Date.now() ? cfDate : undefined],
      [isQRelease ? "End" : "Release", release.releaseDate],
    ]
      .filter(([_prefix, date]) => new Date(date).toString() !== "Invalid Date")
      .map(([prefix, date]) => `${prefix}: ${formatDate(date)}`)
      .join(" - ");

    return `(${[dateText, relativeTime].filter(Boolean).join(" ")})`;
  }

  // --------------------------------------------------------------------- css

  // A CSS string can contain anything but an unescaped `"`, `\` or newline.
  function escapeCssString(text) {
    return text.replace(/[\\"]/g, "\\$&").replace(/[\n\r\f]/g, " ");
  }

  // One `::after` rule per release, rather than writing into the group nodes:
  // the timeline virtualizes its rows, so any node we touch is thrown away and
  // re-rendered on scroll. A stylesheet is applied by the browser to every
  // matching node, including the ones React has not created yet, so it survives
  // re-renders for free.
  function buildReleaseDetailsCss(releasesById) {
    const rules = [];

    for (const [id, release] of releasesById) {
      if (!release.releaseDate) {
        logger.debug(`no release date for ${release.name}, skipping`, release);
        continue;
      }

      const selector = `#${CSS.escape(RELEASE_DOM_NODE_ID + id)}::after`;
      const details = escapeCssString(buildReleaseDetails(release));

      rules.push(
        `${selector} {
  content: "${details}";
  margin-inline-start: 0.5em;
  font-size: 0.9em;
  font-weight: normal;
  white-space: nowrap;
  opacity: 0.75;
  flex: none;
}`,
      );
    }

    return rules.join("\n");
  }

  // Rewritten in place on each arrival, and never removed on the way out: every
  // selector names one release group of the timeline by id, so away from the
  // timeline the sheet matches nothing and there is nothing to undo.
  function applyReleaseDetailsCss(css) {
    const style =
      document.getElementById(STYLE_DOM_NODE_ID) ??
      document.createElement("style");
    style.id = STYLE_DOM_NODE_ID;
    style.textContent = css;
    // At document-start there may be no <head> yet, and a <style> applies from
    // anywhere in the document.
    (document.head ?? document.documentElement).append(style);
  }

  // ----------------------------------------------------------------- startup

  // No need to wait for the timeline to render, which is why there is no mount
  // watcher here as there is in the sibling scripts: the rules match whenever
  // the group nodes appear.
  async function showReleaseDates() {
    const releasesById = await fetchReleases();

    // The fetch is the only slow step, and the route can change under it, so a
    // timeline left before the versions answered gets no stylesheet written for
    // it. Nothing finer is needed: two arrivals whose fetches overlap ask the
    // same URL the same question, so whichever answer lands last is the same
    // answer, give or take the second between them.
    if (!onTimeline) {
      logger.debug("left the timeline while fetching, dropping the result");
      return;
    }

    guard(() => {
      if (!releasesById?.size) {
        logger.warn("no relevant release found, no date to display");
        return;
      }

      const css = buildReleaseDetailsCss(releasesById);
      applyReleaseDetailsCss(css);
      logger.debug("applied fixVersion dates stylesheet", css);
    });
  }

  watchRoute(() => {
    if (onTimeline) showReleaseDates();
  });

  // Said out loud, because a gate that says no and a script that was never
  // injected look identical from the page: nothing happens either way. If a plan
  // timeline ever prints the refusal, the URL it names is what the pattern above
  // has to accept.
  logger.debug(
    onTimeline
      ? `plan timeline at ${location.href}`
      : `not a plan timeline: ${location.href}`,
  );

  if (onTimeline) showReleaseDates();
})();
