import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getRegistryChangelog } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

function normalizeLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(500, Math.trunc(parsed)));
}

function parseSinceDate(value: string | null) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function looksLikeHash(value: string | null) {
  return Boolean(value && /^[a-f0-9]{32,128}$/i.test(value));
}

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.diff.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-diff",
      limit: 120,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.diff.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const since = String(url.searchParams.get("since") ?? "").trim();
  const limit = normalizeLimit(url.searchParams.get("limit"));
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
}
