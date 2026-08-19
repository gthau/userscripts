# 07 — The direct per-reference add gesture

Type: prototype
Status: resolved — a floating toggle to the left of the hovered link; the per-row `+` reflows Jira (see Answer)
Blocked by: 02 (done), 09 (done)
Parent: ../map.md
Prototype: 07-add-gesture.user.js — built and used 2026-08-14, throwaway, and
           DELETED 2026-08-18. Its mechanisms are in src/jira-cart.user.md §2.7
Run with: prompt G in ../prompts.md

## What `09` changed about this ticket

`09` did not promote this gesture to primary. It **removed the ranking**: the
panel's live list and this gesture are two gestures for different situations, and
the map's constraints table now says so. Three consequences, all narrowing:

1. **The brief is ergonomics, not coverage.** After `02`, the live list reaches
   every reference on the page — every one is an `<a href="/browse/KEY">`. So this
   gesture does not exist to find what scanning cannot. It exists because the user
   does not want to *"1. open the side panel, 2. have the page scanned, 3. find the
   ticket in the list, 4. add it"* when they can already see the link.
2. **Option 1 below is dead, and by the user's own observation:** *"all
   modifiers+click result in opening links, so that seems discarded."* Read the
   modifier-click section as a record of why, not as a live candidate. The
   candidate set is a **context-menu entry** or a **hover popover carrying a `+`**.
3. **A hover affordance no longer has to survive accumulation.** `09` settled the
   live list as a strict mirror of the DOM, and dropped `watchRoute` — so the
   question in option 2 about keeping affordances attached across remounts and
   virtualised scrolling is answered the same way the live list answers it, with
   `watchMounts` and one idempotent render.

## Question

The user wants to add a single reference directly, and said the form is undecided:
modifier-click, or a hover `+` button, or something else. This is a feel question —
build the rough thing and react to it rather than arguing from descriptions.

Using `/prototype`, on a real Jira page, with what `02` found about detection:

1. ~~**Modifier-click.**~~ **Ruled out by `09`** — every modifier+click already
   opens the link. Kept for the record, and because its questions still bite the
   context-menu option. One capture-phase listener on the document. Works on
   buttons and divs, not only links. Zero visual footprint. Test: which modifier
   is free of Jira's own bindings and of the browser's (Ctrl/Cmd-click opens a
   tab, middle-click too, Alt-click is taken on some platforms)? Does
   intercepting a click on Jira's own controls break them? Is an invisible
   gesture discoverable enough to remember a week later?
2. **Hover `+`.** Discoverable and precise. Test: what it costs to keep
   affordances attached across React remounts and virtualised scrolling, whether
   the `+` can be placed without disturbing Jira's layout, and how it feels on
   a dense backlog where every row sprouts one.
3. **A hybrid** — hover shows the affordance, and the modifier-click works
   whether or not you hover.

Judge on: does the last add visibly land? Can it be done twenty times in a row
without irritation? Does it ever fire when the user meant to navigate — and how
bad is that when it does?

Link the prototype from this ticket rather than pasting it in. Record the
verdict *and* what made the losing option lose, so the ADR can say why.

## Answer

**One shared floating button that follows the hovered issue link, placed to its
left, and it is a TOGGLE — `+` adds, `✓` says it is in, and clicking a collected
one removes it. Nothing is injected into a Jira row, ever: the per-row `+` was
built, used, and killed by the layout it breaks. The right-click menu survives,
but as an opt-in preference that ships off rather than as a gesture.**

Evidence: `prototypes/07-add-gesture.user.js` (deleted 2026-08-18; the mechanisms
are in `src/jira-cart.user.md` §2.7), built 2026-08-14 and used on
`dalet.atlassian.net`. It carried all three
candidates behind a mode switch, so the verdict is a comparison rather than a
first impression. Where the reasoning written into that file disagrees with what
the day of use found, the day of use wins — and on one point it did.

### 1. The three criteria, answered

| `07`'s question | The user's answer | What it means |
| --- | --- | --- |
| Does the last add visibly land? | **Yes** | Settled. Three signals carry it and they are cheap: the count on the chip, the link itself going green, and a one-off flash on the just-added key |
| Twenty in a row without irritation? | **"Almost"** | The two things that made it *almost* were both fixed and were both cosmetic — the `+` sat on the wrong side and was too faint to pick out. See §2 |
| Does it fire when you meant to navigate? | **Never encountered** | And that is structural rather than lucky: the `+` is a separate element from the anchor, so there is no ambiguous click to resolve. The failure mode `07` worried about does not exist for this form |

The third row is the one worth carrying into the ADR as a positive claim. `09`
had already killed modifier+click because every modifier already opens the link;
what the prototype adds is that a *separate affordance* does not merely avoid
that collision, it makes the whole class of "did you mean to add or to navigate"
unreachable. There is no shared target to disambiguate.

### 2. The form, and the two corrections use made to it

**The `+` goes to the LEFT of the link.** Built on the right; the user asked for
the left after a day. The reason generalises, which is why it is a design rule
rather than a preference: on every list view `02` surveyed, the key sits at the
row's left edge and the summary runs off to its right, so a `+` on the right
lands on the busiest part of the row while a `+` on the left sits in the row's
own margin, where nothing else is. It also meets the pointer on the way in
rather than making it travel past the link first.

**It has to be loud.** The first build was an outlined chip in the design
tokens' subtle palette and the verdict was that it is hard to distinguish. The
shipped form is a solid brand-bold fill with a light ring and a drop shadow —
which reads against any Jira background and in both themes, where a
bordered-transparent button does not. The already-collected state is the same
shape in success-bold with a `✓`.

One bug found by screenshot rather than by reasoning, and it took two attempts,
which is why it is worth a paragraph: **the `+` would not centre itself.** The
first diagnosis — that a `<button>` is not reliably a centring box — was right
but insufficient; adding `display:flex` + `align-items:center` +
`justify-content:center` did not fix it. The real cause is in §5: flex centres
the line box, not the glyph's ink, and a `+` is drawn on the font's math axis.
Drawing it instead of typing it is the fix.

### 3. What made the per-row `+` lose — the cause of death, in one sentence

> **There is no way to put an affordance inside a Jira row without changing how
> Jira lays that row out.**

The long version, because the ADR should not have to re-derive it: an
inline-level box ~20px tall inserted next to the key raises the height of that
row's line box, and the summary beside it re-aligns as though it had been given
`vertical-align: top`. The user reported it on **four views independently** —
search results, the backlog, the active-sprint board, and the linked-work-items
panel — with the panel showing the most extreme form, the key wrapping onto a
line of its own.

**And the escape route is worse than the disease.** The only reliable way to
take the `+` out of the flow is to position it absolutely, which requires
writing `position: relative` onto a node React owns, on the guess that nothing
of Jira's own absolute positioning depended on that node not being a containing
block. That is a bet against a codebase we cannot read, placed on every list
view, forever. It was offered and declined.

**This is the ticket's own worry arriving in a form nobody predicted.** `07`
asked how a per-row `+` would feel *"on a dense backlog where every row sprouts
one"* — the fear was visual noise and per-row bookkeeping. Both turned out to be
survivable; what killed it was that the affordance cannot be inert. The
prototype was built to make that cost visible rather than hide it behind an
absolute position, and that decision is the only reason this is a measurement
instead of an opinion.

Two claims the file made *for* the floating form also held and are worth keeping
as reasons: it needs no per-row cleanup, and `02` §6's destructive
virtualisation costs it nothing, because there is nothing attached to a row to
lose when the row unmounts.

### 4. The right-click menu — demoted, not rejected

It was liked. It is not the gesture. The user's words settle it: *"the context
menu is nice, but I would like to have this option with a toggle, not always on
because I expect to be able to use the browser's context menu whenever I want."*

**So it is a preference, default off**, living in `gt-jira-cart.prefs` — the key
`05` §2 reserved for exactly this kind of state, deliberately separate from the
collections so that a malformed preference can never take a collection with it.
Its switch belongs in the drawer, which makes its placement `08`'s.

**What being on costs, established before anything was designed and confirmed in
use.** A userscript under `@grant none` cannot add an entry to the browser's
native right-click menu; nothing can, from a page. So "context menu entry" means
intercepting `contextmenu`, cancelling it, and drawing our own — and on the
elements we intercept, the user loses *Open link in new window*, *Copy link
address*, *Save link as*, *Search with…*, and every extension's own entries.
*Open link in new tab* was handed back as a menu item so the trade would be
visible rather than merely felt, and that was not enough to make always-on
acceptable.

- MDN's [`contextmenu` event](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event)
  confirms the event is cancelable and that `preventDefault()` suppresses the
  browser's menu — the only mechanism a page has.
- **On Chromium there is no escape hatch.** Firefox lets Shift+right-click
  bypass a page's handler without firing `contextmenu` at all; Chromium does
  not, and the map's *Browsers* row says Chromium in practice. So on the
  browsers that matter the suppression is total for as long as it is on.
- One asymmetry the design has to own if the preference is ever switched on:
  **on the backlog, right-clicking the key gives our menu and right-clicking
  the summary two centimetres away gives Jira's own card menu.** Within one row,
  right-click means two different things depending on the pixel. Nothing fixes
  this — widening the interception to the whole row would swallow Jira's card
  menu instead, which is a larger loss.

### 5. The affordance is a toggle, and this amends `05` §3

**Clicking a collected link's `✓` removes it from the active collection.** The
user's request, made after using v0.2.0: *"when an issue belongs to the current
collection, a green checkmark is displayed when hovering the issue key, I would
expect that clicking this green checkmark would remove the issue from the list."*

**It belongs to this ticket**, and the question was worth asking. `08` owns the
drawer and everything in it; `07` owns what the gesture under the cursor does.
This is the second.

**What it amends.** `05` §3 said adding an already-present key is an idempotent
no-op that the UI shows rather than announces, and that the rule *"lands on `07`'s
gesture identically"*. That last clause is now wrong, and `05` §3 carries a note
saying so. The reasoning, because the ADR should not have to reconstruct it:

- **A stateful button that does nothing when clicked is a dead control**, and it
  reads this repo's own label-carries-the-state convention backwards.
  `jira-ux-improvements`' 🔒 means *click to unlock* — the label names the
  action, and the state is legible from which action is offered. A `✓` that
  reports "you already did this" and then absorbs the click is the opposite.
- **Without it, removing costs exactly what `07` exists to avoid.** The ticket's
  founding complaint is *"I do not want to: 1. open the side panel, 2. have the
  page scanned, 3. find the ticket in the list, 4. add it."* An add-only gesture
  makes every correction of a mistaken add cost those four steps.

**Everything `05` §3 was really aimed at survives**: identity is still the issue
key, a key still appears at most once per collection, an add is still idempotent,
and no "already added" flag is stored anywhere. What changed is one interaction,
not the model.

**Removal is the one destructive thing this gesture can do, so it announces
itself before the click.** The collection is working state and copy-out is the
durable artifact (`05` §8), so an item deleted before it was copied out is
genuinely gone, and there is no undo. The affordance therefore has three states
rather than two:

| Pointer is on | Shows | Means |
| --- | --- | --- |
| the link, not collected | blue `+` | click adds |
| the link, collected | green `✓` | it is in the collection |
| **the button, collected** | **red `−`** | **click removes** |

So the button reports the *state* at a distance and names the *action* up close,
and the change happens under the cursor before any click. That third state was
not asked for; it is offered as the safety margin a destructive hover-click
needs, and it costs one CSS rule. The removal flash is red and fades to nothing,
where an add's is green — the same "does the last one visibly land" job pointed
the other way.

**Which way a click goes is derived from storage at click time, never from what
the button was showing.** A label made stale by another tab cannot cause the
wrong operation.

**One thing found while building it, and it is a rule rather than a bug fix:
draw the glyph, do not type it.** The `+` read as sitting too low in its box
while the `✓` beside it read as centred — same box, same flex centring. Flex
centres the line *box*; it cannot centre the ink inside it, and a `+` is drawn on
the font's math axis rather than the box's centre line. Two bars positioned with
`inset: 0; margin: auto` are exact and independent of whatever font the page
resolves. The `✓` is left as text because it was already right.

### 6. Three mechanisms the prototype proved, which the spec should keep whatever the gesture

These are not about the gesture and would have been re-derived expensively:

1. **Already-collected is a CSS rule generated from the `href`, not a class
   written onto a node.** Whether a link is collected is knowable from its
   `href` alone, so each collected key becomes a selector in one regenerated
   stylesheet. That answers for every matching anchor *including the ones React
   has not created yet* — no per-row JavaScript, nothing to re-apply after a
   remount, and destructive virtualisation costs nothing. It is the same lever
   `jira-ux-improvements` uses for its lock and collapse, and it is design
   principle 3 taken at its word. Anchor each key four ways
   (`$="/browse/KEY"` plus the `?`, `#` and `/` variants); a substring match
   would make `RDC-1` match `RDC-123`.
2. **The summary cascade works, and `02` §5's testids are only its first tier.**
   Five sources, tried in order: the view's own summary field scoped to the row;
   the a11y label carrying key + summary together; the backlog's screen-reader
   twin anchor; the anchor's own text when it is not the key; and `document.title`
   on the issue view. Returning nothing is a correct answer, not a failure — an
   item is valid with a key alone (`01` rule 1).
3. **Grouping anchors by (row, key) before decorating anything is mandatory, and
   for two reasons that pull opposite ways.** A backlog card carries two anchors
   to the same issue (`02` §4), so a per-anchor loop decorates it twice; a prose
   paragraph carries anchors to *different* issues under one parent, so a
   per-row loop decorates one and loses the rest. Within a group, take the
   **widest** anchor — on the backlog that is the visible key rather than its
   screen-reader twin, which gets the right element without naming
   `…screen-reader-key` and so without adding a testid to the list of things
   that can rot. This applies to the floating form too: it is how you decide
   which element the `+` should track when two anchors overlap.

### 7. A third observation for the platform review — recorded, not acted on

`04` recorded one trip-wire; `05` added two. This is the third, and it arrived
the way the prompt anticipated except sooner — the user did not need a week to
feel the loss, they refused always-on interception on day one:

> **Native context-menu entries are a thing extensions have and userscripts do
> not.** An extension can add "Add to Jira Cart" to the browser's own link menu
> with no interception and no loss — the native entries stay. A userscript can
> only take the menu away and rebuild a worse one. That is why this ships as an
> opt-in preference rather than as the gesture, and it is the first observation
> in this effort where the extension would deliver something *better* rather
> than merely *differently*.

Not acted on, per `04`'s verdict and the user's own *"but not now"*. The map's
*Platform* row now names it beside the other two.

### What was not settled

1. **Whether the floating `+` is reachable on a touch device or by keyboard.**
   It is a hover affordance, so it has neither answer today. Not blocking: the
   audience is desktop Tampermonkey users (map, *Audience*), and the drawer's
   live list is a click-only path to the same add for anyone who cannot hover.
   `08` inherits the question.
2. **The 200ms grace period before the `+` disappears.** It was never
   complained about, but it was never isolated either — it is one constant that
   would explain a "skittish" feel if one ever appears.
3. **How the `+` behaves when two issue links overlap or sit on adjacent lines
   of prose.** Prose links are in (`09` §7) and the day of use was mostly on
   list views. The widest-anchor rule in §5.3 is the intended answer; it is
   reasoned, not measured.
4. **Whether the right-click preference is ever switched on.** It shipped off
   and the trial ended before that could be observed. If it is never used, `08`
   may reasonably propose dropping the preference entirely — but that is `08`'s
   evidence to gather, not a gap in this verdict.
5. **Tampermonkey's own documentation for `GM_registerMenuCommand` could not be
   read** — `tampermonkey.net/documentation.php` renders its API sections
   client-side and returned only its table of contents, twice. Recorded as
   unavailable and abandoned. Nothing here depends on it: the command requires a
   `@grant`, and the map fixes `@grant none`, so the native menu is unreachable
   under this design regardless of where that command surfaces. If it turns out
   Tampermonkey can surface commands natively under a grant, that is a fourth
   entry for the platform review in §6, not a change to this ticket.

### What this hands on

- **`06` (copy formats).** Unaffected. The gesture stores `key` + `summary` and
  nothing else, which is exactly what `05` said `06` may format. One thing worth
  knowing: the direct gesture is the path most likely to produce a
  **summary-less item**, because it fires wherever a link happens to be —
  including prose, where no summary sits beside it. `05` already says such an
  item copies as a bare key; `06` should treat that as the common case rather
  than the edge case.
- **`08` (the drawer).** Four things land on it. (1) The **placement of the
  right-click preference**, which is a switch in `gt-jira-cart.prefs`, off by
  default, with a label that says what it takes away rather than what it adds.
  (2) The **already-collected rendering** in the live list should agree with the
  green tint the gesture puts on the page, so that a row and its link do not
  disagree about the same fact — `05` §3 left the wording to `08` and this is
  the constraint on it. (3) The **hover/keyboard gap** in *What was not settled*
  item 1: the live list is the only path to an add for anyone who cannot hover.
  (4) **Whether a live-list row is a toggle too.** §5 made the *gesture* one and
  deliberately stopped there. The symmetry argument is strong — a collected row
  showing a `✓` that absorbs the click has the same dead-control problem — but
  the drawer also shows the collection itself, where removal wants a plainer
  affordance than a hover state, and that is `08`'s to weigh. Whatever it picks,
  the two must agree: the same item must not be removable in one section and
  inert in the other.
- **The map.** The *Add gesture* row now names the form. The *Platform* row
  carries a third observation. Both edits are described above and neither
  reverses anything — `09` had already removed the ranking, and this ticket was
  always the one that would write the form in.
