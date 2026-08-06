# ADR: Jira UX Improvements userscript

- **Status:** Accepted
- **Date:** 2026-08-06
- **Applies to:** `src/jira-ux-improvements.user.js` (version 0.3.0)

## About this document

This document uses the writing rules of ASD-STE100 (Simplified Technical
English). Sentences are short. The voice is active. Each word has one meaning.
Names from the source code stay as they are, in `code font`.

---

## 1. Context

Jira Cloud is a single-page application. Three properties of this application
control the design of the script.

1. Jira writes a new URL into the browser history. It does not load a new page.
   Thus the script stays alive when the user goes to a different issue.
2. React builds the issue view after the URL changes. The delay is not
   constant. A slow network makes the delay longer.
3. React builds the issue view again many times while the URL stays the same.
   This occurs when the user selects a different tab, saves an edit, or scrolls
   a virtualised list.

The first version of the script used one timer. The timer read the full URL
every 3 seconds. From that one signal, the script tried to answer two different
questions:

- Which issue does the user look at?
- Is the description in the page?

The two questions have different answers at different times. Because one timer
answered both, the script kept four flags that had to agree with each other.
They did not always agree. These failures were the result:

- If Jira was slow, the toolbar never appeared, and the timer wrote an error to
  the console every 3 seconds for the life of the tab.
- After the user went to a different issue, the lock button could show the
  locked icon while click-to-edit stayed active.
- The script did not know about a re-render that kept the same URL.

## 2. Decision

Use two independent signals. Calculate everything else from the page.

### 2.1 Two signals

| Signal | Question it answers             | Source                        |
| ------ | ------------------------------- | ----------------------------- |
| Route  | Which issue, or no issue?       | History and navigation events |
| Mount  | Is the description in the page? | CSS animation events          |

Both signals call the same function, `render`.

### 2.2 One function writes to the page

Only `render` changes the page. You can call `render` many times in sequence.
The result is always the same. This property has three effects:

- A new signal is safe. It only calls `render`.
- The script has no sequence of steps that can stop in the middle.
- Button labels and tooltips are functions of the current state. Thus a button
  cannot show one condition while the state holds a different condition.

### 2.3 The script finds the route with three methods

The script uses the first method that the browser supplies:

1. **The Navigation API.** `window.navigation` sends one `navigate` event for
   `pushState`, for `replaceState`, for the back and forward buttons, and for a
   click on a link. This event occurs before the navigation is complete.
   Therefore the script reads the new URL from the event, not from `location`.
2. **A change to the two history methods.** The script replaces
   `history.pushState` and `history.replaceState`. Each replacement calls the
   original method first, keeps the result, and then tells the script. The
   router of the page gets the correct result. The script also listens for
   `popstate` and `hashchange`.
3. **A timer.** A timer reads `location` every 2 seconds. This timer is a
   safety device, not the primary method.

The script gets the issue key from the path, for example `RDC-123`. It compares
keys, not full URLs. Therefore a query parameter, an anchor, or a sub-path does
not look like a move to a different issue.

**Note:** `@grant none` puts the script in the page context. Thus the `history`
object of the script is the same object that the Jira router uses.

### 2.4 The script finds the mount with a CSS animation

The script adds this rule to the page:

```css
@keyframes gt-jira-ux-mount {
  from {
    outline-color: currentColor;
  }
  to {
    outline-color: currentColor;
  }
}

[breadcrumbs selector],
[description selector] {
  animation: gt-jira-ux-mount 1ms linear;
}
```

The animation changes nothing that the user can see. But the browser sends an
`animationstart` event when it puts a node that agrees with the selector into
the page. The event goes up to the document. One listener on the document is
sufficient.

This method is better than a timer for three reasons:

- There is no delay before the first result.
- There is no permanent `MutationObserver` on a large React page.
- The browser sends the event again for each new build of the same node.

A timer with a period of 5 seconds is a safety device. It operates only if the
CSS of the page defeats the `animation` property.

The Bitbucket script in this repository uses the same method.

### 2.5 `@match` covers the full site

`@match` is `https://*.atlassian.net/*`, not `https://*.atlassian.net/browse/*`.

`@match` controls injection only. Tampermonkey reads `@match` when the document
loads. It does not read `@match` again after a change to the history. With the
narrow pattern, this sequence failed: the user opens a board, and then clicks
an issue. Tampermonkey never put the script into the page. No code in the page
can correct this.

The route test in the script is now the only control on the toolbar. The cost
is small. On a page that is not an issue, the script does one comparison for
each route change.

### 2.6 CSS holds the state of the description

`render` writes two attributes to the `<html>` element:

- `data-gt-jira-locked`
- `data-gt-jira-collapsed`

Style rules use these attributes. Example:

```css
html[data-gt-jira-collapsed="true"] [description selector] {
  max-height: 200px;
  overflow-y: auto;
}
```

The browser applies a style rule to each node that agrees with the selector.
This includes the nodes that React has not built yet. Therefore the lock
outline and the collapsed height come back without help after each new build.
The earlier version wrote styles directly to the node. Those styles were lost
at each new build.

The `jira-show-fixversion-dates` script uses the same method for its `::after`
rules.

### 2.7 One listener prevents click-to-edit

One listener on the document, in the capture phase, prevents click-to-edit. The
earlier version attached a listener to the description node and attached it
again after each new build.

The listener does three tests. It stops the event only if all three pass:

1. The lock is active.
2. The target of the click is inside the description.
3. The target of the click is not a media card.

Test 3 lets the user open an attachment and play a video. The listener calls
`stopPropagation`. It does not call `preventDefault`. Therefore a link in the
description continues to operate.

This design removes a full group of problems. There is no listener to remove,
and no listener that can point to a node that Jira deleted.

### 2.8 The lock and the collapse are different types of state

| State    | Where it lives                         | Life                   |
| -------- | -------------------------------------- | ---------------------- |
| Collapse | `localStorage`, key `gt-jira-ux.prefs` | Permanent              |
| Lock     | Memory only                            | The current issue only |

The collapse answers this question: how do you prefer to read a description?
This preference is stable. Thus the script keeps it.

The lock answers a different question: are you finished with _this_
description? Thus the script sets the lock to active at each load, and again
when the user goes to a different issue. An unlock is not permanent. The user
cannot leave an editable description behind.

A new build of the same issue does not change the lock. If it did, a saved edit
would close the description while the user works.

### 2.9 Buttons are `<button>` elements

The earlier version made the toolbar with `DOMParser` and the type `text/xml`.
The markup had no `xmlns` declaration. Therefore the elements had no namespace.
They were not `HTMLButtonElement` objects. The results were bad:

- The Tab key did not move the focus to them.
- The Enter key and the Space key did not operate them.
- Screen readers did not know that they were buttons.
- The `disabled` property was an extra property. It changed no attribute.

`document.createElement` makes correct buttons.

### 2.10 Colors come from the Atlassian design tokens

The style rules read tokens such as `--ds-background-neutral` and `--ds-text`.
Each token has a standard color as an alternative value. Thus the toolbar
agrees with the theme of the user, in light mode and in dark mode. The script
does not test which theme is active.

A `prefers-color-scheme: dark` block changes only the alternative values. If
Jira supplies the token, the token wins in both themes.

### 2.11 Position

The toolbar is a child of `#jira-frontend`. It is not a child of the
breadcrumbs. React controls the breadcrumbs and can delete their children.

CSS anchor positioning puts the toolbar at the right side of the breadcrumbs.
Only Chromium supports this feature today. Therefore:

- All style rules for the buttons are outside the `@supports` block.
- Only the position rules are inside the `@supports` block.
- Without anchor positioning, the toolbar goes to the top right corner. This
  position is not as good, but the user can use it.

---

## 3. What the script gives the user

The toolbar has eight buttons. Each button has a keyboard shortcut.

| Button      | Function                                           | Shortcut      |
| ----------- | -------------------------------------------------- | ------------- |
| 🔒 / ✏️     | Prevent or permit click-to-edit on the description | `Alt+Shift+L` |
| ⏬ / ⏩     | Expand or collapse the description                 | `Alt+Shift+E` |
| 📃 name     | Copy `[ABC-123] Summary`                           | `Alt+Shift+N` |
| 📃 name/URL | Copy the name and the URL                          | `Alt+Shift+U` |
| 🔗 link     | Copy a link                                        | `Alt+Shift+M` |
| 🔑 key      | Copy `ABC-123`                                     | `Alt+Shift+I` |
| ⤵️ desc.    | Move down past the description                     | `Alt+Shift+D` |
| ⤴️ top      | Move up to the top                                 | `Alt+Shift+T` |

Notes on the buttons:

- The 🔗 link button writes two formats to the clipboard. Plain text gets
  Markdown. HTML gets an `<a>` element. Thus a paste into Confluence, Slack, or
  a pull request gives a link that operates.
- The two toggle buttons show a different color when their condition is active.
- A copy button shows ✅ or ⚠️ for 900 ms. Then `render` puts the label back.
- The script disables the three buttons that need the description if the
  description is not in the page.
- A shortcut operates the button. It does not call the function of the button.
  Therefore the disabled condition and the ✅ signal are the same for the mouse
  and for the keyboard.
- The script ignores a shortcut if the user types in a field.

Shortcuts use `Alt+Shift` because Jira uses many single keys. The script reads
`event.code`, not `event.key`, because `Option+Shift` on macOS makes a
different character.

### The move down past the description

The button puts the bottom edge of the description at the top of the scroll
container. The calculation is:

```
top = descriptionBottom - containerTop + container.scrollTop
```

This is a position, not a height. Two earlier methods were not correct:

- `scroll({top: description.scrollHeight})` uses a height as a position. The
  error is equal to the height of the content above the description. A
  collapsed description gives a very large error, because the node continues to
  report its full height.
- `scrollIntoView({block: "start"})` puts the _top_ edge of the description at
  the top of the container. The description is already near the top. Thus the
  page moves approximately 50 px only.

---

## 4. Rejected alternatives

| Alternative                           | Why the script does not use it                                                                                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MutationObserver` on the issue view  | A permanent observer on a large React tree is expensive. The CSS animation gives the same data at a lower cost.                                                                                                                                     |
| A shared library file with `@require` | Tampermonkey keeps a copy of a `@require` file. The GitHub raw server also keeps a copy. Therefore an update to the library does not always go to the users. A version number in the URL would correct this, but this repository has no build step. |
| `AbortController` for each route      | The design has no listener that belongs to one route. The two document listeners are permanent. The button listeners go away with their buttons.                                                                                                    |
| The toolbar inside the breadcrumbs    | React can delete the children of a node that it controls.                                                                                                                                                                                           |
| Bare keys for the shortcuts           | Jira uses many single keys.                                                                                                                                                                                                                         |

---

## 5. Risks and limits

1. **Selectors.** The script uses `data-testid` values and one element id from
   Jira. Atlassian can change them. If the summary selector fails, the script
   reads `document.title` instead. If the description selector fails, the
   script disables three buttons but continues to operate.
2. **The Navigation API path is not fully tested.** The automatic test uses
   jsdom, which has no Navigation API. Therefore the test examines the second
   method only.
3. **`@match` on the full site.** The script now loads on each Atlassian page.
   The cost is small, but it is not zero.
4. **A change to `history`.** The script replaces two methods on the `history`
   object of the page. It calls the original method first and keeps the result.
   But a different script that makes the same change can be a problem.
5. **A sticky header.** The move down past the description puts the next
   section at the top of the container. If Jira adds a sticky header to that
   container, the header can hide the first line.

---

## 6. How to test

There is no test system in this repository. Use these steps in a browser.

1. Open an issue with a cold cache. Use the "Slow 3G" setting of the developer
   tools. The toolbar must appear, and the buttons must become active.
2. Go from one issue to a second issue with a link. Then use the back button
   and the forward button.
3. Open a board first. Then click an issue. The toolbar must appear.
4. Open an issue that has no description. The toolbar must appear. Three
   buttons must stay disabled.
5. Select a different tab. Then edit the description and save it. The toolbar
   must stay correct.
6. Unlock the description. Then go to a different issue. The lock must be
   active again.
7. Collapse the description. Then expand it. No unwanted scroll bar must stay.
8. The console must show no errors.

---

## 7. Related decisions in this repository

- `bitbucket-ux-improvements.user.js` — the source of the `animationstart`
  method, and of the `logger`, `guard`, and `injectStyle` functions.
- `jira-show-fixversion-dates.user.js` — the source of the method that puts
  state into a style sheet, to keep it after a new build.
