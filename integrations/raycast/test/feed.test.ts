import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  absoluteDataUrl,
  buildContributeEntryUrl,
  buildSuggestChangeUrl,
  categoryLabel,
  entryKey,
  fallbackDetail,
  filterEntriesByCategory,
  isRaycastDetail,
  parseDetail,
  parseFavoriteKeys,
  parseFeed,
  serializeFavoriteKeys,
  sortedCategoryOptions,
  type RaycastEntry,
} from "../src/feed";

const sampleEntry: RaycastEntry = {
  category: "mcp",
  slug: "context7",
  title: "Context7",
  description: "Fetch up-to-date docs.",
  tags: ["docs", "mcp"],
  installCommand: "claude mcp add context7",
  configSnippet: "",
  copyText: "complete asset",
  copyTextLength: 14,
  copyTextTruncated: false,
  detailMarkdown: "# Context7",
  detailUrl: "/data/raycast/mcp/context7.json",
  webUrl: "https://heyclau.de/mcp/context7",
  repoUrl: "https://github.com/upstash/context7",
  documentationUrl: "https://context7.com",
  downloadTrust: "external",
  verificationStatus: "validated",
};

describe("Raycast feed helpers", () => {
  it("parses valid envelope entries and drops malformed rows", () => {
    const parsed = parseFeed(
      JSON.stringify({
        generatedAt: "2026-04-27T00:00:00.000Z",
        entries: [sampleEntry, { category: "mcp" }],
      }),
    );

    assert.equal(parsed.generatedAt, "2026-04-27T00:00:00.000Z");
    assert.deepEqual(parsed.entries, [sampleEntry]);
  });

  it("keeps one-release compatibility with the legacy array feed", () => {
    const parsed = parseFeed(
      JSON.stringify([sampleEntry, { category: "mcp" }]),
    );

    assert.equal(parsed.generatedAt, "");
    assert.deepEqual(parsed.entries, [sampleEntry]);
  });

  it("treats malformed envelopes as empty feeds", () => {
    assert.deepEqual(parseFeed(JSON.stringify({ entries: null })), {
      entries: [],
      generatedAt: "",
    });
  });

  it("normalizes detail URLs relative to the public feed", () => {
    assert.equal(
      absoluteDataUrl("/data/raycast/mcp/context7.json"),
      "https://heyclau.de/data/raycast/mcp/context7.json",
    );
  });

  it("builds issue-first contribution URLs without local write targets", () => {
    const contributeUrl = new URL(buildContributeEntryUrl(sampleEntry));
    assert.equal(contributeUrl.origin, "https://heyclau.de");
    assert.equal(contributeUrl.pathname, "/submit");
    assert.equal(contributeUrl.searchParams.get("category"), "mcp");
    assert.equal(contributeUrl.searchParams.get("slug"), "context7");

    const suggestUrl = new URL(buildSuggestChangeUrl(sampleEntry));
    assert.equal(suggestUrl.origin, "https://github.com");
    assert.equal(
      suggestUrl.pathname,
      "/JSONbored/claudepro-directory/issues/new",
    );
    assert.equal(suggestUrl.searchParams.get("template"), "submit-mcp.yml");
    assert.equal(suggestUrl.searchParams.get("category"), "mcp");
    assert.equal(suggestUrl.searchParams.get("slug"), "context7");
    assert.match(suggestUrl.toString(), /^https:\/\//);
    assert.equal(suggestUrl.toString().includes("file:"), false);
  });

  it("validates and parses full detail payloads", () => {
    const detail = { copyText: "full text", detailMarkdown: "# Detail" };
    assert.equal(isRaycastDetail(detail), true);
    assert.deepEqual(parseDetail(JSON.stringify(detail)), detail);
    assert.equal(parseDetail(JSON.stringify({ copyText: "missing md" })), null);
    assert.deepEqual(fallbackDetail(sampleEntry), {
      copyText: sampleEntry.copyText,
      detailMarkdown: sampleEntry.detailMarkdown,
    });
  });

  it("serializes favorites deterministically", () => {
    assert.deepEqual(parseFavoriteKeys(JSON.stringify(["b", "a", "a"])), [
      "a",
      "b",
    ]);
    assert.equal(serializeFavoriteKeys(new Set(["b", "a"])), '["a","b"]');
  });

  it("builds category filters and favorites without mutating ranking", () => {
    const toolEntry = { ...sampleEntry, category: "tools", slug: "raycast" };
    const entries = [sampleEntry, toolEntry];
    const favorites = new Set([entryKey(toolEntry)]);

    assert.equal(categoryLabel("mcp"), "MCP Servers");
    assert.deepEqual(sortedCategoryOptions(entries), [
      { value: "all", title: "All Categories" },
      { value: "favorites", title: "Favorites" },
      { value: "mcp", title: "MCP Servers" },
      { value: "tools", title: "Tools" },
    ]);
    assert.deepEqual(filterEntriesByCategory(entries, "favorites", favorites), [
      toolEntry,
    ]);
    assert.deepEqual(filterEntriesByCategory(entries, "mcp", favorites), [
      sampleEntry,
    ]);
  });
});
