import type { SearchDocument } from "@heyclaude/registry";

import { registrySearchQuerySchema } from "@/lib/api/contracts";
import { createApiHandler, type InferApiQuery } from "@/lib/api/router";
import { getSearchIndex } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

function matchesQuery(entry: SearchDocument, query: string) {
  if (!query) return true;
  const haystack = [
    entry.category,
    entry.title,
    entry.description,
    entry.author,
    entry.submittedBy,
    entry.brandName,
    entry.brandDomain,
    entry.verificationStatus,
    entry.downloadTrust,
    ...(entry.tags ?? []),
    ...(entry.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesPlatform(entry: SearchDocument, platform: string) {
  if (!platform) return true;
  return (entry.platforms ?? []).some(
    (item) => String(item).trim().toLowerCase() === platform,
  );
}

export const GET = createApiHandler(
  "registry.search",
  async ({ request, query: parsedQuery }) => {
    const {
      q: query,
      category,
      platform,
      limit,
    } = parsedQuery as InferApiQuery<typeof registrySearchQuerySchema>;

    const entries = await getSearchIndex();
    const results = entries
      .filter((entry) => !category || entry.category === category)
      .filter((entry) => matchesPlatform(entry, platform))
      .filter((entry) => matchesQuery(entry, query))
      .slice(0, limit);

    return cachedJsonResponse(
      request,
      {
        schemaVersion: 1,
        query,
        category: category || "all",
        platform: platform || "all",
        count: results.length,
        results,
      },
      {
        headers: {
          "cache-control": "public, max-age=60, stale-while-revalidate=600",
        },
      },
    );
  },
);
