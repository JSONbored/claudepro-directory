import type { ContentEntry } from "@/lib/content";
import { siteConfig } from "@/lib/site";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function sectionText(entry: ContentEntry) {
  const chunks: string[] = [];

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

export function renderEntryLlms(entry: ContentEntry) {
  const permalink = `${siteConfig.url}/${entry.category}/${entry.slug}`;
  const lines: string[] = [
    `# ${clean(entry.title)}`,
    "",
    `URL: ${permalink}`,
    `Category: ${entry.category}`,
    entry.author ? `Author: ${entry.author}` : "",
    entry.dateAdded ? `Date added: ${entry.dateAdded}` : "",
    entry.documentationUrl ? `Documentation: ${entry.documentationUrl}` : "",
    entry.githubUrl ? `Source: ${entry.githubUrl}` : "",
    entry.downloadUrl ? `Download: ${entry.downloadUrl}` : "",
    "",
    "## Summary",
    clean(entry.description),
    "",
    "## Tags",
    entry.tags?.length ? entry.tags.map((tag) => `- ${tag}`).join("\n") : "- none",
    "",
    "## Content",
    sectionText(entry),
    ""
  ].filter(Boolean);

  return lines.join("\n");
}

export function renderCorpusLlms(entries: ContentEntry[]) {
  const lines: string[] = [
    `# ${siteConfig.name} Full Corpus`,
    siteConfig.description,
    "",
    `Base URL: ${siteConfig.url}`,
    `Total entries: ${entries.length}`,
    "",
    "## Entry Index"
  ];

  for (const entry of entries) {
    lines.push(
      `- [${entry.title}](${siteConfig.url}/${entry.category}/${entry.slug}) (${entry.category})`
    );
  }

  lines.push("", "## Entry Content");

  for (const entry of entries) {
    lines.push("---", "", renderEntryLlms(entry));
  }

  return lines.join("\n");
}
