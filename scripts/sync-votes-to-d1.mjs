import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const d1Binding = process.env.SITE_D1_BINDING || "SITE_DB";

const modeArg =
  process.argv.find((arg) => arg.startsWith("--mode=")) ?? "--mode=both";
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

const statements = [];
const preview = [];
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

    const safeKey = entryKey.replaceAll("'", "''");
    statements.push(
      `INSERT OR IGNORE INTO votes_entries (entry_key, upvote_count, updated_at) VALUES ('${safeKey}', 0, CURRENT_TIMESTAMP);`,
    );
    if (preview.length < 10) {
      preview.push({ entryKey, upvoteCount: 0 });
    }
  }
}

if (process.env.DEBUG_SYNC === "1") {
  console.log("sync preview", preview);
}

function runWrangler(args) {
  execFileSync("pnpm", ["--filter", "web", "exec", "wrangler", ...args], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function applyMode(runMode) {
  const chunkSize = 50;
  for (let index = 0; index < statements.length; index += chunkSize) {
    const chunk = statements.slice(index, index + chunkSize).join(" ");
    const args = [
      "d1",
      "execute",
      d1Binding,
      runMode === "remote" ? "--remote" : "--local",
      "--command",
      chunk,
    ];
    runWrangler(args);
  }
}

if (mode === "local" || mode === "both") applyMode("local");
if (mode === "remote" || mode === "both") applyMode("remote");

console.log(`Ensured ${statements.length} vote rows in D1 (${mode}).`);
