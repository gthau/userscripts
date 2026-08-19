// The machinery the two harnesses beside this file share: find a Chrome, run a
// page in it, read one line of JSON back out. Not named `-smoke.mjs`, so
// `run.mjs` does not try to run it as a harness of its own.
//
// This is the only part of these harnesses that is not a plain assertion, and it
// exists because both questions genuinely need a browser. Does React keep the
// server-rendered DOM, or throw it away? Does the toolbar land beside the
// breadcrumbs? Neither has an answer in Node: jsdom has no hydration and no
// layout, so a harness written against it would pass whatever the script did.
// See the README beside this file for what that buys and what it costs.
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

// THE ONE SEAM BETWEEN THESE HARNESSES AND THE CODE. Resolved from this file
// rather than from the working directory, so they run from anywhere -- and if
// the script ever moves, THIS LINE AND THIS LINE ALONE has to change.
const SRC = import.meta.dirname + "/../../src/jira-ux-improvements.user.js";

export const source = () => readFileSync(SRC, "utf8");

// Every edit these harnesses make to the code under test goes through here, and
// each one must match exactly once. A rename in the script therefore breaks the
// harness loudly instead of quietly testing a string that no longer exists.
export function patch(text, edits) {
  for (const [from, to] of edits) {
    const count = text.split(from).length - 1;
    if (count !== 1) {
      throw new Error(`patch matched ${count} times, expected 1:\n  ${from}`);
    }
    text = text.replace(from, to);
  }
  return text;
}

// A `file://` page cannot have `/browse/ABC-123` as its whole pathname, and the
// script's route test is anchored at the start of one. Chrome in this repository's
// environment will not load `http://127.0.0.1`, so serving the fixture instead was
// not an option. Unanchoring the pattern is the smallest edit that opens the route
// gate, and it leaves everything these harnesses actually ask about untouched.
export const UNANCHOR_ROUTE = [
  ["const ISSUE_PATH_RE = /^\\/browse\\/", "const ISSUE_PATH_RE = /\\/browse\\/"],
];

// Reads a `const NAME = 5_000;` out of the script, so a harness that waits for one
// of the backstops waits exactly as long as the script makes it wait.
export function constant(text, name) {
  const match = text.match(new RegExp(`^  const ${name} = ([0-9_]+);`, "m"));
  if (!match) throw new Error(`no constant ${name} in the script`);
  return Number(match[1].replaceAll("_", ""));
}

const CHROMES = [
  process.env.CHROME,
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
].filter(Boolean);

export function findChrome() {
  for (const name of CHROMES) {
    const found = spawnSync("which", [name], { encoding: "utf8" });
    if (found.status === 0) return found.stdout.trim();
  }
  return null;
}

// React is downloaded once and cached in the system temp directory rather than
// committed: this repository has no dependencies and is not about to start, and
// 1MB of somebody else's development build is not a thing to keep in it. No
// network and no cache means the hydration harness skips, and says so.
const REACT_VERSION = "18.3.1";
const CACHE = `${tmpdir()}/jira-ux-harness-react-${REACT_VERSION}`;

export async function react() {
  const wanted = {
    "react.js": `https://unpkg.com/react@${REACT_VERSION}/umd/react.development.js`,
    "react-dom.js": `https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.development.js`,
  };
  const out = {};
  mkdirSync(CACHE, { recursive: true });

  for (const [name, url] of Object.entries(wanted)) {
    const path = `${CACHE}/${name}`;
    if (!existsSync(path)) {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        writeFileSync(path, Buffer.from(await response.arrayBuffer()));
      } catch {
        return null;
      }
    }
    out[name] = readFileSync(path, "utf8");
  }
  return out;
}

// Runs one page and returns whatever it wrote after `RESULT:`. The page lives at
// `<pagePath>/index.html` and its assets sit beside it, so every `src` in the
// fixture is a bare filename and no relative depth has to be counted.
//
// `--virtual-time-budget` is what makes a harness that waits five seconds for the
// script's backstop cost no wall clock: Chrome runs the timers as fast as it can
// rather than in real time.
export function runFixture({ chrome, pagePath, html, files = {}, budgetMs }) {
  const dir = mkdtempSync(`${tmpdir()}/jira-ux-harness-`);
  try {
    const pageDir = `${dir}/${pagePath}`;
    mkdirSync(pageDir, { recursive: true });
    for (const [name, text] of Object.entries(files)) writeFileSync(`${pageDir}/${name}`, text);
    writeFileSync(`${pageDir}/index.html`, html);

    const run = spawnSync(
      chrome,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--allow-file-access-from-files",
        // Chrome reaches for the system keyring on startup to unlock its password
        // store, and on a desktop that means a gnome-keyring dialog in front of
        // whoever happens to be sitting there. A harness has no passwords to keep
        // and no business asking. `basic` keeps the store in the throwaway profile
        // below, where it is deleted with everything else.
        "--password-store=basic",
        "--disable-features=PasswordManager",
        // A profile of its own, inside the fixture directory, for the same reason:
        // without one Chrome opens the real profile, which is what the keyring
        // belongs to -- and a browser the user already has open holds a lock on it.
        `--user-data-dir=${dir}/chrome-profile`,
        "--no-first-run",
        "--no-default-browser-check",
        `--virtual-time-budget=${budgetMs}`,
        "--dump-dom",
        `file://${pageDir}/index.html`,
      ],
      { encoding: "utf8", timeout: 120_000 },
    );

    const found = (run.stdout ?? "").match(/RESULT:(\{.*?\})</);
    if (!found) {
      throw new Error(
        `the fixture reported nothing.\n  chrome exit: ${run.status}\n  stderr: ${(run.stderr ?? "").slice(0, 400)}`,
      );
    }
    return JSON.parse(found[1]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// The same reporter the Jira Cart harnesses use, so the output of the two
// directories reads the same and `run.mjs` can count either.
export function reporter() {
  const state = { fails: 0 };
  const is = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) {
      state.fails++;
      console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`);
    } else console.log(`ok   ${label}`);
  };
  const done = () => {
    console.log(state.fails ? `\n${state.fails} FAILED` : "\nall passed");
    process.exit(state.fails ? 1 : 0);
  };
  return { is, done };
}

// A harness that cannot run at all says so in one line and exits clean. It reports
// no checks, which is the signal to look at why -- `run.mjs` prints the count.
export function skip(reason) {
  console.log(`SKIP ${reason}`);
  process.exit(0);
}
