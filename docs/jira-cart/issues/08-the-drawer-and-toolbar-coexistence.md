# 08 — The drawer, and coexistence with the existing toolbar

Type: prototype
Status: resolved — a bottom-corner badge, a non-modal drawer whose chrome mirrors its anchor, and the collection is the selection (see Answer)
Blocked by: 05 (done), 07 (done), 09 (done)
Parent: ../map.md
Prototype: 08-drawer.user.js — extends `07`'s, throwaway, and DELETED 2026-08-18.
           Its mechanisms are in src/jira-cart.user.md §2.9 and §2.11
Run with: prompt I in ../prompts.md

## What `09`, `05` and `07` changed about this ticket

Written while charting, before three tickets that rewrote parts of it. Read this
first; **§3 of the Question below is obsolete and §2 is incomplete.**

1. **§3 is wrong: there is no "scan-results picker", and there is no "after a
   scan".** `09` settled that the drawer holds **two standing sections** — a
   **live list** mirroring the `/browse/` anchors currently in the DOM, labelled
   `On this page (n)`, and the **collections**. Scanning is not an action, so
   there is no result set to pick from and no third mode. `09` records that this
   very misreading nearly mis-designed its own session. Rows leave the live list
   when they unmount (strict mirror), each carries a coarse origin, and only a
   click moves a link into a collection.
2. **§1's badge counts the collection, not the page.** `09` fixed that, which is
   what makes the badge unable to lie.
3. **§2 inherits a settled model, not a blank one.** `05` fixed the shape: the
   active collection is `collections[0]`, there is no active pointer, and the
   drawer owns the parts `05` explicitly refused — the default collection's
   name, whether duplicate collection names are prevented, how already-collected
   renders, the wording of "cannot read this item", and the wording of a
   full-storage failure. Three behaviours are fixed and are **not** `08`'s to
   revisit: gap-fill fires on drawer open, the drawer re-reads on open and on
   tab-visible, and the badge counts `collections[0]`.
4. **`07` added four inputs.** The right-click preference needs a home in the
   drawer (a switch in `gt-jira-cart.prefs`, off by default); the live list's
   already-collected rendering must agree with the green tint the gesture puts on
   the page; the live list is the only add path for anyone who cannot hover; and
   whether a live-list row is a **toggle** (click a collected row to remove it)
   is `08`'s call — `07` made the on-page gesture one and stopped there.
5. **`06` is an input to §2.** "The copy menu from `06`" cannot be laid out until
   `06` says how many formats there are and at which scopes each applies.

## Question

The shape is agreed: an always-present count badge that opens a side drawer.
What is not agreed is what is inside it, and how it shares an issue page with
the toolbar `jira-ux-improvements` already puts there.

Using `/prototype`, build a rough shell and react to it:

1. **The launcher.** A badge carrying the active collection's name and item
   count, so the label is the state — the principle `jira-backlog-sprints` uses
   for `N sprints hidden ▾`. Where does it sit so it never covers Jira's own
   controls, on an issue page, a full-width board and the timeline?
2. **The drawer's contents.** The collection switcher, create / rename / delete /
   reorder, the item list with per-item copy and remove, multi-select, and the
   copy menu from `06`. Decide what is on the surface and what is one level in.
3. **The scan-results picker.** After a scan, a list of found issues with tick
   boxes, with those already in the active collection marked as such. Is this the
   drawer in a different mode, or a separate overlay? A mode is fewer moving
   parts; an overlay is easier to make roomy.
4. **Coexistence.** `jira-ux-improvements` anchors a toolbar to the issue
   breadcrumbs using CSS anchor positioning, falling back to the top-right
   corner where anchor positioning is unsupported. That fallback corner is the
   natural home for a fixed badge. Establish the positioning contract, and check
   the fallback case — both scripts installed, anchor positioning off — actually
   works rather than assuming it.
5. **Theming.** Use the Atlassian `--ds-*` design tokens with standard-colour
   fallbacks, the way both existing scripts do, so light and dark work without
   the script asking which is active.
6. **Survives a remount.** Jira rebuilds its tree constantly. Confirm the badge
   and drawer survive a route change, a tab switch and a saved edit.

Link the prototype rather than pasting it. Record what the shell got wrong,
since that is what the ADR needs to warn the build session about.

## Answer

**A badge in a bottom corner opens a non-modal drawer that is resized from the
corner it is not anchored to, and everything inside it is derived rather than
configured: the layout follows the drawer's width, the live list keeps 62% of the
room, and the collection is itself the selection — so four copy buttons act on all
of it and no multi-select exists. The shell got six things wrong, and three of
them are one mistake wearing three hats: a box given a size by something that
knew nothing about the box.**

Evidence: `prototypes/08-drawer.user.js` (deleted 2026-08-18; the mechanisms are in
`src/jira-cart.user.md` §2.9 and §2.11), built 2026-08-17 and used on
`dalet.atlassian.net` through ten versions across
2026-08-17/18. Seven questions were answered by looking and eleven by arguing;
where the shell's own reasoning disagreed with a day of use, use won, and it did
so five times. One devtools paste from the user closed a gap `02` had recorded as
closed the other way.

### 1. Placement, and the contract is one rule

**The badge takes a bottom corner — bottom-right by default — and the Cart is
never anchored to a Jira element.** `jira-ux` and `jira-backlog-sprints` own the
top-right, in both their anchored and their fallback positions, and the Cart
stays out of it. The default drawer height leaves that corner clear; a drawer
dragged to full height covering something is the user's own doing, and nothing
tries to avoid it automatically.

**The drawer's own chrome mirrors the anchored corner**, and that single rule
generates two placements rather than needing two special cases: the resize grip
goes on the corner the drawer is *not* anchored to, and the head's controls go on
the side it *is*. Docked bottom-left, the ✕ moves to the left of the head. The
user proposed it to fix an aesthetic complaint and it turned out to fix a
collision — on that dock the grip lands exactly where the ✕ sat.

**`08` §4 guessed wrong about the top-right, and the forced-fallback switch is
what proved it.** That corner is not merely contested: it is unusable for a fixed
element. `jira-ux`'s fallback rule places its toolbar at `0.5rem` from the top
with
[`z-index: 1`](../../../src/jira-ux-improvements.user.js#L623-L626), which puts it
inside Jira's own global navigation band and behind it. Switching the fallback on
made the toolbar **disappear**, not move.

> **A finding for `jira-ux`, not for the Cart, and it should not be lost: every
> Firefox user of that script has no toolbar at all.** Firefox never takes the
> anchor-positioning branch, so the fallback is the only path it has. Chromium
> users have never seen it. This is a separate fix in that script; `08` records it
> because the harness found it and because it is the evidence behind the Cart
> choosing a bottom corner.

### 2. The drawer

**Non-modal, and that removed candidates before anything was built.** No backdrop,
no focus trap, no light dismiss, nothing that closes on a click on the page, and
Escape deliberately does not close it — Jira binds Escape all over its own UI, and
a drawer vanishing under an Escape aimed at one of Jira's dialogs would read as a
bug. The user kept it open throughout a collecting session, which is the verdict:
**the live list is the reason it stays open**, so the drawer is a companion rather
than a review surface opened at the end.

**Plain `z-index`, not the top layer.** `popover="manual"` was built into the
shell as a switch and never earned its place: nothing of Jira's ever covered the
drawer at `z-index: 9999`, across every view tried, and the top layer made no
difference to the one overlap that does exist (a drawer dragged large covers its
neighbours either way, because being above everything includes being above them).
The Popover API stays unused, which is also one less mechanism behaving unlike the
rest of the UI.

**Resizable from a grip on the free corner, and the size is remembered.** The
browser's own `resize: both` was tried first and rejected in use — see §8.

**The layout is derived, not configured.** `auto` stacks the sections below 560px
and puts them side by side above it; `stacked` and `split` are the user pinning
it. That is one preference with three states rather than a layout flag sitting
beside a remembered size that could contradict it — design principle 1. The
drawer's width already says which shape was asked for.

> Note for the build session: the real script can do this with a **container
> query** and no JavaScript at all. The shell derives it in `render` only because
> every layout rule there is keyed off one attribute on `<html>`.

### 3. The two sections

`09` fixed that there are exactly two and that there is no third mode. `08` fixes
how they divide the room.

**The live list gets ~62% by default, in both layouts, and the divider between
them is draggable and remembered per layout.** The proportion is the user's:
a collection is expected to hold around twenty items and to be emptied, while the
mirror is what you read to decide. It is a fixed basis rather than a rule about
content, so the split cannot shift under you as the collection fills, and it is
CSS rather than JavaScript, so it is right on the first paint.

**A live-list row is a toggle** — click a collected row and it leaves the
collection, with the row turning red and showing `−` under the cursor first, the
same pre-click warning `07` §5 gave the floating button. `07`'s constraint is
honoured: the same item is removable in both sections, never removable in one and
inert in the other. Collection rows keep a plainer explicit `✕`, because in a
thirty-item list a mis-click on a whole row would delete something and there is
no undo (`05` §8).

**The full summary is in the tooltip on both sections' rows.** A 380px drawer
cannot show a Jira title, so the row ellipsises and the hover carries the rest —
`KEY — summary` on one line, what the click will do on the next.

### 4. The collection, and the words on it

| Question `05` left open | `08`'s answer |
| --- | --- |
| The default collection's name | **`Scratch`** — short enough for the badge, and it names what `05` §8 says the thing is: working state that gets emptied. Not "Cart", which `05` §1 reserved for the UI itself |
| Renaming | **Click the name in the heading and edit it in place.** No extra control, and the thing you click is the thing you change. Enter or blur commits, Escape cancels |
| Duplicate names | **Prevented, by appending a number.** ` 2`, then ` 3`, lowest free wins; the same rule on create and on rename; a clash ignores case. The user chose this over tolerating them, knowing the cost: a collection genuinely called `Sprint 2` duplicates to `Sprint 2 2`, because incrementing the trailing number would silently name it after a different sprint |
| Reorder | **Does not exist.** `05` §4 already made order most-recently-activated, and a hand-chosen order is not expressible |

The switcher is a row of chips, each carrying its name and its own count. **The
count is a separate element from the name and never truncates** — see §8; it is
the one thing on a chip that cannot be reconstructed from a shortened label.

### 5. Copy and refresh

**Four buttons at the foot of the collection section — 🔗 Links, 📃 Names,
🔑 Keys, 🔍 JQL — acting on the whole collection. There is no multi-select and no
per-row copy.** The reasoning is `05`'s own framing: **the collection is the
selection.** You curate it by adding and removing, then empty it into a paste. A
tick-box selection would be a second selection mechanism layered on the first, and
it would cost every row a checkbox in a drawer that is already narrow. `06`'s
scope matrix allows more; `08` ships less, deliberately, and the cost is stated:
copying three of twenty means removing the other seventeen first.

**All four are disabled and dimmed when the collection is empty**, the convention
`jira-ux` already uses for the buttons that need a description. `06` established
that a copy of zero items must not write at all — it would put an empty string on
the clipboard under a ✅ claiming success.

**The refresh control is a ↻ in the collection's heading**, beside its name and
count: an action on the named thing sits next to its name, and the foot row stays
about getting data out. `06` warned it must be findable, since a stale title has
no other remedy. Gap-fill is separate, automatic and has no control of its own.

**`06`'s trap is inherited and must be honoured: the copy control's label is
derived inside `render`.** A label written once at construction keeps the ✅ for
ever.

### 6. The two failure states

**"Cannot read this item" is `(cannot read)` in the row, muted, with the full
sentence on hover:** *Jira returned nothing for this key: it does not exist, or you
do not have permission to see it.* That mirrors Atlassian's own message, which is
what `05` §6 requires — the API conflates absent and forbidden in its own text, so
there is one failed state and the UI may never claim deletion. Short in the row
keeps a twenty-item list scannable; the honest full version is one hover away, the
same split the summaries use.

**A failed write shows ⚠️ on the badge *and* a line at the top of the drawer:**
*This site's browser storage is full, so nothing new can be saved. Copy this
collection out, then remove some items.* It names the real cause — the site's
storage, which Jira alone fills to about half (`05a` §3.3) — rather than implying
the collection grew too big, and it points at copy-out, which still works because
it only reads. A tooltip alone was rejected: an add that silently did nothing is
precisely the outcome `05` §8 was written to prevent.

### 7. Preferences

**A ⚙ in the drawer's head opens a small preferences area**, and the right-click
interception switch lives there — off by default, in `gt-jira-cart.prefs`, labelled
by what it takes away: *"Right-click an issue link opens the Cart's menu instead of
the browser's"* (`07` §4). A settings home rather than a loose checkbox, because
the Cart will collect more of these — keyboard shortcuts are still open fog — and
because the two standing sections should hold nothing that is not a link or an
item.

### 8. What the shell got wrong — and this is the part the ADR must carry

Six defects, none of which an argument would have produced. **Three are the same
mistake in three costumes: a box given a size by something that knew nothing about
that box.**

1. **The live list was cut rather than scrolled past ~15 links.** The lists were
   capped with a viewport-relative height (`34vh`, `46vh` side by side) — a number
   that knows nothing about the drawer it is inside. Past that, the list wanted to
   be taller than the space left after the head and the harness, and a grid row
   sizes to content and does not shrink, so the surplus was hidden by the
   container's own overflow. **Fix: flex all the way down, `min-block-size: 0`
   everywhere, and the list is the only thing in the drawer that scrolls.**
2. **A 30-item collection starved the live list.** Sections shrinking in
   proportion to their content meant the section you pick *into* squeezed the
   section you pick *from*, until `On this page` was its own heading and nothing
   else. **Fix: a fixed basis, §3.**
3. **The section heading was sliced along its top edge.** Found by the user, and
   my first diagnosis was wrong — I blamed a scroll. The real cause: **a flex item
   cannot normally shrink below its content, but that automatic minimum only
   applies while `overflow` is visible.** The heading needs `overflow: hidden` for
   its ellipsis, which removed the minimum and let it be squashed. **Fix:
   `flex: none`**, which says the same as a `min-height` without a magic number.
4. **`resize: both` is unusable on a corner-docked panel**, and it took two more
   bugs down with it. The UA handle is always at the bottom-right, which on a
   bottom-right dock is the *pinned* corner, so the box grew away from the
   pointer. And underneath: **`render` was erasing the drag**, because the UA
   records a resize by writing inline `width`/`height` — the same channel a script
   writes — and an idempotent render must not reset a property something else
   owns; and **a `pointerdown` guard could never fire**, because grabbing the UA
   handle is an overflow-control interaction, like dragging a scrollbar, which
   Blink handles without dispatching a pointer event. **Fix: our own grip on the
   free corner, so we own the write and the events are ordinary.**
5. **The ✕ collided with the grip on a left dock** — two features each correct
   alone. **Fix: the chrome mirrors the anchor, §1.**
6. **Every timeline row read as bare.** `02` §5 had recorded the timeline's
   summary as having no `data-testid` and being position-dependent, and concluded
   it was unreadable. A pasted `outerHTML` showed otherwise: **the summary is a
   sibling of the anchor inside the anchor's own parent**, so subtracting the
   anchor's text from its parent's yields exactly the title — no invented testid,
   no child index. **This corrects `02` §5 and adds a sixth tier to `07`'s
   cascade**, which now reaches all seven views. The guard that makes it safe:
   **only inside a known row**, or a `/browse/` link in a description would store
   the sentence around it as the summary. `cleanText` also had to strip
   `(opens new window)` globally rather than only at the end of a string.

One further hazard was found while chasing defect 3 and fixed anyway:
**`scrollIntoView` scrolls every scrollable ancestor**, and `overflow: hidden` is
still programmatically scrollable — it only hides the scrollbar. The drawer's
containers are `overflow: clip` now, which is genuinely not a scroll container, and
the one list that should scroll is scrolled by hand. That makes the class of bug
unrepresentable rather than patched.

### What was not settled

1. **Whether the right-click preference is ever switched on.** Inherited from
   `07` unchanged. It shipped off in both prototypes and was never turned on for
   more than a moment, so the day-two question `07` posed is still unanswered.
2. **Keyboard reachability.** The drawer's rows are buttons and therefore
   tabbable, but no keyboard *path* was designed and none was used. `07` left this
   open too. The live list remains the click-only path for anyone who cannot
   hover, which was the requirement; whether the drawer can be driven from the
   keyboard alone is untested.
3. **Keyboard shortcuts.** Still map fog. `jira-ux` owns Alt+Shift + L/E/N/U/M/I/D/T
   and the Cart binds nothing.
4. **Grouping the live list by the page's own sections**, and **container testids
   for the description and the comment stream.** Both still deferred, both still
   blocked on the same devtools probes (`09a` §4.4). The flat list and the
   unlabelled row remain the safe defaults.
5. **The drawer at very small window sizes.** The minimum is 300×160 and the
   layout derives from width, but nothing below a laptop screen was tried.
6. **Whether the section divider is ever dragged in practice.** It exists because
   the 62% default might be wrong for someone; that it was needed is a guess.

### What this hands on

`08` is the last ticket, so this hands on to **the ADR session** — writing
`src/jira-cart.user.md` from the nine Answers — rather than to another number.

- **The scars go in.** `06` kept `navigator.permissions.query`; `07` kept the
  per-row `+` that reflows Jira's rows; `08` adds four: a `vh` cap inside a box it
  knows nothing about, `overflow: hidden` silently removing a flex item's minimum
  size, `resize: both` on a corner-docked panel, and `scrollIntoView` scrolling
  ancestors that were never meant to move. The reasoning is the part that stops
  them happening again.
- **One correction to a closed ticket.** `02` §5's timeline row is wrong: the
  summary is readable, one hop from the anchor. The cascade has six tiers, not
  five, and the ADR should carry the sixth with its `row` guard.
- **One bug in another script**, §1: `jira-ux`'s fallback toolbar is invisible
  behind Jira's navigation. Not the Cart's to fix, and not to be forgotten.
- **The prototypes are throwaway and both say so.** Delete
  `.scratch/jira-cart/prototypes/` and any `gt-jira-cart.proto*` key once the ADR
  is written.
- **The platform pile is unchanged**, and its one testable question still stands:
  does a `ClipboardItem` write survive a `@grant`? `08` added no observation to it.
