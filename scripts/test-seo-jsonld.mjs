import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildEntryJsonLd,
  buildEntryJsonLdSnapshot,
  buildItemListJsonLd,
  buildJobPostingJsonLd,
  buildWebsiteJsonLd,
  buildWebPageJsonLd,
  buildToolSoftwareApplicationJsonLd,
} from "@heyclaude/registry/seo";

const repoRoot = process.cwd();
const contentPayload = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "apps/web/public/data/content-index.json"),
    "utf8",
  ),
);
assert.ok(!Array.isArray(contentPayload), "content index must be an envelope");
const entries = contentPayload.entries;
const firstEntry = entries.find((entry) => entry.category !== "tools");
assert.ok(firstEntry, "content index must include at least one non-tool entry");

const website = buildWebsiteJsonLd({
  siteUrl: "https://heyclau.de",
  name: "HeyClaude",
  description: "Directory test.",
});
assert.equal(website["@type"], "WebSite");
assert.equal(website.potentialAction["@type"], "SearchAction");
assert.equal(
  website.potentialAction.target.urlTemplate,
  "https://heyclau.de/browse?q={search_term_string}",
);

const breadcrumb = buildBreadcrumbJsonLd([
  { name: "Home", url: "https://heyclau.de" },
  { name: "Browse", url: "https://heyclau.de/browse" },
]);
assert.equal(breadcrumb["@type"], "BreadcrumbList");
assert.equal(breadcrumb.itemListElement.length, 2);
assert.equal(breadcrumb.itemListElement[0].position, 1);

const itemList = buildItemListJsonLd(
  entries.slice(0, 3).map((entry) => ({
    name: entry.title,
    url: `https://heyclau.de/${entry.category}/${entry.slug}`,
  })),
  { name: "Test list" },
);
assert.equal(itemList["@type"], "ItemList");
assert.equal(itemList.numberOfItems, Math.min(3, entries.length));

const entryJsonLd = buildEntryJsonLd(firstEntry, {
  siteUrl: "https://heyclau.de",
});
assert.ok(["CreativeWork", "TechArticle"].includes(entryJsonLd["@type"]));
assert.equal(
  entryJsonLd.url,
  `https://heyclau.de/${firstEntry.category}/${firstEntry.slug}`,
);

const webpage = buildWebPageJsonLd({
  siteUrl: "https://heyclau.de",
  path: "/browse",
  name: "Browse",
  description: "Browse entries.",
});
assert.equal(webpage["@type"], "WebPage");
assert.equal(webpage.url, "https://heyclau.de/browse");

const collectionPage = buildCollectionPageJsonLd({
  siteUrl: "https://heyclau.de",
  path: "/mcp",
  name: "MCP",
  description: "MCP directory.",
});
assert.equal(collectionPage["@type"], "CollectionPage");

const snapshot = buildEntryJsonLdSnapshot(firstEntry, {
  siteUrl: "https://heyclau.de",
});
assert.equal(snapshot.key, `${firstEntry.category}:${firstEntry.slug}`);
assert.ok(
  snapshot.documents.some((document) => document["@type"] === "BreadcrumbList"),
);
assert.ok(
  snapshot.documents.some((document) => document["@type"] === "WebPage"),
);

const incompleteToolJsonLd = buildToolSoftwareApplicationJsonLd(
  {
    slug: "example-tool",
    title: "Example Tool",
    description: "Example tool listing.",
    websiteUrl: "https://example.com",
    pricingModel: "freemium",
    disclosure: "sponsored",
  },
  { siteUrl: "https://heyclau.de" },
);
assert.equal(
  incompleteToolJsonLd,
  null,
  "incomplete tool markup must not emit SoftwareApplication",
);

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
assert.equal(toolJsonLd["@type"], "SoftwareApplication");
assert.equal(toolJsonLd.additionalProperty.value, "sponsored");
assert.equal(
  toolJsonLd.aggregateRating,
  undefined,
  "tool markup must not fabricate ratings",
);
assert.equal(
  toolJsonLd.review,
  undefined,
  "tool markup must not fabricate reviews",
);

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
assert.equal(realJobJsonLd["@type"], "JobPosting");
assert.equal(realJobJsonLd.url, "https://heyclau.de/jobs/real-job");

console.log("SEO JSON-LD tests passed.");
