# Harnesses for the Jira Cart

```
node test/jira-cart/run.mjs        # all of them, one total
node test/jira-cart/css-smoke.mjs  # or any single one, on its own
```

**840 checks across seven files. No framework, no `package.json`, no dependencies.**
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
| `store-smoke.mjs` | 110 | The store. `load`/`save`/`update`, all four migration rows of ADR §2.4, and every preference clamped and range-checked — including the object form a hand-edited blob arrives as. Since 1.2.0 that includes the six export preferences: every id checked against the script's own vocabulary, both field lists through all five steps of `normaliseFieldList`, the tab ids **derived from the bar that draws them**, and the exact key list `Restore export defaults` reaches |
| `group-smoke.mjs` | 25 | The selectors, against the real `data-testid` values of all eight views, and `groupFor`'s **two** answers — place beside the key, read from the widest |
| `format-smoke.mjs` | 346 | The **six** copy formats against §2.8's, §2.14's and §2.15's worked examples, `bulkfetch` response validation, `uniqueName`, and every failure sentence §2.9's table promises, word for word. Since 1.1.0 it also asserts the four rules §2.14 bought with real pastes — no `opacity`, no inline `border`, no separator that is a box, no colour without a pale ground. Since 1.2.0, **§15 asserts all five line shapes byte for byte** — both flavours, all three exports, with a summary and without — and that the shape table names the same ids as the preference's own vocabulary, in the same order. **§16 asserts the two field lists**: that the shipped defaults reproduce 1.1.0 for both exports, that every id `FIELD_CATALOGUE` names draws a bit, that a reordered list emits in the stored order, that zero fields is the head alone, and that the five paste rules hold over every byte string a selection can produce. It also holds **`moveField` directly** — the middle, both ends, an out-of-range index, a string index, and both no-ops — because no harness here can drive the drag itself |
| `boot-smoke.mjs` | 250 | **The whole script**, against a fake DOM, driven by real clicks through the delegated listeners it really uses. Since 1.1.0 that includes 📋 Details' two presses, its expiry, and its refusal to arm on a refused fetch. Since 1.2.0 it also drives the **⚙ screen**: the mode that replaces the body and the foot, the three tabs and the tab it remembers, the two-press restore, an add made **from the page while the panel is up**, and the pinned `Issue reference` control — including a copy that proves the stored shape is read **at the press** rather than held in a variable. It also drives the **two field lists**: eight rows each over one catalogue, a tick that writes and keeps the field's place, a stored reorder the panel draws by **moving** the rows rather than rebuilding them, and an armed `📋 Copy` that survives a preference change in this tab and in another one |
| `css-smoke.mjs` | 46 | The generated stylesheet. The three CSS traps this effort actually hit, plus §2.11 rule 7's arithmetic. Since 1.2.0 it also holds the ⚙ button — its glyph size, the 22px box the head's height depends on, the **state** paint that survives a hover, and the focus reset that every ring inside the drawer must out-specify — and the ⚙ **screen**: that the panel is the drawer's one scroller while it is up, and that the body can actually be hidden underneath it. Since 1.2.0 it also holds the field rows: the transparent border the drop indicator paints into, that the indicator changes only a colour, and **the same specificity trap a third time** — the dragged row's ground has to survive the pointer that is dragging it |
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

Since 1.2.0 it slices in the **shape table** as well — `SHAPES` and `LINE_SHAPE_IDS`
— for the same reason and one more: it asserts that the two name the same ids in the
same order. They are two lists rather than one derived from the other because the
vocabulary has to exist above `DEFAULT_PREFS`, which is built at load, while the
shapes' bytes belong beside the formatters that emit them; a `const` up there reading
the table down here is a temporal dead zone and the script throws on load. **This
check is the only thing holding them together**, and without it a table naming an id
the vocabulary lacks is an unreachable shape, and an id with no table is a preference
that renders nothing.

`store-smoke` does the same to the constants it asserts about — `MIN_INLINE`,
`MIN_BLOCK`, `BASIS_MIN`, `BASIS_MAX`, `LAYOUTS`, `SETTINGS_TABS`, `EXPORT_PREF_KEYS`
and `DEFAULT_PREFS` — and **it is
the file that proves why the rule matters**, because it had already drifted. It
copied `MIN_BLOCK` as `160`; the script has said `215` since 1.0.0, when the floor
was re-derived from the stylesheet. So *"a size below the minimum is clamped"* was
green while measuring this harness's own number, and a stored height of 180 was
accepted here and clamped by the real script. Fixed in 1.2.0 by slicing them. The
value of the floor is still asserted, in `css-smoke`, where it can be derived from
the sheet's own arithmetic rather than copied — set `MIN_BLOCK` back to 160 and that
harness goes red.

`css-smoke` does the same to the stylesheet: it slices the template literal out of
the `injectStyle` call, resolves the `${...}` names from the real constants, parses
the rules, and computes selector specificity. That is the only way to see the three
bugs it exists for, because **none of them is visible to JavaScript**.

## `paste-test.html` — the one thing here that is not a harness

Open it in a browser. It emits **byte-identical HTML to `formatDetails`** and has a
button that puts both flavours on the real clipboard, so a paste into Outlook, Teams,
Confluence or Slack can be done by hand. That button is the only control on the page
that can answer anything, and it is why every rule in ADR §2.14 exists.

It is committed because rebuilding it is the expensive part, and because the next
question about a paste target will be answered the same way. **Keep its chips shape
byte-identical to the script** — if it drifts it starts answering a question about
itself. `run.mjs` does not pick it up; it globs `*-smoke.mjs`.

## `config-prototype.html` — and it has diverged from the script

The configurability effort's switchable page. **Its shape table has FOUR rows and the
script has five**, and the prototype is the thing that is wrong: the fifth shape,
`markdown-key`, was asked for by the paste the prototype's own copy button made
possible (ADR appendix A.9.1), and it was never added back. Its other four rows are
byte-identical to the script's and its labels are the ones that shipped. It also still
carries a warning about the em dash collision on the plain shapes, which the same
paste **accepted** on 2026-08-24, so that warning describes an open question that is
closed.

Nothing here reads the prototype, so nothing goes red when it drifts — which is why it
is written down. **What happens to it is ticket 06's call**, and that ticket names the
three options: merge it into `paste-test.html`, keep both, or let it supersede the rig.
Until then, read the script's `SHAPES` and not this file.

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
- **NO DRAG, OF ANY OF THE THREE.** It follows from the line above: with no layout
  there is no top half of a row to put a pointer in, and no grip to pull. The grip
  and the divider have always been in this bullet; the field lists' reorder joined
  them at 1.2.0, and it is the one place where the cost was named *before* the
  feature was chosen (§4, decision 11). What stands in for it is `moveField` being a
  pure function `format-smoke` drives directly, plus §7 step 31 in a browser. **A
  green run says nothing about whether a row can be dragged at all.**
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
