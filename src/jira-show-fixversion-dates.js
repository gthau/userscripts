// ==UserScript==
// @name         Jira Show fixVersion dates
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  In plan timeline, shows the start, code freeze and release dates next to a fixVersion name
// @author       gthau
// @match        https://dalet.atlassian.net/jira/plans/*/scenarios/*/timeline?vid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

(async function () {
  "use strict";

  const RELEASE_DOM_NODE_ID = "group-name-release-";
  const STYLE_DOM_NODE_ID = "gt-fixversion-dates-style";

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

  let releasesById = null;

  const formatter = new Intl.DateTimeFormat(navigator.language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const QUARTER_RELEASE_RE = /202[678]\.Q[1234]/;
  const REAL_RELEASE_RE = /Pyr 202[678]\.\d+\.0.*/;

  function isReleaseRelevant(release) {
    return (
      REAL_RELEASE_RE.test(release.name) ||
      QUARTER_RELEASE_RE.test(release.name)
    );
  }

  function isQuarterRelease(release) {
    return QUARTER_RELEASE_RE.test(release.name);
  }

  async function fetchReleases() {
    if (releasesById) {
      return releasesById;
    }

    try {
      const releases = await fetch(
        "https://dalet.atlassian.net/rest/api/2/project/RDC/versions",
        { headers: { "content-type": "application/json" } },
      )
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
      releasesById = new Map(releases.map((r) => [r.id, r]));
      logger.debug("releases", releasesById);
      return releasesById;
    } catch (e) {
      logger.error("failed to get Jira releases for project RDC", e.message);
      return;
    }
  }

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

  function applyReleaseDetailsCss(css) {
    const head = document.head || document.getElementsByTagName("head")[0];
    let style = document.getElementById(STYLE_DOM_NODE_ID);

    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_DOM_NODE_ID;
      head.appendChild(style);
    }

    style.textContent = css;
  }

  // No need to wait for the timeline to render: the rules match whenever the
  // group nodes appear.
  releasesById = await fetchReleases();

  if (!releasesById?.size) {
    logger.warn("no relevant release found, no date to display");
    return;
  }

  const css = buildReleaseDetailsCss(releasesById);
  applyReleaseDetailsCss(css);
  logger.debug("applied fixVersion dates stylesheet", css);
})();
