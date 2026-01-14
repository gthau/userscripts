// ==UserScript==
// @name         Bitbucket UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.1.0
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

  const RUNDOWN_DEFAULT_REVIEWERS = [
    "ghislain thau",
    "shahar dadon",
    "nufar michurin",
    "revital kimhi",
  ];

  const RUNDOWN_REPOSITORIES = ["rundown-lib", "rundown-api"];

  function isRealDefaultReviewer(childNode) {
    return RUNDOWN_DEFAULT_REVIEWERS.includes(
      childNode.textContent.trim().toLocaleLowerCase()
    );
  }

  const isRundownRepository = RUNDOWN_REPOSITORIES.some((repo) =>
    document.location.href.includes(`/${repo}/`)
  );

  const LOGGER_PREFIX = "[Bitbucket UX improvements] ";
  const logger = {
    log: (message) => console.log(LOGGER_PREFIX + message),
    debug: (message) => console.debug(LOGGER_PREFIX + message),
    error: (message) => console.error(LOGGER_PREFIX + message),
  };

  const BITBUCKET_CLS_IDS = {
    control: "fabric-user-picker__control",
    controlInput: "fabric-user-picker__input",
    controlInputContainer: "fabric-user-picker__input-container",
    userPill: "fabric-user-picker__multi-value",
    removeBtn: "fabric-user-picker__multi-value__remove",
    reviewersLabel: "reviewer-field-label",
  };

  let areListenersRegistered = false;
  let reviewersPickersElt = null;
  let firstTime = true;

  function removeReviewerBySimpleClick(event) {
    console.debug(event);
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

  setInterval(() => {
    // look for the container and whether event listeners are registered
    const reviewersPickers = document.querySelector(
      "." + BITBUCKET_CLS_IDS.control
    );

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

      // first time: keep only real default reviewers
      if (firstTime && isRundownRepository) {
        logger.debug(
          "first time and rundown repository detected, removing non-Rundown team reviewers"
        );

        [
          ...reviewersPickersElt.querySelectorAll(
            "." + BITBUCKET_CLS_IDS.userPill
          ),
        ]
          .filter((childNode) => !isRealDefaultReviewer(childNode))
          .forEach((childNode) => {
            setTimeout(() => childNode.click(), 10);
          });
        setTimeout(
          () =>
            document.getElementById(BITBUCKET_CLS_IDS.reviewersLabel).click(),
          200
        );
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
})();
