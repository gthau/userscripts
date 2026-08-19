# Harnesses for the Jira UX toolbar

```
node test/jira-ux-improvements/run.mjs           # both of them, one total
node test/jira-ux-improvements/anchor-smoke.mjs  # or either one, on its own
```

**25 checks across two files. No framework, no `package.json`, no dependencies to
install.** Node 20.11 or later, for `import.meta.dirname`. The exit code of
`run.mjs` is the number of failing files, so a hook or a CI step needs no output
parsing.

Unlike the Jira Cart's harnesses, **these two drive a real browser**, and one of
them downloads React the first time it runs.

## Why a browser, when the Cart's harnesses need none

Because both questions here have no answer in Node.

The first is what React does when it hydrates a page that has a foreign node in
its container. jsdom has no hydration; a harness written against it would pass
whatever the script did. The second is where CSS anchor positioning puts the
toolbar. Nothing in Node computes a box.

Both questions came from one bug. The toolbar used to be prepended into
`#jira-frontend`, which is the element React hydrates the server-rendered issue
view into. A node in front of that markup is a mismatch, and React answers a
mismatch outside a Suspense boundary by throwing the whole server tree away and
building it again on the client. From the outside: the issue is on screen and
readable, then a second later the skeleton is back and it takes another two or
three seconds to fill in. **The toolbar was destroyed on the way past and the
backstop rebuilt it**, which is why the toolbar never looked like the culprit.

## What each one covers

| File | Checks | What it holds |
| --- | --- | --- |
| `hydration-smoke.mjs` | 11 | The mount. Runs the real script against a page that hydrates the way Jira's does, and asserts the server-rendered DOM is adopted rather than rebuilt — then runs it again with the mount patched back to `#jira-frontend`, and asserts that one *does* break |
| `anchor-smoke.mjs` | 14 | The position. Lets the script inject its own stylesheet and build its own toolbar, then measures the two rectangles: the toolbar sits on the breadcrumbs' line, immediately after they end, at the anchored branch's low z-index. Also the route gate from both sides |

`browser.mjs` is the machinery they share — find a Chrome, run a page, read one
line of JSON back. It is not named `-smoke.mjs`, so `run.mjs` does not run it.

## The second run is the point

A fixture that cannot fail is not evidence. `hydration-smoke` therefore patches the
fix backwards — `document.body` back to `#jira-frontend`, `append` back to
`prepend` — and asserts that build reports *"the entire root will switch to client
rendering"*, loses the server node, and has its toolbar deleted out from under it.
If that second run ever goes quiet, the first run's green means nothing and this
file is the first place to look.

## The one seam, and the one patch

Each harness reaches the code through `browser.mjs`:

```js
const SRC = import.meta.dirname + "/../../src/jira-ux-improvements.user.js";
```

Every edit to that source goes through `patch()`, which **requires each edit to
match exactly once**. A rename in the script breaks these files loudly rather than
leaving them testing a string that no longer exists.

There is exactly one such edit, and both files make it: the script's route test is
anchored at the start of the path (`/^\/browse\/`), and a `file://` page cannot
have `/browse/ABC-123` as its whole pathname. Serving the fixture over
`http://127.0.0.1` would avoid it, but Chrome would not load loopback in the
environment this was written in. Unanchoring the pattern opens the route gate and
touches nothing either harness asks about.

## Things that are true of the harness and not of the script

- **Headless Chrome does not run CSS animations.** The `animationstart` signal the
  script normally mounts on never fires here, so the toolbar arrives on the
  script's own five-second backstop instead. `--virtual-time-budget` makes that
  wait cost no wall clock. The ordering that matters — toolbar up *before*
  hydration — is reproduced either way, and the backstop is a path the real
  browser takes too, whenever page CSS beats the animation.
- **The delay is read from the script**, not written here: `constant(src,
  "MOUNT_BACKSTOP_MS")`. Change the backstop and the harness follows.

## What they deliberately do NOT cover

Read this before trusting a green run.

- **Not the real Jira DOM.** The fixtures carry the handful of `data-testid` and
  `data-component-selector` values the script looks for. If Atlassian renames one,
  these harnesses keep passing and the toolbar stops appearing. Nothing here can
  see that.
- **No clipboard, no keyboard shortcuts, no scrolling.** The four copy formats,
  the `Alt+Shift` bindings and the two jump buttons are untested. A browser could
  reach them; these files do not.
- **Only the anchored branch.** `anchor-smoke` asserts the Chrome it found
  supports anchor positioning, which means the fixed-corner fallback every
  non-Chromium user sees is never measured.
- **One theme.** The dark-mode block is not exercised.
- **No React remount mid-session** — tab switches, saved edits, virtualised
  re-renders. The script is built to survive those; nothing here proves it does.

## Adding a check

Put it in the file that already owns that area, and **write the label as the claim
it makes**, not as the function it calls — `"its parent is <body>, not Jira's React
root"`, not `"ensureToolbar works"`. Every label in these files reads as a sentence
about the toolbar, so a failure names the broken promise.

When a check exists because a bug actually happened, say so in a comment, with what
the bug looked like from the outside. Both files were written that way, and both
were confirmed capable of failing before they were trusted.
