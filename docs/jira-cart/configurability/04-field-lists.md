# 04 — Two selections over one catalogue

**Lands the two field lists.** 📋 Details and 📊 Report each get an ordered, ticked
subset of the fields, chosen by checkbox and reordered by drag. This is a **filter
over a fixed renderer**, not a template.

**Needs 01** for `detailsFields` and `reportFields`, and **02** for somewhere to put
the controls. Independent of 03 and 05.

**Read first:** ADR **§2.14** in full, especially *"What it is not"* — the
paragraph beginning *"Not configurable"* is the decision this ticket overturns —
and **§4**'s row *"A column picker for the detailed export"*. Then
[the decision record](README.md), decisions 7 to 11.

---

## ANSWERED on 2026-08-24 — the drag ships, and it was NOT pressed

The question was *is the drag usable at 300px*, to be answered by pressing the
prototype at `Width → 300 min`. **The user answered it by decision instead: a user
who finds it fiddly at the minimum width will make the drawer wider.** The drawer is
resizable and the grip is right there. ↑↓ buttons are off the table.

Recorded as **decided rather than measured**, so no later session reads it as a press
that happened. Two things follow, and neither is softened by the decision:

- **No harness in this repo can drive a drag**, because `boot-smoke` has no layout
  and no paint. So `moveField` below is mandatory, not stylistic, and §7 gains the
  browser step.
- **A re-render can land in the middle of a drag.** An add from the page — in this
  tab or another — calls `render`, and decision 25 says that gesture keeps working
  while ⚙ is up. §2.11's two existing drag defects are the reading to do first.

---

## The answer to bite 5, which must be written down

The prompt asks: if configurability splits 📋 Details and 📊 Report, **what stops
the two drifting?**

**One catalogue, two selections.** The field ids, their labels and every measured
style live in `detailBits` and `detailChip` as single copies, and a preference can
only say *which* of them a document uses and *in what order*. The five paste rules
are properties of the paste target, not of a format, so one copy of them remains
the only safe number — and no user keystroke can reach it. What is duplicated is
the selection, whose duplication costs nothing but a second list of checkboxes.

Put that in §2.14 in those terms. It is the load-bearing sentence of this ticket.

---

## What to build

### The catalogue

One list, in the reading order §2.14 chose — *what it is, how it is going, how
urgent, who has it, when it ships, where it belongs* — plus `team`:

```
type · status · priority · assignee · team · fixv · remaining · parent
```

**`team` is new as a row field** (decision 10). It is fetched today only for the
report's headings, and 📋 Details has no headings, so the field is currently
unreachable from that export. Off by default in both lists.

### `detailBits` loses `skip` and gains a selection

Today it takes `(item, skip)` and the report passes `["priority"]`. Replace that
with the ordered selection, and **a ticked field is displayed whether or not it is
a band** (decision 8). The defaults leave the banded fields unticked, so 1.1.0's
report is unchanged byte for byte.

Why the tick wins rather than the band: a field that appears only in a heading is a
field whose meaning depends on the row's position, which is what §2.14 rule 4 is
about. Somebody who drags a line out of its band in the pasted mail can choose to
keep the value readable on the row. The panel marks a field that is also a heading;
it does not veto it.

### Zero fields

**Allowed** (decision 9): the line is the head alone, no em dash. This needs no new
code — the renderer already does exactly this for an issue Jira returned nothing
about, and `format-smoke` already covers that path. Assert it explicitly anyway,
because it is now reachable by a click rather than only by a thin item.

Known and accepted: 📋 Details configured this way emits 🔗 Links' bytes. Two
buttons, one document, by the user's own choice.

### The drag

- **The reorder itself is a pure function**, `moveField(list, from, to)`, so the
  state change lives where a harness can reach it and only the pointer plumbing
  ships uncovered. The prototype has a working one; it handles an out-of-range
  index and the off-by-one when moving downward.
- Drop-before / drop-after decided by which half of the row the pointer is in.
- A drop from one list into the other must be **refused**, not silently reinterpreted.
- No keyboard path. That matches §6 item 4: the Cart is not intended to be operated
  by keyboard input. Say so in a comment so it reads as a decision, not an omission.
- **§2.11 already records two defects from the drawer's existing drags.** Read them
  before writing this one.

### The fetch does not change

`DETAIL_FIELDS` stays as it is. Toggling a field off does **not** narrow the
request. Three things follow, and all three are why:

1. `DETAIL_FIELDS` cannot fall out of step with a preference.
2. **Changing a preference does not invalidate a held fetch**, because the held rows
   carry every field — so a `📋 Copy` you have already armed stays armed, and a
   field list changed in another tab simply re-renders this one.
3. §2.14's *"nothing fetched is ever stored"* is untouched.

The selection is applied at **render**, never at fetch. Write that down; the
opposite is the obvious-looking optimisation and it costs all three.

---

## What to test, in `format-smoke.mjs`

- **The defaults reproduce 1.1.0 byte for byte**, for 📋 Details and 📊 Report, both
  flavours. Existing assertions should not need to change; if one does, treat it as
  a defect until proven otherwise.
- A reordered list emits in the stored order.
- Every field off → the head alone, no em dash, in both flavours.
- One field on → head, em dash, one chip, no separator.
- `team` ticked → it appears, drawn in the plain muted grey like every other
  unadorned field.
- A field ticked in one list and not the other → the two documents differ, and each
  is correct.
- **The five paste rules on every new byte string.**
- **`moveField` directly**: the middle, both ends, out of range, and a move that is
  a no-op.

`boot-smoke.mjs`: ticking a box writes the preference and re-renders; the armed
state of `📋 Details` survives a preference change (see point 2 above).

**§7 gains a browser step for the drag**, beside the two §2.11 drag defects, because
nothing here can cover it.

---

## Done when

- Defaults byte-identical to 1.1.0, and every new shape asserted.
- **One new rule confirmed able to fail** in a scratch copy.
- **§2.14's *"Not configurable"* paragraph overturned in place, dated, with its
  original text kept.** It said *"a setting that silently changes what a button
  produces is what §2.8 warns about, and a fixed output is checkable"*. The
  amendment must answer it rather than ignore it: the setting is visible in ⚙, the
  output is still a fixed function of it, and every reachable combination is
  checkable — what changed is that there are more of them.
- **§4's *"A column picker for the detailed export"* row overturned**, dated, in place.
- **The one-catalogue-two-selections sentence is in §2.14.**
- **The drag recorded as DECIDED and not measured**, with the user's ground for it —
  a fiddly drag at 300px is answered by widening the drawer — and with the browser
  step that stands in for the harness that cannot drive it.
