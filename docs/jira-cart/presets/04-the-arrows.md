# 04 — Three arrows, and the export path reads a preset

**Lands the foot.** A native `<select>` beside 🔗 Links, 📋 Details and 📊 Report;
the pick that runs the button's own gesture with a different choice; and the drawer's
re-derived minimum height.

**Needs 02.** Independent of 03 — this one reads presets where 03 edits them.

> **BUILT ON 2026-09-07. Suite 1,608 → 1,734, 34 mutations, 0 survivors.** What it
> landed, what it found, and the one number it did NOT close are in
> [the decision record](README.md). **The floor is recorded as UNMOVED rather than
> re-derived**, because the measurement behind it is still a rig number — and the
> browser step that closes it is ADR §7 **step 42**, whose first item is the foot's row
> count in the real drawer at 300×215 with ⚙ down. Everything below is the ticket as
> written, kept so the amendments can be read against it.

> **03 LANDED FIRST, ON 2026-09-06, AND IT DID TWO THINGS THIS TICKET NO LONGER HAS
> TO.** Read them before the section *Where it hangs off the dispatch table* below,
> which was written as though `format` still read the preferences.
>
> **The four export keys are already out of the preferences** (decision 22, whose
> deferral said *whichever of 03 or 04 lands first*). Their shipped values are in
> `PRESET_DEFAULTS`. `store-smoke` §18q is inverted and green.
>
> **And `format` already reads the ★ preset**, for both exports and both bands: it
> finds the tab whose `fields` key matches the entry's — the seam `format-smoke`
> already holds — and takes that list's ★ preset. So the paragraph below is DONE, and
> what is left for this ticket is the **pick**: the same read, resolved at the press,
> against a preset the arrow named instead of the flagged one. `presetBands` is where
> the two band vocabularies meet, and `starPreset` is the one place *what does a plain
> press print* is answered.
>
> **What 03 did NOT touch, so nothing here is second-guessed:** no arrow, no foot
> change, no `COLLECTION_FIXED_PX` and no `MIN_BLOCK`, and no version bump.
>
> **AND 03 WAS PRESSED IN REAL JIRA ON 2026-09-07, which closed the tab bar at the
> floor and says NOTHING about the foot.** ⚙ replaces the body and the foot with it, so
> a press at 300×215 with the settings up cannot see the six buttons. Decision 23 is
> still open exactly as it was.
>
> **SO TAKE THE FOOT MEASUREMENT IN THE REAL DRAWER, NOT ON THE RIG.** That is a change
> from what the *Read first* list implies, and the reason is the rig's own record: the
> foot has drifted from the script **four times**, the measurement has been WITHDRAWN
> ONCE, and the number it stands on now was taken from a drawer 300px wide where the
> real one is 298px inside its border. A third rig press is a third reading from an
> instrument that has been wrong before. **Once this ticket lands the arrows, the foot
> that has to be measured EXISTS** — drag the drawer to 300×215 and read it there.
> `rig-smoke` keeps the rig honest for the questions the rig is still the only way to
> ask; this is not one of them any more.
>
> The same applies to decision 26's `min-inline-size: 11ch`: *no jump* on `📋 Copy ★`
> was measured at the rig's 11px against the script's 12px, and the record says
> plainly that **should is not a measurement**. Ship the mark, then read the row in
> Jira.

**Read first:** ADR **§2.8** (the dispatch table and its two amendments), **§2.14**
(the two presses, what throws the held fetch away, and *the label IS the state*),
**§2.15**'s *THE BUTTON YOU PRESS IS THE BUTTON THAT ANSWERS*, and **§2.11** plus
risk 10 for the layout arithmetic. Then [the decision record](README.md), decisions
15 to 19 and 23, and **ticket 01's foot measurement**.

---

## Why a native `<select>` and not a menu

**Every container in the drawer is `overflow: clip`.** A menu we draw ourselves is
silently gone — which is not an argument, it is the measurement that forced ⚙ onto
its own screen in the first place, and the rig prints it: the panel *scrolls* because
it is the drawer's one scroller, and sharing the box with the two sections is what
made growth vanish instead.

A native select's option list is painted by the browser, on top of the page, outside
every clip we own. The two band dropdowns are already native for the same reason.
**The cost is that the list cannot be styled** — so ★ goes in the option's *text*,
which is the one part of a native option that is ours.

## THE ARROW DOES WHAT ITS BUTTON DOES

One sentence, and everything else follows from it (decision 16):

| Button | Plain press | Arrow pick |
| --- | --- | --- |
| 🔗 Links | copies, using the 🔗 Links tab's shape | **copies at once**, using the picked shape |
| 📋 Details | fetches, then `Copy` uses ★ | **fetches**, then `Copy` uses the pick |
| 📊 Report | as above | as above |
| either, already armed at `Copy` | copies | **copies** — no re-fetch |

**An armed button does not re-fetch, and the reason is already in §2.14:**
`DETAIL_FIELDS` asks for all nine fields whatever any preference says, and the
selection is applied at **render**. A second request would return the same rows.

**The pick names a preset and is resolved at the press** (decision 17), which is the
rule a plain press already follows — one rule for both paths, no snapshot, no second
source of truth. `detailsHeld` already *"carries the kind that produced it"*; it
gains the picked preset's id beside that, and the same events throw both away.

**If the named preset is gone at the press, ★ is used.** That path is reachable with
one pair of hands, which is why the guard exists: arm 📊 Report, open ⚙ — which hides
the foot — delete the preset you picked, close ⚙, press `Copy`. This is not a story
about two tabs.

**The arrow is always drawn**, even for a list of one (decision 18). One that came
and went would change the foot's width and its row count, which is the
reflow-under-the-pointer defect §2.14 spent a day removing from this very row.

**The list holds presets only** (decision 19). No `Edit presets…`: one dropdown where
most entries copy something and one does not is what gets reported as *"I picked it
and nothing happened"*.

## THE ARMED LABEL CARRIES A MARK, and it is the label ladder's third rung

Decision 26, added 2026-08-27 from the prototype. **The label is the fetch ladder and
never a preset's name** — `📊 Report` → `📊 Fetching…` → `📊 Copy`, whatever preset is
in play — so the control you press says nothing about what it will produce. The user
found that by pressing: *"A plain report press triggers the fetching, so it changes the
button text to Fetching regardless of the preset used."*

So the **armed** rung says which of the two it is:

| Label | Means |
| --- | --- |
| `📊 Copy ★` | this copy will use the ★ preset |
| `📊 Copy ▾` | this copy will use something picked from the arrow |

> **THE `▾` WAS REVERSED ON 2026-09-07, ON A PRESS IN REAL JIRA.** It reads `📊 Copy`
> with no mark. The arrow beside the button draws a `▾` caret and it is always drawn,
> so this table's second row put two carets side by side with one of them inert. See
> decision 26's amendment in [the record](README.md) — including that the prototype had
> been showing the collision all along.

**It cannot show the NAME** — the tooltip does that, and the tooltip should. What the
mark carries is *whether you are on the default*, which is the half you can get wrong
without noticing.

**Derived inside `render` like every other label**, so it cannot disagree with the pick
(§2.8: every label is a function of current state). And **🔗 Links carries no mark**,
because it copies on one press — there is no pending moment for a mark to describe.

**THE MEASUREMENT THIS OWES:** the two stepped buttons reserve
`min-inline-size: 11ch` because a changing label used to rearrange the whole foot, and
a mark that overflows that box brings the defect back. `📊 Copy ★` is nine characters
and *should* fit. The prototype has a `Foot labels` switch for exactly this; take its
answer, not the word *should*.

## Where it hangs off the dispatch table

`EXPORTS` already carries `fields` and `bands` as **named preference keys** rather
than reads, *"so that `format` performs the one read, the way it already does for the
line shape"*, and `format-smoke` asserts that the table that **reads** them and the
table that **edits** them name the same set. That seam is what this ticket extends:
an entry gains the name of the **preset list** it draws from, and `format` performs
one read of one preset.

`format(items, scope, shape)` becomes a call that is handed **the resolved preset**
rather than reaching for it. Keep every builder a pure function of its arguments —
that is what lets the harness assert bytes with no store standing up.

A `<select>` cannot live inside a `<button>`, so the pair is a wrapper element that
**reads as one control**: shared border, a divider line, and the button's own
`min-inline-size: 11ch` untouched, because that reservation is what stops the label
ladder rearranging the row.

---

## The floor, which is the one number this ticket owes the ADR

`MIN_BLOCK` and `COLLECTION_FIXED_PX` are hand-maintained and derived by comment:
*"the section heading 32, one row of chips 29, the create field 35, the foot 38, and
its own top border 1 — 135."* **That `38` is one row of buttons.** Three arrows push
the row count up, and `css-smoke` *"counts the `flex: none` list for exactly that
reason"*.

> **MEASURED 2026-08-27 BY TICKET 01, AND THE ANSWER IS A NON-CHANGE.** At the 300px
> floor the foot is **2 rows and 66px with the three arrows, and 2 rows and 66px
> without them**. They fit in slack the second row already had. **`MIN_BLOCK` stays
> 215 and `COLLECTION_FIXED_PX` stays 145 — change neither.** The record's arithmetic
> predicted three rows and was wrong; decision 23 carries it struck through with the
> correction, because what it got wrong is instructive and what it got right was the
> sentence *that arithmetic is not the answer*.
>
> **It generalises.** 300px is `MIN_INLINE`, and flex wrapping never needs more rows
> as width grows, so the worst case is the case that was measured.
>
> **The first attempt was withdrawn**, because the rig's foot had drifted from the
> script's in four values — `padding`, the button's `padding`, `font-size` and
> `border-radius`. It reported 62px; after the fix, 66px. `test/jira-cart/README.md`
> carries the table.

So what this ticket owes the ADR is **a comment, not a number**:

- say beside `COLLECTION_FIXED_PX` that the foot is **two rows at the 300px floor,
  with the arrows**, and that it was measured on 2026-08-27 rather than derived. The
  existing comment derives the foot as *"38"*, one row, which was already understated
  at 300px before this feature — **do not silently correct it into agreement**; say
  which number is the derivation and which is the measurement.
- `css-smoke` still counts the `flex: none` list, and it must keep doing so: **a fifth
  fixed part in this section makes the magic number stale and the clipping comes back
  silently.** The arrows are not a new fixed part — they are inside the foot — which is
  exactly why they cost nothing here.
- **Do not add a `MIN_BLOCK` literal to any harness.** The last one said `160` against
  the script's `215` and passed, because it was measuring itself. Slice it.
- risk 10 gains one line: the arrows were weighed against the floor and did not move
  it.

---

## What to test

`boot-smoke.mjs` — it already drives 📋 Details' two presses, its expiry and its
refusal to arm:

- an arrow pick on 🔗 Links **copies immediately**, with the picked shape's bytes
- an arrow pick on 📋 / 📊 **fetches**, and the `Copy` that follows uses the pick
- an arrow pick while the button is **already armed** copies and does **not** re-fetch
- a plain press uses ★, before and after ★ moves
- **the armed label reads `Copy ★` on the default and `Copy` after a pick** — the `▾`
  this line asked for was reversed by the press, see above — both
  derived inside `render` rather than written at the press
- `🔗 Links` never grows a mark
- the pick is thrown away by everything that throws the held fetch away — add, remove,
  empty, switch collection, another tab writing, and a successful copy
- **the picked preset deleted between the fetch and the copy → the copy uses ★ and
  still writes.** Drive it the way the hands reach it: arm, delete through the panel,
  copy
- a pressed arrow **does not** walk the *other* stepped button through its ladder.
  §2.15 reversed that once from use, and a third control that arms is a new chance to
  reintroduce it
- the arrow is present with a list of one

`format-smoke.mjs`:

- ★'s bytes are 1.6.0's bytes, both exports, both flavours
- every reachable pick produces the document it describes, and **the five paste rules
  hold over every one of them**
- the export table and the settings table still name the same preference keys and the
  same preset lists — the check that exists because a key an export reads and no tab
  edits is a preference with no way to reach it

`css-smoke.mjs`:

- the arrow's resting affordance is **painted**, and survives a hover — the same
  specificity trap for the fifth time
- **the arrow closes the button's right edge.** `data-arrow="on"` drops the button's
  right border to make room, and the prototype's first quiet variant replaced it with a
  **transparent** one — so the button read as cut open. Assert the replacement border
  exists, because this is a defect that already happened once
- **the divider is what distinguishes the two looks**, and the shipped one has it
- the `11ch` reservation on the stepped buttons is untouched
- the `flex: none` count matches the new derivation

**§7 gains a browser step** for what no harness can see: the arrow's native list
opening **outside** the drawer's clip at the 300px floor, and the foot's row count at
that width.

---

## Done when

- Every check above green, and **at least one confirmed able to fail**. Prove the one
  the feature rests on: **an arrow pick that silently falls back to ★ when it should
  not.**
- `MIN_BLOCK` re-derived from a measurement, or explicitly recorded as unmoved.
- **§2.8's dispatch-table amendment extended in place, dated**: the shape still
  arrives as an argument, and now so does the preset.
- **§2.14 and §2.15 amended in place, dated**: what `detailsHeld` carries, and that
  *the button you press is the button that answers* still holds with a third control
  in the row.
- Counts in `test/jira-cart/README.md` recounted.
