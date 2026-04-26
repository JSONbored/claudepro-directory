import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildDirectoryEntries,
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
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.entries) ? payload.entries : [];
}

const contentPayload = readJson("content-index.json");
const directoryPayload = readJson("directory-index.json");
const searchPayload = readJson("search-index.json");
const raycastPayload = readJson("raycast-index.json");
const manifest = readJson("registry-manifest.json");

const contentEntries = entriesFromPayload(contentPayload);
const directoryEntries = entriesFromPayload(directoryPayload);
const searchEntries = entriesFromPayload(searchPayload);

assert.deepEqual(entriesFromPayload(contentEntries), contentEntries, "legacy array payloads must still parse");
assert.equal(contentPayload.schemaVersion, 1, "content index must be versioned");
assert.equal(contentPayload.kind, "content-index", "content index kind must be stable");
assert.equal(contentPayload.count, contentEntries.length, "content index count must match entries");
assert.equal(directoryPayload.schemaVersion, 1, "directory index must be versioned");
assert.equal(directoryPayload.kind, "directory-index", "directory index kind must be stable");
assert.equal(directoryPayload.count, directoryEntries.length, "directory index count must match entries");
assert.equal(searchPayload.schemaVersion, 1, "search index must be versioned");
assert.equal(searchPayload.kind, "search-index", "search index kind must be stable");
assert.equal(searchPayload.count, searchEntries.length, "search index count must match entries");
assert.ok(contentEntries.length > 0, "content index must contain entries");
assert.equal(directoryEntries.length, contentEntries.length, "directory index count must match content");
assert.equal(searchEntries.length, contentEntries.length, "search index count must match content");
assert.equal(raycastPayload.schemaVersion, 1, "Raycast feed must stay on schemaVersion 1");
assert.equal(raycastPayload.entries.length, contentEntries.length, "Raycast entry count must match content");
assert.equal(manifest.schemaVersion, 1, "registry manifest must be versioned");
assert.equal(manifest.totalEntries, contentEntries.length, "registry manifest count must match content");
assert.equal(manifest.artifacts.content, "/data/content-index.json", "manifest content artifact path must be stable");
assert.equal(manifest.artifacts.directory, "/data/directory-index.json", "manifest directory artifact path must be stable");
assert.equal(manifest.artifacts.search, "/data/search-index.json", "manifest search artifact path must be stable");
assert.equal(manifest.artifacts.raycast, "/data/raycast-index.json", "manifest Raycast artifact path must be stable");

for (const entry of directoryEntries) {
  assert.equal(entry.body, undefined, `${entry.category}/${entry.slug} directory entry must not include body`);
  assert.equal(entry.sections, undefined, `${entry.category}/${entry.slug} directory entry must not include sections`);
  assert.equal(entry.scriptBody, undefined, `${entry.category}/${entry.slug} directory entry must not include scriptBody`);
}

for (const entry of searchEntries) {
  assert.ok(entry.url, `${entry.category}/${entry.slug} search entry must include URL`);
  assert.equal(entry.body, undefined, `${entry.category}/${entry.slug} search entry must not include body`);
  assert.equal(entry.copySnippet, undefined, `${entry.category}/${entry.slug} search entry must not include copySnippet`);
}

const rebuiltDirectory = buildDirectoryEntries(contentEntries);
const rebuiltSearch = buildSearchEntries(contentEntries);
const rebuiltRaycast = buildRaycastEnvelope(contentEntries);
const raycastEntryByKey = new Map(
  raycastPayload.entries.map((entry) => [`${entry.category}:${entry.slug}`, entry])
);

assert.deepEqual(directoryEntries, rebuiltDirectory, "directory index must be derived by registry builder");
assert.deepEqual(searchEntries, rebuiltSearch, "search index must be derived by registry builder");
assert.deepEqual(raycastPayload.entries, rebuiltRaycast.entries, "Raycast feed entries must be derived by registry builder");

for (const entry of contentEntries) {
  const key = `${entry.category}:${entry.slug}`;
  const detailPayload = readJson(`entries/${entry.category}/${entry.slug}.json`);
  assert.equal(detailPayload.schemaVersion, 1, `${key} detail must be versioned`);
  assert.equal(detailPayload.key, key, `${key} detail key must be stable`);
  assert.equal(detailPayload.entry.title, entry.title, `${key} detail entry must match content index`);

  const raycastDetail = readJson(`raycast/${entry.category}/${entry.slug}.json`);
  const raycastFeedEntry = raycastEntryByKey.get(key);
  const copyText = getCopyText(entry);
  assert.ok(raycastFeedEntry, `${key} must exist in Raycast feed`);
  assert.equal(raycastDetail.schemaVersion, 1, `${key} Raycast detail must be versioned`);
  assert.equal(raycastDetail.key, key, `${key} Raycast detail key must be stable`);
  assert.equal(raycastDetail.copyText, copyText, `${key} Raycast detail must contain full copy text`);
  assert.equal(raycastFeedEntry.copyTextLength, copyText.length, `${key} Raycast feed copy length must match`);
  assert.equal(
    raycastFeedEntry.copyTextTruncated,
    copyText.length > 20000,
    `${key} Raycast feed truncation flag must match copy length`
  );
}

const copyableEntry = contentEntries.find((entry) => getCopyText(entry).trim().length > 0);
assert.ok(copyableEntry, "at least one entry must produce copy text");

console.log(`Registry artifact tests passed for ${contentEntries.length} entries.`);
