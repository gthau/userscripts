# 01 — Reading the Jira REST API from a userscript

Type: research
Status: resolved
Blocked by: —
Parent: ../map.md
Findings: ../research/01-jira-rest-api.md (desk research)
          + ../research/02c-live-dom-survey.md Part 1 (live verification)
Run with: prompt A in ../prompts.md — done; live checks done 2026-08-10

## Question

The Cart stores an issue key plus its summary, and the summary is to come from
Jira's REST API rather than from the DOM. Everything about the item model rests
on that being possible and cheap. Establish, against Atlassian's own
documentation and by reading how Jira Cloud's own front end calls its API:

1. **Does it work at all from page context?** A userscript running with
   `@grant none` on `https://<site>.atlassian.net/*` is same-origin with the
   API. Does `fetch("/rest/api/3/issue/ABC-123?fields=summary", {credentials:
   "same-origin"})` succeed on the browser session cookie, with no token and no
   OAuth? Is `/rest/api/3/` the right base for Jira Cloud today, or has it moved?
2. **What headers are required?** Does a GET need `X-Atlassian-Token: no-check`,
   an `Accept: application/json`, or any XSRF header? What does Jira return when
   they are missing — a 401, a 403, or an HTML login page with a 200?
3. **Is there a bulk read?** Fetching 50 issues one at a time is 50 round trips.
   Does `GET /rest/api/3/search/jql?jql=key in (A,B,C)&fields=summary` — or
   whatever the current search endpoint is, the older `/search` was deprecated —
   let one call cover a page's worth of keys? What is the ceiling on keys per
   JQL clause and results per page?
4. **Rate limits.** What limits apply to a cookie-authenticated browser call?
   What does Jira send back when throttled (429? `Retry-After`?), and what is
   the polite request rate for a script that might resolve 50 keys at once?
5. **Failure shapes that the UI must handle.** What comes back for a key that
   does not exist, a key the user cannot see, and a key that has been moved to a
   different project? Does a bulk call fail wholesale on one bad key, or return
   the good ones and omit the rest?
6. **Fields worth taking.** The summary is required. What else — `status`,
   `issuetype`, `parent` — arrives in the same call at no extra cost, so that
   `05` and `06` can decide on real information?

## Why this blocks

`04` (platform verdict), `05` (data model) and `06` (copy formats) all assume a
summary is obtainable. If the answer here is "no", the item model collapses back
to keys-only or DOM-scraped summaries and the whole downstream shape changes.

## Answer

**Yes. The API answers a same-origin browser call, and one call covers a whole
collection.** Desk research is in `research/01-jira-rest-api.md`; the two claims it
could only source second-hand were verified live against
`dalet.atlassian.net` on 2026-08-10 (`research/02c-live-dom-survey.md` Part 1).
Both held. One did not survive contact, and it is the important one — see Q5.

### 1. Does it work from page context?

**Yes, verified.** `GET /rest/api/3/issue/RDC-14817?fields=summary,status,issuetype,parent`
returned `200`, `content-type: application/json`, and the summary as a string. No
token, no OAuth, no `credentials` option — `fetch`'s default of `same-origin`
carries the session cookie, so `@grant none` is preserved. `/rest/api/3/` is the
correct base for Jira Cloud today, and the single-issue path
`/rest/api/3/issue/{issueIdOrKey}` — which the desk pass could not cite — is real.

### 2. Required headers, and what Jira returns when unhappy

`Accept: application/json` is sufficient for the GET. The POST in Q3 was sent with
`X-Atlassian-Token: no-check` and succeeded; **whether POST requires it was not
isolated**, so keep sending it — one header, cannot hurt.

**The failure shapes are worse than a 401, and this is the finding that changes
client code.** Logged out, on the same snippet:

| Call | Status | Content-type | Body |
| --- | --- | --- | --- |
| `GET .../issue/{key}` | **200** | **text/html** | Atlassian login page HTML |
| `POST .../issue/bulkfetch` | 400 | application/json | `{"message":"","status":400}` |

Neither is a `401`. The **HTTP-200-plus-HTML-login-page** failure mode that the
desk pass could only cite from a single forum post is real and reproducible. A
client that trusts `response.ok` will store login-page HTML as an issue summary.

*Caveat on provenance:* logged out, `<site>.atlassian.net` redirects to
`id.atlassian.com/login?...`, so this snippet may have run with
`id.atlassian.com` as its origin rather than `dalet.atlassian.net`. That would
explain both rows. It does **not** weaken the requirement — a redirect landing the
page on a host that serves `200 text/html` for every path is precisely the hazard
— but it means we have not proven that `dalet.atlassian.net` *itself* answers
`200`-HTML to an expired session. Treat the guard as mandatory either way; the
distinction changes nothing in the client.

**Therefore, as a hard rule:** a response is data only when `response.ok` **and**
`content-type` starts with `application/json` **and** the parsed body has the
expected shape. Three lines, and they remove an entire class of silent corruption.

### 3. Bulk read

**`POST /rest/api/3/issue/bulkfetch` confirmed live**, including the request and
response schema that the desk pass flagged as its weakest link:

```
POST /rest/api/3/issue/bulkfetch
{ "issueIdsOrKeys": ["RDC-14817", "ZZZZ-99999"],
  "fields": ["summary", "status"], "fieldsByKeys": false }
→ 200  { "expand": "names,schema", "issues": [ … ], "issueErrors": [] }
```

Use this rather than JQL search: keys go in directly, so there is no JQL string to
build or escape, no URL-length ceiling, and no `key in (…)` value-limit question.
The **100-keys-per-request** cap remains *reported, not tested* — untested because
the Cart is not expected to reach it. `GET /rest/api/3/search` is gone, not merely
deprecated; do not write against it.

### 4. Rate limits

Unchanged from the desk pass, and **not tested** — deliberately, because a
collection of ≤100 items is one request. That is also the argument for never
falling back to per-key fetches: the bulk path keeps the Cart permanently far from
any limit. `research/01-jira-rest-api.md` §4 has the documented figures.

### 5. Partial failure — the desk research was wrong here

**`issueErrors` did not report the missing key.** `ZZZZ-99999` came back neither in
`issues` nor in `issueErrors`, which was `[]`. The call returned `200` and simply
**came back short and silent** — exactly the behaviour the desk pass credited JQL
search with and praised `bulkfetch` for avoiding.

**Consequence, and it is a design rule not a detail:** the Cart must **diff
returned keys against requested keys** and treat absence as the normal signal for
"could not read this one". `issueErrors` may carry extra detail when populated,
but nothing may depend on it being non-empty.

*Not yet distinguished:* `ZZZZ` is not a real project on this site, so the probe
conflated "unparseable / no such project" with "no such issue in a real project"
and never covered permission-denied at all. A follow-up would send `RDC-9999999`
(real project, absent number) and a key in a restricted project. Worth doing
before `05` writes the failed-summary UI states — but **not blocking**, because
the diff rule above is correct under every outcome.

### 6. Fields worth taking

`summary`, `status` and `issuetype` all arrive in the same call at no extra cost,
each as a nested object (`status.name`, `status.statusCategory.colorName`,
`issuetype.name`, `issuetype.iconUrl`, `issuetype.hierarchyLevel`). `parent` was
requested on an Epic and simply **absent** from the response — so **a missing field
is normal, not an error**, and the client must not treat absence as failure.

Always pass `fields` explicitly. On the current API, omitting it no longer yields a
useful default — you get IDs back. That is the most likely way a naive port
silently returns nothing usable.

### What this means for the Cart

**Proceed. `04`, `05` and `06` are unblocked**, with four rules the build session
inherits:

1. **An item is valid with a key alone.** The summary is an enrichment layer with
   three states — never-fetched, fetched, failed. Never block an add on a fetch;
   never discard a key because its summary did not arrive.
2. **Validate `ok` + content-type + body shape** before storing anything. Verified
   necessary, not defensive padding.
3. **Diff requested against returned keys.** Absence is the signal. Do not trust
   `issueErrors` to be populated.
4. **One `bulkfetch` per ≤100 keys.** Never per-key.

**Refresh is cheap:** a whole collection costs one request. That settles the map's
*staleness of stored summaries* fog as a UX question, not a cost question.

**The standing risk, for `04`:** cookie/session auth is **undocumented and
unsupported** by Atlassian. It works — it is what Jira's own front end does — but
it is not a contract, and Atlassian could change it without a deprecation notice.
This is one of the few places where a Chrome extension is **genuinely no better**:
an extension calling the same endpoint inherits the same exposure.

**Also relevant to how much this path is used:** `02c` found the summary sits in
the DOM beside the key on most views. So the API is the *fallback*, not the primary
source — which reduces exposure to the risk above. See `02`'s answer.
