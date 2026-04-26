import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildBreadcrumbJsonLd,
  buildEntryJsonLd,
  buildItemListJsonLd,
  buildJobPostingJsonLd,
  buildToolSoftwareApplicationJsonLd,
} from "@heyclaude/registry/seo";

const repoRoot = process.cwd();
const contentPayload = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "apps/web/public/data/content-index.json"), "utf8"),
);
const entries = Array.isArray(contentPayload) ? contentPayload : contentPayload.entries;
const firstEntry = entries.find((entry) => entry.category !== "tools");
assert.ok(firstEntry, "content index must include at least one non-tool entry");

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

const entryJsonLd = buildEntryJsonLd(firstEntry, { siteUrl: "https://heyclau.de" });
assert.ok(["CreativeWork", "TechArticle"].includes(entryJsonLd["@type"]));
assert.equal(entryJsonLd.url, `https://heyclau.de/${firstEntry.category}/${firstEntry.slug}`);

const toolJsonLd = buildToolSoftwareApplicationJsonLd(
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
assert.equal(toolJsonLd["@type"], "SoftwareApplication");
assert.equal(toolJsonLd.additionalProperty.value, "sponsored");

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
