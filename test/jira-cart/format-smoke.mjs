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
               "detailBit","detailBits","detailChip","formatDetails","byLabel","bandFor","bandPatch","bandGroups",
               "reportGroups","formatReport",
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
  /* THE BAND TABLE AND THE RANK BEHIND ONE OF ITS SEVEN, sliced in for the reason
     the catalogue above is: section 17 asserts things ABOUT them -- that they name
     the same ids as the preference's own vocabulary, that every one of them groups
     something, and that the three status categories come out in Atlassian's order
     and not in alphabetical one. A copy here would assert that a copy is right. */
  ${slice("const STATUS_BANDS = [", "\n  ];")}
  ${slice("const BANDS = [", "\n  ];")}
  ${slice("const BAND_IDS = [", "\n  ];")}
  ${slice("const BAND_ROW_FIELD =", "\n")}
  ${slice("const NO_BAND =", "\n")}
  ${slice("const TEAM_FIELD =", "\n")}
  ${slice("const SUMMARY_FIELDS =", "\n")}
  ${slice("const DETAIL_FIELDS = [", "\n  ];")}
  return {${names.join(",")}, EXPORTS, SHAPES, LINE_SHAPE_IDS, SUMMARY_FIELDS, DETAIL_FIELDS,
          FIELD_CATALOGUE, SETTINGS_TABS, DEFAULT_PREFS,
          MUTED_INK, LOZENGE, PRIORITY_INK, LIST_ITEM_STYLE,
          NO_PRIORITY, NO_TEAM, TEAM_FIELD, BANDS, BAND_IDS, BAND_ROW_FIELD, NO_BAND, STATUS_BANDS};
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
/* WHICH FORMAT THE SINGLE-ISSUE GESTURES MEAN, added at 1.3.0. The rail's copy button
   and the right-click menu's `Copy link` both want "one issue, written the way this
   collection would write it", and neither names a format: they read this flag, the
   same way 🔍 Search's destination is read off `opens`.

   EXACTLY ONE, and it has to be Links. 📃 Names and 🔑 Keys emit no URL, so neither
   is a link at all; 📋 Details and 📊 Report would put a field tail on a single
   hovered issue; and 🔍 Search has no single-item form by §2.8's own rule, which the
   check below re-derives rather than restates. A second entry carrying this flag
   would mean two formats behind one button and no way to say which. */
is("exactly one entry is what a single-issue gesture copies",
  f.EXPORTS.filter((one) => one.single).map((one) => one.kind), ["links"]);
is("and it is one that actually copies, and admits item scope",
  (() => {
    const entry = f.EXPORTS.find((one) => one.single);
    return [!entry.opens, !entry.scopes || entry.scopes.includes("item"), !entry.fields, !entry.bands];
  })(), [true, true, true, true]);
// The bytes at item scope are §15's business, over all five shapes. What this says is
// that the flag and the scope meet: `format` must not refuse the very call the
// gesture makes.
is("so the gesture's own call returns a payload rather than null",
  !!f.format(f.EXPORTS.find((one) => one.single).kind, [THREE[0]], "item")?.text, true);
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
// The call moved to the generalised grouper at 1.2.0 and the CLAIM did not: the
// shipped pair is still priority then team, and the sub-band is still joined on the
// id. `reportGroups` takes the stored pair now because `format` reads it (§2.15).
is("grouping is by teamId, so two teams with one name cannot merge",
  f.reportGroups([
    { key: "A", priority: "P1", team: "Same", teamId: "x" },
    { key: "B", priority: "P1", team: "Same", teamId: "y" },
  ], ["priority", "team"])[0].groups.length, 2);

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

// ---- 17. SEVEN BANDS, AND ONE OF THEM REPEATS AN ISSUE (ADR §2.15, decisions 12
// to 15). Section 14 above is the SHIPPED PAIR and it is deliberately untouched:
// every byte it asserts is 1.1.0's, and the whole requirement of making the bands
// settable is that those bytes do not move. This section is everything the other
// pairs do.
//
// `reportBand1 = "none"` CANNOT ARRIVE HERE. `normalisePrefs` range-checks both keys
// against `BAND_IDS` on the way in and on the way out and band 1 has no `none` in
// its vocabulary, which `store-smoke` holds. What this file holds is what the
// RENDERER does if one somehow reaches it, which is a different question and is
// asserted below.
const withBands = (pair, run) =>
  withPrefs({ reportBand1: pair[0], reportBand2: pair[1] }, run);
const banded = (pair, items) =>
  withBands(pair, () => f.format("report", items, "collection"));
// The two heading levels, read back out of the plain flavour. `**P1**` and `*Core*`
// are told apart by the second character, which is what makes a band heading and a
// sub-band heading two different things rather than one nested one.
const heads = (text) => text.split("\n").filter((l) => /^\*\*/.test(l)).map((l) => l.slice(2, -2));
const subs = (text) => text.split("\n").filter((l) => /^\*[^*]/.test(l)).map((l) => l.slice(1, -1));
const rowsIn = (text) => (text.match(/^- /gm) || []).length;

// -- 17a. THE TABLE AND THE VOCABULARY MUST NAME THE SAME IDS, held the way 15a
// holds the shapes and 16b holds the catalogue. A band this table lacks is a
// preference that groups nothing; one `BAND_IDS` lacks is a band no dropdown can
// reach and no stored value can name.
is("the band table and the preference's vocabulary name the same ids, in the same order",
  f.BANDS.map((band) => band.id), f.BAND_IDS);
is("seven bands over eight catalogue fields", [f.BANDS.length, f.FIELD_CATALOGUE.length], [7, 8]);
// TIME REMAINING MAY NOT BAND (decision 14). Its band order would be string order
// over durations, and "10m" < "2d" < "9h" reads as a broken report rather than a
// configured one. This is the assertion that says so out loud, so that adding it
// back breaks a check with the reason written beside it.
// Resolved through `BAND_ROW_FIELD` first, or `status` would read as unbandable
// when what is true of it is narrower: it bands, by its CATEGORY and never by its
// name, which is the next assertion down.
const bandedRowFields = new Set(f.BANDS.map((band) => f.BAND_ROW_FIELD[band.id] ?? band.id));
is("and time remaining is the one field that may not band",
  f.FIELD_CATALOGUE.map((one) => one.id).filter((id) => !bandedRowFields.has(id)), ["remaining"]);
// STATUS BANDS BY CATEGORY AND NEVER BY NAME (decision 13), which is why this one id
// is not a field id. `Dev In progress` < `Dev Resolved` < `To Do` is alphabetical
// noise dressed as a workflow, and it is what a band on the row field would give.
is("the one band that is not a field is the status CATEGORY, and there is no band on the name",
  f.BAND_IDS.filter((id) => !f.FIELD_CATALOGUE.some((one) => one.id === id)), ["category"]);
is("but every band still knows which row field it is, so the ⚙ panel can mark it",
  f.BANDS.map((band) => f.BAND_ROW_FIELD[band.id] ?? band.id)
    .filter((id) => !f.FIELD_CATALOGUE.some((one) => one.id === id)), []);
is("every band names an absent value rather than leaving a blank heading",
  f.BANDS.filter((band) => typeof band.empty === "string" && band.empty).length, 7);
// The two tables that name the two band keys, held together the way 16c holds the
// two that name the field lists. A key a TAB edits and no EXPORT reads is a dropdown
// that changes nothing; a key an export reads and no tab edits is a preference with
// no way to reach it.
is("the tab that edits the bands and the export that reads them name the same keys",
  f.SETTINGS_TABS.flatMap((one) => one.bands ?? []),
  f.EXPORTS.flatMap((one) => one.bands ?? []));
is("and 📊 Report is the only export with any, because it is the only one with headings",
  f.EXPORTS.filter((one) => one.bands).map((one) => one.kind), ["report"]);
is("both keys hold a real band id, so a fresh install groups by something",
  f.EXPORTS.flatMap((one) => one.bands ?? []).map((key) => f.BAND_IDS.includes(f.DEFAULT_PREFS[key])),
  [true, true]);
is("and the shipped pair is still priority then team, which is what keeps 1.1.0's bytes",
  [f.DEFAULT_PREFS.reportBand1, f.DEFAULT_PREFS.reportBand2], ["priority", "team"]);
// Section 14 asserts the default pair without naming it. This says the two are the
// same thing, so neither can drift into asserting something the other does not.
is("section 14's report IS the pair named explicitly, and not a shape that happens to agree",
  banded(["priority", "team"], REPORT), f.format("report", REPORT, "collection"));

// -- 17b. THE THREE STATUS CATEGORIES, AND THE ONE RANK TABLE IN THE FILE. It does
// not reopen §2.15's refusal of a rank for PRIORITY: priority names are this
// instance's own and already sort correctly as strings, so a table over them could
// only fall out of step with Jira. These three are Atlassian's fixed vocabulary and
// they do not sort meaningfully as strings in either direction.
is("the rank is Atlassian's own three, in Atlassian's order",
  f.STATUS_BANDS.map(([key]) => key), ["new", "indeterminate", "done"]);
is("and one list gives both the label and the rank, so a heading and its place cannot disagree",
  f.STATUS_BANDS.map(([, label]) => label), ["To do", "In progress", "Done"]);
const CATS = [
  { key: "RDC-1", summary: "a", category: "done" },
  { key: "RDC-2", summary: "b", category: "new" },
  { key: "RDC-3", summary: "c", category: "indeterminate" },
  { key: "RDC-4", summary: "d" },
];
const cats = heads(banded(["category", f.NO_BAND], CATS).text);
is("status bands come out in workflow order, absent last", cats,
  ["To do", "In progress", "Done", "No status"]);
is("and alphabetical order is a DIFFERENT answer, which is the whole reason for the rank",
  [...cats].sort(), ["Done", "In progress", "No status", "To do"]);
is("a category this build does not know ranks last, where every absent value goes",
  heads(banded(["category", f.NO_BAND], [
    { key: "A", summary: "a", category: "unheard-of" },
    { key: "B", summary: "b", category: "new" },
  ]).text), ["To do", "No status"]);

// -- 17c. EACH OF THE SEVEN AS BAND 1, WITH BAND 2 = None. One item carrying every
// field and one Jira said nothing about, so each band is asserted twice over: the
// real value becomes the heading, and the absent one is NAMED and sorts LAST.
const FULL = {
  key: "RDC-1513", summary: "Markers [7] Dev (player)",
  type: "Bug", status: "Dev In progress", category: "indeterminate", priority: "P1",
  assignee: "Ann Archer", assigneeId: "u-ann", team: "Planning", teamId: "t-plan",
  fixVersions: ["Flex 2026.9.0"], remaining: "2d",
  parent: { key: "RDC-100", summary: "Markers panel" },
};
const NOTHING = { key: "GLX-402", summary: "" };
const REAL = {
  priority: "P1", team: "Planning", category: "In progress", assignee: "Ann Archer",
  type: "Bug", fixv: "Flex 2026.9.0", parent: "RDC-100 Markers panel",
};
for (const band of f.BANDS) {
  const out = banded([band.id, f.NO_BAND], [FULL, NOTHING]).text;
  is(`band 1 = ${band.id} · the value is the heading, and the absent one is named and last`,
    heads(out), [REAL[band.id], band.empty]);
  is(`band 1 = ${band.id} · band 2 = None means no sub-heading at all`, subs(out), []);
  is(`band 1 = ${band.id} · and no heading is ever blank`, heads(out).every(Boolean), true);
}

// -- 17d. AND EACH OF THE SEVEN AS BAND 2, because empty-sorts-last has to hold in
// both bands and only the inner one is nested inside a group.
const PAIRED = [{ ...FULL, priority: "P1" }, { ...NOTHING, priority: "P1" }];
for (const band of f.BANDS) {
  const out = banded(["priority", band.id], PAIRED).text;
  is(`band 2 = ${band.id} · one band above it, whatever it is`, heads(out), ["P1"]);
  is(`band 2 = ${band.id} · the absent value is named and last inside the group too`,
    subs(out),
    // A DUPLICATE PAIR CANNOT ARRIVE FROM A CLICK OR FROM STORAGE any more -- 17k
    // and `store-smoke` hold the three mechanisms that stop it, after the user pressed
    // `Team` then `Team` on 2026-08-25 and reported it. What the RENDERER does with
    // one is a separate question from whether it can happen, and it is asserted here
    // for the reason 17g asserts an unresolvable band 1: a preference reaching a
    // renderer must never THROW on the copy path. One sub-heading repeating the
    // heading above it is the answer, and it is harmless.
    band.id === "priority" ? ["P1"] : [REAL[band.id], band.empty]);
}

// -- 17e. FIX VERSION BANDS, AND THE ONE PROPERTY THEY COST. An issue in two
// releases is listed under BOTH, so a paste has one line per issue-and-band rather
// than per issue -- and *lines equals items* is not the check there (decision 15).
// §2.14's "no format ever drops an item" is untouched: nothing vanishes, something
// repeats, and the two must not be conflated.
//
// The sample is A.9's, and the two-fix-version issue in it is the only kind that can
// expose this -- the same row that exposed the original separator bug.
const fixv = banded(["fixv", f.NO_BAND], DETAILED);
is("fix version bands are the releases themselves, absent last", heads(fixv.text),
  ["Flex 2026.6.x (LTS track)", "Flex 2026.9.0", "Pyr 2026.8.0 (Release - Active)", "No fix version"]);
is("the line count is items PLUS ONE, because one issue is in two releases",
  rowsIn(fixv.text), DETAILED.length + 1);
is("and it is that issue that appears twice, under both of its releases",
  (fixv.text.match(/\[RDC-28369\]/g) || []).length, 2);
is("NOTHING IS DROPPED, which is the rule the exception must not be read as touching",
  DETAILED.every((one) => new RegExp(`\\[${one.key}\\]`).test(fixv.text)), true);
is("both flavours agree about the extra line", (fixv.html.match(/<li /g) || []).length,
  DETAILED.length + 1);
// The same exception inside a group, because a sub-band is a band.
is("a multi-valued SUB-band repeats an issue too",
  rowsIn(banded(["priority", "fixv"], DETAILED).text), DETAILED.length + 1);
// EVERY OTHER BAND KEEPS THE PROPERTY, which is what makes fix version the stated
// exception rather than the new rule.
for (const band of f.BANDS.filter((one) => !one.multi)) {
  is(`band ${band.id} · lines still equals items`,
    rowsIn(banded([band.id, f.NO_BAND], DETAILED).text), DETAILED.length);
}
is("and fix version is the only band that carries the flag saying it does not",
  f.BANDS.filter((one) => one.multi).map((one) => one.id), ["fixv"]);

// -- 17f. GROUP BY ID, LABEL BY NAME. Two teams can be given the same name and a
// heading that merged them would be a WRONG report rather than an ugly one (appendix
// C.4). The same is true of two people, and of two epics with the same summary --
// which is §6 item 7's warning about grouping from the DOM, and the reason the band
// comes from `bulkfetch`'s `parent` rather than from a board card's display string.
const twice = (band, items) => f.reportGroups(items, [band, f.NO_BAND]).map((one) => one.heading);
is("two teams with one name are two bands, and the heading says the name twice",
  twice("team", [
    { key: "A", team: "Same", teamId: "x" },
    { key: "B", team: "Same", teamId: "y" },
  ]), ["Same", "Same"]);
is("two people with one display name are two bands as well",
  twice("assignee", [
    { key: "A", assignee: "Sam Lee", assigneeId: "u1" },
    { key: "B", assignee: "Sam Lee", assigneeId: "u2" },
  ]), ["Sam Lee", "Sam Lee"]);
is("and two epics with one summary are two bands, joined on the key and not the words",
  twice("parent", [
    { key: "A", parent: { key: "RDC-1", summary: "Same words" } },
    { key: "B", parent: { key: "RDC-2", summary: "Same words" } },
  ]), ["RDC-1 Same words", "RDC-2 Same words"]);
is("an epic with no summary is its key alone, rather than a heading with a space in it",
  twice("parent", [{ key: "A", parent: { key: "RDC-1", summary: "" } }]), ["RDC-1"]);
// A team that came back with a name and no id still gets its own group rather than
// joining the nameless one. Two items with no team at all share the one empty group.
is("a named team with no id is its own band, and the nameless ones share one",
  twice("team", [
    { key: "A", team: "Named", teamId: "" },
    { key: "B" },
    { key: "C" },
  ]), ["Named", "No team"]);
// readIssues keeps the id the assignee band joins on. It costs no extra request:
// `accountId` arrives inside the assignee object the Cart already asks for.
const assigned = f.readIssues([{ id: "1", key: "RDC-11", fields: { summary: "x",
  assignee: { displayName: "William CHUANG", accountId: "5b10a2c8" } } }]).get("RDC-11");
is("readIssues keeps the assignee's account id, which is what the band joins on",
  assigned.assigneeId, "5b10a2c8");
is("and an absent one is empty, not undefined", bare.assigneeId, "");

// -- 17g. A BAND 1 THIS BUILD CANNOT RESOLVE DEGRADES TO A FLAT LIST. It cannot
// arrive -- `normalisePrefs` range-checks both keys and band 1 has no `none` -- but
// what the renderer does with one is a separate question from whether it can happen,
// and a copy that THREW would be the failure §2.8's scar is about. So it takes the
// same path `None` takes in band 2: one group, no heading.
const flat = banded([f.NO_BAND, f.NO_BAND], DETAILED);
is("no resolvable band is no heading at all, rather than a throw on the copy path",
  [heads(flat.text), subs(flat.text)], [[], []]);
is("an id this build does not know goes the same way, because both are just unresolved",
  banded(["haiku", "haiku"], DETAILED), flat);
// AND THAT IS WHY BAND 1 HAS NO `None` (decision 12): a report with no bands is not
// a report, it is 📋 Details spelled differently -- byte for byte, given the same
// selection, because both build their rows from the same line shape and the same
// `detailBits`.
is("a report with no bands IS 📋 Details, which is exactly why the option is not offered",
  flat.text,
  withFields("detailsFields", f.enabledFields(f.DEFAULT_PREFS.reportFields),
    "details", DETAILED).text);

// -- 17h. A REPRESENTATIVE HANDFUL OF PAIRS, BOTH FLAVOURS. The two versions must
// agree about what the document IS -- the same headings in the same order and the
// same number of rows -- exactly as §2.8 already requires of Links and Details.
const FOUR = [
  FULL,
  { key: "RDC-28369", summary: "Full screen mode doesnt show any player controls",
    type: "Bug", status: "To Do", category: "new", priority: "P1",
    assignee: "Rajesh KRISHNAPPA", assigneeId: "u-raj", team: "", teamId: "",
    fixVersions: ["Flex 2026.6.x (LTS track)", "Flex 2026.9.0"], remaining: "0m", parent: null },
  { key: "RDC-1517", summary: "Markers [4] Dev (front-end) - Select Markers",
    type: "Story", status: "Done", category: "done", priority: "P2",
    assignee: "", assigneeId: "", team: "Core", teamId: "t-core",
    fixVersions: [], remaining: "0m", parent: { key: "RDC-100", summary: "Markers panel" } },
  NOTHING,
];
const PAIRS = [
  ["category", "team"], ["fixv", "priority"], ["parent", "assignee"],
  ["team", "category"], ["type", "fixv"], ["assignee", f.NO_BAND],
  ["priority", "team"], [f.NO_BAND, f.NO_BAND],
];
for (const pair of PAIRS) {
  const out = banded(pair, FOUR);
  const name = pair.join(" then ");
  // No heading in this sample carries a character `escapeHtml` would move, which is
  // what lets the two flavours be compared as strings at all.
  is(`${name} · the two flavours agree about the bands`,
    [...out.html.matchAll(/<strong>([^<]*)<\/strong>/g)].map((m) => m[1]), heads(out.text));
  is(`${name} · and about the sub-bands`,
    [...out.html.matchAll(/<em>([^<]*)<\/em>/g)].map((m) => m[1]), subs(out.text));
  is(`${name} · and about how many rows there are`,
    (out.html.match(/<li /g) || []).length, rowsIn(out.text));
  is(`${name} · no heading is blank in either flavour`,
    [...heads(out.text), ...subs(out.text)].every(Boolean), true);
  is(`${name} · every item is still in the document`,
    FOUR.every((one) => new RegExp(`\\[${one.key}\\]`).test(out.text)), true);
  is(`${name} · no trailing space on any line`, /[ \t]$/m.test(out.text), false);
  // -- THE FIVE PASTE RULES, on byte strings 1.1.0 could not emit. Each is a
  // measurement from a real paste into Outlook and Teams (§2.14, appendix A.9), and
  // each is a change a later session would otherwise make on reasonable instinct.
  is(`${name} · rule 5: no font-size anywhere`, /font-size/.test(out.html), false);
  is(`${name} · rule 2: nothing depends on opacity`, /opacity/.test(out.html), false);
  is(`${name} · rule 1: no separator is a box`, /border:/.test(out.html), false);
  is(`${name} · rule 3: every background is one of the pale lozenge grounds`,
    [...out.html.matchAll(/background:(#[0-9a-f]{6})/gi)].map((m) => m[1])
      .every((one) => pale.includes(one)), true);
  is(`${name} · rule 3: no colour the palette does not name`,
    [...out.html.matchAll(/color:(#[0-9a-f]{6})/gi)].map((m) => m[1].toLowerCase())
      .every((one) => allowed.has(one)), true);
  // -- RULE 4 AND THE HEADINGS. A tag cannot be flattened the way a styled span can,
  // and a pasted `<h3>` would join the host document's outline.
  is(`${name} · headings are tags and not styled spans`,
    /<(strong|em) style/.test(out.html), false);
  is(`${name} · and never <h1> to <h6>`, /<h[1-6]/.test(out.html), false);
}

// -- 17i. ONE NON-DEFAULT PAIR, BYTE FOR BYTE, because everything above asserts a
// shape and something has to assert the bytes. Status category then assignee, over
// the shipped report field list.
const TWO = [
  { key: "RDC-1", summary: "one", type: "Bug", status: "To Do", category: "new",
    priority: "P1", assignee: "Ann", assigneeId: "u1", team: "Planning", teamId: "t1",
    fixVersions: [], remaining: "", parent: null },
  { key: "RDC-2", summary: "two", type: "Story", status: "Done", category: "done",
    priority: "P2", assignee: "", assigneeId: "", team: "", teamId: "",
    fixVersions: [], remaining: "", parent: null },
];
is("status category then assignee, byte for byte", banded(["category", "assignee"], TWO).text,
  [
    "**To do**",
    "",
    "*Ann*",
    `- [RDC-1](${URL}/RDC-1) one — Bug · To Do · Ann`,
    "",
    "**Done**",
    "",
    "*Unassigned*",
    `- [RDC-2](${URL}/RDC-2) two — Story · Done`,
  ].join("\n"));
is("and the same document in the flavour Outlook and Teams read",
  banded(["category", "assignee"], TWO).html,
  '<p style="margin:14px 0 2px"><strong>To do</strong></p>' +
  '<p style="margin:8px 0 2px"><em>Ann</em></p>' +
  `<ul><li style="${f.LIST_ITEM_STYLE}">` +
  `<a href="${URL}/RDC-1" style="font-weight:600">RDC-1</a>&nbsp;one` +
  `<span style="color:${f.MUTED_INK}"> — </span>` +
  `<span style="color:${f.MUTED_INK};font-weight:600">Bug</span>` +
  `<span style="color:${f.MUTED_INK}"> · </span>` +
  `<span style="background:${f.LOZENGE.new.bg};color:${f.LOZENGE.new.fg};border-radius:3px;padding:0 6px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">To Do</span>` +
  `<span style="color:${f.MUTED_INK}"> · </span>` +
  `<span style="color:${f.MUTED_INK}">Ann</span>` +
  "</li></ul>" +
  '<p style="margin:14px 0 2px"><strong>Done</strong></p>' +
  '<p style="margin:8px 0 2px"><em>Unassigned</em></p>' +
  `<ul><li style="${f.LIST_ITEM_STYLE}">` +
  `<a href="${URL}/RDC-2" style="font-weight:600">RDC-2</a>&nbsp;two` +
  `<span style="color:${f.MUTED_INK}"> — </span>` +
  `<span style="color:${f.MUTED_INK};font-weight:600">Story</span>` +
  `<span style="color:${f.MUTED_INK}"> · </span>` +
  `<span style="background:${f.LOZENGE.done.bg};color:${f.LOZENGE.done.fg};border-radius:3px;padding:0 6px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Done</span>` +
  "</li></ul>");

// -- 17j. A TICKED FIELD IS PRINTED, BAND OR NOT (decision 8), and the band does not
// veto it. The shipped defaults leave priority and team unticked, which is why the
// bytes above have neither on the row -- but that is a DEFAULT and not a rule, and
// §2.14 rule 4 is the ground: a field that appears only in a heading is a field whose
// meaning depends on the row's position, and these lists are reshuffled by hand.
is("the default report list leaves the two banded fields off the row",
  f.enabledFields(f.DEFAULT_PREFS.reportFields).filter((id) => ["priority", "team"].includes(id)), []);
is("but ticking a banded field puts it on the row as well as in the heading",
  withPrefs({ reportBand1: "priority", reportBand2: f.NO_BAND, reportFields: listOf(["priority"]) },
    () => f.format("report", [TWO[0]], "collection")).text,
  ["**P1**", "", `- [RDC-1](${URL}/RDC-1) one — P1`].join("\n"));

/* -- 17k. THE TWO BANDS MAY NOT NAME THE SAME FIELD, and `bandPatch` is the half of
   that rule a press reaches. Held DIRECTLY, the way `moveField` is and for the same
   reason: it is a whole rule behind one control, so the handler stays one line and
   the rule is covered without a click.

   REVERSED FROM USE ON 2026-08-25. Ticket 05 shipped the pair free to duplicate, on
   the reasoning that `Team` under `Team` is useless, truthful, and visible the moment
   it is pasted -- so refusing it was more machinery than the mistake was worth. The
   user pressed it and reported it as a defect, which is what it is: a report whose
   every sub-heading repeats the heading above it is not a configuration anybody
   chose, and "you can see that it is wrong" is not the same as "you meant it". */
const PAIR = { reportBand1: "priority", reportBand2: "team" };
is("an ordinary change is one key, and the other band is left alone",
  f.bandPatch("reportBand1", "type", PAIR), { reportBand1: "type" });
is("and so is an ordinary change to band 2",
  f.bandPatch("reportBand2", "fixv", PAIR), { reportBand2: "fixv" });
// THE SWAP. Asking to group by the field that was the sub-band is a reorder, which is
// the one thing the two dropdowns exist to do -- so it is one press and nothing is
// thrown away. Band 2 does not acquire a value nobody chose: it receives the one band
// 1 just gave up, in the same gesture.
is("moving band 1 onto band 2's field SWAPS the two, in one press",
  f.bandPatch("reportBand1", "team", PAIR), { reportBand1: "team", reportBand2: "priority" });
is("and it swaps from the other side too, so the rule is not a fact about one control",
  f.bandPatch("reportBand2", "priority", PAIR), { reportBand2: "priority", reportBand1: "team" });
// BAND 1 MAY NEVER RECEIVE `none`. This cannot arise from a click -- band 2's
// dropdown does not offer band 1's field -- and the guard is here so that the rule is
// a property of the function rather than of an options list a later session can edit.
is("but band 1 never receives none, because a report with no bands is 📋 Details",
  f.bandPatch("reportBand2", "priority", { reportBand1: "priority", reportBand2: f.NO_BAND }),
  { reportBand2: "priority" });
is("choosing None is always just the one key",
  f.bandPatch("reportBand2", f.NO_BAND, PAIR), { reportBand2: f.NO_BAND });
// Setting a band to what it already holds is a no-op that still writes the one key --
// there is no OTHER band holding it, so there is nothing to swap with.
is("setting a band to what it already holds swaps nothing",
  f.bandPatch("reportBand1", "priority", PAIR), { reportBand1: "priority" });
is("a key no tab names writes itself and nothing else, rather than throwing",
  f.bandPatch("haiku", "team", PAIR), { haiku: "team" });
// NO PAIR IT CAN PRODUCE IS A DUPLICATE, swept rather than argued: every band, from
// every starting pair, against both keys.
for (const key of ["reportBand1", "reportBand2"]) {
  for (const from of f.BAND_IDS) {
    const start = { reportBand1: from, reportBand2: from === "team" ? "priority" : "team" };
    const bad = f.BAND_IDS.map((to) => ({ ...start, ...f.bandPatch(key, to, start) }))
      .filter((next) => next.reportBand1 === next.reportBand2);
    is(`no press on ${key} from ${from} can produce a duplicate`, bad, []);
  }
}

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
