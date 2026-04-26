import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
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
  extractCodeBlocks,
  extractHeadings,
  extractSections,
  inferSectionBooleans,
  inferStructuredFields,
  normalizeBody,
} from "@heyclaude/registry/content-schema";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentRoot = path.join(repoRoot, "content");
const generatedDir = path.join(repoRoot, "apps/web/src/generated");
const publicDataDir = path.join(repoRoot, "apps/web/public/data");
const outputFile = path.join(publicDataDir, "content-index.json");
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
const generatedCategorySpecFile = path.join(
  generatedDir,
  "content-category-spec.json",
);
const skillsDownloadsDir = path.join(
  repoRoot,
  "apps/web/public/downloads/skills",
);
const mcpDownloadsDir = path.join(repoRoot, "apps/web/public/downloads/mcp");
const DIRECTORY_REPO_URL = "https://github.com/JSONbored/claudepro-directory";
const ENABLE_GITHUB_REPO_STATS = process.env.ENABLE_GITHUB_REPO_STATS === "1";
const categories = categorySpec.categoryOrder.filter((category) =>
  fs.existsSync(path.join(contentRoot, category)),
);

function buildGitHubUrl(filePath) {
  const relative = path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
  return `https://github.com/JSONbored/claudepro-directory/blob/main/${relative}`;
}

function parseGitHubRepo(repoUrl) {
  if (!repoUrl) return null;

  try {
    const url = new URL(repoUrl);
    if (url.hostname !== "github.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");

    return {
      owner,
      repo,
      key: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch {
    return null;
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

function normalizeDownloadUrl(downloadUrl) {
  if (!downloadUrl) return "";
  return downloadUrl;
}

function normalizeDateAdded(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const normalized = String(value).trim();
  const isoMatch = normalized.match(/^\d{4}-\d{2}-\d{2}/);
  return isoMatch?.[0] ?? normalized;
}

function isFirstPartyPackage(data = {}) {
  return data.packageVerified === true;
}

function isLocalDownloadUrl(downloadUrl) {
  return String(downloadUrl || "").startsWith("/downloads/");
}

function localDownloadSourcePath(downloadUrl) {
  const normalized = String(downloadUrl || "");
  if (normalized.startsWith("/downloads/skills/")) {
    return path.join(contentRoot, "skills", path.basename(normalized));
  }

  if (normalized.startsWith("/downloads/mcp/")) {
    return path.join(contentRoot, "mcp", path.basename(normalized));
  }

  return null;
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
  const directoryRepo = parseGitHubRepo(DIRECTORY_REPO_URL);

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
      const { data, content } = matter(source);
      const body = normalizeBody(content, category);
      const headings = extractHeadings(body);
      const codeBlocks = extractCodeBlocks(body);
      const sections = extractSections(body);
      const inferred = inferStructuredFields(data, body, category);
      const sectionFlags = inferSectionBooleans(body);
      const repoUrl = inferred.repoUrl ? String(inferred.repoUrl) : "";
      const githubRepo = parseGitHubRepo(repoUrl);
      const downloadUrl = normalizeDownloadUrl(
        data.downloadUrl ? String(data.downloadUrl) : "",
      );
      const localDownloadPath = isLocalDownloadUrl(downloadUrl)
        ? localDownloadSourcePath(downloadUrl)
        : null;
      const firstPartyPackage = isFirstPartyPackage(data);
      const downloadTrust = downloadUrl
        ? localDownloadPath && firstPartyPackage
          ? "first-party"
          : "external"
        : null;
      const downloadSha256 =
        localDownloadPath && fs.existsSync(localDownloadPath)
          ? sha256File(localDownloadPath)
          : null;

      if (githubRepo) {
        reposToFetch.set(githubRepo.key, githubRepo);
      }

      entries.push({
        category,
        slug: String(data.slug ?? fileName.replace(/\.mdx$/, "")),
        title: String(data.title ?? fileName.replace(/\.mdx$/, "")),
        description: String(data.description ?? ""),
        seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
        seoDescription: data.seoDescription
          ? String(data.seoDescription)
          : undefined,
        author: data.author ? String(data.author) : undefined,
        authorProfileUrl: data.authorProfileUrl
          ? String(data.authorProfileUrl)
          : undefined,
        dateAdded: normalizeDateAdded(data.dateAdded),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
        readingTime:
          typeof data.readingTime === "number" ? data.readingTime : undefined,
        difficultyScore:
          typeof data.difficultyScore === "number"
            ? data.difficultyScore
            : undefined,
        documentationUrl: data.documentationUrl
          ? String(data.documentationUrl)
          : undefined,
        websiteUrl: data.websiteUrl ? String(data.websiteUrl) : undefined,
        pricingModel: data.pricingModel ? String(data.pricingModel) : undefined,
        disclosure: data.disclosure ? String(data.disclosure) : undefined,
        applicationCategory: data.applicationCategory
          ? String(data.applicationCategory)
          : undefined,
        operatingSystem: data.operatingSystem
          ? String(data.operatingSystem)
          : undefined,
        cardDescription: inferred.cardDescription || undefined,
        installable: inferred.installable,
        installCommand: inferred.installCommand || undefined,
        usageSnippet: inferred.usageSnippet || undefined,
        copySnippet: inferred.copySnippet || undefined,
        configSnippet: inferred.configSnippet || undefined,
        commandSyntax:
          inferred.commandSyntax ||
          (data.commandSyntax ? String(data.commandSyntax) : undefined),
        argumentHint: data.argumentHint ? String(data.argumentHint) : undefined,
        allowedTools: Array.isArray(data.allowedTools)
          ? data.allowedTools.map(String)
          : undefined,
        scriptLanguage: inferred.scriptLanguage || undefined,
        scriptBody: inferred.scriptBody || undefined,
        trigger: inferred.trigger || undefined,
        items: Array.isArray(data.items)
          ? data.items.map((item) => ({
              slug: String(item.slug),
              category: String(item.category),
            }))
          : undefined,
        installationOrder: Array.isArray(data.installationOrder)
          ? data.installationOrder.map(String)
          : undefined,
        estimatedSetupTime: data.estimatedSetupTime
          ? String(data.estimatedSetupTime)
          : undefined,
        difficulty: data.difficulty ? String(data.difficulty) : undefined,
        skillType: inferred.skillType || undefined,
        skillLevel: inferred.skillLevel || undefined,
        verificationStatus: inferred.verificationStatus || undefined,
        verifiedAt: inferred.verifiedAt || undefined,
        retrievalSources:
          Array.isArray(inferred.retrievalSources) &&
          inferred.retrievalSources.length
            ? inferred.retrievalSources
            : undefined,
        testedPlatforms:
          Array.isArray(inferred.testedPlatforms) &&
          inferred.testedPlatforms.length
            ? inferred.testedPlatforms
            : undefined,
        prerequisites: Array.isArray(data.prerequisites)
          ? data.prerequisites.map(String)
          : undefined,
        hasPrerequisites:
          typeof data.hasPrerequisites === "boolean"
            ? data.hasPrerequisites
            : sectionFlags.hasPrerequisites,
        hasTroubleshooting:
          typeof data.hasTroubleshooting === "boolean"
            ? data.hasTroubleshooting
            : sectionFlags.hasTroubleshooting,
        hasBreakingChanges:
          typeof data.hasBreakingChanges === "boolean"
            ? data.hasBreakingChanges
            : undefined,
        robotsIndex:
          typeof data.robotsIndex === "boolean" ? data.robotsIndex : undefined,
        robotsFollow:
          typeof data.robotsFollow === "boolean"
            ? data.robotsFollow
            : undefined,
        packageVerified:
          typeof data.packageVerified === "boolean"
            ? data.packageVerified
            : undefined,
        downloadUrl,
        downloadTrust,
        downloadSha256,
        body,
        sections: sections.map((section) => ({
          title: section.title,
          id: section.id,
          markdown: section.markdown,
          codeBlocks: extractCodeBlocks(section.markdown),
        })),
        headings,
        codeBlocks,
        filePath: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
        githubUrl: buildGitHubUrl(filePath),
        repoUrl: githubRepo?.url ?? null,
        githubStars: null,
        githubForks: null,
        repoUpdatedAt: null,
      });
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

  const payload = `${JSON.stringify(buildArtifactEnvelope("content-index", entries), null, 2)}\n`;
  const wroteContentIndex = writeFileIfChanged(outputFile, payload);
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
    directoryRepo: DIRECTORY_REPO_URL,
    githubStars: directoryStats?.stars ?? null,
    githubForks: directoryStats?.forks ?? null,
    repoUpdatedAt: directoryStats?.updatedAt ?? null,
  };
  const wroteSiteStats = writeFileIfChanged(
    siteStatsFile,
    `${JSON.stringify(siteStatsPayload, null, 2)}\n`,
  );
  const wroteCategorySpec = writeFileIfChanged(
    generatedCategorySpecFile,
    `${JSON.stringify(categorySpec, null, 2)}\n`,
  );

  console.log(
    `${wroteContentIndex ? "Wrote" : "Unchanged"} ${entries.length} entries to ${path.relative(repoRoot, outputFile)}`,
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
  console.log(
    `${wroteCategorySpec ? "Wrote" : "Unchanged"} ${path.relative(repoRoot, generatedCategorySpecFile)}`,
  );
}

await main();
