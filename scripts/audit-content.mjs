import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  CATEGORY_SCHEMAS,
  inferStructuredFields,
  normalizeBody,
  validateEntry
} from "./content-schema.mjs";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const reportPath = path.join(repoRoot, "content/data/content-audit.json");

const report = [];

for (const category of Object.keys(CATEGORY_SCHEMAS)) {
  const categoryDir = path.join(contentRoot, category);
  if (!fs.existsSync(categoryDir)) continue;

  for (const fileName of fs.readdirSync(categoryDir)) {
    if (!fileName.endsWith(".mdx")) continue;

    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const parsed = matter(source);
    const normalizedBody = normalizeBody(parsed.content, category);
    const inferred = inferStructuredFields(parsed.data, normalizedBody, category);
    const validation = validateEntry(category, parsed.data, inferred);

    report.push({
      category,
      filePath: path.relative(repoRoot, filePath),
      slug: String(parsed.data.slug ?? fileName.replace(/\.mdx$/, "")),
      metadataOnly: !normalizedBody.trim(),
      missingRequired: validation.missingRequired,
      missingRecommended: validation.missingRecommended
    });
  }
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const requiredIssues = report.filter((item) => item.missingRequired.length > 0).length;
const recommendedIssues = report.filter((item) => item.missingRecommended.length > 0).length;
const metadataOnly = report.filter((item) => item.metadataOnly).length;

console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);
console.log(`Entries with missing required fields: ${requiredIssues}`);
console.log(`Entries with missing recommended fields: ${recommendedIssues}`);
console.log(`Metadata-only entries: ${metadataOnly}`);
