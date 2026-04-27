import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildContentQualityArtifact,
  buildContentPromptArtifact,
  buildDirectoryEntries,
  buildJsonLdSnapshots,
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
    entries: any[];
  }>("raycast-index.json");
  const manifest = readDataJson<{
    schemaVersion: number;
    totalEntries: number;
    artifacts: Record<string, string>;
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
    expect(buildRaycastEnvelope(contentEntries).entries).toEqual(
      raycastPayload.entries,
    );
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
        schemaVersion: 1,
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
      totalEntries: contentEntries.length,
    });
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
