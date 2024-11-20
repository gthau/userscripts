// ==UserScript==
// @name         Jira UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.1.9
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
  ("use strict");

  const TOGGLE_BUTTON_ID = "toggle-button";
  const EXPAND_BUTTON_ID = "expand-button";
  const COPY_NAME_BUTTON_ID = "copy-issue-name-button";
  const COPY_NAME_URL_BUTTON_ID = "copy-issue-name-and-url-button";
  const JUMP_DESCRIPTION_ID = "jump-description-button";
  const GO_UP_ID = "go-up-button";

  const allButtonsIds = [
    TOGGLE_BUTTON_ID,
    EXPAND_BUTTON_ID,
    COPY_NAME_BUTTON_ID,
    COPY_NAME_URL_BUTTON_ID,
    JUMP_DESCRIPTION_ID,
    GO_UP_ID,
  ];

  const disableableButtonsIds = [
    TOGGLE_BUTTON_ID,
    EXPAND_BUTTON_ID,
    JUMP_DESCRIPTION_ID,
  ];

  let toggleButtonElement;
  let expandButtonElement;
  let copyNameButtonElement;
  let copyNameAndUrlButtonElement;
  let jumpDescButtonElement;
  let goUpButtonElement;

  let isDoubleClickEnabled = true; // Set initial value to false
  let isExpanded = true;

  function setupButton(buttonId, isDisabled = false) {
    let callback;
    const button = document.getElementById(buttonId);
    if (isDisabled) {
      button.disabled = isDisabled;
      button.setAttribute("disabled", isDisabled);
    }

    switch (buttonId) {
      case TOGGLE_BUTTON_ID:
        toggleButtonElement = button;
        callback = toggleDoubleClickEdit;
        break;
      case EXPAND_BUTTON_ID:
        expandButtonElement = button;
        callback = expandHandler;
        break;
      case COPY_NAME_BUTTON_ID:
        copyNameButtonElement = button;
        callback = copyHandler;
        break;
      case COPY_NAME_URL_BUTTON_ID:
        copyNameAndUrlButtonElement = button;
        callback = copyHandler;
        break;
      case JUMP_DESCRIPTION_ID:
        jumpDescButtonElement = button;
        callback = jumpDescHandler;
        break;
      case GO_UP_ID:
        goUpButtonElement = button;
        callback = goToTopHandler;
        break;
      default:
        break;
    }

    button.addEventListener("click", callback);
  }

  function enableButtons() {
    for (const buttonId of allButtonsIds) {
      const button = document.getElementById(buttonId);
      if (button.disabled) {
        button.disabled = false;
        button.removeAttribute("disabled");
      }
    }
    extraButtonsEnabled = true;
  }

  function disableButtons() {
    for (const buttonId of disableableButtonsIds) {
      const button = document.getElementById(buttonId);
      if (!button.disabled) {
        button.disabled = true;
        button.setAttribute("disabled", true);
      }
    }
    extraButtonsEnabled = false;
  }

  /**
   * Creates the toggle button and inserts it into the Jira issue description UI.
   * @param disableButtons In case the description element was not found we disable the associated buttons
   */
  function createExtraButtons(disableButtons = false) {
    console.debug(
      `Userscript::Jira - createExtraButtons, disableButtons = ${disableButtons}`
    );
    const breadcrumbsElt = document
      .getElementById("ak-main-content")
      .querySelector('[data-component-selector="breadcrumbs-wrapper"]');

    if (breadcrumbsElt) {
      const newButtonsWrapper = new DOMParser().parseFromString(
        `<div id="gt-extra-buttons">
          <button id="${TOGGLE_BUTTON_ID}" type="button">✏️</button>
          <button id="${EXPAND_BUTTON_ID}" type="button">⏬</button>
          <button id="${COPY_NAME_BUTTON_ID}" type="button">📃 name</button>
          <button id="${COPY_NAME_URL_BUTTON_ID}" type="button">📃 name/URL</button>
          <button id="${JUMP_DESCRIPTION_ID}" type="button">⤵️ desc.</button>
          <button id="${GO_UP_ID}" type="button">⤴️ top</button>
        </div>`,
        "text/xml"
      ).firstElementChild;
      document.getElementById("jira-frontend").prepend(newButtonsWrapper);

      setupButton(TOGGLE_BUTTON_ID, disableButtons);
      setupButton(EXPAND_BUTTON_ID, disableButtons);
      setupButton(COPY_NAME_BUTTON_ID);
      setupButton(COPY_NAME_URL_BUTTON_ID);
      setupButton(JUMP_DESCRIPTION_ID, disableButtons);
      setupButton(GO_UP_ID);

      const css = `
        [data-component-selector="breadcrumbs-wrapper"] {
          anchor-name: --breadcrumbs;
        }

        @supports(anchor-name: --breadcrumbs) {
        div#gt-extra-buttons {
          position: absolute;
          position-anchor: --breadcrumbs;
          position-area: right;
          z-index: 100;
        }
        div#gt-extra-buttons button {
          padding: 5px;
          border-radius: 4px;
        }
        div#gt-extra-buttons button:hover {
          background: #eee;
          cursor: pointer;
        }
        div#gt-extra-buttons button[disabled] {
          opacity: 0.3;
        }
        div#gt-extra-buttons button[disabled]:hover {
          cursor: not-allowed;
        }
        div#gt-extra-buttons button:active {
          border: 1px solid #89ceef;
        }
        }`,
        head = document.head || document.getElementsByTagName("head")[0],
        style = document.createElement("style");
      style.id = "gt-extra-buttons-style";

      head.appendChild(style);

      style.appendChild(document.createTextNode(css));
    } else {
      console.debug("Userscript::Jira - breadcrumbs-wrapper not found");
    }
  }

  function resetToggleEdit() {
    isDoubleClickEnabled = false;

    toggleButtonElement.textContent = "🔒";
    descriptionElement.addEventListener("click", handleClick, true);
    descriptionElement.style.border = "1px solid red";
  }

  /**
   * Toggles the double-click-to-edit functionality when the toggle button is clicked.
   * Updates the button icon and adds/removes the event listener on the description element.
   */
  function toggleDoubleClickEdit(event) {
    if (event?.target.disabled) {
      return;
    }

    isDoubleClickEnabled = !isDoubleClickEnabled;

    descriptionElement = document.querySelector(
      '[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document'
    );

    if (isDoubleClickEnabled) {
      toggleButtonElement.textContent = "✏️";
      descriptionElement.removeEventListener("click", handleClick, true);
      descriptionElement.style.border = "unset";
    } else {
      toggleButtonElement.textContent = "🔒";
      descriptionElement.addEventListener("click", handleClick, true);
      descriptionElement.style.border = "1px solid red";
    }
  }

  function expandHandler(event) {
    if (event.target.disabled) return;

    isExpanded = !isExpanded;
    const descriptionElement = document.querySelector(
      '[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document'
    );

    if (isExpanded) {
      expandButtonElement.textContent = "⏬";
      descriptionElement.style.height = "unset";
    } else {
      expandButtonElement.textContent = "⏩";
      descriptionElement.style.height = "200px";
      descriptionElement.style.overflowY = "scroll";
    }
  }

  function jumpDescHandler(event) {
    if (event.target.disabled) return;

    mainScrollableElement.scroll({ top: descriptionElement.scrollHeight });
  }

  function goToTopHandler() {
    mainScrollableElement.scroll({ top: 0 });
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
    const hoveredElts = descriptionElement.querySelectorAll(":hover");
    for (const elt of hoveredElts) {
      if (
        elt.getAttribute("data-testid") === "media-file-card-loaded-view" ||
        elt.getAttribute("data-testid") === "media-file-card-view" ||
        elt.getAttribute("data-testid") === "media-card-inline-player" ||
        elt.getAttribute("data-node-type") === "mediaInline"
      ) {
        return;
      }
    }

    e.stopPropagation();
    console.debug(
      "Userscript::Jira - Blocked click-edit of Jira issue description. You're welcome."
    );
  }

  function isJiraEpicPage(url) {
    return url?.match(/https:\/\/.*\.atlassian\.net\/browse\/.*/);
  }

  function cleanup() {
    currentUrl = document.URL;
    isDoubleClickEnabled = false;
    isExpanded = true;
    document.getElementById("gt-extra-buttons")?.remove();
    document.getElementById("gt-extra-buttons-style")?.remove();
    toggleButtonElement = undefined;
    expandButtonElement = undefined;
    copyNameButtonElement = undefined;
    copyNameAndUrlButtonElement = undefined;
    jumpDescButtonElement = undefined;
    goUpButtonElement = undefined;
    descriptionElement?.removeEventListener(handleClick);
    descriptionElement = undefined;
    mainScrollableElement = undefined;
    extraButtonsEnabled = false;
  }

  let descriptionElement;
  let mainScrollableElement;
  let extraButtonsEnabled = false;
  let currentUrl = document.URL;

  // Wait for the Jira issue description UI to load before creating the extra buttons
  // first create buttons disabled then enable them when description field is found
  setTimeout(() => createExtraButtons(true), 1000);

  let attempts = 0;
  let intervalId = setInterval(() => {
    attempts++;

    if (document.URL !== currentUrl) {
      console.debug(
        `Userscript::Jira - browsing to a new page ${document.URL} from ${currentUrl}`
      );
    }

    if (document.URL !== currentUrl && !isJiraEpicPage(document.URL)) {
      // clean up
      console.debug(
        `Userscript::Jira - browsing to a non-epic page, clean up the toolbar`
      );
      cleanup();
      return;
    }

    if (!isJiraEpicPage(document.URL)) {
      // url hasn't changed and we're still on a non-epic page, do nothing
      return;
    }

    mainScrollableElement = document.querySelector(
      '[data-testid="issue.views.issue-details.issue-layout.container-left"]'
    );
    descriptionElement = document.querySelector(
      '[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document'
    );

    if (
      document.URL !== currentUrl &&
      isJiraEpicPage(document.URL) &&
      !isJiraEpicPage(currentUrl)
    ) {
      // we come back to a jira epic page from a non-epic page, reset the toolbar
      console.debug(
        `Userscript::Jira - browsing back an epic page from a non-epic page, recreate the toolbar`
      );
      createExtraButtons(true);
    }

    if (
      document.URL !== currentUrl ||
      (!extraButtonsEnabled && descriptionElement)
    ) {
      currentUrl = document.URL;
      enableButtons();
      resetToggleEdit();
      console.debug(
        "Userscript::Jira - setInterval - description found, buttons enabled"
      );
    } else if (extraButtonsEnabled && !descriptionElement) {
      disableButtons();
      isDoubleClickEnabled = false;
      isExpanded = true;
      console.debug(
        `Userscript::Jira - description field not found or empty, won't enable related toolbar buttons`
      );
    }
    return;
  }, 3_000);
})();
