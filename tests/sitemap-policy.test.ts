import { describe, expect, it } from "vitest";

import {
  isSitemapIndexableEntry,
  sitemapEntryLastModified,
} from "@/lib/sitemap-policy";

describe("sitemap policy", () => {
  it("excludes noindex registry entries from indexable sitemap URLs", () => {
    expect(
      isSitemapIndexableEntry({
        category: "skills",
        slug: "draft-skill",
        title: "Draft Skill",
        description: "Draft skill.",
        robotsIndex: false,
        tags: [],
        keywords: [],
      } as any),
    ).toBe(false);
  });

  it("prefers content modified metadata for sitemap lastmod", () => {
    const lastModified = sitemapEntryLastModified({
      category: "skills",
      slug: "updated-skill",
      title: "Updated Skill",
      description: "Updated skill.",
      contentUpdatedAt: "2026-04-26T12:34:56.000Z",
      repoUpdatedAt: "2026-04-20T00:00:00.000Z",
      dateAdded: "2026-04-01",
      tags: [],
      keywords: [],
    } as any);

    expect(lastModified?.toISOString()).toBe("2026-04-26T12:34:56.000Z");
  });
});
