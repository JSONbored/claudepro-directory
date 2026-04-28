import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import categorySpec from "@heyclaude/registry/category-spec";
import { deriveSeoFields } from "@heyclaude/registry";
import { repoRoot } from "./helpers/registry-fixtures";

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

const staticMetadataPages = [
  "browse",
  "submit",
  "submissions",
  "advertise",
  "api-docs",
  "claim",
  "contributors",
  "ecosystem",
  "quality",
  "trending",
  "about",
];

function pageMetadataDescription(pagePath: string) {
  const source = fs.readFileSync(
    path.join(repoRoot, `apps/web/src/app/${pagePath}/page.tsx`),
    "utf8",
  );
  return source.match(
    /export const metadata[\s\S]*?description:\s*(?:\n\s*)?["`]([^"`]+)["`]/,
  )?.[1];
}

function seoClusterDescription(slug: string) {
  const source = fs.readFileSync(
    path.join(repoRoot, "apps/web/src/lib/seo-clusters.ts"),
    "utf8",
  );
  const start = source.indexOf(`slug: "${slug}"`);
  expect(start, slug).toBeGreaterThanOrEqual(0);
  const block = source.slice(start, source.indexOf("},", start));
  return block.match(/seoDescription:\s*"([^"]+)"/)?.[1];
}

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

  it("keeps static and growth-page meta descriptions in the Bing-friendly range", () => {
    for (const pagePath of staticMetadataPages) {
      const description = pageMetadataDescription(pagePath);
      expect(description, pagePath).toBeTruthy();
      expect(description!.length, pagePath).toBeGreaterThanOrEqual(120);
      expect(description!.length, pagePath).toBeLessThanOrEqual(160);
    }

    const mcpServersDescription = seoClusterDescription("mcp-servers");
    expect(mcpServersDescription).toBeTruthy();
    expect(mcpServersDescription!.length).toBeGreaterThanOrEqual(120);
    expect(mcpServersDescription!.length).toBeLessThanOrEqual(160);
  });
});
