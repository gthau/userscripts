// WHERE THE CONTROL MOUNTS. The same question the issue toolbar's harness asks,
// asked again here because the answer was the same mistake.
//
// Jira server-renders the backlog and then hydrates it, and `#jira-frontend` is
// the element it hydrates into. A node put in front of that markup is a mismatch,
// and React's answer is to throw the server tree away and build it again on the
// client: the skeleton returning a second after the backlog was already readable.
//
// It only ever showed on a cold load. Arriving by a soft navigation -- which is
// how anyone actually reaches a backlog -- gets there long after hydration is
// done, when an extra node in the container costs nothing. That is exactly why it
// went unnoticed here while the same bug was obvious on the issue view.
//
// The second run patches the mount back to what it was, so this fixture is known
// to be able to fail. Committed since 0.1.1; see the README beside this file.
import { source, patch, constant, findChrome, react, runFixture, reporter, skip } from "./browser.mjs";

const chrome = findChrome();
if (!chrome) skip("no Chrome found. Set CHROME=/path/to/chrome to point at one.");

const vendor = await react();
if (!vendor) skip("React could not be downloaded and is not cached. This harness needs a network once.");

const src = source();

// Headless Chrome does not run CSS animations, so the `animationstart` the script
// listens for never fires and the control arrives on the script's own backstop
// instead. Same control, one tick later, and still before hydration -- which is
// the ordering this file exists to pin down.
const backstop = constant(src, "MOUNT_BACKSTOP_MS");
const HYDRATE_AT = backstop + 1_000;
// Before the backstop's next tick can rebuild whatever React deleted.
const INSPECT_AT = HYDRATE_AT + 500;
const REPORT_AT = HYDRATE_AT + 7_000;

const HEADER = '<div data-testid="horizontal-nav-header.ui.board-header.header"><div>Backlog</div><div class="actions">•••</div></div>';

const fixture = (build) => `<!doctype html>
<html><head><meta charset="utf-8"><title>Backlog - Jira</title>
<script src="react.js"></script><script src="react-dom.js"></script>
<script src="${build}.js"></script>
</head>
<body><div id="jira-frontend"><div id="app-root">${HEADER}<div data-testid="software-backlog.card-list.container.1">sprint one</div></div></div>
<pre id="result">pending</pre>
<script>
(function () {
  var container = document.getElementById("jira-frontend");
  // A JS property cannot survive the node being rebuilt, so it answers "same node,
  // or a new one?" without trusting anything React reports.
  document.getElementById("app-root").__identity = "server";

  var recovered = [];
  var e = React.createElement;
  function App() {
    return e("div", { id: "app-root" },
      e("div", { "data-testid": "horizontal-nav-header.ui.board-header.header" },
        e("div", null, "Backlog"),
        e("div", { className: "actions" }, "\\u2022\\u2022\\u2022")),
      e("div", { "data-testid": "software-backlog.card-list.container.1" }, "sprint one"));
  }

  setTimeout(function () {
    var control = document.getElementById("gt-backlog-control");
    window.__before = {
      controlBuiltBeforeHydration: !!control,
      controlInsideHydrationContainer: !!control && container.contains(control),
    };
    ReactDOM.hydrateRoot(container, e(App), {
      onRecoverableError: function (err) { recovered.push(String((err && err.message) || err)); },
    });
  }, ${HYDRATE_AT});

  setTimeout(function () {
    window.__after = { controlPresentAfterHydration: !!document.getElementById("gt-backlog-control") };
  }, ${INSPECT_AT});

  setTimeout(function () {
    var now = document.getElementById("app-root");
    var control = document.getElementById("gt-backlog-control");
    document.getElementById("result").textContent = "RESULT:" + JSON.stringify(Object.assign(
      { build: "${build}" },
      window.__before,
      window.__after,
      {
        serverTreeSurvived: !!now && now.__identity === "server",
        controlBackByNow: !!control,
        controlParent: control && control.parentNode ? (control.parentNode.id || control.parentNode.nodeName) : null,
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
    pagePath: "boards/42/backlog",
    html: fixture(build),
    files: { ...vendor, [`${build}.js`]: script },
    budgetMs: REPORT_AT + 3_000,
  });

const { is, done } = reporter();

// ---- 1. THE SCRIPT AS IT SHIPS.
const real = run("real", src);

is("the control is up before Jira hydrates, which is the whole risk", real.controlBuiltBeforeHydration, true);
is("and it is nowhere inside the element React hydrates", real.controlInsideHydrationContainer, false);
is("its parent is <body>", real.controlParent, "BODY");
is("hydration reports nothing to recover from", real.recoverableErrors, 0);
is("the server-rendered backlog is adopted, not rebuilt", real.serverTreeSurvived, true);
is("and the control is untouched by it", real.controlPresentAfterHydration, true);

// ---- 2. THE MOUNT THIS SCRIPT USED TO HAVE. The two edits are the fix, backwards.
const control = run(
  "control",
  patch(src, [
    ["const mount = document.body;", 'const mount = document.getElementById("jira-frontend") ?? document.body;'],
    ["mount.append(control);", "mount.prepend(control);"],
  ]),
);

is("the old mount really does put the control inside the hydration container", control.controlInsideHydrationContainer, true);
is("React calls it a mismatch and gives up on the server markup", control.clientRenderFallback, true);
is("the server-rendered backlog is destroyed and built again", control.serverTreeSurvived, false);
is("the control is destroyed along with it", control.controlPresentAfterHydration, false);
is("and the backstop has it back moments later, hiding what happened", control.controlBackByNow, true);

done();
