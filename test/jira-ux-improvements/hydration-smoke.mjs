// WHERE THE TOOLBAR MOUNTS, and the reason the answer is not a matter of taste.
//
// Jira server-renders the issue view and then hydrates it: React walks the markup
// that is already on screen and adopts it. `#jira-frontend` is the element it
// hydrates into. A node put in front of that markup is a mismatch, and React's
// answer to a mismatch outside a Suspense boundary is to throw the whole server
// tree away and build it again on the client -- the skeleton coming back a second
// after the issue was readable, and two or three seconds of nothing while it fills
// in again. The toolbar was destroyed on the way past and the backstop rebuilt it,
// which is why the damage did not look like it came from the toolbar at all.
//
// So this harness runs the real script twice: once as it is, and once patched back
// to the mount it used to have. The second run is the one that keeps the first
// honest. If a fixture cannot fail, it is not evidence, and this one is written so
// that the old mount still produces "the entire root will switch to client
// rendering" on demand.
//
// Committed since 0.3.3; see the README beside this file.
import { source, patch, constant, findChrome, react, runFixture, reporter, skip, UNANCHOR_ROUTE } from "./browser.mjs";

const chrome = findChrome();
if (!chrome) skip("no Chrome found. Set CHROME=/path/to/chrome to point at one.");

const vendor = await react();
if (!vendor) skip("React could not be downloaded and is not cached. This harness needs a network once.");

const src = source();

// The script's own backstop is the mount signal here: headless Chrome does not run
// CSS animations, so the `animationstart` the script normally hears never fires.
// That is a property of the harness, not of the script -- and the backstop is the
// same path a real browser takes when page CSS beats the animation, so the toolbar
// still arrives before hydration, which is the ordering this file is about.
const backstop = constant(src, "MOUNT_BACKSTOP_MS");
const HYDRATE_AT = backstop + 1_000;
// Straight after hydration, and before the backstop's next tick can rebuild what
// React deleted. That gap is the whole reason this bug was hard to see from the
// outside: the toolbar is always back by the time anyone looks.
const INSPECT_AT = HYDRATE_AT + 500;
const REPORT_AT = HYDRATE_AT + 7_000;

const fixture = (build) => `<!doctype html>
<html><head><meta charset="utf-8"><title>[ABC-123] Summary - Jira</title>
<script src="react.js"></script><script src="react-dom.js"></script>
<script src="${build}.js"></script>
</head>
<body><div id="jira-frontend"><div id="app-root"><div id="jira-issue-header"><div data-component-selector="breadcrumbs-wrapper">Projects / ABC / ABC-123</div></div><h1 data-testid="issue.views.issue-base.foundation.summary.heading">Summary</h1><div data-testid="issue.views.field.rich-text.description"><div class="ak-renderer-document">description body</div></div></div></div>
<pre id="result">pending</pre>
<script>
(function () {
  var container = document.getElementById("jira-frontend");
  // A JS property, not an attribute: it cannot survive the node being thrown away
  // and rebuilt, so it answers "same node, or a new one?" without having to trust
  // anything React reports.
  document.getElementById("app-root").__identity = "server";

  var recovered = [];
  var e = React.createElement;
  // Exactly the markup above, which is what makes the server render and the client
  // render agree -- until something else is in the container.
  function App() {
    return e("div", { id: "app-root" },
      e("div", { id: "jira-issue-header" },
        e("div", { "data-component-selector": "breadcrumbs-wrapper" }, "Projects / ABC / ABC-123")),
      e("h1", { "data-testid": "issue.views.issue-base.foundation.summary.heading" }, "Summary"),
      e("div", { "data-testid": "issue.views.field.rich-text.description" },
        e("div", { className: "ak-renderer-document" }, "description body")));
  }

  // Hydration comes a beat after parsing, the way Jira's does: the server markup is
  // on screen and readable first, and the script has already mounted by then.
  setTimeout(function () {
    var bar = document.getElementById("gt-extra-buttons");
    window.__before = {
      toolbarBuiltBeforeHydration: !!bar,
      toolbarInsideHydrationContainer: !!bar && container.contains(bar),
    };
    ReactDOM.hydrateRoot(container, e(App), {
      onRecoverableError: function (err) { recovered.push(String((err && err.message) || err)); },
    });
  }, ${HYDRATE_AT});

  setTimeout(function () {
    window.__after = { toolbarPresentAfterHydration: !!document.getElementById("gt-extra-buttons") };
  }, ${INSPECT_AT});

  setTimeout(function () {
    var now = document.getElementById("app-root");
    var bar = document.getElementById("gt-extra-buttons");
    document.getElementById("result").textContent = "RESULT:" + JSON.stringify(Object.assign(
      { build: "${build}" },
      window.__before,
      window.__after,
      {
        serverTreeSurvived: !!now && now.__identity === "server",
        toolbarBackByNow: !!bar,
        toolbarParent: bar && bar.parentNode ? (bar.parentNode.id || bar.parentNode.nodeName) : null,
        clientRenderFallback: recovered.some(function (m) { return /switch to client rendering/.test(m); }),
        recoverableErrors: recovered.length,
      }));
  }, ${REPORT_AT});
})();
</script>
</body></html>`;

const run = (build, script) =>
  runFixture({
    chrome,
    pagePath: "browse/ABC-123",
    html: fixture(build),
    files: { ...vendor, [`${build}.js`]: script },
    budgetMs: REPORT_AT + 3_000,
  });

const { is, done } = reporter();

// ---- 1. THE SCRIPT AS IT SHIPS.
const real = run("real", patch(src, UNANCHOR_ROUTE));

is("the toolbar is up before Jira hydrates, which is the whole risk", real.toolbarBuiltBeforeHydration, true);
is("and it is nowhere inside the element React hydrates", real.toolbarInsideHydrationContainer, false);
is("its parent is <body>", real.toolbarParent, "BODY");
is("hydration reports nothing to recover from", real.recoverableErrors, 0);
is("the server-rendered page is adopted, not rebuilt", real.serverTreeSurvived, true);
is("and the toolbar is untouched by it", real.toolbarPresentAfterHydration, true);

// ---- 2. THE MOUNT THIS SCRIPT USED TO HAVE, so the fixture above is known to be
// capable of failing. The two edits are the fix, backwards.
const control = run(
  "control",
  patch(src, [
    ...UNANCHOR_ROUTE,
    ["const mount = document.body;", 'const mount = document.getElementById("jira-frontend") ?? document.body;'],
    ["mount.append(toolbar);", "mount.prepend(toolbar);"],
  ]),
);

is("the old mount really does put the toolbar inside the hydration container", control.toolbarInsideHydrationContainer, true);
is("React calls it a mismatch and gives up on the server markup", control.clientRenderFallback, true);
is("the server-rendered page is destroyed and built again -- the skeleton the user saw", control.serverTreeSurvived, false);
is("the toolbar is destroyed along with it", control.toolbarPresentAfterHydration, false);
// And this is why the toolbar never looked like the culprit: by the time anyone
// went looking, the script's own backstop had quietly put it back.
is("and the backstop has it back moments later, hiding what happened", control.toolbarBackByNow, true);

done();
