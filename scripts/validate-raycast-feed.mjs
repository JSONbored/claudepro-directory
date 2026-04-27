import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const feedPath = path.join(repoRoot, "apps/web/public/data/raycast-index.json");
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

if (!fs.existsSync(feedPath)) {
  fail(`Missing Raycast feed: ${path.relative(repoRoot, feedPath)}`);
  process.exit();
}

const payload = JSON.parse(fs.readFileSync(feedPath, "utf8"));
if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
  fail("Raycast feed must be a versioned object envelope");
  process.exit();
}

if (payload.schemaVersion !== 1) {
  fail(`Raycast feed schemaVersion must be 1, got ${payload.schemaVersion}`);
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

const seen = new Set();
for (const entry of payload.entries) {
  const key = `${entry.category}:${entry.slug}`;
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
  if (String(entry.copyText ?? "").length > 20003) {
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
  if (detail.schemaVersion !== 1)
    fail(`${key}: detail schemaVersion must be 1`);
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

if (!process.exitCode) {
  console.log(`Validated ${payload.entries.length} Raycast feed entries.`);
}
