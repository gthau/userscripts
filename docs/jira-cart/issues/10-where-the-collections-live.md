# 10 — Where the collections live: `localStorage`, Tampermonkey storage, or Jira's own user properties

Type: research, then grilling
Status: resolved — Tampermonkey storage under a `@grant`; the clipboard survives
it, and `05`'s model transfers unchanged (see Answer)
Blocked by: — (`04`, `05` and `06` are closed and are the inputs)
Parent: ../map.md
Opened: 2026-08-18, after the map went complete, on the user's initiative

## Why this exists at all

`04` settled the platform and `05` settled the store, both with evidence, and the
ADR could be written today from what they say. This ticket exists because **a
third option was never on the table** when either of them ran: Jira's own
per-user property storage, reachable from the page with the session cookie the
Cart already uses.

That matters because the current answer has a limit the design leans on rather
than merely tolerates. `05` §8, in the user's own words: `localStorage` *"is
deleted on logout or browser history cleanup, it's not durable enough to build
huge collections"*. From that came the framing that shapes `06` — a collection is
**working state** and **copy-out is the durable artifact** — and from that came
JQL's place in the format menu. If the store becomes durable, that chain is worth
re-examining rather than inheriting.

Two entries the map currently calls **out of scope** are also in play, and the
map's rule is that out-of-scope entries never graduate quietly:

- **Sync across machines** — out of scope, and `04` recorded that this is *not*
  the point where a Chrome extension wins, because `chrome.storage.sync`'s quota
  is tighter than `localStorage`'s. Server-side user properties would be a third
  answer nobody weighed.
- **Capture from Bitbucket** — out of scope because `localStorage` is per-origin.
  Tampermonkey storage is per-script, which `04` already noted would reach it.

## The three candidates

| | A. `localStorage` (today) | B. Tampermonkey storage | C. `localStorage` + Jira user properties |
| --- | --- | --- | --- |
| Grant | `@grant none` | `@grant GM_setValue` + friends | `@grant none` |
| Survives logout | **No** | Yes | Yes |
| Survives history cleanup | **No** | Yes | Yes |
| Another machine / browser | No | Only via TM cloud sync | **Yes, inherently** |
| Reaches Bitbucket | No | Yes | No — it is a Jira API |
| Write is synchronous | Yes | To establish | **No.** A network round trip |
| Values that can disagree | None (`05` §4) | None | **Two copies.** The crux |

**C is a combination for one reason: `05` and `09` made the add path synchronous
and `04` made copy-out synchronous.** A network write cannot sit in either. So C
keeps `localStorage` as the working copy the UI reads and writes, and treats the
user property as a durable mirror written behind the interaction. That buys
durability at the price of the exact thing `05` spent a whole session deleting —
**two values that can disagree** — which is why the reconciliation rule, not the
API, is this ticket's hardest question.

## Question

### Part 1 — the facts, from Atlassian's own documentation

1. **`/rest/api/3/user/properties/{propertyKey}`.** Establish the exact paths and
   verbs for reading, writing, listing and deleting a property for the *current*
   user, and whether a call must name an `accountId` or defaults to the caller.
2. **The size ceiling.** There is a documented limit on a property value.
   Establish it exactly, and state what the Cart's realistic blob measures against
   it — `05a` measured 20–50 items at ~6 K chars and 1,000 items at ~117 K chars.
   If the limit lands between those, say which collection sizes are expressible.
3. **Auth for a state-changing call from the page.** `01` proved a same-origin
   `GET` and a `POST` (`bulkfetch`) both work on the session cookie under
   `@grant none`. A `PUT` that mutates is a different question: establish whether
   it needs an XSRF header (`X-Atlassian-Token: no-check` or otherwise), and what
   is returned when it is refused. `01`'s standing rule applies — a logged-out
   call can return **200 with login-page HTML**, so validate `ok` +
   content-type + shape before trusting anything.
4. **Rate limits, and who else can read it.** Whether user properties are
   throttled differently from the rest of the API, and whether a Jira
   administrator can read another user's properties. A collection's *names* are
   the user's own words; the keys are not sensitive but the names might be.
5. **Tampermonkey's storage API**, for candidate B: whether `GM_setValue` is
   synchronous, what `GM_addValueChangeListener` gives across tabs compared to the
   `storage` event, and any documented size limit. If Tampermonkey's own
   documentation cannot be read, record it as unavailable — `07` already hit that
   page rendering client-side and returning only its table of contents.

### Part 2 — the one experiment that has been waiting since `06`

6. **Does a `ClipboardItem` write still work under a `@grant`?** `06` recorded
   this as the platform pile's first testable question, and `08` added nothing to
   it. `04` gave two reasons to hold `@grant none`; `09` deleted one of them by
   dropping route detection, so **the clipboard is the only reason left**. If the
   write survives the sandbox, candidate B costs nothing that anyone has named.
   If it does not, B is dead and the choice is A or C.

### Part 3 — the decision

7. **The reconciliation rule for C, and it decides whether C is viable at all.**
   Two copies exist, so name what happens when they differ: which wins, on what
   evidence, and at what moment. A version counter? A timestamp, and whose clock?
   Last-write-wins on the whole blob — which is precisely the *"stale tab writes
   away eleven items"* bug `05` §5 closed, now stretched across machines rather
   than tabs? If the honest answer is that no rule is simple enough to be
   trustworthy, **say so and reject C**; a durable store that silently loses a
   morning's collecting is worse than a volatile one that never lies.
8. **When does C write?** Debounced after a change, on drawer close, on
   `visibilitychange`, on a schedule? Each has a failure mode: a debounce loses
   the last edit if the tab dies, and a write per add puts the Cart on the network
   during the interaction `05` made synchronous on purpose.
9. **What does C do offline, or when the write fails?** `05` §8 rule 1 says the
   write is the commit and the previous collection survives whole. C has two
   writes and only one of them is local.
10. **Does the durability change ripple into `06`?** If a collection survives a
    logout, is it still "working state, and copy-out is the artifact"? JQL earned
    its place in the format menu on that framing. Re-examine, and either confirm
    the framing or say plainly what changes.
11. **And the out-of-scope entries.** If C works, cross-machine sync stops being a
    fresh effort and becomes a property of the store. If B works, Bitbucket does.
    The map's rule is that neither may graduate quietly: put each to the user as
    its own decision.

## What this may amend

- **The map's *Storage* row**, which currently fixes `localStorage`, one key, and
  `@grant none`.
- **The map's *Platform* row**, which carries four observations recorded for
  exactly this review.
- **`04`'s verdict**, if a grant turns out to be free. `04` did not say a grant is
  forbidden — it said nothing the Cart needed forced one. That is a different
  claim, and this ticket tests it directly.
- **`05` §5 and §8**, if a second copy exists.
- **`06`'s framing**, per question 10.
- **Two out-of-scope entries**, per question 11.

Nothing here reopens `01`, `02`, `03`, `07`, `08` or `09`: the detector, the
gesture, the drawer and the mirror rule are all indifferent to where the bytes
live.

## Why this blocks

**It blocks the ADR, and that is the point of opening it now.** The spec's
Storage section, its platform section and part of its copy-out rationale all rest
on the current answer. Writing them, then rewriting them, would spend the one
thing nine tickets bought — that a build session opens no decision.

## Answer

**Candidate B. The collections live in Tampermonkey's own storage, under a
`@grant`. `05`'s data model transfers unchanged — `GM_setValue` is synchronous, so
read-modify-write stays synchronous and copy-out stays inside its user activation.
This is a substitution of two function calls, `localStorage.getItem`/`setItem` for
`GM_getValue`/`GM_setValue`, not a redesign.**

**Four tickets accumulated suspicion about taking a `@grant`, and all of it rested
on one thing nobody had tested: the clipboard. It works.**

**Candidate C — `localStorage` mirrored into Jira's own user properties — was
designed in full and measured in full, and was not chosen. It is preserved at
[`10a` Part 5](../research/10a-storage-options.md) with every measured number, the
design that already exists, and the three conditions that would bring it back.**

Evidence: [`research/10a-storage-options.md`](../research/10a-storage-options.md).
Six of eight fetches spent. **Five runs by the user on 2026-08-18** — one aborted on
a bug in the snippet, four clean. Three of the five documentation questions could
not be read at all and are recorded as unread rather than guessed; the runs answered
every one of them anyway, which is the argument for measuring over reading.

**How to read what follows.** §1–§3 were written before the verdict and are the
record of candidate C: §1 is what Atlassian's documentation gives up, §2 is the
three-way comparison as it stood while B was unknown, and §3 is C's full design.
**They are superseded on the choice and sound on the facts**, and they stay because
the user asked that this research survive for a future reconsideration. §5 is the
verdict and is what binds.

### 1. What the documentation actually settled

| Fact | Value | Source |
| --- | --- | --- |
| Max property **value** | **32768 bytes** | [entity properties](https://developer.atlassian.com/cloud/jira/platform/jira-entity-properties/), stated again on the user-properties group page |
| Max property **key** | 255 bytes | same |
| Users carry properties | Yes | same page lists the entity types |
| **A Jira admin can read another user's properties** | Yes, with *Administer Jira* global permission | user-properties group page |
| Throttling | `429`, `Retry-After`, `X-RateLimit-*` | [rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/) |

Two of these change the decision rather than decorate it.

**The ceiling is small, and it is the first hard limit this design has met.**
`05a` §3.3 measured ~118 chars per item, so one property holds **about 277 items**.
`localStorage` had ~2.4 MB of headroom, ≈10,000 items, which is why `05` §8 could
write *"no cap, no warning threshold, no soft limit"*. That sentence does not carry
across. It is the reason §3 splits the mirror per collection.

**The names are administrator-readable.** Issue keys are not sensitive and
`Blocked on QA` is not either. A collection is named in the user's own words, and
those words would sit somewhere their Jira administrator can read on request. This
is a real difference from `localStorage`, which no administrator can read remotely,
and it is stated here so the choice is made with it rather than despite it.

**What could not be read:** whether `accountId` is required or defaults to the
caller; whether a mutating `PUT` needs `X-Atlassian-Token: no-check` — `01` §2 sent
that header on its `POST` and **never isolated whether it was required**, so this
is genuinely open; and everything about Tampermonkey's storage, because
`tampermonkey.net/documentation.php` is table-of-contents only. That is the
**second** independent confirmation of `07`'s finding on that page.

### 2. The three candidates, on what was established rather than hoped

| | A. `localStorage` | B. Tampermonkey storage | C. `localStorage` + user properties |
| --- | --- | --- | --- |
| Grant | `@grant none` | `@grant GM_setValue` | `@grant none` |
| Survives logout | No | Yes | Yes, if the last reconcile ran |
| Another machine | No | Only via TM cloud sync | Yes |
| Reaches Bitbucket | No | Yes | No |
| Size headroom | ~10,000 items (`05a`) | **Unknown — undocumented, unreadable** | **277 items per collection** |
| Readable by an admin | No | No | **Yes** |
| Values that can disagree | None (`05` §4) | None | Two copies, reconciled by §3 |
| **Status** | Works today | **Blocked on the clipboard probe** | **Blocked on the round-trip snippet** |

**B is not rejected and not adopted — it is unknown.** Its whole case rests on one
experiment that has been outstanding since `06`: does a `ClipboardItem` write
survive a `@grant`? `04` gave two reasons to hold `@grant none`, and `09` deleted
one of them by dropping route detection, so the clipboard is the only reason left.
The probe is written and handed over. **`04` did not forbid a grant** — it found
that nothing the Cart needed forced one, which is a different claim.

**One variant nobody has costed**, surfaced during the grilling and left open: if
the clipboard survives, `@grant GM_setValue` could replace `localStorage` as the
*local* store while the property mirror stays on top. Still two stores, not three.
The local one would then survive a logout by itself, the mirror would be needed
only for crossing machines, and Bitbucket would come free. Its own decision, after
the run.

### 3. C's design, settled by grilling on 2026-08-18

Five decisions, each put to the user with a recommendation and each answered.

**3.1 The reconciliation rule — fast-forward only, on a counter, with no clocks.**
The user's correction reframed this: **one person has one pair of hands**, so there
are no concurrent writes and C needs no locking of the data, no clock comparison,
no merge and no CRDT. That is `05` §5's own argument — *"two tabs within a second is
not reachable by one person with one mouse"* — carried across machines intact.

What survives the correction is that **a machine can act when the user cannot**:
a desktop closed mid-debounce wakes and flushes a stale write; or it holds three
items it never pushed while the laptop pushed five. So the rule is `05`'s sentence
with one word changed — *a tab cannot destroy what it never read* becomes **a
machine may not push a blob whose base it never read**. On true divergence the
mirror **stops and asks**, offering *keep this machine's* or *take the other's*.
It never merges and never silently overwrites.

Rejected: **last-write-wins**, and one pair of hands does not rescue it. What
kills it is not the concurrent case but the stale machine waking up — a whole-blob
overwrite cannot tell *I am newer* from *I never saw yours*, which is exactly the
*stale tab writes away eleven items* bug `05` §5 closed.

**3.2 The mirror is one idempotent reconcile, not a queue of writes.** Given local
state and remote state it does the one right thing; if it never ran, the next
trigger does it. This is design principle 2's shape — *one idempotent `render`;
only it writes* — applied to a second store, and it is what deletes the offline
queue the ticket expected C to need. Design principle 4 then holds by
construction: if the mirror breaks entirely, what remains is `localStorage`,
exactly the Cart that exists today.

**3.3 Triggers, and the three gates that make tens of tabs survivable.** The user
raised the case that broke the first answer: **tens of Jira tabs is a frequent
workflow**, and every tab switch fires `hidden` on one and `visible` on another.
Ungated, that is hundreds of GET+PUT pairs a day, and worse, tab A's PUT can land
after tab B's GET so B reports a divergence that never happened — the tabs race
each other even though the user does not.

| | When |
| --- | --- |
| **Pull** | the key is absent at load (**this is the logout recovery**, and *absent* is distinguishable from *emptied* because `collections` is never an empty array — `05` §4); the drawer opens; the tab becomes visible |
| **Push** | debounced a few seconds after a change; on tab hidden; on the `online` event |
| **Never** | in the add path, and never in the copy path (`05`, `09`, `04`) |

Three gates:

1. **A push does nothing unless local differs from the last-agreed copy.** Tab
   switching without collecting costs **zero requests**.
2. **A pull is gated by a shared `lastPulledAt` staleness window.** With one pair
   of hands the remote cannot move while the user is sitting at this machine —
   only another machine writes, and they are not at it. So a tab becoming visible
   need not ask the server; only a machine that has been away must.
3. **The whole reconcile runs inside `navigator.locks`.**

**3.3a That third gate reverses a closed decision, and the reversal was put to the
user as its own decision.** `05` §5 rejected `navigator.locks` as disproportionate:
*"it makes every write async to close a window of microseconds."* Neither half
holds here. This write is **already** async and off the interaction path, and the
window is a full network round trip rather than microseconds. The same tool is
right here for the reason it was wrong there. Tens of tabs serialise for free —
the second tab waits, then finds nothing to do because the first one cleaned the
shared state.

**3.4 Failure — two classes, and the drawer's line carries the state.** The local
`setItem` remains the only commit for the user's data; the mirror never blocks an
add, never rolls back, never queues. **The PUT is the commit for the mirror**, so a
failed one leaves the remote's previous value whole — `05` §8 rule 1, same
sentence, second store.

| Class | What it is | What happens |
| --- | --- | --- |
| **Transient** | offline, 5xx, 429, logged out | Nothing. The next trigger re-derives from local state and the drawer's line goes stale: *not saved since 09:14* |
| **Permanent for this blob** | over 32 KB, or properties unavailable on this site | Say it once, plainly, and stop trying until the collection changes |

No toasts — the drawer's own line carries it, which is this repo's
label-carries-the-state convention. `navigator.onLine` is **not** used as a gate,
because it means a network interface exists rather than that Jira is reachable; the
`online` event is used only as one more trigger. **`01`'s rule applies to the
mirror's GET**: validate `ok` + content-type + shape, or a logged-out session hands
back login-page HTML and the Cart parses it as a collection.

**3.5 The layout — one property per collection, and no index.** The user asked
whether an index property plus one per collection would buy more space. It would
buy the space and it is the wrong shape: **that is precisely what `05` §2 refused**,
because an index can disagree with the keys beside it — the bug both existing ADRs
were rewritten to remove. It is worse remotely than locally, because N properties
cannot be written atomically: one PUT lands, the next hits a dropped connection,
and the remote holds an index naming four collections with three values behind it.
A wifi blip produces the bug.

The index-free version buys the same space with nothing central to fall out of step:

- **One property per collection**, under the `gt-jira-cart.` prefix (`04` §2's
  namespacing rule, applied to a second store).
- **Membership is the property key list** — `GET /rest/api/3/user/properties` — so
  there is no index.
- Each value is **self-describing**: `{v, rev, id, name, activatedAt, items}`.
- **Order is derived from `activatedAt`**, reproducing `05` §4's
  most-recently-activated-first without a pointer. Activating a collection is
  therefore a change worth mirroring, and a skewed clock costs list order, never
  data.
- **`rev` is per collection**, so fast-forward is finer-grained: two machines
  working in *different* collections never diverge at all.
- **Delete is told from never-pushed by the last-agreed copy**, so no tombstones.
  Local has X and the last-agreed copy has X but the remote does not → it was
  deleted elsewhere. Local has X and the last-agreed copy does not → it is new
  here.

A torn write then leaves some collections a version behind rather than leaving a
pointer dangling, and the next reconcile fixes it.

Costs, accepted knowingly: the local single blob and the remote split are different
shapes, so there is a mapping layer; a full pull sweep is one key-list GET plus one
GET per collection, which is why gate 2 exists.

**3.6 The durability framing survives, and its reason moves.** `05` §8 said a
collection is working state **because `localStorage` is fragile**. That reason is
now weaker, so it is replaced with the real one: **the collection is working state
because its purpose is to be emptied into a status email.** Copy-out stays the
durable artifact — it is what you send to a person, and no amount of storage
reliability changes that. JQL keeps its place in `06`'s menu on its own merit, as
the query slot in a spanning set; it was never a consequence of the store being
fragile.

One correction to how this was put during the grilling. It was recommended with a
warning that C makes the store *more durable and more tightly capped* — ~277 items
against `localStorage`'s ~10,000. **§3.5 then softened that**, because the split
makes 277 a per-collection figure rather than a whole-store one, which is roughly
5× the top of the stated range of use. The ceiling is still real and still tighter
than `localStorage`'s; it is no longer alarming.

### 5. The verdict, and what the runs measured

Every unknown that stood between B and adoption was measured live on
`dalet.atlassian.net`, 2026-08-18.

| Question | Result | Why it mattered |
| --- | --- | --- |
| Does a dual-flavour `ClipboardItem` write survive a `@grant`? | **Yes** — resolved, twice, on separate tabs | The last reason `04` gave for `@grant none`. `09` had already deleted the other by dropping route detection |
| Is `GM_setValue` synchronous? | **Yes** — returns `undefined`, readable on the next line | `04` needs copy-out synchronous; `05` needs read-modify-write synchronous. A promise here would have forced a redesign of both |
| Does `bulkfetch` survive the sandbox? | **Yes** — `200`, `application/json`, `{issues, issueErrors}` shape | Gap-fill and refresh have no other transport. **This was the one measurement that could have killed B** |
| Does `GM_addValueChangeListener` cross tabs? | **Yes** — `remote: true` on the non-writing tab | `05` §5's cross-tab freshness needs an equivalent signal |

**5.1 One rule from the user, and the ADR must carry it.** Tampermonkey exposes
both forms: **`GM_setValue` is synchronous; `GM.setValue` is promise-based.** They
are not stylistic alternatives. `GM.setValue` would put an `await` in the copy
handler and re-open the exact failure [`04` §3](04-userscript-or-chrome-extension.md)
closed — a clipboard write landing after its transient user activation, failing
intermittently and silently. **Use the `GM_*` forms. Never the `GM.*` forms.** This
belongs beside the `navigator.permissions.query` scar: same shape of bug, same
silence, same reason to write it down rather than leave it to taste.

**5.2 A second observation fell out of the `bulkfetch` check, for free.** The probe
sent one real key and one deliberately absent one, and **one issue came back**. The
missing key was omitted silently rather than reported in `issueErrors` — `01`'s rule
3, now independently confirmed a second time, under a grant rather than under
`@grant none`. Diff requested against returned; the rule holds in both worlds.

**5.3 What B costs, stated plainly.** A `@grant` line, and cross-machine sync only
through Tampermonkey's own cloud sync of GM values, which the user must switch on.
That last point is [`04`](04-userscript-or-chrome-extension.md)'s recorded claim and
has **never been re-verified**, because Tampermonkey's documentation is unreadable —
`10a` §1.4 is the second independent confirmation of `07`'s finding on that page.

**5.4 Two gaps, recorded rather than hidden.**

1. **B's size ceiling is unmeasured.** No probe found where `GM_setValue` refuses a
   value, and the documentation cannot be read. `05` §8 set the precedent for not
   chasing this — at 20–50 items, ~6 K, *"no cap, no warning threshold, no soft
   limit"* — and B's backing store is the extension's own rather than a 5 MB
   per-origin quota, so the ceiling is very probably further away than
   `localStorage`'s was. **Probably is not measured.** By contrast C's ceiling *is*
   measured, at 32,768 bytes per collection, counted in bytes rather than
   characters.
2. **`08`'s prototype ran under `@grant none`.** Its placement, positioning,
   coexistence and remount findings are DOM and CSS behaviour, which Tampermonkey's
   sandbox does not touch, so they should transfer. Should is reasoning. The build
   session confirms it.

**5.5 What is amended, and what survives untouched.**

| | |
| --- | --- |
| **`04`'s verdict** | **Stands.** It is still a userscript, unconditionally. `04` never forbade a grant — it found that nothing the Cart *needed* forced one. Durability now does, which `04` explicitly called a different claim. Its `@grant none` bargain is amended: the bargain was worth taking while the clipboard was untested, and the test came back |
| **`05`'s model** | **Stands entirely** — one blob, `collections[0]` is active, `collections` never empty, every write a read-modify-write, the summary a snapshot. Only the two storage calls change |
| **`05` §5's rejection of `navigator.locks`** | **Stands.** §3.3a would have reversed it for C's mirror. B has no mirror, no network write and no second copy, so the reversal is not needed and is withdrawn |
| **`05` §5's cross-tab mechanism** | Amended: `GM_addValueChangeListener` replaces the `storage` event, and is slightly better — the `storage` event tells a tab about its own write by *not firing*, whereas the listener fires with `remote: false`. Same information, less inference. Its cross-tab delivery is measurably later, which costs a late redraw and nothing else, because `05` made the notification a freshness hint rather than the correctness mechanism |
| **`05` §8's quota reasoning** | Amended in its number, not its conclusion. The 5 MB origin quota and the ~10,000-item headroom no longer apply. The conclusion — no cap, no warning threshold, at 20–50 items — stands, now resting on the store being the extension's rather than on a measurement |
| **`06`'s framing** | Softened by the user's decision. See §6 |
| **`01`, `02`, `03`, `07`, `08`, `09`** | Untouched. The detector, the helpers, the gesture, the drawer and the mirror rule are all indifferent to where the bytes live |

### 6. Does durability change `06`? Softened, and no format moves

`06` justified its menu partly on *"the collection is working state, copy-out is the
durable artifact"*, which rested on `localStorage` dying at a logout. Under B it
does not. The user's decision was to **soften the framing and keep every format**:

- **The honest restatement:** a collection now survives a logout and a history
  cleanup, but **lives in one browser profile**. It does not survive uninstalling
  Tampermonkey, switching browser, or moving to another machine without turning on
  cloud sync. So copy-out is still how the data leaves the browser, and still the
  thing you send to a person.
- **No format changes.** All four were chosen on paste targets, and every one of
  those targets is exactly as it was.
- **JQL keeps its slot on its own merit** — the query slot in a spanning set, and
  the way to turn a collection back into something Jira can filter, bulk-edit, save
  and share. Its durability argument no longer carries it and is withdrawn; the
  utility argument never depended on the store.

Recorded as an explicit amendment to `06`'s Answer rather than a silent one, per the
map's rule that a closed ticket's reasoning may be corrected but not quietly
rewritten.

### 7. The out-of-scope entries — neither graduates, and both reasons were wrong

`10` Q11 put both to the user, as the map requires. **Neither graduates into this
effort.** But both were out of scope for reasons B has invalidated, and a stated
reason that is false is worse than no reason:

- **Bitbucket and Confluence capture** were excluded because `localStorage` is
  per-origin. **Tampermonkey storage is per-script**, so that block is gone. They
  remain out of scope by choice of focus — nothing is built yet, and Bitbucket is a
  fresh `02`-scale DOM survey on a different site. **The user's instruction:
  Bitbucket and Confluence are intended future work, not hypotheticals.** The map's
  entry is rewritten to say so.
- **Cross-machine sync** was excluded as needing an external store. B puts it one
  Tampermonkey setting away. Still out of scope, and still resting on `04`'s
  unverified claim about TM cloud sync — recorded as unverified in the entry.

### 8. What was NOT settled

1. **B's size ceiling** (§5.4). Unmeasured and undocumented. `05` §8's precedent
   says it does not matter at 20–50 items; that is a judgement, not a number.
2. **Whether Tampermonkey's cloud sync of GM values does what `04` says.** `04`
   recorded it as the first rung to cross-machine sync. Never re-verified, because
   the documentation cannot be read. Nothing in this effort depends on it — it is
   the reason cross-machine sync stays out of scope rather than a promise that it
   works.
3. **Whether `08`'s prototype findings transfer to a granted script** (§5.4). DOM
   and CSS behaviour should be indifferent to the sandbox. The build session
   confirms it, and it is cheap to confirm.
4. **How late the cross-tab change event is.** Observed as *"after a short time"*,
   never measured. It does not need to be: `05` §5 made the notification a freshness
   hint, so a late event costs a late redraw.
5. **Whether user properties carry their own rate limit.** Not found in the docs.
   Now moot for the verdict, and preserved in `10a` Part 5 for whoever revisits C.
6. **Everything about candidate C that was never built.** C has a full design and a
   full set of measurements and **no implementation whatsoever** — no prototype, no
   partial code, and no experience of its reconciliation rule under real use. A
   revival starts from a specification. `10a` Part 5 says so explicitly.

### What this hands on

- **`J`, the ADR session — now unblocked, and it is the only thing left.** The
  storage section is B: Tampermonkey storage, `@grant`, `05`'s model unchanged, the
  `GM_*`-not-`GM.*` rule carried as a scar. The platform section can finally be
  written as settled rather than as a pile of observations, because `10` closed the
  pile by testing it.
- **The map.** The *Storage* and *Platform* rows are rewritten by this ticket. The
  two out-of-scope entries are rewritten but do not graduate, and Bitbucket and
  Confluence are recorded as intended future work rather than as hypotheticals.
- **`06`.** Its durability framing is softened by §6 and its formats are untouched.
  The amendment is written into `06`'s Answer.
- **`04` and `05`.** `04`'s verdict stands and its `@grant none` bargain is
  amended. `05`'s model stands entirely; two storage calls change, its
  `navigator.locks` rejection survives, and its quota reasoning keeps its
  conclusion while losing its number.
- **A future effort, if cross-machine sync ever becomes a requirement**, or if
  Tampermonkey stops being the delivery mechanism, or if a collection ever needs to
  be readable by something that is not this browser. That effort starts at
  [`10a` Part 5](../research/10a-storage-options.md), which exists so it does not
  have to re-run five probes and a grilling.
- **Bitbucket and Confluence**, as the next effort after the Cart ships. Storage
  reaches them now; the DOM work does not exist yet.
