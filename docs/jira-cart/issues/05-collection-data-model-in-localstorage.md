# 05 — The collection data model in localStorage

Type: grilling
Status: resolved — one key, one blob; the active collection is the first in the list (see Answer)
Blocked by: 01
Parent: ../map.md
Evidence: ../research/05a-storage-probe.md Part 3 (probe run 2026-08-13)

## Question

Settle the shape of what is stored, invoking `/domain-modeling` — this is the
project's ubiquitous language for the Cart, and every other ticket names these
things.

1. **Vocabulary.** What is an *item*, a *collection*, the *active collection*,
   the *cart*? Is "cart" even a thing that exists once collections do, or is it
   just the active collection under a friendlier name? Name it once, use it
   everywhere.
2. **The stored object.** Concrete JSON, keyed under a single `localStorage`
   key in the `gt-jira-*` namespace the repo already uses. Collections, their
   items, their names, their order, and the active pointer.
3. **Item identity.** Is an item its issue key? Then a key can appear once per
   collection and adding it twice is a no-op — decide whether that no-op is
   silent or tells the user. What happens when an issue is moved and its key
   changes?
4. **The active pointer is the danger.** The ADRs in this repo are written
   against exactly this failure: two pieces of state that can disagree. An
   active-collection id pointing at a deleted collection is that bug. Either
   make it unrepresentable, or state the single place that repairs it.
5. **Cross-tab.** The `storage` event fires in other tabs on write. Decide
   whether the panel re-reads on that event, and what happens when two tabs add
   different issues within a second of each other — last-write-wins on the whole
   blob loses one of them.
6. **Which fields per item**, given what `01` says the API returns for free, and
   whether a stored summary is a snapshot or a cache.
7. **Versioning.** A `version` field and a stated rule for what happens when a
   future script version reads an older blob. Cheap now, impossible later.
8. **Ceilings.** `localStorage` is roughly 5 MB. State the practical limit in
   items and what happens at it, rather than discovering it.

## Why this blocks

`06` (copy formats) can only format fields that exist here. `08` (the drawer)
displays this model.

## Answer

**One `localStorage` key holds one JSON object. A collection is a named array of
items, the active collection is the first one in that array, and an item is an
issue key with an optional summary. Every value that could have disagreed with
another value was removed rather than repaired.**

Evidence: [`research/05a-storage-probe.md`](../research/05a-storage-probe.md)
Part 3, run on `dalet.atlassian.net` 2026-08-13 — it settled the storage wrapper,
the quota, the cross-tab event and the failed-summary states, and closed `01`'s
leftover probe. No web fetches were spent; the 4-fetch cap went unused.

### 1. The words

Half of this ticket's job. `06`, `07` and `08` all write about these things, and
two of the words were genuinely ambiguous before this session.

| Term | What it names |
| --- | --- |
| **the cart userscript** | the script being built — `src/jira-cart.user.js` |
| **the Cart** | the UI it adds to Jira: the badge and the drawer |
| **collection** | a named list of items. *Amazon's wishlist* |
| **the active collection** | the one adds go to; the first in the list. *Amazon's cart* |
| **item** | a stored issue: a key, plus what we know about it |
| **link** / **row** | an `<a href="/browse/KEY">` drawn on the page, mirrored in the live list. Transient — never an item until a click makes it one |

Three readings of "cart" were live across the map and the tickets: the script, a
container of collections, and a UI string (`04`'s imagined *"add to cart"*). The
user settled it: *"the actual userscript we are building … is really the 'cart
userscript'. Then the Cart is actually additional UI we add to Jira that shows the
active collection and the other collections, plus an area which displays the links
currently on page."* And the analogy that fixes the rest: *"our Collections are
like Amazon's wishlists, our active collection is like Amazon's cart."*

**One trap is nailed shut deliberately: the analogy is for intuition, not for
vocabulary.** "Cart" never becomes a bare synonym for the active collection —
otherwise `09`'s phrase *"the cart's active collection"* stops parsing. When we
mean the one that adds go to, we write **the active collection**.

**Nothing in `01`–`04` or `09` needs rewriting.** A grep of every occurrence of the
word before deciding showed that nearly all of them — *"the Cart must diff returned
keys"*, *"the Cart copies the helpers"*, *"the Cart's audience"* — mean the script
or the product, which the settled reading covers.

### 2. The stored object

> **Amended by [`10`](10-where-the-collections-live.md#answer) — the store moved,
> the model did not.** The collections live in **Tampermonkey's storage** under a
> `@grant`, not in `localStorage`. **Everything in this ticket survives intact**:
> one key, one blob, `collections[0]` is active, `collections` is never empty, every
> write is a read-modify-write, the summary is a snapshot. The change is two calls —
> `localStorage.getItem`/`setItem` → **`GM_getValue`/`GM_setValue`** — and it is
> only that small because `GM_setValue` was **measured to be synchronous**. **Use
> the `GM_*` forms, never the `GM.*` forms**: the dotted ones are promise-based and
> would put an `await` in the copy handler, re-opening `04` §3's silent clipboard
> failure. Three riders: §5's `storage` event becomes
> **`GM_addValueChangeListener`** (which fires with `remote: false` for the tab's
> own write, so a tab no longer infers its own write from silence); **§5's rejection
> of `navigator.locks` STANDS**, because there is no mirror and no network write to
> serialise; and **§8 keeps its conclusion while losing its number** — the 5 MB
> origin quota and the ~10,000-item headroom no longer apply, and the new ceiling is
> unmeasured because Tampermonkey's documentation cannot be read.

**Key: `gt-jira-cart.collections`.** One JSON object, one write, one read.

```json
{
  "v": 1,
  "collections": [
    {
      "id": "0f3a1c7e-6b21-4a55-9f0c-3d2e7b104a8e",
      "name": "Sprint review 2608-01",
      "items": [
        { "key": "RDC-14817", "summary": "Outline inside the edited field", "issueId": "1420631" },
        { "key": "RDC-23716", "summary": "Rundown grid does not refresh after a move" },
        { "key": "GLX-402" }
      ]
    },
    {
      "id": "9c22b0d4-1f8e-4c33-b7a1-52c9d6e0f411",
      "name": "Blocked on QA",
      "items": []
    }
  ]
}
```

Two further keys exist and neither holds state that must agree with this one:
`gt-jira-cart.collections.bak`, written once per version upgrade and never read by
the script (§7), and `gt-jira-cart.prefs`, **reserved** for whatever `06` and `08`
need. The user's data and the UI's settings are different kinds of state — the
distinction [`jira-ux-improvements.user.md` §2.8](../../../src/jira-ux-improvements.user.md)
already draws between the collapse and the lock — and separating them means a
malformed preference can never take a collection with it.

Three shape choices, each with the alternative it beat:

- **One key, not one key per collection.** Per-collection keys would narrow the
  cross-tab conflict window, but they need an index key for membership and order,
  and an index that can disagree with the keys beside it is the exact bug
  [`jira-backlog-sprints.user.md` §2.7](../../../src/jira-backlog-sprints.user.md)
  was rewritten to remove. §5 gets a better answer than key-splitting anyway.
- **`collections` is an array, and its order *is* the order.** A map keyed by id
  would need a separate order list — same disagreement.
- **`items` is an array, not a map keyed by issue key.** A map would make "a key
  appears once" unrepresentable, which is tempting, but §3's no-op-on-duplicate
  makes the add path do the lookup regardless, so the map buys nothing the code is
  not already doing — and the map's *ordering inside a collection* fog wants arrays.

Details settled by implication, recorded so a build session does not re-decide
them: a collection's `id` is opaque, generated once with `crypto.randomUUID()`, and
**never derived from the name**, so renaming is free; adds append to the end of
`items`; the item's Jira id is named **`issueId`** rather than `id` precisely so it
cannot be confused with the collection's own.

### 3. Item identity, duplicates, and the moved issue

**Identity is the issue key, uppercased, scoped to its collection.** The same key
in two collections is two items, always allowed — wishlists overlap. Uppercasing is
free safety: `/browse/` keys already are.

**Adding a key already in the active collection is an idempotent no-op, and the UI
shows it rather than announces it.** No toast, no "already added" dialogue, and
above all no stored flag. Whether a link is already collected is derivable at all
times, so a live-list row renders as already-collected. That is this repo's
label-carries-the-state convention
([`jira-backlog-sprints.user.md` §2.7](../../../src/jira-backlog-sprints.user.md)).

> **Amended by [`07`](07-the-direct-add-gesture.md#answer) §5 — one clause, and
> only one.** This section originally ended *"clicking it again changes nothing …
> and it lands on `07`'s gesture identically"*. It does not. **The affordance is a
> toggle: it adds an uncollected link and removes a collected one.** A stateful
> button that does nothing when clicked is a dead control, and it reads the
> label-carries-the-state convention backwards — `jira-ux`'s 🔒 means *click to
> unlock*, not *this button is decorative*. Everything else here stands: identity
> is still the key, a key still appears at most once per collection, an add is
> still idempotent, and nothing about it is stored.

**A moved issue keeps its numeric id and loses its key**, and that is what
`issueId` is for. It is stored **only when a fetch happens to return it** (§6), and
it earns its place on refresh: a refresh sends the id where known and the key where
not, and the response carries both — so from the second refresh onward, an item
whose issue moved project repairs its own key silently. Two riders:

- `01` rule 3 — diff requested against returned — is then done on **whatever was
  sent**. A refresh keyed by id that diffed on keys would read every renamed issue
  as absent.
- If a repaired key collides with one already in the collection, the two items
  merge into one.

Without `issueId` the item simply keeps a dead key. `/browse/OLD-KEY` very probably
still redirects, but that is **unverified** — see *What was not settled*.

### 4. The active pointer — there is not one

**The active collection is `collections[0]`.** Activating a collection moves it to
the front. There is no `activeId`, so no id can dangle, and no delete path has to
remember to fix anything: deleting the active collection promotes the next by
construction.

This is the move both existing ADRs already made.
[`jira-backlog-sprints.user.md` §2.7](../../../src/jira-backlog-sprints.user.md)
deleted its `enabled` flag because *"two values then gave the same condition, and
they could disagree"*. Design principle 1 is satisfied by the shape rather than by
a repair site, which is what the ticket asked for first.

**Paired with a second invariant: `collections` is never empty.** First run writes
one collection; deleting the last one empties its items rather than removing it.
Together these make *the active collection* total — it always resolves, so no code
path anywhere handles "no active collection". The default collection's name is
`08`'s to pick.

**The cost, accepted knowingly:** collection order is most-recently-activated, the
drawer's list reshuffles when you switch, and a hand-chosen order of collections is
not expressible. At a handful of collections the one you are working in sits at the
top, where the drawer wants it. The alternative — `activeId` clamped in the parse
function, the single repair site — was offered and declined.

### 5. Cross-tab

The probe settled the mechanism and its hazard together
([`05a` §3.4](../research/05a-storage-probe.md#34-q5--the-event-works-and-it-is-extremely-noisy)):
the `storage` event does fire across tabs, its `storageArea` **is** a native
`Storage` despite Atlassian's wrapper, and an idle Jira tab caught **~100 events in
a couple of seconds** — `__storage_test__`, `awc.storage.support`,
`__storejs__test__`, `__test_<ts>__`, `statsig.session_id.*` on a timer.

**Correctness lives in one rule: every write is a read-modify-write against
`localStorage`, never against an in-memory copy.** The tab re-reads the blob,
applies the change, and writes.

The reason is **staleness, not races** — the ticket's framing of "two tabs within a
second" is not reachable by one person with one mouse, and the user said so. The
reachable bug is minutes or hours wide: a tab opened this morning holds a stale
copy, eleven items are added in another tab, and one add from the old tab would
write all eleven away. Read-modify-write closes that completely, because a tab
cannot destroy what it never read.

**With correctness settled there, the notification is only a freshness
optimisation**, and four rules follow:

1. **Filter by key on the handler's first line.** `e.key === null` (a `clear()`)
   counts as a change; anything else that is not `gt-jira-cart.collections` returns
   immediately. Our key changes only when a cart tab writes it, so no debounce is
   needed — the filter turns Jira's noise into nothing.
2. **Re-read storage; ignore `e.newValue`.** One path: *event → load → render*. The
   same load the drawer uses. `e.newValue` never becomes a second way in.
3. **Re-read when the drawer opens.**
4. **Re-read when the tab becomes visible**, guarded by comparing the raw string to
   the last one parsed, so an unchanged blob costs a string comparison.

The writing tab receives no event of its own, so `save()` calls `render()`.

**Rejected, and both worth recording:**

- **`navigator.locks`** would make the read-modify-write atomic across tabs. It
  works under `@grant none`. Rejected as disproportionate: it makes every write
  async to close a window of microseconds.
- **`BroadcastChannel`**, raised by the user as the better notification. The
  `storage` event won on two grounds: it is emitted *because the write happened*,
  so it cannot be forgotten by a writer — including a Jira tab still running an
  older build of the cart userscript — whereas a broadcast is a second signal that
  must be kept in agreement with the write; and it is **measured on this origin**
  while `BroadcastChannel` is not, which matters more here than elsewhere because
  Atlassian demonstrably replaces platform globals ([`05a` §3.1](../research/05a-storage-probe.md#31-the-wrapper-is-a-passthrough--confirmed-by-part-d-rather-than-by-a06)).
  It remains the right tool for cross-tab messages that are **not** writes — "flash
  this item", "tab A opened the drawer" — which `08` may want, beside the storage
  event rather than instead of it.

### 6. Which fields, and snapshot rather than cache

```json
{ "key": "RDC-14817", "summary": "Outline inside the edited field", "issueId": "1420631" }
```

**`key` is mandatory; `summary` and `issueId` are optional. That is the whole
item.** An item is valid with a key alone (`01` rule 1), and the summary comes from
the DOM beside the key at add time (`02` §5, made load-bearing by `09`), so an add
never waits on the network.

**The three states are derived, not stored.** A `summary` is present or it is not.
**The failed state is not stored at all**: it is the result of the last attempt,
not a property of the item — an issue unreadable this morning may be readable this
afternoon, and a stored `failed: true` is precisely a flag that can disagree with
the world. "Cannot read this item" is a transient annotation on the row for the
current session, the same treatment `09` §7 gave the live list's origin.

**The wording of that state is fixed by evidence, not taste.**
`GET /rest/api/3/issue/RDC-9999999` returns **404** with *"Issue does not exist or
you do not have permission to see it."*, and `bulkfetch` is quieter still — `200`,
`issues: []`, `issueErrors: []`
([`05a` §3.5](../research/05a-storage-probe.md#35-01s-leftover-probe-is-closed--one-failed-state-not-two)).
Atlassian conflates absent and forbidden deliberately, so **there is one failed
state, not two**, and the UI may never say "deleted".

**The stored summary is a snapshot, not a cache.** Two triggers change it, and no
others:

| Trigger | What it fetches | When |
| --- | --- | --- |
| **Gap-fill** | only items with **no** summary | automatically, one `bulkfetch`, when the drawer opens |
| **Full refresh** | the whole collection | only when the user asks |

Gap-fill is exactly the fallback role `02` §5 and `09` assigned the API: on most
opens it fetches nothing, because the DOM supplied the summary. A full refresh
stays deliberate — one request per ≤100 keys (`01` rule 4), so it is cheap, but not
something the drawer does behind you. Neither is ever in the copy path: copy-out is
synchronous and writes what is stored (`04`).

**Not stored, each for a reason:**

- **`status` and `issuetype`** — free in a `bulkfetch` (`01` §6) but *not*
  uniformly free from the DOM, so items added by the direct gesture would lack what
  refreshed ones carried, and the drawer would display inconsistently item to item.
  Status also goes stale fastest, and a stale status shown as current is the
  "wrong number in the UI" failure `09` §4/5 already ruled worse than no number.
- **`addedAt`** — array order already carries insertion order. It becomes
  non-redundant only if manual reorder ever lands.
- **`fetchedAt`** — implies a per-item freshness display we cannot honestly
  maintain.

**And each is cheap to reverse**: all three are additive optional fields, which §7's
rule adds with no migration. `06` may come back and ask for `issuetype`.

### 7. Versioning

**`"v": 1` at the root, and nowhere else.** It is bumped **only** when an existing
field changes shape or meaning; **adding an optional field never bumps it**,
otherwise `06` asking for one field becomes a migration and the reversibility
claimed above evaporates.

**Migration is lazy and lives in the load path** — the single place §4 and §5
already funnel every read through. An old blob is migrated in memory on read and
persisted on the next real write, so nothing is rewritten merely because you looked
at it and a migration bug cannot destroy data before you have done anything.

| What the key holds | What the cart userscript does |
| --- | --- |
| **Nothing** (absent) | First run. Create the default collection and carry on |
| **`v` ≤ what this build knows** | Migrate in memory, use it, persist on the next write |
| **`v` > what this build knows** | **Read what it can and refuse to write.** Badge and drawer still show the collections; adds are declined with a visible reason. An old build writing a newer blob back would silently drop what it did not understand |
| **Present but unparseable** | **Do not overwrite it.** The Cart starts empty and says the stored data could not be read |

**That last row departs from this repo's convention on purpose.**
[`jira-ux-improvements.user.js:135-138`](../../../src/jira-ux-improvements.user.js#L135-L138)
and [`jira-backlog-sprints.user.js:231-235`](../../../src/jira-backlog-sprints.user.js#L231-L235)
both catch a parse failure and fall back to defaults — correct there, because a
preference is regenerated by clicking a checkbox. **A collection is not.** It is
the user's data, so an unreadable blob is preserved for manual recovery from
devtools rather than quietly replaced with `{}`. Same reasoning as §2.8's
separation of the lock from the collapse, applied to a different pair.

**Before the first write under a new `v`, the old value is copied to
`gt-jira-cart.collections.bak`** — written once per upgrade, never read by the
script, inert, so it introduces no second value that must agree with anything. At
the expected scale it is a few kilobytes. It exists so that a bad migration is
recoverable by hand.

### 8. Ceilings — the Cart is not what fills this quota

| | Chars | As UTF-16 |
| --- | --- | --- |
| Jira's own usage, 629 keys | 1,347 K | ~2.63 MB |
| — of which `quick-find-recent-activities` | 977 K | ~1.91 MB |
| Cart at 1,000 items | 117 K | ~0.23 MB |

Against a ~5 MB origin quota, Jira already holds about half, and one *recent
activity* cache that grows with use is 72% of Jira's share
([`05a` §3.3](../research/05a-storage-probe.md#33-q8--the-ceiling-and-the-hazard-is-jiras-growth-not-the-carts)).
Headroom is ~2.4 MB ≈ 10,000 items — a number that appears here only to show the
question is closed.

**The real scale is smaller and it changes the framing.** The user's expected use:
*"collect items in a collection as one tries to send an email status report … max
20 to 50 items, and maybe a few collections."* That is ~6 K chars, 0.01 MB. So:
**no cap, no warning threshold, no soft limit.**

**A collection is working state, not an archive** — and the reason is the user's:
`localStorage` *"is deleted on logout or browser history cleanup, it's not durable
enough to build huge collections"*. The collection exists to be emptied into
something else. **Copy-out is the durable artifact; the collection is the staging
area.** The map's *Storage* row has been amended to say so.

**But `setItem` can still throw, because of Jira's growth rather than ours**, and
that is a write failing mid-add. Four rules:

1. **The write is the commit.** The read-modify-write mutates a copy; only a
   successful `setItem` makes it real. Nothing in memory is updated first — which
   is what makes design principle 4 true here rather than aspirational: on a throw,
   storage still holds the previous collection, whole.
2. **On any write failure, re-render from storage and say so**, naming the real
   cause — this site's browser storage is full — rather than implying the
   collection is too big. One catch, one path; `QuotaExceededError` is not
   special-cased.
3. **Read-only still copies.** `04` made copy-out synchronous and storage-only, so
   a Cart that cannot write can still get the data out. That is what the message
   should point at: copy out, then delete items.
4. **`bulkfetch` chunks at ≤100 keys**, so a larger collection refreshes in ⌈n/100⌉
   requests. At 50 items it never fires twice.

`navigator.storage.estimate()` is **not** used: it reports the origin's whole
storage budget rather than the `localStorage` cap, so it would report gigabytes of
headroom with a 5 MB wall one item away.

### Recorded for a future platform review — not acted on

`04` settled userscript-over-extension and recorded one trip-wire ("Cart UI when no
Jira tab is focused"). This session surfaced two more observations of the same
kind, both raised by the user, and the map's *Platform* row now names them:

- **The Cart exists once per tab.** N copies of the same collection must be kept in
  agreement, and their freshness rests on notifications a frozen or discarded tab
  may never receive. An extension's UI exists once per window and is not tied to a
  Jira tab, so the problem mostly evaporates rather than being solved.
- **`localStorage` does not survive a logout or a history cleanup.** An extension's
  own storage does.

Neither changes the verdict now. The user's words: *"that ultimately might bring me
to make this 'cart' thing a browser extension rather than a userscript. But not
now."*

### What was not settled

1. **Whether `/browse/OLD-KEY` still redirects after a project move.** Unverified —
   this prompt's 4-fetch cap was reserved for a quota fact. Nothing depends on it:
   without `issueId` the item keeps a dead key and, if a refresh comes back short,
   shows the single failed state.
2. **Whether a frozen or discarded tab receives a `storage` event on waking.**
   Unverified, and deliberately not depended on — §5's re-read on visible and on
   drawer open covers it. `BroadcastChannel` has the same exposure, so the question
   does not separate the two mechanisms.
3. **`BroadcastChannel` is untested on `atlassian.net`.** It was rejected partly
   for that reason, so the gap is consistent with the decision, not hidden by it.
4. **The 100-keys-per-`bulkfetch` cap remains reported, not tested** (`01` §3).
   Unchanged, and at 20–50 items unreachable.
5. **Permission-denied was never observed with a real forbidden key** — `05a`'s
   `HIDDEN_KEY` was left blank because the user could not find one on a site where
   browse access is wide. The conclusion survives regardless: the 404 message
   conflates absent and forbidden *in its own text*, so one failed state is correct
   under either outcome ([`05a` §3.5](../research/05a-storage-probe.md#35-01s-leftover-probe-is-closed--one-failed-state-not-two)).
   `01`'s leftover probe is **closed**.
6. **Whether collection names must be unique.** Identity is the `id`, so duplicates
   are representable. Whether the UI should prevent or merely tolerate two
   collections called "Sprint review" is `08`'s.

### What this hands on

- **`06` (copy formats).** You may format `key`, `summary` and a URL derived from
  the key — nothing else exists. A summary-less item copies as a bare key (`04`).
  Copy is synchronous and reads storage, so a stored summary must be sufficient on
  its own. And the framing that should lead `06`: the collection is a staging area
  and **copy-out is where the data becomes durable**, because a logout clears
  `localStorage`. If `06` needs `issuetype`, it is an additive optional field and
  costs no migration (§7).
- **`07` (the direct gesture).** An add is: read-modify-write, append to
  `collections[0].items`, render. It never waits on the network — the summary comes
  from the DOM beside the link (`02` §5). Adding a key already present is an
  idempotent no-op that the gesture must *show*, not announce (§3), so the gesture
  needs to be able to render an already-collected state. Do not store the row's
  origin (`09` §7).
- **`08` (the drawer).** It displays this model and owns everything this ticket
  refused: the default collection's name, whether duplicate collection names are
  prevented, how already-collected renders, the wording of the "cannot read this
  item" state, and the wording of a full-storage failure. Three behaviours are
  fixed here, not `08`'s to revisit: gap-fill fires on drawer open; the drawer
  re-reads on open and on tab-visible; and the badge counts the active collection,
  which is `collections[0]`.
- **The map.** Five constraint rows amended — *Storage*, *Collection shape*,
  *Item data*, *Panel UI*, *Platform* — and the *staleness of stored summaries*
  entry graduated out of *Not yet specified*, since the refresh policy, the single
  failed state and `01`'s leftover probe are all now closed.
