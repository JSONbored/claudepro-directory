import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { orderFrontmatter } from "./content-schema.mjs";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name);

let updated = 0;

for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  const files = fs.readdirSync(categoryDir).filter((fileName) => fileName.endsWith(".mdx"));

  for (const fileName of files) {
    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const parsed = matter(source);

    const hadLegacyCounters =
      parsed.data.viewCount !== undefined ||
      parsed.data.copyCount !== undefined ||
      parsed.data.popularityScore !== undefined;

    if (!hadLegacyCounters) continue;

    delete parsed.data.viewCount;
    delete parsed.data.copyCount;
    delete parsed.data.popularityScore;

    const orderedData = orderFrontmatter(parsed.data);
    const output = matter.stringify(parsed.content.trim(), orderedData, {
      lineWidth: 0
    });
    fs.writeFileSync(filePath, `${output.trim()}\n`);
    updated += 1;
  }
}

console.log(`Removed legacy counter fields from ${updated} content files.`);
