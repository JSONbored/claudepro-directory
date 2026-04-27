import fs from "node:fs";
import path from "node:path";

import {
  recommendedSubmissionLabels,
  validateSubmission,
} from "@heyclaude/registry/submission";

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return "";
  return process.argv[idx + 1] ?? "";
}

const issuePath = argValue("--issue-json");
const outputPath = argValue("--output");

if (!issuePath || !outputPath) {
  console.error(
    "Usage: node scripts/validate-submission-issue.mjs --issue-json <path> --output <path>",
  );
  process.exit(1);
}

const issue = JSON.parse(fs.readFileSync(issuePath, "utf8"));
const report = validateSubmission(issue);
const output = {
  ...report,
  recommendedLabels: recommendedSubmissionLabels(issue, report),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

if (!report.ok) {
  process.exit(1);
}
