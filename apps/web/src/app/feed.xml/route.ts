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

function rssDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date(0).toUTCString()
    : date.toUTCString();
}

export async function GET() {
  const changelog = await getRegistryChangelog();
  const items = changelog.entries.slice(0, 100).map((entry) => {
    const title = `Added ${entry.title}`;
    const description = `${entry.category}/${entry.slug} was added to the HeyClaude registry.`;
    return [
      "<item>",
      `<title>${escapeXml(title)}</title>`,
      `<link>${escapeXml(entry.canonicalUrl)}</link>`,
      `<guid isPermaLink="false">${escapeXml(entry.key)}:${escapeXml(entry.artifactHash)}</guid>`,
      `<pubDate>${rssDate(entry.dateAdded)}</pubDate>`,
      `<category>${escapeXml(entry.category)}</category>`,
      `<description>${escapeXml(description)}</description>`,
      "</item>",
    ].join("");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(siteConfig.name)} Registry Updates</title>`,
    `<link>${escapeXml(siteConfig.url)}</link>`,
    `<description>${escapeXml(siteConfig.description)}</description>`,
    `<lastBuildDate>${rssDate(changelog.generatedAt)}</lastBuildDate>`,
    ...items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
