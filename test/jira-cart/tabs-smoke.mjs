// TWO TABS OVER ONE STORE, and a fresh tab booting against a store that already
// has preferences in it. These are §7 step 16 and the second half of step 13 --
// the two steps L1 and L2 both left open because a build session cannot open two
// browser tabs. It cannot open two browser tabs here either: what this does is run
// the WHOLE script twice, in two isolated fake documents, over one shared
// `GM_*` store with a working value-change bus. That is enough to exercise the one
// thing §2.5 exists for -- every write is a read-modify-write, so A TAB CANNOT
// DESTROY WHAT IT NEVER READ -- and the freshness path that covers a tab the
// notification never reached.
//
// What it does NOT cover, and the browser still has to: Tampermonkey's real
// cross-tab delivery and its latency (risk 12), a frozen or discarded tab
// (risk 11), and whether the drawer is PAINTED open on the first frame rather than
// merely having the attribute set. Committed since 1.0.0; see the README beside this file.
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

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

// ---------------------------------------------------------------- the store

// One object behind both tabs, exactly as one Tampermonkey store sits behind
// several tabs of the same site.
const store = {};
const bus = [];
let uuids = 0;

// Tampermonkey tells EVERY tab, including the one that wrote -- which is the whole
// reason §2.5 prefers this to the `storage` event, which tells a tab about its own
// write by not firing. A tab can be muted here to stand for the frozen or
// discarded one of risk 11, which is the case the notification never reaches.
function notify(key) {
  for (const listener of bus) {
    if (listener.muted) continue;
    if (listener.key !== key) continue;
    listener.fn();
  }
}

// --------------------------------------------------------------- one fake tab

// The same stub boot-smoke uses, made into a factory so that two of them can exist
// at once with nothing shared but the store. The matcher understands only #id,
// tag, .class and [attr], which is enough for the boot path.
function makeTab(label) {
  const byId = new Map();
  let now = 0;

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

  class Element {}
  const attrsBox = new WeakMap();

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
      dataset: new Proxy({}, {
        set(box, key, value) {
          box[key] = String(value);
          attrsBox.get(node)["data-" + String(key).replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())] = String(value);
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
        for (const kid of kids) { kid.parent = node; node.children.push(kid); markConnected(kid, node.isConnected); }
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
      closest(sel) { for (let el = node; el; el = el.parent) if (matches(el, sel)) return el; return null; },
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
    getElementById: (id) => byId.get(id) ?? null,
    querySelector: (sel) => html.querySelector(sel),
    querySelectorAll: (sel) => html.querySelectorAll(sel),
    addEventListener(type, fn) { (document._on[type] ??= []).push(fn); },
  };
  const opened = [];
  const window = {
    innerWidth: 1440, innerHeight: 900,
    _on: {},
    addEventListener(type, fn) { (window._on[type] ??= []).push(fn); },
    open(url, target, features) { opened.push({ url, target, features }); },
  };
  const location = { origin: "https://dalet.atlassian.net", href: "https://dalet.atlassian.net/browse/RDC-1", pathname: "/browse/RDC-1" };
  const logs = [];
  const console_ = {
    log: (...a) => logs.push(["log", a.join(" ")]),
    debug: (...a) => logs.push(["debug", a.join(" ")]),
    warn: (...a) => logs.push(["warn", a.join(" ")]),
    error: (...a) => logs.push(["error", a.join(" ")]),
  };

  // A page with six issue rows, so five adds in one tab and one in the other are
  // ordinary clicks rather than a store poke.
  const anchor = (href, text) => {
    const a = element("a");
    a.setAttribute("href", href);
    a.textContent = text;
    return a;
  };
  for (let n = 1; n <= 6; n++) {
    const row = element("div");
    row.setAttribute("data-testid", "native-issue-table.ui.issue-row");
    row.append(anchor(`/browse/RDC-${n}`, `RDC-${n}`), anchor(`/browse/RDC-${n}`, `The summary of ${n}`));
    body.append(row);
  }
  const meta = element("meta");
  meta.setAttribute("name", "application-name");
  meta.content = "JIRA";
  body.append(meta);

  const frames = [];
  const flush = () => { for (let n = 0; n < 6 && frames.length; n++) frames.splice(0).forEach((fn) => fn()); };

  function dispatch(target, type, extra = {}) {
    const event = { type, target, preventDefault() {}, stopPropagation() {}, ...extra };
    for (let el = target; el; el = el.parent) for (const fn of el._on?.[type] ?? []) fn(event);
    for (const fn of document._on?.[type] ?? []) fn(event);
  }
  const dispatchDoc = (type) => { for (const fn of document._on?.[type] ?? []) fn({ type }); };

  // This tab's own view of the shared store, plus its entries on the bus. There is
  // more than one: since 1.0.0 the script listens on the collections key AND the
  // preferences key, so a tab holds one entry per key it cares about.
  const listeners = [];
  const GM_getValue = (k, d) => (k in store ? store[k] : d);
  const GM_setValue = (k, v) => { store[k] = v; notify(k); };
  const GM_addValueChangeListener = (key, fn) => {
    // The script only ever calls `scheduleRender`, so the frame it queues has to be
    // flushed for the tab to catch up -- which is what a real tab's next frame does.
    const entry = { key, fn: () => { fn(); flush(); }, muted: false };
    listeners.push(entry);
    bus.push(entry);
  };

  const run = new Function(
    "document", "window", "location", "navigator", "console", "crypto", "Element",
    "Blob", "ClipboardItem",
    "GM_getValue", "GM_setValue", "GM_addValueChangeListener",
    "setTimeout", "setInterval", "clearTimeout", "requestAnimationFrame", "fetch",
    src,
  );

  try {
    run(
      document, window, location, { clipboard: { async write() {}, async writeText() {} } }, console_,
      { randomUUID: () => `uuid-${label}-${++uuids}` },
      Element, class Blob {}, class ClipboardItem {},
      GM_getValue, GM_setValue, GM_addValueChangeListener,
      setTimeout, () => 0, clearTimeout,
      (fn) => { frames.push(fn); return 1; },
      async () => { throw new Error("no network in the harness"); },
    );
  } catch (e) {
    fails++;
    console.log(`FAIL tab ${label} threw while starting: ${e.message}`);
  }
  flush();

  const rows = () => byId.get("gt-cart-live-list").children.filter((k) => k.classList.includes("gt-cart-row"));
  const toggleOf = (row) => row.children.find((k) => k.classList.includes("gt-cart-row-body"));
  const keyOf = (row) => row.children.find((k) => k.classList.includes("gt-cart-row-key"));

  return {
    label, html, byId, body, document, window, flush, dispatch, dispatchDoc, logs, opened,
    // The frozen or discarded tab of risk 11: the one the notification never
    // reaches, on any key.
    listeners,
    freeze: (on) => { for (const entry of listeners) entry.muted = on; },
    hears: (key) => listeners.some((entry) => entry.key === key),
    badge: () => byId.get("gt-cart-badge"),
    drawer: () => byId.get("gt-cart-drawer"),
    rows, toggleOf, keyOf,
    // "Click the row for RDC-n" -- the part of the row that toggles, since the key
    // beside it is a link now.
    add: (key) => {
      const row = rows().find((r) => keyOf(r).textContent === key);
      dispatch(toggleOf(row), "click");
      flush();
    },
    open: () => { dispatch(byId.get("gt-cart-badge"), "click"); flush(); },
    errors: () => logs.filter(([l]) => l === "error").map(([, m]) => m),
  };
}

const keys = () => JSON.parse(store["gt-jira-cart.collections"]).collections[0].items.map((i) => i.key);
// Written through the same door the script uses, so the other tab is told the way
// it really would be.
const reset = () => {
  store["gt-jira-cart.collections"] = JSON.stringify({ v: 1, collections: [{ id: "shared", name: "Scratch", items: [] }] });
  notify("gt-jira-cart.collections");
};

// ================================================================ two tabs

const A = makeTab("A");
const B = makeTab("B");
is("both tabs booted with no error", [A.errors(), B.errors()], [[], []]);
is("and they agree there is one collection, because the first tab wrote it",
  JSON.parse(store["gt-jira-cart.collections"]).collections.length, 1);

/* ---- THE FINDING THAT MADE THIS FILE WORTH WRITING, now fixed and pinned here.
   Since 0.5.0 the drawer's open state is a STORED PREFERENCE (§2.9), so it is
   shared by every tab. Until 1.0.0 the cross-tab listener was registered on the
   COLLECTIONS key ONLY:

       GM_addValueChangeListener(STORE_KEY, ...)

   Nothing listened on the preferences key. So opening or closing the drawer in one
   tab did not reach the other WHEN IT HAPPENED -- it arrived at that tab's next
   render for some unrelated reason, a mount burst or the five-second backstop,
   because `drawerIsOpen()` asks storage every time. The other tab's drawer then
   closed by itself, seconds later, with nobody having touched it there. The state
   was shared and the propagation was not. The corner, the layout, the remembered
   size and the divider all had it too.

   These four checks are what stop it coming back. */
is("BOTH KEYS ARE LISTENED FOR, not just the collections",
  [A.hears("gt-jira-cart.collections"), A.hears("gt-jira-cart.prefs")], [true, true]);
A.open();
is("A's drawer is open", A.html.dataset.gtCartOpen, "true");
is("AND B KNOWS AT ONCE, with no unrelated render to carry it",
  B.html.dataset.gtCartOpen, "true");
is("closing it in B reaches A the same way, promptly", (() => {
  B.dispatch(B.byId.get("gt-cart-head").querySelector('[data-gt-action="close"]'), "click");
  B.flush();
  return A.html.dataset.gtCartOpen;
})(), "false");

// Re-open for the rest of the file. One open is enough: it is one shared preference.
A.open();
is("both drawers are open again", [A.html.dataset.gtCartOpen, B.html.dataset.gtCartOpen], ["true", "true"]);

// ---- ONE ADD IN ONE TAB, AND THE OTHER CATCHES UP (§7 step 16, first half)
A.add("RDC-1");
is("the add landed in the shared store", keys(), ["RDC-1"]);
is("TAB B's BADGE CAUGHT UP without B doing anything", B.badge().textContent, "🛒 Scratch 1 ▾");
is("and B's live row shows it collected, so both drawers agree",
  B.rows().find((r) => B.keyOf(r).textContent === "RDC-1").attrs["data-gt-collected"], "true");
is("removing it in B is seen by A", (() => { B.add("RDC-1"); return A.badge().textContent; })(), "🛒 Scratch 0 ▾");

// ---- THE STEP ITSELF: LEAVE A TAB OPEN, ADD FIVE IN THE OTHER, RETURN AND ADD
// ONE. ALL SIX MUST BE THERE. B is muted first, which is the case the whole
// read-modify-write exists for: a tab that never heard about the five.
reset();
A.dispatchDoc("visibilitychange");
B.dispatchDoc("visibilitychange");
A.flush(); B.flush();
is("both tabs start from an empty collection", [A.badge().textContent, B.badge().textContent],
  ["🛒 Scratch 0 ▾", "🛒 Scratch 0 ▾"]);

B.freeze(true);
for (const key of ["RDC-1", "RDC-2", "RDC-3", "RDC-4", "RDC-5"]) A.add(key);
is("five landed", keys(), ["RDC-1", "RDC-2", "RDC-3", "RDC-4", "RDC-5"]);
is("AND B IS GENUINELY STALE, or this proves nothing", B.badge().textContent, "🛒 Scratch 0 ▾");

B.add("RDC-6");
is("ALL SIX ARE THERE: the stale tab's add did not write the other five away",
  keys(), ["RDC-1", "RDC-2", "RDC-3", "RDC-4", "RDC-5", "RDC-6"]);
is("and B's own badge is right the moment it writes, because it re-read first",
  B.badge().textContent, "🛒 Scratch 6 ▾");

// ---- THE FROZEN TAB'S OTHER WAY BACK: becoming visible re-reads (§2.5 rule 4).
// A is still muted-free, but mute it to stand for the discarded tab, then wake it.
A.freeze(true);
B.add("RDC-6");
is("A did not hear the removal", A.badge().textContent, "🛒 Scratch 6 ▾");
A.dispatchDoc("visibilitychange");
A.flush();
is("BECOMING VISIBLE IS THE OTHER WAY BACK", A.badge().textContent, "🛒 Scratch 5 ▾");
A.freeze(false);
B.freeze(false);

is("no tab logged an error through any of it", [A.errors(), B.errors()], [[], []]);

// ================================================================ the reload

// §7 step 13's second half, and the reversal of 0.5.0: a drawer left open must come
// back OPEN, with its size, ON THE FIRST PAINT. A fresh tab over a store that
// already holds the preference is exactly that -- the attribute is written at
// document-start, before anything is drawn.
store["gt-jira-cart.prefs"] = JSON.stringify({
  open: true,
  corner: "bottom-left",
  layout: "split",
  rightClickMenu: false,
  size: { inline: 640, block: 480 },
  basisStacked: 40,
  basisSplit: null,
});
const reloaded = makeTab("reloaded");
is("THE DRAWER COMES BACK OPEN, on the attribute the stylesheet reads",
  reloaded.html.dataset.gtCartOpen, "true");
is("and it did NOT need a click to get there", reloaded.badge().attrs["aria-expanded"], "true");
is("the corner came back too", reloaded.html.dataset.gtCartCorner, "bottom-left");
is("and the layout", reloaded.html.dataset.gtCartLayout, "split");
is("THE SIZE CAME BACK", [reloaded.drawer().style.inlineSize, reloaded.drawer().style.blockSize], ["640px", "480px"]);
is("a dragged size lifts the default height cap, or the grip looks broken one way",
  reloaded.drawer().style.maxBlockSize, "none");
is("the remembered divider came back, per layout",
  reloaded.drawer().style._p["--gt-cart-basis-stacked"], "40%");
is("and the layout it was not chosen in stays unset",
  reloaded.drawer().style._p["--gt-cart-basis-split"], undefined);
is("the reloaded tab logged no error", reloaded.errors(), []);

// Close it and reload again: it must STAY CLOSED. The same rule, the other way.
store["gt-jira-cart.prefs"] = JSON.stringify({ open: false, corner: "bottom-right", layout: "auto" });
const reclosed = makeTab("reclosed");
is("a drawer closed before the reload STAYS CLOSED", reclosed.html.dataset.gtCartOpen, "false");
is("and the size is handed back with it", reclosed.drawer().style.inlineSize, "");

// A hand-edited preference cannot leave the drawer in a state no click produced.
store["gt-jira-cart.prefs"] = JSON.stringify({ open: "yes" });
is("anything that is not exactly true is closed", makeTab("edited").html.dataset.gtCartOpen, "false");

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
