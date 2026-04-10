import { NextResponse } from "next/server";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited
} from "@/lib/api-security";
import { getVotesDb, isValidEntryKey, toggleVote } from "@/lib/votes";

type TogglePayload = {
  key?: string;
  clientId?: string;
  vote?: boolean;
};

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 8 * 1024)) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: "invalid_content_type" }, { status: 415 });
  }

  if (isRateLimited({ request, scope: "votes-toggle", limit: 45, windowMs: 60_000 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: TogglePayload = {};
  try {
    payload = (await request.json()) as TogglePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const key = String(payload.key ?? "").trim();
  const clientId = String(payload.clientId ?? "").trim();
  const vote = Boolean(payload.vote);

  if (!isValidEntryKey(key) || !clientId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: "invalid_client_id" }, { status: 400 });
  }

  const db = getVotesDb();
  if (!db) {
    return NextResponse.json({ error: "votes_db_not_configured" }, { status: 503 });
  }

  try {
    const result = await toggleVote({
      db,
      entryKey: key,
      clientId,
      vote
    });

    return NextResponse.json(
      {
        key,
        count: result.count,
        voted: result.voted
      },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
