# Export presets — the decision record and the five tickets

> **This directory is LIVE.** It is the working record of the effort that follows
> 1.2.0's configurable exports. `docs/jira-cart/configurability/` is the frozen
> record of that one; read it for the arguments this effort inherits, and note that
> **four of its decisions were reversed by pressing a control** and a fifth option
> was asked for by a real paste. None of the five came from re-reading a design.
>
> The ADR, [`src/jira-cart.user.md`](../../../src/jira-cart.user.md), remains the
> decision of record. Nothing here overrides it. Each ticket says which ADR
> sections it must amend, **in place, with its date, keeping the original
> reasoning** — §2.8's two amendments are the model.

Settled by grilling on 2026-08-27. Every decision below is the user's; where one
went against the recommendation the recommendation and its ground are kept, because
that is the part that has to be answered if it is ever revisited.

---

## The problem, in the user's words

> Some users need to export Details or Reports in different shapes for different
> audiences. The Technology Portfolio Office sends an epics report ordered by fix
> version and priority, with no point grouping by team because it is aimed at one
> team. The same list going to executives wants grouping by priority or fix version
> and then by team, and different fields. Today that means going to ⚙ and changing
> the fields and headings every time, which is annoying.

## The decision, in one paragraph

Each of 📋 Details and 📊 Report owns a **list of named presets**, and that list is
the only place its fields, their order and its headings live. One preset per list
carries a **★**, and that is what a plain press of the button uses. Each of the three
link-bearing buttons gains an **arrow** — a native dropdown — that runs the same
gesture with a different choice: for 📋 and 📊 one of that button's presets, for 🔗
Links one of the five line shapes. §2.8's finding is **untouched**: a preset is still
a filter over a fixed renderer, `detailChip` is still the one place styling is
written, and no user-written string reaches the clipboard.

---

## The 25 decisions

**What a preset is**

1. **Presets ARE the export configuration.** The five export keys stop being the live
   config; a preset holds that state and there is no unnamed copy of it. This is the
   answer to the problem above: the hand-edit the user is complaining about becomes
   impossible to do by accident, because everything you print has a name.
2. **Two lists, never shared.** A 📋 Details preset and a 📊 Report preset are
   different kinds of thing — one has headings and one cannot.
3. **A preset holds:** a name, the ★ flag, the ordered `{id, on}` field list, one
   line shape, and — 📊 Report only — the two band ids.
4. **🔗 Links has no presets**, and this was the user's own reformulation of the
   question. Its only configurable property is the line shape, which is already a
   fixed named list in the script, so *the shape list is the preset list*. It keeps
   one dropdown of its own and gains an arrow over the same five shapes.
5. **A preset ALWAYS names a shape**, and there is no *follow the shared setting*
   state. **Chosen against the recommendation.** The recommendation was §6 item 16's
   nullable — `null` follows the shared dropdown, anything else overrides — and item
   16 states plainly that storing a shape instead is the *silently stops following*
   bug. What makes it not that bug here is that a preset is a thing the user built
   and named, not a key touched on their behalf. **The cost is real and is limit 3
   below:** changing your line shape everywhere means editing every preset, and
   nothing tells you which one you missed.

**The settings screen**

6. **FOUR TABS: `Appearance` · `🔗 Links` · `📋 Details` · `📊 Report`.** The pinned
   `Issue reference` row moves into the 🔗 Links tab, because it governs that button
   alone once decision 5 is taken. **This reopens §6 item 17**, which predicted
   exactly this pressure — *"the moment a second kind of setting arrives … the bar
   has two groups in it"* — and ticket 03 must record which way it went and what it
   cost. Note that `paste-test.html` already carries a `tabs4` variant from the last
   effort, and that variant shortened its labels to `🔗 Line` and `⚙ Look`, which is
   evidence about the fit rather than a style choice.
7. **An edit writes immediately, into the selected preset.** No Save button and no
   draft. Every control in the drawer already writes on change; a draft would be the
   only one in the script, and it would need a rule for closing the drawer, switching
   tab and another tab writing, plus an unsaved marker on a screen with no room for
   one.
8. ~~**`Save as new…` copies the selected preset** under a name you type, and your
   edits then go into the copy. A new preset is usually a variation of one that
   exists.~~ **REVERSED ON 2026-08-27, ON THE FIRST PRESS OF THE PROTOTYPE. It is
   `+ Create preset`, the name is committed FIRST, and it starts from the shipped
   defaults.**

   The original is kept word for word because the amendment has to answer it, and
   because it was **not wrong about anything except the order**. What killed it is
   decision 7: editing writes straight into the selected preset, so the flow anybody
   actually uses — change the fields, then save the result under a new name —
   **modified the old preset as well as making the copy.** The user's words: *"I first
   changed the selected fields, reordered fields then pressed Save as new, the new
   preset is properly created but the previous one is actually modified already.
   That's very confusing."*

   **The fix is an ORDER and not a mode.** Press `+ Create preset`, type a name, press
   `Create`: the preset exists, is selected, and everything changed from then on lands
   on it. There is nothing to accidentally modify because creating comes before any
   editing.

   **AND IT NEEDS NO DRAFT, which is what makes it cheap.** The user's own first
   description was a form holding unsaved work with a Cancel, and it was weighed
   against this: it would be the only unsaved state in the Cart, and it would need a
   rule for closing the drawer, switching tab, an add arriving from the page mid-form,
   and a reload — four rules where this needs none. **The cost is that there is no
   Cancel:** undoing a new preset is deleting it, which asks twice. `Escape` closes
   the name field, which is not a cancel over unsaved work because there is none.

   **IT STARTS FROM THE SHIPPED DEFAULTS, chosen against the recommendation.** The
   recommendation was a copy of the preset you had open, which is safe once the
   creation is not an edit — most new presets are variations. The shipped defaults win
   on being the version with **no relationship to any existing preset at all**, which
   is the cleanest thing to explain about a control that has just been reversed for
   being confusing. **The cost is limit 9:** a small variation of an existing preset
   is rebuilt by hand, and nothing reports which ticks were missed.
9. **Which preset the tab is showing is IN MEMORY, and starts at ★ each sitting.**
   Nothing is stored, so nothing can point at a preset that has been deleted.
   `settingsTab`'s own precedent (configurability decision 19 — *"a reload is not the
   end of a sitting"*) was weighed and not followed: that one is about the drawer
   reopening, and this one buys two stored ids that each need a dangling rule.
10. **★ IS A FLAG ON THE PRESET, NOT A STORED ID.** This is §2.4's own reasoning
    applied where it also holds: `collections` keeps no pointer to the active one — it
    is `collections[0]`, so promotion happens by construction and no id can dangle.
    Presets are displayed sorted by name (decision 12), so position cannot carry that
    meaning, and a flag on the thing itself is what replaces it. Delete the preset and
    the flag goes with it.
11. **Delete arms first, and the last preset cannot be deleted.** The collection
    chip's ✕ already does both: armed it reads *"Click again to delete X … There is no
    undo"*, and on the only collection it reads *"it is the only collection, so it
    cannot be removed"*. Deleting the ★ preset passes ★ to the first remaining one by
    name. There is always at least one preset, so *what does this button print* always
    has an answer.
12. **Presets are displayed SORTED BY NAME**, case-insensitively. **Chosen against
    the recommendation**, which was creation order. It costs the ability to put your
    most-used preset first and it moves a preset when you rename it; it buys a list
    that never surprises you and a stored order that carries no meaning at all, so
    there is nothing to maintain and no reorder UI to build.
13. **Names reuse `uniqueName` unchanged** — trimmed, clash ignores case, ` 2`
    appended, and the same rule on create and on rename. An empty name is refused with
    nothing written, exactly as `commitRename` already does.
14. **`↺ Restore export defaults` reaches the SELECTED preset.** On 🔗 Links it
    resets that tab's dropdown. Other presets are untouched. The control already shows
    only on tabs carrying export settings (`exports: true`), so its placement does not
    change.

**The arrows**

15. **Three arrows, each a native `<select>`.** Every container in the drawer is
    `overflow: clip`, so a menu we draw ourselves is cut off; a native select's option
    list is painted by the browser on top of the page. That is already why the two band
    dropdowns are native, and it is a measurement rather than a preference.
16. **THE ARROW DOES WHAT ITS BUTTON DOES, with your pick instead of the default.**
    🔗 Links copies straight away. 📋 and 📊 start their fetch, and the `Copy` press
    that follows uses the pick. If the button is **already armed** at `Copy`, the arrow
    copies — the fetch asks for all nine fields whatever the preset says, so a
    re-fetch would buy nothing.
17. **The pick NAMES a preset and is resolved at the press**, which is the rule a
    plain press already follows. One rule for both paths. If the named preset is gone
    by then, ★ is used. **That path is reachable with one pair of hands** and this is
    why the guard exists rather than a two-tab story: arm 📊 Report, open ⚙ — which
    hides the foot — delete the preset you picked, close ⚙, press `Copy`.
18. **The arrow is always shown**, even where a list holds one preset. An arrow that
    came and went would change the foot's width and its row count, which is the
    reflow-under-the-pointer defect §2.14 spent a day removing.
19. **The arrow's list holds presets only.** No `Edit presets…` entry: one dropdown
    where most entries copy something and one does not is the shape of thing that gets
    reported as *"I picked it and nothing happened"*. Discoverability is the
    prototype's problem instead (limit 6).

**The store**

20. **A FOURTH KEY, `gt-jira-cart.presets`**, handled the way collections are — a
    broken entry is repaired or dropped and the rest survive. Presets are the whole
    export configuration under names the user typed, which is user data. The prefs
    path is deliberately built to throw everything away and fall back to the shipped
    defaults when the blob will not parse; putting presets there would make that
    designed behaviour into *you lost every preset and every name*. The store's own
    comment already draws this line: *"a malformed preference cannot take a collection
    with it."*
21. **First run builds one `Standard` preset per list, marked ★**, carrying the
    stored `detailsFields` / `reportFields` / `reportBand1` / `reportBand2` /
    `lineShape` as they are. **Both buttons then print exactly what they printed at
    1.6.0, byte for byte.** The name is `Standard` and not `Default`, because *the
    default preset* and *the preset called Default* would become two different things
    the moment ★ moved, and the list would read wrong from then on.
22. **The four ex-export keys leave the prefs blob. `lineShape` stays**, as 🔗 Links'
    own setting. `normalisePrefs` keeps only known keys, so dropping them from
    `DEFAULT_PREFS` drops them on the next write with nothing to migrate.
23. ~~**The foot may gain a row, and the floor is re-derived from a MEASUREMENT.** By
    arithmetic the six buttons already come to roughly 452px of content against ~275px
    usable at the 300px floor, so the foot is already two rows; three arrows add ~60px
    and tip it to three, taking the drawer's minimum height from 215 to about 245.~~
    **MEASURED ON 2026-08-27, AND THE ARITHMETIC WAS WRONG. The arrows cost 0px and
    `MIN_BLOCK` STAYS 215.**

    The arithmetic is kept because it is what the measurement overturned, and because
    the sentence after it was the only right thing about it: *that arithmetic is not
    the answer*. The foot at the 300px floor is **2 rows and 66px with the three
    arrows, and 2 rows and 66px without them** — they fit in slack the second row
    already had. The estimate's per-button widths were simply too generous; it had the
    right font size and still got the wrap wrong, which is an argument for measuring
    rather than for estimating more carefully.

    **IT GENERALISES, and that is worth stating rather than assuming.** 300px is
    `MIN_INLINE` — the drawer cannot be narrower — and flex wrapping never needs more
    rows as the width grows. So the worst case is the case that was measured, and the
    floor is safe at every width.

    **The first attempt at this measurement was WITHDRAWN**, because the rig's foot had
    drifted from the script's in four values. See the press section below; the 62px it
    reported before the fix against 66px after is the fix taking effect.

    **What ticket 04 owes is therefore a NON-CHANGE**: `COLLECTION_FIXED_PX` and
    `MIN_BLOCK` are untouched, and the comment above them gains the fact that the foot
    is two rows *with* the arrows and that it was measured. Writing down a floor that
    did not move is cheaper than a later session wondering whether it did.
24. **1.7.0.** The collections blob's `v` is **not** bumped: no stored item changes
    shape (§2.4). So no `gt-jira-cart.collections.bak` write either.
26. **THE ARMED LABEL CARRIES A MARK: `📊 Copy ★` or `📊 Copy ▾`.** Added
    2026-08-27, from the prototype, and it exists because of something the user said
    rather than something they were asked. The prototype press was supposed to answer
    whether limit 1's split is confusing; **the answer that came back was better than
    the question**: *"A plain report press triggers the fetching, so it changes the
    button text to Fetching regardless of the preset used."* Which is exactly right —
    the label is the fetch ladder (`📊 Report` → `📊 Fetching…` → `📊 Copy`) and it
    never names a preset, so **the control you press tells you nothing about what it
    will produce.**

    So the armed label says which of the two it is: **★ for the default, ▾ for
    something picked from the arrow.** It cannot show the preset's NAME — that is the
    tooltip's job — but *whether you are on the default* is the half that matters,
    because it is the half you can get wrong without noticing. This follows the Cart's
    own rule that the label IS the state, and it is the same rule §2.14 applied to the
    ladder in the first place.

    **MEASURED on 2026-08-27: the row does not jump.** The two stepped buttons reserve
    `min-inline-size: 11ch` because a changing label used to rearrange the whole foot,
    and the mark fits inside it. Pressed twice — once at the rig's drifted 11px text
    and again at the script's 12px — and it held both times.

    **THE MARK IS ON THE ARMED RUNG ONLY, and the rule is that it appears exactly
    where it can VARY.** Asked by the user on 2026-08-27 — *"should the buttons read
    Copy ★, or will they read Details ★ and Report ★?"* — and the answer is `Copy ★`.
    At idle there is nothing to disambiguate: a pick exists only while a fetch is held,
    and **picking from the arrow IS the fetch** (decision 16), so an idle button can
    only ever mean ★. A mark that cannot change is noise. `📋 Fetching…` carries none
    either — you have just picked, and `Fetching… ★` would overflow the 11ch box.

    **A consequence worth having on purpose:** the idle foot stays byte-identical to
    1.6.0's, so an install that never opens an arrow cannot tell the mark exists. That
    is the same requirement every default in the last effort carried.

    **🔗 Links carries no mark, and that is not an inconsistency.** It copies on one
    press, so there is no moment at which a 🔗 Links press is pending and could be
    about to use something other than its default.

25. **THE PROTOTYPE COMES FIRST, AND IT EXTENDS `paste-test.html`.** Not a second
    file. Ticket 06 of the last effort recorded why in the strongest terms available:
    two rigs existed for days, **both** had drifted, and neither drift was found by
    anything going red, because nothing under `test/` reads an HTML file.

---

## Settled by fact rather than by asking

- **Switching a preset cannot invalidate a held fetch.** `DETAIL_FIELDS` asks for all
  nine fields whatever any preference says, and the selection is applied at **render**.
  So a preset change — including one made in another tab — costs a re-render and
  nothing else, and an armed `Copy` stays armed. Configurability's own note on this is
  unchanged and this effort inherits it.
- **A drawn menu would be invisible.** See decision 15.
- **A wrapping four-label tab bar does NOT re-derive `MIN_BLOCK`.** The panel
  *replaces* the drawer body and the foot, so while it is up the only fixed part is the
  35px head, and the panel is already the drawer's one scroller. Two rows of tabs cost
  panel space. The **foot** is the part that is a fixed part, which is decision 23.
- **★ needs no dangling rule**, and delete needs no new convention. See decisions 10
  and 11.
- **`Restore` already shows only on export tabs**, off the `exports` flag in the tab
  table. See decision 14.
- **📃 Names, 🔑 Keys and 🔍 Search are untouched.** None of them reads the line
  shape today and none gains an arrow.

---

## Stated limits

1. **The preset you are editing and the preset that prints are different things.**
   You can edit `Executive` all afternoon and a plain press still prints `Standard`.
   This is inherent to decision 1 plus decision 9 and is accepted, not solved.
   > **NARROWED on 2026-08-27 by decision 26.** It said ★ in the tab and ★ in the
   > arrow's list were *"the only things that say so"*, and the user pointed out what
   > that misses: neither of them is on the control you press. The armed label now
   > carries ★ or ▾, so the button says **whether it is on the default** at the moment
   > it is about to act. What is still true, and still accepted, is that nothing names
   > the preset except a tooltip, and that editing one preset while another is ★
   > changes nothing about what a plain press prints.
2. **Four tab labels inside 300px is unmeasured.** Decision 6, and limit 5 of §6 item
   17's prediction. Ticket 01 answers it.
3. **A preset always names a line shape** (decision 5), so changing your shape
   everywhere means editing every preset and nothing reports which you missed.
4. **Presets sort by name** (decision 12), so a rename moves one.
5. ~~**The drawer's minimum height probably rises to ~245px** (decision 23).~~
   **CLOSED on 2026-08-27, by measurement: it does not rise.** The arrows cost 0px at
   the 300px floor. Struck through rather than deleted, because the cost it named was
   real and accepted for a day — and because the sentence under it still holds and is
   the reason this measurement was taken twice: **`MIN_BLOCK` is a hand-maintained
   number that has already gone stale once** — `store-smoke` carried `160` against the
   script's `215`, and the check was green because it was measuring the harness's own
   copy.
6. **The arrow may not be noticed.** A beta tester failed to find ⚙ at 1.1.0 because
   it was a 13px grey glyph with no resting affordance, and the recorded fix was a
   larger glyph with the label held in reserve as *the next thing to try*. A bare caret
   glued to a button is the same failure waiting to happen. Ticket 01 presses it.
7. **No preset reordering and no cap** on how many a list holds.
9. **A new preset starts from the shipped defaults** (decision 8), so a small
   variation of an existing preset is rebuilt by hand and nothing reports which ticks
   were missed. The declined alternative — starting from a copy of the preset you had
   open — is one line of code if this bites.
10. **There is no Cancel while creating** (decision 8). Undoing a new preset is
    deleting it, which asks twice.
8. **No keyboard path**, by §6 item 4. The Cart is not intended to be operated by
   keyboard input, and adding one here would say that limit had moved.

---

## What the prototype must answer, and nothing else can

1. **Do four tab labels fit at 300px**, and if not, what gives — a wrapping bar, or
   shorter labels the way the existing `tabs4` variant already chose.
2. **How many rows the foot takes with three arrows at 300px, and therefore the new
   `MIN_BLOCK`.** A number, not an estimate.
3. **Does the arrow read as pressable at rest.** See limit 6.
4. **Is the edit-versus-★ split confusing in the hand.** See limit 1. This is the one
   the last effort's history says to take most seriously: its panel layout was settled
   by argument, prototyped, chosen — and then reversed twice by pressing.

---

## The five tickets, and what blocks what

```
01 prototype ── 02 the presets store ──┬── 03 the settings screen ──┐
                                       └── 04 the arrows ───────────┴── 05 record and ship
```

| # | Ticket | What it lands | Landed |
| --- | --- | --- | --- |
| [01](01-the-prototype.md) | The rig grows a presets variant, and four numbers come back | No script change at all | **BUILT AND PRESSED 2026-08-27.** It reversed decision 8, added 26, closed limit 2, and found the rig's fourth drift. **Two numbers owed on a re-press** |
| [02](02-the-presets-store.md) | The fourth key exists before anything reads it | New store, first-run build, `store-smoke`. No visible change | |
| [03](03-the-settings-screen.md) | Four tabs, and presets are managed in them | The picker, ★, rename, delete, `Save as new…`, the per-tab restore | |
| [04](04-the-arrows.md) | Three arrows, and the export path reads a preset | The selects, the pick, the floor re-derivation | |
| [05](05-record-and-ship.md) | The version, the record | 1.7.0, ADR amendments, §6, §7, the READMEs | |

### Ticket 01 is built and the four answers are still owed, 2026-08-27

`test/jira-cart/paste-test.html` carries the fifth `Tabs` variant,
`Presets · proposed`: the four-tab bar at full label length, the preset block in both
export tabs, a per-preset `Issue reference`, the foot's three arrows, an `Arrow` switch
for the two candidate resting looks, and a readout under the drawer that measures the
foot **with the arrows and without them** in layout pixels and prints the `MIN_BLOCK`
the delta implies. The three older variants are untouched — `tabs2` and `tabs4` are
§2.9's rejected rows. The fence's *"The Cart itself. No drawer…"* line was false since
1.2.0 and is fixed.

**IT WAS BOOTED AGAINST A FAKE DOM, which is this repository's own standing advice**
(`docs/jira-cart/README.md`: *"if you keep one, boot it against a fake DOM once and
you will know"*). The bench's script block was extracted and run in node — load, then
switch variant, then every handler the panel builds pressed one at a time with the tree
re-read after each press. `node --check` was not enough and could not have been: all
three faults this page has had were syntactically valid.

**Nothing threw**, and a fresh presets panel on the 📋 Details tab draws four tabs, two
dropdowns, nine buttons, nine inputs and its star note. **Two faults turned up and both
were in the CHECK rather than in the page** — recorded because that is the usual result
and it is not an argument for skipping the run:

| What went wrong | Where |
| --- | --- |
| The stub stored `textContent = ""` as a string instead of clearing children, so the panel's tree grew on every render and node ran out of heap. It read as a leak in the page | the stub |
| The structural assertion pressed nothing first, so it measured the **`Appearance`** tab — `tabs[0]`, where the panel opens — and reported that tab's two dropdowns and checkbox as the preset block. **The counts looked plausible**, which is the hazard | the check |
| A second assertion matched the star note by its leading ★ and found an `<option>` in the picker, whose text also starts with one — passing on the wrong node | the check |

**What the run does not say is anything about layout**, which is the whole reason the
ticket ends in a browser.

### PRESSED on 2026-08-27. Three of the four are answered, and the press reversed a decision

| # | The question | The answer |
| --- | --- | --- |
| 1 | Do four full labels fit at 300px? | **Yes, and it holds.** Limit 2 is closed — see the verification below |
| 2 | The foot's rows, and the floor | **ANSWERED, WITHDRAWN, RE-MEASURED.** 2 rows and 66px with the arrows and without them: **they cost 0px and `MIN_BLOCK` stays 215.** Decision 23's arithmetic was wrong |
| 3 | Does the arrow read as pressable? | **The divider wins**, and the quiet variant was a defect rather than a candidate — see below |
| 4 | Is the edit-versus-★ split confusing? | **Overtaken by a better answer**, which is decision 26 |

**All four are answered. Ticket 01 is done**, and what it cost is one reversal
(decision 8), one new decision (26), one closed limit (2), one closed and struck limit
(5), one corrected decision (23), and the rig's fourth drift. Not one of those came
from re-reading the design.

**Question 3 found a fault, not a preference.** The quiet variant was reported as
*"strange, like if the button is somewhat cut"*, and it was: `.split[data-arrow="on"]`
drops the button's right border to make room for the arrow, and the quiet variant
replaced it with a **transparent** one — so the button was genuinely open on that side.
The fix is the user's own: the caret sits **inside** the button, sharing its border and
its ground, with no divider. **So the two looks now differ by exactly one
declaration** — whether the arrow carries a left border — and that border is the whole
question, because it is the only thing on the control saying the caret does something
other than what the button does. **The divider is preferred**; the rebuilt quiet
variant is kept beside it as the honest alternative rather than as a straw man.

**Question 4's answer is worth more than the question.** It was asking whether the
edit-versus-★ split reads badly; what came back is that **the button never names a
preset at all**, because its label is the fetch ladder. That is decision 26 and it
narrows limit 1.

**And the press reversed decision 8** — `Save as new…` is gone. See it in place above;
it is the fourth time in two efforts that a control was reversed by somebody pressing
it, and the first three are in `configurability/`.

### THE FOOT MEASUREMENT WAS WITHDRAWN, and the reason is the rig's fourth drift

**What the page said, read back by the user, 2026-08-27:**

> Foot at 300px. With three arrows: 2 rows, 62px. Without them: 2 rows, 62px. The
> arrows cost 0px, so the drawer's minimum height does not move: MIN_BLOCK stays 215.

**It is kept because the standing of a claim is what these records track, and for
about an hour this one was a measurement.** It is not one. Reading the rig against the
script — prompted by the number being *better* than decision 23's arithmetic predicted,
which is the direction that deserves a second look — found the **foot had drifted in
four values**:

| | script | rig | effect |
| --- | --- | --- | --- |
| foot padding | `6px 10px` | `6px 8px` | the rig laid the row out in 4px MORE width than it has |
| button padding | `3px 8px` | `2px 6px` | every one of the six buttons was 4px narrower and 2px shorter |
| font-size | `12px` | `11px` | every label ~9% narrower, and **both `11ch` reservations with them** |
| border-radius | `4px` | `3px` | cosmetic |

Six buttons at 4px is 24px, plus about 9% on every label — comfortably enough to move
where the row wraps. **The page was answering a question about itself**, which is the
rule that page has lived under since 1.2.0 and the fourth time it has been broken. All
four values are now the script's, and the head (`gap: 8px; padding: 6px 10px`) and the
chips row (`padding: 6px 10px 0`) were drifted too and are fixed with it.

**What CANNOT be fixed there, and is now in the page's fence:** a `ch` is the width of
a `0` in the inherited font family, and the page inherits IBM Plex Sans where the
drawer inherits Jira's own stack. So `11ch` is the right rule with a slightly wrong
ruler, and the re-press will be close rather than exact.

**Decision 23's arithmetic is NOT vindicated by this.** It predicted three rows using
12px, which is the script's size — so it had the right ruler and may still be wrong.
The re-press decides, and until it lands the floor is an open number.

### Why answer 1 survived the same reading

**The tab bar was checked and is byte-identical**, which is why *"they fit"* stands
rather than going the same way as the foot: `button.gt-cart-tab` is
`padding: 3px 9px; font-size: 11px; border-block-end: 2px solid transparent` in both,
and the bar itself is `display: flex; gap: 2px` with a 1px bottom border in both. That
check is the difference between a closed limit and a withdrawn one, and it is the
reason to do it on every number a press produces.

### Answer 2 held, and the drift explains the thing the user noticed

The divider is preferred, and the reported problem with the no-divider variant —
*"too much space to the left of the arrow"* — is now **explained rather than just
accepted**: the button's own right padding sits between its label and a caret centred
in its own box, and that padding just went from 6px to the script's 8px. So the gap is
**wider** in the real drawer than in the version that was pressed. It strengthens the
choice rather than reopening it.

### Answer 3 needs one more look, for one reason

*"No jump"* when the labels go to `📋 Copy ★` was measured at **11px** text against an
`11ch` box, and both scale together — so the ratio should hold at 12px. **Should is not
a measurement**, and this is the claim `min-inline-size: 11ch` exists to protect.

**Two claims the node run now holds**, added the same day and both able to fail:
creating a preset **does not change the preset that was open** (the exact defect, with
the tick pattern read back before and after), and the armed label goes
`📋 Details` → `📋 Copy ★` → `📋 Copy ▾` when the arrow is picked. Fixing the second
one exposed a third fault in the check itself: the stub handed out a fresh node per
`querySelector`, so setting `.value` on the arrow fired a handler nothing had
registered — **it passed and proved nothing.**

**Take them one per session.** Each ticket file is the session prompt. Read the ADR
sections it names before anything else.

**02 must land first after the prototype.** 03 and 04 are independent of each other
once it has: one edits presets and one reads them.
