import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSkillPlatformCompatibility,
  platformFeedSlug,
  SITE_URL,
} from "./platforms.js";
import {
  formatZodError,
  jsonSchemaForTool,
  parseToolArguments,
} from "./schemas.js";
import {
  buildSubmissionUrlsFromSpec,
  getCategorySubmissionGuidanceFromSpec,
  getSubmissionSchemaFromSpec,
  searchDuplicateEntries,
  validateSubmissionDraftFromSpec,
} from "./submissions.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const defaultDataDir = path.join(repoRoot, "apps", "web", "public", "data");
const safePathPartPattern = /^[a-z0-9-]+$/;

const platformAliases = new Map([
  ["claude", "Claude"],
  ["codex", "Codex"],
  ["openai", "Codex"],
  ["windsurf", "Windsurf"],
  ["gemini", "Gemini"],
  ["cursor", "Cursor"],
  ["cursor-rules", "Cursor"],
  ["generic-agents", "Generic AGENTS"],
  ["agents", "Generic AGENTS"],
  ["agents-context", "Generic AGENTS"],
  ["agents-md", "Generic AGENTS"],
]);

export const READ_ONLY_TOOL_NAMES = [
  "search_registry",
  "get_entry_detail",
  "get_compatibility",
  "get_install_guidance",
  "get_platform_adapter",
  "list_distribution_feeds",
  "get_submission_schema",
  "validate_submission_draft",
  "search_duplicate_entries",
  "build_submission_urls",
  "get_category_submission_guidance",
];

export const TOOL_DEFINITIONS = [
  {
    name: "search_registry",
    description:
      "Search read-only HeyClaude registry entries by query, category, and skill platform compatibility.",
    inputSchema: jsonSchemaForTool("search_registry"),
  },
  {
    name: "get_entry_detail",
    description:
      "Fetch a read-only HeyClaude registry entry detail payload by category and slug.",
    inputSchema: jsonSchemaForTool("get_entry_detail"),
  },
  {
    name: "get_compatibility",
    description:
      "Fetch platform compatibility metadata for a HeyClaude skill entry.",
    inputSchema: jsonSchemaForTool("get_compatibility"),
  },
  {
    name: "get_install_guidance",
    description:
      "Fetch read-only install, config, usage, and package guidance for a HeyClaude entry.",
    inputSchema: jsonSchemaForTool("get_install_guidance"),
  },
  {
    name: "get_platform_adapter",
    description:
      "Fetch generated read-only platform adapter content, currently Cursor rule adapters for skill packages.",
    inputSchema: jsonSchemaForTool("get_platform_adapter"),
  },
  {
    name: "list_distribution_feeds",
    description:
      "List read-only HeyClaude registry feeds, category feeds, platform feeds, and artifact locations.",
    inputSchema: jsonSchemaForTool("list_distribution_feeds"),
  },
  {
    name: "get_submission_schema",
    description:
      "Fetch read-only HeyClaude submission schemas and GitHub issue template fields by category.",
    inputSchema: jsonSchemaForTool("get_submission_schema"),
  },
  {
    name: "validate_submission_draft",
    description:
      "Validate a HeyClaude content submission draft locally without creating GitHub issues or publishing content.",
    inputSchema: jsonSchemaForTool("validate_submission_draft"),
  },
  {
    name: "search_duplicate_entries",
    description:
      "Search generated registry artifacts for likely duplicate entries before a user opens a submission issue.",
    inputSchema: jsonSchemaForTool("search_duplicate_entries"),
  },
  {
    name: "build_submission_urls",
    description:
      "Build prefilled HeyClaude submit and GitHub issue URLs for a validated submission draft without making write calls.",
    inputSchema: jsonSchemaForTool("build_submission_urls"),
  },
  {
    name: "get_category_submission_guidance",
    description:
      "Fetch category-specific HeyClaude contribution guidance, required fields, and review expectations.",
    inputSchema: jsonSchemaForTool("get_category_submission_guidance"),
  },
];

function dataDirFromOptions(options = {}) {
  return options.dataDir || process.env.HEYCLAUDE_DATA_DIR || defaultDataDir;
}

function isSafePathPart(value) {
  return safePathPartPattern.test(String(value || ""));
}

function safeRelativePath(relativePath) {
  const parts = String(relativePath || "").split("/");
  if (
    !parts.length ||
    parts.some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe registry artifact path: ${relativePath}`);
  }
  return parts.join(path.sep);
}

async function readTextArtifact(relativePath, options = {}) {
  if (typeof options.readTextArtifact === "function") {
    return options.readTextArtifact(relativePath);
  }

  const dataDir = dataDirFromOptions(options);
  const filePath = path.join(dataDir, safeRelativePath(relativePath));
  return readFile(filePath, "utf8");
}

async function readJsonArtifact(relativePath, options = {}) {
  if (typeof options.readJsonArtifact === "function") {
    return options.readJsonArtifact(relativePath);
  }

  return JSON.parse(await readTextArtifact(relativePath, options));
}

function unwrapEntries(payload) {
  if (!payload || !Array.isArray(payload.entries)) {
    throw new Error("Expected registry artifact envelope with entries array.");
  }
  return payload.entries;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeLimit(value, fallback = 10) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(1, Math.min(25, Math.trunc(numeric)));
}

function normalizePlatform(value) {
  const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, "-");
  if (!normalized) return "";
  return platformAliases.get(normalized) || String(value || "").trim();
}

function entryMatchesQuery(entry, query) {
  if (!query) return true;
  const haystack = [
    entry.title,
    entry.description,
    entry.cardDescription,
    entry.category,
    entry.slug,
    entry.author,
    entry.brandName,
    entry.brandDomain,
    ...(entry.tags || []),
    ...(entry.keywords || []),
  ]
    .map(normalizeText)
    .join(" ");
  return haystack.includes(query);
}

function entryMatchesPlatform(entry, platform) {
  if (!platform) return true;
  return (entry.platforms || []).some((candidate) => candidate === platform);
}

function toSearchResult(entry) {
  return {
    key: `${entry.category}:${entry.slug}`,
    category: entry.category,
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    tags: entry.tags || [],
    platforms: entry.platforms || [],
    brandName: entry.brandName || "",
    brandDomain: entry.brandDomain || "",
    url: entry.url || `${SITE_URL}/${entry.category}/${entry.slug}`,
    canonicalUrl:
      entry.canonicalUrl ||
      entry.url ||
      `${SITE_URL}/${entry.category}/${entry.slug}`,
  };
}

async function readEntry(category, slug, options = {}) {
  if (!isSafePathPart(category) || !isSafePathPart(slug)) {
    return null;
  }
  try {
    const payload = await readJsonArtifact(
      `entries/${category}/${slug}.json`,
      options,
    );
    return payload?.entry || null;
  } catch {
    return null;
  }
}

function notFound(message) {
  return { ok: false, error: { code: "not_found", message } };
}

function invalid(message) {
  return { ok: false, error: { code: "invalid_request", message } };
}

function invalidWithDetails(message, details) {
  return { ok: false, error: { code: "invalid_request", message, details } };
}

export async function searchRegistry(args = {}, options = {}) {
  const query = normalizeText(args.query);
  const category = normalizeText(args.category);
  const platform = normalizePlatform(args.platform);
  const limit = normalizeLimit(args.limit);
  const searchIndex = unwrapEntries(
    await readJsonArtifact("search-index.json", options),
  );

  const entries = searchIndex
    .filter((entry) => !category || entry.category === category)
    .filter((entry) => entryMatchesPlatform(entry, platform))
    .filter((entry) => entryMatchesQuery(entry, query))
    .slice(0, limit)
    .map(toSearchResult);

  return {
    ok: true,
    count: entries.length,
    query: args.query || "",
    category: category || "",
    platform: platform || "",
    entries,
  };
}

export async function getEntryDetail(args = {}, options = {}) {
  const category = normalizeText(args.category);
  const slug = normalizeText(args.slug);
  if (!category || !slug) {
    return invalid("category and slug are required.");
  }

  const entry = await readEntry(category, slug, options);
  if (!entry) {
    return notFound(`No HeyClaude entry found for ${category}/${slug}.`);
  }

  return {
    ok: true,
    key: `${entry.category}:${entry.slug}`,
    canonicalUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
    entry,
  };
}

export async function getCompatibility(args = {}, options = {}) {
  const category = normalizeText(args.category || "skills");
  const slug = normalizeText(args.slug);
  if (!slug) return invalid("slug is required.");

  const entry = await readEntry(category, slug, options);
  if (!entry) {
    return notFound(`No HeyClaude entry found for ${category}/${slug}.`);
  }

  return {
    ok: true,
    key: `${entry.category}:${entry.slug}`,
    category: entry.category,
    slug: entry.slug,
    platformCompatibility: buildSkillPlatformCompatibility(entry),
  };
}

export async function getInstallGuidance(args = {}, options = {}) {
  const category = normalizeText(args.category);
  const slug = normalizeText(args.slug);
  const platform = normalizePlatform(args.platform);
  if (!category || !slug) {
    return invalid("category and slug are required.");
  }

  const entry = await readEntry(category, slug, options);
  if (!entry) {
    return notFound(`No HeyClaude entry found for ${category}/${slug}.`);
  }

  const compatibility = buildSkillPlatformCompatibility(entry);
  const selectedCompatibility = platform
    ? compatibility.find((item) => item.platform === platform) || null
    : null;

  return {
    ok: true,
    key: `${entry.category}:${entry.slug}`,
    canonicalUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
    title: entry.title,
    installCommand: entry.installCommand || entry.commandSyntax || "",
    configSnippet: entry.configSnippet || "",
    usageSnippet: entry.usageSnippet || "",
    downloadUrl: entry.downloadUrl || "",
    documentationUrl: entry.documentationUrl || "",
    repoUrl: entry.repoUrl || "",
    platform: platform || "",
    selectedCompatibility,
    platformCompatibility: compatibility,
  };
}

export async function getPlatformAdapter(args = {}, options = {}) {
  const slug = normalizeText(args.slug);
  const platform = normalizePlatform(args.platform || "cursor");
  if (!slug) return invalid("slug is required.");

  if (platform !== "Cursor") {
    return {
      ok: true,
      platform,
      slug,
      adapterAvailable: false,
      message:
        "Native Agent Skill platforms use the SKILL.md package directly; generated adapters are currently provided for Cursor rules.",
    };
  }

  const entry = await readEntry("skills", slug, options);
  if (!entry) {
    return notFound(`No HeyClaude skill found for ${slug}.`);
  }

  try {
    const adapter = await readTextArtifact(
      `skill-adapters/cursor/${slug}.mdc`,
      options,
    );
    return {
      ok: true,
      platform: "Cursor",
      slug,
      adapterAvailable: true,
      adapterPath: `/data/skill-adapters/cursor/${slug}.mdc`,
      content: adapter,
    };
  } catch {
    return notFound(`No Cursor adapter generated for ${slug}.`);
  }
}

export async function listDistributionFeeds(args = {}, options = {}) {
  const [manifest, feedIndex] = await Promise.all([
    readJsonArtifact("registry-manifest.json", options),
    readJsonArtifact("feeds/index.json", options),
  ]);

  return {
    ok: true,
    schemaVersion: manifest.schemaVersion,
    generatedAt: manifest.generatedAt,
    artifacts: manifest.artifacts,
    categories: feedIndex.categories || [],
    platforms: (feedIndex.platforms || []).map((platform) => ({
      ...platform,
      feedSlug: platformFeedSlug(platform.platform),
    })),
  };
}

async function readSubmissionSpec(options = {}) {
  return readJsonArtifact("submission-spec.json", options);
}

export async function getSubmissionSchema(args = {}, options = {}) {
  return getSubmissionSchemaFromSpec(await readSubmissionSpec(options), args);
}

export async function validateSubmissionDraft(args = {}, options = {}) {
  return validateSubmissionDraftFromSpec(
    await readSubmissionSpec(options),
    args,
  );
}

export async function searchDuplicateRegistryEntries(args = {}, options = {}) {
  const searchIndex = unwrapEntries(
    await readJsonArtifact("search-index.json", options),
  );
  return searchDuplicateEntries(searchIndex, args);
}

export async function buildSubmissionUrls(args = {}, options = {}) {
  return buildSubmissionUrlsFromSpec(await readSubmissionSpec(options), args);
}

export async function getCategorySubmissionGuidance(args = {}, options = {}) {
  return getCategorySubmissionGuidanceFromSpec(
    await readSubmissionSpec(options),
    args,
  );
}

export async function callRegistryTool(name, args = {}, options = {}) {
  if (!READ_ONLY_TOOL_NAMES.includes(name)) {
    return invalid(`Unknown read-only HeyClaude MCP tool: ${name}`);
  }

  let parsedArgs;
  try {
    parsedArgs = parseToolArguments(name, args);
  } catch (error) {
    const details = formatZodError(error);
    if (details) {
      return invalidWithDetails(
        "Invalid HeyClaude MCP tool arguments.",
        details,
      );
    }
    throw error;
  }

  switch (name) {
    case "search_registry":
      return searchRegistry(parsedArgs, options);
    case "get_entry_detail":
      return getEntryDetail(parsedArgs, options);
    case "get_compatibility":
      return getCompatibility(parsedArgs, options);
    case "get_install_guidance":
      return getInstallGuidance(parsedArgs, options);
    case "get_platform_adapter":
      return getPlatformAdapter(parsedArgs, options);
    case "list_distribution_feeds":
      return listDistributionFeeds(parsedArgs, options);
    case "get_submission_schema":
      return getSubmissionSchema(parsedArgs, options);
    case "validate_submission_draft":
      return validateSubmissionDraft(parsedArgs, options);
    case "search_duplicate_entries":
      return searchDuplicateRegistryEntries(parsedArgs, options);
    case "build_submission_urls":
      return buildSubmissionUrls(parsedArgs, options);
    case "get_category_submission_guidance":
      return getCategorySubmissionGuidance(parsedArgs, options);
  }
}
