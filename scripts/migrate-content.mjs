import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  CATEGORY_SCHEMAS,
  inferStructuredFields,
  normalizeBody,
  orderFrontmatter
} from "./content-schema.mjs";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");

const categories = Object.keys(CATEGORY_SCHEMAS);
let updatedCount = 0;

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

      const nextData = orderFrontmatter({
        ...parsed.data,
        category,
        ...Object.fromEntries(
          Object.entries(inferred).filter(([, value]) => {
            if (typeof value === "boolean") return true;
            return String(value ?? "").trim() !== "";
          })
        )
      });

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
