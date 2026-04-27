import { getRegistryChangelog } from "@/lib/content";
import { siteConfig } from "@/lib/site";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function atomDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date(0).toISOString()
    : date.toISOString();
}

export async function GET() {
  const changelog = await getRegistryChangelog();
  const entries = changelog.entries.slice(0, 100).map((entry) => {
    const title = `Added ${entry.title}`;
    const summary = `${entry.category}/${entry.slug} was added to the HeyClaude registry.`;
    return [
      "<entry>",
      `<title>${escapeXml(title)}</title>`,
      `<link href="${escapeXml(entry.canonicalUrl)}" />`,
      `<id>${escapeXml(entry.key)}:${escapeXml(entry.artifactHash)}</id>`,
      `<updated>${atomDate(entry.dateAdded || changelog.generatedAt)}</updated>`,
      `<category term="${escapeXml(entry.category)}" />`,
      `<summary>${escapeXml(summary)}</summary>`,
      "</entry>",
    ].join("");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `<title>${escapeXml(siteConfig.name)} Registry Updates</title>`,
    `<link href="${escapeXml(siteConfig.url)}" />`,
    `<link href="${escapeXml(`${siteConfig.url}/atom.xml`)}" rel="self" />`,
    `<id>${escapeXml(siteConfig.url)}</id>`,
    `<updated>${atomDate(changelog.generatedAt)}</updated>`,
    `<subtitle>${escapeXml(siteConfig.description)}</subtitle>`,
    ...entries,
    "</feed>",
  ].join("");

  return new Response(xml, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
