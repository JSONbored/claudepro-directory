import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const seedPath = path.join(repoRoot, "content/data/legacy-vote-seed.json");
const d1Binding = process.env.SITE_D1_BINDING || "SITE_DB";
const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name)
  .sort();

const modeArg = process.argv.find((arg) => arg.startsWith("--mode=")) ?? "--mode=both";
const mode = modeArg.split("=")[1] ?? "both";
if (!["local", "remote", "both"].includes(mode)) {
  console.error(`Invalid mode "${mode}". Use --mode=local|remote|both.`);
  process.exit(1);
}

const expected = new Map();
if (fs.existsSync(seedPath)) {
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const votes = seed?.votes ?? {};
  for (const [key, value] of Object.entries(votes)) {
    const count = Number(value ?? 0);
    expected.set(String(key), Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0);
  }
}

for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  const files = fs.readdirSync(categoryDir).filter((fileName) => fileName.endsWith(".mdx"));
  for (const fileName of files) {
    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const { data } = matter(source);
    const slug = String(data.slug ?? fileName.replace(/\.mdx$/, ""));
    const entryKey = `${category}:${slug}`;
    if (expected.has(entryKey)) continue;
    const legacyVoteCount = Number(data.popularityScore ?? data.viewCount ?? 0);
    expected.set(
      entryKey,
      Number.isFinite(legacyVoteCount) ? Math.max(0, Math.trunc(legacyVoteCount)) : 0
    );
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
    "SELECT entry_key, upvote_count FROM votes_entries;"
  ];
  const output = execFileSync("pnpm", args, { cwd: repoRoot, encoding: "utf8" });
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
    rows.map((row) => [String(row.entry_key), Number(row.upvote_count ?? 0)])
  );

  const mismatches = [];
  for (const [entryKey, expectedCount] of expected.entries()) {
    const actualCount = actual.get(entryKey) ?? 0;
    if (actualCount !== expectedCount) {
      mismatches.push({ entryKey, expectedCount, actualCount });
    }
  }

  return {
    runMode,
    totalExpected: expected.size,
    totalRows: rows.length,
    mismatches
  };
}

const results = [];
if (mode === "local" || mode === "both") results.push(verifyRunMode("local"));
if (mode === "remote" || mode === "both") results.push(verifyRunMode("remote"));

let failed = false;
for (const result of results) {
  if (result.mismatches.length > 0 || result.totalRows < result.totalExpected) {
    failed = true;
  }

  console.log(
    `${result.runMode}: expected=${result.totalExpected} rows=${result.totalRows} mismatches=${result.mismatches.length}`
  );

  if (result.mismatches.length > 0) {
    console.log("First mismatches:");
    for (const mismatch of result.mismatches.slice(0, 20)) {
      console.log(
        `- ${mismatch.entryKey}: expected=${mismatch.expectedCount} actual=${mismatch.actualCount}`
      );
    }
  }
}

if (failed) {
  process.exit(1);
}
