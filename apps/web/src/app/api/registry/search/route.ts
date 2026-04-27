import { NextResponse } from "next/server";
import type { SearchDocument } from "@heyclaude/registry";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getSearchIndex } from "@/lib/content";

function normalizeLimit(value: string | null) {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

function normalizeCategory(value: string | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return /^[a-z0-9-]+$/.test(normalized) ? normalized : "";
}

function matchesQuery(entry: SearchDocument, query: string) {
  if (!query) return true;
  const haystack = [
    entry.category,
    entry.title,
    entry.description,
    entry.author,
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

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.search.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-search",
      limit: 120,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.search.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = String(url.searchParams.get("q") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
  const category = normalizeCategory(url.searchParams.get("category"));
  const limit = normalizeLimit(url.searchParams.get("limit"));

  const entries = await getSearchIndex();
  const results = entries
    .filter((entry) => !category || entry.category === category)
    .filter((entry) => matchesQuery(entry, query))
    .slice(0, limit);

  return NextResponse.json(
    {
      schemaVersion: 1,
      query,
      category: category || "all",
      count: results.length,
      results,
    },
    {
      headers: {
        "cache-control": "public, max-age=60, stale-while-revalidate=600",
      },
    },
  );
}
