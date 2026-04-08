import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  CATEGORY_SCHEMAS,
  DEFAULT_DIRECTORY_REPO_URL,
  deriveCardDescription,
  inferSectionBooleans,
  inferStructuredFields,
  normalizeBody,
  orderFrontmatter
} from "./content-schema.mjs";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");

const categories = Object.keys(CATEGORY_SCHEMAS);
let updatedCount = 0;

function clampDescription(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  if (value.length <= 320) return value;

  const sentence = value.match(/^(.{0,320}[.!?])\s/);
  if (sentence?.[1]) return sentence[1];
  return `${value.slice(0, 317).trimEnd()}...`;
}

function toSeoDescription(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  if (value.length <= 170) return value;

  const sentence = value.match(/^(.{0,170}[.!?])\s/);
  if (sentence?.[1]) return sentence[1];
  return `${value.slice(0, 167).trimEnd()}...`;
}

for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  if (!fs.existsSync(categoryDir)) continue;

  for (const fileName of fs.readdirSync(categoryDir)) {
    if (!fileName.endsWith(".mdx")) continue;

    const filePath = path.join(categoryDir, fileName);
    try {
      const source = fs.readFileSync(filePath, "utf8");
      const parsed = matter(source);
      const normalizedBody = normalizeBody(parsed.content, category);
      const inferred = inferStructuredFields(parsed.data, normalizedBody, category);
      const sectionFlags = inferSectionBooleans(normalizedBody);
      const normalizedDescription = clampDescription(parsed.data.description);

      const nextDataInput = {
        ...parsed.data,
        category,
        description: normalizedDescription || parsed.data.description,
        cardDescription: deriveCardDescription(normalizedDescription || parsed.data.description),
        seoDescription: toSeoDescription(
          parsed.data.seoDescription || normalizedDescription || parsed.data.description
        ),
        hasPrerequisites:
          sectionFlags.hasPrerequisites ||
          (typeof parsed.data.hasPrerequisites === "boolean"
            ? parsed.data.hasPrerequisites
            : false),
        hasTroubleshooting:
          sectionFlags.hasTroubleshooting ||
          (typeof parsed.data.hasTroubleshooting === "boolean"
            ? parsed.data.hasTroubleshooting
            : false),
        ...Object.fromEntries(
          Object.entries(inferred).filter(([, value]) => {
            if (typeof value === "boolean") return true;
            return String(value ?? "").trim() !== "";
          })
        )
      };

      if (
        nextDataInput.repoUrl &&
        String(nextDataInput.repoUrl).trim() === DEFAULT_DIRECTORY_REPO_URL
      ) {
        delete nextDataInput.repoUrl;
      }

      if (category === "guides" || category === "collections") {
        delete nextDataInput.copySnippet;
      }

      const nextData = orderFrontmatter(nextDataInput);

      const nextSource = matter.stringify(normalizedBody, nextData);

      if (nextSource !== source) {
        fs.writeFileSync(filePath, nextSource);
        updatedCount += 1;
      }
    } catch (error) {
      console.warn(`Skipped ${path.relative(repoRoot, filePath)}: ${error.message}`);
    }
  }
}

console.log(`Updated ${updatedCount} content files`);
