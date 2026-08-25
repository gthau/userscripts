# 06 — The version, the rig and the record

**Lands nothing new.** It bumps the version, folds the prototype into the paste
rig, updates the two READMEs, and closes this effort's record. Take it last.

**Needs 01 to 05.** Everything here describes what they decided.

**Read first:** ADR **§2.4**'s versioning paragraph, **§3** (what the script gives
the user), **§6**, **§7**, `test/jira-cart/README.md`, and
[`docs/jira-cart/README.md`](../README.md).

---

## The version

**1.2.0.** New features, no breaking change.

**The collections blob's `v` is NOT bumped.** §2.4: `v` is bumped only when an
existing field changes shape or meaning, and *"adding an optional field never bumps
it, or one new field becomes a migration and the reversibility above evaporates."*
Nothing about a stored **item** changed here. Every new key is in
`gt-jira-cart.prefs`, which is not versioned at all — a malformed preference falls
back to a default, so it has nothing to migrate.

Which also means **no `gt-jira-cart.collections.bak` write.** That happens only
before the first write under a new `v`. Do not trigger it.

Update:

- `// @version` in the header block.
- The **header docblock's user-facing list**. It currently describes the six
  exports as fixed. Add the ⚙ screen and what is now configurable, in the same
  voice — it is written for somebody deciding whether to install this.
- **§3, *What the script gives the user***. Same job, the user's words.

---

## The paste rig

`test/jira-cart/paste-test.html` is the frozen rig that bought §2.14's five rules.
`test/jira-cart/config-prototype.html` is this effort's prototype, which now models
things the rig does not: the ⚙ screen, the line shapes, the two field lists, the
bands.

**Decide which of these you are doing, and say so in `test/jira-cart/README.md`:**

| | What it means |
| --- | --- |
| **Merge** | The variants move into `paste-test.html` and the prototype is deleted. One rig, one place to keep byte-identical to the script |
| **Keep both** | `paste-test.html` stays the record of the A.9 measurements; the prototype becomes the configurability rig. Two files to keep in step |
| **Supersede** | The prototype replaces `paste-test.html`, which is deleted. The A.9 record survives in the ADR, which is where it is maintained anyway |

**Recommendation: merge.** The README's own rule is *"keep its chips shape
byte-identical to the script — if it drifts it starts answering a question about
itself"*, and two rigs is two chances to drift. The prototype's settings mock is the
part worth keeping; its export specimens are the rig's job.

Whichever you choose, **the chips shape must be byte-identical to the script.**
Verify it rather than assume it: emit the same collection from both and diff.

The prototype currently carries approximations that must not survive into a rig:
its own `--cart-*` chrome tokens, seven hardcoded issues, and a `localStorage`
stand-in for the prefs. Either make them faithful or fence them explicitly in the
page's own *What this prototype is not* list.

---

## The harnesses

- `node test/jira-cart/run.mjs` green.
- **Update every check count in `test/jira-cart/README.md`**, and its per-file table
  rows. It currently claims **485 checks across seven files** — 32, 55, 25, 156,
  163, 23, 31. Recount, do not estimate.
- Its *"What a green run does NOT say"* section needs a new bullet: **nothing here
  can drive a drag**, because `boot-smoke` has no layout. That is why §7 has a
  browser step for it.
- Its *"Adding a check"* section already says a check that exists because a bug
  happened should say so in a comment. Confirm every new check across 01–05 has
  been proven able to fail. If any has not, do it now — `css-smoke`'s first backtick
  check could not fail, and the README records that as the reason for the rule.

---

## §7, How to test

Add the steps only a browser can answer:

- The drag, at the drawer's minimum width, in both field lists, including a refused
  cross-list drop.
- ⚙ replacing the body and the foot, and coming back.
- The panel scrolling at 300×215 with every group in view — and **the truncation it
  replaces**, which is worth reproducing once by hand so the reason is not
  folklore.
- A paste of each shipped line shape into Outlook and Teams, with what to look for.
- The tab surviving a reload, and a hand-edited unknown tab id landing on the first
  tab rather than a blank panel.

---

## §6, What is deliberately left open

Close, amend or add:

- **Item 10, user-editable export templates.** It says templates are *"a rewrite of
  that layer rather than a configuration of it"*. **That stands.** Amend it to
  record that configurability shipped in 1.2.0 **without** a template, and why the
  finding survived: presets and a field list are a filter over a fixed renderer, so
  `detailChip` keeps its enforcement point for the five paste rules, and every
  reachable output is still checkable byte for byte. Keep the item open.
- **Item 7, ordering and grouping inside a collection.** Its group-by-epic half is
  answered by 05. Note what remains: manual reorder, and sorting the collection
  itself rather than a report built from it.
- **Item 14, a table or spreadsheet-shaped export.** Still open, and now cheaper —
  the field list it would need is built. Say so.
- **A new item: the per-export line-shape override.** Deferred in the grilling with
  a reason — nobody has yet wanted 🔗 Links plain and 📋 Details markdown at the
  same time — and it costs one nullable key per export, plus a third state meaning
  *follow the default*. Record the third state; storing a shape instead is the
  silently-stops-following bug.
- **A new item: the panel's taxonomy.** Whichever tab structure 02 chose has a cost
  that was named and accepted. Record it so the next person does not rediscover it
  as a defect.

---

## The docs

- **`docs/jira-cart/README.md`**: its table row for `prompts-configurability.md`
  calls it *"The one LIVE file here… an unrun prompt"*. It has been run. Repoint it
  at [`configurability/`](.) and describe what that directory is.
- **`docs/jira-cart/prompts-configurability.md`**: delete the *"This prompt has not
  been run"* banner and record the outcome — that is the file's own instruction.
- **`docs/jira-cart/configurability/README.md`**: mark each ticket done as it lands,
  and record any decision that changed once it met real code. **The decisions here
  are dated and several were reversed by use; a reversal is recorded, never
  silently applied.**

---

## Done when

- 1.2.0 in the header, the docblock and §3.
- One rig, or two with a stated reason, and its chips verified byte-identical.
- Every count in `test/jira-cart/README.md` recounted.
- §6 and §7 updated. Nothing in this effort is left recorded only in a working file
  — §2.8's two amendments are the model for how to fold it in.
- **The ADR reads as though it was always this way, with every amendment dated and
  every original reason still legible.** That is the whole point of the document.
