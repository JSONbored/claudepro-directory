import { getCopyText } from "./presentation.js";
import categorySpec from "./category-spec.json" with { type: "json" };
import { buildContentQualityReport } from "./quality.js";
import { renderCorpusLlms, renderEntryLlms } from "./llms.js";
import { buildEntryJsonLdSnapshot } from "./seo.js";

export const ENTRY_SCHEMA_VERSION = 1;
export const RAYCAST_SCHEMA_VERSION = 1;
export const REGISTRY_ARTIFACT_SCHEMA_VERSION = 2;
export const SITE_URL = "https://heyclau.de";

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
    documentationUrl: entry.documentationUrl || "",
    repoUrl: entry.repoUrl || "",
    url: `${SITE_URL}/${entry.category}/${entry.slug}`,
  }));
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
      copyText: truncateText(copyText, 20000),
      copyTextLength: copyText.length,
      copyTextTruncated: copyText.length > 20000,
      detailMarkdown: buildRaycastDetailMarkdown(entry),
      detailUrl: dataUrl("raycast", entry.category, `${entry.slug}.json`),
      webUrl: `${SITE_URL}/${entry.category}/${entry.slug}`,
      repoUrl: entry.repoUrl || "",
      documentationUrl: entry.documentationUrl || "",
      downloadTrust: entry.downloadTrust,
      verificationStatus: entry.verificationStatus || "",
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
    generatedAt: generatedAtForEntries(entries),
    entries: buildRaycastEntries(entries),
  };
}

export function buildRegistryManifest(entries) {
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
    generatedAt: generatedAtForEntries(entries),
    totalEntries: entries.length,
    categoryOrder: categorySpec.categoryOrder,
    categories,
    artifacts: {
      content: dataUrl("content-index.json"),
      directory: dataUrl("directory-index.json"),
      search: dataUrl("search-index.json"),
      raycast: dataUrl("raycast-index.json"),
      registryManifest: dataUrl("registry-manifest.json"),
      contentQuality: dataUrl("content-quality-report.json"),
      jsonLdSnapshots: dataUrl("jsonld-snapshots.json"),
      llmsFull: dataUrl("llms-full.txt"),
      entryDetails: dataUrl("entries"),
      entryLlms: dataUrl("llms"),
      raycastDetails: dataUrl("raycast"),
    },
  };
}

export function buildArtifactManifestV2(entries, extra = {}) {
  return buildRegistryManifest(entries, extra);
}

export function buildContentQualityArtifact(entries) {
  return buildContentQualityReport(entries);
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
