// Runs the WHOLE script against a fake DOM, so that evaluation order, the CSS
// template literal, and one full `render` pass are exercised outside a browser.
// It is not a DOM test: the matcher below understands only #id, tag, .class and
// [attr], which is enough for the boot path and returns nothing for anything
// cleverer -- so a tier that finds no summary here has found none, correctly.
// Committed since 1.0.0; see the README beside this file.
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

const byId = new Map();
let now = 0;
let uuids = 1;

function matches(node, sel) {
  for (const one of sel.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (one.startsWith("#") && node.id === one.slice(1)) return true;
    if (one.startsWith(".") && node.classList.includes(one.slice(1))) return true;
    const attr = one.match(/^\[([\w-]+)\]$/);
    if (attr && node.attrs[attr[1]] !== undefined) return true;
    const tagAttr = one.match(/^([a-z0-9]+)?\[([\w-]+)([~^$*]?=)"([^"]*)"\]$/);
    if (tagAttr) {
      const [, tag, name, op, want] = tagAttr;
      if (tag && node.tag !== tag) continue;
      const got = node.attrs[name];
      if (got === undefined) continue;
      if (op === "=" && got === want) return true;
      if (op === "^=" && got.startsWith(want)) return true;
      if (op === "$=" && got.endsWith(want)) return true;
      if (op === "*=" && got.includes(want)) return true;
    }
    const tagId = one.match(/^([a-z0-9]+)#([\w-]+)$/);
    if (tagId && node.tag === tagId[1] && node.id === tagId[2]) return true;
    if (/^[a-z0-9]+$/.test(one) && node.tag === one) return true;
  }
  return false;
}

// The script guards its delegated listeners with `event.target instanceof Element`,
// so the stub's nodes have to actually be Elements.
class Element {}
const attrsBox = new WeakMap();
const attrsOf = (node) => attrsBox.get(node);

function element(tag) {
  const node = {
    tag, children: [], parent: null, attrs: {}, classList: [],
    textContent: "", hidden: false, disabled: false, type: "", title: "",
    value: "", checked: false, scrollTop: 0, spellcheck: false, autocomplete: "",
    isConnected: false,
    style: {
      _p: {},
      setProperty(k, v) { this._p[k] = v; },
      removeProperty(k) { delete this._p[k]; },
    },
    // A real `dataset` writes through to the attribute, and half of this script's
    // state is a data-* attribute read back by a CSS rule, so the stub must too.
    dataset: new Proxy({}, {
      set(box, key, value) {
        box[key] = String(value);
        attrsOf(node)["data-" + String(key).replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())] = String(value);
        return true;
      },
      get(box, key) { return box[key]; },
    }),
    get className() { return this.classList.join(" "); },
    set className(v) { this.classList = String(v).split(/\s+/).filter(Boolean); },
    setAttribute(k, v) {
      this.attrs[k] = String(v);
      if (k === "id") { this.id = String(v); byId.set(String(v), this); }
    },
    getAttribute(k) { return this.attrs[k] ?? null; },
    removeAttribute(k) { delete this.attrs[k]; },
    append(...kids) {
      for (const kid of kids) {
        kid.parent = node;
        node.children.push(kid);
        markConnected(kid, node.isConnected);
      }
    },
    prepend(...kids) { node.append(...kids); },
    replaceChildren(...kids) { node.children = []; node.append(...kids); },
    remove() {
      if (!node.parent) return;
      node.parent.children = node.parent.children.filter((k) => k !== node);
      node.parent = null; markConnected(node, false);
    },
    _on: {},
    addEventListener(type, fn) { (node._on[type] ??= []).push(fn); },
    removeEventListener(type, fn) { node._on[type] = (node._on[type] ?? []).filter((f) => f !== fn); },
    setPointerCapture() {},
    focus() {}, select() {},
    getBoundingClientRect() { return { left: 10, top: 10, right: 90, bottom: 30, width: 80 + (now += 1), height: 20 }; },
    closest(sel) {
      for (let el = node; el; el = el.parent) if (matches(el, sel)) return el;
      return null;
    },
    querySelectorAll(sel) {
      const out = [];
      const walk = (el) => { for (const kid of el.children) { if (matches(kid, sel)) out.push(kid); walk(kid); } };
      walk(node); return out;
    },
    querySelector(sel) { return node.querySelectorAll(sel)[0] ?? null; },
  };
  Object.setPrototypeOf(node, Element.prototype);
  attrsBox.set(node, node.attrs);
  let _id = "";
  Object.defineProperty(node, "id", {
    get: () => _id,
    set: (v) => { _id = String(v); node.attrs.id = _id; byId.set(_id, node); },
  });
  return node;
}
function markConnected(node, on) {
  node.isConnected = on;
  for (const kid of node.children) markConnected(kid, on);
}

const html = element("html");
html.isConnected = true;
const head = element("head");
const body = element("body");
html.append(head, body);

const document = {
  documentElement: html, head, body, title: "[RDC-1] A live issue - Jira",
  visibilityState: "visible",
  createElement: element,
  _on: {},
  getElementById: (id) => (byId.get(id)?.isConnected ? byId.get(id) : byId.get(id) ?? null),
  querySelector: (sel) => html.querySelector(sel),
  querySelectorAll: (sel) => html.querySelectorAll(sel),
  addEventListener(type, fn) { (document._on[type] ??= []).push(fn); },
};
const window = {
  innerWidth: 1440, innerHeight: 900,
  _on: {},
  addEventListener(type, fn) { (window._on[type] ??= []).push(fn); },
  open(url, target, features) { opened.push({ url, target, features }); },
};
const opened = [];

// Bubble from the target to <html>, then the document's own listeners. Enough to
// drive the drawer through the delegated listener it really uses.
function dispatch(target, type, extra = {}) {
  const event = { type, target, preventDefault() {}, stopPropagation() {}, ...extra };
  for (let el = target; el; el = el.parent) for (const fn of el._on?.[type] ?? []) fn(event);
  for (const fn of document._on?.[type] ?? []) fn(event);
}
const location = { origin: "https://dalet.atlassian.net", href: "https://dalet.atlassian.net/browse/RDC-1", pathname: "/browse/RDC-1" };
const clipboard = [];
// Without these two, `writeClipboard` takes its documented fallback and Links
// loses its HTML twin -- which is correct behaviour, and not what we want to test.
class Blob { constructor(parts) { this.text = parts.join(""); } }
class ClipboardItem { constructor(flavours) { Object.assign(this, flavours); } }
const navigator = {
  clipboard: {
    async write(items) { clipboard.push(items[0]); },
    async writeText(text) { clipboard.push({ "text/plain": text }); },
  },
};
const store = {};
const calls = { renders: 0, fetches: 0 };
// `null` makes the fetch stub throw. A body makes it answer with that body.
const network = { body: null };
const GM_getValue = (k, d) => (k in store ? store[k] : d);
let throwOnWrite = false;
const GM_setValue = (k, v) => {
  if (throwOnWrite) throw new DOMException("quota", "QuotaExceededError");
  store[k] = v;
};
const GM_addValueChangeListener = () => {};
const logs = [];
const console_ = {
  log: (...a) => logs.push(["log", a.join(" ")]),
  debug: (...a) => logs.push(["debug", a.join(" ")]),
  warn: (...a) => logs.push(["warn", a.join(" ")]),
  error: (...a) => logs.push(["error", a.join(" ")]),
};

// An issue page: the current-issue breadcrumb, a linked-work-items card with the
// two anchors appendix A.6 found, and a prose link.
function anchor(href, text) {
  const a = element("a");
  a.setAttribute("href", href);
  a.textContent = text;
  return a;
}
const crumb = element("div");
crumb.setAttribute("data-testid", "issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container");
crumb.append(anchor("/browse/RDC-1", "RDC-1"));
const card = element("div");
card.setAttribute("data-testid", "issue.issue-view.views.common.issue-line-card.card-container");
card.append(anchor("/browse/RDC-77", "RDC-77"), anchor("/browse/RDC-77", "The linked issue's own summary"));
const prose = element("div");
prose.classList = ["ak-renderer-document"];
prose.append(anchor("/browse/GLX-402", "GLX-402: A smart link title"));
const meta = element("meta");
meta.setAttribute("name", "application-name");
meta.content = "JIRA";
body.append(meta, crumb, card, prose);

const run = new Function(
  "document", "window", "location", "navigator", "console", "crypto", "Element",
  "Blob", "ClipboardItem",
  "GM_getValue", "GM_setValue", "GM_addValueChangeListener",
  "setTimeout", "setInterval", "clearTimeout", "requestAnimationFrame", "fetch",
  src,
);

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

const frames = [];
const flush = () => { for (let n = 0; n < 6 && frames.length; n++) frames.splice(0).forEach((fn) => fn()); };
try {
  run(
    document, window, location, navigator, console_,
    { randomUUID: () => `uuid-${uuids++}` },
    Element, Blob, ClipboardItem,
    GM_getValue, GM_setValue, GM_addValueChangeListener,
    setTimeout, () => 0, clearTimeout,
    (fn) => { frames.push(fn); return 1; },
    // Throws by default, which is what most of this file wants: a script that
    // works offline is the point of §2.6's "an item is valid with a key alone".
    // Set `network.body` to drive the answering path instead -- the two-step
    // 📋 Details button cannot be exercised without one (§2.14).
    async () => {
      calls.fetches += 1;
      if (network.body === null) throw new Error("no network in the harness");
      const body = network.body;
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => body,
      };
    },
  );
  console.log("ok   the script evaluates and starts");
} catch (e) {
  fails++;
  console.log("FAIL the script threw while starting:", e.message, "\n", e.stack.split("\n").slice(1, 4).join("\n"));
}

is("no error was logged while starting", logs.filter(([l]) => l === "error"), []);
is("the collected sheet is in the document", !!byId.get("gt-cart-collected-style"), true);
is("the corner is on <html> before anything is drawn", html.dataset.gtCartCorner, "bottom-right");
is("the layout is too", html.dataset.gtCartLayout, "auto");
is("the drawer starts closed", html.dataset.gtCartOpen, "false");
is("the first run wrote Scratch", JSON.parse(store["gt-jira-cart.collections"]).collections[0].name, "Scratch");

// One full render pass, then open the drawer and render again.
const badge = byId.get("gt-cart-badge");
is("the badge was built", badge?.textContent, "🛒 Scratch 0 ▾");
is("the badge names the drawer it opens", badge?.attrs["aria-controls"], "gt-cart-drawer");
is("the badge says it is closed", badge?.attrs["aria-expanded"], "false");

const drawer = byId.get("gt-cart-drawer");
is("the drawer exists even while closed, so aria-controls points at something", !!drawer, true);
is("the drawer is our own UI, so the scan skips it", drawer?.attrs["data-gt-cart-ui"], "");


// ---- open it, the way a person does
const text = (node) => (node ? node.children.map((k) => k.textContent || text(k)).join(" ").trim() || node.textContent : "");
const rows = () => byId.get("gt-cart-live-list").children.filter((k) => k.classList.includes("gt-cart-row"));
// The key is a link and the rest of the row is the toggle, so a "click the row"
// in these tests means clicking the part that actually toggles.
const toggleOf = (row) => row.children.find((k) => k.classList.includes("gt-cart-row-body"));
const keyOf = (row) => row.children.find((k) => k.classList.includes("gt-cart-row-key"));
const items = () => byId.get("gt-cart-item-list").children.filter((k) => k.classList.includes("gt-cart-item"));
const copy = (kind) => byId.get("gt-cart-foot").children.find((k) => k.attrs["data-gt-format"] === kind);
const errors = () => logs.filter(([l]) => l === "error").map(([, m]) => m);

dispatch(badge, "click");
flush();
is("nothing threw on the first open", errors(), []);
is("the drawer is open", html.dataset.gtCartOpen, "true");
is("the badge says so", badge.attrs["aria-expanded"], "true");

// Three distinct keys over four anchors: the linked-work-items card carries two to
// the same issue, which is appendix A.6's finding and §2.3's dedup rule.
is("On this page counts KEYS, not anchors", byId.get("gt-cart-live-head").textContent, "On this page (3)");
is("page order survives", rows().map((r) => keyOf(r).textContent), ["RDC-1", "RDC-77", "GLX-402"]);
is("nothing is collected yet", rows().map((r) => r.attrs["data-gt-collected"]), ["false", "false", "false"]);

// The representative is the WIDEST anchor of the pair, so the summary is read from
// the summary link and not from the one that says only the key (§2.2 tier 4, §2.7).
const summaryOf = (key) => {
  const row = rows().find((r) => keyOf(r).textContent === key);
  return toggleOf(row).children.find((k) => k.classList.includes("gt-cart-row-summary")).textContent;
};
is("the widest anchor of the card is the one read", summaryOf("RDC-77"), "The linked issue's own summary");
is("a prose smart link keeps its title and loses its key", summaryOf("GLX-402"), "A smart link title");
is("the current issue comes off the page title", summaryOf("RDC-1"), "A live issue");

// The origins, from the container each representative sits in (§2.3).
const originOf = (key) => {
  const row = rows().find((r) => keyOf(r).textContent === key);
  return toggleOf(row).children.find((k) => k.classList.includes("gt-cart-row-origin"))?.textContent;
};
is("origins", ["RDC-1", "RDC-77", "GLX-402"].map(originOf),
  ["this work item", "linked work items", "description or comments"]);

// ---- the whole row is the control
// ---- the key is a real link, in both sections
is("every live row's key is an anchor", rows().map((r) => keyOf(r).tag), ["a", "a", "a"]);
is("with an absolute href Jira would recognise", rows().map((r) => keyOf(r).attrs.href),
  ["https://dalet.atlassian.net/browse/RDC-1",
   "https://dalet.atlassian.net/browse/RDC-77",
   "https://dalet.atlassian.net/browse/GLX-402"]);
is("it carries no action, so clicking it navigates instead of toggling",
  keyOf(rows()[0]).attrs["data-gt-action"], undefined);
is("and it says how to get a new tab", /Middle-click or Ctrl-click/.test(keyOf(rows()[0]).title), true);
// The trap this creates: the drawer now holds issue anchors, so the scan must skip
// its own UI or every row finds itself.
is("the live list did NOT scan its own links", byId.get("gt-cart-live-head").textContent, "On this page (3)");
(() => {
  const before = JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.length;
  dispatch(keyOf(rows()[0]), "click");
  flush();
  is("clicking a key changes nothing in the collection",
    JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.length, before);
})();

is("the four copy buttons are dimmed while it is empty", ["links", "names", "keys", "jql"].map((k) => copy(k).disabled), [true, true, true, true]);
dispatch(toggleOf(rows()[1]), "click");
flush();
is("nothing threw on an add", errors(), []);
is("it landed in storage with its summary", JSON.parse(store["gt-jira-cart.collections"]).collections[0].items,
  [{ key: "RDC-77", summary: "The linked issue's own summary" }]);
is("the badge followed", badge.textContent, "🛒 Scratch 1 ▾");
is("the collection has the row", items().map((r) => r.children[0].textContent), ["RDC-77"]);
is("and its key is a link too", items()[0].children[0].tag, "a");
is("pointing at the issue", items()[0].children[0].attrs.href, "https://dalet.atlassian.net/browse/RDC-77");
is("the live row is now collected", rows()[1].attrs["data-gt-collected"], "true");
is("the toggle carries the key, because that is what the click reads", toggleOf(rows()[1]).attrs["data-gt-key"], "RDC-77");
is("the copy buttons woke up", ["links", "names", "keys", "jql"].map((k) => copy(k).disabled), [false, false, false, false]);
is("the tier is in the debug line, which is how §7 step 5 is checked",
  logs.some(([l, m]) => l === "debug" && m.includes("RDC-77") && m.includes("tier 4")), true);

// ---- the same row removes it (§2.9: removable in BOTH sections, never one)
dispatch(toggleOf(rows()[1]), "click");
flush();
is("the row toggled it back off", JSON.parse(store["gt-jira-cart.collections"]).collections[0].items, []);
dispatch(toggleOf(rows()[1]), "click");
flush();

// ---- copy, and the ✕
dispatch(copy("names"), "click");
await Promise.resolve();
is("Names wrote plain text only", clipboard.at(-1)["text/html"], undefined);
dispatch(copy("links"), "click");
await Promise.resolve();
is("Links wrote both flavours", Object.keys(clipboard.at(-1)), ["text/plain", "text/html"]);
is("nothing threw on a copy", errors(), []);

// The fourth button does not copy. It opens Jira's search on the collection.
is("its label says so", copy("jql").textContent, "🔍 Search");
const wrote = clipboard.length;
dispatch(copy("jql"), "click");
is("it opened Jira's own issue navigator", opened.at(-1).url,
  "https://dalet.atlassian.net/issues/?jql=key%20in%20(RDC-77)");
is("in a new tab, so the drawer and the page you are collecting from survive", opened.at(-1).target, "_blank");
is("and it wrote NOTHING to the clipboard", clipboard.length, wrote);
is("the drawer is still open behind it", html.dataset.gtCartOpen, "true");

const cross = items()[0].children.find((k) => k.classList.includes("gt-cart-x"));
dispatch(cross, "click");
flush();
is("the ✕ removed it", JSON.parse(store["gt-jira-cart.collections"]).collections[0].items, []);
is("and a copy of zero items is refused before it can write", (() => {
  const before = clipboard.length;
  dispatch(copy("keys"), "click");
  return clipboard.length === before;
})(), true);
is("an empty collection cannot be searched either: key in () is not valid JQL", (() => {
  const before = opened.length;
  dispatch(copy("jql"), "click");
  return opened.length === before;
})(), true);

// ---- naming
byId.get("gt-cart-create").value = "Sprint review";
dispatch(byId.get("gt-cart-create"), "keydown", { key: "Enter" });
flush();
is("a new collection is created and made active", JSON.parse(store["gt-jira-cart.collections"]).collections.map((c) => c.name), ["Sprint review", "Scratch"]);
is("the field was emptied", byId.get("gt-cart-create").value, "");
is("the badge follows the active collection", badge.textContent, "🛒 Sprint review 0 ▾");
const chips = () => byId.get("gt-cart-chips").children;
const chipMain = (chip) => chip.children.find((k) => k.classList.includes("gt-cart-chip-main"));
const chipX = (chip) => chip.children.find((k) => k.classList.includes("gt-cart-chip-x"));
is("both collections have a chip, each with its own count",
  chips().map((c) => chipMain(c).children.map((k) => k.textContent)),
  [["Sprint review", "0"], ["Scratch", "0"]]);
is("the count is a separate element from the name",
  chipMain(chips()[0]).children.map((k) => k.classList[0]),
  ["gt-cart-chip-name", "gt-cart-chip-count"]);
byId.get("gt-cart-create").value = "sprint REVIEW";
dispatch(byId.get("gt-cart-create"), "keydown", { key: "Enter" });
flush();
is("a duplicate name is numbered, ignoring case", JSON.parse(store["gt-jira-cart.collections"]).collections[0].name, "sprint REVIEW 2");

// ---- rename in place
dispatch(byId.get("gt-cart-name"), "click");
flush();
is("the field replaced the name", [byId.get("gt-cart-name").hidden, byId.get("gt-cart-rename").hidden], [true, false]);
byId.get("gt-cart-rename").value = "Blocked on QA";
dispatch(byId.get("gt-cart-rename"), "keydown", { key: "Enter" });
flush();
is("Enter commits", JSON.parse(store["gt-jira-cart.collections"]).collections[0].name, "Blocked on QA");
dispatch(byId.get("gt-cart-name"), "click");
byId.get("gt-cart-rename").value = "Something else";
dispatch(byId.get("gt-cart-rename"), "keydown", { key: "Escape" });
flush();
is("Escape cancels", JSON.parse(store["gt-jira-cart.collections"]).collections[0].name, "Blocked on QA");

// ---- activating a collection moves it to the front (§2.4)
dispatch(chipMain(chips()[1]), "click");
flush();
is("the chip activated it", JSON.parse(store["gt-jira-cart.collections"]).collections.map((c) => c.name), ["Sprint review", "Blocked on QA", "Scratch"]);

// ---- gap-fill is a STATE: an item with no summary in an open drawer is asked about
calls.fetches = 0;
byId.get("gt-cart-create").value = "Gaps";
dispatch(byId.get("gt-cart-create"), "keydown", { key: "Enter" });
store["gt-jira-cart.collections"] = JSON.stringify({
  v: 1,
  collections: [{ id: "gaps", name: "Gaps", items: [{ key: "ZZZZ-99999" }] }],
});
flush();
const settle = async () => { for (let n = 0; n < 4; n++) { await new Promise((r) => setTimeout(r, 150)); flush(); } };
await settle();
is("the drawer being open is the trigger, and one request was attempted", calls.fetches >= 1, true);
is("a failed request is a warning, never an error", errors(), []);
is("the item stayed bare: no login page may become a summary",
  JSON.parse(store["gt-jira-cart.collections"]).collections[0].items, [{ key: "ZZZZ-99999" }]);
const asked = calls.fetches;
flush();
await settle();
is("and it is never asked a second time", calls.fetches, asked);

// ---- 📋 Details: TWO PRESSES, and nothing is stored between them (§2.14)
//
// This is the section §2.14 exists for, and it is drivable here for the same
// reason the cross-tab step was: the platform surface is `fetch` and the
// clipboard, and both are already shimmed. What a green run does NOT say is
// anything about how the pasted HTML renders -- that took real pastes into
// Outlook and Teams, and their findings are asserted in `format-smoke` instead.
const details = () => copy("details");
const collections = () => JSON.parse(store["gt-jira-cart.collections"]).collections;
// One issue Jira will answer about and one it will not, which is the case that
// decides whether a partial answer arms the button.
const ANSWER = {
  issues: [{
    id: "573374", key: "RDC-1513",
    fields: {
      summary: "Markers [7] Dev (player)", issuetype: { name: "Story" },
      status: { name: "Dev Resolved", statusCategory: { key: "indeterminate" } },
      priority: { name: "P2" }, assignee: { displayName: "William CHUANG" },
      fixVersions: [{ name: "Pyr 2026.8.0" }],
      timetracking: { remainingEstimate: "0m" },
      parent: { key: "RDC-26701", fields: { summary: "Markers panel" } },
    },
  }],
  issueErrors: [],
};

store["gt-jira-cart.collections"] = JSON.stringify({
  v: 1,
  collections: [{ id: "det", name: "Report", items: [{ key: "RDC-1513" }, { key: "GLX-402" }] }],
});
dispatch(document, "visibilitychange");
flush();
is("the label starts as a name, not a ladder", details().textContent, "📋 Details");

// A REFUSED FETCH MUST NOT ARM: nothing came back, so there is nothing to copy.
network.body = null;
calls.fetches = 0;
const beforeRefusal = clipboard.length;
dispatch(details(), "click");
await settle();
is("a refused fetch did ask", calls.fetches >= 1, true);
is("and left the button idle, because there is nothing to copy", details().textContent, "📋 Details");
is("and wrote nothing to the clipboard", clipboard.length, beforeRefusal);
is("a refused fetch is a warning, never an error", errors(), []);

// A PARTIAL ANSWER DOES ARM. Refusing the whole copy because one issue is
// unreadable would make the format unreachable for as long as it is collected.
network.body = ANSWER;
dispatch(details(), "click");
await settle();
// The COUNT IS NOT IN THE LABEL: it was the widest label in the foot and the tick
// the narrowest, so pressing the button rearranged the wrapping row and pressing it
// again put it back. The count is in the sentence instead, which has no width.
is("one of two answered, and the button armed", details().textContent, "📋 Copy");
is("the count moved to the tooltip", /^Copy 2 items\./.test(details().title), true);
// THE BUTTON YOU PRESS IS THE BUTTON THAT ANSWERS. This was the other way round
// until 2026-08-21 -- one press armed both, on the reasoning that the held result
// describes the collection rather than a button -- and the user pressed one and
// watched the other change, which is a bug however good the reasoning was.
is("the button that was NOT pressed is left alone", copy("report").textContent, "📊 Report");
is("and it is not offering a copy it cannot make",
  /Copy/.test(copy("report").title), false);
is("the fetch also wrote the summary back, through the path ↻ already uses",
  collections()[0].items[0].summary, "Markers [7] Dev (player)");
is("and the item it could not read is untouched", collections()[0].items[1], { key: "GLX-402" });
is("nothing the fetch learned besides the summary was stored",
  Object.keys(collections()[0].items[0]).sort(), ["issueId", "key", "summary"]);

// The second press copies, synchronously as far as the network is concerned.
const beforeCopy = clipboard.length;
dispatch(details(), "click");
await settle();
is("the second press wrote once", clipboard.length, beforeCopy + 1);
is("a copy flashes on the button that made it, and only there",
  [details().textContent, copy("report").textContent], ["✅", "📊 Report"]);
is("and wrote both flavours", Object.keys(clipboard.at(-1)), ["text/plain", "text/html"]);
// The stub keeps a Blob, exactly as the real ClipboardItem does, so the payload
// is read back out of it rather than assumed to be a string.
const pasted = clipboard.at(-1)["text/plain"].text;
is("the line carries the fetched fields in reading order",
  pasted.includes("— Story · Dev Resolved · P2 · William CHUANG · Pyr 2026.8.0 · 0m left · ↳ [RDC-26701]"), true);
is("NO FORMAT DROPS AN ITEM: the unreadable one still gets a line", pasted.split("\n").length, 2);
is("and its line is a bare link", pasted.split("\n")[1], "- [GLX-402](https://dalet.atlassian.net/browse/GLX-402)");
is("the epic's name is not on the line, only its key", /Markers panel/.test(pasted), false);
is("the copy shows its receipt", details().textContent, "✅");
await settle();
await settle();
is("THE HELD FETCH IS SPENT BY THE COPY, so no paste is older than the press before it",
  details().textContent, "📋 Details");

// The other button, pressed on its own. This is the case that exposes a hardcoded
// icon: the ladder was a literal 📋, so 📊 Report used to say `📋 Fetching…`.
network.body = ANSWER;
dispatch(copy("report"), "click");
await settle();
is("pressing Report arms Report", copy("report").textContent, "📊 Copy");
is("with ITS OWN icon, derived from its label rather than hardcoded",
  copy("report").textContent.startsWith("📊"), true);
is("and Details stays idle this time", details().textContent, "📋 Details");
const beforeReport = clipboard.length;
dispatch(copy("report"), "click");
await settle();
is("the report copied", clipboard.length, beforeReport + 1);
is("and it is grouped: a priority band, then a team", (() => {
  const text = clipboard.at(-1)["text/plain"].text;
  return /^\*\*P2\*\*/m.test(text) && /^\*No team\*/m.test(text);
})(), true);

// A CHANGE TO THE KEY LIST DISARMS IT, through a real gesture rather than a poke.
network.body = ANSWER;
dispatch(details(), "click");
await settle();
is("armed again", details().textContent, "📋 Copy");
dispatch(items()[1].children.find((k) => k.classList.includes("gt-cart-x")), "click");
flush();
is("removing an item dropped the held fetch", details().textContent, "📋 Details");
is("and the collection is down to one", collections()[0].items.length, 1);

// ↻ and 📋 each stand down while the other is out: both write summaries.
is("an empty collection cannot be asked about either", (() => {
  store["gt-jira-cart.collections"] = JSON.stringify({
    v: 1, collections: [{ id: "det", name: "Report", items: [] }],
  });
  dispatch(byId.get("gt-cart-name"), "click");
  dispatch(byId.get("gt-cart-rename"), "keydown", { key: "Escape" });
  flush();
  return details().disabled;
})(), true);
network.body = null;

// ---- emptying and deleting, and BOTH ARE ARMED BEFORE THEY FIRE
const names = () => JSON.parse(store["gt-jira-cart.collections"]).collections.map((c) => c.name);
const items0 = () => JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.length;
const emptyButton = () => byId.get("gt-cart-empty");

// A known starting point: the gap-fill block above replaced the store, so this one
// writes its own rather than assuming what is there.
store["gt-jira-cart.collections"] = JSON.stringify({
  v: 1,
  collections: [
    { id: "c1", name: "Sprint review", items: [{ key: "RDC-1" }, { key: "RDC-77" }] },
    { id: "c2", name: "Blocked on QA", items: [] },
    { id: "c3", name: "Scratch", items: [] },
  ],
});
// The store was poked directly, so the script has to be told to re-read it. This
// used to lean on a frame an earlier block happened to leave queued, which made
// the whole section depend on what ran before it.
dispatch(document, "visibilitychange");
flush();
is("two items to empty", items0(), 2);
is("⌫ is an icon while it is disarmed", emptyButton().textContent, "⌫");

dispatch(emptyButton(), "click");
flush();
is("one click ARMS it and the label becomes the question", emptyButton().textContent, "Empty 2?");
is("and nothing was removed", items0(), 2);
is("the tooltip says there is no undo", /no undo/.test(emptyButton().title), true);

// Anything else disarms, which is how walking away works.
dispatch(byId.get("gt-cart-live-head"), "click");
flush();
is("a click on the drawer's dead space disarms it", emptyButton().textContent, "⌫");
dispatch(emptyButton(), "click");
dispatch(body, "pointerdown");
flush();
is("and so does going back to the page", emptyButton().textContent, "⌫");
is("and still nothing was removed", items0(), 2);

dispatch(emptyButton(), "click");
dispatch(emptyButton(), "click");
flush();
is("two clicks empty it", items0(), 0);
is("and the collection and its name survive", names()[0], "Sprint review");
is("an empty collection cannot be emptied again", emptyButton().disabled, true);

// The chip's ✕ deletes the collection, and it arms the same way.
is("three collections", names(), ["Sprint review", "Blocked on QA", "Scratch"]);
dispatch(chipX(chips()[1]), "click");
flush();
is("the armed chip says so, for CSS to paint red", chips()[1].attrs["data-gt-armed"], "true");
is("nothing was deleted yet", names().length, 3);
is("its tooltip names what goes", /Click again to delete Blocked on QA/.test(chipX(chips()[1]).title), true);
dispatch(chipX(chips()[1]), "click");
flush();
is("the second click deletes it", names(), ["Sprint review", "Scratch"]);

// Arming one thing disarms the other: only ever one armed control.
dispatch(chipX(chips()[1]), "click");
dispatch(emptyButton(), "click");
flush();
is("arming ⌫ disarmed the chip", chips()[1].attrs["data-gt-armed"], "false");
dispatch(chipX(chips()[0]), "click");
flush();
is("and arming a chip disarmed ⌫", emptyButton().textContent, "⌫");

// Deleting the ACTIVE collection promotes the next by construction (§2.4).
dispatch(chipX(chips()[0]), "click");
dispatch(chipX(chips()[0]), "click");
flush();
is("the next collection became active", names(), ["Scratch"]);
is("the badge followed", badge.textContent.includes("Scratch"), true);

// §2.4: `collections` is never empty, so the last one is EMPTIED, not removed.
dispatch(toggleOf(rows()[0]), "click");
flush();
is("the only collection has an item", items0(), 1);
is("its ✕ says it will empty rather than remove", /only collection/.test(chipX(chips()[0]).title), true);
dispatch(chipX(chips()[0]), "click");
dispatch(chipX(chips()[0]), "click");
flush();
is("the last collection is emptied and NOT removed", names(), ["Scratch"]);
is("and its items are gone", items0(), 0);

// Closing the drawer must not leave a live armed control behind it.
dispatch(emptyButton(), "click");
dispatch(byId.get("gt-cart-head").children[1].children[1], "click");
dispatch(badge, "click");
flush();
is("closing the drawer disarmed it", emptyButton().textContent, "⌫");

// ---- THE EIGHTH VIEW, arriving the way it really does: React mounts it, the
// mount animation fires, and the Cart has never been told about it in advance.
// This is §7 step 24, and it is one of the four fixes that was reported, fixed, and
// never seen working. The names are appendix A.6's and §2.1's, off a live page.
const ROADMAP_ROW = "roadmap.timeline-table.components.list-item.container-576933";
const ROADMAP_EXPAND = "roadmap.timeline-table.components.list-item.expand-button.container-576933";
const ROADMAP_KEY = "roadmap.timeline-table-kit.ui.list-item-content.summary.key";
const ROADMAP_TITLE = "roadmap.timeline-table-kit.ui.list-item-content.summary.title";

const view = element("div");
view.setAttribute("data-testid", "sr-timeline");
const roadmapRow = element("div");
roadmapRow.setAttribute("data-testid", ROADMAP_ROW);
roadmapRow.setAttribute("role", "gridcell");
// The trap §2.1 names: a span INSIDE the row whose testid also ends in
// `container-576933`. A shorter match seizes it and splits one row into two groups.
const expand = element("span");
expand.setAttribute("data-testid", ROADMAP_EXPAND);
// The real anchor text, screen-reader tail included -- the string that defeated
// `02c`'s own regex and that `cleanText` exists to survive.
const roadmapKey = anchor("/browse/RDC-21069", "RDC-21069, (opens new window)");
roadmapKey.setAttribute("data-testid", ROADMAP_KEY);
const roadmapTitle = element("div");
roadmapTitle.setAttribute("data-testid", ROADMAP_TITLE);
roadmapTitle.textContent = "Rundown - Full Day Pattern Epic";
roadmapRow.append(expand, roadmapKey, roadmapTitle);
view.append(roadmapRow);
body.append(view);

// The mount signal, not a manual render: `animationstart` is how the script learns
// a view it has never seen just appeared (§2.10).
dispatch(roadmapKey, "animationstart", { animationName: "gt-cart-mount" });
flush();

const timelineRow = () => rows().find((r) => keyOf(r).textContent === "RDC-21069");
is("the eighth view's key reached the live list", !!timelineRow(), true);
is("and the live list grew by exactly one key", byId.get("gt-cart-live-head").textContent, "On this page (4)");
is("NO WARNING BADGE: its key sits in a row this script knows", !!byId.get("gt-cart-warning"), false);
is("the row carries its title beside the key, from tier 1",
  toggleOf(timelineRow()).children.find((k) => k.classList.includes("gt-cart-row-summary")).textContent,
  "Rundown - Full Day Pattern Epic");
is("the screen-reader tail is not part of the key", keyOf(timelineRow()).textContent, "RDC-21069");
is("the live list labels it timeline, the same label the Plans timeline takes",
  toggleOf(timelineRow()).children.find((k) => k.classList.includes("gt-cart-row-origin")).textContent,
  "timeline");
dispatch(toggleOf(timelineRow()), "click");
flush();
is("adding from it stores the key AND the title",
  JSON.parse(store["gt-jira-cart.collections"]).collections[0].items,
  [{ key: "RDC-21069", summary: "Rundown - Full Day Pattern Epic" }]);
is("and the debug line names tier 1, which is how §7 step 5 is read",
  logs.some(([l, m]) => l === "debug" && m.includes("RDC-21069") && m.includes("(tier 1)")), true);

// ---- THE ⚙, which was INERT FOR TWO VERSIONS. A rule at (2,0,2) beat the hiding
// rule at (1,1,1), so the area was permanently visible and the button toggled an
// attribute that changed nothing (§2.11). `css-smoke` proves the cascade; this
// proves the attribute flips and the switch writes.
const gear = () => byId.get("gt-cart-head").querySelector('[data-gt-action="prefs"]');
const prefsArea = () => byId.get("gt-cart-prefs");
is("the preferences area starts hidden", prefsArea().hidden, true);
// THE BUTTON SAYS SO TOO, and it did not until 1.2.0. A use report said the ⚙ was
// "bordered in blue after clicking" whether the click had opened the settings or
// closed them -- that was the FOCUS ring standing in for a state that did not exist,
// and clicking anywhere else took it away. `css-smoke` proves the paint; this proves
// the attribute it paints from follows the panel.
is("and the ⚙ says it is closed before anything is pressed",
  gear().getAttribute("aria-expanded"), "false");
dispatch(gear(), "click");
flush();
is("THE ⚙ OPENS IT", prefsArea().hidden, false);
is("and the button now says it is open", gear().getAttribute("aria-expanded"), "true");
is("all three switches are there, not just the one 08 specified",
  [byId.get("gt-cart-pref-right-click"), byId.get("gt-cart-pref-layout"), byId.get("gt-cart-pref-corner")].map((n) => !!n),
  [true, true, true]);
is("and each carries what storage says",
  [byId.get("gt-cart-pref-right-click").checked, byId.get("gt-cart-pref-layout").value, byId.get("gt-cart-pref-corner").value],
  [false, "auto", "bottom-right"]);
is("the right-click switch ships OFF", byId.get("gt-cart-pref-right-click").checked, false);

// Flipping one writes the preference and nothing else.
byId.get("gt-cart-pref-right-click").checked = true;
dispatch(byId.get("gt-cart-pref-right-click"), "change");
flush();
is("the switch wrote the preference", JSON.parse(store["gt-jira-cart.prefs"]).rightClickMenu, true);
is("and left the collections alone", JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.length, 1);
byId.get("gt-cart-pref-corner").value = "bottom-left";
dispatch(byId.get("gt-cart-pref-corner"), "change");
flush();
is("the corner is a preference a control can set", html.dataset.gtCartCorner, "bottom-left");
byId.get("gt-cart-pref-corner").value = "bottom-right";
dispatch(byId.get("gt-cart-pref-corner"), "change");
byId.get("gt-cart-pref-right-click").checked = false;
dispatch(byId.get("gt-cart-pref-right-click"), "change");
dispatch(gear(), "click");
flush();
is("and the ⚙ closes it again", prefsArea().hidden, true);
is("and says so, so the state cannot outlive the panel",
  gear().getAttribute("aria-expanded"), "false");

// ---- 🔍 SEARCH SHOWS EXACTLY THE COLLECTION (§7 step 14), with three items and
// one of them summary-less -- which is the step's own setup. A format that dropped
// the bare item would make the search a different set from the collection.
store["gt-jira-cart.collections"] = JSON.stringify({
  v: 1,
  collections: [{ id: "c1", name: "Scratch", items: [
    { key: "RDC-1", summary: "A live issue" },
    { key: "RDC-77" },
    { key: "GLX-402", summary: "A smart link title" },
  ] }],
});
flush();
dispatch(copy("jql"), "click");
is("the search names all three keys, the bare one included, in collection order",
  decodeURIComponent(opened.at(-1).url),
  "https://dalet.atlassian.net/issues/?jql=key in (RDC-1, RDC-77, GLX-402)");
is("the commas and parentheses are encoded, or the search silently returns another set",
  /key%20in%20\(RDC-1%2C%20RDC-77%2C%20GLX-402\)/.test(opened.at(-1).url), true);

// ---- THE RIGHT-CLICK MENU, which had never been switched on by anything. It is
// built, it ships OFF, and §6 item 11 asks whether the preference is ever used --
// so until now no session and no harness had run a single line of it (§2.7).
// `renderMenu` REMOVES the menu rather than hiding it, and this harness's
// getElementById hands back a detached node, so "is it open" has to ask whether it
// is still in the document.
const menu = () => byId.get("gt-cart-menu");
const menuOpen = () => byId.get("gt-cart-menu")?.isConnected === true;
const menuItems = () => menu()?.children.map((k) => k.textContent) ?? null;
// A real DOM resolves `.href` to an absolute URL; the stub only holds the
// attribute, and the menu's Open entry reads the property.
const rightClickTarget = card.children[0];
rightClickTarget.href = "https://dalet.atlassian.net/browse/RDC-77";

dispatch(rightClickTarget, "contextmenu", { clientX: 400, clientY: 300 });
flush();
is("OFF, an issue link keeps the browser's own menu", menuOpen(), false);

byId.get("gt-cart-pref-right-click").checked = true;
dispatch(byId.get("gt-cart-pref-right-click"), "change");
flush();
dispatch(rightClickTarget, "contextmenu", { clientX: 400, clientY: 300 });
flush();
is("ON, the Cart's menu appears on an issue link", menuOpen(), true);
is("with two entries: the toggle, and the gesture it takes away",
  menuItems(), ["Remove RDC-77 from Scratch", "Open link in new tab"]);
is("it is our own UI, so the scan and the floating button skip it",
  menu().attrs["data-gt-cart-ui"], "");
is("and it is placed at the pointer", [menu().style.left, menu().style.top], ["400px", "300px"]);

// The label is derived from storage, and the click derives the direction again
// inside the read-modify-write -- so a stale label cannot cause the wrong operation.
dispatch(menu().children[0], "click");
flush();
is("the entry removed it, because that is what the label said",
  JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.map((i) => i.key),
  ["RDC-1", "GLX-402"]);
is("and the menu closed itself", menuOpen(), false);

dispatch(rightClickTarget, "contextmenu", { clientX: 10, clientY: 10 });
flush();
is("re-opened on the same key it now offers the add", menuItems()[0], "Add RDC-77 to Scratch");
const openedBefore = opened.length;
dispatch(menu().children[1], "click");
flush();
is("Open link in new tab gives back the gesture the interception took",
  opened.at(-1), { url: "https://dalet.atlassian.net/browse/RDC-77", target: "_blank", features: "noopener" });
is("and it collected nothing", JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.length, 2);
is("exactly one tab was opened", opened.length, openedBefore + 1);

// Our own rows keep the browser's menu: there is nothing to add to a cart row.
dispatch(keyOf(rows()[0]), "contextmenu", { clientX: 10, clientY: 10 });
flush();
is("the drawer's own key links keep the browser's menu", menuOpen(), false);

// UNLIKE THE DRAWER, the menu IS light-dismissed and Escape DOES close it (§2.9).
dispatch(rightClickTarget, "contextmenu", { clientX: 10, clientY: 10 });
flush();
is("the menu is back", menuOpen(), true);
dispatch(byId.get("gt-cart-live-list"), "keydown", { key: "Escape" });
flush();
is("ESCAPE CLOSES THE MENU, where it does not close the drawer", menuOpen(), false);
dispatch(rightClickTarget, "contextmenu", { clientX: 10, clientY: 10 });
flush();
dispatch(body, "scroll");
flush();
is("and a scroll closes it, because it cannot follow the link it opened on", menuOpen(), false);
is("the drawer is untouched by all of it", html.dataset.gtCartOpen, "true");

byId.get("gt-cart-pref-right-click").checked = false;
dispatch(byId.get("gt-cart-pref-right-click"), "change");
flush();
dispatch(rightClickTarget, "contextmenu", { clientX: 10, clientY: 10 });
flush();
is("switched back off, it is inert again", menuOpen(), false);

// ---- the write failed: ⚠️ on the badge, the sentence in the drawer
throwOnWrite = true;
dispatch(toggleOf(rows()[0]), "click");
flush();
is("the badge carries the symbol", badge.textContent.startsWith("⚠️"), true);
is("the drawer carries the sentence", byId.get("gt-cart-alert").textContent,
  "This site's browser storage is full, so nothing new can be saved. Copy this collection out, then remove some items.");
is("and the sentence is visible", byId.get("gt-cart-alert").hidden, false);
throwOnWrite = false;
dispatch(toggleOf(rows()[0]), "click");
flush();
is("a write that works clears it", byId.get("gt-cart-alert").hidden, true);

// ---- Escape does not close the drawer, and nothing on the page does either
dispatch(byId.get("gt-cart-live-list"), "keydown", { key: "Escape" });
dispatch(body, "pointerdown");
dispatch(body, "click");
flush();
is("ESCAPE DOES NOT CLOSE IT", html.dataset.gtCartOpen, "true");
dispatch(byId.get("gt-cart-head").children[1].children[1], "click");
flush();
is("the ✕ does", html.dataset.gtCartOpen, "false");

is("the only error in the whole run is the quota failure we caused", errors(),
  ["[Jira Cart] could not write the collections QuotaExceededError: quota"]);
console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
