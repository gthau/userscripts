# Configurable exports — the decision record and the six tickets

> **This directory is LIVE.** Everything else in `docs/jira-cart/` is the frozen
> working record of the map effort. The parent
> [`prompts-configurability.md`](../prompts-configurability.md) is the prompt that
> produced this; it has now been run, and this is its outcome.
>
> The ADR, [`src/jira-cart.user.md`](../../../src/jira-cart.user.md), remains the
> decision of record. Nothing here overrides it. Each ticket says which ADR
> sections it must amend, **in place, with its date, keeping the original
> reasoning** — §2.8 carries two such amendments and they are the model.

Settled by grilling on 2026-08-21 and 2026-08-22, and by a prototype
(`test/jira-cart/config-prototype.html`) that overruled the first UI design twice.

---

## The decision, in one paragraph

The exports become configurable **without a template**. §2.8's finding is UPHELD,
and its reason restated: a template means user-written styling reaching the
clipboard, and the five measured paste rules then have no enforcement point. What
ships instead is a **filter over a fixed renderer** — named presets for the issue
reference, two ordered field lists, and two grouping dropdowns. `detailChip` stays
the one place styling is written, and no preference can reach it.

## The 23 decisions

**Shape**

1. All three exports in scope: 🔗 Links' line, 📋 Details' fields, 📊 Report's
   grouping. They are not one feature.
2. **No template.** Considered seriously, and declined. The user leaned toward real
   markdown and HTML templates and withdrew it in favour of "something
   user-friendly" once the enforcement problem was on the table.
3. **Two mechanisms, because the needs differ in kind.** The issue reference wants
   NAMED PRESETS — punctuation and where the URL sits are not expressible by
   toggles. The field tail wants an ORDERED TOGGLE LIST.
4. §4's rejection of `[KEY] Summary — URL` is **OVERTURNED**. Its ground was "its
   only distinct paste target cannot be named". The user named it: a destination
   that does not render markdown.
5. **One line-shape preference, shared by all three exports**, so §2.14's "the head
   IS §2.8's Links line" stays true. A per-export override is DEFERRED to §6 and
   costs one nullable key per export.
6. **Each preset defines BOTH flavours.** A preset that changed only `text/plain`
   would silently do nothing in Outlook, Word, Teams and Confluence.

**Fields**

7. **Two field lists**, one for 📋 Details and one for 📊 Report. Bite 5 asks what
   stops them drifting; the answer is **ONE CATALOGUE, TWO SELECTIONS** — the field
   ids, their labels and every measured style live in `detailBits`/`detailChip`
   once, and a preference can only say which of them a document uses and in what
   order. *(Built on 2026-08-25: the catalogue is now `FIELD_CATALOGUE` and one
   field's value is `detailBit`, with `detailChip` unchanged. See decision 36.)*
8. **A ticked field is displayed, band or not.** The shipped defaults leave the
   banded fields unticked, so 1.1.0's output is unchanged byte for byte. This
   replaces the hardcoded `detailBits(item, ["priority"])`.
9. **Zero fields is allowed**: the line is the head alone, no em dash. It needs no
   new code — the renderer already does this for an issue Jira returned nothing
   about. Cost accepted: 📋 Details configured this way emits 🔗 Links' bytes.
10. **`team` becomes a row field.** Today it is fetched only for the report's
    headings, and 📋 Details has no headings, so the field is unreachable. Off by
    default.
11. **Reorder by DRAG.** Chosen against the recommendation of ↑↓ buttons, after the
    cost was stated: no harness in this repo can drive a drag, because `boot-smoke`
    has no layout. Mitigations are mandatory — see ticket 04.

**The report**

12. **Two dropdowns over seven bandable fields**: priority, team, status category,
    assignee, type, fix version, parent. Band 1 must be a field; only band 2 may be
    `None`. A report with no bands is 📋 Details.
13. **Status bands by CATEGORY, never by name.** `item.category` is already fetched.
    A three-entry rank is justified because the three are Atlassian's own
    vocabulary, not this instance's wording — which is exactly why §2.15 refused a
    rank for priority, whose names already sort right.
14. **Time remaining may not band.** Its band order would be string order over
    durations: `"10m" < "2d" < "9h"` means nothing.
15. **Fix version MAY band, and an issue in two releases appears in both.** Stated
    exception: with a multi-valued band a paste has one line per issue-and-band, so
    *lines equals items* is not the check there. §2.14's "no format ever drops an
    item" still holds — nothing vanishes, something repeats.

**The ⚙ screen** — forced by measurement, not preference: ~22 controls in a drawer
that can be 300×215px, where every container is `overflow: clip`, so anything that
overflows is silently gone.

16. **⚙ is a STATE BUTTON**, on `aria-pressed`, styled with the Cart's existing
    `--gt-cart-selected-bg` / `--gt-cart-selected-text` — the same pair `jira-ux`'s
    locked padlock and the Cart's own active collection chip already use.
17. **⚙ replaces the whole drawer body**: the two sections AND the six-button foot.
    One boolean moves all three, so the button's colour cannot disagree with what is
    on screen. ✕ keeps one meaning on both screens: close the drawer.
18. **The panel is TABS.** Three layouts were prototyped — one long scroll,
    collapsible groups, sub-tabs. Collapsible was chosen and then reversed by use;
    tabs won. **How many tabs is still open** — see below.
19. **The last tab is a stored preference.** Precedent: §2.9 stored whether the
    drawer is open, reversed from in-memory after use, because "a reload is not the
    end of a sitting".
20. **An unrecognised tab id falls back to the first tab**, never a blank screen —
    exactly what `layout` and `corner` already do. Tabs need no open/closed set: a
    tab bar shows every tab whether it has ever been pressed or not, so a new tab is
    visible the moment it exists.
21. **A NEW FIELD arrives OFF; a NEW TAB arrives VISIBLE.** These differ on purpose.
    A tab appearing changes nothing about what a button emits. A field appearing
    ticked would change what a button produces without being asked, which is what
    §2.8 and §2.14 both warn against.
22. **`Restore export defaults` reaches the export settings only** — line shape,
    both field lists, both bands. Not the appearance switches, and not which tab you
    are on. Confirms in place (`Restore?`) by §3's `⌫`/`Empty 3?` convention.
23. **An empty stored list is honoured**, not replaced by a default. It is a state
    somebody clicked their way to.

**Settled by fact rather than by asking**

- **The fetch stays all nine fields.** `DETAIL_FIELDS` is unchanged. Three things
  follow: it cannot fall out of step with a preference; changing a preference does
  NOT invalidate a held fetch, because the held rows carry every field; and §2.14's
  "nothing fetched is ever stored" is untouched. The selection is applied at
  RENDER, never at fetch. That also answers cross-tab: another tab changing a field
  list re-renders this one and the armed button stays armed.
- **1.2.0.** The collections blob's `v` is NOT bumped — no stored item shape
  changes, and preferences are not versioned.

---

## Still open, and which ticket each one gates

| Open question | Gates | How it gets answered |
| --- | --- | --- |
| ~~Two, three or four tabs~~ | 02 | **Closed 2026-08-24.** Three; see below |
| ~~How the ⚙ button gets noticed~~ | — | **Closed 2026-08-24 and SHIPPED.** See below |
| ~~Which line shapes ship~~ | 03 | **Closed 2026-08-24.** Five, one of them new |
| ~~Does a visible URL survive Outlook and Teams~~ | 03 | **Closed 2026-08-24.** It does, clickable |
| ~~The em dash collision~~ | 03 | **Closed 2026-08-24.** Accepted |
| ~~Is the drag usable at 300px~~ | 04 | **Decided 2026-08-24, MEASURED 2026-08-25.** It is; see 41 |
| ~~Does the head read `⚙ Settings` while the panel is up~~ | 02 | **Closed 2026-08-24.** It does; see below |

### Answered on 2026-08-24, by the user

Two rows above are closed, one limit is confirmed, and **one new constraint arrived
with them**. The 23 decisions are untouched; these sit beside them.

**24. The head reads `⚙ Settings` while the panel is up.** The repo's convention
wins over the argument for identity: the label IS the state (§2.14, §3). Ticket 02
records it in §2.9 with the cost — the drawer stops naming the collection you are
collecting into for as long as the panel is up, and the badge still does.

**25. COLLECTING FROM THE PAGE KEEPS WORKING WHILE ⚙ IS UP.** New, and a constraint
on ticket 02 rather than a question for it. What ⚙ replaces is the *inside of the
drawer*; the floating `+` beside a hovered issue link is a different element on the
page, and `renderToggle` reads only the hovered anchor and the active collection —
nothing about the drawer's body. So the gesture, the badge count, the right-click
entry and the page decoration all keep working, and **this costs nothing to
honour**. Two consequences to write down rather than discover:

- An add while ⚙ is up **must not close the panel**. Every add calls `render`, so
  the panel has to be a function of the in-memory `prefsOpen` flag — which is what
  ticket 02 already specifies. It is the check that proves it.
- An add in **this** tab or another one re-renders the drawer, so it can land in the
  middle of a field-list drag. §2.11 already carries two defects from the drawer's
  existing drags; ticket 04's drag inherits the problem and must survive a re-render
  it did not ask for.

**26. The drag ships, and the 300px press was NOT run.** Decided on the ground that
a user who finds it fiddly at the minimum width will make the drawer wider — the
drawer is resizable and the grip is right there. Recorded as *decided* rather than
*measured*, so a later session does not read it as a press that happened. The costs
of decision 11 stand unchanged and are now unmitigated by a press: no harness in
this repo can drive a drag, so `moveField(list, from, to)` must be pure and covered,
and §7 gains a browser step. ↑↓ buttons are off the table.

**§2.15 limit 2 is CONFIRMED — `bulkfetch` does return a custom field asked for by
id.** This was ticket 05's confirm-early, and it is now done: 📊 Report was pressed
on a collection whose issues carry a team, and the sub-band headings read the real
team names. Recorded in the ADR at §2.15 limit 2 and appendix C.4, both dated. The
report's whole team band rests on this, and it was *expected rather than known* until
now. **C.5 is untouched** — the other `Team` fields are still unprobed, and limit 1
still says the id is instance-specific.

### Answered on 2026-08-24 by the paste, and one new finding

**27. FIVE line shapes ship, and every one of them survived a real paste.** A.9.1
has the run. Every shape read correctly and a visible URL arrived **clickable**, so
the URL-bearing shapes are available on **all three** exports rather than on 🔗 Links
alone. The paste also asked for a shape the prototype did not offer — `[KEY](url)`,
the markdown link with no summary — which is now `markdown-key` in
`LINE_SHAPE_IDS`. The user called it *"markdown url"*; the id is named for what the
reader sees, and the label is still theirs to confirm in ticket 03.

**28. THE EM DASH COLLISION IS ACCEPTED, because these documents are read and never
parsed.** That is the user's ground and it is worth keeping in those words: nothing
regex-parses a pasted report, so a URL separator that repeats a character the summary
may contain costs a machine's ambiguity rather than a reader's, and the em dash still
marks where the metadata starts. The warning below is left standing because it is
what the decision answers. Both alternatives — a different separator before the URL,
and withholding the plain shapes from the exports that carry a field tail — are
**declined rather than untried**.

**NEW, AND FROM A THIRD PARTY: THE ⚙ BUTTON IS NOT NOTICED.** A beta tester using
1.1.0 did not find the settings at all, which the user confirmed. Measured against
the code: it is a 13px grey glyph in a 22px box with a transparent background and a
transparent border, so it has **no resting affordance** — it looks like chrome until
you hover it, and it sits beside a ✕, which is the one glyph everybody already
recognises. This repo has met the same failure once before and recorded it in A.9: a
dim `■` before the type "read as a broken glyph", and the fix was a word rather than
a bolder pictograph. **The fix belongs to ticket 02**, which rebuilds this button as
a state button anyway; the option chosen goes here when it is chosen. Note the
constraint that rules one option out: the head's height feeds the drawer's 215px
floor (`css-smoke` derives it with `HEAD = 35`), so a **taller** button re-derives
`MIN_BLOCK`, while a **wider** one costs only the collection name's ellipsis.

**29. THREE TABS: Appearance · 📋 Details · 📊 Report, with `Issue reference` pinned
above the bar.** The recommendation, taken. It is the only structure where the shared
setting is not misfiled — `Issue reference` governs all three exports, so a tab that
owned it would tell a small lie about its scope — and it keeps each tab to one group
of about ten rows. **The cost is real and belongs in the ADR:** *Appearance* sits as a
peer of two export tabs, which is not a clean taxonomy. The two structures not taken:
**two tabs** is the cleaner split by kind — how it looks against what it emits — and
costs one scroller holding about 22 rows with two near-identical field lists in it;
**four tabs** gives every group its own tab and costs four labels inside 300px plus a
`🔗 Line` tab that owns a setting governing all three exports.

**30. THE ⚙ GLYPH GOES FROM 13px TO 16px, AND NOTHING ELSE CHANGES. Landed, not
deferred.** The box stays 22px, which is what makes it a one-declaration change: the
head's height is the button's 22px plus its own padding and border, and `css-smoke`
derives the drawer's 215px floor with `HEAD = 35`, so a taller button would re-derive
`MIN_BLOCK`. Five checks in `css-smoke` hold it: the glyph size, the specificity that
makes it paint — the ⚙ went inert at 0.3.0 from exactly that trap — the 22px box the
floor depends on, that the gear's own rule sets no size, and that the shared icon
class still sets 13px, because growing ✕, ⌫ and ↻ with it would leave the gear no more
prominent than it was. All five confirmed able to fail.

Two candidates not taken, recorded rather than lost: a **resting border and fill**,
which reads as a button but spends the contrast decision 16's pressed state needs; and
a **`⚙ Settings` label**, which is what A.9's `■` finding argues for — a word survives
where a dim pictograph does not — at the cost of head width and a shorter collection
name. The chosen fix costs neither height nor width. **If the button is still missed
once ticket 02 has given it a pressed state, the label is the next thing to try**, and
this is the record that it was on the table.

### Answered on 2026-08-25, from use

**31. THE GEAR SAYS WHETHER THE SETTINGS ARE OPEN. Landed early, not deferred to 02.**
Reported as bad UX and it was: the button appeared "bordered in blue after clicking",
the blue arrived **whether the click had opened the settings or closed them**, and a
click anywhere else took it away.

**The diagnosis is the part worth keeping, because the symptom named the wrong thing.**
That blue was the FOCUS ring, not a state. `prefsOpen` lived in memory and *nothing on
screen was a function of it* — the button carried no state at all, so a focus
indicator was the only thing that ever changed on it. This is §2.8's rule about labels
("every label is a function of current state") applied to an attribute, and the ⚙ was
the one control in the drawer that broke it.

Three changes, all shipped:

- **One constant, `PREFS_STATE_ATTR`, interpolated into both** the `setAttribute` in
  `render` and the stylesheet's selector. Two literals would be two values that can
  disagree, and they disagree *silently*: the attribute keeps flipping while the paint
  stops following it, which is exactly how the ⚙ was inert for two versions (§2.11).
- **The active collection chip's three declarations**, not a new blue. That token pair
  is already the Cart's word for "this one is on", and `jira-ux`'s locked padlock uses
  it too. The selector is repeated with `:hover` because the plain hover rule is
  (1,3,2) and would otherwise make an open gear go quiet under the pointer.
- **The drawer clears `:focus` and puts its own ring back on `:focus-visible`.** The
  Cart is not in a shadow root, so Atlassian's stylesheet has every right to paint a
  focused button inside it — and a host rule on `:focus` paints on a MOUSE click,
  where the Cart's own ring deliberately does not. The reset stays scoped to the
  drawer so the badge and the floating toggle keep their rings, and every ring inside
  the drawer must strictly out-specify it or a keyboard user loses their place.

Nine checks, all nine confirmed able to fail. **Decision 16 is unchanged and this is
its early half:** ticket 02 renames the attribute to `aria-pressed` when the panel
stops being a region and becomes the content, which is one constant and no CSS.

**If a blue ring still appears on the click that CLOSES the settings**, then the
browser's own `:focus-visible` heuristic is firing on a mouse click rather than the
host sheet being the cause, and the remaining fix is one line — suppress the mouse
path's focus on that button alone. It is deliberately not written on a guess.

---

### Landed on 2026-08-25, by ticket 03

**32. The fifth shape's label is `Markdown link, no summary`.** Decision 27 left it
open. Chosen against the user's own words *"markdown url"* and confirmed by them: it
reads as a pair with `Markdown link on the key` above it and `Key and URL, no summary`
below it, so the dropdown explains itself. The stated cost is that somebody looking
for the words they used will not find them.

**33. The two heads stay different, and §2.14 says so instead of denying it.** See the
correction below. The `bold` flag is the whole of the difference and it is a
one-argument change in either direction if a paste ever says otherwise.

**CONFIRMED IN A BROWSER the same day, in real Jira.** The `Issue reference` row is
pinned above the tab bar with its five options; all five were pressed on all three
exports and every head took the shape chosen; and the row **fits and reads at the
drawer's 300px floor**, which no harness in this repo can see. ADR §7 step 30 carries
it. **`Restore export defaults` puts the dropdown back**, pressed the same day, which
closes the one half that had been left standing.

### Landed on 2026-08-25, by ticket 04

**34. The two field lists ship, and §2.14's *"Not configurable"* is OVERTURNED —
answered rather than dropped.** The bullet's ground was *"a setting that silently
changes what a button produces is what §2.8 warns about, and a fixed output is
checkable"*, and the amendment answers all three words that carry weight: the setting
is **not silent** (a row of checkboxes in ⚙, on a tab named after the button it
governs), the output is still a **fixed function** of it, and every reachable
combination is **checkable** — `format-smoke` grew 87 checks saying so. What changed
is that there are more combinations, not that any of them is unchecked. §4's row went
with it, same date, same reasoning. **The line neither crosses is the one §2.8 drew:**
a preference may say which fields and in what order, never what a field looks like.

**35. `detailBits` lost `skip` and gained the selection, and the direction is the
point.** A skip list says which fields a FORMAT declines, so the format owns the
answer; a selection says which fields a DOCUMENT uses, so the preference does — and
the two documents can then differ without either knowing about the other. The
hardcoded `detailBits(item, ["priority"])` is gone; 📊 Report's default list simply
leaves priority unticked, so its bytes are 1.1.0's.

**36. The catalogue split out of the renderer, and a new seam needed a new check.**
`FIELD_CATALOGUE` names the ids and the labels; `detailBit(id, item)` answers for one
field; `detailChip` still owns every measured style. That creates the same defect
shape `SHAPES`/`LINE_SHAPE_IDS` has — **a catalogue id with no `case` is a field that
can be ticked and draws nothing** — so `format-smoke` ticks every catalogue id against
an item carrying every field and requires a bit back. Two more tables are held
together the same way: the tabs that EDIT a field list and the exports that READ one
must name the same preference keys.

**37. The drag survives a re-render because it carries an ID, never an index.** This
is the answer to the hazard decision 25 created and §2.11's two existing drag defects
pointed at. An add from the page keeps working while ⚙ is up, every add calls
`render`, and another tab can write this very list — so by the time the pointer comes
up the row under it may be at a different index than it was at `dragstart`. Both ends
are resolved against the stored list at drop time. A stale index cannot exist because
none was kept, and the drag therefore needs **no entry in the `dragging` guard**:
unlike the grip and the divider it owns no property that `render` puts back.

**HTML5 drag and drop, not the grip's pointer plumbing.** Two reasons, and the second
is the load-bearing one: a reorder wants a drag image and a drop target, which the
platform gives away and `trackDrag` would have to grow; and **Jira's own board and
backlog drags are pointer-based**, so this is the mechanism least likely to collide
with them on a page we do not own. It is also what the prototype the user pressed
used.

**38. The panel MOVES its rows and destroys none of them**, and the order on screen is
compared against the order on screen rather than against a remembered signature. The
live list and the chips keep a signature because they compare content that costs
something to rebuild; here the comparison is eight ids long, and deriving it means
there is no variable to reset when `ensureDrawer` builds a fresh drawer — which is a
bug a signature would have had, silently, in exactly the case where the rows are back
in catalogue order and the signature says they are not. `boot-smoke` asserts node
identity across a reorder, so a later session cannot quietly turn it into a rebuild.

**39. THE 300px PRESS WAS NOT RUN AT THE TIME, and decision 26 was why.** Kept
because for one day this was the only claim in the ticket resting on an argument
rather than a measurement: a user who finds the drag fiddly at the minimum width will
make the drawer wider. See 41 — it no longer rests on that.

### Confirmed in a browser on 2026-08-25, the same day, in real Jira

**40. §7 STEP 31 WAS RUN, LESS ITS THIRD AND SIXTH ITEMS.** The user installed it and
pressed it. What the pass adds is everything a harness cannot see, and two of the
three are things nothing in this repository could ever assert about:

- **A drop from one list towards the other was REFUSED.** This is the only behaviour
  in the effort with nothing in the file to check: the refusal is the *platform's
  own*, standing because `onFieldOver` declines to call `preventDefault` on a row
  whose list does not match. A harness cannot see the absence of a call turning into
  a cursor that says no.
- **Every field unticked emits the issue reference alone**, no em dash — decision 9's
  stated cost, seen rather than asserted.
- **`Team` ticked reaches 📋 Details**, which no configuration of 1.1.0 could produce.
  It needed no separate paste check: it takes `detailChip`'s default branch, the same
  plain grey span assignee and fix version have used since A.9 pasted them.

**What was NOT reached: items 3 and 6** — pressing the three exports *after* a
reorder, and ticking a field *while* `📋 Copy` is armed. Both are already held
outside a browser, so what is missing is only the paint. Listed rather than chased.

**41. THE 300px QUESTION IS NOW MEASURED, AND THE DECISION HELD.** A row was dragged
with the drawer at its 300×215 floor and the feature came back working. **The
fallback decision 26 leaned on was not needed** — nobody had to widen the drawer to
reorder a list. Decision 26 is not deleted and 39 is kept above it, because *the
standing of a claim* is what this record tracks and for one day this one was an
argument. The reasoning is still the right answer for the day the panel grows past
eight rows or a label past `Time remaining`; the panel is a scroller and the grip is
still right there. §2.14 carries the amendment in place, dated, with the original.

**Twenty-one mutations were confirmed able to fail** in a scratch copy: the catalogue
seam, `moveField`'s downward off-by-one and its non-integer guard, both shipped
defaults, the em dash on an empty selection, the selection not being handed down at
all, the panel rebuilding instead of moving and not reordering at all, a tick sending
its field to the end of the list, the two lists collapsing into one — and three in the
stylesheet, including **the same specificity trap this sheet has now been caught by
twice**: the dragged row's ground is by definition under the pointer, so without a
`:hover` twin it would win on source order alone.

---

**Nothing is open. Ticket 05 can be run from its own file, and 06 records what 02,
03 and 04 landed.**

**The em dash collision, because it is the sharpest thing the prototype found.**
§2.8 invented the em dash because *"a summary can contain dashes"*. `RDC-1513`'s
real summary contains ` - ` itself, so a plain-URL preset uses the summary's own
punctuation as its URL separator, and then the em dash lands after a 45-character
URL:

```
- RDC-1513: Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts - https://dalet.atlassian.net/browse/RDC-1513 — Story · Dev Resolved
```

That is precisely the defect the em dash exists to prevent, reintroduced by the
preset. It may mean the plain shapes need a different separator, or that they are
unavailable on 📋 Details and 📊 Report. **Paste it before deciding.**

---

## Two ADR corrections the prototype forced out

Neither is caused by this effort. Both are wrong in the shipped document and must
be fixed by whichever ticket touches that section.

1. **§2.14 claims Details' head "is §2.8's Links line, unchanged".** True of
   `text/plain` only. On the HTML side `formatDetails` puts `font-weight:600` on the
   key's anchor and `formatLinks` does not. Ticket 03. — **FIXED on 2026-08-25**, and
   the question it opened was answered rather than left: **the two heads stay
   different**, because the bold marks where an issue starts on a line that carries a
   field tail and 🔗 Links has no tail. Converging either way would change bytes 1.1.0
   has been putting on the clipboard, and nobody has pasted a Details line with an
   unbolded key. The shared shape carries a `bold` flag; §2.14 says so, dated.
2. **`formatReport`'s docblock still says one press arms both stepped buttons.**
   §2.15 reversed that on 2026-08-21 and the comment never caught up. Ticket 05.

---

## The six tickets, and what blocks what

```
01 preferences ──┬── 02 settings screen
                 ├── 03 issue reference presets ──┐
                 ├── 04 field lists ──────────────┼── 06 record and ship
                 └── 05 report bands ─────────────┘
```

| # | Ticket | What it lands |
| --- | --- | --- |
| [01](01-preferences.md) | The preferences exist before anything reads them | New keys, range-checked, `store-smoke`. No visible change |
| [02](02-settings-screen.md) | ⚙ is a screen, not a strip | The mode, the state button, the tabs, the restore |
| [03](03-issue-reference-presets.md) | One head, five shapes, both flavours | The shared line-shape preset |
| [04](04-field-lists.md) | Two selections over one catalogue | The two field lists and the drag |
| [05](05-report-bands.md) | Seven bands, and one of them repeats an issue | Generalised grouping |
| [06](06-record-and-ship.md) | The version, the rig and the record | 1.2.0, the rig, the docs |

**01 must land first.** 02, 03, 04 and 05 are independent of each other once it
has: each reads its own preference and touches its own renderer. 06 is last
because it records what the others decided.

**Take them one per session.** Each ticket file is the session prompt. Read the ADR
sections it names before anything else.
