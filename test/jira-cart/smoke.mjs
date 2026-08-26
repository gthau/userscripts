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
const ORIGIN = "https://dalet.atlassian.net";
const crypto = { randomUUID: () => "uuid-fixed" };
// `clamp` is here for `moveInList`, which calls it, and not for itself.
const names = ["cleanText", "stripKeyPrefix", "dropEnterKeyHint", "keyFromHref", "normaliseCollections", "buildCollectedCss",
               "clamp", "moveInList", "keysFromUriList"];
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

/* keysFromUriList -- WHAT A DROP CARRIES, TURNED INTO KEYS (ADR §2.9.3, 1.6.0). One
   parser for all three of the feature's sources, because all three hand over the same
   thing: a text/uri-list of this instance's `/browse/` URLs.

   The origin is a PARAMETER rather than a read of `location`, so the same-origin rule
   is stated in the signature and this file can drive it directly. */
is("one url", f.keysFromUriList("https://dalet.atlassian.net/browse/RDC-1", ORIGIN), ["RDC-1"]);
// RFC 2483 says CRLF, and `writeCollectionDragPayload` writes CRLF. A payload that
// arrived with bare LF is still a list, and a browser is not obliged to be tidy.
is("crlf between lines", f.keysFromUriList("https://dalet.atlassian.net/browse/RDC-1\r\nhttps://dalet.atlassian.net/browse/GLX-402", ORIGIN),
  ["RDC-1", "GLX-402"]);
is("bare lf too", f.keysFromUriList("https://dalet.atlassian.net/browse/RDC-1\nhttps://dalet.atlassian.net/browse/GLX-402", ORIGIN),
  ["RDC-1", "GLX-402"]);
// A `#` line is a comment per RFC 2483, and a blank line is nothing.
is("comments and blanks are skipped", f.keysFromUriList("# a comment\n\nhttps://dalet.atlassian.net/browse/RDC-1\n", ORIGIN), ["RDC-1"]);
is("lowercase is upper-cased, as everywhere else keys are read", f.keysFromUriList("https://dalet.atlassian.net/browse/rdc-14817", ORIGIN), ["RDC-14817"]);
is("a query and a sub-path are ignored", f.keysFromUriList("https://dalet.atlassian.net/browse/RDC-1/worklog?x=1", ORIGIN), ["RDC-1"]);
is("a relative line resolves against the origin", f.keysFromUriList("/browse/RDC-1", ORIGIN), ["RDC-1"]);
/* THE SAME-ORIGIN RULE. `issueUrl` rebuilds every link from `location.origin`, so a
   foreign host accepted here would be silently retargeted at this instance and stored
   as a key that means nothing on it. */
is("another Atlassian site is refused", f.keysFromUriList("https://other.atlassian.net/browse/RDC-1", ORIGIN), []);
is("and so is anything else", f.keysFromUriList("https://example.com/browse/RDC-1", ORIGIN), []);
// §2.1's decision is not overturned by a gesture: a key typed as plain text is
// invisible to the Cart, and the `text/plain` fallback goes through this same parser.
is("prose that spells a key is not a link", f.keysFromUriList("please look at RDC-999 today", ORIGIN), []);
is("our own plain-text line yields nothing, so the fallback never second-guesses us",
  f.keysFromUriList("- [RDC-1](https://dalet.atlassian.net/browse/RDC-1) A summary", ORIGIN), []);
is("a non-issue browse path is refused, as in keyFromHref", f.keysFromUriList("https://dalet.atlassian.net/browse/notakey", ORIGIN), []);
is("a board url is not an issue", f.keysFromUriList("https://dalet.atlassian.net/jira/software/projects/RDC/boards/57", ORIGIN), []);
// DEDUPLICATED HERE and not in the write, so one dropped list cannot insert the same
// issue at two positions.
is("a repeated url appears once, in first-seen order",
  f.keysFromUriList(["/browse/GLX-402", "/browse/RDC-1", "/browse/glx-402"].join("\r\n"), ORIGIN), ["GLX-402", "RDC-1"]);
is("nothing at all", f.keysFromUriList("", ORIGIN), []);
is("null", f.keysFromUriList(null, ORIGIN), []);

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

/* moveInList -- THE ARRAY MOVE BOTH DRAGS USE.
   It was `moveField` and it lived in `format-smoke` until 1.4.0, on the ground that
   the field lists' emitted order was what it was about. It is not: it never touched a
   field, and since 1.4.0 the collection's own item list moves through it too (§2.9).
   A pure helper two features share belongs in the pure-helpers harness, which is this
   file. The checks below are the same ones, renamed, plus the two that matter to a
   list of ISSUES rather than a list of eight fields.

   `to` is the GAP the row lands in and not a destination index, so "after the last
   row" is `list.length`. That is what keeps the caller's arithmetic to
   `index + (after ? 1 : 0)` and it is where the off-by-one lives. */
const L = ["a", "b", "c", "d"].map((id) => ({ id, on: false }));
const ids = (list) => list.map((one) => one.id);
is("moveInList · the middle, downward", ids(f.moveInList(L, 1, 3)), ["a", "c", "b", "d"]);
is("moveInList · the middle, upward", ids(f.moveInList(L, 2, 0)), ["c", "a", "b", "d"]);
is("moveInList · the first row to the very end", ids(f.moveInList(L, 0, 4)), ["b", "c", "d", "a"]);
is("moveInList · the last row to the very front", ids(f.moveInList(L, 3, 0)), ["d", "a", "b", "c"]);
// Dropping a row on its own top half and on its own bottom half are the same no-op,
// and they arrive as two different numbers -- which is the off-by-one.
is("moveInList · dropped above itself is a no-op", ids(f.moveInList(L, 1, 1)), ["a", "b", "c", "d"]);
is("moveInList · dropped below itself is the same no-op", ids(f.moveInList(L, 1, 2)), ["a", "b", "c", "d"]);
is("moveInList · an index past the end is refused, not clamped into a move",
  ids(f.moveInList(L, 9, 0)), ["a", "b", "c", "d"]);
is("moveInList · a negative index is refused too", ids(f.moveInList(L, -1, 0)), ["a", "b", "c", "d"]);
// A dataset carries strings. `"1" >= 0` is true and `splice("1", 1)` works, but
// `Number("x")` is NaN, which passes both comparisons and would splice the FIRST row.
is("moveInList · a string index is refused, because a dataset carries strings",
  ids(f.moveInList(L, "1", 3)), ["a", "b", "c", "d"]);
is("moveInList · and NaN is refused rather than moving the first row",
  ids(f.moveInList(L, NaN, 3)), ["a", "b", "c", "d"]);
is("moveInList · a target past the end lands at the end", ids(f.moveInList(L, 0, 99)), ["b", "c", "d", "a"]);
is("moveInList · a target below zero lands at the front", ids(f.moveInList(L, 3, -5)), ["d", "a", "b", "c"]);
is("moveInList · it never mutates the list it was given", ids(L), ["a", "b", "c", "d"]);
is("and it returns a NEW array even when it refuses", f.moveInList(L, 9, 0) !== L, true);
/* THE TWO THE COLLECTION ADDED. A field list is eight rows of `{ id, on }`; an item
   list is any length and its entries are issues, so the helper has to be indifferent
   to what it is moving and to how many there are -- neither of which the field
   checks above could ever have shown, because eight is not one and `{id, on}` is not
   an issue. */
const one = [{ key: "RDC-1" }];
is("moveInList · a list of one is every no-op there is",
  [f.moveInList(one, 0, 0), f.moveInList(one, 0, 1)].map((l) => l.map((i) => i.key)),
  [["RDC-1"], ["RDC-1"]]);
is("moveInList · it moves whatever the entries are, and an item is not a field",
  f.moveInList([{ key: "A", summary: "s" }, { key: "B" }, { key: "C" }], 2, 0).map((i) => i.key),
  ["C", "A", "B"]);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
