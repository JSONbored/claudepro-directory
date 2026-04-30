import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { categorySpec, buildRegistryArtifactSet } from "@heyclaude/registry";
import {
  buildContentEntryFromMdx,
  DEFAULT_DIRECTORY_REPO_URL,
  parseGitHubRepo,
} from "@heyclaude/registry/content-builder";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentRoot = path.join(repoRoot, "content");
const generatedDir = path.join(repoRoot, "apps/web/src/generated");
const publicDataDir = path.join(repoRoot, "apps/web/public/data");
const entryDataDir = path.join(publicDataDir, "entries");
const entryLlmsDir = path.join(publicDataDir, "llms");
const raycastDetailDir = path.join(publicDataDir, "raycast");
const siteStatsFile = path.join(generatedDir, "site-stats.json");
const skillsDownloadsDir = path.join(
  repoRoot,
  "apps/web/public/downloads/skills",
);
const mcpDownloadsDir = path.join(repoRoot, "apps/web/public/downloads/mcp");
const ENABLE_GITHUB_REPO_STATS = process.env.ENABLE_GITHUB_REPO_STATS === "1";
const buildLockDir = path.join(repoRoot, ".build-content-index.lock");
const categories = categorySpec.categoryOrder.filter((category) =>
  fs.existsSync(path.join(contentRoot, category)),
);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withBuildLock(callback) {
  const staleAfterMs = 10 * 60 * 1000;
  const startedAt = Date.now();

  while (true) {
    try {
      fs.mkdirSync(buildLockDir);
      fs.writeFileSync(
        path.join(buildLockDir, "owner.json"),
        `${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }, null, 2)}\n`,
      );

      try {
        return await callback();
      } finally {
        fs.rmSync(buildLockDir, { recursive: true, force: true });
      }
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;

      let lockIsStale = false;
      try {
        const stats = fs.statSync(buildLockDir);
        lockIsStale = Date.now() - stats.mtimeMs > staleAfterMs;
      } catch {
        lockIsStale = true;
      }

      if (lockIsStale) {
        fs.rmSync(buildLockDir, { recursive: true, force: true });
        continue;
      }

      if (Date.now() - startedAt > staleAfterMs) {
        throw new Error("Timed out waiting for build-content-index lock");
      }

      await sleep(250);
    }
  }
}

async function fetchGitHubRepoStats(repo) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}`,
    {
      headers,
    },
  );

  if (!response.ok) {
    const fallback = await fetchShieldsStars(repo);
    if (fallback !== null) {
      return {
        stars: fallback,
        forks: undefined,
        updatedAt: undefined,
      };
    }

    throw new Error(`GitHub API ${response.status} for ${repo.key}`);
  }

  const data = await response.json();
  return {
    stars:
      typeof data.stargazers_count === "number"
        ? data.stargazers_count
        : undefined,
    forks: typeof data.forks_count === "number" ? data.forks_count : undefined,
    updatedAt:
      typeof data.updated_at === "string" ? data.updated_at : undefined,
  };
}

async function fetchShieldsStars(repo) {
  try {
    const response = await fetch(
      `https://img.shields.io/github/stars/${repo.owner}/${repo.repo}.json`,
    );

    if (!response.ok) return null;
    const data = await response.json();
    const value = Number.parseFloat(
      String(data.value || data.message || "").replace(/[^\d.]/g, ""),
    );

    return Number.isFinite(value) ? Math.round(value) : null;
  } catch {
    return null;
  }
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resetGeneratedJsonDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function writeFileIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, "utf8");
    if (current === content) return false;
  }

  const tempFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, content);
  fs.renameSync(tempFile, filePath);
  return true;
}

function writeJsonFile(filePath, value) {
  ensureDir(path.dirname(filePath));
  return writeFileIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeTextFile(filePath, value) {
  ensureDir(path.dirname(filePath));
  return writeFileIfChanged(
    filePath,
    value.endsWith("\n") ? value : `${value}\n`,
  );
}

function loadExistingContentUpdatedAt() {
  const values = new Map();
  if (!fs.existsSync(entryDataDir)) return values;

  for (const category of fs.readdirSync(entryDataDir)) {
    const categoryDir = path.join(entryDataDir, category);
    if (!fs.statSync(categoryDir).isDirectory()) continue;

    for (const fileName of fs.readdirSync(categoryDir)) {
      if (!fileName.endsWith(".json")) continue;

      try {
        const payload = JSON.parse(
          fs.readFileSync(path.join(categoryDir, fileName), "utf8"),
        );
        const entry = payload?.entry;
        if (!entry?.category || !entry?.slug || !entry?.contentUpdatedAt) {
          continue;
        }
        values.set(
          `${entry.category}:${entry.slug}`,
          String(entry.contentUpdatedAt),
        );
      } catch {
        // Regeneration should not fail just because a stale artifact is invalid.
      }
    }
  }

  return values;
}

function copyFileIfChanged(sourcePath, destPath) {
  const source = fs.readFileSync(sourcePath);
  if (fs.existsSync(destPath)) {
    const current = fs.readFileSync(destPath);
    if (Buffer.compare(source, current) === 0) return false;
  }

  fs.writeFileSync(destPath, source);
  return true;
}

ensureDir(generatedDir);
ensureDir(publicDataDir);
ensureDir(skillsDownloadsDir);
ensureDir(mcpDownloadsDir);

for (const fileName of fs.readdirSync(path.join(contentRoot, "skills"))) {
  if (!fileName.endsWith(".zip")) continue;
  copyFileIfChanged(
    path.join(contentRoot, "skills", fileName),
    path.join(skillsDownloadsDir, fileName),
  );
}

for (const fileName of fs.readdirSync(path.join(contentRoot, "mcp"))) {
  if (!fileName.endsWith(".mcpb")) continue;
  copyFileIfChanged(
    path.join(contentRoot, "mcp", fileName),
    path.join(mcpDownloadsDir, fileName),
  );
}

async function main() {
  const entries = [];
  const repoStats = new Map();
  const reposToFetch = new Map();
  const directoryRepo = parseGitHubRepo(DEFAULT_DIRECTORY_REPO_URL);
  const existingContentUpdatedAt = loadExistingContentUpdatedAt();

  if (directoryRepo) {
    reposToFetch.set(directoryRepo.key, directoryRepo);
  }

  for (const category of categories) {
    const categoryDir = path.join(contentRoot, category);
    const files = fs
      .readdirSync(categoryDir)
      .filter((fileName) => fileName.endsWith(".mdx"))
      .sort();

    for (const fileName of files) {
      const filePath = path.join(categoryDir, fileName);
      const source = fs.readFileSync(filePath, "utf8");
      const entry = buildContentEntryFromMdx({
        category,
        fileName,
        filePath,
        source,
        repoRoot,
        contentRoot,
        getLocalDownloadSha256(localDownloadPath) {
          return fs.existsSync(localDownloadPath)
            ? sha256File(localDownloadPath)
            : null;
        },
      });
      const existingUpdatedAt = existingContentUpdatedAt.get(
        `${entry.category}:${entry.slug}`,
      );
      entry.contentUpdatedAt = existingUpdatedAt || entry.dateAdded;
      const githubRepo = parseGitHubRepo(entry.repoUrl);

      if (githubRepo) {
        reposToFetch.set(githubRepo.key, githubRepo);
      }

      entries.push(entry);
    }
  }

  if (ENABLE_GITHUB_REPO_STATS) {
    await Promise.all(
      [...reposToFetch.values()].map(async (repo) => {
        try {
          repoStats.set(repo.key, await fetchGitHubRepoStats(repo));
        } catch (error) {
          console.warn(
            `Could not fetch GitHub stats for ${repo.key}: ${error.message}`,
          );
        }
      }),
    );
  }

  for (const entry of entries) {
    const githubRepo = parseGitHubRepo(entry.repoUrl);
    if (!githubRepo) continue;

    const stats = repoStats.get(githubRepo.key);
    if (!stats) continue;

    entry.githubStars = stats.stars ?? null;
    entry.githubForks = stats.forks ?? null;
    entry.repoUpdatedAt = stats.updatedAt ?? null;
  }

  entries.sort((left, right) => left.title.localeCompare(right.title));

  resetGeneratedJsonDir(entryDataDir);
  resetGeneratedJsonDir(entryLlmsDir);
  resetGeneratedJsonDir(raycastDetailDir);

  const artifactFiles = buildRegistryArtifactSet(entries, {
    siteUrl: "https://heyclau.de",
    siteName: "HeyClaude",
    siteDescription:
      "The Claude directory for agents, MCP servers, skills, commands, hooks, rules, guides, collections, and statuslines.",
  });
  const artifactResults = artifactFiles.map((file) => {
    const outputPath = path.join(publicDataDir, file.path);
    const wrote =
      file.type === "json"
        ? writeJsonFile(outputPath, file.value)
        : writeTextFile(outputPath, file.value);
    return { ...file, wrote, outputPath };
  });

  const directoryStats = directoryRepo
    ? repoStats.get(directoryRepo.key)
    : null;
  const siteStatsPayload = {
    directoryRepo: DEFAULT_DIRECTORY_REPO_URL,
    githubStars: directoryStats?.stars ?? null,
    githubForks: directoryStats?.forks ?? null,
    repoUpdatedAt: directoryStats?.updatedAt ?? null,
  };
  const wroteSiteStats = writeFileIfChanged(
    siteStatsFile,
    `${JSON.stringify(siteStatsPayload, null, 2)}\n`,
  );
  for (const result of artifactResults.filter(
    (file) => !file.path.includes("/"),
  )) {
    console.log(
      `${result.wrote ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, result.outputPath)}`,
    );
  }
  console.log(
    `Wrote ${artifactResults.filter((file) => file.path.startsWith("entries/")).length} entry detail files to ${path.relative(repoRoot, entryDataDir)}`,
  );
  console.log(
    `Wrote ${artifactResults.filter((file) => file.path.startsWith("llms/")).length} entry LLM files to ${path.relative(repoRoot, entryLlmsDir)}`,
  );
  console.log(
    `Wrote ${artifactResults.filter((file) => file.path.startsWith("raycast/")).length} Raycast detail files to ${path.relative(repoRoot, raycastDetailDir)}`,
  );
  console.log(
    `${wroteSiteStats ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, siteStatsFile)}`,
  );
}

await withBuildLock(main);
