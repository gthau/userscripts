# ADR: Jira UX Improvements userscript

- **Status:** Accepted
- **Date:** 2026-08-06. Revised 2026-08-20 for versions 0.4.0 and 0.4.1.
- **Applies to:** `src/jira-ux-improvements.user.js` (version 0.4.1)

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

The toolbar is a child of `<body>`. It is not a child of the breadcrumbs, and
it is not a child of `#jira-frontend` either.

React controls the breadcrumbs and can delete their children, so the toolbar
cannot live there. `#jira-frontend` is worse: it is the element React hydrates
the server-rendered page into. A node put in front of that markup is a
hydration mismatch. React then throws the whole page away and builds it again
on the client, which is why the skeleton used to come back about a second
after the issue was already readable. `<body>` is outside everything React
owns, so nothing there can delete the toolbar and the toolbar cannot disturb
the page.

Anchor positioning does not care who the parent is. It only needs the
breadcrumbs to carry the anchor name. The toolbar lands in the same place
either way.

CSS anchor positioning puts the toolbar at the right side of the breadcrumbs.
Only Chromium supports this feature today. Therefore:

- All style rules for the buttons are outside the `@supports` block.
- Only the position rules are inside the `@supports` block.
- Without anchor positioning, the toolbar goes to the top right corner. This
  position is not as good, but the user can use it.

### 2.12 The toolbar is one card

The toolbar is a surface. It has a border, a corner radius, and a shadow. All
the buttons are inside it. A button has no fill of its own until the pointer is
on it.

Version 0.3.3 gave each button a grey fill. Eight filled buttons made a solid
block. The block was beside a line of text that has no other blocks in it.

Three designs were built and compared in a browser at the same time:

| Design | Container            | Buttons                        |
| ------ | -------------------- | ------------------------------ |
| A      | none                 | flat, with labels              |
| B      | none                 | icons only, copy in a menu     |
| C      | one surface          | flat, with labels, segmented   |

A and C have the same buttons. Only the container is different. C was selected,
for these reasons:

- The toolbar is a tool. It is not part of the page. The surface says so.
- The user can find it at one glance.
- The fixed corner needs the surface. There the toolbar floats above the
  navigation band of Jira, above a colour that the script does not control.

### 2.13 The toolbar folds to the width of the line

The space after the breadcrumbs is not a constant. Three things change it: the
number of parent issues, the width of the window, and the sidebar.

The toolbar has four rungs:

| Rung      | What it shows                                                |
| --------- | ------------------------------------------------------------ |
| `full`    | All eight actions. The four copy actions have labels.        |
| `tight`   | The four copy actions become one menu.                       |
| `compact` | The two move actions lose their labels.                      |
| `minimal` | One menu holds the six. The two toggles stay.                |

The script measures. It builds each rung into the toolbar and reads the width of
the box. Then it keeps the widest rung that is not larger than the space. Four
builds and one keep are not visible, because the browser calculates the layout
in one operation and paints no frame in the middle of it.

The measurement is of the true element, with the true font and the true border.
A copy of the toolbar would be a second thing to keep in agreement with the
style sheet.

The script measures one time and keeps the widths. No rung changes width when
the state changes: each label is a constant string, and a disabled button has
the size of an enabled button. A resize deletes the widths, because a zoom
changes them.

**A `ResizeObserver` watches the two boxes that the measurement reads.** Version
0.4.0 listened for the `resize` event of the window and nothing else. That event
answers a different question. The space after the breadcrumbs also changes when
the user moves the right sidebar of Jira, when a panel opens, and when the layout
of Jira occurs some frames after the `resize` event. None of these is a `resize`
event. Thus the only thing that saw them was the backstop of 5 seconds, and the
toolbar stayed at the incorrect rung for that time. A user reported it, and a
harness measured it at the full 5 seconds.

A `ResizeObserver` also reports **after** the layout. The `resize` event occurs
before it.

The observer cannot cause itself. The toolbar is `position: absolute` in one
branch and `position: fixed` in the other. It is outside the flow in both.
Therefore its width cannot change the box of the header or of the breadcrumbs.

React replaces both boxes when it builds the issue view again. An observer on a
node that is not in the document reports nothing. Thus each redraw compares the
node it watches with the node in the page, and moves the observer if they are
different.

Two rules control the ladder:

- The two toggles stay at each rung. They answer a question about the
  description that is on the screen now.
- A group folds as one group. One part of a group does not fold.

### 2.14 The icons are drawn in the script

Each icon is an SVG of 16 pixels. It has one colour: `currentColor`. Thus an
icon takes the colour of the theme, the colour of a disabled button, and the
colour of a pressed toggle. It does this with no other rule.

Version 0.3.3 used emoji. Emoji have three problems. The colour is not a colour
that this script selected. The image is different on each operating system: on
Windows three of the eight became a flat blue glyph. And an emoji cannot take
the disabled colour, so a disabled button kept a bright yellow key.

The script builds each icon with `createElementNS`. There are two reasons. An
SVG element that comes from the HTML parser has no namespace and does not draw:
this is the same trap as §2.9. And a page that operates Trusted Types makes each
`innerHTML` operation fail.

**The icon of a toggle shows the state. It does not show the action.** The first
design of this set showed a closed padlock for a locked description and a pencil
for an unlocked one. A padlock and a pencil are not the same type of word: a
padlock says what the description IS, and a pencil says what a click DOES. Thus
one of the two icons was always incorrect. The pair is now a closed padlock and
an open padlock.

The state is the correct type for these two controls, for three reasons:

- Each toggle is an ARIA toggle. It has `aria-pressed`, and the style sheet
  gives it a different colour when it is pressed. An icon of the opposite action
  disagrees with the colour and with the words of a screen reader.
- Neither toggle has a text label. Thus the icon is the only part of the toolbar
  that can show the state. The red outline of the description is not sufficient:
  it is not on the screen when the user moves down the page.
- The other toggle already operates in this manner. Chevrons that point away
  from each other show a description at full height.

### 2.15 A click and a shortcut use one door

Both call `activate(id)`. This function finds the action, tests the disabled
rule, and operates the action.

Version 0.3.3 did something different: the shortcut found the button by its id
and clicked it. The ladder makes that method incorrect, because an action at a
narrow rung has no button. Each shortcut for a folded action would do nothing.

The feedback goes to the control that shows the action: the button of the
action, or the fold that holds it. Thus a copy that starts from a keyboard
shortcut, inside a menu that is closed, still shows a result.

---

## 3. What the script gives the user

The toolbar has eight actions in three groups. A line separates each group.
Each action has a keyboard shortcut.

| Group | Icon and label  | Function                                           | Shortcut      |
| ----- | --------------- | -------------------------------------------------- | ------------- |
| state | padlock, closed or open | Prevent or permit click-to-edit on the description | `Alt+Shift+L` |
| state | chevrons, apart or together | Expand or collapse the description             | `Alt+Shift+E` |
| copy  | page + name     | Copy `[ABC-123] Summary`                           | `Alt+Shift+N` |
| copy  | page + name/URL | Copy the name and the URL                          | `Alt+Shift+U` |
| copy  | chain + link    | Copy a link                                        | `Alt+Shift+M` |
| copy  | key + key       | Copy `ABC-123`                                     | `Alt+Shift+I` |
| move  | arrow + desc.   | Move down past the description                     | `Alt+Shift+D` |
| move  | arrow + top     | Move up to the top                                 | `Alt+Shift+T` |

The group is not decoration. It is the unit that the ladder of §2.13 folds, and
the unit that the separator lines show.

Notes on the buttons:

- The 🔗 link button writes two formats to the clipboard. Plain text gets
  Markdown. HTML gets an `<a>` element. Thus a paste into Confluence, Slack, or
  a pull request gives a link that operates.
- The two toggle buttons show a different colour when their condition is
  active. The icon of a toggle shows the condition, not the operation. Refer to
  §2.14.
- A copy action shows a check icon or a warning icon for 900 ms. Then `render`
  puts the true icon back.
- The script disables the three actions that need the description if the
  description is not in the page. This includes the actions inside a menu.
- A shortcut and a click use one door, `activate`. Therefore the disabled
  condition and the feedback are the same for the mouse and for the keyboard.
  Refer to §2.15.
- At a narrow rung, some actions are in a menu. Their labels and their shortcuts
  are in that menu.
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
| Emoji for the icons                   | Refer to §2.14. Three of the eight became a flat blue glyph on Windows, and no emoji can take the colour of a disabled button.                                                                                                                      |
| Icons only, with no labels            | Design B of §2.12. It is the shortest toolbar. But the four copy actions become four similar glyphs, and the user must point at one to know which it is.                                                                                            |
| A surface only in the fixed corner    | This rule was built and compared: no surface beside the breadcrumbs, a surface in the corner. It gives one tool two appearances. §2.12 selected one appearance.                                                                                     |
| A media query for the ladder          | The width of the window is not the constraint. A deep parent chain removes the space with no change to the window. Only a measurement sees this.                                                                                                    |
| The `resize` event of the window, alone| Version 0.4.0 used it. It reports that the WINDOW changed, not that the room changed, and it reports before the layout. §2.13 gives the 5 seconds this cost.                                                                                        |

---

## 5. Risks and limits

1. **Selectors.** The script uses `data-testid` values and one element id from
   Jira. Atlassian can change them. If the summary selector fails, the script
   reads `document.title` instead. If the description selector fails, the
   script disables three buttons but continues to operate.
2. **The Navigation API path is not tested.** The harnesses beside the script
   drive a real Chrome, but no harness makes it navigate. Therefore the
   `pushState` path is the path that the tests examine.
3. **`@match` on the full site.** The script now loads on each Atlassian page.
   The cost is small, but it is not zero.
4. **A change to `history`.** The script replaces two methods on the `history`
   object of the page. It calls the original method first and keeps the result.
   But a different script that makes the same change can be a problem.
5. **A sticky header.** The move down past the description puts the next
   section at the top of the container. If Jira adds a sticky header to that
   container, the header can hide the first line.
6. **The fallback corner is inside Jira's navigation band.** Without anchor
   positioning the toolbar goes to the top right corner, where Jira's own global
   navigation paints above a low `z-index`. At `z-index: 1` the toolbar was
   **invisible**, not merely in a poor position. Firefox never takes the anchor
   branch, so **each Firefox user of version 0.3.1 and earlier had no toolbar at
   all**, and no Chromium user ever saw it. Version 0.3.2 gives the fixed corner
   `z-index: 9999` and keeps the anchored rule at `1`, so the Chromium position
   does not change and the toolbar cannot paint over a dialog of Jira. The
   condition was found by the harness of the Jira Cart effort, with a switch that
   forces the fallback path. Refer to
   [`jira-cart.user.md` §2.9](jira-cart.user.md).
7. **The element that bounds the measurement.** The ladder measures from the end
   of the breadcrumbs to the right edge of `#jira-issue-header`. This is an
   assumption about the page of Jira, and no harness can test it, because the
   fixtures supply that element themselves. If Atlassian puts its own controls
   in that space, the toolbar can select a rung that is too wide and cover them.
8. **The observer sees a box, not a boundary.** The `ResizeObserver` reports each
   change of the two boxes that the measurement reads. If a control of Jira takes
   space in the line but does not change the width of `#jira-issue-header`, no box
   changes, the observer reports nothing, and the rung stays the same. This is
   risk 7 in a different form. The backstop of 5 seconds does not correct it
   either, because the calculation gives the same answer.
9. **A folded shortcut is less easy to find.** At a narrow rung the labels and
   the shortcut hints of the folded actions are in a menu. The user must open
   the menu to see them.
10. **The width of a rung is measured one time.** A resize deletes the
    measurements, and `document.fonts.ready` causes one more measurement. A font
    that Jira loads after that point makes each label a different width, and no
    signal reports it.

---

## 6. How to test

Three harnesses are beside the script, in `test/jira-ux-improvements/`. They
drive a real Chrome:

```
node test/jira-ux-improvements/run.mjs
```

`ladder-smoke.mjs` measures the four rungs of §2.13 at four widths of the line.
It also operates a shortcut for an action that the rung folded away, which is
the failure that §2.15 prevents.

The harnesses do not use the true DOM of Jira. Therefore use these steps in a
browser too.

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
8. Make the window more narrow, slowly. The toolbar must fold: first the copy
   actions, then the labels of the two move actions, then all six.
9. Move the right sidebar of Jira to make it wider and then more narrow. The
   toolbar must fold immediately, and not after some seconds.
10. Open an issue that has a deep chain of parent issues. The toolbar must fold,
   with no change to the window.
11. At a narrow rung, use `Alt+Shift+I`. The key must go to the clipboard, and
    the fold must show a check icon.
12. Open a menu. Then click outside it, and press `Escape`. Both must close it.
13. The console must show no errors.

---

## 7. Related decisions in this repository

- `bitbucket-ux-improvements.user.js` — the source of the `animationstart`
  method, and of the `logger`, `guard`, and `injectStyle` functions.
- `jira-show-fixversion-dates.user.js` — the source of the method that puts
  state into a style sheet, to keep it after a new build.
- `jira-cart.user.js` — the source of the card: one surface with a border, a
  radius, and the overlay shadow, from the design tokens of Atlassian.
- The three designs of §2.12 and the ladder of §2.13 were built first as one
  prototype page with instruments for the width, the theme, and the state. The
  prototype is not in this repository. The decision is in this document.
