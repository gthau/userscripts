# Map: Jira Cart

Labels: `wayfinder:map`

## Destination

**REACHED on 2026-08-18.** The spec is
[`src/jira-cart.user.md`](../../src/jira-cart.user.md), written by prompt `J` from
the ten Answers. It decided nothing: every section names the ticket that settled
it. **This map is finished.** The next effort is building `src/jira-cart.user.js`
from the spec, in three sessions, and its prompts are
[`build-prompts.md`](build-prompts.md) beside this file. That effort settles nothing
either — if it finds it must, the finding comes back here.

An ADR-style spec at `src/jira-cart.user.md`, written in the style of the two
existing ADRs in `src/`, that locks the design of a "Jira Cart" userscript —
a collector for issue links and names across Jira, backed by browser storage,
organised into named collections, with copy-out in several formats — and
answers the userscript-vs-Chrome-extension question with evidence rather than
guesswork. When the map is done, a build session can write the script from the
spec without re-opening a decision.

## Notes

**Domain:** Tampermonkey userscripts against Jira Cloud, a React single-page
app. No build step, no test system, no package.json in this repo. Scripts are
plain `.js` files in `src/`, each with a sibling `.user.md` ADR.

**Skills every session should consult:** `/grilling` and `/domain-modeling` by
default. `/research` for the research tickets. `/prototype` for the prototype
tickets.

**Running the research tickets:** see `prompts.md` beside this file. The first
attempt at `01` and `02` was launched as fan-out subagents and lost the session
to rate-limited sources before writing anything. The prompts there are
single-agent and fetch-capped, and are meant to be run one per session. Prompts
**A–I** have all been run and the map was complete on 2026-08-18. **A tenth
ticket, `10`, was opened the same day** — where the collections live — and **`K`
closed it** the same day, after five runs by the user. **Every ticket is now
resolved**, and **`J` has been run on 2026-08-18 — the destination is reached.** It
wrote `src/jira-cart.user.md` from the ten Answers and decided nothing. **No prompt
is live.** The banner at the head of `prompts.md` records this.

**Existing prior art to reuse rather than reinvent** — read these before
deciding anything:

- `src/jira-ux-improvements.user.js` + `.user.md` — route detection (Navigation
  API → patched `history` → timer), mount detection via a 1ms CSS
  `animationstart`, `logger`/`guard`/`injectStyle` helpers, dual text+HTML
  clipboard writes via `ClipboardItem`, Atlassian `--ds-*` design tokens for
  theming, and CSS-attribute-on-`<html>` for state that must survive a React
  remount.
- `src/jira-backlog-sprints.user.js` + `.user.md` — a panel with a
  label-is-the-state control, and CSS-first behaviour written at
  `document-start` so nothing flashes.
- `src/bitbucket-ux-improvements.user.js` — origin of the `animationstart`
  method and the shared helpers.

**Standing constraints for this effort** (settled while charting; not open
questions — a ticket may report evidence against one, but may not quietly
overturn it):

| Constraint | Value |
| --- | --- |
| Capture surfaces | Any Jira page that shows an issue reference. **Issue references are always `<a href="/browse/KEY">`** — every one, across all seven views `02` surveyed live. *Corrected:* the original charting note warned they were not, and that observation was real but about **other** Jira entities — fixVersion, sprint and similar are rendered as buttons, not links. Work items (epics, stories, tasks) are links. |
| Add gesture | **Two gestures, for different situations — neither is a fallback for the other.** *Settled by `09`, which removed the earlier Primary/Secondary ranking.* (1) The panel's **live list**: survey the issue links drawn on this page, add one or several. (2) A **direct per-reference gesture** (`07`): add the link under the cursor without opening the panel. Click-based forms are ruled out — every modifier+click already opens the link. **The form is now fixed by `07`: ONE shared floating button, positioned to the LEFT of the hovered issue link, never injected into a Jira row — and it is a TOGGLE, adding an uncollected link and removing a collected one.** *That last part amends `05` §3, which had made clicking an already-collected thing a no-op.* A per-row `+` was built and killed — an inline box next to the key reflows the row and re-aligns the summary, on all four views tried, and the only escape is writing `position: relative` onto a React-owned node. A **right-click menu is an opt-in preference in `gt-jira-cart.prefs`, shipped off**, because interception costs the browser's own link menu and there is no Chromium escape hatch. |
| Storage | **Tampermonkey's own storage, under a `@grant`** — settled by `10` on 2026-08-18 after five runs by the user. One key, `gt-jira-cart.collections`, holding one JSON blob. **`05`'s model transfers unchanged**: `GM_setValue` is synchronous, so read-modify-write stays synchronous and copy-out stays inside its user activation. The change is a substitution of two calls — `localStorage.getItem`/`setItem` → `GM_getValue`/`GM_setValue`. **Use the `GM_*` forms, never the `GM.*` forms**: the dotted ones are promise-based and would put an `await` in the copy handler, re-opening `04` §3's silent clipboard failure. Cross-tab freshness is `GM_addValueChangeListener`, which replaces the `storage` event and is slightly better — it fires with `remote: false` for the tab's own write instead of not firing at all; its delivery is measurably later, which costs a late redraw and nothing else. **Survives a logout and a history cleanup**, and reaches other origins because the store is per-script rather than per-origin. **It does not survive uninstalling Tampermonkey, switching browser, or moving machine** without Tampermonkey's own cloud sync — so a collection is still working state and copy-out is still how the data leaves the browser, for that reason rather than for the fragility `05` originally cited. The size ceiling is **unmeasured** — the documentation is unreadable — and `05` §8's *no cap, no warning threshold* conclusion is carried on the store being the extension's rather than on a number. Rejected: `localStorage` (dies at a logout) and a Jira user-properties mirror, which was designed and measured in full and **preserved for reconsideration** at [`10a` Part 5](research/10a-storage-options.md). |
| Collection shape | Many named collections, exactly one active. Adds go to the active one. **The active collection is the first in the list — there is no pointer, so none can dangle** (`05`). `collections` is never empty. |
| Item data | Issue key + summary. **The summary is read from the DOM beside the key, with `bulkfetch` as the fallback** — the reverse of what this row said while charting. *Corrected by `02` §5, which found the summary sits next to the key on every view surveyed, and made load-bearing by `09`: scan makes no network call, so an add never waits on one.* **`08` closed the last hole in it:** `02` §5 had recorded the timeline's summary as unreadable, and a pasted `outerHTML` showed otherwise — it is a sibling inside the anchor's own parent — so a **sixth cascade tier** (the parent's text minus the anchor's, guarded to known rows so a prose link cannot absorb the sentence around it) now reaches all seven views. An item is valid with a key alone (`01`). The live list's per-row origin is scan-time annotation and is **not** stored. *Amended by `05`:* the stored item is `key` + optional `summary` + an optional `issueId`, learned only on refresh, which repairs a key changed by a project move. The failed-summary state is **not** stored either — there is one such state, because the API conflates absent and forbidden. *Amended by `06` on two points.* **Gap-fill's trigger is a state, not an event: it runs while the drawer is *open*, not only when it opens** — otherwise adding a summary-less link to an already-open drawer fires nothing and the item stays bare until it is closed and reopened. Debounced into one request per burst, excluding keys in flight, and never re-asking for a key that already came back empty — that last guard is what stops a permanently unreadable item re-fetching on every render. **And a refresh may replace a summary but never delete one**, so a network blip cannot strip the titles off a collection built over a week. Existing summaries are still updated **only on an explicit refresh**, which means a collection left for a week copies with week-old titles; the remedy is the refresh control, since nothing may fetch in the copy path (`04`). |
| Export | **Four formats, fixed by `06`: 🔗 Links (`- [KEY](url) Summary`, plus a `<ul>` of links as `text/html`), 📃 Names (`[KEY] Summary` per line), 🔑 Keys (`KEY, KEY, KEY`), 🔍 JQL (`key in (KEY, KEY, KEY)`).** Only Links writes a second `text/html` flavour; the mandatory clipboard types are `text/plain`, `text/html`, `image/png` and nothing else is reachable. **No format ever drops an item** — the lines in a paste equal the items copied, and an item with no summary shrinks its line rather than vanishing. All four work on a whole collection or a selection; **JQL does not apply to a single item**. The `- ` bullet belongs to the list scopes, so a single-item copy is byte-identical to `jira-ux`'s 🔗 link. The collection's name is never emitted. User-editable templates remain a later effort — and `06` established they would be a **rewrite of this layer, not a configuration of it**, so the ADR may not claim a seam. **`08` fixed where they are offered: four buttons at the foot of the collection section, acting on the WHOLE collection — there is no multi-select and no per-row copy, because the collection IS the selection.** All four are disabled and dimmed while it is empty (a copy of zero must not write), the copy control's label is derived inside `render` or the ✅ never clears, and the refresh control — the only remedy for a stale title — is a ↻ in the collection's heading. |
| Placement | A new `src/jira-cart.user.js` with its own ADR — not an extension of `jira-ux-improvements`. **The positioning contract, fixed by `08`: the Cart takes a BOTTOM corner (bottom-right by default) and is never anchored to a Jira element; `jira-ux` and `jira-backlog-sprints` own the top-right in both their anchored and their fallback positions.** The drawer's own chrome mirrors the anchored corner — the resize grip on the corner it is *not* anchored to, the head's controls on the side it *is* — which is one rule generating both placements. `08` §4's guess that the top-right was the natural home is **dead**: the forced-fallback switch showed that corner is not merely contested but unusable for a fixed element, because `jira-ux`'s fallback rule puts its toolbar at `z-index: 1` inside Jira's own navigation band, where it is invisible. *That is a bug in `jira-ux` — every Firefox user of that script has no toolbar — recorded in `08` §1 and not the Cart's to fix.* |
| Panel UI | An always-present count badge that opens a side drawer. The label carries the state. **The drawer holds the live list and the collections** — *recorded by `09`, which nearly mis-designed the ticket for want of it; widened by `05`*: a **live list** mirroring the issue links currently drawn on the page, and the **collections** — the active one shown in full, plus the means to see the others, create one, and make one active. The badge counts the active collection. The live list is a standing view, not an action, and only a click moves a link from one to the other. **Fixed by `08`, from use:** the drawer is **non-modal** and stays open while you work (no backdrop, no focus trap, no light dismiss, and Escape does not close it), sits at plain `z-index` rather than in the top layer, and is **resizable from a grip on the corner it is not anchored to**, remembering its size. **The layout is derived from the drawer's width unless pinned** — one preference with three states (`auto`/stacked/split), not a flag beside a size that could contradict it. **The live list keeps ~62%** of the room by default in both layouts, with a draggable divider remembered per layout, because the accumulator must not starve the mirror. **A live-list row is a toggle**; collection rows carry an explicit `✕`. The default collection is **`Scratch`**, renamed by clicking its name, and **duplicate names are prevented by appending ` 2`** — same rule on create and rename. Reorder does not exist. A ⚙ in the head holds preferences, including `07`'s right-click switch. |
| Platform | **A Tampermonkey userscript with a `@grant`.** `04`'s verdict — userscript, unconditionally — **stands**; only the grant changed, and `04` never forbade one. It found that nothing the Cart *needed* forced a grant, and called durability needing one a different claim. **`10` closed the platform pile by testing it rather than arguing it.** Four observations had accumulated across `04`, `05`, `07` and `06`, and all of them rested on one untested thing: whether a `ClipboardItem` write survives Tampermonkey's sandbox. **It does** — a dual `text/plain` + `text/html` write resolved, twice, on 2026-08-18. `bulkfetch` survives the sandbox too (`200`, JSON, correct shape), and `01`'s rule 3 was re-confirmed live while proving it. `09` had already deleted the other reason for `@grant none` by dropping route detection. **So the grant costs nothing anyone has named.** Two observations are now dissolved rather than outstanding: storage surviving a logout, and reaching another origin. **Two survive and are genuinely an extension's advantages**: the Cart exists once per tab where an extension's UI is once per window; and native context-menu entries, which `07` found is the first place an extension is *better* rather than merely different. Neither is acted on. One residual check for the build session: `08`'s prototype ran under `@grant none`, and its layout findings are DOM and CSS, so they should transfer — *should* being reasoning. |
| Audience | The user, plus tinker-minded colleagues on other teams — **all already running Tampermonkey and this repo's other scripts**. Not a store-distributed product. |
| Browsers | Chromium family in practice: Chrome, Edge, Vivaldi, Opera. Firefox is a nice-to-have, not a priority. |

**Design principles inherited from the two ADRs** — the spec is expected to
honour them, and a reviewer will check:

1. Derive state from the page; do not keep flags that must agree with each other.
2. One idempotent `render`; only it writes to the page.
3. Prefer a CSS rule over JavaScript when the answer is knowable at
   `document-start`.
4. If a subsystem breaks, the safe default must be what remains.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- **`01` — the API works, and one call covers a collection.** `POST /rest/api/3/issue/bulkfetch`
  with `{issueIdsOrKeys, fields}` returns `{issues, issueErrors}` on the session
  cookie under `@grant none`; verified live. Three rules fall out: a key is valid
  without a summary; validate `ok` + content-type + body shape (a logged-out GET
  returns **200 with login-page HTML**, verified); and **diff requested against
  returned keys**, because a missing key is omitted silently and `issueErrors` was
  empty. Refresh of a whole collection is one request.
  → [`issues/01`](issues/01-jira-rest-api-from-a-userscript.md#answer)
- **`02` — the ticket's premise was wrong: every reference surveyed was an `<a href="/browse/KEY">`.**
  `a[href*="/browse/"]` alone reached all seven live views, so the detector is one
  anchor selector plus four verified container `data-testid`s demoted to
  summary-reading and `closest()` anchoring. Text-regex scanning is dropped by user
  decision. The summary sits beside the key on every view, making the API the
  *fallback*. Virtualisation confirmed destructive — counts **fall** on scroll.
  Scan by enumerating anchors and walking **up**: the key's testid element is
  sometimes the anchor, sometimes its parent.
  → [`issues/02`](issues/02-finding-issue-references-in-jira-dom.md#answer)
- **`03` — duplicate the helpers, and the drift evidence is what settles it.**
  ≈90 lines copied per script (~11% of a file). Drift was measured, not assumed:
  **four divergences across five scripts, none causing a fault.** Three are local
  adaptation a shared library would have had to grow parameters to serve; the one
  real defect is in the script that *reinvented* a helper rather than copying it —
  which sharing would not have prevented. The Cart copies all six helpers, taking
  `watchMounts` from `jira-ux` (the backlog's is fused to its own `render`) and,
  **deliberately, the async-aware `guard` from `bitbucket-ux`** because the Cart
  awaits `bulkfetch`. `watchRoute` is copied on the expectation that `09` makes
  scan results per-page; if `08` and `09` find nothing to forget on navigation,
  drop it. The ADR must say "do not re-litigate this".
  → [`issues/03`](issues/03-shared-helpers-across-three-scripts.md#answer)
- **`04` — userscript, unconditionally; the trip-wire is a ladder, not a switch.**
  `01` and `02` both came back positive, so the "if either came back badly" branch
  never opened: an extension would read the same DOM through an isolated world, call
  the same undocumented cookie-authenticated endpoint, and need `world: "MAIN"` just
  to recover the page-context `history` that `@grant none` gives free. Its users
  already run Tampermonkey and this repo's scripts, so **distribution argues *for*
  the userscript**. Four apparent reasons to build an extension have a `@grant`
  answer instead (CSP → any grant; Bitbucket and cross-machine sync →
  `GM_setValue`, per-script not per-origin; cookie auth dying → an API token, the
  same in both worlds). **Exactly one thing would force a move: Cart UI when no Jira
  tab is focused** — and it is dormant. One new rule falls out: **copy-out is
  synchronous and never awaits the network**, which keeps `@grant none` *and* the
  dual text+HTML clipboard write.
  → [`issues/04`](issues/04-userscript-or-chrome-extension.md#answer)
- **`09` — the page's filters are the query, so the list mirrors the DOM and nothing more.**
  The ticket was nearly mis-designed: **the drawer holds two sections** — a live list of
  the links drawn on the page, and the collection — so "scan" is a standing view, not a
  batch add. Given that, *everything drawn right now* is the right promise on all seven
  views, not a compromise: the API cannot see the user's `?assignee=` filter, and the runs
  show it always returning **more** than the page shows (a section reading `0 of 44 visible`
  yields 50; the board's `approximate-count` is **1150** against 25 cards; the backlog is
  750 issues over 32 sections). Timeline's `plans/plan` is **403**, admin-only. So **scan
  makes no network call** and the API keeps only `01`'s summary-fallback job; an
  API-scope add belongs to *import*. **Strict mirror** — rows leave the list when they
  unmount, because **the collection is the accumulator, so the list needn't be**. That
  **drops `watchRoute`**, the 38 lines `03` pre-authorised. The badge counts the
  collection, so it cannot lie; the live list is flat, labelled `On this page (n)`, and
  borrows no counts. Prose links are **in** (reversing `02` §3) with a coarse origin per
  row. Two constraint rows amended above.
  → [`issues/09`](issues/09-what-scan-this-page-promises.md#answer)
- **`05` — one key, one blob, and every value that could disagree with another was deleted.**
  `gt-jira-cart.collections` holds `{v, collections[]}`; an item is `key` + optional
  `summary` + optional `issueId`. **There is no active pointer — the active collection
  is `collections[0]`**, and `collections` is never empty, so *the active collection*
  is total and no delete path repairs anything. Vocabulary settled: the **cart
  userscript** is the script, **the Cart** is the UI, collections are wishlists and
  the active collection is the trolley; "cart" is never a synonym for it. Correctness
  is one rule — **every write is a read-modify-write against `localStorage`** — which
  closes the *stale tab writes away eleven items* bug; the `storage` event is then
  only a freshness hint, filtered by key on line one because Jira fires ~100 events a
  second. `BroadcastChannel` and `navigator.locks` rejected, with reasons. The summary
  is a **snapshot**: gap-fill on drawer open for items with none, explicit full
  refresh otherwise; the failed state is **derived, never stored**. An unparseable
  blob is **preserved, not replaced** — a collection is data, not a preference. Scale
  is 20–50 items, so the quota is a non-question; a failed `setItem` is not, and the
  write is the commit.
  → [`issues/05`](issues/05-collection-data-model-in-localstorage.md#answer)
- **`07` — one floating toggle to the left of the hovered link; nothing is ever injected into a Jira row.**
  The effort's first prototype ticket, and it earned its keep: the per-row `+` was
  built, used and **killed by evidence a description would not have produced** —
  an inline box beside the key raises the row's line box and re-aligns the summary
  as if it had `vertical-align: top`, reported on four views independently. The
  one-sentence cause of death: **there is no way to put an affordance inside a
  Jira row without changing how Jira lays that row out**, and the only escape is
  writing `position: relative` onto a React-owned node. The floating form costs no
  layout, needs no per-row cleanup, and `02` §6's destructive virtualisation is
  free to it. **Left, not right** — the key sits at the row's left edge and the
  summary runs right, so the margin is where nothing else is. **Loud, not subtle**
  — the token palette's outlined chip could not be picked out. The
  "did-you-mean-to-navigate" failure is **unreachable**, not merely unobserved:
  a separate element means no shared click target. The right-click menu is
  **liked but demoted to an opt-in preference, shipped off**, which is a third
  observation for the platform review. **The affordance is a toggle, amending
  `05` §3** — a stateful button that absorbs its own click is a dead control and
  reads this repo's label-carries-the-state convention backwards; removal
  announces itself by turning red under the cursor *before* the click, because
  the collection is working state and there is no undo. Three mechanisms proved
  and handed on:
  already-collected as a **CSS rule generated from the `href`** (so remounts and
  virtualisation cost nothing), a five-tier summary cascade, and grouping anchors
  by **(row, key)** taking the widest.
  → [`issues/07`](issues/07-the-direct-add-gesture.md#answer)
- **`06` — four formats, four hand-written functions, and the template seam was never promised.**
  🔗 **Links** (`- [KEY](url) Summary` + a `<ul>` of links), 📃 **Names**
  (`[KEY] Summary` per line), 🔑 **Keys** (`KEY, KEY, KEY`), 🔍 **JQL**
  (`key in (…)`). Links is **straight reuse** of `jira-ux`'s 🔗 link, whose shape
  changed under this session — a rebase brought in `37ff03a`, and the reason in the
  code is a syntax limit, not taste: markdown cannot nest square brackets, so the
  key alone is the label. JQL earns its place on `05`'s durability framing — Links
  makes the data last *outside* Jira, JQL makes it last *inside* it. Rejected: bare
  URLs (Links minus the summary) and `name/URL` (Links' fields, other punctuation).
  **No format ever drops an item** — Names sheds its brackets to `GLX-402` rather
  than emitting `[GLX-402] `, and **that one line is what kills the template
  model**: it is a different line shape, not a substitution, so templates would be
  a **rewrite of this layer**, and the ADR may not claim a seam. What is real is a
  dispatch table, `format(items, scope) → {text, html?}`, the shape `BUTTONS`
  already uses. Only Links writes `text/html`; the W3C spec's mandatory types are
  `text/plain`/`text/html`/`image/png`, so that pair is the whole surface. **Partial
  success is not representable** — ⚠️ means only *nothing reached the clipboard*, a
  summary-less item is never a ⚠️, and an empty collection must not write at all.
  One user correction reframed the ticket: **Jira's summary is mandatory, so a bare
  item means the Cart failed to capture, never that the issue has no title** — and
  gap-fill makes that common when adding but rare when copying. Two `05` rows
  amended, one *Platform* observation added, and it is the first testable one.
  → [`issues/06`](issues/06-copy-formats-and-the-template-seam.md#answer)
- **`08` — the drawer is derived, not configured, and the shell's own mistakes are the ADR's warning list.**
  A badge in a **bottom** corner; the top-right is not merely contested but
  **unusable** — the forced-fallback switch showed `jira-ux`'s toolbar vanishing
  behind Jira's navigation at `z-index: 1`, *a bug in that script that leaves every
  Firefox user without a toolbar*. The drawer is **non-modal** and kept open while
  collecting, at plain `z-index` (the top layer earned nothing), **resized from a
  grip on the corner it is not anchored to**, with its chrome mirroring the anchor
  — one rule placing both the grip and the `✕`. **Layout derives from width**
  unless pinned; **the live list keeps ~62%**, because a 30-item collection starved
  it. **The collection is the selection**: four copy buttons on the whole of it, no
  multi-select. `Scratch`, renamed in place, duplicates numbered. **Six defects
  came from use and three are one mistake** — a box sized by something that knew
  nothing about it (`vh` inside a drawer; sections competing by content;
  `overflow: hidden` removing a flex item's minimum). Two more: `resize: both` is
  unusable on a corner-docked panel, and **`02` §5 was wrong** — the timeline's
  summary is readable, a sibling inside the anchor's parent, so the cascade has a
  **sixth tier** and reaches all seven views.
  → [`issues/08`](issues/08-the-drawer-and-toolbar-coexistence.md#answer)
- **`10` — the collections live in Tampermonkey's storage, and the platform pile was closed by testing it.**
  Four tickets had accumulated *"maybe an extension one day"* observations, and all of
  them rested on **one untested thing**: does a `ClipboardItem` write survive a
  `@grant`? Five runs by the user on 2026-08-18 answered it and three more besides —
  **the clipboard survives** (twice), **`GM_setValue` is synchronous**, **`bulkfetch`
  survives the sandbox**, and **the change listener crosses tabs** (`remote: true`).
  So the grant costs nothing anyone has named, and **`05`'s model transfers
  unchanged** — a substitution of two calls, not a redesign. One rule from the user
  is a scar for the ADR: **`GM_*` is synchronous, `GM.*` is promise-based, and the
  dotted form would put an `await` in the copy handler**, re-opening `04` §3's silent
  clipboard failure. `04`'s verdict stands (it never forbade a grant — it found
  nothing *needed* one), `05` §5's rejection of `navigator.locks` survives because B
  has no mirror, and `06`'s durability framing is **softened, with no format moved**:
  a collection now survives a logout but lives in one browser profile, so copy-out is
  still how data leaves — and JQL keeps its slot on utility, not on durability.
  **Candidate C — mirroring into Jira's own user properties — was designed and
  measured in full and NOT chosen**: its ceiling is **32,768 bytes, counted in bytes**
  (32,768 passed, 32,769 refused; 20,000 `€` refused at ~60 KB), `accountId` is
  mandatory, no XSRF header is needed, and a write is ~200 ms. Every hard part of it
  — two copies, the reconciliation rule, three gates, the `navigator.locks` reversal,
  the two-request cold start — was price paid to avoid a grant that turned out to be
  free. It is **preserved for reconsideration** at
  [`10a` Part 5](research/10a-storage-options.md). Neither out-of-scope entry
  graduated, but both had reasons that were now false: **Bitbucket and Confluence are
  recorded as intended future work**, blocked on DOM surveys rather than on storage.
  A bonus: **`01`'s rule 3 was re-confirmed live** under a grant — a missing key came
  back omitted, not reported.
  → [`issues/10`](issues/10-where-the-collections-live.md#answer),
  [`research/10a`](research/10a-storage-options.md) — **Part 5 is C's preserved record**

## Not yet specified

Fog toward the destination. In scope, not yet sharp enough to ticket.

_Graduated: **virtualised lists** left this list once `02` measured it, became
[`issues/09`](issues/09-what-scan-this-page-promises.md) — what "scan this page"
promises — and is now closed. It turned out not to be a technical detail, nor
quite a question about the add gesture: it was a question about what the live
list is a view **of**._

_Also graduated: **staleness of stored summaries** left this list when `05`
answered every part of it — gap-fill on drawer open, an explicit full refresh, one
failed state whose wording cannot claim deletion, and `01`'s leftover
permission-denied probe closed by [`05a` §3.5](research/05a-storage-probe.md#35-01s-leftover-probe-is-closed--one-failed-state-not-two)._

- **Grouping the live list by the page's own sections.** Deferred by `09` at the
  user's request, and the attractive version of its Q4: copy each backlog section
  header verbatim — `RDN 2607-03 (7 of 27 work items visible)` — and you get an
  honest per-list count with no parsing and no locale assumption. **Blocked on one
  probe:** the element carrying `software-backlog.card-list.container.BACKLOG` does
  **not** contain its own cards (`09a` Run 1 reported `domKeys: 0` against a header
  claiming 28 visible), so whichever element does hold a section's rows has to be
  found first. The instrument now exists — a backlog row's own container carries the
  key, `software-backlog.card-list.card.content-container.<KEY>` — and the snippet is
  written: [`09a` §4.4](research/09a-list-scope-api.md). Purely additive to `08` —
  the flat list is the safe default that remains.
- **Container testids for the description and the comment stream.** `09` decided
  each live-list row carries a coarse origin (*"from comments"*, *"from the
  description"*), and `.ak-renderer-document` renders **both**, so it cannot
  separate them. One devtools probe, and `02`'s rule holds meanwhile: never invent
  a `data-testid`. Degradation is already stated — an unidentified region means the
  link appears unlabelled.

- **Keyboard shortcuts.** `jira-ux-improvements` already owns `Alt+Shift` +
  `L/E/N/U/M/I/D/T`. **`08` bound nothing** — a day of use never wanted one, and
  the drawer's rows are ordinary buttons, so they are tabbable without a binding.
  What the Cart eventually binds, and whether the two scripts need a shared
  convention, is still open. `08` also left **keyboard reachability of the drawer
  as a whole** untested: no keyboard-only path was designed or tried.
- **Import into a collection.** Pasting a list of keys, or a JQL result, rather
  than clicking. Plausibly free once `01` and `05` land, but the shape of it is
  not visible yet.
- **Ordering and grouping inside a collection.** Manual reorder, group by epic,
  sort by key. Depends on which fields `05` decides to store.

## Out of scope

Beyond the destination. These never graduate; they would be fresh efforts.

- **Capture from Bitbucket and Confluence. — INTENDED FUTURE WORK, not a
  hypothetical.** Put to the user by `10` Q11 and **deliberately not graduated**:
  it stays outside this effort so the Cart ships for Jira first. But the reason it
  was out of scope is now **gone**, and that has to be said plainly rather than
  left misleading. The original reason was that `localStorage` is per-origin, so a
  cart could not reach Bitbucket. **`10` chose Tampermonkey storage, which is
  per-script**, so the store already reaches both. Confluence Cloud additionally
  shares the `<site>.atlassian.net` origin. **What is missing is not storage — it
  is the DOM work**: a fresh `02`-scale survey of how each site renders an issue
  reference, which does not exist for either. The user's instruction on taking the
  storage verdict: this is work we will do, after this implementation.
- **Sync across machines or browsers.** Put to the user by `10` Q11 and **not
  graduated.** The reason has changed twice and the current one is honest: `10`
  chose Tampermonkey storage, and `04` recorded that **Tampermonkey's own cloud
  sync of GM values is the first rung** — so this is plausibly one setting away
  rather than a fresh effort. **That claim has never been re-verified**, because
  Tampermonkey's documentation cannot be read (`07`, and `10a` §1.4 a second time),
  so it stays out of scope on an unverified promise rather than on a design.
  *Still true from `04`:* this is **not** the point at which a Chrome extension
  wins — `chrome.storage.sync`'s ~100KB/8KB-per-item quota is *tighter* than
  `localStorage`'s. **`10` weighed and rejected the one option that would have made
  cross-machine sync automatic** — mirroring into Jira's own server-side user
  properties — because it costs two copies of the user's data that can disagree.
  That design is measured, complete and **preserved** at
  [`10a` Part 5](research/10a-storage-options.md), with the three conditions that
  would bring it back; the first of them is this entry becoming a requirement.
- **User-editable export templates.** Deliberately deferred, and `06` settled the
  fixed menu. *Sharpened by `06`:* the map never promised a seam for templates —
  the claim lived only inside `06`'s own question — and the four formats are **not**
  instances of one template model. A fill-in-the-blanks template cannot produce
  Names' summary-less line (`[{key}] {summary}` yields `[GLX-402] ` where the
  answer is `GLX-402`), and covering the rest would need conditionals, a second
  output channel with its own escaping, and per-scope variation. So templates would
  be a **rewrite of this layer, not a configuration of it**, and the ADR must say
  so rather than claim a seam.
- **Writing `src/jira-cart.user.js`.** The destination is the spec. Building is
  the next effort.
