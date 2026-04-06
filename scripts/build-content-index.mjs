import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { marked } from "marked";
import {
  extractCodeBlocks,
  extractHeadings,
  extractSections,
  headingId,
  inferStructuredFields,
  normalizeBody,
  stripCodeBlocks
} from "./content-schema.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentRoot = path.join(repoRoot, "content");
const generatedDir = path.join(repoRoot, "apps/web/src/generated");
const outputFile = path.join(generatedDir, "content-index.json");
const downloadsDir = path.join(repoRoot, "apps/web/public/downloads/skills");
const defaultRepoUrl = "https://github.com/JSONbored/claudepro-directory";

const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name);

marked.setOptions({
  gfm: true,
  breaks: false
});

const renderer = new marked.Renderer();
renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map((token) => token.raw).join("").trim();
  const id = headingId(text);
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

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

    return { owner, repo, key: `${owner}/${repo}`, url: `https://github.com/${owner}/${repo}` };
  } catch {
    return null;
  }
}

async function fetchGitHubRepoStats(repo) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, {
    headers
  });

  if (!response.ok) {
    const fallback = await fetchShieldsStars(repo);
    if (fallback !== null) {
      return {
        stars: fallback,
        forks: undefined,
        updatedAt: undefined
      };
    }

    throw new Error(`GitHub API ${response.status} for ${repo.key}`);
  }

  const data = await response.json();
  return {
    stars: typeof data.stargazers_count === "number" ? data.stargazers_count : undefined,
    forks: typeof data.forks_count === "number" ? data.forks_count : undefined,
    updatedAt: typeof data.updated_at === "string" ? data.updated_at : undefined
  };
}

async function fetchShieldsStars(repo) {
  try {
    const response = await fetch(
      `https://img.shields.io/github/stars/${repo.owner}/${repo.repo}.json`
    );

    if (!response.ok) return null;
    const data = await response.json();
    const value = Number.parseFloat(String(data.value || data.message || "").replace(/[^\d.]/g, ""));

    return Number.isFinite(value) ? Math.round(value) : null;
  } catch {
    return null;
  }
}

function normalizeDownloadUrl(downloadUrl) {
  if (!downloadUrl) return "";
  return downloadUrl;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(generatedDir);
ensureDir(downloadsDir);

for (const fileName of fs.readdirSync(path.join(contentRoot, "skills"))) {
  if (!fileName.endsWith(".zip")) continue;
  fs.copyFileSync(
    path.join(contentRoot, "skills", fileName),
    path.join(downloadsDir, fileName)
  );
}

async function main() {
  const entries = [];
  const repoStats = new Map();
  const reposToFetch = new Map();

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
      const repoUrl = inferred.repoUrl ? String(inferred.repoUrl) : defaultRepoUrl;
      const githubRepo = parseGitHubRepo(repoUrl);

      if (githubRepo) {
        reposToFetch.set(githubRepo.key, githubRepo);
      }

      entries.push({
        category,
        slug: String(data.slug ?? fileName.replace(/\.mdx$/, "")),
        title: String(data.title ?? fileName.replace(/\.mdx$/, "")),
        description: String(data.description ?? ""),
        seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
        seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
        author: data.author ? String(data.author) : undefined,
        authorProfileUrl: data.authorProfileUrl
          ? String(data.authorProfileUrl)
          : undefined,
        dateAdded: data.dateAdded ? String(data.dateAdded) : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
        readingTime:
          typeof data.readingTime === "number" ? data.readingTime : undefined,
        viewCount: typeof data.viewCount === "number" ? data.viewCount : undefined,
        copyCount: typeof data.copyCount === "number" ? data.copyCount : undefined,
        popularityScore:
          typeof data.popularityScore === "number" ? data.popularityScore : undefined,
        documentationUrl: data.documentationUrl
          ? String(data.documentationUrl)
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
              category: String(item.category)
            }))
          : undefined,
        installationOrder: Array.isArray(data.installationOrder)
          ? data.installationOrder.map(String)
          : undefined,
        estimatedSetupTime: data.estimatedSetupTime
          ? String(data.estimatedSetupTime)
          : undefined,
        difficulty: data.difficulty ? String(data.difficulty) : undefined,
        prerequisites: Array.isArray(data.prerequisites)
          ? data.prerequisites.map(String)
          : undefined,
        downloadUrl: normalizeDownloadUrl(
          data.downloadUrl ? String(data.downloadUrl) : ""
        ),
        body,
        html: marked.parse(body, { renderer }),
        sections: sections.map((section) => ({
          title: section.title,
          id: section.id,
          html: marked.parse(section.markdown, { renderer }),
          proseHtml: marked.parse(stripCodeBlocks(section.markdown), { renderer }),
          codeBlocks: extractCodeBlocks(section.markdown)
        })),
        headings,
        codeBlocks,
        filePath: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
        githubUrl: buildGitHubUrl(filePath),
        repoUrl: githubRepo?.url ?? null,
        githubStars: null,
        githubForks: null,
        repoUpdatedAt: null
      });
    }
  }

  await Promise.all(
    [...reposToFetch.values()].map(async (repo) => {
      try {
        repoStats.set(repo.key, await fetchGitHubRepoStats(repo));
      } catch (error) {
        console.warn(`Could not fetch GitHub stats for ${repo.key}: ${error.message}`);
      }
    })
  );

  for (const entry of entries) {
    const githubRepo = parseGitHubRepo(entry.repoUrl);
    if (!githubRepo) continue;

    const stats = repoStats.get(githubRepo.key);
    if (!stats) continue;

    entry.githubStars = stats.stars ?? null;
    entry.githubForks = stats.forks ?? null;
    entry.repoUpdatedAt = stats.updatedAt ?? null;
  }

  entries.sort((left, right) => {
    const popularity = (right.popularityScore ?? 0) - (left.popularityScore ?? 0);
    if (popularity !== 0) return popularity;
    return left.title.localeCompare(right.title);
  });

  const payload = `${JSON.stringify(entries, null, 2)}\n`;
  const tempOutputFile = `${outputFile}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempOutputFile, payload);
  fs.renameSync(tempOutputFile, outputFile);
  console.log(`Wrote ${entries.length} entries to ${path.relative(repoRoot, outputFile)}`);
}

await main();
