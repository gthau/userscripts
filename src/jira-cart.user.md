# ADR: Jira Cart userscript

- **Status:** Accepted. **Version 0.5.0 implements the whole of section 2.**
  Version 0.1.1 had built §2.1, §2.2, §2.4, §2.5, §2.7, §2.10, §2.12, §2.13 and
  the badge of §2.9; 0.2.0 added the drawer and everything in it — §2.3, §2.6,
  §2.8, the rest of §2.9, and §2.11; 0.3.0 changed one control, so that 🔍
  **opens** the collection in Jira's search instead of copying the query (§2.8);
  0.4.0 made every row's key a real link (§2.9) and fixed the ⚙, which a CSS
  specificity trap had left inert (§2.11); 0.5.0 **reversed** the drawer's open
  state into a stored preference (§2.9).
  What is left is **verification, not features**: the steps of §7 that need two
  tabs, a damaged store, or a live visit to each of the eight views. The two
  probes of appendix C are still not run
- **Date:** 2026-08-18
- **Applies to:** `src/jira-cart.user.js` (version 0.5.0)
- **Decided by:** ten tickets, all closed. They are named below and are not
  in this repository

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

Behind the tickets were seven research passes, named here because the tickets cite
them: `01` (the API), `02a`, `02b` and `02c` (this repo's proven selectors, prior
art, and a live DOM survey), `05a` (a storage probe), `09a` (list scope, with four
devtools runs), and `10a` (storage options, with five). Every live run was on
`dalet.atlassian.net`, in August 2026, by the user.

**The tickets and the research passes are not in this repository.** They were the
working record of the effort, in an untracked directory, and the two prototypes
behind `07` and `08` were throwaway by design — their mechanisms are in §2.7, §2.9
and §2.11, and the files themselves are not kept. **So this document is the
record.** Three things that lived only in that directory are folded into the
appendices: the measurements with their dates
(appendix A), the storage design that was measured and rejected
(appendix B), and the two probes that are written but not yet run (appendix C).
Nothing else in it was load-bearing.

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
| Summary | `[data-testid$="summary-field-static.content"]` | backlog |
| Summary | `[data-testid$="issue-summary.issue-summary-cell"]` | search results, epic children |
| Summary | `[data-testid$="single-line-text.container.box"]` | board |
| Summary | `[data-testid$="inline-read.link-item"]` | issue links |
| Summary | `[data-testid$="list-item-content.summary.title"]` | the Team's Timeline tab |
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
   `.ak-renderer-document`. Jira's own quick-search dropdown draws a handful of
   issue links inside none of them, and a warning it set off would be false.

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
| timeline | `[data-testid="sr-timeline"]` — the Team's Timeline tab. **The one origin that names a whole view rather than a row**, so the label survives the row's name changing |
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

1. **The listener is registered on the key**, so it hears our key and nothing
   else.
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

Links takes its exact shape from `jira-ux`'s 🔗 link button, repeated per line
under a `- ` bullet. This is reuse, not a variation. The shape is `[KEY](url)
Summary` — the key alone is the link, and the summary sits outside it. The reason
in that script is a syntax limit and not a taste: **markdown cannot nest square
brackets**, so a `[KEY] Summary` label cannot be a link label. Two consequences
are worth keeping: the link column is short and uniform, so a pasted list is
scanned down its keys; and the summary stays ordinary text, so it can be edited in
the email you pasted it into without fighting a link boundary.

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
numbering would imply a ranking that does not exist. The `&nbsp;` after `</a>` is
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
| Reorder | **It does not exist.** Order is most-recently-activated (§2.4), and a hand-chosen order is not expressible |

The collection switcher is a row of chips, each carrying a name and its own count.
**The count is a separate element from the name and never truncates.** It is the
one thing on a chip that cannot be reconstructed from a shortened label.

Collection rows are in array order, which is insertion order, **which is the order
a copy emits**. Newest-first would read better and would disagree with the paste,
which is a worse thing to be.

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

**The drawer's own numbers, all chosen by the build session on 2026-08-18 and none
of them measured.** The default is **380 by 520 pixels**, with the height capped at
`70vh` until a drag lifts the cap (§2.11). 380 is the width this section already
reasons about when it says a drawer that narrow cannot show a Jira title. The
drawer sits **3.5rem from the bottom edge**, which clears the badge, and 1rem from
its own side. The divider travels between **20% and 85%**, so that neither section
can be collapsed past the point where its own divider is still grabbable. The
minimum is 300 by 160, from risk 10.

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

**5. The chrome mirrors the anchor.** Two features that were each correct alone
collided: on a left dock, the ✕ sat where the grip lands. §2.9 has the rule.

**6. The timeline's summary is readable.** §2.2, tier 5.

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

## 3. What the script gives the user

Two things on the page: a badge in a bottom corner, and one floating button that
follows the hovered issue link. Everything else is inside the drawer.

| Control | Where | What it does |
| --- | --- | --- |
| 🛒 `Scratch 7 ▾` | the badge, bottom-right | Opens and closes the drawer. The label is the active collection's name and its item count |
| ⚠️ on the badge | the badge | The last write failed. The drawer carries the sentence |
| `+` / `✓` / `−` | floating, left of the hovered issue link | `+` adds. `✓` says it is in the collection. `−` (the pointer is on the button) removes |
| A live-list row | drawer, `On this page (n)` | Adds the issue. Click a collected row to remove it. **The key itself is a link**: click to open the issue, middle-click or Ctrl-click for a new tab |
| A key, in either section | drawer | A real link to the issue, so the browser's own gestures all apply, including its context menu |
| `✕` on a collection row | drawer, the collection | Removes that item |
| The collection's name | drawer, the collection's heading | Click to rename it in place. Enter or blur commits. Escape cancels |
| ⌫ | drawer, the collection's heading | Empties the collection and keeps its name. Click once to arm it — the label becomes `Empty N?` — and again to commit |
| ↻ | drawer, the collection's heading | Refreshes every summary in the collection |
| A collection chip | drawer, below the collection | Makes that collection active. Each chip carries its own count |
| ✕ on a chip | drawer, below the collection | Deletes that collection. Armed first: the chip turns red and its tooltip names what goes. On the only collection it empties it instead (§2.4) |
| `new collection…` + create | drawer, below the chips | Creates a collection and makes it active |
| 🔗 Links | drawer, the foot | Copies the whole collection as a markdown list, plus a `<ul>` as HTML |
| 📃 Names | drawer, the foot | Copies `[KEY] Summary` per line |
| 🔑 Keys | drawer, the foot | Copies `KEY, KEY, KEY` |
| 🔍 Search | drawer, the foot | Opens the whole collection in Jira's issue search, in a new tab. From there it can be filtered, bulk-edited, saved as a filter or shared |
| ⚙ | drawer, the head | Opens the preferences: the right-click switch, the section layout, and which bottom corner the Cart takes |
| Sections | drawer, the preferences | `auto`, `stacked` or `split`. `auto` decides from the drawer's own width |
| Corner | drawer, the preferences | Bottom right or bottom left. The drawer's chrome mirrors it |
| ✕ | drawer, the head | Closes the drawer |
| The grip | drawer, the free corner | Drag to resize. Double-click to let the drawer size itself again |
| The divider | drawer, between the sections | Drag to give one section more room. Double-click to hand it back |
| Right-click an issue link | the page | **Off by default.** A preference. When on, it opens the Cart's own menu instead of the browser's |

Notes on the controls:

- **The badge counts the active collection, and only that.** So it cannot lie. The
  honesty burden falls entirely on the live list, which reports what it holds and
  labels its own scope.
- **The four copy buttons act on the whole collection.** They are disabled and
  dimmed while it is empty, because a copy of zero items must not write.
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
| Bare URLs, one per line | Links with the summary removed. Its only distinct paste target cannot be named |
| `[KEY] Summary — URL` | Links' three fields with different punctuation |
| Copying the JQL instead of opening it | Every use of it ended in the same paste into Jira's search box, so the button goes there instead. The query text is one selection away on that page, and its URL is the better thing to share |
| The collection's name as a heading in a copy | Redundant where you paste, wrong for a selection, invalid inside Keys and JQL, and it breaks *lines equals items* |
| A template engine for the formats | Names' summary-less line is a different line shape, not a substituted value. Templates would be a rewrite of this layer |
| `localStorage` for the collections | It dies on a logout or a history cleanup |
| A mirror into Jira's own user properties | Two copies of the user's data that can disagree, a reconciliation rule, and a 32,768-byte ceiling — all to avoid a grant that is free. Preserved at `10a` Part 5 |
| A Chrome extension | It reads the same DOM and calls the same endpoint, and costs a manifest, a service worker, a build step and three install stories. Its users already run Tampermonkey |
| A shared library with `@require`, or a build step | Tampermonkey and GitHub's raw server both cache the file. A version in the URL needs discipline; a build step means `src/*.user.js` is no longer what you install |
| Client-side navigation from the drawer's key links | Jira's router is per-element, so our anchor is invisible to it; being seen would mean living inside React's root, where React can delete the drawer. `pushState` needs page context a `@grant` does not have, and a half-honoured push shows a changed URL over a stale view (appendix A.7) |
| `watchRoute` | A strict mirror has nothing to forget on navigation, and the collections are in storage |

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
   same add. Whether the drawer can be driven from the keyboard alone is untested.
9. **The prototypes ran under `@grant none`.** Their placement, positioning,
   coexistence and remount findings are DOM and CSS behaviour, which Tampermonkey's
   sandbox does not touch, so they should transfer. *Should* is reasoning. The build
   session confirms it cheaply.
10. **The drawer below a laptop screen is untried.** The minimum is 300×160 and the
    layout derives from width, but nothing smaller was used. **At that minimum the
    collection section cannot fit its own fixed parts.** The build session
    measured them at about 130 pixels — the heading, the chips, the create field
    and the four copy buttons — against the 38% that §2.9's fixed basis leaves,
    which is 61 pixels at a height of 160. The surplus is clipped, because the
    containers are `overflow: clip`. The fix is not a `min-height` on that
    section: §2.11 defect 3 is the argument against exactly that. It is either a
    larger minimum height or a divider that yields, and neither is decided.
11. **The Cart exists once per tab.** Several tabs hold several copies of the same
    collection, and their freshness rests on a notification that a frozen or
    discarded tab may never receive. The re-read on drawer open and on tab-visible
    is what covers it. An extension's UI exists once per window, which is why this
    stays on the platform list.
12. **The cross-tab event arrives late**, by an unmeasured amount. It costs a late
    redraw, because the notification is a hint and not the correctness mechanism.
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


19. **THE SURVEY OF SEVEN VIEWS WAS NOT EXHAUSTIVE, and one more view was found by
   USING the Cart rather than by surveying.** The Team's Timeline tab (§2.1) was
   the eighth, and it announced itself as a false contract warning. Two lessons,
   both cheap: the detector held on a view nobody had ever tested it against, and
   **the contract check is the thing that finds a new view**, so a warning on a
   page that works is worth reading rather than suppressing. Expect a ninth.

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
4. **Keyboard shortcuts, and keyboard reachability of the drawer.** Whether the two
   scripts need a shared convention is open.
5. **The dashboard gadget.** See risk 7.
6. **Import into a collection** — pasting a list of keys, or adding every result of
   a JQL query. "Add all 12,816 results" belongs here, not to the scan. Search
   results is where it is easiest, and where `09` recommends building it first.
7. **Ordering and grouping inside a collection** — manual reorder, group by epic,
   sort by key. Note that a board card renders its parent epic's **summary text**,
   not its key, so grouping from the DOM would join on a display string. Take
   `parent` from `bulkfetch` instead.
8. **Capture from Bitbucket and Confluence.** Out of scope for this effort, and
   **intended future work rather than a hypothetical** — the user's instruction.
   The store already reaches both, because it is per-script; Confluence Cloud also
   shares the origin. What is missing is the DOM survey, which does not exist for
   either site.
9. **Sync across machines.** Out of scope, and plausibly one Tampermonkey setting
   away rather than a fresh effort — resting on the unverified claim in risk 3.
10. **User-editable export templates.** Deferred, and §2.8 establishes they are a
    rewrite of that layer rather than a configuration of it.
11. **Two questions the prototypes could not answer by use:** whether the
    right-click preference is ever switched on, and whether the section divider is
    ever dragged. Both shipped because the cost of having them is one CSS rule and
    one listener.
12. **Whether a backlog section header's total is post-filter.** Nothing reads it.
    Recorded so that a future grouping effort establishes it first.
13. **Whether the drawer's own key links can navigate the way Jira's do.** Opened
    and **CLOSED on 2026-08-18, as DECLINED rather than deferred.** The probe ran
    the same day: Jira's router is per-element, so our anchor can never be caught by
    it, and the two remaining routes are each worse than the full page load they
    would replace. The measurement is in **appendix A.7** and the verdict is in
    §2.9. The item keeps its number, because §2.9 cites it. **It would reopen only if
    Atlassian moved to a delegated router**, which A.7's probe re-tests in one line.

---

## 7. How to test

There is no test system in this repository. Use these steps in a browser, with
`jira-ux-improvements` and `jira-backlog-sprints` also installed.

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
5. **The summary arrives from the page.** On each of the seven views, add a link and
   confirm the item carries a summary. **The timeline is the interesting one**, and
   it must not carry the sentence around the link.
6. **A prose link works.** Open an issue whose description links other issues. Those
   keys must appear in the live list, and must be addable.
7. **The floating toggle.** Hover an issue key. The `+` must appear to its left,
   loud, and centred in its box. Click it. The link must go green and the badge count
   must go up. Hover it again: the `✓` must become a red `−` **before** any click.
   Click to remove.
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
    reload again: it must stay closed.
14. **Copy, and search.** With three items, one of them summary-less, press 🔗
    Links, 📃 Names and 🔑 Keys and paste each into a plain editor. **Every paste
    must have as many lines as the collection has items.** Paste Links into
    Confluence: it must arrive as live links. Then press 🔍 Search: **a new tab
    must open on Jira's issue search showing exactly the collection**, this tab
    must stay where it was, and the drawer must still be open on it.
15. **Empty means disabled.** Empty the collection. All four buttons must be dimmed
    and must write nothing.
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

---

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

## Appendix C — The two probes that are written and not yet run

Both are blocked items from §6. Both need a live Jira page and the developer tools.
Neither blocks the build.

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
