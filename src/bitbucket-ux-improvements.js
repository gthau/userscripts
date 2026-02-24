// ==UserScript==
// @name         Bitbucket UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.2.0
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
  ("use strict");

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
    log: (message) => console.log(LOGGER_PREFIX + message),
    debug: (message) => console.debug(LOGGER_PREFIX + message),
    error: (message) => console.error(LOGGER_PREFIX + message),
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

  let areListenersRegistered = false;
  let reviewersPickersElt = null;
  let firstTime = true;

  setInterval(() => {
    const reviewersPickers = getUserMultiPickerElt();

    // look for the container and whether event listeners are registered
    if (!areListenersRegistered && !!reviewersPickers) {
      logger.debug(
        "Listeners not set and reviewers control exists: setting event listener"
      );
      // register listeners
      reviewersPickersElt = reviewersPickers;
      reviewersPickersElt.addEventListener(
        "click",
        removeReviewerBySimpleClick
      );
      areListenersRegistered = true;

      // first time: keep only real default reviewers for known repositories
      if (firstTime && isKnownRepository(repository)) {
        logger.debug(
          "first time and known repository detected, removing the irrelevant default reviewers"
        );

        getAllUserPillElts(reviewersPickersElt)
          .filter(
            (childNode) => !isRelevantDefaultReviewer(childNode, repository)
          )
          .forEach((childNode) => {
            setTimeout(() => childNode.click(), 10);
          });
        setTimeout(() => getReviewersLabelElt().click(), 200);
        firstTime = false;
      }
    } else if (
      areListenersRegistered &&
      !reviewersPickers &&
      !!reviewersPickersElt
    ) {
      logger.debug(
        "Listeners are set and reviewers control does not exist anymore: removing event listener"
      );
      reviewersPickersElt.removeEventListener(
        "click",
        removeReviewerBySimpleClick
      );
      areListenersRegistered = false;
    }
  }, 3000);

  function removeReviewerBySimpleClick(event) {
    // console.debug(event);
    // find a close button in the target of the event
    const targetClasses = event.target.classList;
    if (
      targetClasses.contains(BITBUCKET_CLS_IDS.controlInputContainer) ||
      targetClasses.contains(BITBUCKET_CLS_IDS.controlInput)
    ) {
      logger.debug("user clicked on input, nothing to remove");
      return;
    }

    // find parent user-picker
    let parentPickerElt = event.target;
    while (
      !!parentPickerElt &&
      !parentPickerElt.classList.contains(BITBUCKET_CLS_IDS.userPill)
    ) {
      parentPickerElt = parentPickerElt.parentNode;
    }

    if (
      !parentPickerElt ||
      !parentPickerElt.classList.contains(BITBUCKET_CLS_IDS.userPill)
    ) {
      logger.debug("did not find a parent user picker element");
      logger.debug(parentPickerElt);
      return;
    }

    const closeElt = parentPickerElt.querySelector(
      "." + BITBUCKET_CLS_IDS.removeBtn
    );
    logger.debug(closeElt);
    if (!closeElt) {
      logger.debug("did not find button to remove reviewer");
    } else {
      closeElt.click();
    }
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
