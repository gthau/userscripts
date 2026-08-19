# 09a — Can the API say what is really in this list?

Ticket `09`, Q2. Desk pass 2026-08-11, then **your** devtools pass.

`09` asks whether backlog, board and timeline have a clean "what is really in
this list" query, the way search results have their JQL sitting in the URL. The
desk pass below is from Atlassian's own OpenAPI specs — the authoritative
machine-readable ones, not the HTML docs, which truncated. The live half is a
snippet you run, in the style that worked for `02c`.

**Source of every path, parameter and limit below:**
`https://developer.atlassian.com/cloud/jira/software/swagger.v3.json` (643 KB,
fetched 2026-08-11) and `.../platform/swagger-v3.v3.json` (2.4 MB, same day).
Where a claim comes from anywhere else it says so.

`01` proved desk research can be wrong about exactly this kind of detail —
`issueErrors` came back empty when the docs implied otherwise. **Every claim
here is provisional until the snippet runs.** The ones most likely to be wrong
are flagged `⚠ UNVERIFIED`.

---

## Part 1 — What the docs settle

### 1.1 Yes, and it is a different base — two of them

The board/backlog/sprint reads are **not** on `/rest/api/3/`. They are on
`/rest/agile/1.0/`, and as of three months ago there is a second, newer base:

| What you want | Endpoint |
| --- | --- |
| A board's backlog | `GET /rest/software/1.0/board/{boardId}/backlog` |
| A board's issues | `GET /rest/software/1.0/board/{boardId}/issue` |
| A sprint's issues, as the board sees them | `GET /rest/software/1.0/board/{boardId}/sprint/{sprintId}/issue` |
| A sprint's issues, board-independent | `GET /rest/software/1.0/sprint/{sprintId}/issue` |
| Which sprints are on this board | `GET /rest/agile/1.0/board/{boardId}/sprint?state=active,future` |
| Board type, and its saved filter id | `GET /rest/agile/1.0/board/{boardId}/configuration` |
| How many, without fetching them | `GET /rest/software/1.0/board/{boardId}/backlog/approximate-count` |
| | `GET /rest/software/1.0/board/{boardId}/issue/approximate-count` |

The `boardId` is in the URL — `/boards/2122/backlog` — and
[jira-backlog-sprints.user.js:151](../../../src/jira-backlog-sprints.user.js#L151)
already parses it with `BACKLOG_PATH_RE`.

### 1.2 The obvious endpoints are deprecated, with a date inside our horizon

All four `/rest/agile/1.0/` issue-returning endpoints carry `"deprecated": true`
in the spec:

```
GET /rest/agile/1.0/board/{boardId}/backlog
GET /rest/agile/1.0/board/{boardId}/issue
GET /rest/agile/1.0/board/{boardId}/sprint/{sprintId}/issue
GET /rest/agile/1.0/sprint/{sprintId}/issue
```

The Jira Software changelog, announced **2026-05-01**, gives a six-month
deprecation period: *"These endpoints will be removed after **November 1,
2026**."* The named replacements are the four `/rest/software/1.0/` "enhanced"
endpoints in the table above.

**That is under three months from today.** Any Cart that reads a board or a
backlog must be written against `/rest/software/1.0/` from the first line. The
`/rest/agile/1.0/` paths are useful only as a fallback, and only until November.
`/rest/agile/1.0/board/{id}/sprint` and `/board/{id}/configuration` are **not**
deprecated — the sprint *list* survives; only the issue *reads* move.

This is the same trap `01` hit from the other side: `GET /rest/api/3/search` is
marked *"Currently being removed"* in the platform spec. The Cart is being
designed during a live migration of every list-reading endpoint Jira has.

### 1.3 Pagination changed shape, and in our favour

The deprecated endpoints page with `startAt` / `maxResults` and warn that the
total is capped by `jira.search.views.default.max`. The enhanced ones use a
continuation token, and the ceiling is far above anything the Cart will meet:

- `maxResults` — *"It returns max 5000 issues."*
- `nextPageToken` — *"The first page has a `nextPageToken` of `null` … The
  `nextPageToken` field is **not included** in the response for the last page."*
- Response envelope is `SoftwareIssueResults`:
  `{ issues[], isLast, nextPageToken, names, schema, expand, warningMessages }`
- `fields` is accepted — so `?fields=summary` gives the Cart exactly what it
  stores, and nothing else.
- `jql` is accepted as a *filter on top of* the board's own scope.

`approximate-count` returns `{ "count": n }` and is documented as *"equivalent
to counting the issues on all pages returned by Get issues for backlog
enhanced"*, with the caveat *"Recent updates might not be immediately visible"*.
One cheap call that answers "how many are really in this list" without fetching
any of them — which is precisely what `09`'s Q4 (the second witness) wants.

### 1.4 Search results: `/rest/api/3/search/jql`, and one constraint

`GET /rest/api/3/search/jql?jql=…&fields=summary&maxResults=…`, same token
pagination, same 5000 ceiling. Counting without fetching is
`POST /rest/api/3/search/approximate-count` with `{"jql": "…"}`.

The constraint that matters: *"this parameter requires a bounded query. A
bounded query is a query with a search restriction. Example of an unbounded
query: `order by key desc`."* The JQL sitting in a search-results URL is usually
bounded — `02c`'s sample was `created >= -30d order by created DESC` — but a
user who sorted an unrestricted list will hand the Cart a JQL the API rejects.
A per-view promise built on this must survive that rejection.

### 1.5 Timeline / Plans: no public API. Option (c) is closed for that view.

The platform spec has exactly ten `plan` paths, and **not one returns the issues
in a plan's scope**:

```
/rest/api/3/plans/plan            /rest/api/3/plans/plan/{planId}/team
/rest/api/3/plans/plan/{planId}   …/team/atlassian   …/team/planonly
…/archive  …/duplicate  …/trash
```

`GET /rest/api/3/plans/plan/{planId}` returns
`{id, name, status, scheduling, issueSources, exclusionRules, crossProjectReleases,
customFields, permissions, leadAccountId, lastSaved}` — `issueSources` names the
boards, projects or filters the plan draws from, which is the closest thing to a
scope query that exists. And it is out of reach anyway: **"Permissions required:
*Administer Jira* global permission"** on both the get and the list. The Jira
Software spec has no `plan`, `roadmap` or `portfolio` path at all.

So for the timeline there is no supported way to ask "what is in this list".
Whatever `09` decides for the other views, the timeline can only promise what is
mounted — or promise nothing.

### 1.6 What the docs cannot settle, and why the snippet exists

1. **Does the session cookie carry to these bases?** The spec lists only
   `OAuth2` and `basicAuth` as security schemes — exactly as it does for
   `/rest/api/3/`, where `01` proved the cookie works anyway. But `01`'s
   evidence covers `/rest/api/3/` only. `/rest/software/1.0/` is three months
   old and is **not** the endpoint Jira's own front end calls (it calls internal
   GraphQL), so this is a genuinely fresh unknown. `⚠ UNVERIFIED`
2. **Is `/rest/software/1.0/` live on `dalet.atlassian.net` yet?** `⚠ UNVERIFIED`
3. **Does the API's answer match the page's?** The backlog *view* lists sprints
   from **other boards** — that is the entire premise of
   `jira-backlog-sprints.user.js`, which exists because *"one cross-team member
   is … enough to add twenty sprints from four other boards to the page"*
   ([jira-backlog-sprints.user.js:16-19](../../../src/jira-backlog-sprints.user.js#L16-L19)).
   If `board/{id}/sprint` returns only the board's own sprints, then "everything
   in this list" via the API is **a different set** from what the page shows —
   smaller, and missing rows the user can see. That would make option (c)
   dishonest on the backlog rather than merely expensive. `⚠ UNVERIFIED, and it
   is the one that could decide Q1.`
4. **Whether the DOM's sprint ids line up with the API's.** The backlog DOM
   carries `software-backlog.card-list.container.<sprintId>` and
   `…container.BACKLOG`
   ([jira-backlog-sprints.user.js:121-128](../../../src/jira-backlog-sprints.user.js#L121-L128)),
   so a per-section comparison is possible without guessing. `⚠ UNVERIFIED`
5. **`01`'s leftover probe** — "no such issue" vs "no permission". Folded into
   the same snippet.

---

## Part 2 — The snippet

One paste, any view. It works out where it is from the URL and only runs the
probes that apply. Nothing writes; every call is a read.

Run it on **four** pages, and paste all four outputs verbatim below:

1. a **backlog** (ideally the one with foreign sprints on it)
2. a **board**
3. a **search results** page with more results than fit on screen
4. a **Plans timeline**

Before pasting the first run, fill in `HIDDEN_KEY` on line 3 if you can think of
a key in a project you cannot see — a colleague's private project, an HR or
Legal project, anything that 404s for you in the UI. If you cannot, leave it
empty and that one row is skipped.

```js
(async () => {
  // ---- fill this in if you can: a real key in a project you CANNOT see ----
  const HIDDEN_KEY = "";
  // ------------------------------------------------------------------------
  const rows = [], cut = (s, n = 100) => String(s ?? "").replace(/\s+/g, " ").slice(0, n);
  const KEY_RE = /\/browse\/([A-Z][A-Z0-9]*-\d+)/;

  async function call(probe, path, init) {
    let r;
    try { r = await fetch(path, Object.assign({ headers: { Accept: "application/json", "X-Atlassian-Token": "no-check" } }, init)); }
    catch (e) { rows.push({ probe, status: "THREW", type: "", n: "", note: cut(e.message) }); return null; }
    const type = (r.headers.get("content-type") || "").split(";")[0];
    const text = await r.text();
    let body = null;
    if (type === "application/json") { try { body = JSON.parse(text); } catch { } }
    const list = body && (body.issues || body.values);
    const note = body ? (body.count !== undefined ? `count=${body.count}` : "")
                      : cut(text.startsWith("<") ? "HTML: " + text.replace(/<[^>]*>/g, " ") : text, 80);
    rows.push({
      probe, status: r.status, type,
      n: Array.isArray(list) ? list.length : "",
      note: [note,
             body && body.nextPageToken !== undefined ? `nextPageToken=${body.nextPageToken === null ? "null" : "present"}` : "",
             body && body.isLast !== undefined ? `isLast=${body.isLast}` : "",
             body && body.total !== undefined ? `total=${body.total}` : "",
             list && list[0] && list[0].fields ? (list[0].fields.summary !== undefined ? "summary:yes" : "summary:MISSING") : ""
            ].filter(Boolean).join(" ")
    });
    return body;
  }

  const keysOf = (b) => new Set((b && b.issues || []).map(i => i.key).filter(Boolean));
  const domKeysIn = (el) => new Set([...el.querySelectorAll('a[href*="/browse/"]')]
    .map(a => (a.getAttribute("href") || "").match(KEY_RE)?.[1]).filter(Boolean));

  const boardId = location.pathname.match(/\/boards\/(\d+)/)?.[1] || null;
  const planId  = location.pathname.match(/\/plans\/(\d+)/)?.[1] || null;
  const jql     = new URLSearchParams(location.search).get("jql");
  const isBacklog = /\/backlog(\/|$)/.test(location.pathname);

  console.log("URL:", location.href);
  console.log("boardId:", boardId, "planId:", planId, "jql:", jql ? cut(jql, 160) : null);

  // ---------- backlog ----------
  if (boardId && isBacklog) {
    await call("agile1.0 backlog (deprecated)", `/rest/agile/1.0/board/${boardId}/backlog?fields=summary&maxResults=1`);
    await call("board configuration", `/rest/agile/1.0/board/${boardId}/configuration`);
    const cfg = await call("board sprints (all states)", `/rest/agile/1.0/board/${boardId}/sprint?maxResults=50`);
    await call("backlog approximate-count", `/rest/software/1.0/board/${boardId}/backlog/approximate-count`);
    const bl = await call("software1.0 backlog (enhanced)", `/rest/software/1.0/board/${boardId}/backlog?fields=summary&maxResults=100`);

    const sections = [...document.querySelectorAll('[data-testid^="software-backlog.card-list.container."]')];
    console.log(`DOM sections on this backlog: ${sections.length}`);
    const apiSprintIds = new Set(((cfg && cfg.values) || []).map(s => String(s.id)));
    const table = [];
    for (const el of sections) {
      const id = (el.getAttribute("data-testid") || "").split(".").pop();
      const dom = domKeysIn(el);
      let api = null;
      if (/^\d+$/.test(id)) api = await call(`sprint ${id} issues`, `/rest/software/1.0/board/${boardId}/sprint/${id}/issue?fields=summary&maxResults=100`);
      const apiKeys = id === "BACKLOG" ? keysOf(bl) : keysOf(api);
      table.push({
        section: id,
        inBoardSprintList: /^\d+$/.test(id) ? apiSprintIds.has(id) : "n/a",
        domKeys: dom.size,
        apiKeys: apiKeys.size,
        domNotInApi: [...dom].filter(k => !apiKeys.has(k)).length,
        header: cut(el.textContent, 70)
      });
    }
    console.table(table);
  }

  // ---------- board ----------
  if (boardId && !isBacklog) {
    await call("board configuration", `/rest/agile/1.0/board/${boardId}/configuration`);
    await call("board approximate-count", `/rest/software/1.0/board/${boardId}/issue/approximate-count`);
    const bd = await call("software1.0 board issues", `/rest/software/1.0/board/${boardId}/issue?fields=summary&maxResults=100`);
    const dom = domKeysIn(document.body), api = keysOf(bd);
    console.table([{ scope: "whole page", domKeys: dom.size, apiKeys: api.size, domNotInApi: [...dom].filter(k => !api.has(k)).length }]);
  }

  // ---------- search results ----------
  if (jql) {
    await call("search approximate-count", `/rest/api/3/search/approximate-count`,
      { method: "POST", body: JSON.stringify({ jql }), headers: { Accept: "application/json", "Content-Type": "application/json", "X-Atlassian-Token": "no-check" } });
    const sr = await call("search/jql", `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary&maxResults=100`);
    const dom = domKeysIn(document.body), api = keysOf(sr);
    console.table([{ scope: "whole page", domKeys: dom.size, apiKeys: api.size, domNotInApi: [...dom].filter(k => !api.has(k)).length }]);
  }

  // ---------- plans / timeline ----------
  if (planId) {
    await call("plans get plan (expect 403)", `/rest/api/3/plans/plan/${planId}`);
    const dom = domKeysIn(document.body);
    console.log("timeline DOM distinct keys:", dom.size);
  }

  // ---------- 01's leftover: absent issue vs no permission ----------
  const probeKeys = ["RDC-9999999"].concat(HIDDEN_KEY ? [HIDDEN_KEY] : []);
  const bf = await call(`bulkfetch ${probeKeys.join(",")}`, `/rest/api/3/issue/bulkfetch`,
    { method: "POST", body: JSON.stringify({ issueIdsOrKeys: probeKeys, fields: ["summary"], fieldsByKeys: false }),
      headers: { Accept: "application/json", "Content-Type": "application/json", "X-Atlassian-Token": "no-check" } });
  if (bf) console.log("bulkfetch issues:", JSON.stringify(bf.issues && bf.issues.map(i => i.key)),
                      "issueErrors:", JSON.stringify(bf.issueErrors));

  console.table(rows);
})();
```

### What each answer decides

| If you see | It means |
| --- | --- |
| `software1.0` rows at `200 application/json` | Cookie auth carries to the new base. Option (c) is technically available. |
| `software1.0` at `404` | The enhanced base is not on this site yet, and the only working path expires in November. |
| any row `200` with `type: text/html` | `01`'s login-page failure mode, on a new base. Same guard applies. |
| `inBoardSprintList: false` on a section | The page shows a sprint the board's own API does not — option (c) would silently drop rows the user can see. |
| `domNotInApi > 0` anywhere | The API is **not** a superset of the page. That kills the tidy story. |
| `domNotInApi = 0` and `apiKeys > domKeys` | The API is a strict superset — the honest case for promise (c). |
| `count` from `approximate-count` ≈ the sprint header's number | A cheap second witness exists for Q4, on every board view rather than only where a header happens to state a total. |

---

## Part 3 — Your output

### Run 1 — Backlog

```
URL: https://dalet.atlassian.net/jira/software/c/projects/RDC/boards/2122/backlog?assignee=608145091dcf90006872999f
boardId: 2122 planId: null jql: null
DOM sections on this backlog: 32
[
    {
        "section": "18951",
        "inBoardSprintList": false,
        "domKeys": 7,
        "apiKeys": 27,
        "domNotInApi": 0,
        "header": "CollapseRDN 2607-0330 Jul – 12 Aug (7 of 27 work items visible)RDN 260"
    },
    {
        "section": "18076",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "ExpandWNQR-2026.8.1from wnRelease12 Aug – 26 Aug (0 of 1 work item vis"
    },
    {
        "section": "2320",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "ExpandDeep Backlog - JEF Plugins1 Jan – 1 Jan (0 of 1 work item visibl"
    },
    {
        "section": "5885",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 23,
        "domNotInApi": 0,
        "header": "ExpandFMP next priorityfrom MAM UI Team (0 of 17 work items visible)FM"
    },
    {
        "section": "5884",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 13,
        "domNotInApi": 0,
        "header": "ExpandFMP priority bugsfrom MAM UI Team (0 of 13 work items visible)FM"
    },
    {
        "section": "4571",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 6,
        "domNotInApi": 0,
        "header": "ExpandFMP Bugsfrom MAM UI Team (0 of 6 work items visible)FMP Bugs 0 o"
    },
    {
        "section": "3826",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 6,
        "domNotInApi": 0,
        "header": "ExpandProduct brainstormfrom MAM UI Team (0 of 6 work items visible)Pr"
    },
    {
        "section": "4185",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 3,
        "domNotInApi": 0,
        "header": "ExpandTechnical backlogfrom MAM UI Team (0 of 3 work items visible)Tec"
    },
    {
        "section": "5074",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 3,
        "domNotInApi": 0,
        "header": "ExpandReady for Grooming - OLDfrom MAM UI Team (0 of 3 work items visi"
    },
    {
        "section": "5137",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 2,
        "domNotInApi": 0,
        "header": "ExpandTechnical initiativefrom MAM UI Team (0 of 2 work items visible)"
    },
    {
        "section": "5886",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 4,
        "domNotInApi": 0,
        "header": "ExpandFMP QA to verifyfrom MAM UI Team (0 of 4 work items visible)FMP "
    },
    {
        "section": "5889",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "ExpandFMP other appfrom MAM UI Team1 Oct – 31 Oct (0 of 1 work item vi"
    },
    {
        "section": "6623",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "ExpandFMP-tempfrom MAM UI Team (0 of 1 work item visible)FMP-temp 0 of"
    },
    {
        "section": "7706",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "ExpandFMP future taskfrom MAM UI Team (0 of 1 work item visible)FMP fu"
    },
    {
        "section": "7707",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 2,
        "domNotInApi": 0,
        "header": "ExpandFMP UXfrom MAM UI Team (0 of 2 work items visible)FMP UX 0 of 2 "
    },
    {
        "section": "12233",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "ExpandSprint Candidatesfrom DaliaAdd dates (0 of 1 work item visible)S"
    },
    {
        "section": "18952",
        "inBoardSprintList": false,
        "domKeys": 1,
        "apiKeys": 24,
        "domNotInApi": 0,
        "header": "CollapseRDN 2608-0112 Aug – 26 Aug (1 of 23 work items visible)RDN 260"
    },
    {
        "section": "19154",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 5,
        "domNotInApi": 0,
        "header": "CollapseRDN 2608-0226 Aug – 9 Sep (0 of 5 work items visible)RDN 2608-"
    },
    {
        "section": "19155",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 0,
        "domNotInApi": 0,
        "header": "CollapseRDN 2609-019 Sep – 23 Sep (0 work items)RDN 2609-01 0 work ite"
    },
    {
        "section": "19156",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 0,
        "domNotInApi": 0,
        "header": "CollapseRDN 2609-0223 Sep – 7 Oct (0 work items)RDN 2609-02 0 work ite"
    },
    {
        "section": "13687",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 14,
        "domNotInApi": 0,
        "header": "CollapseRundown - To Be GroomedAdd dates (0 of 5 work items visible)Ru"
    },
    {
        "section": "12656",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 50,
        "domNotInApi": 0,
        "header": "ExpandRundown - Groomed issuesAdd dates (0 of 44 work items visible)Ru"
    },
    {
        "section": "13688",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 3,
        "domNotInApi": 0,
        "header": "ExpandScript Editor - To Be GroomedAdd dates (0 of 1 work item visible"
    },
    {
        "section": "12657",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 23,
        "domNotInApi": 0,
        "header": "ExpandScript Editor - Groomed issuesAdd dates (0 of 16 work items visi"
    },
    {
        "section": "19189",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 8,
        "domNotInApi": 0,
        "header": "CollapseRundown - Q4 - To be groomedAdd dates (0 of 8 work items visib"
    },
    {
        "section": "14655",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 3,
        "domNotInApi": 0,
        "header": "CollapsePlayer - To be groomedAdd dates (0 of 3 work items visible)Pla"
    },
    {
        "section": "12658",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 15,
        "domNotInApi": 0,
        "header": "ExpandPlayer - Groomed issuesAdd dates (2 of 14 work items visible)Pla"
    },
    {
        "section": "14653",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 3,
        "domNotInApi": 0,
        "header": "CollapseConfig - To be groomedAdd dates (0 of 2 work items visible)Con"
    },
    {
        "section": "14654",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "CollapseConfig - Groomed issuesAdd dates (0 of 1 work item visible)Con"
    },
    {
        "section": "13412",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "CollapsePLAN-BUGS-DEFERREDfrom PlanningAdd dates (0 of 1 work item vis"
    },
    {
        "section": "16054",
        "inBoardSprintList": false,
        "domKeys": 0,
        "apiKeys": 1,
        "domNotInApi": 0,
        "header": "CollapseXtend - 2608-01from Xtend12 Aug – 26 Aug (0 of 1 work item vis"
    },
    {
        "section": "BACKLOG",
        "inBoardSprintList": "n/a",
        "domKeys": 0,
        "apiKeys": 100,
        "domNotInApi": 0,
        "header": "CollapseBacklog (28 of 504 work items visible)Backlog 28 of 504 work i"
    }
]
bulkfetch issues: [] issueErrors: []
[
    {
        "probe": "agile1.0 backlog (deprecated)",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "total=504 summary:yes"
    },
    {
        "probe": "board configuration",
        "status": 200,
        "type": "application/json",
        "n": "",
        "note": ""
    },
    {
        "probe": "board sprints (all states)",
        "status": 200,
        "type": "application/json",
        "n": 50,
        "note": "isLast=false total=122"
    },
    {
        "probe": "backlog approximate-count",
        "status": 200,
        "type": "application/json",
        "n": "",
        "note": "count=504"
    },
    {
        "probe": "software1.0 backlog (enhanced)",
        "status": 200,
        "type": "application/json",
        "n": 100,
        "note": "nextPageToken=present isLast=false summary:yes"
    },
    {
        "probe": "sprint 18951 issues",
        "status": 200,
        "type": "application/json",
        "n": 27,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 18076 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 2320 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 5885 issues",
        "status": 200,
        "type": "application/json",
        "n": 23,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 5884 issues",
        "status": 200,
        "type": "application/json",
        "n": 13,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 4571 issues",
        "status": 200,
        "type": "application/json",
        "n": 6,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 3826 issues",
        "status": 200,
        "type": "application/json",
        "n": 6,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 4185 issues",
        "status": 200,
        "type": "application/json",
        "n": 3,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 5074 issues",
        "status": 200,
        "type": "application/json",
        "n": 3,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 5137 issues",
        "status": 200,
        "type": "application/json",
        "n": 2,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 5886 issues",
        "status": 200,
        "type": "application/json",
        "n": 4,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 5889 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 6623 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 7706 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 7707 issues",
        "status": 200,
        "type": "application/json",
        "n": 2,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 12233 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 18952 issues",
        "status": 200,
        "type": "application/json",
        "n": 24,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 19154 issues",
        "status": 200,
        "type": "application/json",
        "n": 5,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 19155 issues",
        "status": 200,
        "type": "application/json",
        "n": 0,
        "note": "isLast=true"
    },
    {
        "probe": "sprint 19156 issues",
        "status": 200,
        "type": "application/json",
        "n": 0,
        "note": "isLast=true"
    },
    {
        "probe": "sprint 13687 issues",
        "status": 200,
        "type": "application/json",
        "n": 14,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 12656 issues",
        "status": 200,
        "type": "application/json",
        "n": 50,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 13688 issues",
        "status": 200,
        "type": "application/json",
        "n": 3,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 12657 issues",
        "status": 200,
        "type": "application/json",
        "n": 23,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 19189 issues",
        "status": 200,
        "type": "application/json",
        "n": 8,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 14655 issues",
        "status": 200,
        "type": "application/json",
        "n": 3,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 12658 issues",
        "status": 200,
        "type": "application/json",
        "n": 15,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 14653 issues",
        "status": 200,
        "type": "application/json",
        "n": 3,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 14654 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 13412 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "sprint 16054 issues",
        "status": 200,
        "type": "application/json",
        "n": 1,
        "note": "isLast=true summary:yes"
    },
    {
        "probe": "bulkfetch RDC-9999999",
        "status": 200,
        "type": "application/json",
        "n": 0,
        "note": ""
    }
]
```

### Run 2 — Board

```
URL: https://dalet.atlassian.net/jira/software/c/projects/RDC/boards/2122
boardId: 2122 planId: null jql: null
[
    {
        "scope": "whole page",
        "domKeys": 25,
        "apiKeys": 100,
        "domNotInApi": 20
    }
]

bulkfetch issues: [] issueErrors: []

[
    {
        "probe": "board configuration",
        "status": 200,
        "type": "application/json",
        "n": "",
        "note": ""
    },
    {
        "probe": "board approximate-count",
        "status": 200,
        "type": "application/json",
        "n": "",
        "note": "count=1150"
    },
    {
        "probe": "software1.0 board issues",
        "status": 200,
        "type": "application/json",
        "n": 100,
        "note": "nextPageToken=present isLast=false summary:yes"
    },
    {
        "probe": "bulkfetch RDC-9999999",
        "status": 200,
        "type": "application/json",
        "n": 0,
        "note": ""
    }
]
```

### Run 3 — Search results

```
URL: https://dalet.atlassian.net/issues/?jql=textfields%20~%20%22rundown%2A%22&referrer=quick-find
boardId: null planId: null jql: textfields ~ "rundown*"
[
    {
        "scope": "whole page",
        "domKeys": 50,
        "apiKeys": 100,
        "domNotInApi": 0
    }
]
bulkfetch issues: [] issueErrors: []

[
    {
        "probe": "search approximate-count",
        "status": 200,
        "type": "application/json",
        "n": "",
        "note": "count=12816"
    },
    {
        "probe": "search/jql",
        "status": 200,
        "type": "application/json",
        "n": 100,
        "note": "nextPageToken=present isLast=false summary:yes"
    },
    {
        "probe": "bulkfetch RDC-9999999",
        "status": 200,
        "type": "application/json",
        "n": 0,
        "note": ""
    }
]
```

### Run 4 — Plans timeline

```
URL: https://dalet.atlassian.net/jira/plans/7/scenarios/173/timeline?vid=311
boardId: null planId: 7 jql: null
timeline DOM distinct keys: 28
bulkfetch issues: [] issueErrors: []
[
    {
        "probe": "plans get plan (expect 403)",
        "status": 403,
        "type": "application/json",
        "n": "",
        "note": ""
    },
    {
        "probe": "bulkfetch RDC-9999999",
        "status": 200,
        "type": "application/json",
        "n": 0,
        "note": ""
    }
]
```

### Anything that looked wrong

**Two columns of Run 1 are snippet bugs, not findings.** Added while resolving `09`,
in the spirit of `02`'s "probe limitations" section — both would otherwise be read
as evidence.

1. **`inBoardSprintList: false` on all 32 sections is meaningless.** The snippet
   built its comparison set from `board/2122/sprint?maxResults=50`, and the probe
   table shows that call returned `n: 50, isLast=false, total=122`. So 72 of the
   board's sprints were never in the set, and *every* section missed — including
   `18951`/`18952`, which are plainly the board's own. §1.6 item 3 asked whether the
   page shows sprints the board's API does not; **this run cannot answer it**, and
   the question is closed from the other direction instead: `board/2122/sprint/5885/issue`
   returned 23 issues for a sprint whose header reads *"from MAM UI Team"*, and
   `domNotInApi` was `0` in all 32 sections. The API is a superset of the page, not
   a different set. **The foreign-sprint fear is dead.**
2. **The per-section `domKeys` under-counts, and that is itself a finding.** The
   `BACKLOG` section reported `domKeys: 0` against its own header, `28 of 504 work
   items visible`; the user counted ~37 links on the page against the snippet's
   summed 8. So `domKeysIn(el)` found nothing because **the element carrying
   `software-backlog.card-list.container.BACKLOG` does not contain its own cards.**
   Whatever element does is unknown, and `09` records it as the probe blocking any
   grouping of the live list by section.

**Also worth noting for anyone re-reading the numbers:** 29 of the 32 sections were
**collapsed** — their headers begin `"Expand…"` — so `domKeys: 0` there is correct
and expected. Only `RDN 2607-03` (`7 of 27`), `RDN 2608-01` (`1 of 23`) and
`Backlog` (`28 of 504`) were open.

**`HIDDEN_KEY` was left empty**, so `01`'s leftover probe is only half-closed:
`RDC-9999999` (real project, absent number) confirmed silent omission — `200`,
`issues: []`, `issueErrors: []`, on all four runs — but **permission-denied remains
untested**. `05` wants it before drawing the failed-summary states.

---

## Part 4 — Anatomy of a backlog row

One row's `outerHTML`, supplied by the user 2026-08-13 while chasing probe 1 (which
element holds a section's rows). It does not answer that question — the paste starts
at the row, and the question is about its ancestors — but it settles three other
things first-hand. Verbatim, so nothing here is inferred.

### 4.1 The row container carries the key in its own testid — new

```
software-backlog.card-list.card.content-container.RDC-2000
```

The exact analogue of the board's `id="card-RDC-21496"` that `02` found. So the
backlog has a key-bearing marker independent of any `href`:
`[data-testid^="software-backlog.card-list.card.content-container."]` enumerates the
mounted rows **and** their keys, leaf-of-testid giving the key. Useful as the
two-witness cross-check `02` §4 asked for, and as the probe-1 instrument (a row
selector makes `rowsInside` countable while walking up the tree).

### 4.2 The nesting is two wrappers deeper than `02` recorded

`02`'s "container list" nominated `software-backlog.card-list.card.card-contents.card-container`
for `closest()` anchoring. The real chain, outermost first:

```
software-backlog.card-list.card.content-container.RDC-2000      ← carries the key
  software-backlog.card-list.card.context-menu.escape-wrapper
    platform-context-menu.ui.context-menu.children-wrapper
      software-backlog.card-list.card.card-contents.card-container
        …card-contents.interaction-layer.accessible-card         ← aria-label = key + summary
        …card-contents.checkbox
        …card-contents.type-icon.type
        …card-contents.accessible-card-key
          <a …screen-reader-key href="/browse/RDC-2000">         ← key AND summary
          <a …key href="/browse/RDC-2000" aria-hidden tabindex=-1>
        …card-contents.summary
          …summary-field.summary-field-static.content            ← the summary (02 §5 ✓)
        …card-contents.status-field.status-field-wrapper.status-container
        …card-contents.estimate-field-wrapper / .due-date / .flag-container
        backlog.card-list.card.card-contents.assignee-field.…    ← note the prefix
```

For `07`'s decoration the **outer** container is the better anchor: it encloses the
row's context menu, which `card-contents.card-container` does not.

### 4.3 Two traps

- **The key appears three times per row** — both anchors plus the row testid. `02`
  §4 said anchor counts are not issue counts; this makes it worse, and the dedup
  rule is load-bearing.
- **The assignee fields drop the `software-` prefix**: `backlog.card-list.card.card-contents.assignee-field.assignee-field-static.avatar`,
  while every sibling on the row is `software-backlog.…`. Anything matching on a
  single prefix will miss them. (`02a` §1.4's rule — match the testid *leaf* with
  `*=`, never the full dotted path — already covers this, and here is why it
  exists.)
- Also mixed: `data-component-selector` values on the same row use three
  conventions — hyphenated (`software-backlog-card-container`), dotted and identical
  to the testid (`software-backlog.card-list.card.card-contents.key`), and dotted
  with a suffix (`….context-menu.menu_placeholder`). Do not assume it mirrors
  `data-testid`.

### 4.4 Probe 1, still open — the snippet that closes it

`software-backlog.card-list.container.BACKLOG` reported **zero** `/browse/` anchors
inside it while its header claimed `28 of 504 work items visible`. Most likely the
rows sit in a virtualised scroll container that is a *sibling* of the header rather
than a descendant. Run this on a backlog:

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

Table A: does any section container hold rows? Table B: `rowsInside` climbs while
walking up — **the first ancestor where it jumps to a section's worth is the element
grouping needs**, and whether `software-backlog.card-list.container.*` appears in
that chain at all. `rows.length` should land near the ~37 the user counted by eye,
which independently validates the row selector in §4.1.

```

```
