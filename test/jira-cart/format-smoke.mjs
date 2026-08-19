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
               "bulkfetchIssues","readIssues","cleanText","uniqueName","alertLine"];
const harness = `
  ${slice("const HTML_ESCAPES = {", "\n  };")}
  ${names.map(extract).join("\n")}
  ${slice("const EXPORTS = [", "\n  ];")}
  return {${names.join(",")}, EXPORTS};
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
is("Links html", f.format("links", THREE, "collection").html,
  `<ul><li><a href="${URL}/RDC-14817">RDC-14817</a>&nbsp;Outline inside the edited field</li>` +
  `<li><a href="${URL}/RDC-23716">RDC-23716</a>&nbsp;Rundown grid does not refresh after a move</li>` +
  `<li><a href="${URL}/GLX-402">GLX-402</a></li></ul>`);
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
  `<ul><li><a href="${URL}/GLX-402">GLX-402</a></li></ul>`);
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
is("Links <li> count equals items", (f.format("links", THREE, "collection").html.match(/<li>/g) || []).length, 3);

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
is("four exports, and the four labels", f.EXPORTS.map((one) => one.label), ["🔗 Links", "📃 Names", "🔑 Keys", "🔍 Search"]);
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

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
