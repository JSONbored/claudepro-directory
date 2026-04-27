import { NextResponse } from "next/server";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
} from "@/lib/api-security";
import { logApiError, logApiInfo, logApiWarn, sample } from "@/lib/api-logs";
import { getVotesDb, isValidEntryKey, toggleVote } from "@/lib/votes";

type TogglePayload = {
  key?: string;
  clientId?: string;
  vote?: boolean;
};

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "votes.toggle.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 8 * 1024)) {
    logApiWarn(request, "votes.toggle.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "votes.toggle.invalid_content_type");
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415 },
    );
  }

  if (
    isRateLimited({
      request,
      scope: "votes-toggle",
      limit: 45,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "votes.toggle.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: TogglePayload = {};
  try {
    payload = (await request.json()) as TogglePayload;
  } catch {
    logApiWarn(request, "votes.toggle.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const key = String(payload.key ?? "").trim();
  const clientId = String(payload.clientId ?? "").trim();
  const vote = Boolean(payload.vote);

  if (!isValidEntryKey(key) || !clientId) {
    logApiWarn(request, "votes.toggle.invalid_payload");
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (clientId.length < 8 || clientId.length > 128) {
    logApiWarn(request, "votes.toggle.invalid_client_id", {
      clientIdLength: clientId.length,
    });
    return NextResponse.json({ error: "invalid_client_id" }, { status: 400 });
  }

  const db = getVotesDb();
  if (!db) {
    logApiError(request, "votes.toggle.db_not_configured");
    return NextResponse.json(
      { error: "votes_db_not_configured" },
      { status: 503 },
    );
  }

  try {
    const result = await toggleVote({
      db,
      entryKey: key,
      clientId,
      vote,
    });

    if (sample(0.05)) {
      logApiInfo(request, "votes.toggle.sample", {
        key,
        vote,
        voted: result.voted,
        count: result.count,
      });
    }
    return NextResponse.json(
      {
        key,
        count: result.count,
        voted: result.voted,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch {
    logApiError(request, "votes.toggle.internal_error", { key });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
