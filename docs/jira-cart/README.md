# The working record behind the Jira Cart

> **[`src/jira-cart.user.md`](../../src/jira-cart.user.md) IS THE DECISION OF RECORD.
> Everything in this directory is the dated evidence behind it, and some of it is
> stale on purpose.** If a file here disagrees with the ADR, the ADR wins — it was
> written after, and it carries the corrections. Nothing here is maintained.

These files were untracked for the whole of the effort, and the ADR said so in its
own words: *"The tickets and the research passes are not in this repository… So this
document is the record."* They were committed at 1.0.0 for one reason: **the Cart may
grow features or move to a browser extension, and re-deriving any of this is
expensive or impossible.** Three of the measurements below could not be taken from
documentation at all — Tampermonkey's docs could not be read on two separate
attempts (ADR risk 3) — so they exist only because somebody ran them in a browser in
August 2026.

## What is here

| Path | What it is |
| --- | --- |
| `map.md` | The map of the whole effort: ten tickets, what each had to settle, and what blocked what |
| `issues/` | **The ten tickets.** Each one's verdict is in the ADR; what is here is the reasoning, the alternatives weighed, and the rejections with their grounds |
| `research/` | **The seven research passes.** The measurements, with their dates and their run counts. This is the irreplaceable part |
| `prompts.md` | The session prompts that drove the map effort |
| `build-prompts.md` | The session prompts that drove the three build sessions, L1 to L3, with the guards each one carried |
| `prompts-configurability.md` | The prompt for the configurability effort, written at the end of the 1.1.0 session by the person who built it, so it names the traps from the inside. **Run on 2026-08-21/22**, and left exactly as written, with a note on what it predicted and what it did not |
| `configurability/` | **The 1.2.0 effort.** The decisions that prompt produced, and the **six implementation tickets** it broke them into — all six landed between 2026-08-22 and 2026-08-25. Start at its README: it marks each ticket done and, beside it, what changed once the ticket met real code |
| `presets/` | **THE LIVE ONE. The 1.7.0 effort, opened 2026-08-27.** Export presets: named field/heading/head arrangements per export, chosen at the press by an arrow beside the button. Its README holds the 25 decisions, the eight stated limits, and **five tickets** — the first of which is a prototype, because the effort before it had four decisions reversed by somebody pressing a control |

`part1.js` to `part6.js` were left in scratch and not committed: they are version
0.1.0 written in six chunks, superseded by the 4,826-line file in `src/`.

## If the question is "should this be an extension?"

That question was asked and answered, on evidence, and the answer was **userscript,
unconditionally**. Read these three in this order:

1. **`issues/04-userscript-or-chrome-extension.md`** — the verdict, and what it was
   weighed against. This is the document to reopen, not to rewrite.
2. **`research/10a-storage-options.md`** — where the collections live, and the run
   that mattered most: does a `ClipboardItem` write survive a `@grant`? That one
   answer decided whether Tampermonkey storage was a candidate at all.
3. **ADR §2.12**, and then **`test/jira-cart/README.md`**, which names the hazard a
   port hits first: `GM_setValue` is synchronous and `chrome.storage` is not, and
   ADR §2.5 and §2.8 both rest on the synchronous one.

Two things in the ADR already argue *for* an extension and are the honest case to
weigh: **risk 11** (the Cart exists once per tab; an extension's UI exists once per
window) and **risk 3** (the collections live in one browser profile). Both are listed
as platform costs rather than as settled comfort.

## If the question is "how do I run an effort like this one?"

`map.md` and then `build-prompts.md`. The staging in the second is not arbitrary and
it says why: each stage ends with something installable, so a wrong call is found
while it is still cheap. Its guards are worth reading whole — they were written after
a first attempt lost a session to fan-out subagents.

The shape that worked, every time, for a question with real consequences: **ask one
question, recommend one answer, state the cost, and write the answer into the
document with its date.** ADR §6 item 1 is the first instance; the version, risk 10,
the keyboard and the cross-tab preference at 1.0.0 are the latest four.

**And the lesson that cost the most is about the answers, not the questions.** One
decision — whether the drawer starts closed — was asked properly, recommended,
costed, and written down with its reason, and then **using the thing reversed it the
same day**. The deduction had been sound and the premise had not: a reload is not the
end of a sitting. §2.9 keeps both the original reasoning and the reversal for exactly
that reason. So: ask, record, and **expect use to overrule you**. An answer given
before anyone has used the thing is still a guess, however well argued.


## THE MULTI-SESSION EFFORTS LEAVE SOMETHING HERE, and it is the exception that says why

`configurability/` and `presets/` are the only directories here holding tickets for
something newer than 1.0.0, and the reason is size rather than a change of rule: an
effort that runs to five or six sessions needs a prompt that survives them, and that
has to be written down before the first one. **The rule itself is unchanged** — the
ADR is the decision of record, these are the dated evidence, and where they disagree
the ADR wins. 1.1.0 was one session and left nothing here, which was right for one
session.

**`presets/` is the live one**, and it is the first effort in this repository whose
**first ticket is a prototype** rather than a piece of the build. That ordering is
`configurability/`'s own finding applied rather than admired: four of its decisions
were reversed by pressing a control and a fifth option was asked for by a real paste,
and none of the five came from re-reading a design.

**What it adds to the lessons below.** The map effort settled its questions by
research and argument. 1.1.0 could not, and this one could not either: **four
decisions were reversed by pressing a control** — the panel's layout twice, the ⚙'s
own missing state, and the duplicate band pair — and **a fifth line shape was asked
for by a paste**. None of the five came from re-reading the design. Two are worth
naming because the argument had been made *in writing* and was wrong anyway: the
panel's layout, settled and prototyped and then reversed by pressing it twice; and the
duplicate pair, which shipped reachable on a written case that it was harmless, with
every byte of it already asserted, and which one press overturned in a minute.
**Where a control is pressed by a person or an output leaves the browser, the
argument is a hypothesis.**

And one lesson that is not about design at all. **Two throwaway rigs sat in `test/`
and both were broken, in silence, for as long as they had been tracked** — one threw
on every call at load, the other threw on every render. Nothing under `test/` reads an
HTML file, so nothing could go red. 1.2.0 merged them into one and the merge is what
found both. A rig that nothing reads is a rig nobody can trust; if you keep one, boot
it against a fake DOM once and you will know.

## The 1.1.0 effort left nothing here, on purpose

**Everything in this directory is the map effort of 10–19 August 2026, which ended at
1.0.0.** The detailed export and the report — 1.1.0, 20–21 August — produced **no
ticket and no research file**, and that is not an omission: what it measured went
straight into the ADR, which is where the rule from this README's own banner points.

If you are looking for that effort's record:

| What | Where |
| --- | --- |
| The decisions | **ADR §2.14** (📋 Details) and **§2.15** (📊 Report) |
| What each paste target keeps and strips | **ADR appendix A.9** — the irreplaceable part, and the only place it exists |
| The reversals, with the premises that failed | §2.14, §2.15, and eleven new rows in **§4** |
| The `Team` field, and what is still unknown about it | **appendix C.4** and **C.5** |
| The rules, in a form that cannot rot | `test/jira-cart/format-smoke.mjs` §12–14, which asserts them on the emitted bytes |
| The rig that found them | `test/jira-cart/paste-test.html`, and it is the one live thing near this directory |

**The lesson that effort adds to the ones below.** The map settled its questions by
research and argument, and it was right to. **1.1.0 could not**: four decisions were
argued through, costed, written into the ADR, and then **reversed by pasting the
output somewhere real** — and two more were reversed by *using* the buttons. Where
the output leaves the browser, or the control is pressed by a person, the argument is
a hypothesis and the paste is the experiment.

## What to distrust here

- **Anything about the DOM.** The survey covered seven views; **there are eight**, and
  the eighth was found by *using* the Cart rather than by surveying (ADR §2.1). Risk
  19 says to expect a ninth. `research/02c-live-dom-survey.md` predates that.
- **`05-collection-data-model-in-localstorage.md`** — the filename still says
  `localstorage`, and the answer moved: all three keys are in Tampermonkey's storage
  (ADR §2.4, decided 2026-08-18).
- **Any `data-testid`.** Atlassian can rename them, and four of the names in the
  tickets turned out to be wrong or absent when probed on a live page. Appendix A.6 of
  the ADR has the corrections; the tickets do not.
- **Every dated claim.** The measurements are from August 2026, on one Jira Cloud
  instance, by one person.
