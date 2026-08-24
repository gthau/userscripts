// The copy formats of ADR §2.8 and the response validation of §2.6, both pure and
// both pulled straight out of the script by brace matching, so they cannot drift
// from the file. Committed since 1.0.0; see the README beside this file.
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
  throw new Error(`unbalanced ${name}`);
}
function slice(head, end) {
  const at = src.indexOf(head);
  if (at < 0) throw new Error(`no ${head}`);
  return src.slice(at, src.indexOf(end, at) + end.length);
}

const names = ["issueUrl","escapeHtml","formatLinks","formatNames","formatKeys","formatJql","searchUrl","format",
               "detailBit","detailBits","detailChip","formatDetails","byLabel","reportGroups","formatReport",
               "shapeFor","bulkfetchIssues","readIssues","cleanText","uniqueName","alertLine",
               "clamp","defaultFieldList","enabledFields","moveField"];
// The palette 📋 Details emits. Sliced in from the real file rather than copied,
// because section 12 below asserts things ABOUT these values -- that no ground is
// saturated, that no colour appears without one -- and a copy would let the file
// and the assertions drift apart silently.
const harness = `
  ${slice("const HTML_ESCAPES = {", "\n  };")}
  ${slice("const MUTED_INK =", "\n")}
  ${slice("const LOZENGE = {", "\n  };")}
  ${slice("const PRIORITY_INK =", "\n")}
  ${names.map(extract).join("\n")}
  ${slice("const LINE_SHAPE_IDS = [", "\n  ];")}
  ${slice("const SHAPES = [", "\n  ];")}
  ${slice("const EXPORTS = [", "\n  ];")}
  /* THE CATALOGUE AND THE SHIPPED DEFAULTS, sliced in rather than restated, because
     section 16 below asserts things ABOUT them -- that the two defaults reproduce
     1.1.0 byte for byte, and that every id the catalogue names draws something. A
     copy here would assert that a copy is right. DEFAULT_PREFS is built at load from
     defaultFieldList and SETTINGS_TAB_IDS, so both come with it. */
  ${slice("const FIELD_CATALOGUE = [", "\n  ];")}
  ${slice("const SETTINGS_TABS = [", "\n  ];")}
  ${slice("const SETTINGS_TAB_IDS =", "\n")}
  ${slice("const DEFAULT_PREFS = {", "\n  };")}
  ${slice("const LIST_ITEM_STYLE =", "\n")}
  ${slice("const NO_PRIORITY =", "\n")}
  ${slice("const NO_TEAM =", "\n")}
  ${slice("const TEAM_FIELD =", "\n")}
  ${slice("const SUMMARY_FIELDS =", "\n")}
  ${slice("const DETAIL_FIELDS = [", "\n  ];")}
  return {${names.join(",")}, EXPORTS, SHAPES, LINE_SHAPE_IDS, SUMMARY_FIELDS, DETAIL_FIELDS,
          FIELD_CATALOGUE, SETTINGS_TABS, DEFAULT_PREFS,
          MUTED_INK, LOZENGE, PRIORITY_INK, LIST_ITEM_STYLE,
          NO_PRIORITY, NO_TEAM, TEAM_FIELD};
`;
const SAFE_KEY_RE = /^[A-Z][A-Z0-9]*-\d+$/;
const location = { origin: "https://dalet.atlassian.net" };
/* THE PREFERENCES THE FORMATS READ, and the harness stands in for the STORE rather
   than for the formatters. `format` reads them once per copy and hands the shape and
   the field selection to the builders (§2.8 decision 5, §2.14 decisions 7 and 8), so
   shimming storage here exercises the real path -- the same code that decides what a
   real press gets. The builders stay pure functions of their arguments.

   THE BASE IS `DEFAULT_PREFS` ITSELF, sliced out of the script. That is what makes
   every section written before 1.2.0 a check that THE SHIPPED DEFAULTS still emit
   1.1.0's bytes, rather than a check against a stub that happens to agree with them.
   Nothing below sets a preference except through `withPrefs`, which puts the
   defaults back afterwards. */
let prefsPatch = {};
let shipped = null;
const loadPrefs = () => ({ ...shipped, ...prefsPatch });
const f = new Function("SAFE_KEY_RE", "location", "loadPrefs", harness)(SAFE_KEY_RE, location, loadPrefs);
shipped = f.DEFAULT_PREFS;
const withPrefs = (patch, run) => {
  prefsPatch = patch;
  try { return run(); } finally { prefsPatch = {}; }
};
const asShape = (id, kind, items, scope = "collection") =>
  withPrefs({ lineShape: id }, () => f.format(kind, items, scope));
/* A STORED FIELD LIST IN THE ORDER GIVEN: the named ids ticked, in that order, then
   every other catalogue field appended OFF -- which is the exact shape
   `normaliseFieldList` produces, and the shape a user gets by dragging the fields
   they want to the top and unticking the rest. */
const listOf = (ids) => [
  ...ids.map((id) => ({ id, on: true })),
  ...f.FIELD_CATALOGUE.filter((one) => !ids.includes(one.id)).map((one) => ({ id: one.id, on: false })),
];
const withFields = (key, ids, kind, items, scope = "collection") =>
  withPrefs({ [key]: listOf(ids) }, () => f.format(kind, items, scope));

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

// The ADR's own worked example: three items, and the third has no summary, which
// is the case that decides most of §2.8.
const THREE = [
  { key: "RDC-14817", summary: "Outline inside the edited field", issueId: "1420631" },
  { key: "RDC-23716", summary: "Rundown grid does not refresh after a move" },
  { key: "GLX-402" },
];
const URL = "https://dalet.atlassian.net/browse";

// ---- 1. the four formats at collection scope, byte for byte against the ADR
is("Links text", f.format("links", THREE, "collection").text, [
  `- [RDC-14817](${URL}/RDC-14817) Outline inside the edited field`,
  `- [RDC-23716](${URL}/RDC-23716) Rundown grid does not refresh after a move`,
  `- [GLX-402](${URL}/GLX-402)`,
].join("\n"));
// The <li> carries LIST_ITEM_STYLE since 1.1.0: a bare <li> is unreadable in
// Outlook, and Links' summaries wrap just as Details' do (§2.8, §2.14).
const LI = `<li style="${f.LIST_ITEM_STYLE}">`;
is("Links html", f.format("links", THREE, "collection").html,
  `<ul>${LI}<a href="${URL}/RDC-14817">RDC-14817</a>&nbsp;Outline inside the edited field</li>` +
  `${LI}<a href="${URL}/RDC-23716">RDC-23716</a>&nbsp;Rundown grid does not refresh after a move</li>` +
  `${LI}<a href="${URL}/GLX-402">GLX-402</a></li></ul>`);
is("Names text", f.format("names", THREE, "collection").text, [
  "[RDC-14817] Outline inside the edited field",
  "[RDC-23716] Rundown grid does not refresh after a move",
  "GLX-402",
].join("\n"));
is("Names has no html twin", f.format("names", THREE, "collection").html, undefined);
is("Keys text", f.format("keys", THREE, "collection").text, "RDC-14817, RDC-23716, GLX-402");
is("Keys has no html twin", f.format("keys", THREE, "collection").html, undefined);
is("JQL text", f.format("jql", THREE, "collection").text, "key in (RDC-14817, RDC-23716, GLX-402)");
is("JQL has no html twin", f.format("jql", THREE, "collection").html, undefined);

// ---- 2. the summary-less line of each. The separator goes WITH the summary.
const BARE = [{ key: "GLX-402" }];
is("Links drops the space with the summary", f.format("links", BARE, "collection").text, `- [GLX-402](${URL}/GLX-402)`);
is("Links drops the &nbsp; with the summary", f.format("links", BARE, "collection").html,
  `<ul>${LI}<a href="${URL}/GLX-402">GLX-402</a></li></ul>`);
is("Names drops its brackets", f.format("names", BARE, "collection").text, "GLX-402");
is("no trailing space anywhere", /[ \t]$/m.test(
  ["links","names","keys","jql"].map((k) => f.format(k, THREE, "collection").text).join("\n")), false);

// ---- 3. no format ever drops an item
for (const kind of ["links", "names", "keys", "jql"]) {
  const text = f.format(kind, THREE, "collection").text;
  is(`${kind} carries every key`, THREE.every((i) => text.includes(i.key)), true);
}
is("Links lines equal items", f.format("links", THREE, "collection").text.split("\n").length, 3);
is("Names lines equal items", f.format("names", THREE, "collection").text.split("\n").length, 3);
is("Links <li> count equals items", (f.format("links", THREE, "collection").html.match(/<li /g) || []).length, 3);

// ---- 4. scope decides the bullet, and nothing else
is("selection keeps the bullet", f.format("links", THREE, "selection").text.startsWith("- ["), true);
is("one item gets no bullet", f.format("links", BARE, "item").text, `[GLX-402](${URL}/GLX-402)`);
is("one item gets no <ul> either", f.format("links", BARE, "item").html, `<a href="${URL}/GLX-402">GLX-402</a>`);
is("one item WITH a summary lands on jira-ux's own output", f.format("links", [THREE[0]], "item").html,
  `<a href="${URL}/RDC-14817">RDC-14817</a>&nbsp;Outline inside the edited field`);
is("Names is unaffected by scope", f.format("names", THREE, "item").text, f.format("names", THREE, "collection").text);
is("JQL has NO single-item form", f.format("jql", BARE, "item"), null);
is("JQL still serves a selection", f.format("jql", THREE, "selection").text, "key in (RDC-14817, RDC-23716, GLX-402)");

// ---- 5. a copy of zero items must not write at all
for (const kind of ["links", "names", "keys", "jql"]) {
  is(`${kind} of nothing is null`, f.format(kind, [], "collection"), null);
}
is("an unknown format is null", f.format("csv", THREE, "collection"), null);

// ---- 6. escaping. The summary is read off a Jira page and stored, so & < > reach
// the clipboard path -- which they do not in the script this was copied from.
const NASTY = [{ key: "RDC-1", summary: `Fix <script> & "quotes"` }];
is("html escapes the summary", f.format("links", NASTY, "collection").html.includes("&lt;script&gt; &amp; &quot;quotes&quot;"), true);
is("plain text does NOT escape", f.format("links", NASTY, "collection").text.includes(`<script> & "quotes"`), true);

// ---- 7. the dispatch table is a table
// SIX since 1.1.0. §2.8's spanning set of four each served ONE destination;
// 📋 Details is a fifth slot because it has to survive six destinations with
// different renderers, two of which cannot draw a table at all (§2.14), and
// 📊 Report is a sixth because grouped headings are a different DOCUMENT from a
// flat list rather than a rearrangement of one (§2.15).
is("six exports, and the six labels", f.EXPORTS.map((one) => one.label),
  ["🔗 Links", "📃 Names", "🔑 Keys", "📋 Details", "📊 Report", "🔍 Search"]);
is("only JQL restricts its scopes", f.EXPORTS.filter((one) => one.scopes).map((one) => one.kind), ["jql"]);
is("exactly one entry navigates instead of copying", f.EXPORTS.filter((one) => one.opens).map((one) => one.kind), ["jql"]);
// `build` is called directly here, so the shape AND the field selection have to be
// handed over the way `format` hands them over: both are ARGUMENTS and neither is
// something a builder reads for itself, which is what keeps one preference from
// being read three times (§2.8, §2.14).
is("and the other five still build a clipboard payload",
  f.EXPORTS.filter((one) => !one.opens).every((one) =>
    !!one.build(THREE, "collection", f.shapeFor("markdown"),
      one.fields ? f.enabledFields(f.DEFAULT_PREFS[one.fields]) : undefined).text), true);

// ---- 7b. the search URL. The query is unchanged; only where it goes changed.
const jql = f.format("jql", THREE, "collection").text;
is("the path is Jira's own issue navigator", f.searchUrl(jql),
  "https://dalet.atlassian.net/issues/?jql=key%20in%20(RDC-14817%2C%20RDC-23716%2C%20GLX-402)");
is("and it round-trips, so the search gets the query the button showed",
  decodeURIComponent(f.searchUrl(jql).split("?jql=")[1]), jql);
is("the comma is encoded, or the search reads a different set",
  f.searchUrl("key in (A-1, A-2)").includes("%2C"), true);
is("a summary-less collection searches just as well", f.searchUrl(f.format("jql", BARE, "collection").text),
  "https://dalet.atlassian.net/issues/?jql=key%20in%20(GLX-402)");

// ---- 8. §2.6 rule 2. Logged out, a GET on this API returned 200 with text/html
// and Atlassian's login page. This is the rule that stops that becoming a summary.
const OK_BODY = { issues: [{ id: "1", key: "RDC-1", fields: { summary: "S" } }], issueErrors: [] };
is("good response", f.bulkfetchIssues(true, "application/json", OK_BODY).length, 1);
is("charset is still json", f.bulkfetchIssues(true, "application/json; charset=utf-8", OK_BODY).length, 1);
is("case does not matter", f.bulkfetchIssues(true, "Application/JSON", OK_BODY).length, 1);
is("THE LOGIN PAGE IS NOT DATA", f.bulkfetchIssues(true, "text/html; charset=utf-8", "<html>Log in</html>"), null);
is("not ok is not data", f.bulkfetchIssues(false, "application/json", OK_BODY), null);
is("no content type is not data", f.bulkfetchIssues(true, null, OK_BODY), null);
is("the wrong shape is not data", f.bulkfetchIssues(true, "application/json", { message: "", status: 400 }), null);
is("a null body is not data", f.bulkfetchIssues(true, "application/json", null), null);
is("issues must be an array", f.bulkfetchIssues(true, "application/json", { issues: {} }), null);
is("an empty issues array IS data", f.bulkfetchIssues(true, "application/json", { issues: [] }), []);

// ---- 9. reading a response. issueErrors is never consulted: absence is the signal.
const read = f.readIssues([
  { id: "1420631", key: "rdc-14817", fields: { summary: "  Outline  (opens new window) " } },
  { id: 99, key: "GLX-402", fields: {} },
  { key: "not a key", fields: { summary: "x" } },
]);
is("the key is uppercased", read.get("RDC-14817").key, "RDC-14817");
is("the summary is cleaned", read.get("RDC-14817").summary, "Outline");
is("keyed by id as well, so a moved issue can be found", read.get("1420631").key, "RDC-14817");
is("a numeric id becomes a string", read.get("GLX-402").id, "99");
is("a missing field is normal, not an error", read.get("GLX-402").summary, "");
is("an unsafe key never enters", [...read.keys()].includes("not a key"), false);

// ---- 10. the drawer's two failure sentences, and neither may say "deleted"
const line = (status, version, failed) => f.alertLine({ status, version }, failed);
is("ok and no failure says nothing", line("ok", 1, false), "");
is("unreadable says it could not be read", /could not be read/.test(line("unreadable", null, false)), true);
is("unreadable promises not to overwrite", /NOT overwritten/.test(line("unreadable", null, false)), true);
is("a newer version gives a visible reason", /newer version/.test(line("future", 99, false)), true);
is("a failed write names a cause and a remedy", line("ok", 1, true),
  "This site's browser storage is full, so nothing new can be saved. Copy this collection out, then remove some items.");
is("the store's own state outranks a failed write", /could not be read/.test(line("unreadable", null, true)), true);
is("no sentence says deleted", ["unreadable","future","ok"].some((s) => /delet/i.test(line(s, 99, true))), false);

// ---- 11. duplicate names: lowest free wins, case-insensitive, same on rename
const cols = (...ns) => ns.map((n, i) => ({ id: `i${i}`, name: n, items: [] }));
is("a free name is left alone", f.uniqueName("Sprint", cols("Other")), "Sprint");
is("a clash appends 2", f.uniqueName("Sprint", cols("Sprint")), "Sprint 2");
is("lowest free wins", f.uniqueName("Sprint", cols("Sprint", "Sprint 3")), "Sprint 2");
is("and skips the taken one", f.uniqueName("Sprint", cols("Sprint", "Sprint 2")), "Sprint 3");
is("a clash ignores case", f.uniqueName("sprint", cols("SPRINT")), "sprint 2");
is("Sprint 2 duplicates to Sprint 2 2", f.uniqueName("Sprint 2", cols("Sprint 2")), "Sprint 2 2");
is("whitespace is trimmed", f.uniqueName("  Sprint  ", cols("Other")), "Sprint");
const own = cols("Sprint", "Other");
is("a rename does not clash with itself", f.uniqueName("Sprint", own, "i0"), "Sprint");
is("a rename onto a neighbour still numbers", f.uniqueName("Other", own, "i0"), "Other 2");

// ---- 12. 📋 Details (ADR §2.14)
//
// The data is REAL, read from dalet.atlassian.net on 2026-08-20, and chosen for
// its awkwardness: two issue types, three status categories, two priorities, a
// missing assignee, a missing fix version, an issue carrying TWO fix versions,
// two with no parent, and one Jira would say nothing about. `GLX-402` is the only
// invented row and it stands for that last case.
const DETAILED = [
  { key: "RDC-1513", summary: "Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts",
    type: "Story", status: "Dev Resolved", category: "indeterminate", priority: "P2",
    assignee: "William CHUANG", fixVersions: ["Pyr 2026.8.0 (Release - Active)"], remaining: "0m",
    parent: { key: "RDC-26701", summary: "Markers panel in Pyramid Media Player" } },
  { key: "RDC-28369", summary: "Full screen mode doesnt show any player controls",
    type: "Bug", status: "To Do", category: "new", priority: "P1",
    assignee: "Rajesh KRISHNAPPA",
    fixVersions: ["Flex 2026.6.x (LTS track)", "Flex 2026.9.0"], remaining: "0m", parent: null },
  { key: "GLX-402" },
];
const detailed = f.format("details", DETAILED, "collection");

// -- the plain flavour: ONE ISSUE IS ONE LINE, so it is one thing to drag when
//    the pasted list is reshuffled by hand.
is("details emits one line per item", detailed.text.split("\n").length, 3);
is("the line is the Links line plus a tail after an em dash",
  detailed.text.split("\n")[0],
  `- [RDC-1513](${URL}/RDC-1513) Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts` +
  ` — Story · Dev Resolved · P2 · William CHUANG · Pyr 2026.8.0 (Release - Active) · 0m left` +
  ` · ↳ [RDC-26701](${URL}/RDC-26701)`);
is("an item with nothing but a key keeps its link and grows no dash",
  detailed.text.split("\n")[2], `- [GLX-402](${URL}/GLX-402)`);
is("no format drops an item", /GLX-402/.test(detailed.text), true);
is("the parent is a markdown link, and its key alone",
  /↳ \[RDC-26701\]\(https:\/\/dalet\.atlassian\.net\/browse\/RDC-26701\)$/.test(detailed.text.split("\n")[0]), true);
is("the epic's summary never reaches the line",
  /Markers panel in Pyramid/.test(detailed.text), false);

// -- RULE 1: A SEPARATOR MUST BE A CHARACTER, NEVER A BOX. Outlook strips an
//    inline border, and two bordered chips divided by a space arrived as one
//    nonsense version (measured 2026-08-20).
is("two fix versions are joined by a comma in the text",
  /Flex 2026\.6\.x \(LTS track\), Flex 2026\.9\.0/.test(detailed.text), true);
is("two fix versions are joined by a comma in the html",
  /Flex 2026\.6\.x \(LTS track\), Flex 2026\.9\.0/.test(detailed.html), true);
is("no inline border is emitted", /border:/.test(detailed.html), false);

// -- RULE 2: NOTHING MAY DEPEND ON `opacity`. Outlook and Teams both strip it.
is("no opacity is emitted", /opacity/.test(detailed.html), false);

// -- RULE 5: NO `font-size`, AND ESPECIALLY NOT A PERCENTAGE. Teams did not merely
//    ignore it -- it DELETED THE CONTENT of every span that carried one, so type,
//    status, priority, assignee, fix version, remaining and the parent link all
//    vanished and left a row of bare `·` separators (measured 2026-08-20).
is("no font-size is emitted at all", /font-size/.test(detailed.html), false);
is("and there is no ■: the type is a word", /■/.test(detailed.html), false);
// What the hierarchy rests on instead, both of which every target keeps.
is("the type is emphasised by weight", /font-weight:600">Story/.test(detailed.html), true);
is("an urgent priority is emphasised by weight too", /font-weight:700">P1/.test(detailed.html), true);

// -- RULE 3: A COLOUR MUST BRING ITS OWN BACKGROUND, AND THAT BACKGROUND MUST BE
//    PALE. Teams keeps a pale ground and DISCARDS a saturated one.
const grounds = [...detailed.html.matchAll(/background:(#[0-9a-f]{6})/gi)].map((m) => m[1]);
const pale = Object.values(f.LOZENGE).map((one) => one.bg);
is("every background emitted is one of the three lozenge grounds",
  grounds.every((one) => pale.includes(one)), true);
is("every lozenge ground is pale, not saturated",
  pale.every((hex) => {
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255 > 0.8;
  }), true);
is("every lozenge names its text colour as well as its ground",
  Object.values(f.LOZENGE).every((one) => one.bg && one.fg), true);
// The only text colour allowed to appear WITHOUT a ground is the urgent priority
// red. Everything else is the one measured grey. There was a coloured ■ before the
// type as well; a real paste killed it -- see §2.14.
const inks = new Set([...detailed.html.matchAll(/color:(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase()));
const allowed = new Set([
  f.MUTED_INK, ...Object.values(f.PRIORITY_INK),
  ...Object.values(f.LOZENGE).map((one) => one.fg),
].map((hex) => hex.toLowerCase()));
is("no colour is emitted that the palette does not name",
  [...inks].every((one) => allowed.has(one)), true);

// -- colour means urgency, and the status colour comes from the CATEGORY
is("an urgent priority is coloured", detailed.html.includes(`color:${f.PRIORITY_INK.P1}`), true);
is("P2 is muted rather than coloured", f.PRIORITY_INK.P2, undefined);
is("a To Do issue takes the `new` ground", detailed.html.includes(`background:${f.LOZENGE.new.bg}`), true);
is("an In Progress issue takes the `indeterminate` ground",
  detailed.html.includes(`background:${f.LOZENGE.indeterminate.bg}`), true);
is("the local status wording is printed, not the category",
  /Dev Resolved/.test(detailed.html) && !/indeterminate/.test(detailed.html), true);

// -- the parent's anchor must NAME its colour: a link does not inherit the colour
//    of the span around it, so without this it arrives as a bright blue link
//    competing with the issue's own key.
is("the parent is an anchor in the html",
  detailed.html.includes(`<a href="${URL}/RDC-26701" style="color:${f.MUTED_INK}">RDC-26701</a>`), true);

// -- LINE SPACING. Outlook gives a bare <li> no leading and no gap, so a wrapped
//    six-item report arrived as one dense block and had to be reformatted by hand
//    every time (measured 2026-08-20). Two problems, two properties: line-height
//    for the leading inside a wrapped line, margin-bottom so one issue reads as
//    one block. Asserted here so a later session cannot quietly strip it back.
is("every <li> carries the measured spacing",
  (detailed.html.match(new RegExp(`<li style="${f.LIST_ITEM_STYLE}">`, "g")) || []).length, 3);
is("and it sets both properties, because they fix different things",
  [/line-height/.test(f.LIST_ITEM_STYLE), /margin-bottom/.test(f.LIST_ITEM_STYLE)], [true, true]);
// EVERY format that emits a list carries it. Links was excluded for one day on the
// reasoning that a key plus a summary does not wrap; real summaries on this
// instance run 60 to 100 characters, so it wrapped and had the same fault.
for (const kind of ["links", "details"]) {
  const html = kind === "links"
    ? f.format(kind, THREE, "collection").html
    : detailed.html;
  is(`${kind} spaces every <li>`,
    (html.match(new RegExp(`<li style="${f.LIST_ITEM_STYLE}">`, "g")) || []).length, 3);
}
is("and the two use the SAME style, so one cannot drift from the other",
  f.format("links", THREE, "collection").html.includes(`<li style="${f.LIST_ITEM_STYLE}">`) &&
  detailed.html.includes(`<li style="${f.LIST_ITEM_STYLE}">`), true);

// -- the two flavours must agree about what the document is (§2.8)
is("the collection scope is a <ul> of items", /^<ul><li style="[^"]+">.*<\/li><\/ul>$/.test(detailed.html), true);
is("the html has one <li> per item", detailed.html.split("<li ").length - 1, 3);
const one = f.format("details", [DETAILED[0]], "item");
is("a single item drops the bullet", one.text.startsWith("["), true);
is("and drops the <ul> with it", one.html.startsWith("<a "), true);
is("a single item has no <li>, so no spacing either", /<li/.test(one.html), false);
is("and Links at item scope has none either", /<li/.test(f.format("links", BARE, "item").html), false);

// -- the rules every other format already obeys
is("a copy of zero items writes nothing", f.format("details", [], "collection"), null);
is("an ampersand in a summary is escaped on the html side",
  f.format("details", [{ key: "RDC-1", summary: "a & b <c>" }], "collection").html.includes("a &amp; b &lt;c&gt;"), true);
is("and is left alone on the text side",
  f.format("details", [{ key: "RDC-1", summary: "a & b <c>" }], "collection").text.includes("a & b <c>"), true);

// -- the field lists. ALWAYS PASSED EXPLICITLY: omitting `fields` returns ids.
is("gap-fill and refresh ask for one field", f.SUMMARY_FIELDS, ["summary"]);
// ONE SHARED LIST, not one per format: the fetch belongs to the collection rather
// than to a button, so it asks for everything either document prints. The team
// field is in it for 📊 Report and is never printed by 📋 Details (§2.15).
is("the shared list covers both documents", f.DETAIL_FIELDS,
  ["summary","issuetype","status","priority","assignee","fixVersions","parent",
   "customfield_15541","timetracking"]);
is("Details never prints the team it fetched",
  /Planning/.test(f.format("details", [{ key: "RDC-1", summary: "x", team: "Planning", teamId: "t1" }],
    "collection").text), false);
is("details is a copy, not a navigation",
  f.EXPORTS.find((one) => one.kind === "details").opens, undefined);
is("details declares it must fetch first",
  f.EXPORTS.find((one) => one.kind === "details").needsDetails, true);
is("the five that copy stay together, with Search last",
  f.EXPORTS.map((one) => one.kind), ["links","names","keys","details","report","jql"]);
is("Search is still the only one that navigates",
  f.EXPORTS.filter((one) => one.opens).map((one) => one.kind), ["jql"]);

// ---- 13. readIssues carries the new fields, and defaults every absent one
const answered = f.readIssues([{
  id: "573374", key: "RDC-1513",
  fields: {
    summary: "Markers [7] Dev (player)", issuetype: { name: "Story" },
    status: { name: "Dev Resolved", statusCategory: { key: "indeterminate" } },
    priority: { name: "P2" }, assignee: { displayName: "William CHUANG" },
    fixVersions: [{ name: "Pyr 2026.8.0 (Release - Active)" }],
    timetracking: { remainingEstimate: "0m", remainingEstimateSeconds: 0 },
    parent: { key: "RDC-26701", fields: { summary: "Markers panel in Pyramid Media Player" } },
  },
}]).get("RDC-1513");
is("the type is read", answered.type, "Story");
is("the status name is read", answered.status, "Dev Resolved");
is("the status CATEGORY is read too", answered.category, "indeterminate");
is("the priority is read as its name", answered.priority, "P2");
is("the assignee is a display name", answered.assignee, "William CHUANG");
is("fix versions are names, in order", answered.fixVersions, ["Pyr 2026.8.0 (Release - Active)"]);
is("the remaining estimate is the formatted string", answered.remaining, "0m");
is("the parent carries a key and a summary", answered.parent,
  { key: "RDC-26701", summary: "Markers panel in Pyramid Media Player" });

// A field that was requested and is absent is NORMAL, not an error (§2.6).
const bare = f.readIssues([{ id: "1", key: "GLX-402", fields: { summary: "" } }]).get("GLX-402");
is("an absent type is empty, not undefined", bare.type, "");
is("an absent category is empty", bare.category, "");
is("an absent assignee is empty", bare.assignee, "");
is("absent fix versions are an empty array", bare.fixVersions, []);
is("an absent parent is null", bare.parent, null);
is("an absent remaining estimate is empty", bare.remaining, "");
// A malformed parent key must not put a broken link on the clipboard.
const badparent = f.readIssues([
  { id: "2", key: "RDC-2", fields: { summary: "x", parent: { key: "not a key" } } },
]).get("RDC-2");
is("a parent whose key is malformed is dropped", badparent.parent, null);

// ---- 14. 📊 Report (ADR §2.15): priority band, then team, then insertion order
//
// The order is the user's and was corrected on 2026-08-20 from an earlier note that
// had it the other way round. Two fields become headings and so leave the row.
const REPORT = [
  { key: "RDC-1", summary: "b", priority: "P2", team: "Planning", teamId: "t1", type: "Story" },
  { key: "RDC-2", summary: "a", priority: "P1", team: "Planning", teamId: "t1", type: "Bug" },
  { key: "RDC-3", summary: "c", priority: "P1", team: "Core", teamId: "t2", type: "Bug" },
  { key: "RDC-4", summary: "d", priority: "P1", team: "Planning", teamId: "t1", type: "Story" },
  { key: "RDC-5", summary: "e", priority: "P0", team: "", teamId: "", type: "Bug" },
  { key: "RDC-6", summary: "f", priority: "", team: "Core", teamId: "t2", type: "Task" },
];
const report = f.format("report", REPORT, "collection");

is("P0 sorts first with no rank table, because the names already sort",
  report.text.split("\n").filter((l) => /^\*\*/.test(l)),
  ["**P0**", "**P1**", "**P2**", `**${f.NO_PRIORITY}**`]);
is("an unset priority sorts LAST, not first",
  report.text.trim().split("\n\n").at(-1).startsWith("*Core*"), true);
is("teams sort alphabetically inside a band",
  report.text.split("**P1**")[1].split("**P2**")[0].match(/^\*[^*]+\*$/gm), ["*Core*", "*Planning*"]);
is("an unset team is named rather than left blank",
  report.text.includes(`*${f.NO_TEAM}*`), true);
is("insertion order survives inside a team",
  report.text.split("*Planning*")[1].split("\n").filter((l) => l.startsWith("- "))
    .map((l) => l.match(/RDC-\d/)[0]), ["RDC-2", "RDC-4"]);
is("every item appears exactly once", REPORT.every((i) =>
  (report.text.match(new RegExp(`\\[${i.key}\\]`, "g")) || []).length === 1), true);
is("no item is dropped", (report.text.match(/^- /gm) || []).length, 6);

// The two fields that became headings must not also be on the row.
is("priority is NOT repeated on the line", /· P1/.test(report.text), false);
is("the type still is", /— Bug/.test(report.text), true);
is("grouping is by teamId, so two teams with one name cannot merge",
  f.reportGroups([
    { key: "A", priority: "P1", team: "Same", teamId: "x" },
    { key: "B", priority: "P1", team: "Same", teamId: "y" },
  ])[0].teams.length, 2);

// Rules 1 to 5 are properties of the paste target, so they hold here too -- the
// chip renderer is shared with 📋 Details for exactly that reason.
is("the report emits no font-size", /font-size/.test(report.html), false);
is("nor any opacity", /opacity/.test(report.html), false);
is("nor an inline border", /border:/.test(report.html), false);
is("its rows carry the measured spacing",
  (report.html.match(new RegExp(`<li style="${f.LIST_ITEM_STYLE}">`, "g")) || []).length, 6);
is("headings are TAGS, not styled spans, so a sanitiser cannot flatten them",
  /<strong>P0<\/strong>/.test(report.html) && /<em>Planning<\/em>/.test(report.html), true);
is("and they are <p>, not <h3>: a paste must not join the host document's outline",
  /<h[1-6]/.test(report.html), false);
is("a report of zero items writes nothing", f.format("report", [], "collection"), null);

is("Report shares the two-step fetch",
  f.EXPORTS.find((one) => one.kind === "report").needsDetails, true);
is("the team field is asked for by id, never by name", f.TEAM_FIELD, "customfield_15541");
is("and it is in the SHARED field list, so one fetch serves both",
  f.DETAIL_FIELDS.includes(f.TEAM_FIELD), true);

// readIssues reads the team's NAME, and keeps the id to group by.
const teamed = f.readIssues([{ id: "1", key: "RDC-9", fields: { summary: "x",
  [f.TEAM_FIELD]: { id: "077a215a-beb6-4f29-9ae6-6db55ba2dab5", name: "Planning", title: "Planning" } } }]).get("RDC-9");
is("the team name is read", teamed.team, "Planning");
is("and its id is kept, because that is what grouping joins on", teamed.teamId,
  "077a215a-beb6-4f29-9ae6-6db55ba2dab5");
const noteam = f.readIssues([{ id: "2", key: "RDC-10", fields: { summary: "x" } }]).get("RDC-10");
is("an absent team is empty, not undefined", [noteam.team, noteam.teamId], ["", ""]);

// ---- 15. THE FIVE LINE SHAPES (ADR §2.8, decision 5; the paste is appendix A.9.1)
//
// ONE SETTING, THREE CONSUMERS. `format` reads the preference once per copy and
// hands the same shape to 🔗 Links, 📋 Details and 📊 Report, so §2.14's promise
// that Details' head IS Links' line holds by construction rather than by two
// strings agreeing.
//
// HOW THIS PINS EVERY BYTE, AND WHY IT IS NOT ONE GIANT LITERAL. Sections 1, 12
// and 14 above pin the DEFAULT shape's whole output absolutely, against the ADR's
// own worked examples. This section pins each shape's HEAD as a literal, and then
// asserts that everything after the head is byte-identical to what the default
// emits. Together they leave no byte of any shape unasserted, and they say which
// part of a line a shape is allowed to change -- which is the actual claim.
//
// The sample is two items: one with everything, whose real summary contains ` - `
// and is therefore the em dash collision (A.9.1), and one with a key and nothing
// else. So every assertion below covers WITH a summary and WITHOUT one, and the
// separator has to drop with the value in both flavours.
const SHAPED = [DETAILED[0], DETAILED[2]];
const U1 = `${URL}/RDC-1513`;
const U2 = `${URL}/GLX-402`;
const S1 = "Markers [7] Dev (player) - Handle i/o Shift 1..0 keyboard shortcuts";
const BOLD = ' style="font-weight:600"';

// The head each shape emits, written out rather than computed. `text` is the plain
// flavour; `plain` is the HTML 🔗 Links takes and `bold` is the HTML 📋 Details and
// 📊 Report take -- the one place the three heads differ, and it is deliberate
// (§2.14, corrected 2026-08-25).
const HEADS = {
  markdown: {
    text: [`[RDC-1513](${U1}) ${S1}`, `[GLX-402](${U2})`],
    plain: [`<a href="${U1}">RDC-1513</a>&nbsp;${S1}`, `<a href="${U2}">GLX-402</a>`],
    bold: [`<a href="${U1}"${BOLD}>RDC-1513</a>&nbsp;${S1}`, `<a href="${U2}"${BOLD}>GLX-402</a>`],
  },
  "markdown-key": {
    text: [`[RDC-1513](${U1})`, `[GLX-402](${U2})`],
    plain: [`<a href="${U1}">RDC-1513</a>`, `<a href="${U2}">GLX-402</a>`],
    bold: [`<a href="${U1}"${BOLD}>RDC-1513</a>`, `<a href="${U2}"${BOLD}>GLX-402</a>`],
  },
  "key-summary-url": {
    text: [`RDC-1513: ${S1} - ${U1}`, `GLX-402 - ${U2}`],
    plain: [`RDC-1513: ${S1} - <a href="${U1}">${U1}</a>`, `GLX-402 - <a href="${U2}">${U2}</a>`],
    bold: [`<span${BOLD}>RDC-1513</span>: ${S1} - <a href="${U1}">${U1}</a>`,
           `<span${BOLD}>GLX-402</span> - <a href="${U2}">${U2}</a>`],
  },
  "key-url": {
    text: [`RDC-1513 - ${U1}`, `GLX-402 - ${U2}`],
    plain: [`RDC-1513 - <a href="${U1}">${U1}</a>`, `GLX-402 - <a href="${U2}">${U2}</a>`],
    bold: [`<span${BOLD}>RDC-1513</span> - <a href="${U1}">${U1}</a>`,
           `<span${BOLD}>GLX-402</span> - <a href="${U2}">${U2}</a>`],
  },
  url: {
    text: [U1, U2],
    plain: [`<a href="${U1}">${U1}</a>`, `<a href="${U2}">${U2}</a>`],
    // No key, so nothing to bold. The one shape where the two heads are the same.
    bold: [`<a href="${U1}">${U1}</a>`, `<a href="${U2}">${U2}</a>`],
  },
};

// ---- 15a. the table and the vocabulary must name the same ids
// A table naming an id `LINE_SHAPE_IDS` lacks is an UNREACHABLE shape -- nothing
// can store that preference. An id with no table is a preference that RENDERS
// NOTHING. The two lists are separate because the vocabulary has to exist above
// `DEFAULT_PREFS`, which is built at load, and these bytes have to live beside the
// formatters; a `const` up there reading the table down here would be a temporal
// dead zone. This check is what holds them together instead.
is("the shape table and the preference's vocabulary name the same ids, in the same order",
  f.SHAPES.map((one) => one.id), f.LINE_SHAPE_IDS);
is("five shapes ship, and the fifth came from a paste rather than the prototype",
  f.SHAPES.length, 5);
is("and these are the words the ⚙ panel shows", f.SHAPES.map((one) => one.label),
  ["Markdown link on the key", "Markdown link, no summary", "Key, summary, then the URL",
   "Key and URL, no summary", "URL only"]);
is("the first is the shape 1.1.0 shipped, which is what makes it the default",
  f.SHAPES[0].id, "markdown");
// `normalisePrefs` has already range-checked the id, so this cannot fire in the
// script. It is asserted because this is the COPY path: a throw here is a copy that
// silently never happened, which is the failure §2.8's scar is about.
is("an id this build does not know falls back rather than throwing on the copy path",
  f.shapeFor("no-such-shape").id, "markdown");
is("and so does a missing one", f.shapeFor(undefined).id, "markdown");

// ---- 15b. EVERY SHAPE DEFINES BOTH FLAVOURS (decision 6)
// A shape that changed only `text/plain` would silently do nothing in Outlook,
// Word, Teams and Confluence, which all take the HTML -- a setting that quietly
// fails to apply, which is exactly what §2.14 warns about.
for (const shape of f.SHAPES.slice(1)) {
  is(`${shape.id} changes the text flavour`,
    shape.text(SHAPED[0]) !== f.SHAPES[0].text(SHAPED[0]), true);
  is(`${shape.id} changes the html flavour too, or it would do nothing where the HTML is taken`,
    shape.html(SHAPED[0], true) !== f.SHAPES[0].html(SHAPED[0], true), true);
}
is("four shapes bold the key when the line carries a field tail",
  f.SHAPES.filter((one) => one.html(SHAPED[0], true) !== one.html(SHAPED[0], false)).map((one) => one.id),
  ["markdown", "markdown-key", "key-summary-url", "key-url"]);
is("and `url` is the one with no key to bold",
  f.shapeFor("url").html(SHAPED[0], true), f.shapeFor("url").html(SHAPED[0], false));

// ---- 15c. the tails, taken from the default shape's own output
// Section 12 and section 14 pin those bytes absolutely, so "unchanged" below means
// unchanged from a string this file already asserts against the ADR -- not from a
// copy of the code.
const liOpen = `<li style="${f.LIST_ITEM_STYLE}">`;
const liCells = (html) =>
  html.split(liOpen).slice(1).map((chunk) => chunk.slice(0, chunk.indexOf("</li>")));
const defaultDetails = f.format("details", SHAPED, "collection");
const defaultReport = f.format("report", SHAPED, "collection");
const detailTailText = defaultDetails.text.split("\n")
  .map((line, i) => line.slice(`- ${HEADS.markdown.text[i]}`.length));
const detailTailHtml = liCells(defaultDetails.html)
  .map((cell, i) => cell.slice(HEADS.markdown.bold[i].length));
const reportRows = (text) => text.split("\n").filter((line) => line.startsWith("- "));
const reportTailText = reportRows(defaultReport.text)
  .map((line, i) => line.slice(`- ${HEADS.markdown.text[i]}`.length));
// The em dash tail is the same in both plain shapes and markdown ones, and THAT IS
// THE COLLISION, accepted on 2026-08-24: `key-summary-url` ends in a URL, so the
// em dash lands after 45 characters of link and its own separator is a hyphen the
// summary itself contains. These documents are read and never parsed (A.9.1).
is("the field tail is one string, whichever shape the head takes",
  detailTailText[0],
  " — Story · Dev Resolved · P2 · William CHUANG · Pyr 2026.8.0 (Release - Active) · 0m left" +
  ` · ↳ [RDC-26701](${URL}/RDC-26701)`);
is("an item with nothing but a key grows no tail in any shape", detailTailText[1], "");

// ---- 15d. every shape, every export, both flavours, with a summary and without
for (const shape of f.SHAPES) {
  const head = HEADS[shape.id];

  // 🔗 Links: the head IS the whole line. Nothing else is on it.
  is(`${shape.id} · Links text`, asShape(shape.id, "links", SHAPED).text,
    [`- ${head.text[0]}`, `- ${head.text[1]}`].join("\n"));
  is(`${shape.id} · Links html`, asShape(shape.id, "links", SHAPED).html,
    `<ul>${liOpen}${head.plain[0]}</li>${liOpen}${head.plain[1]}</li></ul>`);
  is(`${shape.id} · Links at item scope drops the bullet and the <ul>`,
    asShape(shape.id, "links", [SHAPED[1]], "item"), { text: head.text[1], html: head.plain[1] });

  // 📋 Details: the head, then a tail no shape may touch.
  is(`${shape.id} · Details text`, asShape(shape.id, "details", SHAPED).text,
    [`- ${head.text[0]}${detailTailText[0]}`, `- ${head.text[1]}${detailTailText[1]}`].join("\n"));
  is(`${shape.id} · Details html`, asShape(shape.id, "details", SHAPED).html,
    `<ul>${liOpen}${head.bold[0]}${detailTailHtml[0]}</li>` +
    `${liOpen}${head.bold[1]}${detailTailHtml[1]}</li></ul>`);

  // 📊 Report: the same head under headings the shape leaves alone. The html is
  // the default's, with each head swapped for this shape's -- which asserts the
  // headings, the <p> margins and the <ul> nesting are untouched as well.
  is(`${shape.id} · Report rows`, reportRows(asShape(shape.id, "report", SHAPED).text),
    [`- ${head.text[0]}${reportTailText[0]}`, `- ${head.text[1]}${reportTailText[1]}`]);
  is(`${shape.id} · Report headings are not the shape's business`,
    asShape(shape.id, "report", SHAPED).text.split("\n").filter((line) => /^[*]/.test(line)),
    defaultReport.text.split("\n").filter((line) => /^[*]/.test(line)));
  is(`${shape.id} · Report html`, asShape(shape.id, "report", SHAPED).html,
    defaultReport.html
      .split(HEADS.markdown.bold[0]).join(head.bold[0])
      .split(HEADS.markdown.bold[1]).join(head.bold[1]));

  // THE SEPARATOR GOES WITH ITS VALUE, in every shape. `GLX-402` has no summary,
  // so `key-summary-url` must emit `GLX-402 - url` and never `GLX-402: - url`.
  is(`${shape.id} · no orphaned separator on a summary-less item`,
    /:\s+-|-\s+-|\(\)/.test(shape.text(SHAPED[1])), false);
  is(`${shape.id} · no trailing space on any line, in any export`,
    /[ \t]$/m.test(["links", "details", "report"]
      .map((kind) => asShape(shape.id, kind, SHAPED).text).join("\n")), false);

  // EVERY <li> CARRIES THE MEASURED SPACING, in every shape and every export. A
  // bare <li> is unreadable in Outlook, and these lines are longer than 1.1.0's,
  // not shorter (§2.8, §2.14, measured 2026-08-20).
  const everyHtml = ["links", "details", "report"]
    .map((kind) => asShape(shape.id, kind, SHAPED).html).join("");
  is(`${shape.id} · every <li> in all three exports carries LIST_ITEM_STYLE`,
    [(everyHtml.match(/<li/g) || []).length, (everyHtml.split(liOpen).length - 1)], [6, 6]);

  /* THE FIVE PASTE RULES, ON EVERY NEW BYTE STRING. Run over the three exports'
     HTML at once, because the bytes a shape ADDS are the same in all three -- the
     head, and the head alone. Each rule is a measurement from a real paste into
     Outlook and Teams, and each is a change a later session would otherwise make
     on reasonable-sounding instinct (§2.14, appendix A.9). */
  is(`${shape.id} · rule 5: no font-size anywhere`, /font-size/.test(everyHtml), false);
  is(`${shape.id} · rule 2: nothing depends on opacity`, /opacity/.test(everyHtml), false);
  is(`${shape.id} · rule 1: no separator is a box`, /border:/.test(everyHtml), false);
  is(`${shape.id} · rule 3: every background is one of the pale lozenge grounds`,
    [...everyHtml.matchAll(/background:(#[0-9a-f]{6})/gi)].map((m) => m[1])
      .every((one) => pale.includes(one)), true);
  is(`${shape.id} · rule 3: no colour the palette does not name`,
    [...everyHtml.matchAll(/color:(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase())
      .every((one) => allowed.has(one)), true);
}

// ---- 15e. and the default is still what 1.1.0 emitted
// Every section above this one was written before the shapes existed and asserts
// 1.1.0's bytes. They are green, which is the real check; this one states the claim
// out loud so a later session cannot read their silence as coincidence.
for (const kind of ["links", "details", "report"]) {
  is(`a copy with no preference stored emits the markdown shape · ${kind}`,
    f.format(kind, SHAPED, "collection"), asShape("markdown", kind, SHAPED));
}

// ---- 16. TWO SELECTIONS OVER ONE CATALOGUE (ADR §2.14, decisions 7 to 11)
//
// EVERY SECTION ABOVE THIS ONE IS ALREADY A CHECK ON THE DEFAULTS, and that is the
// first thing this section claims. `loadPrefs` above hands out `DEFAULT_PREFS`
// itself, sliced out of the script, so sections 12, 14 and 15 pin 1.1.0's bytes
// while the shipped defaults are what produced them. None of them changed when the
// field lists landed, which is the requirement: an install that never opens ⚙ must
// not be able to tell that any of this exists.
//
// What is asserted below is what a CLICK can now reach.

// -- 16a. the two defaults, said out loud so their silence above is not read as luck
is("📋 Details ships 1.1.0's seven fields, in 1.1.0's reading order",
  f.enabledFields(f.DEFAULT_PREFS.detailsFields),
  ["type", "status", "priority", "assignee", "fixv", "remaining", "parent"]);
// Priority is 📊 Report's first band, and a band leaves the row -- which at 1.2.0 is
// what the DEFAULT says rather than what the renderer does (decision 8).
is("📊 Report ships the same list less priority, which is its first band",
  f.enabledFields(f.DEFAULT_PREFS.reportFields),
  ["type", "status", "assignee", "fixv", "remaining", "parent"]);
is("team is off in both, because a NEW FIELD ARRIVES OFF (decision 21)",
  [f.DEFAULT_PREFS.detailsFields, f.DEFAULT_PREFS.reportFields]
    .map((list) => list.find((one) => one.id === "team").on), [false, false]);
// Off is not absent. Both lists carry every catalogue field, so every field has a
// row in the ⚙ panel and one click turns it on (`normaliseFieldList`, step 5).
is("and both lists still name every catalogue field, so none of them is unreachable",
  [f.DEFAULT_PREFS.detailsFields, f.DEFAULT_PREFS.reportFields]
    .map((list) => list.map((one) => one.id)),
  [f.FIELD_CATALOGUE.map((one) => one.id), f.FIELD_CATALOGUE.map((one) => one.id)]);

// -- 16b. THE CATALOGUE AND THE RENDERER MUST NAME THE SAME FIELDS. A catalogue id
// with no `case` in `detailBit` is a field that can be TICKED AND DRAWS NOTHING, and
// a `case` with no catalogue entry is bytes nothing can ask for. It is the same
// defect shape as 15a's, at a different seam, and this is the only thing holding the
// two together.
const EVERY = {
  key: "RDC-1513", summary: "S", type: "Story", status: "Dev Resolved",
  category: "indeterminate", priority: "P1", assignee: "William CHUANG",
  team: "Planning", teamId: "t1", fixVersions: ["Pyr 2026.8.0 (Release - Active)"],
  remaining: "2d", parent: { key: "RDC-26701", summary: "p" },
};
is("every id the catalogue names draws a bit on an item that carries every field",
  f.FIELD_CATALOGUE.filter((one) => !f.detailBit(one.id, EVERY)).map((one) => one.id), []);
is("and every bit carries BOTH flavours, because the parent is a reference not a value",
  f.FIELD_CATALOGUE.every((one) => {
    const bit = f.detailBit(one.id, EVERY);
    return bit.id === one.id && !!bit.text && !!bit.html;
  }), true);
// This cannot fire from a stored preference -- `normaliseFieldList` drops an id the
// catalogue does not name -- and it is asserted because this is the COPY path: a
// throw here is a copy that silently never happened (§2.8's scar, and 15a's reason).
is("an id the catalogue does not name draws nothing rather than throwing",
  f.detailBit("haiku", EVERY), null);
is("and an absent value drops out along with its separator",
  f.FIELD_CATALOGUE.map((one) => f.detailBit(one.id, { key: "GLX-402" })), 
  f.FIELD_CATALOGUE.map(() => null));

// -- 16c. the two tables that name the two keys, held together the way 15a holds the
// shapes. A key a TAB edits and no EXPORT reads is a control that changes nothing; a
// key an export reads and no tab edits is a preference with no way to reach it.
is("the tabs that edit a field list and the exports that read one name the same keys",
  f.SETTINGS_TABS.filter((one) => one.fields).map((one) => one.fields).sort(),
  f.EXPORTS.filter((one) => one.fields).map((one) => one.fields).sort());
is("and both keys are real preferences with a default behind them",
  f.EXPORTS.filter((one) => one.fields)
    .map((one) => Array.isArray(f.DEFAULT_PREFS[one.fields])), [true, true]);
is("the two exports that read a field list are the two that fetch",
  f.EXPORTS.filter((one) => one.fields).map((one) => one.kind), ["details", "report"]);
// The tab that owns the bands names them, so the panel can mark a row `also a
// heading` without a `"report"` literal inside the renderer. Every key it names must
// be a real band preference, or the mark is read off nothing and silently never
// appears -- ticket 05 puts the dropdowns on that same tab.
is("the tab that has bands names preferences that exist",
  f.SETTINGS_TABS.flatMap((one) => one.bands ?? [])
    .map((key) => typeof f.DEFAULT_PREFS[key] === "string"), [true, true]);
is("and it is the report tab, which is the only one with headings",
  f.SETTINGS_TABS.filter((one) => one.bands).map((one) => one.fields), ["reportFields"]);

/* THE OTHER FOUR EXPORTS DO NOT VARY WITH A FIELD LIST. This began as a browser step
   -- "press 🔗 Links after a reorder and check it did not move" -- and it needs no
   browser, because there is no paint involved: it is bytes, and bytes are what this
   file is for.

   WHAT THIS HOLDS, EXACTLY, because it is narrower than it first reads and the
   difference was measured rather than assumed. Every other Links, Names, Keys and
   JQL check in this file runs with the DEFAULTS in place, so all of them say "these
   bytes are 1.1.0's". None of them says "these bytes do not MOVE when a preference
   moves", and that is the claim a configurable build newly needs. This is that claim,
   and a wild selection plus an empty one are the two states a click can reach that
   1.1.0 could not.

   WHAT IT DOES NOT HOLD, recorded because it was tried and did not fail. Making
   `format` hand the selection to EVERY entry -- dropping the `entry.fields ?` guard
   -- changes nothing here and nothing anywhere else, because `formatLinks` takes
   three parameters and JavaScript discards a fourth in silence. The guard is
   therefore documentation, not enforcement, and the thing that actually keeps a
   selection out of those four is that their builders have no parameter to put it in.
   `css-smoke`'s first backtick check had the same shape; see this repo's test README
   on why a check that cannot fail is worse than no check. */
const WILD = ["parent", "team"];
for (const kind of ["links", "names", "keys", "jql"]) {
  is(`a field list cannot reach ${kind}, whatever it says`,
    withPrefs({ detailsFields: listOf(WILD), reportFields: listOf(WILD) },
      () => f.format(kind, DETAILED, "collection")),
    f.format(kind, DETAILED, "collection"));
}
// And an empty one cannot either, which is the state decision 9 makes reachable by a
// click: 🔗 Links has no field tail to lose, so it must not lose anything.
is("nor can an empty one, which is the state a click can now produce",
  withPrefs({ detailsFields: listOf([]), reportFields: listOf([]) },
    () => f.format("links", DETAILED, "collection")),
  f.format("links", DETAILED, "collection"));

// -- 16d. A REORDERED LIST EMITS IN THE STORED ORDER. The catalogue's order is the
// default and nothing more; what a document prints is what the preference says.
const KEY_OF = { details: "detailsFields", report: "reportFields" };
const CATALOGUE_IDS = f.FIELD_CATALOGUE.map((one) => one.id);
const reversed = withFields("detailsFields",
  ["parent", "remaining", "fixv", "assignee", "priority", "status", "type"],
  "details", [DETAILED[0]], "item");
is("a reordered list emits in the stored order, not the catalogue's",
  reversed.text.split(" — ")[1].split(" · "),
  [`↳ [RDC-26701](${URL}/RDC-26701)`, "0m left", "Pyr 2026.8.0 (Release - Active)",
   "William CHUANG", "P2", "Dev Resolved", "Story"]);
is("and the html tail is the same seven in the same order",
  f.detailBits(DETAILED[0], f.enabledFields(listOf(
    ["parent", "remaining", "fixv", "assignee", "priority", "status", "type"])))
    .map((bit) => bit.id),
  ["parent", "remaining", "fixv", "assignee", "priority", "status", "type"]);

// -- 16e. ZERO FIELDS IS ALLOWED (decision 9): the line is the head alone, no em
// dash. It needs no new code -- the renderer already does exactly this for an issue
// Jira returned nothing about -- and it is asserted anyway, because it is now
// reachable by a CLICK rather than only by a thin item.
const noneDetails = withFields("detailsFields", [], "details", SHAPED);
const noneReport = withFields("reportFields", [], "report", SHAPED);
is("every field off · Details text is the head alone, with no em dash",
  noneDetails.text, [`- ${HEADS.markdown.text[0]}`, `- ${HEADS.markdown.text[1]}`].join("\n"));
is("every field off · Details html is the head alone too",
  noneDetails.html,
  `<ul>${liOpen}${HEADS.markdown.bold[0]}</li>${liOpen}${HEADS.markdown.bold[1]}</li></ul>`);
is("every field off · Report keeps its headings and loses every tail",
  reportRows(noneReport.text), [`- ${HEADS.markdown.text[0]}`, `- ${HEADS.markdown.text[1]}`]);
is("and no em dash survives in either flavour of either export",
  /—/.test(noneDetails.text + noneDetails.html + noneReport.text + noneReport.html), false);
// KNOWN AND ACCEPTED: 📋 Details configured this way emits 🔗 Links' bytes. Two
// buttons, one document, by the user's own choice -- and the HTML still differs by
// the one declaration §2.14 keeps on purpose, the bold on the key.
is("so its plain flavour IS 🔗 Links', which is the stated cost of decision 9",
  noneDetails.text, f.format("links", SHAPED, "collection").text);
is("and the html differs from Links by the bold key and nothing else",
  noneDetails.html.split(BOLD).join(""), f.format("links", SHAPED, "collection").html);

// -- 16f. one field on: head, em dash, one chip, and no separator
const dash = `<span style="color:${f.MUTED_INK}"> — </span>`;
const dot = `<span style="color:${f.MUTED_INK}"> · </span>`;
const oneOn = withFields("detailsFields", ["status"], "details", [DETAILED[0]], "item");
is("one field on · text: the head, the em dash, one value",
  oneOn.text, `${HEADS.markdown.text[0]} — Dev Resolved`);
is("one field on · html: the head, the em dash, one chip",
  oneOn.html,
  HEADS.markdown.bold[0] + dash + f.detailChip(f.detailBit("status", DETAILED[0]), DETAILED[0]));
is("and the separator that goes BETWEEN fields is not emitted for one field",
  [oneOn.text.includes(" · "), oneOn.html.includes(dot)], [false, false]);

// -- 16g. TEAM, WHICH 1.1.0 FETCHED AND COULD NOT PRINT (decision 10). It has been in
// `DETAIL_FIELDS` since 1.1.0 for 📊 Report's sub-band headings, and 📋 Details has no
// headings -- so until the catalogue took it, the field was fetched on every press of
// either button and unreachable from one of them.
const TEAMED = { ...DETAILED[0], team: "Planning", teamId: "t1" };
const teamOn = withFields("detailsFields", ["team"], "details", [TEAMED], "item");
is("team ticked reaches 📋 Details at last", teamOn.text, `${HEADS.markdown.text[0]} — Planning`);
is("and it is drawn in the plain muted grey, like every other unadorned field",
  teamOn.html, HEADS.markdown.bold[0] + dash + `<span style="color:${f.MUTED_INK}">Planning</span>`);
is("it takes no lozenge, no weight and no colour of its own",
  f.detailChip(f.detailBit("team", TEAMED), TEAMED),
  `<span style="color:${f.MUTED_INK}">Planning</span>`);
// It is still not in the DEFAULT, so section 12's "Details never prints the team it
// fetched" is still true of a fresh install and both statements stand together.
is("and a fresh install still does not print it",
  /Planning/.test(f.format("details", [TEAMED], "item").text), false);

// -- 16h. THE TWO LISTS ARE INDEPENDENT, which is the whole point of two selections:
// each document is correct, and neither knows about the other.
const split = withPrefs(
  { detailsFields: listOf(["status"]), reportFields: listOf(["type"]) },
  () => ({
    details: f.format("details", [DETAILED[0]], "item"),
    report: f.format("report", [DETAILED[0]], "collection"),
  }));
is("a field ticked in one list and not the other makes two different documents",
  split.details.text !== reportRows(split.report.text)[0].slice(2), true);
is("and each is right: Details took its own list", split.details.text.endsWith(" — Dev Resolved"), true);
is("and Report took its own", reportRows(split.report.text)[0].endsWith(" — Story"), true);
// ONE CATALOGUE, so the styling cannot differ between them however the lists do.
is("but the one chip renderer serves both, so a field drawn twice is drawn the same",
  f.detailChip(f.detailBit("status", DETAILED[0]), DETAILED[0]),
  f.detailChip(f.detailBit("status", DETAILED[0]), DETAILED[0]));

// -- 16i. THE FIVE PASTE RULES, ON EVERY NEW BYTE STRING. Each is a measurement from
// a real paste into Outlook and Teams, and each is a change a later session would
// otherwise make on reasonable-sounding instinct (§2.14, appendix A.9). A selection
// can now produce byte strings 1.1.0 never emitted, so every one of them is run over
// the same five rules section 15d runs over the shapes.
const SELECTIONS = [
  ["nothing ticked", []],
  ["one field", ["status"]],
  ["team, which 1.1.0 could not print", ["team"]],
  ["the whole catalogue", CATALOGUE_IDS],
  ["the whole catalogue, reversed", [...CATALOGUE_IDS].reverse()],
];
for (const [label, ids] of SELECTIONS) {
  const everyHtml = ["details", "report"]
    .map((kind) => withFields(KEY_OF[kind], ids, kind, [TEAMED, DETAILED[2]]).html)
    .join("");
  is(`${label} · rule 5: no font-size anywhere`, /font-size/.test(everyHtml), false);
  is(`${label} · rule 2: nothing depends on opacity`, /opacity/.test(everyHtml), false);
  is(`${label} · rule 1: no separator is a box`, /border:/.test(everyHtml), false);
  is(`${label} · rule 3: every background is one of the pale lozenge grounds`,
    [...everyHtml.matchAll(/background:(#[0-9a-f]{6})/gi)].map((m) => m[1])
      .every((one) => pale.includes(one)), true);
  is(`${label} · rule 3: no colour the palette does not name`,
    [...everyHtml.matchAll(/color:(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase())
      .every((one) => allowed.has(one)), true);
  // ONE ISSUE IS STILL ONE LINE, whatever the selection says, and no format drops an
  // item -- the two rules §2.14 inherits from §2.8 unchanged.
  const text = withFields(KEY_OF.details, ids, "details", [TEAMED, DETAILED[2]]).text;
  is(`${label} · one issue is still one line`, text.split("\n").length, 2);
  is(`${label} · and the item Jira said nothing about is still there`,
    /GLX-402/.test(text), true);
  is(`${label} · no trailing space on any line`, /[ \t]$/m.test(text), false);
}
is("the whole catalogue ticked draws all eight, and the separator only between them",
  withFields("detailsFields", CATALOGUE_IDS, "details", [TEAMED], "item").text
    .split(" — ")[1].split(" · ").length, 8);

// -- 16j. `moveField` DIRECTLY, because no harness in this repository can drive the
// drag: `boot-smoke` has no layout and no paint, so it cannot put a pointer in the
// top half of a row. This is the half of the cost of decision 11 that CAN be paid
// here; §7 step 31 is the browser pass that pays the rest.
const L = ["a", "b", "c", "d"].map((id) => ({ id, on: false }));
const ids = (list) => list.map((one) => one.id);
// `to` is the GAP the row lands in, so "after the last row" is `list.length`.
is("moveField · the middle, downward", ids(f.moveField(L, 1, 3)), ["a", "c", "b", "d"]);
is("moveField · the middle, upward", ids(f.moveField(L, 2, 0)), ["c", "a", "b", "d"]);
is("moveField · the first row to the very end", ids(f.moveField(L, 0, 4)), ["b", "c", "d", "a"]);
is("moveField · the last row to the very front", ids(f.moveField(L, 3, 0)), ["d", "a", "b", "c"]);
// Dropping a row on its own top half and on its own bottom half are the same
// no-op, and they arrive as two different numbers -- which is the off-by-one.
is("moveField · dropped above itself is a no-op", ids(f.moveField(L, 1, 1)), ["a", "b", "c", "d"]);
is("moveField · dropped below itself is the same no-op", ids(f.moveField(L, 1, 2)), ["a", "b", "c", "d"]);
is("moveField · an index past the end is refused, not clamped into a move",
  ids(f.moveField(L, 9, 0)), ["a", "b", "c", "d"]);
is("moveField · a negative index is refused too", ids(f.moveField(L, -1, 0)), ["a", "b", "c", "d"]);
// A dataset carries strings. `"1" >= 0` is true and `splice("1", 1)` works, but
// `Number("x")` is NaN, which passes both comparisons and would splice the FIRST row.
is("moveField · a string index is refused, because a dataset carries strings",
  ids(f.moveField(L, "1", 3)), ["a", "b", "c", "d"]);
is("moveField · and NaN is refused rather than moving the first row",
  ids(f.moveField(L, NaN, 3)), ["a", "b", "c", "d"]);
is("moveField · a target past the end lands at the end", ids(f.moveField(L, 0, 99)), ["b", "c", "d", "a"]);
is("moveField · a target below zero lands at the front", ids(f.moveField(L, 3, -5)), ["d", "a", "b", "c"]);
is("moveField · it never mutates the list it was given", ids(L), ["a", "b", "c", "d"]);
is("and it returns a NEW array even when it refuses", f.moveField(L, 9, 0) !== L, true);

is("enabledFields keeps the stored order and drops the unticked",
  f.enabledFields([{ id: "b", on: true }, { id: "a", on: false }, { id: "c", on: true }]), ["b", "c"]);
// It does NOT re-check that `on` is exactly `true`, and that is deliberate rather
// than missing: every preference is range-checked once, in `normalisePrefs`, so the
// rest of the script can treat the result as a fact -- a second check here would be a
// second rule that can disagree with the first. `store-smoke` step 4 is where a
// hand-edited `on: "yes"` is proved not to tick anything.
is("an empty selection is an empty list, never a default put back",
  f.enabledFields(listOf([])), []);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
