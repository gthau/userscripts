# 02 — Finding issue references in arbitrary Jira DOM

Type: research
Status: resolved — dashboard gadget unsurveyed, not load-bearing (see Answer)
Blocked by: —
Parent: ../map.md
Findings: ../research/02a-repo-selector-inventory.md + ../research/02b-prior-art.md
          + ../research/02c-live-dom-survey.md (live survey, 2026-08-10)
Run with: prompts B, C and D in ../prompts.md — all three done

## Question

"Scan this page and list every issue on it" is the Cart's primary add gesture.
It only works if an issue reference can be recognised reliably. The user has
already flagged the hard part: **issue references are not always `<a href>`** —
Jira renders them as buttons and as plain clickable elements too.

Survey the real DOM across the views the user actually navigates, and report
what marks an issue reference in each:

- the issue view (`/browse/KEY`, and the issue panel over a board)
- the backlog
- a board (cards, and the detail panel)
- search results / issue navigator
- an epic's children table, and the issue-links section of an issue
- the timeline / roadmap
- a dashboard gadget

For each, record:

1. **The stable marker.** Is there a `data-testid`, a `data-issue-key`, an
   `aria-label`, or an `href` that names the key? Atlassian's `data-testid`
   values are used by the two existing scripts in this repo, so precedent exists
   — but they change, and the ADRs already list that as a risk.
2. **Whether one selector covers several views**, or each view needs its own.
   One selector that covers most views, plus a text-regex fallback, may beat
   seven brittle selectors.
3. **What a text regex would cost.** `/[A-Z][A-Z0-9]+-\d+/` over visible text
   finds references nothing else will, and also finds false positives — commit
   prefixes, version strings, text inside a description. How bad is it in
   practice, and can it be narrowed by only scanning elements that are
   interactive or that carry a link-ish role?
4. **Deduplication.** The same issue appears many times on one page (card, link
   in a description, breadcrumb). Scanning must collapse those to one entry.
5. **Whether the summary is available beside the key** in each view, or only the
   key — this feeds back into how much `01`'s API path is relied on.
6. **The virtualised-list problem.** Backlog, board and search render only
   visible rows. Report what is and is not in the DOM, without deciding what to
   do about it — that patch of fog graduates once this is known.

Do not design the scanner here. Report what the page makes findable.

## Limit of the research pass

A background agent cannot open a live Jira instance. The research pass therefore
covers what is knowable without one: Atlassian's own documentation, the
selectors already proven in this repo's three scripts, and the prior art —
existing browser extensions and userscripts that detect Jira issue keys, whose
source is public and whose selector choices are evidence of what has held up.

Whatever that pass cannot settle becomes a short live-DOM survey the user runs
with devtools open, on the seven views listed above. Split that off as its own
`task` ticket when the research lands, rather than leaving the gap implicit.

## Why this blocks

`04` (platform verdict) turns partly on whether a userscript can see enough of
the page. `07` (direct-add gesture) cannot decorate references that cannot be
detected.

## Answer

**The premise of this ticket turned out to be false, and that is the headline.**

The ticket was written around the user's warning that *issue references are not
always `<a href>`*. On the live survey of **all seven views**, **every issue
reference found was inside an `<a href="/browse/KEY">`** — without exception.

*Where the false premise came from, established after the fact:* the warning was
grounded in a real observation, but about the wrong class of thing. **Other Jira
entities — fixVersion, sprint and their kin — genuinely are buttons rather than
links.** Work items (epics, stories, tasks) are not. So the button-not-link
hazard is real and simply does not apply to what the Cart collects. Anyone
extending the Cart to capture a *non-issue* entity should expect to meet it.
`a[href*="/browse/"]` is not the "backbone plus fallbacks" the prior-art pass
recommended; on this evidence it is very nearly the whole detector.

Read the "probe limitations" section below before trusting any `inBrowseLink=false`
in the raw survey output: the probe looked only at *ancestors*, and on several
views the anchor is a **descendant** of the key element. Every such case was
checked by hand against the pasted `outerHTML`. None was a genuine exception.

Live data: `research/02c-live-dom-survey.md` Part 2, `dalet.atlassian.net`,
2026-08-10. Desk research: `02a` (this repo's proven selectors) and `02b` (prior
art). Where they disagree with the live pass, the live pass wins.

### Settled first: the attribute spelling

`data-testid`. Between 765 and 1742 per page. The hyphenated `data-test-id` that
`02b` §5.2 picked up from a blog post returns 0 on most views and 1–15 on
Software views — a legacy component, not the convention. `02b`'s doubt was
correct: do not write against it.

**Free bonus:** `document.querySelector('meta[name="application-name"]')?.content`
is `"JIRA"` on every view. A selector-free, rot-proof platform check. (`ajs-jira-base-url`
does not exist on Cloud — that one is Server-only.)

### 1. The stable marker, per view

Every entry below is verbatim from the live pass. Nothing here is inferred.

| View | Key element `data-testid` | Anchor |
| --- | --- | --- |
| Issue view — current issue | `issue.views.issue-base.foundation.breadcrumbs.current-issue.item` | **is** the `<a>` |
| Issue view — breadcrumb container | `issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container` | `<div>`, wraps the above |
| Backlog card | `software-backlog.card-list.card.card-contents.key` | **is** the `<a>` (`target="_self"`, `data-is-router-link`) |
| Backlog card, a11y twin | `software-backlog.card-list.card.card-contents.screen-reader-key` | **is** the `<a>`, holds **key + summary** |
| **Board card** | **`platform-card.common.ui.key.key`** | `<div>` **containing** `<a href target="_blank">` |
| Search results / issue navigator | `native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell` | **is** the `<a>` |
| Epic children table | `native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell` | **is** the `<a>` — *same as search* |
| Issue links panel | `issue.issue-view.views.common.issue-line-card.issue-line-card-view.key` | **is** the `<a>` |
| Timeline (Plans) row | *no key-specific testid* — row is `portfolio-3-portfolio.app-simple-plans.main.tabs.roadmap.scope.issues.issue.row` | `<a id="issue-link-{id}">` inside |

The board is the one view where the key `data-testid` sits **above** the anchor
rather than on it — a shape the scanner must tolerate, and the reason the probe
mis-reported it. Its card container is
**`platform-board-kit.ui.card.card`**, which confirms first-hand the one selector
`02b` §1.1 carried second-hand from prior art. The card also has
`data-component-selector="platform-board-kit.ui.card-container"`.

Two non-`testid` markers worth knowing:

- **`selectedIssue=RDC-3889`** — confirmed exact spelling, in the URL when the
  detail panel is open over a backlog. `02b` guessed the name; it is right.
- **Timeline rows carry `data-issue="654282"` and `data-name="scope-issue-654282"`
  — the numeric issue *id*, not the key.** The key is only in the `href`.
- **Board cards carry the key in their DOM `id`: `id="card-RDC-21496"`** (and
  `aria-describedby="card-description-RDC-21496"`). So `[id^="card-"]` is a
  key-bearing marker with no `data-testid` involved at all — cheap, and worth
  knowing as a board-specific cross-check.
- **Key + summary together in an `aria-label`, on two views.** Board:
  `platform-card.ui.card.focus-container` → `"RDC-21496 [summary]. Use the enter key
  to load the work item."` Backlog:
  `software-backlog.card-list.card.card-contents.interaction-layer.accessible-card`
  → the same shape. A11y affordances are consistently the richest text on a card.
- `[role="dialog"]` is **0** with the detail panel open. The panel is not a dialog,
  and its breadcrumb testids are **identical** to the full issue view's — so one
  document-wide query serves both, and `02b`'s proposed context-scoping trick is
  unnecessary.

### 2. Does one selector cover several views? Yes — decisively

**`a[href*="/browse/"]` hit every one of the seven views surveyed.** Beyond that,
`native-issue-table.*` covers **search results and epic children with one selector
family** — they are the same component. Backlog and board, however, do **not**
share one: backlog cards are `software-backlog.card-list.*`, board cards are
`platform-board-kit.*` / `platform-card.*`, and their summary fields are named
differently again. That is four families plus the anchor, not the ticket's seven.

The ticket asked whether "one selector that covers most views, plus a text-regex
fallback, may beat seven brittle selectors." **Answer: yes, and it is better than
that** — the anchor alone reaches everything, and no text-regex fallback is needed
at all (Q3).

Keep the `data-testid` list, but demoted to a second job: given an anchor, find the
**card** to decorate (`closest()`), and read the summary. Match on the testid
**leaf** with `*=`, per `02a` §1.4, never the full dotted path.

### 3. What a text regex would cost — moot, by decision

**Dropped from the design.** The user's call, recorded verbatim in `02c`: *"let's
forget about bare keys, focus only on well DOM-defined keys."*

This is a good trade and it removes a lot of machinery: no `/[A-Z][A-Z0-9]+-\d+/`
over page text, so no region-exclusion list, and no need for jirafy's project-key
allowlist. The false-positive baseline (view 9) was deliberately skipped as a
consequence, and correctly so.

**What it costs, stated plainly:** a reference that exists only as prose text — a
key typed into a description with no smart link — is invisible to the Cart. Given
that the direct-add gesture (`07`) exists for exactly the one-off case, that is a
cheap loss.

**One exclusion is still needed, and it is a different problem than the regex one.**
A description or comment containing a smart link to another issue renders as a real
`<a href="/browse/KEY">`. Tier 1 will therefore pick up issues *mentioned* in prose,
not just issues the page is *about*. Scoping the scan away from
`.ak-renderer-document`, `.ProseMirror` and `[contenteditable="true"]` is still
wanted — not to protect a regex, but to keep the anchor scan honest. Note `02a`
records that `jira-ux-improvements` currently treats `.ak-renderer-document` as a
*target*; for the Cart it is a no-go area.

### 4. Deduplication — required, and the count is misleading

**Backlog cards carry two anchors to the same issue** — the visible
`…card-contents.key` (`aria-hidden="true"`, `tabindex="-1"`) and the screen-reader
twin `…card-contents.screen-reader-key`. So `a[href*="/browse/"]` reports roughly
**2× the number of cards**, and raw anchor counts are not issue counts.

Dedup by key into an insertion-ordered `Map<key, {summary, elements[]}>` so page
order survives — the `groupByBoard` shape from
[jira-backlog-sprints.user.js:340-346](../../../src/jira-backlog-sprints.user.js#L340-L346).
The `elements[]` array matters precisely because one key legitimately has several
DOM homes, and `07` will want to decorate all of them.

Corollary for the two-witness sanity check: it must compare **distinct keys**
against **card containers**, never anchor count against anything.

### 5. Is the summary beside the key? Almost always — this demotes the API

This is the survey's other significant find. The summary is in the DOM, next to the
key, on every view surveyed:

| View | Summary source |
| --- | --- |
| Backlog | `software-backlog.card-list.card.card-contents.summary-field.summary-field-static.content` — also inside `screen-reader-key`'s anchor, with the key |
| **Board** | **`issue-field-single-line-text-readview-card.ui.single-line-text.container.box`** — a `<span>`; note the name contains no "summary" at all |
| Search results | `native-issue-table.common.ui.issue-cells.issue-summary.issue-summary-cell` |
| Epic children | `native-issue-table.common.ui.issue-cells.issue-summary.issue-summary-cell` (an `<a href="/browse/…">`) |
| Issue links | `issue-field-summary.ui.inline-read.link-item` (an `<a href>`), wrapped in `hover-card-trigger-wrapper` |
| Timeline | a `<button><div>` holding the summary — **no testid**, position-dependent |
| Issue view | `issue.views.issue-base.foundation.summary.heading` (`02a`, two witnesses) |

**So: DOM first, `bulkfetch` second.** The API becomes the fallback for keys whose
summary was not beside them, which materially reduces exposure to `01`'s standing
risk that cookie auth is unsupported. It also means a scan can populate a
collection with summaries **without any network call at all** on most views.

### 6. The virtualised-list problem — confirmed, and destructive

Counts **fall** as you scroll. Rows are unmounted behind you, not merely absent
ahead of you:

| View | `a[href*="/browse/"]` before → after scroll | Distinct keys | Reported total |
| --- | --- | --- | --- |
| Backlog | 41 → **33** | 21 | sprint says 27 issues |
| **Board** | **32 → 27** | **25 → 20** | — |
| Timeline (Plans) | 42 → **19** | 0 *(probe blind, see below)* | — |
| Search results | 36 | 30 | Jira reports "50 of 1000+" |

**Every list view is destructively virtualised. There is no exception.** The board
was the last candidate for "short enough to be fully mounted" and it is not: the
sample key changed from `RDC-1513` to `RDC-1532` across the scroll, so rows are
unmounted behind you there exactly as elsewhere.

**"Scan this page" can therefore never mean "every issue in this list."** No amount
of selector work fixes it, and a single-pass scan of any long list is guaranteed to
be incomplete. Per the ticket's instruction, this reports the fact and does not
decide the remedy — that graduates the map's *virtualised lists* fog into a real
decision, with three live options: scan-what-is-mounted and say so in the UI;
scroll-and-accumulate; or read the API instead (cheap and exact for search results,
where the JQL is right there in the URL).

**A second reason dedup cannot be skipped:** the anchor-to-issue ratio is
view-dependent. Backlog cards carry **two** `/browse/` anchors each (visible +
screen-reader twin); board cards carry **one** (32 anchors ≈ 25 cards plus a few
elsewhere on the page). So an anchor count means nothing on its own, and it means
something *different* per view.

### What was not surveyed

**One view only: the dashboard gadget.** Not found on this instance. The single
question that decides it is whether the gadget is inside an `<iframe>` — if it is,
the view is out of scope for a userscript without extra `@match` work, and no
selector strategy would change that. One snippet, if it ever matters.

Does not block `04` or `07`.

### Probe limitations — two of them, both of which produced false negatives

`02c`'s snippet under-reported twice, in the same direction. Recorded because both
would have quietly become "no evidence" conclusions, and because anyone re-running
the survey will hit them:

1. **Anchored text match.** The snippet matched elements whose **entire** text is a
   key (`/^…$/`), so it reported **"0 distinct"** on the timeline. The timeline
   anchor is `<a href="/browse/RDC-21069">RDC-21069<span>, (opens new window)</span></a>`
   — trailing screen-reader text defeated the regex.
2. **`closest()` looks only upward.** The `inBrowseLink` column used
   `e.closest('a[href*="/browse/"]')`, which walks *ancestors*. On the board the
   anchor is a **child** of `platform-card.common.ui.key.key`; on
   `hover-card-trigger-wrapper` and the issue-view breadcrumb container it is
   likewise a descendant. All three reported `inBrowseLink=false` while sitting
   directly on top of a `/browse/` anchor.

**Both were caught by the pasted `outerHTML`, not by the probe** — which is the
argument for having asked for raw HTML rather than a description. Every
`inBrowseLink=false` in `02c` was re-checked by hand against the HTML; none was a
genuine exception.

**Consequence for the scanner, and it is a design point rather than a footnote:**
the anchor and the key-bearing `data-testid` element are *not* reliably the same
node, and neither reliably contains the other in a fixed direction. Enumerate
`a[href*="/browse/"]` and walk **up** to a card via `closest()` on the container
testids — do not start from the key testid and expect to find an anchor in a known
place.

### What this means for the Cart

The four-tier cascade `02b` recommended collapses to **two tiers and an exclusion**:

1. **`a[href*="/browse/"]`, parsed with the anchored `ISSUE_PATH_RE` already in
   [jira-ux-improvements.user.js:177](../../../src/jira-ux-improvements.user.js#L177).**
   Every view. Zero Atlassian-internal names. This is the detector.
2. **A small `data-testid` container list** — for `closest()` anchoring and for
   reading the summary, never for finding. All four now verified first-hand:
   `platform-board-kit.ui.card.card` (board),
   `software-backlog.card-list.card.card-contents.card-container` (backlog),
   `native-issue-table.ui.issue-row` (search + epic children),
   `portfolio-3-…roadmap.scope.issues.issue.row` (timeline). Enrichment only; when
   a name rots, the Cart still finds the issue and merely loses the summary or the
   decoration. That is design principle 4 from the map, satisfied by construction
   rather than by care.
3. **Skip `.ak-renderer-document`, `.ProseMirror`, `[contenteditable="true"]`** so
   prose mentions don't enter the cart.

Plus, free from tier 0 and confirmed live: `/browse/KEY` in `location.pathname`,
`selectedIssue=` in the query string, and `document.title` for key-plus-summary on
the issue view.

**The feared inversion did not happen.** `02b` warned that if any view carried
references as buttons with no `/browse/` link and no visible key, the brittle
testid list would have to be promoted to primary. The timeline was the prime
suspect — and its rows turned out to hold a plain `<a href="/browse/…">`. Nothing
surveyed requires the testid list to find an issue. Only the dashboard gadget
remains untested, and its failure mode is `<iframe>`, which no selector strategy
would solve anyway.

**One find for the map's *ordering and grouping* fog:** board cards render the
parent epic inline, at
`issue-field-parent-readview-card.ui.parent.parent-card` → a button whose
`data-tag-text="true"` span holds the epic's **summary text, not its key**. So
group-by-epic is available from the board DOM without an API call, but keyed on a
display string — which is a weak join. If `05` wants real epic grouping, take
`parent` from `bulkfetch` (`01` Q6) instead.

**Unblocks `04` and `07`.**
