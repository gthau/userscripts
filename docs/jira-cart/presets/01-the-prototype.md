# 01 — The rig grows a presets variant, and four numbers come back

> **LANDED 2026-08-27, and all four answers are in
> [the decision record](README.md).** What it cost: decision 8 **reversed**
> (`Save as new…` → `+ Create preset`), decision **26 added** (the armed label's
> mark), limit 2 **closed** (four labels fit), limit 5 **closed and struck** (the
> floor does not move), decision 23 **corrected** (its arithmetic was wrong — the
> arrows cost 0px), and the rig's **fourth drift** found: the foot had drifted from
> the script in four values and the first foot measurement had to be withdrawn.
> **None of that came from re-reading the design.** The ticket below is left as it
> was written.

**Lands no script change.** It extends `test/jira-cart/paste-test.html` with a
fifth `Tabs` variant, the preset controls, and the foot's three arrows — then it
gets **pressed**, at 300×215, and four answers are written down.

**Read first:** [the decision record](README.md), especially *what the prototype
must answer*; ADR **§2.9** (the drawer's two sections and the foot), **§2.11** (the
layout rules and the defect behind each), and the header comment of
`test/jira-cart/paste-test.html`, which is the rig's own account of why it exists
and how it has drifted before.

---

## Why this is a ticket and not a step inside another one

**The last effort reversed four decisions by pressing a control, and none of the
four came from re-reading a design.** Its panel layout was settled by argument,
prototyped, chosen — and then reversed twice by use. Its ⚙ button was found to have
no resting affordance by a beta tester who simply could not see it. This effort adds
a fourth tab, a block of preset controls inside a tab that already holds ten rows,
and three new controls in a foot that already wraps. Every one of those is the same
kind of thing.

**And two of the four answers are numbers this repository cannot derive.** The
`MIN_BLOCK` the drawer ends up with is a measurement, and the record's own
arithmetic for it is explicitly labelled as not the answer.

## ONE RIG. Do not create a second file

Ticket 06 of the configurability effort recorded the reason in the strongest terms
the record has: `config-prototype.html` and `paste-test.html` both existed, **both
had drifted**, and neither drift was found by anything going red — because nothing
under `test/` reads an HTML file. One of them had thrown on every `render` call from
the commit that first tracked it, and the page still opened.

So this work goes **into `paste-test.html`**, beside the drawer stage that is
already there. That stage is the instrument: it has `Width` at `300 min`, `Height`
at `215 min`, a `Zoom` that magnifies without widening, the ⚙ that replaces the
whole body, and an overflow readout that measures `scrollHeight` against
`clientHeight` rather than describing it.

---

## What to add

### A fifth `Tabs` variant, `presets`

The three existing variants are the record of the shipped choice — `tabs2` and
`tabs4` are §2.9's rejected rows, *"kept so the choice can be looked at rather than
read about"*. **Do not edit them.** Add a fourth button to `variantSeg` and a fourth
entry to `TAB_SETS`:

```
presets: { pinned: [], tabs: [ Appearance · 🔗 Links · 📋 Details · 📊 Report ] }
```

**`tabs4` already shortened its labels to `🔗 Line` and `⚙ Look`.** That is
evidence, not decoration: whoever built it did not use the full words. The `presets`
variant uses the decided labels **at full length on purpose**, so the two can be
switched between and the difference seen.

### The rig's own invariant is broken here, deliberately

The comment above `TAB_SETS` says the variants are *"built from the same four
groups, so the only thing being compared is where they sit — no control exists in
one and not another."* **The `presets` variant breaks that**, because it is a
proposal for new controls rather than a rearrangement of existing ones. Say so in a
comment at the point of the break. An invariant that quietly stops holding is worse
than one that never did.

### The preset block, at the top of the 📋 and 📊 groups

Only in the `presets` variant. In reading order:

- a native `<select>` of preset names, **sorted by name**, with `★ ` in front of the
  flagged one;
- `★` — a state button on `aria-pressed`, using the same `--gt-cart-selected-*` pair
  the gear and the active collection chip already use;
- `✎` rename, opening a field in place;
- `✕` delete, **armed on the first press** and refusing on a list of one, with the
  collection chip's own two sentences;
- `+ Save as new…` with a name field.

Below it, unchanged: the field list for 📋, and the two band dropdowns plus the
field list for 📊. The 🔗 Links tab holds the existing `Issue reference` dropdown
and nothing else.

### The foot's three arrows

A native `<select>` immediately after 🔗 Links, 📋 Details and 📊 Report, styled to
show its arrow and nothing else. 🔗 Links' lists the five shapes; the other two list
that button's presets.

### A foot readout, which is the point of the exercise

Beside the existing overflow warning, print — measured, not computed from constants:

- the foot's `offsetHeight` and **how many rows it wrapped to**;
- the same for the six buttons **without** the arrows, so the delta is visible;
- the `MIN_BLOCK` those numbers imply, against the script's current `215`.

Read them with `getBoundingClientRect`, at `Zoom 1×`, because `zoom` is on the cart
element and would otherwise scale every number reported.

### Update the fence

The page's *Deliberately absent* list still says **"The Cart itself. No drawer, no
live list, no collection chips."** That has been false since the drawer stage
landed. Fix it, and add what this variant does not model: no fetch, no `Copy`
ladder, no store, no cross-tab write.

---

## Then press it, and record the answers

At `Width 300 min`, `Height 215 min`, `Zoom 1×` unless a question needs magnifying:

1. **Do four full labels fit?** If the bar wraps, does that read as acceptable —
   remembering it costs panel scroll and not `MIN_BLOCK`. Compare against `tabs4`'s
   shortened labels by switching between the two.
2. **How many rows is the foot, with and without the arrows, and what is the implied
   `MIN_BLOCK`?** A number.
3. **Does the arrow read as pressable without hovering it?** Limit 6 of the record
   is the failure this is looking for. If it does not, the candidates already on the
   table from the ⚙'s own history are a resting border and fill, or a bigger glyph;
   the ⚙ took the glyph, and the label was kept in reserve.
4. **Is the edit-versus-★ split confusing?** Select `Executive`, edit its fields,
   then look at the foot and say what you expect a plain press of 📊 Report to
   print. Limit 1 of the record is what this is testing, and it is accepted rather
   than solved — so the question is whether the ★ marks are enough to live with.

---

## Done when

- The `presets` variant is in `paste-test.html`, the three existing variants are
  untouched, and the broken invariant carries its comment.
- The foot readout reports measured numbers at `Zoom 1×`.
- The fence no longer claims there is no drawer on the page.
- **All four answers are written into [the decision record](README.md)**, dated,
  under a heading that says they came from pressing. Where a press contradicts the
  arithmetic in decision 23, the arithmetic stays and the measurement is written
  beside it — *the standing of a claim* is what these records track.
- **A hand diff of the chips shape**, per the rig's own standing instruction: emit
  one collection from `buildChips` and from the script's `formatDetails` and require
  every byte to match, on all five shapes in both flavours. Nothing in `test/` reads
  this file, so nothing else will catch it.
