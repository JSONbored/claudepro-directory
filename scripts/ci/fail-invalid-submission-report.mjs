import fs from "node:fs";

const reportPath = ".github/tmp/submission-validation.json";

if (!fs.existsSync(reportPath)) {
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

if (!report.skipped && !report.ok) {
  console.error("Submission issue validation failed.");
  process.exit(1);
}
