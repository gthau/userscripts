# 03 — Shared helpers across three scripts

Type: grilling
Status: resolved — duplicate, deliberately (see Answer)
Blocked by: —
Parent: ../map.md

## Question

`logger`, `guard`, `injectStyle`, the route detector and the
`animationstart` mount detector are already copied between
`bitbucket-ux-improvements` and `jira-ux-improvements`, and
`jira-backlog-sprints` carries its own copies of some of them. The Cart would be
the third or fourth copy.

The `jira-ux-improvements` ADR rejected `@require` for a stated reason:
Tampermonkey caches a `@require` file and so does GitHub's raw server, so an
update to the library does not reliably reach users. It noted that a version
number in the URL would fix this, and rejected that because the repo has no
build step.

Decide, for this effort:

1. **Does the Cart duplicate the helpers, or share them?** Duplication is the
   status quo and is genuinely defensible — each script stays independently
   installable and independently breakable, which is worth something for tools
   you run against someone else's SPA.
2. **If shared, by what mechanism?** A hand-bumped version in a `@require` URL
   (`.../v3/lib.js`) needs no build step but needs discipline. A build step that
   inlines a shared file into each `.user.js` at release keeps the shipped
   scripts self-contained but introduces the toolchain this repo has so far
   avoided — and would mean the `src/*.user.js` files are no longer the thing
   you install.
3. **What is the actual cost of the status quo?** Count the duplicated lines
   across the existing scripts and check whether the copies have already drifted
   apart. Drift is the real argument for sharing; line count on its own is not.
4. **If the answer is "keep duplicating", say so explicitly in the ADR** so the
   next script does not re-litigate it a fourth time.

**Scope guard:** this ticket decides *whether and which*. It does not build a
toolchain, and it does not migrate the existing scripts. If the decision is to
share, migrating `bitbucket-ux-improvements` and `jira-ux-improvements` is a
separate effort — the Cart only has to know what to do with its own copy.

## Answer

**Duplicate — and the drift evidence is what settles it, pointing the opposite
way to the one the ticket expected.**

The ticket named drift as "the real argument for sharing". Drift was measured
rather than assumed. Four divergences exist across the five scripts, **none of
which has caused a fault**, and three of the four are local adaptation rather
than decay. On that evidence, neither mechanism on offer — a hand-bumped
`@require` version, or a build step that inlines a shared file — buys enough to
pay for itself.

### 1. What the status quo costs — measured

Comparing the two closest scripts, `jira-ux-improvements` (723 lines) and
`jira-backlog-sprints` (909 lines):

| Helper | Lines | Verdict |
| --- | --- | --- |
| `logger` | 11 | identical but the prefix string |
| `guard` | 7 | identical |
| `injectStyle` | 9 | identical, byte for byte (`diff` clean) |
| `watchRoute` | 38 | identical but the 4 lines naming the identity function |
| `watchMounts` | 14 | **drifted** — see below |
| `reportBrokenContract` | 11 | near-identical (`bitbucket-ux` ↔ `jira-backlog`) |

**≈ 90 lines, about 11% of either file.** The Cart would be the fourth copy.

### 2. The four divergences, and why three of them argue for duplicating

| # | Where | What | Reading |
| --- | --- | --- | --- |
| 1 | `guard`: [`bitbucket-ux:494`](../../../src/bitbucket-ux-improvements.user.js#L494) vs [`jira-ux:70`](../../../src/jira-ux-improvements.user.js#L70) | Bitbucket's is `Promise.resolve(fn()).catch(…)` and returns nothing; both Jira ones are `return fn()` | **Local adaptation.** Bitbucket's handlers are async (`onPickerMounted` awaits `waitFor`); the Jira ones are sync. Each copy fits its script. A shared `guard` would have to be the union — worse than either, because its failure behaviour would depend on whether the argument happened to return a promise. |
| 2 | [`jira-backlog:285`](../../../src/jira-backlog-sprints.user.js#L285) | `watchMounts` accepts `onMount`, then hardcodes `setInterval(() => guard(render), …)` in the backstop, and drops `guard` from the listener path | **Local specialisation.** The backlog needed render-coalescing, so its copy fused to `scheduleRender`. A shared version would have grown a parameter to serve its second caller. |
| 3 | [`jira-show-fixversion-dates:168`](../../../src/jira-show-fixversion-dates.user.js#L168) | `applyReleaseDetailsCss` — 13 lines reimplementing `injectStyle`, without the `?? document.documentElement` fallback | **The only genuine defect — and it is inert.** That script carries no `@run-at`, so it runs at `document-idle` where `document.head` always exists. It would bite only if the script moved to `document-start`. Note it did not *copy* anything: it reinvented, because whoever wrote it did not reach for an existing helper. **A shared library does not fix that failure mode — it would not have been reached for either.** |
| 4 | `logger`, three shapes | 4 methods with rest args (×3 scripts), 5 with `trace` ([`fixversion:21`](../../../src/jira-show-fixversion-dates.user.js#L21)), 3 without rest args ([`trivy:23`](../../../src/bitbucket-collapse-trivy.user.js#L23)) | Cosmetic. The three scripts that matter agree exactly. |

**The zero-fault tally is the headline.** No call site in any of the five
scripts uses `guard`'s return value, and the one genuinely async path —
`copyIssue` at [`jira-ux:365`](../../../src/jira-ux-improvements.user.js#L365) —
carries its own `try/catch`. The copies diverged silently and nothing broke. The
parts that were genuinely copied (`injectStyle`, `logger`, `watchRoute`) did not
rot at all.

Against that, the mechanisms cost real things: a versioned `@require` URL needs
discipline this repo has never had to exercise, and a build step would mean
`src/*.user.js` is no longer the thing you install — which is currently true and
worth keeping. Each script stays a single file you can paste into Tampermonkey,
break alone, and fix alone.

**Ordering note:** this was decided ahead of `04` deliberately. If `04` returned
"extension" it would bring a bundler and dissolve the question — but the map's
standing constraints already commit to `localStorage`, `@grant none` and
`src/jira-cart.user.js`. This ticket's measurement is evidence *for* `04`, not
the other way round.

### 3. What the Cart copies

Shorter than "all of them" was considered and rejected only for `watchRoute`;
the final list is all six.

| Helper | Source to copy from | Note |
| --- | --- | --- |
| `logger` | any of the three | the 4-method rest-args shape |
| `guard` | **[`bitbucket-ux:494`](../../../src/bitbucket-ux-improvements.user.js#L494)** | the async-aware body — see §4 |
| `injectStyle` | any of the three | verbatim, the byte-identical 9-line version |
| `watchMounts` | **[`jira-ux:242`](../../../src/jira-ux-improvements.user.js#L242)** | **not** the backlog's, whose backstop is fused to its own `render` (divergence 2) |
| `watchRoute` | [`jira-ux:194`](../../../src/jira-ux-improvements.user.js#L194) | see below |
| `reportBrokenContract` | [`jira-backlog:392`](../../../src/jira-backlog-sprints.user.js#L392) | the Cart's enrichment tier rests on Atlassian `data-testid`s per `02` — exactly the rot this badge announces |

**On `watchRoute`, the one that was in doubt.** In both Jira scripts its callback
does nothing but reset per-route state — `locked = true` at
[`jira-ux:717`](../../../src/jira-ux-improvements.user.js#L717),
`panelOpen = false; boardsSignature = null` at
[`jira-backlog:901`](../../../src/jira-backlog-sprints.user.js#L901). Rendering is
driven by `watchMounts` alone. Most of the Cart's state is *not* per-route:
collections and the active collection live in `localStorage`, so the badge count
survives navigation untouched. It is copied anyway on the expectation that `09`
makes scan results per-page — a list of "issues on this page" is meaningless on
the next page. **If `09` and `08` both end up with nothing to forget on
navigation, this is 38 lines with an empty callback and should be dropped.**

### 4. The one deliberate divergence, which the ADR must name

**The Cart takes `bitbucket-ux`'s `guard`, not the one in the two Jira scripts
beside it.** The Cart is the most async of the four — `bulkfetch` per `01`,
clipboard writes per `06`, plus whatever `09`'s scan does — and
`try { return fn(); } catch` catches nothing thrown after the first `await`: a
failed `bulkfetch` becomes an unhandled rejection while the guard reports
success. Same seven lines, catches the case the Cart actually has.

Not the union of the two variants. The return value is dropped, since no call
site in any of the five scripts uses it.

This has to be written down, or the next reader sees the Cart disagreeing with
its neighbours and "fixes" it back.

### 5. Recorded, not fixed

Per the scope guard, neither existing-script divergence is touched here. Both are
harmless as they stand, and both are recorded above rather than raised as
follow-up tickets: divergence 2 costs one uncoalesced scan every 5s against an
idempotent `render`, and divergence 3 is inert at `document-idle`.

### For the ADR

The verdict belongs in `src/jira-cart.user.md`, which is the only place it can
go — this repo has no README and no root `CLAUDE.md`, so the ADRs are the whole
of its prose. Stated so a fourth script does not re-litigate it:

> **The helpers are duplicated, on purpose.** `logger`, `guard`, `injectStyle`,
> `watchRoute`, `watchMounts` and `reportBrokenContract` are copied into every
> script in this repo — about 90 lines, roughly a tenth of a file. `@require` was
> rejected by the `jira-ux-improvements` ADR because Tampermonkey and GitHub's
> raw server both cache the file; a version in the URL would fix that and needs
> discipline; a build step would fix it and would mean `src/*.user.js` is no
> longer the thing you install. Both cost more than the problem. The copies were
> audited when this script was written: four divergences across five scripts,
> **none causing a fault**, and three of them local adaptations that a shared
> library would have had to grow parameters to serve. The one real defect was in
> a script that had *reinvented* a helper rather than copied it — which sharing
> would not have prevented. Copy the helpers. Do not re-litigate this.
>
> One divergence here is deliberate: this script's `guard` is the async-aware
> body from `bitbucket-ux-improvements`, not the synchronous one in the two Jira
> scripts, because the Cart awaits `bulkfetch` and the clipboard. Do not
> "correct" it to match its neighbours.

Feeds `04`. Blocks nothing.
