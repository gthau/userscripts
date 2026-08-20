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
               "detailBits","detailChip","formatDetails","byLabel","reportGroups","formatReport",
               "bulkfetchIssues","readIssues","cleanText","uniqueName","alertLine"];
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
  ${slice("const EXPORTS = [", "\n  ];")}
  ${slice("const LIST_ITEM_STYLE =", "\n")}
  ${slice("const NO_PRIORITY =", "\n")}
  ${slice("const NO_TEAM =", "\n")}
  ${slice("const TEAM_FIELD =", "\n")}
  ${slice("const SUMMARY_FIELDS =", "\n")}
  ${slice("const DETAIL_FIELDS = [", "\n  ];")}
  return {${names.join(",")}, EXPORTS, SUMMARY_FIELDS, DETAIL_FIELDS,
          MUTED_INK, LOZENGE, PRIORITY_INK, LIST_ITEM_STYLE,
          NO_PRIORITY, NO_TEAM, TEAM_FIELD};
`;
const SAFE_KEY_RE = /^[A-Z][A-Z0-9]*-\d+$/;
const location = { origin: "https://dalet.atlassian.net" };
const f = new Function("SAFE_KEY_RE", "location", harness)(SAFE_KEY_RE, location);

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
is("and the other three still build a clipboard payload", f.EXPORTS.filter((one) => !one.opens).every((one) => !!one.build(THREE, "collection").text), true);

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

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
