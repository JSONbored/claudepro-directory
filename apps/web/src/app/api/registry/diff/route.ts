import { registryDiffQuerySchema } from "@/lib/api/contracts";
import { createApiHandler, type InferApiQuery } from "@/lib/api/router";
import { getRegistryChangelog } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

function parseSinceDate(value: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function looksLikeHash(value: string | null) {
  return Boolean(value && /^[a-f0-9]{32,128}$/i.test(value));
}

export const GET = createApiHandler(
  "registry.diff",
  async ({ request, query: parsedQuery }) => {
    const { since, limit } = parsedQuery as InferApiQuery<
      typeof registryDiffQuerySchema
    >;
    const sinceDate = parseSinceDate(since);
    const changelog = await getRegistryChangelog();
    const currentSignature = changelog.signature ?? "";

    const entries =
      since && since === currentSignature
        ? []
        : sinceDate
          ? changelog.entries.filter((entry) => {
              const entryDate = Date.parse(entry.dateAdded);
              return Number.isFinite(entryDate) && entryDate > sinceDate;
            })
          : changelog.entries;

    return cachedJsonResponse(
      request,
      {
        schemaVersion: 1,
        kind: "registry-diff",
        generatedAt: changelog.generatedAt,
        since: since || null,
        currentSignature,
        hasChanges: entries.length > 0,
        count: Math.min(entries.length, limit),
        totalAvailable: entries.length,
        note:
          since && looksLikeHash(since) && since !== currentSignature
            ? "Unknown hash for this static registry snapshot; returning latest available changes."
            : undefined,
        entries: entries.slice(0, limit),
      },
      {
        headers: {
          "cache-control": "public, max-age=60, stale-while-revalidate=600",
        },
      },
    );
  },
);
