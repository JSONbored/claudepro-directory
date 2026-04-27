import { NextResponse } from "next/server";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
} from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getSiteDb, type D1DatabaseLike } from "@/lib/db";

const SIGNAL_TYPES = ["used", "works", "broken"] as const;
const TARGET_KINDS = ["entry", "tool"] as const;
const ZERO_COUNTS = { used: 0, works: 0, broken: 0 };

type SignalType = (typeof SIGNAL_TYPES)[number];
type TargetKind = (typeof TARGET_KINDS)[number];
type SignalCounts = Record<SignalType, number>;

type SignalRow = {
  signal_type: SignalType;
  count: number;
};

type SignalPayload = {
  targetKind?: string;
  targetKey?: string;
  signalType?: string;
  clientId?: string;
  active?: boolean;
};

function jsonResponse(
  payload: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function normalizeTargetKind(
  value: string | null | undefined,
): TargetKind | null {
  return value && (TARGET_KINDS as readonly string[]).includes(value)
    ? (value as TargetKind)
    : null;
}

function normalizeSignalType(
  value: string | null | undefined,
): SignalType | null {
  return value && (SIGNAL_TYPES as readonly string[]).includes(value)
    ? (value as SignalType)
    : null;
}

function normalizeTargetKey(value: string | null | undefined): string | null {
  const normalized = (value || "").trim().toLowerCase();
  return /^(entry|tool):[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)?$/.test(
    normalized,
  )
    ? normalized
    : null;
}

function normalizeClientId(value: string | null | undefined): string | null {
  const normalized = (value || "").trim();
  return /^[a-zA-Z0-9_-]{16,96}$/.test(normalized) ? normalized : null;
}

function isExpectedUnavailableD1Error(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("no such table: community_signals") ||
    message.includes("SITE_DB")
  );
}

async function readCounts(
  db: D1DatabaseLike,
  targetKind: TargetKind,
  targetKey: string,
): Promise<SignalCounts> {
  const counts = { ...ZERO_COUNTS };
  const { results } = await db
    .prepare(
      `SELECT signal_type, COUNT(*) AS count
       FROM community_signals
       WHERE target_kind = ? AND target_key = ?
       GROUP BY signal_type`,
    )
    .bind(targetKind, targetKey)
    .all<SignalRow>();

  for (const row of results || []) {
    if (SIGNAL_TYPES.includes(row.signal_type)) {
      counts[row.signal_type] = Number(row.count) || 0;
    }
  }

  return counts;
}

async function safeCounts(targetKind: TargetKind, targetKey: string) {
  try {
    const db = await getSiteDb();
    if (!db) {
      return { available: false, counts: { ...ZERO_COUNTS } };
    }
    return {
      available: true,
      counts: await readCounts(db, targetKind, targetKey),
    };
  } catch (error) {
    if (!isExpectedUnavailableD1Error(error)) {
      console.warn("[community-signals] failed to read counts", error);
    }
    return { available: false, counts: { ...ZERO_COUNTS } };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetKind = normalizeTargetKind(url.searchParams.get("targetKind"));
  const targetKey = normalizeTargetKey(url.searchParams.get("targetKey"));

  if (!targetKind || !targetKey) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Provide targetKind as entry/tool and targetKey as entry:<category>/<slug> or tool:<slug>.",
      },
      400,
    );
  }

  const { available, counts } = await safeCounts(targetKind, targetKey);
  return jsonResponse({
    ok: true,
    available,
    targetKind,
    targetKey,
    counts,
  });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "community_signals.forbidden_origin");
    return jsonResponse({ ok: false, error: "Invalid request origin." }, 403);
  }

  if (!hasBodyWithinLimit(request, 4 * 1024)) {
    return jsonResponse(
      { ok: false, error: "Request body is too large." },
      413,
    );
  }

  if (!hasJsonContentType(request)) {
    return jsonResponse(
      { ok: false, error: "Expected application/json request body." },
      415,
    );
  }

  if (
    isRateLimited({
      request,
      scope: "community-signals",
      limit: 30,
      windowMs: 60_000,
    })
  ) {
    return jsonResponse(
      { ok: false, error: "Too many signal updates. Try again shortly." },
      429,
    );
  }

  let payload: SignalPayload;
  try {
    payload = (await request.json()) as SignalPayload;
  } catch {
    return jsonResponse(
      { ok: false, error: "Invalid JSON request body." },
      400,
    );
  }

  const targetKind = normalizeTargetKind(payload.targetKind);
  const targetKey = normalizeTargetKey(payload.targetKey);
  const signalType = normalizeSignalType(payload.signalType);
  const clientId = normalizeClientId(payload.clientId);

  if (!targetKind || !targetKey || !signalType || !clientId) {
    return jsonResponse(
      {
        ok: false,
        error: "Provide targetKind, targetKey, signalType, and clientId.",
      },
      400,
    );
  }

  try {
    const db = await getSiteDb();
    if (!db) {
      return jsonResponse(
        {
          ok: true,
          stored: false,
          available: false,
          targetKind,
          targetKey,
          counts: { ...ZERO_COUNTS },
        },
        200,
      );
    }

    if (payload.active === false) {
      await db
        .prepare(
          `DELETE FROM community_signals
           WHERE target_kind = ? AND target_key = ? AND signal_type = ? AND client_id = ?`,
        )
        .bind(targetKind, targetKey, signalType, clientId)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO community_signals (
             target_kind,
             target_key,
             signal_type,
             client_id,
             created_at,
             updated_at
           )
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT(target_kind, target_key, signal_type, client_id)
           DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(targetKind, targetKey, signalType, clientId)
        .run();
    }

    return jsonResponse(
      {
        ok: true,
        stored: true,
        available: true,
        targetKind,
        targetKey,
        counts: await readCounts(db, targetKind, targetKey),
      },
      200,
    );
  } catch (error) {
    if (!isExpectedUnavailableD1Error(error)) {
      console.warn("[community-signals] failed to store signal", error);
    }

    const { counts } = await safeCounts(targetKind, targetKey);
    return jsonResponse(
      {
        ok: true,
        stored: false,
        available: false,
        targetKind,
        targetKey,
        counts,
      },
      200,
    );
  }
}
