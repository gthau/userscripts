# 04 — Userscript or Chrome extension: the verdict

Type: grilling
Status: resolved — userscript, unconditionally (see Answer). Trip-wire table
amended 2026-08-26: a second row, from the collection drag. Verdict unchanged.
Blocked by: 01, 02 — both resolved
Parent: ../map.md

## Question

This is the question the user opened with: *can a Tampermonkey userscript carry
this, or is a Chrome extension the right tool?* The two research tickets exist
to make this answerable with evidence instead of instinct.

Weigh, using what `01` and `02` found:

1. **Reach.** Does the userscript see enough of the page and enough of the API?
   `01` settles whether summaries are obtainable; `02` settles whether issue
   references are findable. If either came back badly, does an extension
   actually do better — or would it hit the same DOM and the same API?
2. **Storage.** `localStorage` on one Atlassian origin is the agreed constraint,
   and a userscript with `@grant none` has it. Note where an extension would be
   strictly better (`chrome.storage.sync`, cross-origin) and confirm those are
   the out-of-scope wants, not the in-scope ones.
3. **The `@grant none` bargain.** The two existing scripts run in page context
   deliberately, so their `history` object is Jira's. Does anything the Cart
   needs force a `@grant`, and if so what breaks?
4. **Cost of the extension path.** A manifest, a build, loading unpacked or
   paying for store distribution, an update mechanism, and a second codebase
   next to three userscripts that all work. Be concrete rather than hand-wavy.
5. **The honest failure mode.** Name the thing that, if it goes wrong later,
   would force a move to an extension — so the ADR records the trip-wire rather
   than pretending the decision is permanent.

The output is a verdict with reasons, written to be pasted into the ADR's
context section. A verdict of "userscript, and here is what would change our
mind" is a fine answer. So is "extension" — but then the destination changes
shape and the map needs revisiting.

## Answer

**Userscript. Unconditionally — the branch this ticket was written to handle
never opened.**

The ticket hedged: *"If either came back badly, does an extension actually do
better?"* Neither came back badly. `01` proved the API answers a same-origin
`@grant none` call; `02` proved one anchor selector reaches all seven views
**and** that the summary usually sits beside the key in the DOM, demoting the
API to a fallback. There is no deficiency for an extension to remedy.

What the grilling actually produced is not the verdict — that was nearly a
formality — but the **shape of the trip-wire**. Four of the five plausible
failure modes turned out to have a *userscript* answer before they have an
extension answer. That ladder is the part worth writing down, because the
failure mode of this ADR is a future session reaching for a manifest over
something a one-word metadata change would have fixed.

### 0. Two facts the map never recorded, both settled here

- **Audience.** The user, plus tinker-minded colleagues on other teams —
  **all of whom already run Tampermonkey and already use this repo's scripts.**
  Distribution was the one input that could have flipped the verdict (a store
  extension is one click; a userscript demands Tampermonkey first). It runs the
  other way: an extension would ask existing userscript users to adopt a second
  install channel for the fourth Jira tool.
- **Browsers.** Chromium family, spread across **Chrome, Edge, Vivaldi and
  Opera**. Firefox is a nice-to-have, not a priority. One userscript covers all
  five; see §4 for what the same spread costs an extension.

### 1. Reach — the userscript sees everything, and an extension sees the same

| | Userscript, `@grant none` | Extension |
| --- | --- | --- |
| DOM | Page context. `a[href*="/browse/"]` reached **7/7 views** (`02`) | Isolated world by default; same nodes |
| API | Same-origin `fetch` on the session cookie, verified live (`01`) | Same endpoint, same cookie, same exposure |
| Page-context `history` | **Free** — the script *is* page context | Needs `world: "MAIN"` declared to get it back |

The one standing risk on the API — that cookie/session auth is **undocumented
and unsupported** by Atlassian — is a risk an extension *inherits unchanged*.
`01` said so explicitly, and it is the cleanest single refutation of the
extension case: on the ticket's own criterion, an extension "would hit the same
DOM and the same API."

Note the third row inverts the usual assumption. MV3 content scripts run in an
isolated world, so the route detector's Navigation-API-then-patched-`history`
path — which works today *because* `@grant none` puts the script in page
context — would need `world: "MAIN"` re-declared in the manifest. The extension
starts by buying back something the userscript never lost.

### 2. Storage — the constraint is met, and `sync` is not a straight upgrade

`localStorage` on one Atlassian origin is the map's standing constraint, and
`@grant none` has it outright. Where an extension is strictly better:

| Extension capability | Maps to | In scope? |
| --- | --- | --- |
| `chrome.storage.sync` | *Sync across machines or browsers* | **Out of scope**, map |
| Cross-origin storage | *Capture from Bitbucket* | **Out of scope**, map |

Both confirmed as the out-of-scope wants, exactly as the ticket asked. And the
first is not even a clean win: `chrome.storage.sync` is documented at **~100KB
total, 8KB per item, 512 items**, against `localStorage`'s ~5MB per origin. For
a store of collections that is a *tighter* ceiling, not a looser one.
(Documented figures, not tested — the Cart is nowhere near either.)

**Consequence for `05`, and it is a real one:** `@grant none` means the Cart's
store is the *origin-wide* `localStorage`, shared with `jira-ux-improvements`,
`jira-backlog-sprints`, and — per the map's own out-of-scope note — Confluence
on the same `<site>.atlassian.net`. `05` must namespace its keys under a single
prefix. This is the price of the bargain, and it is cheap, but it is not free.

### 3. The `@grant none` bargain — nothing forces a grant, after one close call

> **Amended by [`10`](10-where-the-collections-live.md#answer) on 2026-08-18. This
> ticket's verdict — userscript, unconditionally — STANDS. Only the grant changed.**
> This section found that nothing the Cart *needed* forced a grant, and said plainly
> that this is a different claim from a grant being forbidden. `10` took the other
> claim: **durability needs one**, so the Cart ships with `@grant GM_setValue` and
> friends. The bargain was worth taking while its price was unknown; `10` measured
> the price and found it is zero. **The two things this section named as the reasons
> to stay are both gone**: `09` deleted route detection outright, and a dual
> `text/plain` + `text/html` `ClipboardItem` write was **measured to survive
> Tampermonkey's sandbox**, twice. `bulkfetch` survives it too — `200`,
> `application/json`, correct shape — so §3's table below is right about every row
> and wrong only in its conclusion. **The one rule this ticket's §3 exists to
> protect is unharmed**: copy-out is still synchronous and still never awaits the
> network, because `GM_setValue` is synchronous. That is also why `GM.setValue` must
> never be used — it would re-open the exact failure described below.

Every candidate was checked against what the Cart actually needs:

| Candidate | Needs a `@grant`? |
| --- | --- |
| Collections in `localStorage` | No — plain Web Storage |
| `bulkfetch` for summaries | No — same origin, `fetch` default credentials |
| Page-context `history` for `watchRoute` | No — `@grant none` *is* how you get it |
| Cross-origin request | Not needed; the Cart never leaves the site |
| **Copy-out to the clipboard** | **The one live candidate. Closed below.** |

**The close call.** `navigator.clipboard.write` requires transient user
activation. If a copy handler had to `await bulkfetch` to fill a missing summary
before building its text, the write would land *after* a network round-trip —
inside Chromium's ~5s activation window most of the time, and never in Safari.
Intermittent, silent copy failure: precisely the bug class already recorded at
[`jira-ux-improvements.user.js:361`](../../../src/jira-ux-improvements.user.js#L361),
where a `permissions.query` gate rejected unnoticed and the copy just never
happened.

**Decision: copy-out is synchronous and never awaits the network.** It writes
what is in `localStorage` at the moment of the click, exactly as
[`jira-ux-improvements.user.js:347-359`](../../../src/jira-ux-improvements.user.js#L347-L359)
does — `buildClipboard` is synchronous there, which is why that script has never
had this problem.

Three things fall out, and `06` inherits them:

1. **The dual `text/plain` + `text/html` `ClipboardItem` write survives.** The
   obvious escape hatch, `GM_setClipboard`, does not need user activation — but
   it sets one flavour per call, which would degrade the rich-link formats.
   The grant that looked like the fix is worse than the thing it fixes.
2. **An item with no summary copies as a bare key.** Per `01`'s rule 1, a key
   alone is a valid item; the copy must not block on enrichment.
3. **Refresh is a separate, visible action**, never a hidden step inside copy.

*This does not disturb `03`.* The Cart still takes the async-aware `guard` from
`bitbucket-ux-improvements`, because it still awaits `bulkfetch` and still
awaits the clipboard write itself. Only the *ordering* is fixed here.

### 4. What the extension would actually cost — concretely

Not hand-wavy, per the ticket:

| Item | Cost |
| --- | --- |
| Manifest + MV3 service worker | A second lifecycle model with no counterpart today |
| Build step | The toolchain this repo has avoided across five scripts — and `03` weighed the same cost and refused it |
| `world: "MAIN"` | Declared purely to buy back page-context `history` (§1) |
| Install, Chrome / Vivaldi | Chrome Web Store; one-time $5 developer registration |
| Install, Edge | Its own Add-ons store, or a cross-store prompt to accept CWS |
| Install, Opera | Needs a shim addon to install from the Chrome Web Store at all |
| Install, Firefox (the nice-to-have) | A different store and a different review entirely |
| Updates | Replaces `@updateURL`/`@downloadURL` → `raw.githubusercontent.com`, which **all five scripts use today** and which costs nothing |
| Codebase | A second one, beside five userscripts that all work |

Three install stories across four Chromium browsers, against **one Tampermonkey
install that also covers the Firefox that is currently out of reach**. (Store
mechanics are documented behaviour, not tested here.)

**The steelman, stated and rejected.** The strongest case for the extension is
not reach, storage or distribution — all three came back fine. It is that an
extension brings a bundler, which would *dissolve* the helper duplication `03`
just decided to live with, and could reach Bitbucket from one codebase.
`03` anticipated this exact move: *"If `04` returned 'extension' it would bring
a bundler and dissolve the question."*

It is refused on `03`'s own measurement: **four divergences across five scripts,
zero faults**, and the one genuine defect sat in a script that had *reinvented* a
helper rather than copied one — which a bundler would not have prevented. Buying
a toolchain, a second distribution channel and a second codebase to fix a
problem that has caused no faults in five scripts is the trade to refuse. The
~90 duplicated lines are the accepted standing cost, not an unpaid debt.

### 5. The honest failure mode — a ladder, not a switch

The ticket asked for "the thing that, if it goes wrong later, would force a move
to an extension." Working the candidates produced something more useful: **most
of them do not force a move at all.**

| If this happens | The response | Extension? |
| --- | --- | --- |
| Atlassian kills cookie auth on `/rest/api/3` (`01`'s standing risk) | An API token in storage — works identically in both worlds. And `02` already demoted the API to a *fallback*, since summaries sit in the DOM | **No** |
| Atlassian tightens the page CSP so `@grant none` injection is blocked | Add any `@grant`: Tampermonkey then runs the script in its own sandbox, immune to page CSP. Cost: page-context `history` goes, so `watchRoute` degrades to its timer backstop — which **design principle 4 already tolerates by construction** | **No** |
| You want Bitbucket capture (different origin, `localStorage` cannot reach) | `@grant GM_setValue`: Tampermonkey storage is per-*script*, not per-origin, so one script matching both domains shares one store. Confluence is free either way — same origin | **No** |
| You want sync across machines | Tampermonkey's cloud sync of GM values, which also needs `@grant GM_setValue`. See §2 on why `chrome.storage.sync` is not the upgrade it looks like | **No** |
| **You want Cart UI when no Jira tab is focused** | **Nothing. A userscript only exists inside a matched tab.** | **Yes** |
| **You want to write the browser's own furniture — a bookmarks folder named after a collection, a tab group named after it** | **Nothing. A page can hand the browser a list of URLs and no more.** `chrome.bookmarks.create` and `chrome.tabGroups` each do it in one call | **Yes** |

**A SECOND ROW ARRIVED ON 2026-08-26.** The table was written with one row in it and
kept that row until now. The Cart's collection drag (ADR
§2.9.2) was asked for with four targets, and two of them — a bookmarks *folder* named after the collection, and a
tab *group* named after it — turned out to be unreachable from any web page, on
grounds that are structural rather than incidental:

- Chromium creates a bookmark folder on drop only when **the thing dragged is
  already a folder**, which needs its private bookmark format; an unrecognised
  `setData` type lands in a blob the bookmarks bar never reads.
- The bookmarks bar takes the **first** URL of a list and gives it **no name**.
  Measured — ADR appendix A.10.
- A dropped URL joins the tab group it was dropped *into*. A page cannot ask for a
  new one.

**It does not reopen the verdict, and that is the point of recording it.** The
workaround the user took — make the folder or the group by hand, then drop the
collection into it — is good enough, and the rest of the feature is fully served by
a userscript: the tab strip opens one tab per issue, Teams takes the rich list,
Notepad takes the markdown, and a Jira comment takes the link. **What has changed is
that this table is no longer a table of one hypothetical.** A third want of this
shape should be read as a pattern rather than met as a surprise, and the shape is
now nameable: **writing to the browser's own UI, as opposed to reading the page or
calling Jira.**

**So the trip-wire is exactly one thing, and it is not a technical failure —
it is a change of ambition.** A toolbar-button popup, a global hotkey that
pastes the cart into any page, a right-click "add to cart" on a Jira link seen
in Confluence or Slack: those are extension territory and nothing else is.
Confirmed with the user as **dormant** — the Cart is always opened while looking
at Jira — which is why the verdict is unconditional rather than provisional.

The ladder matters more than the trip-wire. Each of the first four rows is a
future session's plausible reason to reach for a manifest, and each has a
one-line answer that is not a manifest.

### For the ADR

Written to be pasted into `src/jira-cart.user.md`'s context section:

> **This is a userscript, and the question was settled with evidence rather
> than taste.** Two research passes preceded it. The Jira REST API answers a
> same-origin `fetch` on the session cookie under `@grant none`, verified live;
> and a single selector, `a[href*="/browse/"]`, finds issue references on every
> Jira view surveyed, with the summary usually sitting beside the key in the DOM.
> Neither came back short, so there is no deficiency for a Chrome extension to
> remedy — it would read the same DOM through an isolated world and call the
> same undocumented cookie-authenticated endpoint, inheriting that risk
> unchanged, while needing `world: "MAIN"` declared just to recover the
> page-context `history` this script gets for free.
>
> Against that it would cost a manifest, an MV3 service worker, a build step,
> three different install stories across the four Chromium browsers its users
> run, and the loss of the `@updateURL` → GitHub-raw channel every script in this
> repo already uses. Its users all run Tampermonkey and this repo's other
> scripts already, so the one argument that could have flipped this — one-click
> distribution — runs the other way.
>
> **`@grant none` therefore stands, and one rule protects it:** copy-out is
> synchronous and never awaits the network. It writes what is in `localStorage`
> at the moment of the click. Awaiting `bulkfetch` inside a copy handler would
> put the clipboard write outside its transient user activation — fine in
> Chromium most of the time, never in Safari — and the obvious escape hatch,
> `GM_setClipboard`, writes one flavour per call and would cost the dual
> `text/plain` + `text/html` write the rich formats need. An item with no summary
> copies as a bare key; refreshing is a separate, visible action.
>
> **What would change this, and what would not.** Four things that look like
> reasons to build an extension are not: if Atlassian withdraws cookie auth, an
> API token works the same in both worlds (and the API is only the summary
> *fallback*); if a stricter page CSP blocks `@grant none` injection, adding any
> `@grant` moves the script into Tampermonkey's sandbox, at the price of
> page-context `history` and a route detector that falls back to its timer; and
> both Bitbucket capture and cross-machine sync are reached with
> `@grant GM_setValue`, whose storage is per-script rather than per-origin, not
> with a manifest. **One thing genuinely would:** wanting Cart UI when no Jira
> tab is focused — a toolbar popup, a global paste hotkey, a right-click add
> from Confluence or Slack. A userscript only exists inside a matched tab. That
> want is currently dormant; if it wakes, this decision reopens and nothing else
> does.

### What this hands on

- **`05`** — namespace the `localStorage` keys under one prefix: the store is
  origin-wide and shared with `jira-ux-improvements`, `jira-backlog-sprints` and
  Confluence.
- **`06`** — copy is synchronous; a summary-less item copies as a bare key;
  refresh is its own action.
- **`03`** — unchanged and uncontradicted. The async-aware `guard` still stands.

Blocks nothing. `05`, `06`, `07`, `08` and `09` were never waiting on the
platform; they are waiting on each other.
