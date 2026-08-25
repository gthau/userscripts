// The ninth view: Rovo search, `/jira/rovo-search`. Run it on its own with
//
//     node test/jira-cart/rovo-smoke.mjs
//
// WHY THIS ONE IS A WHOLE-DOM HARNESS while `group-smoke.mjs` stubs `closest` per
// call: the defect that opened this file was the CONTRACT CHECK firing -- "42 issue
// keys are on this page and none of them is inside a known row container" -- and
// nothing but a real tree of elements can answer whether that warning fires. So the
// stub below parses the handful of selector forms the Cart uses, and `scanPage` and
// `checkContract` are run against it unmodified.
//
// EVERY TESTID AND EVERY WIDTH HERE WAS MEASURED, on 2026-08-25, by a console probe
// on the live page -- the same method that found the eighth view. Do not tidy a name
// in this file: it is evidence, and a tidied name is a test that passes against a
// page that does not exist.
//
// The page has TWO issue-link regions, and the whole point of the view is that they
// are not the same:
//
//   * `datasource-table-view` -- the answer card's table. 20 rows, 2 anchors each:
//     an issue-type ICON linking to the issue (NO TEXT) and the key. The summary is
//     a third cell. This is the region that stored a bare key.
//   * `search-page-result` -- the results list. 30 results, 1 anchor each, whose
//     text is `KEY: summary`, so tier 4 already answers it.
//
// 8 keys are in both, which is why 70 anchors carry 42 distinct keys.
import { readFileSync } from "node:fs";

const src = readFileSync(import.meta.dirname + "/../../src/jira-cart.user.js", "utf8");

// NOT the `extract` the other harnesses carry. Theirs starts counting braces at the
// first `{` after the name, and `checkContract({ rows, unexplained })` is a
// DESTRUCTURED PARAMETER: that brace opens and closes in the signature, so the
// count reaches zero there and the "body" comes back as `function checkContract({
// rows, unexplained }` -- which fails as a syntax error one call later, naming
// neither the function nor the cause. So the parameter list is walked first and the
// body only starts after it closes. Worth copying back if another harness ever needs
// a function whose arguments are destructured.
function extract(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`no ${name}`);
  let parens = 0, i = src.indexOf("(", start);
  for (; i < src.length; i++) {
    if (src[i] === "(") parens++;
    else if (src[i] === ")" && --parens === 0) break;
  }
  let depth = 0;
  for (let j = src.indexOf("{", i); j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`unbalanced body for ${name}`);
}
// Reads a `const` out of the script and evaluates it, so no selector is retyped here
// and this file cannot drift from the one it is testing. `deps` carries the constants
// a list names -- SUMMARY_SELECTOR names ISSUE_HEADING, KNOWN_REGION names
// CURRENT_ISSUE -- and the one being declared is never among them, or the generated
// function would redeclare its own parameter.
function constant(name, deps = {}, end = ";") {
  const decl = `const ${name} = `;
  const a = src.indexOf(decl);
  if (a < 0) throw new Error(`no ${name}`);
  const text = src.slice(a, src.indexOf(end, a) + end.length);
  const keys = Object.keys(deps);
  return new Function(...keys, `${text} return ${name};`)(...keys.map((k) => deps[k]));
}

const ISSUE_HEADING = constant("ISSUE_HEADING");
const CURRENT_ISSUE = constant("CURRENT_ISSUE");
const ISSUE_ANCHOR = constant("ISSUE_ANCHOR");
const ISSUE_PATH_RE = constant("ISSUE_PATH_RE");
const SCREEN_READER_KEY = constant("SCREEN_READER_KEY");
const UI_ATTRIBUTE = constant("UI_ATTRIBUTE");
const UI_SELECTOR = `[${UI_ATTRIBUTE}]`;
const UNEXPLAINED_KEYS_LIMIT = constant("UNEXPLAINED_KEYS_LIMIT");
const ROW_SELECTOR = constant("ROW_SELECTOR", {}, '].join(",");');
const SUMMARY_SELECTOR = constant("SUMMARY_SELECTOR", { ISSUE_HEADING }, '].join(",");');
const KNOWN_REGION = constant("KNOWN_REGION", { CURRENT_ISSUE }, '].join(",");');
const ORIGINS = constant("ORIGINS", { CURRENT_ISSUE }, "];");

// The two names this view added. Held separately so a check can take them BACK OUT
// and prove the warning returns -- otherwise "no warning" might be something else's
// doing.
const TABLE_ROW = '[data-testid*="datasource-table-view--row-"]';
const TABLE_SUMMARY = '[data-testid$="link-datasource-render-type--text"]';
const RESULT_REGION = '[data-testid$="search-page-result"]';
const without = (list, entry) =>
  list.split(",").map((s) => s.trim()).filter((s) => s && s !== entry).join(",");

// --------------------------------------------------------------- the stub DOM

// The matcher answers a tag, a bare attribute, `$=`, `*=`, `^=`, `=`, a class, and a
// comma list. ANYTHING ELSE THROWS: a selector form it cannot parse must not be
// reported as "no match", which would look exactly like a passing test.
class El {
  constructor(tag, attrs = {}, kids = [], text = "") {
    this.tagName = tag.toUpperCase();
    this.attrs = attrs;
    this.children = kids;
    this.ownText = text;
    this.parentElement = null;
    for (const k of kids) k.parentElement = this;
  }
  getAttribute(n) { return n in this.attrs ? this.attrs[n] : null; }
  get textContent() { return this.ownText + this.children.map((k) => k.textContent).join(""); }
  // `w` when the probe measured one, so a width is never inferred from text here.
  getBoundingClientRect() { return { width: this.attrs.w !== undefined ? Number(this.attrs.w) : 0 }; }
  *walk() { for (const k of this.children) { yield k; yield* k.walk(); } }
  matchesOne(sel) {
    if (sel.startsWith(".")) return (this.attrs.class ?? "").split(/\s+/).includes(sel.slice(1));
    const m = sel.match(/^([a-z]*)\[([a-zA-Z-]+)(?:([$*^]?=)"([^"]*)")?\]$/);
    if (!m) throw new Error("the stub cannot parse this selector: " + sel);
    const [, tag, attr, op, want] = m;
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    const got = this.getAttribute(attr);
    if (got === null) return false;
    if (!op) return true;
    if (op === "=") return got === want;
    if (op === "$=") return got.endsWith(want);
    if (op === "*=") return got.includes(want);
    if (op === "^=") return got.startsWith(want);
    throw new Error("the stub cannot parse this operator: " + op);
  }
  matches(sel) {
    return sel.split(",").map((s) => s.trim()).filter(Boolean).some((s) => this.matchesOne(s));
  }
  querySelectorAll(sel) { return [...this.walk()].filter((e) => e.matches(sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  closest(sel) { for (let e = this; e; e = e.parentElement) if (e.matches(sel)) return e; return null; }
}

const ORIGIN = "https://dalet.atlassian.net";
// The row's testid ends with an ARI, not a bare number. Kept verbatim: the trailing
// `issue/<id>` is why the row entry is a substring match with a trailing hyphen.
const ARI = "ari:cloud:jira:9ea8fbd4-e3d8-4caf-95fd-5864563bc06a:issue";

// Every cell is wrapped td > span(tooltip) > div(inline-edit-read-view) > renderer.
// The wrappers are here because `inline-edit-read-view` appears 40 times on the page
// with one key inside each, and it is the nearest thing to a false row on it.
const cell = (n, renderer, extra = []) =>
  new El("td", { "data-testid": `datasource-table-view--cell-${n}` }, [
    new El("span", { "data-testid": "issues-table-cell-tooltip--container", role: "presentation" }, [
      new El("div", { "data-testid": "inline-edit-read-view" }, [renderer]),
    ]),
    ...extra,
  ]);

const tableRow = (id, key, summary) =>
  new El("tr", { "data-testid": `datasource-table-view--row-${ARI}/${id}` }, [
    // THE TRAP. An anchor to the issue carrying an icon and no text, in the cell
    // BEFORE the key, so document order offers it to `groupFor` first.
    cell(0, new El("a", {
      "data-testid": "issue-like-table-type-icon-link",
      href: `${ORIGIN}/browse/${key}`, "aria-label": key, w: 31,
    }, [new El("div", { "data-testid": "link-datasource-render-type--icon" }, [new El("img", { alt: "Epic" })])])),
    cell(1, new El("span", {}, [
      new El("span", { "data-testid": "hover-card-trigger-wrapper", role: "none" }, [
        new El("a", { "data-testid": "link-datasource-render-type--link", href: `${ORIGIN}/browse/${key}`, w: 79 }, [], key),
      ]),
    ])),
    cell(2, new El("span", { "data-testid": "link-datasource-render-type--text" }, [], summary),
      // The label that names the field. Tier 2 cannot use it -- it starts with the
      // value, not the key -- and a check below holds that fact in place.
      [new El("button", { "aria-label": `${summary}, Summary field, edit` })]),
    cell(3, new El("div", { "data-testid": "link-datasource-render-type--user" }, [], "Amir Israel Cohen"),
      [new El("button", { "aria-label": "Amir Israel Cohen, Assignee field, edit" })]),
    cell(4, new El("div", { "data-testid": "link-datasource-render-type--icon-text" }, [], "P0"),
      [new El("button", { "aria-label": "P0, Priority field, edit" })]),
    cell(5, new El("span", { "data-testid": "link-datasource-render-type--status--text" }, [], "Done"),
      [new El("button", { "aria-label": "Done, Status field, edit" })]),
    cell(6, new El("span", { "data-testid": "link-datasource-render-type--datetime" }, [], "Mar 16, 2026, 13:33")),
  ]);

// One anchor, text `KEY: summary`. The inner structure was NOT measured, so nothing
// here may be asserted about testids inside a result -- only about the anchor.
const listResult = (key, summary) =>
  new El("div", { "data-testid": "search-page-result" }, [
    new El("a", { href: `${ORIGIN}/browse/${key}`, w: 265 }, [], `${key}: ${summary}`),
  ]);

const TABLE_KEY = "WEB-29577";
const TABLE_SUM = "GQL Server potential memory leaks";
const LIST_KEY = "RDC-5887";
const LIST_SUM = "Rundown API: Update runtime to Node.JS 22";

// 20 table rows and 30 results, with 8 keys shared, so the totals match the probe:
// 70 anchors, 42 distinct keys.
const SHARED = 8;
const body = new El("body", {}, [
  new El("div", { "data-testid": "search-page-body" }, [
    new El("div", { "data-testid": "jira-nl-to-jql-card-wrapper" }, [
      new El("div", { "data-testid": "issue-like-table-container" }, [
        new El("table", { "data-testid": "datasource-table-view" }, [
          new El("tbody", { "data-testid": "datasource-table-view--body" },
            Array.from({ length: 20 }, (_, i) => tableRow(
              564570 + i,
              i === 0 ? TABLE_KEY : `WEB-${29000 + i}`,
              i === 0 ? TABLE_SUM : `Table summary ${i}`))),
        ]),
      ]),
    ]),
    new El("div", { "data-testid": "search-page-results-list" },
      Array.from({ length: 30 }, (_, i) => i < SHARED
        // The shared keys: the same issue in both regions.
        ? listResult(i === 0 ? TABLE_KEY : `WEB-${29000 + i}`, `Table summary ${i}`)
        : listResult(i === SHARED ? LIST_KEY : `RDC-${5000 + i}`,
                     i === SHARED ? LIST_SUM : `List summary ${i}`))),
  ]),
  // The Cart's own drawer. Its rows hold real issue links, so a scan that fails to
  // skip them counts itself.
  new El("div", { [UI_ATTRIBUTE]: "" }, [
    new El("a", { href: `${ORIGIN}/browse/RDC-9999`, w: 60 }, [], "RDC-9999"),
  ]),
]);

globalThis.document = {
  body,
  querySelectorAll: (s) => body.querySelectorAll(s),
  querySelector: (s) => body.querySelector(s),
  title: "Search - Jira",
};
globalThis.location = {
  pathname: "/jira/rovo-search",
  href: `${ORIGIN}/jira/rovo-search`,
  origin: ORIGIN,
};

// ------------------------------------------------------------- the real code

const NAMES = ["keyFromHref", "cleanText", "stripKeyPrefix", "dropEnterKeyHint",
  "isCurrentIssue", "readSummary", "groupFor", "scanPage", "checkContract", "originOf"];
const ARGS = ["ISSUE_PATH_RE", "ISSUE_ANCHOR", "UI_SELECTOR", "ROW_SELECTOR",
  "SUMMARY_SELECTOR", "KNOWN_REGION", "SCREEN_READER_KEY", "CURRENT_ISSUE",
  "ISSUE_HEADING", "UNEXPLAINED_KEYS_LIMIT", "ORIGINS", "reportBrokenContract"];

// One bundle per selector set, so a check can ask what the code does with an entry
// removed without editing the script.
function load({ rows = ROW_SELECTOR, summaries = SUMMARY_SELECTOR, regions = KNOWN_REGION } = {}) {
  const warnings = [];
  const fns = new Function(...ARGS, `${NAMES.map(extract).join("\n")}
    return {${NAMES.join(",")}};`)(
    ISSUE_PATH_RE, ISSUE_ANCHOR, UI_SELECTOR, rows, summaries, regions,
    SCREEN_READER_KEY, CURRENT_ISSUE, ISSUE_HEADING, UNEXPLAINED_KEYS_LIMIT,
    ORIGINS, (reason) => warnings.push(reason));
  return { ...fns, warnings };
}
const cart = load();

// ------------------------------------------------------------------- checking

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

// ---- 1. the page is the shape the probe measured
const anchors = [...document.querySelectorAll(ISSUE_ANCHOR)].filter((a) => !a.closest(UI_SELECTOR));
is("70 issue anchors outside the Cart's own UI", anchors.length, 70);
is("42 distinct keys", new Set(anchors.map((a) => cart.keyFromHref(a.getAttribute("href")))).size, 42);
is("the Cart's own drawer link is skipped",
   document.querySelectorAll(ISSUE_ANCHOR).length - anchors.length, 1);

// ---- 2. THE REPORTED DEFECT. The warning must not fire on this page.
const scan = cart.scanPage(true);
cart.checkContract(scan);
is("the contract check is silent on rovo search", cart.warnings, []);
is("20 rows are found", scan.rows.size, 20);
is("no key is left unexplained", scan.unexplained.size, 0);
is("the live list holds one entry per key", scan.live.size, 42);

// ---- 3. the silence above is these names doing their job, and the three of them
//         are LAYERED. Taking them away one at a time says what each one buys.
const CELL_REGION = '[data-testid*="datasource-table-view--cell-"]';

// The row name rots, and nothing is reported: that is exactly what the cell entry in
// KNOWN_REGION was added for. The Cart loses the summary and keeps quiet, which is
// principle 4 -- a rotted testid must cost a summary, not raise a false alarm.
const noRow = load({ rows: without(ROW_SELECTOR, TABLE_ROW) });
const scanNoRow = noRow.scanPage(false);
noRow.checkContract(scanNoRow);
is("with the row name rotted, no row is found", scanNoRow.rows.size, 0);
is("and the cell region keeps the check quiet anyway", noRow.warnings, []);

// Both names for the table gone, and now it is reported. 20 keys, because the 30
// results are still explained by their own region.
const noTable = load({
  rows: without(ROW_SELECTOR, TABLE_ROW),
  regions: without(KNOWN_REGION, CELL_REGION),
});
noTable.checkContract(noTable.scanPage(false));
is("with the row and its fallback both gone, the table is reported",
   noTable.warnings[0],
   "20 issue keys are on this page and none of them is inside a known row container");

// And with none of the three, THIS IS THE WARNING THAT OPENED THIS FILE, to the
// number the user read off the page on 2026-08-25.
const bare = load({
  rows: without(ROW_SELECTOR, TABLE_ROW),
  regions: without(without(KNOWN_REGION, CELL_REGION), RESULT_REGION),
});
bare.checkContract(bare.scanPage(false));
is("with none of the three names, the reported defect reproduces exactly",
   bare.warnings[0],
   "42 issue keys are on this page and none of them is inside a known row container");

// ---- 4. the table's summary. Tier 1, and only because the summary field is named.
const tableRowEl = document.querySelector(TABLE_ROW);
const icon = tableRowEl.querySelector('[data-testid="issue-like-table-type-icon-link"]');
const keyLink = tableRowEl.querySelector('[data-testid="link-datasource-render-type--link"]');
is("the table row holds exactly two anchors to one issue",
   tableRowEl.querySelectorAll(ISSUE_ANCHOR).length, 2);
is("hovering the key reads the summary, tier 1",
   cart.readSummary(keyLink, TABLE_KEY), { summary: TABLE_SUM, tier: 1 });
is("hovering the icon reads it too",
   cart.readSummary(icon, TABLE_KEY), { summary: TABLE_SUM, tier: 1 });

// The row on its own bought nothing: this is the check that keeps the two entries
// together. Remove the summary field and the item is bare again, which is exactly
// what the live press reported on 2026-08-25.
const noSummary = load({ summaries: without(SUMMARY_SELECTOR, TABLE_SUMMARY) });
is("with the row but no summary field, the key is stored on its own",
   noSummary.readSummary(keyLink, TABLE_KEY), { summary: "", tier: 0 });

// ---- 5. the summary name must pick one cell out of seven
const cellNames = [...tableRowEl.querySelectorAll("[data-testid]")]
  .map((e) => e.getAttribute("data-testid"))
  .filter((t) => t.startsWith("link-datasource-render-type"));
is("only the text cell looks like a summary",
   cellNames.filter((t) => t.endsWith("link-datasource-render-type--text")),
   ["link-datasource-render-type--text"]);
is("the priority, status and date cells are not summaries",
   [...tableRowEl.querySelectorAll(SUMMARY_SELECTOR)].length, 1);

// ---- 6. tier 2 must not be reachable here, which is why the field-naming
//         aria-labels are no help. They start with the VALUE, not the key.
const labels = [tableRowEl, ...tableRowEl.querySelectorAll("[aria-label]")]
  .map((e) => e.getAttribute("aria-label")).filter(Boolean);
is("five aria-labels in the row", labels.length, 5);
is("only the icon's label starts with the key",
   labels.filter((l) => l.toUpperCase().startsWith(TABLE_KEY)), [TABLE_KEY]);
is("and it strips to nothing, so tier 2 cannot answer",
   cart.stripKeyPrefix(TABLE_KEY, TABLE_KEY), "");

// ---- 7. THE GROUPING TRAP. The icon anchor has no text, and an empty string
//         strips to an empty string, so document order offered it the rail.
let g = cart.groupFor(keyLink, TABLE_KEY);
is("hovering the key parks the rail beside the key", g.place === keyLink, true);
g = cart.groupFor(icon, TABLE_KEY);
is("hovering the icon parks the rail beside the key too", g.place === keyLink, true);
is("never beside the icon, which says nothing at all", g.place === icon, false);
is("and it reads the widest anchor", g.read === keyLink, true);

// ---- 8. the results list. Tier 4 already answered it, and must go on doing so.
const resultAnchor = [...document.querySelectorAll(ISSUE_ANCHOR)]
  .find((a) => cart.keyFromHref(a.getAttribute("href")) === LIST_KEY);
is("a result holds one anchor", document.querySelectorAll(RESULT_REGION)[SHARED]
   .querySelectorAll(ISSUE_ANCHOR).length, 1);
is("the results list stays on tier 4",
   cart.readSummary(resultAnchor, LIST_KEY), { summary: LIST_SUM, tier: 4 });
is("a result is a known region, not a row", resultAnchor.closest(ROW_SELECTOR), null);
is("but it is explained", !!resultAnchor.closest(KNOWN_REGION), true);
g = cart.groupFor(resultAnchor, LIST_KEY);
is("with no row the anchor is both answers", g.place === resultAnchor && g.read === resultAnchor, true);

// ---- 8b. the drawer's origin label. Both regions read "search", and the label
//          reaches the page even where the row name does not.
is("the table's rows are labelled", cart.originOf(keyLink), "search");
is("the results list is labelled the same", cart.originOf(resultAnchor), "search");
is("and the icon anchor agrees", cart.originOf(icon), "search");
// The label names the whole view, so it survives both row names rotting -- which is
// the property `sr-timeline` was given for, and the reason it is safe to be this
// wide HERE and not in KNOWN_REGION.
const rotted = load({
  rows: without(ROW_SELECTOR, TABLE_ROW),
  regions: without(KNOWN_REGION, RESULT_REGION),
});
is("the label survives the row name rotting", rotted.originOf(keyLink), "search");

// ---- 9. the selector shapes, against the names the probe printed. These are the
//         traps a shorter or longer match would fall into.
const rowMatches = (t) => new El("div", { "data-testid": t }).matches(ROW_SELECTOR);
const regionMatches = (t) => new El("div", { "data-testid": t }).matches(KNOWN_REGION);
is("the table's row matches", rowMatches(`datasource-table-view--row-${ARI}/564570`), true);
is("its body does not", rowMatches("datasource-table-view--body"), false);
is("the table itself does not", rowMatches("datasource-table-view"), false);
is("a cell does not", rowMatches("datasource-table-view--cell-2"), false);
is("`inline-edit-read-view` is not a row, though it holds one key",
   rowMatches("inline-edit-read-view"), false);
is("nor is the tooltip wrapper", rowMatches("issues-table-cell-tooltip--container"), false);
is("nor the hover-card wrapper", rowMatches("hover-card-trigger-wrapper"), false);
// The `$=` on the region entry is what keeps the LIST out. `*=` would match it,
// because "search-page-results-list" contains "search-page-result".
is("a result is a region", regionMatches("search-page-result"), true);
is("THE LIST AROUND THEM IS NOT -- this is why the entry is `$=` and not `*=`",
   regionMatches("search-page-results-list"), false);
// The container ORIGINS uses for its label. A label this wide is cosmetic; a region
// this wide would tell the check every key on the page is explained for ever.
is("and neither is the page body, which would silence the check for ever",
   regionMatches("search-page-body"), false);
is("a cell stays a region, for the day the row name rots",
   regionMatches("datasource-table-view--cell-0"), true);

// ---- 10. the eight views that were already working are untouched by all of it
for (const [testid, want] of [
  ["software.card-list.card.content-container.RDC-1", true],
  ["platform.board-kit.ui.card.card", true],
  ["native-issue-table.ui.issue-row", true],
  ["scope.issues.issue.row", true],
  ["issue-line-card.card-container", true],
  ["roadmap.timeline-table.components.list-item.container-576933", true],
  ["roadmap.timeline-table.components.list-item.expand-button.container-576933", false],
]) is(`the earlier views still match: ${testid.slice(-44)}`, rowMatches(testid), want);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
