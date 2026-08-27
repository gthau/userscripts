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
const names = ["readRaw","defaultCollection","normaliseCollections","snapshot","load","activeCollection","save","update","writeFirstRun","loadPrefs","normalisePrefs","resolveBands","normaliseFieldList","defaultFieldList","readStoredBasis","readStoredSize","savePrefs","clamp",
               // The fourth key, at 1.7.0. `uniqueName` comes with it and is NOT a
               // copy: decision 13 is that presets reuse the collections' naming
               // rule unchanged, so the harness has to run the same function the
               // chips do or it would be asserting that a second rule agrees.
               "uniqueName","legacyExportPrefs","byName","firstByName","normalisePreset","oneStar","firstRunPresetList","normalisePresets","loadPresets","savePresets"];
const code = names.map(extract).join("\n");
// Sliced in the file's own order, and `DEFAULT_PREFS` comes LAST: anything it is
// built from has to be declared before it, here exactly as in the script.
const constants = `
  /* THE FOUR KEY NAMES, SLICED. They were copied into this file until 1.7.0, and a
     copied key name is a worse version of the MIN_BLOCK defect above rather than a
     milder one: the harness passed its own copies IN, so they SHADOWED the script's
     constants entirely, and a key renamed in the script would have left every check
     below green against an address the Cart no longer uses.

     A key name is not an expectation. "Scratch" and v:1 below are stated on
     purpose, as this file's own claim about what the script should do, and they
     stay copies for that reason. An address is only ever the script's. */
  ${slice("const STORE_KEY =", "\n")}
  ${slice("const BACKUP_KEY =", "\n")}
  ${slice("const PREFS_KEY =", "\n")}
  ${slice("const PRESETS_KEY =", "\n")}
  ${slice("const MIN_INLINE =", "\n")}
  ${slice("const MIN_BLOCK =", "\n")}
  ${slice("const BASIS_MIN =", "\n")}
  ${slice("const BASIS_MAX =", "\n")}
  ${slice("const LAYOUTS =", "\n")}
  ${slice("const FIELD_CATALOGUE = [", "\n  ];")}
  ${slice("const LINE_SHAPE_IDS = [", "\n  ];")}
  ${slice("const BAND_IDS = [", "\n  ];")}
  ${slice("const NO_BAND =", "\n")}
  ${slice("const SETTINGS_TABS = [", "\n  ];")}
  ${slice("const SETTINGS_TAB_IDS =", "\n")}
  ${slice("const EXPORT_PREF_KEYS = [", "\n  ];")}
  ${slice("const DEFAULT_PREFS = {", "\n  };")}
  ${slice("const DEFAULT_PRESET_NAME =", "\n")}
  ${slice("const PRESET_LISTS =", "\n")}
`;

// The harness stands in for the parts of the script that are not the store.
const harness = `
  let lastRaw = null;
  let writeFailed = false;
  let firstRunDefault = null;
  let firstRunPresets = null;
  let renders = 0;
  function scheduleRender() { renders += 1; }
  ${constants}
  ${code}
  return {
    ${names.join(",")},
    DEFAULT_PREFS, LAYOUTS, MIN_INLINE, MIN_BLOCK, BASIS_MIN, BASIS_MAX,
    FIELD_CATALOGUE, LINE_SHAPE_IDS, BAND_IDS, NO_BAND,
    SETTINGS_TABS, SETTINGS_TAB_IDS, EXPORT_PREF_KEYS,
    STORE_KEY, BACKUP_KEY, PREFS_KEY, PRESETS_KEY,
    DEFAULT_PRESET_NAME, PRESET_LISTS,
    state: () => ({ lastRaw, writeFailed, renders }),
    resetSession: () => { lastRaw = null; writeFailed = false; firstRunDefault = null; firstRunPresets = null; },
  };
`;

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

const ARGS = ["SCHEMA_VERSION","SAFE_KEY_RE","DEFAULT_COLLECTION_NAME","window","logger","crypto","GM_getValue","GM_setValue"];
const build = new Function(...ARGS, harness);
const load = () => build(SCHEMA_VERSION,SAFE_KEY_RE,DEFAULT_COLLECTION_NAME,window,quiet,crypto,GM_getValue,GM_setValue);
// The addresses this file indexes its fake store by, taken from the script itself
// through one throwaway build. Nothing is stored yet, so this costs a parse.
const { STORE_KEY, BACKUP_KEY, PREFS_KEY, PRESETS_KEY } = load();

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

/* 11a. THE COPY BUTTON'S SWITCH, added at 1.3.0, and IT IS THE ONE BOOLEAN HERE THAT
   READS THE OTHER WAY ROUND. Every switch above ships off and reads "anything that is
   not exactly true is off". This one ships ON, so it reads "anything that is not
   exactly false is on" -- and the asymmetry is the decision rather than a slip: a
   switch ships off when turning it on takes something away, which is the right-click
   menu's whole story, and this one takes nothing away (§2.7).

   The consequence worth checking is the hand-edited blob. A string, a number and a
   null all have to come back ON, because none of them is a state a click can make --
   which is the same rule the switches above follow, in the other direction. */
tab = reset({});
is("the copy button ships ON, so an install that never opens ⚙ has it", tab.loadPrefs().copyButton, true);
tab = reset({ [PREFS_KEY]: JSON.stringify({ copyButton: false }) });
is("and exactly false is the only thing that turns it off", tab.loadPrefs().copyButton, false);
for (const junk of ["no", 0, null, "false"]) {
  tab = reset({ [PREFS_KEY]: JSON.stringify({ copyButton: junk }) });
  is(`a stored ${JSON.stringify(junk)} is not off, because it is not a state a click makes`,
     tab.loadPrefs().copyButton, true);
}
tab = reset({});
tab.savePrefs({ copyButton: false });
is("turning it off writes the preference", JSON.parse(store[PREFS_KEY]).copyButton, false);
is("and it leaves the collections alone", STORE_KEY in store, false);
tab = reset({ [PREFS_KEY]: JSON.stringify({ layout: "sideways", rightClickMenu: "yes" }) });
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
/* THE SWEEP HAS TO MOVE BAND 1 OUT OF THE WAY, and that is the rule below rather
   than an awkwardness of the harness: the two bands may not name the same field
   (§2.15, reversed from use on 2026-08-25), so asking for `priority` in band 2 while
   band 1 holds the DEFAULT `priority` is asking for the duplicate. Each id is
   therefore checked against a band 1 that is not it. */
is("and in band 2",
   tab.BAND_IDS.map((id) => storedAs({
     reportBand1: id === "team" ? "priority" : "team", reportBand2: id,
   }).reportBand2), tab.BAND_IDS);

/* -- 14a. THE TWO BANDS MAY NOT NAME THE SAME FIELD, and BAND 2 IS ALWAYS THE ONE
   THAT GIVES WAY. Band 1 is required and band 2 is optional, so the optional one is
   the only one that can yield to a state a click can also produce.

   This shipped ALLOWED and was reversed by use on 2026-08-25: the reasoning was that
   `Team` under `Team` is useless, truthful and visible the moment it is pasted, so
   refusing it was more machinery than the mistake was worth. The user pressed it and
   reported it as a defect. A report whose every sub-heading repeats the heading above
   it is not a configuration anybody chose.

   The ⚙ panel is what stops a CLICK reaching this state -- `Then by` does not offer
   the field `Group by` holds, and moving `Group by` onto `Then by`'s field swaps the
   two. This is the other half: a hand-edited blob, and a build where a band was
   dropped from the vocabulary. */
for (const id of tab.BAND_IDS) {
  is(`a stored duplicate collapses band 2 to none, not band 1: ${id}`,
     [storedAs({ reportBand1: id, reportBand2: id }).reportBand1,
      storedAs({ reportBand1: id, reportBand2: id }).reportBand2],
     [id, "none"]);
}
// AND THE DEFAULT CANNOT PUT ONE BACK EITHER. A blob naming `team` for band 1 and
// nonsense for band 2 would otherwise have `team` restored underneath itself, because
// `team` is what band 2 falls back to.
is("a band 2 falling back to its default cannot duplicate band 1 either",
   storedAs({ reportBand1: "team", reportBand2: "haiku" }).reportBand2, "none");
is("but the same fallback still works where there is nothing to collide with",
   storedAs({ reportBand1: "priority", reportBand2: "haiku" }).reportBand2, "team");
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

// 14b. THE TAB VOCABULARY IS DERIVED FROM THE BAR, added at 1.2.0 with the panel.
// The ids `normalisePrefs` range-checks against are `SETTINGS_TABS.map(...)`, so a
// tab renamed in the bar and not in the check is unrepresentable -- which is the
// whole reason the structure is one list and this is what says so.
is("the ids the store honours are exactly the tabs the bar draws",
   tab.SETTINGS_TAB_IDS, tab.SETTINGS_TABS.map((one) => one.id));
is("every tab carries a label, so none can draw as an empty button",
   tab.SETTINGS_TABS.filter((one) => typeof one.label === "string" && one.label.length > 0).length,
   tab.SETTINGS_TABS.length);
// `Appearance` sits as a peer of two export tabs and that cost is in the ADR. What
// matters here is that it is NOT an export tab, because that is what keeps
// `Restore export defaults` off it (decision 22).
is("appearance is the first tab and the only one that holds no export settings",
   [tab.SETTINGS_TABS[0].id, tab.SETTINGS_TABS.filter((one) => !one.exports).map((one) => one.id)],
   ["appearance", ["appearance"]]);

// 14c. WHAT `Restore export defaults` REACHES. The list is what the handler builds
// its patch from, so a seventh export preference that is not in it would be silently
// out of reach of the only control that resets anything.
is("the restore names every export preference and nothing else",
   tab.EXPORT_PREF_KEYS,
   ["lineShape", "detailsFields", "reportFields", "reportBand1", "reportBand2"]);
is("every key it names is a real preference with a default",
   tab.EXPORT_PREF_KEYS.filter((key) => key in tab.DEFAULT_PREFS).length, tab.EXPORT_PREF_KEYS.length);
// THE THREE APPEARANCE SWITCHES, THE REMEMBERED SIZE AND THE CURRENT TAB ARE NOT IN
// IT, each for its own reason (decision 22): a dragged size is only recoverable by
// dragging the grip again (risk 10), and being thrown to another tab because you
// reset a field list would be a second change nobody asked for.
is("and reaches neither the appearance switches, the size, nor the tab you are on",
   ["corner", "layout", "rightClickMenu", "copyButton", "size", "basisStacked", "basisSplit", "settingsTab", "open"]
     .filter((key) => tab.EXPORT_PREF_KEYS.includes(key)), []);

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

/* 18. THE FOURTH KEY, `gt-jira-cart.presets`, added at 1.7.0. EVERYTHING HERE IS THE
   MIRROR OF SECTION 10, which is the point: a preference that will not parse falls
   back to the shipped defaults, because a preference is regenerated by clicking a
   switch. A PRESET IS NOT. It is the fields, their order, the shape and the two
   headings that somebody built and named, so the list is REPAIRED PER ENTRY -- a
   preset whose field list is rubbish gets that list repaired, a preset with no
   usable name is dropped, and the rest survive (decision 20).

   NOTHING IN THE SCRIPT READS THIS KEY YET. That is ticket 02's whole shape: the
   store lands before the screens that use it, so this section is the only thing
   exercising it and it has to be the thing that catches a broken rule. */
tab = reset({});
let presets = tab.loadPresets();
prefs = tab.loadPrefs();

// The lists are DERIVED from the tab table, the way `SETTINGS_TAB_IDS` is, so a
// list this key holds cannot name a tab that does not edit it. The literal pair is
// this file's own claim about which two those should be.
const PRESET_IDS = tab.PRESET_LISTS.map((one) => one.id);
is("the lists the key holds are exactly the tabs that edit a field list",
   Object.keys(presets), PRESET_IDS);
// AND THE LITERAL PAIR IS LOAD-BEARING, which is worth knowing because the check
// above it cannot currently fail: every tab that carries `exports` also carries
// `fields` today, so filtering on either gives the same two. They diverge the moment
// ticket 03 adds the 🔗 Links tab -- `exports: true`, no field list, no presets
// (decision 4) -- and THIS is the check that goes red if the filter is the wrong one.
is("and that is 📋 Details and 📊 Report -- 🔗 Links has no presets (decision 4)",
   PRESET_IDS, ["details", "report"]);

// 18a. FIRST RUN, AND THE REQUIREMENT IS BYTE-FOR-BYTE SILENCE. An install that
// never opens ⚙ must not be able to tell this shipped -- the same requirement
// 1.2.0's defaults carried, and the one thing in this ticket that is not
// negotiable (decision 21).
is("an absent key builds one preset per list",
   [presets.details.length, presets.report.length], [1, 1]);
// `Standard` and NOT `Default`: "the default preset" and "the preset called
// Default" would be two different things the moment ★ moved (decision 21).
is("each is called Standard, and the name is sliced rather than invented here",
   [presets.details[0].name, presets.report[0].name],
   [tab.DEFAULT_PRESET_NAME, tab.DEFAULT_PRESET_NAME]);
is("Standard, and not Default", tab.DEFAULT_PRESET_NAME, "Standard");
is("and each carries the ★, so a plain press has exactly one answer",
   [presets.details[0].star, presets.report[0].star], [true, true]);
is("each gets an opaque id, so a rename is free (§2.4)",
   presets.details.concat(presets.report)
     .filter((one) => typeof one.id === "string" && one.id.length > 0).length, 2);
is("and the two ids are not the same one",
   presets.details[0].id === presets.report[0].id, false);
// §2.4: nothing is rewritten because you looked at it. THE KEY EXISTING is what
// says the build has happened -- no flag, no version, no second value that could
// disagree -- so the build stays in memory until a real write.
is("reading the key does not write it", store[PRESETS_KEY], undefined);
is("and a preset read touches neither the collections nor the preferences",
   [STORE_KEY in store, PREFS_KEY in store], [false, false]);

// WHAT `Standard` CARRIES on a shipped install: exactly what the formatter would
// have been handed from the preferences, which is what makes the output identical.
is("the 📋 Details preset carries the shape and the field list 1.6.0 printed from",
   [presets.details[0].lineShape, presets.details[0].fields],
   [prefs.lineShape, prefs.detailsFields]);
is("the 📊 Report preset carries its own field list AND the two bands",
   [presets.report[0].lineShape, presets.report[0].fields,
    presets.report[0].band1, presets.report[0].band2],
   [prefs.lineShape, prefs.reportFields, prefs.reportBand1, prefs.reportBand2]);
is("and those ARE the shipped values, so an install with neither key changes nothing",
   [presets.details[0].fields, presets.report[0].band1, presets.report[0].band2],
   [tab.DEFAULT_PREFS.detailsFields, tab.DEFAULT_PREFS.reportBand1, tab.DEFAULT_PREFS.reportBand2]);
// A 📋 Details export has no headings, so a `band1` on its preset would be a key
// that existed and was never read -- a promise the format does not keep.
is("a 📋 Details preset carries NO bands at all",
   ["band1" in presets.details[0], "band2" in presets.details[0]], [false, false]);

/* 18b. AND AN INSTALL THAT HAS OPENED ⚙. The first run carries the preferences AS
   THEY ARE STORED RIGHT NOW, not the shipped ones -- otherwise the one install that
   configured its exports is the one whose output moves. `legacyExportPrefs` reads
   the RAW preferences blob for this, so it outlives the four keys leaving
   `DEFAULT_PREFS` in a later ticket. */
tab = reset({ [PREFS_KEY]: JSON.stringify({
  lineShape: "key-url",
  detailsFields: [{ id: "status", on: true }],
  reportFields: [{ id: "team", on: true }],
  reportBand1: "fixv",
  reportBand2: "assignee",
}) });
presets = tab.loadPresets();
prefs = tab.loadPrefs();
is("the first run carries the stored preferences, not the shipped ones",
   [presets.details[0].lineShape, ticked(presets.details[0].fields),
    ticked(presets.report[0].fields), presets.report[0].band1, presets.report[0].band2],
   ["key-url", ["status"], ["team"], "fixv", "assignee"]);
is("and what it carries is what loadPrefs would have handed the formatter",
   [presets.details[0].fields, presets.report[0].fields,
    presets.report[0].band1, presets.report[0].band2],
   [prefs.detailsFields, prefs.reportFields, prefs.reportBand1, prefs.reportBand2]);
// The raw blob is repaired by the SAME rules a stored preset gets, so there is one
// repair path and not two.
tab = reset({ [PREFS_KEY]: JSON.stringify({ lineShape: "haiku", reportBand1: "remaining" }) });
presets = tab.loadPresets();
is("a preferences blob holding rubbish cannot put rubbish in the new key",
   [presets.details[0].lineShape, presets.report[0].band1], ["markdown", "priority"]);
tab = reset({ [PREFS_KEY]: "}}not json{{" });
presets = tab.loadPresets();
is("and an unreadable preferences blob still builds a Standard from the shipped values",
   [presets.details[0].name, presets.details[0].fields],
   ["Standard", tab.DEFAULT_PREFS.detailsFields]);

// 18c. THE ROOT. Not an object means there is no list in there to repair, so both
// are built from scratch -- which is the ONE place this key behaves like the
// preferences, and only because nothing survived to repair.
const rootIs = (raw) => reset({ [PRESETS_KEY]: raw }).loadPresets();
for (const junk of [null, 7, '"a string"', "[]", "}}not json{{"]) {
  const both = rootIs(junk);
  is(`a root that is not an object rebuilds both lists: ${junk}`,
     [both.details.map((one) => one.name), both.report.map((one) => one.name)],
     [["Standard"], ["Standard"]]);
}

// A preset the checks below reuse. `id` is a plain string on purpose: an opaque id
// is whatever was stored, and this file never asserts the shape of one.
const preset = (patch) => ({
  id: "p-1", name: "Executive", star: true, lineShape: "markdown", fields: [], ...patch,
});
const storedPresets = (value) => reset({ [PRESETS_KEY]: JSON.stringify(value) }).loadPresets();
const detailsOf = (...entries) => storedPresets({ details: entries }).details;

// 18d. A LIST THAT IS NOT AN ARRAY. That list is rebuilt and THE OTHER ONE IS KEPT,
// which is the per-entry principle applied one level up.
presets = storedPresets({ details: "nonsense", report: [preset({ id: "r-1", name: "Exec", band1: "team", band2: "none" })] });
is("a list that is not an array is rebuilt",
   [presets.details.length, presets.details[0].name], [1, "Standard"]);
is("and the other list survives intact, id and all",
   [presets.report.length, presets.report[0].name, presets.report[0].id], [1, "Exec", "r-1"]);

// 18e. THE NAME IS THE ONLY PART THAT CANNOT BE INVENTED, so it is the only drop.
const survivor = preset({ id: "keep", name: "Kept" });
for (const [label, bad] of [
  ["no name", { id: "x" }],
  ["an empty name", { id: "x", name: "" }],
  ["a whitespace name", { id: "x", name: "   " }],
  ["a name that is not a string", { id: "x", name: 7 }],
  ["an entry that is not an object", "nonsense"],
  ["a null entry", null],
]) {
  is(`an entry with ${label} is dropped, and the rest survive`,
     detailsOf(survivor, bad).map((one) => one.name), ["Kept"]);
}

// 18f. EVERYTHING ELSE HAS A RIGHT ANSWER, so nothing else drops.
const minted = detailsOf({ name: "  Trimmed  ", star: true, lineShape: "key-url", fields: [{ id: "team", on: true }] })[0];
is("an entry with no id gets one minted", typeof minted.id === "string" && minted.id.length > 0, true);
is("and everything else about it is kept, with the name trimmed",
   [minted.name, minted.lineShape, ticked(minted.fields)], ["Trimmed", "key-url", ["team"]]);
is("an id that is not a usable string is replaced rather than dropping the preset",
   detailsOf(preset({ id: "" }), preset({ id: 7, name: "Second" }))
     .filter((one) => typeof one.id === "string" && one.id.length > 0).length, 2);

// 18g. NAMES THROUGH `uniqueName`, WITHIN THE LIST, so a hand-edited blob cannot
// hold two presets called `Executive`. The same function the chips use and the same
// rule create and rename will use (decision 13), and a clash ignores case.
is("two presets with the same name are made unique inside the list",
   detailsOf(preset({}), preset({ id: "p-2", name: "executive" })).map((one) => one.name),
   ["Executive", "executive 2"]);
presets = storedPresets({ details: [preset({})], report: [preset({})] });
is("but the two lists are named independently, because they are different kinds of thing",
   [presets.details[0].name, presets.report[0].name], ["Executive", "Executive"]);

/* 18h. EXACTLY ONE ★ PER LIST. THIS IS THE INVARIANT EVERY SCREEN AFTER THIS ONE
   RESTS ON -- a plain press asks for the ★ preset and has to get exactly one answer
   -- so it is enforced on the way in rather than trusted, and repaired here rather
   than handled at each of the places that ask.

   ZERO, TWO AND A NON-BOOLEAN ALL LAND THE SAME WAY: the flag goes to the first
   preset BY NAME. One sentence, one destination, and it is the rule decision 11
   already gives the delete. */
const star = (name, flag) => preset({ id: name, name, star: flag });
const stars = (...entries) => detailsOf(...entries).map((one) => [one.name, one.star]);
is("zero stars -> the first BY NAME gets it",
   stars(star("Zebra", false), star("Apple", false)), [["Zebra", false], ["Apple", true]]);
is("two stars -> the first by name keeps it and the other loses it",
   stars(star("Zebra", true), star("Apple", true)), [["Zebra", false], ["Apple", true]]);
is("three stars, same rule",
   stars(star("Zebra", true), star("Mango", true), star("Apple", true)),
   [["Zebra", false], ["Mango", false], ["Apple", true]]);
is("a star that is not a boolean is not a star, so the flag moves",
   stars(star("Zebra", "yes"), star("Apple", false)), [["Zebra", false], ["Apple", true]]);
is("a missing star is not a star either",
   stars({ id: "z", name: "Zebra", lineShape: "markdown", fields: [] }, star("Apple", false)),
   [["Zebra", false], ["Apple", true]]);
// AND EXACTLY ONE IS LEFT WHERE IT IS. The rule repairs a broken list; it does not
// move a flag somebody put somewhere on purpose.
is("exactly one star stays put, even when it is not the first by name",
   stars(star("Zebra", true), star("Apple", false)), [["Zebra", true], ["Apple", false]]);
// AND IT IS NAME ORDER, NOT CODE-UNIT ORDER. `<` would put every capital before
// every lowercase letter, so `Zebra` would beat `apple` and the picker ticket 03
// draws would look broken to the person reading it (decision 12).
is("first by name orders by letter, not by capital-before-lowercase",
   stars(star("Zebra", false), star("apple", false)), [["Zebra", false], ["apple", true]]);
// THERE IS NO STORED ORDER. The picker sorts by name and ★ is a flag rather than a
// position, so nothing downstream reads position and nothing here rearranges it.
is("and the stored order is left alone, because it carries no meaning at all",
   stars(star("Zebra", true), star("Apple", false)).map(([name]) => name), ["Zebra", "Apple"]);
// The sweep: whatever went in, every list comes out with one ★.
const ONE_STAR_BLOBS = [
  {}, { details: [] }, { details: "x" }, { details: [preset({})] },
  { details: [star("Zebra", true), star("Apple", true)] },
  { details: [star("Zebra", false), star("Apple", false)] },
  { details: [star("Zebra", "yes")] },
  { details: [{ id: "x" }, star("Apple", false)] },
  { details: [preset({}), preset({ id: "p-2", name: "executive" })] },
];
is("EXACTLY ONE ★ PER LIST, whatever went in",
   ONE_STAR_BLOBS.map((blob) => {
     const out = storedPresets(blob);
     return PRESET_IDS.map((id) => out[id].filter((one) => one.star).length);
   }),
   ONE_STAR_BLOBS.map(() => PRESET_IDS.map(() => 1)));

/* 18i. AN EMPTY LIST IS REBUILT, and this is the OPPOSITE of what an empty FIELD
   list gets in section 15 -- the two are worth reading together. A stored `[]` of
   fields is honoured, because zero ticked fields is a state somebody clicked their
   way to. A stored `[]` of presets is not, because the last delete is refused
   (decision 11) so no click produces it, and a list with no presets has no answer to
   "what does this button print". */
presets = storedPresets({ details: [], report: [] });
is("an empty list is rebuilt with one Standard, in both lists",
   [presets.details.map((one) => one.name), presets.report.map((one) => one.name)],
   [["Standard"], ["Standard"]]);
is("and a list whose every entry was dropped is empty, so it is rebuilt too",
   detailsOf({ id: "x" }, { id: "y", name: "" }).map((one) => one.name), ["Standard"]);

// 18j. THE SHAPE. Swept over the sliced vocabulary, so a shape added to the script
// is covered the day it is added.
const shapeOf = (value) => detailsOf(preset({ lineShape: value }))[0].lineShape;
is("every line shape the script names is honoured on a preset",
   tab.LINE_SHAPE_IDS.map(shapeOf), tab.LINE_SHAPE_IDS);
is("an unknown shape falls back to that key's default", shapeOf("haiku"), "markdown");
// A PRESET ALWAYS NAMES A SHAPE (decision 5, chosen against the recommendation).
// There is no "follow the shared setting" state, so `null` is not a shape here --
// it is a value to repair, exactly like any other one the vocabulary does not name.
is("and null is not a 'follow the shared setting' state -- there is no such state",
   [shapeOf(null), shapeOf(undefined)], ["markdown", "markdown"]);

/* 18k. THE BANDS, AND THEY GO THROUGH THE PREFERENCE'S OWN FUNCTION. `resolveBands`
   has two callers since 1.7.0 -- `normalisePrefs` and this -- so the pair rule
   cannot hold on one path and not on the other. That is what these checks are
   really asserting: not that the rule was reimplemented correctly, but that it was
   not reimplemented. */
const bandsOf = (b1, b2) => {
  const one = storedPresets({ report: [preset({ band1: b1, band2: b2 })] }).report[0];
  return [one.band1, one.band2];
};
// Band 1 gets its default back and band 2 is untouched, because there is nothing to
// collide with -- the same answer the preference gives, cross-checked below.
is("band 1 may not be none on a preset either, because a report with no bands is 📋 Details",
   bandsOf(tab.NO_BAND, "team"), ["priority", "team"]);
is("an unknown band falls back to that band's own default", bandsOf("haiku", "haiku"), ["priority", "team"]);
is("band 2 may be none, and that is the single-level report", bandsOf("priority", tab.NO_BAND), ["priority", "none"]);
is("a duplicate collapses BAND 2, never band 1", bandsOf("team", "team"), ["team", "none"]);
is("and band 2's own default cannot put a duplicate back either", bandsOf("team", "haiku"), ["team", "none"]);
is("every bandable field is honoured in band 1 of a preset",
   tab.BAND_IDS.map((id) => bandsOf(id, id === "team" ? "priority" : "team")[0]), tab.BAND_IDS);
is("and in band 2", tab.BAND_IDS.map((id) => bandsOf(id === "team" ? "priority" : "team", id)[1]), tab.BAND_IDS);
// The same input, both paths, one answer. If someone copies the pair rule into the
// presets reader instead of calling the shared one, this is what notices.
const PAIRS = [["team", "team"], ["team", "haiku"], ["haiku", "haiku"], ["none", "team"], ["priority", "none"]];
is("a preset's bands and a preference's bands resolve identically, from one function",
   PAIRS.map(([b1, b2]) => bandsOf(b1, b2)),
   PAIRS.map(([b1, b2]) => {
     const p = storedAs({ reportBand1: b1, reportBand2: b2 });
     return [p.reportBand1, p.reportBand2];
   }));

// 18l. AND A BAND ON A 📋 DETAILS PRESET IS DROPPED. That export has no headings,
// so keeping the key would be storing a promise the format does not keep.
const withBands = detailsOf(preset({ band1: "team", band2: "priority" }))[0];
is("a band stored on a 📋 Details preset is dropped, not carried",
   ["band1" in withBands, "band2" in withBands], [false, false]);

/* 18m. THE FIELD LIST GOES THROUGH `normaliseFieldList` UNCHANGED -- all five of its
   steps, including the one that completes the listing against the catalogue, because
   ticket 03 draws the ⚙ rows from this list exactly as it draws them from the
   preference today. Section 15 owns the five steps; these say the preset path is the
   same path and not a second one. */
const fieldsOf = (value, list = "details") =>
  storedPresets({ [list]: [preset({ fields: value })] })[list][0].fields;
for (const junk of [null, 7, "type,status", { type: true }, undefined]) {
  is(`a fields value that is not a list falls back to that list's default: ${JSON.stringify(junk)}`,
     fieldsOf(junk), tab.DEFAULT_PREFS.detailsFields);
}
is("and the fallback is THAT list's default, not the other list's",
   fieldsOf(null, "report"), tab.DEFAULT_PREFS.reportFields);
is("an id the catalogue does not name is dropped, and the rest keep their order",
   fieldsOf([{ id: "parent", on: true }, { id: "epic", on: true }, { id: "type", on: true }]).map((f) => f.id),
   ["parent", "type", "status", "priority", "assignee", "team", "fixv", "remaining"]);
is("a duplicate id collapses and the first wins",
   fieldsOf([{ id: "type", on: true }, { id: "type", on: false }]),
   [{ id: "type", on: true }, ...tail("type")]);
is("on is true only when it is exactly true",
   ticked(fieldsOf([{ id: "type", on: "yes" }, { id: "status", on: 1 }, { id: "priority" }, { id: "assignee", on: true }])),
   ["assignee"]);
is("a field the stored list never mentions is appended last, off",
   fieldsOf([{ id: "type", on: true }]), [{ id: "type", on: true }, ...tail("type")]);
// AND THE EMPTY SELECTION SURVIVES HERE TOO. Zero ticked fields is a real state --
// the line is the head alone -- and it is the empty PRESET LIST that is refused, not
// the empty field list inside one.
is("an empty field list inside a preset keeps nothing ticked, and still names every field",
   fieldsOf([]), ALL_OFF);

// 18n. A blob edited through Tampermonkey's own storage view arrives as an object,
// the way the collections' already does.
is("an object in storage is read",
   reset({ [PRESETS_KEY]: { details: [preset({ name: "Hand edited" })] } }).loadPresets().details[0].name,
   "Hand edited");

/* 18o. THE WRITE PATH. What is stored is the NORMALISED result, so the repair runs
   on the way out as well as on the way in and no code in the script can put a state
   in the key that a read would have to repair. `savePrefs` already works this way. */
tab = reset({});
tab.savePresets((all) => all.details.push({ name: "Executive", star: true, lineShape: "key-url", fields: [{ id: "team", on: true }] }));
let written = JSON.parse(store[PRESETS_KEY]);
is("a write creates the key, which is what says the first run has happened", typeof store[PRESETS_KEY], "string");
is("and the first run's Standard was written with it",
   written.details.map((one) => one.name), ["Standard", "Executive"]);
// Both were flagged -- the first run's Standard and the pushed one -- so the write
// path's one-star repair fires, and `Executive` sorts before `Standard`.
is("the one-star rule runs on the WRITE path too", written.details.map((one) => one.star), [false, true]);
is("an entry pushed without an id is given one on the way out",
   typeof written.details[1].id === "string" && written.details[1].id.length > 0, true);
is("and its field list was completed against the catalogue before it was stored",
   written.details[1].fields.length, tab.FIELD_CATALOGUE.length);
is("the other list was written untouched", written.report.map((one) => one.name), ["Standard"]);
is("a preset write leaves the collections and the preferences alone",
   [STORE_KEY in store, PREFS_KEY in store], [false, false]);
const keptPresets = store[PRESETS_KEY];
writesThrow = true;
tab.savePresets((all) => all.details.pop());
is("a failed preset write leaves the stored presets whole", store[PRESETS_KEY], keptPresets);
// The flag and its sentence are the COLLECTIONS', the same line `savePrefs` draws.
is("and it does not set the collections' warning", tab.state().writeFailed, false);
writesThrow = false;

/* 18p. A PRESET WRITE IS A READ-MODIFY-WRITE (§2.5), and this is the case that makes
   it matter: a tab open since this morning must not write its stale list over a
   preset created since. */
tab = reset({});
const morningPresets = load();
tab.savePresets((all) => all.details.push(preset({ id: "p-2", name: "Executive", star: false })));
morningPresets.savePresets((all) => { all.report[0].band2 = tab.NO_BAND; });
presets = tab.loadPresets();
is("a stale tab cannot write a stale list over a preset created since",
   presets.details.map((one) => one.name), ["Standard", "Executive"]);
is("and the change the stale tab did make landed", presets.report[0].band2, "none");

/* 18q. THE FOUR EXPORT KEYS ARE STILL IN THE PREFERENCES, AND THIS IS A TRIPWIRE
   RATHER THAN A CLAIM THAT THEY BELONG THERE. Decision 22 takes `detailsFields`,
   `reportFields`, `reportBand1` and `reportBand2` out of `DEFAULT_PREFS`, leaving
   `lineShape` as 🔗 Links' own setting (decision 4).

   IT DID NOT HAPPEN IN THIS TICKET, and the reason is worth having written down: the
   two things that read those keys -- `format` and the ⚙ panel -- still read them,
   and nothing reads a preset yet. Dropping them here would have taken 📋 Details and
   📊 Report out with them, which is the one thing this ticket promised not to do.
   The drop belongs to whichever of ticket 03 or 04 lands first, because that is the
   one that moves those readers onto the ★ preset.

   WHEN THAT LANDS THESE THREE GO RED, and that is what they are for. */
tab = reset({});
tab.savePrefs({ corner: "bottom-left" });
const writtenPrefs = JSON.parse(store[PREFS_KEY]);
is("the four export keys are still written into the preferences after this ticket",
   ["detailsFields", "reportFields", "reportBand1", "reportBand2"].filter((key) => key in writtenPrefs),
   ["detailsFields", "reportFields", "reportBand1", "reportBand2"]);
is("lineShape is there too, and it is the one that STAYS when they go",
   "lineShape" in writtenPrefs, true);
is("and Restore export defaults still reaches all five, shrinking to lineShape with them",
   tab.EXPORT_PREF_KEYS.length, 5);

console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
