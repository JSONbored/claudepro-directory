import { getDirectoryEntries } from "@/lib/content";
import { applySecurityHeaders } from "@/lib/security-headers";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export async function GET() {
  const entries = await getDirectoryEntries();
  const categoryPages = siteConfig.categoryOrder.map(
    (category) => `${siteConfig.url}/${category}`,
  );
  const detailPages = entries.map(
    (entry) => `${siteConfig.url}/${entry.category}/${entry.slug}`,
  );

  const lines = [
    `# ${siteConfig.name}`,
    siteConfig.description,
    "",
    `Base URL: ${siteConfig.url}`,
    "Primary browse page: " + `${siteConfig.url}/browse`,
    `Full corpus export: ${siteConfig.url}/llms-full.txt`,
    "",
    "## Category Pages",
    ...categoryPages,
    "",
    "## Directory Entries",
    ...detailPages,
    "",
    "## Per-Entry LLM Exports",
    ...entries.map(
      (entry) => `${siteConfig.url}/${entry.category}/${entry.slug}/llms.txt`,
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: applySecurityHeaders(
      new Headers({
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      }),
    ),
  });
}
