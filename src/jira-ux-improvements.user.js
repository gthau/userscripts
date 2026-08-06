// ==UserScript==
// @name         Jira UX Improvements
// @namespace    http://tampermonkey.net/
// @version      0.1.14
// @description  Makes some UX improvements to Jira: disable Click Edit, collapse Description, copy epic name and url. Fork of "Disable Jira Click Edit" by fanuch (https://gist.github.com/fanuch/1511dd5423e0c68bb9d66f63b3a9c875)
// @author       gthau
// @match        https://*.atlassian.net/browse/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @updateURL    https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-ux-improvements.user.js
// @downloadURL  https://raw.githubusercontent.com/gthau/userscripts/refs/heads/master/src/jira-ux-improvements.user.js
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

  // ----------------------------------------------------------------- helpers

  const LOGGER_PREFIX = "[Jira UX] ";
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

  // Jira re-renders under us constantly, so any node we read may be gone by the
  // time we touch it. One failure should cost the caller, not the session.
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

  // ------------------------------------------------------------------- state

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

  // Emoji alone are a guess on a toolbar this small, so every button carries a
  // tooltip that says what it does.
  const BUTTON_LABELS = {
    [TOGGLE_BUTTON_ID]: ["✏️", "Block click-to-edit on the description"],
    [EXPAND_BUTTON_ID]: ["⏬", "Collapse the description"],
    [COPY_NAME_BUTTON_ID]: ["📃 name", "Copy the issue key and summary"],
    [COPY_NAME_URL_BUTTON_ID]: [
      "📃 name/URL",
      "Copy the issue key, summary and URL",
    ],
    [JUMP_DESCRIPTION_ID]: ["⤵️ desc.", "Scroll past the description"],
    [GO_UP_ID]: ["⤴️ top", "Scroll back to the top"],
  };

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
    // `disabled` reflects to the content attribute on a real button, so the
    // CSS `button[disabled]` rules follow from the property alone.
    button.disabled = isDisabled;

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
      if (!button) continue;
      button.disabled = false;
    }
    extraButtonsEnabled = true;
  }

  function disableButtons() {
    for (const buttonId of disableableButtonsIds) {
      const button = document.getElementById(buttonId);
      if (!button) continue;
      button.disabled = true;
    }
    extraButtonsEnabled = false;
  }

  /**
   * Creates the toggle button and inserts it into the Jira issue description UI.
   * @param disableButtons In case the description element was not found we disable the associated buttons
   */
  function createExtraButtons(disableButtons = false) {
    logger.debug(`createExtraButtons, disableButtons = ${disableButtons}`);
    const breadcrumbsElt = document
      .getElementById("jira-issue-header")
      ?.querySelector('[data-component-selector="breadcrumbs-wrapper"]');
    const mountElt = document.getElementById("jira-frontend");

    if (breadcrumbsElt && mountElt) {
      // This markup used to be parsed as XML, which put the elements in the
      // null namespace: they looked like buttons and took clicks, but they were
      // not HTMLButtonElement. No tab focus, no Enter or Space, no button role
      // for screen readers, and `disabled` was an expando that reflected
      // nothing -- the disabled styling only worked because the code also set
      // the attribute by hand.
      const newButtonsWrapper = document.createElement("div");
      newButtonsWrapper.id = "gt-extra-buttons";

      for (const buttonId of allButtonsIds) {
        const [label, title] = BUTTON_LABELS[buttonId];
        const button = document.createElement("button");
        button.id = buttonId;
        button.type = "button";
        button.textContent = label;
        button.title = title;
        newButtonsWrapper.append(button);
      }

      mountElt.prepend(newButtonsWrapper);

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
          position-area: center right;
          z-index: 1;
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
        }`;

      injectStyle("gt-extra-buttons-style", css);
    } else {
      logger.debug("breadcrumbs-wrapper not found");
    }
  }

  function resetToggleEdit() {
    if (!toggleButtonElement || !descriptionElement) return;

    isDoubleClickEnabled = false;

    toggleButtonElement.textContent = "🔒";
    descriptionElement.addEventListener("click", handleClick, true);
    descriptionElement.style.border = "1px solid red";
  }

  /**
   * Toggles the double-click-to-edit functionality when the toggle button is clicked.
   * Updates the button icon and adds/removes the event listener on the description element.
   */
  function toggleDoubleClickEdit() {
    isDoubleClickEnabled = !isDoubleClickEnabled;

    descriptionElement = document.querySelector(
      '[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document',
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

  function expandHandler() {
    isExpanded = !isExpanded;
    const descriptionElement = document.querySelector(
      '[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document',
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

  function jumpDescHandler() {
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
          },
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
    const hoveredElts = [
      ...descriptionElement.querySelectorAll(":hover"),
    ].toReversed();
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
    logger.debug(
      "Blocked click-edit of Jira issue description. You're welcome.",
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
    descriptionElement?.removeEventListener("click", handleClick, true);
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

  // One throw used to kill the toolbar for the life of the tab: the interval
  // kept firing, kept throwing on the same null, and nothing ever recovered.
  // Log and let the next tick try again instead.
  function tick() {
    if (document.URL !== currentUrl) {
      logger.debug(`browsing to a new page ${document.URL} from ${currentUrl}`);
    }

    if (document.URL !== currentUrl && !isJiraEpicPage(document.URL)) {
      // clean up
      logger.debug(`browsing to a non-epic page, clean up the toolbar`);
      cleanup();
      return;
    }

    if (!isJiraEpicPage(document.URL)) {
      // url hasn't changed and we're still on a non-epic page, do nothing
      return;
    }

    mainScrollableElement = document.querySelector(
      '[data-testid="issue.views.issue-details.issue-layout.container-left"]',
    );
    descriptionElement = document.querySelector(
      '[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document',
    );

    // The one-shot `setTimeout` above loses the race on a slow load and never
    // retried, so a missing toolbar was permanent. Rebuild it whenever it is
    // absent instead.
    if (!document.getElementById("gt-extra-buttons")) {
      logger.debug(`toolbar missing, recreating it`);
      createExtraButtons(true);
    }

    if (
      document.URL !== currentUrl ||
      (!extraButtonsEnabled && descriptionElement)
    ) {
      currentUrl = document.URL;
      // Enabling on a URL change alone used to run `resetToggleEdit` before the
      // description had mounted: it threw halfway, leaving the button reading
      // "locked" while click-to-edit was still live.
      if (descriptionElement) {
        enableButtons();
        resetToggleEdit();
        logger.debug("setInterval - description found, buttons enabled");
      }
    } else if (extraButtonsEnabled && !descriptionElement) {
      disableButtons();
      isDoubleClickEnabled = false;
      isExpanded = true;
      logger.debug(
        `description field not found or empty, won't enable related toolbar buttons`,
      );
    }
  }

  setInterval(() => guard(tick), 3_000);
})();
