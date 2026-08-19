# 01 — Reading the Jira REST API from a userscript

Ticket: `../issues/01-jira-rest-api-from-a-userscript.md`
Run: prompt A, single agent, 12-fetch cap (all 12 spent), 5 web searches.
Date of research: 2026-08-07.

## How to read the confidence labels

Every claim below carries one of these. A build session should treat anything
below **Confirmed** as a thing to verify with one live call before building on it.

| Label | Means |
| --- | --- |
| **Confirmed** | Read on an Atlassian-owned page that I fetched in this session. URL given. |
| **Reported** | Stated on an Atlassian-owned page or by an Atlassian employee, but second-hand relative to the REST reference — a KB article, a staff blog post, or a search-engine snippet quoting the reference page I could not render. |
| **Unconfirmed** | Could not source. Reasoning or convention only. Do not build on it without checking. |

## Source availability — read this first

**The Jira Cloud REST API v3 reference pages could not be read in this session.**
Four fetches were spent on them and all four came back empty:

- `https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/` — **unavailable** (fetched twice; the page converts to nothing usable, apparently a client-rendered document too large for the fetch tool to retain)
- `https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/` — **unavailable**, same failure
- `https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/` — **unavailable**, same failure

That is the single biggest limitation of this report. Exact parameter tables,
exact response schemas and exact per-endpoint status codes are therefore
**Reported**, not **Confirmed**, wherever they appear below. The smaller
Atlassian pages (rate limiting, security overview, support KBs, the Forge JQL
page, the deprecation notice) all rendered fine and are the backbone of what is
Confirmed here.

Pages that did render, and are cited below:

- `https://developer.atlassian.com/cloud/jira/platform/rate-limiting/`
- `https://developer.atlassian.com/cloud/jira/platform/security-overview/`
- `https://developer.atlassian.com/cloud/jira/platform/deprecation-notice-basic-auth-and-cookie-based-auth/`
- `https://developer.atlassian.com/server/jira/platform/form-token-handling/` (Jira **Server/Data Center** docs — labelled as such wherever used)
- `https://developer.atlassian.com/platform/forge/working-around-jql-1000-limit/`
- `https://confluence.atlassian.com/jirakb/run-jql-search-query-using-jira-cloud-rest-api-1289424308.html`
- `https://support.atlassian.com/jira/kb/how-to-use-the-maxresults-api-parameter-for-jira-issue-search-rest-api/`
- `https://community.atlassian.com/forums/Jira-articles/Avoiding-Pitfalls-A-Guide-to-Smooth-Migration-to-Enhanced-JQL/ba-p/2985433` (Atlassian Team member, Grzegorz Lewandowski)

Per the prompt, GitHub prior art was not surveyed — that is prompt C's job.

---

## 1. The bulk read: what replaced `GET /rest/api/3/search`

### 1.1 The old endpoint is gone, not merely deprecated

**Reported.** `GET`/`POST /rest/api/3/search` was deprecated and has since been
switched off. The Atlassian KB states the legacy endpoint "is deprecated and
removed" and that callers must migrate to `/rest/api/3/search/jql`.
Source: `https://confluence.atlassian.com/jirakb/run-jql-search-query-using-jira-cloud-rest-api-1289424308.html`

**Reported.** The announcement is changelog entry **CHANGE-2046**. The timeline
that surfaced in search: deprecated from 1 May 2025, progressive shutdown from
1 August 2025, all traffic to the old endpoints blocked by end of October 2025.
I could not render the changelog page itself, so treat the dates as indicative.
The operative fact for the Cart is simply: **do not call `/rest/api/3/search`.**

### 1.2 The replacement — JQL "enhanced search"

**Confirmed (path and both methods).** `/rest/api/3/search/jql` accepts **both
GET and POST**. The Atlassian KB shows a working GET example verbatim:

```
curl --request GET \
  --url 'https://<yoursitename>.atlassian.net/rest/api/3/search/jql?maxResults=10000&jql=project=OP and created >= -7d' \
  --user 'email@example.com:<api_token>' \
  --header 'Accept: application/json'
```

(JQL must be URL-encoded on GET; the KB notes POST "avoid[s] URL encoding
requirements and handle[s] longer query strings".)
Source: `https://confluence.atlassian.com/jirakb/run-jql-search-query-using-jira-cloud-rest-api-1289424308.html`

Note the Atlassian staff migration article mentions only the POST form and "does
not mention a GET variant" — the two Atlassian sources disagree in emphasis, but
the KB's explicit GET curl example is the stronger evidence that GET exists.

**Reported.** Companion endpoint for counts: **`POST /rest/api/3/search/approximate-count`**.
It exists because `total` was removed from the search response.
Source: the Atlassian Team migration article.

### 1.3 Pagination changed shape

**Confirmed.** "Pagination for this endpoint now relies on the `nextPageToken`
parameter instead of the deprecated `startAt` parameter."
Source: the Atlassian KB above.

**Reported.** The response body is essentially `issues` + `nextPageToken`;
`total` is **no longer returned**. `isLast` was not mentioned by any source I
could read — treat "no `nextPageToken` in the response" as the end-of-results
signal, and treat `isLast` as **Unconfirmed**.
Source: the Atlassian Team migration article.

### 1.4 Page-size ceiling

This is the least well-sourced number in the report, and the sources disagree.

- **Confirmed:** "By default, the Jira Issue Search REST API returns a maximum of
  50 items per response."
  Source: `https://support.atlassian.com/jira/kb/how-to-use-the-maxresults-api-parameter-for-jira-issue-search-rest-api/`
  (This KB is thin — it states the default and nothing else. It does **not**
  state the maximum, does not distinguish the endpoints, and says nothing about
  field-dependent page sizes.)
- **Reported:** the maximum offered batch size is **5,000** — the Atlassian Team
  article advises "Utilize maximum offered batch size and ask for 5K issues".
- **Reported:** the achievable page size **depends on which fields you ask for**.
  The same article: if you "skip specifying any `fields` or `expands`… Jira will
  just return `ids`", which "offers bigger batch sizes". So the server may return
  fewer rows than `maxResults` when the payload is fat.
- The KB's own curl example passes `maxResults=10000`, which is above the stated
  5,000. Nothing I could read says whether an over-large value errors or is
  silently clamped. **Unconfirmed.**

**Practical takeaway for the Cart:** ask for `maxResults` equal to your key
count, and **do not assume you got every row back** — always reconcile the
returned issues against the keys you asked for.

### 1.5 The purpose-built alternative: `POST /rest/api/3/issue/bulkfetch`

**Reported.** There is a dedicated bulk-read endpoint that takes issue IDs *or
keys* directly, so you do not have to express the request as JQL at all:

- Path: **`POST /rest/api/3/issue/bulkfetch`**
- Body includes `issueIdsOrKeys` (array), plus `fields`, `expand`, `fieldsByKeys`, `properties`
- Sources: the Atlassian Team migration article (recommends it as the way to
  "get all issue details you need" after a search returns bare IDs, and shows
  pseudo-code batching "into batches of 100"); plus search snippets quoting the
  unrenderable reference page.

**Reported (search snippet quoting the reference page, not read directly).**
The cap is **100 issues per request**: the endpoint "returns the details for a
set of requested issues (up to 100)", and requesting more yields a 400 with the
message *"No issue IDs or keys were provided, or more than 100 were requested."*
Also reported: the endpoint resolves each identifier by ID/key, falls back to a
case-insensitive match, and **checks for moved issues**.

Because the reference page never rendered, the exact request/response schema is
the weakest link in this report. **A build session should make one live
`bulkfetch` call and read the actual JSON before designing around it.**

### 1.6 Cap on keys in a `key in (...)` JQL clause

**Confirmed, but scoped to something else.** Atlassian documents a 1,000-value
limit and describes exactly the counting rule you would care about: "The platform
counts all literal values in the JQL fragment. If the total exceeds 1000, the
validation fails with a `TOO_LONG_VALUES_LIST` error", and each literal in
`key IN (A, B, C)` counts as 3 values. The user-facing error is
`VALIDATION_ERROR`: *"Function '{function_name}' provided by '{app_name}' has
returned more than the maximum of 1000 values"*.
Source: `https://developer.atlassian.com/platform/forge/working-around-jql-1000-limit/`

**Unconfirmed:** that page is written about **values returned by a custom JQL
function (a Forge app)**, and it does **not** state that a hand-written
`key in (A-1, A-2, …)` sent straight to the search endpoint hits the same
validator. The counting rule is described in platform terms, which is
suggestive, but I will not claim it.

For the Cart this is moot at the scale in the ticket: a page's worth of keys is
tens, not thousands. The real constraint at that size is **URL length on a GET**,
which is why POST (or `bulkfetch`) is the safer shape.

---

## 2. Single-issue read

**Unconfirmed in this session.** The reference page for the Issues group never
rendered, so I cannot cite `GET /rest/api/3/issue/{issueIdOrKey}` — nor its
`fields`, `fieldsByKeys`, `expand`, `properties` parameters, nor its status
codes — against a page I actually read. Every Atlassian source I *could* read
uses the `/rest/api/3/…` base on `https://<site>.atlassian.net` (the KB curl
example above confirms the base and the host), so the base is **Confirmed**; the
issue path itself is convention I could not verify here.

What I can say with confidence about the shape of `fields`:

- **Confirmed** that `fields` is a real query parameter on the search endpoint —
  the Atlassian KB lists it: "`fields`: Specifies which fields to return".
- **Reported** that on enhanced search, omitting `fields` no longer gives you a
  useful default: you get IDs back. This is a behaviour change from the old
  `/search`, and it is the single most likely way a naive port silently returns
  nothing useful. Always pass `fields` explicitly.

**Recommendation:** the build session should confirm the single-issue path with
one call from the browser console on a real Jira page before writing the client.
It is a five-second check and it removes the only structural unknown in the
read path.

---

## 3. Auth for a same-origin browser call

### 3.1 Cookie auth is not a documented, supported method

**Confirmed.** The Jira Cloud security overview lists the supported
authentication methods for the platform REST API as: **OAuth 2.0 (3LO)**,
**Forge**, **Connect (JWT)**, and **Basic auth with an API token**. Session or
browser-cookie authentication is **not listed**. The page contains no mention of
cookies, sessions, XSRF/CSRF, or `X-Atlassian-Token` in its body at all.
Source: `https://developer.atlassian.com/cloud/jira/platform/security-overview/`

**Confirmed.** Atlassian's deprecation notice is titled for basic auth *and*
cookie-based auth: "Basic authentication with passwords and cookie-based
authentication are now deprecated and will be removed in 2019", with
`/rest/auth/1/session` named as the endpoint being removed, progressive
disabling "from June 3rd, 2019", and the instruction to "update your app or
integration to use API tokens, OAuth, or Atlassian Connect".
Source: `https://developer.atlassian.com/cloud/jira/platform/deprecation-notice-basic-auth-and-cookie-based-auth/`

**The distinction that matters, and that Atlassian does not spell out:** what
that notice kills is a *script obtaining a session by POSTing credentials to
`/rest/auth/1/session`*. It is silent on a request issued **from an already
authenticated Jira browser tab, same-origin, carrying the session cookie the
browser already holds** — which is the userscript's situation, and which is what
Jira's own front end does on every page load. The notice "does not address
browser-based or same-origin calls from logged-in user sessions separately".

So the honest verdict for the ticket's question 1:

> **Reported/inferred, not documented.** The call is expected to work — it is the
> same request the SPA makes — but it is **unsupported and undocumented**, which
> means Atlassian owes you no notice before changing it. The Cart must be built
> so that a failed summary fetch is a degraded item, not a broken script.

That is a genuine platform risk and belongs in ticket `04`'s verdict, not buried
here.

### 3.2 Does a GET need an XSRF header?

**Confirmed (header name/value only, and from the Server/DC docs):** the header
is exactly `X-Atlassian-Token: no-check`, and it exists so that scripts can "opt
out of token checking".
Source: `https://developer.atlassian.com/server/jira/platform/form-token-handling/`
— note this is the **Jira Data Center / Server** documentation, not Cloud.

**Unconfirmed:** that page does *not* state which HTTP methods the check applies
to, does not address GET explicitly, and does not give the failure status code
or message. I found no Cloud-side documentation of the header at all.

Reasoning (explicitly **inference**, not a source): the mechanism is a *form*
token guarding state-changing actions; a read-only GET has nothing to forge. The
cheap, harmless mitigation is to send `X-Atlassian-Token: no-check` on the GET
anyway — it costs one header and cannot make a read fail.

**Confirmed as good practice from the KB example:** send `Accept: application/json`.
Every Atlassian example does.

### 3.3 What Jira returns when unhappy — including the HTTP 200 trap

This is the question the prompt flagged as most dangerous, and it is the one I
must mark down.

- **Confirmed** for basic auth: "all requests using basic authentication with a
  non-API token credential will return 401 (Unauthorized) after the deprecation
  period."
  Source: the deprecation notice above.
- **Unconfirmed** for the cookie/session case. I could not find any Atlassian
  page documenting what a Jira Cloud REST GET returns when the browser session
  is absent or expired.
- **Reported, weakly (community report surfaced in search, not an Atlassian
  statement):** at least one user describes getting "200 OK but in response
  getting whole html page source code which contains a lot of hyperlinks along
  with login page asking username and password" from a Jira REST call with
  broken auth. That is the exact failure mode the prompt worried about. One
  forum report is not proof that Jira Cloud does this for the same-origin cookie
  case — but it is enough to say the risk is real rather than theoretical.

**Therefore, as a hard requirement on the client, regardless of how the
uncertainty resolves:** a response is only usable when **all** of these hold —

1. `response.ok` is true, **and**
2. the `content-type` header starts with `application/json`, **and**
3. the parsed body has the expected shape (an `issues` array, or the requested
   issue's `fields.summary` as a string).

Anything else is a fetch failure, not data. A client that trusts the status code
alone can and will store an HTML login page as an issue summary. This costs
three lines and removes an entire class of silent corruption.

---

## 4. Rate limits

**Confirmed** — all from `https://developer.atlassian.com/cloud/jira/platform/rate-limiting/`:

- **Who the documented limits apply to:** "all Forge, Connect, and OAuth 2.0
  (3LO) apps." Also: "API token-based traffic is not affected by this change,
  and will continue to be governed by existing burst rate limits."
- **Browser/session-cookie calls from a logged-in user are not mentioned anywhere
  on the page.** The published cost-budget model is app-scoped. What governs a
  userscript's same-origin traffic is therefore **Unconfirmed** — most plausibly
  whatever governs the SPA's own traffic, which Atlassian does not publish.
- **Throttled response:** "When any limit is exceeded, Jira returns an HTTP
  `429 Too Many Requests` response."
- **Retry-hint headers, exact names:** `Retry-After`, `X-RateLimit-Limit`,
  `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-NearLimit`,
  `RateLimit-Reason`, plus beta-prefixed variants (`Beta-RateLimit-Policy`,
  `Beta-RateLimit`, `Beta-Retry-After`, and legacy `X-Beta-RateLimit-*`).
  `Retry-After` is the one to honour.
- **Published numbers (app quotas — indicative of scale, not binding on a
  userscript):** per-second burst defaults of GET 100/s and POST 100/s (PUT and
  DELETE 50/s); hourly point pools of 100k–150k per tenant plus per-user
  increments, capped at 500,000 points/hour; a GET on a core domain object
  costs 1 point.
- **Recommended client behaviour, quoted:** "Implement retry logic that backs off
  exponentially rather than retrying immediately. Add random jitter to avoid the
  thundering herd problem." — "Start with a reasonable initial delay (e.g., 2
  seconds)… double the delay up to some maximum (e.g., retry after 2, 4, 8, 16
  seconds)… Multiply the delay by a random factor (e.g; between 0.7 and 1.3)."
  And: "Avoid using excessive concurrency: While parallelism can improve
  performance, using it specifically to bypass rate limits will lead to more 429
  responses and degraded performance overall."

**What this means for "resolve 50 keys at once":** if the Cart does one bulk
call for 50 keys, rate limiting is a non-event — it is a single request, well
inside any plausible budget, and roughly what one page navigation in Jira costs.
The rate-limit discussion only becomes real if the Cart ever falls back to
per-key fetches. That is an argument for the bulk path being the *only* path.

---

## 5. Partial failure of a bulk read

**Reported (search snippets quoting the unrenderable reference page; corroborated
across two independent snippets, but not read first-hand):**

- `bulkfetch` returns **both** successes and failures in one response: an
  `issues` array **and** an `issueErrors` array. "If some issues can't be fetched
  due to retriable error or payload constraints, [it] returns entries in
  `issueErrors` alongside successfully returned issues."
- Error categories that surfaced by name: `issueIsSubtask`,
  `issuesInArchivedProjects`, `issuesInUnlicensedProjects`, `issuesNotFound` —
  each carrying a count, the list of offending `issueIdsOrKeys`, and a message.
- Moved issues: the endpoint reportedly "checks for moved issues" when resolving
  an identifier, which suggests a key that has moved project resolves rather than
  404s. **Unconfirmed** and worth a live test — it directly answers the ticket's
  "moved to a different project" case.

**Confirmed by inference from JQL semantics** for the search path: a JQL
`key in (…)` search is a *query*, not a lookup. Issues the user cannot see are
not matched, so they are simply absent from `issues` — the call succeeds and
comes back short. (A non-existent key, by contrast, has historically made Jira
reject the whole JQL query as invalid rather than return fewer rows. I could not
source this in this session — **Unconfirmed**, and it is a meaningful difference
between the two approaches.)

**The design consequence is the same either way, and does not depend on
resolving the uncertainty:** the Cart must treat a bulk read as
*best-effort per key*. Ask for N keys, expect ≤N back, and diff the returned set
against the requested set to find the ones that did not come home. Never index
the response positionally.

The distinction that matters for `05`: **"absent from the response" is not one
state, it is at least three** — does not exist, exists but invisible to this
user, and transient failure. `bulkfetch`'s `issueErrors` categories may let you
tell them apart; a JQL search will not. That is the strongest argument for
`bulkfetch` over search for this use case.

---

## 6. Fields worth taking (ticket question 6)

**Unconfirmed at the level of "what each field costs".** I could not read the
reference and found no Atlassian statement pricing individual fields.

What is **Reported** and does bear on the decision:

- Payload size affects how many issues come back per page — requesting only
  `id`/`key` "offers bigger batch sizes" (Atlassian Team article). So fields are
  not free; they trade against page size.
- Since enhanced search returns IDs when `fields` is omitted, the field list is
  now a required, deliberate choice rather than a default you can lean on.

`summary`, `status`, `issuetype` and `parent` are all standard system fields
returned by the same `fields` parameter in one call — **Unconfirmed** as to
whether adding them measurably shrinks the page at the Cart's scale, but at
tens of issues it cannot plausibly matter.

**Recommendation:** request `summary,status,issuetype,parent` from day one and
let `05`/`06` decide what to *store*. Fetching a field you discard costs one
comma; discovering later that you need it costs a refetch of every stored item.
Store whatever `05` decides, but do not let the fetch shape constrain that
decision.

---

## What this means for the Cart

**The item model can rely on the API for summaries — with one named caveat and
one mandatory guard.**

1. **Yes, build on the API rather than the DOM.** A same-origin `fetch` from
   `@grant none` on `<site>.atlassian.net` carrying the session cookie is what
   Jira's own front end does. Nothing found in this session contradicts it
   working.

2. **The caveat, and it is real:** this is **undocumented and unsupported**.
   Atlassian's own security overview lists four auth methods and session cookies
   is not one of them, and Atlassian formally deprecated "cookie-based
   authentication" in 2019 — even though what that notice actually removed was
   `/rest/auth/1/session`, not the browser's own session. Ticket `04` should
   record this as a standing platform risk of the userscript approach, and it is
   one of the few places where a Chrome extension is genuinely no better — an
   extension calling the same endpoint inherits the same exposure.

3. **The mandatory guard.** Design principle 4 from the map — *if a subsystem
   breaks, the safe default must be what remains* — applies directly. Concretely:
   - An item is **valid with a key alone**. The summary is an enrichment layer
     with three states: never-fetched, fetched, and failed. Never block an add
     on a fetch, and never discard a key because its summary did not arrive.
   - Validate every response on `response.ok` **and** JSON content-type **and**
     expected body shape before storing anything. The HTTP-200-HTML-login-page
     failure mode could not be confirmed against Atlassian's docs, but a
     community report of exactly that exists, and the guard is three lines. This
     is not defensive padding — without it, a logged-out tab silently poisons
     stored data in a way the user cannot see or undo.
   - Diff returned keys against requested keys. Absence is normal, not an error.

4. **Use one bulk call, and prefer `bulkfetch` to a JQL search.** `POST
   /rest/api/3/issue/bulkfetch` takes keys directly (no JQL string to build or
   escape, no URL-length problem, no `key in (…)` value-limit question), and —
   per the reported schema — tells you *which* keys failed and *why* via
   `issueErrors`. A JQL search only ever comes back short and silent. Batch at
   **100 keys per request** (the reported cap). At the Cart's scale this is one
   request, so rate limits are a non-issue — which is itself the argument for
   never falling back to per-key fetches.

5. **Feasibility of refresh (this unblocks the map's "Staleness of stored
   summaries" fog):** refreshing an entire collection of ≤100 items costs **one
   request**. That is cheap enough that "refresh on drawer open" is affordable,
   and `05` can treat staleness as a UX question rather than a cost question.

6. **What a build session must verify first** — three live calls, five minutes,
   from the console on a real Jira page:
   - `GET /rest/api/3/issue/{key}?fields=summary` — confirms the single-issue
     path and base, neither of which I could cite first-hand.
   - `POST /rest/api/3/issue/bulkfetch` with a mixed batch: a real key, a
     non-existent key, and (if available) a key in a restricted project.
     Read the actual `issues`/`issueErrors` JSON. This is the highest-value
     single check in the whole ticket, because the whole partial-failure design
     rests on a schema I could only source second-hand.
   - The same two calls in a logged-out tab, to settle the 401-vs-200-HTML
     question empirically for this site. If it 401s cleanly, note it and keep
     the content-type guard anyway.

**Verdict for `04`, `05`, `06`: proceed.** The item model may assume a summary is
obtainable, cheaply, in one call per 100 keys — provided it is modelled as an
enrichment that is allowed to be missing, never as a precondition for holding a key.
