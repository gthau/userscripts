# Session prompts for the Jira Cart map

> **Prompts A–D have been run and are history.** A, B and C landed in `research/`;
> D was run by the user on 2026-08-10 into `research/02c-live-dom-survey.md`.
> Tickets `01`–`04` are resolved. Keep the A–D section for the guards it records —
> they are why the second attempt survived, and every later prompt reuses them.
>
> **E has been run — ticket `09` is resolved.** Its phase 1 landed in
> `research/09a-list-scope-api.md` (desk pass 2026-08-11, four devtools runs by the
> user 2026-08-12); phase 2's grilling produced `09`'s Answer and amended two of the
> map's standing constraints.
>
> **F has been run — ticket `05` is resolved.** Its probe landed in
> `research/05a-storage-probe.md` (run by the user 2026-08-13; Part 3 holds the
> conclusions); the grilling produced `05`'s Answer, amended five standing
> constraints, and graduated the *staleness of stored summaries* fog. No web
> fetches were spent. The vocabulary is settled there and `06`, `07` and `08`
> should take it as given.
>
> **G has been run — ticket `07` is resolved.** The prototype
> (`prototypes/07-add-gesture.user.js`, v0.4.0) was built, installed and used on
> 2026-08-14 across four rounds of feedback; the verdict is a **floating toggle
> to the left of the hovered link** — `+` adds, `✓` says it is in, clicking a
> collected one removes it. The per-row `+` is dead (it reflows Jira's rows on
> all four views tried), and the right-click menu is demoted to an opt-in
> preference shipped off. Three fetches of four were spent; Tampermonkey's own
> docs are recorded as unavailable. One constraint row gained the gesture's
> form, one gained a third platform observation, and **`05` §3 was amended** —
> it carries a note, since the toggle contradicts its no-op clause.
> **The prototype is throwaway — delete it and any `gt-jira-cart.proto*` key
> once `08` closes.**
>
> **H has been run — ticket `06` is resolved.** Four formats ship — 🔗 Links,
> 📃 Names, 🔑 Keys, 🔍 JQL — worked examples are in the Answer. Links is straight
> reuse of `jira-ux`'s 🔗 link, whose shape changed mid-session: the user rebased
> onto master, which brought in `37ff03a` (`[KEY](url) Summary`). **No format ever
> drops an item**, and Names' summary-less line is what kills the template model —
> so templates would be a **rewrite**, not a setting, and the ADR may not claim a
> seam the map never promised. Two fetches of three spent, both on the clipboard
> data-type question; MDN did not carry the answer, the W3C spec did. Two `05`
> constraints amended (gap-fill's trigger is a state, not an event; a refresh may
> replace a summary but never delete one) and a fourth *Platform* observation
> added — **the first testable one: does a `ClipboardItem` write survive a
> `@grant`?** If it does, moving the collections into Tampermonkey's storage is
> largely unopposed, since `09` already deleted the other reason for `@grant none`.
>
> **I has been run — ticket `08` is resolved, and THE MAP IS COMPLETE.** The
> prototype (`prototypes/08-drawer.user.js`) grew from `07`'s across ten versions
> on 2026-08-17/18; seven questions were settled by looking and eleven by arguing.
> The split the prompt insisted on held: the shell built only the *use* questions,
> and nothing half-built got argued about as though it were a proposal. **Six
> defects came out of use and three of them are one mistake** — a box given a size
> by something that knew nothing about it — which is the shape of warning the ADR
> has to carry. Two constraint rows were rewritten (*Placement* gained the
> positioning contract, *Panel UI* the drawer's own rules) and two amended
> (*Export*, *Item data*). **`02` §5 was corrected**: the timeline's summary is
> readable after all, so the cascade has a sixth tier and covers all seven views.
> One finding belongs to another script and must not be lost — **`jira-ux`'s
> fallback toolbar is invisible behind Jira's navigation, so every Firefox user of
> it has no toolbar** (`08` §1).
>
> **A tenth ticket was opened on 2026-08-18, after the map went complete.**
> `10` — where the collections live — asks whether the store should stay
> `localStorage`, move to Tampermonkey's, or become `localStorage` mirrored into
> **Jira's own per-user properties**, an option that was never on the table when
> `04` and `05` ran. It can amend both of them, so it goes first.
>
> **K has been run — ticket `10` is resolved, and the map is COMPLETE for the
> second and final time.** The verdict is **candidate B: the collections live in
> Tampermonkey's own storage, under a `@grant`.** Phase 1 spent six of eight fetches
> and found the property ceiling (**32,768 bytes**) and that **a Jira admin can read
> another user's properties**; three doc questions were unreadable, **confirming
> `07` a second time**. Phase 3's grilling designed candidate C in full, reshaped by
> two user corrections — *one pair of hands* and *tens of tabs*. **Then five runs by
> the user on 2026-08-18 settled it by measurement.** Run 1 aborted on a bug in the
> snippet (`accountId` is mandatory on every call and v1 sent it on one), and the
> four that followed were clean: **the clipboard survives a `@grant`** — the
> question open since `06`, answered twice — **`GM_setValue` is synchronous**,
> **`bulkfetch` survives the sandbox**, and **the change listener crosses tabs**.
> So the grant costs nothing anyone named, and **`05`'s model transfers unchanged**;
> it is a substitution of two calls. One rule from the user is a scar for the ADR:
> **`GM_*` is synchronous, `GM.*` is promise-based**, and the dotted form would put
> an `await` in the copy handler. `04`'s verdict stands, `05` §5's rejection of
> `navigator.locks` survives, `06`'s framing is **softened with no format moved**,
> and **candidate C is preserved, not discarded** — measured in full at
> [`10a` Part 5](research/10a-storage-options.md) with the three conditions that
> would bring it back. Neither out-of-scope entry graduated, but both had reasons
> that were false: **Bitbucket and Confluence are now recorded as intended future
> work**, blocked on DOM surveys rather than on storage. The probe is deleted.
>
> **J has been run on 2026-08-18. THE DESTINATION IS REACHED, and no prompt is
> live.** [`src/jira-cart.user.md`](../../src/jira-cart.user.md) is written: 1957
> lines, from the **ten** Answers — J's own prompt body says nine, because `10` was
> opened after it was written, and the count was taken from this banner instead. It
> decided nothing and spent zero fetches. Its storage and platform sections are
> written as settled, which only `10` made possible. One question it names as open
> rather than answering: `10` moved *the collections* into Tampermonkey's storage and
> never said where `gt-jira-cart.prefs` and `…collections.bak` live.
>
> **The spec is written to stand alone, because this directory is not committed.**
> The user's decision on taking the verdict: commit one file, not ten tickets. So the
> ADR cites tickets by name rather than by path, and **three appendices carry what
> lived only here** — A, every measurement with its date; B, candidate C's design,
> its numbers and the three conditions that revive it; C, the two written-but-unrun
> probes, snippet included. Nothing else in this directory was load-bearing.
>
> **`jira-ux`'s invisible fallback toolbar is FIXED**, not merely recorded — the user
> chose to take it now. `src/jira-ux-improvements.user.js` 0.3.2 gives the fixed
> corner `z-index: 9999` and pins the anchored branch back to `1`, so the Chromium
> position is unchanged; that ADR gains risk 6. Two related observations went into
> the Cart's own risks: the repair rests on the harness's forced-fallback switch
> rather than on a Firefox run, and **`jira-backlog-sprints` puts its
> contract-warning badge in the bottom-right at the maximum `z-index`**, which `08`
> never saw because its harness looked at the top-right.
>
> **`07`'s and `08`'s prototypes are DELETED**, on 2026-08-18, after the user read
> the spec — that ordering was the point, since they were the primary source for
> those two mechanisms and the ADR now carries them (§2.7, §2.9, §2.11). The
> `prototypes/` directory is gone. **The `gt-jira-cart.proto*` localStorage keys are
> the user's to clear by hand**: `gt-jira-cart.proto`, `.proto.mode`, `.proto.menu`,
> `.proto.08` and `.proto.08.prefs`. The prompt bodies of `G`, `I` and `K` still name
> the files, and that is history rather than a dangling instruction.
>
> **The next effort is the build**: `src/jira-cart.user.js`, from the spec, opening
> no decision. **Its prompts are in [`build-prompts.md`](build-prompts.md)**, not
> here — three of them, `L1` the engine, `L2` the drawer, `L3` hardening, in the
> order the prototypes grew. **This file is history from here on.**

The research tickets are meant to be run as **separate sessions**, one prompt
each, so token use stays visible and controllable.

**What went wrong the first time:** the two research agents were launched as
general-purpose subagents, and each spawned further subagents of its own — six
agents in total. Those fanned out onto rate-limited sources (grep.app blocks
bots, the GitHub API caps unauthenticated calls at 60/hour), retried, and
started downloading repo tarballs. The session limit hit before anything was
written to disk.

Every prompt below therefore carries the same three guards, and they matter more
than the research instructions:

- no subagents, no workflows — one agent, one session
- a hard cap on page fetches, stated per prompt
- a blocked or rate-limited source is recorded as unavailable and abandoned,
  never retried and never worked around by cloning

Run them in whatever order suits. Only **A** and **B** feed anything that is
currently blocked.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| A — Jira Cloud REST API | 01 | medium, docs-heavy | Opus |
| B — In-repo selector inventory | 02 | small, no web at all | Sonnet |
| C — Prior-art survey | 02 | medium, the risky one | Sonnet |
| D — Live-DOM survey | 02 | ~15 min of your time | you, in devtools |

Run **B before C**. B is nearly free and tells C what is already known, so C
does not re-derive it.

---

## Prompt A — Jira Cloud REST API from a userscript (ticket 01)

```
Read /home/ghis/othercode/userscripts/.scratch/jira-cart/issues/01-jira-rest-api-from-a-userscript.md
and /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md for context, then answer that
ticket's six numbered questions.

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 12 web page fetches in total. Count them. When you reach 12, stop fetching and write up
  what you have.
- Use Atlassian's official developer documentation. If a page is blocked, rate-limited or 404s,
  write it down as unavailable and move on. Do not retry it, do not find a mirror, do not clone
  or download anything.
- Do not survey GitHub for prior art. That is prompt C's job.

Start from the Jira Cloud platform REST API v3 reference and the Atlassian developer changelog.
Prioritise, in this order:
1. The current bulk-read endpoint for fetching many issues by key. GET /rest/api/3/search is
   deprecated — establish what replaced it, its exact path, its parameters, its page-size ceiling,
   and any cap on how many keys a `key in (...)` JQL clause accepts.
2. Single-issue read: exact path and the `fields` parameter for summary, status, issuetype, parent.
3. Auth for a same-origin browser call carrying the session cookie. Does a GET need any XSRF or
   X-Atlassian-Token header? Name explicitly what Jira returns when unhappy — in particular
   whether an unauthenticated call can return HTTP 200 with an HTML login page rather than a 401,
   because a script that trusts the status code would silently store garbage.
4. Rate limits for cookie-authenticated browser calls: the limit, the response when throttled,
   and which response headers carry the retry hint.
5. Partial failure of a bulk read: what happens when one key in the batch does not exist, or the
   user lacks permission on it. Does the whole call fail, or come back short?

Accuracy beats completeness. A clearly-labelled "could not confirm from primary sources" is a good
answer; an invented endpoint path or header name is not, because a build session will act on this.
Mark every claim you could not source.

Write to /home/ghis/othercode/userscripts/.scratch/jira-cart/research/01-jira-rest-api.md, one
section per question above, a source URL against each claim, and a final section
"What this means for the Cart" recommending whether the item model can rely on the API for
summaries. Do not commit. Do not touch anything outside that research directory.
```

---

## Prompt B — In-repo selector inventory (ticket 02, part 1)

```
Read /home/ghis/othercode/userscripts/.scratch/jira-cart/issues/02-finding-issue-references-in-jira-dom.md
for context. This task is entirely local.

HARD CONSTRAINTS:
- Do NOT spawn subagents. Do NOT use the Agent or Workflow tools.
- Do NOT use the web at all. Zero fetches. Everything you need is in this repo.

Read these files in /home/ghis/othercode/userscripts/src/:
  jira-ux-improvements.user.js and jira-ux-improvements.user.md
  jira-backlog-sprints.user.js and jira-backlog-sprints.user.md
  jira-show-fixversion-dates.user.js
  bitbucket-ux-improvements.user.js   (for the shared helpers only)

Produce a precise inventory of every Jira DOM hook already relied on and proven to work:
- every data-testid string, element id, aria-label, role and href pattern used to find something
- the issue-key regex, and the route-parsing logic that extracts a key from a URL
- which Jira view each selector was written against, where the code or the ADR says so
- any comment or ADR passage about a selector being fragile, having broken, or having a fallback

Give a file:line reference for each entry. Quote the selector exactly — do not paraphrase or
normalise it.

Then two short sections:
- "Reusable as-is" — hooks the Cart could adopt directly, with what each one identifies.
- "Gaps" — the views listed in ticket 02 (issue view, backlog, board, search results, epic
  children and issue links, timeline, dashboard gadget) for which this repo contains no evidence
  at all. Be blunt; this list is the point of the exercise.

Also note, with file:line, which of logger / guard / injectStyle / the route detector / the
animationstart mount detector appear in more than one script, and whether the copies have drifted
apart. Ticket 03 needs that.

Write to /home/ghis/othercode/userscripts/.scratch/jira-cart/research/02a-repo-selector-inventory.md.
Do not commit. Do not modify anything outside that research directory.
```

---

## Prompt C — Prior-art survey (ticket 02, part 2)

```
Read /home/ghis/othercode/userscripts/.scratch/jira-cart/issues/02-finding-issue-references-in-jira-dom.md
and /home/ghis/othercode/userscripts/.scratch/jira-cart/research/02a-repo-selector-inventory.md
(run prompt B first — do not re-derive what it already found).

This is the prompt that overran last time. Read the constraints twice.

HARD CONSTRAINTS:
- Do NOT spawn subagents. Do NOT use the Agent or Workflow tools. One agent.
- At most 15 web page fetches in total. Count them out loud as you go. At 15, stop and write up.
- Do NOT clone repositories. Do NOT download tarballs or archives. Do NOT use the GitHub API for
  search — it caps unauthenticated callers at 60 requests an hour and you will lose the session to
  it. Read individual raw source files by URL only.
- grep.app blocks automated access. Do not use it. If any source is blocked or rate-limited,
  record it as unavailable in one line and move on immediately. No retries, no workarounds.
- Examine at most 5 projects. Depth on 5 beats breadth on 20, and 20 is what killed the last run.

The question: how do existing browser extensions and userscripts detect Jira issue references in
the Jira Cloud DOM, given that references appear not only as <a href> links but also as buttons
and plain clickable elements?

For each project you examine, from its actual source rather than its README:
- what it selects on: data-testid, href pattern, aria-label, or a text regex
- the exact issue-key regex, if it uses one
- how it avoids false positives
- how it copes with React remounting and with virtualised lists
- whether it reads the Jira REST API to fill in summaries, and how it authenticates

Then two sections:
- "What this means for the Cart" — a recommended detection strategy, naming the trade-off you are
  recommending against.
- "What the live-DOM survey must still answer" — a devtools checklist the user can run in under
  15 minutes, one concrete instruction per Jira view, phrased as "open X, inspect Y, record Z".

Never invent a data-testid value. If you have no evidence for a view, write "no evidence".
A fabricated selector would poison the build session, which is a worse outcome than a gap.

Write to /home/ghis/othercode/userscripts/.scratch/jira-cart/research/02b-prior-art.md, citing
repo and file path for each claim. Do not commit. Do not modify anything outside that research
directory.
```

---

## Prompt D — Live-DOM survey (ticket 02, part 3 — you, not an agent)

No agent can open your Jira, so this part is yours. Run it after prompt C has
produced its checklist, so you are answering its specific gaps rather than
guessing at what matters.

Rough shape, in case C never runs: open each of the seven views — issue view,
backlog, board, search results, an epic's children plus an issue's links panel,
timeline, a dashboard gadget. In each, right-click an issue reference, Inspect,
and record the element's tag, its `data-testid`, its `aria-label`, its `href` if
it has one, and whether the summary text sits nearby in the DOM. Paste the
outerHTML of one example per view.

Save it to `.scratch/jira-cart/research/02c-live-dom-survey.md`. Pasted raw HTML
is more useful here than your description of it.

---

## After the research lands

Tickets 01 and 02 get their `## Answer` sections, `Status: resolved`, and a
one-line gist appended to the map's Decisions-so-far. That unblocks 04
(platform verdict), 05 (data model) and 07 (the add-gesture prototype).

Ticket 03 — shared helpers — needs none of this and is takeable right now. It is
a conversation, not research, so it is cheap; prompt B's drift findings would
sharpen it but are not required.

---

# Prompt E — what "scan this page" promises (ticket 09)

Written 2026-08-10, after `04` closed. `09` and `05` are the only takeable
tickets; `09` goes first because it sits on the longest chain (`09` → `07` →
`08`), because it is the one ticket that may **reverse a standing constraint**,
and because its outcome may change what `05` stores.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| E — scan's promise | 09 | small-to-medium; one capped lookup, then a conversation | Opus |

**Shape of the session, and it is unusual:** `09` is a *grilling* ticket with one
*factual* sub-question buried in it (Q2 — can the API answer backlog and board
exactly, the way JQL-in-the-URL answers search results?). The fact has to land
first, because it decides which promises are even available per view. So: a small
capped lookup, then the grilling. Not the other way round.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
  .scratch/jira-cart/issues/09-what-scan-this-page-promises.md
  .scratch/jira-cart/issues/02-finding-issue-references-in-jira-dom.md  (the Answer, esp. §6)
  .scratch/jira-cart/issues/01-jira-rest-api-from-a-userscript.md       (the Answer, esp. §3 and §5)
  .scratch/jira-cart/research/02c-live-dom-survey.md                    (§§3-7, the scroll counts)
Skim `04`'s Answer only for the two rules it hands on. Do not reopen 01-04.

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 8 web page fetches in total. Count them. At 8, stop fetching and work with what you have.
- A blocked, rate-limited or 404 source is recorded as unavailable in one line and abandoned.
  No retries, no mirrors, no cloning, no tarballs.
- Do NOT design ticket 07 (the direct add gesture) or 08 (the drawer). 09 decides what scanning
  promises; those two are separate tickets and separate sessions.

PHASE 1 — the one fact, capped at 8 fetches.

09's Q2 asks whether backlog, board and timeline have a clean "what is really in this list"
query, the way search results have their JQL sitting in the URL. Establish it against
Atlassian's own developer documentation:
  - The Jira Software (Agile) REST API surface: what endpoint returns a board's backlog, a
    board's issues, and a sprint's issues, given a board id from the URL. Exact paths, exact
    parameters, pagination shape and ceiling.
  - Whether it is the same `/rest/api/3/` base or a different one, since that decides whether
    01's verified same-origin cookie call carries over unchanged or is a fresh unknown.
  - Whether Plans/timeline has any documented API at all, or is internal-only. A clear
    "no public API" is a good answer here and closes option (c) for that view.
Do NOT verify these live yourself — you cannot open the user's Jira. Instead, end phase 1 by
writing a devtools snippet the USER runs, in the style that worked for 02c: one paste-able
block, printing a small table, answering only what the docs could not settle. 01 proved the
desk research can be wrong about exactly this kind of detail (`issueErrors` came back empty
when the docs implied otherwise), so treat every unverified doc claim as provisional and
label it so.

While the user is in devtools anyway, include 01's one leftover probe in the same snippet:
a `bulkfetch` of `RDC-9999999` (real project, absent issue) and of a key in a project they
cannot see, to separate "no such issue" from "no permission". 01 flagged this as wanted
before 05 draws the failed-summary states. Two extra lines in a snippet they are already
running.

PHASE 2 — the grilling.

Then work 09's seven numbered questions with the /grilling skill: one question at a time,
your recommended answer stated with each, waiting for the user's decision before moving on.
Facts get looked up; decisions are the user's.

Carry these into the grilling — they are settled, not open:
- Every issue reference is an `<a href="/browse/KEY">` (02). The button-not-link warning in
  the original charting note was about fixVersion/sprint, not work items.
- The DOM holds the summary beside the key on every view, so a scan can populate a
  collection with no network call at all (02 §5).
- One `bulkfetch` covers <=100 keys, and a response is data only when ok + JSON content-type
  + expected shape; absence from `issues` is the signal for "could not read this one" (01).
- Copy-out is synchronous and never awaits the network (04).
- The design principles in map.md, especially #4: if a subsystem breaks, the safe default
  must be what remains. 09's Q7 is that principle applied.

Two of the questions have consequences beyond this ticket. Handle them explicitly rather
than letting them pass:
- **Q6 may reverse a standing constraint.** The map fixes "scan the page, pick from a list"
  as the PRIMARY add gesture. If the honest answer is that scanning is inherently partial and
  07's direct gesture deserves primacy, that must be ARGUED and the map's constraints table
  edited to match. The map's own rule: a ticket may report evidence against a constraint but
  may not quietly overturn it. Put the reversal to the user as its own decision.
- **Q5 constrains the badge, which is also a standing constraint.** "An always-present count
  badge" is fixed. What it counts when a scan is partial is 09's to decide, and 08 inherits it.

DELIVERABLES, in this order:
1. An `## Answer` section appended to
   .scratch/jira-cart/issues/09-what-scan-this-page-promises.md, in the style of 01-04:
   the verdict first and in bold, evidence cited with file references, what was NOT settled
   said plainly, and a closing "what this hands on" naming 05, 07 and 08 by number.
2. `Status:` updated on that ticket.
3. A one-line-plus gist appended to map.md's "Decisions so far", matching the existing
   entries' density.
4. If Q6 reversed the primary gesture, or Q5 changed the badge, edit the standing-constraints
   table in map.md and say in the Answer that you did.
5. Note for 03: `watchRoute` was copied into the Cart ON THE EXPECTATION that 09 makes scan
   results per-page. If 09 concludes there is nothing to forget on navigation, say so in the
   Answer — it is 38 lines that 03 pre-authorised dropping.

Do not commit. Do not touch src/. The destination is still the spec, not the script.
```

---

# Prompt F — the collection data model (ticket 05)

Written 2026-08-13, after `09` closed. `05` and `07` are both takeable; `05` goes
first because it is the effort's **ubiquitous language** — its own text says *"every
other ticket names these things"* — and because `07` and `08` will both write about
items, collections and the active collection. Settle the words once.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| F — the data model | 05 | small; a conversation, plus one snippet you run | Opus |

**The probe has been run — 2026-08-13.** Output and conclusions are in
**`research/05a-storage-probe.md`**; its **Part 3** holds the findings and corrects two
claims made earlier in that same file, so Part 3 is what the session should trust.
Nothing further needs running.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
  .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md
  .scratch/jira-cart/issues/01-jira-rest-api-from-a-userscript.md   (the Answer — all six)
  .scratch/jira-cart/issues/09-what-scan-this-page-promises.md      (the Answer, esp. §2, §3, §7)
  .scratch/jira-cart/research/05a-storage-probe.md                  (the probe, and its output if run)
Skim `02`'s Answer §5 and `04`'s Answer only for the rules they hand on.
Do not reopen 01, 02, 04 or 09.

Also read, for the storage conventions this repo already has:
  src/jira-ux-improvements.user.js       (PREFS_KEY, loadPrefs/savePrefs)
  src/jira-ux-improvements.user.md       §2.8 — "the lock and the collapse are different types of state"
  src/jira-backlog-sprints.user.md       §2.7 — "the preferences are per board, and they are permanent"

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 4 web page fetches in total, and only for a `localStorage` quota fact you cannot
  settle from the probe output. A blocked or 404 source is recorded as unavailable in one
  line and abandoned. No retries, no mirrors, no cloning.
- Do NOT design ticket 06 (copy formats), 07 (the direct gesture) or 08 (the drawer).
  05 decides the stored shape and the vocabulary; those are separate tickets.
- Do not commit. Do not touch src/. The destination is still the spec, not the script.

SHAPE OF THE SESSION: this is a grilling ticket, so use /grilling and /domain-modeling —
one question at a time, your recommended answer stated with each, waiting for the user's
decision before moving on. Facts get looked up; decisions are the user's. Work 05's eight
numbered questions in order. The user will have run the snippet above; ask for its output
when you reach Q8 (ceilings) and Q3/Q6 (failed summaries), and if it is not available,
state the assumption you are proceeding under rather than blocking.

CARRY THESE IN — they are settled, not open. Several REVERSE what 05's own text assumes,
because 05 was written before 02 and 09:

- **The summary comes from the DOM, not the API.** 05 Q6 says "given what 01 says the API
  returns for free"; `02` §5 found the summary sits beside the key on every view, and `09`
  made it load-bearing — scan makes NO network call, so an add never waits on one.
  `bulkfetch` is the fallback and the refresh path. The map's *Item data* constraint has
  already been amended to say so; do not re-litigate it.
- **An item is valid with a key alone** (`01` rule 1). The summary is an enrichment layer
  with three states: never-fetched, fetched, failed. Never block an add on a fetch.
- **Validate `ok` + JSON content-type + body shape** before storing anything — a logged-out
  GET returns 200 with login-page HTML (`01` §2, verified).
- **Diff requested keys against returned keys.** Absence is the signal for "could not read
  this one"; `issueErrors` came back EMPTY for a missing key, twice over (`01` §5, `09a`).
- **One `bulkfetch` per ≤100 keys, never per key.** A whole collection refreshes in one
  request — which is why `01` said staleness is a UX question, not a cost question.
- **Copy-out is synchronous and never awaits the network** (`04`). It writes what is in
  `localStorage`. This constrains Q6: a stored summary must be sufficient for copy on its own.
- **The live list's per-row origin is NOT stored** (`09` §7). It is scan-time annotation on
  a transient view, not item data.
- **`@grant none`, so `localStorage` and the `storage` event are the only mechanisms.**
  No `GM_setValue`. Q5's cross-tab question has no escape hatch.

FIVE THINGS THE PROBE SETTLED THAT 05'S TEXT DOES NOT KNOW — `05a` Part 3 has the raw
evidence for each. These are findings, not open questions; do not re-derive them:

- **Atlassian replaces `window.localStorage` with a plain object, platform-wide** (Jira
  AND Bitbucket; `google.com` is normal). `instanceof Storage` is FALSE, the prototype is
  `Object.prototype`, and **`length` is a METHOD, not a property**. It carries
  `clear key length removeItem getItem setItem` as own functions.
  **But it is a faithful passthrough** — a wrapper write in one tab produced a real
  cross-tab `storage` event whose `storageArea` IS a native `Storage` (`05a` §3.1). So the
  Cart uses `window.localStorage` directly and simply never relies on `.length`.
  The native object is NOT recoverable via `Window.prototype` — Atlassian overwrote the
  accessor with a data property rather than shadowing it (`05a` §3.2). A same-origin
  iframe's `contentWindow.localStorage` would work and is untested; it is also unnecessary.
- **Q5's mechanism exists and is extremely noisy.** Tab 1 caught ~100 `storage` events in
  a couple of seconds, essentially none of them the probe's — Jira constantly writes and
  deletes `__storage_test__`, `awc.storage.support`, `__storejs__test__`,
  `__test_<ts>__`, and rewrites `statsig.session_id.*` on a timer. **A listener MUST
  filter by key before doing anything** or it re-renders dozens of times a second on an
  idle tab (`05a` §3.4).
- **Q8 — the Cart is cheap; the hazard is Jira's growth.** Jira already holds 629 keys /
  1,347 K chars ≈ **2.63 MB as UTF-16, roughly half the origin's ~5 MB quota** — and one
  key, `quick-find-recent-activities`, is 72% of that and grows with use. The Cart at
  1,000 items is ~117 K chars (~0.23 MB). So no realistic collection threatens the quota,
  **but `setItem` can throw `QuotaExceededError` because of Jira rather than the Cart**.
  That is a write path failing mid-add, so Q8 must say what happens then — principle 4:
  the previous collection survives intact (`05a` §3.3).
- **Q3/Q6 — ONE failed-summary state, not two. Settled, not assumed.** `GET
  /rest/api/3/issue/RDC-9999999` returns **404** with
  `"Issue does not exist or you do not have permission to see it."` — Atlassian conflates
  absent and forbidden in the message itself, deliberately. `bulkfetch` is quieter still:
  `200`, `issues: []`, `issueErrors: []`. So the UI cannot claim an item was deleted;
  the wording is "cannot read this item". `01`'s leftover probe is CLOSED (`05a` §3.5).
- **All of the above carries to Bitbucket**, since the wrapper is the same there. Relevant
  only to the map's out-of-scope note; do not design for it.

If any of this constrains the design against the map's *Storage* constraint, report it and
put the decision to the user; do not quietly overturn it. Do NOT re-run or extend the
probe — `05a` is the evidence, and 4 fetches is the cap.
- **The key namespace is `gt-jira-*.prefs`-shaped**: this repo already uses
  `gt-jira-ux.prefs` and `gt-jira-backlog.prefs`. Follow the convention.
- **Design principle 1 is Q4's whole point** — "derive state from the page; do not keep
  flags that must agree with each other". An active-collection id pointing at a deleted
  collection is exactly the bug the two existing ADRs are written against. Either make it
  unrepresentable or name the single place that repairs it.

TWO THINGS WITH CONSEQUENCES BEYOND THIS TICKET — handle them explicitly:
- **Q1 may rename things the map and four resolved tickets already use.** If "cart" turns
  out not to exist once collections do, say so and fix the vocabulary in map.md — but only
  in the map's own prose and constraints table. Do NOT rewrite the Answers of 01-04 or 09;
  note the rename in 05's Answer and let the ADR carry the settled words.
- **Q2 and Q8 may amend the map's *Storage* or *Collection shape* constraints.** The map's
  rule: a ticket may report evidence against a constraint but may not quietly overturn one.
  Put any reversal to the user as its own decision, then edit the table and say in the
  Answer that you did.

DELIVERABLES, in this order:
1. An `## Answer` section appended to
   .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md, in the style of
   01-04 and 09: the verdict first and in bold, the concrete JSON blob shown in full,
   evidence cited with file references, what was NOT settled said plainly, and a closing
   "what this hands on" naming 06, 07 and 08 by number.
2. `Status:` updated on that ticket.
3. A one-line-plus gist appended to map.md's "Decisions so far", matching the existing
   entries' density.
4. Any constraint-table edits the grilling produced, named in the Answer.
5. If the snippet was run, save its output to research/05a-storage-probe.md with one
   paragraph on what it settled — including, if `HIDDEN_KEY` was filled, whether
   permission-denied is distinguishable from no-such-issue. If it was not filled, say
   the probe remains half-open and name who still wants it.
6. Update this file's banner: mark F as run, and name the next live prompt.
```

---

# Prompt G — the direct add gesture (ticket 07)

Written 2026-08-14, after `05` closed. `06`, `07` and `08` are all takeable; `07`
goes first because `08` is the largest and inherits from `05`, `07` and `09`
together, and because `07` is the only one that can be got wrong in a way no
amount of arguing would catch.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| G — the add gesture | 07 | small-to-medium; one script you install, then a conversation | Opus |

**Shape of the session, and it differs from E and F.** `07` is a **prototype**
ticket, not a grilling. The agent cannot open your Jira and cannot feel a gesture,
so the deliverable of its first half is *a script you install*, and the deliverable
of its second half is *what you say after using it*. Build first, argue second —
the ticket's own words: *"build the rough thing and react to it rather than arguing
from descriptions."*

**One fact the session should establish before designing anything**, because it may
remove a candidate outright: a userscript under `@grant none` **cannot add an entry
to the browser's native right-click menu**. `GM_registerMenuCommand` populates
Tampermonkey's own toolbar menu and needs a grant besides. So "context menu entry"
in practice means *intercepting `contextmenu`, suppressing Jira's and the browser's
menu on that element, and drawing your own* — which costs the user "Open link in
new tab" on exactly the elements they most often open in a new tab. Confirm it,
then let the prototype answer whether that trade is bearable.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
  .scratch/jira-cart/issues/07-the-direct-add-gesture.md
  .scratch/jira-cart/issues/02-finding-issue-references-in-jira-dom.md  (the Answer, esp. §1-2 and §5)
  .scratch/jira-cart/issues/09-what-scan-this-page-promises.md          (the Answer, esp. §6, §7, and what it hands on)
  .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md (the Answer, esp. §3, and what it hands on)
  .scratch/jira-cart/research/09a-list-scope-api.md                     (§4.1 only — the backlog row's real container)
Skim `03`'s Answer for which helpers to copy. Do not reopen 01-05 or 09.
Also read src/jira-ux-improvements.user.js for `logger`, `guard`, `injectStyle`,
`watchMounts`, and for the Alt+Shift bindings it already owns.

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 4 web page fetches, and only for a browser-behaviour fact you cannot settle locally
  (`contextmenu` and `preventDefault`, pointer events, the `beforeunload`-style gotchas). MDN
  first. A blocked or 404 source is recorded as unavailable in one line and abandoned.
- Do NOT design 06 (copy formats) or 08 (the drawer). 07 decides one gesture and nothing else.
- Do NOT write src/jira-cart.user.js. The destination is still the spec. The prototype is
  throwaway and lives in .scratch/.
- The prototype MUST NOT write `gt-jira-cart.collections` — that key is the real model now.
  Use `gt-jira-cart.proto`, and say in a comment that it is safe to delete.
- Do not commit.

CARRY THESE IN — they are settled, not open:
- **Every issue reference is an `<a href="/browse/KEY">`** (`02`, all seven views). The detector
  is that one selector; walk **up** with `closest()`, because the key's testid element is
  sometimes the anchor and sometimes its parent. `09a` §4.1 moved a backlog row's best anchor
  two wrappers outward from what `02` nominated — use it.
- **Modifier+click is dead** (`09`, by the user's own observation: every modifier+click already
  opens the link). Option 1 in the ticket is a record of why, not a candidate.
- **The brief is ergonomics, not coverage.** After `02` the live list reaches everything, so
  this gesture exists only to skip "open the panel, find the row, click it".
- **An add is synchronous**: read-modify-write against `localStorage`, append to
  `collections[0].items`, render. The summary comes from the DOM beside the link (`02` §5), so
  an add NEVER awaits the network (`05`, `09`).
- **Adding an already-present key is an idempotent no-op that the UI SHOWS rather than
  announces** (`05` §3). So the affordance needs an already-collected state, and the prototype
  must have one — it is half of what "does the last add visibly land" means.
- **Do not store the row's origin** (`09` §7). Not item data.
- `watchMounts` and the async-aware `guard` are copied; `watchRoute` is dropped (`03`, `09`).
- Design principles 2 and 3 from map.md: one idempotent render, and prefer a CSS rule to
  JavaScript when the answer is knowable at document-start.

PHASE 1 — the prototype, and it is ONE file.

Write .scratch/jira-cart/prototypes/07-add-gesture.user.js: a Tampermonkey userscript,
`@grant none`, `@match https://*.atlassian.net/*`, that the user installs and then uses for a
day. It carries BOTH surviving candidates behind a visible mode switch — a small fixed chip
in a corner, NOT a keyboard shortcut, because `jira-ux-improvements` already owns
Alt+Shift + L/E/N/U/M/I/D/T and a clash would be diagnosed as a prototype bug:

  (a) **Hover `+`** — an affordance that appears on the hovered issue link.
  (b) **Custom context menu** — `contextmenu` intercepted on issue links only, native menu
      suppressed there, a small menu drawn with "Add to collection" and "Open in new tab" so
      the trade is honest rather than merely felt as a loss.

Offer a third, and make it the default if the reasoning holds: **(a2) one shared floating
affordance** that follows the hovered anchor, rather than one `+` injected per row. The ticket
worries that "every row sprouts one" on a dense backlog; a single moved element answers that,
survives virtualisation for free, and needs no per-row cleanup. Argue it in a comment.

Keep a visible count of what has been added, and make an already-collected link look different
from an uncollected one. Log with a distinct prefix. No network calls at all.

Then STOP and hand it over. Do not speculate about which will win.

PHASE 2 — the verdict, after the user has used it.

Work the ticket's three judging criteria with /prototype and /grilling, one at a time, your
reading stated with each, waiting for the user:
  - Does the last add visibly land?
  - Twenty in a row without irritation?
  - Does it ever fire when the user meant to navigate, and how bad is it when it does?
Then the losing option's cause of death, in one sentence, because the ADR has to say why.

Watch for one thing the user may not volunteer: whether suppressing the native context menu on
issue links is felt as a loss a week later. If it is, that is a THIRD observation for the
platform review `05` opened — native context-menu entries are a thing extensions have and
userscripts do not — and it belongs in the map's *Platform* row beside the other two, not in a
fresh argument about extensions.

DELIVERABLES, in this order:
1. An `## Answer` appended to .scratch/jira-cart/issues/07-the-direct-add-gesture.md, in the
   style of 01-05 and 09: the verdict first and in bold, what made the loser lose, evidence
   cited, what was NOT settled said plainly, and a closing "what this hands on" naming 06 and
   08 by number.
2. `Status:` updated on that ticket, and the prototype LINKED from it rather than pasted in.
3. A one-line-plus gist appended to map.md's "Decisions so far", matching the existing density.
4. Any constraint-table edit the verdict produced — the *Add gesture* row names two gestures
   and this one is now decided, so it almost certainly needs the form written into it. Put any
   reversal to the user as its own decision first.
5. Update this file's banner: mark G as run, and name the next live prompt (`08` is the
   natural one — it inherits from `05`, `07` and `09` — with `06` also open and smaller).
```

---

# Prompt H — the copy formats (ticket 06) — RUN, `06` resolved

Written 2026-08-14, after `07` closed. Run the same day. `06` and `08` are the last two tickets,
and **`06` goes first even though `08` is the more interesting one.** The reason
is the same one that put **B before C**: `06` is nearly free, and `08` §2 names
*"the copy menu from `06`"* as drawer contents. A drawer laid out around a menu
of unknown size is a drawer designed around a hole. `08` is also the second
*prototype* ticket, so it wants another install-and-use cycle — better entered
with everything settled.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| H — copy formats | 06 | small; a conversation, almost no web | Opus |

**Shape of the session:** a grilling, like `E` and `F`. No prototype, no probe,
nothing for you to run. `06` has five numbered questions and the fifth is the
one with teeth — it asks the session to either evidence a claim or delete it.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
  .scratch/jira-cart/issues/06-copy-formats-and-the-template-seam.md
  .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md (the Answer — §6, §8, and what it hands on)
  .scratch/jira-cart/issues/04-userscript-or-chrome-extension.md        (the Answer — only the copy-out rule it hands on)
  .scratch/jira-cart/issues/07-the-direct-add-gesture.md                (the Answer — only "what this hands on")
Also read, because the clipboard machinery already exists and is proven:
  src/jira-ux-improvements.user.js  — `buildClipboard`, `writeClipboard`, `escapeHtml`,
                                      `copyIssue`, `flash`, and COPY_FEEDBACK_MS
  src/jira-ux-improvements.user.md  — whatever it says about the dual text+HTML write
Do not reopen 01, 02, 03, 08 or 09.

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 3 web page fetches, and only for a clipboard fact you cannot settle from the existing
  script — in practice one question: which MIME types a `ClipboardItem` may carry in Chromium,
  since that decides whether anything beyond `text/plain` + `text/html` is even available. MDN
  first. A blocked or 404 source is recorded as unavailable in one line and abandoned. No
  retries, no mirrors, no cloning.
- Do NOT design 08 (the drawer). `06` decides WHICH formats exist and WHAT each produces.
  Where the copy control lives, and whether the drawer offers multi-select at all, is `08`'s.
- Do not commit. Do not touch src/. The destination is still the spec, not the script.

SHAPE OF THE SESSION: use /grilling — one question at a time, your recommended answer stated
with each, waiting for the user's decision before moving on. Facts get looked up; decisions
are the user's. Work `06`'s five numbered questions in order.

CARRY THESE IN — they are settled, not open:

- **There are exactly three fields, and one of them is optional.** An item is `key` +
  optional `summary` + optional `issueId` (`05` §6). `06` may format `key`, `summary`, and
  a URL derived from the key. **`issueId` is not for display** — it exists to repair a key
  after a project move. Nothing else exists to format.
- **A summary-less item is the COMMON case, not the edge case.** `07` established that the
  direct gesture fires wherever a link happens to be, including prose, where no summary sits
  beside it. So every format must have a defined answer for "key, no summary", and
  "copies as a bare key" (`04`) is the inherited one. Decide whether that is right for each
  format or whether some formats should skip such an item entirely.
- **Copy-out is synchronous and never awaits the network** (`04`). It writes what is in
  `localStorage`. No `bulkfetch` in the copy path, ever — not even to fill a missing summary.
  This is load-bearing: it is one of the two things that kept the platform verdict at
  `@grant none`.
- **Copy-out is where the data becomes durable**, and `05` said explicitly that this framing
  should LEAD `06`: `localStorage` dies on a logout or a history cleanup, so a collection is
  a staging area and the paste is the artifact that survives. A format that loses information
  the user will want later is worse here than in a scratch tool.
- **The URL is `location.origin + "/browse/" + KEY`.** Derived, never stored.
- **`issuetype` is available and was deliberately not stored** (`05` §6). If `06` wants it,
  it is an additive optional field costing no migration (`05` §7) — but `05`'s REASON for
  refusing it bites `06` directly: it is not uniformly free from the DOM, so items added by
  the direct gesture would lack what refreshed ones carried, and the output would be
  inconsistent item to item. Any request for it must answer that.
- **The clipboard mechanism is proven and should be copied, not redesigned.**
  `jira-ux-improvements` writes `text/plain` + `text/html` in one `ClipboardItem`, falls back
  to `writeText`, and deliberately does NOT gate on `navigator.permissions.query` — Firefox
  and Safari reject that permission name, and the copy then silently never happened. That
  comment is a scar; do not remove the reasoning from the ADR.
- **Feedback is ✅ / ⚠️ on the button for 900 ms** (`COPY_FEEDBACK_MS`), restored by the next
  `render`. `06` Q4 says "match it", so the only open part is what a PARTIAL success looks
  like, if partial success is even representable.

ONE CORRECTION TO THE TICKET'S OWN TEXT, established before this prompt was written:

- **Q5's premise is not evidenced.** The ticket says *"the charting session promised a seam
  for later templates"*. A grep of `map.md` finds no such promise: the *Export* row says only
  *"A fixed menu of formats in this version. User-editable templates are a later effort."*,
  and the *Out of scope* entry says only *"deliberately deferred"*. So there is no unevidenced
  claim sitting in the map waiting to be deleted — the claim lives only in `06`'s own question.
  **That makes Q5 cheaper, not moot.** The real question survives: are the fixed formats
  expressible as instances of one template model, or are they five hand-written functions? One
  honest paragraph either way, and if the answer is "hand-written functions", the ADR must say
  that templates will be a rewrite of this layer rather than a configuration of it.

TWO THINGS WITH CONSEQUENCES BEYOND THIS TICKET — handle them explicitly:

- **Q2 (scope of a copy) brushes against `08`.** Deciding that a format only makes sense for
  the whole collection is `06`'s. Deciding whether the drawer offers a multi-select at all is
  `08`'s. State which formats work at which scope and stop there; do not specify the control.
- **A request for a fourth field amends `05`.** `05`'s *Item data* row is a standing map
  constraint. The map's rule: a ticket may report evidence against a constraint but may not
  quietly overturn it. If `06` needs `issuetype` or anything else stored, put it to the user
  as its own decision, then edit the constraint table and say in the Answer that you did.

DELIVERABLES, in this order:
1. An `## Answer` appended to
   .scratch/jira-cart/issues/06-copy-formats-and-the-template-seam.md, in the style of
   01-05, 07 and 09: the verdict first and in bold, **every shipping format shown as a
   worked example against the same three-item collection** (one of which has no summary),
   the format that was rejected and why, evidence cited with file references, what was NOT
   settled said plainly, and a closing "what this hands on" naming `08` by number.
2. `Status:` updated on that ticket.
3. A one-line-plus gist appended to map.md's "Decisions so far", matching the existing density.
4. Any constraint-table edit the grilling produced — the *Export* row almost certainly needs
   the menu written into it, the way `07` wrote the gesture's form into *Add gesture*.
5. Update this file's banner: mark H as run, and name `08` as the live prompt.
```

---

# Prompt I — the drawer (ticket 08) — RUN, `08` resolved

Written 2026-08-14, after `06` closed. **`08` is the last ticket and the largest**,
and it is the only one that inherits from four closed tickets at once — `05` gave it
the data model, `09` gave it the two-section drawer, `07` gave it a gesture to agree
with, and `06` gave it a copy menu of known size. Everything it needs is settled.
When it lands, the map is done.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| I — the drawer | 08 | large; a script you install and use, then a long conversation | Opus |

**Shape of the session: a prototype, like `G`.** Build first, argue second. The
agent cannot open your Jira, cannot see where Jira's own controls sit on your
screen, and cannot feel whether a drawer is in the way — so phase 1's deliverable is
*a script you install*, and phase 2's is *what you say after using it*.

**The one structural idea that keeps this session from sprawling: `08` has two kinds
of question, and only one of them needs the prototype.**

| Answered by *use* — must be in the shell | Answered by *argument* — phase 2 only |
| --- | --- |
| Where the badge sits on an issue page, a full-width board, the timeline | The default collection's name |
| Whether it collides with `jira-ux`'s toolbar, **including the fallback corner** | Whether duplicate collection names are prevented |
| Whether badge and drawer survive a route change, a tab switch, a saved edit | The wording of "cannot read this item" |
| Whether the drawer still reads at 30 items | The wording of a full-storage failure |
| Whether two sections side by side confuse or help | Whether a live-list row is a toggle |
| Whether the drawer can stay open while you add links behind it | Where the copy menu sits, and whether multi-select exists |

Build only the left column. Do not let the shell try to settle the right one — a
half-worded error message in a prototype gets argued about as though it were a
proposal.

**One thing worth establishing before designing the drawer**, because it removes a
candidate: **the drawer must not be modal.** The whole workflow is *look at the page,
click `+` on links, watch them land*. `09` made the live list a mirror of the page and
`07` put the gesture on the page itself, so the drawer coexists with page interaction
rather than blocking it. That rules out `<dialog>`'s modal mode, `popover=auto` (it
light-dismisses the moment you click the page), and any focus trap. Whether the top
layer is still worth reaching via `popover=manual` — to escape Jira's z-index stack
without competing with it — is a real question for the prototype to answer.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
  .scratch/jira-cart/issues/08-the-drawer-and-toolbar-coexistence.md
      — READ ITS "What `09`, `05` and `07` changed about this ticket" SECTION FIRST.
        Its §3 is DEAD. See the hard constraints.
  .scratch/jira-cart/issues/09-what-scan-this-page-promises.md          (the Answer — §6, §7, and what it hands on)
  .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md (the Answer — §2, §3, §4, §5, §7, and what it hands on)
  .scratch/jira-cart/issues/07-the-direct-add-gesture.md                (the Answer — §2, §5, §6, and what it hands on)
  .scratch/jira-cart/issues/06-copy-formats-and-the-template-seam.md    (the Answer — §4, §6, and what it hands on)
  .scratch/jira-cart/prototypes/07-add-gesture.user.js                  (all of it — you are extending this file)
Also read, because you are matching and coexisting with them:
  src/jira-ux-improvements.user.js  — `logger`, `guard`, `injectStyle`, `watchMounts`,
                                      the `--ds-*` token block, the Alt+Shift bindings,
                                      and the `@supports (anchor-name: ...)` block near L697
  src/jira-ux-improvements.user.md  — §2.11 Position, and §3's button table
  src/jira-backlog-sprints.user.js  — the label-is-the-state control, CSS-first at document-start
Do not reopen 01-07 or 09.

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 3 web page fetches, and only for a browser-behaviour fact you cannot settle from the
  two existing scripts — in practice: CSS anchor positioning support, the `popover` attribute
  and the top layer, and `inert`. MDN first. A blocked or 404 source is recorded as unavailable
  in one line and abandoned. No retries, no mirrors.
- **`08` §3 IS OBSOLETE. There is no scan-results picker and no "after a scan".** `09` settled
  that the drawer holds two STANDING sections: a live list mirroring the `/browse/` anchors in
  the DOM right now, labelled `On this page (n)`, and the collections. Scanning is not an
  action. If you find yourself designing a third mode, you have made the exact mistake `09`
  records nearly making to itself.
- Do NOT reopen `06`'s formats, `07`'s gesture, `05`'s storage shape or `09`'s mirror rule.
  You may report evidence against one; you may not quietly overturn one. Put any reversal to
  the user as its own decision first.
- Do NOT write src/jira-cart.user.js. The destination is still the spec. The prototype is
  throwaway and lives in .scratch/.
- The prototype MUST NOT write `gt-jira-cart.collections` — that key is the real model.
  Use `gt-jira-cart.proto*`, and say in a comment that it is safe to delete.
- Do not commit. Do not touch src/.

PHASE 1 — the prototype, and it EXTENDS 07's rather than starting over.

Copy .scratch/jira-cart/prototypes/07-add-gesture.user.js to
.scratch/jira-cart/prototypes/08-drawer.user.js and grow it. This is not a
preference, it is the difference between a testable session and a wasted one:

  - A drawer with nothing in it cannot be judged. You need a working add gesture to
    put things in it, and 07's is built, used and corrected across four rounds.
  - It already carries what you would otherwise re-derive: the five-tier summary
    cascade, already-collected as a CSS rule generated from the `href` (so remounts
    and virtualisation cost nothing), grouping anchors by (row, key) taking the
    widest, `watchMounts`, and the logger/guard/injectStyle helpers.
  - Keep the floating toggle EXACTLY as `07` left it — left of the link, loud, a
    toggle. It is settled. Any change to it will be read as a new proposal.

Two things do change in the copied file:

  1. **Move the store to `05`'s real shape** — `{v, collections[]}`, items of
     `key` + optional `summary`, the active collection is `collections[0]`, and
     `collections` is never empty. 07's flat store cannot express a switcher, and the
     switcher is half of what §2 asks. Still under a proto key.
  2. **Every write is a read-modify-write against storage** (`05` §5). The prototype
     should honour it, because the drawer is the first thing with more than one
     writing control.

Then build the left column of the table above, and only that:

  - **The badge.** Label carries the state — the active collection's name and its
    item count, the `N sprints hidden ▾` convention. Fixed position. It must be
    movable at runtime between at least the plausible corners, so placement is
    answered by looking rather than by arguing.
  - **The drawer, two standing sections.** `On this page (n)` — the live mirror, flat,
    each row with a coarse origin where one can be identified, unlabelled where it
    cannot. And the active collection, in full, with the means to see the others,
    create one, and make one active. Non-modal. It stays open while you click links
    on the page behind it, and that is a thing to verify, not to assume.
  - **The coexistence test, and make it FORCEABLE.** `jira-ux` anchors its toolbar to
    the breadcrumbs with `@supports (anchor-name: --gt-breadcrumbs)` and falls back to
    **the top-right corner** when that is unsupported — and `08` §4 calls that same
    corner the natural home for a fixed badge. So the collision is in the fallback
    path, which is the one nobody sees on Chromium. Put a switch in the prototype that
    forces the fallback layout on demand. Do not ask the user to install Firefox to
    find out.
  - **Theming** with the `--ds-*` tokens and standard-colour fallbacks, as both existing
    scripts do. `07` already learned one thing here: the token palette's outlined chip
    could not be picked out, so loud beats subtle.
  - **Remount survival**: route change, tab switch, saved edit. One idempotent render.

No network calls in the prototype. Gap-fill is real in the spec but it is not what
this ticket is testing, and a fetch in a shell will be diagnosed as a prototype bug.
Log with a distinct prefix.

Then STOP and hand it over. Do not speculate about layout in prose the user has to
read before they have touched it.

PHASE 2 — the verdict, after the user has used it.

Use /prototype and /grilling. One question at a time, your recommended answer stated
with each, waiting for the user. Take the *use* questions first, while the session is
fresh, then the *argument* ones. This half is long; it is fine to say so and to let it
run over into a second sitting rather than compressing it.

The argument questions, and they are all inherited rather than invented:
  from `05` — the default collection's name; whether duplicate collection names are
              prevented; how already-collected renders; the wording of "cannot read
              this item"; the wording of a full-storage failure
  from `07` — where the right-click preference switch lives (in `gt-jira-cart.prefs`,
              off by default, labelled by what it TAKES AWAY rather than what it adds);
              whether a live-list row is a toggle too, and note `07`'s constraint: the
              same item must not be removable in one section and inert in the other
  from `06` — where the four formats are offered and at which scope; whether a
              multi-select exists at all; the disabled rendering when the collection is
              empty, since a copy of zero items must not write; and the one that will
              be silently broken if nobody says it — **the copy control's label must be
              derived inside `render`**, or the ✅ never goes away
  from `09` — nothing open; the mirror rule is settled and is not `08`'s to revisit

Three behaviours are FIXED and are not `08`'s to reopen: gap-fill runs while the
drawer is open (`05` §6 as amended by `06` §8 — a state, not an event), the drawer
re-reads on open and on tab-visible, and the badge counts `collections[0]`.

Two fog items touch this ticket and BOTH stay deferred — say so rather than drifting
into them:
  - **Grouping the live list by the page's own sections.** Blocked on one devtools
    probe, written at `09a` §4.4. Purely additive; the flat list is the safe default
    that remains.
  - **Container testids for the description and the comment stream.** One devtools
    probe. If the user volunteers to paste it, it closes cheaply and improves the
    origin labels; if not, `09` already ruled that an unidentified region means the
    link appears unlabelled. Do not spend session time arguing for it.

DELIVERABLES, in this order:
1. An `## Answer` appended to .scratch/jira-cart/issues/08-the-drawer-and-toolbar-coexistence.md,
   in the style of 01-07 and 09: the verdict first and in bold, what the shell got WRONG
   (which is what the ADR must warn the build session about), evidence cited with file
   references, what was NOT settled said plainly, and a closing "what this hands on" —
   which for the last ticket means naming what the ADR session inherits, not another number.
2. `Status:` updated on that ticket, and the prototype LINKED from it rather than pasted in.
3. A one-line-plus gist appended to map.md's "Decisions so far", matching the existing density.
4. Any constraint-table edit the verdict produced — *Panel UI* is the row most likely to need
   it, and *Placement* may need the positioning contract written in.
5. Update this file's banner: mark I as run, say the map is COMPLETE, and name the ADR
   session as what comes next.
```

---

## After `08` — the map is done

**It is done.** `08`'s Answer landed 2026-08-18. Every question the destination
depends on has been closed by evidence or by an explicit decision, and the nine
Answers together are the material for the ADR.

**Then, and only then, write `src/jira-cart.user.md`** in the style of the two
existing ADRs in `src/`. It is written *from the Answers*, not from fresh thinking —
the point of nine tickets was that the build session should not have to reopen a
decision. Where an Answer records a scar (`navigator.permissions.query`, the per-row
`+` that reflows Jira's rows, the index that could disagree with its keys), the scar
goes in, because the reasoning is the part that stops it happening again.

**Then delete `.scratch/jira-cart/prototypes/` and any `gt-jira-cart.proto*`
localStorage key.** Both prototypes are throwaway and both say so in their own
comments.

**One thing that will still be open, and it should be written down rather than
carried in someone's head:** the platform pile. `04` recorded one trip-wire, `05`
added two, `07` a third, `06` a fourth — and the fourth is the first that is a
five-minute experiment rather than an opinion. *Does a `ClipboardItem` write still
work under a `@grant`?* `04` gave two reasons to hold `@grant none`; `09` deleted one
of them by removing route detection, so the clipboard is the only one left. If the
write survives Tampermonkey's sandbox, `@grant GM_setValue` becomes nearly free — and
with it storage that survives a logout and a history cleanup, and reaches Bitbucket.
That is a separate effort, not a ticket in this map.

---

# Prompt J — the ADR (the destination)

Written 2026-08-18, after `08` closed and the map went complete. This is not a
ticket: it is **the destination itself**, the thing the nine tickets were for.
Every question the spec depends on has been closed by evidence or by an explicit
decision, so this session writes rather than decides.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| J — the ADR | — (the destination) | large; one long document, no research | Opus |

**Shape of the session, and it is unlike every prompt before it.** No research, no
probe, no prototype, no grilling. The material is nine `## Answer` sections and
two existing ADRs to match. The single largest risk is **re-deciding something
that is already decided** — a session that reasons from first principles will
produce a document that disagrees with its own evidence. The second risk is
**leaving out the scars**, because the reasoning is the part that stops a mistake
happening twice, and a spec that lists only conclusions invites a build session to
rediscover every one of them.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
      — the standing constraints table IS the spec's skeleton. Every row was
        amended by the tickets that closed; read the amendments, not just the row.
  Then all nine Answers, in the order they were decided, because later ones
  correct earlier ones:
    .scratch/jira-cart/issues/01-jira-rest-api-from-a-userscript.md
    .scratch/jira-cart/issues/02-finding-issue-references-in-jira-dom.md
    .scratch/jira-cart/issues/03-shared-helpers-across-three-scripts.md
    .scratch/jira-cart/issues/04-userscript-or-chrome-extension.md
    .scratch/jira-cart/issues/09-what-scan-this-page-promises.md
    .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md
    .scratch/jira-cart/issues/07-the-direct-add-gesture.md
    .scratch/jira-cart/issues/06-copy-formats-and-the-template-seam.md
    .scratch/jira-cart/issues/08-the-drawer-and-toolbar-coexistence.md
  Then, for the VOICE and the STRUCTURE to match:
    src/jira-ux-improvements.user.md
    src/jira-backlog-sprints.user.md
  Then, for the mechanisms the prototypes proved:
    .scratch/jira-cart/prototypes/07-add-gesture.user.js
    .scratch/jira-cart/prototypes/08-drawer.user.js
  Skim only if a claim needs its raw evidence:
    .scratch/jira-cart/research/  (02a, 02b, 02c, 05a, 09a)

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- ZERO web fetches. Everything is settled and cited. If you find yourself wanting to
  look something up, you are re-opening a decision — see the next constraint.
- Do NOT re-open a decision. The nine Answers are binding. If two of them genuinely
  contradict each other, do not pick a winner: write the contradiction down, put it
  to the user, and wait. That has not happened yet and would be a real find.
- Do NOT invent. No `data-testid` that is not in `02`/`09a`, no endpoint that is not
  in `01`, no behaviour that no ticket decided. If the spec needs something nobody
  settled, mark it as open rather than filling the gap.
- Do NOT write `src/jira-cart.user.js`. Building is the next effort, and the whole
  point of nine tickets is that the build session opens no decision.
- Do NOT touch `src/jira-ux-improvements.user.js` or `src/jira-backlog-sprints.user.js`.
  `08` found a real bug in the first of them — see DELIVERABLE 4 — and it is recorded,
  not fixed, here.
- Do not commit.

THE VOICE, and it is a deliberate house style rather than a preference.
`src/jira-ux-improvements.user.md` is written in short, plain, declarative
sentences: "The earlier version made the toolbar with DOMParser… The results were
bad:" then a list. Match it. Long paragraphs of dense prose are the wrong register
for this repo. Prefer a table where a table fits — both existing ADRs use them for
buttons, for rejected alternatives, and for risks.

THE STRUCTURE, taken from the two existing ADRs and extended only where nine
tickets need more room:
  1. Context — what the Cart is for, and the vocabulary from `05` §1 stated ONCE
     and used everywhere after (the cart userscript / the Cart / collection / the
     active collection / item / link). "Cart" is never a synonym for the active
     collection.
  2. Decision — numbered subsections, one per mechanism, each with the reason:
     the detector and the summary cascade (`02`, `07` §6.2, `08`'s sixth tier);
     the two-section drawer and the mirror rule (`09`); the stored shape and the
     one write rule (`05`); the add gesture (`07`); copy-out (`06`); placement,
     sizing and layout (`08`); the platform (`04`); the helpers (`03`).
  3. What the script gives the user — the button/control table, in the style of
     `jira-ux-improvements.user.md` §3.
  4. Rejected alternatives — a table. There are many and they are the most useful
     part of the document: modifier+click, the per-row `+`, `resize: both`,
     `popover=auto` and the top layer, scroll-and-accumulate, the API-scope scan,
     multi-select, `BroadcastChannel`, `navigator.locks`, an `activeId` pointer,
     bare URLs and `name/URL` as formats, the template seam, a Chrome extension.
  5. Risks and limits — including the ones nobody closed: `localStorage` dies on a
     logout, a collection copied a week later carries week-old titles, the
     dashboard gadget is unsurveyed, keyboard reachability is untested.
  6. How to test — the two existing ADRs both have this section.
  7. Related decisions in this repository.

THE SCARS MUST GO IN, each with its reasoning, because a conclusion without its
reason gets "simplified" away by the next person. At minimum:
  - `navigator.permissions.query` is NOT used to gate a clipboard write — Firefox
    and Safari reject the permission name, the promise rejected unnoticed, and the
    copy silently never happened (`06` §6)
  - there is no way to put an affordance inside a Jira row without changing how
    Jira lays that row out (`07` §3)
  - an index that can disagree with the keys beside it is the bug both existing
    ADRs were rewritten to remove — hence one blob, and no `activeId` (`05` §2, §4)
  - a logged-out GET returns **200 with login-page HTML**, so validate `ok` +
    content-type + body shape before storing anything (`01`)
  - `issueErrors` came back EMPTY for a missing key, twice — diff requested keys
    against returned keys (`01` §5, `09a`)
  - an idle Jira tab fires ~100 `storage` events a second, so the handler filters
    by key on its first line (`05a` §3.4)
  - Atlassian replaces `window.localStorage` with a plain object platform-wide;
    `.length` is a METHOD there, so never rely on it (`05a` §3.1)
  - a stale tab would write eleven items away, so every write is a
    read-modify-write and the write is the commit (`05` §5, §8)
  - draw the `+`, do not type it: flex centres the line box, not the glyph's ink
    (`07` §5)
  - match the testid LEAF, never the full dotted path — a backlog row's assignee
    fields drop the `software-` prefix every sibling carries (`09a` §4.3)
  - and `08`'s four, which are one family and should be written as one: a `vh` cap
    inside a container it knows nothing about; `overflow: hidden` silently removing
    a flex item's automatic minimum size; `resize: both` on a corner-docked panel
    (plus its two children — `render` wiping a drag it did not own, and a
    `pointerdown` guard that can never fire on a UA resizer); and `scrollIntoView`
    scrolling every ancestor, where `overflow: clip` makes the whole class of bug
    unrepresentable

FOUR THINGS THE DOCUMENT MUST SAY PLAINLY, because a build session will otherwise
undo them:
  - **"Do not re-litigate the helpers."** `03` measured the drift and decided:
    copy all six, take `watchMounts` from `jira-ux`, take the async-aware `guard`
    from `bitbucket-ux`, drop `watchRoute` entirely (`09` deleted its justification).
  - **There is no template seam.** `06` proved the four formats are four
    hand-written functions behind one signature, and that templates would be a
    rewrite of that layer rather than a setting. Do not write "we left a seam".
  - **Scanning is not an action.** The live list is a standing view and a strict
    mirror; there is no third drawer mode. `09` records nearly mis-designing its own
    session for want of this sentence.
  - **The collection is the selection.** Four copy buttons act on the whole of it;
    there is no multi-select (`08`).

THREE CORRECTIONS TO CLOSED TICKETS, which the ADR states in their corrected form
and does not repeat the original of:
  - `02` §5 said the timeline's summary cannot be read. It can: it is a sibling
    inside the anchor's own parent, so the cascade has a **sixth tier**, guarded to
    known rows so a prose link cannot absorb the sentence around it (`08` §8.6).
  - `05` §3 made clicking an already-collected thing a no-op. `07` §5 made the
    affordance a **toggle**.
  - `05` §6 fired gap-fill on drawer *open*. `06` §8 made it a **state**: it runs
    while the drawer is open.

DELIVERABLES, in this order:
1. `src/jira-cart.user.md`, written from the Answers. Cite the ticket beside a
   decision the way the existing ADRs cite their own history — the reader should be
   able to find the evidence without the reader being you.
2. `map.md`: mark the Destination reached, with the date and a one-line pointer to
   the ADR.
3. **Delete `.scratch/jira-cart/prototypes/`** — both files say they are throwaway —
   and tell the user to clear any `gt-jira-cart.proto*` key from localStorage. Do
   this LAST, and only after the ADR is written and the user has read it, because
   the prototypes are the primary source for `07`'s and `08`'s mechanisms.
4. Record, and do not fix: **`jira-ux`'s fallback toolbar is invisible.** Its
   non-anchored rule places it at `z-index: 1` inside Jira's own navigation band, so
   every Firefox user of that script has no toolbar at all (`08` §1). Put it to the
   user as its own small piece of work — most likely one line in
   `src/jira-ux-improvements.user.md` §5 Risks plus a z-index fix in the script —
   and let them decide whether it happens now or later.
5. Update this file's banner: mark J as run, and say the destination is reached.

WHAT IS DELIBERATELY LEFT OPEN, and the ADR should name each as open rather than
quietly resolving it:
  - the platform pile, and its one testable question — does a `ClipboardItem` write
    survive a `@grant`? If it does, `@grant GM_setValue` becomes nearly free and
    brings storage that survives a logout and reaches Bitbucket (`06`, `04`, `05`)
  - grouping the live list by the page's own sections, and container testids for
    the description and the comment stream — both blocked on one devtools probe each
  - keyboard shortcuts, and keyboard reachability of the drawer
  - the dashboard gadget, still unsurveyed since `02`
  - import into a collection; ordering and grouping inside one
```

---

# Prompt K — where the collections live (ticket 10) — RUN, `10` resolved

Written 2026-08-18, after the map went complete and `J` was already drafted.
`10` was opened on the user's initiative: **a third storage option was never on
the table** when `04` and `05` ran — Jira's own per-user property store, reachable
from the page on the session cookie the Cart already uses.

| Prompt | Ticket | Cost | Model |
| --- | --- | --- | --- |
| K — where the collections live | 10 | medium; a capped lookup, one snippet you run, then a grilling | Opus |

**Run K BEFORE J.** `10` can amend the map's *Storage* and *Platform* rows, `04`'s
verdict and two of `05`'s sections, and the ADR's storage section rests on all of
them. Writing the ADR first and rewriting it after would spend the one thing nine
tickets bought — that a build session opens no decision. If you would rather have
the document in hand and accept the rewrite, run J first and say so in `10`'s
Answer; that is a legitimate choice, not a mistake, but it should be a choice.

**Shape of the session, and it has three parts in a fixed order.** A capped
documentation lookup, because two of the three candidates rest on facts nobody has
established. Then one snippet the user runs, because the decisive experiment has
been waiting since `06` and cannot be run by an agent. Then the grilling, because
the hard question is not the API — it is what happens when two copies of a
collection disagree.

```
Read, in this order:
  /home/ghis/othercode/userscripts/.scratch/jira-cart/map.md
      — the *Storage* and *Platform* rows especially; *Platform* carries four
        observations recorded for exactly this review
  .scratch/jira-cart/issues/10-where-the-collections-live.md
  .scratch/jira-cart/issues/04-userscript-or-chrome-extension.md   (the Answer — §2, §3, and the trip-wire)
  .scratch/jira-cart/issues/05-collection-data-model-in-localstorage.md (the Answer — §2, §5, §7, §8)
  .scratch/jira-cart/issues/06-copy-formats-and-the-template-seam.md (the Answer — §6 and "what was not settled" 1 and 3)
  .scratch/jira-cart/issues/01-jira-rest-api-from-a-userscript.md   (the Answer — §3 auth, and the validation rule)
  .scratch/jira-cart/research/05a-storage-probe.md                  (Part 3 — the wrapper, the quota, the storage event)
Do not reopen 02, 03, 07, 08 or 09. The detector, the gesture, the drawer and the
mirror rule are all indifferent to where the bytes live.

HARD CONSTRAINTS — these override any instinct to be thorough:
- Do NOT spawn subagents. Do NOT use the Agent tool or the Workflow tool. One agent, this session.
- At most 8 web page fetches in total. Count them. At 8, stop and work with what you have.
- Atlassian's own developer documentation for the user-properties questions;
  Tampermonkey's own for the GM ones. A blocked, rate-limited or 404 source is
  recorded as unavailable in one line and abandoned. No retries, no mirrors, no
  cloning. `07` already found `tampermonkey.net/documentation.php` renders its API
  sections client-side and returns only its table of contents — if that repeats,
  record it and move on rather than hunting for a mirror.
- Do NOT invent an endpoint, a header, a size limit or a quota. `01` is the
  standard here: a clearly-labelled "could not confirm from primary sources" is a
  good answer; an invented limit is not, because a build session will act on it.
- Do NOT design the drawer, the gesture or the formats. `10` decides where the
  bytes live and nothing else.
- Do not commit. Do not touch `src/`.

PHASE 1 — the facts, capped at 8 fetches. `10`'s questions 1 to 5.

Establish, from primary sources, and mark every unconfirmed claim as unconfirmed:
  - the exact user-properties paths and verbs for the CURRENT user, and whether an
    `accountId` is required or defaults to the caller
  - the documented size ceiling on a property value, stated exactly, and where the
    Cart's blob falls against it — `05a` measured ~6 K chars at 20–50 items and
    ~117 K chars at 1,000
  - whether a state-changing `PUT` from the page needs an XSRF header. `01` proved
    a cookie-authenticated `GET` and `POST` work under `@grant none`; a mutating
    `PUT` is a different question and `01` did not answer it
  - rate limits, and whether an administrator can read another user's properties
  - for Tampermonkey: whether `GM_setValue` is synchronous, what
    `GM_addValueChangeListener` gives across tabs, and any size limit

PHASE 2 — the snippet the USER runs, in the style that worked for `02c`, `05a`
and `09a`: ONE paste-able block, printing a small table. It must answer the two
things the documentation cannot:

  1. **A round trip through user properties on the real instance.** Write a small
     JSON blob to a scratch property key, read it back, list the keys, then delete
     it. Report the status, the content-type, whether an XSRF header was needed,
     and — by writing a deliberately large value — where the real ceiling bites.
     Use an obviously disposable key such as `gt-jira-cart.probe`, and have the
     snippet delete it at the end.
  2. **`06`'s standing experiment, and it is the one that has been waiting
     longest: does a `ClipboardItem` write still work under a `@grant`?** This one
     cannot be done from the console — it needs a tiny throwaway userscript with
     `@grant GM_setValue` that puts a copy button on the page and reports whether
     `navigator.clipboard.write` resolves. Write it into
     `.scratch/jira-cart/prototypes/10-grant-clipboard.probe.user.js`, say in a
     comment that it is throwaway, and keep it under fifty lines. The answer is
     binary and it decides whether candidate B is alive.

Do NOT verify either yourself — you cannot open the user's Jira. End phase 1 by
handing over the snippet and the probe script, and treat every doc claim as
provisional until the runs come back. `01` was wrong about exactly this class of
detail (`issueErrors` came back empty when the docs implied otherwise), and `09a`
and `05a` both corrected desk research with live runs.

PHASE 3 — the grilling, with /grilling. One question at a time, your recommended
answer stated with each, waiting for the user's decision before moving on. Work
`10`'s questions 7 to 11 in order. Facts get looked up; decisions are the user's.

CARRY THESE IN — they are settled, not open:
- **The add path is synchronous and copy-out never awaits the network** (`05`,
  `09`, `04`). Any candidate that puts a network call in either is not a variant,
  it is a different design, and it must be argued as one.
- **Every write is a read-modify-write, and the write is the commit** (`05` §5,
  §8). A second copy does not get to relax that for the first one.
- **A logged-out call can return 200 with login-page HTML** (`01`, verified), so
  nothing is trusted without `ok` + content-type + shape.
- **`04` did not forbid a grant.** It found that nothing the Cart needed forced
  one, which is a different claim — and `09` has since deleted one of the two
  reasons it gave for staying at `@grant none`.
- **`05a` Part 3 measured the ground already**: Atlassian replaces
  `window.localStorage` with a faithful passthrough whose `.length` is a method;
  Jira alone holds ~2.63 MB of a ~5 MB origin quota; an idle tab fires ~100
  `storage` events a second.

THE QUESTION THAT DECIDES IT, and it is question 7 rather than any API detail:
**what happens when the two copies disagree?** `05` spent a whole session deleting
values that could contradict each other, and candidate C reintroduces exactly one
— now stretched across machines rather than tabs, where "the stale tab writes away
eleven items" becomes "the laptop writes away what the desktop collected". If no
reconciliation rule is simple enough to be trustworthy, the right answer is to
**reject C and say why**, and that is a good outcome rather than a failure.

TWO THINGS WITH CONSEQUENCES BEYOND THIS TICKET — handle them explicitly:
- **An amendment to `04` or `05` is a reversal, not an edit.** The map's rule
  stands: report the evidence, put the reversal to the user as its own decision,
  then change the table and say in the Answer that you did.
- **Two out-of-scope entries may graduate**, and the map says out-of-scope entries
  never graduate quietly. If C works, cross-machine sync stops being a fresh
  effort and becomes a property of the store. If B works, Bitbucket does. Each is
  its own decision.

DELIVERABLES, in this order:
1. An `## Answer` appended to
   .scratch/jira-cart/issues/10-where-the-collections-live.md, in the style of
   01-09: the verdict first and in bold, the three candidates compared on what was
   actually established rather than on what was hoped, evidence cited with file
   references, what was NOT settled said plainly, and a closing "what this hands
   on" naming the ADR session.
2. `Status:` updated on that ticket.
3. The probe output saved to `.scratch/jira-cart/research/10a-storage-options.md`,
   with a paragraph on what it settled — including, explicitly, whether the
   clipboard survives a `@grant`, because that answer has been outstanding since
   `06` and closes the platform pile either way.
4. A one-line-plus gist appended to map.md's "Decisions so far", matching the
   existing density.
5. Any constraint-table edit the grilling produced — *Storage* and *Platform* are
   the likely two — plus any out-of-scope entry that graduated.
6. Delete `.scratch/jira-cart/prototypes/10-grant-clipboard.probe.user.js` once its
   answer is recorded, and tell the user to remove the probe property key and any
   `gt-jira-cart.probe*` value.
7. Update this file's banner: mark K as run, and name **J — the ADR** as the live
   prompt, noting whether J's storage section changed.
```
