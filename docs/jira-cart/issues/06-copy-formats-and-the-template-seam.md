# 06 — Copy formats, and whether the template seam is real

Type: grilling
Status: resolved — four formats, four hand-written functions, and no template seam (see Answer)
Blocked by: 05
Parent: ../map.md
Run with: prompt H in ../prompts.md

## Question

The decision is a fixed menu of formats now, with user-editable templates left
to a later effort.

1. **The menu.** Which formats ship? Candidates, to accept, reject or extend:
   a markdown list of links; plain `KEY — Summary` lines; bare keys separated by
   commas; bare URLs one per line; a JQL clause `key in (A, B, C)`; the
   `[KEY] Summary` form the existing toolbar already copies. Each earns its place
   by a paste target the user actually uses — Confluence, Slack, a PR
   description, a commit message, the Jira search box.
2. **Scope of a copy.** The whole active collection, a multi-select within it,
   and a single item. Does each format apply at all three scopes, or do some
   only make sense for the whole collection?
3. **Dual-format writes.** `jira-ux-improvements` writes markdown as
   `text/plain` and an `<a>` as `text/html` in one `ClipboardItem`, so one copy
   pastes correctly into both a plain editor and Confluence. Decide which of the
   menu's formats get an HTML twin, and what that HTML is for a list — a `<ul>`
   of links is the obvious answer for markdown, and there is no sensible HTML
   twin for a JQL clause.
4. **Failure and feedback.** The clipboard write can fail. The existing script
   shows ✅ or ⚠️ on the button for 900 ms. Match it.
5. **The seam.** The charting session promised a seam for later templates, and a
   seam nobody has tested is a wish. Either sketch the template model far enough
   to show the fixed formats are expressible in it — which makes the seam real —
   or drop the claim from the ADR and say plainly that templates will be a
   rewrite of this layer. Do not leave "we left a seam" in the document
   unevidenced.

## Answer

**Four formats ship: Links, Names, Keys and JQL. No format ever drops an item —
a paste always has as many lines as the copy had items. Only Links writes a rich
version alongside the plain text. And the template seam is not real: these are
four small hand-written functions, so user-editable templates would be a rewrite
of this layer rather than a setting switched on.**

Evidence: the clipboard machinery already exists and is proven, at
[`jira-ux-improvements.user.js:308-381`](../../../src/jira-ux-improvements.user.js#L308-L381).
This ticket copies it and redesigns none of it. Two of the three allowed web
fetches were spent, both on one question — which data types a clipboard write may
carry. The third was banked.

### 1. The four formats

One collection is used as the worked example throughout, taken from
[`05` §2](05-collection-data-model-in-localstorage.md#2-the-stored-object). It has
three items and the third has no summary, which per `07` is the case that decides
most of this ticket:

```
RDC-14817   Outline inside the edited field
RDC-23716   Rundown grid does not refresh after a move
GLX-402     (no summary)
```

**🔗 Links** — for a status email, Confluence, Slack, a pull request description.

```
- [RDC-14817](https://dalet.atlassian.net/browse/RDC-14817) Outline inside the edited field
- [RDC-23716](https://dalet.atlassian.net/browse/RDC-23716) Rundown grid does not refresh after a move
- [GLX-402](https://dalet.atlassian.net/browse/GLX-402)
```

**📃 Names** — for a commit message, a plain-text mail, a code comment.

```
[RDC-14817] Outline inside the edited field
[RDC-23716] Rundown grid does not refresh after a move
GLX-402
```

**🔑 Keys** — for a commit message, a form field, a quick paste into chat.

```
RDC-14817, RDC-23716, GLX-402
```

**🔍 JQL** — for Jira's own search box.

```
key in (RDC-14817, RDC-23716, GLX-402)
```

**The four are a spanning set, not a wish list.** One rich list a person reads,
one plain list a person reads, one list of identifiers, one query. Every other
candidate in the ticket collapses into one of those four.

**Links takes its exact shape from `jira-ux-improvements`, and that shape changed
under this session.** The script now builds `[KEY](url) Summary` — the key alone
is the link, and the summary sits outside it — after commit `37ff03a`, *"link only
the key and leave the summary beside it"*. The session began against the older
form and the user corrected it by rebasing. The reason recorded in the code is a
syntax limit rather than a taste: a `[KEY] Summary` label cannot be a markdown
link label, because markdown cannot nest square brackets. The Cart's Links format
is therefore the same string as jira-ux's, repeated per line under a `- ` bullet —
reuse, not a variation.

**Two consequences of that shape are worth keeping.** The link column is short and
uniform, so a pasted list is scanned down its keys rather than down three lines of
ragged blue prose; and the summary stays ordinary text, so it can be edited in the
email you pasted it into without fighting a link boundary.

> **Amended by [`10`](10-where-the-collections-live.md#answer) §6 — the framing
> softens, and no format moves.** `10` put the collections into Tampermonkey's
> storage, which **survives a logout and a history cleanup**, so the premise below
> — that `localStorage` dies at a logout — is no longer why copy-out matters. The
> honest restatement: **a collection now survives a logout but lives in one browser
> profile.** It does not survive uninstalling Tampermonkey, switching browser, or
> moving machine without cloud sync. So copy-out is still how the data leaves the
> browser, and still the thing you send to a person. **All four formats stand
> unchanged** — every one was chosen on a paste target, and no paste target moved.
> **JQL keeps its slot on its own merit**: the query slot in a spanning set, and the
> way to turn a collection back into something Jira can filter, bulk-edit, save and
> share. Its durability argument is withdrawn; its utility argument never depended
> on the store. Put to the user as its own decision on 2026-08-18 and taken.

**JQL is the only genuinely new format, and it earns its place on `05`'s framing.**
[`05` §8](05-collection-data-model-in-localstorage.md#8-ceilings--the-cart-is-not-what-fills-this-quota)
established that a collection is working state and the paste is what lasts, because
`localStorage` dies on a logout. Links makes the data durable *outside* Jira. JQL
makes it durable *inside* Jira: paste it into search, and the collection becomes a
result set you can save as a filter, share, or bulk-edit. It is the only format
that goes back where it came from.

**Three of the four labels are already in the user's fingers.** 🔗 link, 📃 name and
🔑 key are [jira-ux's toolbar](../../../src/jira-ux-improvements.user.md#L245-L254),
same emoji, same word, plural because the Cart copies a list.

### 2. What was rejected, and why

**Bare URLs, one per line.** It is Links with the summary removed — the same
information, less of it. Its only distinct target is somewhere that renders neither
markdown nor HTML but does auto-link raw text, and §5's rich version already covers
the rich targets while Links' plain text keeps the full URL visible. Cutting it
costs a paste target that cannot be named.

**`[KEY] Summary — URL`** (jira-ux's 📃 name/URL). Lossless, but so is Links: the
same three fields with different punctuation. Keeping it would grow the menu
without adding information.

### 3. An item with no summary

**Jira's summary field is mandatory, so an issue always has one.** An item without
a summary is never "this issue has no title" — it is always "the Cart did not
capture one". That distinction was raised by the user and it corrects how this
ticket was framed.

**The capture really can come back empty.** [`07` §6](07-the-direct-add-gesture.md#answer)
records a five-source cascade — the view's own summary field scoped to the row, the
accessibility label, the backlog's screen-reader twin anchor, the anchor's own text
when it is not the key, and `document.title` — and states that returning nothing is
a correct answer rather than a failure. The realistic miss is an inline
`/browse/KEY` link in a comment or description whose anchor text is the bare key.
`09` put prose links deliberately in scope, reversing `02` §3, so that path is live.

**But it is common when adding and rare when copying**, and the prompt that opened
this session carried `07`'s claim across as though it described both.
[`05` §6](05-collection-data-model-in-localstorage.md#6-which-fields-and-snapshot-rather-than-cache)
puts gap-fill in between: one `bulkfetch` for exactly the items that have no
summary. By the time a copy happens, an item is still bare in only three ways —
the request has not returned yet, the request failed, or the issue cannot be read
at all. The third is permanent: `bulkfetch` answers `200, issues: [], issueErrors: []`
for a key that is deleted *or* forbidden, and Atlassian conflates the two on
purpose, so for such an item there is no summary to be had ever.

**Therefore every format has a defined answer, and the rule is that no format ever
drops an item — the line count of a paste always equals the number of items
copied.** Silently omitting an item would hide something that is either pending or
broken. The degradations:

| Format | With a summary | Without one |
| --- | --- | --- |
| Links | `- [RDC-14817](url) Outline inside the edited field` | `- [GLX-402](url)` |
| Names | `[RDC-14817] Outline inside the edited field` | `GLX-402` |
| Keys | unaffected | unaffected |
| JQL | unaffected | unaffected |

**Names drops its brackets, and that is not cosmetic.** The brackets exist to
separate the key from the summary. With no summary they separate nothing, and
`[GLX-402] ` carries a trailing space. This one case is what kills the template
model in §7.

**Both sides of Links drop the separator with the summary.** The current code writes
`` `[${key}](${url}) ${summary}` `` and `` `…</a>&nbsp;${escapeHtml(summary)}` ``,
which leaves a trailing space and a dangling `&nbsp;` when the summary is absent.
That is harmless in jira-ux, where `getIssueParts` always derives a summary from
`document.title`. In the Cart it is not, so the separator and the summary go
together.

### 4. Scope

Whether the drawer offers a selection at all, and what the controls look like, is
`08`'s. This ticket states only which format works at which scope.

| Format | Whole collection | A selection | One item |
| --- | --- | --- | --- |
| 🔗 Links | yes | yes | yes |
| 📃 Names | yes | yes | yes |
| 🔑 Keys | yes | yes | yes |
| 🔍 JQL | yes | yes | **no** |

**JQL is the exception because it exists to rebuild a set.** For a single issue,
`key in (RDC-14817)` is a worse way to reach it than the URL the other three
formats already carry, and the idiomatic single form is `key = RDC-14817`, which
would mean two shapes behind one menu entry.

**The `- ` bullet belongs to the scope, not to the format.** Markdown's `- ` is list
syntax and one item is not a list. A selection holding a single item still gets a
bullet, because a list was asked for; a single-item copy gets none. Decided by the
gesture rather than by counting, so nothing has to sniff the length. The single-item
outputs then land exactly on jira-ux's three copy buttons:

```
Links   [RDC-14817](https://dalet.atlassian.net/browse/RDC-14817) Outline inside the edited field
Names   [RDC-14817] Outline inside the edited field
Keys    RDC-14817
```

For a summary-less single item, Names and Keys produce the same string, `GLX-402`.
That is honest rather than a defect — with no summary there is nothing for the
brackets to separate.

**No format emits the collection's name as a heading.** It is tempting, since the
name is the one thing the user wrote themselves and it dies with `localStorage` like
everything else. Three reasons against: it is redundant wherever you paste, because
you have already written the subject line or the heading; it is wrong for a
selection, which is not the collection; and it is invalid inside Keys and JQL, where
a `## Sprint review 2608-01` line is not part of the syntax. Leaving it out also
keeps *lines equals items* exactly true, which makes a paste checkable at a glance.

**One limit, recorded rather than fixed:** the three text formats keep the
collection's order, which is array order per `05` §2. JQL does not — Jira returns
`key in (…)` results in its own order, and an arbitrary order cannot be expressed in
JQL. The round trip through Jira loses the ordering.

### 5. The rich version — Links only

**The available data types are not a convention here, they are the whole surface.**
The [W3C Clipboard API specification](https://w3c.github.io/clipboard-apis/) §6.4
names exactly three mandatory types: `text/plain`, `text/html`, `image/png`. §6.5
adds an optional mechanism for custom types behind a `"web "` prefix, and the spec
is **silent on whether native applications can read those** — recorded as
unverified, because nothing we paste into is written to look for them. `image/png`
is irrelevant, since the Cart has no image. So `text/plain` + `text/html` is
everything there is, which is precisely what jira-ux already writes.
[MDN's `ClipboardItem` page](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem)
does not list the mandatory types at all; recorded as not carrying the answer.

| Format | `text/plain` | `text/html` |
| --- | --- | --- |
| 🔗 Links | markdown list | a `<ul>` of links |
| 📃 Names | yes | — |
| 🔑 Keys | yes | — |
| 🔍 JQL | yes | — |

The HTML, against the same three items:

```html
<ul><li><a href="https://dalet.atlassian.net/browse/RDC-14817">RDC-14817</a>&nbsp;Outline inside the edited field</li><li><a href="https://dalet.atlassian.net/browse/RDC-23716">RDC-23716</a>&nbsp;Rundown grid does not refresh after a move</li><li><a href="https://dalet.atlassian.net/browse/GLX-402">GLX-402</a></li></ul>
```

`<ul>` rather than `<ol>`: document order already carries the collection's order,
and numbering would imply a ranking that does not exist. The `&nbsp;` after `</a>`
is taken verbatim from
[jira-ux:339-341](../../../src/jira-ux-improvements.user.js#L339-L341).

**Names gets no rich version, and that is the point of Names.** A `<ul>` twin would
put bullets into Confluence that were not asked for; the whole reason to choose
Names over Links is wanting unadorned lines. Writing plain text alone is not a
degradation — a rich editor takes the plain text and renders the line breaks, which
is the request. Keys is one line of identifiers with nothing to mark up, and JQL's
target is a plain search input.

**The two versions must agree about what the document is.** `- ` bullets on the
text side, `<ul><li>` on the HTML side. At single-item scope there is no bullet, so
there is no `<ul>` either — the rich version is a bare
`<a href="…">RDC-14817</a>&nbsp;Outline inside the edited field`, identical to what
jira-ux's `link` case produces today.

Three things follow and are recorded rather than decided:

- **`escapeHtml` is reused unchanged**
  ([jira-ux:308-317](../../../src/jira-ux-improvements.user.js#L308-L317)) and it
  carries more weight here: the summary is read from the Jira page and stored, so
  `&`, `<` and `>` in an issue title reach the clipboard path.
- **The plain-text side cannot be broken by data.** The key has a fixed shape and
  the URL is derived as `location.origin + "/browse/" + KEY`, so neither can break
  markdown link syntax — and in the `[KEY](url) Summary` form the one untrusted
  string sits outside all syntax. Under the older `[KEY Summary](url)` form a
  summary containing `]` would have broken the link, so the rebase quietly removed
  a hazard.
- **Degradation is already correct.**
  [`writeClipboard`](../../../src/jira-ux-improvements.user.js#L348-L359) falls back
  to `writeText` when `ClipboardItem` is missing, so Links loses its HTML and keeps
  a valid markdown list. Design principle 4 is satisfied by the existing function,
  not by a new special case.

### 6. Failure and feedback

The mechanism is `jira-ux`'s, copied: ✅ or ⚠️ on the control for
`COPY_FEEDBACK_MS` (900 ms), put back by the next `render`, via
[`flash`](../../../src/jira-ux-improvements.user.js#L378-L381) and
[`copyIssue`](../../../src/jira-ux-improvements.user.js#L365-L373). The comment
explaining why there is no `navigator.permissions.query` gate is a scar and stays:
Firefox and Safari reject that permission name, the promise rejected unnoticed, and
the copy silently never happened.

**Partial success does not exist.** `navigator.clipboard.write` is one operation
with one outcome — there is no state where the plain text landed and the HTML did
not. So there are two symbols and no third.

Two things resemble a partial success and are deliberately still ✅:

- **A copy containing items with no summary.** That is a fact about the collection,
  not about the write, and the two have different remedies. ⚠️ means *press it
  again*. A thin item means *refresh, or that issue is gone*. `05` already gives
  the second one a home as a per-row note in the drawer; repeating it on a 900 ms
  glyph would tell the user the wrong thing to do.
- **Links falling back to `writeText`.** The markdown list is a complete artifact,
  and the audience is Chromium, where the fallback is unreachable. `logger.debug`,
  not ⚠️.

**A copy of zero items must not write.** A collection's `items` can be empty
([`05` §2](05-collection-data-model-in-localstorage.md#2-the-stored-object)), and
copying it would put an empty string on the clipboard, destroying whatever was
there, under a ✅ claiming success. The precondition for any copy is at least one
item. How an unavailable control looks is `08`'s, and the repo already has the
convention — jira-ux
[disables the buttons that need the description](../../../src/jira-ux-improvements.user.md#L263-L264)
when it is absent.

**No flash state.** The Cart re-renders when another tab writes, so an unrelated
change can clear the ✅ before 900 ms are up. The fix would be a stored "flashing
until" timestamp, which is exactly the kind of value both existing ADRs deleted for
being able to disagree with reality. The feedback is a blink, not a receipt.

### 7. Four hand-written functions, and no template seam

**The ticket's premise is wrong, and it was checked.** `06` Q5 says *"the charting
session promised a seam for later templates"*. The map promised no such thing. Its
*Export* row says only *"A fixed menu of formats in this version. User-editable
templates are a later effort"*, and *Out of scope* says *"Deliberately deferred"*.
Both are true and both stay. There was no unevidenced claim sitting in the map — it
existed only inside this ticket's own question.

**The real question survives, and the answer is: four hand-written functions.**

A fill-in-the-blanks template was tried. It handles Keys and JQL, then dies on
Names. The template `[{key}] {summary}` gives:

```
[GLX-402] 
```

Brackets around a key with nothing to separate it from, and a trailing space. §3
established the correct answer is `GLX-402`. That is a **different line shape**, not
a substituted one, and producing it requires an if/else inside the template.

Add the rest of what the model would need — a second output channel with a `<ul>`
wrapper and different escaping, the bullet appearing only at list scope, and JQL
being unavailable at single-item scope — and the "template" has become a small
programming language, written to serve four instances.

**What is real, and should be named as that and nothing more:** the four share one
shape.

```
format(items, scope) → { text, html? }
```

Four functions, one signature, and `writeClipboard` does not care which ran. Adding
a fifth format means adding one entry to a list, which is exactly how
[jira-ux's `BUTTONS` array](../../../src/jira-ux-improvements.user.js#L403-L448)
already works. That is a dispatch table. It is cheap and it is genuine, and it
should not be dressed up as a template seam.

**So the ADR says plainly: user-editable templates would be a rewrite of this layer,
not a setting switched on.** One extra reason to record while it is in view —
user-written templates mean user-written HTML reaching the clipboard, which is a
different safety question than any of the fixed formats face.

### 8. Two amendments to `05`, both agreed as their own decisions

The map's rule is that a ticket may report evidence against a constraint but may not
quietly overturn one. Both of these were put to the user and taken separately.

**Gap-fill's trigger becomes a state, not an event.**
[`05` §6](05-collection-data-model-in-localstorage.md#6-which-fields-and-snapshot-rather-than-cache)
says gap-fill runs *when the drawer opens*. The user found the hole: if the drawer
is already open and you add a link whose summary is not in the page, nothing fires,
and the item stays bare until the drawer is closed and reopened. The trigger is now
**while the drawer is open** — one rule covering both cases, evaluated by the
idempotent `render` rather than by two event handlers that must be kept in
agreement. Three guards come with it:

1. **Do not ask twice for the same key.** An item in `05`'s single failed state has
   no summary permanently, so a naive state trigger would re-request it on every
   render forever. The guard is the per-session annotation `05` already specifies
   for that state, so it costs nothing new — but the ADR must say that this is what
   stops the loop, or a build session will delete it as decoration.
2. **Keys already in flight are excluded**, so a re-render during the request does
   not duplicate it.
3. **Debounced into one request per burst.** Adding five links to an open drawer is
   one `bulkfetch`, not five — the same burst behaviour `07`'s twenty-in-a-row
   gesture needs.

The write-back is a read-modify-write that **patches only keys still present**.
`07` made the gesture a toggle, so a response landing after an item was removed
must not bring it back.

**A refresh may replace a summary but never delete one.** If a request returns
nothing for a key — deleted, no longer visible, or a response that failed `01` rule
2's validation — the stored summary is kept and the row carries `05`'s failed note.
Otherwise one network blip strips the titles off a collection built over a week.
This makes refresh safe by construction: it can only improve or leave alone.

**What was proposed and declined:** refreshing every summary each time the drawer
opens, so a copy always carries current titles. The user chose to keep `05` as
written — automatic fill only for items that have no summary, and existing summaries
updated only on an explicit refresh. The consequence is accepted knowingly: **a
collection left for a week can be copied with week-old titles.** Nothing may fetch
in the copy path (`04`), so the remedy is the refresh control, not a smarter copy.

### What was not settled

1. **Whether a clipboard write still works under a `@grant`.** Untested, and it is
   now the decisive question for a larger one. `04` gave two reasons to stay at
   `@grant none`: route detection and the clipboard. `09` then deleted route
   detection from the design, so the clipboard is the only one left. If a
   `ClipboardItem` write survives Tampermonkey's sandbox, very little argues against
   moving the collections into Tampermonkey's own storage, which survives a logout
   and a history cleanup. If it does not, `@grant none` stands and so does the
   durability limit that shapes this whole ticket. **This is the first observation
   in the platform pile that is a five-minute experiment rather than an opinion.**
2. **Whether native applications can read custom `"web "`-prefixed clipboard
   types.** The W3C specification is silent. Nothing depends on it — no target the
   Cart pastes into is written to look for such a type.
3. **Whether the collections should live in Tampermonkey storage rather than
   `localStorage`.** Raised by the user here and deliberately not decided: it is
   `05`'s model and `04`'s platform verdict, both closed, and it would ripple into
   `08`. Recorded for the platform review. None of this ticket's answers depend on
   where the data is stored.
4. **A copy made immediately after opening the drawer can be thinner than one made
   two seconds later**, because gap-fill is a network round trip and copy may not
   wait for it (`04`). Unavoidable inside that rule, and small.
5. **JQL loses the collection's order** on the round trip through Jira, and an
   arbitrary order cannot be expressed in JQL.
6. **Where the copy control lives, and whether a selection exists at all.**
   Deliberately `08`'s. This ticket states only which format works at which scope.

### What this hands on

- **`08` (the drawer).** Five things land on it. (1) **Where these four formats are
  offered**, and whether a selection exists at all — this ticket fixed the scope
  matrix and stopped there. (2) **The label of whatever control copies must be
  derived inside `render`.** `flash` works only because jira-ux rebuilds every
  label from state; a label written once at construction would keep the ✅ forever.
  (3) **The disabled rendering when the collection is empty**, since a copy of zero
  items must not write. (4) **The refresh control**, which is now the only way a
  stale title is corrected, so it has to be findable rather than tucked away.
  (5) **`gt-jira-cart.prefs` is still unclaimed by this ticket** — `06` needs no
  preference of its own, so `08` inherits the whole key, minus the right-click
  switch `07` put in it.
- **The map.** The *Export* row now names the four formats instead of saying a menu
  exists. Nothing else changed: the *Out of scope* entry on user-editable templates
  was already accurate and now has evidence behind it rather than an assumption.
- **The build session.** Copy the clipboard functions from `jira-ux-improvements`
  unchanged — `escapeHtml`, `writeClipboard`, `flash`, `COPY_FEEDBACK_MS` and the
  comment about `navigator.permissions.query`. Write four format functions behind
  one signature. Do not build a template engine, and do not write "we left a seam
  for templates" in the document.
