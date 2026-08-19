# Session prompts for building the Jira Cart

> **ARCHIVED on 2026-08-19. This effort is finished: L1, L2 and L3 are all
> delivered, and the script is at version 1.0.0.** Nothing below is live, and the
> text is left exactly as the sessions received it — including the "Live prompt: L3"
> line and the guard that says *do not commit*, both of which were true when they
> were written. It is kept for the staging and the guards, which are the reusable
> part. **The decision of record is
> [`src/jira-cart.user.md`](../../src/jira-cart.user.md)**, and where this file
> disagrees with it, it wins.

> **This is a new effort. The map effort is finished.** Its destination —
> [`src/jira-cart.user.md`](../../src/jira-cart.user.md) — is written, committed, and
> is the contract for everything below. Ten tickets settled its content; this effort
> settles nothing and writes code.
>
> **Live prompt: [L3 — hardening](#prompt-l3--hardening).** L1 and L2 are both
> delivered, and L2's findings are folded into L3 below. **Section 2 of the ADR is
> implemented in full.** What is left is verification, not features.
>
> | Prompt | Delivers | Cost | Model |
> | --- | --- | --- | --- |
> | ~~L1 — the engine~~ | **done, version 0.1.1.** store, detector, cascade, floating toggle, badge | large; one file, no research | Opus |
> | ~~L2 — the drawer~~ | **done, version 0.2.0**, then 0.3.0 to 0.5.0 from use. The two sections, copy, gap-fill, refresh, preferences, the right-click menu | large | Opus |
> | **L3 — hardening** | the ADR's 26 test steps, two open design calls, and a version | medium | Opus |
>
> **What L1 settled, and L2 must not undo.** All three storage keys live in
> Tampermonkey's storage (ADR §2.4, decided 2026-08-18). Four things in the ADR
> were wrong and are corrected with their evidence in appendix A.6: §2.1 gained a
> fifth row container for the linked-work-items card and two new rules, §2.2 says
> the cascade reads the group's widest anchor, §2.3's current-issue breadcrumb had
> a name that matched nothing, and §2.7's group now has two answers — the button
> sits beside the anchor that says only the key, and the summary is read from the
> widest. §2.1 also gained the two conditions that stop the row-rot warning crying
> wolf. The user confirmed §7 steps 1, 5, 6, 7, 8, 9, 11, 16, 17, 21 and 23 in the
> browser at 0.1.1.
>
> **What L2 settled, and L3 must not undo.** The drawer and everything in it, at
> 0.2.0. Then four things came out of USING it, each in the ADR with its date: 🔍
> **opens** Jira's search rather than copying the query (§2.8); every row's key is a
> **real link**, which made three lines that were written as guards load-bearing
> (§2.3, §2.7, §2.9); the **⚙ was inert** because a rule at (2,0,2) beat the hiding
> rule at (1,1,1), which §2.11 now carries beside the backtick note; and the
> drawer's open state was **reversed into a stored preference**, because a reload is
> not the end of a sitting (§2.9). An **eighth view** was found — the Team's
> Timeline tab — by the contract check firing on a page that was not broken, which
> is why risk 19 now says to expect a ninth. **Appendix A.7 closed the SPA question
> as declined**: Jira's router is per-element, so our anchor can never be caught by
> it. Six Node harnesses, 293 checks, none of them committed.
>
> **What nobody has confirmed.** The user ran §7 steps 1, 5, 6, 7, 8, 9, 11, 16, 17,
> 21 and 23 at 0.1.1, and has used every version since — but **each of the four
> fixes above was reported and then fixed, and none was re-checked after its fix.**
> No step of §7 has been walked at 0.5.0. That is L3's first hour, and it is cheap.
>
> **The staging is not arbitrary.** It is the order the prototypes grew in, and that
> order was validated by use: `07` built the gesture, then `08` grew a drawer around
> it. Each stage ends with something installable, so a wrong call is found while it
> is still cheap. L1 ships a Cart that collects links and counts them, with nothing
> to open yet.

---

## Guards, and every prompt below carries them

These are the guards that made the map effort survive. They are not
boilerplate — the first attempt at that effort lost a session to fan-out
subagents.

- **No subagents. No workflows.** One agent, one session.
- **Zero web fetches.** Everything is settled and cited in the ADR. Wanting to look
  something up is the signal that a decision is being re-opened.
- **Do not re-open a decision.** The ADR is binding. Its §4 lists 38 rejected
  alternatives; each one is rejected on evidence. If the code seems to want one of
  them, that is a finding to report, not a licence to take it.
- **Do not invent.** No `data-testid` that is not in the ADR. No endpoint that is not
  in §2.6. No behaviour no ticket decided. **If the spec is silent on something the
  code needs, stop and ask the user.** §6 exists for exactly this and names twelve
  such things already.
- **If the spec is WRONG, say so and stop.** A prototype proved most of this, but not
  under a `@grant` (risk 9). A divergence must be recorded in the ADR and agreed,
  never made silently in the code. The ADR and the script must not disagree.
- **Do not commit.** The user installs the script, uses it, and commits when it
  earns it. Report what you could not verify.
- **Do not touch the other four scripts.** Copy from them; change nothing in them.

## The house rules of this repository

Read them off the two existing ADRs rather than inferring them from one file.

- **One file, no build step, no dependencies.** `src/jira-cart.user.js` is the thing
  you install. Plain JavaScript in an IIFE, no TypeScript, no bundler, no
  `package.json`, no test framework. There is nothing to run but the browser.
- **The five helpers are copied, not shared** (ADR §2.13). Take `guard` from
  `bitbucket-ux-improvements` — the async-aware one — and `watchMounts` from
  `jira-ux-improvements`. **Do not copy `watchRoute`.**
- **One idempotent `render`, and only it writes to the page** (§2.10).
- **CSS before JavaScript** (§2.11, and design principle 3). State that must survive
  a React remount goes into a stylesheet or an attribute on `<html>`, never onto a
  node React owns.
- **Atlassian `--ds-*` tokens with standard-colour fallbacks**, and a
  `prefers-color-scheme: dark` block that swaps only the fallbacks (§2.9).
- **Comment the way the other scripts comment.** Not what the line does — why the
  obvious alternative is wrong. Every scar in the ADR that lands in the code should
  be a comment at that line. That is how the next reader stops undoing it.

## The one question that was asked before the load path — answered

**Where do `gt-jira-cart.prefs` and `gt-jira-cart.collections.bak` live?** ADR §6
item 1. **Answered on 2026-08-18: all three keys are in Tampermonkey's storage.**
The reasons are in ADR §2.4, and §6 item 1 is marked closed. It is left here
because the shape worked: one question, a recommendation, the costs stated, and the
answer written into the document with its date. **Each session asks its own
question the same way.**

**L2's was the drawer's open state**, answered ahead of that session: *in memory,
starting closed*, recorded in ADR §2.9 with its cost. **Use reversed it the same
day.** The deduction was sound and the premise was not — a reload is not the end of
a sitting — so §2.9 now keeps both the original reasoning and the reversal. That is
worth reading before L3 asks its own: **the shape of the question is right, and an
answer given before anyone has used the thing is still a guess.** Ask, record, and
expect use to overrule you.

**L3's question is the version**, and it is below.

---

## Prompt L1 — the engine

```
Read, in this order:
  /home/ghis/othercode/userscripts/src/jira-cart.user.md
      — ALL of it, including the appendices. It is the contract. Sections 2.1, 2.2,
        2.4, 2.5, 2.6, 2.7, 2.10 and 2.13 are what you implement now; read 2.9 and
        2.11 anyway, so nothing you write today has to be undone in L2.
  Then, for the helpers and the house style, these three, in full:
    src/jira-ux-improvements.user.js
    src/jira-ux-improvements.user.md
    src/jira-backlog-sprints.user.js
  Then skim:
    src/bitbucket-ux-improvements.user.js   — ONLY for `guard`, which you take
    .scratch/jira-cart/build-prompts.md     — the guards and house rules above

The prototypes are deleted. Do not go looking for them: their mechanisms are in
§2.7, §2.9 and §2.11 of the ADR, which is why they were kept until it was written.

ASK FIRST, then write: the storage question above (§6 item 1).

DELIVER src/jira-cart.user.js, version 0.1.0, containing exactly this and no more:

1. THE METADATA BLOCK (§2.10, and copy the shape from the siblings)
   @name Jira Cart · @namespace http://tampermonkey.net/ · @version 0.1.0
   @author gthau · @match https://*.atlassian.net/* · @run-at document-start
   @grant GM_getValue, GM_setValue, GM_addValueChangeListener — one line each
   @updateURL and @downloadURL on raw.githubusercontent.com, same shape as the others
   @icon as the others have it
   A header comment in the style of jira-ux's: what the script gives the user, in a
   list, and a pointer to the ADR.

2. THE HELPERS (§2.13). logger, guard (async-aware, from bitbucket-ux),
   injectStyle, watchMounts (from jira-ux), reportBrokenContract. No watchRoute.
   One comment saying the duplication is deliberate and pointing at §2.13, so the
   next reader does not "fix" it.

3. THE STORE (§2.4, §2.5). load, save, and one `update(mutate)` that does the
   read-modify-write. The write is the commit: nothing in memory is updated first.
   The migration table from §2.4 in full, including the two rows that refuse to
   write. An unparseable blob is PRESERVED. `collections[0]` is active,
   `collections` is never empty, the first run writes `Scratch`.
   GM_addValueChangeListener on the key; re-read on visibilitychange, comparing the
   raw string. `GM_*` only — never `GM.*`, and say why in a comment.

4. THE DETECTOR AND THE CASCADE (§2.1, §2.2). The anchor selector, the anchored
   ISSUE_PATH_RE copied from jira-ux:177, the four row testids and the five summary
   testids, matched on the LEAF. The six tiers in order, `cleanText`,
   `stripKeyPrefix`, and the `row` guard on tier 5 with the comment saying what it
   prevents. Walking up from the anchor, never down from the key.

5. COLLECTED-AS-CSS AND THE FLOATING TOGGLE (§2.7). The regenerated stylesheet,
   each key anchored four ways, `SAFE_KEY_RE` before anything reaches a stylesheet.
   The toggle: fixed, left of the hovered anchor, loud, three states, the `+` DRAWN
   with two bars, the direction derived from storage at click time, the grace
   period, reposition on scroll, and the widest-anchor rule where anchors overlap.

6. THE BADGE (§2.9). Bottom-right, positioned by a CSS rule keyed off an attribute
   on `<html>`, label = the active collection's name and count, ⚠️ on a write
   failure. Its click sets the open state; NOTHING OPENS YET, because the drawer is
   L2. Do not build a placeholder drawer — a placeholder is a thing that gets
   argued about as though it were a proposal.

7. THE CONTRACT CHECK (§2.1, last paragraph). Distinct keys against row containers.
   Never anchor counts.

DO NOT BUILD, and each is explicitly someone else's stage or explicitly rejected:
   the drawer and its two sections (L2) · the four copy formats (L2) · gap-fill and
   refresh (L2) · the preferences area and the right-click preference (L2) · any
   keyboard shortcut · any multi-select · any template engine · watchRoute · a scan
   button · import · grouping · reorder.

   Gap-fill is L2 on purpose: its trigger is "while the drawer is open" (§2.6), and
   there is no drawer yet. So in L1 an item keeps whatever summary the page gave it,
   and a summary-less item stays bare. That is correct, not a gap — §2.6's rule 1
   says an item is valid with a key alone.

WHEN IT IS WRITTEN, tell the user how to try it, in the shape of §7's steps 1, 5,
6, 7, 8, 9, 11, 16, 17, 21 and 23 — the ones that do not need a drawer. Say plainly
which of them you could not check yourself.

REPORT, at the end:
  - anything in the ADR that turned out to be wrong or under-specified, and what
    you did about it (asked, or stopped)
  - whether the layout and CSS findings of `08` still hold under a `@grant`
    (risk 9). They should, and "should" is reasoning
  - the line count, and which sections of the ADR are now implemented
```

---

## Prompt L2 — the drawer

**Delivered at version 0.2.0.** Kept verbatim, because the shape is what worked:
sharpened with what L1 found, one question answered ahead of the session, and every
item naming the defect it prevents. Four things it could not have known are folded
into L3 instead of being back-fitted here.

Sharpened on 2026-08-18 with what L1 found. The list under DELIVER is the same list
the outline had; the paragraphs around it are new, and they are the parts L1 paid
for.

```
Read, in this order:
  /home/ghis/othercode/userscripts/src/jira-cart.user.md
      — §2.3, §2.6, §2.8, §2.9, §2.11 and §3 are what you implement. Read §2.1,
        §2.2, §2.4, §2.5, §2.7 and §2.10 as well: they are BUILT, and four of them
        were corrected on 2026-08-18 with the evidence in appendix A.6. Do not undo
        a correction. Read A.6 before you touch a selector.
  Then the whole of src/jira-cart.user.js, as version 0.1.1 left it.
  Then, for the code you copy VERBATIM rather than write:
    src/jira-ux-improvements.user.js — escapeHtml, writeClipboard, flash,
      COPY_FEEDBACK_MS (900), the shape of the BUTTONS array, and the comment that
      explains the missing permission gate. Copy them unchanged; §2.8 says so.
    src/jira-backlog-sprints.user.js — its delegated `change` listener on the panel,
      and the signature trick that stops a rebuild taking the focus off a control
      the user is still using. The chips and the create field want both.
  Then skim .scratch/jira-cart/build-prompts.md — the guards and the house rules.

SAME GUARDS. No subagents, no workflows, zero web fetches, no re-opened decisions,
no invented testid or endpoint, no commit, no edits to the other four scripts. If
the spec is silent, ask. If the spec is WRONG, say so and stop: L1 hit that four
times, and each one was a real defect found by one console probe on a live page.
Ask for a probe rather than guessing at the DOM.

NOTHING TO ASK BEFORE YOU START. This session's one open question -- does the
drawer's open state survive a reload? -- was put to the user and answered on
2026-08-18, before the session: it lives IN MEMORY and STARTS CLOSED, and §2.9
carries the decision and its cost. A React remount must not close it, which §7
steps 10 and 11 check. If you find another silence in the spec, ask then, in the
same shape: one question, a recommendation first, the cost stated, and the answer
written into the ADR with its date.

DELIVER, added to src/jira-cart.user.js, version 0.2.0:

1. THE DRAWER SHELL (§2.9). Non-modal: no backdrop, no focus trap, no light
   dismiss, and nothing that closes it when the page is clicked. ESCAPE DOES NOT
   CLOSE IT. Plain z-index, not the top layer. The chrome mirrors the anchored
   corner from ONE rule: the grip on the corner the drawer is not anchored to, the
   head's controls on the side it is. The size is remembered, and double-clicking
   the grip hands the size back. The badge gains `aria-expanded` and
   `aria-controls`, which L1 deliberately left off because they would have pointed
   at nothing.

2. THE FOUR LAYOUT RULES OF §2.11, AND THEY ARE THE POINT OF THIS SESSION. Flex all
   the way down with `min-block-size: 0`; the fixed 62% basis; `flex: none` on every
   fixed part; `overflow: clip` on the containers; one scroller; and no
   `scrollIntoView` anywhere. Each with the defect it prevents in a comment at that
   line. Prefer a container query for auto/stacked/split (§2.9's note) over
   JavaScript, if it works. Our own grip, never `resize: both`, and `render` must
   not reset the inline size a drag owns.

3. THE LIVE LIST (§2.3). A strict mirror: rows enter on mount, leave on unmount,
   nothing is remembered. `On this page (n)`. One row per key for the whole
   document, in an insertion-ordered Map, so page order survives. THE
   REPRESENTATIVE IS THE GROUP'S READING ANCHOR — the widest — which is §2.7's
   table, not the placing anchor the floating button uses. The coarse origin from
   §2.3's table, and note that its current-issue name was corrected. The whole row
   is the toggle. The Cart's own UI stays excluded.
   GROW THIS OUT OF L1's `scanPage`: it already walks every issue anchor once,
   already excludes our UI, and already feeds the contract check. Keep both jobs on
   one pass, and keep §2.1's two warning conditions intact — the linked-work-items
   card is a row now, so an issue page has rows.

4. THE COLLECTION (§2.9). Rows with an explicit ✕, because a mis-click on a whole
   row in a thirty-item list would delete something and there is no undo. The
   heading with the name editable in place (Enter or blur commits, Escape cancels)
   and a ↻ beside it. Chips with counts that never truncate. The create field that
   stops its own `keydown`, `keypress` AND `keyup`. Duplicate names prevented by
   appending a number — lowest free wins, case-insensitive, the same rule on create
   and on rename.

5. GAP-FILL AS A STATE, NOT AN EVENT (§2.6), with all three guards: never twice for
   the same key, never for a key in flight, and debounced into one `bulkfetch` per
   burst. The four API rules are each a measurement: an item is valid with a key
   alone; a response is data only when `response.ok` AND the content type starts
   with `application/json` AND the body has the expected shape; diff the requested
   keys against the returned ones, because a missing key is omitted silently and
   `issueErrors` came back `[]` every time; one request per 100 keys or fewer.
   Always pass `fields` explicitly, keep `X-Atlassian-Token: no-check`, and write
   back with a read-modify-write that patches ONLY keys still present.

6. FULL REFRESH. It may replace a summary and may NEVER delete one, so it can only
   improve or leave alone. The failed state is derived and per-session, in the words
   §2.9 gives it, and it may never say "deleted".

7. THE FOUR COPY FORMATS (§2.8) as four functions behind `format(items, scope)`.
   Only Links writes `text/html`. No format drops an item, and the separator goes
   with the summary when there is none. The label is derived inside `render`, or
   `flash` leaves a ✅ on the button for ever. Disabled and dimmed while the
   collection is empty, and a copy of zero items must not write at all.

8. THE TWO FAILURE STATES OF §2.9, AND MOVE THEM OFF THE BADGE. L1 put both
   sentences into the badge's label and tooltip because there was no drawer to hold
   them. The badge goes back to `🛒 Name N ▾` plus a ⚠️, and the drawer carries the
   line, in the words the ADR gives it.

9. THE ⚙ PREFERENCES AREA, with the right-click preference in it, OFF by default,
   labelled by what it takes away. This is the first code that WRITES
   `gt-jira-cart.prefs` — L1 only reads it, and only `corner`. Keep the known-keys
   filter, keep the fall-back-to-defaults behaviour that is correct for a
   preference, and do not let any of it near the collections' load path, where
   falling back to defaults is forbidden.

10. THE RIGHT-CLICK MENU behind that switch (§2.7). Intercept `contextmenu` only
    while the preference is on, give back "Open link in new tab", and do not widen
    the interception to the whole row. IF THE SESSION RUNS LONG, this is the item to
    leave for L3 — but then the switch goes with it. A switch that does nothing is
    worse than no switch.

HOUSEKEEPING, all of it small and all of it L1's leftovers:
   - the add/remove `logger.log` drops to `logger.debug`. It is a log today only
     because the console was the only way to see what the cascade captured; the
     drawer replaces it. Keep the tier in the debug line — it is how §7 step 5 is
     checked.
   - delete the badge's "there is no drawer in this version" log.
   - the file's header comment loses most of its "deliberately NOT here yet"
     paragraph. Say what is still absent, and nothing more.
   - the ADR's Status and Applies-to lines go to 0.2.0 with the sections now
     implemented. That line went two versions stale in `jira-ux`, which is how it
     rots.

THERE IS NO TEST FRAMEWORK, and L1 found a way to test the pure parts anyway:
three Node harnesses in .scratch/jira-cart/ pull functions straight out of the
script by brace matching and run them, so they cannot drift from the file. They are
not committed and are not a deliverable. Extend them where it is cheap and the
value is high: `format(items, scope)` — four formats times three scopes, plus the
summary-less line of each — and §2.6's response validation, which is pure and is
the rule that stops login-page HTML becoming an issue summary.

DO NOT BUILD: any keyboard shortcut, any multi-select or per-row copy, any template
engine, `watchRoute`, a scan button, import, grouping, reorder, or a third drawer
mode. Each is either L3's, out of scope in §6, or in §4's list of 38.

WHEN IT IS WRITTEN, walk the user through all 23 steps of §7 — they have now run
1, 5, 6, 7, 8, 9, 11, 16, 17, 21 and 23 at 0.1.1, so lead with the twelve the
drawer unlocks: 2, 3, 4, 10, 12, 13, 14, 15, 18, 19, 20, 22.

REPORT, at the end:
  - anything in the ADR that turned out wrong or under-specified, and what you did
  - WHETHER `08`'s SIX DEFECTS REPRODUCE UNDER THE GRANT (risk 9). This is the
    session that can answer it, because it is the session that has a drawer. L1
    could only reason about it
  - the line count, and which sections of the ADR are now implemented
```

---

## Prompt L3 — hardening

Sharpened on 2026-08-18 with what L2 delivered and what using it found. **This
session adds no feature.** It turns a script that works into a script that is known
to work, and it settles the two design calls §2 deliberately left open.

```
Read, in this order:
  /home/ghis/othercode/userscripts/src/jira-cart.user.md
      — §5 (19 risks), §6 (13 open items) and §7 (26 steps) are the work. Read §2.9
        and §2.11 as well, because the two decisions you have to settle live there.
        Read appendix A.7 before wondering about client-side navigation: it is
        closed, and the reason is measured.
  Then the whole of src/jira-cart.user.js, as 0.5.0 left it. It is about 4,700 lines
  and every surprising one carries the reason it is that way.
  Then skim .scratch/jira-cart/build-prompts.md — the guards and the house rules.

RUN THE SIX HARNESSES FIRST, before you read anything else:
  for h in smoke store-smoke group-smoke format-smoke boot-smoke css-smoke; do
    node .scratch/jira-cart/$h.mjs; done
293 checks. They pull the real functions out of the file by brace matching, so they
cannot drift from it -- and a rename breaks them loudly, which is the point. If one
fails before you have touched anything, that is your first finding.

SAME GUARDS. No subagents, no workflows, zero web fetches, no re-opened decisions,
no invented testid, no edits to the other four scripts. THREE MORE, each of which
cost this effort real time:
  - NEVER A BACKTICK IN A CSS COMMENT. The sheet is a template literal. §2.11 warns
    about it, and it still happened three times, each time reporting a syntax error
    tens of lines below the real one. `css-smoke` now catches it.
  - ANY RULE THAT SETS `display` ON A HIDEABLE ELEMENT NEEDS `[hidden]` IN ITS OWN
    SELECTOR. That is what left the ⚙ inert for two versions (§2.11).
  - ASK FOR A PROBE RATHER THAN GUESSING AT THE DOM. Four times in L2, four
    answers, no wrong turns: the eighth view's row, its title, the whole-view
    container, and Jira's router. The user runs one console line in seconds; a guess
    costs a version.

ONE QUESTION BEFORE YOU START: THE VERSION. 0.5.0 implements the whole of ADR §2.
Recommendation: END THIS SESSION AT 1.0.0, because 1.0.0 should mean "the spec is
built and checked" rather than "nothing is left to want" -- §6 will always hold
open items. The cost is that a later feature is then 1.1.0 rather than 0.6.0, which
is only a naming habit. Ask, then move the ADR's Status and `Applies to` lines with
it. THAT LINE WENT TWO VERSIONS STALE IN `jira-ux`, which is how it rots.

DELIVER, in this order, because it is cheapest-first:

1. CONFIRM THE FOUR FIXES NOBODY HAS RE-CHECKED. Each was reported in use, fixed,
   and never seen working: §7 step 14's 🔍 Search (a new tab on Jira's search,
   showing exactly the collection), step 24's eighth view (no warning badge on the
   Team Timeline, and a row that carries its title), step 25's key links (click,
   middle-click, and the count NOT doubling), step 13's reload (the size and the
   open drawer both come back), and the ⚙ actually opening. Half an hour, and it
   either closes five steps or finds the next defect.

2. THE STEPS NO BUILD SESSION CAN RUN, which is why they are still open after two
   sessions. Step 16 needs two tabs: add in one, watch the other catch up, then
   leave a tab open, add five in the other, return and add one -- ALL SIX MUST BE
   THERE. Steps 17 to 21 need Tampermonkey's storage view: nonsense in the key
   (kept, not overwritten), `v` set to 99 (read-only, with a visible reason), a key
   edited to `ZZZZ-99999` (`(cannot read)`, never "deleted"), logged out (the item
   stays BARE -- no login-page HTML may become a summary), then log out and back in
   (the collections survive, which is the whole reason for the `@grant`).

3. THE CASCADE ON EACH OF THE EIGHT VIEWS (§7 step 5). There are two timelines now
   and they are different components. The tier is in the console at debug level, so
   each view answers in one line: `added KEY to NAME: "..." (tier N)`. Expect a
   NINTH view -- risk 19 says the survey was not exhaustive, and the contract check
   is what finds one. A warning on a page that works is a finding to read, not an
   alarm to suppress.

4. THE RIGHT-CLICK MENU HAS NEVER BEEN SWITCHED ON. It is built, off by default,
   and unexercised. §6 item 11 asked whether the preference would ever be used;
   turning it on for an hour answers that and exercises the one path of §2.7 that no
   session has run.

5. TWO DECISIONS TO SETTLE, and both are the user's. Put each as one question with a
   recommendation and the costs, the way §6 item 1 was put:
   - RISK 10. At the stated minimum of 300x160 the collection's own fixed parts --
     heading, chips, create field, four buttons, about 130px -- cannot fit the 38%
     the fixed basis leaves them, and are clipped. THE FIX IS NOT A `min-height`:
     §2.11's third rule is the argument against exactly that. The options are a
     larger minimum height, a divider that yields when the collection cannot fit,
     or accepting it and saying so in the risk.
   - THE KEYBOARD. §6 item 4 and risk 8 were opened when the drawer did not exist.
     It now holds about fifteen controls; the grip and the divider are pointer-only
     by design, and whether the whole thing can be driven from the keyboard has
     never been tried. Try it, then decide whether that is a gap or a stated limit.

6. WHATEVER THE ADR TURNS OUT TO HAVE WRONG. Everything found goes into the
   document, with its reason and its date, in the voice it already uses. Six
   corrections landed that way across L1 and L2, and each one is why the next reader
   does not undo it.

EXTEND THE HARNESSES ONLY WHERE IT IS CHEAP AND THE VALUE IS HIGH, and do not
re-do what they cover: the store's own paths, the four copy formats against §2.8's
worked example, §2.6's response validation, the eighth view's selectors, the whole
script booting against a fake DOM, and the CSS specificity traps. `boot-smoke` is
the one that caught three defects before the browser could -- if you find yourself
reasoning about whether a click does the right thing, drive it there instead.

DO NOT: add a feature; close a §6 item the user has not asked you to close; run
appendix C's two probes unless asked, since neither blocks anything; or touch the
other four scripts.

REPORT, at the end:
  - WHICH OF §7's 26 STEPS ARE NOW CONFIRMED, and by whom -- you or the user. Name
    the ones still unrun and say why. That list is the deliverable
  - the two decisions, as decided, with what each one cost
  - anything the ADR had wrong, and what you did about it
  - the line count, the version, and whether the ADR's Status line matches it
```

**What comes after L3.** Nothing is planned, and §6's thirteen open items are the
menu rather than a backlog: import (item 6), grouping the live list (item 2),
ordering inside a collection (item 7), capture from Bitbucket and Confluence (item
8, which the user called intended future work), keyboard shortcuts (item 4), and
sync across machines (item 9). **Each is a separate effort with its own map, and
none of them is started by editing this file.**
