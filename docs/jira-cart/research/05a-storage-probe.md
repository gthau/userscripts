# 05a — Storage ceiling, blob size, and the failed-summary states

Ticket `05`, questions 3, 5, 6 and 8. Run by **you**, in devtools, in the style that
worked for `02c` and `09a`.

> **Run 2026-08-13. Read [Part 3](#part-3--what-the-runs-settled) first — it holds the
> conclusions, and it corrects two claims made earlier in this file.** In short: the
> Atlassian `localStorage` wrapper is a faithful passthrough, the cross-tab `storage`
> event works but is very noisy, Jira already occupies about half the origin's quota,
> and `01`'s leftover probe is closed — there is **one** failed-summary state, because
> the API deliberately refuses to distinguish absent from forbidden.

Run it on any Jira page on `dalet.atlassian.net`. One paste, three answers.

## Part 1 — The snippet

```js
(async () => {
  // ---- optional: a key you lack PERMISSION to view (see "On HIDDEN_KEY" below) ----
  const HIDDEN_KEY = "";
  // --------------------------------------------------------------------------------

  // A0 — WHAT IS THIS OBJECT?  CONFIRMED 2026-08-13: on both jira and bitbucket,
  // `localStorage instanceof Storage` is FALSE and `.length` behaves as a method.
  // On google.com both are the spec's. So Atlassian replaces window.localStorage
  // platform-wide. Characterise the wrapper, find the native object, and — the part
  // that decides 05 — check whether writes through the wrapper reach the real store.
  const LS = window.localStorage;
  const isNative = (o) => { try { return o instanceof Storage; } catch { return "n/a"; } };

  console.log("A0.1 wrapper:", "length is a", typeof LS.length,
              "| instanceof Storage:", isNative(LS),
              "| toString:", Object.prototype.toString.call(LS),
              "| ctor:", LS.constructor && LS.constructor.name);
  console.log("A0.2 wrapper own members:", Object.getOwnPropertyNames(LS).filter((k) => typeof LS[k] === "function").join(" ") || "(none)");
  console.log("A0.3 wrapper prototype members:", Object.getOwnPropertyNames(Object.getPrototypeOf(LS) || {}).join(" ") || "(none)");
  console.log("A0.4 window own prop for localStorage:",
              JSON.stringify(Object.getOwnPropertyDescriptor(window, "localStorage")
                ? Object.keys(Object.getOwnPropertyDescriptor(window, "localStorage")) : null));

  // the escape hatch: the native accessor still lives on Window.prototype
  let NATIVE = null;
  try {
    NATIVE = Object.getOwnPropertyDescriptor(Window.prototype, "localStorage")?.get?.call(window) ?? null;
    console.log("A0.5 native via Window.prototype getter:",
                NATIVE ? `instanceof Storage: ${isNative(NATIVE)} | length: ${NATIVE.length} | same as wrapper: ${NATIVE === LS}` : "not reachable");
  } catch (e) { console.log("A0.5 native accessor failed —", e.message); }

  // A0.6 — IS THE WRAPPER A PASSTHROUGH?  This is the one write in the whole probe,
  // and it is removed again immediately. If the two views disagree, 05's storage layer
  // cannot use window.localStorage as-is.
  const PK = "gt-jira-cart.probe";
  try {
    LS.setItem(PK, "hello-from-wrapper");
    const backWrapper = LS.getItem(PK);
    const backNative = NATIVE ? NATIVE.getItem(PK) : "(no native ref)";
    console.log("A0.6 passthrough:", "via wrapper:", JSON.stringify(backWrapper),
                "| via native:", JSON.stringify(backNative),
                "| MATCH:", backWrapper === backNative);
    LS.removeItem(PK);
    console.log("A0.7 cleanup: wrapper:", JSON.stringify(LS.getItem(PK)),
                "| native:", NATIVE ? JSON.stringify(NATIVE.getItem(PK)) : "(n/a)",
                "— both should be null");
  } catch (e) {
    console.log("A0.6 passthrough test THREW —", e.message);
    try { LS.removeItem(PK); NATIVE && NATIVE.removeItem(PK); } catch {}
  }

  // A — what Jira itself already stores on this origin, i.e. how much room is left.
  // Shape-agnostic: works whether `length` is a property or a method, and whether keys
  // are exposed as own properties or only through key(i).
  const lenOf = (s) => { const l = s.length; return typeof l === "function" ? s.length() : l; };
  const keysOf = (s) => {
    const viaProps = Object.keys(s).filter((k) => typeof s[k] !== "function");
    if (viaProps.length) return viaProps;
    const out = [], n = lenOf(s) || 0;
    for (let i = 0; i < n; i++) { const k = s.key && s.key(i); if (k != null) out.push(k); }
    return out;
  };
  const size = (s) => keysOf(s).reduce((n, k) => n + k.length + (s.getItem(k) || "").length, 0);

  const keys = keysOf(LS);
  console.log(`A: lenOf=${lenOf(LS)}  keysFound=${keys.length}  ` +
              `sessionStorage=${keysOf(sessionStorage).length} keys / ` +
              `${(size(sessionStorage) / 1024).toFixed(0)} K chars`);
  if (!keys.length) {
    console.log("A: no localStorage keys reachable on this origin. Either Jira keeps its " +
                "state elsewhere (IndexedDB / sessionStorage), or the wrapper hides keys " +
                "from enumeration — A0 above says which. Paste this line either way.");
  } else {
    const total = size(LS);
    const rows = keys
      .map((k) => {
        const chars = k.length + (LS.getItem(k) || "").length;
        return { key: k.slice(0, 55), chars, kb: +(chars / 1024).toFixed(1) };
      })
      .sort((a, b) => b.chars - a.chars);
    console.log(`A: ${keys.length} keys, ${(total / 1024).toFixed(0)} K chars ` +
                `(~${(total / 1024 / 1024).toFixed(2)} MB at 1 byte/char, ` +
                `~${(total * 2 / 1024 / 1024).toFixed(2)} MB if counted as UTF-16)`);
    console.table(rows.slice(0, 15));
  }

  // B — how big is a realistic Cart blob? (measured only; nothing is written)
  const mkItem = (i) => ({
    k: `RDC-${20000 + i}`,
    s: "[Rundown] Outline inside the edited field — a summary of roughly this length",
    at: 1755000000000
  });
  const blob = { v: 1, active: "c1", collections: [{ id: "c1", name: "Sprint review 2608-01", items: [] }] };
  for (const n of [50, 200, 1000, 5000]) {
    blob.collections[0].items = Array.from({ length: n }, (_, i) => mkItem(i));
    const chars = JSON.stringify(blob).length;
    console.log(`${String(n).padStart(4)} items → ${(chars / 1024).toFixed(1)} K chars ` +
                `(~${(chars / 1024 / 1024).toFixed(3)} MB, ~${(chars * 2 / 1024 / 1024).toFixed(3)} MB UTF-16)`);
  }

  // C — 01's leftover: does "no such issue" look different from "no permission"?
  const probe = ["RDC-9999999"].concat(HIDDEN_KEY ? [HIDDEN_KEY] : []);
  const r = await fetch("/rest/api/3/issue/bulkfetch", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Atlassian-Token": "no-check" },
    body: JSON.stringify({ issueIdsOrKeys: probe, fields: ["summary"], fieldsByKeys: false })
  });
  console.log("bulkfetch", probe.join(","), "→", r.status, (r.headers.get("content-type") || "").split(";")[0]);
  console.log((await r.text()).slice(0, 600));

  // and one at a time — a single GET may say more than a bulk read does
  for (const k of probe) {
    const g = await fetch(`/rest/api/3/issue/${k}?fields=summary`, { headers: { Accept: "application/json" } });
    const t = (g.headers.get("content-type") || "").split(";")[0];
    console.log(`GET issue/${k} →`, g.status, t, "|", (await g.text()).replace(/\s+/g, " ").slice(0, 200));
  }
})();
```

### What each part decides

| Part | Question it answers | Why it is not guessable |
| --- | --- | --- |
| **A0** | Is `window.localStorage` on a Jira page even the native `Storage`? | Observed 2026-08-13: on `atlassian.net`, `localStorage.length` behaves as a **method**, while on `google.com` it is the spec's read-only property. That means the page hands out a wrapper. Under `@grant none` the Cart runs in page context, so **the wrapper is what the Cart would write to** — see below |
| **A** | `05` Q8 — the *practical* ceiling | It is not 5 MB. It is 5 MB minus whatever Jira already stores on the same origin, which nobody has measured |
| **B** | `05` Q8 — in items rather than bytes | Turns "roughly 5 MB" into "n items before it matters" |
| **C** | `05` Q3 and Q6 — how many failed-summary states exist | See below |

### On A0 — Atlassian replaces `window.localStorage`, and it is `05`'s problem

**Confirmed by the user, 2026-08-13:** `localStorage instanceof Storage` is **false**
on both `dalet.atlassian.net` and Bitbucket, and `true` on `google.com`. `.length`
behaves as a **method** rather than the spec's read-only property. So this is an
Atlassian-platform-wide replacement, not a Jira quirk — which also means whatever
`05` concludes carries to the Bitbucket cart the map lists as out of scope.

The map fixes `localStorage` as the storage mechanism and `@grant none` as the
platform (`04`). Together those mean the Cart writes to **whatever object the page
exposes**. Four things follow:

- **Round-tripping is already proven for small values.**
  [`jira-ux-improvements.user.js:129`](../../../src/jira-ux-improvements.user.js#L129)
  stores `gt-jira-ux.prefs` through it, and that ADR calls the state *"Permanent"*,
  so it survives restarts. Nothing beyond `getItem`/`setItem` is established.
- **Is it a passthrough? A0.6 answers it.** One write through the wrapper, read back
  through the native object, then removed. If the two views disagree, `05`'s storage
  layer cannot use `window.localStorage` as-is — and the prefs of the other two
  scripts are living somewhere nobody intended.
- **The native object is still reachable, and that is the escape hatch.** If the
  replacement is an own property on `window`, the real accessor remains on
  `Window.prototype`: `Object.getOwnPropertyDescriptor(Window.prototype,
  "localStorage").get.call(window)`. A0.5 tests it. One line, no iframe to keep
  alive, and it works under `@grant none` because the Cart runs in page context.
- **The `storage` event is `05` Q5's only cross-tab mechanism**, and a wrapper may
  neither dispatch nor receive it. That needs two tabs, so it is part D below.

**The one write in this probe** is `gt-jira-cart.probe` in A0.6, removed immediately,
with A0.7 confirming both views are back to `null`. Everything else only reads.

### On `HIDDEN_KEY`

It means an issue you **lack permission to view** — not one that is unrendered, and
not one hidden by a filter. An issue that exists on this site but that Jira refuses
to show *you*, because the project's browse permission excludes you or the issue
carries a security level. `/browse/THATKEY-1` would give you "you don't have access".

*Why `05` wants it:* an **absent** key comes back silently short — `200`,
`issues: []`, `issueErrors: []` (`01` §5, reconfirmed on all four runs in `09a`). Is
a **forbidden** key distinguishable from that? Identical → one failed state,
`summary unavailable`. Different → two, and the UI can distinguish *no longer exists*
from *you cannot see this one*.

**Left empty on 2026-08-13 — the user could not find one.** Recorded as a finding
rather than a gap: browse access on `dalet.atlassian.net` is wide. `09a` alone
surfaced `GLX`, `PGI`, `WNQR`, `Xtend` and another team's sprints, all readable. So
for the Cart's actual audience — the user plus colleagues on the same site —
permission-denied is a rare failure and **deleted or moved** is the common one.
That argues for a single failed state regardless of what the API does, which is also
the conservative direction. If a colleague ever supplies a restricted key, part C
takes it with no other change.

To hunt for a candidate later, anything below that is not `200` is a project out of
reach; use its key with `-1`:

```js
(async () => {
  for (const p of ["HR", "LEGAL", "FIN", "IT", "SEC", "PEOPLE", "PAY", "EXEC"]) {
    const r = await fetch(`/rest/api/3/project/${p}`, { headers: { Accept: "application/json" } });
    console.log(p.padEnd(8), r.status, r.status === 200 ? "(you CAN see this one — not useful)" : "");
  }
})();
```

---

## Part 1b — The cross-tab test (two tabs, `05` Q5)

The `storage` event only fires in **other** tabs, so a single-tab run cannot test it.
The map fixes storage as *"shared across tabs"*, and `@grant none` leaves no
alternative mechanism — so if the wrapper swallows this event, Q5's answer changes
shape entirely.

**Tab 1** — any Jira page. Paste this and leave it open:

```js
window.__cartProbe = [];
addEventListener("storage", (e) => {
  window.__cartProbe.push(e.key);
  console.log("TAB1 got storage event:", "key:", e.key,
              "| oldValue:", JSON.stringify(e.oldValue),
              "| newValue:", JSON.stringify(e.newValue),
              "| url:", e.url,
              "| storageArea instanceof Storage:", (() => { try { return e.storageArea instanceof Storage; } catch { return "n/a"; } })());
});
console.log("TAB1 listening. Now run the tab-2 snippet, then come back and read __cartProbe.");
```

**Tab 2** — a second Jira tab, same site. Paste this:

```js
(() => {
  const K = "gt-jira-cart.probe.xtab";
  const NATIVE = Object.getOwnPropertyDescriptor(Window.prototype, "localStorage")?.get?.call(window) ?? null;
  console.log("TAB2 writing via wrapper…");
  localStorage.setItem(K, "w-" + Math.floor(performance.now()));
  if (NATIVE && NATIVE !== localStorage) {
    console.log("TAB2 writing via native…");
    NATIVE.setItem(K, "n-" + Math.floor(performance.now()));
  }
  setTimeout(() => {
    localStorage.removeItem(K);
    NATIVE && NATIVE.removeItem(K);
    console.log("TAB2 done and cleaned up. Check tab 1.");
  }, 1500);
})();
```

**Back in tab 1**, run `window.__cartProbe` and paste what it holds. What it decides:

| Tab 1 saw | It means |
| --- | --- |
| events for both the wrapper write and the native write | The event survives the wrapper. Q5 has its mechanism, and the panel can re-read on it |
| only the **native** write | The wrapper's `setItem` does not reach the origin store, or suppresses notification. `05` must use the native accessor |
| **nothing at all** | No cross-tab mechanism under `@grant none`. Q5 needs a different answer — polling, or accepting last-write-wins per tab |
| `storageArea instanceof Storage` is `false` | The event itself is wrapped too, and `e.storageArea` cannot be trusted for identity checks |

---

## Part 2 — Your output

Paste each console block verbatim. Raw output beats a description of it — that is the
lesson `02` recorded when its own probe under-reported twice and only the pasted
`outerHTML` caught it.

### A0 — what `window.localStorage` actually is on a Jira page

All four `A0:` lines. This is the one that may change `05`'s storage layer, so paste
it even if it looks unremarkable.

```
A0.1 wrapper: length is a function | instanceof Storage: false | toString: [object Object] | ctor: Object
A0.2 wrapper own members: clear key length removeItem getItem setItem
A0.3 wrapper prototype members: constructor __defineGetter__ __defineSetter__ hasOwnProperty __lookupGetter__ __lookupSetter__ isPrototypeOf propertyIsEnumerable toString valueOf __proto__ toLocaleString
A0.4 window own prop for localStorage: ["value","writable","enumerable","configurable"]
A0.5 native via Window.prototype getter: not reachable
A0.6 passthrough: via wrapper: "hello-from-wrapper" | via native: "(no native ref)" | MATCH: false
A0.7 cleanup: wrapper: null | native: (n/a) — both shou
```

### A — what is already in `localStorage`

The `A:` line, then the table. **If it reports no reachable keys, paste that line — it
is a result.** Either Jira keeps its state in IndexedDB and `sessionStorage`, in which
case the Cart has the whole quota and `05` Q8 gets an easy answer, or the wrapper
hides keys from enumeration — and A0 says which.

```
A: lenOf=629  keysFound=629  sessionStorage=18 keys / 19 K chars
A: 629 keys, 1347 K chars (~1.32 MB at 1 byte/char, ~2.63 MB if counted as UTF-16)
```

### B — Cart blob size at 50 / 200 / 1000 / 5000 items

```
[
    {
        "key": "quick-find-recent-activities",
        "chars": 977375,
        "kb": 954.5
    },
    {
        "key": "aiMateSmartLinkProviderMapping",
        "chars": 159063,
        "kb": 155.3
    },
    {
        "key": "aiMateSmartLinkProviders",
        "chars": 68168,
        "kb": 66.6
    },
    {
        "key": "@atlassiansox/flight-deck-frontend-client_app-switcher-",
        "chars": 19023,
        "kb": 18.6
    },
    {
        "key": "@atlassiansox/flight-deck-frontend-client_recent-work-s",
        "chars": 15995,
        "kb": 15.6
    },
    {
        "key": "@atlassiansox/flight-deck-frontend-client_app-switcher-",
        "chars": 14304,
        "kb": 14
    },
    {
        "key": "quick-find-recommended-documents",
        "chars": 6701,
        "kb": 6.5
    },
    {
        "key": "@atlassiansox/flight-deck-frontend-client_people-and-te",
        "chars": 6686,
        "kb": 6.5
    },
    {
        "key": "@atlassiansox/flight-deck-frontend-client_people-and-te",
        "chars": 6135,
        "kb": 6
    },
    {
        "key": "__storejs_issue-drafts_5f5a17b30b2aef0068d1be7c.WEB-252",
        "chars": 3951,
        "kb": 3.9
    },
    {
        "key": "persist:@portfolio/common/sections2",
        "chars": 3918,
        "kb": 3.8
    },
    {
        "key": "jira-forge-compal.forge-compal-modules-cache",
        "chars": 3750,
        "kb": 3.7
    },
    {
        "key": "localStorage/atlassian.5f5a17b30b2aef0068d1be7c.fronten",
        "chars": 3748,
        "kb": 3.7
    },
    {
        "key": "search-combined-config",
        "chars": 3397,
        "kb": 3.3
    },
    {
        "key": "cachedImageErrorLight",
        "chars": 3267,
        "kb": 3.2
    }
]


50 items → 5.9 K chars (~0.006 MB, ~0.012 MB UTF-16)
200 items → 23.5 K chars (~0.023 MB, ~0.046 MB UTF-16)
1000 items → 117.3 K chars (~0.115 MB, ~0.229 MB UTF-16)
5000 items → 586.0 K chars (~0.572 MB, ~1.145 MB UTF-16)
```

### C — absent key, and permission-denied if `HIDDEN_KEY` was filled

Both the `bulkfetch` result and the per-key `GET` lines.

```
bulkfetch RDC-9999999 → 200 application/json
{"expand":"names,schema","issues":[],"issueErrors":[]}
GET issue/RDC-9999999 → 404 application/json | {"errorMessages":["Issue does not exist or you do not have permission to see it."],"errors":{}}
```

### D — the cross-tab `storage` event (from part 1b, two tabs)

Tab 1's `TAB1 got storage event:` lines and the final `window.__cartProbe`. **If it
stayed empty, say so** — that is the outcome that changes `05` Q5 most.

```
TAB1 got storage event: key: __storage_test__ | oldValue: null | newValue: "__storage_test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storage_test__ | oldValue: "__storage_test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642935296}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936435}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936435}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936436}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936436}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936713}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936713}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936725}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936725}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936741}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936741}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936742}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936742}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936886}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
 TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786641216141},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786641216142},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786641216142},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786641216142},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786641216142},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786641216142},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786641216142},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786641216142},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786641216142},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786641216142},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786641216142},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786641216143},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_cjn-eligibility-cache | oldValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786641216143}}" | newValue: "{\"local_storage_enabled\":{\"value\":{\"value\":true},\"timestamp\":1786642937113},\"has_enrolled_msr\":{\"value\":{\"value\":true},\"timestamp\":1786642937114},\"site_is_opted_out\":{\"value\":{\"value\":false,\"ttl\":1786634437514},\"timestamp\":1786642937114},\"user_already_has_confluence\":{\"value\":{\"value\":true,\"ttl\":1786634437710},\"timestamp\":1786642937114},\"user_cannot_request_confluence_access\":{\"value\":{\"value\":false,\"ttl\":1776203837137},\"timestamp\":1786642937114},\"has_seen_conf\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_seen_jpd\":{\"value\":{\"value\":false},\"timestamp\":1786642937115},\"has_enrolled_msr_v1\":{\"value\":{\"value\":true},\"timestamp\":1786642937115}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642936886}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937115}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937115}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937358}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937358}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937368}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937368}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937556}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937556}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937558}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937558}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937689}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937689}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937693}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storage_test__ | oldValue: null | newValue: "__storage_test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storage_test__ | oldValue: "__storage_test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs_cache_prefix_labels | oldValue: "{\"tech-debt\":{\"value\":{\"label\":\"tech-debt\"},\"timestamp\":1786641217138}}" | newValue: "{\"tech-debt\":{\"value\":{\"label\":\"tech-debt\"},\"timestamp\":1786642938087}}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642937693}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642938601}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642938601}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642938603}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: null | newValue: "__storejs__test__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__test__ | oldValue: "__storejs__test__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: null | newValue: "test_value" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.storage.support | oldValue: "test_value" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__ | oldValue: null | newValue: "\"__storejs__\"" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __storejs__ | oldValue: "\"__storejs__\"" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: gt-jira-cart.probe.xtab | oldValue: null | newValue: "w-6232" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __test_1786642941487__ | oldValue: null | newValue: "__test_1786642941487__" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: __test_1786642941487__ | oldValue: "__test_1786642941487__" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: gt-jira-cart.probe.xtab | oldValue: "w-6232" | newValue: null | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642938603}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642945983}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: statsig.session_id.2440123593 | oldValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642945983}" | newValue: "{\"sessionID\":\"10faef61-f791-4eb2-8610-a30c4776f0e3\",\"startTime\":1786642935295,\"lastUpdate\":1786642945990}" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true
TAB1 got storage event: key: awc.session.expiry | oldValue: "1786644747196" | newValue: "1786644749510" | url: https://dalet.atlassian.net/browse/RDC-23716 | storageArea instanceof Storage: true

[
    "__storage_test__",
    "__storage_test__",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "statsig.session_id.2440123593",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "__storejs_cache_prefix_cjn-eligibility-cache",
    "statsig.session_id.2440123593",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storage_test__",
    "__storage_test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs_cache_prefix_labels",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "__storejs__test__",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "awc.storage.support",
    "__storejs__",
    "__storejs__",
    "gt-jira-cart.probe.xtab",
    "__test_1786642941487__",
    "__test_1786642941487__",
    "gt-jira-cart.probe.xtab",
    "statsig.session_id.2440123593",
    "statsig.session_id.2440123593",
    "awc.session.expiry"
]
```

### Anything that looked wrong

Surprises, errors, anything that contradicts what the file above predicts.

```

```

---

## Part 3 — What the runs settled

Written 2026-08-13 from the output above. **Two claims earlier in this file were wrong
and are corrected here; read this section before trusting A0.5 or A0.6.**

### 3.1 The wrapper is a passthrough — confirmed, by part D rather than by A0.6

`window.localStorage` on `atlassian.net` is a **plain object**, not a `Storage`:
`instanceof Storage` is `false`, `toString` is `[object Object]`, its constructor is
`Object`, its prototype is `Object.prototype` (A0.1, A0.3). It carries the whole
Storage-like API as own function properties — `clear key length removeItem getItem
setItem` — with **`length` as a method** (A0.2).

But it writes to the real origin store. The decisive line is in part D:

```
TAB1 got storage event: key: gt-jira-cart.probe.xtab | oldValue: null
  | newValue: "w-6232" | storageArea instanceof Storage: true
```

`w-` was the **wrapper** write in tab 2. It produced a genuine cross-tab `storage`
event whose `storageArea` **is** a native `Storage`. So the wrapper is a faithful
front end, and the 629 keys part A enumerated are the real ones.

**`A0.6`'s `MATCH: false` is an artefact, not a finding** — it compared against the
string `"(no native ref)"` because A0.5 failed. Disregard that line.

### 3.2 A0.5's escape hatch does not work, and cannot

`A0.5` printed `not reachable`, and `A0.4` says why: `window`'s own property for
`localStorage` is a **data** property — `["value","writable","enumerable","configurable"]`
— so Atlassian **overwrote** the accessor rather than shadowing it. The original
getter is gone from that object, not merely hidden behind it, and
`Object.getOwnPropertyDescriptor(Window.prototype, "localStorage")` has no getter to
borrow.

**The route that would work is a same-origin iframe's `contentWindow.localStorage`**,
which was in an earlier draft of this probe and was replaced by the prototype trick.
Untested. It is also **not needed**: §3.1 shows the wrapper is faithful, and the only
part of the API that misbehaves is `length`. So the Cart uses `window.localStorage`
directly and simply never relies on `.length` — or calls it defensively, since it is a
method here and a property everywhere else.

### 3.3 Q8 — the ceiling, and the hazard is Jira's growth, not the Cart's

| | Chars | As UTF-16 |
| --- | --- | --- |
| Jira's current usage, 629 keys | 1,347 K | ~2.63 MB |
| — of which `quick-find-recent-activities` alone | 977 K | ~1.91 MB |
| Cart at 50 items | 5.9 K | ~0.01 MB |
| Cart at 1,000 items | 117 K | ~0.23 MB |
| Cart at 5,000 items | 586 K | ~1.15 MB |

Chromium's ~5 MB per-origin quota counts **UTF-16 code units**, so the conservative
reading is that **Jira already occupies about half the origin's quota**, and one key —
a *recent activity* cache that grows with use — is 72% of that.

Two consequences for `05`:

- **The Cart is cheap.** A 1,000-item collection is ~0.23 MB, under a tenth of what
  Jira is already using. Nothing in the plausible range of use threatens the quota.
- **But `setItem` can still throw `QuotaExceededError`, because of Jira's growth
  rather than the Cart's.** That is not a theoretical ceiling to note in the ADR and
  move on from — it is a write path that fails while the user is adding an item. Q8's
  answer has to say what happens then, and design principle 4 applies: the safe
  default is that the previous collection survives intact.

### 3.4 Q5 — the event works, and it is extremely noisy

Tab 1 caught roughly **100 events in a couple of seconds**, essentially none of them
the probe's. Jira's own code constantly writes and deletes probe keys —
`__storage_test__`, `awc.storage.support`, `__storejs__test__`,
`__test_<timestamp>__` — and rewrites `statsig.session_id.*` and
`__storejs_cache_prefix_*` on a timer.

So the mechanism exists, and **a listener must filter by key before doing anything**.
An unfiltered `storage` handler that re-reads and re-renders would fire dozens of
times a second on an idle Jira tab. Concrete rule for `05` Q5, and for `08`.

### 3.5 `01`'s leftover probe is CLOSED — one failed state, not two

`HIDDEN_KEY` was never needed. The single-issue GET answers it outright:

```
GET issue/RDC-9999999 → 404 application/json
{"errorMessages":["Issue does not exist or you do not have permission to see it."],"errors":{}}
```

**Atlassian conflates the two cases in the message itself**, deliberately, so as not to
leak whether an issue exists. And `bulkfetch` is quieter still — `200`,
`{"expand":"names,schema","issues":[],"issueErrors":[]}`, confirming `01` §5's
diff-requested-against-returned rule for the fifth time.

So **`05` draws one failed-summary state, not two**, and the wording cannot claim the
issue is gone — something like *"cannot read this item"* rather than *"deleted"*. This
supersedes the "left empty, proceed on an assumption" note in the `On HIDDEN_KEY`
section above: it is no longer an assumption.

### 3.6 Incidental, worth knowing

- Jira uses **store.js** (`__storejs_*` keys) and **statsig** for feature flags.
- There is a key literally named `localStorage/atlassian.<accountId>.frontend…`.
- `sessionStorage` holds only 18 keys / 19 K chars — Jira's persistent client state
  really is in `localStorage` plus IndexedDB.
- The wrapper is **platform-wide**: the user confirmed the same `instanceof Storage`
  failure on Bitbucket, so everything in §3.1–3.2 carries to the out-of-scope
  Bitbucket cart, and to `bitbucket-ux-improvements`'s existing `gt-bb-dryrun` read.

### 3.7 What `05` did with it — this file is closed

Run 2026-08-13, written up the same day, spent by `05`'s grilling on 2026-08-14.
Every question this probe was built for is now answered in
[`05`'s Answer](../issues/05-collection-data-model-in-localstorage.md#answer):
§3.1 put the Cart on `window.localStorage` directly with no escape hatch and no
reliance on `.length`; §3.3 turned Q8 from a ceiling into a **failed-write** rule
(the write is the commit, so the previous collection survives) and the expected
scale came in far below it anyway at 20–50 items; §3.4 became a one-line key filter
on the `storage` handler, which is what makes the cross-tab mechanism usable at all;
and §3.5 gave Q3 and Q6 **one** failed-summary state whose wording may not claim
deletion. `HIDDEN_KEY` was never filled and no longer matters — the 404 message
conflates absent and forbidden in its own text, so the answer is the same either
way, and `01`'s leftover probe needs no successor. **Nothing here is still open.**
