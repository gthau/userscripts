# 09 — What "scan this page" promises, given virtualised lists

Type: grilling
Status: resolved — the page's filters are the query; the list mirrors the DOM (see Answer)
Blocked by: —
Parent: ../map.md
Evidence: ../research/02c-live-dom-survey.md §§3–7, and `02`'s answer §6
          + ../research/09a-list-scope-api.md (docs + live runs, 2026-08-11/12)

## Question

Scan-page-and-pick is the Cart's **primary** add gesture, and `02` measured that
the page cannot answer it completely. Every list view in Jira is destructively
virtualised — rows are unmounted behind you as you scroll, so the DOM holds a
moving window, never the whole list:

| View | `/browse/` anchors before → after scroll | Distinct keys | What the page claims |
| --- | --- | --- | --- |
| Backlog | 41 → 33 | 21 | sprint header says 27 |
| Board | 32 → 27 | 25 → 20 | — |
| Timeline (Plans) | 42 → 19 | — | — |
| Search results | 36 | 30 | "50 of 1000+" |

No selector work fixes this. Settle what the gesture actually promises the user,
and say it in words that could go in the UI.

1. **Name the promise.** Three candidates, and they are genuinely different
   products: *(a)* "everything visible right now" — honest, cheap, and sometimes
   useless; *(b)* "everything in this list" — requires scrolling or the API, and
   is the one users will assume; *(c)* "everything matching what this page is
   showing" — which is the API's answer and can legitimately include rows the
   page never rendered. Pick one as the default. If more than one ships, they are
   two gestures with two labels, not one gesture with a setting.

2. **Does the answer differ per view?** It plausibly does, and a per-view answer
   is allowed as long as the *label* stays honest:
   - **Search results** — the JQL is in the URL. The API can answer exactly, and
     `01` proved it is one cheap call. This is the strongest case for *(c)*.
   - **Backlog / board** — the board id is in the URL. Is there an equally clean
     query, or does this need the Agile API and a second endpoint to learn?
     Answering that is part of this ticket.
   - **Timeline** — a Plan, not a board. Different API surface again, and rows
     carry `data-issue` (numeric id) rather than a key.
   - **Issue view, epic children, issue links** — small and evidently fully
     mounted at the sizes surveyed (5 and 2 rows). But epic children use the
     *same* `native-issue-table` component as search results, so a 200-child epic
     will virtualise. Is "small enough" a real category, or a trap?

3. **Scroll-and-accumulate: is it acceptable at all?** It is the only way to get
   *(b)* from the DOM. It moves the user's scroll position, takes seconds, cannot
   be silent, and fights a list that is mutating under it. Decide whether it is a
   real option or a tempting dead end — and if it ships, what tells the user it is
   running and what happens when they scroll or navigate mid-scan.

4. **The page knows it is incomplete — use that.** The backlog sprint header
   states its issue count; search results say "50 of 1000+". So a second witness
   for "you are seeing fewer than the total" exists in the DOM on at least two
   views. Should the scanner read it and report *"21 of 27 on this page"*, and
   what does it do on a view where no such witness exists?

5. **The count badge must not lie.** The map fixes an always-present count badge
   as the panel's shape. If a scan is partial, what does the badge count, and what
   does the drawer show — a flat list, or a list with a stated boundary? A badge
   reading `21` when the sprint holds 27 is the exact class of bug the ADRs in this
   repo are written against.

6. **Does this demote the primary gesture?** If scanning is inherently partial,
   the direct per-reference gesture (`07`) may deserve to be primary rather than
   secondary. That reverses a standing constraint in the map, so it needs to be
   argued rather than assumed — but `07` cannot be designed until this is settled
   either way.

7. **The safe default, per design principle 4.** If the API route fails, or a
   virtualisation heuristic misfires, what remains? State it. "Scan finds fewer
   issues than expected but every one it finds is real" is a good degradation;
   "scan silently returns 20 of 200 and the UI implies completeness" is not.

## Why this blocks

`07` (the direct add gesture) is designed against what the primary gesture cannot
do. `08` (the drawer) displays the count and the boundary this ticket defines.
`06` (copy formats) is downstream of both only in so far as it formats whatever
ends up stored.

Not blocked by anything — the research it needed is done.

## Answer

**The promise is "everything drawn on this page right now", and that is not a
compromise forced by virtualisation — it is the correct answer. The page's
filters are the user's query, and the DOM is the only place they have been
applied.** The user's words, and they settle Q1 outright: *"if I filter my
backlog view, I want to see only the relevant links, I don't want to see
everything, that wouldn't be usable at all."* `/rest/software/1.0/board/2122/backlog`
knows nothing about the `?assignee=608145091dcf90006872999f` in the URL, so the
API is not a *more complete* answer to the user's question — it is a complete
answer to a different one.

Live evidence: [`research/09a-list-scope-api.md`](../research/09a-list-scope-api.md)
Part 3, four runs on `dalet.atlassian.net`, 2026-08-12. Desk evidence: the same
file Part 1, from Atlassian's OpenAPI specs. Where they disagree, the runs win.

### The structural correction that reframed the whole ticket

The ticket, the map and `02` all say *"scan the page, pick from a list"*, and this
session began by reading "scan" as a button that dumps a page's issues into the
collection. It is not. Recorded verbatim, because every one of the seven questions
changes shape under it:

> *"The Cart accumulates the links I have added to collection, it doesn't
> automatically collect all links drawn on a page. There is another section of
> the side panel that is not the Cart and that shows the links currently drawn on
> page. When scrolling, that list gets updated, so I can see new links and add
> them, if I so choose, to the cart's active collection."*

**The drawer holds two sections.** A **live list**, which mirrors the issue links
currently in the DOM. And the **active collection**, which holds what you chose.
"Scan this page" is not an action at all — it is a standing view. Everything below
is about what the live list shows; the collection is only ever written by a click.

The map's *Panel UI* constraint has been amended to record this, because the
misreading above is the one a build session would repeat.

### 1. The promise — everything drawn, and the label says so

**Named: "on this page".** The live list shows the `/browse/` anchors presently in
the DOM, and its label states that scope. Of the ticket's three candidates, *(b)
"everything in this list"* is dead — the DOM cannot deliver it and, on a board or
backlog, neither can the API, because it does not know what "this list" means.
*(c)* is dead as a default for the reason in the verdict.

**The runs show the API systematically seeing rows the page has decided not to
show.** Wherever a backlog section header and the API disagreed, the API was
larger — never smaller:

| Section | Jira's own header | `sprint/{id}/issue` returned |
| --- | --- | --- |
| `Rundown - Groomed issues` | `0 of 44 work items visible` | 50 |
| `Rundown - To Be Groomed` | `0 of 5 work items visible` | 14 |
| `Script Editor - Groomed issues` | `0 of 16 work items visible` | 23 |
| `FMP next priority` | `0 of 17 work items visible` | 23 |
| `RDN 2607-03` | `7 of 27 work items visible` | 27 |

Whether the header's total is post-filter or merely excludes sub-tasks was **not**
established, and deliberately so — nothing in the design reads it. See *What was
not settled*.

### 2. Per view — uniform, and scan never touches the network

**One promise on all seven views.** The API's list-scope endpoints were
investigated properly and rejected on the evidence, not skipped:

| View | What the API offers | Verdict |
| --- | --- | --- |
| Search results | `/rest/api/3/search/jql` — **exact**. `domNotInApi = 0`; the first 100 rows contained all 50 the page had drawn; `approximate-count` = 12,816 | Exact, and 12,816 is not a cart |
| Board | `/rest/software/1.0/board/2122/issue` — `approximate-count` = **1150** against **25** cards on screen | The board's *saved filter*, not the board's *view*. 46× |
| Backlog | `/rest/software/1.0/board/2122/backlog` + one call per sprint — **750** issues across 32 sections, ~37 requests, against ~36 drawn | Ignores `?assignee=`; 29 of the 32 sections were collapsed |
| Timeline | `/rest/api/3/plans/plan/7` → **403** | Closed. Admin-only, exactly as the spec said |

**Two facts worth carrying forward regardless.** `/rest/software/1.0/` is live on
this site and **the session cookie carries to it** — `200 application/json`,
`summary:yes`, `nextPageToken` present. That matters because all four
`/rest/agile/1.0/` issue-reading endpoints are deprecated with removal announced
for **2026-11-01** (`09a` §1.2); the Cart's `bulkfetch` path is unaffected, but
anything later that reads a board must start on the new base. And
`approximate-count` exists on both bases — one cheap call for "how many are really
in this list", if a future feature ever wants it.

**So the API keeps exactly the job `01` gave it: filling in a summary the DOM did
not carry.** Scan itself makes no request. That is a property worth stating in the
ADR, because it makes the live list synchronous, and it composes with `04`'s rule
that copy-out never awaits the network.

**An API-scope add is not cancelled, it is relocated.** "Add all 12,816 results of
this JQL" is the map's *import into a collection* fog, not a scan. Search results
is where that will be easiest, and `09` recommends it be built there first.

### 3. Scroll-and-accumulate — no. Strict mirror

**The live list is the current DOM and nothing more.** Rows enter it as they mount
and leave as they unmount. The Cart never scrolls on the user's behalf: that would
move the scroll position, take seconds, fight a list mutating underneath it, and
put a multi-second async operation in the add path.

A middle option was offered and also declined — remembering rows that had scrolled
past, cleared on navigation. The reason it is not needed is the reason this design
holds together:

> **The collection is the accumulator, so the live list does not have to be.**

You scroll, add what you want, scroll further, add more. Design principle 1 is
satisfied by construction: there is no buffer, so there is no state that has to
agree with the page.

**Two consequences.**

- **`watchRoute` loses its justification.** `03` copied its 38 lines *on the
  expectation that `09` would make scan results per-page*, and pre-authorised
  dropping them if not. A strict mirror has nothing to forget on navigation — and
  the current issue on `/browse/KEY` arrives through its own breadcrumb anchor
  (`02` §1), so not even `location.pathname` needs reading. **Drop it.**
  `watchMounts` is what the live list needs, and the async-aware `guard` is still
  wanted for the summary fallback.
- **The board-quick-filter worry evaporates.** It only existed to ask whether a
  buffer could be cleared reliably. With no buffer, a filter change is just a DOM
  change.

### 4 & 5. The boundary and the badge — one question, and it mostly dissolved

**The badge counts the collection.** The ticket feared *"a badge reading 21 when
the sprint holds 27"* — the exact class of bug this repo's ADRs are written
against. Under the two-section panel it was never reachable: the badge counts what
you put there. The honesty burden falls entirely on the live list.

**And the live list reports only what it holds.** A flat list, labelled with its
own scope — `On this page (7)`. It does **not** borrow Jira's `(7 of 27 work items
visible)`, for three reasons: that text sits on screen a few centimetres from the
panel already; the witness exists only on backlog sections and search results, so
the panel would be inconsistent view to view; and reading it means a regex over a
localised string with no `data-testid` behind it, whose failure mode is a *wrong
number in the UI* — worse under principle 4 than no number.

**Grouping by the page's own sections is the appealing version of this, and it is
deferred rather than rejected** — the user's call: *"maybe later I'll want to group
by page's sections."* Copying each section header verbatim would give an honest
per-list count with no parsing at all. It is deferred because the one piece of
evidence bearing on it is negative: see *What was not settled*.

### 6. Primacy — the ranking was the wrong axis. The map is edited

The ticket asked whether inherent partialness should promote `07` over scanning.
Neither, as it turns out. The user's description of the direct gesture:

> *"I see a ticket link in the page and I want to add it right away with a quick
> action. I do not want to: 1. open the side panel, 2. have the page scanned,
> 3. find the ticket in the list, 4. add it."*

That is not a fallback for something scanning cannot reach — after `02`, scanning
reaches everything, because every reference is an `<a href="/browse/KEY">`. It is a
different job. **The map's constraints table no longer ranks them**; it names two
gestures and the situation each serves. `07`'s brief changes accordingly: its
justification is ergonomics, not coverage.

**One finding handed to `07`, from the user and worth having early:** *"all
modifiers+click result in opening links, so that seems discarded."* Click-based
gestures are out. The starting candidate set is a context-menu entry or a hover
popover carrying a `+`.

### 7. The safe default

Every failure path in the scan makes the live list **shorter or less annotated —
never longer, never wrong**:

| If this breaks | What remains |
| --- | --- |
| `a[href*="/browse/"]` stops matching | An empty list. The direct gesture still works |
| A container `data-testid` rots | Keys still found; the summary falls back to `bulkfetch` (`02` §5) |
| `bulkfetch` fails, or returns `200` + login HTML | Keys with no summary — valid items, per `01` rule 1 |
| `watchMounts` stops firing | The list goes stale, and is re-derived on the next panel open |
| An origin region cannot be identified | The link still appears, merely unlabelled |

**And the load-bearing one: the live list never adds anything. Only a click
does.** So no scan failure can put a wrong item in a collection. The ticket's bad
outcome — *"scan silently returns 20 of 200 and the UI implies completeness"* — is
not reachable, because the label says "on this page" and the collection contains
only what was chosen. That is principle 4 satisfied by the shape of the design
rather than by care.

**Prose links are in, reversing `02` §3.** `02` recommended excluding
`.ak-renderer-document`, `.ProseMirror` and `[contenteditable="true"]` so that
issues merely *mentioned* in a description could not enter the cart. That was
reasoned about a batch add. Under manual picking it is backwards: reading
`RDC-1420` and wanting the three tickets its description links is a normal thing
to want, and the cost of a link you don't want is one glance.

**Each row records a coarse origin** — the user's framing: *"where they generally
come from, e.g. 'from comments' (not which specific comment), 'from ticket
description'."* A region category, never an instance. The origin is derived at scan
time from `closest()` on region containers; it is a property of the **live list
row**, not of the stored item — which follows from §3 (the list is transient) and
from the map's *item data* constraint of key + summary. `05` should not store it.

### What was not settled

1. **Which element contains a backlog section's rows.** This blocks the grouping
   deferred in §4/5. Run 1 reported `domKeys: 0` for the `BACKLOG` section while
   its own header claimed `28 of 504 work items visible` — so the element carrying
   `software-backlog.card-list.container.BACKLOG` does **not** contain its own
   cards. Grouping by those containers today would strand 28 of ~36 links outside
   every group. One devtools probe closes it, and it is written:
   [`09a` §4.4](../research/09a-list-scope-api.md). *Sharpened 2026-08-13* — a
   backlog row's own container carries the key,
   `software-backlog.card-list.card.content-container.<KEY>` (`09a` §4.1), so rows
   are now countable while walking up the tree. That paste also moved the row's
   best `closest()` anchor **two wrappers outward** from what `02` nominated, which
   `07` should use for decoration; and it found one naming trap worth having early
   — the assignee fields on a backlog row drop the `software-` prefix.
2. **Container testids for the description and the comment stream.** Two of the
   origin categories in §7 need them, and `.ak-renderer-document` renders **both**,
   so it cannot tell them apart. `02`'s rule applies — never invent a
   `data-testid` — so this is recorded as a probe, not guessed. Degradation is
   stated in §7's table.
3. **`01`'s leftover probe, half-closed.** `bulkfetch` of `RDC-9999999` — real
   project, absent number — returned `200` with `issues: []` and
   `issueErrors: []`, on all four runs. So **silent omission is the general
   behaviour**, not an artefact of the unparseable `ZZZZ-99999` key `01` tested;
   `01`'s diff-requested-against-returned rule is confirmed twice over.
   **Permission-denied is still untested** — the snippet's `HIDDEN_KEY` was left
   blank. `05` wants it before drawing the failed-summary states.
4. **Whether a backlog section header's total is post-filter.** Not settled, and
   not needed: §4/5 decided nothing reads it. Recorded only so a future grouping
   effort knows to establish it first.
5. **The dashboard gadget**, still unsurveyed from `02`. Unchanged, and its failure
   mode is `<iframe>`, which no promise-level decision affects.

**Two columns of Run 1 are probe bugs, not findings**, and are annotated as such in
`09a`: `inBoardSprintList` reads `false` for all 32 sections because the snippet
asked for `maxResults=50` against a board with `total=122` sprints; and the
per-section `domKeys` under-counted for the reason in item 1 above. Neither
supports any conclusion. Notably, the foreign-sprint fear in `09a` §1.6 item 3 is
**dead** by other evidence: `board/2122/sprint/5885/issue` returned 23 issues for a
sprint whose header reads *"from MAM UI Team"*, and `domNotInApi` was `0` in every
section — the API is a superset of the page, not a different set.

### What this hands on

- **`05` (data model).** Do **not** store the row origin — it is scan-time
  annotation, not item data. The summary comes from the DOM at add time (`02` §5),
  with `bulkfetch` as fallback, so an add never waits on the network. Item states
  remain `01`'s three. The permission-denied probe is still wanted before the
  failed-summary states are drawn.
- **`07` (the direct gesture).** Unblocked, and its brief is rewritten: ergonomics,
  not coverage. Click-based gestures are out — every modifier+click opens the link.
  Context menu and hover popover are the candidates. It is now a peer of the live
  list, not its fallback.
- **`08` (the drawer).** Two sections: the live list and the active collection. The
  badge counts the collection. The live list is flat, labelled `On this page (n)`,
  and carries a coarse origin per row — whether that origin is *drawn* is `08`'s
  call, whether it is *known* was decided here. Grouping by the page's sections is
  deferred and needs probe 1 first.
- **`03` (shared helpers).** **Drop `watchRoute` — 38 lines, pre-authorised.**
  Keep `watchMounts` and the async-aware `guard`.
- **`06` (copy formats).** Unaffected.
- **The map.** Two constraint rows amended — *Add gesture* (the ranking removed)
  and *Panel UI* (the two sections recorded) — plus a new entry under *Not yet
  specified* for section grouping.
