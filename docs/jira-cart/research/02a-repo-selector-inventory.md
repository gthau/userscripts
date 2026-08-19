# 02a — In-repo selector inventory

Findings for [`issues/02-finding-issue-references-in-jira-dom.md`](../issues/02-finding-issue-references-in-jira-dom.md),
part 1 of 3. Companion pieces: `02b-prior-art.md` (not yet written),
`02c-live-dom-survey.md` (not yet written).

Sources: `src/jira-ux-improvements.user.js` + `.user.md`,
`src/jira-backlog-sprints.user.js` + `.user.md`,
`src/jira-show-fixversion-dates.user.js`, and
`src/bitbucket-ux-improvements.user.js` (helpers only). No web access was used;
every claim below is a quotation from this repository.

Every selector is quoted exactly as it appears in the source, including its
quoting style. Where the source builds a selector by interpolation, both the
template and the resolved string are given.

---

## 1. What the repo actually hooks into

### 1.1 Attribute families in evidence

Eight distinct kinds of hook are in production use. This matters more than the
individual strings: the Cart will need to know which families exist before it
can guess where an issue key hides.

| Family | Example in repo | Where |
| --- | --- | --- |
| `data-testid`, dotted and hierarchical | `issue.views.field.rich-text.description` | [jira-ux-improvements.user.js:102](../../../src/jira-ux-improvements.user.js#L102) |
| `data-component-selector`, kebab, unnamespaced | `breadcrumbs-wrapper` | [jira-ux-improvements.user.js:105](../../../src/jira-ux-improvements.user.js#L105) |
| `data-node-type` (ADF node type) | `mediaInline` | [jira-ux-improvements.user.js:121](../../../src/jira-ux-improvements.user.js#L121) |
| `aria-label` | `Origin Board` | [jira-backlog-sprints.user.js:133](../../../src/jira-backlog-sprints.user.js#L133) |
| `role` on a non-native element | `button[role="link"]` | [jira-backlog-sprints.user.js:138](../../../src/jira-backlog-sprints.user.js#L138) |
| Element `id`, stable | `jira-frontend`, `jira-issue-header` | [jira-ux-improvements.user.js:524](../../../src/jira-ux-improvements.user.js#L524), [:522](../../../src/jira-ux-improvements.user.js#L522) |
| Element `id`, generated with a data id suffix | `group-name-release-<versionId>` | [jira-show-fixversion-dates.user.js:17](../../../src/jira-show-fixversion-dates.user.js#L17) |
| Atlaskit class | `.ak-renderer-document` | [jira-ux-improvements.user.js:107](../../../src/jira-ux-improvements.user.js#L107) |

**No `href` pattern is used anywhere in this repo to find anything.** The single
`href` in the Jira scripts is one the script *writes* into the clipboard
([jira-ux-improvements.user.js:338](../../../src/jira-ux-improvements.user.js#L338)).
There is no `a[href^="/browse/"]` and nothing like it. The repo's only URL
parsing runs against `location`, never against a link in the page.

**`data-issue-key` appears nowhere.** The repo contains no evidence that Jira
exposes such an attribute, and no evidence that it does not.

### 1.2 `jira-ux-improvements.user.js` — the issue view

Written against the issue view at `/browse/KEY`. The route gate at
[:177](../../../src/jira-ux-improvements.user.js#L177) is what fixes the view,
and the ADR states the design assumes the issue view specifically
([jira-ux-improvements.user.md:20-26](../../../src/jira-ux-improvements.user.md#L20-L26)).

| Selector (exact) | Line | Identifies |
| --- | --- | --- |
| `'[data-testid="issue.views.field.rich-text.description"]'` | [:101-102](../../../src/jira-ux-improvements.user.js#L101-L102) | The Description field wrapper. `DESCRIPTION_FIELD`, then `SEL.descriptionField` at [:106](../../../src/jira-ux-improvements.user.js#L106). |
| `` `${DESCRIPTION_FIELD} .ak-renderer-document` `` → `[data-testid="issue.views.field.rich-text.description"] .ak-renderer-document` | [:107](../../../src/jira-ux-improvements.user.js#L107) | The rendered ADF document inside that field. This is the node an inline issue link in a description would live in. |
| `'[data-component-selector="breadcrumbs-wrapper"]'` | [:105](../../../src/jira-ux-improvements.user.js#L105) | The breadcrumb strip. Scoped through `#jira-issue-header` at [:521-523](../../../src/jira-ux-improvements.user.js#L521-L523) because the rule "matches every breadcrumbs wrapper on the page, not just the issue header's" ([:694-695](../../../src/jira-ux-improvements.user.js#L694-L695)). |
| `'[data-testid="issue.views.issue-details.issue-layout.container-left"]'` | [:108-109](../../../src/jira-ux-improvements.user.js#L108-L109) | The scroll container of the issue's left column. Not `window` — the issue view scrolls a div. |
| `'[data-testid="issue.views.issue-base.foundation.summary.heading"]'` | [:112-113](../../../src/jira-ux-improvements.user.js#L112-L113) | The issue summary text. **The one proven key-adjacent summary hook in the repo.** |
| `'[data-testid="media-file-card-loaded-view"]'` | [:118](../../../src/jira-ux-improvements.user.js#L118) | A loaded attachment card inside the description. |
| `'[data-testid="media-file-card-view"]'` | [:119](../../../src/jira-ux-improvements.user.js#L119) | An attachment card. |
| `'[data-testid="media-card-inline-player"]'` | [:120](../../../src/jira-ux-improvements.user.js#L120) | An inline video player. |
| `'[data-node-type="mediaInline"]'` | [:121](../../../src/jira-ux-improvements.user.js#L121) | An inline media node — an ADF node type rather than a testid. |
| `document.getElementById("jira-issue-header")` | [:522](../../../src/jira-ux-improvements.user.js#L522) | The issue header block. Used only to scope the breadcrumbs lookup. |
| `document.getElementById("jira-frontend")` | [:524](../../../src/jira-ux-improvements.user.js#L524) | The SPA root. Mount point for injected UI, with `document.body` as fallback. |

The four media selectors are joined with `,` at
[:122](../../../src/jira-ux-improvements.user.js#L122) and used only as a
click-through exception.

### 1.3 `jira-backlog-sprints.user.js` — the backlog

Written against `/jira/software/…/boards/{id}/backlog`, fixed by the route gate
at [:151](../../../src/jira-backlog-sprints.user.js#L151). The ADR names the
instance and board it was measured on: Rundown, board id `2122`, 33 card lists
([jira-backlog-sprints.user.md:24-32](../../../src/jira-backlog-sprints.user.md#L24-L32)).

| Selector (exact) | Line | Identifies |
| --- | --- | --- |
| `'[data-testid="software-backlog.backlog-content.scrollable"]'` | [:124](../../../src/jira-backlog-sprints.user.js#L124) | The backlog's scroll container. Scopes every other query. |
| `"software-backlog.card-list.container."` | [:121](../../../src/jira-backlog-sprints.user.js#L121) | `CARD_LIST_PREFIX`. The suffix is the Jira sprint id, or the literal `BACKLOG` for the backlog's own list. |
| `` `[data-testid^="${CARD_LIST_PREFIX}"]` `` → `[data-testid^="software-backlog.card-list.container."]` | [:128](../../../src/jira-backlog-sprints.user.js#L128) | One card list per sprint, plus one for the backlog. **The repo's only prefix match, and proof that Atlassian's testids are hierarchical enough to match on a namespace.** |
| `'[aria-label="Origin Board"]'` | [:133](../../../src/jira-backlog-sprints.user.js#L133) | The accessible name of the small board icon in front of a foreign board's name. Marks a sprint row as belonging to another board. |
| `'button[role="link"]'` | [:138](../../../src/jira-backlog-sprints.user.js#L138) | The element around that icon; its `textContent` is the board name. |
| `'[data-testid="horizontal-nav-header.ui.board-header.header"]'` | [:142](../../../src/jira-backlog-sprints.user.js#L142) | The board header bar. Anchor for the control. |
| `` `${SEL.boardHeader} > div:last-child` `` → `[data-testid="horizontal-nav-header.ui.board-header.header"] > div:last-child` | [:865](../../../src/jira-backlog-sprints.user.js#L865) | The action-button group at the right end of the header. `:last-child` chosen over `:nth-child(3)` deliberately — see [jira-backlog-sprints.user.md:236-240](../../../src/jira-backlog-sprints.user.md#L236-L240). |
| `document.getElementById("jira-frontend")` | [:454](../../../src/jira-backlog-sprints.user.js#L454) | Same SPA root as the issue script. Confirmed present on the backlog too, not only on `/browse/`. |

The generated hide rule, [:379](../../../src/jira-backlog-sprints.user.js#L379):

```
html[data-gt-backlog-filter="on"] [data-testid="software-backlog.backlog-content.scrollable"] li:has(> div[data-testid^="software-backlog.card-list.container."] [aria-label="Origin Board"]) { display: none; }
```

and the per-revealed-sprint exclusion,
[:364](../../../src/jira-backlog-sprints.user.js#L364):

```
:not(:has(> div[data-testid="software-backlog.card-list.container.<sprintId>"]))
```

**Structural facts these two encode**, which no prose in the repo states
outright:

- A sprint row is an `li`.
- That `li`'s **direct** child is a `div` carrying the card-list `data-testid`.
- The sprint id is a run of digits in the testid suffix, enforced by
  `/^\d+$/` at [:320](../../../src/jira-backlog-sprints.user.js#L320) —
  quoting [:318-319](../../../src/jira-backlog-sprints.user.js#L318-L319):
  "The backlog's own card list is `...container.BACKLOG`."
- The `ul` holding those `li`s has `display: block`, per
  [jira-backlog-sprints.user.md:280-286](../../../src/jira-backlog-sprints.user.md#L280-L286).

### 1.4 `jira-show-fixversion-dates.user.js` — the plan timeline

| Hook (exact) | Line | Identifies |
| --- | --- | --- |
| `"group-name-release-"` + version id | [:17](../../../src/jira-show-fixversion-dates.user.js#L17) | `RELEASE_DOM_NODE_ID`. |
| `` `#${CSS.escape(RELEASE_DOM_NODE_ID + id)}::after` `` → `#group-name-release-<versionId>::after` | [:149](../../../src/jira-show-fixversion-dates.user.js#L149) | The group-header row of a fixVersion in a plan timeline grouped by release. An element **id** that embeds a Jira entity id — the only such pattern in the repo. |
| `@match https://dalet.atlassian.net/jira/plans/*/scenarios/*/timeline?vid=*` | [:7](../../../src/jira-show-fixversion-dates.user.js#L7) | The only statement anywhere in the repo of the plan-timeline route shape. |

This identifies a **release group header**, not an issue row. It is the closest
the repo comes to the timeline, and it is not close.

---

## 2. The issue-key regex and the route parsing

There is exactly one issue-key regex in the repo,
[jira-ux-improvements.user.js:177](../../../src/jira-ux-improvements.user.js#L177):

```js
const ISSUE_PATH_RE = /^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/;
```

and one extractor, [:179-187](../../../src/jira-ux-improvements.user.js#L179-L187):

```js
function getIssueKey(url) {
  try {
    return (
      new URL(url, location.href).pathname.match(ISSUE_PATH_RE)?.[1] ?? null
    );
  } catch {
    return null;
  }
}
```

Four properties worth carrying forward, three of them stated in the comment at
[:171-176](../../../src/jira-ux-improvements.user.js#L171-L176):

1. It is **anchored to `/browse/`** and matches `pathname` only. A
   `?focusedCommentId=`, a hash or a query parameter cannot affect it.
2. It **yields the key, not a boolean**, so route change is decided by comparing
   keys, not URLs.
3. A **trailing segment is allowed and discarded** — a sub-tab under the same
   issue resolves to the same key.
4. The key pattern itself is **looser than the ticket's**
   `/[A-Z][A-Z0-9]+-\d+/`: `[A-Za-z][A-Za-z0-9]*-\d+` accepts lowercase and a
   single-character project key. Safe because it is anchored; **not** safe if
   lifted verbatim into a text scan.

The backlog script's parallel gate,
[jira-backlog-sprints.user.js:151](../../../src/jira-backlog-sprints.user.js#L151):

```js
const BACKLOG_PATH_RE = /\/boards\/(\d+)\/backlog(?:\/|$)/;
```

with `getBoardId` at [:153-161](../../../src/jira-backlog-sprints.user.js#L153-L161),
the same shape. Note it is **not** `^`-anchored — the backlog path has a project
prefix before `/boards/`. Its documented limit, from
[jira-backlog-sprints.user.md:389-391](../../../src/jira-backlog-sprints.user.md#L389-L391):
"It does not read `/secure/RapidBoard.jspa?rapidView={id}&view=planning`."

There is one **key extractor that touches no DOM at all**,
[jira-ux-improvements.user.js:298-306](../../../src/jira-ux-improvements.user.js#L298-L306):

```js
const title = document.title.replace(/\s+-\s+Jira\s*$/, "");
const bracketed = title.match(/^\[([^\]]+)\]\s*(.*)$/);
```

Jira titles read `[ABC-123] Summary - Jira`. This yields **key and summary
together** for the currently-open issue, with no selector at risk. The comment
records a fixed bug: anchoring matters, because "splitting on the first
occurrence truncated" a summary containing ` - Jira`.

---

## 3. Every passage about fragility, breakage or fallback

Grouped by what it tells the Cart.

**Selectors are listed as a standing risk.**
[jira-ux-improvements.user.md:309-313](../../../src/jira-ux-improvements.user.md#L309-L313) —
"The script uses `data-testid` values and one element id from Jira. Atlassian
can change them. If the summary selector fails, the script reads
`document.title` instead. If the description selector fails, the script disables
three buttons but continues to operate."

**A named fallback for the summary hook.**
[jira-ux-improvements.user.js:114-115](../../../src/jira-ux-improvements.user.js#L114-L115) —
"Only used to build a nicer copy string; `document.title` is the fallback if
Jira renames this one."

**The `Origin Board` marker is known-brittle and instrumented.**
[jira-backlog-sprints.user.js:129-132](../../../src/jira-backlog-sprints.user.js#L129-L132) —
"If it is renamed or translated, no sprint is classified as foreign, nothing is
hidden, and `checkContract` reports it on the page." Restated as risk 1 at
[jira-backlog-sprints.user.md:376-379](../../../src/jira-backlog-sprints.user.md#L376-L379):
"Atlassian writes this label in English. A different language of the interface
gives a different label."

**Two witnesses, because a broken selector looks like an empty page.**
[jira-backlog-sprints.user.js:404-415](../../../src/jira-backlog-sprints.user.js#L404-L415)
and [jira-backlog-sprints.user.md:249-270](../../../src/jira-backlog-sprints.user.md#L249-L270).
The `foreign === 0 && linkRows > 0` test at
[:417-421](../../../src/jira-backlog-sprints.user.js#L417-L421) is the pattern.
**Directly applicable to the Cart**: "scanned this page, found 0 issues" is
indistinguishable from a rotted selector, exactly as "0 sprints hidden" was.

**A `console.warn` is not a report.**
[jira-backlog-sprints.user.js:386-390](../../../src/jira-backlog-sprints.user.js#L386-L390),
borrowed from [bitbucket-ux-improvements.user.js:475-479](../../../src/bitbucket-ux-improvements.user.js#L475-L479) —
"the devtools are closed while you are actually planning a sprint."

**React deletes the children of nodes it controls — measured, not feared.**
[jira-ux-improvements.user.md:228-232](../../../src/jira-ux-improvements.user.md#L228-L232),
and [jira-backlog-sprints.user.md:367](../../../src/jira-backlog-sprints.user.md#L367):
"This repository has one measurement of this failure, on the breadcrumbs."

**A whole-row search can over-match.**
[jira-backlog-sprints.user.md:397-399](../../../src/jira-backlog-sprints.user.md#L397-L399) —
"The script searches the full row for the marker. An expanded sprint has its
work items in the same row. A work item with the label `Origin Board` gives a
false result." **This is the repo's only statement about where issue rows sit in
the backlog: inside the sprint's own `li`.**

**Text matching was considered once and rejected.**
[jira-backlog-sprints.user.md:96-100](../../../src/jira-backlog-sprints.user.md#L96-L100)
and the rejected-alternatives row at
[:364](../../../src/jira-backlog-sprints.user.md#L364) — the text `from <board>`
"is correct, but it needs a calculation in JavaScript, and the calculation must
first remove the name of the sprint: a sprint with the name `Bugs from QA` gives
a false result if the script does not." The one time this repo weighed a text
test against a structural marker, the marker won, on a false-positive argument.
Ticket 02's question 3 has a precedent here, and it is unfavourable.

**The page beat the REST API on a classification question.**
[jira-backlog-sprints.user.md:84-93](../../../src/jira-backlog-sprints.user.md#L84-L93) —
`/rest/agile/1.0/board/2122/sprint` omitted `originBoardId` for sprint `2320`
and returned sprint `4660`, which was not on the page. "The API is correct for
32 rows of 33. The page is correct for 33 rows of 33." Relevant to how much
ticket 01's API path is trusted for set membership.

**Chromium-only features are already load-bearing.**
[jira-backlog-sprints.user.md:386-388](../../../src/jira-backlog-sprints.user.md#L386-L388) —
"`:has()` and anchor positioning need Chromium. Without `:has()` the script hides
nothing."

**Virtualisation, first-hand, in two places and disagreeing.**
[jira-show-fixversion-dates.user.js:135-139](../../../src/jira-show-fixversion-dates.user.js#L135-L139) —
"the timeline virtualizes its rows, so any node we touch is thrown away and
re-rendered on scroll." Against that,
[jira-backlog-sprints.user.md:26-32](../../../src/jira-backlog-sprints.user.md#L26-L32)
counts 33 card lists present at once on the backlog, and
[jira-backlog-sprints.user.md:406-408](../../../src/jira-backlog-sprints.user.md#L406-L408)
has the user counting rows on the live page. So **sprint containers are all in
the backlog DOM; plan-timeline rows are not**. Whether the issue cards *inside*
a backlog sprint are virtualised is untouched by both.

Two further remounting triggers are on record, both relevant to a scanner that
caches what it found:
[jira-ux-improvements.user.md:22-26](../../../src/jira-ux-improvements.user.md#L22-L26) —
React rebuilds the issue view "when the user selects a different tab, saves an
edit, or scrolls a virtualised list";
[jira-backlog-sprints.user.js:269-271](../../../src/jira-backlog-sprints.user.js#L269-L271) —
"a filter change, an expanded sprint, a virtualised re-render."

---

## 4. Reusable as-is

Hooks and mechanisms the Cart can adopt directly, with what each one buys.

| Asset | Source | What it gives the Cart |
| --- | --- | --- |
| `ISSUE_PATH_RE` + `getIssueKey` | [jira-ux-improvements.user.js:177-187](../../../src/jira-ux-improvements.user.js#L177-L187) | The key of the issue currently open. Proven against tab switches, comment anchors and sub-paths. **Only covers `/browse/KEY`.** |
| `document.title` parse | [jira-ux-improvements.user.js:298-306](../../../src/jira-ux-improvements.user.js#L298-L306) | Key **and summary** for the current issue with zero selector risk. The best cheap add-the-issue-I-am-looking-at path. |
| Summary heading testid | [jira-ux-improvements.user.js:112-113](../../../src/jira-ux-improvements.user.js#L112-L113) | The summary beside the key on the issue view, when the title parse is not enough. |
| `#jira-frontend` | [jira-ux-improvements.user.js:524](../../../src/jira-ux-improvements.user.js#L524), [jira-backlog-sprints.user.js:454](../../../src/jira-backlog-sprints.user.js#L454) | A mount point proven on both the issue view and the backlog, outside React's reach, with `document.body` as fallback. The drawer needs exactly this. |
| The `animationstart` mount detector | [jira-ux-improvements.user.js:242-255](../../../src/jira-ux-improvements.user.js#L242-L255) | "Something matching this selector just entered the DOM", for free, including on remount. Proven on five different node types across three scripts. **This is the Cart's rescan trigger** — it fires when a virtualised list scrolls new rows in. |
| The route watcher | [jira-ux-improvements.user.js:194-231](../../../src/jira-ux-improvements.user.js#L194-L231) | Navigation API → patched `history` → 2 s timer, deduplicated on a parsed value. Change the parse function and it works for any route. |
| `data-testid^=` prefix matching | [jira-backlog-sprints.user.js:128](../../../src/jira-backlog-sprints.user.js#L128) | Precedent that testids are namespaced (`software-backlog.card-list.container.<id>`) and that a **prefix plus a captured entity id** is a workable idiom. |
| Two-witness contract check + on-page badge | [jira-backlog-sprints.user.js:386-428](../../../src/jira-backlog-sprints.user.js#L386-L428) | Turns "found nothing" into a visible failure instead of a plausible-looking success. |
| `--ds-*` design tokens + dark block | [jira-ux-improvements.user.js:610-643](../../../src/jira-ux-improvements.user.js#L610-L643) | Theme-correct UI with no theme detection. |
| CSS-attribute-on-`<html>` for state | [jira-ux-improvements.user.js:594-603](../../../src/jira-ux-improvements.user.js#L594-L603), [jira-backlog-sprints.user.js:605-607](../../../src/jira-backlog-sprints.user.js#L605-L607) | Decoration that survives a React remount without a watcher. If the Cart marks already-collected references, this is how the mark comes back. |

---

## 5. Gaps

The point of the exercise. For each view in ticket 02, what this repo actually
proves.

| View | Evidence in this repo |
| --- | --- |
| **Issue view** (`/browse/KEY`) | **Partial.** Description, its ADF root, summary heading, breadcrumbs, left-column scroller, four media types, and the key from the URL. Nothing about the *issue links* section, *child issues*, or any reference to another issue anywhere on the page. |
| **Issue panel over a board** | **None.** Not mentioned in any file. The route gate only recognises `/browse/`, so the Cart cannot even tell which issue is open in a panel using what exists here. |
| **Backlog** | **Sprint rows only.** The `li` / card-list / scrollable structure is solid. **Zero** on the issue cards inside a sprint: no card selector, no key selector, no summary selector. The script says so — [jira-backlog-sprints.user.js:47-48](../../../src/jira-backlog-sprints.user.js#L47-L48), "neither is the backlog's own card list at the bottom of the page". |
| **Board** (cards, detail panel) | **None. Nothing at all.** Every use of "board" in these scripts means either the board id in a backlog URL or the `Origin Board` marker on a sprint row. No board card was ever selected by this repo. |
| **Search results / issue navigator** | **None. Nothing at all.** The route is not parsed, no selector exists, the view is not named in any file. |
| **Epic children table, issue links section** | **None.** The one mention is a passing note in a scroll comment — [jira-ux-improvements.user.js:262-266](../../../src/jira-ux-improvements.user.js#L262-L266), "whatever follows it — child issues, attachments — comes into view". That names the content and selects none of it. |
| **Timeline / roadmap** | **Effectively none.** `#group-name-release-<versionId>` identifies a fixVersion *group header* in a *plan* timeline (`/jira/plans/*/scenarios/*/timeline`), not a project roadmap and not an issue row. Useful for one fact only: the timeline virtualises. |
| **Dashboard gadget** | **None. Nothing at all.** Never mentioned. |

Gaps against the ticket's six numbered questions:

1. **Stable marker per view.** Answered for the issue view (partially) and for
   backlog sprint rows. Unanswered for all six other surfaces. No `data-issue-key`
   evidence either way. No `href`-based detection precedent of any kind.
2. **One selector across several views.** No evidence. The two scripts use
   entirely disjoint selector sets and were each written against one view. The
   only cross-view hooks proven are `#jira-frontend` and the mount/route
   machinery — infrastructure, not reference detection.
3. **Cost of a text regex.** No precedent — the repo has never scanned page text
   for anything. What it does have is the rejected-alternative record at
   [jira-backlog-sprints.user.md:96-100](../../../src/jira-backlog-sprints.user.md#L96-L100),
   where a text test lost to a structural marker on a false-positive argument
   (`Bugs from QA`). The existing key pattern is also too permissive for text
   scanning — see §2, point 4.
4. **Deduplication.** No precedent. Nothing in this repo collects a set of issues
   or collapses duplicates. The nearest relation is `groupByBoard`
   ([jira-backlog-sprints.user.js:340-346](../../../src/jira-backlog-sprints.user.js#L340-L346)),
   which counts by name into a `Map` and relies on insertion order being page
   order — a shape the Cart can copy, but not an answer.
5. **Summary beside the key.** Proven for the issue view only, two ways (the
   heading testid and the `document.title` parse). Unknown for every list view —
   and a backlog or board card almost certainly shows a summary, so this is a
   cheap win the live survey should confirm.
6. **Virtualisation.** Two data points, and they point in opposite directions:
   backlog sprint *containers* are all present (33 of 33); plan-timeline rows are
   virtualised. Whether backlog issue cards, board cards or search rows are in
   the DOM is completely unknown here.

**Everything in the "None" rows above must come from the live-DOM survey
(`02c`). No amount of reading this repository will produce it.**

---

## 6. Helper duplication and drift (for ticket 03)

Verified by diffing the extracted regions, not by eye. "Identical" below means
byte-identical including comments, after normalising only the identifiers noted.

### 6.1 Where each helper lives

| Helper | jira-ux | jira-backlog | fixversion | bitbucket |
| --- | --- | --- | --- | --- |
| `logger` | [:56-66](../../../src/jira-ux-improvements.user.js#L56-L66) | [:62-72](../../../src/jira-backlog-sprints.user.js#L62-L72) | [:20-32](../../../src/jira-show-fixversion-dates.user.js#L20-L32) | [:105-115](../../../src/bitbucket-ux-improvements.user.js#L105-L115) |
| `guard` | [:70-76](../../../src/jira-ux-improvements.user.js#L70-L76) | [:76-82](../../../src/jira-backlog-sprints.user.js#L76-L82) | — | [:494-500](../../../src/bitbucket-ux-improvements.user.js#L494-L500) |
| `injectStyle` | [:78-86](../../../src/jira-ux-improvements.user.js#L78-L86) | [:84-92](../../../src/jira-backlog-sprints.user.js#L84-L92) | ancestor at [:168-179](../../../src/jira-show-fixversion-dates.user.js#L168-L179) | [:502-510](../../../src/bitbucket-ux-improvements.user.js#L502-L510) |
| Route detector | [:177-231](../../../src/jira-ux-improvements.user.js#L177-L231) | [:151-206](../../../src/jira-backlog-sprints.user.js#L151-L206) | — | — |
| `animationstart` mount detector | [:242-255](../../../src/jira-ux-improvements.user.js#L242-L255) | [:273-286](../../../src/jira-backlog-sprints.user.js#L273-L286) | — | inline, not extracted: [:544-551](../../../src/bitbucket-ux-improvements.user.js#L544-L551) + [:558-561](../../../src/bitbucket-ux-improvements.user.js#L558-L561) |
| `reportBrokenContract` | — | [:392-402](../../../src/jira-backlog-sprints.user.js#L392-L402) | — | [:480-491](../../../src/bitbucket-ux-improvements.user.js#L480-L491) |

Every one of the five helpers ticket 03 names appears in **at least two**
scripts. `logger` and `injectStyle` appear in **all four**.

### 6.2 Which copies have drifted

**`injectStyle` — no drift.** All three copies byte-identical, including the
two-line comment. The fixversion `applyReleaseDetailsCss`
([:168-179](../../../src/jira-show-fixversion-dates.user.js#L168-L179)) is the
older ancestor and is genuinely different: `document.head ||
document.getElementsByTagName("head")[0]`, `appendChild`, and **no
`documentElement` fallback** — it would fail at `document-start`, which is why
that script alone declares no `@run-at`
([:1-12](../../../src/jira-show-fixversion-dates.user.js#L1-L12)).

**`logger` — one drift, benign.** The three modern copies differ only in
`LOGGER_PREFIX`. `jira-show-fixversion-dates` carries a fifth method the others
dropped, [:30-31](../../../src/jira-show-fixversion-dates.user.js#L30-L31):
`trace: (message, ...objects) => console.trace(LOGGER_PREFIX + message, ...objects),`.

**`guard` — real drift, different semantics.** The two Jira copies are identical
to each other, comment included, and return the callback's value
([jira-ux-improvements.user.js:72](../../../src/jira-ux-improvements.user.js#L72)):

```js
      return fn();
```

Bitbucket's ([:496](../../../src/bitbucket-ux-improvements.user.js#L496)):

```js
      Promise.resolve(fn()).catch((e) => logger.error("failed", e));
```

It **catches rejected promises the Jira version cannot**, and **discards the
return value the Jira version provides**. The doc comments differ too
([bitbucket:493](../../../src/bitbucket-ux-improvements.user.js#L493) vs
[jira-ux:68-69](../../../src/jira-ux-improvements.user.js#L68-L69)). The Cart
will make async calls — an API fetch, a clipboard write — so it needs
bitbucket's version, and the Jira scripts silently do not have it.

**Route detector — no drift.** `watchRoute` is identical across the two Jira
scripts after renaming `currentKey`↔`currentBoard`, `getIssueKey`↔`getBoardId`
and the local `key`↔`board`. Every comment is identical. The only real variation
is the regex and the extractor name — which is exactly the seam a shared version
would need.

**Mount detector — real drift, two changes.**

| | jira-ux | jira-backlog |
| --- | --- | --- |
| Listener body | [:248](../../../src/jira-ux-improvements.user.js#L248) `guard(onMount);` | [:279](../../../src/jira-backlog-sprints.user.js#L279) `onMount();` |
| Backstop | [:254](../../../src/jira-ux-improvements.user.js#L254) `setInterval(() => guard(onMount), MOUNT_BACKSTOP_MS);` | [:285](../../../src/jira-backlog-sprints.user.js#L285) `setInterval(() => guard(render), MOUNT_BACKSTOP_MS);` |

The first is defensible: the backlog passes `scheduleRender`, which guards inside
its `requestAnimationFrame` callback at
[:300](../../../src/jira-backlog-sprints.user.js#L300) — though a throw in
`scheduleRender` before the frame is now unguarded.

The second is the sharper finding: **the backlog's backstop ignores its own
`onMount` parameter and calls `render` directly**, bypassing the
`scheduleRender` coalescing that
[:288-292](../../../src/jira-backlog-sprints.user.js#L288-L292) exists to
provide. Two paths into `render` where the design says there is one. `render` is
idempotent so nothing breaks, but the two copies of "the same" helper no longer
mean the same thing — and this is precisely the drift ticket 03 asked to be
counted.

**`reportBrokenContract` — no drift.** Identical except the badge text
(`⚠️ Bitbucket UX script: ` [:486](../../../src/bitbucket-ux-improvements.user.js#L486)
vs `⚠️ Jira Backlog script: ` [:398](../../../src/jira-backlog-sprints.user.js#L398))
and one line-wrap. Its badge CSS
([bitbucket:528-541](../../../src/bitbucket-ux-improvements.user.js#L528-L541),
[backlog:843-856](../../../src/jira-backlog-sprints.user.js#L843-L856)) is
byte-identical.

### 6.3 Size of the status quo

Between `jira-ux-improvements` and `jira-backlog-sprints` alone, counting code
lines only:

| Region | Lines |
| --- | --- |
| `logger` (with `LOGGER_PREFIX`) | 11 |
| `guard` | 7 |
| `injectStyle` | 9 |
| Route regex, extractor, `currentX` | 11 |
| `watchRoute` | 38 |
| `watchMounts` | 14 |
| **Total** | **90** |

Roughly 120 lines with their comments, of which all but the three lines noted
above are identical. Add `reportBrokenContract` + its CSS (~25 lines, shared with
bitbucket instead) and the design-token blocks
([jira-ux:610-643](../../../src/jira-ux-improvements.user.js#L610-L643) vs
[backlog:684-719](../../../src/jira-backlog-sprints.user.js#L684-L719), same
idiom with purposely different token sets — divergence, not drift) and the
anchor-positioning `@supports` blocks
([jira-ux:696-708](../../../src/jira-ux-improvements.user.js#L696-L708),
[backlog:864-877](../../../src/jira-backlog-sprints.user.js#L864-L877)).

**Bottom line for 03:** three of five helpers have not drifted at all across two
to four copies. Two have — `guard` in a way that matters for async code the Cart
will write, and the mount detector in a way that quietly reintroduced a second
path into `render`. Both drifts are *improvements or adaptations that failed to
propagate*, which is the shape of drift that argues for sharing; neither is a
bug on the page today, which is the shape that argues it can wait.
