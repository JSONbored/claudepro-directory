import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildContentQualityArtifact,
  buildContentPromptArtifact,
  buildDirectoryEntries,
  buildMcpRegistryFeed,
  buildPluginExportFeed,
  buildJsonLdSnapshots,
  buildReadOnlyEcosystemFeed,
  buildRaycastEnvelope,
  buildSearchEntries,
  getCopyText,
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
    routes: Array<{ key: string; canonicalUrl: string }>;
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

    expect(ecosystemFeed).toEqual(
      buildReadOnlyEcosystemFeed(contentEntries, {
        siteUrl: "https://heyclau.de",
      }),
    );
    expect(mcpFeed).toEqual(buildMcpRegistryFeed(contentEntries));
    expect(pluginFeed).toEqual(buildPluginExportFeed(contentEntries));
    expect(ecosystemFeed).toMatchObject({
      schemaVersion: 2,
      kind: "ecosystem-feed",
      count: contentEntries.length,
    });
    expect(ecosystemFeed.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(mcpFeed.kind).toBe("mcp-registry-feed");
    expect(pluginFeed.kind).toBe("plugin-export-feed");
    expect(manifest.artifactContracts["ecosystem-feed.json"]).toMatchObject({
      path: "/data/ecosystem-feed.json",
      type: "json",
    });
    expect(manifest.artifactContracts["llms-full.txt"]).toMatchObject({
      path: "/data/llms-full.txt",
      type: "text",
    });
    for (const contract of Object.values(manifest.artifactContracts)) {
      expect(contract.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("keeps full body fields out of compact indexes", () => {
    for (const entry of directoryEntries) {
      expect(entry.body).toBeUndefined();
      expect(entry.sections).toBeUndefined();
      expect(entry.scriptBody).toBeUndefined();
    }
    for (const entry of searchEntries) {
      expect(entry.url).toBeTruthy();
      expect((entry as Record<string, unknown>).body).toBeUndefined();
      expect((entry as Record<string, unknown>).copySnippet).toBeUndefined();
    }
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
      expect(raycastFeedEntry.copyTextLength).toBe(copyText.length);
      expect(raycastFeedEntry.copyTextTruncated).toBe(copyText.length > 20_000);
    }
  });

  it("writes the generated full corpus LLM text artifact", () => {
    const llmsFullPath = path.join(dataRoot, "llms-full.txt");
    expect(fs.existsSync(llmsFullPath)).toBe(true);
    expect(fs.readFileSync(llmsFullPath, "utf8")).toMatch(/## Entry Content/);
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
