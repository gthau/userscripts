# Session prompt: making the exports configurable

> **RUN on 2026-08-21 and 2026-08-22. The outcome is
> [`configurability/`](configurability/)** — the decision record, and six
> implementation tickets, one per session. **All six landed, and 1.2.0 shipped on
> 2026-08-25.** The decisions are in the ADR, amended in place and dated; the
> tickets' own record marks each one done and says what changed when it met real
> code.
>
> Written 2026-08-21, at the end of the 1.1.0 session, by the person who built it —
> so it names the traps from the inside rather than from a reading of the code.
> **The prompt below is left exactly as it was written.** It is the question; the
> tickets are the answer, and the two are worth reading against each other.
>
> **What it got right.** Grilling first, and not building until the shape was
> settled. Naming the five paste rules as the argument against a template — that is
> what killed the template. Sending every question about how the output looks to the
> rig instead of to a structured question.
>
> **Where the session went somewhere it did not predict.** It offered four shapes
> in rising cost and expected one to win; the answer was **two mechanisms at once**,
> because the issue reference and the field tail want different kinds of control —
> punctuation and where a URL sits cannot be expressed by toggles. It listed the
> foot as full and settings as belonging in ⚙, which held — but ⚙ turned out to need
> to be a **whole screen**, forced by a measurement the prompt did not anticipate:
> ~22 controls in a drawer that can be 300×215px, where every container is
> `overflow: clip`. And its closing lesson proved itself twice more inside this
> session — the panel's layout was settled by argument, prototyped, chosen, and then
> **reversed by pressing it**, twice.
>
> **One thing it asked for that was refused, and one it was wrong about.** §2.8's
> template finding is **upheld**, not overturned; the evidence went the other way and
> the section stands with its reason restated. And §4's rejection of
> `[KEY] Summary — URL` — *"its only distinct paste target cannot be named"* — was
> **overturned**, because the user named it in one sentence: a destination that does
> not render markdown.
>
> **What the six sessions added, which the prompt could not have.** Its instruction to
> send every question about the output to the rig was right, and it was right for a
> reason the prompt did not state: **the rig is where a decision gets pressed.** Four
> answers were overturned after they had been argued through, costed and written down
> — the panel's layout twice, the ⚙'s missing state, and the duplicate band pair — and
> a fifth line shape was asked for by a paste. One more was *confirmed* the same way
> rather than overturned: the drag's usability at the 300px floor, which had been
> decided rather than measured, and which came back working. Every one of them came
> from pressing a control or pasting an output.
>
> **And one thing it could not have predicted, which is about the rig itself.** The
> prototype this prompt asked for was thrown away by ticket 06 — merged into
> `paste-test.html` — and the merge found that **both** rigs had been broken for as
> long as they had been tracked, each throwing on every render, with nothing under
> `test/` able to see it. If a later prompt asks for a prototype, ask it to boot the
> page once against a fake DOM as well.

## The task

Make the Cart's exports configurable. Three things, and they are **not** one feature:

1. **The 🔗 Links format** — a user-editable shape for the line.
2. **Which fields 📋 Details includes** — nine today, fixed.
3. **How 📊 Report orders and groups** — priority then team today, fixed.

Read `src/jira-cart.user.md` before anything else: **§2.8, §2.14, §2.15, §4, §6
items 10 and 14, and appendix A.9.** Then this file.

## Start by grilling, not by building

Use `/grilling`. One question at a time, through the structured question tool, with a
recommendation first and the cost of each option stated. Prose questions ending in a
question mark do not work here; that is recorded and it was learned twice.

**And for anything about how the output looks, do not ask — build it.** The rig is
`test/jira-cart/paste-test.html`. Open it, add the variant, and hand over the link.

## The central tension, which the session must resolve rather than dodge

**§2.8 already decided that a fill-in-the-blanks template is a REWRITE of the format
layer and not a configuration of it**, and it gave the reason: Names' summary-less
line is a *different line shape*, not a substituted value, so the template needs a
conditional inside it. §6 item 10 defers user-editable templates on exactly that
finding. §2.14 strengthened it: a template would now also have to express a lozenge
whose colour comes from a status *category*, a colour that applies to two of five
priorities, and a separator that must not be a box.

**So this task reopens a closed decision. That is allowed — and it has to be done on
evidence, not on the wish.** The honest shapes to weigh, in rising cost:

| Shape | What it is |
| --- | --- |
| **Presets** | Two or three fixed alternatives per format, chosen in ⚙. No language, no parser, and each one is checkable byte for byte. |
| **A field list** | For 📋 Details: an ordered subset of the nine, chosen by checkbox. Not a template — a filter over a fixed renderer. |
| **A sort/group choice** | For 📊 Report: which field bands, and in which order. Two dropdowns, not a query language. |
| **A real template** | `{key}`, `{summary}`, conditionals. §2.8's rewrite, and the thing to justify or decline. |

**The argument against, which must be answered and not skipped:** §2.14 says *a
setting that silently changes what a button produces is what §2.8 warns against, and
a fixed output is checkable*. Every option above weakens that. The question is not
*can we* but *what is the smallest thing that meets the need*, and **whose** need —
`06` §1 called the four formats a spanning set because each served one destination.

## Nine things that will bite, from the session that just ended

1. **THE FIVE PASTE RULES ARE NOT NEGOTIABLE.** ADR §2.14 lists them; appendix A.9
   holds the measurements. No `font-size` at all, no `opacity`, no inline `border`, a
   separator must be a character and never a box, a colour must bring its own
   background and that background must be **pale**, and nothing may depend on a row's
   position. `format-smoke.mjs` asserts every one on the emitted bytes.
   **A user-written template means user-written styling reaching the clipboard, and
   these five rules then have no enforcement point.** That is the strongest single
   argument against a real template and §2.8 named the safety half of it already.
2. **A preference is stored, and that is a different key with different rules.**
   `gt-jira-cart.prefs` (§2.4): only known keys survive a read, every value is
   range-checked on the way in, and a malformed preference **falls back to defaults**
   — the exact opposite of the collections key, which is preserved untouched. Do not
   let a format preference near `load()`.
3. **A stored field list can disagree with the field list in the code.** A retired
   field id in a stored preference must vanish silently, the way `normalisePrefs`
   already drops unknown keys. And a preference holding *zero* fields is a document
   with no content — decide what that means before somebody clicks it.
4. **The foot is full.** Six buttons, and two of them carry a reserved-width label
   ladder (`min-inline-size: 11ch`) precisely because a changing label used to
   rearrange the row. **A settings UI belongs in ⚙, not the foot.** Adding a seventh
   button needs a reason better than convenience.
5. **`📋 Details` and `📊 Report` share one field list and one `detailChip`.** That is
   deliberate: the five rules are properties of the paste target, not of a format, so
   one copy of them is the only safe number. If configurability splits them, say what
   stops the two drifting.
6. **Arming is per button, and it was reversed to get there.** §2.15. One press used
   to arm both, on the reasoning that the held fetch describes the collection rather
   than a button — true of the data, wrong about the control. Do not undo it.
7. **Nothing fetched is stored** (§2.14), so adding a field to the *fetch* is one id
   and one `add`. Adding a field to a stored *preference* is not free. Keep the two
   apart in your head.
8. **`bulkfetch` returning a custom field asked for by id is EXPECTED, not known.**
   The Cart has only ever requested system fields, and `customfield_15541` (Team) is
   the first. Its failure mode is visible — every heading becomes `No team` — so
   confirm it early if the report is touched. Appendix C.4.
9. **`docs/` is frozen and the ADR is the decision of record.** Fold what only lives
   in a working file into an appendix. Amend a claim **in place, with its date, and
   keep the original reasoning** — §2.8 carries two such amendments and they are the
   model.

## What "done" looks like

- The ADR carries the decision, and §2.8's template finding is either **upheld with
  its reason restated** or **overturned with the evidence that overturned it**. Not
  quietly bypassed.
- Every new output is asserted **byte for byte** in `format-smoke.mjs`, and every new
  rule is confirmed able to fail by reintroducing the fault in a copy of the script.
- Every new preference is range-checked in `store-smoke.mjs`, including the hostile
  values: absent, wrong type, empty list, unknown field id.
- The paste rig gained the variants, and **its chips shape is still byte-identical to
  the script**.
- A version bump, and the header docblock updated.

## Two things left unexplained, so they are not mistaken for settled

- **Appendix A.9's contradiction.** An early paste from the rig into Outlook kept the
  `font-size:88%` spans that the script's own paste lost. Identical styling, same
  target, same paste mode, two results. The script emits no `font-size`, so it cannot
  bite — but if content loss reappears in Outlook, this is the thread to pull, and the
  rig's `Metadata size` switch is the experiment.
- **Appendix C.5.** This instance has more than one field called `Team`. Only one
  appears on RDC's screens. A collection spanning projects may need a different id,
  and a name reference will never say which field answered.

## The lesson to carry in

The map effort settled its questions by research and argument, and was right to.
**1.1.0 could not.** Four decisions were argued through, costed, written into the ADR
— and reversed by pasting the output somewhere real. Two more were reversed by
*using* the buttons. Both kinds of reversal came back within hours.

**Where the output leaves the browser, or a control is pressed by a person, the
argument is a hypothesis and the paste is the experiment.** Configurability multiplies
the number of outputs, so it multiplies the number of hypotheses. Ship something small
enough to paste.
