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
// Found by class and not by position: since 1.4.0 the first child of an item row is
// the drag grip, and a positional read here is what said so, loudly.
is("the collection has the row", items().map((r) => keyOf(r).textContent), ["RDC-77"]);
is("and its key is a link too", keyOf(items()[0]).tag, "a");
is("pointing at the issue", keyOf(items()[0]).attrs.href, "https://dalet.atlassian.net/browse/RDC-77");
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

/* ---- THE LINE SHAPE REACHES THE CLIPBOARD, and it is read AT THE PRESS.
   `format-smoke` asserts the bytes of all five shapes; what only this harness can
   say is that the stored preference is what a real click actually consults. The
   store is poked with no re-render on purpose -- if `format` held the shape in a
   variable instead of reading it at the press, this check would go on copying the
   default and would be measuring nothing (§2.8, decision 5). */
const prefsRaw = () => JSON.parse(store["gt-jira-cart.prefs"]);
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsRaw(), lineShape: "url" });
dispatch(copy("links"), "click");
await Promise.resolve();
is("a stored shape is what the press copies, both flavours",
  [clipboard.at(-1)["text/plain"].text, clipboard.at(-1)["text/html"].text],
  ["- https://dalet.atlassian.net/browse/RDC-77",
   '<ul><li style="line-height:1.5;margin-bottom:8px">' +
   '<a href="https://dalet.atlassian.net/browse/RDC-77">https://dalet.atlassian.net/browse/RDC-77</a></li></ul>']);
// A SHAPE THIS BUILD DOES NOT KNOW MUST NOT REACH A FORMATTER. `normalisePrefs`
// sends it back to `markdown` on the way out of the store, which is the opposite of
// what a malformed COLLECTION gets, and the whole reason the two live in different
// keys (§2.4).
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsRaw(), lineShape: "haiku" });
dispatch(copy("links"), "click");
await Promise.resolve();
is("an unknown shape id copies the default rather than nothing",
  clipboard.at(-1)["text/plain"].text,
  "- [RDC-77](https://dalet.atlassian.net/browse/RDC-77) The linked issue's own summary");
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsRaw(), lineShape: "markdown" });

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

// ---- ⚙ IS A SCREEN, NOT A STRIP (1.2.0, decision 17). It was three checkboxes in
// a strip above the sections; the configurable exports bring about twenty-two
// controls, and this drawer can be 300x215 with every container on `overflow: clip`,
// so a panel sharing the box would be SILENTLY TRUNCATED. It is now a MODE over the
// whole body.
//
// The ⚙ was also INERT FOR TWO VERSIONS: a rule at (2,0,2) beat the hiding rule at
// (1,1,1), so the area was permanently visible and the button toggled an attribute
// that changed nothing (§2.11). `css-smoke` proves the cascade; this proves the
// attributes flip, the controls write, and the body really goes.
const gear = () => byId.get("gt-cart-head").querySelector('[data-gt-action="prefs"]');
const panel = () => byId.get("gt-cart-prefs");
const drawerBody = () => byId.get("gt-cart-body");
const headTitle = () => byId.get("gt-cart-head-title");
const closeButton = () => byId.get("gt-cart-head").querySelector('[data-gt-action="close"]');
const tabButton = (id) => byId.get(`gt-cart-tab-${id}`);
const tabPanel = (id) => byId.get(`gt-cart-tabpanel-${id}`);
const restoreButton = () => byId.get("gt-cart-restore");
const prefsOf = () => JSON.parse(store["gt-jira-cart.prefs"]);
// A RENDER FROM A CAUSE THAT IS NOT A CLICK: the mount animation, which is the
// script's real signal that React built something (§2.10). `visibilitychange` will
// NOT do -- it compares the collections blob with the last one parsed and returns
// early when it has not changed, so a preference poked into the store would never
// be re-read and the check would pass while measuring nothing.
const rerender = () => {
  dispatch(document, "animationstart", { animationName: "gt-cart-mount" });
  flush();
};
// Preferences with no control yet -- ticket 05's bands, ticket 04's field lists --
// are put there by poking the store and letting the next render read it back out.
const setPrefs = (patch) => {
  store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsOf(), ...patch });
  rerender();
};

is("the settings panel starts hidden", panel().hidden, true);
is("and the two standing sections are what is on screen", drawerBody().hidden, false);
is("the head names the Cart", headTitle().textContent, "🛒 Cart");
// THE BUTTON SAYS SO TOO, and it did not until 1.2.0. A use report said the ⚙ was
// "bordered in blue after clicking" whether the click had opened the settings or
// closed them -- that was the FOCUS ring standing in for a state that did not exist,
// and clicking anywhere else took it away. `css-smoke` proves the paint; this proves
// the attribute it paints from follows the panel.
//
// `aria-pressed` and no longer `aria-expanded`: once ⚙ replaces the body the panel
// is not a region BESIDE the content, it IS the content, which is a mode toggle
// rather than a disclosure. One constant moved both the render and the sheet.
is("and the ⚙ says it is not pressed before anything is pressed",
  gear().getAttribute("aria-pressed"), "false");
is("it no longer claims to control a region beside it", gear().getAttribute("aria-controls"), null);

dispatch(gear(), "click");
flush();
is("THE ⚙ OPENS THE SETTINGS SCREEN", panel().hidden, false);
is("and it REPLACES the two standing sections, rather than sitting above them",
  drawerBody().hidden, true);
// ONE BOOLEAN MOVES ALL THREE, and it costs one `hidden` because the foot is a child
// of the collection section, which is a child of the body. Six buttons and a border
// is about 40px, a fifth of the drawer at MIN_BLOCK, and none of them can act on
// anything while the panel is up.
is("so the six foot buttons go with them, because the foot is inside the body",
  byId.get("gt-cart-foot").closest("#gt-cart-body") === drawerBody(), true);
is("and the button now says it is pressed", gear().getAttribute("aria-pressed"), "true");
is("the head names the screen you are on", headTitle().textContent, "⚙ Settings");
is("and the ⚙'s own tooltip says what the next press does",
  /go back to the collection/.test(gear().title), true);

// The three switches did not move house: they are the appearance tab's contents now.
is("all three switches are there, not just the one 08 specified",
  [byId.get("gt-cart-pref-right-click"), byId.get("gt-cart-pref-layout"), byId.get("gt-cart-pref-corner")].map((n) => !!n),
  [true, true, true]);
is("and they live on the appearance tab",
  [byId.get("gt-cart-pref-right-click"), byId.get("gt-cart-pref-layout"), byId.get("gt-cart-pref-corner")]
    .map((n) => n.closest("#gt-cart-tabpanel-appearance") === tabPanel("appearance")),
  [true, true, true]);
is("and each carries what storage says",
  [byId.get("gt-cart-pref-right-click").checked, byId.get("gt-cart-pref-layout").value, byId.get("gt-cart-pref-corner").value],
  [false, "auto", "bottom-right"]);
is("the right-click switch ships OFF", byId.get("gt-cart-pref-right-click").checked, false);

/* ---- `Issue reference` IS PINNED ABOVE THE BAR (decision 29). It governs all
   three exports, so a tab that owned it would tell a small lie about its scope --
   which is the only reason this screen has three tabs and not four. */
const shapeSelect = () => byId.get("gt-cart-pref-shape");
is("the line-shape control is on the settings screen", !!shapeSelect(), true);
is("and it is pinned, not filed under one of the three tabs",
  ["appearance", "details", "report"]
    .some((id) => shapeSelect().closest(`#gt-cart-tabpanel-${id}`) === tabPanel(id)), false);
// BUILT FROM `SHAPES`, so a shape added or dropped there moves this dropdown with
// it. A second list of names here is a value that can disagree with the bytes.
is("its options are the shape table, in the shape table's order",
  shapeSelect().children.map((option) => option.value),
  ["markdown", "markdown-key", "key-summary-url", "key-url", "url"]);
is("and they are shown by their labels, not their ids",
  shapeSelect().children.map((option) => option.textContent),
  ["Markdown link on the key", "Markdown link, no summary", "Key, summary, then the URL",
   "Key and URL, no summary", "URL only"]);
is("it carries what storage says", shapeSelect().value, "markdown");
// THE LAST PLACEHOLDER WENT AT 1.2.0. `Nothing to configure here yet.` stood in for
// each group until the ticket that filled it arrived; ticket 03 took the pinned
// group's and ticket 04 took both export tabs', so the class is gone from the script
// and from the stylesheet with it. This asserts it is gone from the whole screen and
// not just from one group, because a placeholder left on a tab nobody opened is a
// screen that reads as unfinished to the one person who does open it.
is("no placeholder note is left anywhere on the settings screen",
  byId.get("gt-cart-prefs").querySelectorAll(".gt-cart-note").length, 0);

shapeSelect().value = "key-summary-url";
dispatch(shapeSelect(), "change");
flush();
is("choosing a shape writes the preference", prefsOf().lineShape, "key-summary-url");
is("and the control still says what storage says after the render it caused",
  shapeSelect().value, "key-summary-url");
// Back to the default, so nothing below this line is reading a shape it did not set.
shapeSelect().value = "markdown";
dispatch(shapeSelect(), "change");
flush();
is("and back again", prefsOf().lineShape, "markdown");

// THE BAR SHOWS EVERY TAB whether it has been pressed or not, so there is no
// open/closed set to store and a tab added later is visible the moment it exists
// (decision 20). That is the whole difference from the collapsible layout the
// prototype tried and use reversed.
is("the bar is a real tablist", byId.get("gt-cart-tabs").attrs.role, "tablist");
is("with three tabs, and each one is a tab", 
  byId.get("gt-cart-tabs").children.map((b) => b.attrs.role), ["tab", "tab", "tab"]);
is("Appearance beside the two exports it is a peer of",
  byId.get("gt-cart-tabs").children.map((b) => b.textContent),
  ["Appearance", "📋 Details", "📊 Report"]);
is("a fresh install opens on the first tab",
  ["appearance", "details", "report"].map((id) => tabButton(id).attrs["aria-selected"]),
  ["true", "false", "false"]);
is("and exactly one panel is on screen",
  ["appearance", "details", "report"].map((id) => tabPanel(id).hidden), [false, true, true]);
// ON THE TABS THAT HOLD EXPORT SETTINGS AND NOWHERE ELSE (decision 22). On the
// appearance tab it is an offer to reset something you are not looking at.
is("the restore is not offered on the appearance tab", restoreButton().hidden, true);

// ---- SWITCHING TAB IS A WRITE, and nothing holds a copy of which tab is open.
dispatch(tabButton("details"), "click");
flush();
is("switching tab writes the preference", prefsOf().settingsTab, "details");
is("the bar says which one", 
  ["appearance", "details", "report"].map((id) => tabButton(id).attrs["aria-selected"]),
  ["false", "true", "false"]);
is("and the panels swapped", 
  ["appearance", "details", "report"].map((id) => tabPanel(id).hidden), [true, false, true]);
is("the restore appears on a tab that holds export settings", restoreButton().hidden, false);
is("and it is an offer before it is a question", restoreButton().textContent, "↺ Restore export defaults");

/* ---- TWO SELECTIONS OVER ONE CATALOGUE (§2.14, decisions 7 to 11). Each export
   tab carries an ordered, ticked list of the SAME eight fields, and a preference can
   only say which of them a document uses and in what order -- so the ids, the labels
   and every measured style stay in one copy each and nothing a user can click
   reaches the five paste rules.

   THE DRAG ITSELF IS NOT DRIVEN HERE -- and "and cannot be", which this comment said
   until 1.4.0, was wrong. A drag reads the element it was dispatched on and a rect,
   both of which this harness has: the COLLECTION's drag is driven in full at the foot
   of this file (§2.9.1). These rows were not retro-fitted, which was a scope call and
   not a limit. `smoke.mjs` covers `moveInList` directly and §7 step 31 is the browser
   pass. What IS driven here is everything else -- the rows, the ticks, the writes,
   and the order the panel draws a stored list in. */
const fieldRows = (tab) => byId.get(`gt-cart-fields-${tab}`).children;
const fieldIds = (tab) => fieldRows(tab).map((row) => row.attrs["data-gt-field"]);
const fieldRow = (tab, id) => fieldRows(tab).find((row) => row.attrs["data-gt-field"] === id);
const fieldBox = (tab, id) => fieldRow(tab, id).querySelector("input");
const fieldNote = (tab, id) => fieldRow(tab, id).querySelector(".gt-cart-field-note").textContent;
const ticked = (key) => prefsOf()[key].filter((one) => one.on).map((one) => one.id);
const CATALOGUE = ["type", "status", "priority", "assignee", "team", "fixv", "remaining", "parent"];

is("each export tab carries a field list", 
  ["details", "report"].map((tab) => !!byId.get(`gt-cart-fields-${tab}`)), [true, true]);
is("and the appearance tab does not, because it configures no export",
  byId.get("gt-cart-fields-appearance"), undefined);
// OFF IS NOT ABSENT. Every catalogue field has a row whether it is ticked or not, so
// a field is always findable and one click turns it on -- which is the other half of
// `normaliseFieldList`'s step 5 and why a stored empty list is still completed.
is("every catalogue field has a row in both lists, ticked or not",
  [fieldIds("details"), fieldIds("report")], [CATALOGUE, CATALOGUE]);
is("and it is named once, in the catalogue, rather than beside the checkbox",
  fieldRows("details").map((row) => row.querySelector("label").textContent || 
    row.querySelector("label").children.map((k) => k.textContent).join("")),
  [" Type", " Status", " Priority", " Assignee", " Team", " Fix version", " Time remaining", " Parent"]);
is("each box says what storage says",
  fieldIds("details").map((id) => fieldBox("details", id).checked),
  [true, true, true, true, false, true, true, true]);
// TWO SELECTIONS. Report's own list is the same catalogue with priority off, because
// priority is its first band -- and at 1.2.0 that is what the DEFAULT says rather
// than what the renderer does (decision 8).
is("📊 Report's list is its own, and it differs from 📋 Details' by the band",
  fieldIds("report").map((id) => fieldBox("report", id).checked),
  [true, true, false, true, false, true, true, true]);
is("team is off in both: a NEW FIELD ARRIVES OFF where a new tab arrives visible",
  ["details", "report"].map((tab) => fieldBox(tab, "team").checked), [false, false]);

// Every row is a drag target that names the preference a drop writes. The row and
// its checkbox both carry it, because the delegated `change` listener is handed the
// input and the delegated drag listeners are handed the row.
is("every row is draggable and names the key it writes",
  fieldRows("details").map((row) => `${row.attrs.draggable}:${row.attrs["data-gt-list"]}`),
  CATALOGUE.map(() => "true:detailsFields"));
is("and so does every checkbox inside one",
  fieldRows("report").map((row) => row.querySelector("input").attrs["data-gt-list"]),
  CATALOGUE.map(() => "reportFields"));

// A FIELD THAT IS ALSO A HEADING IS MARKED, NOT VETOED (decision 8). A field that
// appeared only in a heading would be a field whose meaning depends on the row's
// position, which is what §2.14 rule 4 is about -- so somebody who drags a line out
// of its band in the pasted mail can choose to keep the value readable on the row.
is("📊 Report marks the two fields that are also its headings",
  fieldIds("report").filter((id) => fieldNote("report", id)), ["priority", "team"]);
is("and it says so in words", fieldNote("report", "priority"), "also a heading");
is("📋 Details marks nothing, because it has no headings at all",
  fieldIds("details").filter((id) => fieldNote("details", id)), []);

/* ---- TICKET 05'S TWO BAND DROPDOWNS. `format-smoke` holds every byte they can
   produce; what is here is the CONTROL -- that it exists on the tab that owns the
   headings and nowhere else, that its options are the script's own band vocabulary,
   that a change writes the preference, and that the `also a heading` marks beside it
   MOVE when a band does. That last one is the reason this section sits here rather
   than in `format-smoke`: it is one preference redrawing a control that reads a
   different one, which is exactly the kind of thing a pure-function harness cannot
   see.

   The comment above says the preferences with no control yet are poked into the
   store. From here on the bands have one, so they are driven by a real change event
   like every other control on this screen. */
const bandSelect = (key) => byId.get(`gt-cart-pref-${key.toLowerCase()}`);
const BAND_IDS = ["priority", "team", "category", "assignee", "type", "fixv", "parent"];

is("both band dropdowns are on the settings screen",
  [!!bandSelect("reportBand1"), !!bandSelect("reportBand2")], [true, true]);
// ON THE TAB THAT OWNS THE HEADINGS, and nowhere else. 📋 Details has no headings at
// all, and the pinned `Issue reference` row is pinned because it governs all three
// exports -- a band governs one, so it belongs under that one's tab.
is("and both are on 📊 Report's tab, because it is the only export with headings",
  ["reportBand1", "reportBand2"].map((key) => bandSelect(key).closest("#gt-cart-tabpanel-report") === tabPanel("report")),
  [true, true]);
is("they sit ABOVE the field list, because a band is what takes a field into a heading",
  tabPanel("report").children.indexOf(bandSelect("reportBand1").closest(".gt-cart-bands")) <
    tabPanel("report").children.indexOf(byId.get("gt-cart-fields-report")), true);
// BUILT FROM `BANDS`, so a band added or dropped there moves both dropdowns with it.
// A second list of names here is a value that can disagree with the headings.
is("band 1's options are the seven bandable fields, in the script's own order",
  bandSelect("reportBand1").children.map((option) => option.value), BAND_IDS);
is("band 2's are the same seven with None in front, and only band 2 has it",
  bandSelect("reportBand2").children.map((option) => option.value), ["none", ...BAND_IDS]);
is("and they are shown by their labels, not their ids",
  bandSelect("reportBand1").children.map((option) => option.textContent),
  ["Priority", "Team", "Status category", "Assignee", "Type", "Fix version", "Parent"]);
// TIME REMAINING IS NOT THERE (decision 14). Its band order would be string order
// over durations, and "10m" < "2d" < "9h" reads as a broken report.
is("time remaining is offered as a row field and never as a band",
  [fieldIds("report").includes("remaining"), BAND_IDS.includes("remaining")], [true, false]);
is("both carry what storage says",
  ["reportBand1", "reportBand2"].map((key) => bandSelect(key).value), ["priority", "team"]);

/* ---- THE TWO BANDS MAY NOT NAME THE SAME FIELD (§2.15, REVERSED FROM USE ON
   2026-08-25). It shipped allowed, on the reasoning that `Team` under `Team` is
   useless, truthful and visible the moment it is pasted. The user pressed it and
   reported it as a defect. `format-smoke` holds `bandPatch` directly and
   `store-smoke` holds the blob that arrives duplicated; what is here is the two
   controls, driven by real change events, because the rule lives in BOTH of them and
   neither half is the whole of it. */
const optionsOf = (key) => bandSelect(key).children
  .filter((option) => !option.disabled).map((option) => option.value);

is("`Group by` offers all seven, always, which is what leaves the swap reachable",
  optionsOf("reportBand1"), BAND_IDS);
is("but `Then by` does not offer the field `Group by` holds",
  optionsOf("reportBand2"), ["none", ...BAND_IDS.filter((id) => id !== "priority")]);
is("and None is never greyed, because it is not a field",
  bandSelect("reportBand2").children.find((option) => option.value === "none").disabled, false);

// THE GREYED ONE FOLLOWS BAND 1, because it is derived on every render rather than
// written when the dropdown changed -- a flag would disagree the moment another tab
// moved the band.
setPrefs({ reportBand1: "fixv", reportBand2: "team" });
is("the greyed option follows `Group by` when it moves",
  optionsOf("reportBand2"), ["none", ...BAND_IDS.filter((id) => id !== "fixv")]);
is("and `Group by` is still ungreyed all the way across",
  optionsOf("reportBand1"), BAND_IDS);

// ---- THE SWAP, THROUGH A REAL PRESS. Asking to group by the field that was the
// sub-band is a REORDER, which is the one thing these two dropdowns exist to do -- so
// it is one press and nothing is thrown away. It is the only place on this screen
// where a press moves a control other than the one pressed, and what band 2 receives
// is not a value nobody chose: it is the one band 1 just gave up.
setPrefs({ reportBand1: "priority", reportBand2: "team" });
bandSelect("reportBand1").value = "team";
dispatch(bandSelect("reportBand1"), "change");
flush();
is("moving `Group by` onto `Then by`'s field SWAPS the two, in one press",
  [prefsOf().reportBand1, prefsOf().reportBand2], ["team", "priority"]);
is("and both controls say so after the render it caused",
  [bandSelect("reportBand1").value, bandSelect("reportBand2").value], ["team", "priority"]);
is("the greying swapped with them", optionsOf("reportBand2"),
  ["none", ...BAND_IDS.filter((id) => id !== "team")]);
is("and the `also a heading` marks are still the same two fields, in the new order",
  fieldIds("report").filter((id) => fieldNote("report", id)).sort(), ["priority", "team"]);
// PRESSING IT AGAIN PUTS IT BACK, which is what makes the swap a gesture rather than
// a one-way door.
bandSelect("reportBand1").value = "priority";
dispatch(bandSelect("reportBand1"), "change");
flush();
is("pressing it again swaps them back", [prefsOf().reportBand1, prefsOf().reportBand2],
  ["priority", "team"]);
// AN ORDINARY CHANGE IS STILL ONE KEY. The swap must not fire when there is nothing
// to swap with, or every press would move both controls.
bandSelect("reportBand1").value = "type";
dispatch(bandSelect("reportBand1"), "change");
flush();
is("an ordinary change leaves the other band exactly alone",
  [prefsOf().reportBand1, prefsOf().reportBand2], ["type", "team"]);
// Back to the shipped pair, so the section below is a real change rather than a write
// of the value that was already there -- see this repo's test README on why a check
// that cannot fail is worse than no check.
setPrefs({ reportBand1: "priority", reportBand2: "team" });

// ---- CHOOSING A BAND IS A WRITE, and the marks beside it follow.
bandSelect("reportBand1").value = "type";
dispatch(bandSelect("reportBand1"), "change");
flush();
is("choosing a band writes the preference", prefsOf().reportBand1, "type");
is("and the control still says what storage says after the render it caused",
  bandSelect("reportBand1").value, "type");
// THE MARK IS A FUNCTION OF THE STORED BANDS, which is why moving a band moves it
// with no line in `renderFieldList` naming a band by hand.
is("the `also a heading` mark followed the band off priority and onto type",
  fieldIds("report").filter((id) => fieldNote("report", id)), ["type", "team"]);
is("and 📋 Details still marks nothing, because a band belongs to one export",
  fieldIds("details").filter((id) => fieldNote("details", id)), []);

// ---- `None` IS BAND 2's ALONE, and it takes the second heading away.
bandSelect("reportBand2").value = "none";
dispatch(bandSelect("reportBand2"), "change");
flush();
is("None on band 2 writes it too", prefsOf().reportBand2, "none");
is("and the field it used to band stops being marked",
  fieldIds("report").filter((id) => fieldNote("report", id)), ["type"]);

// ---- THE NOTE THAT SAYS WHAT A FIX-VERSION BAND COSTS. It is DERIVED on every
// render from the stored bands, so it appears when the band does and goes when it
// goes -- a flag set on the change would be a second value, and it would disagree the
// moment another tab moved the band (principle 1). It is a description and not a
// warning: there is nothing to dismiss.
const bandNote = () => byId.get("gt-cart-bandnote-report").textContent;
is("no note while both bands are single-valued", bandNote(), "");
bandSelect("reportBand2").value = "fixv";
dispatch(bandSelect("reportBand2"), "change");
flush();
is("a fix-version band says out loud that the report has more lines than issues",
  bandNote(),
  "An issue with two fix versions is listed under both, so this report has more lines than issues.");
is("and the note appears for band 1 as well, because it describes the pair",
  (() => {
    setPrefs({ reportBand1: "fixv", reportBand2: "none" });
    return bandNote();
  })(),
  "An issue with two fix versions is listed under both, so this report has more lines than issues.");
// ANOTHER TAB'S WRITE LANDS ON THESE CONTROLS without either of them knowing about
// it, because every render reads storage -- the same treatment the line shape gets.
setPrefs({ reportBand1: "assignee", reportBand2: "category" });
is("a band written from outside this panel lands on both dropdowns and clears the note",
  [bandSelect("reportBand1").value, bandSelect("reportBand2").value, bandNote()],
  ["assignee", "category", ""]);
is("and the marks moved with it, status because the band is its CATEGORY",
  fieldIds("report").filter((id) => fieldNote("report", id)), ["status", "assignee"]);

// Back to the shipped pair, so nothing below reads a band it did not set.
setPrefs({ reportBand1: "priority", reportBand2: "team" });
is("and back to the pair 1.1.0 emitted",
  [bandSelect("reportBand1").value, bandSelect("reportBand2").value], ["priority", "team"]);

// ---- TICKING A FIELD IS A WRITE, and the panel reads it back out of storage.
const teamBox = fieldBox("details", "team");
teamBox.checked = true;
dispatch(teamBox, "change");
flush();
is("ticking a field writes the preference", ticked("detailsFields"),
  ["type", "status", "priority", "assignee", "team", "fixv", "remaining", "parent"]);
is("and the box still says what storage says after the render it caused",
  fieldBox("details", "team").checked, true);
// ONE CATALOGUE, TWO SELECTIONS: what is duplicated is the selection, and it costs a
// second list of checkboxes and nothing else.
is("the OTHER list was not touched by it", ticked("reportFields"),
  ["type", "status", "assignee", "fixv", "remaining", "parent"]);

// A TICK IS NOT A REORDER. The entry keeps its place, which is the whole reason the
// list stores { id, on } in order rather than an array of enabled ids: unticking
// would otherwise lose the position and re-ticking would send the field to the end.
const priorityBox = fieldBox("details", "priority");
priorityBox.checked = false;
dispatch(priorityBox, "change");
flush();
is("unticking writes too", ticked("detailsFields"),
  ["type", "status", "assignee", "team", "fixv", "remaining", "parent"]);
is("AND THE FIELD KEEPS ITS PLACE rather than being sent to the end",
  prefsOf().detailsFields.map((one) => one.id), CATALOGUE);
is("so the row is still where it was, unticked", 
  [fieldIds("details")[2], fieldBox("details", "priority").checked], ["priority", false]);

// ---- THE PANEL DRAWS THE STORED ORDER. This is the state half of the drag: the
// preference a drop writes is poked in directly, and what is checked is that the
// panel puts the rows where it says. No pointer is involved and none could be.
const parentRow = fieldRow("details", "parent");
setPrefs({ detailsFields: 
  ["parent", "type", "status", "priority", "assignee", "team", "fixv", "remaining"]
    .map((id) => ({ id, on: prefsOf().detailsFields.find((one) => one.id === id).on })) });
is("a stored reorder is what the panel draws, not the catalogue's order",
  fieldIds("details"),
  ["parent", "type", "status", "priority", "assignee", "team", "fixv", "remaining"]);
// MOVED, NOT REBUILT. A rebuilt row would take the focus off the box you are
// clicking and would pull the floor out from under a drag already in flight, which
// is the rule ticket 02 wrote for this panel and the reason it only ever SETS.
is("and the row was MOVED rather than built again, which is the panel's whole rule",
  fieldRows("details")[0] === parentRow, true);
is("so its checkbox came with it, still saying what storage says",
  fieldBox("details", "parent").checked, true);
is("📊 Report's list did not move with it", fieldIds("report"), CATALOGUE);

// ---- COLLECTING FROM THE PAGE KEEPS WORKING WHILE ⚙ IS UP (decision 25). What ⚙
// replaces is the inside of the DRAWER; the floating `+` beside a hovered issue link
// is a different element on the page, and `renderToggle` reads only the hovered
// anchor and the active collection. The two things that had to be checked rather
// than read are that the add lands, and that the render it causes does not close the
// panel or move the tab -- which is what makes the panel a pure function of
// `prefsOpen` rather than something a re-render can take away.
const floating = () => byId.get("gt-cart-toggle");
const keysNow = () => JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.map((i) => i.key);
is("the collection holds one item before the add", keysNow(), ["RDC-21069"]);
dispatch(card.children[0], "pointerover");
flush();
is("hovering an issue link on the page still summons the floating +, panel or no panel",
  floating().hidden, false);
dispatch(floating(), "click");
flush();
is("AN ADD FROM THE PAGE LANDS WHILE ⚙ IS UP", keysNow(), ["RDC-21069", "RDC-77"]);
is("the badge counts it, which is where you see it now", badge.textContent, "🛒 Scratch 2 ▾");
is("and the panel is still up, on the same tab",
  [panel().hidden, prefsOf().settingsTab, tabPanel("details").hidden], [false, "details", false]);

// The same again from OUTSIDE this tab: the store is poked directly and the script
// is told to re-read it, which is what another tab's write looks like from here.
store["gt-jira-cart.collections"] = JSON.stringify({
  v: 1,
  collections: [{ id: "c1", name: "Scratch", items: [{ key: "RDC-1" }] }],
});
dispatch(document, "visibilitychange");
flush();
is("another tab's write re-renders the drawer under the panel", badge.textContent, "🛒 Scratch 1 ▾");
is("and does not close it either", [panel().hidden, tabPanel("details").hidden], [false, false]);

/* ---- A HELD FETCH SURVIVES A PREFERENCE CHANGE, and that is the visible half of
   the decision that the selection is applied at RENDER and never at fetch.
   `DETAIL_FIELDS` asks Jira for all nine whatever the two lists say, so the held rows
   carry every field and a field ticked while a copy is armed costs a re-render and
   nothing else. Narrowing the fetch to the ticked fields is the obvious-looking
   optimisation and it would disarm the button you had already armed -- including
   from ANOTHER TAB, where nobody pressed anything (§2.14).

   What throws the held fetch away is a change to the KEY LIST, and only that. */
store["gt-jira-cart.collections"] = JSON.stringify({
  v: 1,
  collections: [{ id: "c1", name: "Scratch", items: [{ key: "RDC-1513" }] }],
});
dispatch(document, "visibilitychange");
flush();
network.body = ANSWER;
dispatch(details(), "click");
await settle();
is("📋 Details is armed while the settings are up", details().textContent, "📋 Copy");
const fixvBox = fieldBox("details", "fixv");
fixvBox.checked = false;
dispatch(fixvBox, "change");
flush();
is("a field unticked mid-arm wrote the preference", ticked("detailsFields").includes("fixv"), false);
is("AND THE ARMED COPY IS STILL ARMED", details().textContent, "📋 Copy");
is("and still offers the same two items it fetched", /^Copy 1 item/.test(details().title), true);
// The same from outside this tab, which is where nobody pressed anything.
setPrefs({ reportFields: prefsOf().reportFields.map((one) => ({ ...one, on: false })) });
is("another tab emptying the OTHER list does not disarm it either",
  details().textContent, "📋 Copy");
// And the copy it makes is the list as it stands NOW, not as it stood at the press.
dispatch(details(), "click");
await settle();
is("the copy took the fields as they stand at the COPY, not at the fetch",
  /Pyr 2026\.8\.0/.test(clipboard.at(-1)["text/plain"].text), false);
is("and the fields still ticked are all there, in the order the drag left them",
  clipboard.at(-1)["text/plain"].text.split(" — ")[1],
  "↳ [RDC-26701](https://dalet.atlassian.net/browse/RDC-26701) · Story · Dev Resolved · William CHUANG · 0m left");
await settle();
await settle();
network.body = null;

// ---- ↺ RESTORE EXPORT DEFAULTS, armed before it fires, by §3's own convention:
// ⌫ becomes `Empty 3?` before it will empty anything.
// `url` and not a made-up id: since ticket 03 the shapes are real, and a restore
// that only ever put back a value the UI could not produce would be measuring less
// than it looks like it is.
setPrefs({ lineShape: "url", reportBand2: "none", settingsTab: "details", corner: "bottom-left", layout: "split", rightClickMenu: true });
is("five export settings are away from their defaults",
  [prefsOf().lineShape, prefsOf().reportBand2], ["url", "none"]);
// Both field lists too, and by real clicks and a real reorder rather than a poke:
// the section above ticked team, unticked priority and fixv, moved the parent to the
// top, and emptied 📊 Report's list altogether.
is("and so are both field lists, which is what the two sections above did to them",
  [ticked("detailsFields"), ticked("reportFields"), prefsOf().detailsFields[0].id],
  [["parent", "type", "status", "assignee", "team", "remaining"], [], "parent"]);
dispatch(restoreButton(), "click");
flush();
is("ONE PRESS ARMS IT and the label becomes the question", restoreButton().textContent, "Restore?");
is("and writes nothing", [prefsOf().lineShape, prefsOf().reportBand2], ["url", "none"]);
is("the tooltip says there is no undo", /no undo/.test(restoreButton().title), true);
// A render is not a click. The armed state is derived from `armed` inside `render`,
// so a re-render REBUILDS the question rather than wiping it -- which is the same
// treatment ⌫ gets, and the reason the label is derived rather than written on the
// click. Anything that is a click walks away; see below.
rerender();
is("a re-render leaves it armed, because the label is derived and not written",
  restoreButton().textContent, "Restore?");
dispatch(byId.get("gt-cart-tabs"), "click");
flush();
is("but a click on the panel's dead space disarms it", restoreButton().textContent, "↺ Restore export defaults");
is("and still nothing was written", prefsOf().lineShape, "url");

dispatch(restoreButton(), "click");
dispatch(restoreButton(), "click");
flush();
is("TWO PRESSES PUT THE FIVE EXPORT SETTINGS BACK",
  [prefsOf().lineShape, prefsOf().reportBand1, prefsOf().reportBand2],
  ["markdown", "priority", "team"]);
is("both field lists with them", 
  [ticked("detailsFields"), ticked("reportFields")],
  [["type", "status", "priority", "assignee", "fixv", "remaining", "parent"],
   ["type", "status", "assignee", "fixv", "remaining", "parent"]]);
// THE ORDER COMES BACK WITH THE TICKS, because a restore puts the whole stored list
// back and the order is half of what one says.
is("and the ORDER comes back with them, not just the ticks",
  prefsOf().detailsFields.map((one) => one.id), CATALOGUE);
is("the panel followed it, which is a render reading storage rather than a click",
  [fieldIds("details"), fieldBox("details", "priority").checked, fieldBox("details", "team").checked],
  [CATALOGUE, true, false]);
// IT IS AN EXPORT RESTORE AND NOTHING ELSE (decision 22). A dragged size is only
// recoverable by dragging the grip again (risk 10), and being thrown to another tab
// because you reset a field list would be a second change nobody asked for.
is("and it leaves the appearance switches and the tab you are on exactly alone",
  [prefsOf().settingsTab, prefsOf().corner, prefsOf().layout, prefsOf().rightClickMenu],
  ["details", "bottom-left", "split", true]);
is("the panel did not move out from under the press", tabPanel("details").hidden, false);
setPrefs({ corner: "bottom-right", layout: "auto", rightClickMenu: false });

// ---- A STORED TAB THIS BUILD DOES NOT KNOW must not leave the panel blank
// (decision 20). `store-smoke` proves `normalisePrefs` folds it to the first tab;
// this proves the panel that reads it actually draws something.
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsOf(), open: true, settingsTab: "haiku" });
rerender();
is("an unrecognised tab lands on the first one", tabButton("appearance").attrs["aria-selected"], "true");
is("and the panel is not blank", tabPanel("appearance").hidden, false);
is("nor is the stored value rewritten by merely reading it", prefsOf().settingsTab, "haiku");

// ---- ✕ KEEPS EXACTLY ONE MEANING ON BOTH SCREENS: close the drawer. A ✕ that went
// back from the settings instead would leave no way to close the Cart from this
// screen at all.
dispatch(closeButton(), "click");
flush();
is("✕ closes the drawer from the settings screen", html.dataset.gtCartOpen, "false");
is("and it did not quietly mean go back", panel().hidden, false);
dispatch(badge, "click");
flush();
// STATED RATHER THAN INCIDENTAL: `prefsOpen` is in memory and ✕ does not touch it,
// so re-opening inside the same sitting lands where you left. A RELOAD does not,
// because the flag is not stored -- which is the whole reason it is not (§2.9).
is("re-opening in the same sitting comes back to the settings", panel().hidden, false);

dispatch(gear(), "click");
flush();
is("and the ⚙ puts the collection back", [panel().hidden, drawerBody().hidden], [true, false]);
is("the head names the Cart again", headTitle().textContent, "🛒 Cart");
is("and says so, so the state cannot outlive the panel",
  gear().getAttribute("aria-pressed"), "false");

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

/* ---- THE HOVER RAIL, ADDED AT 1.3.0: the copy button beside the `+`, and the
   geometry claim the whole arrangement rests on.

   THE CLAIM IS THAT THE `+` DOES NOT MOVE. It has sat exactly `TOGGLE_GAP` from the
   hovered key since 0.1.1, the left-hand side was chosen from a day of use, and a
   week of use built the habit -- so the copy button had to be added on the OUTSIDE.
   That is checkable without layout: the rail's own `left`, plus the width the rail
   has, is where the `+`'s right edge lands. Turn the copy button off and the number
   must be the SAME. Nothing else in this file can say that, and it is the one thing
   about this feature that a reader would otherwise have to take on trust.

   THE CONSTANTS ARE SLICED, not restated. `store-smoke`'s README entry is about
   exactly this: it copied `MIN_BLOCK` as 160 while the script said 215, and the check
   was green against its own number for two versions. */
const constOf = (name) => Number(src.match(new RegExp(`const ${name} = (\\d+)`))[1]);
const TOGGLE_SIZE = constOf("TOGGLE_SIZE");
const TOGGLE_GAP = constOf("TOGGLE_GAP");
const RAIL_GAP = constOf("RAIL_GAP");

const rail = () => byId.get("gt-cart-rail");
const plus = () => byId.get("gt-cart-toggle");
const copyBtn = () => byId.get("gt-cart-copy");
const px = (value) => Number(String(value).replace("px", ""));
// Where the `+`'s right edge lands: the rail's left edge plus everything in the rail.
// On the left-hand placement the `+` is the rail's last child, so this IS its right
// edge, and it is the number that may not move when the copy button comes and goes.
const plusRightEdge = () =>
  px(rail().style.left) +
  (copyBtn().hidden ? TOGGLE_SIZE : RAIL_GAP + TOGGLE_SIZE + TOGGLE_SIZE);

/* A FIXED RECT ON ONE ANCHOR, because the stub gives every element the same one --
   `left: 10`, which is closer to the viewport edge than the rail is wide, so every
   placement in this harness would take the flip branch and the LEFT-HAND geometry,
   which is the one that ships, would never run. 400px in from the edge is a row in
   the middle of a real page. */
const hovered = card.children[0];
hovered.getBoundingClientRect = () => ({
  left: 400, top: 100, right: 480, bottom: 120, width: 80, height: 20,
});

/* THE POINTER IS MOVED OFF AND BACK ON, and that is not padding. `onPointerOver`
   returns early when the anchor is the one it is already holding -- the same anchor
   arrives dozens of times as the pointer crosses its children -- and the early
   return does not re-render. A section that hovered the anchor an earlier section
   had already hovered would therefore be measuring the placement THAT section left
   behind, which is how this section was wrong the first time it was written. */
dispatch(prose.children[0], "pointerover");
flush();
dispatch(hovered, "pointerover");
flush();
is("hovering an issue link summons the rail", rail().hidden, false);
is("which holds the copy button and then the + , in that document order",
  rail().children.map((k) => k.id), ["gt-cart-copy", "gt-cart-toggle"]);
is("the rail is our own UI, so the scan and the hover both skip it",
  rail().attrs["data-gt-cart-ui"], "");
is("it is placed on the LEFT of the key, which is where a day of use put it",
  rail().attrs["data-gt-side"], "left");
is("the copy button ships ON, so it is there without anybody setting anything",
  copyBtn().hidden, false);
is("and it shows the same glyph the drawer's own button for these bytes carries",
  copyBtn().textContent, "🔗");
is("the rail sits TOGGLE_GAP clear of the key, which is the gap the + always had",
  plusRightEdge(), 400 - TOGGLE_GAP);

// THE ONE CHECK THIS SECTION EXISTS FOR. Switch the copy button off through its own
// control -- not by poking the store -- and the `+` must be in exactly the same place.
const withCopy = plusRightEdge();
byId.get("gt-cart-pref-copy").checked = false;
dispatch(byId.get("gt-cart-pref-copy"), "change");
flush();
is("switched off, the copy button goes and the rail is the single + it was at 1.2.0",
  [copyBtn().hidden, rail().hidden], [true, false]);
is("AND THE + HAS NOT MOVED A PIXEL, which is the whole reason it is the rail's last child",
  plusRightEdge(), withCopy);
byId.get("gt-cart-pref-copy").checked = true;
dispatch(byId.get("gt-cart-pref-copy"), "change");
flush();
is("switched back on it returns, and the + is still there", 
  [copyBtn().hidden, plusRightEdge()], [false, withCopy]);

/* ---- WHAT THE COPY BUTTON PUTS ON THE CLIPBOARD. `format-smoke` already asserts
   item scope byte for byte for all five shapes; what only this harness can say is
   that a real press reaches item scope AT ALL -- §2.8 built the scope for a gesture
   that did not exist for four versions, and this is its first caller. So the two
   things checked here are the ones a byte assertion cannot make: no bullet and no
   `<ul>` came from a real click, and the SUMMARY came off the page rather than out of
   the store. */
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsRaw(), lineShape: "markdown" });
const wroteBefore = clipboard.length;
// A TURN OF THE EVENT LOOP, not one microtask. The foot's checks get away with
// `await Promise.resolve()` because they only read the clipboard, which is pushed
// synchronously inside the stub. The flash is three awaits further on -- into
// `writeClipboard`, out of it, and back into `copyOneIssue` -- so a single tick
// reads the glyph before it has been set, which is what this check said first.
// NOT the `settle` above, which waits 600ms in four steps for the fetch path: the
// flash lasts 900ms, so two of those would clear the very thing being checked.
const drain = () => new Promise((resolve) => setTimeout(resolve, 0));
dispatch(copyBtn(), "click");
await drain();
flush();
is("a press writes both flavours", Object.keys(clipboard.at(-1)), ["text/plain", "text/html"]);
is("ONE issue, at item scope: no bullet on the text side and no <ul> on the HTML side",
  [clipboard.at(-1)["text/plain"].text, clipboard.at(-1)["text/html"].text],
  ["[RDC-77](https://dalet.atlassian.net/browse/RDC-77) The linked issue's own summary",
   '<a href="https://dalet.atlassian.net/browse/RDC-77">RDC-77</a>' +
   "&nbsp;The linked issue's own summary"]);
is("exactly one write, so nothing copied the collection by accident",
  clipboard.length, wroteBefore + 1);
// THE SUMMARY IS THE PAGE'S, through the same six tiers the + uses, and the tier is
// in the debug line for the same reason the add's is (§2.2, §7 step 5).
is("the tier the summary came from is on the console",
  logs.some(([l, m]) => l === "debug" && m.includes("copied the link to RDC-77") && m.includes("tier 4")),
  true);
is("the button flashes the same ✅ the foot flashes, and the flash is a VALUE render reads",
  copyBtn().textContent, "✅");
is("with the state on the element, so it is readable rather than merely visible",
  copyBtn().attrs["data-gt-state"], "done");
// A re-render must NOT clear it. This is the whole reason the flash is not written
// straight onto the button: the rail re-renders on every signal the script has.
dispatch(document, "visibilitychange");
flush();
is("AND A RE-RENDER DOES NOT CLEAR IT, which `flash` in the foot cannot promise",
  copyBtn().textContent, "✅");

/* THE SHAPE IS READ AT THE PRESS HERE TOO. The store is poked with no re-render, so
   a shape held in a variable would go on copying the markdown above and this check
   would be measuring nothing -- the same trap the foot's own version of this check
   is built around (§2.8, decision 5). */
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsRaw(), lineShape: "url" });
dispatch(copyBtn(), "click");
await drain();
flush();
is("the ⚙ Issue reference setting is what a press consults, not a literal",
  clipboard.at(-1)["text/plain"].text, "https://dalet.atlassian.net/browse/RDC-77");
store["gt-jira-cart.prefs"] = JSON.stringify({ ...prefsRaw(), lineShape: "markdown" });

/* ---- THE POINTER ON THE COPY BUTTON MUST NOT OFFER TO REMOVE ANYTHING. On a
   collected link the pointer on the `+` turns it red and names removal, because
   removal has no undo and the warning has to arrive before the click. The copy button
   is a different action on the same issue, so `pointerOnToggle` is tested against the
   toggle's own id and not the rail's -- and this is the check that says so. */
is("RDC-77 is already collected, so the + reports a state rather than an action",
  plus().attrs["data-gt-state"], "collected");
dispatch(copyBtn(), "pointerover");
flush();
is("THE POINTER ON THE COPY BUTTON LEAVES THE + GREEN, not red",
  plus().attrs["data-gt-state"], "collected");
is("and the rail is still up, because the gap between the two buttons is inside it",
  rail().hidden, false);
dispatch(plus(), "pointerover");
flush();
is("the pointer on the + itself is what names the removal",
  plus().attrs["data-gt-state"], "remove");
is("and its label says which collection it would come out of",
  plus().attrs["aria-label"], "Remove RDC-77 from Scratch");
// NOTHING WAS ADDED OR REMOVED BY ANY OF THE ABOVE. A copy is not a collect, and the
// section below starts from the collection it expects.
is("and not one press in this section changed the collection",
  JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.map((i) => i.key),
  ["RDC-1", "RDC-77", "GLX-402"]);

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
is("with three entries: the toggle, and the two gestures it takes away",
  menuItems(), ["Remove RDC-77 from Scratch", "Open link in new tab", "Copy link to RDC-77"]);
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

/* THE SECOND GIVE-BACK, added at 1.3.0. Switching this menu on costs *Copy link
   address*; this entry is the answer to that, and it goes through the same
   `copyOneIssue` the rail's button does -- so the bytes are item scope and the shape
   is the one ⚙ names, with nothing restated for the menu.

   THE RECEIPT IS ON THE RAIL AND NOT IN THE MENU, because every entry here closes the
   menu (§2.9 calls a menu that stays open after a click broken). Reaching this entry
   means right-clicking an issue link, which means the rail is up -- so the flash has
   somewhere to land, and this is the check that says so. */
dispatch(rightClickTarget, "contextmenu", { clientX: 10, clientY: 10 });
flush();
const menuCopyEntry = menu().children[2];
is("the third entry is the copy, in the browser's own order: open before copy",
  menuCopyEntry.textContent, "Copy link to RDC-77");
const beforeMenuCopy = clipboard.length;
dispatch(menuCopyEntry, "click");
await drain();
flush();
is("it copies ONE issue, at item scope, through the same path the rail's button uses",
  clipboard.at(-1)["text/plain"].text,
  "[RDC-77](https://dalet.atlassian.net/browse/RDC-77) The linked issue's own summary");
is("exactly one write", clipboard.length, beforeMenuCopy + 1);
is("the menu closed itself, like every other entry", menuOpen(), false);
is("and the receipt landed on the rail, which is up because you right-clicked a link",
  copyBtn().textContent, "✅");
is("it collected nothing either", JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.length, 2);
is("and opened no tab", opened.length, openedBefore + 1);

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

/* ---- THE COLLECTION'S OWN DRAG (§2.9), DRIVEN END TO END. Added at 1.4.0.
//
   THIS IS THE CHECK THE FILE SAID COULD NOT EXIST. Until 1.4.0 both the script and
   the README claimed no harness here could drive a drag, on the ground that
   `boot-smoke` has no layout. Half of that is true: there is no paint and no
   pointer. What there IS is the delegated listeners the script really registers and
   a rect that can be stubbed per node -- and `dragstart`, `dragover` and `drop`
   read nothing else. So the wiring is held here: which row was grabbed, which half
   of which row the pointer was in, what got written, and what the drawer showed
   while it was happening.

   WHAT IS STILL NOBODY'S BUT A HAND'S: whether a row is comfortable to grab, and
   whether a long list scrolls when a drag reaches its edge. That is §7 step 39, and
   the quiet here is not coverage of it. */

// A deterministic list first, through the drawer's own controls -- ⌫ twice, armed
// and then committed, and the three live rows in page order.
dispatch(emptyButton(), "click");
dispatch(emptyButton(), "click");
flush();
for (const at of [0, 1, 2]) { dispatch(toggleOf(rows()[at]), "click"); flush(); }
const keysIn = () => JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.map((i) => i.key);
const drawn = () => items().map((r) => keyOf(r).textContent);
const rowOf = (key) => items().find((r) => r.attrs["data-gt-key"] === key);
const itemSummary = (row) => row.children.find((k) => k.classList.includes("gt-cart-row-summary")).textContent;

is("three items, in the order they were added", keysIn(), ["RDC-1", "RDC-77", "GLX-402"]);
is("and the drawer draws them in that order", drawn(), ["RDC-1", "RDC-77", "GLX-402"]);
is("every row offers itself to the drag", items().map((r) => r.attrs.draggable), ["true", "true", "true"]);
// Without this the platform starts its own link drag from the most obvious place to
// grab a row, and the reorder looks broken exactly where it is first tried.
is("and the key inside it opts OUT, so the row is what moves",
  items().map((r) => keyOf(r).attrs.draggable), ["false", "false", "false"]);
is("the row carries the key the drag will resolve against",
  items().map((r) => r.attrs["data-gt-key"]), ["RDC-1", "RDC-77", "GLX-402"]);
is("the grip is IN the row and first, so its width is reserved whether or not it is painted",
  items().map((r) => r.children[0].classList.includes("gt-cart-grip")), [true, true, true]);
is("and the tooltip says the row moves, since the glyph is invisible until hovered",
  /Drag the row to reorder it/.test(items()[0].title), true);

/* ---- WHAT THE DRAG HANDS AN EXTERNAL APPLICATION, and it is the whole of why the
   row can be dropped into Notepad or Slack. `setData` takes one payload PER TYPE, so
   the drag that reorders inside the drawer also carries the bytes the `🔗` button
   writes. This drag is ABANDONED rather than dropped, which is the other thing this
   section holds: a release with no drop must write nothing at all.

   THE BYTES ARE ASSERTED AGAINST THE SAME LITERALS THE `🔗` PRESS IS, higher up this
   file, and that is the point rather than duplication -- if the two ever disagree,
   one issue leaving the Cart has two shapes, which is exactly the defect §4 rejected
   when it refused a fixed shape for the copy button. */
// A stand-in for the real `DataTransfer`, which Node does not have: the four
// members the script touches, and nothing else.
const transfer = () => ({
  data: {}, effectAllowed: "", dropEffect: "",
  setData(type, value) { this.data[type] = value; },
});
const carried = rowOf("RDC-77");
const dtOut = transfer();
const orderBefore = keysIn();
dispatch(carried, "dragstart", { dataTransfer: dtOut });
is("our own type comes first, and then everything an external target can use",
  Object.keys(dtOut.data),
  ["application/x-gt-cart-item", "text/plain", "text/html", "text/uri-list"]);
is("the text is the 🔗 button's own bytes, at item scope: no bullet",
  dtOut.data["text/plain"],
  "[RDC-77](https://dalet.atlassian.net/browse/RDC-77) The linked issue's own summary");
is("and the rich flavour is its twin, so a real editor gets a real link",
  dtOut.data["text/html"],
  '<a href="https://dalet.atlassian.net/browse/RDC-77">RDC-77</a>' +
  "&nbsp;The linked issue's own summary");
is("the uri-list is the issue, which is what makes it a LINK drag rather than text",
  dtOut.data["text/uri-list"], "https://dalet.atlassian.net/browse/RDC-77");
// A move-only drag is refused by a target that means to copy, and a drop into
// another application is never a removal from the collection.
is("copy AND move: a drop out there is a copy, a drop in here is a move",
  dtOut.effectAllowed, "copyMove");
dispatch(carried, "dragend", { dataTransfer: dtOut });
flush();
is("a drag released with no drop writes nothing", keysIn(), orderBefore);
is("and it unfreezes the list, or every later render would be held for ever",
  drawn(), orderBefore);

/* A RECT PER ROW. The stub gives every element the same one, so "the top half"
   would otherwise mean nothing. 100..120 puts the midpoint at 110. */
const RECT = { left: 10, top: 100, right: 90, bottom: 120, width: 80, height: 20 };

// ---- drag one: the LAST row onto the TOP half of the first
const glx = rowOf("GLX-402");
const first = rowOf("RDC-1");
first.getBoundingClientRect = () => RECT;
const dt = transfer();
dispatch(glx, "dragstart", { dataTransfer: dt });
is("the dragged row says so, which is the attribute the sheet paints",
  glx.attrs["data-gt-dragging"], "true");
is("and it carries the KEY, never a position", dt.data["application/x-gt-cart-item"], "GLX-402");

dispatch(first, "dragover", { dataTransfer: dt, clientY: 105 });
is("a pointer in the TOP half marks the gap ABOVE the row", first.attrs["data-gt-drop"], "before");
is("and exactly one row wears the indicator", items().filter((r) => r.attrs["data-gt-drop"]).length, 1);
is("the cursor is told it is a move", dt.dropEffect, "move");
dispatch(first, "dragover", { dataTransfer: dt, clientY: 115 });
is("the BOTTOM half of the same row is the gap BELOW it", first.attrs["data-gt-drop"], "after");
dispatch(first, "dragover", { dataTransfer: dt, clientY: 105 });

dispatch(first, "drop", { dataTransfer: dt, clientY: 105 });
flush();
is("the drop wrote the new order straight away", keysIn(), ["GLX-402", "RDC-1", "RDC-77"]);
is("and the drawer did NOT redraw, because the pointer is still down", drawn(), ["RDC-1", "RDC-77", "GLX-402"]);
dispatch(glx, "dragend", { dataTransfer: dt });
flush();
is("letting go is what redraws it", drawn(), ["GLX-402", "RDC-1", "RDC-77"]);
is("and neither transient attribute survives the drag",
  items().flatMap((r) => [r.attrs["data-gt-dragging"], r.attrs["data-gt-drop"]]).filter(Boolean), []);

// ---- drag two: the BOTTOM half of the last row, which is the append
const back = rowOf("GLX-402");
const last = rowOf("RDC-77");
last.getBoundingClientRect = () => RECT;
const dt2 = transfer();
dispatch(back, "dragstart", { dataTransfer: dt2 });
dispatch(last, "dragover", { dataTransfer: dt2, clientY: 115 });
dispatch(last, "drop", { dataTransfer: dt2, clientY: 115 });
dispatch(back, "dragend", { dataTransfer: dt2 });
flush();
is("dropping below the last row puts it at the end", keysIn(), ["RDC-1", "RDC-77", "GLX-402"]);

/* ---- THE FREEZE, AND THE ONE WRITE THAT CAN REACH IT.
   It is NOT another tab. A person has one pair of hands and cannot click anywhere
   while holding a mouse button down here. `runGapFill` needs no hand: it is a timer
   and a fetch, and it writes a summary in. The write below is that write -- the same
   key, the same bytes `save` would produce -- and `visibilitychange` is the render
   it would schedule. */
const held = items()[1];
const moving = items()[0];
const onto = items()[2];
onto.getBoundingClientRect = () => RECT;
const dt3 = transfer();
// Read before the write, because what is being asserted is that this does NOT move.
const wasShowing = itemSummary(items()[2]);
dispatch(moving, "dragstart", { dataTransfer: dt3 });

const blob = JSON.parse(store["gt-jira-cart.collections"]);
blob.collections[0].items[2].summary = "filled in while the pointer was down";
store["gt-jira-cart.collections"] = JSON.stringify(blob);
dispatch(document, "visibilitychange");
flush();
is("a write landing mid-drag does not rebuild the list", items()[1] === held, true);
is("so the row under the pointer is the same node it was at dragstart", items()[0] === moving, true);
is("and the drawer is one render behind, deliberately", itemSummary(items()[2]), wasShowing);
is("which is a different summary from the one now in storage",
  wasShowing === "filled in while the pointer was down", false);

dispatch(onto, "drop", { dataTransfer: dt3, clientY: 115 });
dispatch(moving, "dragend", { dataTransfer: dt3 });
flush();
is("the drop still moved the right row, resolved by key", keysIn(), ["RDC-77", "GLX-402", "RDC-1"]);
/* THE ONE THIS SECTION EXISTS FOR. The drawer was showing a three-row list that was
   already out of date when the pointer came up. If the drop had written what was on
   SCREEN, the summary that arrived mid-drag would be gone -- silently, and only for
   whoever happened to be dragging at that moment. It writes through `update`, which
   re-reads first (§2.5), so the two changes compose instead of one eating the other. */
is("and the summary that arrived mid-drag survived the drop",
  JSON.parse(store["gt-jira-cart.collections"]).collections[0].items[1].summary,
  "filled in while the pointer was down");
is("which the drawer now shows, one render later", itemSummary(items()[1]),
  "filled in while the pointer was down");

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
