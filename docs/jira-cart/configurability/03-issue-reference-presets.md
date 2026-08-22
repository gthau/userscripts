# 03 — One head, four shapes, both flavours

**Lands the shared line-shape preset.** One setting decides how an issue is
referenced in 🔗 Links, 📋 Details and 📊 Report. Named presets whose bytes live in
the script — no template, no parser.

**Needs 01.** It reads `lineShape`. Independent of 02, 04 and 05.

**Read first:** ADR **§2.8** in full — it is the section this ticket reopens — its
two amendments, **§4**'s rows for *"Bare URLs, one per line"* and
*"`[KEY] Summary — URL`"*, **§2.14**'s paragraph *"The head of each line **is**
§2.8's Links line, unchanged"*, and **appendix A.9**. Then
[the decision record](README.md).

---

## THIS TICKET IS BLOCKED UNTIL YOU HAVE PASTED

**Do not start from the argument. The argument is a hypothesis and the paste is the
experiment** — 1.1.0 had four decisions written into the ADR and reversed by
pasting, and two more reversed by pressing a button. All six came back within
hours.

Open the prototype:
<https://claude.ai/code/artifact/bd8a1916-a814-472d-9a06-f801c0ba144e>, unfold
**What these settings emit**, and use the real clipboard button on each of the
three exports, for each shape. Paste into **Outlook** with *keep source
formatting* and into **Teams** in both skins.

Three questions only a paste can answer:

1. **Does a visible URL survive both, and does the line still read?** The plain
   shapes make the URL the anchor's own visible label, so the choice takes effect
   whichever flavour the destination takes. Nobody has pasted one.
2. **THE EM DASH COLLISION.** §2.8 invented the em dash because *"a summary can
   contain dashes"*. `RDC-1513`'s real summary contains ` - ` itself, so a plain
   shape's URL separator is the summary's own punctuation, and the em dash then
   lands after a 45-character URL:
   ```
   - RDC-1513: Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts - https://dalet.atlassian.net/browse/RDC-1513 — Story · Dev Resolved
   ```
   That is exactly the defect the em dash exists to prevent, reintroduced by the
   preset. **Possible outcomes, all legitimate:** a different separator before the
   URL; the plain shapes available on 🔗 Links only and not on the two that carry a
   field tail; or the collision accepted and recorded. Do not guess.
3. **Which shapes are worth shipping.** The prototype offers four. The expectation
   is that `Markdown link on the key` and `Key, summary, then the URL` earn their
   place and that `Key and URL, no summary` and `URL only` are switches nobody
   flips — but §4 already rejected two shapes on reasoning and one of those
   rejections has now been overturned, so **let the paste decide and record the
   count you land on.**

Write what you find into **appendix A.9** as a dated run, in its own subsection.
That appendix is the irreplaceable part of this repository.

---

## What to build

A `SHAPES` table beside `EXPORTS`, each entry carrying an id, a label, a `text(item)`
and an `html(item, bold)`.

```js
const SHAPES = [
  { id: "markdown", label: "Markdown link on the key", text: …, html: … },
  …
];
```

**Every shape defines both flavours** (decision 6). A shape that changed only
`text/plain` would silently do nothing in Outlook, Word, Teams and Confluence,
which all take the HTML — a setting that quietly fails to apply, which is §2.14's
warning about silent settings running backwards.

**One setting, three consumers** (decision 5). `formatLinks`, `formatDetails` and
`formatReport` all build their head from it, so §2.14's promise stays true. A
per-export override is **deferred to §6** and costs one nullable key per export;
do not build it.

### Correct §2.14 while you are here

**The claim that Details' head is §2.8's Links line "unchanged" is false on the
HTML side.** `formatDetails` writes `<a … style="font-weight:600">` on the key and
`formatLinks` writes a bare `<a>`. The text sides are byte-identical; the HTML
sides are not, and have not been since 📋 Details shipped.

That is why the `html` signature above takes a `bold` flag. **Fix the claim in the
ADR** — amend in place, dated, keeping the original sentence — and decide
explicitly whether the two heads should now converge or stay different. Either is
defensible; leaving the document wrong is not.

### The separator goes with its value

Every shape must honour §2.8's rule that an absent value takes its separator with
it. `GLX-402` has no summary, so `Key, summary, then the URL` must not emit
`GLX-402: - https://…`. The prototype's shapes get this right; copy the structure,
not just the strings.

---

## What to test, in `format-smoke.mjs`

**Byte for byte, and slice the shape table out of the source rather than copying
it** — the same discipline `format-smoke` already applies to the palette.

For every shape:

- 🔗 Links, 📋 Details and 📊 Report, `text/plain` and `text/html`
- an item **with** a summary and an item **with none** — the separator drops with
  the value in both flavours
- `LIST_ITEM_STYLE` still on every `<li>`, in every shape, in both formats. There
  is a check asserting Links and Details share the constant; it must still pass
- **the five paste rules still hold on every new byte string**: no `font-size` at
  all, no `opacity`, no inline `border`, no separator that is a box, and no colour
  the palette does not name
- the default shape reproduces **1.1.0's output exactly**. If any existing
  assertion has to change, the change is a defect until proven otherwise

---

## Done when

- Every shipped shape is asserted byte for byte in both flavours, for all three
  exports, with and without a summary.
- **One new rule confirmed able to fail** by reintroducing the fault in a scratch
  copy — add `font-size:88%` to a shape's HTML and watch rule 5 go red.
- **§2.8 amended in place**, dated: its four formats now share a configurable head.
  Its *"There is no template seam"* paragraph is **UPHELD and its reason restated** —
  a preset list is not a template, and `detailChip` keeps its enforcement point.
  Do not delete that paragraph; it is the reason this ticket is presets and not a
  parser.
- **§4's `[KEY] Summary — URL` row overturned**, dated, with the paste target
  named: a destination that does not render markdown. Keep the original row's text
  and its reasoning above the amendment.
- **§2.14's head claim corrected**, dated.
- **A.9 gains a dated run** with what Outlook and Teams did to a visible URL, and
  the verdict on the em dash.
- The prototype's shape table and the script's agree. If they have diverged, the
  prototype is the thing that is wrong — but say so in `test/jira-cart/README.md`.
