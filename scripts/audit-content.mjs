import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  CATEGORY_SCHEMAS,
  DEFAULT_DIRECTORY_REPO_URL,
  FORBIDDEN_CONTENT_FIELDS,
  inferSectionBooleans,
  inferStructuredFields,
  normalizeBody,
  validateEntry
} from "@heyclaude/registry/content-schema";

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
    const sectionFlags = inferSectionBooleans(normalizedBody);
    const issues = [];

    if (parsed.data.repoUrl === DEFAULT_DIRECTORY_REPO_URL) {
      issues.push("uses_default_directory_repo_url");
    }

    if (String(parsed.data.description ?? "").trim().length > 320) {
      issues.push("description_too_long");
    }

    if (!String(parsed.data.seoTitle ?? "").trim()) {
      issues.push("missing_seoTitle");
    }

    if (!String(parsed.data.seoDescription ?? "").trim()) {
      issues.push("missing_seoDescription");
    }

    if (!Array.isArray(parsed.data.keywords) || parsed.data.keywords.length === 0) {
      issues.push("missing_keywords");
    }

    if (/claudepro\.directory|Claude Pro Directory/i.test(source)) {
      issues.push("old_brand_or_domain_reference");
    }

    if (/\[Script content from first example\]/.test(source)) {
      issues.push("placeholder_script_marker");
    }

    if (parsed.data.category && String(parsed.data.category).trim() !== category) {
      issues.push("category_mismatch");
    }

    for (const field of FORBIDDEN_CONTENT_FIELDS) {
      if (parsed.data[field] !== undefined) {
        issues.push(`forbidden_field_${field}`);
      }
    }

    if (
      category === "guides" &&
      parsed.data.copySnippet &&
      String(parsed.data.copySnippet).trim()
    ) {
      issues.push("guide_copy_snippet_present");
    }

    if (
      category === "collections" &&
      parsed.data.copySnippet &&
      String(parsed.data.copySnippet).trim()
    ) {
      issues.push("collection_copy_snippet_present");
    }

    if (parsed.data.hasPrerequisites === false && sectionFlags.hasPrerequisites) {
      issues.push("hasPrerequisites_false_but_section_exists");
    }

    if (parsed.data.hasTroubleshooting === false && sectionFlags.hasTroubleshooting) {
      issues.push("hasTroubleshooting_false_but_section_exists");
    }

    report.push({
      category,
      filePath: path.relative(repoRoot, filePath),
      slug: String(parsed.data.slug ?? fileName.replace(/\.mdx$/, "")),
      sourceType:
        String(parsed.data.repoUrl ?? "").trim() || String(parsed.data.documentationUrl ?? "").trim()
          ? "external"
          : "first_party",
      metadataOnly: !normalizedBody.trim(),
      missingRequired: validation.missingRequired,
      missingRecommended: validation.missingRecommended,
      issues
    });
  }
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const requiredIssues = report.filter((item) => item.missingRequired.length > 0).length;
const recommendedIssues = report.filter((item) => item.missingRecommended.length > 0).length;
const metadataOnly = report.filter((item) => item.metadataOnly).length;
const semanticIssues = report.filter((item) => item.issues.length > 0).length;

console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);
console.log(`Entries with missing required fields: ${requiredIssues}`);
console.log(`Entries with missing recommended fields: ${recommendedIssues}`);
console.log(`Metadata-only entries: ${metadataOnly}`);
console.log(`Entries with semantic issues: ${semanticIssues}`);
