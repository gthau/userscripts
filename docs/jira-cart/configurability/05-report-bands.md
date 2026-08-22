# 05 — Seven bands, and one of them repeats an issue

**Lands the configurable grouping.** 📊 Report gets two dropdowns: which field
bands, and which sub-bands. Not a query language.

**Needs 01** for `reportBand1` and `reportBand2`, and **02** for somewhere to put
the dropdowns. Independent of 03. **Overlaps 04** in `detailBits` — if 04 has not
landed, keep the hardcoded `skip` and let 04 remove it.

**Read first:** ADR **§2.15** in full, **§6 item 15** (the record of what was open
while it was built), **§6 item 7** (*ordering and grouping inside a collection* —
this ticket answers its group-by-epic half), **appendix C.4** (the Team field,
closed) and **C.5** (the other Team fields, unrun). Then
[the decision record](README.md), decisions 12 to 15.

---

## Confirm this early, because its failure mode is quiet

**§2.15 limit 2:** whether `bulkfetch` returns a custom field asked for by id was
*expected rather than known* when the report shipped. The Cart had only ever
requested system fields, and `customfield_15541` is the first.

This ticket touches the report, so **confirm it now**. The failure is visible —
every heading becomes `No team` — but it is quiet, because §2.6's rule that a
requested-but-absent field is normal covers it without complaint. Press 📊 Report
on a real collection with team-bearing issues and look at the headings. Record the
result in **C.4** with its date, and close limit 2 either way.

---

## What to build

### Two dropdowns

- **Band 1** must be a field. **Band 2** may also be `None`, for a single-level
  report. A report with no bands at all is 📋 Details, so band 1 has no `None`.
- **Seven bandable fields**: priority, team, **status category**, assignee, type,
  fix version, parent.
- **Time remaining may not band** (decision 14). Its band order would be string
  order over durations — `"10m" < "2d" < "9h"` — which reads as a broken report
  rather than a configured one. Put the reason in a comment beside the list, or a
  later session will add it back on the reasonable-sounding grounds that it is just
  another field.

### Status bands by category, never by name

`item.category` is already fetched — `fields.status.statusCategory.key`, one of
Atlassian's fixed three (`new`, `indeterminate`, `done`). Band on that, label it
`To do` / `In progress` / `Done`, and order it with a **three-entry rank**.

**That rank does not reopen §2.15's no-rank-table decision, and the difference
matters.** §2.15 refused a rank for *priority* because priority names are this
instance's own and already sort correctly as strings, so a table could only fall
out of step with Jira. The three categories are **Atlassian's vocabulary**, fixed
and finite, and they do not sort meaningfully as strings. Banding by status *name*
would give `Dev In progress`, `Dev Resolved`, `To Do` — alphabetical noise dressed
as a workflow. Say all of this in the amendment.

### Fix version may band, and an issue can appear twice

Decision 15, and it costs a stated property, so the exception must be deliberate
rather than discovered.

**One issue yields one entry per band, except fix version, which yields one per
version.** A per-release section then lists what actually ships in that release,
which is the only reason to group by it.

**With a multi-valued band, a paste has one line per issue-and-band, not per
issue, so *lines equals items* is not the check there.** That property is what
makes a paste verifiable at a glance, so losing it needs saying out loud — in the
ADR, and ideally in the ⚙ panel beside the option.

**§2.14's *"no format ever drops an item"* still holds.** Nothing vanishes;
something repeats. Do not let the two rules get conflated: dropping is forbidden,
repeating is a consequence the user asked for.

The two alternatives were weighed and rejected. A band named by the joined string
keeps *lines equals items* exactly and produces `Flex 2026.6.x (LTS track), Flex
2026.9.0` as a heading, which groups only issues carrying that exact pair — so a
release section does not list the release. Taking the first version only drops a
fact about the issue silently, and which band it lands in depends on the order
Jira returned the array. Put both in §4.

### The band leaves the row only if it is unticked

The hardcoded `detailBits(item, ["priority"])` goes. **A ticked field is displayed,
band or not** (decision 8) — the shipped defaults leave priority and team unticked,
so the output is unchanged. If 04 has not landed yet, generalise `skip` to *the
current bands* and leave a comment pointing at 04.

### Naming and sorting, unchanged from §2.15

- An absent value sorts **last** in every band, because *not set* is not a peer of a
  real value.
- It is **named** — `No priority`, `No team`, `No epic`, `No fix version`,
  `Unassigned` — never a blank heading. A fact about the issue must not read as a
  failure.
- **Group by id, label by name**, for team. Two teams can share a name and a heading
  that merged them would be a *wrong* report rather than an ugly one (C.4).
- Inside a group, the collection's own order survives.
- Headings stay **tags, not styled spans**: `<p><strong>` and `<p><em>`. §2.14 rule
  5 is about what a paste does to a styled span, and a tag cannot be flattened the
  same way. And not `<h3>` — a pasted heading joins the host document's outline.

---

## What to test, in `format-smoke.mjs`

- The default pair — priority then team — reproduces **§2.15's worked example byte
  for byte**. Existing assertions must not change.
- Each of the seven fields as band 1, with band 2 = `None`.
- A representative handful of band pairs, both flavours.
- **Status category order is `To do`, `In progress`, `Done`** — not alphabetical.
- **Fix version banding: the line count is items + 1** for a sample containing one
  two-version issue, and that issue appears in both bands. Use the sample from A.9;
  the two-fix-version issue is the only kind that can expose this, and it is what
  exposed the original separator bug.
- Every `No …` heading, and empty-sorts-last in both bands.
- `reportBand1 = "none"` cannot happen — 01 range-checks it — but assert the
  renderer's behaviour if it somehow does.
- **The five paste rules on every new byte string.**

---

## Done when

- Defaults byte-identical to 1.1.0.
- **One new rule confirmed able to fail** in a scratch copy — the multi-value line
  count is a good one.
- **§2.15 amended in place, dated.** Its *"A sixth export, not a setting on 📋
  Details"* reasoning **stands** and must be restated: a grouped document is still a
  different document from a flat list, and this ticket configures *that* document
  rather than turning one into the other.
- **The *lines equals items* exception stated** in §2.15's limits, alongside the
  three that are already there.
- **§6 item 7's group-by-epic half closed**, pointing at §2.15. Note that its
  warning — a board card renders the epic's *summary text*, not its key, so
  grouping from the DOM would join on a display string — is why the band comes from
  `bulkfetch`'s `parent`.
- **C.4 updated** with the confirmed answer to limit 2, dated.
- **`formatReport`'s docblock fixed.** It still says one press arms both stepped
  buttons. §2.15 reversed that on 2026-08-21 and the comment never caught up.
