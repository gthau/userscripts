// ==UserScript==
// @name         Jira UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Makes some UX improvements to Jira: disable Click Edit, collapse Description, copy epic name and url. Fork of "Disable Jira Click Edit" by fanuch (https://gist.github.com/fanuch/1511dd5423e0c68bb9d66f63b3a9c875)
// @author       gthau
// @match        https://*.atlassian.net/browse/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

/**
 * Toggles the double-click-to-edit functionality in Jira issue descriptions.
 * The script creates a toggle button that allows the user to enable or disable editing.
 * The button uses emoji icons to represent the current state:
 * - 🔒 (locked) indicates that editing is disabled, the Description field is bordered in red
 * - ✏️ (pencil) indicates that editing is enabled, the red border is removed
 * - ⏬ (expanded) indicates that the Description field is expanded
 * - ⏩ (collapsed) indicates that the Description field is collapsed (for quicker access to the children issues)
 * - 🗐 (copy) allows to copy the issue's name prefixed by its id
 * - 🗐 with URL (copy) allows to copy the issue's name prefixed by its id and suffixed by its URL
 */
(function () {
  "use strict";

  const TOGGLE_BUTTON_ID = "toggle-button";
  const EXPAND_BUTTON_ID = "expand-button";
  const COPY_NAME_BUTTON_ID = "copy-issue-name-button";
  const COPY_NAME_URL_BUTTON_ID = "copy-issue-name-and-url-button";

  let isDoubleClickEnabled = true; // Set initial value to false
  let isExpanded = true;

  function id(identifier) {
    return `#${identifier}`;
  }

  /**
   * Creates the toggle button and inserts it into the Jira issue description UI.
   */
  function createExtraButtons() {
    const breadcrumbsElt = document
      .getElementById("ak-main-content")
      .querySelector('[data-component-selector="breadcrumbs-wrapper"]');
    if (breadcrumbsElt) {
      const newButtonsWrapper = new DOMParser().parseFromString(
        `<div>
          <button id="${TOGGLE_BUTTON_ID}">✏️</button>
          <button id="${EXPAND_BUTTON_ID}">⏬</button>
          <button id="${COPY_NAME_BUTTON_ID}">🗐</button>
          <button id="${COPY_NAME_URL_BUTTON_ID}">🗐 with URL</button>
        </div>`,
        "text/xml"
      ).firstElementChild;
      breadcrumbsElt.insertAdjacentElement("afterend", newButtonsWrapper);

      newButtonsWrapper
        .querySelector(id(TOGGLE_BUTTON_ID))
        .addEventListener("click", toggleDoubleClickEdit);
      newButtonsWrapper
        .querySelector(id(EXPAND_BUTTON_ID))
        .addEventListener("click", expandHandler);
      newButtonsWrapper
        .querySelector(id(COPY_NAME_BUTTON_ID))
        .addEventListener("click", copyHandler);
      newButtonsWrapper
        .querySelector(id(COPY_NAME_URL_BUTTON_ID))
        .addEventListener("click", copyHandler);
    }
  }

  /**
   * Toggles the double-click-to-edit functionality when the toggle button is clicked.
   * Updates the button icon and adds/removes the event listener on the description element.
   */
  function toggleDoubleClickEdit() {
    isDoubleClickEnabled = !isDoubleClickEnabled;
    const button = document.getElementById(TOGGLE_BUTTON_ID);
    const descriptionElement = document.querySelector(".ak-renderer-document");

    if (isDoubleClickEnabled) {
      button.textContent = "✏️";
      descriptionElement.removeEventListener("click", handleClick, true);
      descriptionElement.style.border = "unset";
    } else {
      button.textContent = "🔒";
      descriptionElement.addEventListener("click", handleClick, true);
      descriptionElement.style.border = "1px solid red";
    }
  }

  function expandHandler() {
    isExpanded = !isExpanded;
    const button = document.getElementById(EXPAND_BUTTON_ID);
    const descriptionElement = document.querySelector(".ak-renderer-document");

    if (isExpanded) {
      button.textContent = "⏬";
      descriptionElement.style.height = "unset";
    } else {
      button.textContent = "⏩";
      descriptionElement.style.height = "200px";
      descriptionElement.style.overflowY = "scroll";
    }
  }

  function copyHandler(event) {
    const withURL = event.target.id === COPY_NAME_URL_BUTTON_ID;
    const newClip = `${document.title.split(" - Jira")[0]}${
      withURL ? ` - ${document.URL}` : ""
    }`;
    navigator.permissions.query({ name: "clipboard-write" }).then((result) => {
      if (result.state === "granted" || result.state === "prompt") {
        navigator.clipboard.writeText(newClip).then(
          () => {
            /* clipboard successfully set */
          },
          () => {
            /* clipboard write failed */
          }
        );
      }
    });
  }

  /**
   * Handles the click event on the Jira issue description element.
   * Stops the event propagation to prevent the default double-click-to-edit behavior.
   * @param {Event} e - The click event object.
   */
  function handleClick(e) {
    e.stopPropagation();
    console.log(
      "Blocked click-edit of Jira issue description. You're welcome."
    );
  }

  // Wait for the Jira issue description UI to load before creating the extra buttons
  let attempts = 0;
  let intervalId = setInterval(() => {
    attempts++;
    const descriptionElement = document.querySelector(".ak-renderer-document");
    if (descriptionElement) {
      createExtraButtons();
      descriptionElement.addEventListener("click", handleClick, true);
      toggleDoubleClickEdit();
      console.debug(
        "setInterval - description found, buttons added, clear interval"
      );
      clearInterval(intervalId);
    } else {
      if (attempts > 10) {
        console.debug(`UserScript "Jira UX improvements" couldn't initialize`);
        clearInterval(intervalId);
      } else {
        console.debug("setInterval - description NOT found");
      }
    }
    return;
  }, 1000);
})();
