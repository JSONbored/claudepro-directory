import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildDirectoryEntries,
  buildContentQualityArtifact,
  buildJsonLdSnapshots,
  buildRaycastEnvelope,
  buildSearchEntries,
  getCopyText,
} from "@heyclaude/registry";

const repoRoot = process.cwd();
const dataRoot = path.join(repoRoot, "apps/web/public/data");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, relativePath), "utf8"));
}

function entriesFromPayload(payload) {
  assert.ok(
    payload && !Array.isArray(payload),
    "registry artifacts must be envelope objects",
  );
  assert.ok(
    Array.isArray(payload.entries),
    "registry artifact envelope must include entries",
  );
  return payload.entries;
}

const contentPayload = readJson("content-index.json");
const directoryPayload = readJson("directory-index.json");
const searchPayload = readJson("search-index.json");
const raycastPayload = readJson("raycast-index.json");
const manifest = readJson("registry-manifest.json");
const qualityPayload = readJson("content-quality-report.json");
const jsonLdSnapshotsPayload = readJson("jsonld-snapshots.json");

const contentEntries = entriesFromPayload(contentPayload);
const directoryEntries = entriesFromPayload(directoryPayload);
const searchEntries = entriesFromPayload(searchPayload);

assert.equal(
  contentPayload.schemaVersion,
  2,
  "content index must use V2 envelope schema",
);
assert.equal(
  contentPayload.kind,
  "content-index",
  "content index kind must be stable",
);
assert.equal(
  contentPayload.count,
  contentEntries.length,
  "content index count must match entries",
);
assert.equal(
  directoryPayload.schemaVersion,
  2,
  "directory index must use V2 envelope schema",
);
assert.equal(
  directoryPayload.kind,
  "directory-index",
  "directory index kind must be stable",
);
assert.equal(
  directoryPayload.count,
  directoryEntries.length,
  "directory index count must match entries",
);
assert.equal(
  searchPayload.schemaVersion,
  2,
  "search index must use V2 envelope schema",
);
assert.equal(
  searchPayload.kind,
  "search-index",
  "search index kind must be stable",
);
assert.equal(
  searchPayload.count,
  searchEntries.length,
  "search index count must match entries",
);
assert.ok(contentEntries.length > 0, "content index must contain entries");
assert.equal(
  directoryEntries.length,
  contentEntries.length,
  "directory index count must match content",
);
assert.equal(
  searchEntries.length,
  contentEntries.length,
  "search index count must match content",
);
assert.equal(
  raycastPayload.schemaVersion,
  1,
  "Raycast feed must stay on schemaVersion 1",
);
assert.equal(
  raycastPayload.entries.length,
  contentEntries.length,
  "Raycast entry count must match content",
);
assert.equal(manifest.schemaVersion, 2, "registry manifest must use V2 schema");
assert.equal(
  manifest.totalEntries,
  contentEntries.length,
  "registry manifest count must match content",
);
assert.equal(
  manifest.artifacts.content,
  "/data/content-index.json",
  "manifest content artifact path must be stable",
);
assert.equal(
  manifest.artifacts.directory,
  "/data/directory-index.json",
  "manifest directory artifact path must be stable",
);
assert.equal(
  manifest.artifacts.search,
  "/data/search-index.json",
  "manifest search artifact path must be stable",
);
assert.equal(
  manifest.artifacts.raycast,
  "/data/raycast-index.json",
  "manifest Raycast artifact path must be stable",
);
assert.equal(
  manifest.artifacts.contentQuality,
  "/data/content-quality-report.json",
  "manifest quality artifact path must be stable",
);
assert.equal(
  manifest.artifacts.jsonLdSnapshots,
  "/data/jsonld-snapshots.json",
  "manifest JSON-LD snapshots path must be stable",
);
assert.equal(
  manifest.artifacts.llmsFull,
  "/data/llms-full.txt",
  "manifest LLMS full artifact path must be stable",
);
assert.equal(
  qualityPayload.schemaVersion,
  2,
  "quality report must use V2 schema",
);
assert.equal(
  qualityPayload.count,
  contentEntries.length,
  "quality report count must match content",
);
assert.equal(
  jsonLdSnapshotsPayload.schemaVersion,
  2,
  "JSON-LD snapshots must use V2 schema",
);
assert.equal(
  jsonLdSnapshotsPayload.count,
  contentEntries.length,
  "JSON-LD snapshot count must match content",
);
assert.deepEqual(
  qualityPayload,
  buildContentQualityArtifact(contentEntries),
  "quality report must be derived by registry builder",
);
assert.deepEqual(
  jsonLdSnapshotsPayload,
  JSON.parse(
    JSON.stringify(
      buildJsonLdSnapshots(contentEntries, {
        siteUrl: "https://heyclau.de",
        siteName: "HeyClaude",
      }),
    ),
  ),
  "JSON-LD snapshots must be derived by registry builder",
);

for (const entry of directoryEntries) {
  assert.equal(
    entry.body,
    undefined,
    `${entry.category}/${entry.slug} directory entry must not include body`,
  );
  assert.equal(
    entry.sections,
    undefined,
    `${entry.category}/${entry.slug} directory entry must not include sections`,
  );
  assert.equal(
    entry.scriptBody,
    undefined,
    `${entry.category}/${entry.slug} directory entry must not include scriptBody`,
  );
}

for (const entry of searchEntries) {
  assert.ok(
    entry.url,
    `${entry.category}/${entry.slug} search entry must include URL`,
  );
  assert.equal(
    entry.body,
    undefined,
    `${entry.category}/${entry.slug} search entry must not include body`,
  );
  assert.equal(
    entry.copySnippet,
    undefined,
    `${entry.category}/${entry.slug} search entry must not include copySnippet`,
  );
}

const rebuiltDirectory = buildDirectoryEntries(contentEntries);
const rebuiltSearch = buildSearchEntries(contentEntries);
const rebuiltRaycast = buildRaycastEnvelope(contentEntries);
const raycastEntryByKey = new Map(
  raycastPayload.entries.map((entry) => [
    `${entry.category}:${entry.slug}`,
    entry,
  ]),
);

assert.deepEqual(
  directoryEntries,
  rebuiltDirectory,
  "directory index must be derived by registry builder",
);
assert.deepEqual(
  searchEntries,
  rebuiltSearch,
  "search index must be derived by registry builder",
);
assert.deepEqual(
  raycastPayload.entries,
  rebuiltRaycast.entries,
  "Raycast feed entries must be derived by registry builder",
);

for (const entry of contentEntries) {
  const key = `${entry.category}:${entry.slug}`;
  const detailPayload = readJson(
    `entries/${entry.category}/${entry.slug}.json`,
  );
  assert.equal(
    detailPayload.schemaVersion,
    1,
    `${key} detail must be versioned`,
  );
  assert.equal(detailPayload.key, key, `${key} detail key must be stable`);
  assert.equal(
    detailPayload.entry.title,
    entry.title,
    `${key} detail entry must match content index`,
  );

  const raycastDetail = readJson(
    `raycast/${entry.category}/${entry.slug}.json`,
  );
  const entryLlmsPath = path.join(
    dataRoot,
    "llms",
    entry.category,
    `${entry.slug}.txt`,
  );
  const raycastFeedEntry = raycastEntryByKey.get(key);
  const copyText = getCopyText(entry);
  assert.ok(
    fs.existsSync(entryLlmsPath),
    `${key} must have a per-entry LLM text artifact`,
  );
  assert.ok(raycastFeedEntry, `${key} must exist in Raycast feed`);
  assert.equal(
    raycastDetail.schemaVersion,
    1,
    `${key} Raycast detail must be versioned`,
  );
  assert.equal(
    raycastDetail.key,
    key,
    `${key} Raycast detail key must be stable`,
  );
  assert.equal(
    raycastDetail.copyText,
    copyText,
    `${key} Raycast detail must contain full copy text`,
  );
  assert.equal(
    raycastFeedEntry.copyTextLength,
    copyText.length,
    `${key} Raycast feed copy length must match`,
  );
  assert.equal(
    raycastFeedEntry.copyTextTruncated,
    copyText.length > 20000,
    `${key} Raycast feed truncation flag must match copy length`,
  );
}

const llmsFullPath = path.join(dataRoot, "llms-full.txt");
assert.ok(fs.existsSync(llmsFullPath), "full corpus LLMS artifact must exist");
assert.match(
  fs.readFileSync(llmsFullPath, "utf8"),
  /## Entry Content/,
  "full corpus LLMS artifact must include entry content",
);

const copyableEntry = contentEntries.find(
  (entry) => getCopyText(entry).trim().length > 0,
);
assert.ok(copyableEntry, "at least one entry must produce copy text");

console.log(
  `Registry artifact tests passed for ${contentEntries.length} entries.`,
);
