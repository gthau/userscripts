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
