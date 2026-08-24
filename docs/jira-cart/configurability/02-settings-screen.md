# 02 — ⚙ is a screen, not a strip

**Lands the settings screen with nothing on it yet.** The mode, the state button,
the tab bar, the remembered tab, the restore control. The tabs can hold the three
appearance switches that already exist; tickets 03, 04 and 05 fill the rest.

**Needs 01.** It reads `settingsTab`.

**Read first:** ADR **§2.9** (the drawer and its two sections), **§2.11 rule 1**
(one scroller per section), **§2.3** (scanning is not an action — the *"there is no
third drawer mode"* sentence), **§3** (the `⌫` → `Empty 3?` convention), and
**§2.14**'s paragraph on the foot's reserved label ladder. In the code: the drawer
builder around `src/jira-cart.user.js:3130-3330`, `renderFoot` at 4229, the prefs
render at 3888, and the stylesheet from 4740.

**Prototype:** `test/jira-cart/config-prototype.html`, published at
<https://claude.ai/code/artifact/bd8a1916-a814-472d-9a06-f801c0ba144e>. It is a
working model of everything below. Its chrome is approximate; its behaviour is not.

---

## Answer this before you write anything

**How many tabs?** Three structures are in the prototype on the `Tabs` switch.
Press all three at `Width → 300 min` and `Height → 215 min` and pick one.

| | Tabs | Where `Issue reference` goes |
| --- | --- | --- |
| Two | Appearance · Exports | Inside Exports, above two long field lists |
| **Three** | Appearance · 📋 Details · 📊 Report | **Pinned above the tab bar** |
| Four | 🔗 Line · 📋 Details · 📊 Report · ⚙ Look | Its own tab |

**Recommendation: three.** It is the only structure where the shared setting is not
misfiled — `Issue reference` governs all three exports, so a tab that owns it tells
a small lie about its scope. It also leaves each export tab at about eight rows,
which is the only one of the three that fits the minimum drawer height without
scrolling. The cost is real and worth stating in the ADR: *Appearance* sits as a
peer of two export tabs, which is not a clean taxonomy.

**Second question — ANSWERED on 2026-08-24, by the user: the head reads
`⚙ Settings`.** The original question and both sides are kept because the reasoning
is still what records the cost: the repo's convention is that the label IS the state
(§2.14, §3), which is what won; against it was that the head is the drawer's
identity, and `jira-ux`'s toolbar does not rename itself when the padlock is on. So
while the panel is up the drawer stops naming the collection you are collecting into
— **the badge still does**, which is what makes the cost acceptable. The prototype
leaves the head unchanged and is now wrong about this; say so if you touch it.

---

## What to build

### The mode

**⚙ replaces the whole drawer body: the two standing sections AND the foot.**
Decision 17. One boolean drives all three, so the button's state cannot disagree
with what is on screen.

Why the foot goes too: six buttons and a border is about 40px, a fifth of the
drawer at `MIN_BLOCK`, and none of them can act on anything while ⚙ is up. The
cost is that checking a setting means one press to go back — accepted for the room.

**COLLECTING FROM THE PAGE KEEPS WORKING WHILE ⚙ IS UP.** Decision 25, added by the
user on 2026-08-24, and it is a constraint rather than a question: ⚙ replaces the
inside of the DRAWER, and the floating `+` beside a hovered issue link is a different
element on the page. `renderToggle` reads only the hovered anchor and the active
collection, so the gesture, the badge count, the right-click entry and the page
decoration all keep working with nothing added. Two consequences, both of which need
a check rather than a reading:

1. **An add while ⚙ is up must not close the panel.** Every add calls `render`, so
   the panel has to be a pure function of the in-memory `prefsOpen` flag — exactly
   as below. That is what the check proves.
2. **An add re-renders the drawer under whatever is on screen**, in this tab or
   another. Harmless for a tab bar and a row of checkboxes; not harmless for ticket
   04's drag, which is why it is written down here as well as there.

What is NOT available while ⚙ is up, stated so it reads as the accepted cost of
decision 17 rather than as a defect: the live list, the collection list and all six
foot buttons. An item added from the page while the panel is up lands, and you see
it in the badge rather than in the drawer.

**`prefsOpen` stays in memory.** It is not a stored preference, and that is
deliberate against §2.9's precedent for the drawer's own `open`: a reload landing
you in Settings would be wrong, because Settings is not where you work. Say so in
a comment, or a later session will "fix" the inconsistency.

### The state button

**⚙ carries its state on `aria-pressed`, styled with
`--gt-cart-selected-bg` / `--gt-cart-selected-text`.** Those two tokens already
exist at `src/jira-cart.user.js:4528`. The same pair dresses `jira-ux`'s locked
padlock (`jira-ux-improvements.user.js:1255`) and the Cart's own **active
collection chip** (`src/jira-cart.user.js:5297`), which also adds
`border-color` and `font-weight: 600`. Match the chip — three declarations, not a
new blue.

`aria-pressed` and not `aria-expanded`: this is a mode toggle, not a disclosure.
The panel it controls is no longer a region beside the content; it *is* the
content. Drop the existing `aria-controls`.

**✕ keeps exactly one meaning on both screens: close the drawer.** A ✕ that
sometimes goes back instead is the two-values-that-disagree bug wearing a different
hat, and it would leave no way to close the Cart from the settings screen.

### The scroller

**The settings panel becomes the drawer's one scroller while it is up:**
`flex: 1; min-block-size: 0; overflow: hidden auto`. §2.11 rule 1 then holds
exactly as written — one scroller, a different occupant — and the drawer itself
stays `overflow: clip`, **not `hidden`**, for the reason §2.11 gives: `hidden` is
still programmatically scrollable, and `scrollIntoView` once slid a heading out of
sight. There is no `scrollIntoView` anywhere in the file. Keep it that way.

This is the whole reason ⚙ is a screen. It was measured, not preferred: about 22
controls in a drawer that can be 300×215px, where every container is
`overflow: clip`, so a panel sharing the box with the sections would be **silently
truncated with no scrollbar**. The prototype prints the arithmetic under the
drawer; reproduce it once by hand so you have seen it.

### The tabs

- The tab bar is `role="tablist"`, each tab `role="tab"` with `aria-selected`.
- **A group heading appears only when a tab holds more than one group.** Where a tab
  is exactly one group the heading repeats the tab label immediately below it.
- **The last tab is stored** (decision 19), and an unrecognised id falls back to the
  first — never a blank screen (decision 20). 01 built that check.
- **Tabs need no open/closed set.** A tab bar shows every tab whether it has been
  pressed or not, so a tab added later is visible the moment it exists.

### Restore export defaults

- **Export settings only**: line shape, both field lists, both bands. Not the
  appearance switches — a dragged size is only recoverable by dragging the grip
  again (risk 10) — and not the current tab.
- **Confirms in place**, `↺ Restore export defaults` → `Restore?`, by §3's
  convention. It writes nothing on the first press.
- **Shows on tabs that hold export settings and nowhere else.** On the appearance
  tab it is an offer to reset something you are not looking at.
- It is derived inside `render` like every other label (§2.8), so the armed state
  cannot outlive a re-render it should have cleared.

---

## What to test

**`boot-smoke.mjs`** — real clicks through the delegated listeners:

- pressing ⚙ hides the sections **and** the foot, and `aria-pressed` becomes `true`
- pressing it again brings both back
- ✕ closes the drawer from either screen
- the head reads `⚙ Settings` while the panel is up, and the collection's name and
  count again once it is down
- **an add from the page while ⚙ is up lands in the active collection, updates the
  badge, and leaves the panel open on the same tab** (decision 25). `boot-smoke`
  already drives the floating toggle through its real listeners, so this is a click
  it can make
- a value-change event from another tab while ⚙ is up does the same
- switching tab writes `settingsTab` and a fresh boot lands on it
- a stored `settingsTab` this build does not know → the first tab, and the panel is
  not empty
- the restore takes two presses, and one press writes nothing
- the restore does not change `settingsTab`, `corner`, `layout` or `rightClickMenu`
- a re-render between the two presses disarms the restore (the `flash` ordering
  rule from §2.14: a render after a flash wipes it)

**`css-smoke.mjs`** — it parses the sheet and computes specificity, which is the
only way to see these:

- the settings panel is the only rule with `overflow: hidden auto`
- the drawer is still `overflow: clip`
- the `[aria-pressed="true"]` rule is more specific than the base `.cart-btn` rule,
  so the state actually paints. §2.11's own hidden/`[hidden]` pair is the precedent
  and the reason this check exists.

---

## Done when

- `node test/jira-cart/run.mjs` green, counts updated in `test/jira-cart/README.md`.
- **One new check confirmed able to fail** by reintroducing the fault in a scratch
  copy — the specificity one is the best candidate, because it is invisible to
  JavaScript.
- **§2.9 gains a paragraph**: ⚙ is a **mode over** the two standing sections, not a
  third section, so *"there are exactly two standing sections"* stands. Say the
  foot goes with them and why. Amend in place, dated.
- **§2.11 rule 1 restated**, not rewritten: still one scroller, and while ⚙ is up
  the panel is it.
- **§4 gains the rejected alternatives**: a panel sharing the box with the sections
  (silently truncated, measured); a drawer that grows when ⚙ opens (reflow on
  press, the defect §2.14 spent a day removing from the foot); ✕ meaning two
  things. And the two panel layouts the prototype dropped — one long scroll, and
  collapsible groups with a remembered open set — with the note that collapsible
  was chosen and then reversed by use.
- The chosen tab structure and the head-label decision are both recorded with their
  reasons, including the cost of the structure you picked.
