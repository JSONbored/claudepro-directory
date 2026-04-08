import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  CATEGORY_SCHEMAS,
  FORBIDDEN_CONTENT_FIELDS,
  inferSectionBooleans,
  inferStructuredFields,
  normalizeBody,
  validateEntry
} from "./content-schema.mjs";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const strictRecommended = process.argv.includes("--strict-recommended");

const failures = [];
const warnings = [];
let filesChecked = 0;

for (const category of Object.keys(CATEGORY_SCHEMAS)) {
  const categoryDir = path.join(contentRoot, category);
  if (!fs.existsSync(categoryDir)) continue;

  for (const fileName of fs.readdirSync(categoryDir)) {
    if (!fileName.endsWith(".mdx")) continue;

    filesChecked += 1;

    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const parsed = matter(source);
    const normalizedBody = normalizeBody(parsed.content, category);
    const inferred = inferStructuredFields(parsed.data, normalizedBody, category);
    const validation = validateEntry(category, parsed.data, inferred);
    const sectionFlags = inferSectionBooleans(normalizedBody);

    const entry = `${category}/${fileName}`;

    if (!normalizedBody.trim()) {
      failures.push(`${entry}: metadata-only content is not allowed`);
    }

    if (validation.missingRequired.length > 0) {
      failures.push(
        `${entry}: missing required fields -> ${validation.missingRequired.join(", ")}`
      );
    }

    if (validation.missingRecommended.length > 0) {
      const message = `${entry}: missing recommended fields -> ${validation.missingRecommended.join(", ")}`;
      if (strictRecommended) {
        failures.push(message);
      } else {
        warnings.push(message);
      }
    }

    for (const field of FORBIDDEN_CONTENT_FIELDS) {
      if (parsed.data[field] !== undefined) {
        failures.push(`${entry}: forbidden field present -> ${field}`);
      }
    }

    if (parsed.data.category && String(parsed.data.category).trim() !== category) {
      failures.push(
        `${entry}: category mismatch (frontmatter="${String(parsed.data.category).trim()}" folder="${category}")`
      );
    }

    if (
      category === "guides" &&
      parsed.data.copySnippet &&
      String(parsed.data.copySnippet).trim()
    ) {
      failures.push(`${entry}: guides must not include copySnippet`);
    }

    if (
      category === "collections" &&
      parsed.data.copySnippet &&
      String(parsed.data.copySnippet).trim()
    ) {
      failures.push(`${entry}: collections must not include copySnippet`);
    }

    if (parsed.data.hasPrerequisites === false && sectionFlags.hasPrerequisites) {
      failures.push(`${entry}: hasPrerequisites=false but Prerequisites section exists`);
    }

    if (parsed.data.hasTroubleshooting === false && sectionFlags.hasTroubleshooting) {
      failures.push(`${entry}: hasTroubleshooting=false but Troubleshooting section exists`);
    }

    const downloadUrl = String(parsed.data.downloadUrl ?? "").trim();
    if (downloadUrl) {
      const localDownload = downloadUrl.startsWith("/downloads/");
      if (category === "skills" && !downloadUrl.endsWith(".zip")) {
        failures.push(`${entry}: skills downloadUrl must end with .zip`);
      }
      if (category === "mcp" && !downloadUrl.endsWith(".mcpb")) {
        failures.push(`${entry}: mcp downloadUrl must end with .mcpb`);
      }
      if (localDownload && parsed.data.packageVerified !== true) {
        failures.push(`${entry}: local /downloads package must set packageVerified: true`);
      }
    }
  }
}

console.log(`Validated ${filesChecked} content files.`);

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings.slice(0, 50)) console.log(`- ${warning}`);
  if (warnings.length > 50) {
    console.log(`...and ${warnings.length - 50} more warnings`);
  }
}

if (failures.length > 0) {
  console.error(`Failures (${failures.length}):`);
  for (const failure of failures.slice(0, 100)) console.error(`- ${failure}`);
  if (failures.length > 100) {
    console.error(`...and ${failures.length - 100} more failures`);
  }
  process.exit(1);
}

console.log("Content validation passed.");
