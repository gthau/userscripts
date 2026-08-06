// ==UserScript==
// @name         Bitbucket Collapse Trivy Messages
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Makes some UX improvements to Bitbucket: easily remove reviewers
// @author       gthau
// @match        https://bitbucket.org/ooyalaflex/*/pull-requests/*/overview
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/bitbucket-collapse-trivy.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/bitbucket-collapse-trivy.user.js
// @grant        none
// ==/UserScript==

/**
 * Enables removing of reviews by simply clicking on them. So one can click fast in sequence
 * to remove all users without having to click exactly on the X button, which is inconvenient
 * since the user pills are of variable length.
 */
(function () {
  ("use strict");

  const LOGGER_PREFIX = "[Bitbucket Collapse Trivy Messages] ";
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

  let trivyMessagesCollapsed = false;

  function collapseTrivyPRMessages() {
    let nodesCount = 0;
    let collapsedNodesCount = 0;

    document
      .querySelectorAll('[data-qa="pull-request-overview-activity-content"]')
      .forEach((node) => {
        if (node.textContent.includes("Trivy found some issues")) {
          nodesCount++;
          const button = node.querySelector(
            'button span[aria-label="collapse"]',
          );
          if (button) {
            button.click();
            collapsedNodesCount++;
          }
        }
      });

    if (nodesCount && collapsedNodesCount) {
      trivyMessagesCollapsed = true;
      logger.debug("Trivy messages collapsed!");
    }
  }

  const interval = setInterval(() => {
    // look for the container and whether event listeners are registered
    if (!trivyMessagesCollapsed) {
      logger.debug("will try to collapse Trivy messages");
      collapseTrivyPRMessages();
    }
  }, 3000);
})();
