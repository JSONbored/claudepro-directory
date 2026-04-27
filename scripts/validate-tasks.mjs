import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const tasksPath = path.join(repoRoot, "TASKS.md");

const requiredSections = [
  "Current Gate",
  "V2.1 Hardening",
  "Registry/API",
  "SEO + Content Quality",
  "UGC Growth",
  "Raycast",
  "Commercial Surfaces",
  "Testing/CI/Trunk",
  "Future Moat",
];

const forbiddenBenchmarkNames = [
  String.fromCharCode(
    99,
    117,
    114,
    115,
    111,
    114,
    46,
    100,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
  ),
  String.fromCharCode(
    67,
    117,
    114,
    115,
    111,
    114,
    32,
    68,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
  ),
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(tasksPath)) {
  fail("TASKS.md is missing.");
  process.exit();
}

const tasks = fs.readFileSync(tasksPath, "utf8");

for (const section of requiredSections) {
  if (!tasks.includes(`## ${section}`)) {
    fail(`TASKS.md is missing section: ${section}`);
  }
}

for (const forbiddenName of forbiddenBenchmarkNames) {
  if (tasks.toLowerCase().includes(forbiddenName.toLowerCase())) {
    fail("TASKS.md contains an internal benchmark name.");
  }
}

const lines = tasks.split("\n");
const completedLines = lines.filter((line) => line.trim().startsWith("- [x]"));
if (!completedLines.length) {
  fail("TASKS.md has no completed items with evidence.");
}

for (const line of completedLines) {
  if (!line.includes("Evidence:") || !line.includes("`")) {
    fail(`Completed TASKS.md item lacks command evidence: ${line.trim()}`);
  }
}

const pendingEvidenceLines = lines.filter((line) =>
  /^- \[[ ~]\]/.test(line.trim()),
);
for (const line of pendingEvidenceLines) {
  if (line.includes("Evidence:")) {
    fail(
      `Non-complete TASKS.md item should not claim evidence: ${line.trim()}`,
    );
  }
}

if (process.exitCode) process.exit(process.exitCode);

console.log(`Validated ${completedLines.length} completed TASKS.md items.`);
