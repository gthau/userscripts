# 03 — Four tabs, and presets are managed in them

**Lands the ⚙ side of the feature.** A fourth tab, the preset picker, ★, rename,
delete, `Save as new…`, and the restore's new meaning. Nothing in the foot changes
here — that is ticket 04 — so at the end of this ticket a plain press already reads
the ★ preset and there is still no arrow.

**Needs 02.** Independent of 04.

**Read first:** ADR **§2.9** (the drawer, the two sections, and the ⚙ screen),
**§2.14**'s *ONE CATALOGUE, TWO SELECTIONS* and its drag paragraphs, **§2.15**'s
band amendment, and **§6 item 17**, which this ticket reopens. Then
[the decision record](README.md), decisions 6 to 14, and **ticket 01's four
answers** — especially whether four full labels fit.

---

## The tab bar, and item 17 was right

`SETTINGS_TABS` gains a fourth entry between `appearance` and `details`:

```
Appearance · 🔗 Links · 📋 Details · 📊 Report
```

The pinned `Issue reference` row moves **into** the 🔗 Links tab, and `pinned` stops
existing. Once decision 5 is taken — a preset always names a shape — that dropdown
governs 🔗 Links alone, and a row pinned above the bar because it was shared would
be telling a lie about its scope.

**§6 item 17 predicted this exact pressure** and its words are the thing to answer:
*"the moment a second kind of setting arrives — something that is neither appearance
nor one export — `Appearance` stops being the odd one out and the bar has two groups
in it, which is when a two-level structure starts paying for itself inside 300px."*

What arrived is not a second kind of setting; it is a **fourth button tab**, which
makes `Appearance` more of an outlier rather than less. Record which way that went
and what it cost. **If ticket 01 found four full labels do not fit**, the structures
already on the table are the wrapping bar (which costs panel scroll and not
`MIN_BLOCK`) and shortened labels — `tabs4` in the rig chose `🔗 Line` and `⚙ Look`,
and that is the precedent to weigh against A.9's finding that **a word survives
where a dim pictograph does not**.

`SETTINGS_TAB_IDS` is derived from the table, so the vocabulary `normalisePrefs`
range-checks against cannot name a tab the bar does not draw. That already holds;
keep it holding. An unknown stored `settingsTab` still lands on the **first** tab and
never a blank panel.

---

## The preset block

At the top of the 📋 Details and 📊 Report tabs, above the settings it governs.

| Control | Behaviour |
| --- | --- |
| picker | A native `<select>` of names, **sorted by name**, `★ ` in front of the flagged one. Changing it changes what the rows below edit and **writes nothing** |
| `★` | A state button on `aria-pressed`, using `--gt-cart-selected-bg` / `--gt-cart-selected-text` — the pair the gear and the active collection chip already use. Pressing it moves the flag to the selected preset |
| `✎` | Rename in place |
| `✕` | Delete. **Armed on the first press**, refused on a list of one |
| `+ Create preset` | Opens a name field and a `Create`. **REVERSED FROM `Save as new…` ON 2026-08-27** — see below |

### Creating is NAME FIRST, and `Save as new…` is gone

**Reversed on 2026-08-27, on the first press of the prototype, and the reason is this
ticket's own decision 7.** Editing writes straight into the selected preset, so the
flow anybody uses — change the fields, then save the result under a new name —
**modified the old preset as well as making the copy.** Recorded in the user's words in
[the decision record](README.md), decision 8, with the original text kept.

- `+ Create preset` opens a name field and a `Create`.
- `Create` **commits the name first**: the preset exists, is selected, and every edit
  from then on lands on it. There is nothing to accidentally modify.
- It starts from the **shipped defaults**, never from a copy of the selected preset.
- **There is no Cancel and no draft**, which is what makes it cheap: a form holding
  unsaved work would be the only such state in the Cart and would need a rule for
  closing the drawer, switching tab, an add arriving from the page, and a reload.
  `Escape` closes the name field, which is not a cancel over unsaved work.
- Undoing a new preset is **deleting** it, which arms first.

`boot-smoke` must hold the claim in the terms the defect was found in: **creating a
preset does not change the preset that was open.** Read the selection back before and
after, not just the new preset's contents.

### The selection lives in memory, and starts at ★

A module-level variable per list, like `prefsOpen` and `renaming` already are.
Nothing stored, so nothing can point at a preset that no longer exists (decision 9).
It resets to the ★ preset when the drawer is built, and any delete resets it too.

`settingsTab`'s precedent was weighed and not followed. That one is about the drawer
reopening mid-sitting; this would buy two stored ids and two dangling rules.

### An edit writes immediately, into the selected preset

No Save button and no draft (decision 7). Every control in the drawer already writes
on change — `savePrefs` is called from inside each handler — and a draft would be the
only one in the script, needing a rule for closing the drawer, switching tab, and
another tab writing, plus an unsaved marker on a screen with no room for one.

**The field list's drag goes through `moveInList` unchanged**, and it still resolves
**both ends against the stored list at drop time, by id and never by index** — which
is configurability decision 37, and the reason it needs no entry in the `dragging`
guard. That reasoning is now load-bearing in a new way: the rows being dragged belong
to a preset, and the preset the panel is showing can change under the drag if a
delete lands. Resolve the list the same way the row is resolved.

### Rename reuses the collection's path

`startRename` is the model, and its comment is the part that matters: while the field
is open **it belongs to the keyboard**, and a render in the middle of typing must not
put the stored name back. Commit through `uniqueName`; an empty name is refused with
nothing written and the old name standing, exactly as `commitRename` does.

### Delete reuses the collection chip's two sentences

Armed: *"Click again to delete `X`. There is no undo."* On a list of one: *"`X` is
the only preset for this export, so it cannot be removed."* — the shape of
`deleteCollection`'s own *"it is the only collection, so it was not removed"*, and
its `logger.log` line is the model for the log.

**Deleting the ★ preset passes ★ to the first remaining by name.** That is the
one-star invariant ticket 02 enforces on read; enforce it here on write too, so the
two agree and neither is the only guard.

### `↺ Restore export defaults` reaches the SELECTED preset

On 📋 and 📊: the selected preset's fields, order, headings and line shape go back to
the shipped values. **Its name and its ★ are untouched, and no other preset moves.**
On 🔗 Links: that tab's dropdown. It already shows only on tabs with `exports: true`,
so its placement does not change.

`EXPORT_PREF_KEYS` was a list rather than five literals *"so that a seventh export
preference is one entry here and nothing to remember"*. It now holds `lineShape`
alone, and the preset half of the restore is not a key list at all. Keep the list —
it still does its job for the one key — and say in the comment why the other half is
no longer expressible as one.

---

## What to test

`boot-smoke.mjs` — it already drives the ⚙ screen, its tabs and the two-press
restore, so extend rather than start:

- four tabs draw, the fourth is reachable, and an unknown stored id lands on the first
- the picker changes which preset the rows below edit, **and writes nothing**
- a tick writes into the **selected** preset and leaves the other presets alone
- `★` moves the flag, and exactly one preset carries it afterwards
- `+ Create preset` opens a name field; `Create` with an empty name is refused
- `Create` makes a preset carrying the **shipped defaults**, applies `uniqueName`, and
  selects it — **and the preset that was open is byte-identical afterwards**, which is
  the reversal's own claim
- `Escape` in the name field closes it and creates nothing
- rename: the field belongs to the keyboard, an empty name is refused, `uniqueName` applies
- delete: the first press only arms; the second removes; on a list of one it refuses
- deleting the ★ preset moves ★ to the first remaining by name
- the restore resets the selected preset only, and leaves its name and ★ alone
- **an add from the page while ⚙ is up does not close the panel and does not lose the
  selection** — configurability decision 25 is a constraint here too, and every add
  calls `render`
- the selection survives a re-render and resets on a fresh `ensureDrawer`

`format-smoke.mjs`:

- **the shipped `Standard` presets reproduce 1.6.0 byte for byte**, both exports, both
  flavours. If an existing assertion has to change, treat it as a defect until proven
  otherwise.
- a second preset with a different selection and different bands produces the document
  it describes, and the **five paste rules hold over every byte string** it can produce
- 🔗 Links' bytes **do not move** when a preset moves. That check already exists for
  the field lists and its comment records that it was kept for exactly this claim.

`css-smoke.mjs`:

- the ★ button's state paint **survives a hover**, which is the specificity trap this
  stylesheet has now been caught by four times
- the fourth tab does not change the panel's status as the drawer's one scroller

---

## Done when

- Every check above green, and **at least one confirmed able to fail** in a scratch
  copy. Prove the one that matters: **a tick landing on a preset other than the
  selected one.**
- Counts in `test/jira-cart/README.md` recounted.
- **§2.9 amended in place, dated**, with the fourth tab, where `Issue reference` went
  and why, and what that cost — item 17's prediction quoted rather than paraphrased.
- **§2.14 and §2.15 amended in place, dated**: their field lists and bands are now
  properties of a **preset**, and the one-catalogue-two-selections sentence still
  holds — a preference may say which fields, in what order, which headings, and which
  of five shapes, and may never say what a field looks like. **The moment a setting
  reaches `detailChip`, §2.14's original bullet is back, unamended.**
- No arrow anywhere. A plain press reads ★. That is the whole of this ticket's
  visible behaviour.
