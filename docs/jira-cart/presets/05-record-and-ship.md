# 05 — The version and the record

**Lands nothing new.** It bumps the version, folds this effort into the ADR, updates
§6 and §7 and the two READMEs, and closes this directory's record. Take it last.

**Needs 01 to 04.** Everything here describes what they decided.

**Read first:** ADR **§2.4**'s versioning paragraph, **§3**, **§6**, **§7**,
`test/jira-cart/README.md`, [`docs/jira-cart/README.md`](../README.md), and
[the decision record](README.md) with every ticket's outcome filled in.

---

## The version

**1.7.0.** New features, no breaking change.

**The collections blob's `v` is NOT bumped.** §2.4: `v` is bumped only when an
existing field changes shape or meaning, and *"adding an optional field never bumps
it, or one new field becomes a migration and the reversibility evaporates."* Nothing
about a stored **item** changed. **So no `gt-jira-cart.collections.bak` write** —
that happens only before the first write under a new `v`. Do not trigger it.

Update:

- `// @version` in the header block.
- The **header docblock's user-facing list**. It currently describes six exports and
  a ⚙ screen with three tabs. It is written for somebody deciding whether to install
  this, so say what presets are in that voice.
- **§3, *What the script gives the user***, in the user's words.

---

## §2.4 — the fourth key

Ticket 02 added a paragraph. Check it says the thing that is new **in kind**: this key
is repaired **per entry**, where the prefs key is replaced **wholesale**, and the
reason is which side of §2.4's own line the data sits on. The three-keys comment at
the top of the store block needs the fourth key named in it too.

## §6 — what is deliberately left open

- **Item 10, user-editable export templates.** Still open, and **strengthened again**.
  Presets are named configuration over a fixed renderer: `detailChip` keeps its
  enforcement point, no user-written string reaches the clipboard, and every reachable
  output is still checkable byte for byte. Record that a second configurability effort
  did not need a template either.
- **Item 16, the per-export line-shape override. CLOSE IT**, and record how. This
  effort answered it, and **not** the way item 16 recommended: item 16's whole design
  was a nullable third state meaning *follow the shared setting*, and it named storing
  a shape instead as the *silently stops following* bug. A preset stores a shape
  (decision 5). What makes that not the bug it describes is that a preset is a thing
  the user built and named rather than a key touched on their behalf — and the cost
  item 16 predicted is paid and recorded as limit 3: changing your shape everywhere
  means editing every preset, with nothing reporting which you missed. **Keep item
  16's original text.** If limit 3 ever bites, the nullable is the fix and item 16 is
  the design.
- **Item 17, the panel's taxonomy.** It predicted the reopening and it was right.
  Record which structure 03 chose, what it cost, and whether four full labels fit at
  300px. If they did not, that is the more interesting half.
- **Item 7, ordering and grouping inside a collection.** Unchanged by this effort.
  Note that its group-by half is now configurable **per preset**, which is one more
  reason the collection's own order still means what it meant.
- **Item 14, a table export.** Still open and now cheaper again: a preset already
  carries an ordered field selection, which is most of what a table needs.
- **A new item: preset reordering and a cap.** Deferred with its reason — the list
  sorts by name, so there is no order to maintain, and nobody has yet had enough
  presets for the sort to be the wrong answer.
- **A new item, if limit 1 bit in ticket 01's press:** the split between the preset
  you are editing and the preset that prints. Accepted rather than solved. If the press
  said it is confusing, the candidates are a ★ shown in the foot and naming the preset
  in the button's tooltip — the label itself has no room.

## §7 — how to test

Add the steps only a browser can answer:

- the arrow's native list opening **outside** the drawer's clip, at 300×215
- the foot's row count at 300px, with the number
- four tab labels at 300px, and whether the bar wraps
- a plain press against an arrow pick, on the same collection, diffed by hand
- the delete-between-fetch-and-copy path, run by hand: arm, open ⚙, delete, close,
  copy — and the fallback to ★ seen rather than asserted
- ★ moved in another tab while this one has ⚙ open on the same list
- a paste of one preset's output into Outlook and Teams, with what to look for

## The rig and the harnesses

- `test/jira-cart/paste-test.html` keeps the `presets` variant. **One rig** — do not
  leave a second file behind, and do not delete the three older variants, which are
  §2.9's rejected rows.
- Re-run the hand diff of the chips shape against `formatDetails`. Nothing under
  `test/` reads that file, so nothing else can catch a drift.
- `node test/jira-cart/run.mjs` green. **Recount every check count and every per-file
  table row** in `test/jira-cart/README.md`. Do not estimate.
- Its *"What a green run does NOT say"* section needs a bullet for whatever ticket 04
  could not cover — a native option list is painted by the browser, so no fake DOM
  can see it open.
- Confirm every new check across 02–04 has been **proven able to fail**. If one has
  not, do it now.

## The docs

- **`docs/jira-cart/README.md`**: add this directory as the live one and say what it
  is. `configurability/` becomes a second frozen record beside it.
- **`docs/jira-cart/presets/README.md`**: mark each ticket done as it lands, and
  record any decision that changed once it met real code. **A reversal is recorded,
  never silently applied** — that is what the last effort's record is for, and it is
  the reason four of its reversals are still legible.

---

## Done when

- 1.7.0 in the header, the docblock and §3.
- §2.4, §2.8, §2.9, §2.14 and §2.15 all carry their amendments **in place, dated,
  with the original reasoning kept**.
- §6 items 10, 16, 17, 7 and 14 handled as above, and the new items added.
- §7 has the browser steps, and every count in `test/jira-cart/README.md` recounted.
- **The ADR reads as though it was always this way, with every amendment dated and
  every original reason still legible.** That is the whole point of the document.
