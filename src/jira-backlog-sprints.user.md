# ADR: Jira Backlog Sprints userscript

- **Status:** Accepted
- **Date:** 2026-08-07
- **Applies to:** `src/jira-backlog-sprints.user.js` (version 0.1.0)

## About this document

This document uses the writing rules of ASD-STE100 (Simplified Technical
English). Sentences are short. The voice is active. Each word has one meaning.
Names from the source code stay as they are, in `code font`.

---

## 1. Context

The Jira Backlog view does not show the sprints of the board. It shows each
sprint that a member of the board team takes part in. One member who works for
two teams is therefore sufficient to put the sprints of the second team on the
page.

This occurred on the Rundown board, id `2122`. A count of the page gives these
numbers:

| Group                            | Count |
| -------------------------------- | ----- |
| Card lists on the page           | 33    |
| The backlog itself               | 1     |
| Sprints                          | 32    |
| Sprints of the Rundown board     | 15    |
| Sprints of four other boards     | 17    |

The 17 sprints come from `Planning`, `wnRelease`, `MAM UI Team`, `Ingest` and
`Dalia`. The user does not plan work in them. They make the page long, and they
put the sprints of the user between them.

The filters of Jira do not correct this. A filter hides work items. The sprint
header stays on the page and becomes empty. The page gets longer, not shorter.

Two other corrections are possible in Jira. The script does not use them:

- A change to the filter of the board changes the board for each member of the
  team.
- A new personal board with a different filter gives up the board that the team
  uses for the sprint ceremonies.

Therefore the correction is local to one browser. A second person in the team
uses the scripts of this repository, and gets the same correction.

---

## 2. Decision

Hide the sprints of other boards with one style rule. Use JavaScript only for
the names and the counts in the control.

### 2.1 One style rule hides the sprints

The rule is:

```css
html[data-gt-backlog-filter="on"]
  [backlog scrollable]
  li:has(> div[card list prefix] [aria-label="Origin Board"]) {
  display: none;
}
```

The rule asks one question: does this row have the marker of a different board?
The answer is a property of the row. It is not a calculation, and it needs no
data. Therefore:

- The script writes the rule at `document-start`. The rows are hidden when the
  browser paints them the first time. The user sees no flash.
- The rule is correct before the script counts anything or reads storage.
- The card list of the backlog has no marker. Therefore the rule cannot hide it.

### 2.2 The marker is the `Origin Board` label

Atlassian puts a small board icon in front of the name of the other board. The
accessible name of this icon is `Origin Board`. The script uses this label.

The script does not use the REST API. The endpoint
`/rest/agile/1.0/board/2122/sprint` gives an `originBoardId` field for each
sprint. A test of the live data found two faults:

1. Sprint `2320`, `Deep Backlog - JEF Plugins`, has no `originBoardId` field.
   The page shows this sprint as a sprint of the Rundown board. A test on
   `originBoardId` hides it. This is not correct.
2. The response contains sprint `4660`, `MIS Selected (platform arch)`. This
   sprint is not on the page.

The API is correct for 32 rows of 33. The page is correct for 33 rows of 33.

The script does not use the text of the row. The text after the name of the
sprint is `from MAM UI Team`. This test also gives the correct answer for the 33
rows, but the marker is better for two reasons. The marker is an element, and
the test needs no calculation in JavaScript. The text needs a calculation,
because the script must first remove the name of the sprint: a sprint with the
name `Bugs from QA` gives a false result if the script does not.

The name of the other board comes from the text of the element around the icon.
This element is a `button` with `role="link"`. It has no `href`. Therefore there
is no board id in the page, and the preferences use the board name.

### 2.3 The route gate gives the board id

`@match` is `https://*.atlassian.net/*`. `@match` controls injection only.
Tampermonkey reads it when the document loads. It does not read it again after a
change to the history. A narrow pattern therefore fails when the user arrives
from a different Jira page.

The gate in the script is this expression:

```
/\/boards\/(\d+)\/backlog(?:\/|$)/
```

The gate gives the board id, not a yes or a no. The id has two functions. It is
the key of the preferences. It is also the value that the route watcher
compares. The value is `null` away from the backlog. Therefore a move from the
Backlog tab to the Reports tab is a route change, and the control goes away,
although the board did not change.

### 2.4 Two style sheets, because they have two lifetimes

| Sheet                    | Content                                  | Written        |
| ------------------------ | ---------------------------------------- | -------------- |
| `gt-backlog-style`       | Animation, control, panel, warning badge | One time       |
| `gt-backlog-filter-style`| The rule that hides sprints              | On each change |

The script writes the second sheet at `document-start` with no exception in it.
This first version hides each sprint of each other board. This is the default,
and it is the safe answer. If `render` fails, or if it never operates, this
version stays on the page.

`render` compares the new text of the rule with the text on the page. It writes
the sheet only if the text is different. A write makes the browser read the
sheet again and calculate the style of the page again, also if the text is
equal.

### 2.5 A revealed board is an exception to the same rule

When the user shows a board, `render` adds one `:not(:has(...))` clause to the
selector for each sprint of that board.

The script does not add a second rule to show the row again. Such a rule must
give a value to `display`. The correct value is the value that Jira gives to the
`li` element. The script does not know this value, and must not guess it.

Only sprint ids go into the selector. Each id is a group of digits from a
`data-testid` attribute. The board names come from `localStorage`, and they stay
in JavaScript.

### 2.6 One signal, and one function that writes to the page

The script uses the CSS animation method of the two other scripts in this
repository. A zero-effect animation on the sprint rows and on the board header
makes the browser send `animationstart`. The event goes up to the document. One
listener is sufficient.

A backlog has approximately 32 sprint rows. Each row sends its own event.
Therefore the signal arrives 32 times in one frame. `render` is idempotent and
gives the same result each time, but 32 scans give one result. The script
collects the signals into one animation frame.

Only `render` changes the page. Each signal calls `render` and nothing else.

### 2.7 The preferences are per board, and they are permanent

The key is `gt-jira-backlog.prefs`. The value has this form:

```json
{ "2122": { "reveal": ["MAM UI Team"] } }
```

The top level is the board id. "The other boards that I also want to see" is a
fact about one backlog. A global list gives the choices of the Rundown board to
each other board.

`reveal` is the full state. There is no flag for on and off.

The first version had such a flag, `enabled`. Two values then gave the same
condition, and they could disagree. This sequence made the disagreement visible:

1. The user clears each board checkbox. The list holds each board.
2. The user clears the switch. The flag is now false.
3. The user selects the switch again. The flag is true, but the list continues to
   hold each board.

The result was a filter that hid nothing, and a user who had to select each
checkbox again. A list with no board in it **is** the off condition. One value
has one meaning, and no second value can contradict it.

The script keeps `reveal` between sessions. The `jira-ux-improvements` script
forgets its lock at each navigation, because an editable description is a hazard.
Visible sprints are not a hazard, and the label of the button shows the condition
at all times. A user who must select the boards again at each load has a filter
that is worse than the problem.

The script stores the boards to **show**. It does not store the boards to hide.
Therefore a new board next month is hidden, and the user does nothing.

The panel shows the opposite. A selected checkbox means "hide this board". The
two directions are independent, and each one is correct for its purpose:

- Storage names the exceptions only. A board that no person has seen is in no
  list, and the default applies to it.
- The panel agrees with the select-all box above it and with the count beside it.
  Refer to section 3.

`render` calculates the condition of each checkbox from the stored list with a
logical NOT. `onPanelChange` does the same calculation in the other direction.

**Cost of the removal of the flag.** At `document-start` the script knows the
list of boards, but the page has no rows yet, and a board name gives no sprint
id. Therefore the first rule hides each sprint of each other board. A board that
the user shows becomes visible after the first scan, not at the first paint. The
flag made this condition visible at `document-start`, and it is now the price of
one value with one meaning. The user accepts a delay of some seconds.

The script never stores data about the sprints. A session of Jira is valid for
one month. A list in storage can be four weeks old. The rule in section 2.1
needs no such list.

### 2.8 Position

The control is a child of `<body>`. It is not a child of the board header, and
it is not a child of `#jira-frontend` either.

React controls the header and can delete its children, so the control cannot
live there. `#jira-frontend` is worse: it is the element React hydrates the
server-rendered page into. A node put in front of that markup is a hydration
mismatch. React then throws the whole page away and builds it again on the
client, which shows as the skeleton returning about a second after the backlog
was already readable. It happened only on a cold load. A soft navigation to the
backlog arrives long after hydration, so nothing goes wrong there, which is why
this took a while to notice. `<body>` is outside everything React owns.

CSS anchor positioning puts the control in the header line. The anchor is the
last child of the header. This child is the group of action buttons at the right
end. An automatic margin puts it there, and it leaves approximately 1360 px of
free space. The control goes into this space, at the left side of the group.

The selector is `> div:last-child`, not `> div:nth-child(3)`. `:last-child`
corrects itself. If Atlassian adds an element to the header, the anchor goes to
the new element at the right end, and the control stays at its left side. An
index does not do this.

Only Chromium supports anchor positioning today. Therefore:

- All style rules for the button and the panel are outside the `@supports`
  block.
- Only the position rules are inside the `@supports` block.
- Without anchor positioning, the control goes to the top right corner. This
  position is not as good, but the user can use it.

### 2.9 The contract check needs two witnesses

A count of hidden sprints cannot find the worst failure. If Atlassian changes
the `Origin Board` label, or translates it, the script classifies each sprint as
a sprint of this board. It hides nothing. The button shows `0 sprints hidden`.
This is the same message as a backlog that has no sprints of other boards.

The button that holds the board name is the second witness. `checkContract`
compares two counts:

| Count      | Source                                            |
| ---------- | ------------------------------------------------- |
| `linkRows` | Rows with a `button` that has `role="link"`        |
| `foreign`  | Rows with the `Origin Board` marker               |

The script puts a warning badge on the page if `foreign` is zero and `linkRows`
is more than zero. A `console.warn` is not sufficient. The developer tools are
closed when the user plans a sprint.

The test needs `foreign` to be zero. Thus Jira can add a different link button
to a sprint row, and the badge stays away: the marker operates, and there is
nothing to report.

### 2.10 The script does not change the order of the sprints

The first design also put the sprints in a selected order. The script does not
do this, for one reason: the `ul` element that holds the sprints has
`display: block`. The `order` property has an effect on the children of a flex
container or a grid container only. Therefore the script must give
`display: flex` to a container that React controls. This changes the margins
between the rows.

The user removed this requirement after a test of the numbers. The filter hides
17 rows of 32. The order of 15 rows is a smaller problem than the layout risk.

If the order comes back, two notes from this analysis apply:

- The test "a sprint with a start date and an end date that are not more than
  four weeks apart" is not sufficient. Sprint `2320` has the dates `1 Jan` and
  `1 Jan`, and it is not an execution sprint. A name test such as
  `^RDN \d{4}-\d{2}$` is also necessary.
- Atlassian uses Pragmatic drag and drop on these rows. It finds a drop target
  from the position on the screen, not from the order in the DOM. Therefore a
  change to the visual order with the `order` property keeps drag and drop
  correct. `display: none` removes a row from the geometry, and is also correct.

---

## 3. What the script gives the user

The control is one button in the board header line.

| Condition      | Label                 |
| -------------- | --------------------- |
| Filter is on   | `17 sprints hidden ▾` |
| Filter is off  | `all sprints shown ▾` |

The label is the condition. Therefore the user cannot leave the filter on and
forget it. The button also has the color of a selected control while it hides one
sprint or more.

The button opens a panel. The panel has:

- One checkbox for each other board, with the number of sprints from that board.
  Example: `MAM UI Team 12`.
- One select-all box above them, `Hide sprints from other boards`.

A selected checkbox means "hide the sprints of this board". Each board starts in
this condition. To see a board again, clear its checkbox.

The three parts of the control give one message, because they all count the same
thing:

| Part             | Example             | Meaning       |
| ---------------- | ------------------- | ------------- |
| The select-all   | Selected            | Hide each one |
| A board checkbox | Selected            | Hide          |
| The button       | `17 sprints hidden` | 17 are hidden |

The first design used the opposite direction for the checkboxes: a selected
checkbox showed a board. The result was not clear. A selected row with the
number 12 was beside a button with the text `5 sprints hidden`, and the user had
to do a subtraction to make the two agree.

The box at the top is a select-all box. It is not a switch for the feature. It
has three conditions, and `render` calculates each one from the list of boards:

| Condition       | When                       | A click then does |
| --------------- | -------------------------- | ----------------- |
| Selected        | Each board is selected     | Clears each board |
| Clear           | No board is selected       | Selects each board|
| Part selection  | Some boards are selected   | Selects each board|

A click on a part selection selects each board. This agrees with the other
software that uses this control. The browser gives this result without help: it
removes the part selection and makes the box selected.

The granularity is one board, not one sprint. A list of 17 checkboxes with the
names of the sprints needs maintenance at each sprint. A list of 5 boards does
not.

The count in the panel has a second function. It tells the user the cost of each
board before the user shows it again.

A click outside the panel closes it. The `Escape` key closes it.

---

## 4. Rejected alternatives

| Alternative                                   | Why the script does not use it                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/rest/agile/1.0/board/{id}/sprint`            | Sprint `2320` has no `originBoardId`. The response also has a sprint that is not on the page. The board names need more requests. A request also adds a delay before the first hide.  |
| `window.SPA_STATE`                             | An internal global variable with no documentation. Atlassian can change its form in each release.                                                                                    |
| `/rest/greenhopper/1.0/xboard/plan/v2/backlog/data` | An internal endpoint with no documentation, and a second copy of data that is already in the page.                                                                             |
| The text `from <board>` after the sprint name  | Correct, but it needs a calculation in JavaScript, and the calculation must first remove the name of the sprint. The marker is an element and needs no calculation.                    |
| A copy of the classification in `localStorage` | A session of Jira is valid for one month. A copy can be four weeks old. The rule in section 2.1 needs no copy.                                                                        |
| A move of the `li` elements                    | React controls these elements. It puts its own order back at each new build. A watcher that writes the order again is a sequence of steps that can stop in the middle.                |
| The control as a child of the header           | React can delete the children of a node that it controls. This repository has one measurement of this failure, on the breadcrumbs.                                                    |
| One checkbox for each sprint                   | The names of the sprints change each two weeks. The names of the boards do not.                                                                                                       |
| A change to the filter of the board            | The board is the board of the full team.                                                                                                                                              |
| A new personal board                           | The team uses the Rundown board for the sprint ceremonies.                                                                                                                            |

---

## 5. Risks and limits

1. **The `Origin Board` label.** Atlassian writes this label in English. A
   different language of the interface gives a different label, and the script
   then hides nothing. `checkContract` finds this condition and puts a badge on
   the page.
2. **The animation on 32 rows.** The script gives the `animation` property to
   each sprint row. If Jira gives an animation to the same element, the script
   defeats it. The rows have no animation today.
3. **The anchor.** The anchor is the last child of the board header. If
   Atlassian removes the group of action buttons, the control goes to the top
   right corner.
4. **Chromium.** `:has()` and anchor positioning need Chromium. Without
   `:has()` the script hides nothing. The other scripts in this repository make
   the same selection.
5. **The old board URL.** The gate reads `/boards/{id}/backlog`. It does not
   read `/secure/RapidBoard.jspa?rapidView={id}&view=planning`. The Jira of the
   user does not use the old form.
6. **A board with a new name.** The preferences use the board name. After a
   change of the name, the entry does not agree, and the sprints of that board
   are hidden again. This is the default, and it is safe.
7. **The search for the marker.** The script searches the full row for the
   marker. An expanded sprint has its work items in the same row. A work item
   with the label `Origin Board` gives a false result. No work item has this
   label today.

---

## 6. How to test

There is no test system in this repository. Use these steps in a browser.

1. Open the Backlog of the Rundown board. The button must show
   `17 sprints hidden`. Count the rows: 15 sprints and the backlog must stay.
2. Reload the page and look at the sprint rows. No row of another board must
   appear and then go away. Use the "Slow 3G" setting of the developer tools for
   a second test.
3. Open the panel. It must show 5 boards with these counts: `Planning 2`,
   `wnRelease 1`, `MAM UI Team 12`, `Ingest 1`, `Dalia 1`. All 5 checkboxes and
   the select-all box must be selected.
4. Clear the checkbox of `MAM UI Team`. Its 12 sprints must come back, in their
   original positions. The label must show `5 sprints hidden`, and the select-all
   box must show a part selection.
5. Reload the page. `MAM UI Team` must stay visible, its checkbox must stay
   clear, and the select-all box must stay in the part selection.
6. Click the select-all box. Each board must become selected, and all 17 sprints
   must go away again. Click it a second time. Each board must become clear, all
   32 sprints must appear, and the label must show `all sprints shown`.
7. Now clear each board checkbox one at a time. Then click the select-all box.
   Each board must become selected, and all 17 sprints must go away. (The first
   version of the script did nothing here. Refer to section 2.7.)
8. Reload the page. The condition of step 7 must stay. Then select the Reports
   tab. The button must go away. Return to the Backlog tab. The button must come
   back with the same numbers.
9. Open the Backlog of a different board, for example Rundown SI. Its own
   preferences must start at the default. Then return to Rundown. The choices
   for Rundown must stay.
10. Open a sprint of this board with the arrow at its left. The work items must
    appear, and the counts must not change. Then move a work item to a different
    sprint with the mouse. The move must operate.
11. Apply a filter, for example `Version`. The counts in the panel must agree
    with the rows on the page.
12. Make the window narrow. The button must not go on top of the board title.
13. The console must show no errors, and the page must show no warning badge.

---

## 7. Related decisions in this repository

- `jira-ux-improvements.user.js` — the source of the `logger`, `guard` and
  `injectStyle` functions, of the route watcher, of the design tokens with a
  dark block, and of the anchor positioning with a corner as the alternative.
- `bitbucket-ux-improvements.user.js` — the source of the `animationstart`
  method, and of the warning badge on the page.
- `jira-show-fixversion-dates.user.js` — the source of the method that puts
  state into a style sheet, to reach the nodes that React has not built yet.
