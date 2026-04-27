import { NextResponse } from "next/server";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
} from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getSiteDb } from "@/lib/db";

const EVENT_TYPES = new Set(["copy", "open", "install", "download", "vote"]);

function normalizeEventType(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return EVENT_TYPES.has(normalized) ? normalized : "";
}

function normalizeEntryKey(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return /^[a-z0-9-]+:[a-z0-9-]+$/.test(normalized) ? normalized : "";
}

function normalizeSessionId(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length <= 128 ? normalized : "";
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "intent_events.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 4 * 1024)) {
    logApiWarn(request, "intent_events.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "intent_events.invalid_content_type");
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415 },
    );
  }

  if (
    isRateLimited({
      request,
      scope: "intent-events",
      limit: 60,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "intent_events.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    logApiWarn(request, "intent_events.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventType = normalizeEventType(payload.type);
  const entryKey = normalizeEntryKey(payload.entryKey);
  const sessionId = normalizeSessionId(payload.sessionId);
  if (!eventType) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const db = getSiteDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, stored: false, reason: "site_db_not_configured" },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    await db
      .prepare(
        `INSERT INTO intent_events (
          event_type,
          entry_key,
          source,
          session_id,
          created_at
        ) VALUES (?, ?, 'web', ?, CURRENT_TIMESTAMP)`,
      )
      .bind(eventType, entryKey || null, sessionId || null)
      .run();
    return NextResponse.json(
      { ok: true, stored: true },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    logApiWarn(request, "intent_events.insert_failed", { eventType });
    return NextResponse.json(
      { ok: false, stored: false, reason: "insert_failed" },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }
}
