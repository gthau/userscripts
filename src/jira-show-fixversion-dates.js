// ==UserScript==
// @name         Jira Show fixVersion dates
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  In plan timeline, shows the release date next to its name
// @author       gthau
// @match        https://dalet.atlassian.net/jira/plans/*/scenarios/*/timeline?vid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

(async function () {
  ("use strict");

  const RELEASE_DOM_NODE_ID = "group-name-release-";

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

  let releasesById= null;

  const formatter = new Intl.DateTimeFormat(navigator.language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  function isReleaseRelevant(release) {
    return (
      /Pyr 202[678]\.\d+\.0.*/.test(release.name) ||
      /202[678]\.Q[1234]/.test(release.name)
    );
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
      logger.debug("failed to get Jira releases for project RDC", e.message);
      return;
    }
  }

  function getReleaseDOMNode(releaseId) {
    const id = `${RELEASE_DOM_NODE_ID}${releaseId}`;
    logger.debug(id);
    return document.getElementById(id);
  }

  function applyReleaseDetailsInDOM(releasesById) {
    let dateAppliedOnSomeElts = false;

    for (const [id, release] of releasesById) {
      const node = getReleaseDOMNode(id);
      if (!node) {
        logger.debug(
          "could not find the release node for ",
          release.name,
          release,
        );
        continue;
      }
      const dateNode = new DOMParser().parseFromString(
        `<span>${release.released ? release.startDate + " - " : ""}${release.releaseDate}</span>`,
        "text/xml",
      ).firstElementChild;
      node.appendChild(dateNode);
      dateAppliedOnSomeElts = true;
    }

    return dateAppliedOnSomeElts;
  }

  function applyReleaseDetailsInDOM_v2(releasesById) {
    let dateAppliedOnSomeElts = false;

    for (const node of document.querySelectorAll(
      '[id^="group-name-release-"]',
    )) {
      const releaseId = node.id.split("-").at(-1);
      const release = releasesById.get(releaseId);

      if (!release) {
        logger.debug(
          "could not find release for group ",
          node.children[0].textContent,
        );
        continue;
      }

      const dateNode = new DOMParser().parseFromString(
        `<small>${release.released ? "start: " + release.startDate + " - " : ""}release: ${release.releaseDate}</small>`,
        "text/xml",
      ).firstElementChild;
      node.appendChild(dateNode);
      dateAppliedOnSomeElts = true;
    }

    return dateAppliedOnSomeElts;
  }

  function formatDate(date) {
    return formatter.format(new Date(date));
  }

  function applyReleaseDetailsInDOM_v3(releasesById) {
    let dateAppliedOnSomeElts = false;

    for (const node of document.querySelectorAll(
      '[id^="group-name-release-"]',
    )) {
      const releaseId = node.id.split("-").at(-1);
      const release = releasesById.get(releaseId);

      if (!release) {
        logger.debug(
          "could not find release for group ",
          node.children[0].textContent,
        );
        continue;
      }

      const dateText = `(${[
        release.startDate ? "start: " + formatDate(release.startDate) : "",
        `release: ${formatDate(release.releaseDate)}`,
      ].join(" - ")})`;
      node.children[1].textContent = dateText;
      dateAppliedOnSomeElts = true;
    }

    return dateAppliedOnSomeElts;
  }

  let isDateInserted = false;
  let maxTries = 3;
  let intervalId = null;

  intervalId = setInterval(await (async function insertDate() {
    if (document.querySelector('img[alt*="Loading"]')) {
      // still loading, do not try yet
      logger.debug("still loading the timeline");
      // eagerly fetch releases
      fetchReleases();
      return insertDate;
    }

    if (--maxTries < 0) {
        logger.debug("max number of tries exceeded, exiting script");
        clearInterval(intervalId);
        return;
      }

    if (isDateInserted) {
      logger.debug("fixVersion dates already inserted, exiting script");
      clearInterval(intervalId);
      return;
    }

    if (!releasesById) {
      logger.debug("fetching releases");
      releasesById = await fetchReleases();
    }

    if (releasesById) {
      isDateInserted = applyReleaseDetailsInDOM_v3(releasesById);

      if (isDateInserted) {
        logger.debug("Date was inserted, clearing interval");
        clearInterval(intervalId);
      } else {
        logger.debug("Date was not inserted, will try as next interval");
      }
    } else {
      logger.debug("releases not found");
    }

    return insertDate;
  }()), 3_000);
})();
