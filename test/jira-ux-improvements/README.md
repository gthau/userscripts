# Harnesses for the Jira UX toolbar

```
node test/jira-ux-improvements/run.mjs           # all of them, one total
node test/jira-ux-improvements/anchor-smoke.mjs  # or any one, on its own
```

**55 checks across three files. No framework, no `package.json`, no dependencies
to install.** Node 20.11 or later, for `import.meta.dirname`. The exit code of
`run.mjs` is the number of failing files, so a hook or a CI step needs no output
parsing.

Unlike the Jira Cart's harnesses, **these three drive a real browser**, and one of
them downloads React the first time it runs.

## Why a browser, when the Cart's harnesses need none

Because none of these questions has an answer in Node.

The first is what React does when it hydrates a page that has a foreign node in
its container. jsdom has no hydration; a harness written against it would pass
whatever the script did. The second is where CSS anchor positioning puts the
toolbar. Nothing in Node computes a box.

The third question is the ladder: which rung fits the room left after the
breadcrumbs. The script answers it by building each rung and reading its box, so
a harness that cannot compute a box cannot check it either.

The first two questions came from one bug. The toolbar used to be prepended into
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
| `anchor-smoke.mjs` | 21 | The position. Lets the script inject its own stylesheet and build its own toolbar, then measures the two rectangles: the toolbar sits on the breadcrumbs' line, immediately after they end, at the anchored branch's low z-index. Also the route gate from both sides, and the lock: its icon, its pressed state and the description's outline have to swap together |
| `ladder-smoke.mjs` | 23 | The fold. Runs the script at four header widths and asserts which rung it picks, that the rung fits the room it measured, that less room never buys a wider rung, and that what a fold holds is what its menu lists. Ends on two regressions this feature invited: a shortcut for an action with no button, and a room that shrank with no window resize |

`browser.mjs` is the machinery they share — find a Chrome, run a page, read one
line of JSON back. It is not named `-smoke.mjs`, so `run.mjs` does not run it.

## The one stub

`ladder-smoke` replaces `navigator.clipboard` — and nothing else, in any of the
three files. The real one never settles in a headless `file://` page: no gesture,
no permission, a promise that simply hangs, so the copy feedback never arrives
and the check that waits for it fails for a reason that has nothing to do with
the script. The stub **succeeds**, which is what makes the string the script was
given readable: the harness asserts the folded `Alt+Shift+I` put `ABC-123` on the
clipboard, not merely that something happened.

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
- **One clipboard format, one shortcut, no scrolling.** `ladder-smoke` covers
  `Alt+Shift+I` and the plain-text copy of the key, because that is the pair the
  fold could break. The other three formats — including the two-flavour
  `text/html` write behind the link button — and the two jump actions are still
  untested. A browser could reach them; these files do not.
- **One rung ladder, not one page.** `ladder-smoke` sets the width of the header
  itself. Nothing here proves the same rungs come out against Jira's real header,
  whose right edge is an assumption the script makes (ADR §5, risk 7).
- **Only the anchored branch.** `anchor-smoke` asserts the Chrome it found
  supports anchor positioning, which means the fixed-corner fallback every
  non-Chromium user sees is never measured.
- **One theme.** The dark-mode block is not exercised, and neither is the card's
  surface, border or shadow — only its width, by way of the rung it produces.
- **No frames, so no observer and no animation frames.** This headless Chrome
  paints nothing, and both `ResizeObserver` callbacks and `requestAnimationFrame`
  are delivered in the rendering steps of a frame. Probed and confirmed: neither
  ever runs here. `ladder-smoke` therefore installs its own `ResizeObserver`
  before the script loads, records what the script asks to watch, and reports a
  change on demand. That covers the script's whole side of the contract and none
  of Chrome's — if Chrome stopped delivering to a real observer, these files
  would keep passing. A `MutationObserver` *is* usable, because it is delivered
  on the microtask queue rather than in a frame, and `hydration-smoke` uses one
  to record the toolbar's destruction **as it happens**. It used to read
  `getElementById` on a later timer, which asks "is one there now" — a different
  question, and one the script answers by rebuilding. The moment 0.4.1 added a
  deferred redraw on `document.fonts.ready`, that snapshot started failing five
  runs in six.
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
