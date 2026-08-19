# 10a — Where the collections live: user properties, and the `@grant` clipboard

Ticket `10`, questions 1–6. Desk pass 2026-08-18, then **your** two runs.

`10` asks whether Jira's own per-user property store is a place to keep the
collections, and it carries `06`'s standing experiment — does a `ClipboardItem`
write survive a `@grant`? — because that one answer decides whether Tampermonkey
storage is even a candidate.

Six of the eight allowed fetches were spent; two are banked. **Three of the five
documentation questions could not be read from primary sources**, and they are
marked as such below rather than guessed. `01` was wrong about exactly this class
of detail — `issueErrors` came back empty when the docs implied otherwise — so
**every claim in Part 1 is provisional until the runs come back**, and the ones
most likely to be wrong are flagged `⚠ UNVERIFIED`.

---

## Part 1 — What the documentation settles, and what it would not give up

### 1.1 The size ceiling is documented, exact, and small

> "The maximum length of an entity property value is 32768 bytes."
> "The maximum length of an entity property key is 255 bytes."

Source: [Jira entity properties](https://developer.atlassian.com/cloud/jira/platform/jira-entity-properties/),
fetched 2026-08-18. That page lists the entity types carrying properties —
Comments, Dashboard items, Issues, Issue types, Projects, **Users**, Workflow
transitions, Boards, Sprints — so user properties are in scope of the limit.

Corroborated independently by the user-properties API group page, which states of
the value written by `PUT`: *"The value of the property must be a valid, non-empty
JSON value with a maximum length of 32768 bytes."* (That page's HTML could not be
fetched — see §1.5 — so this sentence is quoted from a search-result extraction of
it, which is why the same number is cited twice from two places.)

**Where the Cart falls against it.** `05a` §3.3 measured the real blob:

| Cart blob | Chars | Against 32768 |
| --- | --- | --- |
| 50 items | 5,900 | **18%** — fits, 5.5× headroom |
| ~277 items | ~32,700 | **the ceiling**, at 05a's measured ~118 chars/item |
| 1,000 items | 117,000 | **3.6× over** — not expressible in one property |
| 5,000 items | 586,000 | 18× over |

Two consequences, and the second is the one a build session would miss:

- The expected use — *"max 20 to 50 items, and maybe a few collections"* (`05` §8)
  — fits comfortably. One property holds it.
- **But the whole store is one blob, not one collection.** Four collections of 50
  items each is ~23.6 K chars: still inside, but at 1.4× headroom rather than 5×.
  A property is a *much* tighter box than `localStorage`, whose headroom `05a`
  measured at ~2.4 MB ≈ 10,000 items. `05`'s "the quota is a non-question" does not
  carry over to candidate C.

`⚠ UNVERIFIED` — whether *bytes* means UTF-8 bytes or UTF-16 code units. It says
bytes; `localStorage`'s ~5 MB counts UTF-16. The run below discriminates them with
a deliberately multi-byte payload, because a collection named in French or holding
a summary with a `—` in it lands on the difference.

### 1.2 A Jira administrator can read another user's properties

From the same user-properties group page: the **Administer Jira global
permission** is required to get, set or list a property on *any* user; **Access to
Jira** is required for the calling user's own record.

So the answer to `10` Q4's second half is **yes** — the property store is
administrator-readable by design. Collection *names* are the user's own words, and
they would be sitting in a place their Jira admin can read. Issue keys are not
sensitive; a collection called `Blocked on QA` is not either; a collection called
`People to talk to about leaving` is a different matter. This is a real difference
from `localStorage`, which no administrator can read remotely, and it belongs in
the decision rather than in a footnote.

### 1.3 Rate limits — published, but not published for this kind of caller

[Rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting/),
fetched 2026-08-18. Throttling signals are unambiguous: **`429 Too Many
Requests`**, with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset` and `RateLimit-Reason`. Per-second limits by method are given
as **GET 100, POST 100, PUT 50, DELETE 50**.

`⚠ UNVERIFIED for our caller.` That page is written for apps — its quotas are
counted in points against a Connect/Forge app's hourly pool, and it says *"API
token-based traffic is not affected by this change, and will continue to be
governed by existing burst rate limits"* without publishing a number for
session-cookie traffic from a browser. **No statement was found that user
properties are throttled differently from the rest of the API.**

It does not matter much either way at the Cart's volume — a debounced mirror writes
single-figure PUTs per minute against a documented 50/s — but a build session
should not read a number here as a promise.

### 1.4 Tampermonkey: the documentation is still unreadable, second confirmation

`https://www.tampermonkey.net/documentation.php` returns **its table of contents
only**; the API sections render client-side. This is the second independent
confirmation, after `07`. Recorded as unavailable and abandoned per the fetch
rules — no mirror was hunted.

The table of contents does carry two signatures verbatim, and they are worth
keeping because they are Tampermonkey's own words even if the prose around them
could not be read:

```
GM_setValue(key, value)
GM_addValueChangeListener(key, (key, old_value, new_value, remote) => void)
```

The `remote` argument existing at all is strong evidence that the listener
distinguishes *this tab* from *another tab*, which is the cross-tab facility
candidate B would need. **But it is an inference from a signature, not a
documented behaviour.**

`⚠ UNVERIFIED` — all three of `10` Q5's questions: whether `GM_setValue` is
synchronous, what `remote` actually means, and whether any size limit is
documented. The probe in Part 1b tests the first two as a side effect of testing
the clipboard.

### 1.5 What could not be read at all, and why it is recorded rather than guessed

| Question | Why unanswered |
| --- | --- |
| The exact v3 paths and verbs, and whether `accountId` is **required** or defaults to the caller | The REST reference HTML truncates before reaching any operation — the page opens with the whole API index as navigation. Tried twice, group page and anchored operation. `09a` hit this and escaped to the OpenAPI spec; that escape **also failed here** — `swagger-v3.v3.json` truncates inside its schema definitions, long before the alphabetically-late `/user/properties` paths |
| Whether a mutating `PUT` from the page needs `X-Atlassian-Token: no-check` | Not stated anywhere reachable. `01` §2 sent that header on its `POST` and **never isolated whether it was required** — so this is genuinely open, not merely unlooked-for |
| Whether user properties carry their own rate limit | Not found; see §1.3 |

The path *shape* is known from the group page's own example —
`PUT /rest/api/2/user/properties/{propertyKey}?accountId=5b10ac8d82e05b22cc7d4ef5`
— and `01` established `/rest/api/3/` as the live base. **The run settles the rest,
which is the right way round: `01`, `05a` and `09a` all corrected desk research
with a live run.**

---

## Part 2 — The snippet

Paste into the devtools console of **any logged-in Jira page** on your site. It
writes to your own Jira account's property store under `gt-jira-cart.probe`, and
**deletes the key at the end** — the last line re-reads it to prove it is gone. If
the run dies halfway, `Part 2c` below is the one-line cleanup.

It answers, in order: is `accountId` needed; is an XSRF header needed; does a
round trip preserve the blob exactly; where does the ceiling really bite and is it
counted in bytes or characters; how long does a write take; and does `DELETE`
work.

> **This is v2. Run 1 on 2026-08-18 aborted on a bug in v1** — `accountId` turned
> out to be mandatory on *every* user-properties call, and v1 appended it to only
> one, so every later call returned `400` and each conclusion drawn from those
> `400`s was false. See Part 3. v2 reads `accountId` first, puts it on every call,
> aborts rather than reporting a ceiling when nothing was written, guards the
> devtools-only `copy()`, and only runs the € test when the ASCII ceiling is high
> enough for it to discriminate.

```js
(async () => {
  const KEY = 'gt-jira-cart.probe';
  const BASE = location.origin + '/rest/api/3';
  const out = [];
  const say = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
  const finish = () => {
    const report = out.join('\n');
    // `copy` is a devtools console utility and is absent in a Sources snippet.
    try { copy(report); console.log('%cThe whole report is on your clipboard.', 'font-weight:bold'); }
    catch (e) { console.log('%ccopy() unavailable — select the block below.', 'font-weight:bold');
                console.log(report); }
  };

  // 01's rule: a response is data only when ok + json content-type + expected shape.
  async function call(method, path, { body, xsrf } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (xsrf) headers['X-Atlassian-Token'] = 'no-check';
    const t0 = performance.now();
    let res, text = '';
    try {
      res = await fetch(BASE + path, {
        method, headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      text = await res.text();
    } catch (e) {
      return { fail: String(e), ms: Math.round(performance.now() - t0) };
    }
    const ms = Math.round(performance.now() - t0);
    const ct = (res.headers.get('content-type') || '(none)').split(';')[0];
    let json = null;
    if (ct === 'application/json' && text) { try { json = JSON.parse(text); } catch {} }
    return { status: res.status, ok: res.ok, ct, ms, json,
             snip: text.slice(0, 200).replace(/\s+/g, ' ') };
  }
  const line = (label, r) => say(
    label.padEnd(34),
    String(r.status ?? 'FETCH-FAILED').padEnd(5),
    String(r.ct ?? '').padEnd(18),
    String(r.ms).padStart(5) + 'ms',
    r.ok ? '' : (r.snip || r.fail || '').slice(0, 120));

  // value of a given serialised length, in the given character
  const blob = (n, ch = 'a') => ({ pad: ch.repeat(Math.max(0, n - 10)) });
  const len = v => JSON.stringify(v).length;

  say('=== 10a — Jira user properties round trip (v2) ===');
  say('site:', location.origin, '| date:', new Date().toISOString());
  say('');
  say('LABEL'.padEnd(34), 'CODE '.padEnd(5), 'CONTENT-TYPE'.padEnd(18), '   TIME', 'NOTE');

  // --- Q1: who am I? Run 1 established accountId is mandatory -------------
  const me = await call('GET', '/myself');
  line('GET /myself', me);
  const accountId = me.json && me.json.accountId;
  say('accountId:', accountId || '(NOT READ)');
  if (!accountId) {
    say('ABORT — every property call needs accountId and it could not be read.');
    say('=== end ==='); finish(); return;
  }

  const A = encodeURIComponent(accountId);
  const P = `/user/properties/${KEY}?accountId=${A}`;   // one property
  const L = `/user/properties?accountId=${A}`;          // the key list

  const small = { v: 1, hello: 'jira-cart probe', items: ['RDC-14817', 'GLX-402'] };

  // Is the XSRF header needed once accountId is present?
  const noXsrf = await call('PUT', P, { body: small });
  line('PUT  accountId, NO xsrf', noXsrf);
  const wXsrf = await call('PUT', P, { body: small, xsrf: true });
  line('PUT  accountId + xsrf', wXsrf);
  const noAcct = await call('PUT', `/user/properties/${KEY}`, { body: small, xsrf: true });
  line('PUT  NO accountId (expect 400)', noAcct);

  say('');
  say('accountId REQUIRED?  ', noAcct.ok ? 'NO' : 'YES — reconfirmed');
  say('XSRF header REQUIRED?', noXsrf.ok ? 'NO — it worked without one'
        : (wXsrf.ok ? 'YES — only the header version worked' : 'INCONCLUSIVE — neither worked'));
  if (!noXsrf.ok && !wXsrf.ok) {
    say('ABORT — the property could not be written at all. Nothing below would mean anything.');
    say('=== end ==='); finish(); return;
  }
  const XSRF = !noXsrf.ok;          // send the header only if it was actually needed
  const opt = b => ({ body: b, xsrf: XSRF });
  say('sending the xsrf header from here on:', XSRF);

  // --- Q2: does the round trip preserve the blob exactly? -----------------
  const got = await call('GET', P);
  line('GET  the property back', got);
  const back = got.json && got.json.value;
  say('round trip identical?',
      JSON.stringify(back) === JSON.stringify(small) ? 'YES' : 'NO -> ' + JSON.stringify(back));

  const keys = await call('GET', L);
  line('GET  list of property keys', keys);
  const ks = (keys.json && keys.json.keys) || [];
  say('property keys on this account:', ks.length,
      ks.length ? '-> ' + ks.map(k => k.key).join(', ').slice(0, 300) : '');

  // --- Q3: where does the ceiling really bite, and in what unit? ----------
  say('');
  say('--- ceiling staircase (serialised chars of the JSON value) ---');
  const tried = [];
  for (const n of [8000, 32000, 32768, 32769, 40000, 131072]) {
    const v = blob(n);
    const r = await call('PUT', P, opt(v));
    tried.push([n, r.ok]);
    line(`PUT  ${String(len(v)).padStart(6)} chars`, r);
  }
  let lo = 0, hi = Infinity;
  if (!tried.some(t => t[1])) {
    say('EVERY size was refused — this is NOT a size result. Read the codes above before');
    say('concluding anything about a ceiling.');
  } else {
    for (const [n, ok] of tried) { if (ok) lo = Math.max(lo, n); else hi = Math.min(hi, n); }
    if (hi !== Infinity && hi - lo > 1) {
      say(`bracketed between ${lo} and ${hi} — bisecting`);
      let stop = 0;
      while (hi - lo > 1 && stop++ < 24) {
        const mid = (lo + hi) >> 1;
        const r = await call('PUT', P, opt(blob(mid)));
        if (r.ok) lo = mid; else hi = mid;
      }
    }
    say('LARGEST ACCEPTED (chars):', lo, '| smallest refused:', hi === Infinity ? 'none tried' : hi);

    // 3-byte characters: same char count, 3x the byte count. Only discriminates
    // if the ASCII ceiling is above the char count being sent.
    if (lo >= 20000) {
      const eu = await call('PUT', P, opt(blob(20000, '€')));
      line('PUT  20000 chars of € (60 KB)', eu);
      say('the limit counts:', eu.ok ? 'UTF-16 CHARS — 60 KB of bytes went in'
                                     : 'UTF-8 BYTES — 20 K chars refused at 60 KB');
    } else {
      say('€ test skipped — the ASCII ceiling (' + lo + ') is under 20000 chars, so');
      say('sending 20000 of anything could not tell chars from bytes.');
    }
  }

  // --- Q4: how long does a realistic write take? --------------------------
  say('');
  const real = blob(6000);
  const times = [];
  for (let i = 0; i < 3; i++) {
    const r = await call('PUT', P, opt(real));
    times.push(r.ok ? String(r.ms) : r.ms + '(FAILED ' + r.status + ')');
  }
  say('PUT of a realistic 6 K blob, 3 runs (ms):', times.join(', '));

  // --- Q5: clean up, and prove it -----------------------------------------
  const del = await call('DELETE', P, { xsrf: XSRF });
  line('DELETE the probe key', del);
  const gone = await call('GET', P);
  line('GET  it again (404 expected)', gone);
  say('cleaned up?', gone.status === 404 ? 'YES' : 'NO — run Part 2c by hand');

  say('');
  say('=== end — copy everything above ===');
  finish();
})();
```

### Part 2c — cleanup if the run dies halfway

```js
fetch(location.origin + '/rest/api/3/myself').then(r => r.json()).then(me =>
  fetch(location.origin + '/rest/api/3/user/properties/gt-jira-cart.probe?accountId='
        + encodeURIComponent(me.accountId),
        { method: 'DELETE', headers: { 'X-Atlassian-Token': 'no-check' } }))
  .then(r => console.log('deleted:', r.status));
```

*Corrected after run 1: the original omitted `accountId` and therefore always
returned `400`, which is how the probe key survived its own cleanup.*

---

## Part 2b — the `@grant` clipboard probe

`06`'s standing experiment, and the oldest open question in the effort. It cannot
be run from the console: the whole point is whether the write still works from
**inside Tampermonkey's sandbox**, which only a granted userscript is in.

> **The probe has been deleted.** It was throwaway, it ran on 2026-08-18 (runs 3,
> 4 and 5 above), and every answer it produced is recorded in Part 3. What follows
> describes what it did, for the record. **If it is ever needed again, git history
> holds it.**
>
> **Cleanup is uninstalling it from Tampermonkey, and nothing else** — a point
> worth stating because the first version of this note got it wrong and the user
> caught it. The probe's `gt-jira-cart.probe.grant` value was written with
> `GM_setValue`, so **it was never in `localStorage`**; looking for it there finds
> nothing, which is an incidental confirmation of the per-script isolation the
> verdict rests on. Uninstalling the script takes its values with it. The Jira-side
> `gt-jira-cart.probe` property was already removed by run 2's `DELETE` (`204`,
> confirmed `404`).

Install `.scratch/jira-cart/prototypes/10-grant-clipboard.probe.user.js`, open a
Jira page, and click the button it puts in the **bottom-left** corner (bottom-left
so it cannot be confused with `jira-ux`'s toolbar at the top-right or the Cart's
own future corner at the bottom-right). Then paste into something that shows rich
text — an email draft, Confluence — and something that shows plain text.

What to report:

1. The button's own label after the click: `OK write` / `FAIL write` / `OK
   writeText` / `FAIL both`.
2. Whether the **rich** paste arrives as a link and the **plain** paste as
   markdown — that is the dual-flavour `ClipboardItem` write the four formats need,
   and a `writeText` fallback would silently lose it.
3. The console lines beginning `[10-probe]`, which also report whether
   `GM_setValue` returned a promise.
4. **The cross-tab line.** Open a second Jira tab with the script installed, click
   the button there, and say whether the first tab logs
   `value change … remote: true`. That is `GM_addValueChangeListener`'s cross-tab
   behaviour, which no documentation could be read for (§1.4).

**Delete the script after reporting.** It says so in its own header.

---

## Part 3 — Your output

### Run 1 — 2026-08-18, `dalet.atlassian.net` — ABORTED BY A SNIPPET BUG

**One fact established, everything else void.** v1 of the snippet appended
`accountId` to exactly one call. `accountId` turns out to be mandatory on *every*
user-properties call, so all the others returned `400` — and the snippet then drew
conclusions from those `400`s as though they were answers.

**What the run did establish, and it holds:**

| | |
| --- | --- |
| `GET /rest/api/3/myself` | `200`, `application/json`, 109 ms |
| `accountId` | read successfully |
| `PUT /user/properties/{key}` with **no** `accountId` | **`400`** — `"The 'accountId' query parameter needs to be provided"` |
| …with no `accountId`, **with** the XSRF header | **`400`**, same message — the header does not substitute |
| …**with** `accountId` + XSRF | **`201 Created`, 302 ms** |

So: **`accountId` is required on every call, and with it the write works.** That is
the first hard confirmation that candidate C's store is reachable at all from the
page under `@grant none`.

**What was NOT established, despite the run printing an answer for each:**

| The run printed | Why it is void |
| --- | --- |
| `round trip identical? NO -> undefined` | the `GET` returned `400`, not a value |
| `property keys on this account: 0` | the list call returned `400` |
| `LARGEST ACCEPTED (chars): 0 \| smallest refused: 1` | every size returned `400` for a missing parameter, so the bisect collapsed onto nothing |
| `the limit counts: UTF-8 BYTES` | **false, and the most dangerous line in the output** — inferred from a `400` about `accountId`, not about size |
| `PUT of a realistic 6 K blob: 204, 209, 105 ms` | those are rejection round trips, not writes |
| `DELETE … 400` / `cleaned up? NO` | correct, and it had a consequence — see below |

**Two side effects worth recording:**

1. **The probe key survived its own cleanup.** The one successful `PUT` wrote
   `gt-jira-cart.probe` to the account; the `DELETE` omitted `accountId` and
   returned `400`. Part 2c's one-liner had the same omission, so it would have
   failed too. Both are corrected above.
2. **`copy is not defined`** — a devtools console utility that is absent in some
   console contexts. The report never reached the clipboard and had to be scrolled
   out by hand. v2 guards it and falls back to printing the report in one block.

**One design consequence to carry into the verdict, whatever the re-run says:**
the Cart cannot touch its own property store without knowing `accountId` first.
That is an extra `GET /myself` on a cold start — 109 ms here — before any read of
the mirror. It is cacheable (an `accountId` is stable per user per site), but the
first call of a session pays it, and a design that assumed the store was reachable
in one request needs adjusting.

**A third observation, incidental but consistent with `05a` §3.1:** every failed
request surfaced through `tsp.bundle.js`, so Atlassian wraps `fetch` on this
origin. It did not interfere — the failures were genuine `400`s from the API — but
it is a second instance of the platform-globals-are-replaced finding that `05a`
recorded for `localStorage`.

### Run 2 — 2026-08-18, `dalet.atlassian.net`, v2 snippet — CLEAN

Every call returned what it was asked for, the probe key was written and then
deleted, and the final `GET` returned `404`. Nothing is left on the account.

**Q1 — paths, verbs, and `accountId`.** All four operations confirmed live:

| Call | Result |
| --- | --- |
| `GET /rest/api/3/myself` | `200`, 201 ms — this is where `accountId` comes from |
| `PUT /rest/api/3/user/properties/{key}?accountId=…` | `200` |
| `GET /rest/api/3/user/properties/{key}?accountId=…` | `200`, 95 ms |
| `GET /rest/api/3/user/properties?accountId=…` | `200` — returns the key list |
| `DELETE /rest/api/3/user/properties/{key}?accountId=…` | `204`, 317 ms |
| `GET` after the delete | `404` — *"The property gt-jira-cart.probe does not exist."* |

**`accountId` is mandatory and does not default to the caller.** Omitting it
returns `400` — *"The 'accountId' query parameter needs to be provided"* — with or
without the XSRF header. **The Cart therefore cannot reach its own store in one
request from cold**: it needs `GET /myself` first, 201 ms here. An `accountId` is
stable per user per site so it caches, but the first call of a session pays it.

**Q2 — the ceiling is 32,768 bytes, and it counts BYTES, not characters.** The
staircase landed exactly on the boundary with no bisection needed:

| Serialised chars | Result |
| --- | --- |
| 8,000 | `200` |
| 32,000 | `200` |
| **32,768** | **`200` — the largest accepted** |
| **32,769** | **`400`** — *"The JSON data provided for the property is too long. Maximum length is 32,768 bytes."* |
| 40,000 | `400`, same message |
| 131,072 | `400`, same message |

**The unit is settled twice over, by the message text and by behaviour.** 20,000
characters of `€` — the same character count that passed easily in ASCII, but ~60 KB
in UTF-8 — was **refused with the same too-long error**. So a summary carrying
accents, em-dashes or emoji costs 2–3 bytes per such character, and the effective
item capacity is below any figure derived from character counts.

**What that buys, against `05a`'s own measurements.** `05a` put 1,000 items at
~117 K chars, so an item is ~117 bytes of ASCII, and **one property holds roughly
280 items**. K's grilling settled the mirror as **one property per collection with
no index**, so the ceiling is **per collection, not per cart**. The user's stated
scale — 20–50 items, ~6 K — sits at about a fifth of one property. The ceiling is
not a live constraint at the intended scale, and the number of collections is
unbounded by it.

**Q3 — the XSRF header is NOT required.** `PUT` with `accountId` and no
`X-Atlassian-Token` returned `200`. This is a real finding rather than a
documentation reading: Part 1 could not settle it, and a mutating call working on
the session cookie alone is what keeps candidate C inside `@grant none`.

**The round trip is exact.** The blob came back byte-identical — `round trip
identical? YES`.

**Q4 — a new observation the snippet was not looking for: the account already holds
37 properties**, all Atlassian's own — `ai-streaming-spotlight`,
`attachment-spotlight-seen`, `card-cover-spotlight-seen`,
`com.atlassian.jira.frontend.VisualRefreshIconCacheBuster:clear-cache-state`,
`coverable_analysis_settings_*` and others. **The Cart would be a guest in a
namespace Atlassian actively uses**, which makes `05`'s `gt-jira-cart.*` prefix
load-bearing rather than tidy, and means a bare `GET /user/properties` listing is
mostly other people's keys.

**Timing, for the write-behind design.** `PUT` of a realistic 6 K blob, three runs:
**184, 203, 270 ms**. Reads are quicker at 95 ms. So a mirror write is a fifth of a
second — comfortably behind an interaction, and impossible inside one.

### Run 3 — 2026-08-18, the `@grant` clipboard probe — THE ANSWER IS YES

```
[10-probe] clipboard.write RESOLVED — the dual flavour survived the grant
[10-probe] value change 1787041447270 -> 1787041573435 | remote: false
```

**Q6 is closed: a dual-flavour `ClipboardItem` write works from inside
Tampermonkey's sandbox under `@grant GM_setValue`.** The probe wrote `text/plain`
and `text/html` in one item — exactly `06`'s Links format — and the promise
resolved. It did not fall through to the `writeText` branch.

**This removes the last reason `04` gave for `@grant none`.** `04` named two:
page-context `history` for route detection, and the clipboard. `09` deleted the
first by dropping route detection entirely; this run deletes the second. **Nobody
has now named a cost for taking a grant.**

**Two things run 3 did NOT answer, and both are Q5:**

1. **Whether `GM_setValue` is synchronous.** Not in the captured output. **Answered
   by run 4 below — it is.**
2. **Whether the change listener crosses tabs.** The observed event was
   `remote: false`, which is the writing tab seeing its own write — correct, and
   expected, but silent on the question. `05` chose the `storage` event partly
   because it is *"emitted because the write happened"*; B's equivalent needs the
   same property demonstrated, not assumed.

### Run 4 — 2026-08-18, probe v0.2 — `GM_setValue` IS SYNCHRONOUS

```
Q5a GM_setValue SYNCHRONOUS? YES — returned a non-promise and the value was
readable immediately | returned: undefined | thenable: false
| readBack === stamp: true | readBack: 1787043909591
```

It returns `undefined`, not a promise, and the value is readable on the very next
line. **Candidate B therefore inherits `05`'s model unchanged.** Read-modify-write
stays synchronous, `04`'s synchronous copy-out stays legal, and nothing in the write
path becomes async. B is not a redesign of `05` — it is a substitution of two
function calls, `localStorage.getItem`/`setItem` → `GM_getValue`/`GM_setValue`.

**And a rule from the user that the ADR must carry, because it is exactly the kind
of thing a build session gets wrong by reaching for the newer-looking API:**

> **Tampermonkey exposes both. `GM_setValue` is the synchronous variant;
> `GM.setValue` is the promise-based one.** They are not stylistic alternatives
> here. `GM.setValue` would put an `await` inside the copy handler and re-open the
> exact failure `04` §3 closed — a clipboard write landing after the transient user
> activation window, failing intermittently and silently. **Use the `GM_*` forms.
> Never the `GM.*` forms.**

That belongs beside the `navigator.permissions.query` scar in the spec: same shape
of bug, same silence, and the same reason it is worth writing down rather than
leaving to taste.

*One cosmetic artefact of the probe, so nobody reads it as a fault: the `%c`
style directives print literally, because the probe's `log()` helper prepends
`[10-probe]` and `%c` is only honoured in `console.log`'s first argument. The data
is unaffected.*

**And one gap neither run covers: `bulkfetch` under a grant.** `01` proved it under
`@grant none`. In Tampermonkey's sandbox the script's `fetch` is reached through a
proxied `window`, and while a same-origin call should still carry the session
cookie, that is reasoning rather than measurement. B needs it, because gap-fill and
refresh both depend on it.

---

### Run 5 — 2026-08-18, probe v0.2 — BOTH REMAINING UNKNOWNS CLEAR

**Q6b — `bulkfetch` survives the sandbox.**

```
Q6b bulkfetch UNDER A GRANT? YES — authenticated and correctly shaped
| status: 200 | content-type: application/json | shape ok: true
| keys sent: RDC-29862, ZZZZ-999999 | issues returned: 1
```

`01` rule 2's three-part validation passed in full: `ok`, `application/json`, and
the `{issues, issueErrors}` shape. The session cookie carries into Tampermonkey's
sandbox, so gap-fill and refresh have their transport under a grant. **This was the
one measurement that could have killed candidate B, and it did not.**

**A second finding fell out of it for free: `01` rule 3 is re-confirmed live.** Two
keys were sent — the real `RDC-29862` and the deliberately absent `ZZZZ-999999` —
and **one issue came back**. The missing key was omitted silently rather than
reported in `issueErrors`, exactly as `01` found and made a standing rule. That rule
now has a second independent observation, taken 2026-08-18 under a grant rather than
under `@grant none`.

**Q5b — the change listener does cross tabs.**

```
tab B (the writer): Q5b value change 1787056776618 -> 1787056796607 | remote: false (this tab wrote it)
tab A (the other):  Q5b value change 1787056776618 -> 1787056796607 | remote: true  <-- CROSS-TAB CONFIRMED
```

Both tabs saw the same transition, and the non-writing tab received `remote: true`.
So `GM_addValueChangeListener` gives B the property `05` §5 valued in the `storage`
event — it is emitted *because the write happened*, and the writing tab can
distinguish its own write from another's, which the `storage` event does only by
not firing at all.

**One qualification, observed but not measured:** the user reports tab A received
the event *"after a short time"* rather than immediately. Tampermonkey's listener
crosses through the extension rather than through the page, so some latency is
expected. It is not quantified here, and **it does not need to be** — `05` §5 made
the notification a freshness hint rather than the correctness mechanism, so a late
event costs a late redraw and nothing else.

**The clipboard result reproduced** in tab B on a second machine-day, so run 3 was
not a one-off.

## Part 4 — What the runs settled

**The clipboard survives a `@grant`.** That is the sentence this Part exists to
carry, and it has been outstanding since `06` opened it, `08` left it alone, and
`10` finally ran it. A `text/plain` + `text/html` `ClipboardItem` write resolved
from inside Tampermonkey's sandbox under `@grant GM_setValue`.

**The consequence is larger than the fact.** `04` gave exactly two reasons to hold
`@grant none`. `09` deleted the first by dropping route detection. This run deletes
the second. **So the platform pile that `04`, `05`, `07` and `06` spent four
tickets accumulating is closed on its own terms: nothing anyone has named now costs
anything to take a grant** — and runs 4 and 5 then closed the three gaps this
paragraph originally hung on.

**That reframes the ticket.** `10` was written expecting the interesting fight to be
between A and C, because B was suspected of breaking the clipboard. It does not. So
the real comparison is now B against C, and it is lopsided in a way the ticket did
not anticipate:

| | B — Tampermonkey storage | C — `localStorage` + Jira properties |
| --- | --- | --- |
| Survives logout / history cleanup | Yes | Yes |
| Values that can disagree | **None** | **Two copies** — the crux `05` spent a session deleting |
| Network in the write path | **None** | ~200 ms `PUT`, measured |
| Reconciliation rule needed | **No** | Yes, plus three gates and a reversal of `05` §5 on `navigator.locks` |
| Size ceiling | Undocumented, unreadable (`07`, Part 1.4) | **32,768 bytes per collection**, measured, counted in bytes |
| Cold start | Local | **Two requests** — `GET /myself`, then the property |
| Reaches Bitbucket | **Yes** | No — it is a Jira API |
| Cross-machine | Only via TM cloud sync | **Yes, inherently** |
| Grant | `GM_setValue` + friends | `@grant none` |

**C's entire complexity exists to avoid a grant that now appears to be free.**
Candidate C is a well-designed answer — K's grilling specified it in full, and the
user's two corrections (*one pair of hands*, *tens of tabs*) sharpened it — but
every hard part of it is bought by refusing the grant: the two copies, the
reconciliation rule, the gates, the `navigator.locks` reversal, the byte ceiling,
the two-request cold start. If the grant is free, so is not needing any of them.

**What C still has that B does not: cross-machine sync without asking anything of
Tampermonkey.** That is a genuine advantage and it is the only one left. Whether it
outweighs a second copy of the user's data is the verdict question, and it is the
user's.

**All three unknowns are now measured, and all three went B's way.**

| Question | Result | Run |
| --- | --- | --- |
| Does a dual-flavour `ClipboardItem` write survive a grant? | **Yes** | 3, reproduced in 5 |
| Is `GM_setValue` synchronous? | **Yes** — returns `undefined`, readable immediately | 4 |
| Does `bulkfetch` survive the sandbox? | **Yes** — `200`, JSON, correct shape | 5 |
| Does `GM_addValueChangeListener` cross tabs? | **Yes** — `remote: true` on the non-writing tab | 5 |

**So candidate B costs a `@grant` line and nothing else that anyone has named**, and
four tickets' worth of accumulated suspicion about the grant turns out to have been
about one thing — the clipboard — which was never tested until now.

**Three consequences worth stating separately:**

1. **`05`'s model transfers unchanged.** `GM_setValue` being synchronous means
   read-modify-write stays synchronous and copy-out stays inside its user
   activation. B is a substitution of two function calls, not a redesign. The
   matching rule, from the user: **use `GM_*`, never `GM.*`** — the dotted forms are
   promise-based and would re-open `04` §3's silent clipboard failure.
2. **`05` §5's cross-tab story transfers too**, and with a small improvement: the
   `storage` event tells a tab nothing about its own write by not firing, whereas
   `GM_addValueChangeListener` fires with `remote: false`. Same information, less
   inference.
3. **C's every hard part was price paid to avoid a grant that is free.** The two
   copies, the reconciliation rule, the three gates, the `navigator.locks` reversal
   of `05` §5, the 32,768-byte ceiling and the two-request cold start all exist
   because C refuses the grant. Nothing else buys them anything.

**What C still has that B does not, and it is now the whole of C's case:
cross-machine sync that asks nothing of Tampermonkey.** B reaches another machine
only through Tampermonkey's own cloud sync, which is an opt-in the user must
configure. Whether that outweighs a second copy of the user's data is the verdict
question, and it is the user's.

**One thing about B is unmeasured, deliberately: its size ceiling.** Part 1.4
records Tampermonkey's documentation as unreadable, and no probe measured where
`GM_setValue` refuses a value. `05` §8 set the precedent for not chasing this — at
the user's stated 20–50 items, ~6 K, *"no cap, no warning threshold, no soft
limit"* — and B's backing store is the extension's own, not a 5 MB per-origin quota.
Recorded as a known gap rather than an oversight. C's ceiling, by contrast, **is**
measured and **is** small enough to state: 32,768 bytes per collection.

**And one residual risk that no probe covers:** `08`'s prototype and all its
findings were obtained under `@grant none`. Its layout, positioning and remount
results are DOM and CSS behaviour, which the sandbox does not touch, so they should
transfer — but "should" is reasoning, and the build session is where it gets
confirmed.

## Part 5 — Candidate C, preserved for reconsideration

**C was not chosen. It was not disproved.** The user's instruction on taking the
verdict: *"record the research we did about the Jira properties so in the future we
might reconsider it."* This Part exists so a later effort does not have to re-run
five probes and a grilling to get back to where this one finished.

### What is measured and can be trusted

Every number here was taken live on `dalet.atlassian.net`, 2026-08-18, and is
recorded with its run above.

| | |
| --- | --- |
| Endpoint | `/rest/api/3/user/properties/{key}?accountId=…` |
| Verbs confirmed | `PUT` `200`, `GET` `200`, `DELETE` `204`, `GET` after delete `404`, list via `GET /user/properties?accountId=…` |
| `accountId` | **mandatory** — does not default to the caller. `GET /myself` supplies it, ~200 ms, cacheable per user per site |
| XSRF header | **not required** — the session cookie alone is enough for a mutating call |
| Size ceiling | **32,768 bytes**, exact — 32,768 accepted, 32,769 refused |
| Unit | **bytes, not characters** — 20,000 `€` (~60 KB) refused while 32,768 ASCII passed |
| Round trip | **exact** — the blob returned byte-identical |
| Write latency | 184 / 203 / 270 ms for a 6 K blob |
| Read latency | ~95 ms |
| Neighbours | the account already carries **37** Atlassian-owned properties |

Capacity, against `05a`'s measurements: ~117 bytes per ASCII item, so **~280 items
per property**, and K settled the layout as **one property per collection with no
index**, so the ceiling is per collection. Accented or emoji summaries cost 2–3
bytes per such character and reduce that.

### What is designed and does not need redesigning

`10`'s Q7–Q10b grilling specified C in full and two user corrections shaped it:
**"one pair of hands"** removed every clock and every merge from the reconciliation
rule, and **"tens of tabs"** forced three gates plus a reversal of `05` §5's
rejection of `navigator.locks`, for the mirror only. An index-plus-parts layout was
refused on `05` §2's own grounds. That design is in the ticket and stands.

### What would bring C back

1. **Cross-machine sync becomes a requirement rather than a nicety.** This is C's
   only remaining advantage over B and the reason it was close. B reaches another
   machine only through Tampermonkey's own cloud sync, which the user must
   configure.
2. **Tampermonkey stops being the delivery mechanism** — a different manager with
   different storage guarantees, or a move to a browser extension, which would
   change the comparison entirely.
3. **A collection needs to be readable by something that is not this browser** — a
   dashboard, a colleague, a script. A user property is server-side; Tampermonkey
   storage is not.

### What would need re-measuring first

The API surface, because none of it is guaranteed stable: the `accountId`
requirement, the XSRF answer, and above all **the 32,768-byte ceiling**, which is
the number most likely to move and the one C's whole layout is built around. Part 2's
v2 snippet re-runs all of it in one paste and cleans up after itself.

### What is NOT preserved, because it never existed

C was never built. There is no prototype, no partial implementation, and no
measurement of the reconciliation rule under real use — only its design. A revival
starts from a specification, not from code.

---

**Q7–Q10b's design for C stays on the record rather than being deleted** — see
Part 5 above for why, and for what would bring it back.
