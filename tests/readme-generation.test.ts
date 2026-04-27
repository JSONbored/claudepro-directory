import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import matter from "gray-matter";

import categorySpec from "@heyclaude/registry/category-spec";

import { repoRoot } from "./helpers/registry-fixtures";

type ReadmeEntry = {
  category: string;
  slug: string;
  title: string;
  description: string;
};

function readContentEntries() {
  const contentRoot = path.join(repoRoot, "content");
  const entries: ReadmeEntry[] = [];

  for (const category of categorySpec.categoryOrder) {
    const categoryDir = path.join(contentRoot, category);
    for (const fileName of fs
      .readdirSync(categoryDir)
      .filter((name) => name.endsWith(".mdx"))
      .sort()) {
      const source = fs.readFileSync(path.join(categoryDir, fileName), "utf8");
      const { data } = matter(source);
      entries.push({
        category,
        slug: String(data.slug ?? fileName.replace(/\.mdx$/, "")),
        title: String(data.title ?? fileName.replace(/\.mdx$/, "")),
        description: String(data.description ?? ""),
      });
    }
  }

  return entries;
}

describe("generated README catalog", () => {
  const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
  const entries = readContentEntries();

  it("includes every file-backed content entry with its canonical URL and description", () => {
    for (const entry of entries) {
      expect(readme, `${entry.category}/${entry.slug}`).toContain(
        `https://heyclau.de/${entry.category}/${entry.slug}`,
      );
      expect(readme, `${entry.category}/${entry.slug}`).toContain(
        entry.description,
      );
    }
  });

  it("keeps category counts aligned with content files", () => {
    const total = entries.length;
    expect(readme).toContain(`${total}+ file-backed entries`);

    for (const category of categorySpec.categoryOrder) {
      const count = entries.filter(
        (entry) => entry.category === category,
      ).length;
      const label = categorySpec.categories[category]?.label ?? category;
      expect(readme).toMatch(
        new RegExp(`\\| \\[${label}\\]\\([^)]*\\)\\s*\\|\\s*${count}\\s*\\|`),
      );
      expect(readme).toContain(`(${count})`);
    }
  });

  it("keeps machine-readable distribution links visible near the top", () => {
    const top = readme.slice(0, 1200);
    expect(top).toContain("https://heyclau.de/api/registry/feed");
    expect(top).toContain("https://heyclau.de/llms-full.txt");
    expect(top).toContain("integrations/raycast");
    expect(top).toContain("packages/mcp");
    expect(top).toContain("https://heyclau.de/claim");
  });
});
