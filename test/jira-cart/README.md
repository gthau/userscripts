# Harnesses for the Jira Cart

```
node test/jira-cart/run.mjs        # all of them, one total
node test/jira-cart/css-smoke.mjs  # or any single one, on its own
```

**1,137 checks across seven files. No framework, no `package.json`, no dependencies.**
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
| `store-smoke.mjs` | 127 | The store. `load`/`save`/`update`, all four migration rows of ADR §2.4, and every preference clamped and range-checked — including the object form a hand-edited blob arrives as. Since 1.2.0 that includes the six export preferences: every id checked against the script's own vocabulary, both field lists through all five steps of `normaliseFieldList`, the tab ids **derived from the bar that draws them**, and the exact key list `Restore export defaults` reaches |
| `group-smoke.mjs` | 25 | The selectors, against the real `data-testid` values of all eight views, and `groupFor`'s **two** answers — place beside the key, read from the widest |
| `format-smoke.mjs` | 558 | The **six** copy formats against §2.8's, §2.14's and §2.15's worked examples, `bulkfetch` response validation, `uniqueName`, and every failure sentence §2.9's table promises, word for word. Since 1.1.0 it also asserts the four rules §2.14 bought with real pastes — no `opacity`, no inline `border`, no separator that is a box, no colour without a pale ground. Since 1.2.0, **§15 asserts all five line shapes byte for byte** — both flavours, all three exports, with a summary and without — and that the shape table names the same ids as the preference's own vocabulary, in the same order. **§16 asserts the two field lists**: that the shipped defaults reproduce 1.1.0 for both exports, that every id `FIELD_CATALOGUE` names draws a bit, that a reordered list emits in the stored order, that zero fields is the head alone, and that the five paste rules hold over every byte string a selection can produce. It also holds **`moveField` directly** — the middle, both ends, an out-of-range index, a string index, and both no-ops — because no harness here can drive the drag itself |
| `boot-smoke.mjs` | 312 | **The whole script**, against a fake DOM, driven by real clicks through the delegated listeners it really uses. Since 1.1.0 that includes 📋 Details' two presses, its expiry, and its refusal to arm on a refused fetch. Since 1.2.0 it also drives the **⚙ screen**: the mode that replaces the body and the foot, the three tabs and the tab it remembers, the two-press restore, an add made **from the page while the panel is up**, and the pinned `Issue reference` control — including a copy that proves the stored shape is read **at the press** rather than held in a variable. It also drives the **two field lists**: eight rows each over one catalogue, a tick that writes and keeps the field's place, a stored reorder the panel draws by **moving** the rows rather than rebuilding them, and an armed `📋 Copy` that survives a preference change in this tab and in another one. **Since 1.3.0 it drives the hover rail** (§2.7.1): the copy button's own press, and the one geometry claim the feature rests on — that the `+` does not move a pixel when the copy button comes and goes, measured from the rail's own placement rather than argued |
| `css-smoke.mjs` | 52 | The generated stylesheet. The three CSS traps this effort actually hit, plus §2.11 rule 7's arithmetic. Since 1.2.0 it also holds the ⚙ button — its glyph size, the 22px box the head's height depends on, the **state** paint that survives a hover, and the focus reset that every ring inside the drawer must out-specify — and the ⚙ **screen**: that the panel is the drawer's one scroller while it is up, and that the body can actually be hidden underneath it. Since 1.2.0 it also holds the field rows: the transparent border the drop indicator paints into, that the indicator changes only a colour, and **the same specificity trap a third time** — the dragged row's ground has to survive the pointer that is dragging it. **Since 1.3.0 it holds the hover rail**, and one of its checks is the reason this file exists at all: *the `+` is still a containing block*. The plus stopped being `position: fixed` when it gained a neighbour, and the two bars that draw it are `inset: 0` absolute — so without `position: relative` they draw in the viewport's corner and the button is an empty blue circle, while every property `boot-smoke` can see is still correct |
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

## `paste-test.html` — the one thing here that is not a harness, and since 1.2.0 the ONLY one

Open it in a browser. It emits **byte-identical HTML to `formatDetails`** and has a
button that puts both flavours on the real clipboard, so a paste into Outlook, Teams,
Confluence or Slack can be done by hand. That button is the only control on the page
that can answer anything, and it is why every rule in ADR §2.14 exists.

It is committed because rebuilding it is the expensive part, and because the next
question about a paste target will be answered the same way. **Keep its chips shape
byte-identical to the script** — if it drifts it starts answering a question about
itself. `run.mjs` does not pick it up; it globs `*-smoke.mjs`.

Since 1.2.0 the page carries two more things:

- **`Issue reference`, in the instrument rack.** The script's own `SHAPES` table,
  carried across, so all five line shapes reach the clipboard button. That is what
  ADR §7 step 34 needs: appendix A.9.1 answered the yes/no that was blocking — a
  visible URL survives and arrives clickable — and it records in its own words that
  it never itemised which shape went into which target.
- **The ⚙ bench, at the foot.** The drawer at real proportions, with a width and a
  height switch down to the 300×215 floor, so the settings screen can be looked at
  rather than read about. It drives nothing above it, and the page's own fence says
  so.

### `config-prototype.html` was MERGED INTO IT AND DELETED, at 1.2.0

Ticket 06 named three options — merge, keep both, or let the prototype supersede the
rig — and **merge was chosen, on the ground the ticket gave: two rigs is two chances
to drift.** That ground turned out to be understated. **Both files had drifted, and
neither drift was found by anything going red**, because nothing here reads either:

| What was wrong | Since |
| --- | --- |
| The prototype's shape table had **four rows where the script has five**. `markdown-key` was asked for BY a paste the prototype's own copy button made possible (A.9.1) and never added back | 2026-08-24 |
| The prototype's `renderStage` queried `.bench`, **a class no element on that page carried**, so it threw on every call — including the one at load, which is why the drawer never took its width, its height, its zoom or its mode | the commit that first tracked it |
| `paste-test`'s own `render` read `grouped` **before its `const`**, which is a temporal dead zone: it threw `ReferenceError` on every call. The page opened, the instruments drew, and the three surfaces stayed empty. `Copy this shape for real` kept working the whole time, because it calls the builder itself and never goes through `render` — so the one control that can answer anything was the one control that still did | the commit that first tracked it |

All three are fixed. The prototype's export specimens did not come across, because
this page already emits those and does it byte-identically; its own palette, its own
seven issues and its own copy of `detailBits` went with them. What did come across is
the settings mock, and **its three approximations are fenced on the page itself**
rather than left to be discovered: the `--cart-*` chrome colours, the sketched drawer
body, and the tab remembered in `localStorage` where the script uses
`gt-jira-cart.prefs`.

### Verifying the chips, which is the rule this page lives under

`run.mjs` cannot do it — nothing under `test/` reads an HTML file, and adding an
eighth harness that did would give every other file a second seam to point at the
code. So it is a **diff run by hand, and ticket 06 required it rather than assuming
it**: emit one collection from the page's `buildChips` and from the script's
`formatDetails`, on all five shapes in both flavours, and require every byte to
match. Run it after touching either. **It was run at 1.2.0 and it is
byte-identical.**

The same session also booted the whole page against a fake DOM and pressed every
instrument, which is what found the `grouped` fault above and proved the fix by
putting the fault back and watching it throw again. Neither script is committed —
they are twenty lines of `readFileSync` plus the extraction this directory already
does six times — but **that is the shape of the check, and it is cheaper than
believing the page works.**

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

**NOTHING HERE CAN DRIVE A DRAG.** It follows from the line above and it is worth
saying in its own sentence, because 1.2.0 added a third one — the field lists'
reorder — and its cost was named *before* the feature was chosen rather than found
afterwards (ADR §4, decision 11). `boot-smoke` has no layout, so there is no top half
of a row to put a pointer in and no grip to pull. What stands in its place is
everything on either side of the pointer: `moveField` is a pure function
`format-smoke` drives directly, and the panel's rows, their ticks, the writes they
make and the stored order the panel draws are all in `boot-smoke`. **A green run says
nothing about whether a row can be dragged at all**, which is why ADR §7 step 31 is a
browser step and why the cross-list refusal in it has nothing in the file to assert
about — that refusal is the platform's own, standing because `onFieldOver` declines
to call `preventDefault`.

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
- **NOTHING HERE HAS LOOKED AT THE HOVER RAIL.** Added at 1.3.0 and it belongs in
  this list rather than in the one above. `boot-smoke` proves the `+` does not move
  when the copy button comes and goes — but it proves it from **arithmetic against a
  stub rectangle**, because there is no layout here. What the rail actually lands on
  in a real Jira row, and whether the copy button is findable at all, are ADR §7 steps
  36 and 37. The rail's own placement code is the same in both cases; what differs is
  everything around it.
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

**It happened again at 1.2.0, and the comment now says so in place.**
`format-smoke`'s check that a field list cannot reach 🔗 Links was written believing
it guarded `format`'s `entry.fields ?` test — and dropping that test changes no byte,
because `formatLinks` takes three parameters and JavaScript discards a fourth in
silence. The check was KEPT, because it holds a real claim no other one makes: those
four exports' bytes do not MOVE when a preference moves, where every other check on
them runs with the defaults and only ever said the bytes are 1.1.0's. What changed is
the comment, which now says what the check holds rather than what it was meant to.
**Run the mutation before writing the comment**, not after.

### The 1.2.0 mutation run, and what it does and does not say

Ticket 06 asked for every check the six tickets added to be **proven able to fail**.
The honest form of that, over 604 new checks, is a mutation run: change one thing the
tickets landed, and require the harness to go red.

**26 mutations, and 0 survived.** Each names the claim it is meant to make a liar of,
and each is a single edit to `src/jira-cart.user.js` in a scratch copy:

| Area | Mutations | Caught by |
| --- | --- | --- |
| **01, the preferences** | a list keeps a field's place when unticked; `on` is true only when exactly `true`; an unmentioned catalogue field is appended OFF; a duplicate collapses to its first entry; an unknown id is dropped; `reportBand1` may not be `none`; a new field arrives OFF in both defaults; an unknown tab id lands on the first tab | `store-smoke`, and five of the eight also `boot-smoke` |
| **03, the line shapes** | the default is what 1.1.0 emitted; `markdown` drops its space with the summary; `key-summary-url` keeps its separator with its value; the table names the vocabulary's ids in its order; every shape defines both flavours; `bold` reaches 📋 Details' head and not 🔗 Links' | `format-smoke`, four of the six also `boot-smoke` |
| **04, the field lists** | `moveField`'s middle case, its out-of-range refusal, and that it returns a **copy** rather than splicing its argument; the tail prints in stored order; an unticked field does not print; the selection reaches only its own export; the fields are read at render and never at fetch | `format-smoke`, four also `boot-smoke`, one also `tabs-smoke` |
| **05, the bands** | the two may not name one field; the swap moves the other dropdown to what this one held; the status categories come out in Atlassian's order and not alphabetically; the default pair is priority then team | `format-smoke` and `boot-smoke`, one also `tabs-smoke` |
| **the stylesheet** | the ⚙'s state paint survives a hover | `boot-smoke`, `format-smoke` |

**What it does not say, and this matters more than the number.** A mutation run proves
that *something* goes red, not that the check you had in mind is the one that caught
it — several of these are caught by three files at once. And it says nothing about a
claim nobody wrote a check for: a mutation only exists where somebody thought of the
failure. It is a floor, not a ceiling.

**Two mutations were written badly before they were written well**, and both failed in
the same way the backtick check did — by changing no byte. Adding a defaulted
parameter to `detailBits` does nothing, because every caller passes the argument; and
adding a fourth parameter to `formatLinks` does nothing, for the reason recorded
above. **A mutation that survives is as likely to be a bad mutation as a missing
check**, so read the diff before believing the result.

### The 1.3.0 run — the hover rail

**14 mutations, and 0 survived**, over the 48 checks the copy button added
(ADR §2.7.1). Same method, same day, same scratch copy.

| Area | Mutations | Caught by |
| --- | --- | --- |
| **the geometry** | the rail is placed as though the `+` were still alone, so the `+` moves 28px | `boot-smoke` |
| **the two buttons are not one button** | the rail decides `pointerOnToggle` instead of the toggle, so hovering the copy button offers to remove a collected issue | `boot-smoke` |
| **item scope** | a single copy uses `collection` scope, so one issue arrives with a `- ` bullet and a `<ul>`; no export is marked as the single-issue one, so the gesture copies nothing; two exports claim it | `boot-smoke`, `format-smoke` |
| **the summary** | a single copy reads no summary from the page | `boot-smoke` |
| **the receipt** | the glyph stops being derived from the flash, so the `✅` never appears and a re-render is measuring nothing | `boot-smoke` |
| **the preference** | the copy button ignores its own switch; the switch reads like an off-by-default one, so a fresh install has no copy button and a hand-edited string turns it off | `boot-smoke`, `store-smoke` |
| **the menu** | the third entry is gone | `boot-smoke` |
| **the stylesheet** | the `+` loses `position: relative`; the flipped rail stops reversing its row; the rail stops being `position: fixed`; the copy button is painted by its flash state | `css-smoke` |

**The stylesheet's four are why that file exists, and the first one is the clearest
example in this repository of a bug JavaScript cannot see.** Take `position:
relative` off the `+` and the two bars that draw it — `position: absolute; inset: 0` —
resolve against the viewport instead of the button. The plus is drawn in the corner of
the screen and the button is an empty blue circle. Meanwhile the button still has both
bars as children, still has their classes, and still reports the right
`data-gt-state`, so **every check `boot-smoke` could possibly make is still green.**
That mutation was run before the comment beside the check was written, which is the
rule this README already states and which was broken twice in the 1.2.0 run.

**One thing this run does NOT say, and it is the same gap as everywhere else here:
nothing was pasted and nothing was looked at.** Whether a 52px rail covers the
issue-search table's checkbox, whether the `🔗` can be picked out beside the blue
circle, and what a single line with **no `<ul>` around it** does in Outlook are ADR §7
steps 36 and 37, and no mutation of any check in this directory can reach them.
