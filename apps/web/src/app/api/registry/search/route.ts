import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";

type SearchEntry = {
  category: string;
  slug: string;
  title: string;
  description: string;
  tags?: string[];
  keywords?: string[];
  author?: string;
  verificationStatus?: string;
  downloadTrust?: string | null;
  url: string;
};

type SearchPayload =
  | SearchEntry[]
  | {
      schemaVersion?: number;
      generatedAt?: string;
      entries?: SearchEntry[];
    };

const DATA_ORIGIN = "https://heyclau.de";
let searchIndexPromise: Promise<SearchEntry[]> | null = null;

async function loadSearchIndexFile(): Promise<SearchPayload> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "search-index.json");
    return JSON.parse(await readFile(filePath, "utf8")) as SearchPayload;
  } catch {
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as {
      ASSETS: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
    };
    const response = await envRecord.ASSETS.fetch(
      new Request(`${DATA_ORIGIN}/data/search-index.json`)
    );
    if (!response.ok) {
      throw new Error(`Failed to load search-index.json asset (${response.status})`);
    }
    return (await response.json()) as SearchPayload;
  }
}

async function loadSearchIndex() {
  searchIndexPromise ??= loadSearchIndexFile().then((payload) =>
    Array.isArray(payload) ? payload : Array.isArray(payload.entries) ? payload.entries : []
  );
  return searchIndexPromise;
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value ?? 20);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

function normalizeCategory(value: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(normalized) ? normalized : "";
}

function matchesQuery(entry: SearchEntry, query: string) {
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

  if (isRateLimited({ request, scope: "registry-search", limit: 120, windowMs: 60_000 })) {
    logApiWarn(request, "registry.search.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = String(url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 120);
  const category = normalizeCategory(url.searchParams.get("category"));
  const limit = normalizeLimit(url.searchParams.get("limit"));

  const entries = await loadSearchIndex();
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
    }
  );
}
