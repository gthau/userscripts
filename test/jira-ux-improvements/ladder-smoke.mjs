// WHICH RUNG THE TOOLBAR PICKS, and whether the actions it folded away are still
// reachable.
//
// The breadcrumb line is not a fixed amount of room: a parent chain can be one
// crumb or five, in any window width, beside a sidebar that opens and closes. So
// the toolbar measures the space after the breadcrumbs and draws the widest of
// four rungs that fits, folding a group at a time. That rule has no answer in
// Node -- nothing there computes a box -- so it is measured here, in a browser,
// at four header widths.
//
// The check that matters most is the last one. Folding an action into a menu is
// exactly the way to break its keyboard shortcut: the shortcut used to find a
// button by id and click it, and a folded action has no button. It now goes
// through the same door a click uses, and the feedback lands on the fold that
// holds it. That is asserted here because it is the regression this feature
// invites.
import { source, patch, constant, findChrome, runFixture, reporter, skip, UNANCHOR_ROUTE } from "./browser.mjs";

const chrome = findChrome();
if (!chrome) skip("no Chrome found. Set CHROME=/path/to/chrome to point at one.");

const src = source();
const script = patch(src, UNANCHOR_ROUTE);

// Headless Chrome does not run CSS animations, so the script's `animationstart`
// signal never fires here and the toolbar arrives on the backstop instead.
const REPORT_AT = constant(src, "MOUNT_BACKSTOP_MS") + 1_000;
const GAP = constant(src, "TOOLBAR_GAP");

// The header is given a width, and the breadcrumbs inside it are a fixed string,
// so the room left after them is a number this file controls. Everything sits at
// x = 0 with no page padding, which keeps that number readable: room = width of
// the header, less the width of the crumbs, less the script's own gap.
const fixture = (headerWidth) => `<!doctype html>
<html><head><meta charset="utf-8"><title>[ABC-123] Summary - Jira</title>
<script src="script.js"></script>
<style>
  body { margin: 0; font: 14px system-ui; }
  #jira-issue-header { width: ${headerWidth}px; }
  [data-component-selector="breadcrumbs-wrapper"] { display: inline-flex; height: 24px; align-items: center; }
</style>
</head>
<body><div id="jira-frontend"><div id="jira-issue-header"><div data-component-selector="breadcrumbs-wrapper">Projects / ABC / ABC-123</div></div><h1 data-testid="issue.views.issue-base.foundation.summary.heading">Summary</h1><div data-testid="issue.views.field.rich-text.description"><div class="ak-renderer-document">description body</div></div></div>
<pre id="result">pending</pre>
<script>
setTimeout(function () {
  var bar = document.getElementById("gt-extra-buttons");
  var header = document.getElementById("jira-issue-header");
  var crumbs = document.querySelector('[data-component-selector="breadcrumbs-wrapper"]');
  var room = Math.round(header.getBoundingClientRect().right - crumbs.getBoundingClientRect().right - ${GAP});

  var out = {
    room: room,
    tier: bar.dataset.gtTier,
    width: Math.round(bar.getBoundingClientRect().width),
    ids: [].map.call(bar.querySelectorAll("button"), function (b) { return b.id; }),
    fold: null,
    menuIds: null,
    foldIconBefore: null,
    foldIconAfter: null,
    copied: null,
    menuAfterScroll: null,
  };

  var fold = bar.querySelector("[data-gt-holds]");
  if (!fold) { report(out); return; }
  out.fold = fold.id;
  out.foldIconBefore = fold.firstChild.getAttribute("data-gt-icon");

  // Open the fold and read what it holds.
  fold.click();
  var menu = bar.querySelector(".gt-menu");
  out.menuIds = menu ? [].map.call(menu.querySelectorAll("button"), function (b) { return b.dataset.gtFor; }) : null;

  // A menu item that only scrolls. It changes no state, so nothing about the
  // toolbar would redraw on its own -- and a menu that is not redrawn is a menu
  // still sitting open over the page after the thing it was opened for is done.
  // That is a bug this file watched happen.
  var scroll = menu && menu.querySelector('[data-gt-for="gt-go-top"]');
  if (scroll) {
    scroll.click();
    out.menuAfterScroll = !!bar.querySelector(".gt-menu");
  }

  // The real clipboard never settles in a headless file:// page -- no gesture, no
  // permission, a promise that simply hangs -- so the harness puts one in that
  // does. This is the only thing about the script that is stubbed here, and it is
  // stubbed to SUCCEED, which is what makes the text it was given readable.
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: function (text) { out.copied = text; return Promise.resolve(); },
      write: function () { return Promise.reject(new Error("harness: expected writeText")); },
    },
  });

  // Alt+Shift+I is the copy-the-key shortcut, and at every rung below the top it
  // names an action with no button of its own. A shortcut that never reached the
  // action would leave both the icon and the clipboard alone.
  document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyI", altKey: true, shiftKey: true, bubbles: true }));

  // Sampled on a 0ms timer, which under --virtual-time-budget still runs before
  // the 900ms one that clears the feedback.
  setTimeout(function () {
    var after = document.querySelector("[data-gt-holds]");
    out.foldIconAfter = after ? after.firstChild.getAttribute("data-gt-icon") : null;
    report(out);
  }, 0);

  function report(o) {
    document.getElementById("result").textContent = "RESULT:" + JSON.stringify(o);
  }
}, ${REPORT_AT});
</script>
</body></html>`;

const at = (headerWidth) =>
  runFixture({
    chrome,
    pagePath: "browse/ABC-123",
    html: fixture(headerWidth),
    files: { "script.js": script },
    budgetMs: REPORT_AT + 3_000,
  });

// Four widths, chosen to land one rung apart. If a label ever changes length the
// rungs move, and the sweep printed below is the first place to look.
const wide = at(760);
const medium = at(520);
const narrow = at(420);
const tiny = at(330);
const sweep = [wide, medium, narrow, tiny];

for (const one of sweep) {
  console.log(`     room ${String(one.room).padStart(4)}px -> ${one.tier.padEnd(8)} ${String(one.width).padStart(4)}px wide  ${one.ids.join(" ")}`);
}

// ---------------------------------------------------------------- the room
//
// THE ROOM CHANGES WITHOUT THE WINDOW CHANGING. Dragging Jira's right sidebar is
// the case the user reported: the toolbar sat at the wrong rung for several
// seconds, because 0.4.0 listened for `resize` and nothing else, and the only
// other thing that re-measured was the five-second backstop. Reproduced here at
// a full five seconds before this harness existed.
//
// THE OBSERVER IS STUBBED, and it has to be: neither ResizeObserver callbacks
// nor animation frames are ever delivered in this headless Chrome, because both
// run in the rendering steps of a frame and no frame is ever painted. The stub
// records what the script asked to watch and hands back a way to report a
// change, which is exactly the contract the real one has. What that leaves
// untested is Chrome's own delivery -- see the README.
const observerFixture = `<!doctype html>
<html><head><meta charset="utf-8"><title>[ABC-123] Summary - Jira</title>
<script>
  // Installed BEFORE the script, so the script takes this one.
  window.__observed = [];
  window.__fire = null;
  window.ResizeObserver = function (callback) {
    window.__fire = function () { callback([], this); };
    this.observe = function (node) { window.__observed.push(node.id || node.dataset.componentSelector || node.nodeName); };
    this.unobserve = function (node) { window.__observed = window.__observed.filter(function (n) { return n !== (node.id || node.dataset.componentSelector || node.nodeName); }); };
    this.disconnect = function () { window.__observed = []; };
  };
</script>
<script src="script.js"></script>
<style>
  body { margin: 0; font: 14px system-ui; }
  #jira-issue-header { width: 760px; }
  [data-component-selector="breadcrumbs-wrapper"] { display: inline-flex; height: 24px; align-items: center; }
</style>
</head>
<body><div id="jira-frontend"><div id="jira-issue-header"><div data-component-selector="breadcrumbs-wrapper">Projects / ABC / ABC-123</div></div><h1 data-testid="issue.views.issue-base.foundation.summary.heading">Summary</h1><div data-testid="issue.views.field.rich-text.description"><div class="ak-renderer-document">body</div></div></div>
<pre id="result">pending</pre>
<script>
setTimeout(function () {
  var bar = document.getElementById("gt-extra-buttons");
  var out = {
    watching: window.__observed.slice(),
    before: bar.dataset.gtTier,
    afterShrink: null,
    afterReport: null,
    rewatched: null,
  };

  // The sidebar drag: the header loses room, the window does not change, and
  // nothing has told the script yet.
  document.getElementById("jira-issue-header").style.width = "330px";

  setTimeout(function () {
    out.afterShrink = document.getElementById("gt-extra-buttons").dataset.gtTier;

    // What Chrome would have delivered on its own.
    window.__fire();

    setTimeout(function () {
      out.afterReport = document.getElementById("gt-extra-buttons").dataset.gtTier;

      // React replaces the header. An observer left on the old node reports
      // nothing, so the script has to notice and move.
      var old = document.getElementById("jira-issue-header");
      var fresh = old.cloneNode(true);
      old.replaceWith(fresh);
      window.__observed = [];
      window.__fire();

      setTimeout(function () {
        out.rewatched = window.__observed.slice();
        document.getElementById("result").textContent = "RESULT:" + JSON.stringify(out);
      }, 30);
    }, 30);
  }, 30);
}, ${REPORT_AT});
</script>
</body></html>`;

const room = runFixture({
  chrome,
  pagePath: "browse/ABC-123",
  html: observerFixture,
  files: { "script.js": script },
  budgetMs: REPORT_AT + 3_000,
});

console.log(`     watching ${JSON.stringify(room.watching)}`);
console.log(`     ${room.before} -> shrink -> ${room.afterShrink} -> observer reports -> ${room.afterReport}`);

const { is, done } = reporter();

is("the script watches the two boxes its measurement reads", room.watching.sort(), [
  "breadcrumbs-wrapper",
  "jira-issue-header",
]);
is("a room that shrank with no window resize is not noticed on its own", room.afterShrink, "full");
is("and the observer's report is what folds it, without waiting for the backstop", room.afterReport, "minimal");
is("a replaced header is watched again, not the detached one", room.rewatched.sort(), [
  "breadcrumbs-wrapper",
  "jira-issue-header",
]);



// THE PROMISE, at every width: what is drawn fits the room that was measured.
// The last rung is the floor -- below it there is nothing left to fold -- so it
// is the one width allowed to overflow.
is(
  "every rung it picks fits the room it measured",
  sweep.every((one) => one.width <= one.room || one.tier === "minimal"),
  true,
);

const ORDER = ["full", "tight", "compact", "minimal"];
is(
  "and less room never buys a wider rung",
  sweep.every((one, i) => i === 0 || ORDER.indexOf(one.tier) >= ORDER.indexOf(sweep[i - 1].tier)),
  true,
);

is("a line with room shows all eight actions", wide.tier, "full");
is("with no fold on it at all", wide.fold, null);

is("a shorter line folds the four copy formats into one control", medium.tier, "tight");
is("which is the copy fold", medium.fold, "gt-copy-menu");
is("and the copy buttons are gone from the line", medium.ids.includes("gt-copy-name"), false);
is("the two jumps keep their labels at this rung", medium.ids.includes("gt-jump-description"), true);
is("opening the fold lists exactly the four it holds", medium.menuIds, [
  "gt-copy-name",
  "gt-copy-name-url",
  "gt-copy-link",
  "gt-copy-key",
]);

is("a shorter line still keeps the jumps, without their labels", narrow.ids.includes("gt-jump-description"), true);

is("the narrowest line keeps the two toggles and folds the rest", tiny.tier, "minimal");
is("so three controls are left", tiny.ids, ["gt-toggle-lock", "gt-toggle-collapse", "gt-more-menu"]);
is("and the one fold holds all six of the folded actions", tiny.menuIds, [
  "gt-copy-name",
  "gt-copy-name-url",
  "gt-copy-link",
  "gt-copy-key",
  "gt-jump-description",
  "gt-go-top",
]);

// The regression this feature invites, from both rungs that can produce it. The
// old shortcut path looked a button up by id and clicked it; a folded action has
// no button, so this is the check that would have caught it.
is("a shortcut reaches an action the rung folded away", medium.copied, "ABC-123");
is("and it reports back on the fold that holds it", medium.foldIconAfter, "check");
is("which is a change from the icon the fold had", medium.foldIconBefore !== medium.foldIconAfter, true);
is("an action that only scrolls still closes the menu it came from", tiny.menuAfterScroll, false);

is("the same from the overflow fold", tiny.copied, "ABC-123");
is("reporting on that fold in turn", tiny.foldIconAfter, "check");

done();
