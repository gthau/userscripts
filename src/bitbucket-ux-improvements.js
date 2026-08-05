// ==UserScript==
// @name         Bitbucket UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Makes some UX improvements to Bitbucket: easily remove reviewers
// @author       gthau
// @match        https://bitbucket.org/ooyalaflex/*/pull-requests/new*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

/**
 * Enables removing of reviews by simply clicking on them. So one can click fast in sequence
 * to remove all users without having to click exactly on the X button, which is inconvenient
 * since the user pills are of variable length.
 */
(function () {
  "use strict";

  const REPOS = {
    rundownLib: "rundown-lib",
    rundownApi: "rundown-api",
    scriptEditor: "script-editor-app",
  };

  const RUNDOWN_DEFAULT_REVIEWERS = [
    "ghislain thau",
    "shahar dadon",
    "nufar michurin",
    "revital kimhi",
  ];

  const SCRIPT_EDITOR_DEFAULT_REVIEWERS = [
    "eugene krasner",
    "aviad belulu",
    "amir israel cohen",
    "avivit eitan",
    "stanislav karavaev",
    "cohavit taboch",
    ...RUNDOWN_DEFAULT_REVIEWERS,
  ];

  const DEFAULT_REVIEWERS = {
    [REPOS.rundownLib]: RUNDOWN_DEFAULT_REVIEWERS,
    [REPOS.rundownApi]: RUNDOWN_DEFAULT_REVIEWERS,
    [REPOS.scriptEditor]: SCRIPT_EDITOR_DEFAULT_REVIEWERS,
  };

  const LOGGER_PREFIX = "[Bitbucket UX improvements] ";
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

  const repository = document.location.pathname.split("/")[2];
  logger.debug(`repository is ${repository}`);

  const BITBUCKET_CLS_IDS = {
    control: "fabric-user-picker__control",
    controlInput: "fabric-user-picker__input",
    controlInputContainer: "fabric-user-picker__input-container",
    userPill: "fabric-user-picker__multi-value",
    removeBtn: "fabric-user-picker__multi-value__remove",
    reviewersLabel: "reviewer-field-label",
    sourceBranchContainer: "create-pull-request-source-branch-selector",
  };

  const POLL_INTERVAL_MS = 3000;
  const MAX_PRUNE_PASSES = 12;
  const PRUNE_PASS_DELAY_MS = 50;

  let reviewersPickersElt = null;
  let firstTime = true;

  setInterval(() => {
    const reviewersPickers = getUserMultiPickerElt();

    // React can swap the control for a brand new node between two ticks, which
    // leaves our listener bound to a detached element while the live one has
    // none: compare identity, not just presence, or the script silently dies.
    if (!!reviewersPickersElt && reviewersPickersElt !== reviewersPickers) {
      logger.debug(
        "reviewers control was replaced or removed: dropping the event listener"
      );
      reviewersPickersElt.removeEventListener(
        "click",
        removeReviewerBySimpleClick
      );
      reviewersPickersElt = null;
    }

    if (!reviewersPickersElt && !!reviewersPickers) {
      logger.debug(
        "Listeners not set and reviewers control exists: setting event listener"
      );
      reviewersPickersElt = reviewersPickers;
      reviewersPickersElt.addEventListener(
        "click",
        removeReviewerBySimpleClick
      );

      // first time: keep only real default reviewers for known repositories
      if (firstTime && isKnownRepository(repository)) {
        logger.debug(
          "first time and known repository detected, removing the irrelevant default reviewers"
        );
        firstTime = false;
        pruneIrrelevantDefaultReviewers(repository).catch((e) =>
          logger.error("pruning the default reviewers failed", e)
        );
      }
    }
  }, POLL_INTERVAL_MS);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * React rebuilds the whole pill list on every removal, so the DOM has to be
   * re-read on each pass: a node captured before a removal is detached, and a
   * click on a detached node never reaches a listener that could act on it.
   */
  async function pruneIrrelevantDefaultReviewers(repository) {
    for (let pass = 0; pass < MAX_PRUNE_PASSES; pass++) {
      const pickerElt = getUserMultiPickerElt();
      if (!pickerElt) {
        logger.debug("reviewers control is gone, stopping the prune");
        return;
      }

      const pillElt = getAllUserPillElts(pickerElt).find(
        (pill) => !isRelevantDefaultReviewer(pill, repository)
      );
      if (!pillElt) {
        // done: close the picker the user never opened
        getReviewersLabelElt()?.click();
        return;
      }

      const closeElt = pillElt.querySelector("." + BITBUCKET_CLS_IDS.removeBtn);
      if (!closeElt) {
        logger.warn(
          "no remove button inside an irrelevant reviewer pill, stopping the prune",
          pillElt
        );
        return;
      }

      closeElt.click();
      await delay(PRUNE_PASS_DELAY_MS);
    }

    logger.warn(
      `gave up pruning the default reviewers after ${MAX_PRUNE_PASSES} passes`
    );
  }

  function removeReviewerBySimpleClick(event) {
    // The X already does the right thing: re-dispatching a click on it would
    // hand React the same removal twice.
    if (event.target.closest("." + BITBUCKET_CLS_IDS.removeBtn)) {
      return;
    }

    if (
      event.target.closest(
        `.${BITBUCKET_CLS_IDS.controlInputContainer}, .${BITBUCKET_CLS_IDS.controlInput}`
      )
    ) {
      logger.debug("user clicked on input, nothing to remove");
      return;
    }

    // `closest` cannot walk out of the picker, and cannot trip over `document`
    // the way a `parentNode` loop does -- `document` has no `classList`.
    const pillElt = event.target.closest("." + BITBUCKET_CLS_IDS.userPill);
    if (!pillElt) {
      logger.debug("click was not inside a reviewer pill", event.target);
      return;
    }

    const closeElt = pillElt.querySelector("." + BITBUCKET_CLS_IDS.removeBtn);
    if (!closeElt) {
      logger.debug("did not find button to remove reviewer", pillElt);
      return;
    }

    closeElt.click();
  }

  function getUserMultiPickerElt() {
    return document.querySelector("." + BITBUCKET_CLS_IDS.control);
  }

  function getAllUserPillElts(userMultiPickerElt) {
    return Array.from(
      userMultiPickerElt.querySelectorAll("." + BITBUCKET_CLS_IDS.userPill)
    );
  }

  function getReviewersLabelElt() {
    return document.getElementById(BITBUCKET_CLS_IDS.reviewersLabel);
  }

  function isKnownRepository(repository) {
    return Object.values(REPOS).includes(repository);
  }

  function isRelevantDefaultReviewer(childNode, repository) {
    return DEFAULT_REVIEWERS[repository].includes(
      childNode.textContent.trim().toLocaleLowerCase()
    );
  }
})();
