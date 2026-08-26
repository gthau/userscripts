// The generated stylesheet, checked for the three CSS traps this effort has
// actually hit. None of these is visible in JavaScript, so no other harness can
// see them: the boot harness has no cascade. Committed since 1.0.0; see the README beside this file.
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

// The sheet, exactly as the script builds it, with the ${...} names resolved.
const at = src.indexOf("injectStyle(\n    STYLE_ID,");
const start = src.indexOf("`", at);
let end = start + 1;
for (;;) {
  if (src[end] === "\\") { end += 2; continue; }
  if (src[end] === "`") break;
  end++;
}
const raw = src.slice(start + 1, end);
const ids = Object.fromEntries(
  [...src.matchAll(/^  const ([A-Z_]+) = (?:"([^"]*)"|'([^']*)'|(\d+));/gm)]
    .map((m) => [m[1], m[2] ?? m[3] ?? m[4]]),
);
ids.D = "aside#gt-cart-drawer";
const css = raw.replace(/\$\{([A-Z_D]+)\}/g, (m, name) => ids[name] ?? m);

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

// ---- 1. THE BACKTICK. The sheet is a template literal, so one backtick in a CSS
// comment ends it and the file stops parsing. §2.11 warns about it; it has still
// happened twice, and both times the reported line was far below the real one.
//
// COUNTING BACKTICKS IN THE EXTRACTED TEXT CANNOT WORK, and the first version of
// this check made exactly that mistake: a stray backtick simply becomes the end of
// the extraction, so the text always holds none. What is testable is WHERE the
// literal ended -- the real one is followed by the rest of the injectStyle call, and
// a truncated one is followed by CSS.
is("the sheet ends where the injectStyle call does, not at a stray backtick",
   /^,\s*\);/.test(src.slice(end + 1, end + 12)), true);
is("every interpolation resolved to a real name", [...css.matchAll(/\$\{[^}]*\}/g)].map((m) => m[0]), []);

// ---- 2. SPECIFICITY vs the `hidden` attribute. The attribute's own rule is
// UA-origin, so ANY author `display` beats it. The drawer's generic author rule
// puts the hiding back -- but it is lower specificity than every rule that names an
// id, so an element whose own rule sets `display` needs the attribute in its own
// selector or it never hides. That is exactly what made the ⚙ inert at 0.3.0.
const spec = (sel) => [
  (sel.match(/#[\w-]+/g) || []).length,
  (sel.match(/\[[^\]]+\]|\.[\w-]+|:[\w-]+\([^)]*\)|:(?!:)[\w-]+/g) || []).length,
  (sel.match(/(^|[\s>+~])[a-z][a-z0-9]*/g) || []).length,
];
// STRICTLY more specific. Equal specificity is not enough: then document order
// decides, and a rule's position in this sheet is not something to rely on.
const beats = (x, y) => {
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim().replace(/\s+/g, " "), body: m[2] }))
  .filter((r) => !r.sel.startsWith("@") && !r.sel.startsWith(":root"));
const drawerRuleEarly = rules.find((r) => r.sel === "aside#gt-cart-drawer");

// The elements the script actually hides. The list is explicit because mapping a
// JavaScript variable back to a selector is guesswork -- and the count below is
// what stops the list going quietly stale: hide a sixth element and this fails
// until someone adds it here.
const HIDDEN_ABLE = [
  "aside#gt-cart-drawer",             // the drawer itself, hidden by the html attribute
  // THE RAIL, AND NOT THE PLUS INSIDE IT. `button#gt-cart-toggle` was here until
  // 1.3.0 and it is gone on purpose: the plus is no longer the floating element, so
  // nothing sets `hidden` on it any more and a rule to undo that would be a rule for
  // a state that cannot happen. What hides is the box, and the copy button hides on
  // its own as well -- that is the preference (§2.7).
  "div#gt-cart-rail",
  "button#gt-cart-copy",
  "aside#gt-cart-drawer p.gt-cart-alert",
  "aside#gt-cart-drawer div#gt-cart-prefs",
  "aside#gt-cart-drawer input#gt-cart-rename",
  "aside#gt-cart-drawer button.gt-cart-name",
  // Four more since 1.2.0, and they are the whole of the ⚙ mode. The BODY is the
  // one that matters most: ⚙ replaces it, its own rule sets display: flex, and
  // without the attribute in its own selector pressing ⚙ would draw the settings
  // panel with the two sections still underneath it.
  "aside#gt-cart-drawer div#gt-cart-body",
  "aside#gt-cart-drawer div.gt-cart-tabpanel",
  "aside#gt-cart-drawer button.gt-cart-restore",
];
is("the script still hides exactly the elements this list names",
   (src.match(/\.hidden = /g) || []).length, 16);

const hidingRules = rules.filter((r) => /display:\s*none/.test(r.body));
const showsDisplay = (sel) =>
  rules.filter((r) => r.sel.split(",").map((one) => one.trim()).includes(sel))
       .filter((r) => /(^|;)\s*display\s*:/.test(r.body) && !/display:\s*none/.test(r.body));

const unhideable = [];
for (const sel of HIDDEN_ABLE) {
  for (const shown of showsDisplay(sel)) {
    // Some rule with display: none must reach this element and beat the rule that
    // turned display on -- either by naming it with the attribute, or by being
    // strictly more specific.
    const covered = hidingRules.some((h) =>
      h.sel.split(",").map((one) => one.trim()).some((one) =>
        one === `${sel}[hidden]` ||
        one === `html[data-gt-cart-open="false"] ${sel}` ||
        beats(spec(one), spec(shown.sel)),
      ),
    );
    if (!covered) unhideable.push(sel);
  }
}
console.log(`     ${HIDDEN_ABLE.length} hidden-able elements; ${hidingRules.length} rules can hide something`);
is("every one of them can still be hidden, cascade and all", unhideable, []);

// ---- 2b. THE GEAR'S OWN SIZE, and the two things that can silently undo it.
// Added at 1.2.0 because a beta tester on 1.1.0 did not find the settings button at
// all: 13px of grey pictograph in a transparent box, beside a ✕. The fix is a
// font-size on the gear ALONE.
const iconBase = rules.find((r) => r.sel.includes("button.gt-cart-icon,"))
  ?? rules.find((r) => r.sel === "aside#gt-cart-drawer button.gt-cart-icon");
const gearRule = rules.find((r) => r.sel.includes('[data-gt-action="prefs"]'));
is("the gear carries its own font-size", /font-size:\s*16px/.test(gearRule?.body ?? ""), true);
// Defect 1: the rule loses the cascade. The base rule sets `font-size: 13px` on the
// same element, and §2's own history is that a lower-specificity rule on the ⚙ is
// how it went inert at 0.3.0 -- so this is the same trap in the same place.
is("and its rule beats the shared icon rule, so the size actually paints",
   beats(spec(gearRule?.sel ?? ""), spec(iconBase?.sel.split(",")[0] ?? "")), true);
// Defect 2: growing the BOX instead of the glyph. The head's height is the button's
// 22px plus its own padding and border, and §2.11 rule 7 derives the drawer's floor
// from a 35px head. A 24px button re-derives MIN_BLOCK and nothing here would say
// so, which is why the box is asserted rather than assumed.
is("the icon box is still 22px, so the head is still the height the floor assumes",
   [/inline-size:\s*22px/.test(iconBase?.body ?? ""), /block-size:\s*22px/.test(iconBase?.body ?? "")],
   [true, true]);
is("and the gear's own rule sets no size, only a glyph size",
   /(?<!font-)(inline|block)-size:/.test(gearRule?.body ?? ""), false);
// The class dresses ✕, ⌫ and ↻ as well, so growing IT would leave the gear exactly
// as prominent relative to its neighbours as it was -- the whole complaint.
is("the shared icon rule still sets the small glyph, so only the gear grew",
   /font-size:\s*13px/.test(iconBase?.body ?? ""), true);

// ---- 2c. THE GEAR SAYS WHETHER THE SETTINGS ARE OPEN, and the paint has to
// survive the pointer. Added at 1.2.0 from a use report: the button looked
// "bordered in blue after clicking", which read as a state and was the FOCUS ring --
// it arrived whether the click had opened the settings or closed them. The state now
// exists on the button and this is what proves it paints.
const hoverRule = rules.find((r) => r.sel.includes("button.gt-cart-icon:hover"));
const stateSel = rules.find((r) => /button\.gt-cart-icon\[aria-[a-z]+="true"\]/.test(r.sel));
is("the open gear carries the same three declarations as the active collection chip",
   ["border-color", "background", "color"].map((prop) =>
     new RegExp(`(^|;)\\s*${prop}:\\s*var\\(--gt-cart-selected`).test(stateSel?.body ?? "")),
   [true, true, true]);
// The hover rule is (1,3,2) -- class, :hover, :not(:disabled) -- and the state alone
// would be (1,2,2), so an open gear would go quiet under the pointer. The state's
// selector is repeated WITH :hover for exactly that reason, and this is the check
// that says so rather than trusting document order.
const stateHover = stateSel?.sel.split(",").map((x) => x.trim()).find((x) => x.includes(":hover"));
is("and keeps them under the pointer, so an open gear does not go quiet on hover",
   beats(spec(stateHover ?? ""), spec(hoverRule?.sel.split(",")[0] ?? "")), true);
// The attribute is written by `render` from one constant and interpolated into this
// selector, so the two cannot name different attributes. What CAN happen is that the
// interpolation is replaced by a literal, and then the constant moves and the paint
// stays behind -- which is how the ⚙ was inert for two versions.
is("the state selector names the attribute the script writes",
   stateSel?.sel.includes(`[${ids.PREFS_STATE_ATTR}="true"]`), true);

// The rename at 1.2.0: the ⚙ stopped disclosing a region beside the content and
// became a mode toggle over it, so the attribute is `aria-pressed` and the
// `aria-controls` that named the region is gone. Both halves are asserted, because
// the constant makes the first one free and the second one is a deletion that
// nothing else would notice.
is("the state the sheet paints is a pressed state, not an expanded one",
   ids.PREFS_STATE_ATTR, "aria-pressed");
is("and the ⚙ no longer claims to control a region beside it",
   /aria-controls",\s*PREFS_ID/.test(src), false);

// ---- 2e. ⚙ IS A SCREEN, AND THE SCREEN IS THE DRAWER'S ONE SCROLLER. §2.11 rule 1
// is unchanged -- one scroller, a different occupant -- and these are the two halves
// of it that a stylesheet edit can quietly break.
const panelRule = rules.find((r) => r.sel === `aside#gt-cart-drawer div#${ids.PREFS_ID}`);
// TWO SCROLLING RULES IN THE WHOLE SHEET AND NO MORE, and they can never be on
// screen together: `div.gt-cart-list` is the sections' -- one per section, rule 1 --
// and the panel is the one while ⚙ is up, because ⚙ hides the body the sections
// live in. A third name in this list means something else in the drawer started
// scrolling, which is what rule 1 forbids.
const scrollers = rules.filter((r) => /overflow:\s*hidden auto/.test(r.body)).map((r) => r.sel).sort();
is("the panel and the section lists are the only things in the drawer that scroll",
   scrollers,
   ["aside#gt-cart-drawer div.gt-cart-list", `aside#gt-cart-drawer div#${ids.PREFS_ID}`].sort());
// A scroller inside a box that cannot grow needs both, or rule 1's first defect is
// back: the panel wants to be taller than the room left and is CLIPPED instead.
is("and it can actually shrink, or it is clipped rather than scrolled",
   [/(^|;)\s*flex:\s*1/.test(panelRule?.body ?? ""), /min-block-size:\s*0/.test(panelRule?.body ?? "")],
   [true, true]);
// clip, NOT hidden. `hidden` is still PROGRAMMATICALLY scrollable, and that is the
// bug §2.11 removed by construction rather than by patching.
is("the drawer around it is still overflow: clip, never hidden",
   /(^|;)\s*overflow:\s*clip/.test(drawerRuleEarly?.body ?? ""), true);
is("and there is still no scrollIntoView anywhere in the file",
   /scrollIntoView/.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")), false);

// THE BODY MUST BE HIDEABLE, and this is the check that would have caught the
// version where ⚙ drew the panel over two sections that were still there. Its own
// rule sets display: flex at (1,1,1)+id, so the generic [hidden] rule cannot reach
// it -- the exact trap that left the ⚙ inert at 0.3.0. Section 2 above sweeps for
// this generically; this names the element, so the failure says which one.
const bodyHider = rules.find((r) => r.sel === `aside#gt-cart-drawer div#${ids.BODY_ID}[hidden]`);
is("⚙ can actually hide the two sections and the foot with them",
   /display:\s*none/.test(bodyHider?.body ?? ""), true);

// The selected tab wears the same "this one is on" pair as the ⚙ and the active
// chip, and it has to beat its own hover rule for the same reason the ⚙ does --
// otherwise the tab you are on goes quiet under the pointer.
const tabHover = rules.find((r) => r.sel === "aside#gt-cart-drawer button.gt-cart-tab:hover:not(:disabled)");
const tabOn = rules.find((r) => /button\.gt-cart-tab\[aria-selected="true"\]/.test(r.sel));
is("the selected tab is painted from the Cart's own selected tokens, not a new blue",
   ["border-block-end-color", "color"].map((prop) =>
     new RegExp(`(^|;)\\s*${prop}:\\s*var\\(--gt-cart-selected`).test(tabOn?.body ?? "")),
   [true, true]);
const tabOnHover = tabOn?.sel.split(",").map((x) => x.trim()).find((x) => x.includes(":hover"));
is("and keeps them under the pointer, so the tab you are on does not go quiet",
   beats(spec(tabOnHover ?? ""), spec(tabHover?.sel ?? "")), true);

// THE SAME TRAP A THIRD TIME, on the field lists' drag (§2.14, 1.2.0). The row being
// dragged is BY DEFINITION the row under the pointer, so an equal-specificity hover
// rule would decide it on source order alone -- which is a paint that works until
// somebody moves a rule. The drop indicator needs no such pair: it sets a border
// colour where hover sets a background, so the two never contend.
const fieldHover = rules.find((r) => r.sel === "aside#gt-cart-drawer div.gt-cart-field:hover");
const fieldDragging = rules.find((r) => /div\.gt-cart-field\[data-gt-dragging="true"\]/.test(r.sel));
const fieldDraggingHover = fieldDragging?.sel.split(",").map((x) => x.trim()).find((x) => x.includes(":hover"));
is("the dragged row keeps its own ground under the pointer that is dragging it",
   beats(spec(fieldDraggingHover ?? ""), spec(fieldHover?.sel ?? "")), true);
// A TRANSPARENT BORDER ON ALL FOUR SIDES, always, so that the indicator appearing
// does not change the row's height -- a reflow under a pointer mid-drag, which is
// the defect §2.14 spent a day removing from the foot.
const fieldBase = rules.find((r) => r.sel === "aside#gt-cart-drawer div.gt-cart-field");
is("every field row reserves the border the drop indicator paints",
   /border:\s*1px solid transparent/.test(fieldBase?.body ?? ""), true);
// NAMED BY ROW TYPE and not by the attribute alone, because since 1.4.0 there are
// two of each: the item rows wear the same two attributes (§2.9). A `find` on the
// attribute would have quietly started asserting the other list's rule.
const dropRule = (row, edge) =>
  rules.find((r) => r.sel === `aside#gt-cart-drawer div.gt-cart-${row}[data-gt-drop="${edge}"]`);
const onlyAColour = (row) => ["before", "after"].map((edge) =>
  /^\s*border-block-(start|end)-color:[^;]+;?\s*$/.test(dropRule(row, edge)?.body ?? ""));
is("and the indicator only ever changes its colour, never its width", onlyAColour("field"), [true, true]);

/* ---- 2c-bis. THE SAME TRAP A FOURTH TIME, on the collection's own drag (§2.9,
   1.4.0). Everything above about the field rows has to hold about the item rows,
   and none of it is inherited: they are a different selector in a different part of
   the sheet, and the only thing they share is the pair of attribute names. */
const itemHover = rules.find((r) => r.sel === "aside#gt-cart-drawer div.gt-cart-item:hover");
const itemDragging = rules.find((r) => /div\.gt-cart-item\[data-gt-dragging="true"\]/.test(r.sel));
const itemDraggingHover = itemDragging?.sel.split(",").map((x) => x.trim()).find((x) => x.includes(":hover"));
is("the dragged ITEM keeps its own ground under the pointer that is dragging it",
   beats(spec(itemDraggingHover ?? ""), spec(itemHover?.sel ?? "")), true);
is("and its indicator only ever changes a colour too", onlyAColour("item"), [true, true]);
// The border is on the rule the item rows SHARE with the live rows, so this also
// says the two lists stay the same size -- one of them can be dragged and the other
// cannot, and a row that changed height between the sections would be a worse bug
// than the one the border is reserving against.
const sharedRow = rules.find((r) => /div\.gt-cart-row,/.test(r.sel) && /div\.gt-cart-item$/.test(r.sel));
is("both lists' rows reserve the border the indicator paints",
   /border:\s*1px solid transparent/.test(sharedRow?.body ?? ""), true);
is("and the padding was reduced by the border's width, so the box did not grow",
   /padding:\s*2px 5px/.test(sharedRow?.body ?? ""), true);
/* THE GRIP IS RESERVED AND NOT CONJURED. `visibility` keeps the row's width the same
   whether or not the glyph is painted; `display: none` would give it back and
   re-ellipsise the summary under the hand about to grab the row -- a reflow under a
   moving pointer, which is the defect §2.14 spent a day removing from the foot. This
   check is the whole of that decision, and it is one word. */
const gripHidden = rules.find((r) => r.sel === "aside#gt-cart-drawer div.gt-cart-item span.gt-cart-grip");
is("the item grip is hidden by visibility, so its width is held either way",
   /visibility:\s*hidden/.test(gripHidden?.body ?? "") && !/display:/.test(gripHidden?.body ?? ""), true);
is("and it is painted on hover and while dragging, because :hover does not update mid-drag",
   rules.some((r) => /:hover span\.gt-cart-grip/.test(r.sel) && /data-gt-dragging/.test(r.sel)
     && /visibility:\s*visible/.test(r.body)), true);
// A row that cannot be written cannot be dragged, so it must not say grab either.
const itemGrab = rules.find((r) => r.sel === 'aside#gt-cart-drawer div.gt-cart-item[draggable="true"]');
is("only a draggable row says grab", /cursor:\s*grab/.test(itemGrab?.body ?? ""), true);
is("and it turns off text selection, or the browser drags the selection instead",
   /user-select:\s*none/.test(itemGrab?.body ?? ""), true);
// The key is the one thing in the row that is NOT the drag, and it has to say so
// over a row that is saying grab.
is("the key link keeps a pointer cursor inside a grabbable row",
   /cursor:\s*pointer/.test(rules.find((r) =>
     r.sel === "aside#gt-cart-drawer div.gt-cart-item a.gt-cart-row-key")?.body ?? ""), true);

// ---- 2d. THE DRAWER OWNS ITS FOCUS APPEARANCE. Atlassian's sheet may style a
// focused button inside the Cart, and a host rule on :focus paints on a MOUSE click
// where the Cart's own :focus-visible ring does not. So :focus is cleared -- and
// every ring must strictly beat that reset, or a keyboard user loses their place
// with nothing on screen to say so.
const focusReset = rules.find((r) => r.sel === "aside#gt-cart-drawer :focus");
is("the drawer clears the focus outline it does not own", /outline:\s*none/.test(focusReset?.body ?? ""), true);
const allRings = rules
  .filter((r) => /outline:\s*2px solid var\(--gt-cart-focus\)/.test(r.body))
  .flatMap((r) => r.sel.split(",").map((x) => x.trim()))
  .filter((x) => x.includes(":focus-visible"));
// SCOPED TO THE DRAWER, and the scope is the point: the badge's ring and the
// floating toggle's are (1,1,1) like the reset, and they survive only because
// neither element is inside the drawer. The reset must therefore stay scoped -- an
// unscoped `:focus { outline: none }` would eat both and this check would still be
// green if it looked at every ring in the sheet. It was written that way first.
is("the reset is scoped to the drawer, so the badge and the toggle keep their rings",
   [focusReset.sel.startsWith("aside#gt-cart-drawer"),
    allRings.filter((sel) => !sel.startsWith("aside#gt-cart-drawer")).sort()],
   [true, ["button#gt-cart-badge:focus-visible", "button#gt-cart-copy:focus-visible",
           "button#gt-cart-toggle:focus-visible"]]);
const ringSelectors = allRings.filter((sel) => sel.startsWith("aside#gt-cart-drawer"));
is("and every ring inside the drawer strictly beats the reset",
   [ringSelectors.length, ringSelectors.filter((sel) => beats(spec(sel), spec(focusReset.sel))).length],
   [ringSelectors.length, ringSelectors.length]);

/* ---- 2f. THE HOVER RAIL, ADDED AT 1.3.0, AND THE ONE BUG IT CAN HAVE THAT
   JAVASCRIPT CANNOT SEE. The plus stopped being the floating element when it got a
   neighbour: the rail is `position: fixed` and the plus is a flex child of it. But
   the plus's glyph is TWO ABSOLUTELY POSITIONED BARS with `inset: 0`, and those
   resolve against the nearest positioned ancestor -- so a plus with no `position`
   of its own draws its two bars in the viewport's corner and shows an empty blue
   circle. Nothing in `boot-smoke` can see that: the bars are still its children,
   still have their classes, and the button still reports the state it should.

   The mutation is one word. Take `position: relative` off the plus and this goes
   red; it was verified by doing exactly that. */
const railRule = rules.find((r) => r.sel === "div#gt-cart-rail");
is("the rail is the fixed box, so the buttons inside it do not place themselves",
   /position:\s*fixed/.test(railRule?.body ?? ""), true);
is("and it lays them out in a row with a gap, which is what makes the pair one target",
   [/display:\s*flex/.test(railRule?.body ?? ""), /gap:\s*4px/.test(railRule?.body ?? "")],
   [true, true]);
const plusRule = rules.find((r) => r.sel === "button#gt-cart-toggle");
is("THE PLUS IS STILL A CONTAINING BLOCK, or the two bars that draw it escape to the viewport",
   /position:\s*(relative|absolute|fixed|sticky)/.test(plusRule?.body ?? ""), true);
is("and it is no longer fixed itself, because the rail is",
   /position:\s*fixed/.test(plusRule?.body ?? ""), false);
// The flip. On the right of the link the row reverses, so the plus is the near
// button on BOTH sides -- the rule that keeps a week of muscle memory intact (§2.7).
const flipRule = rules.find((r) => r.sel === 'div#gt-cart-rail[data-gt-side="right"]');
is("a rail on the right reverses its row, so the plus is beside the key either way",
   /flex-direction:\s*row-reverse/.test(flipRule?.body ?? ""), true);
/* THE COPY BUTTON'S GROUND DOES NOT MOVE WHEN ITS GLYPH DOES. The tick and the
   warning triangle are colour emoji, so painting a green or a yellow ground under
   them is worse than leaving the ground alone -- and the foot's four buttons already
   flash by swapping the label only. The attribute IS written, so this asserts the
   absence of a paint rather than the absence of the state. */
const copyStatePaints = rules.filter((r) =>
  r.sel.split(",").map((one) => one.trim())
    .some((one) => one.startsWith("button#gt-cart-copy[data-gt-state")));
is("no rule paints the copy button by its flash state, so a colour emoji keeps its ground",
   copyStatePaints.map((r) => r.sel), []);

// ---- 3. The generated collected-keys sheet (§2.7) paints EVERY anchor whose href
// names a collected key, and since 0.4.0 the drawer holds such anchors itself. Our
// own rule has to win, or a collected key in the drawer is green on the red hover.
const generated = 'a[href$="/browse/RDC-1"]';
// EXACTLY that selector: a substring match finds the focus-visible group first,
// whose body is an outline and says nothing about the tint.
const ours = rules.find((r) => r.sel === "aside#gt-cart-drawer a.gt-cart-row-key");
is("the drawer styles its own key links", !!ours, true);
is("and out-specifies the generated sheet, whichever is parsed last",
   ours ? beats(spec(ours.sel), spec(generated)) : false, true);
is("it neutralises the background the generated sheet would set", /background:\s*none/.test(ours?.body ?? ""), true);
is("and the colour, so the red hover stays readable", /color:\s*inherit/.test(ours?.body ?? ""), true);

// ---- 4. The mount detector animates every issue anchor (§2.10). Our own links
// must be exempt, or each row rebuild announces itself as a Jira mount.
const animated = rules.find((r) => r.sel === ids.ISSUE_ANCHOR);
is("issue anchors carry the mount animation", /animation:/.test(animated?.body ?? ""), true);
const exempt = rules.find((r) => r.sel === "aside#gt-cart-drawer a");
is("and the drawer's own anchors are exempt", /animation:\s*none/.test(exempt?.body ?? ""), true);
is("by a selector that beats the animating one",
   exempt && animated ? beats(spec(exempt.sel), spec(animated.sel)) : false, true);

// ---- 5. RULE 7, the yielding basis (risk 10, added at 1.0.0). Three things can
// rot here and each one puts the clipping back silently, which is why they are
// checked rather than trusted to a comment.
const liveBasis = rules.find((r) => r.sel === "aside#gt-cart-drawer section.gt-cart-live");
is("the live section still yields to the collection's fixed parts",
   /min\(var\(--gt-cart-basis\),\s*calc\(100% - \d+px\)\)/.test(liveBasis?.body ?? ""), true);
// A negative flex-basis is invalid, and an invalid `flex` shorthand falls back to
// `flex: 0 1 auto` -- which is DEFECT 2 back again, sections competing by content
// size. On a drawer short enough for the subtraction to go below zero, max(0px, ...)
// is the only thing standing between the fix and the defect it replaced.
is("and clamps at zero, or a short drawer drops the declaration and revives defect 2",
   /max\(0px,/.test(liveBasis?.body ?? ""), true);

// SIDE BY SIDE THE YIELD MUST BE UNDONE: there the basis is a width, while the
// parts it protects are a height. Both split paths need it, and each needs to beat
// the base rule strictly -- a container query does not change specificity.
const splitLive = rules.filter((r) =>
  /section\.gt-cart-live$/.test(r.sel) && /data-gt-cart-layout="(auto|split)"/.test(r.sel));
is("both split paths undo it -- the container query and the pinned one", splitLive.length, 2);
is("each with the plain basis back",
   splitLive.map((r) => /flex:\s*0 0 var\(--gt-cart-basis\);?\s*$/.test(r.body.trim())), [true, true]);
is("and each strictly beats the yielding rule",
   splitLive.map((r) => beats(spec(r.sel), spec(liveBasis?.sel ?? ""))), [true, true]);

// THE CONSTANT IS A MAGIC NUMBER and it counts the collection section's fixed
// parts. A fifth fixed part makes it stale, and this is the tripwire: the
// `flex: none` list is where a new fixed part has to be declared, so its length is
// what changes. Update BOTH together or not at all.
const fixedRule = rules.find((r) => /flex:\s*none/.test(r.body) && r.sel.includes("gt-cart-section-head"));
const fixedParts = (fixedRule?.sel ?? "").split(",").map((s) => s.trim()).filter(Boolean);
console.log(`     ${fixedParts.length} unshrinkable parts; the yield reserves ${css.match(/calc\(100% - (\d+)px\)/)?.[1]}px for the four in the collection`);
// SEVEN since 1.2.0, and it was eight: the settings panel LEFT this list when ⚙
// became a screen. It is the drawer's one scroller while it is up, so it is the
// flexible child now -- `flex: none` on it would be rule 1's defect back, a box
// sized by its own content inside a box that cannot grow.
is("the unshrinkable list is the length the constant was counted against", fixedParts.length, 7);
// The four the constant pays for, by name. A rename breaks this loudly, which is
// the point.
is("and it still names the collection's four",
   ["h2.gt-cart-section-head", "div.gt-cart-chips", "div.gt-cart-create", `div#${ids.FOOT_ID}`]
     .map((one) => fixedParts.includes(`aside#gt-cart-drawer ${one}`)), [true, true, true, true]);

/* The arithmetic behind risk 10's fix, re-derived here so that changing either
   number without the other fails loudly. All four sub-heights are read off the
   rules in this same sheet:

     drawer borders          2   1px top + 1px bottom
     head                   35   6+6 padding, 1px border, 22px icon buttons
     divider                 5   block-size, flex: none
     live section heading   26   6+4 padding, 11px text at line-height 1.4
     collection heading     32   6+4 padding, and its 22px ⌫ and ↻
     one row of chips        29   6 padding, 12px text at 1.4, 2+2 padding, 2 border
     the create field        35   6+6 padding, 12px input at 1.4, 4 padding, 2 border
     the foot                38   1 border, 6+6 padding, 12px buttons at 1.4, 6+2
     the collection's own top border  1

   So the collection cannot shrink below 32+29+35+38+1 = 135, and with the divider
   taken out of the reserve the collection is left `reserved - 5`. The live section
   keeps `body - reserved`, and it must not go below its own heading either -- or
   the yield has only moved the clipping from one section to the other. */
const DRAWER_BORDERS = 2, HEAD = 35, DIVIDER = 5, LIVE_HEAD = 26, COLLECTION_FIXED = 135;
const reserved = Number(css.match(/calc\(100% - (\d+)px\)/)?.[1] ?? 0);
const minBlock = Number(src.match(/const MIN_BLOCK = (\d+);/)?.[1] ?? 0);
const bodyAtMin = minBlock - DRAWER_BORDERS - HEAD;
console.log(`     at the ${minBlock}px minimum the body is ${bodyAtMin}px: the collection keeps ${reserved - DIVIDER}px of the ${COLLECTION_FIXED} it needs, the live list ${bodyAtMin - reserved}px of the ${LIVE_HEAD} its heading needs`);
is("the reserve covers the collection's fixed parts, divider included",
   reserved - DIVIDER >= COLLECTION_FIXED, true);
is("and MIN_BLOCK leaves the live section its own heading, so nothing is clipped either side",
   bodyAtMin - reserved >= LIVE_HEAD, true);
// The floor has to be in the SHEET, not only in the grip's clamp: a 70vh cap on a
// short window went under MIN_BLOCK and brought the clipping back. A
// min-block-size beats a max-block-size, so this is what makes the guarantee hold
// at every reachable size rather than only at dragged ones.
const drawerRule = rules.find((r) => r.sel === "aside#gt-cart-drawer");
is("the stylesheet enforces the floor too, not just the drag",
   new RegExp(`min-block-size:\\s*${minBlock}px`).test(drawerRule?.body ?? ""), true);
// A NON-ZERO width floor, specifically: `min-inline-size: 0` is rule 1's and has to
// stay.
is("and no width floor fights max-inline-size, which keeps the grip reachable",
   /min-inline-size:\s*[1-9]/.test(drawerRule?.body ?? ""), false);
is("exactly one min-block-size on the drawer, so the floor cannot be shadowed",
   (drawerRule?.body.match(/min-block-size:/g) ?? []).length, 1);

/* ---- 2f. THE COLLECTION'S DRAG OUT (§2.9.2, 1.5.0). Three rules, and each one is a
   decision that only exists in the cascade -- so this is the only harness that can
   see any of them. */
const headDrag = rules.find(
  (r) => r.sel === 'aside#gt-cart-drawer h2.gt-cart-section-head[draggable="true"]',
);
// Scoped to the attribute rather than to the heading's id ON PURPOSE: `render` takes
// the attribute away while the rename field is open, and that has to take
// `user-select` with it -- or the field's own text could not be selected by mouse
// even though the drag had stood down.
is("only a draggable heading says grab", /cursor:\s*grab/.test(headDrag?.body ?? ""), true);
is("and it turns off text selection, or the browser drags the selection instead",
   /user-select:\s*none/.test(headDrag?.body ?? ""), true);
is("the rule is keyed on the attribute, so the rename takes both away with it",
   /\[draggable="true"\]/.test(headDrag?.sel ?? ""), true);
/* `:active` AND NOT AN ATTRIBUTE, and the difference is that this one cannot stick.
   The item rows paint their grabbed state from `data-gt-dragging`, cleared in
   `dragend`. THIS DRAG HAS NO `dragend` -- it writes nothing, so it has nothing to
   undo -- and an attribute set at `dragstart` with nothing to clear it would leave
   the heading painted as grabbed for ever. */
is("the grabbing cursor comes from :active, which clears itself",
   rules.some((r) => /h2\.gt-cart-section-head\[draggable="true"\]:active/.test(r.sel)
     && /cursor:\s*grabbing/.test(r.body)), true);
is("and NO data-gt-dragging attribute is painted on the heading, since none is set",
   rules.some((r) => /h2\.gt-cart-section-head/.test(r.sel) && /data-gt-dragging/.test(r.sel)),
   false);
// The item grip's rule, applied to the heading for the item grip's reason: the name
// already ellipsises at 300px, so the glyph's width is held whether it is painted or
// not.
const headGrip = rules.find(
  (r) => r.sel === "aside#gt-cart-drawer h2.gt-cart-section-head span.gt-cart-grip",
);
is("the heading grip is hidden by visibility, so the name never re-ellipsises",
   /visibility:\s*hidden/.test(headGrip?.body ?? "") && !/display:/.test(headGrip?.body ?? ""),
   true);
is("and it is painted on hover, but only when the heading can actually be dragged",
   rules.some((r) => /h2\.gt-cart-section-head\[draggable="true"\]:hover span\.gt-cart-grip/.test(r.sel)
     && /visibility:\s*visible/.test(r.body)), true);
/* THE CHIP GETS A CURSOR AND NO GLYPH, which is the one place §2.9.2 breaks the
   drawer's own vocabulary. A reserved glyph would shorten every chip name for ever,
   because a chip's name is the one label in the drawer that ellipsises. */
const chipDrag = rules.find(
  (r) => r.sel === 'aside#gt-cart-drawer div.gt-cart-chip[draggable="true"]',
);
is("a draggable chip says grab", /cursor:\s*grab/.test(chipDrag?.body ?? ""), true);
is("and NO chip anywhere reserves a grip glyph",
   rules.some((r) => /gt-cart-chip/.test(r.sel) && /gt-cart-grip/.test(r.sel)), false);
/* AND THE COST OF THAT, HELD HERE SO IT IS NOT MISTAKEN FOR AN OVERSIGHT. The main
   button covers most of the pill and keeps `cursor: pointer`, because a click on it
   activates the collection. So the grab cursor shows only on the pill's own padding
   and the TOOLTIP does most of the discovery work -- which is what §7 step 40 looks
   at with a real hand. */
is("the chip's main button still says pointer, because clicking it still activates",
   /cursor:\s*pointer/.test(rules.find((r) =>
     r.sel === "aside#gt-cart-drawer button.gt-cart-chip-main")?.body ?? ""), true);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
