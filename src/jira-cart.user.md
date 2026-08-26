# ADR: Jira Cart userscript

- **Status:** Accepted. **Version 1.6.0 implements the whole of section 2 and has
  been checked against it.** A version number here means *the spec is built and
  checked*, not *nothing is left to want* — §6 will always hold open items, so
  waiting for an empty §6 would mean never reaching any of them.
  **1.6.0 ADDS THE FIRST DRAG THAT COMES INTO THE CART: an issue is added by dropping
  it (§2.9.3).** Three sources — a live-list row, a row of the collection, or any issue
  link Jira drew on the page — and two targets: a collection's **chip**, which appends
  without making that collection active, and the **item list**, which inserts at the
  gap the pointer is in. It is a minor version because it changes no output, no stored
  shape and no default: `v` is untouched, and nothing that was already there behaves
  differently except one shipped sentence that is now false and is amended in place
  (§2.9.1's *nothing can be added by dropping a link into the drawer*).
  **THE ONE DECISION THAT COULD NOT BE DERIVED was move versus copy**, and the user
  took **move, unless Ctrl is held**. That makes it the first destructive control in
  the drawer that cannot arm itself before it acts, which is risk 20 rather than a
  footnote. **Its third source was measured per view on the day it
  shipped, and it does NOT work everywhere** — seven views yes, and two no: the **Plans
  timeline**, because dragging a bar there is Jira's own gesture for changing a date and
  it has to win, and **linked work items**, whose cause is unknown and which is the one
  of the two still open. Risk 21 has the table; the live list is the route on both views,
  and that is the second reason ask 1 earns its keep.
  **The report also found a defect in what shipped**, and it is recorded as risk 22:
  both drop handlers consumed drops they had *refused*, because a comment in the file
  claimed a `drop` only fires when our own `dragover` accepted. `dragover` bubbles, so
  an ancestor can accept — and Jira's board drag-and-drop is one. Fixed the same day,
  with five checks that go red on it.
  **It also closes half of §6 item 6**, which §2.9.1 and §2.9.2 both cited when they
  said adding by drop was not their feature, and it **builds one thing §2.9.2 designed
  and declined to build**: the collection drag's marker type. §2.9.2 dropped it because
  nothing read it; the chips became drop targets, so something reads it now, and
  appendix A.10's measurement of it was already on record.
  **1.5.0 made the whole collection drag OUT of the drawer, from its heading and from
  any chip (§2.9.2). 1.4.0 made the collection's items reorder by drag, and made one
  row a link on the way out (§2.9.1).** Both are recorded in their own sections with
  their own dates; this Status block did not name them at the time, which is corrected
  here rather than passed over.
  **1.3.1 is a DOM-rot patch and decides nothing new: it names
  the NINTH VIEW, Rovo search, which announced itself exactly as risk 19 said a new
  view would — as a contract warning on a page that worked (§2.1).**
  **1.3.0 added one gesture: a `🔗` beside the floating `+` that puts THAT ONE ISSUE
  on the clipboard and never opens it (§2.7.1).** It is a minor version because it
  changes no output and no stored shape: the bytes are 🔗 Links' own at **item
  scope**, which §2.8 designed four versions ago as a seam and which nothing had ever
  called. **Nothing had to be added to that seam**, and that is the only evidence
  available that the scope was the right shape rather than a plausible one — so it is
  recorded as such rather than passed over. Three smaller things came with it: the
  right-click menu gained `Copy link to KEY`, which is the second thing that
  interception takes away and now gives back; the `+` and its new neighbour share one
  floating **rail**, so the 4px between them belongs to the Cart and not to the page;
  and the Cart gained **its first preference that ships ON**, because this one takes
  nothing away — it only takes room, which is what the switch is for.
  **THE ONE CONSTRAINT THE WHOLE THING IS BUILT AROUND: the `+` does not move.** Its
  distance from the hovered key has been the same since 0.1.1 and its side was
  reversed into from a day of use, so the new button went on the outside and the rail
  reverses its row on the flipped side to keep that true there too. `boot-smoke`
  asserts the pixel, which is the one claim in §2.7.1 a reader would otherwise have to
  take on trust.
  **What it does NOT know is what a 52px rail lands on in a real row** — §6 item 19
  and §7 step 36, and it is the thing to press first. The harnesses have no layout, so
  they can prove the `+` is unmoved and cannot see whether the copy button now covers
  the issue-search table's own checkbox. **The remedy is decided rather than open**
  (stack the rail), and the switch shipped with the feature so the answer is
  recoverable either way.
  **1.2.0 made the exports CONFIGURABLE, and it is a minor version because it
  breaks nothing: every default is exactly what 1.1.0 emitted**, so an existing
  user sees no change until they ask for one. Three things became settings — the
  shape of the issue reference at the head of a line (§2.8), which fields
  📋 Details and 📊 Report print and in what order (§2.14), and 📊 Report's two
  bands (§2.15) — reached through a ⚙ that became a whole **screen** rather than a
  strip, because ~22 controls do not fit above two sections in a drawer that can be
  300×215px (§2.9, §2.11). **It did not touch §2.4's `v`**: every new key is in
  `gt-jira-cart.prefs`, which is not versioned, and no stored *item* changed shape,
  so there is no migration and no `.bak` write. What it DID change in kind is that
  the preferences key now holds an **ordered list that the code's own catalogue can
  overrule** (§2.4, amended 2026-08-22). Six tickets decided it, one per session,
  and their record is [`docs/jira-cart/configurability/`](../docs/jira-cart/configurability/).
  **FOUR of its decisions were reversed by pressing the thing rather than by
  reading it, and none by re-reading the design** — the panel's layout twice, the
  ⚙'s own missing state, and the duplicate band pair, which every byte of the harness
  had already asserted and none of the assertions caught (§7 steps 27–32). A fifth
  shape was then asked for by a paste (appendix A.9.1). That is the 1.1.0 lesson
  holding a second time, and it is now recorded twice.
  **1.1.0 added the first new feature since 1.0.0: 📋 Details, a fifth export
  (§2.14).** It is the first section written from *real pastes* rather than from
  argument — into Outlook and into Teams in both skins — and those pastes reversed
  **four** of its own decisions before it shipped — a count that kept rising while
  the section was being written, which is the whole argument for pasting rather than
  reasoning. It changed nothing that was already there except §2.8's claim to have
  four formats and the spacing of Links' HTML twin, and it did **not** touch §2.4:
  nothing it fetches is stored, so there is no schema change and no migration.
  **1.1.0 was then confirmed working in real use on 2026-08-20**, by the user,
  pasting into Outlook and into Teams — the same activity that had produced all four
  reversals a few hours earlier, and the only check that could have confirmed it.
  §7 steps 15a to 15e are closed by that.
  Version 0.1.1 had built §2.1, §2.2, §2.4, §2.5, §2.7, §2.10, §2.12, §2.13 and
  the badge of §2.9; 0.2.0 added the drawer and everything in it — §2.3, §2.6,
  §2.8, the rest of §2.9, and §2.11; 0.3.0 changed one control, so that 🔍
  **opens** the collection in Jira's search instead of copying the query (§2.8);
  0.4.0 made every row's key a real link (§2.9) and fixed the ⚙, which a CSS
  specificity trap had left inert (§2.11); 0.5.0 **reversed** the drawer's open
  state into a stored preference (§2.9). **1.0.0 added no feature.** It settled
  the two design calls §2 had left open — risk 10's clipped collection section and
  the keyboard — and it fixed **one defect the reversal of 0.5.0 had opened**: the
  cross-tab notification was registered on the collections key only, so a
  preference changed in one tab reached the other at an arbitrary later moment
  (§2.5, §2.9, risk 12).
  **Three of the four browser-only parts of §7 were run on 2026-08-25**, at 1.3.1,
  in the session that named the ninth view: **step 5 across all nine views**,
  **1.3.0's steps 36, 37 and 38** — the `🔗`, which until then had shipped
  unexercised — and **a store damaged by hand**, whose result is recorded in §2.4.
  **What is left is a real logout**, the event the `@grant` exists to survive. The
  two probes of appendix C are still not run, and 1.0.0 added a third
- **Date:** 2026-08-19; §2.14 was added on 2026-08-20, the configurable
  exports of 1.2.0 were folded in between 2026-08-22 and 2026-08-25, and §2.7.1 —
  the copy button — was added on 2026-08-25, and **the ninth view was named the
  same day** (§2.1). §2.9.1 was added on 2026-08-25, and §2.9.2 and §2.9.3 on
  2026-08-26 — the three drag sections, in the order they shipped
- **Applies to:** `src/jira-cart.user.js` (version 1.6.0)
- **Decided by:** ten tickets, all closed. They are named below and are not
  in this repository. **§2.14 was decided by a grilling session and six real
  pastes instead**, because the question it answers — what a detailed list looks
  like where people actually read it — could not be settled by reading anything

## About this document

This document uses the writing rules of ASD-STE100 (Simplified Technical
English). Sentences are short. The voice is active. Each word has one meaning.
Names from the source code stay as they are, in `code font`.

This document is a specification. It is not a report of a build. Ten tickets
decided its content, with live measurements and prototypes. Each decision names
its ticket, in this form: (`05` §2). The build session must not open these
decisions again.

Each decision also gives its reason. The reason is the part that stops a mistake
a second time. Do not remove a reason because the conclusion looks obvious.

| Ticket | Subject | Where its verdict lives in this document |
| --- | --- | --- |
| `01` | The Jira REST API from a userscript | §2.6 |
| `02` | Finding issue references in Jira DOM | §2.1, §2.2 |
| `03` | Shared helpers across the scripts | §2.13 |
| `04` | Userscript or Chrome extension | §2.12 |
| `05` | The collection data model | §2.4, §2.5, §2.6 |
| `06` | Copy formats, and the template seam | §2.8 |
| `07` | The direct add gesture | §2.7 |
| `08` | The drawer, and the existing toolbar | §2.9, §2.11 |
| `09` | What "scan this page" promises | §2.3 |
| `10` | Where the collections live | §2.4, §2.12 |
| — | The detailed export | §2.14. **No ticket.** One session, six real pastes, and the prototype named in appendix A.9 |

Behind the tickets were seven research passes, named here because the tickets cite
them: `01` (the API), `02a`, `02b` and `02c` (this repo's proven selectors, prior
art, and a live DOM survey), `05a` (a storage probe), `09a` (list scope, with four
devtools runs), and `10a` (storage options, with five). Every live run was on
`dalet.atlassian.net`, in August 2026, by the user.

**The tickets and the research passes were untracked for the whole of the effort,
and they were committed at 1.0.0 — to [`docs/jira-cart/`](../docs/jira-cart/).**
This document said they were not in the repository, and that was true until
2026-08-19. What changed is not the reasoning but the horizon: the Cart may grow
features or move to a browser extension, and re-deriving those measurements is
expensive or impossible. Three of them could not be taken from documentation at all
(risk 3).

**THIS DOCUMENT IS STILL THE DECISION OF RECORD, AND THAT IS UNCHANGED.** What sits
in `docs/` is dated evidence, it is not maintained, and parts of it are stale on
purpose — the DOM survey covers seven views where there are NINE, and one ticket's
own filename still says `localstorage`. **Where the two disagree, this document
wins**: it was written after, and it carries the corrections. The README there says
so as well, so neither can be read as the authority by accident.

Three things are folded into the appendices here regardless, because a reader of this
document should not have to open another one: the measurements with their dates
(appendix A), the storage design that was measured and rejected (appendix B), and the
probes that are written but not yet run (appendix C). Nothing else in the working
record was load-bearing.

**The two prototypes behind `07` and `08` were throwaway by design and are not
kept** — their mechanisms are in §2.7, §2.9 and §2.11. Neither is the 0.1.0 script,
which was written in six chunks and is superseded by the file in `src/`.

---

## 1. Context

### 1.1 What the Cart is for

The user collects issue references while they work in Jira. Then they empty the
collection into something else: a status email, a Confluence page, a Slack
message, a pull request description, or Jira's own search box.

Jira gives no help with this. The user opens each issue, copies the key, copies
the summary, and builds the list by hand.

The Cart does two things:

1. It makes an issue reference on any Jira page collectable with one click.
2. It writes the collection to the clipboard in four formats.

### 1.2 The words

`05` §1 settled this vocabulary. Every ticket after it uses these words. This
document uses them and nothing else.

| Term | What it names |
| --- | --- |
| the cart userscript | the script — `src/jira-cart.user.js` |
| the Cart | the UI that the script adds to Jira: the badge and the drawer |
| collection | a named list of items. Amazon's wishlist |
| the active collection | the collection that gets the adds. Amazon's cart |
| item | a stored issue: a key, plus what we know about it |
| link, row | an `<a href="/browse/KEY">` on the page, mirrored in the live list. It is not an item until a click makes it one |

**"Cart" is never a synonym for the active collection.** The analogy above gives
intuition. It does not give vocabulary. When we mean the collection that gets the
adds, we write *the active collection*. Three different readings of "cart" were
live before `05`, and one of them made the phrase "the cart's active collection"
impossible to parse.

### 1.3 The two gestures, and neither is a fallback

`09` removed an earlier ranking. The Cart has two add gestures. They serve
different situations.

| Gesture | The situation |
| --- | --- |
| The **live list** in the drawer | "Show me the issue links on this page, and let me pick." |
| The **floating toggle** on the page (`07`) | "I can see the link. Add it now, without opening anything." |

The second is not for references the first cannot reach. After `02`, the live
list reaches every reference on the page. The second gesture exists for
ergonomics. The user's words: *"I do not want to: 1. open the side panel, 2.
have the page scanned, 3. find the ticket in the list, 4. add it."*

**1.3.0 adds a THIRD gesture, and it is not an add gesture at all.** It shares
the hover with the second one and it puts one issue on the clipboard:

| Gesture | The situation |
| --- | --- |
| The **copy button** beside the floating toggle (§2.7) | "I want this link somewhere else. I do not want it in a collection, and I do not want to open the issue to get it." |

It is listed here rather than folded into the row above it because it answers a
different question. The two gestures above both end with an issue in a
collection; this one ends with bytes on the clipboard and the collection
untouched. **A collection is not on the way to a paste any more.** The user's own
framing, which is the whole request: *"the ability to have an extra button next
to the + button that would allow to quickly copy the link of a ticket without
actually opening it."*

### 1.4 Design principles from the two other ADRs

The Cart honours the four principles that `jira-ux-improvements` and
`jira-backlog-sprints` were rewritten to obey.

1. Derive state from the page. Do not keep flags that must agree with each other.
2. One idempotent `render`. Only `render` writes to the page.
3. Prefer a CSS rule to JavaScript when the answer is knowable at
   `document-start`.
4. If a subsystem breaks, the safe default must be what remains.

Principle 1 did the most work here. `05` deleted every value that could disagree
with another value: there is no active-collection pointer, no index, no
"already added" flag, and no stored failed state.

---

## 2. Decision

### 2.1 One selector finds every issue reference

```
a[href*="/browse/"]
```

That is the detector. It found every issue reference on all seven views of the
live survey: the issue view, the issue panel over a board, the backlog, a board,
search results, an epic's children table, the issue-links panel, and the timeline
(`02`).

The href is parsed with the anchored expression that
[`jira-ux-improvements.user.js:177`](jira-ux-improvements.user.js#L177) already
uses, so a `/browse/` path that is not an issue cannot pass:

```
/^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/
```

The key is uppercased (`05` §3). `/browse/` keys already are, so this is free
safety.

**THERE IS AN EIGHTH VIEW, AND THE SURVEY NEVER SAW IT. Found in use on
2026-08-18, at version 0.2.0, and closed the same day.** The **Team's own Timeline
tab** sits beside Backlog and Active sprints, and it is **not** the Plans timeline
this document already names.

**The detector found its 37 keys, exactly as designed.** That is the point of this
section's first paragraph: an unknown or rotted `data-testid` costs a decoration or
a summary, never a found issue. What it cost here was the contract check, which
reported a broken contract on a page that is not broken, because none of those keys
sat in a row this document named.

Its names, read off the row's own `outerHTML` on a live page:

| Part | Name |
| --- | --- |
| The whole view | `sr-timeline` |
| The row | `roadmap.timeline-table.components.list-item.container-<issueId>`, `role="gridcell"` |
| The key's anchor | `roadmap.timeline-table-kit.ui.list-item-content.summary.key` |
| The title | `roadmap.timeline-table-kit.ui.list-item-content.summary.title` |

Three things to carry, each of which nearly cost a defect:

- **The row's leaf ends with the issue's numeric id**, as the backlog's ends with
  the key. So it is a substring match with a trailing hyphen, and never a suffix.
- **The row contains a span called `…list-item.expand-button.container-<id>`.** A
  shorter match seizes that first and splits one row into two groups. The match
  therefore takes three segments — the same widening the linked-work-items card
  needed, and for the same reason.
- **This one view draws from TWO component libraries.** The row is
  `roadmap.timeline-table.components.*`; the key and the title inside it are
  `roadmap.timeline-table-kit.ui.*`. One prefix does not cover both.

With the row named, tier 1 answers on this view, the group has one anchor, and the
origin label is `timeline` — the same label the Plans timeline takes, because the
label names a region and both are a timeline to the person reading the row. The
anchor's own testid is also in the known-region list below, where it buys silence
rather than a false warning on the day the row's name rots.

**THERE IS A NINTH VIEW, AND IT IS THE FIRST ONE WITH TWO REGIONS THAT BEHAVE
DIFFERENTLY. Found in use on 2026-08-25, at version 1.3.0, and closed the same day
at 1.3.1.** **Rovo search**, `/jira/rovo-search` — the page a query from the search
bar lands on.

**It announced itself exactly as risk 19 said the next one would**: a badge reading
*"42 issue keys are on this page and none of them is inside a known row container"*,
on a page where the `+` and the `🔗` both appeared and both worked. That is not a
contradiction and it is worth stating plainly, because it is the shape every future
report of this kind will take: **the rail needs only a hovered `/browse/` anchor.**
`groupFor` falls back to `{ place: anchor, read: anchor }` when there is no row, so
both buttons appear on any Jira page whatever. **The check was right and the buttons
were right.** What was lost was the summary.

**The page holds TWO issue-link regions and they failed in different ways.** 70
anchors, 42 distinct keys, 8 of them in both regions.

| Region | Shape | What it did |
| --- | --- | --- |
| The answer card's table, inside `jira-nl-to-jql-card-wrapper` | 20 rows, **2 anchors each**: an issue-type **icon** linking to the issue with NO TEXT, then the key. The summary is a third cell | **Stored a bare key.** Confirmed by a live press: `added WEB-29577 …: no summary on the page, so the key is stored on its own` |
| The results list, `search-page-results-list` | 30 results, **1 anchor each**, whose text is `KEY: summary` | **Already correct.** Confirmed by a live press: `(tier 4)` with the right title |

Its names, read off the row's own `outerHTML` on a live page:

| Part | Name |
| --- | --- |
| The whole page | `search-page-body` |
| The table's row | `datasource-table-view--row-ari:cloud:jira:<site>:issue/<issueId>` |
| The key's anchor | `link-datasource-render-type--link` |
| The icon's anchor | `issue-like-table-type-icon-link` — **an anchor to the issue with no text at all** |
| The summary | `link-datasource-render-type--text` |
| A result in the list | `search-page-result` |

Five things to carry:

- **THE ROW ALONE BOUGHT NOTHING, and this is the lesson of the ninth view.** Tiers
  1, 2, 3 and 5 are all behind `if (row)`, and tier 4 reads the anchor, whose text
  here is the key. Measured: naming the row moved the cascade from tier 0 to tier 0.
  It reached **tier 1** only when the summary field was named as well. **A row entry
  and a summary entry for this view are one change, not two.**
- **The row's leaf ends with an ARI**, not a bare identifier — `…--row-ari:cloud:jira:
  <site>:issue/564570`. So, like the backlog and the Team's Timeline tab, a
  substring match with a trailing hyphen. The hyphen is what keeps it off
  `datasource-table-view--body` and off the table itself.
- **An anchor with no text is not "the anchor that says nothing but the key".** The
  icon cell comes FIRST in document order, and an empty string strips to an empty
  string, so `groupFor` handed it the rail and the `+` parked beside a picture.
  `groupFor` now requires the candidate to have text. Every earlier view still
  passes that test: the timeline's `RDC-21069, (opens new window)` and the backlog's
  visible key both have some.
- **The results list is a KNOWN REGION and deliberately NOT a row.** Its one anchor
  carries the key and the summary, so tier 4 already answers it, and a row would put
  tiers 1, 2 and 3 in front of tier 4. Tier 2 takes any `aria-label` in the row that
  starts with the key, and **nothing has measured what the labels inside a result
  say** — so promoting it could only trade a summary that works for one that might.
  Naming it a region buys the one thing needed, silence from the contract check on a
  search that returns no answer table, and changes no summary. Promote it if a
  result ever grows a second anchor.
- **THIS IS NOT A JIRA LIST COMPONENT.** `datasource-table-view` is the smart-link
  datasource table, so the row entry also pays wherever one is embedded — an issue
  description, a Confluence page. None of those was surveyed. **Expect a tenth
  view**, and risk 19 now says so for the second time.

**The one known limit, stated rather than hidden.** It is the COLUMN ORDER that
makes `link-datasource-render-type--text` the summary, not the name: `--text` is the
renderer's generic text cell, and tier 1 takes the first non-empty match in document
order. A table configured with another text column to the left of Summary would read
that column instead. The row's own `aria-label` says `"<value>, Summary field, edit"`
and would settle it **by name** — but tier 2 wants a label that STARTS with the key
and this one starts with the value, so using it means a new tier rather than a new
selector. Not built: §2.2 already says an item is valid with a key alone, and a
wrong summary is worse than none.

**The premise of ticket `02` was wrong, and the correction matters.** The ticket
was written around a warning that issue references are not always links. The
warning was real, but about other Jira entities: a fixVersion and a sprint are
buttons, not links. Work items are links. Anybody who extends the Cart to collect
a non-issue entity must expect the button case.

**A text regex over the page is not used.** The user's decision, recorded in
`02c`: *"let's forget about bare keys, focus only on well DOM-defined keys."*
The cost is one thing: a key typed into a description as plain text, with no
smart link, is invisible to the Cart. That is cheap, because the reference the
user can see is the reference they want, and it removes a project-key allowlist,
a region-exclusion list, and a whole class of false positive.

**Atlassian `data-testid` values have a second job only.** They never find an
issue. They answer two other questions: which row does this anchor belong to, and
where is the summary. When one of them rots, the Cart still finds the issue. It
loses the decoration or the summary. That is principle 4 by construction.

| Purpose | Selector | View |
| --- | --- | --- |
| Row | `[data-testid*="card-list.card.content-container."]` | backlog |
| Row | `[data-testid$="ui.card.card"]` | board |
| Row | `[data-testid$="ui.issue-row"]` | search results, epic children, child work items |
| Row | `[data-testid$="scope.issues.issue.row"]` | timeline |
| Row | `[data-testid$="issue-line-card.card-container"]` | linked work items |
| Row | `[data-testid*="timeline-table.components.list-item.container-"]` | the Team's Timeline tab |
| Row | `[data-testid*="datasource-table-view--row-"]` | Rovo search's answer table, and any embedded smart-link table |
| Summary | `[data-testid$="summary-field-static.content"]` | backlog |
| Summary | `[data-testid$="issue-summary.issue-summary-cell"]` | search results, epic children |
| Summary | `[data-testid$="single-line-text.container.box"]` | board |
| Summary | `[data-testid$="inline-read.link-item"]` | issue links |
| Summary | `[data-testid$="list-item-content.summary.title"]` | the Team's Timeline tab |
| Summary | `[data-testid$="link-datasource-render-type--text"]` | Rovo search's answer table. **Ships with the row above it or neither ships** |
| Summary | `[data-testid$="foundation.summary.heading"]` | the issue view |

Four rules about that table, each from evidence:

- **Match the testid LEAF. Never the full dotted path.** A backlog row's assignee
  fields drop the `software-` prefix that every sibling carries (`09a` §4.3). A
  prefix match misses exactly that case. `02a` §1.4 gave the same rule.
- **The backlog row is two wrappers further out than `02` first nominated**
  (`09a` §4.2). The outer container encloses the row's own context menu, which
  makes it the better anchor.
- **The board's summary testid contains no word "summary".** Do not search for
  one.
- **Walk UP from the anchor. Never down from the key.** On the board the key's
  testid element is the anchor's PARENT. On the issue view and the issue-links
  panel the anchor is a descendant of the element that carries the key. The two
  are not reliably the same node, and neither reliably contains the other in a
  fixed direction (`02`, probe limitations). `closest()` on the row list is the
  only safe direction.
- **The linked-work-items card is a row, and it was added on 2026-08-18** by the
  build session, from a probe on a live issue (appendix A.6). Its card carries
  **two** anchors to the same issue, the key and the summary, and with no row
  around them there is no group (§2.7) and tier 1 cannot run — which is where
  §2.2 says this view's summary comes from. The name takes **two segments**, and
  this is the one place the leaf rule above is widened rather than followed:
  `card-container` on its own is generic, and `*="issue-line-card"` matches the
  summary's own wrapper (`…issue-line-card-view.summary`) before the card, which
  splits one card into two groups and defeats the purpose.
- **The Team's Timeline row is the SECOND place the leaf rule is widened**, and
  the third place a name ends in an identifier. See the eighth-view note above.
- **Rovo search's table row is the FOURTH place a name ends in an identifier**, and
  the first where that identifier is an ARI rather than a number. See the
  ninth-view note above.
- **`ui.issue-row` covers three views, and its live name is
  `native-issue-table.ui.issue-row`.** An issue's child work items use the same
  component as search results and an epic's children, so no fourth name is
  needed. That row also carries two anchors to the same issue (appendix A.6).

The platform check is selector-free:
`document.querySelector('meta[name="application-name"]')?.content` is `"JIRA"` on
every view (`02`).

**What trips the broken-contract badge, and what may never trip it.** The badge
(§2.13, risk 1) announces a rotted `data-testid`. The comparison is **distinct keys
against row containers**: keys were found and no row was found around them, which
means the row list has rotted and the summaries and the decorations went with it.
**It may never compare anchor counts against anything** (`02` §4). An anchor count
is not an issue count, and it means something different per view: a backlog card
carries two anchors and a board card carries one. A check built on anchors would
report a defect on the backlog every time it ran.

**Two conditions guard the report. Added on 2026-08-18, by the build session,
because the comparison alone cries wolf.** An ordinary issue page holds issue
links in its breadcrumbs, in its description and in its linked-items panel, and
is not a list view at all, so *keys with no row around them* is its normal
condition. Taken literally the check would put a warning on every issue page.

1. **No row container anywhere on the page.** One row found is proof that the row
   list still works.
2. **At least twelve distinct keys in none of the containers this document
   names** — no row, no current-issue breadcrumb, no linked-work-items card, no
   `.ak-renderer-document`, and since 1.3.1 no Rovo search result and no cell of a
   smart-link table. Jira's own quick-search dropdown draws a handful of issue links
   inside none of them, and a warning it set off would be false.

**The regions are LAYERED, and 1.3.1 is what made that visible.** Rovo search's
table is named twice: the `<tr>` is a row, and its `…--cell-N` is a known region.
Taking them away one at a time says what each buys, and the harness holds all three
outcomes: with the row name rotted the check stays **quiet** and the Cart loses only
the summary, which is principle 4 by construction; with the row and its cell both
gone the table is **reported**, 20 keys; with the results list unnamed too the
warning is the one the user read off the page, **42 keys**. A region entry is
therefore never idle padding — it is the difference between a lost summary and a
false alarm on the day a name rots.

**No region may be as wide as the page.** All 70 of Rovo search's anchors sit inside
`search-page-body`, so naming *that* a region would silence the check on that page
for ever, including on the day both row names rot. It is used as an ORIGIN LABEL
instead (§2.3), where the whole cost of being that coarse is a coarse label.

**The check therefore under-reports, and that is the intended trade.** A backlog
filtered down to five rows, on the day Atlassian renames the backlog row, is
silent. The same reasoning as the live list's label in §2.3: a wrong report costs
more than a missing one, because the first thing a false warning does is teach the
user to ignore the true one.

### 2.2 The summary comes from the page, in six tiers

The DOM holds the summary beside the key on every view (`02` §5). So the DOM is
first and the API is the fallback. An add never waits on the network.

The cascade tries six sources, in this order. The first one that answers wins.

| Tier | Source | Where it pays |
| --- | --- | --- |
| 1 | The view's own summary field, scoped to the row | backlog, board, search results, epic children, issue links |
| 2 | An `aria-label` that starts with the key, on the row or inside it | board, backlog |
| 3 | The backlog's screen-reader twin anchor, `a[data-testid$="screen-reader-key"]` inside the row, which holds key and summary | backlog |
| 4 | The anchor's own text, when it is not the key | issue links, epic children |
| 5 | The parent's text, minus the anchor's text — **inside a known row only** | timeline |
| 6 | The page is about this issue: the issue-view heading, then `document.title` in the form `[KEY] Summary` | the issue view |

**The cascade reads the group's widest anchor** (§2.7). It matters at tier 4:
where a row carries a link on the key and another on the summary, the summary is
the wider one, and its own text is the answer. Tier 1's claim about issue links
also depends on that panel's card being a row, which it became on 2026-08-18
(§2.1).

Tier 2 works because the accessibility affordances are consistently the richest
text on a card (`02` §1). The label ends with `. Use the enter key to load the work
item.`, which the Cart removes, and it starts with the key, which the Cart also
removes.

**Tier 5 corrects `02` §5, and its guard is load-bearing.** `02` recorded the
timeline's summary as unreadable, because it has no `data-testid` and its
position varies. A pasted `outerHTML` showed it one hop from the anchor: it is a
sibling inside the anchor's own parent. Subtracting the anchor's text from the
parent's text yields exactly the title, with no invented testid and no dependence
on a child index (`08` §8.6). **The tier runs inside a known row and nowhere
else.** Prose links are in scope (§2.3), and outside a row this tier would read a
paragraph and store the sentence around the link as the summary. Inside a row,
the only text near an issue anchor is about that issue. The result is refused if
it still contains the key, so a mangled subtraction cannot become a summary.

`cleanText` collapses whitespace, and removes `(opens new window)` anywhere in
the string, not only at the end. The timeline anchor is
`<a href="/browse/RDC-21069">RDC-21069<span>, (opens new window)</span></a>`.
That trailing screen-reader text defeated the survey's own regex (`02c`).

**No summary is a correct answer.** An item is valid with a key alone (`01` rule
1). The cascade returns an empty string, the item is stored, and gap-fill
(§2.6) asks the API later.

**Jira's summary field is mandatory, so an item with no summary never means "this
issue has no title".** It always means "the Cart did not capture one" (`06` §3).
The UI must not suggest otherwise.

### 2.3 The live list mirrors the page. Scanning is not an action

**There is no "scan" button, and there is no third drawer mode.** The drawer holds
two standing sections: the live list and the collections. `09` records that its own
session was nearly mis-designed for want of this sentence, and `08` had to mark §3
of its own question obsolete for the same reason.

The user's words: *"The Cart accumulates the links I have added to collection, it
doesn't automatically collect all links drawn on a page. There is another section
of the side panel that is not the Cart and that shows the links currently drawn
on page. When scrolling, that list gets updated, so I can see new links and add
them, if I so choose, to the cart's active collection."*

**The promise is "everything drawn on this page right now", and that is the
correct answer, not a compromise.** Every Jira list view is destructively
virtualised: rows unmount behind you, so the counts FALL as you scroll — the
backlog from 41 anchors to 33, the board from 32 to 27, the timeline from 42 to
19 (`02` §6). No selector work fixes that.

The API cannot do better, because it answers a different question. The page's
filters are the user's query, and the DOM is the only place they have been
applied. The user's words: *"if I filter my backlog view, I want to see only the
relevant links, I don't want to see everything, that wouldn't be usable at all."*
The measurements show the API always returning MORE than the page shows, never
less (`09` §1, `09a`):

| What was compared | Jira's own page | The API |
| --- | --- | --- |
| A backlog section, `0 of 44 work items visible` | 0 drawn | 50 issues |
| The board, 25 cards on screen | 25 | `approximate-count` 1150 |
| The whole backlog | ~36 drawn | 750 issues over 32 sections |
| Search results | 50 drawn | `approximate-count` 12,816 |
| The timeline (Plans) | — | `403`. Admin only |

**So the scan makes no network request.** The live list is synchronous. The API
keeps only the summary-fallback job that `01` gave it. "Add all 12,816 results of
this JQL" is a different feature — import — and is out of scope (§6).

**The live list is a strict mirror.** Rows enter it when they mount. Rows leave it
when they unmount. Nothing is remembered, so no buffer can disagree with the page.
The reason this design holds together is one sentence:

> **The collection is the accumulator, so the live list does not have to be.**

You scroll, you add what you want, you scroll further, you add more.

**The Cart never scrolls on the user's behalf.** Scroll-and-accumulate was
rejected: it moves the scroll position, it takes seconds, it fights a list that
mutates underneath it, and it puts a multi-second asynchronous operation into the
add path (`09` §3).

**One row per key for the whole page.** The same issue has several DOM homes: a
backlog card carries two anchors to one issue, the visible key and its
screen-reader twin. So `a[href*="/browse/"]` reports about twice the number of
backlog cards, and a raw anchor count is not an issue count (`02` §4). The list
deduplicates by key across the document, in an insertion-ordered `Map`, so page
order survives. The representative is the **widest** anchor. On the backlog that
is the visible key rather than the screen-reader twin — which selects the right
element without naming `…screen-reader-key`, and so without adding a testid to
the list of things that can rot (`08`, `07` §6.3).

**The widest anchor is the anchor the row READS FROM, and not always the anchor a
control is placed against.** §2.7 has the correction and its evidence: in a row
whose summary is also a link to the same issue, the widest anchor is that
summary. It is the right place to read text and the wrong place to put a button.

The Cart's own UI is excluded from the scan. **That was written as a guard, and at
version 0.4.0 it became the thing holding a feature up.** When every row's key
became a link (§2.9), the drawer started carrying one `/browse/` anchor per key — so
without this line the live list finds itself, every count doubles, and a live list
that scanned itself would be diagnosed as a Jira change rather than as our bug. The
line that cost nothing has now paid for itself twice: it also keeps the floating
button from being summoned by our own rows (§2.7).

**The label states the scope: `On this page (n)`.** It does not borrow Jira's own
`(7 of 27 work items visible)`, for three reasons (`09` §4/5): that text is
already on screen a few centimetres away; the witness exists on two views out of
seven, so the drawer would be inconsistent; and reading it means a regex over a
localised string with no testid behind it, whose failure mode is a **wrong number
in the UI**. A wrong number is worse than no number.

**Prose links are in.** `02` §3 recommended excluding `.ak-renderer-document`,
`.ProseMirror` and `[contenteditable="true"]`, so that issues merely mentioned in
a description could not enter the collection. `09` §7 reversed it: that reasoning
was about a batch add. Under manual picking it is backwards. Reading `RDC-1420`
and wanting the three issues its description links is a normal thing to want, and
the cost of one link you do not want is one glance.

**Each row records a coarse origin.** The user's framing: *"where they generally
come from, e.g. 'from comments' (not which specific comment), 'from ticket
description'."* It is a region category, never an instance, and it is found by
walking up from the anchor. First match wins.

| Origin label | Container |
| --- | --- |
| this work item | `[data-testid$="breadcrumb-current-issue-container"]` |
| backlog | `[data-testid*="card-list.card.content-container."]` |
| board | `[data-testid$="ui.card.card"]` |
| work-item table | `[data-testid$="ui.issue-row"]` |
| timeline | `[data-testid$="scope.issues.issue.row"]` |
| timeline | `[data-testid="sr-timeline"]` — the Team's Timeline tab. **The FIRST origin that names a whole view rather than a row**, so the label survives the row's name changing |
| search | `[data-testid="search-page-body"]` — Rovo search. **The second origin that names a whole view rather than a row**, and for a second reason: that page has two regions and both are "the search page" to the person reading the drawer. It sits above the two rows below it, so anything nested inside a result still reads as `search` |
| linked work items | `[data-testid*="issue-line-card"]` |
| description or comments | `.ak-renderer-document` |

Two limits, stated rather than hidden. `.ak-renderer-document` renders the
description AND the comment stream, so one label must serve both until a probe
separates them (§6). Search results and an epic's children are the same
component, so one label serves both. A region that cannot be identified gives a
row with no label. It never gives a guess: `02`'s rule is that a `data-testid` is
never invented.

**The origin is not stored** (`09` §7). It is a property of the live-list row, not
of the item.

### 2.4 One key holds one JSON blob, in Tampermonkey's storage

The store is **Tampermonkey's own storage**, under a `@grant` (`10`). The key is
`gt-jira-cart.collections`. It holds one JSON object.

```json
{
  "v": 1,
  "collections": [
    {
      "id": "0f3a1c7e-6b21-4a55-9f0c-3d2e7b104a8e",
      "name": "Sprint review 2608-01",
      "items": [
        { "key": "RDC-14817", "summary": "Outline inside the edited field", "issueId": "1420631" },
        { "key": "RDC-23716", "summary": "Rundown grid does not refresh after a move" },
        { "key": "GLX-402" }
      ]
    },
    {
      "id": "9c22b0d4-1f8e-4c33-b7a1-52c9d6e0f411",
      "name": "Blocked on QA",
      "items": []
    }
  ]
}
```

`05` designed this model for `localStorage`. `10` moved the store and the model
did not change. It is a substitution of two calls:
`GM_getValue` and `GM_setValue` in place of `localStorage.getItem` and
`localStorage.setItem`. That works only because **`GM_setValue` is synchronous**,
which was measured (`10` §5).

**There is no active pointer. The active collection is `collections[0]`.**
Activating a collection moves it to the front. So no id can dangle, and no delete
path has to repair anything: deleting the active collection promotes the next one
by construction (`05` §4).

**`collections` is never empty.** The first run writes one collection. Deleting
the last collection empties its items instead of removing it — which the chip's ✕
implements, and says in its own tooltip (§2.9). With these two
invariants together, *the active collection* is total: it always resolves, and no
code path anywhere handles "there is no active collection".

The cost is accepted knowingly: collection order is most-recently-activated, the
list of collections reshuffles when you switch, and a hand-chosen order cannot be
expressed. At a handful of collections, the one you work in sits at the top, which
is where the drawer wants it.

**Three shape choices, each with the alternative it beat.** All three are the same
choice: no value may exist that can disagree with another value.

| Choice | The alternative, and why not |
| --- | --- |
| One key, not one key per collection | Per-collection keys need an index key for membership and order. **An index can disagree with the keys beside it.** That is the bug [`jira-backlog-sprints.user.md` §2.7](jira-backlog-sprints.user.md) was rewritten to remove |
| `collections` is an array, and its order IS the order | A map keyed by id needs a separate order list. The same disagreement |
| `items` is an array, not a map keyed by issue key | A map makes "a key appears once" unrepresentable, which is tempting. But the add path does the lookup anyway (§2.7), so the map buys nothing, and an array keeps ordering open |

Details settled by implication, recorded so nobody decides them again: a
collection's `id` is opaque, generated once with `crypto.randomUUID()`, and never
derived from the name, so renaming is free. Adds append to the end of `items`. The
item's Jira id is named **`issueId`**, not `id`, so it cannot be confused with the
collection's own.

**An item is a key, plus what we know about it.**

| Field | Required | Where it comes from |
| --- | --- | --- |
| `key` | Yes | the anchor's href, uppercased |
| `summary` | No | the DOM beside the key (§2.2), or `bulkfetch` (§2.6) |
| `issueId` | No | only a `bulkfetch` response that happens to carry it |

`issueId` earns its place on refresh. A moved issue keeps its numeric id and loses
its key. A refresh sends the id where it knows one and the key where it does not,
and the response carries both. So from the second refresh onward, an item whose
issue changed project repairs its own key silently. Two riders: the
requested-against-returned diff (§2.6) is then done on **whatever was sent**, and
if a repaired key collides with a key already in the collection, the two items
merge into one.

**Three fields are deliberately not stored** (`05` §6):

| Not stored | Why |
| --- | --- |
| `status`, `issuetype` | Free from `bulkfetch`, but NOT uniformly free from the DOM. Items added by the floating toggle would lack what refreshed items carried, and the drawer would look different item to item. Status also goes stale fastest, and a stale status shown as current is the wrong-number-in-the-UI failure again |
| `addedAt` | Array order already carries insertion order |
| `fetchedAt` | It implies a per-item freshness display we cannot honestly maintain |

Each of the three is an additive optional field, so each is cheap to add later
with no migration (§2.4 versioning).

**Two more keys exist, and neither holds state that must agree with the blob.**
`gt-jira-cart.collections.bak` is written once per version upgrade and never read
by the script. `gt-jira-cart.prefs` holds the UI's own switches. The user's data
and the UI's settings are different kinds of state — the distinction
[`jira-ux-improvements.user.md` §2.8](jira-ux-improvements.user.md) already draws
between the lock and the collapse — and separating them means a malformed
preference can never take a collection with it.

**All three keys live in Tampermonkey's storage. Decided on 2026-08-18, by the
build session, which `10` left this to.** `10` moved *the collections* and said
nothing about the other two. The other two follow them, for three reasons. A
backup in `localStorage` is destroyed by a logout — the exact event the `@grant`
exists to survive, and the event a bad migration is most likely to follow, so a
backup there is missing when it is needed. One store means the load path has one
failure mode and not two. And the Cart then never touches `localStorage` on this
origin at all, whose wrapper is the hazard the scar below describes. The cost is
known and accepted: the preferences are no longer visible in the developer tools'
Application tab, and are read in Tampermonkey's own storage view for the script.

**The separation is unchanged. Three keys, not one.** `05`'s reason for keeping
the preferences apart from the collections is about **separation**, not about the
store, so it stands either way: a malformed preference still cannot take a
collection with it.

> **Amended on 2026-08-22. The preferences key gains six values, and one rule that
> is new in kind for this store.** Nothing above changes; this is the same key doing
> more. The six are `lineShape`, `detailsFields`, `reportFields`, `reportBand1`,
> `reportBand2` and `settingsTab` — the whole state of the configurable exports.
> `v` is **not** bumped and there is no migration: preferences are not versioned,
> and no stored item changed shape.
>
> Four of them are ordinary: an id this build does not know falls back to that key's
> default, exactly as `layout` and `corner` already do. One rule is worth naming
> because it is a range check that says *no* to a value the UI can never send:
> **`reportBand1` may not be `none`**, because a report with no bands at all is
> 📋 Details, and a preference must not turn one export into another.
>
> **The two field lists are the new kind. A stored list can disagree with the code's
> own catalogue, and the code wins.** Each is an *ordered* array of `{ id, on }` —
> not an array of the enabled ids, which was considered and rejected: with order
> carried by the array and *off* meaning absent, unticking a field loses its
> position and re-ticking it sends it to the end, so somebody toggling one field to
> compare two outputs would find their order quietly rearranged. On read, an id the
> catalogue does not name is dropped, a duplicate collapses to its first entry, `on`
> is true only when it is exactly `true`, and **a catalogue field the stored list
> never mentions is appended at the end, off.**
>
> That last step is why **a new field arrives OFF while a new tab arrives VISIBLE**,
> and the asymmetry is deliberate: a tab appearing changes nothing about what a
> button emits, where a field appearing ticked would change what a button produces
> without being asked — which is what §2.8 and §2.14 both warn against. The field is
> still in the list, so it is findable.
>
> **An empty selection survives, and the listing is still completed.** Zero ticked
> fields is a real state — the line is the head alone, and the head is always there,
> because it is the issue reference rather than a field — so nothing on this path
> ticks a list back on. What the append step does to a stored `[]` is fill in the
> catalogue's names, all off. The export is identical either way, and the tie is
> broken by the panel: it draws its rows *from* this list, so a list that mentioned
> nothing would draw a panel with no rows in it and no click could get back to a
> field.
>
> **None of this goes anywhere near `load`.** It is the prefs path, where a
> malformed value falls back to a default because a preference is regenerated by
> clicking a switch — the exact opposite of the last migration row below, which
> refuses to write rather than repair. The vocabulary these keys are checked against
> (the field catalogue, the shape ids, the bandable ids, the tab ids) lives in one
> place in the script and is the single source the ⚙ panel and the three formatters
> read; a second list beside any of them would be two values that can disagree.

**`v` is at the root and nowhere else.** It is bumped only when an existing field
changes shape or meaning. **Adding an optional field never bumps it**, or one new
field becomes a migration and the reversibility above evaporates.

Migration is lazy and lives in the load path, which is the one place every read
already goes through. An old blob is migrated in memory on read, and persisted on
the next real write. So nothing is rewritten because you looked at it, and a
migration bug cannot destroy data before you have done anything.

| What the key holds | What the script does |
| --- | --- |
| Nothing | First run. Create the default collection and carry on |
| `v` ≤ what this build knows | Migrate in memory, use it, persist on the next write |
| `v` > what this build knows | **Read what it can. Refuse to write.** The badge and the drawer still show the collections. An add is declined with a visible reason. An old build that wrote a newer blob back would silently drop what it did not understand |
| Present, but it does not parse | **Do not overwrite it.** The Cart starts empty and says the stored data could not be read |

**That last row departs from this repo's convention on purpose.**
[`jira-ux-improvements.user.js:135-138`](jira-ux-improvements.user.js#L135-L138)
and [`jira-backlog-sprints.user.js:231-235`](jira-backlog-sprints.user.js#L231-L235)
both catch a parse failure and fall back to defaults. That is correct there,
because a preference is regenerated by clicking a checkbox. **A collection is not.**
It is the user's data. An unreadable blob is kept for manual recovery from
devtools.

Before the first write under a new `v`, the old value is copied to
`gt-jira-cart.collections.bak`. It is written once per upgrade and never read, so
it introduces no second value that must agree with anything. It exists so that a
bad migration is recoverable by hand.

> **Run for real on 2026-08-25, at 1.3.1, and the paragraph above held.** §7's
> damaged-store step had never been performed against a live Tampermonkey store. The
> blob was edited by hand to nonsense, and the Cart **started empty and refused to
> write**, saying so on the page: *"The stored collections could not be read, so the
> Cart started empty. The stored value was NOT overwritten: recover it from
> Tampermonkey's storage view for this script."*
>
> **"Nothing survives" is the property, not the failure**, and it is worth naming
> because it reads like a loss and is the opposite of one. The damaged blob is still
> in storage, untouched, which is the whole of `state.writable`: the Cart will not
> overwrite what it could not read. **The `.bak` is not a rescue and must never be
> mistaken for one** — it is written only ahead of a schema migration and never read,
> so a store damaged by hand has no automatic recovery by design. The alternative is
> the one §2.4 rejects two paragraphs above: a collection is the user's data, and
> falling back to defaults would destroy it to make the UI look healthy.
> `store-smoke` asserts the state (`unreadable` → not writable); this run is the
> evidence that the sentence a person actually sees says what to do about it.

### 2.5 Every write is a read-modify-write, and the write is the commit

This is the whole of correctness for the store.

```
read the blob → apply the change to that copy → write it back → render
```

**Never write from an in-memory copy.** The reason is staleness, not a race. Two
tabs writing within one second is not reachable by one person with one mouse, and
the user said so. The reachable bug is minutes or hours wide: a tab opened this
morning holds a stale copy, eleven items are added in another tab, and one add
from the old tab would write all eleven away. Read-modify-write closes that
completely, because **a tab cannot destroy what it never read** (`05` §5).

**The write is the commit** (`05` §8). The read-modify-write mutates a copy. Only
a successful write makes it real. Nothing in memory is updated first. So if the
write throws, storage still holds the previous collection, whole. That is
principle 4 made true rather than aspirational.

On any write failure: re-render from storage, and say so in the drawer (§2.9).
One catch, one path. No error is special-cased.

**Use the `GM_*` functions. Never the `GM.*` functions.** This is a rule from the
user and it is the same shape of bug as the clipboard scar in §2.8. `GM_setValue`
is synchronous. `GM.setValue` is promise-based. The dotted form would put an
`await` in the copy handler, and a clipboard write after an `await` lands outside
its transient user activation — intermittent, silent failure (`10` §5.1, `04` §3).

The script grants what it uses: `GM_getValue`, `GM_setValue` and
`GM_addValueChangeListener`.

**Cross-tab freshness is `GM_addValueChangeListener`.** Tampermonkey's own
signature, from the only part of its documentation that could be read
(`10a` §1.4):

```
GM_addValueChangeListener(key, (key, old_value, new_value, remote) => void)
```

It was measured across tabs: the other tab receives `remote: true`, and the
writing tab receives `remote: false` for its own write (`10` §5). That is better
than the `storage` event, which tells a tab about its own write by NOT firing.
Same information, less inference.

Four rules for the notification, and note that **it is only a freshness
optimisation.** Correctness is the read-modify-write above.

1. **The listener is registered on EACH OF OUR KEYS**, so it hears them and
   nothing else. **Corrected on 2026-08-19, at 1.0.0.** This rule said *the key*,
   singular, and the script listened on the collections key alone. That was
   harmless while every preference was a setting you change once — and it stopped
   being harmless at 0.5.0, when the drawer's open state became one of those
   preferences (§2.9). The state was shared by every tab and the propagation was
   not, so the other tab's drawer closed by itself at its next render for some
   unrelated reason. **The rule is now: a key that any tab writes and any tab reads
   needs a listener.** Both of ours do. Nothing else does, and `…collections.bak`
   is written and never read.
2. **Re-read storage. Ignore the new value in the event.** One path:
   *event → load → render*. The event never becomes a second way in.
3. **Re-read when the drawer opens.** This is free, because `render` always reads
   storage. There is no in-memory copy to refresh.
4. **Re-read when the tab becomes visible.** Compare the raw string with the last
   one parsed, so an unchanged blob costs a string comparison.

The delivery is measurably later than a `storage` event — the user saw it arrive
*"after a short time"*. That costs a late redraw and nothing else, because the
notification is a hint and not the mechanism.

**A scar about the other store, and it still applies to any script on this
origin.** Atlassian replaces `window.localStorage` with a plain object,
platform-wide. `instanceof Storage` is `false`, its constructor is `Object`, and
**`length` is a METHOD there, not a property** (`05a` §3.1). The wrapper is a
faithful front end — a write through it produces a real cross-tab `storage` event
whose `storageArea` is a native `Storage` — but the original accessor is
overwritten rather than shadowed, so it cannot be recovered from
`Window.prototype`. And an idle Jira tab fires about **100 `storage` events in a
couple of seconds** (`05a` §3.4): `__storage_test__`, `awc.storage.support`,
`__storejs__test__`, `statsig.session_id.*` on a timer. So: never rely on
`localStorage.length`, and any `storage` listener on this origin must filter by
key on its first line. The Cart's own store is not `localStorage`, so it meets
neither hazard — but the next person to reach for that API on a Jira page does.

### 2.6 The stored summary is a snapshot, and the API is the fallback

Two things change a stored summary. Nothing else does (`05` §6, `06` §8).

| Trigger | What it fetches | When |
| --- | --- | --- |
| **Gap-fill** | only the items that have NO summary | automatically, **while the drawer is open** |
| **Full refresh** | the whole collection | only when the user asks, with the ↻ control |

**Gap-fill's trigger is a state, not an event.** An earlier version fired it when
the drawer opened. The user found the hole: if the drawer is already open and you
add a link whose summary is not on the page, nothing fires, and the item stays
bare until the drawer is closed and opened again. One rule covers both cases, and
the idempotent `render` evaluates it — not two event handlers that must be kept in
agreement (`06` §8).

Three guards come with the state trigger:

1. **Never ask twice for the same key.** An item that came back empty has no
   summary permanently (see the failed state below), so a naive state trigger
   would re-request it on every render for ever. The guard is the per-session
   annotation that the failed state already needs, so it costs nothing new.
   **Write this down or a build session deletes it as decoration.**
2. **Exclude keys already in flight**, so a re-render during the request does not
   duplicate it.
3. **Debounce into one request per burst.** Adding five links to an open drawer is
   one `bulkfetch`, not five. **The window is 400 ms. The build session chose that
   number on 2026-08-18 and nobody measured it**, the same standing as the 200 ms
   grace period in §2.7: it is long enough to join a burst of clicks and short
   enough that a single add does not feel delayed. If gap-fill ever feels slow,
   suspect this number first.

The write-back is a read-modify-write that **patches only keys that are still
present**. The gesture is a toggle (§2.7), so a response that lands after an item
was removed must not bring it back.

**A refresh may replace a summary. It may never delete one.** If a request returns
nothing for a key — deleted, no longer visible, or a response that fails the
validation below — the stored summary is kept and the row carries the failed note.
Otherwise one network blip strips the titles off a collection built over a week.
This makes refresh safe by construction: it can only improve or leave alone.

**What was proposed and declined:** refreshing every summary each time the drawer
opens, so that a copy always carries current titles. The user kept the policy
above. The consequence is accepted: **a collection left for a week can be copied
with week-old titles.** Nothing may fetch in the copy path (§2.8), so the remedy
is the refresh control and not a smarter copy.

**The API call is one endpoint.**

```
POST /rest/api/3/issue/bulkfetch
{ "issueIdsOrKeys": ["RDC-14817", "GLX-402"],
  "fields": ["summary"], "fieldsByKeys": false }
→ 200  { "expand": "…", "issues": [ … ], "issueErrors": [] }
```

It was verified live under `@grant none` (`01` §3) and again inside Tampermonkey's
sandbox under a `@grant` (`10` §5). Use it rather than a JQL search: the keys go in
directly, so there is no JQL string to build or escape, no URL-length ceiling, and
no `key in (…)` value limit. `GET /rest/api/3/search` is **gone**, not deprecated.
Do not write against it.

Four rules govern every call, and each one is a measurement (`01`):

1. **An item is valid with a key alone.** The summary is an enrichment layer.
   Never block an add on a fetch. Never discard a key because its summary did not
   arrive.
2. **A response is data only when `response.ok` AND the content type starts with
   `application/json` AND the parsed body has the expected shape.** Logged out, a
   `GET` on this API returned **`200` with `text/html` and Atlassian's login
   page**. A client that trusts `response.ok` stores login-page HTML as an issue
   summary. Three lines of validation remove a whole class of silent corruption.
3. **Diff the requested keys against the returned keys.** A missing key is
   omitted **silently**. `issueErrors` came back as `[]` — for an unparseable key
   (`01` §5), for a real project with an absent number, on all four runs (`09a`),
   and again under a grant (`10` §5.2). Absence is the signal. Nothing may depend
   on `issueErrors` being populated.
4. **One request per 100 keys or fewer. Never per key.** So a whole collection
   refreshes in one request at the expected scale, and the Cart stays far from any
   rate limit.

Always pass `fields` explicitly. On the current API, omitting it gives you ids
back. That is the most likely way a naive port returns nothing usable. A field
that was requested and is absent from the response is **normal, not an error**:
`parent` was requested on an Epic and was simply not there (`01` §6).

`Accept: application/json` is sufficient for a GET. The verified `POST` also sent
`X-Atlassian-Token: no-check`. Whether the POST requires it was never isolated, so
keep sending it. It is one header and it cannot hurt.

**There is one failed state, and it is not stored.** `GET .../issue/RDC-9999999`
returns `404` with *"Issue does not exist or you do not have permission to see
it."*, and `bulkfetch` is quieter still: `200`, `issues: []`, `issueErrors: []`
(`05a` §3.5). **Atlassian conflates absent and forbidden in its own text**, on
purpose. So the UI has one failed state and **may never say "deleted"**.

The state is derived, never stored. A `summary` is present or it is not. "Cannot
read this item" is the result of the last attempt, not a property of the item: an
issue that is unreadable this morning may be readable this afternoon, and a stored
`failed: true` is exactly a flag that can disagree with the world. It is a
per-session annotation on the row, the same treatment the live list's origin gets.

### 2.7 The add gesture: one floating toggle, to the left of the hovered link

**One shared button follows the pointer. Nothing is ever injected into a Jira
row.** It is `position: fixed`, about 24px square, with a 6px gap, and it is
placed to the LEFT of the hovered anchor. It flips to the right only when there is
no room at all.

It is a **toggle**, and it has three states.

| The pointer is on | It shows | A click |
| --- | --- | --- |
| the link, not collected | a blue `+` | adds the issue |
| the link, collected | a green `✓` | — (this reports the state) |
| **the button, collected** | **a red `−`** | **removes the issue** |

So the button reports the state at a distance, and names the action under the
cursor. The change happens before any click. **Removal is the one destructive
thing this gesture does and there is no undo**, so the warning is the safety
margin, and it costs one CSS rule (`07` §5).

**Which way a click goes is derived from storage at click time**, never from what
the button was showing. A label made stale by another tab cannot cause the wrong
operation.

**The per-row `+` was built, used, and killed. The cause of death, in one
sentence:**

> **There is no way to put an affordance inside a Jira row without changing how
> Jira lays that row out.**

An inline-level box about 20px tall, inserted next to the key, raises the height
of that row's line box, and the summary beside it re-aligns as though it had been
given `vertical-align: top`. The user reported it on **four views independently** —
search results, the backlog, the active-sprint board, and the linked-work-items
panel, where the key wrapped onto a line of its own. **And the escape route is
worse than the disease:** taking the `+` out of the flow means writing
`position: relative` onto a node React owns, on the guess that none of Jira's own
absolute positioning depended on that node not being a containing block. That is a
bet against a codebase we cannot read, on every list view, for ever. It was
offered and declined (`07` §3).

The floating form also wins three properties for free: it needs no per-row
cleanup; destructive virtualisation costs it nothing, because nothing is attached
to a row that can be lost when the row unmounts; and **the
did-you-mean-to-navigate failure is unreachable rather than merely unobserved**,
because a separate element means there is no shared click target to disambiguate.

**Left, not right, and the reason generalises.** It was built on the right, and
the user asked for the left after a day of use. On every list view surveyed, the
key sits at the row's left edge and the summary runs off to the right. So a `+` on
the right lands on the busiest part of the row, and a `+` on the left sits in the
row's own margin, where nothing else is. It also meets the pointer on the way in.

**Loud, not subtle.** The first build was an outlined chip in the design tokens'
subtle palette, and the verdict was that it cannot be picked out. The shipped form
is a solid brand-bold fill with a light ring and a drop shadow, which reads
against any Jira background in both themes. A bordered transparent button does
not.

**Draw the `+`. Do not type it.** The `+` read as sitting too low in its box while
the `✓` beside it read as centred — same box, same flex centring. Flex centres the
line BOX. It cannot centre the glyph's ink inside that box, and a `+` is drawn on
the font's math axis. Two bars positioned with `inset: 0; margin: auto` are exact,
and independent of whatever font the page resolves (`07` §5). The `✓` stays as
text, because it was already right.

Two more mechanics from the prototype:

- A **grace period** keeps the button alive for a moment after the pointer leaves
  both it and the anchor, so the pointer can cross the gap without a steady hand.
  The prototype used 200 ms. It was never complained about and never isolated. If
  the affordance ever feels skittish, suspect this number first (`07`, not
  settled).
- Lists scroll inside their own containers, so **reposition on scroll rather than
  hide**. Hiding on scroll made a one-notch wheel nudge kill the affordance.

**Already-collected is a CSS rule generated from the `href`, not a class written
onto a node.** Whether a link is collected is knowable from its `href` alone, so
each collected key becomes a selector in one regenerated stylesheet. That answers
for every matching anchor **including the ones React has not created yet**. No
per-row JavaScript, nothing to re-apply after a remount, and destructive
virtualisation costs nothing. It is the same lever `jira-ux-improvements` uses for
its lock and its collapse, and it is principle 3 taken at its word (`07` §6.1).

Anchor each key four ways. A substring match would make `RDC-1` match `RDC-123`:

```
a[href$="/browse/KEY"], a[href*="/browse/KEY?"],
a[href*="/browse/KEY#"], a[href*="/browse/KEY/"]
```

Only a key that matches `^[A-Z][A-Z0-9]*-\d+$` goes into a generated stylesheet.

**Group anchors by (row, key) before decorating anything.** Two reasons that pull
in opposite directions: a backlog card carries two anchors to the **same** issue,
so a per-anchor loop decorates it twice; and a prose paragraph carries anchors to
**different** issues under one parent, so a per-row loop decorates one and loses
the rest (`07` §6.3). Note that the live list's rule is not the same rule: it
wants one row per key for the whole page (§2.3).

**A group has two answers, not one. Corrected on 2026-08-18, from use.** This
section said the **widest** anchor served the whole group, which is true on the
backlog, where the other anchor is an invisible screen-reader twin. It is wrong
on every row whose summary is **also a link to the same issue** — child work
items, search results, an epic's children, linked work items (appendix A.6). The
summary link is the wider one there, so the button landed 6px to the left of the
summary, which reads as *to the right of the key*: the middle of the row, and not
the row's own left margin, where this section put it and where nothing else is.

| The group's role | The anchor |
| --- | --- |
| Where the button goes | the anchor that **says nothing but the key** |
| Where the summary is read from | the **widest** anchor |

The two must stay separate, and the second is why the fix is not simply "use the
key's anchor". In those rows the summary arrives from tier 4, which reads the
anchor's own text (§2.2), so reading from the key's anchor would store **no
summary at all**. Placing beside the key and reading from the summary is one
group with two roles, and neither role names a `data-testid`.

"Says nothing but the key" is decided by `stripKeyPrefix` returning an empty
string, not by an equality test. So the timeline's
`RDC-21069, (opens new window)` counts, and the backlog's screen-reader twin,
which carries the key **and** the summary, does not. Document order decides when
more than one anchor qualifies, so the key column wins.

**The right-click menu is a preference, and it ships off.** It was liked. It is
not the gesture. The user's words: *"the context menu is nice, but I would like to
have this option with a toggle, not always on because I expect to be able to use
the browser's context menu whenever I want."*

**Cancelling the event is not enough. The interception must also stop it.
Corrected on 2026-08-18, by the build session.** This section said "intercepting
`contextmenu`, cancelling it, and drawing our own". `preventDefault` alone stops
the browser's menu and leaves the event to reach Jira's own handler, which is on
the row and therefore contains the key. The result is both menus on the one
element the feature is about. `stopPropagation` in the capture phase is what makes
the interception exclusive, and it does not widen the interception: the target
test still requires an issue anchor.

What being on costs, established before anything was built and confirmed in use: a
userscript cannot add an entry to the browser's native right-click menu. Nothing
can, from a page. So the feature means intercepting `contextmenu`, cancelling it,
and drawing our own — and on the elements we intercept the user loses *Open link
in new window*, *Copy link address*, *Save link as*, *Search with…*, and every
extension's own entries. *Open link in new tab* was given back as a menu item so
that the trade would be visible, and it was not enough. **On Chromium there is no
escape hatch:** Firefox lets Shift+right-click bypass a page's handler, and
Chromium does not. One asymmetry the design owns while it is on: on the backlog,
right-clicking the key gives our menu and right-clicking the summary two
centimetres away gives Jira's own card menu. Widening the interception to the
whole row would swallow Jira's card menu instead, which is a bigger loss (`07`
§4).

The switch lives in `gt-jira-cart.prefs`, off by default, in the drawer's
preferences area (§2.9).

**Since 1.3.0 that menu has three entries, not two.** `Copy link to KEY` was
added, and it is the second give-back: switching the menu on costs *Copy link
address*, and this is the answer to that. It is not a clone of Chrome's entry and
the label does not pretend to be — it copies the issue in the shape ⚙ names, so on
a default install it is a markdown link and not a bare URL. Somebody who wants
Chrome's exact bytes sets `URL only` on that dropdown. The order is the browser's
own: the Cart's own action first, then open, then copy.

#### 2.7.1 The copy button beside the `+`, and the one thing it may not do (1.3.0)

**The request, in the user's words:** *"the ability to have an extra button next
to the + button that would allow to quickly copy the link of a ticket without
actually opening it."*

**One rail, two buttons, and THE `+` DOES NOT MOVE.** That last clause is the
constraint everything else here is arranged around, and it is the reason this is a
subsection rather than a sentence. The `+` has been exactly `TOGGLE_GAP` from the
hovered key since 0.1.1; the left-hand side was not designed, it was **reversed
into** after a day of use; and it has been reached for daily ever since. A second
button that pushed the `+` 28px further out would spend that, silently, to make
room for something new. So the copy button is added on the **outside** — further from the
link — and the `+` keeps its pixel.

| What | How |
| --- | --- |
| The floating element | a `div` rail, `position: fixed`, holding both buttons in a flex row with a 4px gap |
| Document order | copy, then `+` |
| Placed on the left of the key | the rail's **right edge** lands where the `+`'s right edge used to, so the `+` — the last child — is unmoved |
| Placed on the right (no room on the left) | the rail gets `flex-direction: row-reverse`, so the `+` is the near button on that side too |
| The width used for the placement maths | arithmetic from two constants, never a measurement |

**Why a rail rather than two fixed buttons.** Two independently placed fixed
buttons leave a 4px gap between them that belongs to the **page**. A `pointerover`
landing in that gap reaches whatever is underneath, which starts the grace period
and takes the affordance away *while the pointer is crossing from one half of its
own control to the other*. One box means the gap is inside our own element, so
`closest` still answers. That is the whole argument, and it is the same shape of
argument as the one that made the `+` float in the first place.

**Why the width is computed and not measured.** Asking the rail for a rect is
wrong twice: while it is hidden it reports zero, and once it is shown the read is a
forced layout in the middle of a pointer move. `TOGGLE_SIZE + RAIL_GAP +
TOGGLE_SIZE` is the same number with neither cost. The rail's height is
`TOGGLE_SIZE`, because the buttons are square and the same size.

**The `+` must stay a containing block, and this is the one bug here that
JavaScript cannot see.** The `+` was `position: fixed`, which gave it a containing
block for free — and the two bars that *draw* the plus are `position: absolute;
inset: 0`. As a flex child it has none. Dropping `fixed` without putting
`relative` in its place sends both bars to the viewport's corner and leaves an
empty blue circle: the button still has its children, still has their classes, and
still reports the right state, so nothing in `boot-smoke` can see it. `css-smoke`
asserts the plus is positioned, and that check was verified by taking the word out
and watching it go red.

**What it copies: the `Issue reference` shape, at ITEM SCOPE.** Not a fixed
markdown link and not a bare URL. One setting decides what a collected issue looks
like everywhere, and this is one collected issue, so it reads the same setting —
which also means all five shapes are already reachable from this button, `URL only`
included. **It is the first caller item scope has ever had.** §2.8 built three
scopes when there was one gesture and said in as many words that two of them were
"the seam that makes a fifth format one entry in a list". Nothing had to be added
to that seam here: the `- ` bullet drops, the `<ul>` drops, and the bytes land
exactly on `jira-ux-improvements`' own 🔗 button. **That is the only evidence the
seam was the right shape, and it is worth recording as such** — a seam nothing has
ever used is a guess, and this one turned out not to be.

Which of the six formats a single-issue gesture means is a **flag on the entry**
(`single: true`), not the literal `"links"` in two handlers. Same treatment `opens`
gets for 🔍 Search, and for the same reason. Links is the entry that can carry it:
📃 Names and 🔑 Keys emit no URL, so neither is a link; 📋 Details and 📊 Report
would put a field tail on one hovered issue; and 🔍 Search has no single-item form
by §2.8's own rule.

**The summary comes from the page, through the same six tiers the `+` uses.** The
two gestures have to agree about what the issue is called. The alternative — read
the *stored* summary when the issue happens to be collected — was declined: the
same hover would then copy different bytes before and after an add, which reads as
a defect (§4). **The cost is stated rather than hidden:** on a link with no row
around it, tier 5 does not run and the page gives no summary, so the copy is the
reference alone — even when that issue is sitting in the collection with a summary
beside it.

**Secondary on purpose, and it is the one place "loud, not subtle" is deliberately
not followed.** That finding was about a **lone** affordance with nothing on the
page pointing at it. This button never appears alone: it is always flush against
the bold blue circle, so the eye finds the pair and then reads the pair. Two
equally loud circles would compete, and adding an issue to the Cart is what the
Cart is for. So it takes the page's own surface, a hairline in the page's own
border colour, and the same drop shadow. **The risk is named rather than argued
away:** §2.7 killed exactly this treatment once, for the `+`, and if this button
turns out to be hard to pick out, the remedy is that one rule.

**The glyph is typed, not drawn, and that is not a reversal of the `+`'s rule.**
The `+` is drawn because a plus sits on the font's math axis and read as low.
`🔗`, `✅` and `⚠️` are emoji with their own metrics and their own colour, and flex
centring is exact for them. They are also not new vocabulary: `🔗` is the label the
drawer's own button for these exact bytes already carries, and `✅` and `⚠️` are the
two outcomes the foot already flashes. 13px rather than the `+`'s 14px, and the
reason is which glyph has to fit: the button usually shows a chain link, but the two
it shows at the moment that matters are a tick and a warning triangle, and colour
emoji are typically drawn wider than their em box. **That is reasoning and not a
measurement**, exactly like the paragraph above it about being findable at all — §7
step 37 presses both.

**The ground does not move when the glyph does.** `✅` and `⚠️` carry their own
colour, so a green ground under a green tick is mud. The foot's four buttons flash
by swapping the label and leaving the button alone; this is the same rule. The
state *is* written to the element as a `data-` attribute, so a harness can read it,
and no rule paints from it.

**The receipt is a VALUE that `render` reads, and NOT a label written onto the
button.** This is the one place the rail differs in kind from the foot. `flash`
writes `✅` straight onto a foot button and gets away with it because `renderFoot`
is the only thing that rebuilds that label. The rail is re-rendered by **every**
signal the script has, because its position is derived from the hovered anchor — so
a glyph written on the click is replaced by the next `animationstart` React fires,
which on a busy page is within a frame or two. So the flash is a per-session
variable, and the receipt lasts its full 900 ms. **That is stronger than the
foot's, whose `✅` an unrelated re-render can still clear early**, and §2.8 says so
about itself. The two are inconsistent; the inconsistency is recorded in §6 rather
than resolved here, because changing the foot is a change to shipped behaviour that
nobody asked for. Neither is in storage, which is the part they do agree on.

**The pointer on the copy button may not offer to remove anything.** On a collected
link, the pointer on the `+` turns it red and names removal, because removal has no
undo. The copy button is a different action on the same issue. So the hover state
is kept alive by the **rail** and the red is decided by the **button**: one test
against the rail's id, one against the toggle's. Merging them would make the `+`
threaten a removal you were not reaching for.

**It is a preference, and it is the first switch in this file that ships ON.**
Every other boolean in `gt-jira-cart.prefs` ships off and reads *anything that is
not exactly `true` is off*. This one reads *anything that is not exactly `false` is
on*, and the asymmetry is the decision: **a switch ships off when turning it on
takes something away**, which is the right-click menu's whole story, and this takes
nothing away. What it *does* cost is room — the rail is about 52px wide instead of
24px, so it covers more of the row's own left margin — and that is what the switch
is for. Off, the rail is the single `+` it was at 1.2.0, to the pixel. It lives on
the ⚙ Appearance tab, **above** the right-click row, which is the one place on that
tab where the order was chosen rather than inherited: this switch is on for
everybody and the one below it is off for everybody, so the tab reads from the mild
control to the expensive one.

**What is NOT measured, and it is the thing to press first.** Whether a 52px rail
covers something that matters in a real row. **What IS known is the DOM order, not
the pixels:** the issue-navigator markup captured in `research/02c-live-dom-survey.md`
puts a checkbox cell, then a type icon, then the key anchor — so the row's left margin
really does hold a **selection checkbox**, and the rail's outer edge is now
`TOGGLE_GAP + TOGGLE_SIZE + RAIL_GAP + TOGGLE_SIZE` = about 58px left of the key.
Whether 58px reaches that checkbox depends on Jira's own padding, which nothing here
has ever measured, and `boot-smoke` cannot help: it has no layout, so the rail's
placement there is arithmetic against a stub rectangle. **If it does cover the checkbox, the remedy is
already decided rather than open** — stack the rail vertically, which is one
`flex-direction` and moves the same argument to the same place, because a 24×52
rail leaks about 7px into each neighbouring row's own left margin instead. It is
§7 step 36.

**One combination has no receipt at all:** the right-click menu on and the copy
button switched off. The menu closes on every entry, so the flash has nowhere to
land. It is a corner of a preference that itself ships off, the remedy is the
switch, and a failed write is still on the console — so it is recorded here rather
than paid for with a toast this script has no other use for.

### 2.8 Copy-out: four formats, and the copy is synchronous

**Four formats ship.** The worked example is one collection of three items, where
the third has no summary — the case that decides most of this section.

**🔗 Links** — for a status email, Confluence, Slack, a pull request description.

```
- [RDC-14817](https://dalet.atlassian.net/browse/RDC-14817) Outline inside the edited field
- [RDC-23716](https://dalet.atlassian.net/browse/RDC-23716) Rundown grid does not refresh after a move
- [GLX-402](https://dalet.atlassian.net/browse/GLX-402)
```

**📃 Names** — for a commit message, a plain-text mail, a code comment.

```
[RDC-14817] Outline inside the edited field
[RDC-23716] Rundown grid does not refresh after a move
GLX-402
```

**🔑 Keys** — for a commit message, a form field, a quick paste into chat.

```
RDC-14817, RDC-23716, GLX-402
```

**🔍 Search** — Jira's own issue navigator, opened on the collection. The query is
unchanged; only where it goes changed.

```
key in (RDC-14817, RDC-23716, GLX-402)
→ /issues/?jql=key%20in%20(RDC-14817%2C%20RDC-23716%2C%20GLX-402)
```

**The four are a spanning set, not a wish list**: one rich list a person reads, one
plain list a person reads, one list of identifiers, one query. Every other
candidate collapses into one of the four (`06` §1).

> **Amended on 2026-08-20. There are five, and the claim above is narrower than it
> reads.** §2.14 added 📋 Details. The four here remain a spanning set *of
> destinations that take one document each*, and that argument is untouched — the
> fifth is not a fifth kind of document. It exists because a detailed list has to
> survive **six** destinations with different renderers, two of which cannot draw a
> table at all. The original sentence stays because its reasoning is still what
> keeps a sixth format out.

Links takes its exact shape from `jira-ux`'s 🔗 link button, repeated per line
under a `- ` bullet. This is reuse, not a variation. The shape is `[KEY](url)
Summary` — the key alone is the link, and the summary sits outside it. The reason
in that script is a syntax limit and not a taste: **markdown cannot nest square
brackets**, so a `[KEY] Summary` label cannot be a link label. Two consequences
are worth keeping: the link column is short and uniform, so a pasted list is
scanned down its keys; and the summary stays ordinary text, so it can be edited in
the email you pasted it into without fighting a link boundary.

> **Amended on 2026-08-25: THE HEAD OF A LINE IS A PREFERENCE, AND THERE ARE FIVE
> SHAPES.** The line above is one of them, it is the default, and **a default install
> emits 1.1.0's bytes exactly** — that is the whole requirement of these defaults, and
> every worked example in this section is still asserted unchanged. The paragraph
> stays because its reasoning is still what shapes two of the five: markdown cannot
> nest square brackets, so the key goes inside them and everything else stays outside.
>
> **ONE PREFERENCE, THREE CONSUMERS, ONE READ.** `format` reads `lineShape` once per
> copy and hands the shape to 🔗 Links, 📋 Details and 📊 Report, so §2.14's promise
> that the three agree about what a collected issue looks like holds by construction
> — there is no second read to fall out of step. A **per-export override** is left in
> **§6 item 16** and costs one nullable key each, whose third state must mean *follow
> the default* (decision 5).
>
> | Shape | `text/plain` | What it is for |
> | --- | --- | --- |
> | `markdown` — *Markdown link on the key* | `[RDC-1513](url) Summary` | What 1.1.0 shipped. The default |
> | `markdown-key` — *Markdown link, no summary* | `[RDC-1513](url)` | A link column and nothing else |
> | `key-summary-url` — *Key, summary, then the URL* | `RDC-1513: Summary - url` | A destination that does not render markdown |
> | `key-url` — *Key and URL, no summary* | `RDC-1513 - url` | The same, with the summaries left off |
> | `url` — *URL only* | `url` | The same again, where a link is all that is wanted |
>
> **EVERY SHAPE DEFINES BOTH FLAVOURS** (decision 6). One that changed only
> `text/plain` would silently do nothing in Outlook, Word, Teams and Confluence, which
> all take the HTML — a setting that quietly fails to apply, which is what §2.14 warns
> about. The three URL-bearing shapes make the URL the **anchor's own visible label**,
> so the choice takes effect whichever flavour the destination takes.
>
> **ALL FIVE WERE PASTED, on 2026-08-24, and the paste decided two things this
> document could not** (appendix A.9.1). A visible URL survives and arrives
> **clickable**, so the URL-bearing shapes are available on **all three** exports
> rather than on 🔗 Links alone. And the paste **asked for a shape the prototype did
> not offer** — `markdown-key` — so the count is five rather than four.
>
> **THE EM DASH COLLISION IS ACCEPTED, and the ground is the transferable part.** This
> section invented the em dash because *"a summary can contain dashes"*. `RDC-1513`'s
> real summary contains ` - ` itself, so `key-summary-url`'s URL separator is a
> character the summary uses, and §2.14's em dash then lands after 45 characters of
> link — the exact defect the em dash exists to prevent, reintroduced by the preset.
> The user's reason for accepting it: **these documents are read and never parsed.**
> Nothing regex-parses a pasted report, so the ambiguity costs a machine and not a
> reader, and the em dash still marks where the metadata starts. The two alternatives
> — a different separator before the URL, and withholding the plain shapes from the
> two exports that carry a field tail — are **DECLINED rather than untried**
> (decision 28).
>
> **THE SEPARATOR STILL GOES WITH ITS VALUE, in every shape and both flavours.**
> `GLX-402` has no summary, so `key-summary-url` emits `GLX-402 - url` and never
> `GLX-402: - url`. That is the oldest rule in this section, and it is why each shape
> carries its own conditional instead of joining a list of parts.

**JQL keeps its slot on utility.** It is the query slot in the spanning set, and it
is the way to turn a collection back into something Jira can filter, bulk-edit,
save and share. An earlier argument — that it makes the data durable *inside* Jira
while Links makes it durable *outside* — was withdrawn when `10` made the store
survive a logout (`10` §6). The utility argument never depended on the store.

**The button OPENS that query rather than copying it. Changed on 2026-08-18, at the
user's request, after using 0.2.0.** The paragraph above is the reason: filtering,
bulk-editing, saving and sharing all happen *in Jira*, so the copy was a step on the
way to somewhere, and every use of it ended in the same paste. The control now goes
there. `/issues/?jql=<encoded>` is the path, read off the user's own instance.

**It opens a NEW TAB.** A same-tab navigation would take away the page the live list
is mirroring and close the drawer with it, because the open state lives in memory
(§2.9). Nothing would be lost — the collection is in storage — but the sitting would
be. `window.open` inside a click handler carries the user activation a popup blocker
asks for, the same as §2.7's menu entry. **Its return value cannot be tested:
passing `noopener` makes it return `null` by specification, whether it worked or
not.** So there is no success check, and a `null` there means nothing.

**What this costs, stated because it is a real loss.** The JQL *text* no longer
reaches the clipboard, and that text has secondary uses: a board's filter, an
automation rule, a saved filter's edit box, a colleague. Each of those is now one
step further away — which is the mirror of the step this change removes. The trade
is accepted on frequency: the search was the common destination and the others were
not. It is also softened rather than sealed, because the search page shows the query
in its own box and its URL is shareable, so the text is one selection away and the
link is arguably the better thing to send. **If both are ever wanted, it is one more
entry in the same list, not a redesign** — which is the property this section was
built for.

**The query itself did not change**, and one function still builds it. So the format
stays checkable on its own, and the spanning set still has exactly four slots.

**No format ever drops an item.** The lines in a paste always equal the items
copied. Silently omitting an item would hide something that is either pending or
broken.

| Format | With a summary | Without one |
| --- | --- | --- |
| 🔗 Links | `- [RDC-14817](url) Outline inside the edited field` | `- [GLX-402](url)` |
| 📃 Names | `[RDC-14817] Outline inside the edited field` | `GLX-402` |
| 🔑 Keys | unaffected | unaffected |
| 🔍 Search | unaffected | unaffected |

**Names drops its brackets, and that is not cosmetic.** The brackets separate the
key from the summary. With no summary they separate nothing, and `[GLX-402] `
carries a trailing space. **Both sides of Links drop the separator with the
summary too.** The existing code writes `` `[${key}](${url}) ${summary}` `` and
`` `…</a>&nbsp;${escapeHtml(summary)}` ``, which leaves a trailing space and a
dangling `&nbsp;` when the summary is absent. That is harmless in `jira-ux`, where
a summary is always derived from `document.title`. In the Cart it is not, so the
separator and the summary go together (`06` §3).

**Scope.**

| Format | Whole collection | A selection | One item |
| --- | --- | --- | --- |
| 🔗 Links | yes | yes | yes |
| 📃 Names | yes | yes | yes |
| 🔑 Keys | yes | yes | yes |
| 🔍 Search | yes | yes | **no** |

Search is the exception because it exists to rebuild a set. For one issue,
`key in (RDC-14817)` is a worse way to reach it than the URL the other three
formats already carry, and the idiomatic single form is `key = RDC-14817`, which
would mean two shapes behind one menu entry.

**The `- ` bullet belongs to the scope, not to the format.** Markdown's `- ` is
list syntax, and one item is not a list. A selection that holds a single item
still gets a bullet, because a list was asked for. A single-item copy gets none.
The gesture decides it, so nothing has to count the items. The single-item outputs
then land exactly on `jira-ux`'s three copy buttons.

> **AND SINCE 1.3.0 THERE IS A GESTURE THAT DECIDES IT.** This paragraph was written
> when `item` was a seam with no caller, and it stayed that way for four versions.
> §2.7.1's copy button is the caller: one hovered issue, `item` scope, 🔗 Links'
> bytes. **Nothing had to be added to this design to serve it**, which is the only
> evidence available that the scope was the right shape rather than a plausible one.
> Two of the three scopes are still unreached — `selection` has no gesture, and the
> collection is still the selection (§2.9).

**No format emits the collection's name as a heading.** It is redundant wherever
you paste, because you have already written the subject line. It is wrong for a
selection, which is not the collection. And it is invalid inside Keys and JQL,
where a `## Sprint review` line is not part of the syntax. Leaving it out also
keeps *lines equals items* exactly true, which makes a paste checkable at a glance.

**Only Links writes a rich version.** The W3C Clipboard API specification names
exactly three mandatory types — `text/plain`, `text/html`, `image/png` — and the
Cart has no image. Custom types behind a `"web "` prefix exist, and the
specification is silent on whether native applications can read them, so nothing
uses them. `text/plain` + `text/html` is the whole surface (`06` §5).

| Format | `text/plain` | `text/html` |
| --- | --- | --- |
| 🔗 Links | markdown list | a `<ul>` of links |
| 📃 Names | yes | — |
| 🔑 Keys | yes | — |
| 🔍 Search | — | — |

```html
<ul><li><a href="https://dalet.atlassian.net/browse/RDC-14817">RDC-14817</a>&nbsp;Outline inside the edited field</li><li><a href="…/RDC-23716">RDC-23716</a>&nbsp;Rundown grid does not refresh after a move</li><li><a href="…/GLX-402">GLX-402</a></li></ul>
```

`<ul>`, not `<ol>`: document order already carries the collection's order, and
numbering would imply a ranking that does not exist.

> **Amended on 2026-08-20: every `<li>` now carries
> `style="line-height:1.5;margin-bottom:8px"`.** A bare `<li>` is unreadable in
> Outlook — it gives a wrapped list item no leading and no gap after it, so a
> pasted list arrives as one dense block and has to be reformatted by hand. Two
> properties because it is two problems: `line-height` for the leading inside a
> line that wraps, `margin-bottom` so one item reads as one block.
> **Links was excluded from this for one day, and the premise was wrong.** The
> reasoning was that a key plus a summary does not wrap, so there is no leading to
> fix. Real summaries on this instance run 60 to 100 characters — *"Multi Site
> Rundown - attach a Galaxy TV script in a Dalet Pyramid story using remote
> rundown explorer"* — which wraps in any email column. Corrected at the user's
> instruction. **One constant, `LIST_ITEM_STYLE`, serves both formats**, so
> neither can drift from the other, and a harness check asserts they are the same.
> At single-item scope there is no `<ul>` and no `<li>`, so nothing carries it. The `&nbsp;` after `</a>` is
taken verbatim from
[`jira-ux-improvements.user.js:337-342`](jira-ux-improvements.user.js#L337-L342).

**Search writes no clipboard flavour at all**, because it writes no clipboard: its
feedback is the tab that opens, which is a stronger receipt than a blink on a button,
and there is nothing on that path that can half-succeed.

**Names gets no rich version, and that is the point of Names.** A `<ul>` twin
would put bullets into Confluence that were not asked for. The reason to choose
Names over Links is wanting unadorned lines. Plain text alone is not a
degradation: a rich editor takes the plain text and renders the line breaks, which
is the request. Keys is one line of identifiers with nothing to mark up, and JQL's
target is a plain search input.

**The two versions must agree about what the document is.** `- ` bullets on the
text side, `<ul><li>` on the HTML side. At single-item scope there is no bullet, so
there is no `<ul>` either.

**Copy-out is synchronous and never awaits the network.** It writes what is in
storage at the moment of the click, exactly as
[`jira-ux-improvements.user.js:348-361`](jira-ux-improvements.user.js#L348-L361)
does. `navigator.clipboard.write` requires transient user activation. A copy
handler that awaited `bulkfetch` to fill a missing summary would put the write
after a network round trip — inside Chromium's activation window most of the time,
and never in Safari. That is intermittent, silent copy failure (`04` §3). Three
things follow: **an item with no summary copies as a bare key**; **refresh is a
separate, visible action**, never a hidden step inside a copy; and `GM_setValue`
must stay synchronous, which is why §2.5 forbids `GM.setValue`.

`GM_setClipboard` is not used. It does not need user activation, which looks like
the fix, but it sets one flavour per call and would cost Links its HTML twin. The
grant that looked like the escape hatch is worse than the thing it escapes.

**Reuse the clipboard code unchanged** from `jira-ux-improvements`: `escapeHtml`,
`writeClipboard`, `flash`, `COPY_FEEDBACK_MS` (900 ms), and the comment that
explains the missing permission gate. Two notes:

- `escapeHtml` carries more weight here than there. The summary is read from a
  Jira page and stored, so `&`, `<` and `>` in an issue title reach the clipboard
  path.
- `writeClipboard` falls back to `writeText` when `ClipboardItem` is missing, so
  Links loses its HTML and keeps a valid markdown list. Principle 4 is satisfied by
  the existing function.

**The scar in that code stays, with its reason.** `navigator.permissions.query`
must NOT gate a clipboard write. Firefox and Safari reject that permission name,
the promise rejected unnoticed, and **the copy silently never happened** (`06` §6,
and the comment at
[`jira-ux-improvements.user.js:362`](jira-ux-improvements.user.js#L362)).

**Feedback is ✅ or ⚠️ on the control for 900 ms**, put back by the next `render`.

- **Partial success does not exist.** `navigator.clipboard.write` is one operation
  with one outcome. There is no state where the plain text landed and the HTML did
  not. Two symbols, no third.
- **A copy that contains items with no summary is still ✅.** That is a fact about
  the collection, not about the write, and the two have different remedies. ⚠️
  means *press it again*. A thin item means *refresh, or that issue is gone*.
- **Links falling back to `writeText` is still ✅.** The markdown list is a
  complete artifact. Use `logger.debug`, not ⚠️.
- **There is no flash state in storage.** The Cart re-renders when another tab
  writes, so an unrelated change can clear the ✅ early. The fix would be a stored
  "flashing until" timestamp, which is exactly the kind of value both existing ADRs
  deleted. The feedback is a blink, not a receipt.
- **The label must be derived inside `render`.** `flash` works only because every
  label is rebuilt from state. A label written once at construction keeps the ✅ for
  ever (`06` §6, `08` §5).

**A copy of zero items must not write at all.** An empty collection would put an
empty string on the clipboard, destroy whatever was there, and show a ✅ claiming
success. The precondition for any copy is at least one item.

**There is no template seam. Do not write that there is one.** A
fill-in-the-blanks template handles Keys and JQL and then dies on Names: the
template `[{key}] {summary}` yields `[GLX-402] ` where the answer is `GLX-402`.
That is a **different line shape**, not a substituted value, so it needs a
conditional inside the template. Add the rest of what the model would need — a
second output channel with a `<ul>` wrapper and different escaping, a bullet that
appears only at list scope, and JQL being unavailable at single-item scope — and
the "template" has become a small programming language written to serve four
instances. **User-editable templates would be a rewrite of this layer, not a
setting switched on** (`06` §7). One more reason to record while it is in view:
user-written templates mean user-written HTML reaching the clipboard, which is a
different safety question than any fixed format faces.

> **Amended on 2026-08-25: UPHELD, and 1.2.0 is what tested it.** The exports became
> configurable and this paragraph did not have to move, because **a preset list is not
> a template**. A shape is a pair of functions in this file, so no user-written string
> reaches the clipboard, and `detailChip` keeps being the one place styling is written
> — which is what makes the five measured rules of §2.14 enforceable at all. A
> preference can say *which* shape, and nothing else.
>
> What a template would have to express got **larger** rather than smaller. Every
> claim above still holds — Names' summary-less line is a different line shape, the
> second output channel with its own escaping, the bullet that appears only at list
> scope, JQL having no single-item form — and §2.14 adds a lozenge whose colour comes
> from a status *category*, a colour that applies to two of five priorities, and a
> separator that must not be a box. **User-editable templates are still a rewrite of
> this layer** (§6 item 10).
>
> The seam that was real is the **dispatch table below**, and 1.2.0 puts a **second
> table beside it** rather than a hole inside it: `SHAPES`, five entries, each with an
> id, a label and one function per flavour. Adding a shape is one entry. Deleting one
> sends every stored blob naming it back to the default on the next read, with nothing
> else to change.

**What is real is a dispatch table**, and it should be called that and nothing
more:

```
format(items, scope) → { text, html? }
```

Four functions, one signature. `writeClipboard` does not care which one ran. Three
of the four entries end at the clipboard and the fourth carries one extra field that
names its destination, so the table is not named after copying.
Adding a fifth format means adding one entry to a list, which is how
[`jira-ux`'s `BUTTONS` array](jira-ux-improvements.user.js#L404-L463) already
works.

> **Amended on 2026-08-25: the signature gained a third parameter,
> `(items, scope, shape)`.** The shape ARRIVES as an argument and is never read by a
> builder, which is what makes the three heads one setting rather than three reads of
> one setting. It also keeps every builder a pure function of its arguments, which is
> what lets the harness assert all five shapes' bytes with no store to stand up. The
> three formats that have no head ignore it, the same way they already ignore `scope`.

> **Amended on 2026-08-20: that last sentence was wrong, and §2.14 is the
> counter-example.** The dispatch table did take exactly one entry. The **two-step
> fetch behind it did not** — a payload that is not in storage needed a fetch step,
> a held result, an expiry rule and a label ladder. So the rule to carry forward is
> narrower: *a format whose payload is already in storage is one entry in a list.*
> One that needs the network is a section of its own.

### 2.9 The badge, the drawer, and the two sections

**The Cart takes a BOTTOM corner. Bottom-right is the default. The Cart is never
anchored to a Jira element** (`08` §1).

`jira-ux-improvements` and `jira-backlog-sprints` own the top-right, in both their
anchored and their fallback positions. The Cart stays out of it. The default drawer
height leaves the corner clear. A drawer dragged to full height that covers
something is the user's own doing, and nothing tries to avoid it automatically.

**The top-right is not merely contested. It is unusable for a fixed element**, and
the prototype's forced-fallback switch is what proved it. `jira-ux`'s non-anchored
rule places its toolbar at `0.5rem` from the top with
[`z-index: 1`](jira-ux-improvements.user.js#L623), which is inside Jira's own
global navigation band and behind it. Switching the fallback on made that toolbar
**disappear**, not move.

> **A finding for `jira-ux-improvements`, not for the Cart: every Firefox user of
> that script had no toolbar at all.** Firefox never takes the anchor-positioning
> branch, so the fallback is the only path it has, and Chromium users have never
> seen it. It is recorded here because the Cart's harness found it, and because it
> is the evidence behind the bottom corner. **It was fixed on 2026-08-18, in that
> script's version 0.3.2**: the fixed corner gets `z-index: 9999` and the anchored
> rule keeps `1`, so the Chromium position is unchanged. Refer to
> [`jira-ux-improvements.user.md` §5](jira-ux-improvements.user.md) risk 6.

**The drawer's own chrome mirrors the anchored corner.** One rule generates both
placements: the resize grip goes on the corner the drawer is NOT anchored to, and
the head's controls go on the side it IS. Docked bottom-left, the ✕ moves to the
left of the head. The user proposed this to fix an aesthetic complaint, and it
turned out to fix a collision: on that dock the grip lands exactly where the ✕ sat
(`08` §1, §8.5).

**The drawer is non-modal, and it must stay that way.** No backdrop, no focus
trap, no light dismiss, and nothing that closes it when the page is clicked.
**Escape does not close it**: Jira binds Escape all over its own UI, and a drawer
that vanished under an Escape aimed at one of Jira's dialogs would read as a bug.
The user kept it open throughout a collecting session, which is the verdict — **the
live list is the reason it stays open**, so the drawer is a companion and not a
review surface opened at the end (`08` §2).

**Whether the drawer is open is a STORED PREFERENCE, and a fresh install starts
closed. REVERSED on 2026-08-18, at the user's request, after using it.**

The first answer was the opposite, and it is kept here because the reasoning is
still worth reading and was still wrong. It said: the open state answers *am I
collecting right now*, which is a question about this sitting and not a standing
preference — the same reading `jira-ux-improvements` gives its lock and
`jira-backlog-sprints` gives its panel. So it lived in memory, and the cost was
stated and accepted: *a reload closes a drawer you were collecting into.*

**Use overturned it, and the flaw was in the premise, not the deduction. A reload
is not the end of a sitting.** It is a link you clicked, an edit you saved, a page
that reloaded itself, or a full page load from the drawer's own key links (added in
0.4.0, which is what made this frequent enough to notice). Closing the drawer on
each of those made the reload cost more than the reload.

It therefore joins the remembered size and the remembered divider in
`gt-jira-cart.prefs`, and it is read the way `corner` is: **a function that asks
storage, never a variable beside it.** A variable and a stored value are two things
that can disagree, which is what principle 1 deletes everywhere else in this design.

Two costs, both accepted and neither hidden: **a new tab opens with the drawer
already open**, because it reads the same preference, and **a drawer left open a
week ago is open when you come back.** Both follow from it being a preference,
which is what it now is.

**A THIRD COST WAS NOT SEEN UNTIL 1.0.0, and half of it was a defect. Found on
2026-08-19, by running the whole script twice over one store.** Because the state
is shared, **closing the drawer in one tab closes it in every tab** — that half is
the decision above working as decided, and it is accepted. The defect was the
timing: the cross-tab listener was registered on the collections key and on
nothing else (§2.5, rule 1), so the other tab was not told when it happened. It
found out at its next render for some unrelated reason — a mount burst, another
tab's add, the five-second backstop — and its drawer then closed by itself,
seconds later, with nobody having touched it there. **The state was shared and the
propagation was not**, which reads as a bug rather than as a preference. The
remembered size, the divider, the corner and the layout all had it too. §2.5 now
carries the general rule, and the fix is one more listener.

One property is unchanged and still load-bearing: **a React remount must not close
it.** The state is not on a node React owns — it is a stored value written onto
`<html>` as an attribute by one CSS rule, which also means a drawer you left open is
open on the FIRST PAINT of a reload rather than a frame later. §7 steps 10, 11 and
13 are what that has to satisfy.

**Plain `z-index`, not the top layer.** `popover="manual"` was built into the
prototype as a switch and never earned its place. Nothing of Jira's ever covered
the drawer at `z-index: 9999`, on any view tried, and the top layer made no
difference to the one overlap that does exist: a drawer dragged large covers its
neighbours either way, because being above everything includes being above them.
It is also one less mechanism that behaves unlike the rest of the UI. (If anything
later does ask `matches(":popover-open")`, note that this pseudo-class **throws**
on an engine that does not know it, so it needs a feature test first.)

**The drawer is resized from a grip on the free corner, and the size is
remembered.** Double-clicking the grip hands the size back. The browser's own
`resize: both` was tried first and rejected in use (§2.10).

**The layout is derived from the drawer's width unless it is pinned.** `auto`
stacks the sections below 560px and puts them side by side above it. `stacked` and
`split` are the user pinning it. That is **one preference with three states**,
rather than a layout flag sitting beside a remembered size that could contradict it
— principle 1. The drawer's width already says which shape was asked for. *Note
for the build session: the real script can do this with a container query and no
JavaScript at all. The prototype derived it in `render` only because every layout
rule there was keyed off one attribute on `<html>`.*

**The live list keeps about 62% of the room by default, in both layouts.** The
divider between the sections is draggable, and its position is remembered per
layout. The proportion is the user's: a collection is expected to hold around
twenty items and to be emptied, while the mirror is what you read to decide. It is
a **fixed basis** rather than a rule about content, so the split cannot shift under
you as the collection fills, and it is CSS rather than JavaScript, so it is right
on the first paint (`08` §3).

**A live-list row is a toggle.** Click a collected row and it leaves the
collection. The row turns red and shows `−` under the cursor first — the same
pre-click warning the floating button gives. **A collection row keeps a plainer
explicit `✕`**, because in a thirty-item list a mis-click on a whole row would
delete something and there is no undo. `07`'s constraint is honoured: the same item
is removable in **both** sections, never removable in one and inert in the other
(`08` §3).

**The whole live-list row is the control, EXCEPT ITS KEY. Corrected on 2026-08-18,
at the user's request, after using 0.3.1.** The live list is the only add path for
anyone who cannot hover, so the target is still most of the row rather than a small
`+` inside it — that reason is untouched. What changed is that **the key is now a
real link** in both sections, so a click opens the issue and a middle-click or a
Ctrl-click opens it in a new tab.

Three things follow, and each is a rule rather than a detail:

- **The link is a SIBLING of the toggle, never a child.** An anchor inside a button
  is invalid HTML and the parser lifts it straight out — the same trap the
  collection chips hit, and the reason a live-list row is now a `<div>` holding two
  controls.
- **The two gestures are the browser's, not ours.** A real `href` answers
  middle-click, Ctrl-click, *Copy link address* and the browser's own menu for free.
  A script that reimplemented them with a click handler would get some of them right
  and quietly lose the rest.
- **A click costs a FULL PAGE LOAD, where Jira's own links re-render in place. That
  is measured, and it is declined rather than deferred (appendix A.7, 2026-08-18).**
  Jira's router is per-element: its own anchors carry their own React `onClick`, so
  our anchor is invisible to it no matter what it does. Being seen would mean putting
  the drawer inside `#jira-frontend`, where React can delete it — which is the one
  thing this section refuses. The only route left is `history.pushState`, and §2.12
  says a script under a `@grant` has no page context; a push that a router
  half-honours gives a changed URL over a stale view, which is worse than a reload
  rather than better. **The gesture that keeps your place already exists**, and it is
  the middle-click above. And since 0.5.0 a reload costs the page load and not the
  sitting, because the drawer comes back open.
- **The pre-click warning moved onto the toggle.** A collected row used to turn red
  under any hover; it now reddens only the half that removes, because the key beside
  it navigates instead, and a red row would promise a removal on a click that does
  something else. §2.7's rule is that the affordance names the action UNDER THE
  CURSOR, and with two actions in one row that has to be read strictly.

**The full summary is in the tooltip, on both sections' rows.** A 380px drawer
cannot show a Jira title, so the row ellipsises and the hover carries the rest:
`KEY — summary` on one line, what the click will do on the next.

**The collection, and the words on it** (`08` §4):

| Question | The answer |
| --- | --- |
| The default collection's name | **`Scratch`**. Short enough for the badge, and it names what the thing is: working state that gets emptied. Not "Cart", which is reserved for the UI itself |
| Renaming | **Click the name in the heading and edit it in place.** The thing you click is the thing you change. Enter or blur commits, Escape cancels |
| Duplicate names | **Prevented, by appending a number.** ` 2`, then ` 3`; lowest free wins; the same rule on create and on rename; a clash ignores case. The cost is known and accepted: a collection genuinely called `Sprint 2` duplicates to `Sprint 2 2`, because incrementing the trailing number would silently name it after a different sprint |
| Emptying | **⌫ in the heading, beside ↻.** It removes every item and KEEPS the collection and its name, which is the whole reason it is not the same control as delete: a collection you refill every sprint is worth keeping, and deleting it to clear it means typing the name again |
| Deleting | **✕ on the chip**, because a collection is deleted where it is named. Deleting the active one promotes the next by construction, and deleting the only one empties it instead — both already decided in §2.4 |
| Reorder | **It does not exist**, and this row is about the COLLECTIONS — the chips. Their order is most-recently-activated (§2.4), and a hand-chosen one is not expressible, because the first chip is not decoration: it is the collection an add goes into. Reordering the ITEMS inside a collection is a different question, and it shipped at 1.4.0 — §2.9.1 below |

The collection switcher is a row of chips, each carrying a name and its own count.
**The count is a separate element from the name and never truncates.** It is the
one thing on a chip that cannot be reconstructed from a shortened label.

Collection rows are in array order. That was insertion order until 1.4.0 and it is
now **insertion order until something is moved**. What has not changed, and it is the
half that matters, is that **array order is the order a copy emits**. Newest-first
would read better in the drawer and would disagree with the paste, which is a worse
thing to be.

### 2.9.1 The items reorder by drag — 1.4.0, 2026-08-25

**Asked for by the user, and §6 item 7 had it as future work.** The reason is one
§2.14 had already recorded from the other side: people paste these lists into Slack
and Teams and then **reorder them in the editor by hand**, to put the urgent thing
first or to group what they are discussing. Every line is one thing to drag *there*.
This makes it one thing to drag *here*, before the paste, where the order is kept.

**Grab the whole row.** Not a handle, and not a pair of ↑↓ buttons — the same shape
the field lists use (§2.14) and for the same reason: the biggest target a 380px
drawer can offer. The row holds a key, a summary and a ✕, and the summary already
ellipsises.

**The key link opts out of its own drag.** An anchor with an `href` is draggable by
default, so without `draggable="false"` on it, the most obvious place to grab a row
would start the browser's link drag and the reorder would look broken exactly where
it is first tried. Opting the anchor out does not kill the gesture: the platform
walks up to the nearest draggable ancestor, which is the row.

**Only one thing was given away for this, and the first draft of this section said
two.** What goes is selecting a summary with the mouse, to the `user-select: none`
the drag needs — without it the browser offers the text selection to drag instead of
the row. What was *going* to go is the key link's native drag-out: dragging a key
into Slack or an editor used to drop that issue's URL there, free from the platform,
and making the whole row draggable took the anchor's own drag away.

**THE USER REFUSED THAT COST AND WAS RIGHT: `setData` takes one payload PER TYPE.**
The same drag can be our reorder inside the drawer and a link on the way out. So
`writeDragPayload` sets three more types beside the internal one, and what comes out
is **better than what the anchor gave**:

| Type | What it carries |
| --- | --- |
| `application/x-gt-cart-item` | The key. Ours, inert everywhere else, and the internal drag reads a variable rather than this — `getData` is unreadable during `dragover` |
| `text/plain` | The `🔗` button's own bytes at item scope, from the same `format` call — so it is the **`Issue reference` shape**, not a hard-coded one |
| `text/html` | Its rich twin, so an editor that takes HTML gets a real link |
| `text/uri-list` | The issue URL, which is what makes this a **link** drag rather than a text drag |

**The bytes are the `🔗`'s, and that is a rule rather than a convenience.** One issue
leaving the Cart has one shape wherever it leaves from. A literal in the drag handler
would be a second place deciding what a collected issue looks like — the exact defect
§4 rejected when it refused a fixed shape for the copy button. It also means the five
paste rules of §2.14 already cover these bytes, because they *are* those bytes.
`boot-smoke` asserts them against the same literals the `🔗` press is asserted
against, so the two cannot drift apart in silence.

**The source is the store, not the row on screen.** A drag out is a copy, and a copy
reads what is stored.

**`effectAllowed` is `copyMove` and not `move`.** A target that means to copy will
refuse a move-only drag, and a drop into another application is never a removal from
the collection. Inside our own list `dragover` still sets `dropEffect = "move"`, so
the gesture there is unchanged; what `copyMove` adds is a cursor that tells the truth
on the way out.

**`text/uri-list` is the one with a cost, and it was taken with the cost named.** A
link drag can be dropped on the Jira page itself, and the browser's own answer to
that is to navigate the tab to the issue — losing the page the live list is
mirroring. **That hazard is not new**: the anchor's native drag had it before 1.4.0.
What is new is that the target is now the whole row rather than the key, so a
mis-drop is easier to make. §7 step 39 looks at it rather than assuming either way.

> **LOOKED AT ON 2026-08-25, AND NOTHING HAPPENED.** The user dropped a row onto the
> Jira page behind the drawer and the tab did not navigate. **The accepted cost was
> not charged**, which is a better outcome than the design allowed for.
>
> **Read this narrowly, because there are two explanations and this run does not
> separate them.** Either the browser declined to navigate on a `text/uri-list` drop
> into page content, or **Jira's own page swallowed the drop** — it is a
> drag-and-drop application in its own right, with `dragover` handlers of its own on
> boards, backlogs and attachment zones, and any one of them calling
> `preventDefault` would produce exactly this result. **The second explanation is
> instance-shaped and view-shaped**: it could hold on a board and not on a settings
> page, and it says nothing about a different browser.
>
> So the paragraph above is kept exactly as written. What changed is that the hazard
> is now **unobserved** rather than **assumed**, on one browser, one Jira instance,
> one view, one attempt. It is not retired, and nothing in the file depends on it
> either way — if it ever does fire, the remedy is a `dragover` on the document that
> swallows our own drag, which §2.9.1 costed and declined precisely because the
> hazard was thought to be the browser's rather than ours to prevent.

> **AMENDED 2026-08-26: THE PARAGRAPH ABOVE NAMES THE WRONG HAZARD.** A link drop on
> ordinary page content does **not** navigate the tab. **A new tab opens** with the
> dropped URL, and the page you were on survives. Measured twice in the collection
> drag's rig — once with a single URL, once with four — see appendix A.10.
>
> **What was wrong was the hazard's shape, not the reasoning.** The 2026-08-25 run
> above saw nothing happen at all, which is consistent with either explanation it
> gives, so neither could be separated and both were kept. What nobody tested was
> what the browser does *when it does act*. It opens a tab. So the accepted cost was
> never *losing the page the live list is mirroring* — it was a stray tab you close.
>
> **The remedy this note recommends is the one §2.9.2 designed, chose, and then did
> not build**, and the reason is measured on the other side of the same trade:
> dragging an item row into a Jira comment or description **works today**, inserting
> the link in the shape the `Issue reference` setting names. A `dragover` on the
> document that swallowed our drags would take that away — from this drag as well as
> the collection's, since one handler cannot tell a wanted drop from an unwanted one
> by target. So the declining stands, and it now stands on evidence rather than on
> the guess that the hazard was the browser's to prevent. §2.9.2 has the full
> reckoning.

**And it corrects a line this document has carried since 1.0.0.** §2.9 says copying
one row out of the collection is refused, *because the collection is the selection*.
That was never quite true — the platform gave per-row extraction away through the
anchor for four versions. What the sentence was really refusing is a per-row copy
**control**: a second selection mechanism layered on the first, costing every row a
button in a drawer that is already narrow. That refusal stands. The gesture does not
cost a row anything, and it is now deliberate rather than incidental.

**The grip is reserved always and painted only on hover.** The ⠿ sits in every row
and holds its ~10px whether or not it is visible; only `visibility` changes. This is
the one place the user chose against the recommendation — which had been the field
lists' always-visible glyph — so the reflow a hover-conjured glyph would cause became
ours to prevent rather than to warn about. A glyph that *arrived* with the pointer
would re-ellipsise the summary under the hand about to grab the row, and reflow under
a moving pointer is the defect §2.14 spent a day removing from the foot. So the width
is paid always and the noise is not. A row that cannot be dragged — a store that is
not writable — holds the same space and never paints, so the two modes are the same
size.

**What it writes.** The collection's own array, through `update`, which is the one
read-modify-write there is (§2.5). Both ends are resolved **by key** against the
array that read returns, so what lands is a move of the *stored* list rather than of
the list that was on screen when the drag began. Which half of the row the pointer is
in decides which gap it lands in; below the last row is the append.

**An add still appends.** A hand-made order is never disturbed by collecting
something new. The alternative — new arrivals at the top once the list has been
touched — was declined: it makes the add path behave differently depending on hidden
state, and this section had already rejected newest-first for this list.

**THE LIST FREEZES WHILE A ROW IS HELD, AND THE REASON IS NOT WHAT IT FIRST LOOKED
LIKE.** `renderCollection` rebuilds its rows with `replaceChildren`; the ⚙ panel
moves its rows instead, which is why the field drag needs no freeze. So a render
landing mid-drag here would destroy the row under the pointer. The first draft of
this decision justified the freeze — and §2.14's *id, never an index* — with **another
tab writing the list**. The user took that apart in one sentence: *a person can only
use one tab at a time.* They cannot click in another tab, or on the page's `+`, while
holding a mouse button down in this one. **Nothing a hand does anywhere can land
mid-drag.**

What can is `runGapFill`: a timer and a fetch, needing nobody, filling in a summary
or marking a key unreadable. That changes the row signature, and the signature is
what calls `replaceChildren`. **That is the whole of the hazard, and it is in this
tab.** The freeze holds the list and deliberately does not update `itemSignature`, so
the render after `dragend` rebuilds from whatever storage holds by then. Nothing is
lost, only deferred — and because the store is re-read at drop time, a summary that
arrived mid-drag and a move made mid-drag **compose**, rather than one eating the
other. `boot-smoke` drives exactly that sequence.

The correction was written back into §2.14's own block, where the wrong reason
shipped. The design there does not change: an id costs the same as an index, and it
is now honestly a cheap handle rather than a defence.

**No keyboard path.** This is the fourth pointer-only drag in the drawer, and §6 item
4 is the limit it rests on. ↑↓ buttons were declined for the field lists in §4
decision 11 and are declined here for the same reason, with one extra cost named:
this is user data rather than a preference, so the case for a keyboard path is
stronger here than it was there. It is still refused, because granting it here alone
would say the limit had moved when it has not.

**Nothing scrolls the list during a drag, on purpose.** The field lists are eight rows
and always fit; a collection can be fifty, in a drawer whose floor is 300×215. The
platform auto-scrolls a scrollable box when a drag nears its edge, and whether it
does so *here* is **§7 step 39** — a measurement, not a decision. This is the same bet
decision 26 made about whether a field row could be dragged at the floor, which came
back working. If this one comes back not working, the answer is ours to write.

> **THE BET PAID, MEASURED 2026-08-25.** The user dragged a row toward the edge of a
> long list and held it there, and **the list scrolled**. So there is no auto-scroll
> to write, and the paragraph above is kept rather than replaced because the
> *standing* of a claim is what this document tracks: for a few hours this rested on
> an argument about what the platform does, and now it does not.
>
> **What it does NOT say.** It was not run at the drawer's 300×215 floor, which is
> the size where the scrollable area is smallest and the edge strips are closest
> together. That half stays a bet, and it is the half decision 26's equivalent was
> actually about. One browser, one instance, one person, one sitting.

**The drag out was measured in the same sitting**, and all three destinations took
it: a plain text editor, a rich editor or Slack/Teams, and the same row dragged again
after `Issue reference` was changed — which came out in the new shape. That last one
is the one worth having: it is the check that no second place decides what a
collected issue looks like, and it is the only way to see it from outside the
harness.

**What did not change.** The chips keep their most-recently-activated order (the
table above). There is no sort button: a sort would silently destroy a hand-made
order with no undo, which is the thing the two destructive controls in this section
are armed against. And a reorder needs no arming and no undo, because unlike a delete
it is undone by doing it again.

**One sentence of this paragraph was retired at 1.6.0.** It said *nothing can be added
by dropping a link into the drawer — that is §6 item 6*, and that was true for two
versions. **§2.9.3 builds it**: an issue dropped on a chip joins that collection, and
one dropped between two rows lands in that gap. What is still §6 item 6 is the rest of
that item — a pasted list of keys, a JQL result set, and merging two collections, which
§2.9.3 refuses by name.

**Copy and refresh** (`08` §5):

- **Four buttons at the foot of the collection section — 🔗 Links, 📃 Names, 🔑
  Keys, 🔍 Search — acting on the whole collection.** Three copy; the fourth opens
  Jira's issue search on the collection, in a new tab (§2.8). All four are disabled
  and dimmed while the collection is empty, the convention `jira-ux` already uses
  for the buttons that need a description — a copy of zero items must not write,
  and `key in ()` is not valid JQL, so one rule serves both kinds.
- **The refresh control is a ↻ in the collection's heading**, beside its name and
  count. An action on the named thing sits next to its name, and the foot row stays
  about getting data out. It must be findable: it is the only remedy for a stale
  title. Gap-fill is separate, automatic, and has no control of its own.

**THE TWO DESTRUCTIVE CONTROLS ARE ARMED BEFORE THEY FIRE. Added on 2026-08-18,
at the user's request, because emptying a collection meant clicking ✕ on every row
and deleting one was not possible at all.** §2.4 had designed the delete —
promoting the next collection, and emptying the last one instead of removing it —
and this section never gave it a control. Both gaps are closed together, because
they are the same gesture with different scope.

**Neither is a plain click.** The reason is this section's own argument for the
per-row ✕: *a mis-click on a whole row would delete something and there is no
undo*. These remove twelve items, or a whole named collection, so that argument
applies with more force, and the chip row is the narrowest and busiest part of the
drawer.

| The first click | The second click | Anything else |
| --- | --- | --- |
| **Arms it, and says what will happen.** ⌫ becomes `Empty 12?` and turns red; a chip turns red and its tooltip names what goes | **Commits.** There is no undo, and the wording says so before the click | **Disarms.** Another control, the drawer's dead space, a click back on the page, closing the drawer, or six seconds |

That is the same pre-click warning the floating button gives with its red `−` and
the live row gives on hover (§2.7), in the one shape a heading and a chip can
carry. **Only one control is ever armed**, so there is no pair of flags that can
disagree — principle 1. The six seconds is a chosen number, not a measured one,
the same standing as §2.7's hover grace period.

**An undo was considered and not chosen.** A single click plus *"12 items removed
— Undo"* is better on the common path, and it costs two things this design refuses:
per-session state holding the removed items, and a resurrection hazard, because
every write is a read-modify-write (§2.5) and an undo could put back items another
tab has since deleted. The two-step needs one boolean.

**The collection is the selection.** There is no multi-select and no per-row copy.
You curate the collection by adding and removing, then empty it into a paste. A
tick-box selection would be a second selection mechanism layered on the first, and
it would cost every row a checkbox in a drawer that is already narrow. `06`'s scope
matrix allows more; the Cart ships less, deliberately, and the cost is stated:
copying three of twenty items means removing the other seventeen first.

> **AMENDED 2026-08-25, and the amendment is to the words rather than the design.**
> *"No per-row copy"* was too broad, and it was too broad from the beginning: the
> key in every row is a real `<a href>`, and the platform let anyone drag one out
> into another application for four versions. That was per-row extraction, sitting
> there uncounted.
>
> **What this paragraph is actually refusing is a per-row copy CONTROL** — a
> ✕-sized `🔗` on every row, or tick boxes and a *Copy selected*. Both cost every row
> width in the narrowest list in the drawer, and both are the second selection
> mechanism the paragraph objects to. That refusal is unchanged.
>
> **A gesture costs a row nothing, and 1.4.0 made this one deliberate** (§2.9.1).
> Dragging a row out drops that issue into Slack, an editor or a note, in the same
> bytes the `🔗` writes. It was going to be lost when the whole row became draggable;
> the user pointed out that `setData` takes one payload per type, so it was restored
> and improved instead — the `Issue reference` shape rather than a bare URL.
>
> **The cost above still stands as written.** Copying three of twenty items is still
> removing the other seventeen, because a drag moves ONE row and there is no way to
> hold three.

**The two failure states have words** (`08` §6):

| State | In the row or drawer | On hover, or the whole sentence |
| --- | --- | --- |
| Cannot read this item | `(cannot read)`, muted | *Jira returned nothing for this key: it does not exist, or you do not have permission to see it.* |
| The write failed | ⚠️ on the badge, **and** a line at the top of the drawer | *This site's browser storage is full, so nothing new can be saved. Copy this collection out, then remove some items.* |

The first mirrors Atlassian's own message, which is required: the API conflates
absent and forbidden, so the UI may never claim deletion (§2.6). The short form
keeps a twenty-item list scannable and the honest full version is one hover away.

The second names a cause the user can act on, and it points at copy-out, which
still works because it only reads. A tooltip alone was rejected: an add that
silently did nothing is the outcome this rule exists to prevent.

**A ⚙ in the drawer's head opens a small preferences area.** The right-click switch
lives there, off by default, labelled by what it takes away: *"Right-click an issue
link opens the Cart's menu instead of the browser's"*. It is a settings home rather
than a loose checkbox, because more of these are coming — keyboard shortcuts are
still open — and because the two standing sections should hold nothing that is not
a link or an item (`08` §7).

**The area holds three switches, not one. Decided on 2026-08-18, by the build
session, because this section named two more preferences and gave neither a way to
be set.** The right-click switch is the one `08` specified. The other two are the
**layout** — `auto`, `stacked` or `split`, which this section calls "the user
pinning it" — and the **corner**, which this section says is bottom-right by
default while describing what the chrome does when the drawer is docked
bottom-left. Both were reachable only by hand-editing `gt-jira-cart.prefs`, which
is not a user interface. A preference no control can set is a preference that does
not exist, and it is worse than no preference: the code carries it, and the reader
believes it works. The cost is two rows in the ⚙ area.

**⚙ IS A SCREEN, NOT A STRIP, AND IT IS A MODE OVER THE TWO STANDING SECTIONS.
Added on 2026-08-25, for 1.2.0's configurable exports (decision 17).**

The area above was three checkboxes above the sections. The configurable exports
bring about **twenty-two** controls, and this drawer can be 300×215 with every
container on `overflow: clip` — so a panel sharing the box with the sections would
be **silently truncated, with no scrollbar to say so**. That is a measurement rather
than a preference, and it is the whole reason a strip became a screen.

So ⚙ now **replaces the drawer's body**. **"There are exactly two standing sections"
still stands**: this is a mode over them, not a third one, and §4's rejection of a
third drawer mode for scan results is untouched. What changed is that the body has
two occupants and only ever one of them at a time.

**The foot goes with the sections, and it costs one `hidden` rather than three**,
because the foot is a child of the collection section and the sections are children
of the body. One boolean moves all three, so the button's state cannot disagree with
what is on screen. It goes because six buttons and a border is about 40 pixels — a
fifth of the drawer at its 215px floor — and **none of them can act on anything
while the panel is up**. The accepted cost is one press to get back to a copy button.

**COLLECTING FROM THE PAGE KEEPS WORKING WHILE ⚙ IS UP** (decision 25, 2026-08-24).
What ⚙ replaces is the inside of the *drawer*; the floating `+` beside a hovered
issue link is a different element on the page, and `renderToggle` reads only the
hovered anchor and the active collection. So the gesture, the badge count, the
right-click entry and the page decoration all keep working, and **an add while the
panel is up lands without closing it**. That holds because the panel is a pure
function of the in-memory `prefsOpen` flag and because `render` only ever *sets* the
panel — it never rebuilds it, which is what will also let a field-list drag survive
a re-render it did not ask for.

**What is NOT available while ⚙ is up, stated as the accepted cost rather than left
to be found:** the live list, the collection list and all six foot buttons. An item
added from the page while the panel is up lands, and **you see it in the badge
rather than in the drawer**.

**`prefsOpen` STAYS IN MEMORY, deliberately against this section's own precedent for
`open`.** A reload landing you in Settings would be wrong, because Settings is not
where you work. It is not an inconsistency waiting to be tidied away. ✕ does not
touch it either, so re-opening the drawer *within the same sitting* comes back to
the settings — which follows from ✕ having exactly one meaning, below.

**✕ KEEPS EXACTLY ONE MEANING ON BOTH SCREENS: close the drawer.** A ✕ that
sometimes went back instead is two values that disagree wearing a different hat, and
it would leave no way to close the Cart from the settings screen at all.

**THE HEAD READS `⚙ Settings` WHILE THE PANEL IS UP, and `🛒 Cart` once it is down.
Decided by the user on 2026-08-24** (decision 24). The repository's convention wins
over the argument for identity: **the label IS the state** (§2.14, §3). Against it
was that a head is the drawer's identity, and `jira-ux-improvements`' toolbar does
not rename itself when its padlock is on. **The cost:** while the panel is up the
drawer stops naming the collection you are collecting into — the collection's own
heading is inside the body ⚙ replaced. **The badge still names it**, which is what
makes that acceptable.

**THE PANEL IS TABS, AND THERE ARE THREE OF THEM: `Appearance` · `📋 Details` ·
`📊 Report`, with `Issue reference` pinned above the bar. Decided by the user on
2026-08-24** (decisions 18 and 29). Three layouts were prototyped before tabs won —
one long scroll, and collapsible groups with a remembered open set, which was chosen
and then reversed by use (§4).

| Structure | Where `Issue reference` goes | Why not |
| --- | --- | --- |
| Two — `Appearance` · `Exports` | Inside `Exports` | The cleaner split by kind, and it costs one scroller of about 22 rows holding two near-identical field lists, which invites editing the wrong one |
| **Three — CHOSEN** | **Pinned above the tab bar** | — |
| Four — `🔗 Line` · `📋 Details` · `📊 Report` · `⚙ Look` | Its own tab | Four labels inside a 300px bar, plus a `🔗 Line` tab that owns a setting governing all three exports |

Three is the only structure where the shared setting is not misfiled: `Issue
reference` governs all three exports, so a tab that owned it would tell a small lie
about its scope. It also keeps each export tab to one group of about ten rows. **The
cost is real: `Appearance` sits as a peer of two export tabs, which is not a clean
taxonomy.**

> **`Appearance` HOLDS FOUR CONTROLS SINCE 1.3.0, not three.** The copy button's
> switch joined the two checkboxes and the two dropdowns, and it went **above** the
> right-click row — the one place on that tab where the order was chosen rather than
> inherited. The reason: this switch is on for everybody and the one below it is off
> for everybody, so the tab reads from the mild control to the expensive one. Nothing
> about the structure above changed, and the taxonomy cost recorded in §6 item 17 is
> unchanged: a switch about a gesture on the page is an appearance setting, which is
> what the right-click row above it already was.

**The last tab is a stored preference** (decision 19), on this section's own
precedent for `open`: a reload is not the end of a sitting. **An unrecognised id
falls back to the first tab, never a blank screen** (decision 20), exactly as
`layout` and `corner` already do. **Tabs need no open/closed set** — a bar shows
every tab whether it has ever been pressed or not, so a tab added later is visible
the moment it exists. That is the whole difference from the collapsible layout, and
it is why **a new tab arrives visible where a new field arrives off** (decision 21):
a tab appearing changes nothing about what a button emits.

**A group heading appears only where a tab holds more than one group.** With exactly
one, the heading would repeat the tab label immediately below it. The pinned group
keeps its heading because it is not under a tab.

**EACH EXPORT TAB HOLDS ONE FIELD LIST: eight rows, each a grip, a checkbox and a
name, in the order the preference stores them** (§2.14, landed 2026-08-25). Every
catalogue field has a row whether it is ticked or not — off is not absent, so a field
is always findable and one click turns it on. A row on the 📊 Report tab that is also
one of its headings is marked `also a heading`, which is a statement and not a veto.

**THE PANEL ONLY EVER SETS, AND THE FIELD LISTS ARE WHERE THAT RULE EARNS ITS KEEP.**
The rows are built once and REORDERED rather than rebuilt, so no row is ever
destroyed. Two things depend on it: a rebuilt row would take the focus off the box
you are clicking, and it would pull the floor out from under a drag already in
flight — which is reachable, because an add made from the page keeps working while
⚙ is up (decision 25) and every add calls `render`. **The order on screen is compared
against the order on screen**, not against a remembered signature, so there is no
variable to reset when `ensureDrawer` builds a fresh drawer (principle 1).

**AND THE DRAG CARRIES AN ID, NEVER AN INDEX**, which is the other half of surviving
a re-render it did not ask for: by the time the pointer comes up, the row under it
may sit at a different index than it did at `dragstart` — this tab's add, or another
tab writing this very list. Both ends are resolved against the stored list at drop
time, so a stale index cannot exist because none was kept. That is also why the drag
needs no entry in the `dragging` guard: unlike the grip and the divider it owns no
property that `render` puts back (§2.10, §2.11 defect 4).

**`↺ Restore export defaults` reaches the export settings and nothing else**
(decision 22): the line shape, both field lists, both bands. **Not the appearance
switches** — the remembered size is in the same key, and a dragged size is only
recoverable by dragging the grip again (risk 10), so a "restore" that silently
resized the drawer would be the worst kind of surprise. **And not which tab you are
on**, because being thrown to another tab for resetting a field list is a second
change nobody asked for. It **confirms in place**, `↺ Restore export defaults` →
`Restore?`, by the same convention `⌫` uses (§3), and it shows **on the tabs that
hold export settings and nowhere else** — on the appearance tab it is an offer to
reset something you are not looking at.

**THE THREE ARMED CONTROLS ARE NOW ONE VARIABLE.** The restore is the third, and a
boolean beside a nullable id beside a third flag is the shape principle 1 exists to
delete. One value holds `null`, `"empty"`, `"restore"` or a collection's id, and a
collection id is a `crypto.randomUUID()`, so neither word can collide with one.

**THE ⚙ SAYS WHETHER THE SETTINGS ARE OPEN, AND THAT LANDED EARLY — on 2026-08-25,
from use, ahead of the ticket that was going to build it.** It was reported as bad
UX and it was: the button appeared "bordered in blue after clicking", the blue
arrived **whether the click had opened the settings or closed them**, and a click
anywhere else took it away.

**The diagnosis is the part worth keeping, because the symptom named the wrong
thing.** That blue was the **focus ring**, not a state. `prefsOpen` lived in memory
and *nothing on screen was a function of it* — the ⚙ carried no state at all, so a
focus indicator was the only thing that ever changed on it. This is §2.8's rule
about labels applied to an attribute, and the ⚙ was the one control in the drawer
that broke it. It is the same class of finding as §2.14's label ladder: **a control
that reports its own state**.

- **One constant, `PREFS_STATE_ATTR`, interpolated into both** the `setAttribute` in
  `render` and the stylesheet's selector. Two literals are two values that can
  disagree, and they disagree *silently* — the attribute keeps flipping while the
  paint stops following it, which is exactly how the ⚙ was inert for two versions
  (§2.11). It reads **`aria-pressed`** since ⚙ became a mode: the panel is no longer
  a region beside the content, it *is* the content, so this is a toggle rather than
  a disclosure, and the `aria-controls` that named the region went with the rename.
- **The active collection chip's three declarations**, not a new blue. That token
  pair is already the Cart's word for "this one is on", and `jira-ux`'s locked
  padlock uses it too. The selected tab now wears it as well. Each selector is
  repeated with `:hover`, because the plain hover rule is (1,3,2) and would
  otherwise make an open gear — or the tab you are on — go quiet under the pointer.
- **The glyph is 16px in a 22px box, and the box may not grow** (decision 30). A
  beta tester on 1.1.0 did not find the button at all: 13px of grey pictograph in a
  transparent box, beside a ✕. The head's height is that 22px plus its own padding
  and border, and `css-smoke` derives the 215px floor from a 35px head, so a taller
  button re-derives `MIN_BLOCK` (§2.11 rule 7). **If the button is still missed now
  that it also carries a pressed state, a `⚙ Settings` label is the next thing to
  try**, and appendix A.9's `■` finding is the argument for it.
- **The drawer clears `:focus` and puts its own ring back on `:focus-visible`.** The
  Cart is not in a shadow root, so Atlassian's stylesheet has every right to paint a
  focused button inside it — and a host rule on `:focus` paints on a **mouse** click,
  where the Cart's own ring deliberately does not. The reset stays scoped to the
  drawer so the badge and the floating toggle keep their rings, and every ring inside
  the drawer must strictly out-specify it or a keyboard user loses their place.

**The drawer's own numbers, all chosen by the build session on 2026-08-18 and none
of them measured.** The default is **380 by 520 pixels**, with the height capped at
`70vh` until a drag lifts the cap (§2.11). 380 is the width this section already
reasons about when it says a drawer that narrow cannot show a Jira title. The
drawer sits **3.5rem from the bottom edge**, which clears the badge, and 1rem from
its own side. The divider travels between **20% and 85%**, so that neither section
can be collapsed past the point where its own divider is still grabbable.

**The minimum is 300 by 215. The height was 160 until 1.0.0, and it is now
DERIVED rather than chosen** — it is the shortest drawer in which neither section's
fixed parts are clipped. Risk 10 has the arithmetic and §2.11 rule 7 has the
other half of the fix. The width is still a chosen floor.

**An empty name is not a name.** Creating with an empty field does nothing and
keeps the focus. Renaming to an empty string cancels, and the previous name
stands. Neither writes. The reason is principle 4: the safe default is what
remains, and a nameless collection would leave the badge reading `🛒  7 ▾`.

**Theming is the Atlassian `--ds-*` design tokens with standard-colour fallbacks**,
the way both other scripts do it, so light and dark work without the script asking
which theme is active.

**One more thing the prototype needed and the real script needs too:** the
new-collection input must stop `keydown`, `keypress` and `keyup` from propagating.
Jira binds plenty of bare keys, and a keystroke that opened Jira's quick-search
while you were naming a collection would be diagnosed as our bug.

### 2.9.2 The collection drags out — 1.5.0, 2026-08-26

**Asked for by the user, and it is §2.9.1 applied to the whole list.** The item drag
made one issue draggable into Teams, Notepad and an editor. The same want at
collection scope is *🔗 Links without the clipboard*: drop the whole collection
where the paste was going to go. Two extra targets came with the ask — the
browser's **tab strip**, to open every issue, and its **bookmarks bar**, to keep
them.

**Everything below the design was measured on 2026-08-26 in a rig, before any of it
was written.** Appendix A.10 has the readings. Two of the four targets came back
differently from the design, and one paragraph of §2.9.1 came back wrong. The rig is
`test/jira-cart/drag-test.html` and it is committed for the reason the paste rig is:
these are questions about browser chrome, and no unit test can reach them.

#### Two grabs, not one

| Grab | What leaves |
| --- | --- |
| The collection heading | The active collection |
| Any chip | That chip's collection, active or not |

**The chips are the half that earns its keep.** They export a collection *without
activating it*, which nothing else in the drawer can do. The heading is the obvious
grab and the chips are the useful one.

**The 🔗 Links button was offered as the grab and refused by the user as
counter-intuitive.** It had one argument going for it — the foot row is where
getting-data-out lives, so the drag would have sat beside the press whose bytes it
sends. Against it: nobody expects a button to be draggable. The user is right that
a button is a thing you press.

**The heading is not draggable while a rename is open.** Clicking the name swaps it
for an input. If the heading stayed draggable, dragging across that input's text
would start a collection drag instead of selecting the text — the same trap
`draggable="false"` on the key link was added to avoid in §2.9.1, arriving from the
other direction.

**A chip dropped anywhere inside the drawer does nothing.** Merging collections is
§6 item 6. A grab that exports when you drop it outside and reorders when you drop
it inside is two gestures behind one hand, and collections have no user-set order to
reorder — activating one moves it to index 0, which is the only ordering there is.

> **STILL TRUE AT 1.6.0, AND NOW IT TAKES CODE TO KEEP IT TRUE.** §2.9.3 makes the
> chips and the item list drop targets, and a chip drag carries N issue URLs — so
> without a way to recognise our own collection drag, a chip dropped on a chip would
> look exactly like dropping N links and would merge the two. The marker this section
> designed and declined to build is what refuses it; see the amendment below.

#### What it sends

**The 🔗 Links bytes at collection scope, and nothing else.** Three types, the same
call, the same `Issue reference` setting:

| Type | What it carries |
| --- | --- |
| `text/plain` | The markdown bulleted list — `formatLinks` at collection scope |
| `text/html` | Its `<ul>` twin |
| `text/uri-list` | One issue URL per line |

**No internal type — REVERSED AT 1.6.0, and the reason it was declined is exactly the
reason it came back.** It was declined because *the collection drag has no drop target
of its own, so there is nothing for a marker to tell apart*. §2.9.3 gave the drawer two
drop targets, so there is now something to tell apart, and the marker
`application/x-gt-cart-collection` is written. Its **value is the collection's id and
nothing reads it**: the type is the whole message. The four external targets are
unaffected and needed no re-measurement — the rig's ship candidate carried this exact
type through all of them on 2026-08-26 (appendix A.10, box A).

**`effectAllowed` is `copy`, not `copyMove`.** §2.9.1 needs `copyMove` because that
drag is also the reorder. This one only ever leaves.

**NO COLLECTION NAME IN THE BYTES, and the user drew this line himself.** Asked
whether a dropped collection should say which collection it is, the answer was: not
in an editor, but yes as a bookmarks folder name. The first half keeps the rule
§2.9.1 was built on — one collection leaving the Cart has one shape wherever it
leaves from, so the drag and the press stay byte-identical and `format-smoke` still
covers both with one set of literals. The second half turned out to be impossible;
see below. So the bytes carry no title, and the cost is real and accepted: three
collections dropped into Teams are three lists that look alike.

#### Where it works, all measured

| Target | What arrives |
| --- | --- |
| Teams | The `<ul>`, as a list of live links |
| Notepad | The markdown list |
| A Jira comment or description | The markdown list. **See the finding below — this was not known** |
| The tab strip | **One tab per issue.** Four issues, four tabs |
| A tab group you already made | All the tabs, **inside that group** |

**THE TAB GROUP JOINS, IT DOES NOT GET CREATED.** Chromium takes the group for a
dropped URL from the tab that was under the pointer. There is no way for a page to
ask for a new group, named or otherwise. So the workflow is: make the group once,
name it what you like, and drop the collection into it. The user accepted this
trade knowingly, and it is the same trade the bookmarks bar could not offer.

**No cap on how many URLs go out.** Fifty items dropped on the tab strip opens fifty
tabs. The count sits in the heading you are about to grab, so it is not a surprise,
and a cap would make the drag mean something different from the press at exactly the
moment the whole collection was asked for. §2.8's own rule against silent
truncation says the same thing from the other side.

#### Where it does not work: the bookmarks bar

**The ask was a folder named after the collection. It cannot be done from a
userscript, on three independent grounds, two of them measured.**

1. **No folder, ever.** Chromium's bookmark drop branches on one flag per dropped
   element: a URL becomes a bookmark, a *folder* becomes a folder and recurses.
   Nothing wraps a set of URLs in a new folder. Handing over a folder would mean
   writing Chromium's private bookmark format, which a page cannot do — an
   unrecognised `setData` type lands in a blob the bookmarks bar never reads, and
   the real payload is a serialised pickle of node ids and profile paths.
   `text/html` does not help: that bar accepts plain URLs and its private format
   and nothing else.
2. **One URL, not N.** Measured. The bar takes the **first** line of the URL list
   and ignores the rest — dropped on the bar, and dropped onto a folder made by
   hand, both give one bookmark.
3. **No name.** Measured. The bookmark is created with no title. This is not a
   multi-URL artefact: the single-URL control did the same, and our `text/html`
   anchor text did not supply one either.

**The same drag gave four tabs and one bookmark, which is the useful part of the
finding.** The payload crossed to Windows intact. The two Chromium call sites simply
differ — the tab strip asks for a URL *list*, the bookmarks bar reads a single URL
and title. **So no change to what we send can fix this**, and no future session
should spend a day trying. A `DownloadURL` payload handing over a Netscape bookmarks
file was considered and declined: it names the folder `Imported` rather than the
collection, needs a File → Import afterwards so it is not a drop at all, is
Chromium-only, and is a second payload shape to build and check.

**What ships for the bookmarks bar is therefore nothing, and one documented wart.**
Dropping a collection there does not fail visibly — it silently creates one unnamed
bookmark of the **first issue**, which looks like it might be the collection. We
cannot intercept browser chrome, so this is recorded rather than prevented.

**THE 1.4.0 ITEM DRAG HAS THE SAME WART AND THIS SECTION IS WHERE IT IS FIRST
WRITTEN DOWN.** A single item dropped on the bookmarks bar has always produced an
unnamed bookmark. §2.9.1 says the row is "a link on the way out" and it is, but the
link has no label. Nobody had looked.

#### The blocking code that was designed and not built

**A document-level handler that swallowed our own drags was designed, chosen by the
user, and then dropped on the evidence — in that order.** It is recorded because the
reasoning is the useful part, and because a future session will have the same idea.

**What it was for.** §2.9.1 accepted a named cost: a mis-drop onto the Jira page
lets the browser navigate the tab to that issue, losing the page the live list
mirrors. A collection drag makes that journey much longer — the heading is at the
top of the drawer, the chips near the bottom, and both the tab strip and the
bookmarks bar are at the top of the window, so every one of these drags crosses the
whole page carrying live links.

**How it would have worked, and this part is worth keeping.** `getData` is
unreadable during `dragover`, which is why §2.9.1's reorder reads a variable — but
**`dataTransfer.types` IS readable there**, measured. So the check needed no module
flag: look for our own type in `types` and swallow. Stateless, and therefore unable
to get stuck armed and start eating Jira's own board drags, which a flag cleared on
`dragend` could have done.

> **THIS PARAGRAPH IS WHY 1.6.0 WAS CHEAP, and it is the argument for writing down
> designs that are not built.** §2.9.3 needed precisely this mechanism — recognise our
> own drag during `dragover`, statelessly — for a different purpose: to REFUSE a
> collection dropped on a chip rather than to swallow a drop on the page. The
> measurement behind it was already taken and the reasoning was already written, so the
> refusal was one string and one `if`. The swallow itself is still not built, for the
> reasons below, and those are unchanged.

**Why it is not built. Two measurements, one on each side of the trade.**

- **The harm is smaller than §2.9.1 wrote.** A stray link drop on page content
  **opens a new tab**. It does not navigate the current one. Measured twice, with
  one URL and with four. The page you were collecting from survives, so the cost is
  a tab you close.
- **The price was a working capability.** Dragging an item row into a Jira comment
  or description **works today** and inserts the link in the shape the `Issue
  reference` setting names. A handler that swallowed drops on the Jira page would
  have taken that away — from the item drag as well, since it covers both.

So the collection drag inherits §2.9.1's original judgement unchanged rather than
reversing it: **this is the browser's to prevent and not ours.** And it gains a
target nobody planned — a collection dropped into a Jira description arrives as the
markdown bulleted list.

#### It corrects a paragraph §2.9.1 has carried since 1.4.0

§2.9.1 says a mis-drop lets "the browser's own answer to that" be *navigate the tab
to the issue — losing the page the live list is mirroring*. **That is wrong, and now
measured wrong: a new tab opens instead.** The claim survived 1.4.0 because the one
run that looked at it saw nothing happen at all, which was read narrowly and
correctly as *unobserved* rather than *retired*. What was never tested was the
hazard's **shape**. It is a nuisance, not a loss, and §2.9.1's paragraph is amended
in place rather than deleted, because the reasoning that accepted it was sound on
the information it had.

#### What never drags

- **An empty collection.** `format` returns null on zero items rather than write
  nothing, and a drag carrying no payload is a gesture that fails in silence.
- **📋 Details and 📊 Report.** Their rows are fetched per press and never stored,
  so a drag would carry either nothing or whatever happened to be armed — a payload
  that depends on hidden state. §2.14's "nothing fetched is ever stored" is the
  same rule from the other end.
- **The live list.** It mirrors the page and is not a collection. A separate feature
  if it is ever wanted.
  **IT WAS WANTED, AND IT SHIPPED AT 1.6.0 — §2.9.3.** Every live row drags now, and
  the sentence above is superseded rather than wrong: what it refused was a live row
  dragging *a collection's worth of anything*, and what 1.6.0 added is a live row
  dragging **one issue**, which is what the row is. It is the only draggable thing in
  the drawer with no state that turns it off, because it is the only one whose gesture
  cannot write.
- **A read-only store still drags, and this is the one asymmetry with §2.9.1.** Item
  rows are draggable only when the store is writable, because that drag *writes*.
  This one only reads, so a collection written by a newer version of the Cart keeps
  its export. Refusing it would withhold the one operation that is still safe.

#### The hint, and why the chips do not get one

The drawer has a settled way of saying *this drags*: the whole element is the
target, `cursor: grab`, `user-select: none`, and an `aria-hidden` `⠿` whose width is
**reserved always** and only painted on hover — so nothing reflows under a hand that
is already reaching. The field rows and the item rows both wear it.

**The heading gets all of it. The chips get the cursor and a longer tooltip and no
glyph.** A chip is a tight pill whose name is the one thing in the drawer that
ellipsises, and a reserved glyph would take that width from every chip on every
install, wrapping the chip row one collection sooner. Painting the glyph on hover
*without* reserving its width was considered and refused: it grows the element under
a pointer that is about to press it, which is the reflow-under-the-hand defect
§2.14 spent a day removing from the foot row, and the reason the item grip reserves
its space in the first place.

**So one gesture has two affordances, and that is a real inconsistency accepted with
its reason.** The alternative was shorter chip names for everyone, for ever.

#### What this hands to ticket 04

**Two of the user's four asks need a browser extension and nothing else will do
them.** A bookmark folder named after the collection, and a tab group named after
it, are both one call away in `chrome.bookmarks` and `chrome.tabGroups`, and
unreachable from any page.

Ticket 04 settled *userscript, unconditionally*, and named exactly one thing that
would reopen it: wanting Cart UI when no Jira tab is focused. **This is a second,
and it is the first concrete want the Cart has produced that only a manifest
serves.** It does not reopen the decision on its own — the trade the user took
instead (make the folder or the group by hand, then drop into it) is good enough,
and the rest of the feature is fully served by a userscript. It is recorded so that
the trip-wire table has two rows rather than one, and so that a third want of this
shape is recognised as a pattern rather than met as a surprise.

### 2.9.3 Adding by drop — 1.6.0, 2026-08-26

**Asked for by the user, and it is the first drag that goes INTO the Cart.** Every
drag before it took something out: the items reorder (§2.9.1), the item leaves as a
link, the collection leaves as a list (§2.9.2). This one puts an issue *in*, and it
puts it in a collection you are not working in.

**The ask was three gestures and they turned out to be one feature.** Drag a row of
the live list onto a collection's chip; drag a row of the collection onto another
collection's chip; drag an issue link off the Jira page into the drawer. What makes
them one feature is that **all three hand over the same payload** — a `text/uri-list`
of this instance's `/browse/` URLs. The page's anchors do it because the platform does
it for every link drag, and our two row kinds do it because §2.9.1 chose to be a real
link drag. So the drop side reads a URL list and knows nothing about where it came
from, and `keysFromUriList` is the whole parser.

#### Three sources, two targets

| Source | What it hands over | Can it be moved out of? |
| --- | --- | --- |
| A row of `On this page` | That issue. **New at 1.6.0** — the live list had no drag at all | No. The live list mirrors the page (§2.3); there is nothing in it to take away |
| A row of the active collection | That issue, unchanged from §2.9.1 | **Yes.** It is the only source a move can empty |
| Any issue link Jira drew on the page | That issue, from the platform's own link drag | No |

| Target | Where the issue lands |
| --- | --- |
| A collection **chip** | At the **end** of that collection. The chip's collection does **not** become active |
| The **item list** | In the gap the pointer is in — above or below the row under it, exactly as the reorder decides. Below the last row, or anywhere in an empty list, means the end |

**Filing without switching is the whole point**, and it is the same property §2.9.2
gave the chip's drag *out*: a chip is the only thing in the drawer that acts on a
collection without making it the one an add goes into.

#### Move, unless Ctrl is held

**The user's decision, taken over copy-always and over move-only.** A row dragged out
of the collection onto another collection's chip **leaves the one and joins the
other**. Hold **Ctrl on the drop** and it is copied instead.

The workflow that decided it: collect into `Scratch` while you browse, then file each
item onto the collection it belongs to, and **`Scratch` empties itself as you go**. A
copy would leave twelve rows behind after filing twelve items, and the only way to
clear them would be ⌫ and hoping you had filed them all.

**A live row and a page link never move anything**, so Ctrl changes nothing for them.
There is nothing there to take away.

**THE COST, AND IT IS THE SHARPEST THING IN THIS SECTION.** This is the **first
destructive control in the drawer that cannot arm itself before it acts**. §2.9's two
destructive controls both warn first — ⌫ becomes `Empty 3?`, the chip's ✕ turns red
and says what the second click removes — and a drop has no second click to warn in.
The only undo is dragging it back.

**Three things reduce it and none of them removes it.** The cursor says `move` before
the release, which is the platform's own vocabulary and is visible while it can still
be changed. Nothing is destroyed: the item is somewhere else, named on the chip you
dropped it on, and its summary went with it. And the modifier is offered on the drop
rather than on the grab, so the decision is made at the moment there is something to
decide about.

**Ctrl is undiscoverable, and that is accepted with its reason.** Nobody finds a
modifier without being told, so the tooltips tell them: the item row's says the drag
MOVES and that Ctrl copies, and the chip's says the same from the other end. That is
documentation and not discovery, and it is the price of having both gestures behind
one hand. The alternative offered was copy-always, and the user chose against it.

#### A drop makes the end state true, and that is the whole duplicate rule

There is no separate rule for dropping something the target already holds. **After a
drop the issue is in the target; after a move it is also out of the source.** So:

| Case | What happens |
| --- | --- |
| The target does not hold it | It is added. A move also removes it from the source |
| The target already holds it | **Nothing is added, and nothing is duplicated.** A move still removes it from the source, because that is the end state a successful move would have reached |
| A row dropped on its **own** collection's chip | Nothing at all. It is already there and there is nothing to move it out of |
| An issue already in the list, dropped into a gap in that list | It **moves** to that gap. The drop said *put it here* |

**The second row is the one worth reading twice.** Filing something that was already
filed removes it from `Scratch` and the target's count does not change, which looks
like a deletion and is not one. It is the same end state, reached from a different
start, and a special case that refused it would leave the item in `Scratch` for ever
with nothing on screen to say why.

#### What is refused, and every refusal is visible

A refusal is a `dragover` that does not call `preventDefault`, so **the platform's own
cursor says no and `drop` never fires**. That is deliberate over a silent no-op — the
same argument §2.14's field lists make about a drop from one list into the other.

1. **A collection**, from the heading or from a chip. That is **merging collections**,
   which is §6 item 6 and is not built. §2.9.2 already said a chip dropped inside the
   drawer does nothing; this is that rule holding now that there is something for it
   to land on.
2. **Anything with no `text/uri-list`.** A dragged paragraph that happens to spell a
   key is not a link. §2.1's decision — *a key typed as plain text is invisible to the
   Cart* — is not overturned by a gesture, and the `text/plain` fallback below goes
   through the same parser, so it cannot become a back door into it.
3. **A URL from another origin**, including another Atlassian site. `issueUrl` rebuilds
   every link from `location.origin`, so a foreign host accepted here would be
   silently retargeted at this instance and stored as a key that means nothing on it.
   **This one is refused at the drop and not at the drag**, because `types` cannot see
   a host — so the cursor offers it and then nothing is written. Named as a wart rather
   than hidden.
4. **Every drop, on a read-only store.** Adding writes. §2.9.2's asymmetry applies in
   the other direction here: a live row still drags **out** of a store this build must
   not write, because that gesture only reads.
5. **The live list, the collection heading, the chip gaps and the foot.** A drop on the
   live list could only mean *remove*, which is a write nobody asked for. The two
   targets that accept are the two the feature was asked for.

**The refusals are decided at the `dragover` AND re-checked at the `drop`. This
paragraph said the opposite for one day and was wrong; the user's report of 2026-08-26
is what found it.**

*What it said:* a `drop` fires only because our own `dragover` accepted, so re-checking
would defend a state nobody can reach — and §2.9.1's test for a mid-gesture hazard
(what can write with no hand on it?) said nothing can change the answer while a mouse
button is held down.

**The second half of that is still true and the first half is false.** `dragover` fires
at the element under the pointer and **bubbles**. If any *ancestor* listener calls
`preventDefault`, the drop is allowed — and the `drop` that follows is dispatched at the
element under the pointer, which is ours, and reaches our listener. The hazard was never
a race; it was a **second acceptor above us**, and there is one: **Jira's own board and
backlog drag-and-drop listens above the drawer**, because the drawer is in `<body>` and
its events bubble to `document` whatever `#jira-frontend` does. Risk 22 records it.

**So both drop handlers re-read exactly what their `dragover` decided, and return
without `preventDefault` when it says no.** A drop we refused is left to whoever
accepted it. A drawer that consumed gestures never aimed at it would be worse than one
that ignores them — and this is the same rule §2.9.2 applied when it refused to swallow
drops on the Jira page: **our refusals may not take away anything that already works.**

**Past that line the `preventDefault` is unconditional, and that is the other half.** We
accepted, so we consume — including when the payload turns out to hold nothing usable,
which is exactly what refusal 3 produces. Handing *that* drop back would open a tab on
an issue nobody asked to open.

> **The general lesson, because it has now cost two paragraphs in this file.** *A guard
> against an unreachable state teaches the next reader that the state exists* is a good
> rule and it was applied to the wrong question. The state here was reachable; what was
> unreachable was the *mechanism I had in mind* for reaching it. Before deleting a
> guard, enumerate what could produce the state **other than** the hazard you first
> thought of — for a DOM event, that list always includes *an ancestor did it*.

**The reorder is left exactly as it shipped.** Releasing a reorder on the empty space
below the list has done nothing since 1.4.0, and it still does. Only the *add* treats
"no row under the pointer" as the end of the list. Changing a shipped gesture in the
same version that adds one beside it is how a regression gets attributed to the wrong
feature.

#### The marker §2.9.2 designed, declined, and now needs

§2.9.2 designed an internal type on the collection drag — `application/x-gt-cart-collection`
— and did not build it, on the ground that **nothing read it**: the collection drag had
no drop target, so there was nothing that needed to tell our own drag from anybody
else's.

**It has a reader now, and it is refusal 1.** A chip drag carries N issue URLs, so to a
target that adds issues from a URL list, a chip dropped on a chip is *indistinguishable
from dropping N links* — and it would merge two collections, silently, with no undo.

Three things make this cheap. `dataTransfer.types` **is** readable during `dragover`
while `getData` is not, which appendix A.10 measured — so the check needs no module
flag and cannot get stuck armed and start eating Jira's own board drags. The value is
the collection's id and **nothing reads it**; the type is the entire message. And it
needs **no new measurement**: the rig's ship candidate carried this exact type through
all four external targets on 2026-08-26, so what Teams and the tab strip do with it is
already known, which is nothing.

**What is still not built is the document-level swallow**, and §2.9.2's reckoning
stands unchanged: a stray drop on the Jira page opens a **new tab** rather than
navigating, measured, and blocking it would take away dragging a row into a Jira
comment, which works. This feature makes the journey no longer than 1.5.0's already
was.

#### What the live list gains, and the one thing it gives up

**§2.9.2 said the live list never drags** — *"it mirrors the page and is not a
collection. A separate feature if it is ever wanted."* It was wanted. This is that
feature, and the sentence in §2.9.2 is superseded rather than wrong.

The rows wear the drawer's settled way of saying *this drags*: the whole row is the
target, `cursor: grab`, `user-select: none`, and an `aria-hidden` `⠿` whose width is
**reserved always** and painted only on hover. The key link opts out of its own drag so
the platform walks up to the row — §2.9.1's `draggable="false"`, arriving in the other
list.

**It is draggable unconditionally, which nothing else in the drawer is.** The heading
stops for an open rename and for an empty collection; the item rows stop for a
read-only store; a chip stops when its collection is empty. A live row has none of
those states: it is a link to an issue whether the issue is collected or not, and a
drag that only reads is safe on a store this build must not write. **Every refusal
lives in the drop.**

**What it gives up is selecting a summary with the mouse**, to the `user-select: none`
the drag needs. §2.9.1 paid that in the other list for the same reason and it is the
same trade.

**What it takes over is the key link's native drag**, which was the only drag this list
had. That is a gain, not a loss: the platform handed over a bare URL, and
`writeDragPayload` hands over the **`Issue reference` shape** with a rich flavour
beside it — §2.9.1's finding, applied to the second list. One issue leaving the Cart
still has one shape wherever it leaves from.

#### No internal type on a live row, and no freeze anywhere

**A live row carries no marker.** What a drop target needs to know is *is this row ours
to take away*, and only §2.9.1's rows answer yes. To both targets a live row is exactly
what a link off the page is — which is the truth and not a simplification, because the
row **is** a link off the page, drawn by us.

**Nothing freezes, and the test is §2.9.1's own: what can write with no hand on it?**
`runGapFill`, a timer and a fetch. It writes summaries and marks keys unreadable. It
cannot change which collection a chip is for — activating one takes a click, and a hand
holding a mouse button down is not clicking — and both drop targets resolve **by key
and by id at drop time**, against what storage holds then. So a rebuild under the
pointer costs a repainted indicator and nothing else. §2.9.1's reorder freezes because
it would lose the row it is *carrying*; these drags carry nothing of ours.

**`dragleave` is new, and it is needed because the source may not be ours.** §2.9.1
clears its indicator on `dragend`, which reaches it because the dragged row is its own.
A page link's `dragend` fires on Jira's anchor and never comes to us, so without a
`dragleave` a pointer that crossed a drop target and released elsewhere would leave one
painted. It is guarded on `relatedTarget` — the element being *entered* — so a crossing
from one chip to the next is not a leave, and the indicator does not flicker under a
hand that is aiming.

#### One `update` for both halves of a move

A move is a removal from one collection and an add to another, and they are **one
read-modify-write** (§2.5). Two writes would leave a window in which the item is in
neither collection, and the second of the two is the one that could fail.

**A move's source is always the active collection**, so nothing has to be told where
the item came from: the only row that can be dragged is one the drawer is showing, and
the drawer shows `collections[0]` (§2.4).

**The item is carried whole.** A move keeps the summary the source captured rather than
going back to the page for it — the page a collected issue came from may not be the page
you are on. A key the source does not hold is a live row or a link off the page, and
that one is read where `toggleKey` reads it: the last scan's representative anchor, and
a bare key if there is none, which is a valid item that gap-fill completes (§2.6,
rule 1). `readItemSummary` and `itemFor` are now the one place that decides what a new
item looks like, and the floating `+` goes through them too.

#### Where the affordance is, and what it costs

| Thing | What it shows |
| --- | --- |
| A live row, an item row | `cursor: grab`, and a `⠿` whose width is reserved and paint appears on hover |
| A chip being aimed at | A 2px **outline** in the drawer's one "this is the one" colour |
| The item list's gap | The row's own border edge, above or below — §2.9.1's indicator, unchanged |
| An **empty** collection's list | A dashed outline on the list itself, because an empty list still has exactly one gap |

**The chip's ring is an `outline` and not its border colour**, and that is forced: a
chip's 1px border already carries two meanings — active paints it, armed paints it — so
a third on the same declaration would be three states fighting over one edge. An
outline is a separate channel and takes no space, so it cannot wrap the chip row at the
moment a pointer arrives. That is the reflow-under-the-hand defect this chip refused a
grip glyph over (§2.9.2).

#### Where a page drag has to start, and it is the KEY

**Measured in use on 2026-08-26. Jira makes a real link out of the issue key only.** The
summary beside it is clickable — Jira's own handler opens the issue — but it is **not an
anchor**. So a drag off the page has to be started **on the key**. Starting it on the
summary drags something else: a text selection, or the card itself under Jira's own
drag-and-drop, and neither carries a `text/uri-list` this instance owns. The drop is
then refused, which is correct and is what happens.

**This is the browser's rule and not ours, and nothing in the Cart can widen it** — a
page element we did not draw is draggable, or it is not, by whatever Jira put on it.
What the Cart *can* do is make the whole row draggable **in its own two lists**, which
is exactly what §2.9.1 and this section do, and that is now the reason to prefer them:
**`On this page` is the one place where grabbing the summary works**, because that row
is ours.

**It is a fact to state in the open rather than a defect to file**, and it is the second
reason ask 1 earns its keep. Ask 3 is the shortcut; the live list is the reliable route.

> **AND THE REFUSAL MAY NOT LOOK LIKE ONE, which the user asked about and the answer is
> two-sided.** The drawer correctly shows **no blue line** — that is our whole signal,
> and it is an absence by design: the "no" belongs to the platform, which is the same
> division §2.14's field lists chose when they refused a cross-list drop.
> **What is missing is the platform's half**: no no-drop cursor appears either.
>
> **The likely cause is that something above us told the browser the drop is
> acceptable**, so the browser has nothing to refuse — and Jira's own drag-and-drop is
> the obvious candidate, since it is the same second acceptor the correction above
> names. **This is a hypothesis and not a measurement.** Probe C.6 settles it in one
> paste and answers a second question at the same time: whether a Jira card's own drag
> carries the issue key anywhere we could read, which would make grabbing a card
> — summary included — work as well as grabbing its key.

#### The source side, measured per view on 2026-08-26

**This section shipped saying it did not know whether a page drag worked on the views
that run Jira's own drag-and-drop. It was reported the same day, per view, and every
view of §2.1 is now answered: SEVEN YES AND TWO NO.**

| View | A key dragged off the page |
| --- | --- |
| Board, and the kanban view | **Works** |
| Backlog | **Works** |
| Search results | **Works** |
| **Child work items** | **Works.** The same `native-issue-table.ui.issue-row` as search results and an epic's children (§2.1), so one reading covers three views |
| The issue view | **Works** |
| Rovo search | **Works.** The ninth view, and the newest |
| **The PLANS TIMELINE** | **Does NOT work.** The timeline has its own drag handler and it takes the gesture |
| **LINKED WORK ITEMS** | **Does NOT work**, and the cause is unknown |

**The board and the backlog were the two this section was worried about, and both work.**
Jira's card drag-and-drop does not take the gesture away from the key — so the two
mechanisms coexist rather than compete, which is the opposite of what was predicted.

**THE TWO FAILURES ARE NOT THE SAME KIND OF FAILURE, and that distinction is the useful
part of the reading.** The timeline's cause is known and its gesture is a Jira feature we
must not beat. **Linked work items has no rival gesture at all** — nothing in that panel
is draggable, so nothing is being taken from us; something is simply stopping the drag
from starting. That makes it the one view where a fix might be possible, and it is
therefore the one worth diagnosing rather than accepting.

**The hint, labelled as a hint.** §2.1 already records something odd about that panel:
its card carries **two anchors to the same issue**, which is why the Cart needed a
two-segment testid there rather than a leaf. Whether that has anything to do with the
drag is not known. **Probe C.6 answers the question that comes first** — does a
`dragstart` fire at all? A drag that never starts is a source-side problem in Jira's
markup; a drag that starts and is then refused is ours. Nothing should be tried until
that is known.

**THE TIMELINE IS DECLINED RATHER THAN DEFERRED.** A Plans timeline bar is draggable by
Jira, because dragging it is how you change a date. Our gesture and Jira's are the same
gesture on the same element, and **Jira's is the one that has to win**: making the key's
link drag beat the bar's own drag would take away a Jira feature to add a shortcut,
which is exactly what §2.9.2 refused when it declined to swallow drops on the Jira page.
*Our refusals may not take away anything that already works*, and neither may our
acceptances.

**LINKED WORK ITEMS IS OPEN RATHER THAN DECLINED**, on the distinction above: there is no
Jira gesture there to protect. What it is not is a *defect in the Cart* — nothing in this
file decides whether a page element can be dragged. **And whatever the cause turns out
to be, one fix is already ruled out**: setting `draggable` on Jira's own anchors. The
Cart writes to the page in exactly one way — a generated stylesheet (§2.7, §2.10) — and
it does that precisely so that a virtualised list costs nothing and React cannot revert
it. Putting an attribute on a node React owns would be a new kind of write, reverted at
the next render, and §2.9's refusal to live inside `#jira-frontend` is the same argument.

**The remedy for both is already built, and it is the reason ask 1 exists.** Every issue
either view draws is in `On this page` — §2.1 has both views' selectors, and the
linked-work-items one was added on 2026-08-18 from a live page for this very panel — and
a live row drags from anywhere on the row. **So the two views lose the shortcut and keep
the capability.**

**One thing the timeline confirmed by accident, and it is risk 22's fix on a real
view.** A timeline bar dragged over the drawer is refused, and since the fix of the same
day it is refused **without being consumed** — so the bar's own drag is left to Jira
rather than swallowed by us. Whether consuming it visibly broke anything was never
observed, because the fix and the report arrived together; what is known is that the
shape of hazard risk 22 names is reachable on a view somebody actually uses.

**The rule that matters most came out of this and is not per-view at all**: the key is
the only real link, so a page drag starts there. That holds wherever Jira draws a row,
and the section above it is where it lives.

**Nothing about the feature depended on the answer, and that is why it could ship before
it was known.** The drop side does not care where a payload came from, and the two asks
the user made first — the live list and the collection — are the two that need no page
anchor at all, because those rows are ours. The measured cost of the two failing views is
therefore a **shortcut on those views** and nothing else.

**A second assumption was carried and is now discharged: that a Jira anchor's drag
carries `text/uri-list`.** The accept is granted on that type alone, so an engine that
put the URL only in `text/plain` would have refused a drop the parser could have read.
Seven views landing says the type is there. `keysFromDrop` reads `text/plain` as a
fallback anyway, so if a tenth view ever behaves differently the fix is one string in
`droppedLinks` — which is now a contingency rather than a live doubt.

### 2.10 One signal, and one function that writes to the page

The Cart needs one signal: **has Jira built something we care about?** The answer
comes from the CSS `animationstart` method that all three of this repo's other
scripts use. A 1 ms animation with no visible effect is given to the nodes we care
about, and one listener on the document catches the event as it bubbles. A 5-second
timer is a backstop, not the primary method
([`jira-ux-improvements.user.md` §2.4](jira-ux-improvements.user.md)).

Signals are coalesced into one animation frame. A backlog sends dozens of events in
one frame, and `render` is idempotent, so dozens of signals must give one scan
([`jira-backlog-sprints.user.md` §2.6](jira-backlog-sprints.user.md)).

**`render` is the only function that writes to the page.** Every signal calls it
and nothing else: a mount, a click, a value-change event, a tab becoming visible,
the backstop tick. Two properties follow, and both are load-bearing here. A new
signal is safe, because it can only call `render`. And every label is a function of
current state, so a button cannot show one condition while storage holds another.

**There is no route watcher.** `03` copied `watchRoute`'s 38 lines on the
expectation that scan results would be per-page, and pre-authorised dropping them
if not. The live list is a strict mirror, so **there is nothing to forget on
navigation** (`09` §3). The current issue on `/browse/KEY` arrives through its own
breadcrumb anchor, so not even `location.pathname` needs reading. The collections
live in storage, so the badge count survives navigation untouched. Drop it.

**Two things `render` must not do.**

- **It must not reset a property that something else owns.** See §2.11, defect 4.
- **It must not be the only path for a drag.** A pointer drag writes the size or
  the divider fraction directly and holds it in a variable that outranks the stored
  value, because `render` can fire in the middle of a drag. `render` then puts the
  stored value back after a rebuild.

`@match` is `https://*.atlassian.net/*`, not a narrower pattern. `@match` controls
injection only. Tampermonkey reads it when the document loads, and does not read it
again after a change to the history — so a narrow pattern fails when the user
arrives from another Jira page, and no code in the page can correct that
([`jira-ux-improvements.user.md` §2.5](jira-ux-improvements.user.md)).

`@run-at` is `document-start`, so the badge's corner rule and the collected-keys
stylesheet are correct on the first paint rather than a moment later.

`@updateURL` and `@downloadURL` point at `raw.githubusercontent.com`, as all five
scripts in this repo already do.

### 2.11 The drawer's layout rules, and the defect behind each one

Six defects came out of using the prototype. **Three of them are one mistake in
three costumes: a box given a size by something that knew nothing about that box.**
None of the six would have come out of an argument. They are written here as rules
with their causes, because a rule with no cause gets simplified away.

**Rule 7 is a seventh rule and not a seventh defect.** It was added at 1.0.0 to
settle risk 10, which this document had carried open since the prototype, and it is
the one place rule 2 bends. It is here rather than in the risk because it is a
layout rule and this is where the layout rules live.

**1. Flex all the way down. `min-block-size: 0` everywhere. The list is the only
thing that scrolls.** There are two sections, so there are **two scrollers, one per
section**, and nothing else in the drawer scrolls at all. The rule is about what
may NOT scroll: the drawer, the head, the body and each section are `overflow:
clip`.

The live list was **cut** rather than scrolled past about fifteen links. The lists
were capped with a viewport-relative height (`34vh`, and `46vh` side by side) —
a number that knows nothing about the drawer it is inside. Past that, the list
wanted to be taller than the space left after the head, and **a grid row sizes to
its content and does not shrink**, so the surplus was hidden by the container's own
overflow. Flex shrinks. Every box from the drawer down to the list can now go below
its content size, and the section heading can never be pushed out.

**RESTATED AT 1.2.0, NOT REWRITTEN: still one scroller, and while ⚙ is up the
settings panel is it.** The rule is about what may not scroll, and that is unchanged
— the drawer, the head and the body are still `overflow: clip`, and the panel gets
the same `flex: 1; min-block-size: 0` the lists have, for the same reason: a
scroller inside a box that cannot grow is CLIPPED unless every box above it can
shrink. The two sections' scrollers and the panel can never be on screen together,
because ⚙ hides the body the sections live in (§2.9). `css-smoke` asserts that the
sheet holds exactly those two scrolling rules and no third.

**`clip` and not `hidden` is load-bearing here too.** `hidden` is still
programmatically scrollable, which is the hazard at the end of this section — and
the panel is the first thing in the drawer with enough content to make a stray
`scrollIntoView` tempting. There is none anywhere in the file, and a harness check
says so.

**2. The sections do not compete by content size.**

A 30-item collection **starved** the live list. Sections that shrink in proportion
to their content mean the section you pick *into* squeezes the section you pick
*from*, until `On this page` was its own heading and nothing else. The fixed 62%
basis (§2.9) is the fix. Split mode escaped this only because there the sections
divide the width instead of the height.

**3. A fixed part of the drawer gets `flex: none`.**

The section heading was **sliced along its top edge**. The first diagnosis blamed a
scroll and was wrong. The real cause is a trap worth carrying: **a flex item cannot
normally shrink below its content, but that automatic minimum applies only while
`overflow` is visible.** The heading needs `overflow: hidden` for its ellipsis,
which removed the minimum and let it be squashed. `flex: none` says the same thing
as a `min-height` without a magic number.

**4. Our own grip, on the free corner. Never `resize: both`.**

`resize: both` is unusable on a corner-docked panel, and it took two more bugs down
with it.

- The UA handle is **always** at the bottom-right. On a bottom-right dock that is
  the *pinned* corner, so the box grew away from the pointer. **The corner that can
  move is the one you drag.**
- **`render` was erasing the drag.** The UA records a resize by writing inline
  `width`/`height` — the same channel a script writes. Clearing those on every
  render (which fires on every mount burst and every backstop tick) erased the drag
  before the pointer came up. An idempotent render must not reset a property
  something else owns.
- **A `pointerdown` guard could never fire.** Grabbing the UA handle is an
  overflow-control interaction, like dragging a scrollbar, and Blink handles it
  without dispatching a pointer event to the element. Our grip is an ordinary
  element, so its events are ordinary.

Two mechanics of the grip: which way the pointer must move is derived from the
anchored corner, not hard-coded — a right-anchored drawer grows as the pointer goes
left. And a dragged size lifts the default height cap; keeping the cap as a limit
made the grip look broken in one direction.

**THE THIRD DRAG, ADDED AT 1.2.0, INHERITED THE SECOND OF THESE DEFECTS AND ANSWERS
IT DIFFERENTLY.** The field lists reorder by drag (§2.14), and `render` can fire in
the middle of it for the same reasons it could fire in the middle of a resize — a
mount burst, a backstop tick, another tab's write — with one more since decision 25:
an add made from the page while ⚙ is up. The grip's answer is a variable that
outranks the stored value for as long as the drag owns it. **The field drag's answer
is to own nothing:** it holds the dragged row's ID rather than its index, and
resolves both ends against the stored list at drop time, so a re-render that moves
the rows cannot make the drop wrong. It therefore has no entry in the `dragging`
guard, and it must not grow one.

**All of them stay pointer-only** (§6 item 4). **A FOURTH ARRIVED AT 1.4.0 — the
collection's own items (§2.9.1) — and it answers this defect a third way, because it
had to.** The field lists' answer works only because the ⚙ panel *moves* its rows and
never rebuilds them; `renderCollection` rebuilds, so owning nothing is not enough
there and the list freezes for the length of the drag instead. That is the one drag
in the drawer with an entry of its own in what `render` will not touch, and §2.9.1
says why: the hazard is not another tab — a person has one pair of hands — it is
`runGapFill`, the only write in the Cart that needs no hand.

**And "none of them can be driven by a harness in this repository" was retired on
2026-08-25.** The two pointer drags cannot: they need real layout. The two HTML5 ones
can, and `boot-smoke` drives the collection's end to end. §7 step 13 stands for the
grip, step 31 for the field lists, and step 39 for the two things about a drag that
no harness will ever answer — whether a row is comfortable to grab, and whether a long
list scrolls at its edge.

**5. The chrome mirrors the anchor.** Two features that were each correct alone
collided: on a left dock, the ✕ sat where the grip lands. §2.9 has the rule.

**6. The timeline's summary is readable.** §2.2, tier 5.

**7. The fixed basis YIELDS to the collection's fixed parts, and only downwards.
Added at 1.0.0, for risk 10, and it is the one place rule 2 bends.**

Rule 2 says the sections must not compete by content size, and it still holds: the
number this rule subtracts is a **constant**, not the collection's content, so the
split still cannot shift under you as the collection fills. What it says is that
the live list may not take room the collection cannot do without. Rule 3 makes the
collection's four fixed parts unshrinkable, so whatever they are not given is
**clipped** — and at the old 300×160 minimum what was clipped was the create field
and all four copy buttons.

```
flex: 0 0 max(0px, min(var(--gt-cart-basis), calc(100% - 145px)));
```

Five things about it, each of which is a way to get it wrong:

- **It is a no-op above about 419px of height**, where 62% of the body and the body
  minus 145 cross. The default 520 and everything above it behaves exactly as it did
  before this rule existed. Only a short drawer yields, and it yields **the section
  that scrolls** rather than the section that cannot.
- **`max(0px, …)` is load-bearing.** A negative `flex-basis` is invalid, and an
  invalid `flex` shorthand falls back to `flex: 0 1 auto` — which is **defect 2
  back again**, sections competing by content size. On a drawer short enough for the
  subtraction to go below zero, that clamp is the only thing between the fix and the
  defect it replaced.
- **It is undone side by side**, in both the container query and the pinned `split`.
  There the basis is a *width* while the parts it protects are a *height*, so left
  in it would steal width to buy height the collection already has. Each override
  is (1,2,3) against the base rule's (1,1,2), and a container query does not change
  specificity.
- **145 is the only magic number in the layout**, and it is 135 for the four fixed
  parts plus the 5px divider plus five of headroom for the fractional line boxes.
  A fifth fixed part in that section makes it stale and the clipping comes back
  silently, which is why `css-smoke` counts the `flex: none` list.
- **The minimum height is in the SHEET as well as in the drag.** It was enforced by
  the grip's clamp alone, so on a window shorter than about 307 pixels the drawer's
  own `max-block-size: 70vh` went under it and the clipping came straight back. A
  `min-block-size` beats a `max-block-size`, which is what makes the guarantee hold
  at every size the drawer can reach rather than only at the ones a drag produces.
  **There is deliberately no width floor to match**: `max-inline-size` is what keeps
  the drawer inside a narrow viewport, and a `min-inline-size` fighting it would push
  the drawer — and the grip, which is the only way to get the size back — off-screen.
  Rule 1's own `min-block-size: 0` on the drawer was removed to make room for it,
  because rule 1 governs what a box may do as a **flex item** of the box above it —
  and the drawer is a flex item of nothing. It is `position: fixed`.

**The fix is NOT a `min-height` on the collection section.** Defect 3 above is the
argument against exactly that: the section's own heading needs `overflow: hidden`
for its ellipsis, which removes the automatic minimum, so a `min-height` there puts
the magic number one level lower down where it fights `flex: none` instead of
cooperating with it.

**And one hazard found while chasing defect 3, fixed anyway:
`scrollIntoView` scrolls EVERY scrollable ancestor**, and `overflow: hidden` is
still programmatically scrollable — it only hides the scrollbar. So one call on a
row inside the drawer silently scrolled the drawer itself and slid a heading out of
sight. The drawer's containers are **`overflow: clip`**, which is genuinely not a
scroll container, and the one list that should scroll is scrolled by hand. That
makes the whole class of bug unrepresentable rather than patched.

**Two notes for whoever edits the stylesheet, and both are cheap to re-learn the
hard way.**

*It is a template literal, so one backtick in a CSS comment ends it.* That cost
twenty minutes the first time, and happened twice more afterwards — each time
reporting a syntax error tens of lines below the real one.

***The `hidden` attribute hides nothing where a more specific rule sets
`display`.*** Found at version 0.3.0, in use: the ⚙ appeared to do nothing, because
the preferences area's own rule set `display: flex` while naming two ids, and the
drawer's generic `[hidden]` rule names one id and an attribute. The area was
therefore **permanently visible**, and the button was toggling an attribute with no
effect. The attribute's own rule is UA-origin, so ANY author `display` beats it,
which means **an element whose own rule sets `display` needs the attribute in its
own selector** — the way the floating button already did. The same arithmetic
governs the generated collected-keys sheet of §2.7, which paints
`a[href$="/browse/KEY"]` and would otherwise tint the drawer's own key links
(§2.9): the drawer names its own, and wins.

### 2.12 The platform: a userscript, with a `@grant`

**This is a userscript, and the question was settled with evidence rather than
taste** (`04`).

Two research passes came first. The Jira REST API answers a same-origin `fetch` on
the session cookie, verified live. One selector, `a[href*="/browse/"]`, finds issue
references on every Jira view surveyed, with the summary usually beside the key in
the DOM. **Neither came back short, so there is no deficiency for a Chrome
extension to remedy.** An extension would read the same DOM through an isolated
world and call the same undocumented cookie-authenticated endpoint, inheriting that
risk unchanged.

*One of `04`'s arguments no longer applies to the Cart, and it is fair to say so.*
`04` also counted the page-context `history` object that `@grant none` gives free,
where an MV3 content script needs `world: "MAIN"` declared to get it back. The Cart
runs under a grant, so it does not have page context either — **and it does not want
it**, because `09` deleted route detection from the design (§2.10). The row is moot
for the Cart. Everything else in `04`'s comparison stands.

Against that, an extension costs a manifest, an MV3 service worker, a build step,
three different install stories across the four Chromium browsers its users run,
and the loss of the `@updateURL` → GitHub-raw channel that every script in this repo
already uses. **The audience is the argument that could have flipped this, and it
runs the other way:** the users are the author plus tinker-minded colleagues, and
all of them already run Tampermonkey and this repo's other scripts. An extension
would ask them to adopt a second install channel for a fourth Jira tool.

**The Cart takes a `@grant`, and `10` established that this costs nothing anyone
named.** `04` never forbade a grant. It found that nothing the Cart *needed* forced
one, and said plainly that this is a different claim from a grant being forbidden.
Durability needs one. So four tickets' worth of suspicion about a grant came down to
one untested thing, and five runs by the user on 2026-08-18 tested it:

| Question | Result | Why it mattered |
| --- | --- | --- |
| Does a dual `text/plain` + `text/html` `ClipboardItem` write survive the sandbox? | **Yes**, twice, on separate tabs | The last reason `04` gave for `@grant none` |
| Is `GM_setValue` synchronous? | **Yes**. It returns `undefined` and the value reads back on the next line | §2.5 and §2.8 both need synchronous writes |
| Does `bulkfetch` survive the sandbox? | **Yes**. `200`, `application/json`, the right shape | Gap-fill and refresh have no other transport. **This is the one that could have killed the grant** |
| Does `GM_addValueChangeListener` cross tabs? | **Yes**. `remote: true` on the non-writing tab | Cross-tab freshness needs a signal |

`09` had already deleted the other reason for `@grant none`, by dropping route
detection (§2.10).

**What the store now gives, and what it does not.** It survives a logout and a
history cleanup, which `localStorage` did not, and it is per-script rather than
per-origin, so it can reach another site. **It does not survive uninstalling
Tampermonkey, switching browser, or moving machine** without Tampermonkey's own
cloud sync. So a collection is still working state, and **copy-out is still how the
data leaves the browser** — for that reason rather than for the fragility `05`
originally cited (`10` §6).

**`localStorage` was rejected** because it dies on a logout or a history cleanup.
**A mirror into Jira's own per-user properties was designed and measured in full,
and not chosen.** Every hard part of it — two copies of the user's data, a
reconciliation rule, three gates against tens of tabs racing each other, a
`navigator.locks` reversal, a two-request cold start — was a price paid to avoid a
grant that turned out to be free. Its ceiling is real and measured: **32,768 bytes
per property, counted in bytes**, and a Jira administrator can read another user's
properties. That design is preserved with its
measurements in **appendix B**, with the three conditions that would bring it back
(`10` §3, §5).

**The ladder, which matters more than the trip-wire.** Four things look like reasons
to build an extension. None of them is (`04` §5):

| If this happens | The response | An extension? |
| --- | --- | --- |
| Atlassian withdraws cookie auth on `/rest/api/3` | An API token in storage. It works identically in both worlds — and the API is only the summary fallback | No |
| A stricter page CSP blocks injection | Any `@grant` already puts the script in Tampermonkey's sandbox, immune to page CSP. The Cart has one | No |
| You want capture from Bitbucket | Tampermonkey storage is per-script, so the store already reaches it. What is missing is the DOM survey | No |
| You want sync across machines | Tampermonkey's own cloud sync of GM values. `chrome.storage.sync` is a **tighter** ceiling than `localStorage` was, not a looser one | No |

**Exactly one thing would force a move: Cart UI when no Jira tab is focused.** A
toolbar-button popup, a global hotkey that pastes the collection into any page, a
right-click "add to cart" on a Jira link seen in Confluence or Slack. A userscript
only exists inside a matched tab. That want is dormant — the Cart is always opened
while looking at Jira — which is why the verdict is unconditional and not
provisional.

**Two things an extension would genuinely do better, recorded and not acted on.**
The Cart exists once per tab, where an extension's UI exists once per window. And
native context-menu entries are a thing extensions have and userscripts do not: an
extension can add "Add to Jira Cart" to the browser's own link menu with no
interception and no loss, where a userscript can only take the menu away and rebuild
a worse one (§2.7).

**One standing risk that no platform choice removes:** cookie/session auth on the
REST API is **undocumented and unsupported** by Atlassian. It works, and it is what
Jira's own front end does, but it is not a contract. `02` reduced the exposure by
making the DOM the primary source of a summary.

### 2.13 The helpers are duplicated, on purpose

**Do not re-litigate this.** `03` measured it and decided.

`logger`, `guard`, `injectStyle`, `watchMounts` and `reportBrokenContract` are
copied into this script, as they are copied into every script in this repo. That is
about 90 lines, roughly a tenth of a file.

`@require` was rejected by the `jira-ux-improvements` ADR, because Tampermonkey
caches a `@require` file and so does GitHub's raw server, so an update does not
reliably reach users. A version number in the URL would fix that and needs
discipline this repo has never exercised. A build step would fix it and would mean
`src/*.user.js` is no longer the thing you install. Both cost more than the problem.

**The evidence is what settles it, and it points the opposite way to the
expectation.** Drift was measured, not assumed: **four divergences across five
scripts, none of which has caused a fault.** Three of the four are local adaptation
that a shared library would have had to grow parameters to serve. The one genuine
defect sits in a script that **reinvented** a helper rather than copying one — which
a shared library would not have prevented, because it would not have been reached
for either. The parts that were genuinely copied did not rot at all.

| Helper | Copy it from | Note |
| --- | --- | --- |
| `logger` | any of the three | the 4-method, rest-args shape |
| `guard` | [`bitbucket-ux-improvements.user.js:611`](bitbucket-ux-improvements.user.js#L611) | **the async-aware body. See below** |
| `injectStyle` | any of the three | verbatim, the byte-identical 9-line version |
| `watchMounts` | [`jira-ux-improvements.user.js:242`](jira-ux-improvements.user.js#L242) | **not** the backlog's, whose backstop is fused to its own `render` |
| `reportBrokenContract` | [`jira-backlog-sprints.user.js:392`](jira-backlog-sprints.user.js#L392) | the Cart's enrichment tier rests on Atlassian `data-testid` values, which is exactly the rot this badge announces |

`watchRoute` is **not** copied. §2.10 says why.

**One divergence is deliberate, and the ADR must name it or the next reader
"fixes" it back.** This script's `guard` is the async-aware body from
`bitbucket-ux-improvements`, not the synchronous one in the two Jira scripts beside
it. The Cart is the most asynchronous of the four: `bulkfetch`, and the clipboard
write. `try { return fn(); } catch` catches nothing thrown after the first `await`,
so a failed `bulkfetch` would become an unhandled rejection while the guard reported
success. Same seven lines, and it catches the case the Cart actually has. It is not
the union of the two variants, and the return value is dropped, because no call site
in any of the five scripts uses it.

---

### 2.14 📋 Details: two presses, nothing stored, and six destinations

**Added on 2026-08-20, at the user's request: power users export a collection to
make a report.** The four formats of §2.8 carry a key and a summary. This one also
carries **issue type, status, priority, assignee, fix version, time remaining and
parent** — the fields Jira's own backlog row shows, which is where the user
pointed when asked what the output should look like.

**This section is the first in this document written from real pastes rather than
from argument, and the pastes overruled it twice.** Both reversals are kept below
with their reasons, because the reasoning is the part that transfers. Appendix A.9
holds the measurements.

#### Why it is a fifth slot and not a sixth column

§2.8 called its four formats a **spanning set** and said every other candidate
collapses into one of them. **That claim is amended here, not deleted, and the
amendment is narrow**: the four are still a spanning set *of destinations that take
one document each*. A rich list a person reads, a plain list a person reads, a list
of identifiers, a query. What this one adds is not a fifth kind of document. It is
the requirement that **one document survive six destinations with different
renderers** — Confluence, Outlook, Word, Teams, Slack and a plain-text field — two
of which cannot draw a table at all.

§2.8 also says adding a format is *"one entry in a list"*. **For this one that is
false, and the sentence in §2.8 now says so.** The dispatch table did take one
entry. The two-step fetch behind it did not.

#### The output is a list, and a table was built and rejected

**A table was the decision for most of a session, and use killed it before a line
shipped.** The reasoning that chose it was sound and its premise was wrong: seven
fields per issue *is* tabular, and Confluence, Outlook, Word, Excel and Sheets all
turn an HTML `<table>` into real cells. What that missed is where these reports
actually go. **Slack has no tables at all**, Teams handles a pasted one badly, and
**a pasted table cannot be reordered by hand** — which matters, because the people
receiving these reports reshuffle them.

So the format is a list, one issue per line:

```
- [RDC-1513](…/RDC-1513) Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts — Story · Dev Resolved · P2 · William CHUANG · Pyr 2026.8.0 (Release - Active) · 0m left · ↳ [RDC-26701](…/RDC-26701)
- [RDC-30109](…/RDC-30109) [AmberFin] Linux OOM Killer invoked during transcode. — Bug · Dev In progress · P1 · Duncan Denning
- [GLX-402](…/GLX-402)
```

The head of each line **is** §2.8's Links line, unchanged, so the two formats agree
about what a collected issue looks like. What follows the em dash is the new part.
The em dash earns its place: without it the fields run into the summary with only a
`·` between them, and a summary can contain dashes.

> **Corrected on 2026-08-25: "unchanged" is TRUE of `text/plain` and has been FALSE
> of the HTML since the day this format shipped.** `formatDetails` writes
> `<a … style="font-weight:600">` on the key and `formatLinks` writes a bare `<a>`.
> The text sides are byte-identical; the HTML sides never were. The sentence is kept
> because its *intent* — that the two formats agree about what a collected issue is —
> is now true by construction: since 1.2.0 there is **one** line-shape preference,
> read once per copy and handed to all three exports (§2.8, decision 5), so the two
> cannot disagree about anything except this one declaration.
>
> **AND THE TWO SHOULD STAY DIFFERENT. Decided, not inherited.** The bold has a job
> here that it does not have on 🔗 Links: this line carries a field tail and runs
> long, so the bold key is what marks where one issue starts. Links' line is a key
> and a summary, so there is nothing to find. The shared shape therefore carries a
> `bold` flag, which is the whole of the difference.
>
> **What convergence would have cost, stated because it was the other option.**
> Either direction changes bytes that 1.1.0 has been putting on somebody's clipboard
> for days — bolding Links changes 🔗 Links, un-bolding changes 📋 Details and
> 📊 Report — and every default in this effort exists so that an install that never
> opens ⚙ cannot tell the configurability shipped. On top of that, nobody has ever
> pasted a Details line with an unbolded key, and this section's own rule is that the
> paste decides. **Neither is ruled out for ever**; both are a one-argument change,
> and the flag is where it would be made.
>
> The `url` shape is the one with no key to bold, so its two heads are identical.

**One issue is ONE LINE, and that is a requirement rather than a preference.** The
recipients reorder the list in the editor they pasted it into — to put the urgent
thing first, or to group what they are discussing. One line is one thing to drag.

**Rules the list inherits from §2.8 unchanged:** no format ever drops an item, so
an issue with nothing but a key shrinks to a bare link rather than vanishing; an
absent value drops out along with its separator; the collection's name is never
emitted; and a copy of zero items must not write at all.

#### Two presses, and nothing is stored

**Copy-out is synchronous and may never await the network (§2.8).** A clipboard
write after an `await` lands outside its transient user activation, which is
intermittent, silent failure. So the fields have to be in hand *before* the press
that copies them.

| Label | State |
| --- | --- |
| `📋 Details` | idle. The press fetches |
| `📋 Fetching…` | one `bulkfetch` for the whole active collection |
| `📋 Copy` | answered, and unspent. The count is in the tooltip, not the label |
| `✅` / `⚠️` | 900 ms, then the label is derived again |

The label **is** the state, which is this repository's convention — `⌫` becomes
`Empty 3?` before it will empty anything (§3). It is derived inside `render` for
the same reason every other label is: one written anywhere else is a value that has
to agree with the fetch and could stop agreeing (§2.8).

**The label changes and the BOX DOES NOT, and that is a fix rather than a detail.**
The armed label was `📋 Copy 12 items`, the widest thing in the foot, and the tick
is the narrowest — a swing of about 90px on a 360px row, which is exactly where the
foot's `flex-wrap` flips. So pressing the button rearranged the row and pressing it
again put it back, which the user reported as the thing it was. Two changes fix it:
the stepped buttons carry `min-inline-size: 11ch`, enough for the longest of their
labels plus an emoji; and **the item count leaves the label** for the tooltip,
because the collection's own heading shows it two lines above (§2.9). Corrected on
2026-08-21.

**The ladder's icon comes from the entry's own label**, not from a literal. It was
a literal `📋`, so §2.15's `📊 Report` showed `📋 Fetching…` — a defect that could
only appear once there were two stepped buttons, and that deriving the icon fixes
for the third as well.

**A copy used to re-render before it flashed, and no longer needs to.** While both
buttons read one held fetch, spending it left the other saying `Copy` for 900 ms
while a press would in fact fetch — found by the harness rather than by looking.
Arming per button (§2.15) removed the second reader and with it the need. The
ordering rule it rested on is still worth knowing: `flash` writes over the label
`render` just rebuilt, so a render *after* a flash wipes the tick.

**NOTHING FETCHED IS EVER STORED.** This is the decision the rest of the section
rests on, and it was taken against the cheaper option of adding the fields to the
stored item and refreshing them with the ↻ that already exists.

- **Status, assignee and priority change hourly.** A summary a week old is usually
  still true. A status a week old is a false statement about the world that looks
  like a true one. Storing it would put that on the clipboard with nothing to say
  so.
- **Held in memory and spent by the copy, it cannot be stale by construction**
  rather than by discipline. Everything pasted was fetched by the press before it.
- **§2.4 is untouched.** No new stored field, no migration, no version bump, and no
  older build silently dropping fields it does not understand.
- **Adding a field later is one id in `DETAIL_FIELDS`, one entry in
  `FIELD_CATALOGUE` and one `case` in `detailBit`.** This is what makes §6 item 14's
  report cheap to build. It was two of those until 1.2.0 split the catalogue out;
  Team cost exactly these three, and **a new field arrives OFF in both lists**, so
  adding one cannot change what a button produces without being asked (decision 21).

**What throws the held fetch away:** any change to the active collection's **key
list** — add, remove, empty, switch collection, another tab writing — and a
successful copy. The test is a signature, not a "ready" flag beside it, so there is
no second value that could disagree with the collection (principle 1).

**The signature is the key list, NOT the whole stored blob.** The fetch writes
summaries back through `applySummaries`, and comparing the blob would make our own
write look like a change and cancel the button we had just armed. A summary
changing is not a different set of issues. A key changing is — and a key repaired
from an `issueId` (§2.4) lands here correctly for that reason.

#### The fetch reuses everything that exists

One `bulkfetch`, `["summary","issuetype","status","priority","assignee","fixVersions","parent","timetracking"]`,
through the same validation §2.6 already requires: `ok`, a JSON content type, and
the expected body shape. **`fields` is now a parameter with no default**, because a
default would let a new caller ask for the wrong list silently.

**It also writes the summaries back, through `applySummaries`.** So a press of 📋
improves the drawer's rows and what 🔗 Links copies, and repairs a key that changed
project. It patches `key`, `issueId` and `summary` and nothing else — which is what
keeps a stale status off the clipboard by construction rather than by care.

Like ↻, it is the user asking, so it ignores `askedFor` on the way in. ↻ and 📋
each stand down while the other is out, and gap-fill stands down for both: all
three write summaries, and one request at a time is enough.

**When Jira answers badly** (§2.6's one failed state):

- **Nothing usable came back** — logged out, offline, a login page instead of JSON.
  There is nothing to copy, so the button **does not arm** and shows ⚠️.
- **Some came back.** It **arms**. The rows Jira said nothing about keep their key
  and their stored summary, and `markUnreadable` has already put `(cannot read)` on
  those drawer rows, which is where that news belongs. **Refusing the whole copy
  for one unreadable issue would make the format unreachable for as long as that
  issue is collected**, and §2.6 forbids the UI from claiming it was deleted, so
  the user could not even be told which item to remove.

#### The rendering, and the four rules the pastes bought

Only the HTML flavour is decorated. The rules below are **measurements, not
taste**, and each one is a change a later session would otherwise make on
reasonable-sounding instinct. Appendix A.9 has the runs.

1. **A separator must be a character, never a box.** Outlook strips an inline
   `border`. Two bordered fix-version chips divided by a space arrived as
   `Flex 2026.6.x (LTS track) Flex 2026.9.0` — one nonsense version. Fix versions
   are joined by a **comma**, in one span.
2. **Nothing may depend on `opacity`.** Outlook and Teams both strip it. The first
   attempt muted every secondary field with `opacity` and inherited colour, which
   was elegant and adapted to any ground automatically; it came back
   full-strength black with no hierarchy at all. **Reversal 1.**
3. **A colour must bring its own background, and that background must be pale.**
   Teams **keeps** a pale ground and **discards a saturated one**, then re-maps the
   white text to its own skin — so a bold pill loses its ground *and* its colour
   and lands as bold black. **Reversal 2**: `Done` was invisible on white paper, so
   the lozenges were made saturated, and Teams threw them away. The fix for an
   invisible pill is a **stronger tint**, never a solid fill.
4. **Nothing may depend on a row's position.** The list is reshuffled by hand after
   it is pasted. Printing the epic's name only on its first appearance would kill
   its repetition neatly and would be wrong the moment somebody moved a line, with
   nothing to say so.

| Field | How it is drawn | Why |
| --- | --- | --- |
| Status | An opaque lozenge, pale ground and dark text, coloured by **status category** | Rule 3. The category, not the name: `Dev Resolved` is this instance's wording, and only the category says which of the three colours it takes |
| Priority | `#d94136`, **P0 and P1 only**. Everything else is muted | Colour means urgency. Every issue in the real sample was P2 — this instance's default — so colouring it said nothing. Atlassian's own `#ae2e24` measured 2.1:1 on a dark ground |
| Type | A `■` in the type's colour, then the word in the muted grey | The square carries the colour and the word carries the meaning: a dim square is still a square, where dim text is not still readable. It is a **character**, which is why it survived a paste that stripped every border on the line |
| Everything else | One named grey, `#737c89` | 4.1:1 on white and 4.1:1 on charcoal. Deliberately mediocre on both rather than ideal on one and unreadable on the other — rule 2 took away the adaptive answer |

**The lozenge grounds are one step up Atlassian's own scale** — `#dcdfe4`,
`#cce0ff`, `#baf3db` — not the 100-level tints. The 100-level green was the actual
fault behind reversal 2: `#dcfff1` is a near-white mint that cannot be seen on
white paper. Each pairing measures above 4.9:1 text-on-ground.

**Teams re-maps `color` to whatever skin it is in.** So the light-versus-dark
problem does not arise there at all, and the grey chosen for Outlook costs nothing.
It is Outlook that needs a named colour, and Outlook that renders HTML through
Word's engine.

**The parent is a linked key alone.** Its name repeats identically down a list
built from one epic — three identical tails in a six-item sample, each pushing its
row onto a second wrapped line — and the fault is repetition, not length, so
truncating it harder does not help. The key being a link puts the name one click
away. **The key is inside the brackets and anything else outside**, exactly as
§2.8's Links does, and for the same syntax reason: markdown cannot nest square
brackets, so an epic called `[Pyramid] something` would break a `[KEY Name](url)`
label.

**The parent's anchor names its colour.** A link does **not** inherit the colour of
the span around it — the browser's own stylesheet wins — so without an explicit
colour the parent arrives as a bright blue link competing with the issue's own key,
which is the one link on the line that matters.

**The list carries one style of its own: `line-height:1.5;margin-bottom:8px` on
each `<li>`.** With a bare `<li>` Outlook gives a wrapped list item no leading and
no gap after it, so a six-item report arrived as one dense block and the user was
selecting 1.5 line spacing by hand every time.

**Two problems, two properties, and only one of them is what "tight" usually
means.** `line-height` fixes the leading *inside* a line that wraps — and these
lines wrap, because they are long. `margin-bottom` is what makes one issue read as
one block, which `line-height` alone does not do. Both were pasted before either
was written down.

**`mso-line-height-rule` is deliberately absent.** Word sometimes needs it to
honour `line-height`, and if this ever stops taking in Outlook that is the next
thing to try — but rule 5 is exactly why only one thing changes at a time here.

**🔗 Links gets exactly the same style, from the same constant.** It was excluded
for a day on the reasoning that its line is only a key and a summary and so does
not wrap — and that premise did not survive contact with real summaries, which run
60 to 100 characters here. `LIST_ITEM_STYLE` is shared, and a harness check asserts
both formats use it, so a later session cannot space one and not the other.

**Time remaining is the noisiest field here and ships anyway.** It read `0m` on
four of the six issues the format was designed against, because a finished issue
has nothing remaining. It was asked for by name, and dropping a requested field on
our own taste would be the wrong call. The cost is recorded instead, and removing
it is one id and one `add`. It is `timetracking.remainingEstimate`, the formatted
string Jira's own badge shows — blank on an issue with no time tracking, and blank
on a board that estimates in **story points**, which is a custom field whose id
differs per instance and is out of scope.

#### ONE CATALOGUE, TWO SELECTIONS

**Added on 2026-08-25, and it is what makes the bullet below overturnable.** 1.2.0
gives 📋 Details and 📊 Report each an ordered, ticked subset of the fields. The
question that raises is what stops the two drifting apart, and this is the answer in
the terms it has to be answered in:

> **The field ids, their labels and every measured style live in `FIELD_CATALOGUE`,
> `detailBit` and `detailChip` as single copies, and a preference can only say WHICH
> of them a document uses and IN WHAT ORDER.** The five paste rules are properties of
> the paste target and not of a format, so one copy of them remains the only safe
> number — and no user keystroke can reach it. What is duplicated is the SELECTION,
> whose duplication costs nothing but a second list of checkboxes.

Three consequences, each of which is a thing a later session would otherwise have to
rediscover:

- **A ticked field is displayed whether or not it is a band.** The panel *marks* a
  field that is also one of 📊 Report's headings; it does not veto it. The reason is
  rule 4 above: a field that appears only in a heading is a field whose meaning
  depends on the row's position, and these lists are reshuffled by hand after they
  are pasted, so somebody who drags a line out of its band can choose to keep the
  value readable on the row. The shipped defaults leave the banded fields unticked,
  so 1.1.0's report is unchanged byte for byte.
- **Zero fields is allowed**, and the line is then the head alone with no em dash.
  It needed no new code: the renderer already does exactly this for an issue Jira
  returned nothing about. The stated cost is that 📋 Details configured this way
  emits 🔗 Links' bytes — two buttons, one document, by the user's own choice.
- **`team` becomes a row field**, off by default in both lists. It has been fetched
  since 1.1.0 for the report's sub-band headings, and 📋 Details has no headings, so
  until now the field was fetched on every press of either button and unreachable
  from one of them.

**THE SELECTION IS APPLIED AT RENDER AND NEVER AT FETCH.** `DETAIL_FIELDS` is
unchanged and asks for all nine whatever the two lists say. Narrowing it to the
ticked fields is the obvious-looking optimisation and it costs three things at once:
the constant could fall out of step with a preference; **changing a preference would
invalidate a held fetch**, so a `📋 Copy` already armed would stop being copyable and
a field list changed in ANOTHER TAB would disarm this one; and *nothing fetched is
ever stored* would need re-arguing. The held rows carry every field, so a preference
change costs a re-render and nothing else.

**REORDERING IS A DRAG, and it was chosen against the recommendation of ↑↓ buttons**
(decision 11, 2026-08-24). The cost was stated before it was accepted and is paid
rather than hidden: **no harness in this repository can drive a drag**, because
`boot-smoke` has no layout and no paint, so there is no top half of a row to put a
pointer in. Two mitigations are therefore mandatory rather than stylistic — the
reorder itself is the pure function `moveField(list, from, to)`, so only the pointer
plumbing ships uncovered, and **§7 step 31 is the browser pass that stands in for the
harness**. There is **no keyboard path**, by §6 item 4: the Cart is not intended to
be operated by keyboard input, and adding one here would say that limit had moved
when it has not.

> **TWO CORRECTIONS ON 2026-08-25, both from designing the collection's own drag
> (§2.9.1). Neither changes what shipped; both change what this document claims.**
>
> **One: "no harness in this repository can drive a drag" is no longer true, and it
> was never quite the right claim.** `boot-smoke` keeps the delegated listeners the
> script registers and already stubbed a rect per node for the 1.3.0 rail, which is
> everything `dragstart`, `dragover` and `drop` read — so 1.4.0 drives the item
> drag there end to end, including which half of which row the pointer was in.
> What is true of THESE rows is that **nothing drives this one**, which is a gap in
> the harness rather than a property of the platform: retro-fitting the same
> synthetic drag to the field lists was offered and declined as out of scope. So
> step 31 still stands, for a narrower reason than the one written above it.
>
> **Two: the pure function is not called `moveField` any more.** It is `moveInList`,
> because it never touched a field — it is an array move, and the collection's drag
> goes through the same one. Its checks moved from `format-smoke` §16j to
> `smoke.mjs`, which is where the pure helpers live. Nothing about decision 11's
> reasoning depends on the name; the rename is here so a reader searching for
> `moveField` learns where it went rather than concluding it was deleted.
>
> **And one thing that is NOT corrected, because it is still right:** the drag is
> HTML5 rather than pointer plumbing. §2.9.1 made the same choice for the same two
> reasons, which is the strongest evidence available that it was the right one.

**Whether the drag is usable at the drawer's 300px floor was DECIDED, NOT MEASURED.**
The press was written and never run. The user answered it by decision instead: *a
user who finds it fiddly at the minimum width will make the drawer wider* — the
drawer is resizable and the grip is right there. Recorded in those terms so that a
later session does not read it as a press that happened.

> **MEASURED on 2026-08-25, and the decision held.** The paragraph above is kept
> because the *standing* of a claim is the thing this document tracks, and for one
> day this one rested on an argument. It no longer does: the user dragged a row with
> the drawer at its 300×215 floor and reported the feature works. **The fallback the
> decision leaned on was not needed** — nobody had to widen the drawer to reorder a
> list.
>
> **AND IT WAS USABLE, NOT MERELY WORKING.** The user's second report was that
> ticking, unticking and reordering *"works well"*, which is the half of the question
> the word "fiddly" was actually about. A drag can function and still be miserable at
> 300px; this one is not, and that is the finding rather than a pleasantry.
>
> **What that closes and what it does not.** It closes the question decision 26 was
> answered by fiat: the drag is usable at the floor. It does **not** retire the
> reasoning, which is still the right answer if the drawer ever gets more rows than
> eight or a longer label than `Time remaining` — the panel is a scroller and the
> grip is still right there. And it says nothing about §7 step 31's sixth item, which
> the same session did not reach.

#### What it is not

- **Not a table.** See above. The table is §6 item 14, one entry in the dispatch
  table away if a spreadsheet is ever wanted; 🔍 Search plus Jira's own CSV export
  is the route today, and always was.
- **Not configurable.** There is no column picker and no per-field switch. A
  setting that silently changes what a button produces is what §2.8 warns about,
  and a fixed output is checkable.
  > **Narrowed on 2026-08-25: the HEAD is configurable, and the STYLING never will
  > be.** 1.2.0 makes the issue reference one of five named shapes (§2.8), shared by
  > all three exports. The warning above is not violated, and the three reasons are
  > the test any later setting has to pass: the setting is **visible**, in ⚙, rather
  > than silent; the output is still **checkable**, byte for byte, because the shapes
  > are a fixed list in the script and the harness asserts every one of them; and no
  > preference reaches **`detailChip`**, which is where the five measured paste rules
  > are enforced. The column picker this bullet refuses is a different question and
  > is not answered here.
  >
  > **OVERTURNED on 2026-08-25: THE COLUMN PICKER SHIPS.** The bullet above is kept
  > word for word because its argument is the one the amendment has to answer, and
  > answering it is what took a day: *"a setting that silently changes what a button
  > produces is what §2.8 warns about, and a fixed output is checkable."*
  >
  > **It is answered rather than ignored, on all three counts.** The setting is not
  > silent: it is a row of checkboxes in ⚙, on a tab named after the button it
  > governs. The output is still a **fixed function** of it — the same renderer, the
  > same `detailChip`, the same five paste rules, with a filter in front. And it is
  > still **checkable**: `format-smoke` asserts the defaults byte for byte, every new
  > shape a selection can produce, and the five paste rules over every one of them.
  > **What changed is that there are more reachable combinations, not that any of
  > them is unchecked.** The one word in the original that does not survive is
  > "silently".
  >
  > **The line the amendment does not cross is the same one §2.8 drew:** a preference
  > may say *which* fields and *in what order*, and may never say what a field looks
  > like. The moment a setting reaches `detailChip` this bullet is back, unamended.
- **Not a per-row or per-selection copy.** There is no selection — the collection
  is the selection (§2.9) — so `collection` is the only scope 📋 Details is reached
  at. The `item` scope was honoured in the code because it is the seam, not because
  anything reached it.
  > **Amended 2026-08-25, at 1.3.0.** `item` now has a caller — §2.7.1's copy
  > button — and this bullet is still true about **📋 Details**, which is what it is
  > about. The copy button is 🔗 Links at item scope, deliberately: a field tail and
  > a heading on one hovered issue is a document nobody asked for, which is why the
  > `single` flag sits on the Links entry and not on this one. What is still refused
  > is copying **one row out of the collection**, and its reason is unchanged.
- **Not about the live list.** The user's instruction: the detailed fields are
  wanted when exporting a collection, so a live-list row shows nothing new and
  **nothing is fetched for links merely drawn on the page**.
- **Not a template.** §2.8's finding stands and this format strengthens it: a
  fill-in-the-blanks model would now also have to express a lozenge whose colour
  comes from a category, a colour that applies to two of five priorities, and a
  separator that must not be a box.

### 2.15 📊 Report: grouped by priority, then by team

**Added on 2026-08-20, at the user's request.** The Technology Portfolio Office
sends these lists to team leads, and they read them **by priority, then by team**.
That order is the user's, and it was corrected the same day from an earlier note
that had it the other way round — worth recording, because team-outer is the order
a *team lead* would want and priority-outer is the order the *sender* wants, and
only the sender was asked.

**A sixth export, not a setting on 📋 Details.** Grouped headings over grouped rows
is a different **document** from a flat list, not a rearrangement of one: it
reorders the items, moves two fields into headings, and cannot be checked by *lines
equals items*. A switch that silently decided which of those a button produced is
exactly what §2.8 warns against, and a fixed output is checkable. So the foot holds
six: the five that copy, then 🔍 Search, which is still the only one that navigates.

**THE BUTTON YOU PRESS IS THE BUTTON THAT ANSWERS — reversed on 2026-08-21, from
use.** It shipped the other way for a day: one press armed *both* stepped buttons,
on the reasoning that the held result describes the collection rather than a button.
**That reasoning is still true of the data and was wrong about the control.** The
user pressed one button, watched the other one walk through `Fetching…` and `Copy`,
and reported it as a bug — which is what it is, however good the argument behind it
was. A control that responds to a press somewhere else is broken even when its state
is correct.

So `detailsHeld` carries **the kind that produced it**, and a button offers a copy
only for its own kind. Pressing both in turn costs one extra `bulkfetch`, which is
one request at the scale §2.6 rule 4 already sizes for, and buys a control that
behaves the way a control should.

**What stays shared is everything that cannot be seen**, and that part of the
original reasoning holds: one field list, so neither document can be fetched with
fields the other lacks; and one `detailChip`, so the five rules of §2.14 cannot hold
in one format and drift in the other. Those rules are properties of the paste target
and not of a format, which is why one copy of them is the only safe number.

**The reversal also deleted code.** A copy used to have to re-render before it
flashed, because both buttons read one held fetch and spending it left the other
saying `Copy` while a press would fetch. With one reader there is no second label to
put back. One reversal, two things simpler — and worth recording, because the
instinct is to expect a correction to cost something.

```
**P1**

*MAM Core & Plugins*
- [RDC-30109](…) [AmberFin] Linux OOM Killer invoked during transcode. — Bug · Dev In progress · Duncan Denning

*Planning*
- [RDC-28369](…) Full screen mode doesnt show any player controls — Bug · To Do · Rajesh KRISHNAPPA · Flex 2026.6.x (LTS track), Flex 2026.9.0 · 0m left

**P2**

*Planning*
- [RDC-1513](…) Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts — Story · Dev Resolved · William CHUANG · Pyr 2026.8.0 (Release - Active) · 0m left · ↳ [RDC-26701](…)

*No team*
- [RDC-1517](…) Markers [4] Dev (front-end) - Story 3 - Select Markers — Story · Done · 0m left · ↳ [RDC-26701](…)
```

**Two fields become headings and so leave the row.** Priority is the band and team
is the sub-band, so neither is printed again on the line — the same rule an epic
follows in a grouped list, and it shortens every row. What the row keeps is type,
status, assignee, fix version, time remaining and the parent.

> **Amended on 2026-08-25: that is now the DEFAULT rather than the rule.** 1.2.0
> gives 📊 Report its own field list (§2.14), and `DEFAULT_PREFS.reportFields` leaves
> priority and team unticked — so the bytes above are exactly the bytes 1.1.0
> emitted, and the paragraph is still a true description of what the button produces
> out of the box.
>
> **What changed is that the tick wins and the band does not veto it** (decision 8).
> Somebody who wants the priority on the line as well can have it, and the ground is
> §2.14 rule 4: a field that appears only in a heading is a field whose meaning
> depends on the row's position, and these lists are reshuffled by hand after they
> are pasted. The ⚙ panel marks such a field `also a heading`; it does not refuse
> the tick. The alternative — a band that greys out its own row field — was the
> tidier-looking one and it would have made rule 4 unreachable by a user who had
> already hit the problem it describes.

**`P0` before `P1` before `P2`, and there is no rank table.** The names already sort
as strings, so nothing here can fall out of step with Jira's own priority scheme. An
unset value sorts **last** in both bands, because *not set* is not a peer of a real
priority or a real team, and it is **named** — `No priority`, `No team` — rather
than left as a blank heading, because a fact about the issue must not read as a
failure. Teams sort alphabetically; inside a team the collection's own order
survives, as it does in every other format.

**Grouped by `teamId`, labelled by `team`.** Two teams can be given the same name,
and a heading that silently merged them would be a *wrong* report rather than an
ugly one. The same shape of decision as §2.4's opaque collection id against its
editable name. The team field is **`customfield_15541`** and it is referenced **by
id and never by name**, because this instance has more than one field called Team
and a name match says only that *a* field answered (appendix C.4).

**Headings are tags, not styled spans.** `<p><strong>` for the priority and
`<p><em>` for the team: §2.14 rule 5 is about what a paste does to a *styled span*,
and a tag cannot be flattened the same way. `<p>` carries only a margin, which is
the most ordinary property in email HTML. **And `<p><strong>`, not `<h3>`** — a
pasted heading joins the host document's outline, and a status mail should not add
sections to somebody's page.

> **Amended on 2026-08-25: WHICH TWO FIELDS BAND IS NOW A SETTING. Seven of them
> may, and one of the seven can list an issue twice.** 1.2.0 gives 📊 Report two
> dropdowns — `Group by` and `Then by` — on its own ⚙ tab, above its field list
> (decision 12). Everything above stays true, and most of it stays true *by
> default* rather than by construction; each paragraph below says which.
>
> **The *sixth export* reasoning STANDS, and restating it is the point of this
> amendment.** A grouped document is still a different **document** from a flat
> list, and what the two dropdowns configure is *that* document — they do not turn
> one document into the other. That is why **band 1 has no `None`**: a report with
> no bands at all is 📋 Details spelled differently, so offering it would be the
> switch §2.8 warns about, arriving by the back door. Only band 2 may be `None`,
> which gives a report with one level of headings. `format-smoke` asserts the
> equivalence directly — a report with no resolvable band is byte for byte 📋
> Details, given the same selection — so the reason the option is withheld is a
> measurement rather than an assertion.
>
> **Seven fields band: priority, team, status category, assignee, type, fix version,
> parent.** The catalogue has eight, and **time remaining is the one that may not**
> (decision 14). Its band order would be string order over durations —
> `"10m" < "2d" < "9h"` — which reads as a broken report rather than a configured
> one. The reason is in a comment beside the list and in a check, because the next
> session to look at it will otherwise add it back on the reasonable-sounding
> grounds that a field is a field.
>
> **STATUS BANDS BY CATEGORY, NEVER BY NAME, AND IT CARRIES A THREE-ENTRY RANK.**
> `item.category` is already fetched — `fields.status.statusCategory.key`, one of
> Atlassian's fixed three — and it bands as `To do` / `In progress` / `Done` in that
> order. **This does not reopen the no-rank-table decision above, and the difference
> is what makes it safe.** That decision refused a rank for *priority* because
> priority names are **this instance's own** and already sort correctly as strings,
> so a table over them could only fall out of step with Jira. The three categories
> are **Atlassian's vocabulary** — fixed, finite, and the only values the field
> returns — and they do **not** sort meaningfully as strings in either direction.
> Banding by status *name* would give `Dev In progress`, `Dev Resolved`, `To Do`:
> alphabetical noise dressed as a workflow (decision 13). One list in the script
> gives both the label and the rank, so a heading and its position cannot come to
> disagree, and a category this build does not know ranks last — where every absent
> value goes.
>
> **FIX VERSION MAY BAND, AND AN ISSUE IN TWO RELEASES APPEARS IN BOTH** (decision
> 15). One issue yields one entry per band, except here, where it yields one per
> version. That is the only reason to group by release at all: a per-release section
> then lists what actually ships in that release. It costs a stated property and the
> cost is limit 5 below — the exception is deliberate rather than discovered, and
> the ⚙ panel says so beside the dropdown, in a note that appears only while such a
> band is chosen. The two alternatives were weighed and are in §4.
>
> **GROUP BY ID, LABEL BY NAME, wherever the two are different things.** The team
> paragraph above is the model and it now has two more cases. **The assignee bands
> by `accountId`** — two people can carry one display name, and a heading that
> merged them would be a *wrong* report rather than an ugly one, which is this
> section's own argument applied where it also holds. It costs nothing: `accountId`
> arrives inside the assignee object the Cart already requests, so there is no extra
> field and no extra call. **The parent bands by the epic's key** and is labelled
> `KEY Summary`, which is Jira's own issue header in Jira's own order. §2.14
> rejected the epic's summary **on the row** and that rejection does not reach a
> heading: its ground was *repetition* — 21 characters a line, identical on three of
> six rows — and a heading says it once, for the whole group.
>
> **Everything else in this section is unchanged**, and it is unchanged for every
> band rather than only for the two that shipped. An absent value sorts **last** and
> is **named** — `No priority`, `No team`, `No status`, `Unassigned`, `No type`,
> `No fix version`, `No epic` — never a blank heading, because a fact about the
> issue must not read as a failure. Inside a group the collection's own order
> survives. Headings stay `<p><strong>` and `<p><em>` — tags, not styled spans, and
> not `<h3>`.
>
> **~~The pair may name the same field, and nothing forbids it.~~ REVERSED THE SAME
> DAY, FROM USE.** It shipped allowed, on the reasoning that priority under priority
> is one sub-heading repeating the heading above it — useless, truthful, and visible
> the moment it is pasted — so refusing it was more machinery than the mistake was
> worth. **The user pressed it, made `Team` then `Team`, and reported it as a
> defect**, which is what it is. A report whose every sub-heading repeats the heading
> above it is not a configuration anybody chose, and *you can see that it is wrong*
> is not the same as *you meant it*. The original argument weighed the cost of the
> machinery against the cost of the mistake and got the second number wrong: this is
> not a state somebody arrives at deliberately, it is one they arrive at by moving
> one dropdown and not noticing the other.
>
> **Two mechanisms enforce it and neither is enough alone, and the DIRECTION is the
> whole design.**
>
> 1. **`Then by` never offers the field `Group by` holds** — greyed in place, not
>    removed, so the row still reads `Team` and says *why* it cannot be chosen.
>    A band greys out what the bands **above** it hold and never what the bands below
>    it hold, which is the same rule the labels already carry: position is the
>    meaning, the first band must be a field, and a later band is the one that gives
>    way.
> 2. **Moving `Group by` onto the field `Then by` holds SWAPS the two**, in one
>    press. That asymmetry is the reason `Group by` still offers all seven: somebody
>    asking to group by the field that was the sub-band is **reordering the report**,
>    which is the one thing these two dropdowns exist to do.
>
> **It is the only place on this screen where a press moves a control other than the
> one pressed**, so the reason it is not §2.15's own *the button you press is the
> button that answers* defect is worth stating. That defect was a button walking
> through a state ladder it had not been pressed for — a control **lying** about what
> had happened to it. Here the second dropdown does not acquire a value nobody chose:
> it receives the one the first dropdown just gave up, in the same gesture, visibly,
> and pressing again puts both back.
>
> **A veto here, where the field list's mark is only a statement (decision 8), and
> that is not an inconsistency.** The mark refuses to veto because §2.14 rule 4 gives
> a banded field a real use on the row — somebody who drags a line out of its band in
> the pasted mail still wants the value readable. A duplicate **band** has no such
> reading, so there is nothing to leave open.
>
> **`normalisePrefs` carries the other half**, for the blob no click can produce: a
> stored pair naming one field collapses **band 2** to `None`, never band 1, because
> band 1 is required and band 2 is optional — so the optional one is the only one that
> can yield to a state a click can also reach. That includes band 2's own *default*:
> a blob naming `team` for band 1 and nonsense for band 2 must not have `team` put
> back underneath itself.
>
> **The two alternatives, weighed and declined**, are in §4.


**Stated limits.**

1. **The team field id is instance-specific.** On another Jira the headings go quiet
   rather than wrong: an absent value drops out and the group becomes `No team`,
   which is §2.14's rule applied to a heading. Appendix C.5 is the probe if a
   collection ever needs to span projects with different Team fields.
2. **Whether `bulkfetch` returns a custom field asked for by id was expected rather
   than known** when this was written. The Cart had only ever requested system
   fields. §2.6's rule that a requested-but-absent field is normal covers it
   failing, and the failure is visible: every heading becomes `No team`.
   > **CONFIRMED on 2026-08-24. It does.** 📊 Report was pressed on a real
   > collection whose issues carry a team, and the sub-band headings read the real
   > team names rather than `No team`. So `customfield_15541` comes back from
   > `bulkfetch` when it is asked for by id, and this limit is closed. The
   > paragraph above stays because its failure mode is still the one to look for
   > on another instance, where limit 1 applies. Appendix C.4 carries the run.
3. **An issue carries at most one team**, because the field is one object and not an
   array (appendix C.4). So an item appears exactly once and *lines equals items*
   still holds across the whole document, even though it cannot be checked band by
   band.
   > **Amended 2026-08-25: true of the TEAM band, and no longer true of the
   > document.** It is a fact about `customfield_15541` and it stands as one. What
   > it can no longer be read as is a promise about the report, because fix version
   > can band and is multi-valued — see limit 5.
4. **Nothing sorts by the collection's order across bands.** Reordering the pasted
   report by hand still works — §2.14 rule 4 is about a *field* whose meaning
   changes with position, and grouping is an order the user asked for.
5. **With a multi-valued band, a paste has one line per issue-and-band, not per
   issue, so *lines equals items* is not the check there.** Added 2026-08-25 with
   the configurable bands. Fix version is the only such band today, and an issue in
   two releases is listed under both (decision 15). The property matters because it
   is what makes a paste verifiable at a glance — count the lines, count the items —
   so losing it is stated rather than discovered, here and in the ⚙ panel beside the
   dropdown.
   **§2.14's *no format ever drops an item* still holds, and the two must not be
   conflated.** Nothing vanishes; something repeats. Dropping is forbidden;
   repeating is a consequence the user asked for by choosing the band, and
   `format-smoke` asserts both at once — the line count is items **plus one** for a
   sample carrying one two-release issue, and every item is still in the document.
   Every other band keeps the property, which is what makes this the exception
   rather than the new rule.
   > **Pressed on 2026-08-25, and the exception reads as intended.** A collection
   > carrying real issues in two releases was banded by fix version and reported
   > **exported as expected**. That is the half of this limit no assertion could
   > reach: the line count and the two headings were already held byte for byte, and
   > the risk this limit exists to name is not that the bytes are wrong — it is that
   > a document listing one issue twice looks like a **fault** to whoever receives
   > it. It did not. The limit stays, because it is still the property a reader
   > loses and still the thing to say out loud beside the dropdown.

## 3. What the script gives the user

Two things on the page: a badge in a bottom corner, and one floating **rail** that
follows the hovered issue link — the `+`, and since 1.3.0 a `🔗` beside it.
Everything else is inside the drawer.

| Control | Where | What it does |
| --- | --- | --- |
| 🛒 `Scratch 7 ▾` | the badge, bottom-right | Opens and closes the drawer. The label is the active collection's name and its item count |
| ⚠️ on the badge | the badge | The last write failed. The drawer carries the sentence |
| `+` / `✓` / `−` | floating, left of the hovered issue link | `+` adds. `✓` says it is in the collection. `−` (the pointer is on the button) removes |
| `🔗` | floating, on the far side of the `+` | Copies **that one issue** and does not open it. The bytes are 🔗 Links' at item scope, so **the `Issue reference` setting decides them** and both flavours are written. It flashes `✅`, or `⚠️` if the write was refused. The `+` does not move to make room for it (§2.7.1) |
| A live-list row | drawer, `On this page (n)` | Adds the issue. Click a collected row to remove it. **The key itself is a link**: click to open the issue, middle-click or Ctrl-click for a new tab |
| A live-list row, dragged | drawer, `On this page (n)` → a chip, the collection, or anywhere else | **Drags that one issue** (1.6.0). Drop it on a **collection chip** to add it to that collection without making it active, or into the **collection list** to choose where it lands. Or drop it in another application, in whatever shape `Issue reference` names. It never removes anything: the live list mirrors the page. It is the one draggable thing in the drawer with no state that turns it off, because it cannot write (§2.9.3) |
| A key, in either section | drawer | A real link to the issue, so the browser's own gestures all apply, including its context menu. It opts out of its *own* drag in both sections, so grabbing it drags the row (§2.9.1, §2.9.3) |
| Any issue link Jira drew | the page → the drawer | **Drag it into the drawer to collect it** (1.6.0), onto a chip or into a gap in the collection. Nothing of ours starts this drag, so it works wherever the browser lets a link be dragged — **which is not known for the backlog and the board**, where Jira runs its own drag over the cards (§7 step 41). Another instance's URL is refused |
| A collection row | drawer, the collection | **Drag it to reorder** (1.4.0). The whole row is the target, key included; a ⠿ appears on whichever row the pointer is over, and its space is held whether or not it is painted. Which half of the row you drop on decides above or below; below the last row appends. **The array order is what every export emits**, so this sets what a paste says first. No keyboard path (§6 item 4), and no undo beyond dragging it back (§2.9.1) |
| A collection row, dropped on another chip | drawer, the collection → a chip | **MOVES the issue into that collection** (1.6.0), at the end, without making it active. **Hold Ctrl on the drop to copy instead.** This is the first destructive control in the drawer that cannot warn before it acts, and the only undo is dragging it back. Dropping it on a collection that already holds it still takes it out of this one — a drop makes the end state true (§2.9.3) |
| A collection row, dragged OUT of the drawer | drawer → anywhere else | **The same drag drops that issue into another application** (1.4.0), in whatever shape `Issue reference` names — the `🔗` button's bytes, plain and rich, plus a `text/uri-list` so it is a real link drag. It is a copy: the row stays in the collection. **A mis-drop onto the Jira page opens a NEW TAB on that issue** — measured 2026-08-26; it does not take the page you were on away, which is what this row claimed until then (§2.9.1, appendix A.10). Dropping it into a **Jira comment or description** works and inserts the same shape |
| `✕` on a collection row | drawer, the collection | Removes that item |
| The collection's heading, dragged | drawer, the collection's heading → anywhere else | **Drags the whole collection out** (1.5.0). A plain editor gets the markdown list, Teams and a **Jira comment** get live links, and the **browser's tab strip opens one tab per issue** — inside a tab group if you drop it into one you already made. The bytes are 🔗 Links' own, so the `Issue reference` setting decides them. A ⠿ appears on hover, its space held either way. It only reads, so it works on a read-only store; it does nothing while the rename field is open, or on an empty collection. **The bookmarks bar takes only the first link and gives it no name** — the browser's limit, not ours (§2.9.2) |
| The collection's name | drawer, the collection's heading | Click to rename it in place. Enter or blur commits. Escape cancels |
| ⌫ | drawer, the collection's heading | Empties the collection and keeps its name. Click once to arm it — the label becomes `Empty N?` — and again to commit |
| ↻ | drawer, the collection's heading | Refreshes every summary in the collection |
| A collection chip | drawer, below the collection | Makes that collection active. Each chip carries its own count. **Since 1.6.0 it is also a drop target**: drop an issue on it and it joins that collection at the end, and the collection does *not* become active. An empty collection's chip cannot be dragged and still accepts a drop (§2.9.3) |
| A collection chip, dragged | drawer, below the collection → anywhere else | **Drags THAT collection out** (1.5.0), to the same six places the heading reaches — and **without making it active**, which nothing else in the drawer can do. No ⠿ on a chip: its name is the one label in the drawer that ellipsises, so the tooltip does the work instead (§2.9.2) |
| ✕ on a chip | drawer, below the collection | Deletes that collection. Armed first: the chip turns red and its tooltip names what goes. On the only collection it empties it instead (§2.4) |
| `new collection…` + create | drawer, below the chips | Creates a collection and makes it active |
| 🔗 Links | drawer, the foot | Copies the whole collection as a list, plus a spaced `<ul>` as HTML. **How each line names its issue is the `Issue reference` setting**, and the default is what 1.1.0 emitted (§2.8) |
| 📃 Names | drawer, the foot | Copies `[KEY] Summary` per line |
| 🔑 Keys | drawer, the foot | Copies `KEY, KEY, KEY` |
| 📋 Details | drawer, the foot | **Two presses.** The first asks Jira for type, status, priority, assignee, team, fix version, time remaining and parent, and the label becomes `Copy N items`. The second copies the rich list. **Which of those fields it prints, and in what order, is the `📋 Details` tab's own list** — the default is what 1.1.0 emitted. A copy spends it, and any change to the collection drops it; a change to the field list does **not**, because the fetch always asks for all of them (§2.14) |
| 📊 Report | drawer, the foot | **Two presses**, sharing 📋 Details' fetch. Copies the collection grouped under headings. The default is priority and then team, which is the shape the Technology Portfolio Office sends to team leads, **and since 1.2.0 both bands are settings** — see the two rows below. **It has its own field list** as well, on the same tab, over the same eight fields (§2.15, §2.14) |
| 🔍 Search | drawer, the foot | Opens the whole collection in Jira's issue search, in a new tab. From there it can be filtered, bulk-edited, saved as a filter or shared |
| ⚙ | drawer, the head | **A state button.** Opens the settings screen, which REPLACES the two sections and the foot. It stays lit while it is up, and the head reads `⚙ Settings`. Press it again to go back |
| A settings tab | drawer, the settings screen | `Appearance`, `📋 Details` or `📊 Report`, with `Issue reference` pinned above the bar. Which tab you were last on is remembered |
| Issue reference | drawer, the settings screen, pinned above the tabs | One of **five named shapes** for how an issue is written at the head of a line — a markdown link, a markdown link with no summary, key + summary + URL, key + URL, or the URL alone. **It governs 🔗 Links, 📋 Details and 📊 Report together** (§2.8) |
| A field's checkbox | drawer, `📋 Details` or `📊 Report` | Whether that field is printed on the line. Each tab has its **own** list over the **same** eight fields — type, status, priority, assignee, team, fix version, time remaining, parent — and every field has a row whether it is ticked or not. **Zero ticked is allowed**: the line is then the issue reference alone (§2.14) |
| A field's row | drawer, `📋 Details` or `📊 Report` | **Drag it to reorder.** The line prints the ticked fields in the order the list stands in. A drop into the *other* tab's list is refused. There is no keyboard path (§6 item 4) |
| `also a heading` | drawer, `📊 Report` | That field is one of the report's two bands. It is a note and not a refusal — tick it and the value appears on the row as well (§2.14 rule 4) |
| `Group by` | drawer, `📊 Report` | The report's first heading level. One of **seven** fields — priority, team, status category, type, assignee, fix version or parent — and it may not be `None`, because a report with no bands at all is 📋 Details (§2.15) |
| `Then by` | drawer, `📊 Report` | The second heading level, the same seven fields plus `None` for one level only. **The field `Group by` holds is shown greyed here rather than hidden**, so it says why it cannot be chosen; choosing the other dropdown's field **swaps the pair in one press** (§2.15) |
| Sections | drawer, `Appearance` | `auto`, `stacked` or `split`. `auto` decides from the drawer's own width |
| Corner | drawer, `Appearance` | Bottom right or bottom left. The drawer's chrome mirrors it |
| A `🔗` beside the `+` | drawer, `Appearance` | **On by default** — the only switch here that is. Off, the hovered rail is the single `+` it was at 1.2.0, which is what to do if the wider rail covers something in your rows (§2.7.1) |
| ↺ Restore export defaults | drawer, the export tabs | Puts the line shape, both field lists and both bands back to what 1.1.0 emitted. Click once to arm it — the label becomes `Restore?` — and again to commit. It leaves the appearance switches and the tab you are on alone |
| ✕ | drawer, the head | Closes the drawer. **The same on both screens**: it never means "go back" |
| The grip | drawer, the free corner | Drag to resize. Double-click to let the drawer size itself again |
| The divider | drawer, between the sections | Drag to give one section more room. Double-click to hand it back |
| Right-click an issue link | the page | **Off by default.** A preference, on the `Appearance` tab. When on, it opens the Cart's own menu instead of the browser's — three entries: add or remove, `Open link in new tab`, and `Copy link to KEY` |

Notes on the controls:

- **The badge counts the active collection, and only that.** So it cannot lie. The
  honesty burden falls entirely on the live list, which reports what it holds and
  labels its own scope.
- **The four copy buttons act on the whole collection.** They are disabled and
  dimmed while it is empty, because a copy of zero items must not write.
- **📋 Details is the only control in the foot that needs the network**, which is
  why it takes two presses: a clipboard write may never come after an `await`
  (§2.8). It is also disabled while ↻ is running, and disables ↻ while it runs —
  both write summaries back, and one request at a time is enough.
- A copy button shows ✅ or ⚠️ for 900 ms. Then `render` puts the label back. 🔍
  Search shows neither: the tab that opens is the receipt.
- **The label is the state**, everywhere: the badge, the floating button, and each
  row. This is the convention `jira-backlog-sprints` uses for `N sprints hidden ▾`.
- **The Cart binds no keyboard shortcut.** `jira-ux-improvements` owns
  `Alt+Shift` + `L/E/N/U/M/I/D/T`. A day of using the prototype never wanted one,
  and the drawer's rows are ordinary buttons, so they are tabbable without a
  binding.
- Buttons are made with `document.createElement`, never with `DOMParser`. See
  [`jira-ux-improvements.user.md` §2.9](jira-ux-improvements.user.md) for what the
  other way costs.

---

## 4. Rejected alternatives

| Alternative | Why the script does not use it |
| --- | --- |
| Modifier+click to add | Every modifier+click already opens the link. The user's own observation |
| A `+` injected into each Jira row | It reflows the row: the line box grows and the summary re-aligns. Reported on four views. The only escape is writing `position: relative` onto a React-owned node |
| Right-click interception, always on | It takes away the browser's own link menu, and Chromium has no bypass. It ships as a preference, off |
| A text regex over the page for bare keys | The user's decision. It costs a project allowlist, a region-exclusion list, and false positives, to find keys that are not links |
| Excluding prose regions from the scan | Correct for a batch add, backwards for manual picking. Reading an issue and wanting the issues its description links is normal |
| `scrollIntoView` to reveal a row | It scrolls **every** scrollable ancestor, and `overflow: hidden` is still programmatically scrollable |
| `resize: both` on the drawer | The UA handle is always bottom-right, which is the pinned corner on the default dock, so the box grows away from the pointer. It also fights `render` for the inline size, and its handle dispatches no pointer event |
| `popover` and the top layer | Nothing of Jira's ever covered the drawer at `z-index: 9999`, and the top layer changed nothing about the one real overlap |
| Escape closes the drawer | Jira binds Escape all over its own UI |
| A viewport-relative cap (`vh`) on a list inside the drawer | It is a number that knows nothing about the box it is inside. Flex, and `min-block-size: 0`, all the way down |
| Sections that shrink in proportion to their content | The collection then starves the live list — the section you pick into squeezes the section you pick from |
| Scroll-and-accumulate to get a whole list | It moves the scroll position, takes seconds, fights a mutating list, and puts a multi-second operation in the add path. The collection is the accumulator instead |
| Remembering rows that scrolled away | A buffer is state that must agree with the page. There is no buffer |
| Reading the list from the API instead of the DOM | The API cannot see the page's filters. It returned 1150 against 25 cards, and 12,816 against 50 rows. It answers a different question |
| Borrowing Jira's `(7 of 27 work items visible)` | A regex over a localised string with no testid, on two views out of seven, whose failure mode is a wrong number in the UI |
| A third drawer mode for scan results | Scanning is not an action. There are exactly two standing sections |
| Multi-select, and per-row copy | The collection **is** the selection. A second selection mechanism would cost every row a checkbox in a narrow drawer |
| An `activeId` pointer | It can point at a deleted collection. `collections[0]` cannot dangle |
| One storage key per collection | It needs an index key, and an index can disagree with the keys beside it. That is the bug both existing ADRs were rewritten to remove |
| `items` as a map keyed by issue key | The add path does the lookup anyway, and an array keeps ordering open |
| `BroadcastChannel` for cross-tab | The value-change event is emitted **because the write happened**, so a writer cannot forget it — including a tab running an older build. `BroadcastChannel` is a second signal that must be kept in agreement with the write, and it is untested on this origin |
| `navigator.locks` around a write | It makes every write asynchronous to close a window of microseconds. One person has one pair of hands. Read-modify-write is what closes the reachable bug |
| Storing a `failed` flag on an item | The failed state is the result of the last attempt, not a property of the item |
| Storing `status`, `issuetype`, `addedAt` or `fetchedAt` | Not uniformly available from the DOM, or already carried by array order, or a freshness claim we cannot honour |
| Refreshing every summary when the drawer opens | The user chose gap-fill plus an explicit refresh. The cost — a week-old title — is accepted and has a control |
| `navigator.storage.estimate()` | It reports the origin's whole storage budget, so it would report gigabytes of headroom with a wall one item away |
| `navigator.permissions.query` before a clipboard write | Firefox and Safari reject the permission name. The promise rejected unnoticed and the copy silently never happened |
| `GM_setClipboard` | It needs no user activation, but it writes one flavour per call, which would cost Links its HTML twin |
| The `GM.*` promise-based API | An `await` in the copy handler puts the clipboard write outside its user activation |
| Bare URLs, one per line | Links with the summary removed. Its only distinct paste target cannot be named. **OVERTURNED on 2026-08-25, and the ground was the naming.** The target is **a destination that does not render markdown**, where `[KEY](url)` arrives as its own source code with no link to click. It ships as the `URL only` shape of §2.8, and a real paste confirmed a visible URL survives Outlook and Teams and arrives clickable (A.9.1). It costs no slot in the spanning set, because it is a **preference over one format's head** and not a sixth format |
| `[KEY] Summary — URL` | Links' three fields with different punctuation. **OVERTURNED on 2026-08-25** (decision 4). "Different punctuation" is exactly the point in **a destination that does not render markdown** — the user named the target this row could not. It ships as `Key, summary, then the URL`, and its punctuation is **`KEY: Summary - url`** rather than this row's, for two reasons worth keeping: no brackets, because in that destination they read as the leftover markdown the shape exists to avoid; and a hyphen rather than an em dash, because 📋 Details and 📊 Report already spend the em dash on the boundary before the field tail (§2.8, A.9.1) |
| Copying the JQL instead of opening it | Every use of it ended in the same paste into Jira's search box, so the button goes there instead. The query text is one selection away on that page, and its URL is the better thing to share |
| The collection's name as a heading in a copy | Redundant where you paste, wrong for a selection, invalid inside Keys and JQL, and it breaks *lines equals items* |
| A template engine for the formats | Names' summary-less line is a different line shape, not a substituted value. Templates would be a rewrite of this layer |
| `localStorage` for the collections | It dies on a logout or a history cleanup |
| A mirror into Jira's own user properties | Two copies of the user's data that can disagree, a reconciliation rule, and a 32,768-byte ceiling — all to avoid a grant that is free. Preserved at `10a` Part 5 |
| A Chrome extension | It reads the same DOM and calls the same endpoint, and costs a manifest, a service worker, a build step and three install stories. Its users already run Tampermonkey |
| A shared library with `@require`, or a build step | Tampermonkey and GitHub's raw server both cache the file. A version in the URL needs discipline; a build step means `src/*.user.js` is no longer what you install |
| Client-side navigation from the drawer's key links | Jira's router is per-element, so our anchor is invisible to it; being seen would mean living inside React's root, where React can delete the drawer. `pushState` needs page context a `@grant` does not have, and a half-honoured push shows a changed URL over a stale view (appendix A.7) |
| `watchRoute` | A strict mirror has nothing to forget on navigation, and the collections are in storage |
| **A table for the detailed export** | Built as a decision and killed before a line shipped. Slack has no tables at all, Teams handles a pasted one badly, and a pasted table cannot be reordered by hand — which the recipients of these reports do. It wins in four destinations and loses in the two where people actually chat (§2.14) |
| **Storing the detailed fields on the item** | It would buy one press and cost the thing that matters: status, assignee and priority change hourly, so a stored detail is a claim about last week that reads like a claim about today. Held in memory it cannot be stale by construction. It also keeps §2.4 untouched, so there is no migration (§2.14) |
| **Muting a field with `opacity`** | Adapts to any ground automatically, which is exactly what the light-versus-dark problem wants — and Outlook and Teams both strip it, so every muted field came back full-strength black with no hierarchy at all. Measured 2026-08-20 |
| **A saturated status lozenge** | Tried because the pale `Done` mint was invisible on white paper. Teams **discards** a saturated ground and re-maps the white text to its own skin, so the pill lost its ground *and* its colour and arrived as bold black. Making a pill bolder so it survives is backwards; the fix is a stronger tint (§2.14) |
| **A bordered chip as a separator** | Outlook strips an inline `border`, and two fix versions divided by a space then read as one nonsense version. A separator must be a character |
| **Naming the epic only on its first appearance in the list** | It kills the repetition neatly and is wrong the moment somebody reorders the pasted list, with nothing to say so. Nothing may depend on a row's position (§2.14) |
| **The epic's summary, truncated, on every line** | Asked for, built, and measured: 21 characters a line on average, identical on three of six rows, and it pushed rows onto a second wrapped line. The fault is repetition, not length, so a shorter cut does not help. The key is a link instead |
| **Equal-width columns for all six foot buttons** | It would stop the reflow too, and by making every button as wide as the widest -- 🔑 Keys as wide as 📋 Fetching… -- so the row wraps sooner and the foot is permanently taller at the drawer's minimum width. Reserving only the two buttons that need it costs nothing anywhere else |
| **Carrying the two-step state in the emoji alone** | `📋 Details` → `⏳ Details` → `✅ Details` needs no reserved width and nothing to keep in step, and it is NOT actually constant-width: emoji differ, and ⚠️ carries a variation selector. It would shrink the jump without removing it, and it moves the state from words to an icon, which is weaker than the rest of this UI |
| **Reserving room for the item count** | Keeps `Copy 12 items` and stays stable, at the price of both buttons sitting about 100px wide for ever, which wraps the foot at almost any drawer width. The count is on the collection's heading two lines above, so the label is not where it has to live |
| **One fetch arming both stepped buttons** | Shipped for a day and reversed from use. The held result really does describe the collection rather than a button, and that argument is still right about the DATA -- it was wrong about the CONTROL, because pressing one button and watching another change state is broken however correct the state is. Per-button arming costs one extra request when both are pressed in turn, and deleted the render-before-flash it had required (§2.15) |
| **A column picker for the detailed export** | A setting that silently changes what a button produces is what §2.8 warns about, and a fixed output is checkable. If a second shape is ever wanted it is a second entry, not a switch. **OVERTURNED on 2026-08-25.** The ground is answered rather than dropped: the setting is not silent (a row of checkboxes in ⚙, on a tab named after the button), the output is still a fixed function of it, and every reachable combination is checkable — what changed is that there are more of them. It ships as **two ordered field lists over one catalogue** (§2.14), and the line it does not cross is the one §2.8 drew: a preference may say *which* fields and *in what order*, never what a field looks like |
| **A settings panel sharing the box with the two sections** | Measured, not argued. About 22 controls in a drawer that can be 300×215, where every container is `overflow: clip`, so the surplus is **silently truncated with no scrollbar to say so**. That measurement is what turned a strip into a screen (§2.9) |
| **A drawer that grows when ⚙ opens** | It reflows on a press, which is the defect §2.14 spent a day removing from the foot — and the growth would have to be undone on the press that closes it, so pressing the button twice would move the drawer twice |
| **✕ meaning "go back" on the settings screen** | Two values that disagree wearing a different hat, and it leaves no way to close the Cart from that screen at all. ⚙ is the way back, and it is the button that put you there |
| **One long scroll for the settings panel** | Prototyped. Twenty-two controls in one column means the thing you came for is usually off-screen, and there is no landmark to scroll to |
| **Collapsible groups with a remembered open set** | Prototyped, **chosen, and then reversed by use.** Every visit starts with a decision about which group to open, the remembered set is a second piece of state that can disagree with what is on screen, and a group added later arrives collapsed — where a new tab arrives visible (decision 21) |
| **↑↓ buttons instead of a drag for the field lists** | Recommended, and declined by the user on 2026-08-24. The cost is stated rather than hidden: no harness in this repo can drive a drag, so `moveField` must be pure and covered, and §7 gains a browser step (decision 26). **Two words of this have since been overtaken** — the function is `moveInList` now, and 1.4.0 showed a drag *can* be driven in `boot-smoke` (§2.9.1). The decision is unaffected: the cost was real when it was weighed, and these rows are still driven by nothing but a hand |
| **A fix-version band named by the JOINED version string** | It keeps *lines equals items* exactly, which is the property the chosen answer spends — and it produces the heading `Flex 2026.6.x (LTS track), Flex 2026.9.0`, which groups only the issues carrying that exact pair. **So a release section does not list the release**, which is the only reason anybody groups by one. The property was worth less than the report (§2.15, decision 15) |
| **A fix-version band on the FIRST version only** | Also keeps *lines equals items*, and it **drops a fact about the issue silently** — the issue really is in both releases and one section will not say so. Worse, *which* band it lands in depends on the order Jira happened to return the array, so the same collection can group differently on two presses with nothing to say why |
| **Banding 📊 Report by the status NAME** | The names are this instance's own wording, so the band order is `Dev In progress`, `Dev Resolved`, `To Do` — alphabetical noise dressed as a workflow. The category is already fetched, it is Atlassian's fixed three, and it is what a rank can safely be written over (§2.15, decision 13) |
| **Both band dropdowns greying out each other's field** | The tidiest-looking answer to the duplicate defect, and the one that never moves a control you did not press. It costs **three clicks to reorder a report** — `Then by` to `None`, `Group by` to the field, `Then by` back — through an intermediate state that exists only to get around the rule. Reordering is what the two dropdowns are FOR, so the version that makes it one press wins even though it moves a second control (§2.15, 2026-08-25) |
| **A duplicate clearing `Then by` to `None`** | Simpler to explain than the swap and it throws a field away: the sub-band you had is gone and you re-pick it, which is two presses for the reorder and a value lost in between. The swap costs the same one moved control and keeps both fields |
| **Time remaining as a band** | It is a field like the other seven and it is the one that may not band: the order would be string order over durations, and `"10m" < "2d" < "9h"` is a report that reads as broken rather than as configured (decision 14). It stays a row field, where a duration is read and never sorted |
| **Putting the copy button between the `+` and the link** | It is the obvious place — nearest the pointer's approach — and it moves the `+` 28px further out. The `+`'s distance from the key has been the same since 0.1.1 and its SIDE was reversed into from a day of use; spending a week of habit to make room for a new control is the wrong way round. The copy button is on the outside, and the rail reverses its row on the flipped side so this stays true there too (§2.7.1, 1.3.0) |
| **Two separately placed fixed buttons instead of one rail** | Less code and one less element. It also leaves a 4px gap that belongs to the **page**, so a `pointerover` in it starts the grace period and takes the affordance away while the pointer crosses between the two halves of its own control |
| **A fixed shape for the copy button — always `[KEY](url) Summary`** | Predictable, and it makes `Issue reference` a setting that governs three exports and not the fourth thing that writes a link. Two places would then decide what a collected issue looks like, and somebody who set `Key and URL, no summary` because their destination does not render markdown would get markdown from this button anyway |
| **A bare URL, always, matching Chrome's *Copy link address*** | The most predictable answer and the closest to the browser's own gesture. It puts the ⚙ setting out of reach of this gesture entirely, and `URL only` is already one of the five shapes — so choosing it costs one dropdown instead of costing everybody else the setting |
| **Reading the STORED summary when the hovered issue is already collected** | It never loses a summary, and the store's may be fresher than the page's (that is what ↻ is for). It also means the same hover copies different bytes before and after an add, which reads as a defect — and it makes `+` and `🔗` disagree about what the issue is called. The page, through the same six tiers, for both (§2.7.1) |
| **A grip handle as the only drag target on a collection row** | It keeps mouse text selection and names the gesture where the gesture is. It costs a column in a 380px drawer whose summaries already ellipsise, and it differs from the field lists' whole-row drag for no reason a user would perceive. **Half of the case for it evaporated the same day**: it was also going to preserve the key link's native drag-out, and `setData` per type gave that back to the whole-row version anyway (§2.9.1, 2026-08-25) |
| **Letting the key link's native drag-out simply be lost** | What the first draft of §2.9.1 shipped, with the loss recorded honestly as a cost of the whole-row target. **Reversed the same day by the user, in one question**: `setData` is callable once per type, so the drag can be our reorder and a link at the same time. Worth keeping in this table because the cost was stated clearly and accepted, and it was still avoidable — a stated cost is not a paid one, and nobody had checked |
| **A bare URL as the dragged-out payload, matching what the anchor used to drop** | Nobody's habit changes, and it is the most predictable thing to drop. It puts a second decision about what a collected issue looks like in a second place, out of reach of `Issue reference` — the same defect §4 rejected for the `🔗` button two rows above, and `URL only` is already one of the five shapes for anyone who wants exactly this |
| **An always-visible ⠿ on every collection row** | **Recommended, and declined by the user on 2026-08-25**, in favour of one painted only on hover. The recommendation was consistency with the field rows; what the user wanted was a quieter list. The cost moved rather than vanished: the width is still reserved on every row, because giving it back when the glyph is quiet would re-ellipsise the summary under the pointer — so what was bought is silence, not space |
| **↑↓ buttons on collection rows instead of a drag** | The same shape declined for the field lists in decision 11, and with a better case here: this is user data, and it would be drivable by a harness with no synthetic drag at all. Declined for the same reason as before, plus one — two more controls on every row of the narrowest list in the drawer (§2.9.1) |
| **Carrying the collection's id in the drag, to guard against the active collection changing mid-drop** | Written, and then deleted before it shipped. The scenario needs a click in another tab while a mouse button is held down here, which one pair of hands cannot do. It would have been a guard against a state no user can reach, and the record would have kept a hazard for the next reader to budget for (§2.9.1, 2026-08-25) |
| **A sort-by-key button beside ↻** | Offered with the drag and declined. One press to order a list is better than fifty drags, and it silently destroys a hand-made order with no undo — which is precisely what this section's two destructive controls are armed against. Sorting stays in §6 item 7 |
| **Reordering the collection chips by drag** | The neighbouring gesture, and it contradicts §2.4: the first chip is not decoration, it is the collection an add goes into, so dragging a chip would silently switch collections |
| **Letting a new add land at the top once the order has been touched** | It puts the thing you just did where you can see it. It makes the add path behave differently depending on state nothing on screen shows, and §2.9 had already rejected newest-first for this list because it disagrees with the paste |
| **No summary at all from the copy button** | It removes the question. It also makes two of the five shapes silently stop carrying a summary from this one button, which is a setting that quietly fails to apply — the exact failure §2.14 warns about |
| **Shipping the copy button with no switch** | Fewer knobs, and it takes nothing away, which is the test every other switch here was chosen by. But it does cost **room**: the rail is 52px instead of 24px over the row's own left margin, and on the issue-search table that may reach the selection checkbox. That is a cost use can find and nothing here can measure, so the switch ships with it rather than after it. It is on by default (§2.7.1) |
| **A toast for a copy made from the right-click menu** | The menu closes on every entry, so a copy made there has no receipt when the rail's copy button is switched off. A toast would fix it and would be the only thing in the script that used one — for a corner of a preference that itself ships off. Recorded as a cost instead |

---

## 5. Risks and limits

1. **Atlassian `data-testid` values.** The Cart names about a dozen of them: four
   rows, four summary fields, the issue view's own heading, the backlog's
   screen-reader twin, and two more for origin labels. Atlassian can change any of
   them. **The detector depends on none of them**, so a rotted name costs a summary
   or a decoration, never a found issue.
   `reportBrokenContract` puts a badge on the page, because the developer tools are
   closed when the user collects links.
2. **Cookie authentication on the REST API is undocumented and unsupported.** It is
   what Jira's own front end does, and it is not a contract. If it goes away, an API
   token in storage works the same, and the DOM already supplies most summaries.
3. **The collections live in one browser profile.** They survive a logout and a
   history cleanup. They do not survive uninstalling Tampermonkey, switching
   browser, or moving machine, unless Tampermonkey's own cloud sync is on — and
   **that claim has never been re-verified**, because Tampermonkey's documentation
   could not be read (twice). **Copy-out is how the data leaves the browser.**
4. **A collection left for a week copies with week-old titles.** Nothing may fetch
   in the copy path, so the remedy is the ↻ control.
5. **The store's size ceiling is unmeasured.** No probe found where `GM_setValue`
   refuses a value, and the documentation cannot be read. At the expected scale of
   20 to 50 items this does not matter, and that is a judgement rather than a
   number.
6. **The live list is never the whole list.** Every Jira list view unmounts rows
   behind you. The label says `On this page`, and it means it.
7. **The dashboard gadget was never surveyed.** It was not present on the instance.
   The one question that decides it is whether the gadget is inside an `<iframe>`;
   if it is, the view is out of reach without extra `@match` work, and no selector
   strategy changes that.
8. **The floating gesture is hover-only.** It has no answer for touch, and the
   keyboard path was never designed. The live list is the click-only path to the
   same add.
   **THE KEYBOARD IS A STATED LIMIT, NOT A GAP. Decided on 2026-08-19, by the
   user: the Cart is not intended to be operated by keyboard input.** An audit of
   every focusable control at 1.0.0 found that it can be, mostly, and that fact is
   recorded so that nobody mistakes the three shortfalls below for defects. Body
   order is badge → the hover rail (hidden, so skipped) → drawer, so Tab from the
   badge lands in the drawer with no focus trap needed, and every action has a
   focusable control: add and remove, rename, empty, delete, activate, create, all
   four foot buttons and all three preferences.
   **1.3.0 put a SECOND button in that rail** (§2.7.1). It changes nothing here: the
   rail is `hidden` whenever nothing is hovered, so Tab still skips the whole box, and
   both buttons inside it are reachable in the same circumstances the `+` alone was —
   which is to say while a pointer is holding the rail open. The copy button is
   therefore in exactly the same standing as the `+`: focusable, ringed, and not part
   of a keyboard path that was never designed. Three shortfalls, each accepted:
   closing with ✕ destroys the focused element, so **focus falls to `<body>` and
   the keyboard user loses their place**; the key link and the row body are **two
   tab stops per row**, so a twenty-row live list costs forty; and the Cart's own
   right-click menu is appended after the drawer, so it has **no practical keyboard
   path** — it ships off. Resizing and re-proportioning stay pointer-only, which
   §2.11 defect 4 already decided. **This was audited, not walked in a browser.**
9. **The prototypes ran under `@grant none`.** Their placement, positioning,
   coexistence and remount findings are DOM and CSS behaviour, which Tampermonkey's
   sandbox does not touch, so they should transfer. *Should* is reasoning. The build
   session confirms it cheaply.
10. **The drawer below a laptop screen is still untried in a browser, and the
    clipping it hid is fixed. Settled on 2026-08-19, at 1.0.0.**

    **The numbers, re-derived from the stylesheet, and one of the old ones was
    wrong.** The collection section's unshrinkable parts are **135 pixels**: its
    heading 32, one row of chips 29, the create field 35, the copy foot 38, and its
    own top border 1. The document said "about 130", which was close enough. It then
    said those parts had 61 pixels — 38% of a height of 160 — and **that number was
    generous, because the basis does not resolve against the drawer.** It resolves
    against the **body**, which is the drawer less its two borders and less the
    35-pixel head, and the 5-pixel divider comes out as well. The real figure at
    300×160 was **42 pixels for 135**, so about **70% of the section was clipped**:
    the create field and all four copy buttons were gone entirely, because the
    containers are `overflow: clip`.

    **Two more numbers reframed the fix.** Both sections' fixed parts together need
    about **210 pixels**, so below that something must be clipped whatever the basis
    does — and it was **the 62% basis alone** that pushed the nothing-clipped floor
    all the way to about **405**. A minimum tall enough on its own would therefore
    have had to be 410, which removes the short drawer entirely.

    **The fix is both halves, and neither of them is a `min-height`** — §2.11
    defect 3 is the argument against that. **§2.11 rule 7** makes the live list's
    basis yield to a 145-pixel reserve, and **§2.9's minimum height goes from 160 to
    215** — in the stylesheet as well as in the grip's clamp, because the drawer's own
    `max-block-size: 70vh` undercut a JavaScript-only floor on any window shorter
    than about 307 pixels. Together nothing is clipped at any size the drawer can
    reach, and the yield is a **no-op above about 419 pixels**, so normal use is
    unchanged.

    **One part is stated rather than guarded: the chips row wraps.** The 145 counts
    ONE row of chips. Enough collections wrap it, and every extra row asks for about
    27 pixels more, so the floor for "nothing is clipped" rises with the number of
    collections. Sizing the reserve from the chips' own content would be §2.11
    defect 2 in a new costume, so it is not done. The remedies are the two the drawer
    already has: drag it taller, or drag the divider, which can give the collection
    80%.

    **All of these numbers are derived from the stylesheet, not measured in a
    browser.** A three-line probe would confirm them, and it is in appendix C.3.
11. **The Cart exists once per tab.** Several tabs hold several copies of the same
    collection, and their freshness rests on a notification that a frozen or
    discarded tab may never receive. The re-read on drawer open and on tab-visible
    is what covers it. An extension's UI exists once per window, which is why this
    stays on the platform list.
12. **The cross-tab event arrives late**, by an unmeasured amount. It costs a late
    redraw, because the notification is a hint and not the correctness mechanism.
    **That is true of the collections. It was NOT true of the preferences until
    1.0.0, and there it was a defect rather than a late redraw** — no listener was
    registered on that key at all, so the other tab found out at its next render for
    some unrelated reason, and since 0.5.0 one of those preferences is whether the
    drawer is open (§2.5 rule 1, §2.9). A hint that never arrives is not a hint.
    Both keys are listened for now, and the two-tab harness holds four checks on it.
13. **Permission-denied was never observed with a real forbidden key.** The
    conclusion survives either way: Atlassian's own 404 text conflates absent and
    forbidden, so **one** failed state is correct under both outcomes.
14. **Whether `/browse/OLD-KEY` still redirects after a project move is
    unverified.** Nothing depends on it. Without an `issueId` the item keeps a dead
    key and shows the single failed state.
15. **Chromium is the target.** Chrome, Edge, Vivaldi and Opera. Firefox is a
    nice-to-have.
16. **Prose links can be collected by mistake**, because they are deliberately in
    scope. The cost is one glance and one click to remove.
17. **One element of another script also lands in a bottom corner**, and `08` did
    not see it, because its harness examined the top-right and the toolbar.
    `jira-backlog-sprints` puts its contract-warning badge at the bottom-right with
    the maximum `z-index`
    ([`jira-backlog-sprints.user.js:843-847`](jira-backlog-sprints.user.js#L843-L847)).
    It appears only when that script's `Origin Board` marker breaks, which has not
    happened, so the collision is unobserved. If it ever fires, it covers the
    Cart's badge. Read from the code, not measured.
18. **The fallback corner of `jira-ux` was fixed on the strength of this
    effort's harness, not of a Firefox run.** Version 0.3.2 raises the fixed
    corner to `z-index: 9999`. The forced-fallback switch is what showed the
    defect and what shows the repair. A Firefox check is still wanted.

---


19. **THE SURVEY OF SEVEN VIEWS WAS NOT EXHAUSTIVE, and TWO more views have now
   been found by USING the Cart rather than by surveying.** The Team's Timeline tab
   (§2.1) was the eighth, on 2026-08-18. **Rovo search was the ninth, on 2026-08-25,
   and this risk predicted it in as many words.** Both announced themselves the same
   way: a contract warning on a page that worked. Three lessons, all cheap: the
   detector held on views nobody had ever tested it against; **the contract check is
   the thing that finds a new view**, so a warning on a page that works is worth
   reading rather than suppressing; and **a warning is not the whole defect** — on
   Rovo search it pointed at a lost summary, which nothing on the page announced.
   **Expect a tenth**, and this time there is a named candidate rather than a
   guess: `datasource-table-view` is the smart-link table, not a Jira list, so it is
   embedded in issue descriptions and Confluence pages that no survey has opened.
20. **THE FILING DRAG REMOVES SOMETHING AND CANNOT WARN FIRST (§2.9.3, 1.6.0).** Every
   other destructive control in the drawer arms itself — ⌫ becomes `Empty 3?`, a chip's
   ✕ turns red and names what goes — and a drop has no second click to arm in. Dragging
   a row onto another collection's chip therefore takes it out of the one you are in,
   with the cursor's `move` as the only warning and dragging it back as the only undo.
   **This is the design the user chose knowingly**, over copy-always, because the
   workflow it serves is filing and a copy would leave `Scratch` full. It is recorded
   as a risk rather than only as a cost because of **one case that looks like a bug**:
   filing an issue the target collection *already holds* removes it from the source and
   leaves the target's count unchanged, so nothing on screen moves except the row
   disappearing. That is the same end state a successful move reaches, and §2.9.3
   argues it, but it is the report to expect. **Ctrl on the drop is the escape and
   nobody discovers a modifier** — the two tooltips are the whole of how it is taught.
21. **AN ISSUE LINK IS NOT DRAGGABLE OFF EVERY VIEW. MEASURED AND CLOSED ON
   2026-08-26, the day 1.6.0 shipped — EVERY view of §2.1 reported, SEVEN YES AND TWO
   NO.** The third of §2.9.3's three sources is the page's own anchors, and this risk
   opened as a guess about the board and the backlog.
   **Both of those work**, and so do search results, child work items, the issue view and
   Rovo search. **The PLANS TIMELINE and LINKED WORK ITEMS do not.** §2.9.3 holds the
   table and the reasoning.
   **THE PREDICTION WAS WRONG IN BOTH DIRECTIONS, and that is the part worth keeping.**
   The two views this risk was written about turned out fine — a card's drag-and-drop and
   a key's link drag coexist — and **both failures came from views this risk never
   named.** A per-view question answered by argument would have got every part of this
   backwards, which makes it the strongest evidence in this document for why a browser
   question gets a numbered step and a table.
   **THE TWO FAILURES DIFFER IN KIND, and only one of them is closed.** The timeline has a
   rival gesture that is a Jira *feature* — dragging a bar changes a date — so ours must
   lose, and that is **declined**. Linked work items has no rival gesture at all, so
   nothing is being taken from us and something is merely stopping the drag from
   starting: that one is **open**, probe C.6 asks the question that comes first (does a
   `dragstart` fire at all?), and one fix is already ruled out — the Cart writes to the
   page only through a stylesheet, so putting `draggable` on a node React owns is not
   available to it.
   **What was at stake was a shortcut and not a capability, and that held on both.** Every
   issue either view draws is in `On this page`, and a live row drags from anywhere on
   the row.
   **And one finding is sharper than anything this risk asked for:** Jira makes a real
   link out of the **key** only. The summary beside it is clickable but is not an anchor,
   so a page drag starts on the key, on every view. §2.9.3 has it.
22. **A DROP WE REFUSED CAN STILL BE DELIVERED TO US, because an ancestor can accept it
   — and it is Jira. Found on 2026-08-26 from the user's report, and fixed the same
   day.** `dragover` bubbles, so a `preventDefault` anywhere above the drawer allows
   the drop, and the `drop` that follows is dispatched at the element under the pointer
   and reaches our listeners. **The drawer is in `<body>`, so its events reach
   `document` no matter what `#jira-frontend` does**, and Jira's board and backlog
   drag-and-drop listens there. §2.9.3 has the correction and both drop handlers now
   re-read what their `dragover` decided, so a refused drop is neither written nor
   consumed.
   **What is still open is the visible half, and it is the user's own question.** A
   refused drag over the drawer shows **no blue line**, which is correct and is our
   whole signal — but **no no-drop cursor appears either**, and that half is the
   platform's. The likely reason is the same second acceptor: if Jira has already told
   the browser the drop is acceptable, the browser has nothing to refuse. **That is a
   hypothesis. Probe C.6 settles it in one paste**, and it is worth pasting because the
   same probe answers whether a Jira card's own drag carries the issue key anywhere we
   could read — which would let a card be grabbed by its summary as well as by its key.

---

## 6. What is deliberately left open

These are not gaps in the design. Each was named, and each was left.

1. **Where `gt-jira-cart.prefs` and `gt-jira-cart.collections.bak` live.**
   **Closed on 2026-08-18: all three keys live in Tampermonkey's storage.** It was
   the one question the build session had to ask before it wrote the load path,
   and §2.4 holds the decision with its reasons. The item keeps its number here,
   because other sections cite it.
2. **Grouping the live list by the page's own sections.** Deferred at the user's
   request. It is blocked on one devtools probe: the element carrying
   `software-backlog.card-list.container.BACKLOG` does **not** contain its own
   cards, so whichever element holds a section's rows must be found first. **The
   snippet is written: appendix C, probe 1.** The flat list is the safe default that
   remains.
3. **Container testids for the description and the comment stream.**
   `.ak-renderer-document` renders both, so one origin label serves both. One probe
   closes it: **appendix C, probe 2.** Never invent a `data-testid`.
4. **Keyboard shortcuts.** Whether the two scripts need a shared convention is
   still open, and it is a separate effort.
   **The second half of this item — keyboard reachability of the drawer — is
   CLOSED on 2026-08-19, as a STATED LIMIT: the Cart is not intended to be
   operated by keyboard input.** The user's decision. An audit at 1.0.0 found the
   drawer is nevertheless mostly drivable, and risk 8 records that finding with the
   three shortfalls it names, so that none of them is later mistaken for a defect.
   The two pointer-only drags stay pointer-only by §2.11 defect 4.
   **A THIRD DRAG ARRIVED AT 1.2.0 — the field lists' reorder (§2.14) — and it has
   no keyboard path either, deliberately.** It is HTML5 drag and drop rather than the
   grip's pointer plumbing, because a reorder wants a drag image and a drop target
   and because Jira's own board drags are pointer-based, so this is the mechanism
   least likely to collide with them. Adding a keyboard path to it and to nothing
   else would say this limit had moved when it has not; if it ever does move, all
   the drags move together, and ↑↓ buttons on the field lists are the shape that
   was already considered and declined (§4, decision 11).
   **A FOURTH ARRIVED AT 1.4.0 — the collection's own items (§2.9.1) — and it is
   pointer-only on the same terms, with one cost this item should name rather than
   inherit.** The other three move a preference or a box; this one moves USER DATA,
   so the case for a keyboard path is stronger here than anywhere it has been
   refused before. It is still refused, and the reason is unchanged: granting it to
   one drag and not the other three would say the limit had moved. **The count in
   this item is now four, and the rule is still all-or-none.**
   **A FIFTH ARRIVED AT 1.5.0 — the collection drags out of the drawer (§2.9.2),
   from its heading and from any chip.** It is pointer-only like the rest, and it is
   the first of the five that is **export rather than manipulation**: it changes
   nothing, in the page or in storage. That makes the keyboard case *weaker* here
   than for the item rows, not stronger — a keyboard user who cannot drag a
   collection out can still press 🔗 Links, which puts the same bytes on the
   clipboard, and the two grabs send nothing the foot row cannot. **So this drag is
   the one place the limit costs a keyboard user nothing at all.** The count is five
   and the rule is unchanged.
   **A SIXTH ARRIVED AT 1.6.0 — adding by drop (§2.9.3) — and it is the most expensive
   one yet for a keyboard user, because it is the first gesture in the Cart that has NO
   BUTTON ANYWHERE.** The other five each duplicate something clickable: a reorder can
   be got at by removing and re-adding, and every export the two drag-out gestures
   perform is also a press in the foot. **Filing an issue into a collection that is not
   the active one cannot be done any other way at all** — the nearest route is switch
   collection, add, switch back, which is three clicks and changes which collection an
   add goes into twice on the way.
   **It is still refused, and the reason is still the one this item has given four
   times: granting a keyboard path to one drag and not the other five would say the
   limit had moved when it has not.** What is different is that this is the first entry
   where the cost is a *capability* rather than a convenience, and that is worth
   recording as the thing most likely to reopen item 4. **If it does reopen, this is the
   drag to serve first**, and the shape is already obvious — the right-click menu
   (§2.9's context entry) is the one surface in the Cart that already names a collection
   and could carry *Add to ▸*. The count is six and the rule is unchanged.
5. **The dashboard gadget.** See risk 7.
6. **Import into a collection** — pasting a list of keys, or adding every result of
   a JQL query. "Add all 12,816 results" belongs here, not to the scan. Search
   results is where it is easiest, and where `09` recommends building it first.
   **THE DROP HALF IS CLOSED ON 2026-08-26 — see §2.9.3.** An issue is added by
   dropping it: from a live-list row, from a row of the collection, or straight off the
   Jira page, onto a collection's chip or into a gap in the item list. This item is
   what §2.9.1 and §2.9.2 both cited when they said adding by drop was not their
   feature, so the citations now point at a closed half.
   **What is still open is the two things this item was really about, and they are not
   the same as each other.** *A pasted list of keys* is a text problem, and §2.1's
   decision stands in front of it: a key typed as plain text is invisible to the Cart,
   so an importer has to decide whether a paste box overturns that for its own input
   only. *Every result of a JQL query* is a fetch problem, and `09` still recommends
   search results as the place to build it.
   **MERGING TWO COLLECTIONS ALSO STAYS HERE, and 1.6.0 spent code keeping it out.**
   A chip drag carries N issue URLs, so once the chips became drop targets a chip
   dropped on a chip would have merged them silently. §2.9.3 refuses it by marker
   rather than by accident, which means the day merging is wanted, **the mechanism for
   recognising it already exists and only the write has to be designed** — and the
   question that has to be answered first is what a merge does to the source, because
   §2.9.3's move already establishes that a drop can empty the thing it came from.
7. **Ordering and grouping inside a collection** — manual reorder, group by epic,
   sort by key. Note that a board card renders its parent epic's **summary text**,
   not its key, so grouping from the DOM would join on a display string. Take
   `parent` from `bulkfetch` instead.
   **The GROUP-BY-EPIC half is CLOSED on 2026-08-25 — see §2.15.** `Parent` is one
   of 📊 Report's seven bands: choose it in `Group by` and the report is sectioned
   by epic, one heading per epic, sorted by the heading as a plain string like every
   other band, with `No epic` last. **The warning
   above is exactly why the band comes from `bulkfetch`.** Grouping read off a board
   card would join on the epic's summary text, so two epics that happen to share a
   summary would merge into one heading and one epic renamed mid-list would split
   into two — a *wrong* report either way. The band groups by the epic's **key** and
   only labels with the summary, which is the same group-by-id, label-by-name split
   the team already had (appendix C.4).
   **What is still open is everything about the COLLECTION itself**, and the
   distinction is the point: §2.15 groups a *document built from* the collection,
   which leaves the collection's own array untouched — its order still survives
   inside every band, as it does in every other format.
   **The MANUAL-REORDER half is CLOSED on 2026-08-25 — see §2.9.1.** The drawer's
   item rows drag, and what they write is the collection's own array, which is what
   every export emits. That is the first time this array has been anything but
   insertion order, and the promise it always carried — *array order is what a copy
   emits* — is what makes the feature worth having. `format-smoke` §18 asserts it
   across all six exports, including that a moved row keeps its new place **inside**
   a 📊 Report band, which is the one export that could plausibly have thrown the
   order away.
   **Sort by key and any grouping of the drawer's own list are still open and stay
   here.** Both were offered alongside the drag on 2026-08-25 and declined: a sort
   silently destroys a hand-made order and has no undo, which is exactly what §2.9's
   two destructive controls are armed against.
   **1.5.0 ADDS NOTHING TO THIS ITEM AND IS WORTH A LINE ANYWAY.** §2.9.2 makes the
   collection *leave* by drag; it does not reorder or group anything. The array the
   item drag writes is still the only order there is, and it is still what every
   export emits — including the one that now leaves by hand rather than by clipboard.
8. **Capture from Bitbucket and Confluence.** Out of scope for this effort, and
   **intended future work rather than a hypothetical** — the user's instruction.
   The store already reaches both, because it is per-script; Confluence Cloud also
   shares the origin. What is missing is the DOM survey, which does not exist for
   either site.
9. **Sync across machines.** Out of scope, and plausibly one Tampermonkey setting
   away rather than a fresh effort — resting on the unverified claim in risk 3.
10. **User-editable export templates.** Deferred, and §2.8 establishes they are a
    rewrite of that layer rather than a configuration of it.
    **STILL OPEN, AND THE FINDING SURVIVED 1.2.0 — amended 2026-08-25.** This is the
    item most likely to be read as closed, because 1.2.0 made the exports
    configurable and a template is what "configurable exports" usually means. It
    shipped **without one**, and the finding is not weakened by that; it is what
    shaped the answer. What 1.2.0 added is a **filter over a fixed renderer**: a
    named shape for the head of a line, chosen from five the script owns, and an
    ordered list of *which* of eight fields to print. A preference may say which
    fields and in what order. **It may never say what a field looks like.**
    That line is where the finding lives, and three things depend on it. `detailChip`
    stays the one place a field becomes bytes, so §2.14's five paste rules — no
    `opacity`, no inline `border`, no separator that is a box, no colour without a
    pale ground — keep a single enforcement point instead of being re-derived inside
    somebody's template. **Every reachable output is still checkable byte for byte**,
    because the set of them is finite: `format-smoke` asserts each of the five shapes
    on each export in both flavours, and the five rules over every string a selection
    can produce. And Names' summary-less line is still a *different line shape*
    rather than a substituted value — the original reason — which a template would
    have to express with a conditional inside itself.
    So the item is unchanged in substance and narrower in scope: what is deferred is
    a user writing the bytes, and what shipped is a user choosing among bytes the
    script wrote. **The day a preference reaches `detailChip`, this item is the one
    to reopen first**, and §4's column-picker row says the same thing from the other
    side.
11. **Two questions the prototypes could not answer by use:** whether the
    right-click preference is ever switched on, and whether the section divider is
    ever dragged. Both shipped because the cost of having them is one CSS rule and
    one listener. **Still open at 1.0.0, and only use can close either.** What did
    change is that the right-click menu is no longer *unexercised*: no session had
    ever switched it on, so until 2026-08-19 not one line of that path had run.
    Seventeen checks now drive it — off, on, the toggle in both directions, *Open
    link in new tab*, our own rows keeping the browser's menu, Escape, and a scroll.
    That says the code works. It does not say anybody wants it.
12. **Whether a backlog section header's total is post-filter.** Nothing reads it.
    Recorded so that a future grouping effort establishes it first.
13. **Whether the drawer's own key links can navigate the way Jira's do.** Opened
    and **CLOSED on 2026-08-18, as DECLINED rather than deferred.** The probe ran
    the same day: Jira's router is per-element, so our anchor can never be caught by
    it, and the two remaining routes are each worse than the full page load they
    would replace. The measurement is in **appendix A.7** and the verdict is in
    §2.9. The item keeps its number, because §2.9 cites it. **It would reopen only if
    Atlassian moved to a delegated router**, which A.7's probe re-tests in one line.
14. **A table, or any spreadsheet-shaped export.** §2.14 chose a list and says why.
    Excel and Sheets take an HTML `<table>` as real cells, and nothing else the Cart
    emits does — so if a spreadsheet is ever wanted this is the gap. **It is one
    entry in the dispatch table**, reusing the same two-step fetch, and the
    column set is already decided: the nine fields of §2.14 in the backlog's own
    left-to-right order. Today the route is 🔍 Search plus Jira's own CSV export,
    which is what it always was. §2.14 cites this item by number.
    **STILL OPEN, AND CHEAPER SINCE 1.2.0 — noted 2026-08-25.** The sentence above
    says the column set *is already decided*, which was the honest form of "somebody
    will have to decide it". They no longer have to: the **field list is built**, with
    a catalogue, an order, a tick per field and a panel that draws it, and a table
    wants exactly that — which columns, in which order. A third list over the same
    catalogue is one more key in `gt-jira-cart.prefs` and one more tab, both of which
    now have a shape to copy. What is still unbuilt is the renderer: a `<table>` is
    where Excel and Sheets differ from every other target the Cart writes to, and no
    paste has ever been made into either. **That is the part to measure first**, and
    appendix A.9 is the model for how.
15. **The report: grouped by priority, then by team. BUILT on 2026-08-20 — see
    §2.15.** The item keeps its number because §2.14 and appendix C cite it. What
    follows is the record of what was open while it was, and the order in its own
    title was corrected: the user's note said team-then-priority and their
    correction said priority-then-team.
    *Originally:* opened on 2026-08-20 by the user, and deferred by them in the same
    breath. The Technology Portfolio Office
    sends these reports to team leads, and they want the issues grouped by team and
    then by priority rather than in the collection's insertion order.
    **What is already known.** A grouped report is almost certainly a **sixth
    export**, not a setting on 📋 Details: headings over grouped rows is a
    different document from a flat list, and a switch that silently changes what a
    button produces is what §2.8 warns against. `P0`–`P4` **sort correctly as plain
    strings**, so priority ordering needs no rank table. And because §2.14 stores
    nothing, adding the field costs one id in `DETAIL_FIELDS` and one `add` in
    `detailBits` — no migration.
    **The field is known: `customfield_15541`**, an Atlassian Teams field, populated
    on 16,697 RDC issues — settled on 2026-08-20 from the project's own create-meta,
    so no browser was needed. **It must be referenced by id and never by name**,
    because this instance has more than one field called Team and a name match says
    only that *a* field answered. **And the value carries a NAME**, measured the same
    day: one object with `id`, `name` and `title` — not an id alone and not an array
    — so an issue has at most one team and a heading needs no second call. **Group by
    `id` and label by `name`**, because the id is exact where two teams could share a
    name. Probe C.4 is closed and holds the payload verbatim. **Nothing blocks this
    item now**, and what is left is the design of the report itself, which is a
    second effort by the user's own decision.
    Grouping also sits against §2.14's rule 4 — nothing may depend on a row's
    position — and the resolution is that grouping is an order the *user asked
    for*, while rule 4 forbids a *field* whose meaning changes with position. Worth
    stating before somebody reads the rule as forbidding this.
16. **A per-export override for the line shape. Opened and deferred on 2026-08-25,
    in the grilling that designed §2.8's five shapes** (decision 5). `lineShape` is
    **one** preference with three consumers, and `format` reads it once per copy and
    hands the shape to 🔗 Links, 📋 Details and 📊 Report — so §2.14's promise that
    the three agree about what a collected issue looks like holds by construction,
    with no second read to fall out of step. An override would let one export differ.
    **The reason it is deferred is that nobody has wanted it.** No session and no use
    has produced somebody who wants 🔗 Links plain and 📋 Details markdown *at the
    same time*, and the shared value is what makes the three agree — so the case has
    to be made before the agreement is spent, not after.
    **The cost, recorded now because getting it wrong is silent.** It is one nullable
    key per export, and **the nullable is the whole design**: a per-export key must
    have a **third state meaning *follow the default***, distinct from *hold this
    shape*. Storing a shape instead — copying today's default into the key the first
    time the export is touched — looks identical on the day it is written and is the
    bug: the export **silently stops following** the shared setting, so changing
    `Issue reference` afterwards moves two exports and not three, with nothing on
    screen to say why. `null` follows; anything else overrides; and the panel has to
    draw that difference, which is a fourth control per tab and not a fourth option
    in an existing one.
    **Where it would go if it is ever wanted:** one key per export tab, beside that
    tab's field list, and the pinned `Issue reference` row stays where it is as the
    default the nulls follow. It reopens §2.8's amendment of 2026-08-25 and nothing
    else.
17. **The settings panel's taxonomy: `Appearance` is a peer of two export tabs.
    Named as a cost and accepted on 2026-08-24, recorded here on 2026-08-25 so it is
    not rediscovered as a defect** (§2.9, decisions 18 and 29). The bar reads
    `Appearance` · `📋 Details` · `📊 Report`, with `Issue reference` pinned above it.
    Two of those tabs are named after **buttons in the foot** and one is named after
    a **kind of setting**, so the bar mixes two ways of dividing the same screen.
    Three structures were prototyped and the alternatives are in §2.9's own table
    with their grounds. Three won because it is the only one where the shared
    setting is not misfiled: `Issue reference` governs all three exports, so a tab
    that owned it would tell a small lie about its scope, and pinning it above the
    bar is what buys the untidy peer below.
    **What would reopen it is a fourth tab**, and the shape of the pressure is
    predictable: the moment a second *kind* of setting arrives — something that is
    neither appearance nor one export — `Appearance` stops being the odd one out and
    the bar has two groups in it, which is when a two-level structure starts paying
    for itself inside 300px. Until then, renaming `Appearance` would be the cheap
    move and it does not help: the mismatch is in what the tabs divide by, not in
    what they are called.
    **Nothing about this is a defect and nothing depends on it.** A tab added later
    arrives visible, because a bar shows every tab whether it has been pressed or
    not (decision 21), so the structure can change without a migration.
18. **Two copy receipts that behave differently, and 1.3.0 left them that way on
    purpose.** The foot's `✅` is written straight onto the button by `flash`, so an
    unrelated re-render can clear it early — §2.8 says so about itself and calls the
    feedback a blink rather than a receipt. The rail's `✅` is a per-session value
    that `render` derives the glyph from, so it lasts its full 900 ms. **The rail's
    is not a nicety; it is forced**: the rail re-renders on every signal the script
    has, because its position comes from the hovered anchor, so a label written on
    the click would be gone within a frame or two (§2.7.1).
    **Why the foot was not brought into line.** It is a change to shipped behaviour
    that nobody asked for, on the one path where §2.8's scar lives, and it would be
    made in the same session as a new feature. The fix is small and known — one
    module-level value per foot button, keyed by kind, derived in `renderFoot` — and
    the reason to want it is that the two now visibly differ: press 🔗 Links and the
    `✅` may blink out early, press the rail's `🔗` and it does not.
19. **Whether a 52px rail covers anything that matters in a real row.** The one
    thing about 1.3.0 that nothing in this repository can answer, and the one to
    press first. `boot-smoke` has no layout, so the rail's placement there is
    arithmetic against a stub rectangle. On the issue-search table the row's left
    margin holds the type icon and then the selection **checkbox**, and the rail's
    outer edge now reaches about 58px left of the key.
    **The remedy is already decided rather than open**, which is why this is an open
    ITEM and not a risk: stack the rail vertically. That is one `flex-direction`, and
    it moves the same argument to the same place — a 24×52 rail leaks about 7px into
    each neighbouring row's own left margin instead of 28px into this row's. The
    switch shipped with the feature so that the answer is recoverable either way
    (§2.7.1). It is §7 step 36.


---

## 7. How to test

There is no test system in this repository. Use these steps in a browser, with
`jira-ux-improvements` and `jira-backlog-sprints` also installed.

**What is confirmed outside a browser, and by what.** Eight Node harnesses hold
**1,372 checks at 1.6.0**, against 372 at 1.0.0: the pure helpers, the store and every
preference it clamps, the (row, key) group, the six formats and the API's response
validation, the whole script against a fake DOM, the generated stylesheet's cascade,
and the script run twice over one store. They pull the real functions out of the file
by brace matching, so they cannot drift from it and a rename breaks them loudly.
**372 at 1.0.0, 485 at 1.1.0, 1,089 at 1.2.0, 1,137 at 1.3.0, 1,279 at 1.5.0, 1,372 at
1.6.0** — 1.2.0 more than
doubled them, and almost all of the 604 it added are in two files: `format-smoke` holds every
byte each setting can reach, and `boot-smoke` drives the ⚙ screen's own controls.
That ratio is what a configurable output costs to keep checkable: the outputs are
still a finite set, and asserting them means asserting all of them.

**1.6.0's 93 checks were mutated the same way, in two runs: 13 single edits, 0
survived.** Eight against behaviour — the move that does not remove, the marker that does
not refuse, the same-origin rule removed, the gap ignored so every drop appends, Ctrl
ignored, the read-only gate removed, and — from the second run, after the user's report
— **each drop handler made to consume a drop it had refused**, which is the defect that
report found — and **five against the stylesheet**, which is
where this feature's invisible decisions live: the chip's ring made a border colour
instead of an outline, the live grip switched to `display`, `user-select` taken off a
live row, the empty list's outline offset made positive so it draws where the parent
clips, and the ring moved after the armed rule so a chip armed for deletion repaints as
a drop target. **A fourteenth edit survived and was a bad mutation rather than a missing
check** — it added a CSS comment and changed no byte, which is the trap this
repository's harness README already records twice. **1.3.0's 48
checks were mutated the same way, on the same day: 14 single edits, 0
survived.** Ten against the script's behaviour and four against the stylesheet, and
the stylesheet ones are the reason that file exists — *the `+` is still a containing
block* is invisible to JavaScript, because a plus whose two bars have escaped to the
viewport's corner still has its children, still has their classes, and still reports
the right state. The full list is in [the harnesses'
README](../test/jira-cart/README.md).

**AND THEY WERE PROVEN ABLE TO FAIL, on 2026-08-25, rather than assumed to be.** A
green harness says nothing until you know its checks CAN go red — `css-smoke`'s first
backtick check could not, and it was green for a fortnight. So 1.2.0's were mutated:
**26 single edits to the script, each naming the claim it was meant to make a liar of,
and every one of them turned something red.** The table is in
[the harnesses' README](../test/jira-cart/README.md), with what the run does **not**
say: several mutations are caught by three files at once, so it proves *something*
goes red rather than that the intended check did, and a claim nobody wrote a check for
is invisible to it. **Two of the 26 had to be written twice**, because the first
version of each changed no byte — the same failure as the backtick check, made again
by the person writing down the rule against it.

**They are committed, since 1.0.0, to [`test/jira-cart/`](../test/jira-cart/):**

```
node test/jira-cart/run.mjs
```

No framework, no `package.json`, no dependencies, and the exit code is the number of
failing files. Each harness also runs on its own, which is the property that matters
when one fails. [Its README](../test/jira-cart/README.md) says what each one covers,
what they deliberately do NOT cover, and which single line in each is the seam if the
Cart ever becomes a browser extension.

**Read the table below as the claim rather than as a pointer to a file.** It says
what was established and what was not, so it stands even if the harnesses are one day
replaced by something else.

| Steps | Standing | What answered it |
| --- | --- | --- |
| 3, 6, 10, 14, 15, 20, 22, 24, 26 | **Confirmed outside a browser** | The whole script driven against a fake DOM: the count is distinct keys and not anchors, a prose link keeps its title, Escape does not close the drawer, all four foot buttons including 🔍 Search on a three-item collection, the empty-collection lockout, a summary-less item staying bare, the naming rules, **the eighth view arriving through the mount signal**, and both armed destructive controls |
| 25, less the middle-click | **Confirmed outside a browser** | Every row's key is a real anchor with an absolute `href` and no action on it, a click on one changes nothing in the collection, and **`On this page` does not double**, because the scan skips the Cart's own UI. The red hover's readability is the cascade check of §2.11, not a click |
| 17, 18 | **Confirmed outside a browser** | The store's four migration rows and every sentence §2.9's table promises, word for word — including the case the storage view actually produces, where a hand-edited blob arrives as an **object** rather than a string |
| 13 (reload), 16 | **Mechanism confirmed outside a browser** | The script run TWICE over one store: a drawer left open comes back open with its size, and a stale tab that adds one item does not write away the five it never saw. **All six are there** |
| 1, 5, 7 | **Needs a live visit to each of the nine views** | Nothing but Jira has nine views |
| 2, 4, 8, 9, 11, 12, 13 (the drag) | **Needs a browser** | Another script's toolbar, a filter, reflow, destructive virtualisation, a React remount, the browser's own middle-click and Ctrl-click, and a pointer on the grip — **including the new 215px floor**, which is where risk 10's arithmetic meets a real layout |
| 27, 28, 29 | **CONFIRMED IN A BROWSER, 2026-08-25, in real Jira** | The ⚙ screen, used rather than read. The panel **scrolls at the 300×215 floor instead of clipping**, which is the one thing no harness here can see and the whole reason a strip became a screen; the tab bar stays put while it scrolls and its three labels do not wrap inside 300px; the two sections and all six foot buttons come back with nothing clipped; the ⚙ stays lit while the panel is up rather than only while it holds the focus, and the head renames both ways; and an add made **from the page while the panel is up** lands with the panel still open on the same tab. **§2.9's remaining `:focus-visible` contingency is left standing rather than struck** — nothing reported a blue ring on the closing click, and nothing reporting it is not the same as looking for it |
| the state half of 27, 28 and 29 | **Confirmed outside a browser as well** | ⚙ hides the body and the foot with it and says so on `aria-pressed`, the head renames both ways, the three tabs and the remembered tab, an unrecognised tab id landing on the first, the two-press restore reaching five keys and no others, and the add-while-open landing without closing the panel. The browser pass above is what says the result is also PAINTED |
| 30 | **CONFIRMED IN A BROWSER, 2026-08-25, in real Jira. Whole** | The line shapes, used rather than read. The pinned `Issue reference` row is above the tab bar with its five options; **all five shapes were pressed on all three exports** and each line's head took the shape chosen; and **the pinned row and its dropdown fit and read at the drawer's 300px floor**, which is the one thing no harness here can see — its widest label is shorter than `Automatic (side by side when wide)`, and that reasoning now has a press behind it. The harness holds the rest: every shape's bytes in both flavours with a summary and without, that the shape table names the same ids as the preference's own vocabulary, and that a stored shape is read **at the press** rather than held in a variable. **The shapes themselves were pasted on 2026-08-24** (appendix A.9.1). And **`Restore export defaults` puts the dropdown back**, pressed the same day — the half worth running separately, because it is a render reading storage rather than a value the handler wrote, which is what a fake DOM models least well |
| 31, less its third and sixth items | **CONFIRMED IN A BROWSER, 2026-08-25, in real Jira** | The field lists, used rather than read. The panel draws both lists, a tick takes, and **a row drags at the drawer's 300×215 floor** — which is the press decision 26 had been answered without, and it came back working, so nobody had to widen the drawer to reorder a list. **A drop from one list towards the other was refused**, which is the one behaviour in this effort that no harness can see at all: it is the platform's own refusal standing because `dragover` declines to `preventDefault`, so there is nothing in the file to assert about. And the two selections a click can now reach that 1.1.0 could not produce were both emitted — **every field unticked**, which gives the issue reference alone with no em dash, and **`Team` ticked**, which reaches 📋 Details for the first time. Team needed no separate paste check: it takes `detailChip`'s default branch, the same plain grey span assignee and fix version have used since A.9 pasted them |
| 31, item 3 | **CONFIRMED IN A BROWSER, 2026-08-25, and half of it RETIRED to the harness** | Ticking, unticking and reordering were exercised repeatedly and reported **working well** — which is the ergonomic half of decision 26, and the opposite of the *fiddly* the decision was hedging against. The item's other half, that 🔗 Links is unaffected, **left this step**: it is bytes with no paint in it, so `format-smoke` holds it instead — a wild selection and an empty one, with all four unconfigurable exports required to come out byte-identical. Worth knowing why that check is not redundant: every other Links, Names, Keys and JQL check in the file runs with the DEFAULTS in place, so they say *these bytes are 1.1.0's* and never *these bytes do not move when a preference moves* |
| 31, item 6 | **STILL WANTS A BROWSER, and it is the cheap one** | Ticking a field **while `📋 Copy` is armed**, to see the label survive it. `boot-smoke` drives it already, in this tab and from another one, so what is missing is only the paint. Listed rather than chased |
| 32, less the fix-version paste | **CONFIRMED IN A BROWSER, 2026-08-25, in real Jira, AND IT IS THE STEP THAT FOUND A DEFECT** | 📊 Report's two bands, used rather than read. The dropdowns were pressed and the grouped reports came back **working**. **The duplicate pair was found HERE and by nothing else**: the ticket shipped `Team` then `Team` reachable and argued in writing that it was harmless — useless, truthful, visible on the paste — and one press said otherwise, which is the whole reason this step exists rather than a table of assertions. The answer, a greyed option plus a one-press swap, was pressed the same day and reported **working well**. Everything about the bytes is held outside a browser and it is the largest block in `format-smoke`: each of the seven as band 1 and again as band 2, every `No …` heading, empty-sorts-last in both bands, the status categories in Atlassian's order and not alphabetically, one non-default pair byte for byte in both flavours, the five paste rules over every pair, and the multi-valued line count — plus `bandPatch` directly, and a sweep proving no press on either dropdown from any starting pair can produce a duplicate |
| 32's fix-version export | **CONFIRMED IN A BROWSER, 2026-08-25** | A report banded by fix version, on a collection holding real issues in two releases. **Reported exported as expected** — so the one output in this effort that breaks *lines equals items* on purpose comes out the way the design says, on real data rather than on the harness's three-row sample, and the repetition read as intended rather than as a fault. That was the open question: the bytes were already held (the line count is items plus one, and the issue is under both headings), and whether a document listing one issue twice looks deliberate is not a thing bytes can answer. **What this run does NOT say**, recorded so it is not read as more than it is: the report was of the export, and **no paste target was itemised** — nothing here records Outlook against Teams for a banded report, the way appendix A.9 does for the chips. The chips inside those rows are unchanged from A.9's own pastes, which is why that gap blocks nothing |
| 32's remaining bullets | **NO REPORT EITHER WAY** | The two dropdowns at the 300px floor, the `KEY Summary` and `Unassigned` wording at the size it is read, and `Restore export defaults` putting both dropdowns back. Listed rather than claimed, and none of them blocks: the first is the same grid step 30 already measured at that width, and the last is held by `boot-smoke` in state if not in paint |
| the FIELD lists' drag | **NOTHING HERE STANDS IN FOR IT** — and the "EVER" that used to be in this cell was withdrawn on 2026-08-25 | This is the cost of decision 11, paid where it falls. What IS held outside a browser is everything on either side of the pointer — `moveInList` (né `moveField`) against the middle, both ends, an out-of-range index, a string index and a no-op; the panel's eight rows, their ticks, the writes they make, and the stored order the panel draws; and every byte string a selection can produce, against the five paste rules. **Whether the drag is usable at the 300px floor is no longer DECIDED but MEASURED** — it had been settled by argument with a fallback ready (decision 26), a row was dragged at the floor on 2026-08-25, and it came back working. The reasoning still stands for the day the panel grows past eight rows. **What changed is the word "ever".** 1.4.0 drove the COLLECTION's drag synthetically in `boot-smoke` (row below), which proves the mechanism was always reachable; these rows were not retro-fitted because the user scoped that out, so this cell now records a gap in the harness rather than a limit of it |
| the COLLECTION's drag, since 1.4.0 | **DRIVEN IN THE HARNESS, except for the pointer** | `boot-smoke` runs `dragstart` → `dragover` → `drop` → `dragend` through the delegated listeners the script really registers, with a rect stubbed per row so "the top half" means something. It asserts all four payload types and their bytes — the internal one carrying a KEY, and `text/plain`, `text/html` and `text/uri-list` against the same literals the `🔗` press is asserted against, so one issue cannot come to have two shapes; that `effectAllowed` is `copyMove`; that the top half marks the gap above and the bottom half the gap below; that dropping below the last row appends; that a release with no drop writes nothing and unfreezes the list; that the drawer does **not** redraw while the pointer is down; and — the one it exists for — that a write landing mid-drag survives the drop, because `update` re-reads before it writes. **Fourteen deliberate defects were reintroduced one at a time, in two runs, and every one went red.** **What is still nobody's but a hand's:** whether a row is comfortable to grab, and whether a fifty-row list auto-scrolls at its edge. That is step 39 |
| 39, less two items | **CONFIRMED IN A BROWSER, 2026-08-25, and itemised rather than taken from "it works"** | Both halves of a row and the append; a row grabbed by its KEY, with the key still opening the issue afterwards; the copy in the new order; the refusal onto `On this page`; and the drag OUT into a plain editor, a rich one or Slack/Teams, **and again after `Issue reference` was changed**, which is the only way from outside the harness to see that one place decides what a collected issue looks like. **The item this step exists for came back working: the list auto-scrolls at its edge**, so §2.9.1's bet on the platform paid and no auto-scroll needs writing. **And the mis-drop hazard did not fire** — a row dropped on the Jira page did not navigate the tab, which §2.9.1 records as *unobserved* rather than *retired*, because Jira's own drop handlers explain it as well as the browser does. **NOT RUN:** the whole step at the 300×215 floor, auto-scroll included — which is the size decision 26's equivalent was actually about — and the two paint items, which were not itemised |
| 33 | **NOT RUN, and it is the cheapest step in this section** | The truncation the ⚙ screen replaces, in devtools, at the 300×215 floor. Every argument for the screen rests on it and nobody has looked at it. It confirms a REJECTED design was as bad as this document says — the one step here with that job |
| 34 | **NOT RUN. Appendix A.9.1 says in its own words what it does not record** | Each of the five line shapes pasted into Outlook and into Teams in both skins, itemised. A.9.1 answered the yes/no that was blocking — a visible URL survives and stays clickable — from the user's own report rather than from a screenshot matrix, so **there is no per-target table for the shapes** the way there is for the chips. Nothing blocks on it, and 1.2.0 shipped without it |
| adding by drop, since 1.6.0 | **DRIVEN IN THE HARNESS, and the accept/refuse decision is now observable too** | `boot-smoke` runs both drop targets through `dragover` → `drop`, with a `dataTransfer` that can be READ — `types` for the accept, `getData` for the drop — which the 1.5.0 stub never had to be. A `dragover` that does not call `preventDefault` **is** the refusal, so the harness asserts acceptance directly rather than inferring it. It holds: every live row draggable with its key opted out and its grip reserved; the live drag's three types and `copy`; a chip taking a drop without becoming active; the move, the Ctrl copy, and Ctrl released mid-drag changing the cursor back; the item carried **whole**, proved by making the stored summary differ from the page's; the duplicate reaching the same end state; the gap above, the gap below, the append with no row under the pointer, and an issue already in the list moving rather than duplicating; and all four refusals — a collection, a payload with no url-list, a foreign origin, and a read-only store. **What is still nobody's but a hand's:** whether an issue link can be dragged off a Jira backlog or board at all, which is risk 21 and step 41's first item, and whether Ctrl is findable. |
| 35 | **Needs Tampermonkey's storage view** | The remembered tab across a reload, and a tab id no build knows landing on the first tab **with content drawn**. `boot-smoke` holds both in state; what is missing is the paint, and this is the one preference whose failure mode is an empty screen rather than a wrong value |
| 36, 37, 38 | **NOT RUN. 1.3.0's own three, and 36 is the one that matters** | The copy button (§2.7.1). What the harnesses hold: that the `+` does not move a pixel when the copy button comes and goes, measured from the rail's own placement rather than argued; that a press reaches **item scope** and writes both flavours with no bullet and no `<ul>`; that the shape is read at the press; that the summary comes off the page through the same six tiers the `+` uses, with its tier on the console; that the flash survives a re-render where the foot's cannot; that the pointer on the copy button leaves the `+` green rather than red; that the switch reads *anything that is not exactly `false` is on*; that exactly one export is marked as the single-issue one; and that the menu's third entry copies the same bytes through the same path. **What none of it can see is layout**: whether the 52px rail covers the issue-search table's own checkbox (step 36, §6 item 19), whether the `🔗` can be picked out beside the blue circle, and what a single line with **no `<ul>` around it** does in Outlook and in Teams — which appendix A.9's whole lesson says is not a thing to reason about (step 37) |
| 19, 21 | **Needs Tampermonkey's storage view, and a real logout** | A hand-edited key, and the event the `@grant` exists to survive |
| 23 | **Needs both** | It is the standing condition on every step above |

**The four fixes nobody had re-checked are now checked, except in a browser.** Each
was reported in use, fixed, and never seen working: 🔍 Search, the eighth view, the
key links, and the ⚙. All four are driven by the harnesses. What a harness cannot
say is whether the browser PAINTS the result — so steps 14, 24 and 25 still want one
pass each, and they are cheap.

1. **The badge appears on every view.** Open an issue, a backlog, a board, search
   results, an epic, and a timeline. The badge must sit in the bottom-right corner
   on all of them, and must not cover Jira's own controls.
2. **It does not fight the other scripts.** On an issue page, `jira-ux`'s toolbar
   must stay where it was. Force its fallback position and confirm the Cart is still
   clear of it.
3. **The live list mirrors the page.** Open the drawer on a backlog. The count in
   `On this page (n)` must equal the number of distinct issue keys drawn, not the
   number of anchors — a backlog card carries two. Scroll. Rows must enter and leave.
4. **Filters are respected.** Apply a filter to the backlog. The live list must show
   only what the page shows.
5. **The summary arrives from the page.** On each of the **nine** views, add a
   link and confirm the item carries a summary. Seven came from the survey; the
   eighth is the Team's Timeline tab and the ninth is Rovo search, both of which
   using the Cart found (§2.1), and **there are now two timelines, which are
   different components**. The tier is in the console at debug level, so each view
   answers in one line: `added KEY to NAME: "…" (tier N)`. **The timeline is the
   interesting one**, and it must not carry the sentence around the link.
   **Since 1.3.1 Rovo search is TWO checks and not one**, because its two regions
   answer from different tiers: a press in the answer card's table must read
   **tier 1** and a press in the results list below it must read **tier 4**. A tier 0
   in the table is the defect 1.3.1 fixed coming back. Confirm the `+` parks beside
   the KEY in that table and never beside the issue-type icon to its left.
   **Expect a tenth view** — risk 19 says the survey was not exhaustive, twice over
   now, and the contract check is what finds one, so a warning badge on a page that
   works is a finding to read rather than an alarm to suppress.
6. **A prose link works.** Open an issue whose description links other issues. Those
   keys must appear in the live list, and must be addable.
7. **The floating toggle.** Hover an issue key. The `+` must appear to its left,
   loud, and centred in its box. Click it. The link must go green and the badge count
   must go up. Hover it again: the `✓` must become a red `−` **before** any click.
   Click to remove.
   **Since 1.3.0 there is a `🔗` on the far side of the `+`, and this step gains one
   line:** with the issue collected, put the pointer on the `🔗`. **The `+` must stay
   green.** A red `−` there is the defect — the copy button would be offering a
   removal you were not reaching for. Steps 36 to 38 are the rest of that button.
8. **Twenty in a row.** Add twenty links without irritation. Nothing may reflow, and
   no row may change height.
9. **Virtualisation costs nothing.** Add a link, scroll it out of view, scroll back.
   It must still be green — with no JavaScript re-applying anything.
10. **The drawer stays open while you work.** Click links behind it. Press Escape.
    It must stay open.
11. **It survives a rebuild.** Change route, switch tab, save an edit to a
    description. The badge and the drawer must still be there, with the same
    contents.
12. **Thirty items still read.** Fill the collection with thirty items. `On this
    page` must keep its share of the drawer, its heading must not be sliced, and the
    list — not the drawer — must scroll.
13. **Resize, and reload.** Drag the grip. The drawer must follow the pointer.
    Widen it past 560px: the sections must go side by side. Double-click the grip: it
    must size itself again. Then reload — **the size must come back, and so must the
    drawer itself, open, on the first paint** (§2.9, reversed at 0.5.0). Close it and
    reload again: it must stay closed. Then **drag it to its floor, which is 300×215
    since 1.0.0**: the collection section must still show its create field and all
    four copy buttons, and it is the live list that gives up its room (§2.11 rule 7,
    risk 10). With four or more collections the chips wrap and that floor rises,
    which risk 10 states and does not guard.
14. **Copy, and search.** With three items, one of them summary-less, press 🔗
    Links, 📃 Names and 🔑 Keys and paste each into a plain editor. **Every paste
    must have as many lines as the collection has items.** Paste Links into
    Confluence: it must arrive as live links. Then press 🔍 Search: **a new tab
    must open on Jira's issue search showing exactly the collection**, this tab
    must stay where it was, and the drawer must still be open on it.
15. **Empty means disabled.** Empty the collection. **All five buttons** must be
    dimmed and must write nothing.
15a. **📋 Details, both presses.** With three items, one of them summary-less,
    press 📋 Details once. The label must become `📋 Copy 3 items`. Press again and
    paste into a **plain** editor: three lines, one per item, each `- [KEY](url)
    Summary — Type · Status · P… · Assignee · Fix version · …`, and the
    summary-less one a bare link. The label must go back to `📋 Details`, so the
    next copy fetches again.
15b. **📋 Details where it is going to be read.** Paste it into **Confluence**,
    into **Outlook with *keep source formatting***, and into **Teams in both the
    light and the dark skin**. Four things must hold in every one of them: the
    status reads as a pill; the metadata is visibly quieter than the summary; the
    two fix versions of an issue that has two are separated by a **comma**; and the
    parent's key is a link that is *not* brighter than the issue's own key. **These
    four are the whole of §2.14's rendering, and they are the reason it exists** —
    each was a real defect found by pasting, not by reading (appendix A.9).
15c. **📋 Details expires.** Press it once so it arms. Now add a link. The label
    must fall back to `📋 Details` — a held fetch that no longer describes the
    collection must never be copied. Repeat with a removal, with ⌫, and by
    switching collection with a chip.
15d. **📋 Details with no network.** Log out in another tab, or go offline. Press
    📋 Details. It must show ⚠️, **must not arm**, and must write nothing. Log back
    in, press it twice: it must work with no reload. Then make one item's key a
    project you cannot see and press twice — it must still copy, that row must
    carry only its key and its stored summary, and its drawer row must say
    `(cannot read)`.
15e. **📋 Details and ↻ do not overlap.** Press 📋 Details and, while it says
    `Fetching…`, try ↻. It must be dimmed. Then press ↻ and try 📋 Details while it
    runs. Also: press 📋 Details on a collection with a summary-less item and check
    the drawer row **gains its summary**, because the fetch writes summaries back
    through the same path ↻ uses.
16. **Two tabs.** Open Jira in two tabs. Add an item in one. The other's badge and
    drawer must catch up, and neither tab may lose an item. Then leave a tab open,
    add five items in the other, return to the first and add one. **All six must be
    there.**
17. **A collection that cannot be read.** Write nonsense into the store's key. The
    Cart must say the stored data could not be read, must start empty, and **must
    not overwrite the nonsense**.
18. **A collection from a newer version.** Set `v` to 99. The Cart must still show
    the collections, and must decline an add with a visible reason.
19. **A dead key.** Add an item, then edit the store so its key is
    `ZZZZ-99999`. Open the drawer. It must show `(cannot read)` for that row, must
    not say "deleted", and must not remove the row.
20. **Logged out.** Log out of Jira in another tab, then open the drawer with a
    summary-less item in the collection. The item must stay bare. **No item may
    receive login-page HTML as a summary.**
21. **The collections survive.** Log out and log in again. The collections must
    still be there. (This is the whole reason for the `@grant`.)
22. **Names.** Create a second collection with the same name as the first. It must
    become `<name> 2`. Rename a collection by clicking its name. Activate it: it
    must move to the front, and the badge must follow.
23. **The console must show no errors, and the page must show no warning badge.**
24. **The eighth view.** Open the Team's **Timeline** tab, beside Backlog and
    Active sprints. **No warning badge may appear** — 37 keys with no row around
    them is what raised one before 2026-08-18. Add a row: the item must carry the
    title beside the key, and the live list must label it `timeline`.
25. **The keys are links.** In both sections, click a key: the issue must open in
    this tab, and the collection must not change. Middle-click another: it must open
    in a new tab, with this one left where it was. Then check a **collected** row —
    its key must stay readable while the rest of the row goes red under the cursor,
    and `On this page (n)` must not double, because the drawer holds issue links now
    and the scan has to skip its own (§2.3).
26. **Emptying, and deleting.** With items in the collection, press ⌫ once: the
    label must become `Empty N?` and **nothing may be removed**. Click a row
    instead — it must disarm. Press ⌫ twice: the items go and **the name stays**.
    Then press a chip's ✕ twice: that collection goes and the next becomes
    active, and the badge follows. On your last remaining collection the ✕ must
    **empty it and not remove it** (§2.4). Leave one armed and wait: after a few
    seconds it must disarm by itself.
27. **The ⚙ screen at the drawer's floor, which is the one thing no harness here can
    see.** Drag the drawer down to its 300×215 minimum and press ⚙. The panel must
    **scroll** rather than clip — put the pointer in it and turn the wheel, and check
    that the bottom of the last tab's content is reachable. The tab bar must stay put
    while it scrolls, and its three labels must not wrap inside 300px. Press ⚙ again:
    the two sections and all six foot buttons must come back with nothing clipped,
    which is risk 10's arithmetic meeting a real layout on the other screen.
28. **The ⚙ says which screen you are on, and the head agrees with it.** Press ⚙: the
    button must stay lit while the panel is up — not only while it has the focus —
    and the head must read `⚙ Settings`. Click elsewhere in the drawer: the button
    must stay lit. Press ⚙ again and the light and the name must both go. **If a blue
    ring still appears on the click that CLOSES the settings**, that is the browser's
    own `:focus-visible` heuristic firing on a mouse click rather than Atlassian's
    sheet, and the remaining fix is to suppress the mouse path's focus on that button
    alone (§2.9).
29. **Collecting keeps working while ⚙ is up.** With the panel open, hover an issue
    link on the page: the floating `+` must appear and adding must work. The badge's
    count must go up, the panel must **stay open on the same tab**, and nothing may
    flicker back to the collection. This is decision 25, and the harness proves the
    state; only a browser proves the paint.
30. **The line shape, end to end.** Open ⚙ and pick each of the five under
    `Issue reference`, going back each time to press 🔗 Links, 📋 Details and
    📊 Report. Every line's head must take the shape you chose, and the three must
    agree with each other. Two things only a browser answers here: whether the
    pinned row and its dropdown **fit and read at the 300px floor** — its widest
    label is shorter than `Automatic (side by side when wide)`, which step 27 already
    confirmed, so this is a check rather than a doubt — and whether **`Restore export
    defaults` puts the dropdown back**, which is a render reading storage rather than
    a value the handler wrote. The BYTES need no browser: the harness asserts all five
    shapes on all three exports in both flavours, and the paste that chose them is
    appendix A.9.1.
31. **THE FIELD LISTS' DRAG, WHICH NOTHING IN THE HARNESS DRIVES.** `smoke.mjs`
    covers `moveInList` directly and this step covers everything between the pointer
    and it.
    **The heading of this step used to say "the one thing in this effort no harness
    CAN touch", and that was corrected on 2026-08-25.** 1.4.0 drove the collection's
    drag synthetically in `boot-smoke` (step 39), so a drag was always reachable; it
    was not retro-fitted to these rows because the user scoped that out. The step
    stands, for the narrower reason that nothing drives it — not that nothing could.
    **Run in a browser on 2026-08-25, less the sixth item.** What the pass added is
    everything a harness cannot see: the paint, the refusal, and the floor — and it
    also retired half of item 3 into the harness, which is the better outcome than
    pressing it for ever. **There are TWO lists and they are separate stores**, so
    run the first bullet on `📋 Details` and again on `📊 Report`: a reorder on one
    tab must leave the other tab's order alone, which is the whole reason they are
    two preferences and not one. Open ⚙ → `📋 Details` and:
    - **Drag a row up and drop it in the TOP half of another row.** It must land
      *above* that row. Drop in the **bottom** half and it must land *below*. The
      indicator must appear on the edge it is going to land on, and the row must not
      change height when it appears.
    - **Drag a row from `📋 Details` onto the `📊 Report` tab's list** — switch tab
      mid-drag if the platform lets you, or drop on the tab bar. It must be
      **refused**: the cursor must say no and nothing may move in either list.
      **PRESSED 2026-08-25: refused.** This is the one behaviour in the effort with
      nothing in the file to assert about — the refusal is the platform's own,
      standing because `onFieldOver` declines to call `preventDefault`.
    - **Press 📋 Details and 📊 Report after the reorder.** The tail must come out in
      the order the list stands in. **PRESSED 2026-08-25**, alongside repeated
      ticking and unticking, and reported working well. ~~and 🔗 Links must be
      unaffected~~ — **that half LEFT this step on 2026-08-25 and went to the
      harness**, where it belongs: it is bytes and there is no paint in it.
      `format-smoke` now stores a wild selection and an empty one and requires
      🔗 Links, 📃 Names, 🔑 Keys and 🔍 Search to come out byte-identical. That is a
      different claim from every other check on those four, which all run with the
      DEFAULTS in place and so only ever said "these bytes are 1.1.0's" — never
      "these bytes do not move when a preference moves".
    - **Untick every field on the `📋 Details` tab and copy.** Each line must be the
      issue reference alone, with no em dash — the same bytes 🔗 Links emits, which
      is decision 9's stated cost. **PRESSED 2026-08-25.**
    - **Tick `Team` and copy.** It must appear, in the same grey as every other
      unadorned field. **PRESSED 2026-08-25.** It needs no paste check of its own:
      it takes `detailChip`'s default branch, which is the same plain grey span
      assignee and fix version have used since appendix A.9 pasted them.
    - **Arm 📋 Details, then tick a field while it is armed.** The label must still
      read `Copy N items`, and the copy must carry the field you just ticked. This is
      "the selection is applied at render, never at fetch" seen from the outside.
    - **At the 300×215 floor**, which is the size the whole ⚙ screen exists for:
      eight rows plus the tab bar must scroll rather than clip, and a row whose name
      and `also a heading` do not both fit must ellipsise the **name**.
      **PRESSED 2026-08-25, AND THIS IS THE ONE THAT CHANGED A STANDING.** The drag's
      usability at that width had been DECIDED and not measured (decision 26): a user
      who finds it fiddly there will make the drawer wider. A row was dragged at the
      floor and the feature was reported working, so **the fallback was not needed**
      and the decision is now a measurement. The reasoning behind it still stands for
      the day the panel grows past eight rows.
32. **📊 Report's two bands (§2.15).** `format-smoke` holds every byte a pair can
    produce and `boot-smoke` drives both dropdowns; **what needs a browser is the
    fit and the paste.**
    **Run in a browser on 2026-08-25, and THIS IS THE STEP THAT FOUND A DEFECT** —
    the duplicate pair, which the ticket had shipped reachable on a written argument
    that it was harmless. Read that as the case for keeping steps like this one:
    every byte of it was already asserted, and none of the assertions was the thing
    that was wrong. Open ⚙ → `📊 Report` and:
    - **At the 300px floor**, read the two rows. `Group by` and `Then by` sit on the
      same grid as `Sections` and `Corner`, and their widest option is
      `Status category` — shorter than the pinned row's widest, which step 30
      already measured. If either wraps, the grid is what to change, not the labels.
    - **Choose `Status category` and copy.** The headings must read `To do`,
      `In progress`, `Done` — in that order, and not alphabetically. This is the one
      rank table in the file and the harness holds the order; what a browser adds is
      that a real collection's categories map onto the three.
    - **Choose `Fix version` on a collection holding an issue in TWO releases, and
      PASTE IT.** The issue must appear under both, and the note under the dropdowns
      must be on screen saying so. This is the one output in the effort where the
      line count deliberately exceeds the item count, and reading it in a real mail
      is what says the repetition looks intended rather than like a bug.
      **PRESSED 2026-08-25: multi-fix-version issues export as expected**, on a real
      collection. The repetition reads as intended, which is the half no harness can
      reach. No paste target was itemised, so nothing here says Outlook against Teams
      for a banded report — see the table above.
    - **Choose `Parent`, then `Assignee` as the second band.** Epic headings must
      read `KEY Summary` and unassigned rows must group under `Unassigned` — the
      wording, at the size it will be read.
    - **Set `Then by` to `None`.** One level of headings, and the sub-heading gone
      rather than left blank.
    - **Open `Then by` and look for the field `Group by` holds.** It must be there
      and **greyed**, not missing — the point is that it says why it cannot be
      chosen. `None` must never be greyed. Then **set `Group by` to the field
      `Then by` holds**: the two must **swap**, in one press, with both dropdowns
      showing the new pair and nothing lost. Press it again and they must go back.
      This is the only control on this screen that moves another one, so it is the
      one to look at rather than read about (§2.15, reversed from use 2026-08-25).
      **PRESSED 2026-08-25 and reported working well** — which is what closed the
      defect the rest of this step found.
    - **Tick `Priority` on the same tab while it is the band.** It must appear on
      the row **as well as** in the heading: the mark says `also a heading` and does
      not veto the tick (decision 8).
    - **Press ↺ `Restore export defaults`.** Both dropdowns must go back to
      `Priority` and `Team`, and the report must emit 1.1.0's bytes again.
33. **THE TRUNCATION THE SCREEN REPLACES, reproduced once so the reason is not
    folklore.** Every argument for making ⚙ a screen rather than a strip rests on a
    sentence — *"a panel that shared the box with the sections would be truncated
    with NO SCROLLBAR TO SAY SO"* — and nobody has seen it. Take the drawer to
    300×215, open ⚙, and in devtools set `overflow: clip` on the panel
    (`div#gt-cart-prefs`, which ships `overflow: hidden auto`). The last group
    must go, **with nothing on screen saying anything is missing** — no scrollbar,
    no cut-off row, just a panel that ends. Put the rule back and the group returns.
    Run this once and write the date here. It is the only step in §7 whose purpose
    is to confirm a **rejected** design was as bad as the ADR says it was, and it is
    cheap because the two states are one devtools edit apart.
34. **EACH SHIPPED LINE SHAPE, PASTED, PER TARGET.** Appendix A.9.1 answered the
    question that was blocking — a visible URL survives and arrives clickable — and
    it says in its own words what it did **not** record: which shape went into which
    of Outlook, Teams light and Teams dark, and which export carried it. This step
    is that table, and the rig is
    [`test/jira-cart/paste-test.html`](../test/jira-cart/paste-test.html), whose
    `Issue reference` instrument emits the script's own five shapes and whose
    `Copy this shape for real` button puts both flavours on the clipboard. For each
    of the five, paste into **Outlook** and into **Teams in both skins**, and look
    for four things:
    - **The key still reaches the issue.** `markdown` and `markdown-key` put the
      link on the key; `key-summary-url` and `key-url` put it on the URL text; `url`
      is the URL alone. In a destination that renders markdown, all five must give
      something clickable — and in one that does not, the three plain shapes must
      still show a URL a reader can copy by hand.
    - **The URL is not rewritten.** Outlook has been seen to wrap long links, and a
      wrapped `https://dalet.atlassian.net/browse/RDC-1513` that breaks across two
      lines is still readable but is no longer one click.
    - **The em dash still marks where the fields start**, on 📋 Details and
      📊 Report. This is the collision A.9.1 accepted with a stated reason: on the
      plain shapes the summary's own ` - ` repeats the URL separator, so the em dash
      is doing more work than it was designed for. Accepting it was a judgement
      about *readers*, and this is where a reader looks at it.
    - **The two trailing spaces survive**, where the shape relies on markdown's hard
      line break.
    Nothing here blocks: 1.2.0 shipped on A.9.1's yes/no. What this step buys is the
    property table the next question will want, and **if it is not run, say so** —
    an unrecorded paste and a paste that found nothing look identical afterwards.
35. **THE REMEMBERED TAB, INCLUDING ONE EDITED BY HAND.** `boot-smoke` holds the
    state and this is the paint. Open ⚙, go to `📊 Report`, and **reload the page**:
    the panel must come back on `📊 Report` and not on the first tab. Then edit
    `gt-jira-cart.prefs` in Tampermonkey's storage view, set `settingsTab` to a
    string no build knows — `"colours"` will do — and open ⚙ again. It must land on
    the **first tab with that tab's content drawn**, not on a blank panel and not on
    a bar with nothing selected. This is the same fall-back-to-a-default rule
    `layout` and `corner` have always had (§2.4), and the reason it is worth pressing
    rather than reading is that a tab id is the one preference whose failure mode is
    an **empty screen** rather than a wrong value.
36. **THE RAIL'S FOOTPRINT, WHICH IS THE ONE THING 1.3.0 CANNOT ANSWER FROM THIS
    REPOSITORY (§2.7.1, §6 item 19).** `boot-smoke` has no layout, so the rail's
    placement there is arithmetic against a stub rectangle: it proves the `+` does
    not move, and it says nothing about what the rail lands on.
    Open **Jira's issue search** — the view whose rows carry a selection checkbox —
    and hover a key in the middle of the list. Then, in this order:
    - **Can you still tick the row's checkbox** without the rail getting in the way?
      That is the whole question. The rail's outer edge is about 58px left of the
      key, and the checkbox is roughly there.
    - Do the same on the **backlog**, the **board**, and a **prose paragraph** in an
      issue description, where there is no checkbox and the margin is emptier.
    - Turn the `🔗` **off** on the ⚙ Appearance tab and confirm the `+` is where you
      have always reached for it. Turn it back on and confirm the same thing.
    **If the checkbox is unreachable, the remedy is decided rather than open:** stack
    the rail vertically, which is one `flex-direction` on `div#gt-cart-rail`. Do not
    re-derive it — a 24×52 rail leaks about 7px into each neighbouring row's own left
    margin instead of 28px into this row's, which is the trade §6 item 19 records.
37. **THE COPY BUTTON, PRESSED, AND THE ONE THING A HARNESS CANNOT SEE ABOUT IT.**
    `boot-smoke` presses it and asserts the bytes, the flash, and that a re-render
    does not clear the flash. Two things are left, and both are paint:
    - **Can you pick the `🔗` out?** It is the page's own surface with a hairline
      border, which is the treatment §2.7 killed once for the `+` on the grounds that
      it cannot be picked out (§2.7.1 says why the case is different here). If it
      cannot be found beside the blue circle, that one CSS rule is the remedy.
    - **Paste it.** Into Outlook and into Teams, and with at least two of the five
      shapes — the default markdown link and one of the URL-bearing ones. The bytes
      are 🔗 Links' own at item scope, which appendix A.9.1 already pasted **as list
      items**; what has never been pasted is a single line with **no `<ul>` around
      it**, and appendix A.9's whole lesson is that the wrapper is exactly the sort
      of thing a target treats differently. Change one thing at a time (§2.14 rule
      5).
    Then, on a **prose link with no row around it**, press `🔗` and read what
    arrives: the reference alone, with no summary, is the correct answer and the
    stated cost of reading the page rather than the store (§2.7.1). Confirm it is not
    a dangling separator.
38. **THE RIGHT-CLICK MENU'S THIRD ENTRY.** Switch the menu on, right-click an issue
    key, and press `Copy link to KEY`. The menu must close, the clipboard must hold
    the same bytes the rail's button gives, and **the `✅` must appear on the rail's
    copy button**, which is up because right-clicking a link means hovering it. Then
    switch the `🔗` **off**, leave the menu on, and press the entry again: the copy
    still happens and **there is no receipt at all**. That is the recorded cost, not
    a defect — confirm it is that and not a silent failure by watching the console at
    debug level (§2.7.1).

39. **THE COLLECTION'S DRAG, AND THE TWO THINGS ABOUT IT NO HARNESS CAN SEE (§2.9.1,
    1.4.0).** Unlike step 31, the wiring of this one **is** held outside a browser —
    `boot-smoke` drives the whole gesture. So this step is deliberately short, and
    everything in it is either paint, pointer feel, or the platform's own behaviour.
    Collect at least fifteen issues, then:
    > **RUN IN A BROWSER ON 2026-08-25, LESS TWO ITEMS, AND ONE RESULT CHANGED A
    > STANDING.** Itemised with the user rather than taken from *"confirmed as
    > working"*, because a use report is not a run of a numbered step.
    >
    > **Exercised and correct:** both halves of a row and the append below the last;
    > a row grabbed by its KEY, and that same key still opening the issue on a click
    > afterwards; the copy after a reorder, in the new order; the refusal of a drop
    > onto `On this page`; and all three drag-out destinations — a plain editor, a
    > rich one or Slack/Teams, and the same row dragged again after `Issue reference`
    > was changed, which came out in the new shape.
    >
    > **THE ONE THIS STEP EXISTS FOR CAME BACK WORKING: the list auto-scrolls** when
    > a row is held at its edge, so the bet §2.9.1 placed on the platform paid and
    > there is no auto-scroll to write.
    >
    > **A mis-drop onto the Jira page did NOT navigate the tab.** Better than the
    > design allowed for — and §2.9.1 says why that is recorded as *unobserved*
    > rather than *retired*, because Jira's own drop handlers are as likely an
    > explanation as the browser's behaviour, and neither was separated here.
    >
    > **NOT RUN, and neither blocks:** the whole thing at the drawer's 300×215 floor
    > — including the auto-scroll, which is the size where the edge strips are
    > closest together and is what decision 26's equivalent was actually about; and
    > the two paint items below, which were not itemised. What a green harness cannot
    > see there is whether the dragged row keeps its ground and its ⠿ for the whole
    > gesture, and whether the indicator stays one line that never changes a row's
    > height. `css-smoke` holds all four of those as rules; nothing holds them as
    > pixels.
    - **Drag a row and drop it in the TOP half of another.** It must land above that
      row. Then repeat into the BOTTOM half: it must land below.
    - **Watch the row you are holding.** It must keep its own background while the
      pointer is on it, and the ⠿ must stay visible for the whole drag — `:hover`
      does not update mid-drag, which is why the sheet paints the grip on the dragged
      row as well.
    - **Watch the row you are NOT holding.** A single line marks one gap, and it must
      move with the pointer rather than leaving a trail. Nothing may change height as
      it appears: if a row jumps, the transparent border has been lost.
    - **Grab a row by its KEY.** It must move the row. If the browser starts dragging
      a link instead, `draggable="false"` on the anchor has gone.
    - **Then click that same key.** It must still open the issue: the drag may not
      have eaten the click.
    - **THE ONE THIS STEP EXISTS FOR — drag a row towards the top or bottom edge of a
      long list and hold it there.** The list must scroll. Nothing in the Cart makes
      that happen; it is the platform's, and §2.9.1 bet on it rather than writing it.
      **If it does not scroll, that is a finding and not a defect report** — it means
      the bet lost and the auto-scroll is ours to write.
    - **Then do the same at the drawer's 300×215 floor**, which is where step 31's
      equivalent surprised nobody but was worth running anyway.
    - **Copy afterwards.** Press 🔗 Links and 📊 Report: the new order must be what
      comes out, and in the report it must be the order **inside** each heading.
    - **Drag a row onto the `On this page` list above it.** It must be refused — the
      cursor says no and nothing moves. Like step 31's cross-list refusal, this is the
      platform's own refusal standing because `dragover` declines to `preventDefault`,
      so there is nothing in the file to assert about it.
    - **THE DRAG OUT, WHICH IS THE OTHER HALF OF THIS STEP (§2.9.1).** The bytes are
      held in `boot-smoke` against the `🔗` button's own literals, so what needs a
      hand is only whether real applications accept them. Drag a row into:
      **a plain text editor** (Notepad, or whatever is nearest — note that some
      builds of Notepad accept only a dropped *file*, which is the app's business and
      not a defect here); **a rich editor** that takes HTML; and **Slack or Teams**,
      which is where these lists actually go. The text must be that issue in the
      `Issue reference` shape, and the row must **stay in the collection** — it is a
      copy, and a row that vanished would mean `dropEffect` reached us wrong.
    - **Change `Issue reference` and drag the same row again.** The dropped text must
      change with it. If it does not, a second place is deciding what an issue looks
      like, which is what §4 rejected twice.
    - **THE HAZARD, LOOKED AT ON PURPOSE.** Drag a row and drop it on the Jira page
      itself — not on the drawer, on the page behind it. **The tab may navigate to
      that issue**, because a `text/uri-list` drop is a link drop and that is the
      browser's own answer to one. Record which browser did what. This was true of
      the key link before 1.4.0 and the target is bigger now; the cost was accepted
      with the type (§2.9.1), so what this item settles is how easy it is to hit,
      not whether it happens.
      > **ANSWERED 2026-08-26, AND THE ITEM ABOVE NAMES THE WRONG OUTCOME.** The
      > browser's answer to a link drop on page content is **a new tab**, not a
      > navigation. Measured with one URL and with four — appendix A.10, rows 9 and
      > 10. So the page you were collecting from survives and the cost is a tab you
      > close. Keep running the item, because *which* browser does what is still
      > worth recording, but stop expecting a lost page.
      > **And one thing this bullet never thought to try turned out to matter more:
      > drop the row into a Jira COMMENT BOX or a description.** It works, and it
      > inserts the link in the `Issue reference` shape. That capability is why
      > §2.9.2 designed a handler to swallow drops on the Jira page and then did not
      > build it.

40. **THE COLLECTION'S DRAG OUT, WHICH IS TWO GRABS AND SIX DESTINATIONS (§2.9.2,
    1.5.0).** The payload is held in `boot-smoke` against the `🔗` button's own
    literals, exactly as step 39's is, so nothing here re-checks bytes. What needs a
    hand is the two new grabs, the clicks they must not eat, and the six places the
    drag lands. Appendix A.10 already recorded every destination once from a rig; this
    step is the same drops made by the real script. **Have two collections, one with
    at least four items and one with none.**
    - **Grab the collection heading, anywhere on it, and drag.** It must lift. Then
      hover it without dragging: the `⠿` must appear, and **nothing on the heading may
      move when it does** — the width is reserved, so a name that shifts sideways
      means the reservation has been lost.
    - **Grab the heading by the collection NAME.** It must drag the heading, because
      a button is not draggable and the platform walks up to the nearest ancestor that
      is. **Then click that same name.** The rename field must open: the drag may not
      have eaten the click. This is step 39's key-link pair, one control up.
    - **With the rename field open, select its text with the mouse.** You must be able
      to. If the heading drags instead, the `draggable` swap on rename has gone and
      the field cannot be edited by pointer at all.
    - **Grab a chip and drag it.** It must lift. **Then click that chip.** It must
      still activate its collection. **Then press its ✕ twice.** It must still arm and
      then delete.
    - **Drag the NON-ACTIVE chip out to a text editor.** What lands must be **that**
      collection's items, and the active collection must not have changed. This is the
      one thing the two grabs do differently and the whole reason chips drag.
    - **Drop a chip inside the drawer** — on the item list, on the other chips, on the
      foot row. **Nothing may happen.** No reorder, no merge, no activation. Like step
      39's cross-list refusal this is the platform's own refusal standing, so there is
      nothing in the file to assert about it.
    - **The empty collection may not drag at all** — neither its heading while it is
      active, nor its chip. A drag that lifts and delivers nothing is worse than one
      that never starts.
    - **THE SIX DESTINATIONS.** Drag the four-item collection into each, and in every
      case the collection must **stay in the drawer** — this is a copy:
      **a plain text editor**, which must get the markdown bulleted list;
      **a rich editor or Teams**, which must get a real bulleted list of live links;
      **a Jira comment box or description**, which must get the markdown list —
      new at 1.5.0 and free, and the reason no handler swallows drops on the Jira
      page; **the tab strip**, which must open one tab per issue;
      **a tab group you made by hand**, which must open those tabs inside it; and
      **the bookmarks bar**, which will give you **one unnamed bookmark of the first
      issue**. That last one is the documented wart of §2.9.2, not a defect — confirm
      it is what happens, so that a later session recognises it instead of filing it.
    - **Change `Issue reference` and drag the same collection again.** The dropped
      text must change with it, for step 39's reason: a second place deciding what an
      issue looks like is what §4 rejected twice.
    - **A read-only store must still drag.** Make the store look like a newer
      version's, the way step 27's equivalent does. The item rows stop dragging and
      **the heading and the chips must not** — a drag out only reads, and it is the
      one operation still safe on a store this version must not write.
    - **At the drawer's 300×215 floor.** The `⠿` must still fit beside a name, the
      count, ⌫ and ↻ without any of them wrapping, and the chip row must still be
      grabbable. This is where step 39's equivalent surprised nobody and was worth
      running anyway.
    - **NOT WORTH RUNNING UNLESS YOU WANT TO SEE IT: a fifty-item collection on the
      tab strip.** It opens fifty tabs. §2.9.2 declined to cap it on purpose, so this
      is the design working, and the only thing to check is that the count in the
      heading told you first.
    > **REPORTED WORKING IN USE ON 2026-08-26, AND THIS STEP IS STILL UNRUN.** The
    > user tried the feature in the browser and said it works as expected. That is a
    > **use report and not a run of the fifteen items above**, which is the
    > distinction step 39's own note was written to keep — a use report says the
    > feature is usable, and these items say which specific things were looked at.
    >
    > **What the use report does cover, because it could not work without them:** a
    > grab that lifts, a payload that arrives somewhere, and at least one destination
    > taking it. Appendix A.10 has every destination measured once from the rig, so
    > the *bytes* and the *targets* are both held elsewhere.
    >
    > **What nobody has looked at:** the clicks the two grabs must not eat — the name
    > still opening the rename, the chip still activating, the ✕ still arming; the
    > rename field's text still being selectable; the drawer at its 300×215 floor;
    > and whether the chip's grab cursor is worth anything under a button that covers
    > it. **That last one is the one to itemise first**, because §2.9.2 already
    > records it as the weakest part of the design and names what to try instead.
41. **ADDING BY DROP, WHICH IS THREE SOURCES AND TWO TARGETS (§2.9.3, 1.6.0).** The
    writes are held in `boot-smoke` end to end — the move, the Ctrl copy, the duplicate,
    the gap, the four refusals — so nothing here re-checks what lands in the store. What
    needs a hand is **whether the gestures can be started at all**, which is the half no
    stub can see, and the one thing about this feature that is not measured anywhere.
    **Have three collections: the active one with at least three items, a second with
    one, and an empty one.**
    - **THE ONE TO RUN FIRST, because everything else assumes it: can an issue link be
      dragged off the page?** Try it on each view and write down what happened, because
      the answer is expected to differ. **The backlog** and **the board** are the ones
      in doubt: Jira runs its own drag-and-drop over those cards, and it may take the
      gesture before the browser starts a link drag. **Search results**, **the issue
      view**, **the timeline**, **linked work items** and **Rovo search** should be
      ordinary anchors. A view where the card's own drag wins is **not a defect** — it
      is risk 21, and the live list covers that view.
      **DONE — reported per view on 2026-08-26, and the prediction above was wrong in
      BOTH directions.** The board, the kanban view, the **backlog**, **search results**,
      **child work items**, **the issue view** and **Rovo search** all work: a card's own
      drag-and-drop and a key's link drag coexist. **The PLANS TIMELINE and LINKED WORK
      ITEMS do not** — and the two failures differ in kind, which is risk 21's table and
      §2.9.3's paragraph. Nothing is left of this item; what replaced it is the
      linked-work-items diagnosis, which is **probe C.6** and not a step.
      **AND GRAB THE KEY, not the summary.** Measured the same day: Jira makes a real
      link out of the key only, so a drag started on the summary carries something else
      and the drop is correctly refused. The live list is the one place where grabbing
      the summary works, because that row is ours (§2.9.3).
    - **Drag a live-list row onto the empty collection's chip.** The chip must ring, the
      cursor must say **copy**, and on release that collection's count must go to 1
      **without becoming active** — the chips must not reorder and the heading must
      still name the collection you were in. The live list must be unchanged: it mirrors
      the page.
    - **Hover a live row without dragging.** The `⠿` must appear and **nothing in the
      row may move when it does** — the width is reserved, so a summary that shifts
      sideways means the reservation has been lost. **Then click that row.** It must
      still add or remove: the drag may not have eaten the click. **Then click its
      key.** The issue must open.
    - **Try to select a live row's summary text with the mouse.** You cannot, and that
      is the `user-select: none` the drag needs — the same cost §2.9.1 paid in the other
      list. Confirm it so a later session recognises it instead of filing it.
    - **Drag a row of the collection onto the second collection's chip.** The cursor
      must say **move**. On release the row must **leave** the collection above and the
      target's count must go up by one. **Now do it again holding Ctrl**: the cursor
      must say **copy** and the row must **stay**.
    - **Press and release Ctrl in the middle of one drag, watching the cursor.** It must
      follow, both ways. The drop reads the modifier at the moment of release, not at
      the grab, and this is the only place that is visible.
    - **Drag a row onto the chip of the collection it is ALREADY in.** Nothing may
      happen at all. **Then drag it onto a chip whose collection already holds that
      issue.** The row must leave the source and the target's count must **not** change.
      That is the end-state rule and it is risk 20 — confirm it is what happens, because
      it is the one case that reads as a deletion.
    - **Drag an issue link off the page into the collection list, aiming between two
      rows.** A line must appear on the edge you are aiming at, and the issue must land
      in that gap — not at the end. **Then aim below the last row**, in the empty space:
      the line must go on the last row's lower edge and the issue must append.
    - **With the collection EMPTY, drop a link on the list.** The whole list must outline
      and the issue must land. This is the one gap a list with no rows still has.
    - **Drop a link for an issue that is already in the collection, into a gap.** It
      must **move** to that gap, not duplicate.
    - **THE FOUR REFUSALS, and each must show the browser's own "no" cursor rather than
      doing nothing quietly.** Drag a **chip** onto another chip and onto the item list —
      **no merge**, and this is the marker of §2.9.2 earning its keep. Drag a **text
      selection** into the drawer — refused, and a key spelled in that text must not be
      collected. Drop anything on the **live list**, the **heading** or the **foot** —
      refused. And with a **read-only store** (make it look like a newer version's, the
      way step 27 does) every drop must be refused while **a live row still drags out**.
    - **Drag a live row out to a text editor.** The `Issue reference` shape must arrive,
      not a bare URL — this row used to be the platform's own anchor drag, and taking it
      over is only worth it if the bytes are better. **Change `Issue reference` and do
      it again**: the text must change with it.
    - **At the drawer's 300×215 floor.** The `⠿` must fit in a live row beside the key,
      the summary and the mark without wrapping, and the chip row must still be a
      reachable drop target. Step 40's equivalent surprised nobody and was worth running.
    - **The gap-fill case, if you can catch it.** Start a drag over a chip and hold it
      while a summary arrives (a collection with missing summaries, drawer open). The
      indicator may repaint; the drop must still land on the chip you were aiming at.
      Nothing freezes here on purpose, and this is the only way to see that it did not
      need to.
    - **THE ONE THE HARNESS CANNOT SEE AT ALL: what the browser draws when it refuses.**
      Drag a card by its **summary** over the drawer. The blue line must **not** appear —
      that is our signal and it is an absence by design. Whether a **no-drop cursor**
      appears is the platform's half, and on 2026-08-26 it did not. **Probe C.6 is what
      diagnoses that**, and it is worth pasting before anything is changed, because the
      likely cause is that Jira accepted the drop above us and there is then nothing for
      the Cart to fix (risk 22).
    > **REPORTED WORKING IN USE ON 2026-08-26, THE DAY IT SHIPPED, AND THIS STEP IS
    > MOSTLY UNRUN.** The user tried the feature, said it works well, and then answered
    > this step's first item **view by view** when asked — which is the whole argument
    > for asking rather than recording "it works".
    >
    > **What the report closed: risk 21, in full, and not the way it was predicted.**
    > Board, kanban, backlog, search results, child work items, the issue view and Rovo
    > search all drag. **The Plans timeline and linked work items do not**, and **neither
    > of those views was named in the risk** — while the two it was written about turned
    > out fine. An answer reached by argument would have got every part of this
    > backwards, which is the strongest evidence in this document for why per-view
    > questions get a numbered step. **It took three rounds of asking to get here**, and
    > each round moved a view from predicted to read.
    >
    > **And it produced one fact nobody had: the key is the only real link Jira
    > draws.** That is now §2.9.3's own paragraph, and it is a better answer than the
    > per-view question this step opened with, because it holds on every view.
    >
    > **What the report FOUND, which is the part worth keeping.** It asked why a refused
    > drag shows no no-drop cursor. Following that question found a real defect in the
    > shipped code — both drop handlers consumed a drop they had refused, because a
    > comment in the file claimed `drop` fires only when our own `dragover` accepted,
    > and `dragover` bubbles. Fixed the same day, with five checks that go red on it, and
    > recorded as risk 22. **The visible half of the question is still open** and
    > probe C.6 is the instrument.
    >
    > **What nobody has looked at:** every remaining item above — the Ctrl modifier in
    > either direction, the duplicate that reads as a deletion, the empty list's
    > outline, the four refusals, and the 300×215 floor. **The per-view item is the only
    > one of the fourteen that is finished.**

---

## 8. Related decisions in this repository

- [`jira-ux-improvements.user.md`](jira-ux-improvements.user.md) — the source of
  the `animationstart` mount detector as used on Jira, the design tokens with a
  dark block, the dual `text/plain` + `text/html` clipboard write, `escapeHtml`,
  `writeClipboard`, `flash`, the 🔗 link format the Cart's Links format repeats,
  the CSS-attribute-on-`<html>` method for state that must survive a React
  remount, and the `@require` rejection this ADR inherits. **Its fallback toolbar
  was invisible behind Jira's navigation** (§2.9), found by this effort's harness
  and fixed in that script's version 0.3.2.
- [`jira-backlog-sprints.user.md`](jira-backlog-sprints.user.md) — the source of
  the label-is-the-state control, the two-witness contract check, the coalescing of
  many mount signals into one frame, and **that ADR's own §2.7** — its argument for
  deleting a value that can disagree with another value, which is the argument `05`
  applied to the whole of this data model.
- `bitbucket-ux-improvements.user.js` — the origin of the `animationstart` method,
  and of the **async-aware `guard`** this script deliberately takes instead of the
  synchronous one beside it (§2.13).
- `jira-show-fixversion-dates.user.js` — the source of the method that puts state
  into a stylesheet so that it reaches nodes React has not built yet, which is what
  §2.7 uses for the collected keys.

**And two directories this effort added to the repository, both at 1.0.0.** Neither
existed before it: the repository was `src/` and nothing else.

- [`test/jira-cart/`](../test/jira-cart/) — the seven harnesses and their runner.
  **This is the first executable check of any kind in this repository**, and it takes
  no framework and no dependency to be one, which is the same argument §2.13 makes
  about the duplicated helpers. If another script ever wants harnesses, `test/<name>/`
  is the shape.
- [`docs/jira-cart/`](../docs/jira-cart/) — the working record. Ten tickets, seven
  research passes, and the prompts that staged the effort. **Evidence, not authority**:
  see the note in "About this document".

---

## Appendix A — The measurements, and their dates

Every figure below was taken live on `dalet.atlassian.net`, by the user, on the date
given. They are here because the tickets that hold them are not in this repository,
and because a decision without its measurement invites a rewrite. Where a figure is
**reported rather than tested**, it says so.

### A.1 The API, 2026-08-10

| What | Result |
| --- | --- |
| `GET /rest/api/3/issue/{key}?fields=summary,status,issuetype,parent` | `200`, `application/json`, the summary as a string. No token, no `credentials` option |
| The same call, logged out | **`200`, `text/html`, Atlassian's login page** |
| `POST /rest/api/3/issue/bulkfetch`, logged out | `400`, JSON, `{"message":"","status":400}` |
| `POST …/bulkfetch` with a real key and `ZZZZ-99999` | `200`, one issue back, **the absent key in neither `issues` nor `issueErrors`, which was `[]`** |
| `status`, `issuetype` | Present, as nested objects |
| `parent`, requested on an Epic | **Absent from the response.** A missing field is normal |
| 100 keys per `bulkfetch` | **Reported, not tested.** Unreachable at 20 to 50 items |
| Rate limits | **Not tested**, deliberately: a collection is one request |
| `GET /rest/api/3/search` | Gone, not deprecated |

*Provenance caveat, recorded because it changes nothing and would otherwise look
like a hole:* logged out, the site redirects to `id.atlassian.com`, so the
`200`-plus-HTML row may have been answered by that host rather than by
`dalet.atlassian.net`. The hazard is identical either way — a redirect that lands
the page on a host serving `200 text/html` for every path — so the validation rule
is mandatory under both readings.

### A.2 The DOM, 2026-08-10, seven views

| What | Result |
| --- | --- |
| `data-testid` per page | 765 to 1742 |
| `data-test-id`, hyphenated | 0 on most views, 1 to 15 on Software views. A legacy component, not the convention |
| `meta[name="application-name"]` | `"JIRA"` on every view |
| `a[href*="/browse/"]` | Hit **all seven views**. No exception |
| `[role="dialog"]` with the detail panel open | **0.** The panel is not a dialog, and its breadcrumb testids are identical to the full issue view's |
| The backlog card | Carries **two** `/browse/` anchors: the visible key and a screen-reader twin |
| The board card | Carries the key in its DOM `id`, `id="card-RDC-21496"` |
| The detail panel over a backlog | `selectedIssue=RDC-3889` in the query string |
| Timeline rows | `data-issue="654282"` — the numeric **id**, not the key. The key is only in the `href` |

Virtualisation, before and after one scroll:

| View | `/browse/` anchors | Distinct keys | What the page claimed |
| --- | --- | --- | --- |
| Backlog | 41 → **33** | 21 | the sprint header said 27 |
| Board | 32 → **27** | 25 → **20** | — |
| Timeline | 42 → **19** | — | — |
| Search results | 36 | 30 | "50 of 1000+" |

**Every list view is destructively virtualised. There is no exception.** The board
was the last candidate for "short enough to be fully mounted", and its sample key
changed across the scroll.

### A.3 Storage, 2026-08-13

| What | Result |
| --- | --- |
| `window.localStorage` on `atlassian.net` | A **plain object**. `instanceof Storage` is `false`, the constructor is `Object`, **`length` is a method** |
| Is the wrapper faithful? | **Yes.** A write through it produced a real cross-tab `storage` event whose `storageArea` **is** a native `Storage` |
| Can the native accessor be recovered? | **No.** Atlassian overwrote the property rather than shadowing it, so `Window.prototype` has no getter to borrow. A same-origin iframe would work and is untested |
| `storage` events on an idle Jira tab | **~100 in a couple of seconds** |
| Jira's own usage, 629 keys | 1,347 K chars, ~2.63 MB — about **half** a ~5 MB origin quota |
| — of which `quick-find-recent-activities` | 977 K chars, **72%** of Jira's share |
| The Cart at 50 items | 5.9 K chars |
| The Cart at 1,000 items | 117 K chars |
| `GET …/issue/RDC-9999999` | `404`, *"Issue does not exist or you do not have permission to see it."* |
| `POST …/bulkfetch` for the same key | `200`, `issues: []`, `issueErrors: []`, on all four runs |
| A real forbidden key | **Never tested.** None was available on a site where browse access is wide |

### A.4 List scope, 2026-08-12, four runs

| Section or view | Jira's own words | The API returned |
| --- | --- | --- |
| `Rundown - Groomed issues` | `0 of 44 work items visible` | 50 |
| `Rundown - To Be Groomed` | `0 of 5 work items visible` | 14 |
| `Script Editor - Groomed issues` | `0 of 16 work items visible` | 23 |
| `FMP next priority` | `0 of 17 work items visible` | 23 |
| `RDN 2607-03` | `7 of 27 work items visible` | 27 |
| The board | 25 cards drawn | `approximate-count` **1150** |
| The backlog | ~36 links drawn | **750** issues over 32 sections, ~37 requests |
| Search results | 50 rows drawn | `approximate-count` **12,816**; the first 100 rows held all 50 |
| The timeline, `/rest/api/3/plans/plan/7` | — | **`403`.** Admin only |

Two facts to carry: `/rest/software/1.0/` is live on this site and **the session
cookie reaches it**; and all four `/rest/agile/1.0/` issue-reading endpoints are
deprecated with removal announced for **2026-11-01**. The Cart's `bulkfetch` path is
on `/rest/api/3/` and is unaffected. Anything later that reads a board must start on
the newer base.

Also from those runs: a backlog row's own container carries its key, as
`software-backlog.card-list.card.content-container.<KEY>`, and the assignee fields on
that row **drop the `software-` prefix** every sibling carries. That is the evidence
for matching a testid leaf and never a dotted path.

### A.5 The grant, 2026-08-18, five runs

Run 1 aborted on a bug in the snippet: `accountId` is mandatory on every user-property
call and version 1 sent it on one. The four that followed were clean.

| Question | Result |
| --- | --- |
| A dual `text/plain` + `text/html` `ClipboardItem` write, under `@grant GM_setValue` | **Resolved.** Twice, on separate tabs, on separate days |
| `GM_setValue` | **Synchronous.** Returns `undefined`; the value reads back on the next line |
| `POST …/bulkfetch` from inside the sandbox | **`200`**, `application/json`, `{issues, issueErrors}` |
| The same call with one absent key | The key was **omitted silently**. `01`'s rule confirmed a second time, under a grant |
| `GM_addValueChangeListener` across tabs | **Fires.** `remote: true` on the other tab, `remote: false` on the writer |
| Its latency | *"After a short time."* **Not measured** |
| A documented size ceiling for that store | **Unreadable.** `tampermonkey.net/documentation.php` renders its API sections client-side and returns only its table of contents. Confirmed twice, in two separate sessions |

### A.6 The build session's probe, 2026-08-18

One console probe over every `/browse/` anchor on a live issue page, printing each
anchor's width, its nearest matching row container, its text, and the first four
ancestors carrying a `data-testid`. It was run because version 0.1.0 put the
floating button in the wrong place on one view. It corrected four things.

| What | Result |
| --- | --- |
| The child-work-items row | `native-issue-table.ui.issue-row`, so `$="ui.issue-row"` already matched it |
| That row's anchors | **Two to the same issue**: the key at 68–79px, and the summary at 191–519px |
| The linked-work-items card | `issue-line-card.card-container`, which **no row selector matched**. Its summary anchor's own wrapper is `issue.issue-view.views.common.issue-line-card.issue-line-card-view.summary`, which is why a `*="issue-line-card"` match would split the card |
| The current-issue breadcrumb | `issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container`. **§2.3's table said `breadcrumbs.current-issue`, which matches nothing**, so tier 6's second witness was dead and only the path answered |
| The project breadcrumb, and the sidebar's project links | `/browse/RDC` at 24–270px wide. The anchored path expression rejects them, as it should |
| A prose smart link | text `RDC-1377: Rundown - Full Day Pattern Epic spl…`, inside `smart-link-draggable-inline` in `issue.views.field.rich-text.description`. Tier 4 strips the key and the colon and keeps the title |

The consequences are in §2.1 (a fifth row container, and the leaf rule widened for
it), §2.2 (the cascade reads the group's widest anchor), §2.3 (the breadcrumb
name), and §2.7 (a group has two answers).


### A.7 The router probe, 2026-08-18

One line in the console, on a live Jira page, asked whether Jira's own issue anchors
carry their own click handler or leave it to a delegated listener. It was run because
the drawer's key links (§2.9, added at 0.4.0) do a full page load where Jira's do
not, and the answer decides whether that is fixable at all.

```js
(() => {
  const own = document.querySelector('#jira-frontend a[href*="/browse/"]');
  const props = Object.entries(own ?? {}).find(([k]) => k.startsWith("__reactProps"))?.[1];
  console.log("it carries its own onClick:", typeof props?.onClick === "function");
})();
```

| What | Result |
| --- | --- |
| Jira's own anchor carries a React `onClick` | **`true`.** The router is PER-ELEMENT |
| Therefore, can our anchor be caught by that router? | **No**, and no amount of markup on our side changes it: our link is outside React's tree and carries no React props |
| The only way to be seen | Put the drawer inside `#jira-frontend`, which §2.9 refuses because React can then delete it |
| The remaining route | `history.pushState` plus a synthetic `popstate`. **Not attempted**: §2.12 says a script under a `@grant` has no page context, and a router that half-honours the push shows a changed URL over a stale view — worse than the reload, not better |

**Verdict: declined, not deferred** (§6 item 13, §4). Two things make the cost small.
The middle-click and Ctrl-click gestures already keep your place, because the key is
a real link. And a reload no longer costs the collecting session, because 0.5.0 made
the drawer's open state a stored preference (§2.9).

**What would reopen it:** Atlassian moving to a delegated router. The line above
re-tests that in one command, which is why it is recorded rather than described.

### A.8 Two tabs over one store, 2026-08-19

**No browser was involved, and that is the point.** The hardening session ran the
whole script **twice**, in two isolated fake documents, over one shared `GM_*` store
with a working value-change bus. §7 step 16 had been open through two build sessions
because a build session cannot open two browser tabs — and it turns out it does not
have to, for the part that matters.

| What was asked | Result |
| --- | --- |
| Add in one tab. Does the other's badge and drawer catch up? | **Yes**, on the notification alone |
| Leave a tab open, add five in the other, return and add one | **All six are there.** The stale tab's add did not write away the five it never saw — §2.5's read-modify-write, doing the one job it exists for |
| Was the stale tab genuinely stale first? | **Yes**, its badge still said 0. Without that the result proves nothing |
| A tab the notification never reached, then made visible | **Catches up**, on the raw-string comparison of §2.5 rule 4 |
| **Is a PREFERENCE propagated the same way?** | **No, and that was a defect.** No listener was registered on that key. Fixed at 1.0.0 — §2.5 rule 1, §2.9, risk 12 |
| A fresh tab over a store that already says the drawer is open | **Open on the first paint**, with its remembered size, its corner, its layout and its per-layout divider |

**What it does not cover, and a browser still has to:** Tampermonkey's real
cross-tab delivery and its latency (risk 12), a genuinely frozen or discarded tab
(risk 11), and whether the drawer is **painted** open on the first frame rather than
merely carrying the attribute that says so.

**The lesson worth keeping is the cheap one.** Two of the three steps that had been
open longest were not waiting on a browser at all — they were waiting on somebody
running the script twice. The defect it found had been shipping since 0.5.0.

---

### A.9 What a paste actually keeps, 2026-08-20

**Three real pastes, and they reversed two decisions this document had already
made.** The output of §2.14 was copied out of a prototype with a real
`ClipboardItem` write and pasted into **Outlook** (*keep source formatting*) and
into **Teams** in the light skin and the dark skin. Screenshots each time.

| Property | Outlook | Teams |
| --- | --- | --- |
| `color` | **kept** | **re-mapped to the skin** |
| `background` | kept, if not near-white | kept, both skins |
| `font-weight`, `font-size` | kept | kept |
| the `■` glyph | kept | kept |
| `opacity` | **stripped** | **stripped** |
| inline `border` | **stripped** | **stripped** |
| a **pale** pill ground | kept | kept |
| a **saturated** pill ground | kept | **discarded** |

**Four rules came out of it**, and each is in §2.14 with the fault that produced
it: a separator must be a character and never a box; nothing may depend on
`opacity`; a colour must bring its own background and that background must be pale;
nothing may depend on a row's position.

**The two reversals, because the reasoning is what transfers.**

1. **`opacity` with an inherited colour was the elegant answer to the light-versus-
   dark problem** — it adapts to any ground without the export knowing which ground
   it landed on, and it degrades to readable full-strength text. It was replaced by
   one named grey, `#737c89`, only because both targets strip it. **The elegant
   answer was not wrong in theory. It was dead in practice, and only a paste could
   say so.**
2. **A saturated lozenge was chosen to fix an invisible one**, after the pale
   `Done` mint (`#dcfff1`) could not be seen on white paper. Teams discarded the
   saturated ground and re-mapped the white text, so the pill lost its ground *and*
   its colour and arrived as bold black — strictly worse than what it replaced.
   **The instinct "make it bolder so it survives" is exactly backwards here**, and
   it is the change the next person will try. The fix was a stronger *tint*.

**Two more faults, found after the script shipped 1.1.0 and fixed in it.**

- **`font-size` in percent does not survive — and it takes the text with it.** Rule
  5 of §2.14. Pasting the script's own output into Teams left a row of bare `·`
  separators: every span carrying `font-size:88%` (or `80%` on the lozenge) had its
  **content deleted**, while everything with no `font-size` — the separators, the
  key link, the summary, the em dash — came through. The correlation was exact
  across seven field types and four rows. **This is not the same as a style being
  ignored, and that is what makes it dangerous.**
  *Not fully explained, and recorded as such:* an earlier paste from the prototype
  into Outlook, with *keep source formatting*, kept the same `font-size:88%` spans
  intact. Identical styling, same target, same paste mode, two results. The script
  now emits no `font-size` at all, which makes the question moot for it, but the
  cause is **unknown** and this appendix must not pretend otherwise.
- **A coloured `■` before the type was decoration that failed where colour did.**
  The argument for it was that a dim square is still a square where dim text is not
  still readable — true, and it misses that most readers of a pasted list see no
  colour at all, so it arrives as a bare black box in front of a word that already
  says everything. The type is emphasised by `font-weight` instead.
- **A bare `<li>` is unreadable in Outlook.** No leading inside a wrapped item and
  no gap after it, so a six-item report arrived as one block and was being
  reformatted by hand every time. Fixed with `line-height:1.5;margin-bottom:8px` on
  **every format that emits a list**. 🔗 Links was left out for one day on the
  reasoning that its lines do not wrap; they do, because the summaries are long,
  and that is a reminder that "usually does not" is a guess wearing a reason's
  clothes.

**Two findings that cost nothing and are worth knowing.** Teams re-maps text colour
to its own skin, so the light-versus-dark question does not arise there at all — the
grey is for Outlook, which renders HTML through Word's engine. And `font-weight`
survives everywhere, so type and priority still read even where colour does not.

**What was measured against.** Six real issues from `dalet.atlassian.net`, read the
same day and chosen for awkwardness: two issue types, three status categories, two
priorities, a missing assignee, a missing fix version, **one issue carrying two fix
versions**, and two with no parent. A seventh row was invented — `GLX-402`, a key
with nothing else — to stand for an issue Jira returns nothing about. The two-fix-
version issue is what exposed the separator bug; nothing with one version could
have.

**The prototype is not in this repository.** It was a switchable page — five output
shapes, the fields individually, the meta on its own line or inline, a light and a
dark client, and a button that put both flavours on the real clipboard so the paste
could be done by hand. **That last control is the one that mattered**: no mock can
tell you what Outlook does. Its findings are all above, and its assertions are in
`test/jira-cart/format-smoke.mjs` §12, which is where they are maintained.

**What it does not cover, and nothing yet has:** Slack, Word, Gmail, Confluence and
Excel were all reasoned about and none was pasted into. Confluence is the one most
likely to differ, because it re-writes pasted HTML into its own storage format.

#### A.9.1 The line shapes, 2026-08-24

**A VISIBLE URL SURVIVES, AND THE EM DASH COLLISION IS ACCEPTED.** The four line
shapes of the configurability prototype were put on the real clipboard with its own
button and pasted by the user. Reported back: **every shape read correctly, and the
URLs arrived displayed and clickable.** So the question the configurability effort
could not answer by argument — whether making the URL the anchor's own visible label
survives a paste — is answered yes, and the plain shapes are available on **all
three** exports rather than on 🔗 Links alone.

**The em dash collision is accepted, and the ground is what makes it transferable.**
`RDC-1513`'s real summary contains ` - `, so a plain shape's URL separator is a
character the summary itself uses, and the em dash then lands after 45 characters of
link:

```
- RDC-1513: Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts - https://dalet.atlassian.net/browse/RDC-1513 — Story · Dev Resolved
```

The user's reason for accepting it: **these documents are read, never parsed.**
Nothing regex-parses a pasted report; it is displayed to a person. So a separator
that repeats a character the summary may contain costs nothing an ambiguity would
cost a machine, and the em dash still does the job §2.8 gave it — marking where the
metadata starts. The two alternatives are therefore not needed and are recorded as
declined rather than untried: a different separator before the URL, and the plain
shapes withheld from the two exports that carry a field tail.

**A FIFTH SHAPE WAS ASKED FOR BY THE PASTE:** `[KEY](url)` — the markdown link on
the key, with no summary. It is the markdown counterpart of `Key and URL, no
summary`, and the prototype had no such row, so this one comes from use rather than
from the table. Ticket 03 owns its bytes in both flavours.

**LANDED ON 2026-08-25.** The five shapes are `SHAPES` in the script, beside the
dispatch table, and `format-smoke` §15 asserts every one of them byte for byte — both
flavours, all three exports, with a summary and without — and that the table names the
same ids as the preference's own vocabulary, in the same order. The fifth shape's
label is **`Markdown link, no summary`**, confirmed by the user against their own
words *"markdown url"*, because it reads as a pair with `Markdown link on the key`
above it and `Key and URL, no summary` below it.

**What this run does NOT say, recorded so the entry is not read as more than it
is.** It is the user's report of their own pastes rather than a screenshot matrix
like the run above: the per-target breakdown was not itemised, so this appendix does
**not** record which shape was pasted into which of Outlook, Teams light and Teams
dark, nor which of the three exports carried it. What it establishes is the yes/no
that was blocking — a visible URL survives and stays clickable — and not a property
table. If a later question needs the table, it needs new pastes.

**THE RIG FOR THOSE PASTES EXISTS, since 2026-08-25, and it is not the one that made
this run.** The configurability prototype was merged into
[`test/jira-cart/paste-test.html`](../test/jira-cart/paste-test.html) and deleted, so
the five shapes are now an `Issue reference` instrument on the page that already has
the clipboard button — and they are the script's own `SHAPES` table carried across,
verified byte for byte against `formatDetails` rather than assumed. **§7 step 34 is
the table.** Worth knowing why the prototype could not have made it: **its shape
table had four rows and the script has five** — the fifth is the one this appendix
asked for — and nothing in the repository read that file, so nothing said so.

---

### A.10 The drag targets, 2026-08-26, one session

**Everything the collection drag rests on, and two things the item drag rested on
wrongly.** The question was not answerable by reading: Chromium's tab strip *can*
open one tab per URL — it asks for a URL list and loops — but nothing in the source
says whether a **web page's** drag can hand several URLs across the
renderer-to-Windows boundary, where the shell's own URL format carries one.

**The rig is [`test/jira-cart/drag-test.html`](../test/jira-cart/drag-test.html),
and it is committed for the paste rig's reason.** These are questions about browser
chrome. No unit test reaches a tab strip. Rebuilding the rig is the expensive part.
Five draggable boxes set five different payloads for the same four issues, so any
difference in behaviour can be attributed to one change: the ship candidate; the
same with bare URLs as plain text; the URL list alone; LF instead of CRLF line
endings; and one URL as a control. A sink on the page reads every type back out
before any of it leaves the browser.

| # | Drop target | Result |
| --- | --- | --- |
| 1 | The rig's own sink | All four types arrive. The URL list has all four lines |
| 2 | Tab strip | **Four tabs.** One per issue |
| 3 | Tab group made by hand | **Four tabs, inside the group** |
| 4 | Bookmarks bar | **One** bookmark. No name. The **first** URL |
| 5 | A folder made by hand on the bar | The same: one unnamed bookmark of the first URL |
| 6 | Teams message box | The `<ul>`, as a list of live links |
| 7 | Notepad | The markdown list |
| 8 | Jira comment / description editor | The link, in the `Issue reference` shape |
| 9 | An ordinary web page, four URLs | **A new tab opens** on the first URL. No navigation |
| 10 | An ordinary web page, one URL | **A new tab opens.** No navigation |

**FIVE FINDINGS, AND THREE OF THEM CHANGED THE DESIGN.**

**1. The multi-URL hand-off works, and `text/plain` did not need changing.** Row 2
opened four tabs *while* `text/plain` was a markdown bulleted list, so the URL list
wins over plain text at the tab strip. The two rig boxes built to diagnose a
collapse — bare URLs as plain text, and LF line endings — were never needed and
were not run. Nothing about the payload changed from the design.

**2. Rows 2 and 4 disagree about the same drag, and that is the whole answer for the
bookmarks bar.** Four tabs and one bookmark, from one drop payload. The payload
crossed to Windows intact; the two Chromium call sites differ — one asks for a URL
list, the other reads a single URL and title. **No change to what we send can fix
the bookmarks bar**, which is worth writing down precisely so that no future session
spends a day on the payload.

**3. A bookmark made from our drag has no name, and this is true of one item too.**
Row 4 and the single-URL control both produced an untitled bookmark, and the
`text/html` anchor text did not supply one. So **the 1.4.0 item drag has always done
this** and nobody had looked. §2.9.1 says the row is a link on the way out; it is,
but on the bookmarks bar the link has no label.

**4. A stray drop opens a tab. It does not navigate.** Rows 9 and 10, with four URLs
and with one. **This makes §2.9.1's accepted cost wrong as written** — the paragraph
said the browser navigates the tab to the issue, losing the page the live list
mirrors. It does not. The page survives and the cost is a tab you close. §2.9.1 is
amended in place; the reasoning that accepted the cost was sound on what it knew,
and what was never tested was the hazard's shape rather than its existence.

**5. Dragging into a Jira editor works, and nobody knew.** Row 8. An item row
dropped into a comment box or a description inserts the link in the shape the
`Issue reference` setting names. This is an undocumented capability of 1.4.0, found
only because it was the price of a feature that then was not built — the
document-level swallow of §2.9.2, which would have removed it.

**One mechanism was confirmed rather than assumed, and it is worth keeping even
though nothing now uses it.** During `dragover` the drag data store is in protected
mode: `getData` returns `""`. **`dataTransfer.types` is still readable.** Measured
in row 1. So a handler that has to recognise our own drag mid-drag needs no module
flag and cannot get stuck armed — which is what §2.9.2's blocking code would have
used, had the evidence not removed the reason for it.

> **"NOTHING NOW USES IT" LASTED ONE DAY. §2.9.3 uses it, on 2026-08-26.** The chips
> and the item list became drop targets, and a chip drag carries N issue URLs — so our
> own collection drag has to be recognised during `dragover` and refused, or dropping a
> chip on a chip would merge two collections silently. That is exactly the mechanism
> this paragraph measured, put to the opposite purpose: refusing our own drag rather
> than swallowing it.
>
> **Two things about this rig therefore cover 1.6.0 without a second session.** The
> readable-`types` measurement above is the whole basis of the refusal. And **box A's
> payload already carried `application/x-gt-cart-collection`** through rows 1 to 10 —
> it was in the ship candidate for the swallow that was not built — so adding the
> marker to the real collection drag changes nothing at any external target, and that
> is measured rather than argued.

**What the rig cannot tell us.** One machine, one Windows, Edge and Chrome from the
same Chromium family. Nothing here says anything about Firefox, which ticket 04
records as a nice-to-have rather than a target. The bookmarks-bar findings are the
ones most likely to be version-shaped, because they turn on one call site inside
Chromium; the tab-strip findings are the ones most likely to hold.

## Appendix B — The store that was measured and rejected

**The collections could have been mirrored into Jira's own per-user properties.**
That option — candidate C in ticket `10` — was designed in full, measured in full,
and **not chosen**. It was not disproved. This appendix exists on the user's
instruction: *"record the research we did about the Jira properties so in the future
we might reconsider it."*

**Why it lost.** Every hard part of C was a price paid to avoid a `@grant`, and the
grant turned out to be free. C keeps `localStorage` as the working copy, because a
network write cannot sit in the add path or the copy path, and mirrors it to the
server behind the interaction. **That is two copies of the user's data that can
disagree** — the one thing `05` spent a session deleting.

### B.1 What is measured, and can be trusted

| What | Result |
| --- | --- |
| Endpoint | `/rest/api/3/user/properties/{key}?accountId=…` |
| Verbs confirmed | `PUT` `200`, `GET` `200`, `DELETE` `204`, `GET` after delete `404`, and a key list via `GET /user/properties?accountId=…` |
| `accountId` | **Mandatory.** It does not default to the caller. `GET /myself` supplies it, ~200 ms, cacheable per user per site |
| An XSRF header on a mutating call | **Not required.** The session cookie alone is enough |
| Size ceiling | **32,768 bytes, exact.** 32,768 accepted; 32,769 refused |
| The unit | **Bytes, not characters.** 20,000 `€` (~60 KB) refused while 32,768 ASCII passed |
| Round trip | Byte-identical |
| Write latency | 184, 203 and 270 ms for a 6 K blob |
| Read latency | ~95 ms |
| Neighbours | The account already carries **37** Atlassian-owned properties |
| Who else can read it | **A Jira administrator can read another user's properties**, with the *Administer Jira* global permission |
| Its own rate limit | **Not found in the documentation** |

Capacity: at ~117 bytes per ASCII item, one property holds **about 280 items**.
Accented characters and emoji cost 2 to 3 bytes each and reduce that.

### B.2 What is designed, and would not need designing again

| Part | The decision |
| --- | --- |
| Reconciliation | **Fast-forward only, on a counter, with no clocks.** One person has one pair of hands, so there are no concurrent writes, no merge and no CRDT. What survives is that **a machine may not push a blob whose base it never read**. On true divergence the mirror **stops and asks**: keep this machine's, or take the other's. It never merges and never silently overwrites |
| Last-write-wins | **Rejected.** A whole-blob overwrite cannot tell *I am newer* from *I never saw yours*. That is the stale-tab bug, stretched across machines |
| The mirror's shape | **One idempotent reconcile, not a queue of writes.** Given local state and remote state it does the one right thing; if it never ran, the next trigger does it. This is what deletes the offline queue |
| Layout | **One property per collection, and no index.** Membership is the property key list. Each value is self-describing: `{v, rev, id, name, activatedAt, items}`. Order derives from `activatedAt`, so a skewed clock costs list order and never data. `rev` is per collection, so two machines in different collections never diverge. A delete is told from a never-pushed collection by the last-agreed copy, so there are no tombstones |
| An index property | **Refused**, on `05` §2's grounds, and it is worse remotely: N properties cannot be written atomically, so one dropped connection leaves an index naming four collections with three values behind it |
| Pull | The key is absent at load (**this is the logout recovery**, and *absent* is distinguishable from *emptied*, because `collections` is never empty); the drawer opens; the tab becomes visible |
| Push | Debounced a few seconds after a change; on tab hidden; on the `online` event |
| Never | In the add path, and never in the copy path |
| Gate 1 | A push does nothing unless local differs from the last-agreed copy, so tab switching without collecting costs **zero requests** |
| Gate 2 | A pull is gated by a shared staleness window. With one pair of hands the remote cannot move while the user sits at this machine |
| Gate 3 | The whole reconcile runs inside `navigator.locks`. **This reverses `05` §5 for the mirror only**, and correctly: that write is already asynchronous and off the interaction path, and the window is a network round trip rather than microseconds |
| Failure | Transient (offline, 5xx, 429, logged out) → do nothing; the next trigger re-derives, and the drawer's line goes stale: *not saved since 09:14*. Permanent for this blob (over 32 KB, or properties unavailable) → say it once and stop until the collection changes |
| `navigator.onLine` | **Not a gate.** It means an interface exists, not that Jira is reachable. The `online` event is only one more trigger |

`01`'s validation rule applies to the mirror's `GET` as well: a logged-out session
hands back login-page HTML, and the Cart would parse it as a collection.

### B.3 What would bring it back

1. **Cross-machine sync becomes a requirement rather than a nicety.** This is C's
   only remaining advantage, and the reason it was close. Tampermonkey's storage
   reaches another machine only through its own cloud sync, which the user must
   configure.
2. **Tampermonkey stops being the delivery mechanism** — a different manager with
   different storage guarantees, or a move to a browser extension, which changes the
   comparison entirely.
3. **A collection needs to be readable by something that is not this browser** — a
   dashboard, a colleague, a script. A user property is server-side. Tampermonkey's
   storage is not.

### B.4 What would have to be re-measured first

None of the API surface is guaranteed stable. Re-establish the `accountId`
requirement, the XSRF answer, and **above all the 32,768-byte ceiling**, which is
the number most likely to move and the one the whole layout is built around.

### B.5 What never existed

**C was never built.** There is no prototype, no partial implementation, and no
experience of its reconciliation rule under real use. A revival starts from this
appendix, not from code.

---

## Appendix C — The six probes, of which four are unrun

The first two are blocked items from §6. The third confirms arithmetic that 1.0.0
acted on without measuring. **The fourth was added and CLOSED on 2026-08-20**, half from
the project's own metadata and half from one console line. The fifth blocks nothing
yet. **The sixth was added on 2026-08-26** and is the only one of the six that answers a
question about a SHIPPED feature rather than a deferred one — it settles why a refused
drag over the drawer shows no no-drop cursor (risk 22), and asks in the same paste
whether Jira's own card drag carries the issue key. The four unrun ones need a live Jira
page and the developer tools. None of them blocks a build.

### C.1 Probe 1 — which element holds a backlog section's rows

**Why.** Grouping the live list by the page's own sections needs a container per
section. The obvious candidate is not one: `software-backlog.card-list.container.BACKLOG`
reported **zero** `/browse/` anchors inside it while its own header claimed
`28 of 504 work items visible`. Most probably the rows sit in a virtualised scroll
container that is a **sibling** of the header rather than a descendant. Grouping by
those containers today would strand most of the links outside every group.

Run this on a backlog:

```js
(() => {
  const ROW = '[data-testid^="software-backlog.card-list.card.content-container."]';
  const leaf = el => (el.getAttribute("data-testid") || "").split(".").pop();

  // A — every section container, and whether it holds any rows at all
  const secs = [...document.querySelectorAll('[data-testid^="software-backlog.card-list.container."]')];
  console.table(secs.map(el => ({
    section: leaf(el),
    rowsInside: el.querySelectorAll(ROW).length,
    anchorsInside: el.querySelectorAll('a[href*="/browse/"]').length,
    header: (el.textContent || "").replace(/\s+/g, " ").slice(0, 55)
  })));

  // B — all rows on the page, then the ancestor chain of the first one
  const rows = [...document.querySelectorAll(ROW)];
  console.log("backlog rows on page:", rows.length, "keys:", rows.map(leaf).join(" "));
  if (!rows.length) return;
  const chain = [];
  for (let el = rows[0]; el && el !== document.body; el = el.parentElement) {
    chain.push({
      tag: el.tagName.toLowerCase(),
      testid: el.getAttribute("data-testid") || "",
      componentSelector: el.getAttribute("data-component-selector") || "",
      rowsInside: el.querySelectorAll(ROW).length
    });
  }
  console.table(chain);
})();
```

**How to read it.** Table A answers whether any section container holds rows at all.
In table B, `rowsInside` climbs as the walk goes up: **the first ancestor where it
jumps to a section's worth is the element that grouping needs.** Also note whether
`software-backlog.card-list.container.*` appears in that chain at all. `rows.length`
should land near the number of rows you can count by eye, which independently
validates the row selector.

### C.2 Probe 2 — container testids for the description and the comment stream

**Why.** Two of the live list's origin labels need to tell those two regions apart,
and `.ak-renderer-document` renders **both**. So one label serves both today
(§2.3). The rule that makes this a probe rather than a guess: **never invent a
`data-testid`.**

**What to establish.** On an issue that has a description and at least one comment,
find the nearest ancestor of a `/browse/` anchor in each region that carries a
`data-testid`, and confirm that the two are different. Then check the leaf of each
name, because the leaf is what the Cart matches on. Paste the `outerHTML` of both
ancestors rather than a description of them: every correction in this effort came
from raw HTML, and two probes that reported a description instead were wrong in the
same direction.

**Until it runs**, a row whose region cannot be identified appears with no label.
That is the stated degradation, and it costs nothing else.

### C.3 Probe 3 — the drawer's own fixed parts, measured rather than derived

**Why.** Risk 10 and §2.11 rule 7 both rest on one number: the collection section
cannot shrink below **135 pixels**, so the reserve is 145 and the minimum height is
215. That number was **derived by reading the stylesheet**, part by part, and not
measured on a rendered drawer. Every part of it is a padding, a border or a line box
that a browser resolves with its own rounding, and the derivation rounded four
fractional line boxes up.

**What to establish.** Open the drawer on any Jira page, then run this. It reports
what each unshrinkable part actually occupies, and the sum.

```js
(() => {
  const drawer = document.getElementById("gt-cart-drawer");
  const section = drawer.querySelector(".gt-cart-collection");
  const parts = [".gt-cart-section-head", ".gt-cart-chips", ".gt-cart-create", "#gt-cart-foot"];
  const each = parts.map((sel) => [sel, section.querySelector(sel).getBoundingClientRect().height]);
  console.log("head", document.getElementById("gt-cart-head").getBoundingClientRect().height);
  console.log("live heading", drawer.querySelector(".gt-cart-live .gt-cart-section-head").getBoundingClientRect().height);
  console.table(Object.fromEntries(each));
  console.log("collection fixed total", each.reduce((n, [, h]) => n + h, 0) + 1);
})();
```

**What to do with the answer.** If the total is **at or below 140**, the reserve of
145 stands and nothing changes. If it is **above 140**, raise
`COLLECTION_FIXED_PX` and `MIN_BLOCK` together by the same amount — `css-smoke`
re-derives the relationship and fails if only one of them moves. Run it a second
time with **four collections**, so the chips row wraps: risk 10 states that this
raises the floor by about 27 pixels a row and does not guard it, and this is the
measurement that would say whether 27 is right.

**Until it runs**, the numbers are reasoning rather than measurement, and they are
conservative by five pixels in the direction that matters.

### C.4 Probe 4 — the `Team` field. CLOSED

**Closed on 2026-08-20**, half from the project's own metadata and half from one
console line. The field is **`customfield_15541`**. Its `schema.type` is `team` and its custom type is
`com.atlassian.jira.plugin.system.customfieldtypes:atlassian-team`, so it is an
Atlassian Teams field rather than a select list or a string. **16,697 RDC issues
have it populated**, so it is the one in use. Read out of the project's own
create-meta for RDC, with the count from `cf[15541] is not EMPTY`.

**Reference it by id and never by name.** This instance has more than one field
called Team, so `"Team" is not EMPTY` proves that *a* field answered and not which
one — the mistake this probe was opened to prevent, and one an earlier JQL run in
this effort walked straight into. `cf[15541]` cannot be ambiguous. Only one
Team-named field appears on RDC's own screens, so the others live elsewhere; see
C.5.

**The value carries a NAME, so no lookup is needed.** That was the open question
and the one that decided how much work a grouped report is. Measured on `RDC-29407`
with the line below, verbatim:

```json
"customfield_15541": {
  "id": "077a215a-beb6-4f29-9ae6-6db55ba2dab5",
  "name": "Planning",
  "title": "Planning",
  "avatarUrl": "https://teams-directory-frontend…/orange_no-highlight_3.svg",
  "isVisible": true, "isVerified": false, "isShared": true
}
```

**One object, not an array**, so an issue has at most one team and a report needs no
join. `name` and `title` held the same string; **`name` is the one to read**, and
`title` is not a second source to reconcile.

**Group by `id`, label by `name`.** The id is a UUID and is exact; two teams can be
given the same name, and a heading that silently merged them would be a wrong report
rather than an ugly one. The same shape of decision as §2.4's opaque collection id
against its editable name.

**Two guards, neither of them measured, recorded so neither is mistaken for
settled.** `isVisible` is in the payload, which implies a team the reader may not
see — so a missing or nameless value must fall out along with its separator, as
§2.14 already requires of every field, and must never print `undefined` or an empty
heading. And whether `bulkfetch` returns a **custom** field when asked for it by id
is *expected* rather than known: the Cart has only ever requested system fields. One
line confirms it on the first build session, and §2.6's rule that a
requested-but-absent field is normal already covers it failing.

> **The second guard is MEASURED as of 2026-08-24, and it holds.** `bulkfetch`
> returns `customfield_15541` when it is asked for by id. Run by the user, in the
> shipped 1.1.0 script rather than in a console line: 📊 Report was pressed on a
> collection whose issues carry a team, and the pasted sub-band headings read the
> **real team names**. That is the whole of the check, because the failure mode is
> visible and total — every heading would have read `No team` (§2.15 limit 2, now
> closed).
>
> Two things this run does NOT say, so that neither is mistaken for settled. It was
> one instance and one project's field, so **limit 1 stands**: on another Jira the
> id is different and the headings go quiet rather than wrong. And it says nothing
> about C.5 below — the other fields named `Team` are still unprobed, and a
> collection that leaves this project is still the case that needs them.
>
> The first guard is still unmeasured: nothing here has yet met a team the reader
> cannot see.

The line that answered it, for the next instance that needs the same thing:

```js
fetch('/rest/api/3/issue/RDC-29407?fields=customfield_15541',
      { headers: { Accept: 'application/json' } })
  .then((r) => r.json())
  .then((i) => console.log(JSON.stringify(i.fields, null, 2)));
```

**Nothing in §6 item 15 is blocked now.**

---

### C.5 Probe 5 — the OTHER `Team` fields, if a collection ever leaves RDC

**Blocks nothing today**, because the Cart collects from RDC in practice. It matters
the first time one collection mixes projects: `customfield_15541` is the Team field
on RDC's screens, and another project may use a different field with the same name,
which would make a group heading that says nothing on those rows.

```js
// Every field on the instance, with its id, narrowed to the ones called Team.
fetch('/rest/api/3/field', { headers: { Accept: 'application/json' } })
  .then((r) => r.json())
  .then((all) => console.table(
    all.filter((f) => /team/i.test(f.name))
       .map((f) => ({ id: f.id, name: f.name, custom: f.custom,
                      type: f.schema?.type, custom_type: f.schema?.custom })),
  ));
```

If there is more than one, §2.14's rule that an absent value drops out along with
its separator is what should apply to the rows whose project uses another.

### C.6 Probe 6 — who else accepts a drop over the drawer, and why one panel will not drag

**Why.** Three questions, one paste, all opened by the user's reports of 2026-08-26.

**One: a refused drag over the drawer shows no no-drop cursor.** The Cart's own signal —
no blue line — is correct and deliberate (§2.9.3), and the browser's half is missing.
The hypothesis is that **something above the drawer has already told the browser the
drop is acceptable**, so there is nothing left to refuse; Jira's board and backlog
drag-and-drop is the candidate, and it is the same second acceptor risk 22 names. That
risk's *write* half is fixed on reasoning about how `dragover` bubbles, and this probe
is the only thing that would confirm the reasoning is about the actual page.

**Two: what does Jira's own card drag carry?** If the key is readable anywhere in it,
then a card grabbed **by its summary** could be accepted as well as one grabbed by its
key — which is the one rough edge of ask 3, because Jira makes a real link out of the
key only. That would be a widening of `droppedLinks` and nothing else.

**Three, and it is the one with something at stake: why will LINKED WORK ITEMS not
drag?** Risk 21 measured that it does not, on a panel with **no rival gesture** — nothing
there is draggable, so unlike the Plans timeline nothing is being taken from us. **The
question that comes first is whether a `dragstart` fires at all.** A drag that never
starts is Jira's markup and there is nothing on our side to change; a drag that starts
and is then refused is a payload we could learn to read. Until that is known, anything
tried is a guess — and §2.1 records one oddity about that panel to keep in mind without
treating it as the cause: its card carries **two anchors to the same issue**.

**Where to run it. Three views, and the comparison between them is the experiment.** A
**board**, where the missing-cursor question was asked and where a page drag works; the
**Plans timeline**, where a rival drag handler is now *known* to exist because risk 21
measured it taking the gesture; and an **issue with linked work items**, where the drag
does not start and nothing is known about why. Read the three side by side rather than
one at a time.

Run this, then drag things over the open drawer:

```js
window.__gtDragProbe?.();
window.__gtDragProbe = (() => {
  const seen = new Set();
  const drawer = document.getElementById("gt-cart-drawer");
  const where = (t) => {
    if (!(t instanceof Element)) return String(t);
    const box = t.closest("#gt-cart-item-list, #gt-cart-chips, #gt-cart-live-list");
    return (box ? box.id + " > " : "") + t.tagName.toLowerCase() +
           (t.className && typeof t.className === "string" ? "." + t.className.split(/\s+/)[0] : "");
  };
  const report = (phase) => (e) => {
    // Only over the drawer, and only when something changes: dragover fires ~60/s.
    if (!drawer?.contains(e.target)) return;
    const line = [phase, e.defaultPrevented, where(e.target), [...e.dataTransfer.types].join(" ")].join(" | ");
    if (seen.has(line)) return;
    seen.add(line);
    console.log("[probe]", line);
  };
  // CAPTURE runs before every listener on the way down; BUBBLE runs after all of them,
  // so the difference between the two is who cancelled it and where.
  const down = report("dragover DOWN");
  const up = report("dragover UP  ");
  // QUESTION THREE lives here. A drag that never starts logs NOTHING, and that absence
  // is the answer: the key is not a drag source on that panel, and no change to the Cart
  // can make it one. A line with an empty `types` means the drag started and carried
  // nothing we can read, which is a different problem with a different fix.
  const started = (e) => console.log("[probe] DRAGSTART |", where(e.target),
    "| types:", [...(e.dataTransfer?.types ?? [])].join(" ") || "(none)",
    "| uri:", JSON.stringify(e.dataTransfer?.getData("text/uri-list") ?? "").slice(0, 120));
  const dropped = (e) => console.log("[probe] DROP | prevented:", e.defaultPrevented,
    "| types:", [...e.dataTransfer.types].join(" "),
    "| plain:", JSON.stringify(e.dataTransfer.getData("text/plain")).slice(0, 200),
    "| uri:", JSON.stringify(e.dataTransfer.getData("text/uri-list")).slice(0, 200));
  document.addEventListener("dragover", down, true);
  document.addEventListener("dragover", up, false);
  document.addEventListener("drop", dropped, false);
  // CAPTURE, so it is logged even if something on the way down cancels the drag.
  document.addEventListener("dragstart", started, true);
  console.log("[probe] armed. Drag: (a) a card by its KEY, (b) the same card by its SUMMARY, (c) a live-list row, (d) a LINKED WORK ITEM by its key. Call window.__gtDragProbe() to stop.");
  return () => {
    document.removeEventListener("dragover", down, true);
    document.removeEventListener("dragover", up, false);
    document.removeEventListener("drop", dropped, false);
    document.removeEventListener("dragstart", started, true);
    console.log("[probe] off");
  };
})();
```

**How to read it.** For each drag, compare the `DOWN` and `UP` lines over the same
target.

| What you see | What it means |
| --- | --- |
| `DOWN false` and `UP false` on a drag we refuse | **Nobody accepted it.** The browser should be drawing a no-drop cursor, and if none is visible the cause is the cursor's own visibility — a large drag preview covering the badge — and not a second acceptor |
| `DOWN false` and `UP true` on a drag we refuse | **A second acceptor, below `document`'s bubble phase.** That is the hypothesis confirmed, and it is the whole explanation of the missing cursor |
| `DOWN true` | Something accepted it in the CAPTURE phase, above us. Same conclusion, one phase earlier |
| `UP true` on a drag we *accept* | Expected and not a finding: that is our own `dragover` |
| A **timeline bar** giving `UP true` where a **board card** gives `UP false` | The two views have different handlers, and only one of them reaches over the drawer. That would also explain why the timeline is the view where the page drag loses |

**And the second question is the `types` column and the `DROP` line.** Drag a card by
its **summary** and read what it carries. If any type holds the issue key — Jira's own
private type with the key inside it, or a `text/plain` that is the key — then accepting
it is one more branch in `droppedLinks` plus a parser for that shape, and §2.9.3's
"three sources" becomes "three sources and a card". If it carries nothing but Jira's
opaque payload, then **the key is the only grab there will ever be**, and that closes
the question rather than deferring it.

**And the third question is read off the `DRAGSTART` line, or off its absence.**

| On a linked work item's key | What it means |
| --- | --- |
| **No `DRAGSTART` line at all** | The key is not a drag source there. Jira's own component suppresses it, and **there is nothing on the Cart's side to change** — the answer is that the live list is the route, and risk 21's open half closes as *declined* rather than *deferred* |
| `DRAGSTART` with `types: (none)` or no `uri` | The drag starts and carries nothing readable. Then the question becomes whether anything in that payload names the issue, which the same line answers |
| `DRAGSTART` with a `uri` of this instance | The drag is fine and the **drop** is where it fails. That would be a bug in the Cart, and the `dragover` lines above say which condition refused it |

**Compare it with a board card's key**, which is known to work: the difference between
the two `DRAGSTART` lines is the whole finding.

**One warning about the probe itself.** It attaches to `document` and never calls
`preventDefault`, so it cannot change what the page does — but it does log during a
drag, and a console that is open and scrolling can slow a drag enough to change how it
feels. Judge the *feel* of the gesture with the probe off.

