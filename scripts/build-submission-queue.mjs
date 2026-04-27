import fs from "node:fs";
import path from "node:path";

import { buildSubmissionQueue } from "@heyclaude/registry/submission";

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return "";
  return process.argv[idx + 1] ?? "";
}

const issuesPath = argValue("--issues-json");
const outputPath = argValue("--output");

if (!issuesPath || !outputPath) {
  console.error(
    "Usage: node scripts/build-submission-queue.mjs --issues-json <path> --output <path>",
  );
  process.exit(1);
}

const issues = JSON.parse(fs.readFileSync(issuesPath, "utf8"));
if (!Array.isArray(issues)) {
  console.error("issues-json must be an array of GitHub issue objects");
  process.exit(1);
}

const queue = buildSubmissionQueue(issues);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(queue, null, 2)}\n`);
console.log(
  `Wrote ${queue.count} submission queue entries to ${path.relative(process.cwd(), outputPath)}`,
);
