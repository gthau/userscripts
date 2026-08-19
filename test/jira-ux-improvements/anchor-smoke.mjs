// WHERE THE TOOLBAR LANDS, measured rather than argued about.
//
// The toolbar is a child of <body> and the breadcrumbs are deep inside Jira's own
// tree, which sounds like it should put the two of them nowhere near each other.
// CSS anchor positioning is what makes that fine: it needs the breadcrumbs to
// carry the anchor name, and it does not care who the toolbar's parent is. That
// claim is the reason the mount could be moved out of React's root at all, so it
// is worth a measurement and not a paragraph.
//
// This harness runs the real script, lets it inject its own stylesheet and build
// its own toolbar, and then reads the two rectangles off the page. Nothing about
// the CSS is copied here -- a copy would keep passing after the sheet changed.
//
// It needs no React and no network, so it is the one that still runs when the
// hydration harness has to skip. Committed since 0.3.3; see the README beside
// this file.
import { source, patch, constant, findChrome, runFixture, reporter, skip, UNANCHOR_ROUTE } from "./browser.mjs";

const chrome = findChrome();
if (!chrome) skip("no Chrome found. Set CHROME=/path/to/chrome to point at one.");

const src = source();
const script = patch(src, UNANCHOR_ROUTE);

// Headless Chrome does not run CSS animations, so the script's `animationstart`
// signal never fires here and the toolbar arrives on the backstop instead. Same
// toolbar, one tick later.
const REPORT_AT = constant(src, "MOUNT_BACKSTOP_MS") + 1_000;

const fixture = `<!doctype html>
<html><head><meta charset="utf-8"><title>[ABC-123] Summary - Jira</title>
<script src="script.js"></script>
<style>
  body { margin: 0; font: 14px system-ui; }
  /* Jira's global navigation band, which is the thing the fixed-corner fallback
     has to stay clear of. */
  #nav { height: 56px; background: #0052cc; }
  #jira-frontend { padding: 16px; }
  [data-component-selector="breadcrumbs-wrapper"] { display: inline-flex; height: 24px; align-items: center; }
</style>
</head>
<body><div id="nav"></div><div id="jira-frontend"><div id="jira-issue-header"><div data-component-selector="breadcrumbs-wrapper">Projects / ABC / ABC-123</div></div><h1 data-testid="issue.views.issue-base.foundation.summary.heading">Summary</h1><div data-testid="issue.views.field.rich-text.description"><div class="ak-renderer-document">description body</div></div></div>
<pre id="result">pending</pre>
<script>
setTimeout(function () {
  var bar = document.getElementById("gt-extra-buttons");
  var crumbsNode = document.querySelector('[data-component-selector="breadcrumbs-wrapper"]');
  var crumbs = crumbsNode.getBoundingClientRect();
  var rect = bar ? bar.getBoundingClientRect() : null;
  var style = bar ? getComputedStyle(bar) : null;
  var doc = document.querySelector(".ak-renderer-document");

  document.getElementById("result").textContent = "RESULT:" + JSON.stringify({
    anchorSupported: CSS.supports("anchor-name", "--gt-breadcrumbs"),
    toolbarBuilt: !!bar,
    toolbarParent: bar && bar.parentNode ? (bar.parentNode.id || bar.parentNode.nodeName) : null,
    insideJiraFrontend: !!bar && document.getElementById("jira-frontend").contains(bar),
    buttons: bar ? bar.children.length : 0,
    position: style ? style.position : null,
    zIndex: style ? style.zIndex : null,
    // Positive means the toolbar sits below the middle of the breadcrumbs.
    centreOffset: rect ? Math.round((rect.top + rect.height / 2) - (crumbs.top + crumbs.height / 2)) : null,
    // Positive means a gap between the end of the breadcrumbs and the toolbar.
    leftGap: rect ? Math.round(rect.left - crumbs.right) : null,
    onScreen: rect ? rect.top >= 0 && rect.left >= 0 && rect.width > 0 : null,
    // The lock and the collapse are stylesheet rules keyed off <html>, not inline
    // styles, which is what lets them survive React remounting the description.
    htmlLocked: document.documentElement.dataset.gtJiraLocked,
    descriptionOutline: doc ? getComputedStyle(doc).outlineWidth : null,
  });
}, ${REPORT_AT});
</script>
</body></html>`;

const run = (pagePath) =>
  runFixture({ chrome, pagePath, html: fixture, files: { "script.js": script }, budgetMs: REPORT_AT + 3_000 });

const issue = run("browse/ABC-123");
const board = run("boards/42");

console.log(`     measured: ${JSON.stringify(issue)}`);

const { is, done } = reporter();

is("the toolbar is built on an issue page", issue.toolbarBuilt, true);
is("all eight buttons are on it", issue.buttons, 8);
is("its parent is <body>, not Jira's React root", issue.toolbarParent, "BODY");
is("and it is outside #jira-frontend entirely", issue.insideJiraFrontend, false);

// Chromium is the only engine that has this today, and the script's `@supports`
// block is written so that everyone else gets the fixed corner instead. If this
// check ever fails, the two below are measuring the fallback and their answer
// means nothing -- which is why it is asserted rather than branched on.
is("this Chrome has anchor positioning, so the rules below are the ones under test", issue.anchorSupported, true);
is("the toolbar sits on the breadcrumbs' own line", Math.abs(issue.centreOffset) <= 3, true);
is("and immediately after where they end", Math.abs(issue.leftGap) <= 3, true);
is("it is on screen, not parked at the document origin", issue.onScreen, true);
is("anchored, so absolutely positioned", issue.position, "absolute");
// Not the 9999 of the fixed corner: beside the breadcrumbs the toolbar must stay
// under anything of Jira's that paints over the page.
is("at the low z-index the anchored branch asks for", issue.zIndex, "1");

is("every issue starts locked", issue.htmlLocked, "true");
is("and the lock is a real outline on the description", issue.descriptionOutline, "1px");

// The route gate, from the other side. Same page, same markup, a path that is not
// an issue: the script still writes its state attributes, and still builds nothing.
is("no toolbar on a page that is not an issue", board.toolbarBuilt, false);
is("though the script is running there all the same", board.htmlLocked, "true");

done();
