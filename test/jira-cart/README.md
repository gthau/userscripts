# Harnesses for the Jira Cart

```
node test/jira-cart/run.mjs        # all of them, one total
node test/jira-cart/css-smoke.mjs  # or any single one, on its own
```

**1,489 checks across nine files. No framework, no `package.json`, no dependencies.**
Node 20.11 or later, for `import.meta.dirname`. The exit code of `run.mjs` is the
number of failing files, so a hook or a CI step needs no output parsing.

There is nothing to install because there is nothing to install *for*: the thing
under test is one file that a browser runs, and these are nine scripts that read it —
eight reading the script, and since 2026-08-27 one reading the two HTML rigs.
That is deliberate and it is the same argument §2.13 of the ADR makes about the
duplicated helpers — a build step is a thing that can break between you and the
answer.

## What each one covers

| File | Checks | What it holds |
| --- | --- | --- |
| `smoke.mjs` | 64 | The pure helpers: `cleanText`, `stripKeyPrefix`, `dropEnterKeyHint`, `keyFromHref`, `normaliseCollections`, `buildCollectedCss` — and since 1.4.0 **`moveInList`**, the array move BOTH drags go through. It was `moveField` and it lived in `format-smoke`; it never touched a field, and once the collection's item list moved through it too (ADR §2.9.1) a pure helper two features share belongs in the pure-helpers file. The field checks came with it, plus the two a list of issues adds: a list of one, and entries that are not `{id, on}`. **Since 1.6.0 it also holds `keysFromUriList`** (ADR §2.9.3) — the one parser all three of the drop feature's sources go through: CRLF and bare LF, RFC 2483 comment lines, a relative line, the same-origin rule that stops another instance's URL being retargeted at this one, deduplication, and the two things that must yield NOTHING — prose that spells a key, and our own `text/plain` line |
| `store-smoke.mjs` | 212 | The store. `load`/`save`/`update`, all four migration rows of ADR §2.4, and every preference clamped and range-checked — including the object form a hand-edited blob arrives as. Since 1.2.0 that includes the six export preferences: every id checked against the script's own vocabulary, both field lists through all five steps of `normaliseFieldList`, the tab ids **derived from the bar that draws them**, and the exact key list `Restore export defaults` reaches. **Since 1.7.0 it holds the fourth key, `gt-jira-cart.presets`** (ADR §2.4, amended 2026-08-28), and §18 is written as the MIRROR of §10: a preference that will not parse falls back to the shipped defaults, and a preset list is **repaired per entry** instead. The first-run build carrying the preferences as they are stored right now — which is what keeps 1.6.0's output byte-identical — a list that is not an array rebuilt **while the other one survives**, the four ways a name can be unusable and the drop that follows, `uniqueName` applied inside a list, the bands proved to go through the preference's OWN function rather than a copy of its rule, and the **one-★ invariant** every screen after this one rests on |
| `group-smoke.mjs` | 25 | The selectors, against the real `data-testid` values of eight of the nine views, and `groupFor`'s **two** answers — place beside the key, read from the widest. The ninth is `rovo-smoke` |
| `rovo-smoke.mjs` | 51 | **The ninth view, Rovo search**, and the only harness here that builds a WHOLE TREE of elements rather than stubbing `closest` per call — because the defect that opened it was the **contract check firing**, and nothing but a real tree can answer whether a warning appears. It runs `scanPage`, `checkContract`, `readSummary`, `groupFor` and `originOf` unmodified against a page whose every testid and width was measured on the live page on 2026-08-25. It holds the two things that view taught: that **a row entry without a summary entry changes nothing** (tier 0 → tier 0 → tier 1, asserted in all three states), and that the regions are **layered** — with the row name rotted the check stays quiet, with its fallback gone too the table is reported at 20 keys, and with neither region named the warning is the one the user read off the page, **42 keys**, word for word |
| `format-smoke.mjs` | 552 | The **six** copy formats against §2.8's, §2.14's and §2.15's worked examples, `bulkfetch` response validation, `uniqueName`, and every failure sentence §2.9's table promises, word for word. Since 1.1.0 it also asserts the four rules §2.14 bought with real pastes — no `opacity`, no inline `border`, no separator that is a box, no colour without a pale ground. Since 1.2.0, **§15 asserts all five line shapes byte for byte** — both flavours, all three exports, with a summary and without — and that the shape table names the same ids as the preference's own vocabulary, in the same order. **§16 asserts the two field lists**: that the shipped defaults reproduce 1.1.0 for both exports, that every id `FIELD_CATALOGUE` names draws a bit, that a reordered list emits in the stored order, that zero fields is the head alone, and that the five paste rules hold over every byte string a selection can produce. It used to hold `moveField` directly; that function is `moveInList` now and its checks are in `smoke.mjs`. What replaced them here is **§18, a hand-made order**: that a reordered collection is what all six exports emit, and — the half that is not tautological — that a moved row keeps its new place **inside** a 📊 Report band, which is the one export whose grouping could plausibly have thrown the order away (§2.9.1) |
| `boot-smoke.mjs` | 439 | **The whole script**, against a fake DOM, driven by real clicks through the delegated listeners it really uses. Since 1.1.0 that includes 📋 Details' two presses, its expiry, and its refusal to arm on a refused fetch. Since 1.2.0 it also drives the **⚙ screen**: the mode that replaces the body and the foot, the three tabs and the tab it remembers, the two-press restore, an add made **from the page while the panel is up**, and the pinned `Issue reference` control — including a copy that proves the stored shape is read **at the press** rather than held in a variable. It also drives the **two field lists**: eight rows each over one catalogue, a tick that writes and keeps the field's place, a stored reorder the panel draws by **moving** the rows rather than rebuilding them, and an armed `📋 Copy` that survives a preference change in this tab and in another one. **Since 1.3.0 it drives the hover rail** (§2.7.1): the copy button's own press, and the one geometry claim the feature rests on — that the `+` does not move a pixel when the copy button comes and goes, measured from the rail's own placement rather than argued. **Since 1.4.0 it drives a DRAG** (§2.9.1), which this README said for two versions could not be done here: `dragstart` → `dragover` in a named half of a named row → `drop` → `dragend`, through the delegated listeners the script really registers, with a rect stubbed per row. It holds all four payload types and their bytes — including that the three external ones are the `🔗` button's, asserted against the same literals as its own press, so one issue cannot come to have two shapes; both halves of a row and the append below the last one; that a release with no drop writes nothing; that the list does **not** redraw while the pointer is down; and that a write landing mid-drag survives the drop, because `update` re-reads before it writes. **Since 1.6.0 it drives the other direction — a drop INTO the Cart** (§2.9.3), with a `dataTransfer` that can be **read**: `types` for the accept and `getData` for the drop. A `dragover` that does not call `preventDefault` *is* the refusal, so acceptance is asserted directly instead of inferred. It holds every live row draggable with its key opted out, the live drag's three types and `copy`, a chip taking a drop **without becoming active**, the move and the Ctrl copy and Ctrl released mid-drag changing the cursor back, the item carried **whole** — proved by making the stored summary differ from the page's — the duplicate reaching the same end state, the gap above and below and the append with no row under the pointer, and all four refusals: a collection, no url-list, a foreign origin, and a read-only store |
| `css-smoke.mjs` | 86 | The generated stylesheet. The three CSS traps this effort actually hit, plus §2.11 rule 7's arithmetic. Since 1.2.0 it also holds the ⚙ button — its glyph size, the 22px box the head's height depends on, the **state** paint that survives a hover, and the focus reset that every ring inside the drawer must out-specify — and the ⚙ **screen**: that the panel is the drawer's one scroller while it is up, and that the body can actually be hidden underneath it. Since 1.2.0 it also holds the field rows: the transparent border the drop indicator paints into, that the indicator changes only a colour, and **the same specificity trap a third time** — the dragged row's ground has to survive the pointer that is dragging it. **Since 1.3.0 it holds the hover rail**, and one of its checks is the reason this file exists at all: *the `+` is still a containing block*. The plus stopped being `position: fixed` when it gained a neighbour, and the two bars that draw it are `inset: 0` absolute — so without `position: relative` they draw in the viewport's corner and the button is an empty blue circle, while every property `boot-smoke` can see is still correct. **Since 1.4.0 it holds the collection's draggable rows** (§2.9.1): the same specificity trap a FOURTH time, the transparent border both lists' rows reserve so nothing reflows under a pointer mid-drag, and the one word the grip decision comes down to — `visibility` and not `display`, so the glyph's width is held whether or not it is painted. **Since 1.6.0 it holds the live list's own drag and the two new drop indicators** (§2.9.3): the live rows' grab cursor and reserved grip, the chip's ring as an `outline` rather than a third meaning on a border that already carries two, and the dashed outline an EMPTY item list wears — the one gap a list with no rows still has |
| `tabs-smoke.mjs` | 31 | **The whole script twice**, over one shared store, with a working value-change bus |
| `rig-smoke.mjs` | 29 | **THE TWO COMMITTED HTML RIGS, and the first thing here ever to read one.** Added 2026-08-27 after the sixth drift in `paste-test.html`: a CSS comment that was never closed swallowed five rules whole, including all of `.cart`, so the drawer stopped clipping and stopped being a flex column. It holds three kinds of check. **The sheet parses:** every comment closed by walking the pairs rather than counting them, braces balanced, and no orphan declaration between one rule and the next. **The rules a rig's answers depend on exist:** `.cart` still carries `overflow: clip`, `display: flex` and `flex-direction: column`, `.b-stage` still carries its flex, and each of the three areas that get the `hidden` attribute has a paired `[hidden]` rule — because an author rule setting `display` on a class beats the browser's own. **And the drawer mock has not drifted:** the foot, the head, the chips row and the tab bar are compared **property by property against the script's own rules, sliced out of `src/`**, which is the check the fourth drift is the reason for. It also asserts every id the page's scripts fetch exists and every class they set is painted. It says nothing about layout — there is no browser here — so fit is still §7's browser step |

## Why they cannot drift from the code

Every harness **reads `src/jira-cart.user.js` off disk** and pulls what it needs out
by brace matching:

```js
function extract(name) { /* find `function <name>(`, count braces to the close */ }
```

**`rovo-smoke` carries a different `extract`, and the reason is a trap worth knowing
before you copy the one above.** It counts braces from the first `{` after the name,
and `checkContract({ rows, unexplained })` takes a **destructured parameter**: that
brace opens and closes inside the signature, so the count reaches zero there and the
"body" comes back as `function checkContract({ rows, unexplained }`. It then fails as
a syntax error one call later, naming neither the function nor the cause. The version
in `rovo-smoke` walks the parameter list first and starts the body after it closes.
Copy that one if a harness ever needs a function whose arguments are destructured.

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
`MIN_BLOCK`, `BASIS_MIN`, `BASIS_MAX`, `LAYOUTS`, `SETTINGS_TABS`, `EXPORT_PREF_KEYS`,
`DEFAULT_PREFS` and, since 1.7.0, the four key NAMES, `DEFAULT_PRESET_NAME` and
`PRESET_LISTS` — and **it is
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

## `paste-test.html` — one of the two things here that are not harnesses

Open it in a browser. It emits **byte-identical HTML to `formatDetails`** and has a
button that puts both flavours on the real clipboard, so a paste into Outlook, Teams,
Confluence or Slack can be done by hand. That button is the only control on the page
that can answer anything, and it is why every rule in ADR §2.14 exists.

It is committed because rebuilding it is the expensive part, and because the next
question about a paste target will be answered the same way. **Keep its chips shape
byte-identical to the script** — if it drifts it starts answering a question about
itself. `run.mjs` does not pick it up; it globs `*-smoke.mjs`.

> **IT STOPPED BEING THE ONLY ONE AT 1.5.0.** `drag-test.html` is the second page of
> this kind, and the sentence above applies to it word for word.

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

### The bench gained a fifth `Tabs` variant on 2026-08-27: `Presets · proposed`

**It is a PROPOSAL and not a shipped screen** —
[`docs/jira-cart/presets/`](../../docs/jira-cart/presets/README.md) is the design and
`01-the-prototype.md` is the ticket. What it adds: a four-tab bar at full label length,
the preset block in both export tabs, a per-preset `Issue reference`, and **three
arrows in the foot**. It carries a readout under the drawer that measures the foot
**with the arrows and without them**, in layout pixels, and prints the `MIN_BLOCK` the
delta implies — which is the number the arrows ticket owes the ADR.

**It deliberately breaks this page's own invariant** that every variant is built from
the same controls, because it proposes new ones rather than rearranging the shipped
ones. The break is stated in a comment beside `TAB_SETS`, and the fence at the foot of
the page carries what the variant does not model: no fetch, no `Copy` ladder, no
store, no clipboard behind the foot, and presets that live in a variable and do not
survive a reload.

**The three older variants are untouched**, because `tabs2` and `tabs4` are §2.9's
rejected rows and the record's own reason for keeping them is that a choice should be
lookable-at rather than read about. `tabs4` shortened its labels to `🔗 Line` and
`⚙ Look`; the new variant uses the decided ones at full length, so the two can be
switched between at 300px and the fit compared.

**The fence's *"The Cart itself. No drawer…"* line was FIXED the same day.** It had
been false since the bench landed at 1.2.0 — there has been a drawer on this page for
five versions — and it is the fourth thing on this page found wrong by reading rather
than by anything going red.

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

### THE FOURTH DRIFT, 2026-08-27, and it invalidated a measurement

**The rule at the top of this section says keep the chips shape byte-identical to the
script. The FOOT was never covered by it, and the foot had drifted in four values.**

The user read the foot readout back and it said the three arrows cost **0px** and the
drawer's floor does not move. That number was better than the presets record's own
arithmetic predicted, which is the direction that earns a second look — and the second
look found this:

| | script | the rig | effect |
| --- | --- | --- | --- |
| foot padding | `6px 10px` | `6px 8px` | the row was laid out in 4px more width than it has |
| button padding | `3px 8px` | `2px 6px` | each of the six buttons 4px narrower, 2px shorter |
| font-size | `12px` | `11px` | every label ~9% narrower, and **both `11ch` reservations with them** |
| border-radius | `4px` | `3px` | cosmetic |

Six buttons at 4px is 24px before the ~9% on the labels — enough to move where the row
wraps. **The measurement was withdrawn**, all four values are the script's now, and the
**head** (`gap: 8px; padding: 6px 10px`) and the **chips row** (`padding: 6px 10px 0`)
were drifted too and went with them.

**The tab bar was checked in the same pass and is byte-identical** —
`padding: 3px 9px; font-size: 11px` on the button, `gap: 2px` and a 1px bottom border on
the bar — which is why the *"four labels fit at 300px"* answer from the same press
**stands** where the foot's did not. That check is the whole difference between a closed
question and a withdrawn one.

**What cannot be fixed here, and is now in the page's fence:** `ch` is the width of a
`0` in the inherited font family, and this page inherits IBM Plex Sans where the drawer
inherits Jira's stack. `11ch` is the right rule with a slightly wrong ruler.

**And the sketch line is now drawn explicitly**, because it was doing no work: the
head, the chips row and the foot are real and byte-identical, because
`COLLECTION_FIXED_PX` and `MIN_BLOCK` are summed from them. The section headings, the
collection rows and the inside of a chip are sketches — the script's chip is a div
holding two buttons with their own paddings and here it is one span. **Do not measure a
floor off those three.**

### THE FIFTH DRIFT, the same day, and this one was STRUCTURAL

**The `hidden` attribute did nothing on this page.** Reported by the user: *"I can
only see the buttons whenever I select Appearance tab, with the other tabs, the
drawer gets cut vertical, even though I select 1x and 700px."*

`.cart-settings`, `.cart-sections` and `.cart-foot` each set `display: flex`, and an
**author rule on a class beats the browser's own `[hidden] { display: none }`** — so
`hidden = true` set the attribute and changed no paint. All three were laid out at
once: the panel and the sections both asking for `flex: 1`, the foot taking its 66px,
and the panel left with about half the drawer. Short content fit; the field lists were
cut. It read as a tab problem because the tabs are what change the content's height.

**The script has this right and says why**, in seven rules and one comment: *"The
pair. Both selectors name the same two ids, so the one with the attribute is strictly
more specific and the area hides when it is told to."* This page had **none** of them.
It now has the pair, class-plus-attribute at (0,2,0) against the bare class at (0,1,0).

**Three things it also fixes, and the third is the one that matters:**

- the overflow readout was measuring `clientHeight` on a squeezed panel, so its
  numbers were wrong;
- the ⚙-replaces-the-whole-body claim this bench exists to demonstrate was not
  actually being demonstrated;
- **every "does the panel scroll at 300×215 with every group in view" question asked
  of THIS PAGE since 1.2.0 was asked of a panel about half its real size.** The
  shipped script is not affected — it carries the seven rules — so anything verified
  in real Jira stands. What is in doubt is only what was judged by looking at the
  bench.

**What survived the same reading, and why**, because a drift is not a reason to throw
away every number near it:

| Answer from the 2026-08-27 press | Standing |
| --- | --- |
| Four tab labels fit at 300px | **Stands.** The squeeze was vertical — `flex: 1` competition in a column. The bar's width comes from the cart's 300px and was never touched |
| The foot is 2 rows / 66px, and three arrows cost 0px | **Stands.** `measureFoot` returns early on `foot.hidden`, which was true as a *property* whatever the CSS did, so the number was taken with ⚙ off. Row count and the foot's own height follow from the cart's WIDTH, and `flex: none` gives it its content height either way |
| The armed label does not jump the row | **Stands.** Width again |

### And the fix made the bench unhelpful, which was fixed in turn

**The same day, immediately after**: *"now the buttons don't appear at all, regardless
of which settings tab is selected and regardless of the height selected."*

**That is the fix working.** ⚙ replaces the drawer's whole body, the foot included — so
on the settings screen there are no foot buttons to see, at any height. They had looked
otherwise for as long as `hidden` was doing nothing here, and the foot was being painted
underneath the panel.

**But it left the bench worse for the thing being done with it:** the `Arrow` and
`Foot labels` switches are both about the foot, and neither could be seen while the
settings were up. So **both of those switches now close the settings**, and the stage
line says they do. It is the one place on this page where a press moves something other
than the control pressed, and the comment beside it says why.

**The declined alternative was a second copy of the foot outside the drawer**, always
visible. Two copies of the foot is two things that can drift, and this page has now had
five. One foot, and the switches take you to where it is.

> **CONFIRMED AGAINST THE REAL CART the same day, by the user, in one sentence:**
> *"it's different from before, now it matches the actual behaviour of the cart in
> Jira."* That is the half no reading of the CSS could reach. The fifth drift was
> found by reading the stylesheet and fixed on the strength of the script's own
> comment; what this says is that the page now behaves like the thing it is a model
> of, judged by somebody who uses it. **So the bench had been misrepresenting the
> drawer for five versions, and it no longer is.**

> **CONFIRMED FIXED the same day, by the user: "ok, it's working as expected now."**
> Recorded at the precision it has. What that closes is the **layout**: the drawer
> clips, it is a flex column again, and it looks like the card it is meant to be at
> every height. What it does **not** close is the three numbers the same page produced
> earlier that day — they were read off a drawer 300px wide where the real one is 298px
> inside its border, and *it looks right* is not *the number was read again*. Those are
> still owed, and `docs/jira-cart/presets/README.md` says so beside decision 23.

### Running the bench's script in node, which found two things

**Nothing here read an HTML file until 2026-08-27**, and the table above is what that
cost: a `renderStage` that threw on every call, a `render` in a temporal dead zone,
and a shape table with four rows where the script has five. None of the three went
red. `rig-smoke.mjs` now reads both rigs, but **it reads their CSS and their markup,
not their behaviour** — a stylesheet that parses and a class that is painted are what
it can see. Everything below is still the way the page's own JavaScript gets
exercised.

So the 2026-08-27 change was checked by **extracting the bench's script block and
running it in node against a small DOM stub** — a throwaway, not committed and not in
`run.mjs`: load, then switch variant, then press every handler the panel built, one at
a time, re-reading the tree after each press so no stale closure is mistaken for a
defect. `node --check` was **not** enough and could not have been: every one of the
three faults above is syntactically valid.

It found two faults, and **both were in the check rather than in the page** — which is
worth recording, because that is the usual result and it is not a reason to skip the
run:

| What went wrong | Where |
| --- | --- |
| The stub stored `textContent = ""` as a string instead of clearing the children, so the panel's tree grew on every render and node ran out of heap. The symptom read as a leak in the page | the stub |
| The structural assertion pressed nothing first, so it measured the **`Appearance`** tab — which is `tabs[0]` and where the panel opens — and reported its two dropdowns and its checkbox as the preset block. **The counts looked plausible**, which is the whole hazard | the check |

A second assertion matched the star note by its **leading ★** and found an `<option>`
in the picker, whose text also starts with one — a check that passed on the wrong node.
It matches on the class now.

What the run does say: nothing throws at load or on any press, and a fresh presets
panel on the 📋 Details tab draws four tabs, two dropdowns, nine buttons, nine inputs
and its star note. What it does not say is anything about **layout**, which is the
whole reason the ticket ends in a browser.

### Verifying the chips, which is the rule this page lives under

`run.mjs` still cannot do it, and the reason has changed. It used to be that nothing
here read an HTML file at all; since 2026-08-27 `rig-smoke.mjs` does, but comparing
**emitted bytes** would mean running the page's own `buildChips` against the script's
`formatDetails`, which needs both of them executing rather than being read. So it
remains a **diff run by hand, and ticket 06 required it rather than assuming it**:
emit one collection from each, on all five shapes in both flavours, and require every
byte to match. Run it after touching either. **It was run at 1.2.0 and it is
byte-identical.**

**What `rig-smoke` DOES cover of this page's fidelity** is the CSS half, which is the
half that had drifted twice: the foot, the head, the chips row and the tab bar are
compared property by property against the script's own rules, sliced out of `src/`.
That is the fourth drift closed by a check rather than by a comment.

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

**THIS SENTENCE USED TO SAY "NOTHING HERE CAN DRIVE A DRAG", AND 1.4.0 DISPROVED
IT.** It is left in that form because the correction is the useful part. The claim
rested on `boot-smoke` having no layout — true — and on that being enough to make a
drag undrivable, which it never was. `dragstart`, `dragover` and `drop` read two
things: the element they were dispatched on, and a rect. This harness keeps the
delegated listeners the script registers, and it already stubbed a rect on one node
for the 1.3.0 rail. So the collection's drag (ADR §2.9.1) is driven here end to end —
grab, hover a NAMED HALF of a named row, drop, release — and seven deliberate defects
were reintroduced one at a time to prove those checks can fail.

**1.6.0 drove the OTHER DIRECTION, and it added the one thing the 1.4.0 stub could not
do: it can be REFUSED.** A drop that comes into the Cart (ADR §2.9.3) may be accepted
or turned away, and the difference is whether the handler calls `preventDefault` — so
the stub's `dataTransfer` gained `types` and `getData`, and the helper that dispatches a
`dragover` **returns whether it was accepted**. That makes every refusal a positive
assertion instead of an absence: a collection dropped on a chip, a payload with no
url-list, a foreign origin and a read-only store are each checked to be *refused*,
rather than merely observed to have written nothing.

**What is still true, stated at the width it is actually true at:**

- **The FIELD lists' drag is driven by nothing**, because it was not retro-fitted —
  a scope decision on 2026-08-25, not a limitation. `moveInList` is a pure function
  `smoke.mjs` drives directly, and the panel's rows, their ticks, the writes they make
  and the stored order the panel draws are all in `boot-smoke`. ADR §7 step 31 is the
  browser step for the rest.
- **No harness can say whether a row is comfortable to GRAB**, or whether a long list
  auto-scrolls when a drag reaches its edge. There is no pointer here and no paint.
  That is ADR §7 step 39, and it is the honest residue.
- **A refusal that is the platform's own has nothing in the file to assert about** —
  the field lists' cross-list refusal, and a row dragged at the live list, both stand
  because `dragover` declines to call `preventDefault`. A harness can only see the
  code that is not written.

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
- **NO POINTER, SO NO GRIP AND NO DIVIDER — but the two HTML5 drags are a different
  case, and this bullet said otherwise until 1.4.0.** The grip and the divider are
  pointer plumbing and need real layout; nothing here can pull them. The field lists'
  reorder and the collection's are HTML5 drag and drop, which reads an element and a
  rect and nothing else — so `boot-smoke` drives the collection's one in full (§2.9.1)
  and could drive the field lists' too, which was scoped out rather than ruled out.
  What stands in for the field lists' is `moveInList` being a pure function
  `smoke.mjs` drives directly, plus §7 step 31 in a browser. **A green run still says
  nothing about whether a row is comfortable to grab, or whether a fifty-row list
  scrolls at its edge** — §7 step 39.
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
| **04, the field lists** | `moveInList`'s middle case, its out-of-range refusal, and that it returns a **copy** rather than splicing its argument; the tail prints in stored order; an unticked field does not print; the selection reaches only its own export; the fields are read at render and never at fetch | `smoke` for the first three since 1.4.0, otherwise `format-smoke`, four also `boot-smoke`, one also `tabs-smoke` |
| **the collection's drag (1.4.0)** | the key link is left natively draggable; the freeze is removed; the drop forgets which half of the row it was in; the drop writes the frozen view instead of re-reading; the grip is conjured rather than reserved; the dragged row's ground is not repeated with `:hover`; the shared row rule loses its transparent border | `boot-smoke` for the first four, `css-smoke` for the last three — **run 2026-08-25, all seven caught** |
| **the drag OUT (1.4.0)** | the drag carries nothing but the internal type; `effectAllowed` goes back to move-only; the text is a bare URL instead of the `Issue reference` shape; the rich flavour is dropped; the `text/uri-list` is dropped; the summary is left out of the payload; the freeze is never lifted after a release | `boot-smoke` — **run 2026-08-25, all seven caught.** The last one is worth knowing about: it goes red two sections later, at *letting go is what redraws it*, rather than where the defect is |
| **05, the bands** | the two may not name one field; the swap moves the other dropdown to what this one held; the status categories come out in Atlassian's order and not alphabetically; the default pair is priority then team | `format-smoke` and `boot-smoke`, one also `tabs-smoke` |
| **the stylesheet** | the ⚙'s state paint survives a hover | `boot-smoke`, `format-smoke` |

### The 1.7.0 presets store, and the check that could not fail

Ticket 02 asked for **at least one new rule proven able to fail**, and named the
**one-★ invariant** as the one to prove, because every screen after it assumes a
plain press has exactly one answer. **Eight mutations, run 2026-08-28, and 0
survived**, each a single edit to a scratch copy of `src/jira-cart.user.js`:

| The rule broken | Checks that went red |
| --- | --- |
| `oneStar` stops repairing at all | 8, including the write path's |
| a truthy `star` counts as a star | 1 — *a star that is not a boolean is not a star* |
| ★ falls to the first by POSITION rather than by name | 7 |
| `byName` falls back to `<`, so capitals sort first | 1 |
| a nameless preset is invented a name rather than dropped | 5 |
| names are no longer made unique inside a list | 1 |
| the presets path copies the band pair rule instead of calling `resolveBands` | 6 |
| the writer stops re-reading before it writes | 1 — the stale tab |

**A ninth mutation was run and did NOT go red, and it is recorded rather than
quietly dropped.** `PRESET_LISTS` is `SETTINGS_TABS.filter((tab) => tab.fields)` —
a tab has presets exactly when it has a field list. Changing that filter to
`tab.exports` changed nothing, because **every tab carrying `exports` also carries
`fields` today**, so the two predicates pick the same two tabs. They diverge the
moment ticket 03 adds the 🔗 Links tab: `exports: true`, no field list, and no
presets (decision 4). What catches it then is the neighbouring check, which pins the
literal pair `["details", "report"]` — so the guard exists, it just cannot fire until
that tab does. The comment in `store-smoke` §18 says so at the check.

**And one mutation survived, which is the finding worth keeping.** The comparator was
written `a.name.toLowerCase().localeCompare(b.name.toLowerCase())` and checked with
*first by name is case-insensitive*. Making the comparator case-**sensitive** changed
no answer and the harness stayed green — because `localeCompare` already orders by
letter first and treats case as a tie-break, so the `toLowerCase` was dead code and
the check was asserting a property that could not be false.

This is `css-smoke`'s first backtick check again, and the fix was the same shape: find
what the code actually decides. What `byName` really chooses is `localeCompare` over
`<` — `<` compares code units, so `Zebra` would sort before `apple` and the picker
would look broken. The `toLowerCase` is gone, the comment says why it went, and the
check now names that. **It fails when the comparator does**, which the eighth mutation
above confirms.

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

### The 1.6.0 run — adding by drop

**14 mutations, and 0 survived**, over the 96 checks the feature added (ADR §2.9.3).
Same method: one edit at a time in a scratch copy of the script, run, restore. **Three
runs, and the last two were driven by real reports rather than by reading**: a second on
2026-08-26 after the user asked why a refused drag showed no cursor, which found a defect;
and a third after probe C.6, which found a gap.

| Area | Mutation | Caught by |
| --- | --- | --- |
| **the move** | the filing drop never removes from the source, so a move is silently a copy | `boot-smoke` (8) |
| **the marker** | the collection type is no longer refused, so a chip dropped on a chip MERGES two collections | `boot-smoke` (3) |
| **the origin** | the same-origin rule is dropped, so another instance's URL is stored as a key of this one | `smoke` (2), `boot-smoke` (1) |
| **the gap** | the item list ignores where the pointer was and always appends | `boot-smoke` (3) |
| **the modifier** | Ctrl is ignored, so the copy the user asked for is a move | `boot-smoke` (2) |
| **the lock** | a read-only store is offered the drop, so the cursor promises a write that `update` then declines | `boot-smoke` (1) |
| **the refusal is not a write** | the item list consumes a drop it refused; the chip does the same. **`drop` does not only fire because we accepted** — `dragover` bubbles, so an ancestor can allow it, and Jira's own board drag-and-drop listens above the drawer (ADR risk 22) | `boot-smoke` (5, then 3) |
| **the page is not the store** | a live-list row reads the STORE instead of the page. **The two drags differ in exactly this**, and until probe C.6 read a real drop's `text/plain` nothing here checked it: the harness asserted only the `text/uri-list`, which is the one type that cannot be wrong because `issueUrl` builds it | `boot-smoke` (2) |
| **the stylesheet** | the chip's ring becomes a border colour, so three states fight over one edge; the live grip switches to `display`, so the summary re-ellipsises under the hand; `user-select` comes off a live row, so the browser drags the text selection; the empty list's outline offset goes positive, so it draws where the parent clips; the ring moves after the armed rule, so a chip armed for **deletion** repaints as a drop target | `css-smoke` (1 each) |

**The first two are the ones worth having.** A move that quietly copies leaves
`Scratch` full and looks like the feature working; a merge that happens by accident is
irreversible and was never asked for. Both are wrong in a direction nobody would think
to check by hand, which is what these two checks are for.

**The stylesheet's five are why `css-smoke` exists, and the last one is the clearest.**
Move the drop ring below the armed rule and every property on the page is still
correct — the ring is an `outline`, the armed state is a `background`, they share
nothing, so nothing visibly breaks *today*. What breaks is the day either rule gains a
declaration the other has, and by then the ordering will read as arbitrary. The check
holds the ordering rather than the symptom.

**A fifteenth edit survived, and it was a bad mutation.** Adding a CSS comment changes no
byte of behaviour, so nothing should have gone red and nothing did — the same trap the
1.2.0 run below records twice. Read the diff before believing a survivor.

**What this run does not say** is the same thing every run above does not say: nothing
was dragged by a hand. **The one claim with no check anywhere is whether an issue link
can be dragged off a Jira backlog or board at all** — Jira runs its own drag over those
cards. That is ADR risk 21 and §7 step 41's first item, and no stub can reach it.

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

## `drag-test.html` — the second page that is not a harness. Added 1.5.0

Open it in a browser. It answers the questions the **collection drag out** (ADR
§2.9.2) rests on, and not one of them is reachable from Node: they are all about what
the **browser's own furniture** does with a drag — the tab strip, the bookmarks bar, a
tab group — and about what Teams, Notepad and Jira's editor accept.

Five draggable boxes set five different payloads for the same four issues, so any
difference in behaviour can be pinned to one change: the shipping payload; the same
with bare URLs as plain text; the URL list alone; LF instead of CRLF; and one URL as
a control. A sink on the page reads every type back out, so a payload can be checked
*inside* the browser before any conclusion is drawn about what a drop target did with
it.

**What it found, in one session on 2026-08-26** — the full readings are ADR appendix
A.10:

| It works | It does not |
| --- | --- |
| Tab strip: **one tab per issue** | Bookmarks bar: **one** unnamed bookmark, the **first** URL only |
| A tab group you made: all tabs join it | A bookmarks folder or a tab group **cannot be created** by a drop from any web page |
| Teams: the `<ul>` as live links | |
| Notepad: the markdown list | |
| A Jira comment or description: the link | |

**Three of those changed the design and two corrected the ADR.** The bookmarks half of
the feature was dropped. §2.9.1's claim that a mis-drop *navigates the tab* was found
wrong — a new tab opens instead — and a document-level handler that would have
swallowed drops on the Jira page was designed, chosen, and then not built, because the
same session found that dragging a row into a Jira comment box **works today**.

**It is committed for `paste-test.html`'s reason.** Rebuilding it is the expensive
part, and the next question about a drop target will be answered the same way. It also
carries the one mechanism check worth keeping even though nothing now uses it:
`dataTransfer.types` **is** readable during `dragover` while `getData` returns `""`,
so a handler that has to recognise our own drag mid-drag needs no module flag and
cannot get stuck armed.

**Keep its fence honest.** The header lists what the page deliberately does *not*
carry. Box A carries an internal marker type that nothing in the script sets any
more — it is there only to exercise the `types` check above, and the fence says so.
`run.mjs` does not pick this file up; it globs `*-smoke.mjs`.
