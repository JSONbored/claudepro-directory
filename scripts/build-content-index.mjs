import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  buildArtifactEnvelope,
  buildDirectoryEntries,
  buildEntryDetail,
  buildEntryLlmsArtifact,
  buildContentQualityArtifact,
  buildCorpusLlmsArtifact,
  buildJsonLdSnapshots,
  buildRaycastDetail,
  buildRaycastEnvelope,
  buildRegistryManifest,
  buildSearchEntries,
  categorySpec,
} from "@heyclaude/registry";
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
const directoryOutputFile = path.join(publicDataDir, "directory-index.json");
const searchOutputFile = path.join(publicDataDir, "search-index.json");
const registryManifestOutputFile = path.join(
  publicDataDir,
  "registry-manifest.json",
);
const contentQualityOutputFile = path.join(
  publicDataDir,
  "content-quality-report.json",
);
const jsonLdSnapshotsOutputFile = path.join(
  publicDataDir,
  "jsonld-snapshots.json",
);
const llmsFullOutputFile = path.join(publicDataDir, "llms-full.txt");
const raycastOutputFile = path.join(publicDataDir, "raycast-index.json");
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
const categories = categorySpec.categoryOrder.filter((category) =>
  fs.existsSync(path.join(contentRoot, category)),
);

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

  const directoryEntries = buildDirectoryEntries(entries);
  const searchEntries = buildSearchEntries(entries);

  resetGeneratedJsonDir(entryDataDir);
  resetGeneratedJsonDir(entryLlmsDir);
  resetGeneratedJsonDir(raycastDetailDir);
  let entryDetailCount = 0;
  let entryLlmsCount = 0;
  let raycastDetailCount = 0;

  for (const entry of entries) {
    writeJsonFile(
      path.join(entryDataDir, entry.category, `${entry.slug}.json`),
      buildEntryDetail(entry),
    );
    writeTextFile(
      path.join(entryLlmsDir, entry.category, `${entry.slug}.txt`),
      buildEntryLlmsArtifact(entry, { siteUrl: "https://heyclau.de" }),
    );
    writeJsonFile(
      path.join(raycastDetailDir, entry.category, `${entry.slug}.json`),
      buildRaycastDetail(entry),
    );
    entryDetailCount += 1;
    entryLlmsCount += 1;
    raycastDetailCount += 1;
  }

  const directoryPayload = `${JSON.stringify(buildArtifactEnvelope("directory-index", directoryEntries), null, 2)}\n`;
  const wroteDirectoryIndex = writeFileIfChanged(
    directoryOutputFile,
    directoryPayload,
  );
  const searchPayload = `${JSON.stringify(buildArtifactEnvelope("search-index", searchEntries), null, 2)}\n`;
  const wroteSearchIndex = writeFileIfChanged(searchOutputFile, searchPayload);
  const raycastPayload = `${JSON.stringify(buildRaycastEnvelope(entries), null, 2)}\n`;
  const wroteRaycastIndex = writeFileIfChanged(
    raycastOutputFile,
    raycastPayload,
  );
  const registryManifestPayload = `${JSON.stringify(buildRegistryManifest(entries), null, 2)}\n`;
  const wroteRegistryManifest = writeFileIfChanged(
    registryManifestOutputFile,
    registryManifestPayload,
  );
  const contentQualityPayload = `${JSON.stringify(buildContentQualityArtifact(entries), null, 2)}\n`;
  const wroteContentQuality = writeFileIfChanged(
    contentQualityOutputFile,
    contentQualityPayload,
  );
  const jsonLdSnapshotsPayload = `${JSON.stringify(
    buildJsonLdSnapshots(entries, {
      siteUrl: "https://heyclau.de",
      siteName: "HeyClaude",
    }),
    null,
    2,
  )}\n`;
  const wroteJsonLdSnapshots = writeFileIfChanged(
    jsonLdSnapshotsOutputFile,
    jsonLdSnapshotsPayload,
  );
  const wroteLlmsFull = writeTextFile(
    llmsFullOutputFile,
    buildCorpusLlmsArtifact(entries, {
      siteUrl: "https://heyclau.de",
      siteName: "HeyClaude",
      siteDescription:
        "The Claude directory for agents, MCP servers, skills, commands, hooks, rules, guides, collections, and statuslines.",
    }),
  );

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
  console.log(
    `${wroteDirectoryIndex ? "Wrote" : "Unchanged"} ${directoryEntries.length} entries to ${path.relative(repoRoot, directoryOutputFile)}`,
  );
  console.log(
    `${wroteSearchIndex ? "Wrote" : "Unchanged"} ${searchEntries.length} entries to ${path.relative(repoRoot, searchOutputFile)}`,
  );
  console.log(
    `${wroteRaycastIndex ? "Wrote" : "Unchanged"} ${entries.length} entries to ${path.relative(repoRoot, raycastOutputFile)}`,
  );
  console.log(
    `${wroteRegistryManifest ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, registryManifestOutputFile)}`,
  );
  console.log(
    `${wroteContentQuality ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, contentQualityOutputFile)}`,
  );
  console.log(
    `${wroteJsonLdSnapshots ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, jsonLdSnapshotsOutputFile)}`,
  );
  console.log(
    `${wroteLlmsFull ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, llmsFullOutputFile)}`,
  );
  console.log(
    `Wrote ${entryDetailCount} entry detail files to ${path.relative(repoRoot, entryDataDir)}`,
  );
  console.log(
    `Wrote ${entryLlmsCount} entry LLM files to ${path.relative(repoRoot, entryLlmsDir)}`,
  );
  console.log(
    `Wrote ${raycastDetailCount} Raycast detail files to ${path.relative(repoRoot, raycastDetailDir)}`,
  );
  console.log(
    `${wroteSiteStats ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, siteStatsFile)}`,
  );
}

await main();
