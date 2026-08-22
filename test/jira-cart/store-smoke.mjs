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
// `format-smoke`'s slicer, for the things that are not functions. A CONSTANT THIS
// HARNESS ASSERTS ABOUT MUST BE SLICED AND NEVER COPIED, and this file is the
// reason the rule is worth stating twice: `MIN_BLOCK` was copied here as 160 and
// has been 215 in the script since 1.0.0, so "a size below the minimum is clamped"
// was green while measuring this file's own constant -- a stored height of 180 was
// accepted here and clamped by the real script. The copy was the whole defect.
function slice(head, end) {
  const at = src.indexOf(head);
  if (at < 0) throw new Error(`no ${head}`);
  return src.slice(at, src.indexOf(end, at) + end.length);
}
const names = ["readRaw","defaultCollection","normaliseCollections","snapshot","load","activeCollection","save","update","writeFirstRun","loadPrefs","normalisePrefs","normaliseFieldList","defaultFieldList","readStoredBasis","readStoredSize","savePrefs","clamp"];
const code = names.map(extract).join("\n");
// Sliced in the file's own order, and `DEFAULT_PREFS` comes LAST: anything it is
// built from has to be declared before it, here exactly as in the script.
const constants = `
  ${slice("const MIN_INLINE =", "\n")}
  ${slice("const MIN_BLOCK =", "\n")}
  ${slice("const BASIS_MIN =", "\n")}
  ${slice("const BASIS_MAX =", "\n")}
  ${slice("const LAYOUTS =", "\n")}
  ${slice("const FIELD_CATALOGUE = [", "\n  ];")}
  ${slice("const LINE_SHAPE_IDS =", "\n")}
  ${slice("const BAND_IDS = [", "\n  ];")}
  ${slice("const NO_BAND =", "\n")}
  ${slice("const SETTINGS_TAB_IDS =", "\n")}
  ${slice("const DEFAULT_PREFS = {", "\n  };")}
`;

// The harness stands in for the parts of the script that are not the store.
const harness = `
  let lastRaw = null;
  let writeFailed = false;
  let firstRunDefault = null;
  let renders = 0;
  function scheduleRender() { renders += 1; }
  ${constants}
  ${code}
  return {
    ${names.join(",")},
    DEFAULT_PREFS, LAYOUTS, MIN_INLINE, MIN_BLOCK, BASIS_MIN, BASIS_MAX,
    FIELD_CATALOGUE, LINE_SHAPE_IDS, BAND_IDS, NO_BAND, SETTINGS_TAB_IDS,
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
// The window is the harness's own and belongs here: it stands in for the browser,
// which is what a stand-in is for. Every constant the script owns is sliced above.
const window = { innerWidth: 1600, innerHeight: 900 };
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

const ARGS = ["STORE_KEY","BACKUP_KEY","PREFS_KEY","SCHEMA_VERSION","SAFE_KEY_RE","DEFAULT_COLLECTION_NAME","window","logger","crypto","GM_getValue","GM_setValue"];
const build = new Function(...ARGS, harness);
const load = () => build(STORE_KEY,BACKUP_KEY,PREFS_KEY,SCHEMA_VERSION,SAFE_KEY_RE,DEFAULT_COLLECTION_NAME,window,quiet,crypto,GM_getValue,GM_setValue);

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
is("known prefs only", tab.loadPrefs(), { ...tab.DEFAULT_PREFS, corner: "bottom-left" });
tab = reset({ [PREFS_KEY]: "not json" });
is("bad prefs fall back to defaults", tab.loadPrefs(), tab.DEFAULT_PREFS);
tab = reset({});
is("absent prefs default", tab.loadPrefs(), tab.DEFAULT_PREFS);

// 11. The new preferences, and their ranges
tab = reset({ [PREFS_KEY]: JSON.stringify({ layout: "sideways", rightClickMenu: "yes" }) });
is("an unknown layout falls back", tab.loadPrefs().layout, "auto");
is("right-click is off unless it is exactly true", tab.loadPrefs().rightClickMenu, false);
tab = reset({ [PREFS_KEY]: JSON.stringify({ rightClickMenu: true, layout: "split" }) });
is("right-click on", tab.loadPrefs().rightClickMenu, true);
is("layout pinned", tab.loadPrefs().layout, "split");
is("a divider below the floor is clamped", tab.readStoredBasis(2), tab.BASIS_MIN);
is("a divider above the ceiling is clamped", tab.readStoredBasis(99), tab.BASIS_MAX);
is("a divider that is not a number is forgotten", tab.readStoredBasis("62"), null);
// The floors are the SCRIPT'S, sliced above. This check read `{300, 160}` until
// 1.2.0 and passed against a `MIN_BLOCK` this file invented; the script's has been
// 215 since 1.0.0. Whether 215 is the RIGHT floor is `css-smoke`'s question -- it
// derives it from the stylesheet's own arithmetic -- and this one only says that a
// height below the floor comes back at it.
is("a size below the minimum is clamped", tab.readStoredSize({ inline: 10, block: 10 }), { inline: tab.MIN_INLINE, block: tab.MIN_BLOCK });
// 1600x900 minus the 32px margin, and both numbers are the harness's own window.
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

// 13. The export preferences of 1.2.0. THE VOCABULARY IS SLICED OUT OF THE SCRIPT,
// so a shape or a band this file names and the script does not is a loud failure and
// not a passing check about nothing.
tab = reset({});
let prefs = tab.loadPrefs();
const CATALOGUE_IDS = tab.FIELD_CATALOGUE.map((field) => field.id);
// Every field, off. The expectation for a list with nothing ticked.
const ALL_OFF = tab.FIELD_CATALOGUE.map((field) => ({ id: field.id, on: false }));
// The catalogue's tail after the ids a check names for itself, all off -- which is
// step 5 of `normaliseFieldList` stated as an expectation rather than as code.
const tail = (...head) => ALL_OFF.filter((field) => !head.includes(field.id));
const ticked = (list) => list.filter((field) => field.on).map((field) => field.id);

is("a fresh install references issues the way 1.1.0 did", prefs.lineShape, "markdown");
is("and bands the report the way 1.1.0 hardcoded it", [prefs.reportBand1, prefs.reportBand2], ["priority", "team"]);
is("both default lists mention every field in the catalogue, in the catalogue's order",
   [prefs.detailsFields.map((f) => f.id), prefs.reportFields.map((f) => f.id)],
   [CATALOGUE_IDS, CATALOGUE_IDS]);
// The two defaults ARE 1.1.0's output: `detailBits` printed these seven in this
// order, and the report was `detailBits(item, ["priority"])` because priority is its
// first band. `team` is new as a row field and so is off in both (decision 21).
is("📋 Details ticks the seven fields 1.1.0 printed", ticked(prefs.detailsFields),
   ["type", "status", "priority", "assignee", "fixv", "remaining", "parent"]);
is("📊 Report ticks the same list without priority, which is its band", ticked(prefs.reportFields),
   ["type", "status", "assignee", "fixv", "remaining", "parent"]);
is("the new team field is off in both, so no output changes",
   [prefs.detailsFields.find((f) => f.id === "team").on, prefs.reportFields.find((f) => f.id === "team").on],
   [false, false]);
is("the panel opens on the first tab, and it is a real tab", prefs.settingsTab, tab.SETTINGS_TAB_IDS[0]);

// 14. Every id the script names is honoured, and nothing else is. Written as a sweep
// over the sliced lists rather than as one check per id, so a shape or a band added
// to the script is covered the day it is added.
const storedAs = (patch) => reset({ [PREFS_KEY]: JSON.stringify(patch) }).loadPrefs();
is("every line shape the script names is honoured",
   tab.LINE_SHAPE_IDS.map((id) => storedAs({ lineShape: id }).lineShape), tab.LINE_SHAPE_IDS);
is("every bandable field is honoured in band 1",
   tab.BAND_IDS.map((id) => storedAs({ reportBand1: id }).reportBand1), tab.BAND_IDS);
is("and in band 2", tab.BAND_IDS.map((id) => storedAs({ reportBand2: id }).reportBand2), tab.BAND_IDS);
is("every tab the script names is honoured",
   tab.SETTINGS_TAB_IDS.map((id) => storedAs({ settingsTab: id }).settingsTab), tab.SETTINGS_TAB_IDS);
is("an unknown shape falls back to markdown", storedAs({ lineShape: "haiku" }).lineShape, "markdown");
is("an unknown band falls back to that band's own default",
   [storedAs({ reportBand1: "haiku" }).reportBand1, storedAs({ reportBand2: "haiku" }).reportBand2],
   ["priority", "team"]);
// `remaining` is a real field and deliberately not a band: its order would be string
// order over durations, where "10m" < "2d" < "9h" (decision 14). `status` is a real
// field too, and the report bands it as `category` -- by Atlassian's fixed three and
// never by this instance's status names (decision 13).
is("time remaining is a field and NOT a band", storedAs({ reportBand1: "remaining" }).reportBand1, "priority");
is("and status bands as a category or not at all", storedAs({ reportBand1: "status" }).reportBand1, "priority");
// Band 1 may not be `none`, because a report with no bands is 📋 Details (decision
// 12). Band 2 may, and that is the single-level report.
is("band 1 cannot be none", storedAs({ reportBand1: tab.NO_BAND }).reportBand1, "priority");
is("band 2 can", storedAs({ reportBand2: tab.NO_BAND }).reportBand2, tab.NO_BAND);
is("an unknown tab lands on the first one", storedAs({ settingsTab: "haiku" }).settingsTab, tab.SETTINGS_TAB_IDS[0]);
is("and never on a blank screen", typeof storedAs({ settingsTab: "" }).settingsTab === "string" && storedAs({ settingsTab: "" }).settingsTab.length > 0, true);

// 15. The two field lists, and they are ONE FUNCTION, so every check runs against
// both keys. A STORED LIST MAY DISAGREE WITH THE CATALOGUE AND THE CODE WINS: this
// is the rule that is new in kind for this key, and every one of its five steps is
// below.
for (const key of ["detailsFields", "reportFields"]) {
  const stored = (value) => storedAs({ [key]: value })[key];
  const theDefault = tab.DEFAULT_PREFS[key];

  is(`${key}: absent falls back to the default`, storedAs({})[key], theDefault);
  is(`${key}: null is not a list`, stored(null), theDefault);
  is(`${key}: a number is not a list`, stored(7), theDefault);
  is(`${key}: a string is not a list`, stored("type,status"), theDefault);
  is(`${key}: an object is not a list`, stored({ type: true }), theDefault);
  // DECISION 23, AND THE DIRECTION IS ASSERTED HERE SO A LATER SESSION CANNOT "FIX"
  // IT THE OTHER WAY. An empty selection survives -- nothing is ticked, the line is
  // the head alone -- and the LISTING is still completed, because the ⚙ panel draws
  // its rows from this list and a list of nothing would draw a panel no click can
  // get back out of.
  is(`${key}: an empty list keeps nothing ticked, and still names every field`, stored([]), ALL_OFF);
  // Step 2. Dropped silently, the way `normalisePrefs` drops a retired key.
  is(`${key}: an id the catalogue does not name is dropped, and the rest keep their order`,
     stored([{ id: "parent", on: true }, { id: "epic", on: true }, { id: "type", on: true }]).map((f) => f.id),
     ["parent", "type", "status", "priority", "assignee", "team", "fixv", "remaining"]);
  is(`${key}: and the dropped id is not ticked into anything`,
     ticked(stored([{ id: "epic", on: true }])), []);
  // Step 3. First wins, so the one the user can see in the panel is the one that
  // counts.
  is(`${key}: a duplicate id collapses, and the first one wins`,
     stored([{ id: "type", on: true }, { id: "type", on: false }]),
     [{ id: "type", on: true }, ...tail("type")]);
  // Step 4. `on` is a fact, not a truthy value: a hand-edited blob cannot produce a
  // state no click made -- the same reading `open` and `rightClickMenu` already get.
  is(`${key}: on is true only when it is exactly true`,
     ticked(stored([{ id: "type", on: "yes" }, { id: "status", on: 1 }, { id: "priority" }, { id: "assignee", on: true }])),
     ["assignee"]);
  // Step 5, which is decision 21: A NEW FIELD ARRIVES OFF. A tab arriving VISIBLE is
  // the deliberate asymmetry -- a tab changes nothing about what a button emits.
  is(`${key}: a field the stored list never mentions is appended last, off`,
     stored([{ id: "type", on: true }]), [{ id: "type", on: true }, ...tail("type")]);
  is(`${key}: a stored order that differs from the catalogue is preserved, not re-sorted`,
     stored([...tab.FIELD_CATALOGUE].reverse().map((f) => ({ id: f.id, on: true }))).map((f) => f.id),
     [...CATALOGUE_IDS].reverse());
}

// 16. The defaults are handed out as COPIES. A caller that reorders or unticks the
// list it was given must not rewrite the default underneath every later read in this
// tab -- `loadPrefs` returns the defaults on every malformed blob, so one mutated
// entry would be permanent for the sitting.
tab = reset({});
const handed = tab.loadPrefs();
handed.detailsFields[0].on = false;
handed.detailsFields.reverse();
is("a hand on the returned list cannot rewrite the default underneath it",
   ticked(tab.loadPrefs().detailsFields),
   ["type", "status", "priority", "assignee", "fixv", "remaining", "parent"]);

// 17. A preference write is still a read-modify-write, and the new keys are the case
// that makes it matter (§2.5): a tab open since this morning must not write a stale
// FIELD LIST over a band changed since.
tab = reset({});
const morning = load();                                   // opened, and left open
tab.savePrefs({ detailsFields: [{ id: "type", on: true }] });   // another tab unticks all but Type
morning.savePrefs({ reportBand1: "assignee" });            // this tab changes a band
prefs = tab.loadPrefs();
is("a band changed in a stale tab does not carry a stale field list with it",
   ticked(prefs.detailsFields), ["type"]);
is("and the band the stale tab did change landed", prefs.reportBand1, "assignee");
// What is written is the NORMALISED list, not the patch: the range check is on the
// write path as well as the read path, so no code can put a state in storage that a
// read would have to repair.
is("a write stores the whole list, not the two fields the caller passed",
   JSON.parse(store[PREFS_KEY]).detailsFields, [{ id: "type", on: true }, ...tail("type")]);
tab.savePrefs({ reportBand2: tab.NO_BAND, lineShape: "haiku" });
is("and a write cannot store a shape the script does not know",
   JSON.parse(store[PREFS_KEY]).lineShape, "markdown");
is("while none IS a band 2, on the write path too",
   JSON.parse(store[PREFS_KEY]).reportBand2, tab.NO_BAND);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
