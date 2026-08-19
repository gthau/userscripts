// WHERE THE CONTROL LANDS, measured rather than argued about.
//
// The control is a child of <body> and the board header is deep inside Jira's own
// tree. CSS anchor positioning is what makes that fine: it needs the header's last
// child to carry the anchor name, and it does not care who the control's parent
// is. That claim is the reason the mount could be moved out of React's root, so it
// is worth a measurement.
//
// The script injects its own stylesheet and builds its own control here. Nothing
// about the CSS is copied into this file -- a copy would keep passing after the
// sheet changed. It needs no React and no network, so it still runs when the
// hydration harness has to skip. Committed since 0.1.1; see the README beside
// this file.
import { source, constant, findChrome, runFixture, reporter, skip } from "./browser.mjs";

const chrome = findChrome();
if (!chrome) skip("no Chrome found. Set CHROME=/path/to/chrome to point at one.");

const src = source();

// Headless Chrome does not run CSS animations, so the control arrives on the
// script's own backstop rather than on `animationstart`.
const REPORT_AT = constant(src, "MOUNT_BACKSTOP_MS") + 1_000;

const fixture = `<!doctype html>
<html><head><meta charset="utf-8"><title>Backlog - Jira</title>
<script src="script.js"></script>
<style>
  body { margin: 0; font: 14px system-ui; }
  #jira-frontend { padding: 16px; }
  /* The header is a row and its last child is pushed to the right end by an
     automatic margin, which is the empty space the control is aimed at. */
  [data-testid="horizontal-nav-header.ui.board-header.header"] { display: flex; align-items: center; height: 32px; }
  [data-testid="horizontal-nav-header.ui.board-header.header"] > div:last-child { margin-inline-start: auto; }
</style>
</head>
<body><div id="jira-frontend"><div data-testid="horizontal-nav-header.ui.board-header.header"><div>Backlog</div><div class="actions">•••</div></div><div data-testid="software-backlog.card-list.container.1">sprint one</div></div>
<pre id="result">pending</pre>
<script>
setTimeout(function () {
  var control = document.getElementById("gt-backlog-control");
  var anchorNode = document.querySelector('[data-testid="horizontal-nav-header.ui.board-header.header"] > div:last-child');
  var anchor = anchorNode.getBoundingClientRect();
  var rect = control ? control.getBoundingClientRect() : null;
  var style = control ? getComputedStyle(control) : null;

  document.getElementById("result").textContent = "RESULT:" + JSON.stringify({
    anchorSupported: CSS.supports("anchor-name", "--gt-backlog-actions"),
    controlBuilt: !!control,
    controlParent: control && control.parentNode ? (control.parentNode.id || control.parentNode.nodeName) : null,
    insideJiraFrontend: !!control && document.getElementById("jira-frontend").contains(control),
    hasToggle: !!document.getElementById("gt-backlog-toggle"),
    position: style ? style.position : null,
    // Positive means the control sits below the middle of the action group.
    centreOffset: rect ? Math.round((rect.top + rect.height / 2) - (anchor.top + anchor.height / 2)) : null,
    // The control is placed to the LEFT of the actions, with the margin the sheet
    // asks for between them.
    gapToActions: rect ? Math.round(anchor.left - rect.right) : null,
    onScreen: rect ? rect.top >= 0 && rect.left >= 0 && rect.width > 0 : null,
    // The filter is a stylesheet keyed off <html>, written before React has built
    // the list at all.
    htmlFilter: document.documentElement.dataset.gtBacklogFilter,
  });
}, ${REPORT_AT});
</script>
</body></html>`;

const run = (pagePath) =>
  runFixture({ chrome, pagePath, html: fixture, files: { "script.js": src }, budgetMs: REPORT_AT + 3_000 });

const backlog = run("boards/42/backlog");
const board = run("boards/42/board");

console.log(`     measured: ${JSON.stringify(backlog)}`);

const { is, done } = reporter();

is("the control is built on a backlog", backlog.controlBuilt, true);
is("with its toggle on it", backlog.hasToggle, true);
is("its parent is <body>, not Jira's React root", backlog.controlParent, "BODY");
is("and it is outside #jira-frontend entirely", backlog.insideJiraFrontend, false);

// Chromium is the only engine with this today, and the script's `@supports` block
// sends everyone else to the fixed corner. If this fails, the two below are
// measuring the fallback and mean nothing.
is("this Chrome has anchor positioning, so the rules below are the ones under test", backlog.anchorSupported, true);
is("the control sits on the header's own line", Math.abs(backlog.centreOffset) <= 3, true);
is("to the left of the action group, at the margin the sheet asks for", backlog.gapToActions, 6);
is("it is on screen, not parked at the document origin", backlog.onScreen, true);
is("anchored, so absolutely positioned", backlog.position, "absolute");

is("the filter is on for a backlog", backlog.htmlFilter, "on");

// The route gate, from the other side. Same markup, the board rather than the
// backlog: no control, and the filter says so.
is("no control on the board view", board.controlBuilt, false);
is("and the filter is off there", board.htmlFilter, "off");

done();
