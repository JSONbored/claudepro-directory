import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildContentQualityArtifact,
  buildContentPromptArtifact,
  buildCategoryDistributionFeed,
  buildDirectoryEntries,
  buildDistributionFeedIndex,
  buildEntryTrustSignals,
  buildMcpRegistryFeed,
  buildPlatformDistributionFeed,
  buildPluginExportFeed,
  buildCursorSkillAdapter,
  buildJsonLdSnapshots,
  buildRegistryChangelogFeed,
  buildReadOnlyEcosystemFeed,
  buildRaycastEnvelope,
  RAYCAST_COPY_PREVIEW_LIMIT,
  buildSearchEntries,
  brandAssetProxyUrl,
  brandfetchLogoUrl,
  detectKnownBrand,
  getCopyText,
  isAllowedBrandAssetUrl,
  truncateText,
} from "@heyclaude/registry";

import {
  dataRoot,
  loadContentEntries,
  loadDirectoryEntries,
  loadSearchEntries,
  readDataJson,
  repoRoot,
} from "./helpers/registry-fixtures";

describe("registry artifacts", () => {
  const contentEntries = loadContentEntries();
  const directoryEntries = loadDirectoryEntries();
  const searchEntries = loadSearchEntries();
  const raycastPayload = readDataJson<{
    schemaVersion: number;
    kind: string;
    count: number;
    entries: any[];
  }>("raycast-index.json");
  const manifest = readDataJson<{
    schemaVersion: number;
    kind: string;
    totalEntries: number;
    artifacts: Record<string, string>;
    routes: Array<{ key: string; canonicalUrl: string; llmsUrl: string }>;
    qualitySummary: Record<string, unknown>;
    artifactContracts: Record<
      string,
      { path: string; type: "json" | "text"; sha256: string }
    >;
  }>("registry-manifest.json");
  const qualityPayload = readDataJson<{ schemaVersion: number; count: number }>(
    "content-quality-report.json",
  );
  const qualityPromptsPayload = readDataJson<{
    schemaVersion: number;
    count: number;
  }>("content-quality-prompts.json");
  const jsonLdSnapshotsPayload = readDataJson<{
    schemaVersion: number;
    count: number;
  }>("jsonld-snapshots.json");

  it("does not publish the retired full content corpus JSON", () => {
    expect(fs.existsSync(path.join(dataRoot, "content-index.json"))).toBe(
      false,
    );
    expect(manifest.artifacts.content).toBeUndefined();
  });

  it("keeps compact public indexes envelope-versioned", () => {
    const directoryPayload = readDataJson<{
      schemaVersion: number;
      kind: string;
      count: number;
    }>("directory-index.json");
    const searchPayload = readDataJson<{
      schemaVersion: number;
      kind: string;
      count: number;
    }>("search-index.json");

    expect(Array.isArray(directoryPayload)).toBe(false);
    expect(Array.isArray(searchPayload)).toBe(false);
    expect(Array.isArray(raycastPayload)).toBe(false);
    expect(directoryPayload).toMatchObject({
      schemaVersion: 2,
      kind: "directory-index",
      count: directoryEntries.length,
    });
    expect(searchPayload).toMatchObject({
      schemaVersion: 2,
      kind: "search-index",
      count: searchEntries.length,
    });
    expect(directoryEntries.length).toBe(contentEntries.length);
    expect(searchEntries.length).toBe(contentEntries.length);
  });

  it("does not split surrogate pairs when truncating JSON-backed text", () => {
    const value = `${"a".repeat(RAYCAST_COPY_PREVIEW_LIMIT - 3)}📚 tail`;
    const truncated = truncateText(value, RAYCAST_COPY_PREVIEW_LIMIT);

    expect(truncated).toContain("...");
    expect(truncated).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/u);
    expect(truncated).not.toMatch(/(?:^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/u);
    expect(() => JSON.parse(JSON.stringify({ truncated }))).not.toThrow();
  });

  it("preserves verified brand metadata across registry surfaces", () => {
    const key = "mcp:asana-mcp-server";
    const directoryEntry = directoryEntries.find(
      (entry) => `${entry.category}:${entry.slug}` === key,
    );
    const searchEntry = searchEntries.find(
      (entry) => `${entry.category}:${entry.slug}` === key,
    );
    const raycastEntry = raycastPayload.entries.find(
      (entry) => `${entry.category}:${entry.slug}` === key,
    );
    const raycastDetail = readDataJson<Record<string, unknown>>(
      "raycast/mcp/asana-mcp-server.json",
    );
    const llmsText = fs.readFileSync(
      path.join(dataRoot, "llms", "mcp", "asana-mcp-server.txt"),
      "utf8",
    );

    expect(directoryEntry).toMatchObject({
      brandName: "Asana",
      brandDomain: "asana.com",
      brandAssetSource: "brandfetch",
    });
    expect(searchEntry).toMatchObject({
      brandName: "Asana",
      brandDomain: "asana.com",
      brandAssetSource: "brandfetch",
    });
    expect(raycastEntry).toMatchObject({
      brandName: "Asana",
      brandDomain: "asana.com",
      brandIconUrl: "/api/brand-assets/icon/asana.com",
      brandAssetSource: "brandfetch",
    });
    expect(raycastDetail).toMatchObject({
      brandName: "Asana",
      brandDomain: "asana.com",
      brandIconUrl: "/api/brand-assets/icon/asana.com",
      brandAssetSource: "brandfetch",
    });
    expect(raycastDetail).toHaveProperty("author");
    expect(llmsText).toContain("- Brand: Asana");
    expect(llmsText).toContain("- Brand domain: asana.com");

    const brandfetchUrl = brandfetchLogoUrl("asana.com", {
      clientId: "test-client",
    });
    expect(brandfetchUrl).toContain(
      "https://cdn.brandfetch.io/domain/asana.com/",
    );
    expect(isAllowedBrandAssetUrl(brandfetchUrl)).toBe(true);
    expect(brandAssetProxyUrl("asana.com")).toBe(
      "/api/brand-assets/icon/asana.com",
    );
    expect(isAllowedBrandAssetUrl(brandAssetProxyUrl("asana.com"))).toBe(true);
    expect(isAllowedBrandAssetUrl("https://example.com/logo.png")).toBe(false);
  });

  it("derives known first-party brand icons without unsafe generic fallbacks", () => {
    expect(
      detectKnownBrand({
        title: "Discord MCP Server for Claude",
        tags: ["discord", "bot"],
      }),
    ).toMatchObject({
      name: "Discord",
      domain: "discord.com",
    });

    const key = "mcp:discord-mcp-server";
    const directoryEntry = directoryEntries.find(
      (entry) => `${entry.category}:${entry.slug}` === key,
    );
    const raycastEntry = raycastPayload.entries.find(
      (entry) => `${entry.category}:${entry.slug}` === key,
    );
    const raycastDetail = readDataJson<Record<string, unknown>>(
      "raycast/mcp/discord-mcp-server.json",
    );

    expect(directoryEntry).toMatchObject({
      brandName: "Discord",
      brandDomain: "discord.com",
      brandIconUrl: "/api/brand-assets/icon/discord.com",
      brandAssetSource: "brandfetch",
    });
    expect(raycastEntry).toMatchObject({
      brandName: "Discord",
      brandDomain: "discord.com",
      brandIconUrl: "/api/brand-assets/icon/discord.com",
      brandAssetSource: "brandfetch",
    });
    expect(String(raycastDetail.detailMarkdown)).not.toContain("**Brand:**");
    expect(String(raycastDetail.detailMarkdown)).not.toContain("**Category:**");
    expect(String(raycastDetail.detailMarkdown)).not.toContain("## Links");
  });

  it("publishes factual trust signals across compact and detail artifacts", () => {
    const contentByKey = new Map(
      contentEntries.map((entry) => [`${entry.category}:${entry.slug}`, entry]),
    );

    for (const entry of directoryEntries) {
      const key = `${entry.category}:${entry.slug}`;
      const contentEntry = contentByKey.get(key);
      expect(contentEntry).toBeTruthy();
      expect(entry.trustSignals).toEqual(buildEntryTrustSignals(contentEntry!));
      expect(entry.trustSignals).toMatchObject({
        sourceStatus: expect.stringMatching(/^(available|missing)$/),
        checksumPresent: Boolean(
          entry.downloadSha256 || entry.skillPackage?.sha256,
        ),
      });
      expect(entry.trustSignals.sourceUrlCount).toBe(
        entry.trustSignals.sourceUrls.length,
      );

      const detailPayload = readDataJson<{
        trustSignals: Record<string, unknown>;
      }>(`entries/${entry.category}/${entry.slug}.json`);
      expect(detailPayload.trustSignals).toEqual(entry.trustSignals);
    }

    expect(
      directoryEntries.some((entry) => entry.trustSignals.checksumPresent),
    ).toBe(true);
    expect(
      directoryEntries.some((entry) => entry.trustSignals.adapterGenerated),
    ).toBe(true);
    for (const entry of searchEntries) {
      expect(entry.trustSignals).toMatchObject({
        lastVerifiedAt: expect.any(String),
        platforms: expect.any(Array),
        supportLevels: expect.any(Array),
      });
    }
  });

  it("derives all generated aggregate artifacts from registry builders", () => {
    expect(buildDirectoryEntries(contentEntries)).toEqual(directoryEntries);
    expect(buildSearchEntries(contentEntries)).toEqual(searchEntries);
    expect(buildRaycastEnvelope(contentEntries)).toEqual(raycastPayload);
    expect(buildContentQualityArtifact(contentEntries)).toEqual(qualityPayload);
    expect(buildContentPromptArtifact(contentEntries)).toEqual(
      qualityPromptsPayload,
    );
    expect(
      JSON.parse(
        JSON.stringify(
          buildJsonLdSnapshots(contentEntries, {
            siteUrl: "https://heyclau.de",
            siteName: "HeyClaude",
          }),
        ),
      ),
    ).toEqual(jsonLdSnapshotsPayload);
  });

  it("derives search citation URLs from unhydrated source entries", () => {
    const sourceEntry = {
      ...contentEntries[0],
      canonicalUrl: undefined,
      llmsUrl: undefined,
      apiUrl: undefined,
    };
    const [searchEntry] = buildSearchEntries([sourceEntry]);

    expect(searchEntry?.canonicalUrl).toBe(searchEntry?.url);
    expect(searchEntry?.llmsUrl).toBe(
      `https://heyclau.de/data/llms/${sourceEntry.category}/${sourceEntry.slug}.txt`,
    );
    expect(searchEntry?.apiUrl).toBe(
      `https://heyclau.de/api/registry/entries/${sourceEntry.category}/${sourceEntry.slug}`,
    );
  });

  it("publishes registry moat feeds with deterministic contract hashes", () => {
    const ecosystemFeed = readDataJson<{
      schemaVersion: number;
      kind: string;
      count: number;
      signature: string;
      entries: Array<Record<string, unknown>>;
    }>("ecosystem-feed.json");
    const mcpFeed = readDataJson<{
      schemaVersion: number;
      kind: string;
      count: number;
      servers: Array<Record<string, unknown>>;
    }>("mcp-registry-feed.json");
    const pluginFeed = readDataJson<{
      schemaVersion: number;
      kind: string;
      count: number;
      plugins: Array<Record<string, unknown>>;
    }>("plugin-export-feed.json");
    const changelogFeed = readDataJson<{
      schemaVersion: number;
      kind: string;
      count: number;
      signature: string;
      entries: Array<Record<string, unknown>>;
    }>("registry-changelog.json");

    expect(ecosystemFeed).toEqual(
      buildReadOnlyEcosystemFeed(contentEntries, {
        siteUrl: "https://heyclau.de",
      }),
    );
    expect(mcpFeed).toEqual(buildMcpRegistryFeed(contentEntries));
    expect(pluginFeed).toEqual(buildPluginExportFeed(contentEntries));
    expect(changelogFeed).toEqual(buildRegistryChangelogFeed(contentEntries));
    expect(ecosystemFeed).toMatchObject({
      schemaVersion: 2,
      kind: "ecosystem-feed",
      count: contentEntries.length,
    });
    expect(ecosystemFeed.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(mcpFeed.kind).toBe("mcp-registry-feed");
    expect(pluginFeed.kind).toBe("plugin-export-feed");
    expect(changelogFeed.kind).toBe("registry-changelog");
    expect(changelogFeed.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.artifactContracts["ecosystem-feed.json"]).toMatchObject({
      path: "/data/ecosystem-feed.json",
      type: "json",
    });
    expect(manifest.artifactContracts["registry-changelog.json"]).toMatchObject(
      {
        path: "/data/registry-changelog.json",
        type: "json",
      },
    );
    expect(manifest.artifactContracts["llms-full.txt"]).toMatchObject({
      path: "/data/llms-full.txt",
      type: "text",
    });
    for (const contract of Object.values(manifest.artifactContracts)) {
      expect(contract.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("publishes category and platform sharded distribution feeds", () => {
    const feedIndex = readDataJson<{
      schemaVersion: number;
      kind: string;
      categories: Array<{ category: string; feedUrl: string; count: number }>;
      platforms: Array<{ platform: string; feedUrl: string; count: number }>;
    }>("feeds/index.json");
    const skillsCategory = readDataJson<{ kind: string; count: number }>(
      "feeds/categories/skills.json",
    );
    const claudePlatform = readDataJson<{ kind: string; count: number }>(
      "feeds/platforms/claude.json",
    );

    expect(feedIndex).toEqual(
      buildDistributionFeedIndex(contentEntries, {
        siteUrl: "https://heyclau.de",
      }),
    );
    expect(skillsCategory).toEqual(
      buildCategoryDistributionFeed(contentEntries, "skills", {
        siteUrl: "https://heyclau.de",
      }),
    );
    expect(claudePlatform).toEqual(
      buildPlatformDistributionFeed(contentEntries, "Claude", {
        siteUrl: "https://heyclau.de",
      }),
    );
    expect(feedIndex).toMatchObject({
      schemaVersion: 2,
      kind: "distribution-feed-index",
    });
    expect(feedIndex.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "skills",
          feedUrl: "/data/feeds/categories/skills.json",
        }),
      ]),
    );
    expect(feedIndex.platforms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          platform: "Claude",
          feedUrl: "/data/feeds/platforms/claude.json",
        }),
      ]),
    );
    expect(manifest.artifacts.distributionFeeds).toBe("/data/feeds");
    expect(manifest.artifactContracts["feeds/index.json"]).toMatchObject({
      path: "/data/feeds%2Findex.json",
      type: "json",
    });
  });

  it("keeps full body fields out of compact indexes", () => {
    for (const entry of directoryEntries) {
      expect(entry.body).toBeUndefined();
      expect(entry.sections).toBeUndefined();
      expect(entry.scriptBody).toBeUndefined();
      expect(entry.canonicalUrl).toBe(
        `https://heyclau.de/${entry.category}/${entry.slug}`,
      );
      expect(entry.llmsUrl).toBe(
        `https://heyclau.de/data/llms/${entry.category}/${entry.slug}.txt`,
      );
      expect(entry.apiUrl).toBe(
        `https://heyclau.de/api/registry/entries/${entry.category}/${entry.slug}`,
      );
    }
    for (const entry of searchEntries) {
      expect(entry.url).toBeTruthy();
      expect(entry.seoTitle).toBeTruthy();
      expect(entry.seoDescription).toBeTruthy();
      expect(entry.canonicalUrl).toBe(entry.url);
      expect(entry.llmsUrl).toBe(
        `https://heyclau.de/data/llms/${entry.category}/${entry.slug}.txt`,
      );
      expect(entry.apiUrl).toBe(
        `https://heyclau.de/api/registry/entries/${entry.category}/${entry.slug}`,
      );
      expect((entry as Record<string, unknown>).body).toBeUndefined();
      expect((entry as Record<string, unknown>).copySnippet).toBeUndefined();
    }
    expect(
      searchEntries.some((entry) => entry.platforms?.includes("Gemini")),
    ).toBe(true);
  });

  it("writes per-entry detail, LLM, and Raycast payloads", () => {
    const raycastEntryByKey = new Map(
      raycastPayload.entries.map((entry) => [
        `${entry.category}:${entry.slug}`,
        entry,
      ]),
    );

    for (const entry of contentEntries) {
      const key = `${entry.category}:${entry.slug}`;
      const detailPayload = readDataJson<{
        schemaVersion: number;
        key: string;
        entry: typeof entry;
      }>(`entries/${entry.category}/${entry.slug}.json`);
      const raycastDetail = readDataJson<{
        schemaVersion: number;
        key: string;
        copyText: string;
      }>(`raycast/${entry.category}/${entry.slug}.json`);
      const entryLlmsPath = path.join(
        dataRoot,
        "llms",
        entry.category,
        `${entry.slug}.txt`,
      );
      const copyText = getCopyText(entry);
      const raycastFeedEntry = raycastEntryByKey.get(key);

      expect(detailPayload).toMatchObject({
        schemaVersion: 1,
        key,
      });
      expect(detailPayload.entry.title).toBe(entry.title);
      expect(fs.existsSync(entryLlmsPath)).toBe(true);
      expect(raycastFeedEntry).toBeTruthy();
      expect(raycastDetail).toMatchObject({
        schemaVersion: 2,
        key,
        copyText,
      });
      expect(raycastFeedEntry.canonicalUrl).toBe(
        `https://heyclau.de/${entry.category}/${entry.slug}`,
      );
      expect(raycastFeedEntry.llmsUrl).toBe(
        `https://heyclau.de/data/llms/${entry.category}/${entry.slug}.txt`,
      );
      expect(raycastFeedEntry.copyTextLength).toBe(copyText.length);
      expect(raycastFeedEntry.copyText.length).toBeLessThanOrEqual(
        RAYCAST_COPY_PREVIEW_LIMIT + 3,
      );
      expect(raycastFeedEntry.copyTextTruncated).toBe(
        copyText.length > RAYCAST_COPY_PREVIEW_LIMIT,
      );
    }
  });

  it("publishes skill compatibility metadata and Cursor adapters", () => {
    const skills = contentEntries.filter(
      (entry) => entry.category === "skills",
    );
    expect(skills.length).toBeGreaterThan(0);

    for (const entry of skills) {
      expect(entry.skillPackage?.format).toBe("agent-skill");
      expect(entry.skillPackage?.entrypoint).toBe("SKILL.md");
      expect(entry.platformCompatibility?.map((item) => item.platform)).toEqual(
        expect.arrayContaining([
          "Claude",
          "Codex",
          "Windsurf",
          "Gemini",
          "Cursor",
          "Generic AGENTS",
        ]),
      );
      expect(
        entry.platformCompatibility?.filter(
          (item) => item.supportLevel === "native-skill",
        ),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ platform: "Claude" }),
          expect.objectContaining({ platform: "Codex" }),
          expect.objectContaining({ platform: "Windsurf" }),
          expect.objectContaining({ platform: "Gemini" }),
        ]),
      );
      expect(entry.platformCompatibility).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            platform: "Cursor",
            supportLevel: "adapter",
          }),
        ]),
      );

      const cursorAdapterPath = path.join(
        dataRoot,
        "skill-adapters",
        "cursor",
        `${entry.slug}.mdc`,
      );
      expect(fs.existsSync(cursorAdapterPath)).toBe(true);
      expect(fs.readFileSync(cursorAdapterPath, "utf8").trimEnd()).toBe(
        buildCursorSkillAdapter(entry),
      );
    }
  });

  it("writes the generated full corpus LLM text artifact", () => {
    const llmsFullPath = path.join(dataRoot, "llms-full.txt");
    expect(fs.existsSync(llmsFullPath)).toBe(true);
    const llmsFull = fs.readFileSync(llmsFullPath, "utf8");
    expect(llmsFull).toMatch(/## Citation Facts/);
    expect(llmsFull).toMatch(/## Entry Content/);
    expect(contentEntries.some((entry) => getCopyText(entry).trim())).toBe(
      true,
    );
    expect(manifest).toMatchObject({
      schemaVersion: 2,
      kind: "registry-manifest",
      totalEntries: contentEntries.length,
    });
    expect(manifest.routes).toHaveLength(contentEntries.length);
    expect(manifest.routes[0]?.canonicalUrl).toMatch(
      /^https:\/\/heyclau\.de\//,
    );
    expect(manifest.routes[0]?.llmsUrl).toMatch(
      /^https:\/\/heyclau\.de\/data\/llms\//,
    );
    expect(manifest.qualitySummary).toBeTruthy();
    expect(manifest.artifacts.llmsFull).toBe("/data/llms-full.txt");
    expect(manifest.artifacts.contentQualityPrompts).toBe(
      "/data/content-quality-prompts.json",
    );
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          "apps/web/src/generated/content-category-spec.json",
        ),
      ),
    ).toBe(false);
  });
});
