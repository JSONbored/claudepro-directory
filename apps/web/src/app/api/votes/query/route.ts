import { NextResponse } from "next/server";

import { hasBodyWithinLimit, isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { getVotesDb, isValidEntryKey, queryVoteCounts, queryVotesByClient } from "@/lib/votes";

type QueryPayload = {
  keys?: string[];
  clientId?: string;
};

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 16 * 1024)) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (isRateLimited({ request, scope: "votes-query", limit: 120, windowMs: 60_000 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: QueryPayload = {};
  try {
    payload = (await request.json()) as QueryPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawKeys = Array.isArray(payload.keys) ? payload.keys : [];
  const keys = [...new Set(rawKeys.map((key) => String(key).trim()))].filter(isValidEntryKey);
  const clientId = String(payload.clientId ?? "").trim();

  if (keys.length === 0) {
    return NextResponse.json({ counts: {}, voted: {}, available: true });
  }

  if (keys.length > 1000) {
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

  const [counts, voted] = await Promise.all([
    queryVoteCounts(db, keys),
    clientId ? queryVotesByClient(db, keys, clientId) : Promise.resolve({})
  ]);

  return NextResponse.json({
    counts,
    voted,
    available: true
  });
}
