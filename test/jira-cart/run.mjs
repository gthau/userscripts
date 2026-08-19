// Runs every harness beside this file and reports one total.
//
//     node test/jira-cart/run.mjs
//
// There is no test framework and no `package.json` in this repository, and this is
// not the beginning of one: it is a `for` loop that was being typed by hand. Each
// harness is still a standalone file that runs on its own, which is the property
// that matters when one of them fails and you want only that one.
//
// Exit code is the number of failing FILES, so it is usable from a hook or a CI step
// without parsing the output.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const here = import.meta.dirname;

// Alphabetical, so the order is stable and nothing depends on it. Every harness is
// independent: none of them shares state with another, and each reads the script
// from disk itself.
const harnesses = readdirSync(here)
  .filter((name) => name.endsWith("-smoke.mjs") || name === "smoke.mjs")
  .sort();

let checks = 0;
let failedFiles = 0;
const failures = [];

for (const name of harnesses) {
  const run = spawnSync(process.execPath, [`${here}/${name}`], { encoding: "utf8" });
  const out = (run.stdout ?? "") + (run.stderr ?? "");
  const lines = out.split("\n");
  const ok = lines.filter((line) => line.startsWith("ok ")).length;
  const bad = lines.filter((line) => line.startsWith("FAIL")).length;
  checks += ok;

  // A harness that threw before it could report is a failure too, and its exit code
  // is the only thing that says so -- it may have printed no FAIL line at all.
  const passed = run.status === 0 && bad === 0;
  if (!passed) {
    failedFiles += 1;
    failures.push({ name, out });
  }
  console.log(`${passed ? "ok  " : "FAIL"} ${name.padEnd(16)} ${String(ok).padStart(3)} checks${bad ? `, ${bad} failed` : ""}`);
}

// The failing output is repeated at the end rather than inline, so the summary above
// stays readable when one file fails late.
for (const { name, out } of failures) {
  console.log(`\n---- ${name} ----`);
  console.log(out.trimEnd());
}

console.log(
  `\n${harnesses.length} harnesses, ${checks} checks${failedFiles ? `, ${failedFiles} FILE(S) FAILED` : ", all passed"}`,
);
process.exit(failedFiles);
