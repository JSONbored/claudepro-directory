import crypto from "node:crypto";

import { getCopyText } from "./presentation.js";
import categorySpec from "./category-spec.json" with { type: "json" };
import {
  buildEntryQuality,
  buildContentPromptReport,
  buildContentQualityReport,
} from "./quality.js";
import { renderCorpusLlms, renderEntryLlms } from "./llms.js";
import { buildEntryJsonLdSnapshot } from "./seo.js";

export const ENTRY_SCHEMA_VERSION = 1;
export const RAYCAST_SCHEMA_VERSION = 2;
export const REGISTRY_ARTIFACT_SCHEMA_VERSION = 2;
export const SITE_URL = "https://heyclau.de";
export const RAYCAST_COPY_PREVIEW_LIMIT = 800;

export function truncateText(value, maxLength) {
  const normalized = String(value || "").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function codeBlock(language, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return `\`\`\`${language}\n${normalized}\n\`\`\``;
}

export function buildRaycastDetailMarkdown(entry) {
  const lines = [
    `# ${entry.title}`,
    "",
    entry.description,
    "",
    `**Category:** ${entry.category}`,
    entry.author ? `**Author:** ${entry.author}` : "",
    entry.verificationStatus
      ? `**Verification:** ${entry.verificationStatus}`
      : "",
    entry.downloadTrust ? `**Download trust:** ${entry.downloadTrust}` : "",
    entry.tags?.length
      ? `**Tags:** ${entry.tags.map((tag) => `\`${tag}\``).join(" ")}`
      : "",
  ].filter(Boolean);

  if (entry.installCommand || entry.commandSyntax) {
    lines.push(
      "",
      "## Install",
      codeBlock("bash", entry.installCommand || entry.commandSyntax),
    );
  }

  if (entry.configSnippet) {
    lines.push("", "## Config", codeBlock("json", entry.configSnippet));
  }

  if (entry.usageSnippet) {
    lines.push("", "## Usage", entry.usageSnippet);
  }

  const links = [
    `${SITE_URL}/${entry.category}/${entry.slug}`,
    entry.documentationUrl,
    entry.repoUrl,
  ].filter(Boolean);

  if (links.length) {
    lines.push("", "## Links", ...links.map((link) => `- ${link}`));
  }

  return truncateText(lines.join("\n"), 6000);
}

export function generatedAtForEntries(entries) {
  const latestDate = entries
    .map((entry) => String(entry.dateAdded || "").slice(0, 10))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()
    .at(-1);

  return latestDate
    ? `${latestDate}T00:00:00.000Z`
    : "1970-01-01T00:00:00.000Z";
}

export function dataUrl(...segments) {
  return `/data/${segments.map((segment) => encodeURIComponent(String(segment))).join("/")}`;
}

export function buildDirectoryEntries(entries) {
  return entries.map((entry) => {
    const {
      body: _body,
      sections: _sections,
      headings: _headings,
      codeBlocks: _codeBlocks,
      scriptBody: _scriptBody,
      ...directoryEntry
    } = entry;
    return directoryEntry;
  });
}

export function buildSearchEntries(entries) {
  return entries.map((entry) => ({
    category: entry.category,
    slug: entry.slug,
    title: entry.title,
    description: entry.cardDescription || entry.description,
    tags: entry.tags ?? [],
    keywords: entry.keywords ?? [],
    author: entry.author || "",
    dateAdded: entry.dateAdded || "",
    installable: Boolean(
      entry.installable || entry.installCommand || entry.downloadUrl,
    ),
    downloadTrust: entry.downloadTrust ?? null,
    verificationStatus: entry.verificationStatus || "",
    platforms: buildSkillPlatformCompatibility(entry).map(
      (item) => item.platform,
    ),
    supportLevels: buildSkillPlatformCompatibility(entry).map(
      (item) => item.supportLevel,
    ),
    documentationUrl: entry.documentationUrl || "",
    repoUrl: entry.repoUrl || "",
    url: `${SITE_URL}/${entry.category}/${entry.slug}`,
  }));
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function buildArtifactHash(value, type = "json") {
  return sha256Text(type === "json" ? JSON.stringify(value) : String(value));
}

export function buildSkillPlatformCompatibility(entry) {
  if (entry.category !== "skills") return [];
  if (Array.isArray(entry.platformCompatibility)) {
    return entry.platformCompatibility;
  }

  const verifiedAt = entry.verifiedAt || entry.dateAdded || "";
  return [
    {
      platform: "Claude",
      supportLevel: "native-skill",
      installPath: ".claude/skills/<skill-name>/SKILL.md",
      verifiedAt,
    },
    {
      platform: "Codex",
      supportLevel: "native-skill",
      installPath: ".agents/skills/<skill-name>/SKILL.md",
      verifiedAt,
    },
    {
      platform: "Windsurf",
      supportLevel: "native-skill",
      installPath: ".windsurf/skills/<skill-name>/SKILL.md",
      verifiedAt,
    },
    {
      platform: "Gemini",
      supportLevel: "native-skill",
      installPath:
        ".gemini/skills/<skill-name>/SKILL.md or .agents/skills/<skill-name>/SKILL.md",
      verifiedAt,
    },
    {
      platform: "Cursor",
      supportLevel: "adapter",
      installPath: ".cursor/rules/<skill-name>.mdc",
      adapterPath: dataUrl("skill-adapters", "cursor", `${entry.slug}.mdc`),
      verifiedAt,
    },
    {
      platform: "Generic AGENTS",
      supportLevel: "manual-context",
      installPath: "AGENTS.md or tool-specific context file",
      verifiedAt,
    },
  ];
}

export function buildCursorSkillAdapter(entry) {
  const description = truncateText(
    entry.cardDescription || entry.description,
    240,
  ).replaceAll('"', '\\"');
  const install = entry.installCommand || "";
  const source = entry.downloadUrl
    ? entry.downloadUrl.startsWith("/")
      ? `${SITE_URL}${entry.downloadUrl}`
      : entry.downloadUrl
    : entry.repoUrl ||
      entry.documentationUrl ||
      `${SITE_URL}/skills/${entry.slug}`;

  return [
    "---",
    `description: "${description}"`,
    "globs:",
    "alwaysApply: false",
    "---",
    "",
    `# ${entry.title}`,
    "",
    entry.description,
    "",
    "Use this rule when the user asks for this reusable skill workflow in Cursor. Cursor does not natively install Agent Skills from this package, so follow the SKILL.md instructions as a scoped workflow adapter.",
    "",
    install ? "## Install" : "",
    install ? codeBlock("bash", install) : "",
    "## Source",
    source,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildRaycastEntries(entries) {
  return entries.map((entry) => {
    const copyText = getCopyText(entry);

    return {
      category: entry.category,
      slug: entry.slug,
      title: entry.title,
      description: entry.cardDescription || entry.description,
      tags: entry.tags,
      installCommand: entry.installCommand || "",
      configSnippet: entry.configSnippet || "",
      copyText: truncateText(copyText, RAYCAST_COPY_PREVIEW_LIMIT),
      copyTextLength: copyText.length,
      copyTextTruncated: copyText.length > RAYCAST_COPY_PREVIEW_LIMIT,
      detailMarkdown: buildRaycastDetailMarkdown(entry),
      detailUrl: dataUrl("raycast", entry.category, `${entry.slug}.json`),
      webUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
      repoUrl: entry.repoUrl || "",
      documentationUrl: entry.documentationUrl || "",
      downloadTrust: entry.downloadTrust,
      verificationStatus: entry.verificationStatus || "",
      platformCompatibility: buildSkillPlatformCompatibility(entry),
    };
  });
}

export function buildEntryDetail(entry) {
  return {
    schemaVersion: ENTRY_SCHEMA_VERSION,
    key: `${entry.category}:${entry.slug}`,
    entry,
  };
}

export function buildRaycastDetail(entry) {
  return {
    schemaVersion: RAYCAST_SCHEMA_VERSION,
    key: `${entry.category}:${entry.slug}`,
    category: entry.category,
    slug: entry.slug,
    title: entry.title,
    copyText: getCopyText(entry),
    detailMarkdown: buildRaycastDetailMarkdown(entry),
    webUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
    repoUrl: entry.repoUrl || "",
    documentationUrl: entry.documentationUrl || "",
  };
}

export function buildArtifactEnvelope(kind, entries, extra = {}) {
  return {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind,
    generatedAt: generatedAtForEntries(entries),
    count: entries.length,
    ...extra,
    entries,
  };
}

export function buildEnvelopeEntries(payload) {
  if (!payload || !Array.isArray(payload.entries)) {
    throw new TypeError(
      "Registry artifacts must use an envelope with an entries array.",
    );
  }
  return payload.entries;
}

export function buildRaycastEnvelope(entries) {
  return {
    schemaVersion: RAYCAST_SCHEMA_VERSION,
    kind: "raycast-index",
    generatedAt: generatedAtForEntries(entries),
    count: entries.length,
    entries: buildRaycastEntries(entries),
  };
}

export function buildReadOnlyEcosystemFeed(entries, params = {}) {
  const siteUrl = params.siteUrl ?? SITE_URL;
  const payload = {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind: "ecosystem-feed",
    generatedAt: generatedAtForEntries(entries),
    count: entries.length,
    entries: entries.map((entry) => {
      const quality = buildEntryQuality(entry);
      return {
        key: `${entry.category}:${entry.slug}`,
        category: entry.category,
        slug: entry.slug,
        title: entry.title,
        description: entry.cardDescription || entry.description,
        url: `${siteUrl.replace(/\/$/, "")}/${entry.category}/${entry.slug}`,
        websiteUrl: entry.websiteUrl || "",
        documentationUrl: entry.documentationUrl || "",
        repoUrl: entry.repoUrl || "",
        pricingModel: entry.pricingModel || "",
        disclosure: entry.disclosure || "editorial",
        tags: entry.tags || [],
        qualityScore: quality.scores.total,
        provenance: quality.provenance,
      };
    }),
  };

  return {
    ...payload,
    signatureAlgorithm: "sha256",
    signature: buildArtifactHash(payload),
  };
}

function inferRepositorySource(repoUrl) {
  try {
    const hostname = new URL(repoUrl).hostname.toLowerCase();
    if (hostname === "github.com" || hostname.endsWith(".github.com")) {
      return "github";
    }
    if (hostname === "gitlab.com" || hostname.endsWith(".gitlab.com")) {
      return "gitlab";
    }
    if (hostname === "bitbucket.org" || hostname.endsWith(".bitbucket.org")) {
      return "bitbucket";
    }
    return hostname;
  } catch {
    return "unknown";
  }
}

export function buildMcpRegistryFeed(entries) {
  const mcpEntries = entries.filter((entry) => entry.category === "mcp");
  return {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind: "mcp-registry-feed",
    generatedAt: generatedAtForEntries(mcpEntries),
    count: mcpEntries.length,
    servers: mcpEntries.map((entry) => ({
      name: entry.slug,
      title: entry.title,
      description: entry.description,
      websiteUrl: entry.websiteUrl || entry.documentationUrl || "",
      repository: entry.repoUrl
        ? {
            url: entry.repoUrl,
            source: inferRepositorySource(entry.repoUrl),
          }
        : undefined,
      installCommand: entry.installCommand || "",
      configSnippet: entry.configSnippet || "",
      heyclaudeUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
    })),
  };
}

export function buildPluginExportFeed(entries) {
  const pluginEntries = entries.filter((entry) =>
    ["agents", "commands", "hooks", "mcp", "skills"].includes(entry.category),
  );
  const plugins = pluginEntries.map((entry) => ({
    name: entry.slug,
    title: entry.title,
    description: entry.cardDescription || entry.description,
    category: entry.category,
    sourceUrl: entry.repoUrl || entry.documentationUrl || entry.githubUrl,
    installCommand: entry.installCommand || entry.commandSyntax || "",
    platformCompatibility:
      entry.category === "skills" ? buildSkillPlatformCompatibility(entry) : [],
    heyclaudeUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
  }));

  return {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind: "plugin-export-feed",
    generatedAt: generatedAtForEntries(pluginEntries),
    count: plugins.length,
    plugins,
  };
}

export function buildRegistryChangelogFeed(entries) {
  const changes = [...entries]
    .sort((left, right) => {
      const dateCompare = String(right.dateAdded || "").localeCompare(
        String(left.dateAdded || ""),
      );
      return dateCompare || left.title.localeCompare(right.title);
    })
    .map((entry) => ({
      key: `${entry.category}:${entry.slug}`,
      type: "added",
      category: entry.category,
      slug: entry.slug,
      title: entry.title,
      dateAdded: entry.dateAdded || "",
      canonicalUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
      artifactHash: buildArtifactHash(buildEntryDetail(entry)),
    }));

  const payload = {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind: "registry-changelog",
    generatedAt: generatedAtForEntries(entries),
    count: changes.length,
    entries: changes,
  };

  return {
    ...payload,
    signatureAlgorithm: "sha256",
    signature: buildArtifactHash(payload),
  };
}

export function buildRegistryManifest(entries, extra = {}) {
  const categories = {};
  for (const category of categorySpec.categoryOrder) {
    const categoryEntries = entries.filter(
      (entry) => entry.category === category,
    );
    categories[category] = {
      count: categoryEntries.length,
      label: categorySpec.categories[category]?.label ?? category,
    };
  }

  return {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind: "registry-manifest",
    generatedAt: generatedAtForEntries(entries),
    totalEntries: entries.length,
    categoryOrder: categorySpec.categoryOrder,
    categories,
    routes: entries.map((entry) => ({
      key: `${entry.category}:${entry.slug}`,
      category: entry.category,
      slug: entry.slug,
      canonicalUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
    })),
    qualitySummary: buildContentQualityReport(entries).summary,
    artifacts: {
      directory: dataUrl("directory-index.json"),
      search: dataUrl("search-index.json"),
      raycast: dataUrl("raycast-index.json"),
      ecosystemFeed: dataUrl("ecosystem-feed.json"),
      mcpRegistryFeed: dataUrl("mcp-registry-feed.json"),
      pluginExportFeed: dataUrl("plugin-export-feed.json"),
      registryChangelog: dataUrl("registry-changelog.json"),
      registryManifest: dataUrl("registry-manifest.json"),
      contentQuality: dataUrl("content-quality-report.json"),
      contentQualityPrompts: dataUrl("content-quality-prompts.json"),
      jsonLdSnapshots: dataUrl("jsonld-snapshots.json"),
      llmsFull: dataUrl("llms-full.txt"),
      entryDetails: dataUrl("entries"),
      entryLlms: dataUrl("llms"),
      raycastDetails: dataUrl("raycast"),
      skillAdapters: dataUrl("skill-adapters"),
    },
    artifactContracts: extra.artifactContracts ?? {},
  };
}

export function buildArtifactManifestV2(entries, extra = {}) {
  return buildRegistryManifest(entries, extra);
}

export function buildContentQualityArtifact(entries) {
  return buildContentQualityReport(entries);
}

export function buildContentPromptArtifact(entries) {
  return buildContentPromptReport(entries);
}

export function buildJsonLdSnapshots(entries, params = {}) {
  return {
    schemaVersion: REGISTRY_ARTIFACT_SCHEMA_VERSION,
    kind: "jsonld-snapshots",
    generatedAt: generatedAtForEntries(entries),
    count: entries.length,
    entries: entries.map((entry) => buildEntryJsonLdSnapshot(entry, params)),
  };
}

export function buildEntryLlmsArtifact(entry, params = {}) {
  return renderEntryLlms(entry, params);
}

export function buildCorpusLlmsArtifact(entries, params = {}) {
  return renderCorpusLlms(entries, params);
}

export function buildRegistryArtifactSet(entries, params = {}) {
  const siteUrl = params.siteUrl ?? SITE_URL;
  const siteName = params.siteName ?? "HeyClaude";
  const siteDescription =
    params.siteDescription ??
    "The Claude directory for agents, MCP servers, skills, commands, hooks, rules, guides, collections, and statuslines.";
  const files = [
    {
      path: "directory-index.json",
      type: "json",
      value: buildArtifactEnvelope(
        "directory-index",
        buildDirectoryEntries(entries),
      ),
    },
    {
      path: "search-index.json",
      type: "json",
      value: buildArtifactEnvelope("search-index", buildSearchEntries(entries)),
    },
    {
      path: "raycast-index.json",
      type: "json",
      value: buildRaycastEnvelope(entries),
    },
    {
      path: "ecosystem-feed.json",
      type: "json",
      value: buildReadOnlyEcosystemFeed(entries, { siteUrl }),
    },
    {
      path: "mcp-registry-feed.json",
      type: "json",
      value: buildMcpRegistryFeed(entries),
    },
    {
      path: "plugin-export-feed.json",
      type: "json",
      value: buildPluginExportFeed(entries),
    },
    {
      path: "registry-changelog.json",
      type: "json",
      value: buildRegistryChangelogFeed(entries),
    },
    {
      path: "content-quality-report.json",
      type: "json",
      value: buildContentQualityArtifact(entries),
    },
    {
      path: "content-quality-prompts.json",
      type: "json",
      value: buildContentPromptArtifact(entries),
    },
    {
      path: "jsonld-snapshots.json",
      type: "json",
      value: buildJsonLdSnapshots(entries, { siteUrl, siteName }),
    },
    {
      path: "llms-full.txt",
      type: "text",
      value: buildCorpusLlmsArtifact(entries, {
        siteUrl,
        siteName,
        siteDescription,
      }),
    },
  ];

  for (const entry of entries) {
    files.push(
      {
        path: `entries/${entry.category}/${entry.slug}.json`,
        type: "json",
        value: buildEntryDetail(entry),
      },
      {
        path: `llms/${entry.category}/${entry.slug}.txt`,
        type: "text",
        value: buildEntryLlmsArtifact(entry, { siteUrl }),
      },
      {
        path: `raycast/${entry.category}/${entry.slug}.json`,
        type: "json",
        value: buildRaycastDetail(entry),
      },
    );

    if (entry.category === "skills") {
      files.push({
        path: `skill-adapters/cursor/${entry.slug}.mdc`,
        type: "text",
        value: buildCursorSkillAdapter(entry),
      });
    }
  }

  const artifactContracts = Object.fromEntries(
    files.map((file) => [
      file.path,
      {
        path: dataUrl(file.path),
        type: file.type,
        sha256: buildArtifactHash(file.value, file.type),
      },
    ]),
  );

  files.push({
    path: "registry-manifest.json",
    type: "json",
    value: buildRegistryManifest(entries, { artifactContracts }),
  });

  return files;
}
