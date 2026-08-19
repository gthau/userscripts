# 02c — Live survey: your devtools pass

**This is the only part of the Jira Cart research that no agent can do.** It needs
your logged-in Jira. Everything else is done.

Fill in the blanks below. Paste raw output — do not tidy it, do not summarise it.
A verbatim ugly paste is worth more here than a clean description.

- **Part 1** takes ~5 minutes and closes ticket `01` (the REST API).
- **Part 2** takes ~15 minutes and closes ticket `02` (finding issue references).

Do Part 1 first. If it fails outright, Part 2 still matters but the item model
changes shape, so tell me before you spend the 15 minutes.

---

## Part 1 — Does the REST API answer a browser call? (ticket 01)

Open any issue in your Jira, in a normal logged-in tab. Open devtools → Console.

**Edit the first two lines**, then paste the whole thing:

```js
(async () => {
  const KEY     = 'REPLACE-1';        // <-- a real issue key you can open
  const MISSING = 'ZZZZ-99999';       // <-- a key that does NOT exist
  const log = [];
  const probe = async (label, res) => {
    const ct = res.headers.get('content-type') || '(none)';
    let body;
    try {
      body = ct.startsWith('application/json')
        ? JSON.stringify(await res.json(), null, 1)
        : (await res.text()).slice(0, 300);
    } catch (e) { body = 'parse failed: ' + e.message; }
    log.push(label, '  status: ' + res.status, '  content-type: ' + ct,
             '  body: ' + body.slice(0, 2000), '');
  };
  await probe('A) GET single issue', await fetch(
    `/rest/api/3/issue/${KEY}?fields=summary,status,issuetype,parent`,
    { headers: { Accept: 'application/json' } }));
  await probe('B) POST bulkfetch, mixed batch', await fetch(
    '/rest/api/3/issue/bulkfetch', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json',
                 'X-Atlassian-Token': 'no-check' },
      body: JSON.stringify({ issueIdsOrKeys: [KEY, MISSING],
                             fields: ['summary', 'status'], fieldsByKeys: false }),
    }));
  const out = log.join('\n');
  console.log(out); copy(out); return '--- copied to clipboard ---';
})()
```

It copies its own output to your clipboard. Paste it here:

```
A) GET single issue
  status: 200
  content-type: application/json;charset=UTF-8
  body: {
 "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",
 "id": "629954",
 "self": "https://dalet.atlassian.net/rest/api/3/issue/629954",
 "key": "RDC-14817",
 "fields": {
  "summary": "Rundown - Full Day Pattern Epic split: Apply Pattern advanced/nice-to-have functionalities",
  "issuetype": {
   "self": "https://dalet.atlassian.net/rest/api/3/issuetype/27",
   "id": "27",
   "description": "A collection of related bugs, stories, and tasks.",
   "iconUrl": "https://dalet.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/17247?size=medium",
   "name": "Epic",
   "subtask": false,
   "avatarId": 17247,
   "hierarchyLevel": 1
  },
  "status": {
   "self": "https://dalet.atlassian.net/rest/api/3/status/11916",
   "description": "",
   "iconUrl": "https://dalet.atlassian.net/images/icons/statuses/generic.png",
   "name": "In Design",
   "id": "11916",
   "statusCategory": {
    "self": "https://dalet.atlassian.net/rest/api/3/statuscategory/4",
    "id": 4,
    "key": "indeterminate",
    "colorName": "yellow",
    "name": "In Progress"
   }
  }
 }
}

B) POST bulkfetch, mixed batch
  status: 200
  content-type: application/json;charset=UTF-8
  body: {
 "expand": "names,schema",
 "issues": [
  {
   "expand": "operations,versionedRepresentations,editmeta,changelog,renderedFields",
   "id": "629954",
   "self": "https://dalet.atlassian.net/rest/api/3/issue/629954",
   "key": "RDC-14817",
   "fields": {
    "summary": "Rundown - Full Day Pattern Epic split: Apply Pattern advanced/nice-to-have functionalities",
    "status": {
     "self": "https://dalet.atlassian.net/rest/api/3/status/11916",
     "description": "",
     "iconUrl": "https://dalet.atlassian.net/images/icons/statuses/generic.png",
     "name": "In Design",
     "id": "11916",
     "statusCategory": {
      "self": "https://dalet.atlassian.net/rest/api/3/statuscategory/4",
      "id": 4,
      "key": "indeterminate",
      "colorName": "yellow",
      "name": "In Progress"
     }
    }
   }
  }
 ],
 "issueErrors": []
}
```

**What this settles, so you know why you're doing it:** the research could not read
Atlassian's reference pages for either endpoint. The single-issue path is
convention, and the bulkfetch response schema — the thing that tells the Cart
*which* keys failed — was only ever seen second-hand. Both are load-bearing for
tickets 05 and 06.

Three things to eyeball in the output yourself:

- Did **A** return your issue's summary as JSON? → the read path works.
- In **B**, is the real key under an `issues` array and the missing key under a
  separate errors key? **Write down the exact field name**, whatever it is.
- Did **B** work *without* the `X-Atlassian-Token` header mattering? (Optional:
  re-run B with that header line deleted. One line, tells us if POST needs it.)

### 1b — The logged-out check

Open a **private/incognito window**, go to `https://<your-site>.atlassian.net`
while logged out, and run the same snippet.

The question is whether Jira answers a logged-out API call with a clean `401`, or
with **HTTP 200 and an HTML login page**. If it's the latter, a Cart that trusts
the status code would silently store login-page HTML as issue summaries. Just
record the status and content-type — the body doesn't matter.

```
// comment: opening `https://<your-site>.atlassian.net` while logged out automatically redirects to `https://id.atlassian.com/login?continue=https%3A%2F%2Fid.atlassian.com%2` (more query params...)

A) GET single issue
  status: 200
  content-type: text/html
  body: <!DOCTYPE html><html lang="en"><head><link rel="stylesheet" href="https://id-frontend.prod-east.frontend.public.atl-paas.net/assets/index.19f82625.css" crossorigin="anonymous"><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width

B) POST bulkfetch, mixed batch
  status: 400
  content-type: application/json
  body: {
 "message": "",
 "status": 400
}
```

---

## Part 2 — Where do issue keys live in the DOM? (ticket 02)

One snippet, run once per view. It's self-contained, so you can paste it again on
each page without any "already declared" errors. It copies its output to your
clipboard each time.

```js
(() => {
  const K = /^[A-Z][A-Z0-9]+-\d+$/;
  const seen = new Map();
  for (const e of document.querySelectorAll('[data-testid],[data-test-id]')) {
    const t = (e.textContent || '').trim();
    if (!K.test(t)) continue;
    const id = e.getAttribute('data-testid')
      ?? 'data-test-id:' + e.getAttribute('data-test-id');
    if (!seen.has(id)) seen.set(id, { n: 0, sample: t, tag: e.tagName.toLowerCase(),
                                      inLink: !!e.closest('a[href*="/browse/"]') });
    seen.get(id).n++;
  }
  const out = [
    'URL: ' + location.href,
    '[data-testid] elements:  ' + document.querySelectorAll('[data-testid]').length,
    '[data-test-id] elements: ' + document.querySelectorAll('[data-test-id]').length,
    'a[href*="/browse/"]:     ' + document.querySelectorAll('a[href*="/browse/"]').length,
    '[role="dialog"]:         ' + document.querySelectorAll('[role="dialog"]').length,
    'iframes:                 ' + document.querySelectorAll('iframe').length,
    'meta application-name:   ' + (document.querySelector('meta[name="application-name"]')?.content ?? '(none)'),
    'meta ajs-jira-base-url:  ' + (document.querySelector('meta[name="ajs-jira-base-url"]')?.content ?? '(none)'),
    'bare keys in page text:  ' + [...document.body.innerText.matchAll(/[A-Z][A-Z0-9]+-\d+/g)].length,
    '',
    'testids whose entire text is an issue key (' + seen.size + ' distinct):',
    ...[...seen].map(([id, v]) =>
      `  ${id}\n      x${v.n}  <${v.tag}>  e.g. ${v.sample}  inBrowseLink=${v.inLink}`),
  ].join('\n');
  console.log(out); copy(out); return '--- copied to clipboard ---';
})()
```

For **virtualised lists** (backlog, board, timeline, long search results) also do
this — it tells us whether off-screen issues exist in the DOM at all:

```js
// before scrolling:
window.__before = document.querySelectorAll('a[href*="/browse/"]').length
// now scroll the list to the very bottom, then:
'before: ' + window.__before + '   after: ' + document.querySelectorAll('a[href*="/browse/"]').length
```

### The views

For each one: run the snippet, paste the output, and **right-click one issue key →
Inspect → right-click the element → Copy → Copy outerHTML** into the second block.

---

#### 1. Issue view — open any issue directly (`/browse/KEY`)

```
URL: https://dalet.atlassian.net/browse/RDC-14817
[data-testid] elements:  765
[data-test-id] elements: 0
a[href*="/browse/"]:     32
[role="dialog"]:         0
iframes:                 4
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  14

testids whose entire text is an issue key (5 distinct):
  issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container
      x1  <div>  e.g. RDC-14817  inBrowseLink=false
  issue.views.issue-base.foundation.breadcrumbs.current-issue.item
      x1  <a>  e.g. RDC-14817  inBrowseLink=true
  native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell
      x10  <a>  e.g. RDC-1894  inBrowseLink=true
  hover-card-trigger-wrapper
      x1  <span>  e.g. RDC-15602  inBrowseLink=false
  issue.issue-view.views.common.issue-line-card.issue-line-card-view.key
      x1  <a>  e.g. RDC-15602  inBrowseLink=true
```
```html
<div data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container" role="listitem"><div data-testid="issue-view-foundation.noneditable-issue-type.tooltip--container" role="presentation"><div><button aria-label="Epic" data-testid="issue-view-foundation.noneditable-issue-type.button" disabled="" tabindex="-1" type="button" data-dashlane-label="true"><span><img src="https://dalet.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/17247?size=xsmall" width="16px" height="16px" alt="Epic" draggable="false" data-vc="common-components-async-icon"></span></button></div></div><div role="presentation"><li><a aria-current="page" target="_blank" data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item" href="/browse/RDC-14817" tabindex="0" style="padding-block: var(--ds-space-025, 2px); font-weight: var(--ds-font-weight-regular, 400);"><span>RDC-14817</span></a></li></div><div data-testid="issue.common.component.permalink-button.button.copy-link-button-wrapper"><div><div><div role="presentation" data-ds--text-field--container="true" style="max-width: 100%;"><input aria-hidden="true" id="BreadcrumbCurrentIssue" label="Copy link" tabindex="-1" data-ds--text-field--input="true" name="field-copy-text" readonly="" value=""></div></div><span role="presentation"><button tabindex="0" type="button"><span><span data-testid="issue.common.component.permalink-button.button.link-icon" role="img" aria-label="Copy link" style="color: currentcolor;"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M8.22 2.22a3.932 3.932 0 1 1 5.56 5.56l-2.25 2.25-1.06-1.06 2.25-2.25a2.432 2.432 0 0 0-3.44-3.44L7.03 5.53 5.97 4.47zm3.06 3.56-5.5 5.5-1.06-1.06 5.5-5.5zM2.22 8.22l2.25-2.25 1.06 1.06-2.25 2.25a2.432 2.432 0 0 0 3.44 3.44l2.25-2.25 1.06 1.06-2.25 2.25a3.932 3.932 0 1 1-5.56-5.56" clip-rule="evenodd"></path></svg></span></span></button></span></div></div></div>
```

#### 2. Detail panel over a board — open a board, click a card so the side panel opens

Paste the **full URL** first — we need the exact query-parameter name Jira uses for
the selected issue (expected to be something like `selectedIssue=`).

```
URL: https://dalet.atlassian.net/jira/software/c/projects/RDC/boards/2122/backlog?assignee=608145091dcf90006872999f&selectedIssue=RDC-3889
[data-testid] elements:  1642
[data-test-id] elements: 15
a[href*="/browse/"]:     40
[role="dialog"]:         0
iframes:                 3
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  30

testids whose entire text is an issue key (4 distinct):
  software-backlog.card-list.card.card-contents.key
      x9  <a>  e.g. RDC-3889  inBrowseLink=true
  issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container
      x1  <div>  e.g. RDC-3889  inBrowseLink=false
  issue.views.issue-base.foundation.breadcrumbs.current-issue.item
      x1  <a>  e.g. RDC-3889  inBrowseLink=true
  issue.issue-view.views.common.issue-line-card.issue-line-card-view.key
      x6  <a>  e.g. GLX-100255  inBrowseLink=true
```

#### 3. Backlog

Run the snippet, then the before/after scroll check on a long sprint. Also note
what the sprint header claims its issue count is.

```
URL: https://dalet.atlassian.net/jira/software/c/projects/RDC/boards/2122/backlog
[data-testid] elements:  1226
[data-test-id] elements: 14
a[href*="/browse/"]:     49
[role="dialog"]:         0
iframes:                 0
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  47

testids whose entire text is an issue key (1 distinct):
  software-backlog.card-list.card.card-contents.key
      x21  <a>  e.g. RDC-7787  inBrowseLink=true

before/after scroll: 'before: 41   after: 33'

sprint says it holds N issues: 27
```
```html
<div data-testid="software-backlog.card-list.card.card-contents.accessible-card-key"><a href="/browse/RDC-22274" data-testid="software-backlog.card-list.card.card-contents.screen-reader-key">RDC-22274<div>[Pyramid Admin] Script region presets configuration issue</div></a><a tabindex="-1" aria-hidden="true" data-component-selector="software-backlog.card-list.card.card-contents.key" data-is-router-link="true" data-testid="software-backlog.card-list.card.card-contents.key" href="/browse/RDC-22274" target="_self">RDC-22274</a></div>
```

#### 4. Board

Also note whether the **summary text is on the card** next to the key — if it is,
the Cart may not need an API call for board scans at all.

```
URL: https://dalet.atlassian.net/jira/software/c/projects/RDC/boards/2122
[data-testid] elements:  709
[data-test-id] elements: 3
a[href*="/browse/"]:     32
[role="dialog"]:         0
iframes:                 0
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  25

testids whose entire text is an issue key (1 distinct):
  platform-card.common.ui.key.key
      x25  <div>  e.g. RDC-1513  inBrowseLink=false

after scroll:
URL: https://dalet.atlassian.net/jira/software/c/projects/RDC/boards/2122
[data-testid] elements:  579
[data-test-id] elements: 3
a[href*="/browse/"]:     27
[role="dialog"]:         0
iframes:                 0
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  20

testids whose entire text is an issue key (1 distinct):
  platform-card.common.ui.key.key
      x20  <div>  e.g. RDC-1532  inBrowseLink=false

summary text present on card? yes/no — its testid if yes: issue-field-single-line-text-readview-card.ui.single-line-text.container.box
```
the whole card element:
```html
<div id="card-RDC-21496" data-component-selector="platform-board-kit.ui.card-container" data-testid="platform-board-kit.ui.card.card" aria-describedby="card-description-RDC-21496" tabindex="-1"><div data-testid="platform-board-kit.ui.card.ripple.div"><div data-testid="software-context-menu.ui.context-menu.children-wrapper"><div draggable="true" data-drop-target-for-element="true"><button aria-label="RDC-21496 [Rundown] `duplicateRundownTitles` part 2: duplicate Scripts and recreatePlaceholders. Use the enter key to load the work item." type="button" data-testid="platform-card.ui.card.focus-container"></button><div><div><div><div><div data-component-selector="platform-card.ui.card.card-content.content-section"><div role="none"><div><div role="presentation"><div><span data-testid="issue-field-single-line-text-readview-card.ui.single-line-text.container.box">[Rundown] `duplicateRundownTitles` part 2: duplicate Scripts and recreatePlaceholders</span></div></div></div></div></div><div data-component-selector="platform-card.ui.card.card-content.content-section"><div><div><div role="none" data-testid="issue-field-parent-inline-edit-card.ui.parent"><div data-testid="issue-field-parent-readview-card.ui.parent.parent-card-wrapper"><div><div data-testid="issue-field-parent-readview-card.ui.parent.parent-card"><div role="presentation"><div><button type="button" data-testid="issue-field-parent-readview-card.ui.parent.tag-dropdown-trigger"><span><span></span><span data-tag-text="true">Rundown - Full Day Pattern Epic split: Apply Pattern advanced/nice-to-have functionalities</span></span></button></div></div></div></div></div></div></div></div></div><div data-component-selector="platform-card.ui.card.card-content.content-section" data-testid="platform-card.ui.card.card-content.footer"><div><div><div><div role="presentation"><img alt="Story" src="https://dalet.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/17246?size=medium"></div></div><div data-testid="platform-card.common.ui.key.key"><a href="/browse/RDC-21496" target="_blank" aria-label="RDC-21496 is resolved"><div>RDC-21496</div></a></div></div><div><div><div><div data-testid="platform-card.common.ui.estimate.tooltip--container" role="presentation"><span data-testid="platform-card.common.ui.estimate.badge"><span>1d 2h 45m</span></span></div></div><div><span role="presentation" data-testid="development-board-dev-info-icon.container"><button aria-expanded="false" aria-haspopup="true" aria-describedby="development-board-dev-info-icon.button-text-656684" tabindex="0" type="button"><span><span role="img" aria-label="merged pull request"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="m6.174.77 1.152.96-3.333 4a.75.75 0 0 1-1.152 0l-1.667-2 1.152-.96 1.09 1.308zM8.5 2.5h1.25a2.75 2.75 0 0 1 2.75 2.75v5.378a2.251 2.251 0 1 1-1.5 0V5.25C11 4.56 10.44 4 9.75 4H8.5zm-5 8.128V7.5H5v3.128a2.251 2.251 0 1 1-1.5 0M4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5m7.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5" clip-rule="evenodd"></path></svg></span></span></button><span id="development-board-dev-info-icon.button-text-656684">Select to open pull request details.</span></span></div><div data-testid="platform-card.common.ui.priority.icon"><div role="presentation"><img alt="P1 priority" src="/images/icons/priorities/critical_new.svg"></div></div></div></div><div><div><div data-testid="software-board.common.fields.assignee-field-static.avatar-wrapper"><div role="presentation"><div data-testid="board.common.fields.assignee-field-static.avatar" role="img" aria-labelledby="_r73a_"><span data-testid="board.common.fields.assignee-field-static.avatar--inner"><img src="https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/608145091dcf90006872999f/4f7158da-3896-497b-9973-b433c18e92d0/48" alt="" data-testid="board.common.fields.assignee-field-static.avatar--image" aria-hidden="true" data-vc="board.common.fields.assignee-field-static.avatar--image" data-ssr-placeholder-ignored="true"></span><span data-testid="board.common.fields.assignee-field-static.avatar--label" id="_r73a_" hidden="">Assignee: Yaron Oaknin</span></div></div></div></div></div></div></div></div></div></div><div data-testid="platform-card.ui.card.actions-section"><button aria-expanded="false" aria-haspopup="true" aria-live="polite" type="button" data-testid="software-context-menu.meatball-menu"><span><span aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M0 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0m6.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0M13 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clip-rule="evenodd"></path></svg></span><span>More actions for RDC-21496 [Rundown] `duplicateRundownTitles` part 2: duplicate Scripts and recreatePlaceholders</span></span></button></div></div></div></div><div data-testid="software-context-menu.ui.context-menu" role="button" aria-hidden="true" aria-expanded="false" aria-haspopup="true" aria-label="Open menu"></div></div></div>
```

#### 5. Search results / issue navigator — run a JQL search with 50+ results

**This is the emptiest cell in the whole research — we have zero evidence for this
view.** Note how many results Jira says it found, versus the browse-link count.

```
URL: https://dalet.atlassian.net/issues/?jql=created+%3E%3D+-30d+order+by+created+DESC&referrer=quick-find
[data-testid] elements:  1028
[data-test-id] elements: 0
a[href*="/browse/"]:     36
[role="dialog"]:         0
iframes:                 0
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  70

testids whose entire text is an issue key (1 distinct):
  native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell
      x30  <a>  e.g. RDC-29578  inBrowseLink=true

Jira reports N results: 50 of 1000+
```
```html
<div data-vc="merged-cell" data-testid="native-issue-table.ui.row.issue-row.merged-cell"><div role="presentation"><img height="16" width="16" src="https://dalet.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/17248?size=small" alt="Bug" data-vc="native-issue-table-ui-icon-cell-img"></div><div data-testid="native-issue-table.common.ui.issue-cells.issue-key.action-container"><div data-vc="native-issue-table-ui-issue-key-cell"><a aria-label="RDC-29578 is not resolved" data-testid="native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell" data-is-router-link="true" href="/browse/RDC-29578" target="_self">RDC-29578</a></div><div><button aria-live="polite" type="button"><span><span aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M8.22 2.22a3.932 3.932 0 1 1 5.56 5.56l-2.25 2.25-1.06-1.06 2.25-2.25a2.432 2.432 0 0 0-3.44-3.44L7.03 5.53 5.97 4.47zm3.06 3.56-5.5 5.5-1.06-1.06 5.5-5.5zM2.22 8.22l2.25-2.25 1.06 1.06-2.25 2.25a2.432 2.432 0 0 0 3.44 3.44l2.25-2.25 1.06 1.06-2.25 2.25a3.932 3.932 0 1 1-5.56-5.56" clip-rule="evenodd"></path></svg></span><span>Copy link</span></span></button></div></div><div data-testid="native-issue-table.common.ui.issue-cells.issue-summary.action-container"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Summary" aria-hidden="false" type="button"></button><span data-testid="native-issue-table.common.ui.issue-cells.issue-summary.issue-summary-cell">[BRIO3] BRIO Validation Repository : Missing mandatory BRIO Format ID. The entry list is shorter then daletBrioFormats.xml.</span><div></div></div></div></div>
```
but this div is inside a tr which can contains more columns:
```html
<tr data-testid="native-issue-table.ui.issue-row" aria-selected="false" aria-rowindex="1" role="row" tabindex="-1" data-index="0" data-vc="issue-row"><td tabindex="-1"><div data-vc="checkbox-cell"><label data-dashlane-label="true"><input tabindex="0" aria-label="Work item: RDC-29578" type="checkbox" value=""><svg width="24" height="24" viewBox="0 0 24 24" role="presentation"><g fill-rule="evenodd"><rect fill="currentColor" x="5.5" y="5.5" width="13" height="13" rx="1.5"></rect></g></svg></label></div></td><td tabindex="-1"><div data-vc="merged-cell" data-testid="native-issue-table.ui.row.issue-row.merged-cell"><div role="presentation"><img height="16" width="16" src="https://dalet.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/17248?size=small" alt="Bug" data-vc="native-issue-table-ui-icon-cell-img"></div><div data-testid="native-issue-table.common.ui.issue-cells.issue-key.action-container"><div data-vc="native-issue-table-ui-issue-key-cell"><a aria-label="RDC-29578 is not resolved" data-testid="native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell" data-is-router-link="true" href="/browse/RDC-29578" target="_self">RDC-29578</a></div><div><button aria-live="polite" type="button"><span><span aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M8.22 2.22a3.932 3.932 0 1 1 5.56 5.56l-2.25 2.25-1.06-1.06 2.25-2.25a2.432 2.432 0 0 0-3.44-3.44L7.03 5.53 5.97 4.47zm3.06 3.56-5.5 5.5-1.06-1.06 5.5-5.5zM2.22 8.22l2.25-2.25 1.06 1.06-2.25 2.25a2.432 2.432 0 0 0 3.44 3.44l2.25-2.25 1.06 1.06-2.25 2.25a3.932 3.932 0 1 1-5.56-5.56" clip-rule="evenodd"></path></svg></span><span>Copy link</span></span></button></div></div><div data-testid="native-issue-table.common.ui.issue-cells.issue-summary.action-container"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Summary" aria-hidden="false" type="button"></button><span data-testid="native-issue-table.common.ui.issue-cells.issue-summary.issue-summary-cell">[BRIO3] BRIO Validation Repository : Missing mandatory BRIO Format ID. The entry list is shorter then daletBrioFormats.xml.</span><div></div></div></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Fix versions" aria-hidden="false" type="button"></button><span>None</span></div></td><td tabindex="-1"><div data-vc="native-issue-table-ui-issue-status-box"><div><div><button aria-label="To Do - Change status" aria-expanded="false" type="button" data-testid="issue.fields.status.common.ui.status-lozenge.2"><span><span data-testid="issue.fields.status.common.ui.status-lozenge.2--text">To Do</span><span data-testid="issue.fields.status.common.ui.status-lozenge.2--chevron" aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" d="m14.53 6.03-6 6a.75.75 0 0 1-1.004.052l-.056-.052-6-6 1.06-1.06L8 10.44l5.47-5.47z"></path></svg></span></span></button></div></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Time tracking" aria-hidden="false" type="button"></button><div><span><span><span>0m</span></span></span></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Priority" aria-hidden="false" type="button"></button><div data-testid="issue-field-priority-readview-full.ui.priority.wrapper"><img src="https://dalet.atlassian.net/images/icons/priorities/minor_new.svg" width="16px" height="16px" alt="" draggable="false" data-vc="common-components-async-icon"><span>P3</span></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Sprint" aria-hidden="false" type="button"></button><div><div data-testid="issue-field-sprint-readview-full.ui.sprint.sprint-content.view-sprint-content"><a data-testid="issue-field-sprint-readview-full.ui.sprint.sprint-content.view-sprint-content-link" href="?jql=%22cf%5B11140%5D%22%20%3D%2018043" target="_self">[BRIO] Sprint Triage</a></div></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Created" disabled="" aria-hidden="true" type="button"></button><span>Aug 10, 2026, 12:44 PM</span></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Serge Korolev- edit Assignee" aria-hidden="false" type="button"></button><div data-vc="profilecard-wrapper"><span aria-expanded="false" aria-haspopup="true" role="button" tabindex="0" aria-label="More information about Serge Korolev"><div data-testid="profilecard-next.ui.profilecard.profilecard-trigger"><div><div><div role="img" aria-labelledby="_r4m3_"><span><img src="https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5c80ddf9d706436de8a96390/6e94cc10-4e92-4715-b3aa-9de64e31a7da/128" alt="" aria-hidden="true" data-vc="avatar-image" data-ssr-placeholder-ignored="true"></span><span id="_r4m3_" hidden="">Serge Korolev</span></div><span><span>Serge Korolev</span></span></div></div></div></span></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Ivan TAROLLI- edit Creator" disabled="" aria-hidden="true" type="button"></button><div data-vc="profilecard-wrapper"><span aria-expanded="false" aria-haspopup="true" role="button" tabindex="0" aria-label="More information about Ivan TAROLLI"><div data-testid="profilecard-next.ui.profilecard.profilecard-trigger"><div><div><div role="img" aria-labelledby="_r4m5_"><span><img src="https://secure.gravatar.com/avatar/03eb737b960f8eb34ef7e93db48a461e?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FIT-1.png" alt="" aria-hidden="true" data-vc="avatar-image" data-ssr-placeholder-ignored="true"></span><span id="_r4m5_" hidden="">Ivan TAROLLI</span></div><span><span>Ivan TAROLLI</span></span></div></div></div></span></div></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Team" aria-hidden="false" type="button"></button><span aria-haspopup="true" data-testid="team-profilecard-trigger-wrapper"><div><div data-testid="undefined-team-avatar"><div><svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label=""><g clip-path="url(#clip0_2032_552)"><rect width="32" height="32" rx="4" fill="#DCDFE4"></rect><path fill-rule="evenodd" clip-rule="evenodd" d="M10.6666 12.6666C11.7712 12.6666 12.6666 11.7712 12.6666 10.6666C12.6666 9.56206 11.7712 8.66663 10.6666 8.66663C9.56202 8.66663 8.66658 9.56206 8.66658 10.6666C8.66658 11.7712 9.56202 12.6666 10.6666 12.6666ZM10.6666 14.6666C12.8757 14.6666 14.6666 12.8758 14.6666 10.6666C14.6666 8.45749 12.8757 6.66663 10.6666 6.66663C8.45745 6.66663 6.66658 8.45749 6.66658 10.6666C6.66658 12.8758 8.45745 14.6666 10.6666 14.6666Z" fill="#44546F"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M21.3333 12.6666C22.4378 12.6666 23.3333 11.7712 23.3333 10.6666C23.3333 9.56206 22.4378 8.66663 21.3333 8.66663C20.2287 8.66663 19.3333 9.56206 19.3333 10.6666C19.3333 11.7712 20.2287 12.6666 21.3333 12.6666ZM21.3333 14.6666C23.5424 14.6666 25.3333 12.8758 25.3333 10.6666C25.3333 8.45749 23.5424 6.66663 21.3333 6.66663C19.1241 6.66663 17.3333 8.45749 17.3333 10.6666C17.3333 12.8758 19.1241 14.6666 21.3333 14.6666Z" fill="#44546F"></path><path d="M21.6666 16C24.4273 16.0004 26.6666 18.2385 26.6666 21V22.6666C26.6666 24.1394 25.4727 25.3333 23.9999 25.3333H20.135C18.0324 25.3333 16.1545 24.018 15.436 22.042L14.6843 19.9747C14.2531 18.7892 13.1264 18 11.8649 18H10.3333C8.6764 18 7.33325 19.3431 7.33325 21V22.6666C7.33325 23.0348 7.63173 23.3333 7.99992 23.3333H13.3333V25.3333H7.99992C6.52716 25.3333 5.33325 24.1394 5.33325 22.6666V21C5.33325 18.2385 7.57183 16 10.3333 16H11.8649C13.9674 16 15.8453 17.3153 16.5638 19.2913L17.3156 21.3585C17.7467 22.5441 18.8734 23.3333 20.135 23.3333H23.9999C24.3681 23.3333 24.6666 23.0348 24.6666 22.6666V21C24.6666 19.3437 23.3233 18.0004 21.6666 18H20.135V16H21.6666Z" fill="#44546F"></path><path d="M20.135 16C19.5972 16 18.7183 16.1407 18.0518 16.4564L18.908 18.2639C19.064 18.19 19.288 18.1205 19.537 18.0703C19.785 18.0203 20.0045 18 20.135 18V16Z" fill="#44546F"></path></g><defs><clipPath id="clip0_2032_552"><rect width="32" height="32" rx="4" fill="white"></rect></clipPath></defs></svg></div></div><span role="button" tabindex="0" aria-label="Click to view Brio team details"><span>Brio</span></span></div></span></div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Components" aria-hidden="false" type="button"></button><div><div><div><span data-testid="list-with-popup.ui.tag-item.tag-item"><span><a href="?jql=project%20%3D%20RDC%20AND%20component%20%3D%20Brio3" target="_self"><span data-tag-text="true">Brio3</span></a></span></span></div></div></div></div></td><td tabindex="-1"><div data-vc="native-issue-table-ui-resolution-cell">Unresolved</div></td><td tabindex="-1"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><button aria-label="Edit Updated" disabled="" aria-hidden="true" type="button"></button><span>Aug 10, 2026, 12:51 PM</span></div></td><td aria-hidden="true" tabindex="-1"></td><td tabindex="-1"><div><button aria-expanded="false" aria-haspopup="true" id="692490" aria-live="polite" type="button" data-testid="issue-navigator-issue-operations.ui.button"><span><span aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M0 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0m6.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0M13 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clip-rule="evenodd"></path></svg></span><span>More actions for RDC-29578</span></span></button></div></td></tr>
```

#### 6. Epic children, and an issue's linked-work panel

Two different lists; do both. The main question is simply: **is each row's key
inside an `<a href="/browse/...">`?** If yes, both views are free and we need
nothing else from them.

```
URL: https://dalet.atlassian.net/browse/RDC-1420
[data-testid] elements:  855
[data-test-id] elements: 0
a[href*="/browse/"]:     22
[role="dialog"]:         0
iframes:                 3
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  8

testids whose entire text is an issue key (5 distinct):
  issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container
      x1  <div>  e.g. RDC-1420  inBrowseLink=false
  issue.views.issue-base.foundation.breadcrumbs.current-issue.item
      x1  <a>  e.g. RDC-1420  inBrowseLink=true
  native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell
      x5  <a>  e.g. RDC-23422  inBrowseLink=true
  hover-card-trigger-wrapper
      x2  <span>  e.g. PGI-3  inBrowseLink=false
  issue.issue-view.views.common.issue-line-card.issue-line-card-view.key
      x2  <a>  e.g. PGI-3  inBrowseLink=true
```
```
same as above, it's on the same page
```

Children tickets outerHTML:
```html
<div tabindex="0" data-vc="merged-cell" data-testid="native-issue-table.ui.row.issue-row.merged-cell"><div role="presentation"><img height="16" width="16" src="https://dalet.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/17246?size=small" alt="Story" data-vc="native-issue-table-ui-icon-cell-img"></div><div data-testid="native-issue-table.common.ui.issue-cells.issue-key.action-container"><div data-vc="native-issue-table-ui-issue-key-cell"><div role="presentation"><a aria-label="RDC-23422 is resolved" data-testid="native-issue-table.common.ui.issue-cells.issue-key.issue-key-cell" data-is-router-link="true" href="/browse/RDC-23422" target="_self">RDC-23422</a></div></div><div><button aria-live="polite" type="button"><span><span aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M8.22 2.22a3.932 3.932 0 1 1 5.56 5.56l-2.25 2.25-1.06-1.06 2.25-2.25a2.432 2.432 0 0 0-3.44-3.44L7.03 5.53 5.97 4.47zm3.06 3.56-5.5 5.5-1.06-1.06 5.5-5.5zM2.22 8.22l2.25-2.25 1.06 1.06-2.25 2.25a2.432 2.432 0 0 0 3.44 3.44l2.25-2.25 1.06 1.06-2.25 2.25a3.932 3.932 0 1 1-5.56-5.56" clip-rule="evenodd"></path></svg></span><span>Copy link</span></span></button></div></div><div data-testid="native-issue-table.common.ui.issue-cells.issue-summary.action-container"><div data-testid="issue-field-inline-edit-read-view-container.ui.container" data-vc="issue-field-inline-edit-read-view-container" role="presentation" data-vc-nvs="true"><span><a data-testid="native-issue-table.common.ui.issue-cells.issue-summary.issue-summary-cell" href="/browse/RDC-23422" target="_self">[Rundown UI] Context menu entry and Duplicate Rundown dialog</a></span><button data-vc="inline-edit-lite-edit-button" aria-hidden="false" tabindex="0" type="button" data-dashlane-label="true"><span><span role="img" aria-label="Edit Summary"><svg fill="none" viewBox="-4 -4 24 24" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M11.586.854a2 2 0 0 1 2.828 0l.732.732a2 2 0 0 1 0 2.828L10.01 9.551a2 2 0 0 1-.864.51l-3.189.91a.75.75 0 0 1-.927-.927l.91-3.189a2 2 0 0 1 .51-.864zm1.768 1.06a.5.5 0 0 0-.708 0l-.585.586L13.5 3.94l.586-.586a.5.5 0 0 0 0-.708zM12.439 5 11 3.56 7.51 7.052a.5.5 0 0 0-.128.216l-.54 1.891 1.89-.54a.5.5 0 0 0 .217-.127zM3 2.501a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V10H15v3.001a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h3v1.5z" clip-rule="evenodd"></path></svg></span></span></button></div></div></div>
```

Linked work item outerHTML:
```html
data-testid="hover-card-trigger-wrapper" role="none"><a data-testid="issue-field-summary.ui.inline-read.link-item" data-is-router-link="true" data-vc="link-item" tabindex="0" draggable="false" href="/browse/WEB-22486" target="_self"><span data-testid="issue-field-summary.ui.inline-read.link-item--primitive--container"><div><span data-item-title="true">[Story8] Pyramid GQL API: gql mutation to copy a Script</span></div></span></a></span></span></div></div><div><div data-testid="issue-line-card.ui.status.status-field-container"><div role="presentation"><div><div><div><div><button aria-label="Rejected - Change status" aria-expanded="false" type="button" data-testid="issue.fields.status.common.ui.status-lozenge.3" data-dashlane-label="true"><span><span data-testid="issue.fields.status.common.ui.status-lozenge.3--text">Rejected</span><span data-testid="issue.fields.status.common.ui.status-lozenge.3--chevron" aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" d="m14.53 6.03-6 6a.75.75 0 0 1-1.004.052l-.056-.052-6-6 1.06-1.06L8 10.44l5.47-5.47z"></path></svg></span></span></button></div></div></div></div></div></div><div role="presentation"><div><div data-testid="issue-line-card.ui.assignee.read-only-assignee"><span data-testid="issue-line-card.ui.assignee.read-only-assignee--inner"><span><span data-testid="issue-line-card.ui.assignee.read-only-assignee--person" aria-hidden="true"><svg fill="none" viewBox="-4 -4 24 24" role="presentation"><path fill="currentcolor" fill-rule="evenodd" d="M8 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0m-2 9a3.75 3.75 0 0 1 3.75-3.75h4.5A3.75 3.75 0 0 1 14 13v2h-1.5v-2a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 3.5 13v2H2z" clip-rule="evenodd"></path></svg></span></span></span></div></div></div><div><div><div role="presentation"><div data-testid="issue-line-card.ui.priority.priority"><img src="https://dalet.atlassian.net/images/icons/priorities/major_new.svg" width="20px" height="20px" alt="Priority: P2" draggable="false" data-vc="common-components-async-icon"></div></div></div></div><div role="presentation"><div data-testid="issue-line-card.ui.remove-button.delete-link-container"><button aria-label="Unlink work item" data-testid="issue-line-card.ui.remove-button" tabindex="0" type="button"><span><span aria-hidden="true"><svg fill="none" viewBox="0 0 16 16" role="presentation"><path fill="currentcolor" d="M13.53 3.53 9.06 8l4.47 4.47-1.06 1.06L8 9.06l-4.47 4.47-1.06-1.06L6.94 8 2.47 3.53l1.06-1.06L8 6.94l4.47-4.47z"></path></svg></span></span></button></div></div></div></div>
```

#### 7. Timeline / roadmap

The real question: **is an issue key present in the DOM for a bar at all**, or does
Jira draw the bar without ever rendering the key as text? Scroll vertically and
re-run the count too — timeline rows are known to be virtualised.

```
URL: https://dalet.atlassian.net/jira/plans/7/scenarios/173/timeline?vid=311
[data-testid] elements:  1742
[data-test-id] elements: 1
a[href*="/browse/"]:     42
[role="dialog"]:         0
iframes:                 0
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  46

testids whose entire text is an issue key (0 distinct):

after vertical scroll:
URL: https://dalet.atlassian.net/jira/plans/7/scenarios/173/timeline?vid=311
[data-testid] elements:  1157
[data-test-id] elements: 1
a[href*="/browse/"]:     19
[role="dialog"]:         0
iframes:                 0
meta application-name:   JIRA
meta ajs-jira-base-url:  (none)
bare keys in page text:  19

testids whose entire text is an issue key (0 distinct):


is a key visible as text on a bar? yes/no: no, but even in timeline mode, there is always the left most column that shows the "tree" releases -> epic -> stories
```
OuterHTML of a left-most "work item" column of a row (in both timeline and list modes):
```html
<div data-issue="654282" data-name="scope-issue-654282" data-group="release-30061" role="presentation" data-testid="portfolio-3-portfolio.app-simple-plans.main.tabs.roadmap.scope.issues.issue.row" draggable="true" data-drop-target-for-element="true"><div></div><div><label data-testid="portfolio-3-portfolio.app-simple-plans.main.tabs.roadmap.scope.issues.issue-654282--checkbox-label"><input tabindex="0" aria-labelledby="issue-link-654282" type="checkbox" data-testid="portfolio-3-portfolio.app-simple-plans.main.tabs.roadmap.scope.issues.issue-654282--hidden-checkbox" value=""><svg width="24" height="24" viewBox="0 0 24 24" role="presentation"><g fill-rule="evenodd"><rect fill="currentColor" x="5.5" y="5.5" width="13" height="13" rx="1.5"></rect></g></svg></label></div><div data-name="spacer"></div><div data-testid="portfolio-3-portfolio.app-simple-plans.main.tabs.roadmap.scope.issues.issue.issue-icon-tooltip--container" role="presentation"><img alt="Story" data-testid="portfolio-3-portfolio.app-simple-plans.main.tabs.roadmap.scope.issues.issue.issue-icon-654282" src="/rest/api/2/universal_avatar/view/type/issuetype/avatar/17246?size=medium"></div><a rel="noopener noreferrer" id="issue-link-654282" draggable="false" href="/browse/RDC-21069" target="_blank">RDC-21069<span id="_r31c_">, (opens new window)</span></a><div aria-haspopup="true"><div role="presentation"><button type="button"><div>Story 6 -- Prepare sql update for both ROSS type prefixes in Region Presets configuration</div></button></div></div></div>
```

#### 8. Dashboard gadget — a dashboard with a filter-results gadget

**One question decides this whole view: is the gadget inside an `<iframe>`?** If it
is, a userscript can't reach it without extra `@match` work and we'll just say the
view is out of scope. The `iframes:` line in the snippet output answers it.

Me: I don't find this information at the moment. I'll update later if I find it.
```
(snippet output)
```

#### 9. False-positive baseline — an issue whose description mentions other keys in prose

Look at the `bare keys in page text:` number, then count by eye how many are
*genuine* references rather than prose mentions or accidents (`UTF-8`, `COVID-19`).

```
bare keys found by regex:
of those, genuinely issue references:
```

This single ratio decides whether scanning page text is safe, or whether the Cart
needs a list of your real project keys to filter against.

Me: let's forget about bare keys, focus only on well DOM-defined keys.
---

## If you run out of patience

Priority order, most valuable first. Stopping after **3** still unblocks real work:

1. **Part 1** — closes ticket 01 outright.
2. **View 5 (search results)** — total blank in the research.
3. **View 7 and 8 (timeline, dashboard gadget)** — these two can *invert* the whole
   detection design. If either shows issue references with no `/browse/` link and
   no visible key text, the recommended strategy is wrong and we need to know
   before anything gets built.
4. Views 1–4 — already partly evidenced by the existing scripts; confirmation only.
5. View 9 and the rest — nice to have.
