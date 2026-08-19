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

// Pull one function declaration out of the script by brace matching, so the test
// runs the real code rather than a copy of it.
function extract(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`no ${name}`);
  let depth = 0, i = src.indexOf("{", start);
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`unbalanced ${name}`);
}

const SAFE_KEY_RE = /^[A-Z][A-Z0-9]*-\d+$/;
const ISSUE_PATH_RE = /^\/browse\/([A-Za-z][A-Za-z0-9]*-\d+)(?:\/|$)/;
const location = { href: "https://dalet.atlassian.net/browse/RDC-1" };
const crypto = { randomUUID: () => "uuid-fixed" };
const names = ["cleanText", "stripKeyPrefix", "dropEnterKeyHint", "keyFromHref", "normaliseCollections", "buildCollectedCss"];
const code = names.map(extract).join("\n");
const make = new Function("SAFE_KEY_RE", "ISSUE_PATH_RE", "location", "crypto", `${code}; return {${names.join(",")}};`);
const f = make(SAFE_KEY_RE, ISSUE_PATH_RE, location, crypto);

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

// cleanText: the timeline anchor, whose screen-reader tail defeated the survey's regex
is("cleanText timeline anchor", f.cleanText("RDC-21069, (opens new window)"), "RDC-21069,");
is("cleanText mid-string", f.cleanText("Foo (opens new window) bar"), "Foo bar");
is("cleanText collapses", f.cleanText("  a \n b  "), "a b");
is("cleanText null", f.cleanText(null), "");

// stripKeyPrefix
is("strip exact key", f.stripKeyPrefix("RDC-21069", "RDC-21069"), "");
is("strip key + comma", f.stripKeyPrefix("RDC-21069,", "RDC-21069"), "");
is("strip key + colon", f.stripKeyPrefix("RDC-1: Outline", "RDC-1"), "Outline");
is("strip key + space", f.stripKeyPrefix("RDC-1 Outline", "RDC-1"), "Outline");
is("no cut into longer key", f.stripKeyPrefix("RDC-14200 Outline", "RDC-1420"), "RDC-14200 Outline");
is("leaves a plain summary", f.stripKeyPrefix("Outline inside the field", "RDC-1"), "Outline inside the field");
is("strip en dash", f.stripKeyPrefix("RDC-1 – Outline", "RDC-1"), "Outline");

// dropEnterKeyHint
is("enter-key hint", f.dropEnterKeyHint("RDC-1 Outline. Use the enter key to load the work item."), "RDC-1 Outline");
is("enter-key hint reworded", f.dropEnterKeyHint("RDC-1 Outline. Use the enter key to open it."), "RDC-1 Outline");
is("no hint", f.dropEnterKeyHint("RDC-1 Outline."), "RDC-1 Outline.");

// keyFromHref
is("relative href", f.keyFromHref("/browse/rdc-14817"), "RDC-14817");
is("href with query", f.keyFromHref("/browse/RDC-1?focusedCommentId=1"), "RDC-1");
is("href with sub-path", f.keyFromHref("/browse/RDC-1/worklog"), "RDC-1");
is("absolute href", f.keyFromHref("https://dalet.atlassian.net/browse/GLX-402"), "GLX-402");
is("not an issue", f.keyFromHref("/browse/notakey"), null);
is("not a browse path", f.keyFromHref("/jira/software/projects/RDC/boards/57"), null);
is("no digits", f.keyFromHref("/browse/RDC-"), null);

// normaliseCollections
is("good blob", f.normaliseCollections([{ id: "a", name: "Scratch", items: [{ key: "rdc-1", summary: "S" }, { key: "GLX-402" }] }]),
  [{ id: "a", name: "Scratch", items: [{ key: "RDC-1", summary: "S" }, { key: "GLX-402" }] }]);
is("issueId as a number", f.normaliseCollections([{ id: "a", name: "n", items: [{ key: "RDC-1", issueId: 1420631 }] }]),
  [{ id: "a", name: "n", items: [{ key: "RDC-1", issueId: "1420631" }] }]);
is("missing id is minted", f.normaliseCollections([{ name: "n", items: [] }]), [{ id: "uuid-fixed", name: "n", items: [] }]);
is("not an array", f.normaliseCollections({ a: 1 }), null);
is("bad item", f.normaliseCollections([{ name: "n", items: [{ key: 5 }] }]), null);
is("unsafe key", f.normaliseCollections([{ name: "n", items: [{ key: "RDC 1" }] }]), null);
is("missing name", f.normaliseCollections([{ items: [] }]), null);
is("empty array stays empty", f.normaliseCollections([]), []);

// buildCollectedCss
const css = f.buildCollectedCss(["RDC-1", "rdc-2", "not a key"]);
is("only safe keys reach the sheet", /rdc-2|not a key/.test(css), false);
is("four anchorings", (css.match(/a\[href/g) || []).length, 4);
is("empty is a comment", /^\/\*/.test(f.buildCollectedCss([])), true);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
