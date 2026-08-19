import { readFileSync } from "node:fs";
// THE ONE SEAM BETWEEN THIS HARNESS AND THE CODE. Resolved from this file rather
// than from the working directory, so it runs from anywhere -- and if the Cart ever
// becomes a browser extension, THIS LINE AND THIS LINE ALONE is what has to point at
// the new home of the code.
//
// `import.meta.dirname` and NOT `new URL(..., import.meta.url)`: these harnesses
// shadow globals freely to stand in for a browser, and `format-smoke` already has a
// local `URL`, which puts the real one in the temporal dead zone for the whole
// module and fails at this line with an error that names neither cause.
const src = readFileSync(import.meta.dirname + "/../../src/jira-cart.user.js", "utf8");
function extract(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`no ${name}`);
  let depth = 0;
  for (let j = src.indexOf("{", start); j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
}
// The real ROW_SELECTOR out of the file, so the test cannot drift from it.
const END = '].join(",");';
const rowStart = src.indexOf("const ROW_SELECTOR = [");
const rowEnd = src.indexOf(END, rowStart) + END.length;
const ROW_SELECTOR = new Function(src.slice(rowStart, rowEnd) + " return ROW_SELECTOR;")();
const headingStart = src.indexOf("const ISSUE_HEADING = ");
const ISSUE_HEADING = new Function(src.slice(headingStart, src.indexOf(";", headingStart) + 1) + " return ISSUE_HEADING;")();
const summaryStart = src.indexOf("const SUMMARY_SELECTOR = [");
const summaryEnd = src.indexOf(END, summaryStart) + END.length;
const SUMMARY_SELECTOR = new Function("ISSUE_HEADING", src.slice(summaryStart, summaryEnd) + " return SUMMARY_SELECTOR;")(ISSUE_HEADING);
const regionStart = src.indexOf("const KNOWN_REGION = [");
const regionEnd = src.indexOf(END, regionStart) + END.length;
const CURRENT_ISSUE = '[data-testid$="breadcrumb-current-issue-container"]';
const KNOWN_REGION = new Function("CURRENT_ISSUE", src.slice(regionStart, regionEnd) + " return KNOWN_REGION;")(CURRENT_ISSUE);

const names = ["keyFromHref", "cleanText", "stripKeyPrefix", "groupFor"];
const ISSUE_PATH_RE = /^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/;
const ISSUE_ANCHOR = 'a[href*="/browse/"]';
const location = { href: "https://dalet.atlassian.net/browse/RDC-1" };
const f = new Function("ISSUE_PATH_RE","ISSUE_ANCHOR","ROW_SELECTOR","location",
  `${names.map(extract).join("\n")}; return {${names.join(",")}};`)(ISSUE_PATH_RE, ISSUE_ANCHOR, ROW_SELECTOR, location);

// A row is anything the real ROW_SELECTOR would match; the stub only has to
// answer the three calls groupFor makes.
function makeRow(specs) {
  const row = { querySelectorAll: () => anchors };
  const anchors = specs.map(([href, text, width]) => ({
    label: text.slice(0, 18),
    textContent: text,
    getAttribute: (name) => (name === "href" ? href : null),
    getBoundingClientRect: () => ({ width }),
    closest: (sel) => (sel === ROW_SELECTOR ? row : null),
  }));
  return anchors;
}
function loose(spec) {
  const [href, text, width] = spec;
  return {
    label: text.slice(0, 18),
    textContent: text,
    getAttribute: (name) => (name === "href" ? href : null),
    getBoundingClientRect: () => ({ width }),
    closest: () => null,
  };
}

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${got}\n  want ${want}`); }
  else console.log(`ok   ${label}`);
};

// Child work items: native-issue-table.ui.issue-row, key 68px and summary 430px
let a = makeRow([
  ["/browse/RDC-1894", "RDC-1894", 68],
  ["/browse/RDC-1894", "Add creation/modification information to Rundowns", 430],
]);
let g = f.groupFor(a[0], "RDC-1894");
is("child items, hovering the key -> button beside the key", g.place.label, "RDC-1894");
is("child items, hovering the key -> summary read from the wide anchor", g.read.label, "Add creation/modif");
g = f.groupFor(a[1], "RDC-1894");
is("child items, hovering the summary -> button beside the key", g.place.label, "RDC-1894");
is("child items, hovering the summary -> reads the wide anchor", g.read.label, "Add creation/modif");

// Linked work items: the same shape, now that its card is a row
a = makeRow([
  ["/browse/RDC-15602", "RDC-15602", 76],
  ["/browse/RDC-15602", "[Frontend] Modify Program toolbar", 199],
]);
g = f.groupFor(a[1], "RDC-15602");
is("linked items -> button beside the key", g.place.label, "RDC-15602");
is("linked items -> reads the summary anchor", g.read.label, "[Frontend] Modify ");

// The backlog: the visible key, and a screen-reader twin holding key AND summary
a = makeRow([
  ["/browse/RDC-1", "RDC-1", 60],
  ["/browse/RDC-1", "RDC-1 Outline inside the edited field", 1],
]);
g = f.groupFor(a[1], "RDC-1");
is("backlog, hovering the twin -> button beside the visible key", g.place.label, "RDC-1");
is("backlog -> reads the widest, which is the visible key", g.read.getBoundingClientRect().width, 60);

// The timeline: one anchor, whose text carries the screen-reader tail
a = makeRow([["/browse/RDC-21069", "RDC-21069, (opens new window)", 70]]);
g = f.groupFor(a[0], "RDC-21069");
is("timeline -> the only anchor is both answers", g.place === g.read && g.place === a[0], true);

// Two different issues in one row: the other key is not in this group
a = makeRow([
  ["/browse/RDC-1", "RDC-1", 60],
  ["/browse/RDC-2", "A much wider summary for another issue", 400],
]);
g = f.groupFor(a[0], "RDC-1");
is("a foreign key never joins the group", g.read.label, "RDC-1");

// No row: prose. No group, and the hovered anchor is both answers.
const prose = loose(["/browse/RDC-1377", "RDC-1377: Rundown - Full Day Pattern", 593]);
g = f.groupFor(prose, "RDC-1377");
is("prose -> no group", g.place === prose && g.read === prose, true);

// The selector strings, against the raw testids the 2026-08-18 probe printed.
// The stubs above answer `closest` without parsing CSS, so this is what proves
// the four names actually match the page.
const TESTIDS = [
  ["native-issue-table.ui.issue-row", true],
  ["issue-line-card.card-container", true],
  ["issue.issue-view.views.common.issue-line-card.issue-line-card-view.summary", false],
  ["issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container", false],
];
const matches = (selector, testid) => {
  const suffix = selector.match(/\[data-testid\$="([^"]+)"\]/);
  if (suffix) return testid.endsWith(suffix[1]);
  const part = selector.match(/\[data-testid\*="([^"]+)"\]/);
  if (part) return testid.includes(part[1]);
  const exact = selector.match(/\[data-testid="([^"]+)"\]/);
  if (exact) return testid === exact[1];
  // A class selector, like .ak-renderer-document. It cannot match a testid.
  return false;
};
const rowMatches = (testid) => ROW_SELECTOR.split(",").some((sel) => matches(sel.trim(), testid));
for (const [testid, isRow] of TESTIDS) is(`row selector vs ${testid.slice(-40)}`, rowMatches(testid), isRow);
is("the breadcrumb selector matches the live name",
   matches('[data-testid$="breadcrumb-current-issue-container"]',
           "issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"), true);
is("the name the ADR had matches nothing",
   matches('[data-testid*="breadcrumbs.current-issue"]',
           "issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"), false);

// The Team's Timeline tab, from the live outerHTML of 2026-08-18. Its keys are in
// no row, which is what tripped the contract check; the anchor's own testid is
// what stops the false warning until a probe names the row.
// Every testid below is copied from the live outerHTML the user pasted on
// 2026-08-18, so this block is the evidence that the eighth view's names match.
const ROADMAP_ROW = "roadmap.timeline-table.components.list-item.container-576933";
const ROADMAP_EXPAND = "roadmap.timeline-table.components.list-item.expand-button.container-576933";
const ROADMAP_KEY = "roadmap.timeline-table-kit.ui.list-item-content.summary.key";
const ROADMAP_TITLE = "roadmap.timeline-table-kit.ui.list-item-content.summary.title";
const ROADMAP_ICON = "roadmap.timeline-table-kit.common.ui.summary.icon";
const ROADMAP_PROGRESS = "common.components.progress-bar.progress-wrapper";
const regionMatches = (testid) => KNOWN_REGION.split(",").some((sel) => matches(sel.trim(), testid));
const summaryMatches = (testid) => SUMMARY_SELECTOR.split(",").some((sel) => matches(sel.trim(), testid));

is("the team timeline's row is a row", rowMatches(ROADMAP_ROW), true);
// The trap: a span INSIDE the row carries `...list-item.expand-button.container-N`.
// A shorter match would seize it first and split one row into two groups.
is("its expand button is NOT the row", rowMatches(ROADMAP_EXPAND), false);
is("the key's anchor is not a row either", rowMatches(ROADMAP_KEY), false);
is("tier 1 finds the title", summaryMatches(ROADMAP_TITLE), true);
is("and nothing else in that row looks like a summary",
   [ROADMAP_ROW, ROADMAP_EXPAND, ROADMAP_KEY, ROADMAP_ICON, ROADMAP_PROGRESS].filter(summaryMatches),
   []);
is("the anchor stays a known region, for the day the row name rots", regionMatches(ROADMAP_KEY), true);
is("the Plans timeline row still matches its own name", rowMatches("scope.issues.issue.row"), true);
is("and the new row selector does not swallow the other views",
   ["native-issue-table.ui.issue-row", "issue-line-card.card-container"].every(rowMatches), true);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
