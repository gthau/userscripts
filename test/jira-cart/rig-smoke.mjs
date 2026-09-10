// THE TWO COMMITTED HTML RIGS, AND THIS IS THE FIRST THING UNDER `test/` EVER TO
// READ ONE. Added 2026-08-27, and the reason is in that directory's README: nothing
// here read an HTML file, so six drifts in `paste-test.html` were all found by
// reading and none of them could go red.
//
// The sixth is why this file exists. A CSS comment in that rig was never closed, so
// it swallowed FIVE RULES whole -- including all of `.cart`, which is where
// `overflow: clip` lives. The drawer stopped clipping, stopped being a flex column
// and lost its border, its content escaped the height the stage sets, later siblings
// painted over the overflow and the `<select>` elements painted over those. Every
// symptom, from two missing characters. And writing the fix reintroduced it within
// minutes, by putting a closing marker inside the new comment.
//
// WHAT THIS FILE DOES NOT DO: layout. There is no browser here, so it cannot say
// whether anything FITS. It says the stylesheet parses, that the rules a rig's
// answers depend on exist, and that the parts of the drawer mock that are supposed
// to be byte-identical to the script still are. Fit is still §7's browser step.
import { readFileSync } from "node:fs";

const here = import.meta.dirname;
const src = readFileSync(here + "/../../src/jira-cart.user.js", "utf8");

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

/* SCANNED IN PAIRS, NEVER COUNTED, and the difference is the whole point. Counting
   `/*` against `*\/` finds an unterminated comment only by luck: the fault that
   started this had 35 openers against 34 closers, and the SECOND version of the fix
   had 35 against 37 -- both wrong, in opposite directions, and a count cannot say
   which rule got eaten. Walking the pairs and reporting the offset can. */
function commentPairs(css) {
  const spans = [];
  let i = 0;
  for (;;) {
    const open = css.indexOf("/*", i);
    if (open < 0) break;
    const close = css.indexOf("*/", open + 2);
    if (close < 0) return { spans, unterminated: open };
    spans.push([open, close + 2]);
    i = close + 2;
  }
  // A closer with no opener before it is the other half of the same fault.
  const stray = [];
  let j = 0;
  for (;;) {
    const c = css.indexOf("*/", j);
    if (c < 0) break;
    if (!spans.some(([a, b]) => c >= a && c < b)) stray.push(c);
    j = c + 2;
  }
  return { spans, unterminated: -1, stray };
}

const stripComments = (css, spans) => {
  let out = "", at = 0;
  for (const [a, b] of spans) { out += css.slice(at, a); at = b; }
  return out + css.slice(at);
};

// A declaration out of a rule body, or null. Longhands only -- nothing here needs
// shorthand expansion, and a checker that guessed at one would be a second thing
// that can disagree with a browser.
const decl = (body, prop) => {
  const m = new RegExp("(?:^|;)\\s*" + prop.replace(/-/g, "\\-") + "\\s*:\\s*([^;]+)").exec(body ?? "");
  return m ? m[1].trim() : null;
};

// A rule body by exact selector text, out of comment-stripped CSS.
function rule(css, selector) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const found = rules.find((m) => m[1].split(",").map((s) => s.trim()).includes(selector));
  return found ? found[2] : null;
}

// ---------------------------------------------------------------- the script's side
// SLICED, NEVER COPIED. `store-smoke` once carried `MIN_BLOCK = 160` against the
// script's `215` and the check was green, because it was measuring its own constant.
/* THE SCRIPT'S VALUE FOR ONE PROPERTY, gathered from EVERY rule that names the
   selector -- standalone or inside a comma-separated group -- with the last one
   winning, which is what the cascade does.

   TWO THINGS THIS REPLACED, both of which passed while being wrong. A single regex
   built out of `[^{}]` cannot match a selector that CONTAINS braces, and the foot's
   does, so three of the seven rules came back null. The version after it guessed
   which of FOUR head rules to read by testing the body for /padding/ -- and matched
   `padding-inline-start` in a rule that has no `padding` at all. Reading the
   declaration is the only thing that cannot guess wrong. */
function scriptRuleBodies(selector) {
  const key = "${D} " + selector;
  const bodies = [];
  let at = 0;
  for (;;) {
    const i = src.indexOf(key, at);
    if (i < 0) break;
    at = i + key.length;
    /* THE WHOLE SELECTOR AND NOT A PREFIX OF A LONGER ONE. A rule for the same id
       carrying an attribute is a different rule, and reading it as this one is how
       the guess above went wrong. */
    const next = src[at];
    if (!(next === "," || next === "\n" || (next === " " && src[at + 1] === "{"))) continue;
    const open = src.indexOf("{", at);
    if (open < 0) break;
    let depth = 0, end = open;
    for (; end < src.length; end += 1) {
      if (src[end] === "{") depth += 1;
      else if (src[end] === "}") { depth -= 1; if (depth === 0) break; }
    }
    bodies.push(src.slice(open + 1, end));
    at = end + 1;
  }
  return bodies;
}

const scriptDecl = (selector, prop) => {
  const values = scriptRuleBodies(selector).map((b) => decl(b, prop)).filter((v) => v !== null);
  return values.length ? values[values.length - 1] : null;
};

/* WHAT IS COMPARED, with the script's selector beside the rig's. These are the parts
   of the drawer mock that MUST be byte-identical: the fixed parts the drawer's floor
   is summed from, plus the tab bar, which is what any "do the labels fit" answer
   rests on. The fourth drift was three of these four values on the foot. */
const PAIRS = [
  ["the foot", ".cart-foot", "div#${FOOT_ID}", ["padding", "gap", "flex-wrap"]],
  ["a foot button", ".cart-foot button", "button.gt-cart-copy", ["padding", "font-size", "border-radius", "line-height"]],
  ["a stepped button", ".cart-foot button.stepped", "button.gt-cart-copy[data-gt-steps]", ["min-inline-size"]],
  ["the head", ".cart-head", "div#${HEAD_ID}", ["padding", "gap"]],
  ["the chips row", ".cart-chips", "div.gt-cart-chips", ["padding", "gap"]],
  ["a tab", ".tabs button", "button.gt-cart-tab", ["padding", "font-size"]],
  ["the tab bar", ".tabs", "div#${TABS_ID}", ["gap"]],
];

/* THE FIRST CHECK, because every comparison below is vacuous without it: a null on
   the script side makes `[null]` equal `[null]` and measures nothing. That is the
   shape of two faults this directory already records. */
is("every property this harness compares has a value on the script side",
   PAIRS.flatMap(([what, , scriptSel, props]) =>
     props.filter((prop) => scriptDecl(scriptSel, prop) === null).map((prop) => what + " " + prop)),
   []);

// ------------------------------------------------------------------- the rigs
const RIGS = ["paste-test.html", "drag-test.html"];

for (const name of RIGS) {
  const html = readFileSync(here + "/" + name, "utf8");
  const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  is(`${name}: has a stylesheet`, blocks.length > 0, true);

  blocks.forEach((css, n) => {
    const { spans, unterminated, stray } = commentPairs(css);
    const label = `${name} sheet ${n + 1}`;
    is(`${label}: every comment is closed`, unterminated, -1);
    is(`${label}: no closing marker stands alone`, stray ?? [], []);
    if (unterminated >= 0) return;

    const bare = stripComments(css, spans);
    /* WRITTEN WRONG THE FIRST TIME, and kept as a comment because the shape of the
       mistake is common: it compared the closer count against ITSELF, so it could not
       fail. `css-smoke`'s first backtick check had the same property and this
       directory's README records it as the reason for the rule -- run the mutation
       before writing the comment. */
    is(`${label}: braces balance`, (bare.match(/\{/g) ?? []).length, (bare.match(/\}/g) ?? []).length);

    /* A SEMICOLON WHERE A SELECTOR BELONGS, which is what a swallowed rule leaves
       behind: the comment eats the rule's opening brace and its declarations, and
       what is left over lands between one rule's `}` and the next rule's `{`.
       TESTING FOR `prop: value` THERE DOES NOT WORK -- every `:hover` and
       `:not(:disabled)` matches it, and the first version of this check reported 20
       of them in a sheet that was fine. A selector never contains a semicolon. */
    is(`${label}: no orphan declarations between rules`,
       bare.split("}").map((chunk) => chunk.split("{")[0]).filter((pre) => pre.includes(";")).length, 0);
  });
}

// ------------------------------------------- paste-test's drawer mock, in detail
const rig = readFileSync(here + "/paste-test.html", "utf8");
const rigCssRaw = rig.split("<style>")[1].split("</style>")[0];
const rigCss = stripComments(rigCssRaw, commentPairs(rigCssRaw).spans);
const R = (sel) => rule(rigCss, sel);

/* THE FIVE RULES THE SIXTH DRIFT SWALLOWED. Each is named individually rather than
   counted, because "the sheet parses" was true while all five were inside a comment:
   the comment was closed by a LATER marker, so nothing was unbalanced enough to
   notice and the rules simply were not there. */
for (const [sel, prop, want] of [
  [".cart", "overflow", "clip"],
  [".cart", "display", "flex"],
  [".cart", "flex-direction", "column"],
  [".b-stage", "display", "flex"],
  [".b-stage", "align-items", "flex-start"],
  [".b-stage-state", "display", "flex"],
]) {
  is(`the mock's ${sel} still carries ${prop}: ${want}`, decl(R(sel), prop), want);
}

/* THE `hidden` PAIR. An author rule setting `display` on a class beats the browser's
   own `[hidden] { display: none }`, so an area told to hide stays visible -- which is
   the fifth drift, and the script carries seven paired rules and a comment saying so.
   Asserted per area, because one missing pair is one area that will not go away. */
for (const cls of [".cart-settings", ".cart-sections", ".cart-foot"]) {
  is(`${cls} sets display, so ${cls}[hidden] must exist and win`,
     [decl(R(cls), "display") !== null, decl(R(cls + "[hidden]"), "display")],
     [true, "none"]);
}

/* THE FOOT, THE HEAD, THE CHIPS AND THE TAB BAR ARE BYTE-IDENTICAL TO THE SCRIPT'S,
   and this is the check the fourth drift is the reason for. The rig reported that
   three new controls cost 0px and that the drawer's floor does not move -- measured
   against a foot whose buttons were 4px narrower and whose text was 11px where the
   script's is 12px. A measurement taken off a drifted mock is a measurement about
   the mock. */
for (const [what, rigSel, scriptSel, props] of PAIRS) {
  is(`${what} matches the script`,
     props.map((p) => [p, decl(R(rigSel), p)]),
     props.map((p) => [p, scriptDecl(scriptSel, p)]));
}

/* EVERY ELEMENT THE PAGE ASKS FOR BY ID EXISTS. `renderStage` in the deleted
   configurability prototype queried a class no element carried and threw on every
   call, at load included, and the page still opened with its surfaces empty. */
const rigScripts = [...rig.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
const wanted = new Set([...rigScripts.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]));
const present = new Set([...rig.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const assigned of rigScripts.matchAll(/\.id = "([^"]+)"/g)) present.add(assigned[1]);
is("every id the rig's own scripts fetch exists in it",
   [...wanted].filter((id) => !present.has(id)), []);

/* AND EVERY CLASS THEY SET IS PAINTED. A class with no rule is a control that is
   built, appended, and invisible -- which no assertion about behaviour can see. */
const set = new Set([...rigScripts.matchAll(/className = "([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));
const painted = new Set([...rigCss.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
is("every class the rig's scripts set is painted by its stylesheet",
   [...set].filter((c) => c && !painted.has(c)), []);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
