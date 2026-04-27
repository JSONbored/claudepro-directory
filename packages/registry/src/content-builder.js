import path from "node:path";

import matter from "gray-matter";

import {
  extractCodeBlocks,
  extractHeadings,
  extractSections,
  inferSectionBooleans,
  inferStructuredFields,
  normalizeBody,
} from "./content-schema.js";

export const DEFAULT_DIRECTORY_REPO_URL =
  "https://github.com/JSONbored/claudepro-directory";

export function buildGitHubUrl(filePath, repoRoot) {
  const relative = path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
  return `${DEFAULT_DIRECTORY_REPO_URL}/blob/main/${relative}`;
}

export function parseGitHubRepo(repoUrl) {
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

export function normalizeDownloadUrl(downloadUrl) {
  if (!downloadUrl) return "";
  return String(downloadUrl);
}

export function normalizeDateAdded(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const normalized = String(value).trim();
  const isoMatch = normalized.match(/^\d{4}-\d{2}-\d{2}/);
  return isoMatch?.[0] ?? normalized;
}

export function isFirstPartyPackage(data = {}) {
  return data.packageVerified === true;
}

export function isLocalDownloadUrl(downloadUrl) {
  return String(downloadUrl || "").startsWith("/downloads/");
}

export function localDownloadSourcePath(downloadUrl, contentRoot) {
  const normalized = String(downloadUrl || "");
  if (normalized.startsWith("/downloads/skills/")) {
    return path.join(contentRoot, "skills", path.basename(normalized));
  }

  if (normalized.startsWith("/downloads/mcp/")) {
    return path.join(contentRoot, "mcp", path.basename(normalized));
  }

  return null;
}

export function buildContentEntryFromMdx(params) {
  const {
    category,
    fileName,
    filePath,
    source,
    repoRoot,
    contentRoot,
    getLocalDownloadSha256 = () => null,
  } = params;
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
    ? localDownloadSourcePath(downloadUrl, contentRoot)
    : null;
  const firstPartyPackage = isFirstPartyPackage(data);
  const downloadTrust = downloadUrl
    ? localDownloadPath && firstPartyPackage
      ? "first-party"
      : "external"
    : null;
  const downloadSha256 = localDownloadPath
    ? getLocalDownloadSha256(localDownloadPath)
    : null;

  return {
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
    affiliateUrl: data.affiliateUrl ? String(data.affiliateUrl) : undefined,
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
      Array.isArray(inferred.testedPlatforms) && inferred.testedPlatforms.length
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
      typeof data.robotsFollow === "boolean" ? data.robotsFollow : undefined,
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
    githubUrl: buildGitHubUrl(filePath, repoRoot),
    repoUrl: githubRepo?.url ?? null,
    githubStars: null,
    githubForks: null,
    repoUpdatedAt: null,
  };
}
