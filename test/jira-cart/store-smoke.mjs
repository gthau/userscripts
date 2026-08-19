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
const names = ["readRaw","defaultCollection","normaliseCollections","snapshot","load","activeCollection","save","update","writeFirstRun","loadPrefs","normalisePrefs","readStoredBasis","readStoredSize","savePrefs","clamp"];
const code = names.map(extract).join("\n");

// The harness stands in for the parts of the script that are not the store.
const harness = `
  let lastRaw = null;
  let writeFailed = false;
  let firstRunDefault = null;
  let renders = 0;
  function scheduleRender() { renders += 1; }
  ${code}
  return {
    ${names.join(",")},
    state: () => ({ lastRaw, writeFailed, renders }),
    resetSession: () => { lastRaw = null; writeFailed = false; firstRunDefault = null; },
  };
`;

const STORE_KEY = "gt-jira-cart.collections";
const BACKUP_KEY = "gt-jira-cart.collections.bak";
const PREFS_KEY = "gt-jira-cart.prefs";
const SCHEMA_VERSION = 1;
const SAFE_KEY_RE = /^[A-Z][A-Z0-9]*-\d+$/;
const DEFAULT_COLLECTION_NAME = "Scratch";
const DEFAULT_PREFS = { open: false, corner: "bottom-right", layout: "auto", rightClickMenu: false, size: null, basisStacked: null, basisSplit: null };
const LAYOUTS = ["auto", "stacked", "split"];
const MIN_INLINE = 300, MIN_BLOCK = 160, BASIS_MIN = 20, BASIS_MAX = 85;
const window = { innerWidth: 1600, innerHeight: 900 };
const DEFAULTS = { open: false, corner: "bottom-right", layout: "auto", rightClickMenu: false, size: null, basisStacked: null, basisSplit: null };
const quiet = { log(){}, debug(){}, warn(){}, error(){} };
let uuid = 0;
const crypto = { randomUUID: () => `uuid-${++uuid}` };

let store = {};
let writesThrow = false;
const GM_getValue = (key, fallback) => (key in store ? store[key] : fallback);
const GM_setValue = (key, value) => {
  if (writesThrow) throw new DOMException("quota", "QuotaExceededError");
  store[key] = value;
};

const ARGS = ["STORE_KEY","BACKUP_KEY","PREFS_KEY","SCHEMA_VERSION","SAFE_KEY_RE","DEFAULT_COLLECTION_NAME","DEFAULT_PREFS","LAYOUTS","MIN_INLINE","MIN_BLOCK","BASIS_MIN","BASIS_MAX","window","logger","crypto","GM_getValue","GM_setValue"];
const build = new Function(...ARGS, harness);
const load = () => build(STORE_KEY,BACKUP_KEY,PREFS_KEY,SCHEMA_VERSION,SAFE_KEY_RE,DEFAULT_COLLECTION_NAME,DEFAULT_PREFS,LAYOUTS,MIN_INLINE,MIN_BLOCK,BASIS_MIN,BASIS_MAX,window,quiet,crypto,GM_getValue,GM_setValue);

let fails = 0;
const is = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};
const reset = (initial = {}) => { store = { ...initial }; writesThrow = false; return load(); };

// 1. First run
let tab = reset();
let snap = tab.load();
is("empty store -> status", snap.status, "empty");
is("empty store -> Scratch", tab.activeCollection(snap).name, "Scratch");
is("empty store -> writable", snap.writable, true);
is("empty store -> nothing written yet", store[STORE_KEY], undefined);
tab.writeFirstRun();
is("first run writes Scratch", JSON.parse(store[STORE_KEY]).collections[0].name, "Scratch");
const afterFirstRun = store[STORE_KEY];
tab.writeFirstRun();
is("first run is once", store[STORE_KEY], afterFirstRun);

// 2. An add, through update
tab.update((blob) => blob.collections[0].items.push({ key: "RDC-1", summary: "S" }));
is("add lands in storage", JSON.parse(store[STORE_KEY]).collections[0].items, [{ key: "RDC-1", summary: "S" }]);
is("v is written", JSON.parse(store[STORE_KEY]).v, 1);

// 3. Nonsense in the key (ADR §7.17)
tab = reset({ [STORE_KEY]: "}}not json{{" });
snap = tab.load();
is("nonsense -> unreadable", snap.status, "unreadable");
is("nonsense -> starts empty", tab.activeCollection(snap).items, []);
is("nonsense -> not writable", snap.writable, false);
is("nonsense -> update declines", tab.update(() => {}), false);
is("nonsense -> NOT overwritten", store[STORE_KEY], "}}not json{{");

// 3b. Valid JSON of the wrong shape is treated the same way
tab = reset({ [STORE_KEY]: JSON.stringify({ v: 1, collections: [{ name: "n", items: [{ nokey: 1 }] }] }) });
const before = store[STORE_KEY];
is("wrong shape -> unreadable", tab.load().status, "unreadable");
tab.update((blob) => blob.collections[0].items.push({ key: "RDC-9" }));
is("wrong shape -> NOT overwritten", store[STORE_KEY], before);

// 4. A newer version (ADR §7.18)
const future = JSON.stringify({ v: 99, collections: [{ id: "a", name: "Later", items: [{ key: "RDC-2" }] }] });
tab = reset({ [STORE_KEY]: future });
snap = tab.load();
is("future -> status", snap.status, "future");
is("future -> still shows the collections", tab.activeCollection(snap).items, [{ key: "RDC-2" }]);
is("future -> declines the add", tab.update((b) => b.collections[0].items.push({ key: "RDC-3" })), false);
is("future -> store untouched", store[STORE_KEY], future);

// 5. The stale tab (ADR §7.16): a tab that has read nothing recent cannot destroy
tab = reset({ [STORE_KEY]: JSON.stringify({ v: 1, collections: [{ id: "a", name: "Scratch", items: [] }] }) });
const stale = tab.load();                       // this tab read the empty collection hours ago
const other = load();                           // another tab adds five
for (const key of ["RDC-1","RDC-2","RDC-3","RDC-4","RDC-5"]) {
  other.update((blob) => blob.collections[0].items.push({ key }));
}
tab.update((blob) => blob.collections[0].items.push({ key: "RDC-6" }));   // the stale tab adds one
is("stale tab keeps all six", JSON.parse(store[STORE_KEY]).collections[0].items.map((i) => i.key),
   ["RDC-1","RDC-2","RDC-3","RDC-4","RDC-5","RDC-6"]);
is("the stale snapshot was never used", stale.collections[0].items.length, 0);

// 6. A write that fails leaves storage whole
tab = reset({ [STORE_KEY]: JSON.stringify({ v: 1, collections: [{ id: "a", name: "Scratch", items: [{ key: "RDC-1" }] }] }) });
const kept = store[STORE_KEY];
writesThrow = true;
is("failed write returns false", tab.update((b) => b.collections[0].items.push({ key: "RDC-2" })), false);
is("failed write is remembered", tab.state().writeFailed, true);
is("failed write leaves storage whole", store[STORE_KEY], kept);
writesThrow = false;
is("the next write clears it", tab.update((b) => b.collections[0].items.push({ key: "RDC-2" })), true);
is("writeFailed cleared", tab.state().writeFailed, false);

// 7. A blob edited through Tampermonkey's own storage view arrives as an object
tab = reset({ [STORE_KEY]: { v: 1, collections: [{ id: "a", name: "Hand edited", items: [{ key: "RDC-7" }] }] } });
is("object in storage is read", tab.activeCollection(tab.load()).name, "Hand edited");

// 8. An older v is backed up once, before the first write under the new v
const old = JSON.stringify({ v: 0, collections: [{ id: "a", name: "Old", items: [{ key: "RDC-8" }] }] });
tab = reset({ [STORE_KEY]: old });
is("old v is readable", tab.load().status, "ok");
is("nothing is rewritten because you looked at it", store[STORE_KEY], old);
tab.update((blob) => blob.collections[0].items.push({ key: "RDC-9" }));
is("backup holds the pre-migration blob", store[BACKUP_KEY], old);
is("the store is now at this build's v", JSON.parse(store[STORE_KEY]).v, 1);

// 9. collections: [] is repaired in memory, and not on disk
tab = reset({ [STORE_KEY]: JSON.stringify({ v: 1, collections: [] }) });
is("empty collections repaired in memory", tab.activeCollection(tab.load()).name, "Scratch");
is("empty collections not rewritten on read", JSON.parse(store[STORE_KEY]).collections, []);

// 10. Preferences. Everything here is the OPPOSITE of the store above, and that
// is the point: a preference falls back to the defaults, a collection never does.
tab = reset({ [PREFS_KEY]: JSON.stringify({ corner: "bottom-left", retired: 1 }) });
is("known prefs only", tab.loadPrefs(), { ...DEFAULTS, corner: "bottom-left" });
tab = reset({ [PREFS_KEY]: "not json" });
is("bad prefs fall back to defaults", tab.loadPrefs(), DEFAULTS);
tab = reset({});
is("absent prefs default", tab.loadPrefs(), DEFAULTS);

// 11. The new preferences, and their ranges
tab = reset({ [PREFS_KEY]: JSON.stringify({ layout: "sideways", rightClickMenu: "yes" }) });
is("an unknown layout falls back", tab.loadPrefs().layout, "auto");
is("right-click is off unless it is exactly true", tab.loadPrefs().rightClickMenu, false);
tab = reset({ [PREFS_KEY]: JSON.stringify({ rightClickMenu: true, layout: "split" }) });
is("right-click on", tab.loadPrefs().rightClickMenu, true);
is("layout pinned", tab.loadPrefs().layout, "split");
is("a divider below the floor is clamped", tab.readStoredBasis(2), 20);
is("a divider above the ceiling is clamped", tab.readStoredBasis(99), 85);
is("a divider that is not a number is forgotten", tab.readStoredBasis("62"), null);
is("a size below the minimum is clamped", tab.readStoredSize({ inline: 10, block: 10 }), { inline: 300, block: 160 });
is("a size wider than this window is clamped", tab.readStoredSize({ inline: 9000, block: 9000 }), { inline: 1568, block: 868 });
is("a size that is not a size is forgotten", tab.readStoredSize({ inline: "wide" }), null);

// 11b. The drawer's open state is a PREFERENCE since 0.5.0, so it survives a
// reload. It was a variable in memory until use said otherwise.
tab = reset({});
is("a fresh install starts closed", tab.loadPrefs().open, false);
tab = reset({ [PREFS_KEY]: JSON.stringify({ open: true }) });
is("and a stored open drawer comes back open", tab.loadPrefs().open, true);
tab = reset({ [PREFS_KEY]: JSON.stringify({ open: "yes" }) });
is("anything that is not exactly true is closed", tab.loadPrefs().open, false);
tab = reset({});
tab.savePrefs({ open: true });
is("opening it writes the preference", JSON.parse(store[PREFS_KEY]).open, true);
is("and it leaves the collections alone", STORE_KEY in store, false);

// 12. A preference write is a read-modify-write, and it never touches the store
tab = reset({ [STORE_KEY]: JSON.stringify({ v: 1, collections: [{ id: "a", name: "Keep", items: [{ key: "RDC-1" }] }] }), [PREFS_KEY]: JSON.stringify({ corner: "bottom-left" }) });
tab.savePrefs({ rightClickMenu: true });
is("the patch landed", JSON.parse(store[PREFS_KEY]).rightClickMenu, true);
is("the other preference survived the patch", JSON.parse(store[PREFS_KEY]).corner, "bottom-left");
is("a preference write leaves the collections alone", JSON.parse(store[STORE_KEY]).collections[0].name, "Keep");
writesThrow = true;
tab.savePrefs({ corner: "bottom-right" });
is("a failed preference write does NOT set the collections' warning", tab.state().writeFailed, false);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
