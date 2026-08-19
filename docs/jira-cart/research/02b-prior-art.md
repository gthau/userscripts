# 02b — Prior art: how existing extensions detect Jira issue references

Findings for [`issues/02-finding-issue-references-in-jira-dom.md`](../issues/02-finding-issue-references-in-jira-dom.md),
part 2 of 3. Companion pieces:
[`02a-repo-selector-inventory.md`](./02a-repo-selector-inventory.md) (written),
`02c-live-dom-survey.md` (not yet written — §7 below is its script).

Question: how does prior art detect issue references in the Jira Cloud DOM, given
that references are not always `<a href>`?

Method: five projects, read from source rather than README. 15 web fetches, the
budget cap. No repositories cloned, no GitHub API search.

## Provenance caveat — read before hard-coding anything below

Every selector string here was extracted by a fetch-and-summarise step over the
raw source file, not by reading the file directly. The citation tells you which
file each string came from, and the strings are reproduced as that step reported
them. **Two failure modes survive that pipeline**: a truncated selector, and a
plausible-looking value the summariser tidied. So:

- Treat each string below as **a place to look**, not as verified truth.
- Before any selector is hard-coded into the Cart, confirm it against the live
  page (§7) or open the cited file directly.
- Nothing below is invented. Where a view has no evidence, it says **no evidence**.

The one class of claim that is *not* subject to this caveat is the negative:
"no project examined did X". Those come from the absence of a reported value
across five files, and absence is what a summariser is least likely to fabricate.

## Sources examined

| # | Project | Platform | Value here |
| --- | --- | --- | --- |
| 1 | [`wuhup/jira-userscripts`](https://github.com/wuhup/jira-userscripts) — 3 scripts | **Jira Cloud** | The whole of the answer. Closest prior art to the Cart that exists. |
| 2 | [`square/jirafy`](https://github.com/square/jirafy) (archived 2024-10-04) | Any page | The text-regex tier, and the only real false-positive defence found. |
| 3 | [`moeyua/jira-helper`](https://github.com/moeyua/jira-helper) | **Jira Server/DC** | Marking already-collected issues in a list. Selectors do not transfer. |
| 4 | [`rybak/atlassian-tweaks`](https://github.com/rybak/atlassian-tweaks) — `jira_copy_summary.user.js` | **Jira Server/DC** | Jira-detection idiom. Selectors do not transfer. |
| 5 | `shridhar-tl/jira-assistant` | Jira Cloud | **Not examined** — fetch budget exhausted at project 4. See §8. |

Unavailable: `raw.githubusercontent.com/rybak/atlassian-tweaks/HEAD/jira-copy-summary.user.js` → HTTP 404; the real filename is `jira_copy_summary.user.js`, with underscores.

**Read the platform column before reusing anything.** Projects 3 and 4 are Jira
Server/Data Center — AUI markup, `#summary-val`, `#stalker`, a global `JIRA.*`
JavaScript object. None of that exists in Jira Cloud. They are included for their
*techniques*, and each such claim is labelled. Two of five projects being
off-platform is the main weakness of this survey.

---

## 1. `wuhup/jira-userscripts` — the one that matters

Three userscripts, all Jira Cloud, all `@grant none`. The README claims coverage
"across the board, backlog, list/table view, epic child items, line cards, linked
work items, and the issue page" — which is very nearly ticket 02's own list of
views. The source largely bears that out.

### 1.1 `Jira Stale Ticket Highlighter.user.js` — the direct analogue of the Cart's scan

This script does what the Cart's primary gesture does: sweep a page, collect
every issue on it, hydrate each from the REST API, decorate each in place. It is
the single most relevant artefact found.

`@match https://*.atlassian.net/*` — one match rule for all views, no route gate.

**The detection net.** One `querySelectorAll` with three alternatives, quoted from
the reported source:

```js
const els = document.querySelectorAll('div[data-testid*="card-content"], div.ghx-issue, a[href*="/browse/"]');
```

Then, per element, walk up to a card container and read a key:

```js
els.forEach((el) => {
  let card = null;
  if (el.tagName === 'A') { ... } else { card = el.closest(...) || el; }
  if (card && !seenCards.has(card)) {
    ... const key = getIssueKeyFromElement(card);
    if (key) targets.push({ key, element: card, context: 'card' });
  }
});
```

**The key extractor — a three-tier cascade.** This is the most important single
finding in this document:

```js
function getIssueKeyFromElement(element) {
  if (element.tagName === 'A') {
    const k = keyFromHref(element.href);
    if (k) return k;
  }
  const link = element.querySelector('a[href*="/browse/"]');
  if (link) {
    const k = keyFromHref(link.href);
    if (k) return k;
  }
  const tm = (element.innerText || '').match(/([A-Z][A-Z0-9]+-[0-9]+)/);
  return tm ? tm[1] : null;
}
```

Read the tiers in order: **own href → descendant `/browse/` link → text regex over
`innerText`**. The text regex is a *last resort inside an element already
identified as a card*, never a sweep over the page. This is precisely the
narrowing ticket 02's question 3 asks about, implemented in production by a third
party, and it is the answer to that question.

**Regexes**, all three as reported:

```js
/\/browse\/([A-Z][A-Z0-9]+-[0-9]+)/
/([A-Z][A-Z0-9]+-[0-9]+)/
/\/browse\/[A-Z][A-Z0-9]+-[0-9]+/
```

Note the key pattern is `[A-Z][A-Z0-9]+-[0-9]+` — **exactly ticket 02's own
`/[A-Z][A-Z0-9]+-\d+/`**, and stricter than this repo's `ISSUE_PATH_RE`
(`[A-Za-z][A-Za-z0-9]*-\d+`, which 02a §2 point 4 already flags as too permissive
for a text scan). Independent convergence on the same shape: uppercase-anchored,
two-or-more leading characters, no single-character project key.

**Card and row containers**, reported from this file:

```
div[data-testid="platform-board-kit.ui.card.card"]
div[data-testid*="card-content"]
div[data-testid*="card-contents.card-container"]
div[data-testid*="issue-line-card.card-container"]
div[data-testid*="merged-cell"]
div.ghx-issue
div.js-issue
```

`div.ghx-issue` and `div.js-issue` are Jira Server/greenhopper classes — this
script carries legacy selectors alongside Cloud ones. `platform-board-kit.ui.card.card`
is a board card. `issue-line-card.card-container` is, on the naming, the renderer
for a linked-work-item or child-issue row — **but which view each of the last
three actually appears in is not stated in the source, and I am not going to
guess.** §7 resolves it.

**Issue-view and modal hooks:**

```
#jira-issue-header
#jira-frontend
[data-testid*="issue.views.issue-base.foundation.summary.heading"]
[data-testid="issue.views.issue-base.foundation.summary.heading"]
[data-testid="issue-field-summary.ui.issue-field-summary-inline-edit--container"]
div[data-testid*="breadcrumbs"]
h1[data-testid*="summary"][data-testid*="heading"]
h1
div[role="dialog"]
div[data-testid*="modal-dialog"]
```

**Exclusions — the false-positive defence:**

```
.ak-renderer-document
.ProseMirror
[contenteditable="true"]
[data-testid*="issue.activity"]
[data-testid*="comment"]
```

This is the answer to "how does it avoid false positives" for this project: it
does not filter the *matches*, it excludes whole **regions** — the rendered
description, the editor, comments, the activity feed. Exactly the regions where a
bare `ABC-123` in prose would produce a spurious hit. Note `.ak-renderer-document`
is the same node this repo selects at
[jira-ux-improvements.user.js:107](../../../src/jira-ux-improvements.user.js#L107)
— we treat it as a target, this script treats it as a no-go area.

**React remounting and virtualisation:**

```js
observer.observe(document.body, { childList: true, subtree: true })
setInterval(onUrlChange, 500)
```

Body-wide `MutationObserver`, subtree on, ignoring mutations caused by its own
injected nodes (`jira-stale-indicator`, `jira-stale-indicator-detail`,
`jira-stale-highlighter-style`), plus a 500 ms `location.href` poll for
pushState. **Virtualisation is never named and never handled.** It falls out of
the design: scrolling a virtualised list mutates `body`'s subtree, the observer
fires, the sweep re-runs, new rows get picked up. Nothing recovers state for rows
that scrolled *out*.

**REST API — and the auth answer.**

```
POST /rest/api/3/issue/bulkfetch
  Headers: Content-Type: application/json, Accept: application/json
  Body: { issueIdsOrKeys: keys, fields: ['updated','created','status'], expand: ['changelog'] }

GET  /rest/api/3/issue/{key}/changelog?startAt={startAt}&maxResults={maxResults}
  Headers: Accept: application/json
```

**No `Authorization` header. No `credentials` option. `@grant none`.** Relative
same-origin URLs, so `fetch` defaults to `credentials: 'same-origin'` and the
browser attaches the existing Jira session cookie. That is the entire
authentication story, and it is the same for both scripts here that call the API.
For the Cart this is the cheapest possible path to summaries: `bulkfetch` with
`fields: ['summary','status']`, one round trip for the whole scan result.

**Deduplication:** `seenCards` (`Set`), `inFlight` (`Set`), `cache` (`Map`, TTL +
LRU), `sessionStorage` under `jiraStaleHighlighter.cache.v2`, and dataset flags
`staleShape`, `staleRel`, `staleReservedTop`, `staleReservedRight`, `staleBorder`,
`staleCheckedKey`, `staleSig`.

Read `seenCards` carefully: it is a `Set` of **DOM elements**, which prevents
double-decorating one node. It is *not* a set of keys, and does not collapse the
same issue appearing as a card and again as a breadcrumb. **Ticket 02's question 4
is therefore unanswered by prior art** — see §5.

### 1.2 `Jira Board or Backlog Indicator.user.js` — fills 02a's biggest gap

```
@match https://*.atlassian.net/jira/*
@match https://*.atlassian.net/browse/*
@grant none
```

**The finding that matters.** Key extraction "matches `/browse/([A-Z]+-[0-9]+)` in
pathname, **or retrieves the `selectedIssue` URL parameter**".

That second path is the answer to 02a §5's "**Issue panel over a board — None.
Not mentioned in any file.**" When Jira opens an issue in a detail panel over a
board or backlog, the key goes into the query string as `selectedIssue`, not into
the path. This repo's `ISSUE_PATH_RE` is `^`-anchored to `/browse/` and matches
`pathname` only ([02a §2](./02a-repo-selector-inventory.md)), so it structurally
cannot see a panel — and now we know what it is missing and how to get it, with
no selector risk at all. **Verify the parameter name in §7 before relying on it.**

Regexes: `/\/browse\/([A-Z]+-[0-9]+)/` and `/\/boards\/(\d+)/`. The first is
*looser* than the sibling script's — `[A-Z]+` where the highlighter uses
`[A-Z][A-Z0-9]+` — so it rejects digits in a project key. Two scripts in one
repository disagreeing on the key pattern is itself worth noting: there is no
single canonical regex, even within one project.

Selectors: `[data-testid="issue.views.issue-base.foundation.quick-add.quick-add-container"]`
(the injection anchor on an issue view), `[data-testid*="breadcrumbs"]`,
`.jira-universal-copy-button-wrapper` (its own).

REST, all Agile v1.0, all same-origin and unauthenticated in code:

```
/rest/agile/1.0/issue/${key}/board
/rest/agile/1.0/board/${boardId}/backlog?jql=...
/rest/agile/1.0/board/${boardId}/issue?jql=...
/rest/agile/1.0/board?projectKeyOrId=...&maxResults=50&startAt=...
```

The last one paginates explicitly — relevant to ticket 01 if the Cart ever
resolves board membership.

Remount handling: body-wide `MutationObserver` debounced **1000 ms** to
`updateIndicator()`, plus a 1000 ms `location.href` poll. Dedup: `CACHE` (`Map`)
keyed `${boardId}:${key}` — a **composite key**, the first prior art here to key a
cache by anything other than a bare issue key — plus `indicatorPlacedForKey` and
`processingKey` as re-entrancy guards.

### 1.3 `Jira Copy Key and Title Button.user.js` — key *and* summary from the DOM

```
@match https://*.atlassian.net/browse/*
@match https://*.atlassian.net/jira/*
@match https://*.atlassian.net/*issues*
@match https://*.atlassian.net/jira/polaris/*
```

The third match rule is the first evidence in this whole research pass of anything
targeting the **issue navigator / search results** route (`*issues*`) — 02a §5
records "None. Nothing at all." for that view. It proves only that the script
*runs* there, not that it detects anything there.

**Key and summary, quoted:**

```js
issueKey = context.querySelector('a[data-testid*="breadcrumbs.current-issue.item"] span')?.textContent?.trim()
        || context.querySelector('[data-testid*="key-renderer.issue-key-renderer.text"]')?.textContent?.trim()
issueTitle = context.querySelector('h1[data-testid*="summary.heading"]')?.textContent?.trim()
```

Three things to take from this:

1. **`key-renderer.issue-key-renderer.text` is a key-bearing element with no
   `href`** — a rendered text node whose testid announces it holds an issue key.
   This is the most direct evidence found that Jira Cloud marks keys structurally
   outside of links. It is exactly the "not always `<a href>`" case ticket 02
   raises. **Which views it appears in is not stated. §7 must establish that.**
2. **`context` is a parameter, not `document`.** The script resolves a scope first
   — `section[role="dialog"][data-testid*="modal-dialog"]` for a modal, the
   document otherwise — then queries within it. That is how one selector set
   serves both the full issue view and the panel: scope, then query. The Cart
   should copy this shape.
3. **`document.title` is the fallback** when the summary element has no text
   (`const docTitle = document.title`). Independent confirmation of 02a §4's
   "best cheap add-the-issue-I-am-looking-at path".

Product Discovery gets its own pair, since Polaris does not share the issue
view's testids:

```
a[data-testid="polaris-ideas.ui.idea-view.breadcrumbs.key.key"]
div[data-testid="polaris-ideas.ui.idea-view.summary.container"]
div[data-testid="polaris-ideas.ui.idea-view.collaboration-controls.more-button-container"]
```

No regex anywhere in this script, and no REST call — key and summary both come
from the DOM. Remount handling is the crudest of the three: `setInterval(initPlugin, 1500)`,
no observer.

### 1.4 The pattern across all three: substring matching as rot insurance

Count the reported selectors: `data-testid*=` vastly outnumbers `data-testid=`.
`[data-testid*="breadcrumbs"]`, `[data-testid*="summary.heading"]`,
`[data-testid*="card-content"]`, `[data-testid*="modal-dialog"]`,
`[data-testid*="comment"]`.

This is a deliberate hedge, and a technique this repo does not use — 02a §4 records
exactly one prefix match (`data-testid^=` in the backlog script) and otherwise
exact equality throughout. Substring matching survives Atlassian re-namespacing a
component while keeping the leaf name, which is the commonest way these values
change. It costs precision: `[data-testid*="comment"]` will match a good deal more
than comments.

Worth adopting for the *leaf* of a hierarchical testid, where the leaf name is the
stable part and the namespace prefix is the churning part.

---

## 2. `square/jirafy` — the text-regex tier, done properly

Archived 2024-10-04. A linkifier: it runs on arbitrary configured pages, not on
Jira, and rewrites plain-text keys into links. Backwards from the Cart's problem,
but it is the only project examined that solves "find keys in arbitrary text"
head-on, and its false-positive defence is the strongest found.

**The regex is built, not written:**

```js
"(browse/)?((" + projectKeys.join('|') + ")-\\d+)"
```

There is **no `[A-Z][A-Z0-9]+` in jirafy at all.** The project keys are enumerated
and pipe-joined into an alternation, so the pattern matches only keys of projects
that actually exist. The list comes from `rest/api/2/project`
(`ext/config.js`, alongside stored settings `urls_to_jirafy`, `ignore_elements`,
`project_keys`, `jira_server`, `new_window`).

That single decision removes almost the whole false-positive class ticket 02
worries about. `UTF-8`, `COVID-19`, `ISO-8601`, a version string like `RELEASE-2`,
a commit prefix — none of them match, because none is a project key. The generic
pattern cannot make that distinction at any level of cleverness.

**Traversal** is a hand-rolled recursive walk, not a `TreeWalker`:
`var node = parent.firstChild`, then `while (node = node.nextSibling)`, switching
on `node.nodeType` (1 for elements, 3 for text).

**Skips**, quoted:

```js
ignore = ['a', 'textarea'].concat(ignoreElements)
```

`<a>` and `<textarea>` are hard-coded; the user-configurable `ignore_elements`
defaults to `"pre,code"`. So: never inside an existing link, never inside an
editable field, never inside code by default.

**Re-processing** is avoided by inspecting capture group 1 — `if (arguments[1]) return`
— i.e. if the match already carried a `browse/` prefix it was already a link, skip.

**Remount handling is the weakest of the five**, and instructive: no
`MutationObserver` at all, but a debounced `DOMNodeInserted` listener
(`addDebouncedEventListener(document, "DOMNodeInserted", nodeInsertDetected, 1000)`).
`DOMNodeInserted` is a deprecated mutation event, synchronous and slow. On a React
application it would be a performance problem. This is a project that predates the
modern idiom, which is part of why it is archived.

---

## 3. `moeyua/jira-helper` — Jira Server. Marking collected issues in a list.

**`@match https://jira-yzwl.wisedu.com/**` — a single self-hosted Jira
Server/DC instance.** AUI markup, `#key-val`, `#stalker`, `aui-toolbar2-primary`.
**None of its selectors transfer to Jira Cloud.** Included for one technique and
one fact.

**The fact.** The issue-navigator rows are iterated and the key read from an
attribute:

```js
issueList.childNodes.forEach((issue) => { const issueNumber = issue.getAttribute('data-key');
```

So **Jira Server puts `data-key` on issue-navigator rows.** 02a §1.1 records that
`data-issue-key` "appears nowhere" in this repo, with "no evidence that Jira
exposes such an attribute, and no evidence that it does not." This is now
*partial* evidence — for Server, under the name `data-key`. It is **not evidence
for Cloud**, whose issue navigator is a different React application entirely.
Cheap to check, and §7 checks it.

**The technique.** Collected issues are marked with a `.marked` class
(`background-color: rgb(173, 217, 188)`), and the set persists in
`localStorage.setItem(this.key, JSON.stringify(this.value))` under `jira-helper`.
A persisted key set plus a class re-applied on render is the shape the Cart needs
for "mark references already in the cart" — and it composes with this repo's
better mechanism, the `<html>`-attribute + CSS pattern from
[02a §4](./02a-repo-selector-inventory.md), which survives a React remount with no
watcher at all.

The row selector is a nine-level descendant chain
(`#main > div > div.navigator-group > div > div > ... > ol`). Its own object lesson.

Two `MutationObserver`s on `document.body`. No regex — the attribute makes one
unnecessary. No REST call.

---

## 4. `rybak/atlassian-tweaks` / `jira_copy_summary.user.js` — Jira Server

`@match https://jira.example.com/browse/*` (a placeholder the user edits).
Again **Server/DC**: `#summary-val`, `#stalker`, `.aui-page-header-main`,
`#dx-issuekey-val-h1`. Selectors do not transfer.

Two techniques worth carrying:

**A layered key extractor that prefers the application's own API to any
selector.** `getCurrentIssueKey()` tries `JIRA.Issue.getIssueKey()` first — the
page's own global — and only falls back to
`#dx-issuekey-val-h1 a` / `.aui-page-header-main .issue-link` and
`dataset.issueKey`. Ask the application, then scrape.

Jira Cloud has no equivalent public global, so the direct translation is
unavailable. The Cloud analogue of "ask the application" is the URL and
`document.title` — both already proven in this repo, both selector-free.

Note `dataset.issueKey` — i.e. `data-issue-key` — appearing on Server issue links.
Second independent sighting of a key-bearing data attribute in Server, after §3's
`data-key`. Still no Cloud sighting.

**A platform probe:** `meta[name="application-name"]`, plus
`meta[name="ajs-jira-base-url"]` for the instance URL. A cheap "is this Jira, and
which Jira" test that does not depend on the URL pattern. Whether Cloud emits
either meta tag is unknown — worth one glance in §7.

**Remount handling is the most reliable of the five, and unavailable to us:**

```js
JIRA.bind(JIRA.Events.NEW_CONTENT_ADDED, () => {
  console.log("Something changed, recreating button...");
  createButton();
});
```

Server broadcasts a re-render event and the script subscribes. No polling, no
observer, no guessing. Jira Cloud publishes no such event — which is why every
Cloud script in this survey falls back to a body-wide observer or an interval.

No regex, no REST fetch, and **no comment anywhere explaining or hedging a
selector choice** — notable, because this repo's scripts are dense with exactly
those comments (02a §3).

---

## 5. What this cross-checks in `02a`, and what it adds

### 5.1 Independently corroborated

Four of this repo's load-bearing hooks are now confirmed by an unrelated project:

| Hook | This repo | Corroboration |
| --- | --- | --- |
| `[data-testid="issue.views.issue-base.foundation.summary.heading"]` | [jira-ux-improvements.user.js:112-113](../../../src/jira-ux-improvements.user.js#L112-L113) | `Jira Stale Ticket Highlighter.user.js`, exact string |
| `#jira-frontend` | [:524](../../../src/jira-ux-improvements.user.js#L524), [backlog:454](../../../src/jira-backlog-sprints.user.js#L454) | `Jira Stale Ticket Highlighter.user.js` |
| `#jira-issue-header` | [:522](../../../src/jira-ux-improvements.user.js#L522) | `Jira Stale Ticket Highlighter.user.js` |
| breadcrumbs region | `[data-component-selector="breadcrumbs-wrapper"]` [:105](../../../src/jira-ux-improvements.user.js#L105) | reached instead via `div[data-testid*="breadcrumbs"]` — a *different* attribute family for the same region, so there are two independent ways in |

The summary-heading testid having two independent witnesses is the strongest
single selector result in this survey. It is also the one the Cart most needs.

### 5.2 One more corroboration, from a blog rather than source

The backlog card's key element is reported as
`[data-test-id="software-backlog.card-list.card.card-contents.accessible-card-key"] > a:first-child`,
with a `MutationObserver` on `document.body` `{ subtree: true, childList: true }`,
in [an Atomic Object post on customising Jira with Tampermonkey](https://spin.atomicobject.com/jira-tampermonkey/).

**This is a blog post, not source, and it is the one claim here not from a
repository — weigh it accordingly.** It is worth including because it slots
exactly into the namespace this repo already proved:
`software-backlog.card-list.container.<sprintId>`
([jira-backlog-sprints.user.js:128](../../../src/jira-backlog-sprints.user.js#L128)),
extended by `.card.card-contents.accessible-card-key`. Same `software-backlog.card-list.`
root, one level deeper. It also implies the key sits in an `<a>` — so the
href tier reaches backlog cards.

**Note the spelling: `data-test-id`, hyphenated, not `data-testid`.** Every value
in this repo and every Cloud value in §1 uses `data-testid`. Either Jira emits
both spellings in different components, or the blog has a typo. **Do not encode
either spelling until §7 settles it.** This is exactly the kind of detail that
would silently break a scanner.

### 5.3 Gaps in 02a §5 that prior art narrows

| 02a verdict | What prior art adds |
| --- | --- |
| Issue panel over a board — **None** | The `selectedIssue` **URL query parameter** (§1.2). Selector-free. The most valuable single find in this survey. |
| Board cards — **None. Nothing at all.** | `div[data-testid="platform-board-kit.ui.card.card"]`, `div[data-testid*="card-content"]` (§1.1) |
| Backlog issue cards — **Zero** | `software-backlog.card-list.card.card-contents.accessible-card-key` (§5.2, blog-sourced, unverified spelling); plus `a[href*="/browse/"]` reaching them |
| Epic children / issue links — **None** | `issue-line-card.card-container`, `merged-cell` (§1.1) — **names only; the view each belongs to is not evidenced** |
| Search / issue navigator — **None** | A script that *runs* there (`@match .../*issues*`, §1.3). Cloud detection selector: **no evidence.** Server uses `data-key` on rows (§3) |
| Timeline / roadmap | README claims coverage via the generic net; **no timeline-specific selector in any source. No evidence.** |
| Dashboard gadget | **No evidence.** Not touched by any of the five projects. |

Plus one hook with no counterpart in this repo at all:
`[data-testid*="key-renderer.issue-key-renderer.text"]` — a key in rendered text,
no link. The literal "not always `<a href>`" case, named by Atlassian's own testid.

### 5.4 Questions prior art does *not* answer

**Question 4, deduplication — nothing.** Not one of the five collects a set of
issues. Every dedup mechanism found guards against decorating the same *node*
twice (`seenCards` as a `Set` of elements, `indicatorPlacedForKey`, dataset flags)
or caches an API response by key. Collapsing one issue appearing as a card, a
breadcrumb, and a link in a description into a single cart entry is the Cart's own
problem, and 02a §5 was right that there is no precedent. The Cart's collection
must be keyed by issue key, with the element list as a secondary index — the
inverse of how every project here stores it.

**Question 6, virtualisation — nothing, and the silence is the finding.** No
project names virtualisation. All three Cloud scripts observe `document.body` with
`subtree: true`, so a virtualised scroll incidentally re-triggers the sweep. None
tracks rows that scrolled *out*, and none knows how many rows exist versus how
many are rendered. So the fog 02a §5 point 6 records is untouched by prior art:
it will only lift in §7.

### 5.5 Where this repo is already ahead

Remount and mount detection, across all five projects:

| Project | Mechanism |
| --- | --- |
| Stale Highlighter | body `MutationObserver` + 500 ms href poll |
| Board/Backlog Indicator | body `MutationObserver` debounced 1000 ms + 1000 ms href poll |
| Copy Key and Title | `setInterval(initPlugin, 1500)`, no observer |
| jirafy | debounced `DOMNodeInserted` (deprecated) |
| jira_copy_summary | `JIRA.Events.NEW_CONTENT_ADDED` (Server only; unavailable on Cloud) |

**Not one Cloud project uses the `animationstart` mount detector** that this repo
runs in three scripts
([02a §4](./02a-repo-selector-inventory.md), [jira-ux-improvements.user.js:242-255](../../../src/jira-ux-improvements.user.js#L242-L255)).
It is strictly better than everything in that table: the CSS engine does the
matching, it fires per-element with the element in hand rather than per-mutation-batch,
it needs no debounce, and it costs nothing when nothing matches. The prior art
should not talk us out of it. Its one real limitation is that it announces
*arrivals* only — a row scrolling out of a virtualised list fires nothing — so a
`MutationObserver` may still be wanted for removals, if the Cart turns out to care
about removals at all.

Likewise this repo's two-witness contract check with an on-page badge
([jira-backlog-sprints.user.js:386-428](../../../src/jira-backlog-sprints.user.js#L386-L428))
has **no counterpart in any of the five**. All of them fail silently. For a Cart
whose failure mode is "scanned this page, found 0 issues" — indistinguishable from
a rotted selector, as 02a §3 argues — that machinery is the differentiator.

---

## 6. What this means for the Cart

### Recommended detection strategy

**A four-tier cascade, region-scoped, keyed by issue key.** Adapted from §1.1,
which is the closest thing to a proven design that exists for this problem.

**Tier 0 — the free ones. No selector, no risk.**
`ISSUE_PATH_RE` on `location.pathname` for `/browse/KEY`
([jira-ux-improvements.user.js:177](../../../src/jira-ux-improvements.user.js#L177)),
the `selectedIssue` query parameter for the detail panel (§1.2, verify the name),
and the `document.title` parse for key + summary together
([:298-306](../../../src/jira-ux-improvements.user.js#L298-L306)). These give the
issue the user is looking at on every view, and cannot rot.

**Tier 1 — `a[href*="/browse/"]` across the scan root.** One selector, every view,
zero Atlassian-internal naming. Parse each `href` with the existing anchored
`ISSUE_PATH_RE`, not a loose text regex. §5.2 suggests this alone reaches backlog
cards; §1.1 makes it one of only three entry points in the closest analogue.
**This is the backbone.**

**Tier 2 — a small container list, for anchoring and grouping, not for finding.**
`platform-board-kit.ui.card.card`, `card-contents.card-container`,
`issue-line-card.card-container`, `software-backlog.card-list.card.*`, and
`key-renderer.issue-key-renderer.text` for the no-href case. Match on the testid
**leaf** with `*=`, per §1.4, not on the full dotted path. Two jobs: give a tier-1
hit a card to decorate (`closest()`), and catch the button/plain-element
references tier 1 structurally cannot see. Every entry needs live verification
(§7) and a named fallback, as
[jira-ux-improvements.user.md:309-313](../../../src/jira-ux-improvements.user.md#L309-L313)
already requires.

**Tier 3 — text regex, `/[A-Z][A-Z0-9]+-\d+/`, only inside a tier-2 container that
tiers 1 and 2 failed on.** Never over `document.body`. Ticket 02's pattern
verbatim, which is also §1.1's — not this repo's looser `ISSUE_PATH_RE` body,
which 02a §2 point 4 correctly warns against lifting.

**Region exclusions, applied before any tier runs.** §1.1's list, which is the
cheapest correctness win available: `.ak-renderer-document`, `.ProseMirror`,
`[contenteditable="true"]`, `[data-testid*="comment"]`, `[data-testid*="issue.activity"]`.
This is what makes tier 3 safe — it removes the prose regions where a bare key is
a mention rather than a reference. It is also what settles ticket 02's question 3
in the affirmative: **a text regex is affordable, because it never runs where the
false positives live.** Note this repo currently treats `.ak-renderer-document` as
a *target*; for the Cart it is a no-go area.

**Dedup by key, in a `Map<key, {summary, elements[]}>`,** insertion-ordered so page
order is preserved — the `groupByBoard` shape from
[jira-backlog-sprints.user.js:340-346](../../../src/jira-backlog-sprints.user.js#L340-L346).
Prior art offers nothing here (§5.4); do not look for a pattern to copy.

**Summaries: DOM first, `bulkfetch` second.** Take the summary from the card when
it is beside the key. For the rest, one `POST /rest/api/3/issue/bulkfetch` with
`fields: ['summary','status']`, relative URL, no auth header, no `credentials`
option — §1.1 proves the session cookie carries it under `@grant none`.

**Two-witness check on every scan.** `keys === 0 && cardContainers > 0` is the
Cart's exact analogue of the backlog script's `foreign === 0 && linkRows > 0`
([jira-backlog-sprints.user.js:417-421](../../../src/jira-backlog-sprints.user.js#L417-L421)),
and no project in this survey has anything like it.

**Rescan on `animationstart`, not on a body observer.** §5.5.

### The trade-off I am recommending against

**Making the per-view `data-testid` container list the primary detector** — the
approach §1.1 actually ships, with its board-kit, card-content, line-card and
merged-cell selectors as the front line.

It is tempting because it is the only tier that finds references with no `href`,
and because it hands you the card element you need to decorate. I am pushing it
back to tier 2 anyway:

- 02a §3 already documents testid rot as a standing risk in this repo, with a
  measured breakage on the breadcrumbs.
- §1.1's author evidently agrees: nearly every one of those selectors is written
  with `*=` rather than `=`, which is what hedging against rot looks like in
  practice.
- Two scripts in that same repository cannot agree on the issue-key regex (§1.2),
  and one still carries Jira Server classes (`div.ghx-issue`, `div.js-issue`)
  alongside Cloud ones. That is a codebase absorbing platform churn, not a stable
  contract.
- Ticket 02 asks directly whether "one selector that covers most views, plus a
  text-regex fallback, may beat seven brittle selectors." On this evidence: yes —
  `a[href*="/browse/"]` plus region-scoped text is the durable core, and the
  testid list is the enrichment that degrades gracefully when a name changes.

**What that costs, stated plainly.** Any reference that is a button or a plain
clickable element with no descendant `/browse/` link and no visible key text is
invisible to tiers 0, 1 and 3 — it is *only* reachable through the tier-2 list I
am demoting. If §7 finds that a whole view works that way — a dashboard gadget, or
a timeline bar — then for that view the brittle list is not the enrichment, it is
the only thing there is, and this recommendation inverts. **§7's job is to find
out whether such a view exists**, and the honest position is that nothing in this
survey rules it out.

Second, smaller trade-off I am recommending against: **jirafy's project-key
allowlist** (§2) as a gate on detection. It is the best false-positive defence
found and it removes `UTF-8` and `COVID-19` outright. But it needs
`rest/api/2/project` to resolve before the first scan can work, it silently drops
references to projects outside the list, and region exclusions already buy most of
the benefit for free. Hold it in reserve for tier 3 only, and only if §7 shows the
text tier misfiring in practice.

---

## 7. What the live-DOM survey must still answer

A devtools pass, one instruction per view, ~15 minutes. Everything below is
something this survey could not settle. Record verbatim — a mistyped testid is
worse than a blank.

Run with the Elements panel open and this in the console:

```js
const K = /^[A-Z][A-Z0-9]+-\d+$/;
copy([...document.querySelectorAll('[data-testid],[data-test-id]')]
  .filter(e => K.test(e.textContent.trim()))
  .map(e => (e.getAttribute('data-testid') ?? 'data-test-id:' + e.getAttribute('data-test-id'))
            + '  ⟵  ' + e.textContent.trim())
  .join('\n'));
```

That prints every element on the page whose entire text is an issue key, next to
its testid — which is the survey, mostly, per view. Also run
`document.querySelectorAll('a[href*="/browse/"]').length` on each view to size the
tier-1 backbone.

1. **Settle the attribute spelling first.** Open any board or backlog. In the
   console run `document.querySelectorAll('[data-test-id]').length` and
   `document.querySelectorAll('[data-testid]').length`. Record both numbers. This
   decides whether §5.2's hyphenated `data-test-id` is real or a blog typo, and it
   is a prerequisite for everything else.

2. **Issue view** (`/browse/KEY`). Inspect the key in the breadcrumb. Record
   whether `breadcrumbs.current-issue.item` and
   `key-renderer.issue-key-renderer.text` (§1.3) both exist here, their full
   testids, and whether either carries a `data-issue-key` or `data-key` attribute.
   Then confirm `issue.views.issue-base.foundation.summary.heading` still matches —
   it is the one hook with two independent witnesses and the Cart leans on it.

3. **Issue panel over a board.** Open a board, click a card so the detail panel
   opens. Record the **full URL**. Confirm the key appears as `selectedIssue=` and
   record the exact parameter name and spelling (§1.2). Then record whether the
   panel is wrapped in `[role="dialog"]` and whether the summary heading testid
   inside the panel is identical to the one from step 2 — that decides whether
   §1.3's `context`-scoping trick is needed or whether one document-wide query
   serves both.

4. **Backlog.** Inspect one issue card's key element. Record its full testid
   (expected to extend `software-backlog.card-list.` per §5.2) and whether the key
   sits inside an `<a href="/browse/...">`. Then, for virtualisation: run
   `document.querySelectorAll('a[href*="/browse/"]').length`, scroll to the bottom
   of a long sprint, run it again, and record both numbers plus the sprint's stated
   issue count. **That comparison is the whole virtualisation answer for the
   backlog** — 02a proved the 33 sprint *containers* are all present but says
   nothing about the cards inside them.

5. **Board.** Inspect a card. Record whether `platform-board-kit.ui.card.card`
   (§1.1) matches, and record the testid of the element holding the key. Record
   whether the summary text is present on the card and, if so, its testid — 02a §5
   point 5 flags this as a cheap win and it is unverified everywhere.

6. **Search results / issue navigator.** Open a JQL search with 50+ results. This
   is the emptiest cell in both documents — **no Cloud evidence at all.** Record
   the row element, the testid of the key cell, whether the row carries `data-key`
   (Server does, §3; Cloud unknown), and `a[href*="/browse/"]` count versus the
   result count Jira reports. Note the route, to confirm §1.3's `*issues*` match.

7. **Epic children table and the issue-links section.** Open an epic, then an
   issue with linked work items. Record which of `issue-line-card.card-container`,
   `card-contents.card-container` and `merged-cell` (§1.1) matches in which of the
   two, since the source does not say. Confirm each row's key is inside an
   `<a href>` — if it is, tier 1 covers both and the testids are only needed for
   anchoring.

8. **Timeline / roadmap.** Open a project timeline. Record whether an issue key is
   in the DOM at all for a bar (as against being drawn from data the row never
   renders as text), and the testid of whatever holds it. **No project in this
   survey has a timeline-specific selector.** Then scroll vertically and re-run
   the `a[href*="/browse/"]` count — [jira-show-fixversion-dates.user.js:135-139](../../../src/jira-show-fixversion-dates.user.js#L135-L139)
   says plan-timeline rows are virtualised, so expect churn and record it.

9. **Dashboard gadget.** Open a dashboard with a filter-results gadget. Record
   whether the gadget is in an `<iframe>` — if it is, that settles the view for the
   Cart on its own and nothing else about it matters. If not, record the row and
   key testids. **Zero prior evidence for this view anywhere.**

10. **Two cheap probes, once, on any view.** `document.querySelector('meta[name="application-name"]')?.content`
    and `document.querySelector('meta[name="ajs-jira-base-url"]')?.content` (§4).
    If Cloud emits either, the Cart gets a selector-free platform check.

11. **The false-positive baseline.** On an issue whose description mentions other
    issue keys in prose, run tier 3 blind:
    `[...document.body.innerText.matchAll(/[A-Z][A-Z0-9]+-\d+/g)].length`, then
    count how many are genuine references. Record both. That single ratio is the
    empirical answer to ticket 02's question 3, and it decides whether region
    exclusions are sufficient or jirafy's project-key allowlist is needed after all.

---

## 8. Limits of this pass

- **Two of five projects are Jira Server/DC**, not Cloud (§3, §4). Their selectors
  are useless to the Cart and are marked as such throughout. Effectively this is a
  three-project Cloud survey, and one of those three (`wuhup`) carries most of the
  weight.
- **`shridhar-tl/jira-assistant` was not examined.** The 15-fetch budget ran out at
  project 4. It is the largest open-source Jira Cloud extension found and the
  obvious next read — though the question it was queued for, REST authentication,
  is already answered concretely by §1.1 and §1.2: relative same-origin URL, no
  auth header, no `credentials` option, session cookie.
- **Every selector here is second-hand.** See the provenance caveat at the top.
- **No `data-testid` was invented.** Where a view has no evidence — timeline,
  dashboard gadget, Cloud issue navigator — it says so.
- **The one non-source claim** is §5.2's backlog card key, from a blog post, with
  an attribute spelling that contradicts every other value in this document. It is
  flagged in place and step 1 of §7 exists to settle it.
- `grep.app` was not used, per the constraint. No repository was cloned; no GitHub
  API search was made.
