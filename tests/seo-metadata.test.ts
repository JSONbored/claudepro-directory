import { describe, expect, it } from "vitest";

import categorySpec from "@heyclaude/registry/category-spec";
import { deriveSeoFields } from "@heyclaude/registry";

const bingReportedPaths = [
  "jobs",
  "agents",
  "mcp",
  "rules",
  "hooks",
  "statuslines",
  "skills",
  "commands",
  "about",
  "guides",
];

describe("SEO metadata snippets", () => {
  it("defines search-length category descriptions for indexable category pages", () => {
    for (const category of categorySpec.categoryOrder) {
      const description = categorySpec.categories[category]?.seoDescription;
      expect(description, category).toBeTruthy();
      expect(description.length, category).toBeGreaterThanOrEqual(120);
      expect(description.length, category).toBeLessThanOrEqual(170);
    }

    for (const path of bingReportedPaths.filter(
      (item) => item !== "jobs" && item !== "about",
    )) {
      expect(
        categorySpec.categories[path]?.seoDescription.length,
      ).toBeGreaterThanOrEqual(120);
    }
  });

  it("expands short imported entry descriptions into bounded SEO snippets", () => {
    const seo = deriveSeoFields(
      {
        title: "Hugging Face MCP Server",
        description:
          "Access Hugging Face Hub and Gradio AI applications Discover tools for AI development.",
      },
      "mcp",
    );

    expect(seo.seoDescription.length).toBeGreaterThanOrEqual(120);
    expect(seo.seoDescription.length).toBeLessThanOrEqual(160);
    expect(seo.seoDescription).toContain("HeyClaude");
  });
});
