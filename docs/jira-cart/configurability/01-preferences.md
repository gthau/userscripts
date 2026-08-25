# 01 — The preferences exist before anything reads them

**Lands nothing visible.** New keys in the prefs blob, every one range-checked, and
`store-smoke` covering the hostile values. No UI, no format change, no output
change. Everything else in this effort depends on this.

**Read first:** ADR **§2.4** (the last four paragraphs, about the prefs key), the
`DEFAULT_PREFS` / `loadPrefs` / `normalisePrefs` / `savePrefs` block at
`src/jira-cart.user.js:581-693`, and `test/jira-cart/store-smoke.mjs`. Then
[the decision record](README.md).

---

## Fix this first, because it is a live defect in the ground you are standing on

**`store-smoke.mjs` copies the script's constants as literals instead of slicing
them, and one has already drifted.** Line 48 injects `MIN_BLOCK = 160`; the script
has `215` (`src/jira-cart.user.js:2956`). Line 178 then asserts
`readStoredSize({inline:10,block:10}) === {inline:300, block:160}` and passes —
because it is measuring the harness's own constant. A stored height of 180 is
accepted here and clamped to 215 by the real script.

The test README claims *"every harness reads `src/jira-cart.user.js` off disk and
pulls what it needs out by brace matching"*, and `format-smoke` already does the
right thing for the palette: it **slices** `MUTED_INK`, `LOZENGE`, `PRIORITY_INK`
and `LIST_ITEM_STYLE` out of the file rather than copying them, *"because a copy
would let the file and the assertions drift apart in silence, which is the one
thing these harnesses exist to prevent."*

So: **slice `MIN_INLINE`, `MIN_BLOCK`, `BASIS_MIN`, `BASIS_MAX`, `DEFAULT_PREFS`
and `LAYOUTS` out of the source** the same way, and delete the literals at
`store-smoke.mjs:46-50`. Expect line 178's expectation to change from 160 to 215
— that is the bug being fixed, not a regression. Also delete the unused `DEFAULTS`
duplicate at line 50.

Do this as its own commit, before adding anything.

---

## What to add

Five new keys. **Nowhere near `load()`** — this is the prefs path, where a
malformed value falls back to a default, which is the exact opposite of the
collections path (§2.4, last migration row).

| Key | Default | Rule |
| --- | --- | --- |
| `lineShape` | `"markdown"` | One of the known shape ids, else the default |
| `detailsFields` | see below | An ordered list |
| `reportFields` | see below | An ordered list |
| `reportBand1` | `"priority"` | A bandable id. **Never `"none"`** |
| `reportBand2` | `"team"` | A bandable id, **or `"none"`** |
| `settingsTab` | first tab id | A known tab id, else the first |

That is six. The shape ids and the bandable ids are owned by tickets 03 and 05, so
**define the id lists here as the single source both will read**, and keep them
beside the catalogue rather than inside `normalisePrefs`.

### The field list's stored shape

An array of `{ id, on }`, in display order.

```json
"detailsFields": [
  { "id": "type", "on": true },
  { "id": "status", "on": true },
  { "id": "priority", "on": true },
  { "id": "assignee", "on": true },
  { "id": "team", "on": false },
  { "id": "fixv", "on": true },
  { "id": "remaining", "on": true },
  { "id": "parent", "on": true }
]
```

**Not a plain array of enabled ids**, which was considered and rejected: with
order carried by the array and "off" meaning absent, unticking a field loses its
position and re-ticking it sends it to the end. A user toggling a field to compare
two outputs would find their order quietly rearranged.

`reportFields` is the same list with `priority` and `team` off, which reproduces
1.1.0's report byte for byte.

### `normaliseFieldList(stored, catalogue)`

In this order, and write it as one function both keys use:

1. Not an array → the default for that key.
2. Keep entries whose `id` is in the catalogue. **Drop the rest silently**, the way
   `normalisePrefs` already drops unknown keys (bite 3).
3. Drop a duplicate id, keeping the first.
4. Coerce `on` to a strict boolean: `entry.on === true`. Anything else is off, so a
   hand-edited blob cannot produce a state no click made.
5. **Append any catalogue field the stored list does not mention, at the end, with
   `on: false`.**

Step 5 is decision 21 and it needs its comment. **A new field arrives OFF while a
new tab arrives VISIBLE, and they differ on purpose:** a tab appearing changes
nothing about what a button emits, where a field appearing ticked would change what
a button produces without being asked — which is what §2.8 and §2.14 both warn
against. It is still in the list, so it is findable.

**An empty list survives** (decision 23). Zero fields is a real state — the line is
the head alone — so `[]` after step 2 is honoured, not replaced. Careful: step 5
must not resurrect it. Step 5 appends fields the stored list **does not mention**;
an entry with `on: false` is mentioned. An empty stored array mentions nothing, so
step 5 would refill it with every field off — which is the same rendered output as
an empty list, so this is harmless either way. **Pick one and assert it**, so a
later session cannot "fix" it in the other direction.

---

## What to test, in `store-smoke.mjs`

Add the new readers to the `names` array at line 22 so they are sliced, not copied.

Every one of these, per field-list key:

- absent → the default
- `null`, a number, a string, an object → the default
- `[]` → whatever you decided above, asserted
- an unknown field id → dropped, the rest kept in order
- a duplicate id → collapsed, first wins
- `on: "yes"` / `on: 1` / `on` missing → off
- a catalogue field missing from a stored list → appended last, off
- a stored order that differs from the catalogue → **preserved**, not re-sorted

And for the scalars:

- `reportBand1: "none"` → falls back to `"priority"`. A report with no bands is
  📋 Details.
- `reportBand2: "none"` → honoured.
- an unknown band id in either → falls back to that key's default
- an unknown `lineShape` → `"markdown"`
- an unknown `settingsTab` → the first tab id, **never blank**
- `savePrefs` still read-modify-writes, so a tab open since this morning cannot
  write a stale field list over a band changed since (§2.5)

---

## Done when

- The `MIN_BLOCK` drift is fixed in its own commit and every constant is sliced.
- `node test/jira-cart/run.mjs` is green, and `store-smoke`'s count in
  `test/jira-cart/README.md` is updated.
- **At least one new range check is confirmed able to fail**, by breaking
  `normaliseFieldList` in a scratch copy and watching it go red. A check that
  cannot fail is worse than no check — `css-smoke`'s first backtick check could
  not, and the README says so.
- §2.4 gains a short paragraph naming the six new keys and the one rule that is new
  in kind: **a stored list can disagree with the code's own list, and the code
  wins**. Amend in place, with the date.
- No output byte changes. Run `format-smoke` and expect it untouched.
