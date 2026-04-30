import { intentEventsBodySchema } from "@/lib/api/contracts";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
} from "@/lib/api/router";
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

export const POST = createApiHandler(
  "intentEvents.create",
  async ({ request, body, requestId }) => {
    const payload = body as InferApiBody<typeof intentEventsBodySchema>;
    const eventType = normalizeEventType(payload.type);
    const entryKey = normalizeEntryKey(payload.entryKey);
    const sessionId = normalizeSessionId(payload.sessionId);
    if (!eventType) {
      return apiError("invalid_payload", 400, { requestId });
    }

    const db = getSiteDb();
    if (!db) {
      return apiJson(
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
      return apiJson(
        { ok: true, stored: true },
        { headers: { "cache-control": "no-store" } },
      );
    } catch {
      logApiWarn(request, "intent_events.insert_failed", { eventType });
      return apiJson(
        { ok: false, stored: false, reason: "insert_failed" },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }
  },
);
