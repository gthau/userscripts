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
   order.
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
| ~~Is the drag usable at 300px~~ | 04 | **Closed 2026-08-24.** Drag ships; see below |
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

---

**Nothing is open. Tickets 02, 03, 04 and 05 can each be run from their own file, and
06 records what they land.**

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
