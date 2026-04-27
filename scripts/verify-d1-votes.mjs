import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const d1Binding = process.env.SITE_D1_BINDING || "SITE_DB";
const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name)
  .sort();

const modeArg =
  process.argv.find((arg) => arg.startsWith("--mode=")) ?? "--mode=both";
const mode = modeArg.split("=")[1] ?? "both";
if (!["local", "remote", "both"].includes(mode)) {
  console.error(`Invalid mode "${mode}". Use --mode=local|remote|both.`);
  process.exit(1);
}

const expected = new Set();
for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  const files = fs
    .readdirSync(categoryDir)
    .filter((fileName) => fileName.endsWith(".mdx"));
  for (const fileName of files) {
    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const { data } = matter(source);
    const slug = String(data.slug ?? fileName.replace(/\.mdx$/, ""));
    const entryKey = `${category}:${slug}`;
    expected.add(entryKey);
  }
}

function getRows(runMode) {
  const args = [
    "--filter",
    "web",
    "exec",
    "wrangler",
    "d1",
    "execute",
    d1Binding,
    runMode === "remote" ? "--remote" : "--local",
    "--command",
    "SELECT entry_key, upvote_count FROM votes_entries;",
  ];
  const output = execFileSync("pnpm", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const jsonMatch = output.match(/(\[\s*\{[\s\S]*\])\s*$/);
  if (!jsonMatch) {
    throw new Error(`Could not parse wrangler output for ${runMode}`);
  }
  const payload = JSON.parse(jsonMatch[1]);
  return payload?.[0]?.results ?? [];
}

function verifyRunMode(runMode) {
  const rows = getRows(runMode);
  const actual = new Map(
    rows.map((row) => [String(row.entry_key), Number(row.upvote_count ?? 0)]),
  );

  const missing = [];
  const negativeCounts = [];
  for (const entryKey of expected.values()) {
    if (!actual.has(entryKey)) {
      missing.push(entryKey);
      continue;
    }
    const count = actual.get(entryKey) ?? 0;
    if (!Number.isFinite(count) || count < 0) {
      negativeCounts.push({ entryKey, actualCount: count });
    }
  }

  return {
    runMode,
    totalExpected: expected.size,
    totalRows: rows.length,
    missing,
    negativeCounts,
  };
}

const results = [];
if (mode === "local" || mode === "both") results.push(verifyRunMode("local"));
if (mode === "remote" || mode === "both") results.push(verifyRunMode("remote"));

let failed = false;
for (const result of results) {
  if (
    result.missing.length > 0 ||
    result.negativeCounts.length > 0 ||
    result.totalRows < result.totalExpected
  ) {
    failed = true;
  }

  console.log(
    `${result.runMode}: expected=${result.totalExpected} rows=${result.totalRows} missing=${result.missing.length} invalidCounts=${result.negativeCounts.length}`,
  );

  if (result.missing.length > 0) {
    console.log("First missing rows:");
    for (const entryKey of result.missing.slice(0, 20))
      console.log(`- ${entryKey}`);
  }

  if (result.negativeCounts.length > 0) {
    console.log("First invalid counts:");
    for (const item of result.negativeCounts.slice(0, 20)) {
      console.log(`- ${item.entryKey}: actual=${item.actualCount}`);
    }
  }
}

if (failed) {
  process.exit(1);
}
