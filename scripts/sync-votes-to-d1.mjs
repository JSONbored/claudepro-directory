import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const seedPath = path.join(repoRoot, "content/data/legacy-vote-seed.json");

const modeArg = process.argv.find((arg) => arg.startsWith("--mode=")) ?? "--mode=both";
const mode = modeArg.split("=")[1] ?? "both";
if (!["local", "remote", "both"].includes(mode)) {
  console.error(`Invalid mode "${mode}". Use --mode=local|remote|both.`);
  process.exit(1);
}

const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name)
  .sort();

const seedVotes = new Map();
if (fs.existsSync(seedPath)) {
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const votes = seed?.votes ?? {};
  for (const [key, value] of Object.entries(votes)) {
    const count = Number(value ?? 0);
    seedVotes.set(String(key), Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0);
  }
}

const statements = [];
const preview = [];
for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  const files = fs.readdirSync(categoryDir).filter((fileName) => fileName.endsWith(".mdx"));

  for (const fileName of files) {
    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const { data } = matter(source);
    const slug = String(data.slug ?? fileName.replace(/\.mdx$/, ""));
    const entryKey = `${category}:${slug}`;
    const fromSeed = seedVotes.get(entryKey);
    const fallback = Number(data.popularityScore ?? data.viewCount ?? 0);
    const upvoteCount =
      fromSeed ?? (Number.isFinite(fallback) ? Math.max(0, Math.trunc(fallback)) : 0);

    const safeKey = entryKey.replaceAll("'", "''");
    statements.push(
      `INSERT INTO votes_entries (entry_key, upvote_count, updated_at) VALUES ('${safeKey}', ${upvoteCount}, CURRENT_TIMESTAMP) ` +
        "ON CONFLICT(entry_key) DO UPDATE SET upvote_count = excluded.upvote_count, updated_at = CURRENT_TIMESTAMP;"
    );
    if (preview.length < 10) {
      preview.push({ entryKey, upvoteCount, fromSeed: fromSeed ?? null });
    }
  }
}

if (process.env.DEBUG_SYNC === "1") {
  console.log("sync preview", preview);
}

function runWrangler(args) {
  execFileSync("pnpm", ["--filter", "web", "exec", "wrangler", ...args], {
    cwd: repoRoot,
    stdio: "inherit"
  });
}

function applyMode(runMode) {
  const chunkSize = 50;
  for (let index = 0; index < statements.length; index += chunkSize) {
    const chunk = statements.slice(index, index + chunkSize).join(" ");
    const args = [
      "d1",
      "execute",
      "VOTES_DB",
      runMode === "remote" ? "--remote" : "--local",
      "--command",
      chunk
    ];
    runWrangler(args);
  }
}

if (mode === "local" || mode === "both") applyMode("local");
if (mode === "remote" || mode === "both") applyMode("remote");

console.log(`Synced ${statements.length} vote counters to D1 (${mode}).`);
