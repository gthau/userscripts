# Harnesses for the Jira backlog sprint filter

```
node test/jira-backlog-sprints/run.mjs           # both of them, one total
node test/jira-backlog-sprints/anchor-smoke.mjs  # or either one, on its own
```

**23 checks across two files. No framework, no `package.json`, no dependencies to
install.** Node 20.11 or later. The exit code of `run.mjs` is the number of failing
files.

These two drive a real browser, for the same reasons the toolbar's harnesses do —
[`test/jira-ux-improvements/README.md`](../jira-ux-improvements/README.md) explains
the why at length and is worth reading first. This file covers what is different
here.

## The bug that produced them, and why nobody saw it

The control used to be prepended into `#jira-frontend`, the element React hydrates
the server-rendered page into. That is a hydration mismatch, and React's answer is
to throw the server tree away and rebuild it on the client: the skeleton returning
about a second after the backlog was already readable.

**It only ever showed on a cold load.** Reaching the backlog by a soft navigation —
which is how anyone actually gets there — arrives long after hydration is finished,
when an extra node in the container costs nothing at all. The same bug on the issue
view was obvious, because issue URLs get opened cold all day. This one sat unnoticed
until the toolbar's was found and the same line was looked for here.

## What each one covers

| File | Checks | What it holds |
| --- | --- | --- |
| `hydration-smoke.mjs` | 11 | The mount. The real script against a hydrating page, asserting the server-rendered backlog is adopted rather than rebuilt — then again with the mount patched back to `#jira-frontend`, asserting that one *does* break |
| `anchor-smoke.mjs` | 12 | The position. The script injects its own stylesheet and builds its own control; this measures that the control sits on the header's line, to the left of the action group, at the 6px margin the sheet asks for. Also the route gate from both sides, and the `<html>` filter attribute |

`browser.mjs` is the shared machinery, **copied from the toolbar's directory rather
than shared with it** — the same argument ADR §2.13 makes about the duplicated
helpers. Two directories that cannot break each other are worth more than the
twenty lines the copy costs.

## Nothing here patches the script

The toolbar's harnesses have to unanchor one regular expression to open the route
gate from a `file://` page. This one does not: `BACKLOG_PATH_RE` is not anchored at
the start of the path, so a fixture living in a `boards/42/backlog/` directory is a
real backlog route as far as the script is concerned. **The code under test is the
shipped file, byte for byte**, except in the deliberate control run.

## The second run is the point

`hydration-smoke` patches the fix backwards — `document.body` to `#jira-frontend`,
`append` to `prepend` — and asserts that build reports *"the entire root will switch
to client rendering"*. Every edit goes through `patch()`, which requires it to match
exactly once, so a rename breaks the harness loudly.

## What they deliberately do NOT cover

- **Not the real Jira DOM.** The fixture carries the header `data-testid` and one
  card-list container. A rename at Atlassian leaves these green and the control
  missing.
- **No scanning, no grouping, no preferences.** The whole point of the script — 
  finding foreign sprints and hiding them — is untested here. These two files are
  about where the control lives on the page, not what it does.
- **Only the anchored branch**, and only one theme.
- **No cross-board navigation.** The route gate is checked on two cold loads, not
  by soft-navigating between them, which is the path a real user takes.

## Adding a check

Same conventions as the sibling directory: the label is the claim, not the function
name, and a check that exists because a bug happened says so in a comment.
