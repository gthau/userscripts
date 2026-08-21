# Harnesses for the Jira Cart

```
node test/jira-cart/run.mjs        # all of them, one total
node test/jira-cart/css-smoke.mjs  # or any single one, on its own
```

**480 checks across seven files. No framework, no `package.json`, no dependencies.**
Node 20.11 or later, for `import.meta.dirname`. The exit code of `run.mjs` is the
number of failing files, so a hook or a CI step needs no output parsing.

There is nothing to install because there is nothing to install *for*: the thing
under test is one file that a browser runs, and these are seven scripts that read it.
That is deliberate and it is the same argument §2.13 of the ADR makes about the
duplicated helpers — a build step is a thing that can break between you and the
answer.

## What each one covers

| File | Checks | What it holds |
| --- | --- | --- |
| `smoke.mjs` | 32 | The pure helpers: `cleanText`, `stripKeyPrefix`, `dropEnterKeyHint`, `keyFromHref`, `normaliseCollections`, `buildCollectedCss` |
| `store-smoke.mjs` | 55 | The store. `load`/`save`/`update`, all four migration rows of ADR §2.4, and every preference clamped and range-checked — including the object form a hand-edited blob arrives as |
| `group-smoke.mjs` | 25 | The selectors, against the real `data-testid` values of all eight views, and `groupFor`'s **two** answers — place beside the key, read from the widest |
| `format-smoke.mjs` | 156 | The **six** copy formats against §2.8's, §2.14's and §2.15's worked examples, `bulkfetch` response validation, `uniqueName`, and every failure sentence §2.9's table promises, word for word. Since 1.1.0 it also asserts the four rules §2.14 bought with real pastes — no `opacity`, no inline `border`, no separator that is a box, no colour without a pale ground |
| `boot-smoke.mjs` | 158 | **The whole script**, against a fake DOM, driven by real clicks through the delegated listeners it really uses. Since 1.1.0 that includes 📋 Details' two presses, its expiry, and its refusal to arm on a refused fetch |
| `css-smoke.mjs` | 23 | The generated stylesheet. The three CSS traps this effort actually hit, plus §2.11 rule 7's arithmetic |
| `tabs-smoke.mjs` | 31 | **The whole script twice**, over one shared store, with a working value-change bus |

## Why they cannot drift from the code

Every harness **reads `src/jira-cart.user.js` off disk** and pulls what it needs out
by brace matching:

```js
function extract(name) { /* find `function <name>(`, count braces to the close */ }
```

So the code under test is the real code, never a copy of it, and **a rename breaks
them loudly** — which is the point. A harness that silently kept passing after the
function it names was renamed would be worse than no harness.

Since 1.1.0 `format-smoke` also slices in the **palette** §2.14 emits — `MUTED_INK`,
`LOZENGE`, `PRIORITY_INK`, `LIST_ITEM_STYLE` — rather than copying those values, because it
asserts things *about* them: that no lozenge ground is saturated, and that no colour
reaches the clipboard which the palette does not name. A copy would let the file and
the assertions drift apart in silence, which is the one thing these harnesses exist
to prevent.

`css-smoke` does the same to the stylesheet: it slices the template literal out of
the `injectStyle` call, resolves the `${...}` names from the real constants, parses
the rules, and computes selector specificity. That is the only way to see the three
bugs it exists for, because **none of them is visible to JavaScript**.

## What a green run does NOT say

**Nothing here can tell you what a paste looks like.** `format-smoke` asserts the
bytes 📋 Details puts on the clipboard, and that is all it can do — every rule it
checks came from pasting into Outlook and Teams by hand and looking at the result
(ADR appendix A.9). Two of those rules reversed a decision that had been argued
through and written down. If §2.14's rendering changes, the harness will tell you the
bytes changed and **it will not tell you whether the result is readable**.

The same applies to the fake DOM: it has no cascade, no layout and no paint, which is
why `css-smoke` exists separately and why §7 still has steps only a browser can
answer.

## The one seam, if the Cart becomes a browser extension

Each file has exactly one line that points at the code:

```js
const src = readFileSync(import.meta.dirname + "/../../src/jira-cart.user.js", "utf8");
```

Change those seven lines and the pure-function harnesses — `smoke`, `store-smoke`,
`group-smoke`, `format-smoke` — keep working unchanged, because they test functions
and not a platform. `css-smoke` keeps working as long as the sheet is still built as
a template literal.

**`boot-smoke` and `tabs-smoke` are the two that would need real work, and they are
the two worth reading first, because what they shim is exactly what a port has to
replace.** They stand in for `GM_getValue`, `GM_setValue` and
`GM_addValueChangeListener`.

> **THE PORT'S BIGGEST HAZARD IS ALREADY VISIBLE IN THESE SHIMS.** `GM_setValue` is
> **synchronous**, and ADR §2.5 and §2.8 both rest on that: the whole store is a
> read-modify-write with no `await` in it, because a clipboard write after an `await`
> lands outside its transient user activation and fails intermittently and silently.
> `chrome.storage.local` is **promise-based**. Porting the store to it puts an
> `await` on the copy path, which is the bug §2.5 forbids by name. The shim in
> `boot-smoke` is synchronous for the same reason the real thing is — so if a port
> makes it async, these harnesses stop being a fair model and the ADR's §2.5 has to
> be reopened before, not after.

`window.open`, `navigator.clipboard`, `ClipboardItem` and `Blob` are also shimmed,
and none of those changes in an extension's content script.

## What they deliberately do NOT cover

Read this before trusting a green run. The ADR's §7 table says the same thing per
test step.

- **No cascade in `boot-smoke`.** Its matcher understands `#id`, `tag`, `.class` and
  `[attr]` only, and returns nothing for anything cleverer — so a summary tier that
  finds nothing there has correctly found nothing, but a *specificity* bug is
  invisible. That is `css-smoke`'s job, and the two do not overlap.
- **No layout and no paint.** Nothing here computes a box. §2.11 rule 7's numbers are
  derived by reading the stylesheet, and appendix C.3 is the probe that would measure
  them for real.
- **No network.** `fetch` throws, which is a case the ADR requires to be survivable
  (§7 step 20: a summary-less item must simply stay bare).
- **No React, and no real virtualisation.** Rows do not unmount under the pointer.
- **No real cross-tab delivery.** `tabs-smoke` has a bus that fires synchronously;
  Tampermonkey's arrives "after a short time" (risk 12).

## Adding a check

Put it in the harness that already owns that area, and **write the label as the claim
it makes**, not as the function it calls — `"the last collection is emptied and NOT
removed"`, not `"deleteCollection works"`. Every label in these files reads as a
sentence about the Cart, so a failure names the broken promise rather than the broken
call. Where the ADR has the reason, cite the section.

One convention worth keeping: when a check exists because a bug actually happened,
say so in a comment, with what the bug looked like from the outside. Several of these
were verified by reintroducing the bug in a scratch copy and confirming the check
fails — that is the only way to know a check can fail at all. `css-smoke`'s first
backtick check could not: it counted backticks in the extracted CSS, which is always
zero, because a stray backtick simply becomes the end of the extraction.
