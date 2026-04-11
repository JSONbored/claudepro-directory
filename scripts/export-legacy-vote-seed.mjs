import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const outputPath = path.join(repoRoot, "content/data/legacy-vote-seed.json");
const refArg = process.argv.find((arg) => arg.startsWith("--ref=")) ?? "--ref=HEAD";
const gitRef = refArg.split("=")[1] ?? "HEAD";

const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name)
  .sort();

const seed = {};

for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  const files = fs.readdirSync(categoryDir).filter((fileName) => fileName.endsWith(".mdx"));

  for (const fileName of files) {
    const repoPath = `content/${category}/${fileName}`;
    const raw = execFileSync("git", ["show", `${gitRef}:${repoPath}`], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    const parsed = matter(raw);
    const slug = String(parsed.data.slug ?? fileName.replace(/\.mdx$/, ""));
    const key = `${category}:${slug}`;
    const legacyVoteCount = Number(parsed.data.popularityScore ?? parsed.data.viewCount ?? 0);
    seed[key] = Number.isFinite(legacyVoteCount) ? Math.max(0, Math.trunc(legacyVoteCount)) : 0;
  }
}

const payload = {
  sourceRef: gitRef,
  generatedAt: new Date().toISOString(),
  totalEntries: Object.keys(seed).length,
  votes: seed
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote legacy vote seed to ${path.relative(repoRoot, outputPath)} (${payload.totalEntries} entries)`);
