export const LLMS_ARTIFACT_SCHEMA_VERSION = 3;

function clean(value) {
  return String(value ?? "").trim();
}

function sectionText(entry) {
  const chunks = [];

  if (entry.sections?.length) {
    for (const section of entry.sections) {
      const title = clean(section.title);
      const markdown = clean(section.markdown);
      if (!title && !markdown) continue;
      chunks.push(`## ${title || "Section"}`);
      if (markdown) chunks.push(markdown);
      if (section.codeBlocks?.length) {
        for (const block of section.codeBlocks) {
          const code = clean(block.code);
          if (!code) continue;
          const language = clean(block.language) || "text";
          chunks.push(`\`\`\`${language}\n${code}\n\`\`\``);
        }
      }
      chunks.push("");
    }
  }

  if (!chunks.length) {
    const body = clean(entry.body);
    if (body) chunks.push(body);
  }

  return chunks.join("\n").trim();
}

function listValue(values) {
  return values?.length ? values.join(", ") : "";
}

function entrySourceUrls(entry) {
  return [
    entry.documentationUrl,
    entry.repoUrl,
    entry.githubUrl,
    entry.websiteUrl,
  ]
    .map(clean)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function entryLastVerified(entry) {
  return (
    clean(entry.verifiedAt) ||
    clean(entry.contentUpdatedAt) ||
    clean(entry.repoUpdatedAt) ||
    clean(entry.dateAdded)
  );
}

export function buildEntryCitationFacts(entry, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const permalink = `${siteUrl.replace(/\/$/, "")}/${entry.category}/${entry.slug}`;
  const facts = [
    ["Canonical URL", permalink],
    ["Source URLs", listValue(entrySourceUrls(entry))],
    ["Brand", clean(entry.brandName)],
    ["Brand domain", clean(entry.brandDomain)],
    ["Brand asset source", clean(entry.brandAssetSource)],
    ["Package URL", clean(entry.downloadUrl)],
    ["Package SHA256", clean(entry.downloadSha256)],
    [
      "Platform compatibility",
      listValue(
        entry.platformCompatibility?.map(
          (item) => `${item.platform} (${item.supportLevel})`,
        ),
      ),
    ],
    ["Author", clean(entry.author)],
    ["Submitted by", clean(entry.submittedBy)],
    ["Submission issue", clean(entry.submissionIssueUrl)],
    ["Import PR", clean(entry.importPrUrl)],
    ["Reviewed by", clean(entry.reviewedBy)],
    ["Claim status", clean(entry.claimStatus)],
    ["Claimed by", clean(entry.claimedBy)],
    ["License", clean(entry.license)],
    ["Last verified", entryLastVerified(entry)],
    ["Robots", entry.robotsIndex === false ? "noindex" : "indexable"],
  ];

  return facts
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");
}

export function renderEntryLlms(entry, params = {}) {
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const permalink = `${siteUrl.replace(/\/$/, "")}/${entry.category}/${entry.slug}`;
  const lines = [
    `# ${clean(entry.title)}`,
    "",
    `URL: ${permalink}`,
    `Category: ${entry.category}`,
    entry.author ? `Author: ${entry.author}` : "",
    entry.submittedBy ? `Submitted by: ${entry.submittedBy}` : "",
    entry.submissionIssueUrl
      ? `Submission issue: ${entry.submissionIssueUrl}`
      : "",
    entry.importPrUrl ? `Import PR: ${entry.importPrUrl}` : "",
    entry.dateAdded ? `Date added: ${entry.dateAdded}` : "",
    entry.documentationUrl ? `Documentation: ${entry.documentationUrl}` : "",
    entry.repoUrl ? `Repository: ${entry.repoUrl}` : "",
    entry.githubUrl ? `Directory source: ${entry.githubUrl}` : "",
    entry.downloadUrl ? `Download: ${entry.downloadUrl}` : "",
    "",
    "## Citation Facts",
    buildEntryCitationFacts(entry, { siteUrl }),
    "",
    "## Summary",
    clean(entry.description),
    "",
    "## Tags",
    entry.tags?.length
      ? entry.tags.map((tag) => `- ${tag}`).join("\n")
      : "- none",
    "",
    "## Content",
    sectionText(entry),
    "",
  ].filter(Boolean);

  return lines.join("\n");
}

export function renderCorpusLlms(entries, params = {}) {
  const siteName = params.siteName || "HeyClaude";
  const siteDescription =
    params.siteDescription || "A directory for Claude resources and tools.";
  const siteUrl = params.siteUrl || "https://heyclau.de";
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const lines = [
    `# ${siteName} Full Corpus`,
    siteDescription,
    "",
    `Base URL: ${normalizedSiteUrl}`,
    `Total entries: ${entries.length}`,
    "",
    "## Entry Index",
  ];

  for (const entry of entries) {
    lines.push(
      `- [${entry.title}](${normalizedSiteUrl}/${entry.category}/${entry.slug}) (${entry.category})`,
    );
  }

  lines.push("", "## Entry Content");

  for (const entry of entries) {
    lines.push(
      "---",
      "",
      renderEntryLlms(entry, { siteUrl: normalizedSiteUrl }),
    );
  }

  return lines.join("\n");
}
