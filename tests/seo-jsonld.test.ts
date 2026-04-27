import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEntryJsonLd,
  buildEntryJsonLdSnapshot,
  buildItemListJsonLd,
  buildJobPostingJsonLd,
  buildToolSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
  buildWebsiteJsonLd,
} from "@heyclaude/registry/seo";
import { buildEntryCitationFacts } from "@heyclaude/registry/llms";

import { loadContentEntries } from "./helpers/registry-fixtures";

describe("SEO JSON-LD policy", () => {
  const entries = loadContentEntries();
  const firstEntry = entries.find((entry) => entry.category !== "tools");

  it("emits sitewide WebSite SearchAction metadata", () => {
    const website = buildWebsiteJsonLd({
      siteUrl: "https://heyclau.de",
      name: "HeyClaude",
      description: "Directory test.",
    });
    expect(website["@type"]).toBe("WebSite");
    expect(website.potentialAction["@type"]).toBe("SearchAction");
    expect(website.potentialAction.target.urlTemplate).toBe(
      "https://heyclau.de/browse?q={search_term_string}",
    );
  });

  it("emits valid breadcrumb and collection/list structures", () => {
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://heyclau.de" },
      { name: "Browse", url: "https://heyclau.de/browse" },
    ]);
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[0].position).toBe(1);

    const itemList = buildItemListJsonLd(
      entries.slice(0, 3).map((entry) => ({
        name: entry.title,
        url: `https://heyclau.de/${entry.category}/${entry.slug}`,
      })),
      { name: "Test list" },
    );
    expect(itemList["@type"]).toBe("ItemList");
    expect(itemList.numberOfItems).toBe(Math.min(3, entries.length));

    const collectionPage = buildCollectionPageJsonLd({
      siteUrl: "https://heyclau.de",
      path: "/mcp",
      name: "MCP",
      description: "MCP directory.",
    });
    expect(collectionPage["@type"]).toBe("CollectionPage");
  });

  it("emits entry schema snapshots without fabricated rich-result fields", () => {
    expect(firstEntry).toBeTruthy();
    const entry = firstEntry!;
    const entryJsonLd = buildEntryJsonLd(entry, {
      siteUrl: "https://heyclau.de",
    });
    expect(["CreativeWork", "SoftwareSourceCode", "TechArticle"]).toContain(
      entryJsonLd["@type"],
    );
    expect(entryJsonLd.url).toBe(
      `https://heyclau.de/${entry.category}/${entry.slug}`,
    );
    expect(
      (entryJsonLd as Record<string, unknown>).aggregateRating,
    ).toBeUndefined();
    expect((entryJsonLd as Record<string, unknown>).review).toBeUndefined();
    expect(entryJsonLd.dateModified).toBeTruthy();
    expect((entryJsonLd as Record<string, unknown>).isBasedOn).toBeTruthy();

    const snapshot = buildEntryJsonLdSnapshot(entry, {
      siteUrl: "https://heyclau.de",
    });
    expect(snapshot.key).toBe(`${entry.category}:${entry.slug}`);
    expect(
      snapshot.documents.some(
        (document) => document["@type"] === "BreadcrumbList",
      ),
    ).toBe(true);
    expect(
      snapshot.documents.some((document) => document["@type"] === "WebPage"),
    ).toBe(true);
  });

  it("emits regular WebPage schema for plain pages", () => {
    const webpage = buildWebPageJsonLd({
      siteUrl: "https://heyclau.de",
      path: "/browse",
      name: "Browse",
      description: "Browse entries.",
    });
    expect(webpage["@type"]).toBe("WebPage");
    expect(webpage.url).toBe("https://heyclau.de/browse");
  });

  it("emits AI citation facts from truthful registry metadata", () => {
    const skillWithPackage = entries.find(
      (entry) => entry.category === "skills" && entry.downloadSha256,
    );
    expect(skillWithPackage).toBeTruthy();

    const facts = buildEntryCitationFacts(skillWithPackage!, {
      siteUrl: "https://heyclau.de",
    });

    expect(facts).toContain(
      `Canonical URL: https://heyclau.de/${skillWithPackage!.category}/${skillWithPackage!.slug}`,
    );
    expect(facts).toContain(
      `Package SHA256: ${skillWithPackage!.downloadSha256}`,
    );
    expect(facts).toContain("Platform compatibility:");
    expect(facts).toContain("Last verified:");
    expect(facts).not.toContain("aggregateRating");
    expect(facts).not.toContain("review:");
  });

  it("does not emit SoftwareApplication until visible required fields exist", () => {
    expect(
      buildToolSoftwareApplicationJsonLd(
        {
          slug: "example-tool",
          title: "Example Tool",
          description: "Example tool listing.",
          websiteUrl: "https://example.com",
          pricingModel: "freemium",
          disclosure: "sponsored",
        },
        { siteUrl: "https://heyclau.de" },
      ),
    ).toBeNull();

    const toolJsonLd = buildToolSoftwareApplicationJsonLd(
      {
        slug: "example-tool",
        title: "Example Tool",
        description: "Example tool listing.",
        websiteUrl: "https://example.com",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        pricingModel: "freemium",
        disclosure: "sponsored",
      },
      { siteUrl: "https://heyclau.de" },
    );
    expect(toolJsonLd?.["@type"]).toBe("SoftwareApplication");
    expect(toolJsonLd?.additionalProperty.value).toBe("sponsored");
    expect(toolJsonLd?.aggregateRating).toBeUndefined();
    expect(toolJsonLd?.review).toBeUndefined();
  });

  it("emits JobPosting only for explicit real job data", () => {
    const realJobJsonLd = buildJobPostingJsonLd(
      {
        slug: "real-job",
        title: "AI Engineer",
        company: "Example",
        description: "Build Claude workflows.",
        postedAt: "2026-04-26",
        applyUrl: "https://example.com/jobs/ai-engineer",
        isRemote: true,
      },
      { siteUrl: "https://heyclau.de" },
    );
    expect(realJobJsonLd?.["@type"]).toBe("JobPosting");
    expect(realJobJsonLd?.url).toBe("https://heyclau.de/jobs/real-job");
  });
});
