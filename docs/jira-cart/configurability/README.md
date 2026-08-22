# Configurable exports — the decision record and the six tickets

> **This directory is LIVE.** Everything else in `docs/jira-cart/` is the frozen
> working record of the map effort. The parent
> [`prompts-configurability.md`](../prompts-configurability.md) is the prompt that
> produced this; it has now been run, and this is its outcome.
>
> The ADR, [`src/jira-cart.user.md`](../../../src/jira-cart.user.md), remains the
> decision of record. Nothing here overrides it. Each ticket says which ADR
> sections it must amend, **in place, with its date, keeping the original
> reasoning** — §2.8 carries two such amendments and they are the model.

Settled by grilling on 2026-08-21 and 2026-08-22, and by a prototype
(`test/jira-cart/config-prototype.html`) that overruled the first UI design twice.

---

## The decision, in one paragraph

The exports become configurable **without a template**. §2.8's finding is UPHELD,
and its reason restated: a template means user-written styling reaching the
clipboard, and the five measured paste rules then have no enforcement point. What
ships instead is a **filter over a fixed renderer** — named presets for the issue
reference, two ordered field lists, and two grouping dropdowns. `detailChip` stays
the one place styling is written, and no preference can reach it.

## The 23 decisions

**Shape**

1. All three exports in scope: 🔗 Links' line, 📋 Details' fields, 📊 Report's
   grouping. They are not one feature.
2. **No template.** Considered seriously, and declined. The user leaned toward real
   markdown and HTML templates and withdrew it in favour of "something
   user-friendly" once the enforcement problem was on the table.
3. **Two mechanisms, because the needs differ in kind.** The issue reference wants
   NAMED PRESETS — punctuation and where the URL sits are not expressible by
   toggles. The field tail wants an ORDERED TOGGLE LIST.
4. §4's rejection of `[KEY] Summary — URL` is **OVERTURNED**. Its ground was "its
   only distinct paste target cannot be named". The user named it: a destination
   that does not render markdown.
5. **One line-shape preference, shared by all three exports**, so §2.14's "the head
   IS §2.8's Links line" stays true. A per-export override is DEFERRED to §6 and
   costs one nullable key per export.
6. **Each preset defines BOTH flavours.** A preset that changed only `text/plain`
   would silently do nothing in Outlook, Word, Teams and Confluence.

**Fields**

7. **Two field lists**, one for 📋 Details and one for 📊 Report. Bite 5 asks what
   stops them drifting; the answer is **ONE CATALOGUE, TWO SELECTIONS** — the field
   ids, their labels and every measured style live in `detailBits`/`detailChip`
   once, and a preference can only say which of them a document uses and in what
   order.
8. **A ticked field is displayed, band or not.** The shipped defaults leave the
   banded fields unticked, so 1.1.0's output is unchanged byte for byte. This
   replaces the hardcoded `detailBits(item, ["priority"])`.
9. **Zero fields is allowed**: the line is the head alone, no em dash. It needs no
   new code — the renderer already does this for an issue Jira returned nothing
   about. Cost accepted: 📋 Details configured this way emits 🔗 Links' bytes.
10. **`team` becomes a row field.** Today it is fetched only for the report's
    headings, and 📋 Details has no headings, so the field is unreachable. Off by
    default.
11. **Reorder by DRAG.** Chosen against the recommendation of ↑↓ buttons, after the
    cost was stated: no harness in this repo can drive a drag, because `boot-smoke`
    has no layout. Mitigations are mandatory — see ticket 04.

**The report**

12. **Two dropdowns over seven bandable fields**: priority, team, status category,
    assignee, type, fix version, parent. Band 1 must be a field; only band 2 may be
    `None`. A report with no bands is 📋 Details.
13. **Status bands by CATEGORY, never by name.** `item.category` is already fetched.
    A three-entry rank is justified because the three are Atlassian's own
    vocabulary, not this instance's wording — which is exactly why §2.15 refused a
    rank for priority, whose names already sort right.
14. **Time remaining may not band.** Its band order would be string order over
    durations: `"10m" < "2d" < "9h"` means nothing.
15. **Fix version MAY band, and an issue in two releases appears in both.** Stated
    exception: with a multi-valued band a paste has one line per issue-and-band, so
    *lines equals items* is not the check there. §2.14's "no format ever drops an
    item" still holds — nothing vanishes, something repeats.

**The ⚙ screen** — forced by measurement, not preference: ~22 controls in a drawer
that can be 300×215px, where every container is `overflow: clip`, so anything that
overflows is silently gone.

16. **⚙ is a STATE BUTTON**, on `aria-pressed`, styled with the Cart's existing
    `--gt-cart-selected-bg` / `--gt-cart-selected-text` — the same pair `jira-ux`'s
    locked padlock and the Cart's own active collection chip already use.
17. **⚙ replaces the whole drawer body**: the two sections AND the six-button foot.
    One boolean moves all three, so the button's colour cannot disagree with what is
    on screen. ✕ keeps one meaning on both screens: close the drawer.
18. **The panel is TABS.** Three layouts were prototyped — one long scroll,
    collapsible groups, sub-tabs. Collapsible was chosen and then reversed by use;
    tabs won. **How many tabs is still open** — see below.
19. **The last tab is a stored preference.** Precedent: §2.9 stored whether the
    drawer is open, reversed from in-memory after use, because "a reload is not the
    end of a sitting".
20. **An unrecognised tab id falls back to the first tab**, never a blank screen —
    exactly what `layout` and `corner` already do. Tabs need no open/closed set: a
    tab bar shows every tab whether it has ever been pressed or not, so a new tab is
    visible the moment it exists.
21. **A NEW FIELD arrives OFF; a NEW TAB arrives VISIBLE.** These differ on purpose.
    A tab appearing changes nothing about what a button emits. A field appearing
    ticked would change what a button produces without being asked, which is what
    §2.8 and §2.14 both warn against.
22. **`Restore export defaults` reaches the export settings only** — line shape,
    both field lists, both bands. Not the appearance switches, and not which tab you
    are on. Confirms in place (`Restore?`) by §3's `⌫`/`Empty 3?` convention.
23. **An empty stored list is honoured**, not replaced by a default. It is a state
    somebody clicked their way to.

**Settled by fact rather than by asking**

- **The fetch stays all nine fields.** `DETAIL_FIELDS` is unchanged. Three things
  follow: it cannot fall out of step with a preference; changing a preference does
  NOT invalidate a held fetch, because the held rows carry every field; and §2.14's
  "nothing fetched is ever stored" is untouched. The selection is applied at
  RENDER, never at fetch. That also answers cross-tab: another tab changing a field
  list re-renders this one and the armed button stays armed.
- **1.2.0.** The collections blob's `v` is NOT bumped — no stored item shape
  changes, and preferences are not versioned.

---

## Still open, and which ticket each one gates

| Open question | Gates | How it gets answered |
| --- | --- | --- |
| Two, three or four tabs | 02 | Press the prototype. Recommendation in the ticket |
| Which line shapes ship | 03 | Paste into Outlook and Teams |
| Does a visible URL survive Outlook and Teams | 03 | Paste. Never reason about it (A.9) |
| The em dash collision | 03 | Paste. See the warning below |
| Is the drag usable at 300px | 04 | Press the prototype at `Width → 300 min` |
| Does the head read `⚙ Settings` while the panel is up | 02 | One line either way. Your call |

**The em dash collision, because it is the sharpest thing the prototype found.**
§2.8 invented the em dash because *"a summary can contain dashes"*. `RDC-1513`'s
real summary contains ` - ` itself, so a plain-URL preset uses the summary's own
punctuation as its URL separator, and then the em dash lands after a 45-character
URL:

```
- RDC-1513: Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts - https://dalet.atlassian.net/browse/RDC-1513 — Story · Dev Resolved
```

That is precisely the defect the em dash exists to prevent, reintroduced by the
preset. It may mean the plain shapes need a different separator, or that they are
unavailable on 📋 Details and 📊 Report. **Paste it before deciding.**

---

## Two ADR corrections the prototype forced out

Neither is caused by this effort. Both are wrong in the shipped document and must
be fixed by whichever ticket touches that section.

1. **§2.14 claims Details' head "is §2.8's Links line, unchanged".** True of
   `text/plain` only. On the HTML side `formatDetails` puts `font-weight:600` on the
   key's anchor and `formatLinks` does not. Ticket 03.
2. **`formatReport`'s docblock still says one press arms both stepped buttons.**
   §2.15 reversed that on 2026-08-21 and the comment never caught up. Ticket 05.

---

## The six tickets, and what blocks what

```
01 preferences ──┬── 02 settings screen
                 ├── 03 issue reference presets ──┐
                 ├── 04 field lists ──────────────┼── 06 record and ship
                 └── 05 report bands ─────────────┘
```

| # | Ticket | What it lands |
| --- | --- | --- |
| [01](01-preferences.md) | The preferences exist before anything reads them | New keys, range-checked, `store-smoke`. No visible change |
| [02](02-settings-screen.md) | ⚙ is a screen, not a strip | The mode, the state button, the tabs, the restore |
| [03](03-issue-reference-presets.md) | One head, four shapes, both flavours | The shared line-shape preset |
| [04](04-field-lists.md) | Two selections over one catalogue | The two field lists and the drag |
| [05](05-report-bands.md) | Seven bands, and one of them repeats an issue | Generalised grouping |
| [06](06-record-and-ship.md) | The version, the rig and the record | 1.2.0, the rig, the docs |

**01 must land first.** 02, 03, 04 and 05 are independent of each other once it
has: each reads its own preference and touches its own renderer. 06 is last
because it records what the others decided.

**Take them one per session.** Each ticket file is the session prompt. Read the ADR
sections it names before anything else.
