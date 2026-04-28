import fs from "node:fs";
import path from "node:path";

import { RAYCAST_COPY_PREVIEW_LIMIT } from "@heyclaude/registry";

const repoRoot = process.cwd();
const feedPath = path.join(repoRoot, "apps/web/public/data/raycast-index.json");
const directoryPath = path.join(
  repoRoot,
  "apps/web/public/data/directory-index.json",
);
const raycastFeedSourcePath = path.join(
  repoRoot,
  "integrations/raycast/src/feed.ts",
);
const raycastRegistryCommandSourcePath = path.join(
  repoRoot,
  "integrations/raycast/src/registry-command.tsx",
);
const requiredEntryFields = [
  "category",
  "slug",
  "title",
  "description",
  "tags",
  "copyText",
  "detailMarkdown",
  "detailUrl",
  "webUrl",
];
const forbiddenEntryFields = [
  "body",
  "sections",
  "headings",
  "codeBlocks",
  "scriptBody",
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${path.relative(repoRoot, filePath)}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readSource(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${path.relative(repoRoot, filePath)}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function objectBlock(source, name) {
  const match = source.match(
    new RegExp(`(?:const|export const)\\s+${name}[^=]*=\\s*{([\\s\\S]*?)\\n};`),
  );
  return match?.[1] ?? "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function objectDefinesKey(block, key) {
  const escapedKey = escapeRegExp(key);
  return new RegExp(
    `(^|\\n)\\s*(?:${escapedKey}|["']${escapedKey}["'])\\s*:`,
  ).test(block);
}

if (!fs.existsSync(feedPath)) {
  fail(`Missing Raycast feed: ${path.relative(repoRoot, feedPath)}`);
  process.exit();
}

const payload = readJson(feedPath);
const directoryPayload = readJson(directoryPath);
const feedSource = readSource(raycastFeedSourcePath);
const registryCommandSource = readSource(raycastRegistryCommandSourcePath);
const categoryLabelsBlock = objectBlock(feedSource, "categoryLabels");
const issueTemplateBlock = objectBlock(feedSource, "issueTemplateByCategory");
const categoryIconsBlock = objectBlock(registryCommandSource, "categoryIcons");

if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  fail("Raycast feed must be a versioned object envelope");
  process.exit();
}
if (
  !directoryPayload ||
  typeof directoryPayload !== "object" ||
  Array.isArray(directoryPayload) ||
  !Array.isArray(directoryPayload.entries)
) {
  fail("Directory index must be a versioned object envelope with entries");
  process.exit();
}

if (payload.schemaVersion !== 2) {
  fail(`Raycast feed schemaVersion must be 2, got ${payload.schemaVersion}`);
}
if (payload.kind !== "raycast-index") {
  fail(`Raycast feed kind must be raycast-index, got ${payload.kind}`);
}
if (
  !/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(String(payload.generatedAt ?? ""))
) {
  fail(
    "Raycast feed generatedAt must be deterministic YYYY-MM-DDT00:00:00.000Z",
  );
}
if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
  fail("Raycast feed entries must be a non-empty array");
  process.exit();
}
if (payload.count !== payload.entries.length) {
  fail("Raycast feed count must match entries length");
}
if (payload.entries.length !== directoryPayload.entries.length) {
  fail(
    `Raycast feed count ${payload.entries.length} must match directory count ${directoryPayload.entries.length}`,
  );
}

const directoryKeys = new Set(
  directoryPayload.entries.map((entry) => `${entry.category}:${entry.slug}`),
);
const raycastKeys = new Set(
  payload.entries.map((entry) => `${entry.category}:${entry.slug}`),
);
for (const key of directoryKeys) {
  if (!raycastKeys.has(key)) fail(`${key}: missing from Raycast feed`);
}
for (const key of raycastKeys) {
  if (!directoryKeys.has(key)) fail(`${key}: extra entry in Raycast feed`);
}

const seen = new Set();
const categories = new Set();
for (const entry of payload.entries) {
  const key = `${entry.category}:${entry.slug}`;
  categories.add(entry.category);
  if (seen.has(key)) fail(`Duplicate Raycast entry: ${key}`);
  seen.add(key);

  for (const field of requiredEntryFields) {
    if (
      entry[field] === undefined ||
      entry[field] === null ||
      entry[field] === ""
    ) {
      fail(`${key}: missing Raycast field ${field}`);
    }
  }
  for (const field of forbiddenEntryFields) {
    if (entry[field] !== undefined)
      fail(`${key}: forbidden Raycast field ${field}`);
  }
  if (!Array.isArray(entry.tags)) fail(`${key}: tags must be an array`);
  if (String(entry.copyText ?? "").length > RAYCAST_COPY_PREVIEW_LIMIT + 3) {
    fail(`${key}: feed copyText exceeds preview cap`);
  }

  const detailUrl = String(entry.detailUrl ?? "");
  if (!detailUrl.startsWith("/data/raycast/")) {
    fail(`${key}: detailUrl must point under /data/raycast`);
    continue;
  }

  const detailPath = path.join(repoRoot, "apps/web/public", detailUrl);
  if (!fs.existsSync(detailPath)) {
    fail(
      `${key}: missing detail payload ${path.relative(repoRoot, detailPath)}`,
    );
    continue;
  }

  const detail = JSON.parse(fs.readFileSync(detailPath, "utf8"));
  if (detail.schemaVersion !== 2)
    fail(`${key}: detail schemaVersion must be 2`);
  if (typeof detail.copyText !== "string" || detail.copyText.trim() === "") {
    fail(`${key}: detail copyText must be non-empty`);
  }
  if (
    entry.copyTextTruncated &&
    detail.copyText.length <= String(entry.copyText ?? "").length
  ) {
    fail(`${key}: truncated feed entry must have longer detail copyText`);
  }
}

for (const category of [...categories].sort()) {
  if (!objectDefinesKey(categoryLabelsBlock, category)) {
    fail(`${category}: missing Raycast category label`);
  }
  if (!objectDefinesKey(issueTemplateBlock, category)) {
    fail(`${category}: missing Raycast issue template mapping`);
  }
  if (!objectDefinesKey(categoryIconsBlock, category)) {
    fail(`${category}: missing Raycast icon mapping`);
  }
}

if (!process.exitCode) {
  console.log(`Validated ${payload.entries.length} Raycast feed entries.`);
}
