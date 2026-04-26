import { NextResponse } from "next/server";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited
} from "@/lib/api-security";
import { logApiError, logApiInfo, logApiWarn, sample } from "@/lib/api-logs";
import { getVotesDb, isValidEntryKey, queryVoteCounts, queryVotesByClient } from "@/lib/votes";

type QueryPayload = {
  keys?: string[];
  clientId?: string;
};

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "votes.query.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 16 * 1024)) {
    logApiWarn(request, "votes.query.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "votes.query.invalid_content_type");
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415 });
  }

  if (isRateLimited({ request, scope: "votes-query", limit: 120, windowMs: 60_000 })) {
    logApiWarn(request, "votes.query.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: QueryPayload = {};
  try {
    payload = (await request.json()) as QueryPayload;
  } catch {
    logApiWarn(request, "votes.query.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawKeys = Array.isArray(payload.keys) ? payload.keys : [];
  const keys = [...new Set(rawKeys.map((key) => String(key).trim()))].filter(isValidEntryKey);
  const clientId = String(payload.clientId ?? "").trim();

  if (keys.length === 0) {
    return NextResponse.json({ counts: {}, voted: {}, available: true });
  }

  if (keys.length > 1000) {
    logApiWarn(request, "votes.query.too_many_keys", { keyCount: keys.length });
    return NextResponse.json({ error: "too_many_keys" }, { status: 400 });
  }

  const db = getVotesDb();
  if (!db) {
    const counts: Record<string, number> = {};
    const voted: Record<string, boolean> = {};
    for (const key of keys) {
      counts[key] = 0;
      voted[key] = false;
    }
    return NextResponse.json({ counts, voted, available: false });
  }

  try {
    const [counts, voted] = await Promise.all([
      queryVoteCounts(db, keys),
      clientId ? queryVotesByClient(db, keys, clientId) : Promise.resolve({})
    ]);

    if (sample(0.02)) {
      logApiInfo(request, "votes.query.sample", { keyCount: keys.length, hasClient: Boolean(clientId) });
    }
    return NextResponse.json(
      {
        counts,
        voted,
        available: true
      },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch {
    logApiError(request, "votes.query.internal_error", { keyCount: keys.length });
    const counts: Record<string, number> = {};
    const voted: Record<string, boolean> = {};
    for (const key of keys) {
      counts[key] = 0;
      voted[key] = false;
    }
    return NextResponse.json(
      { counts, voted, available: false },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  }
}
