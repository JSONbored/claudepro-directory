import {
  communitySignalsBodySchema,
  communitySignalsQuerySchema,
} from "@/lib/api/contracts";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
  type InferApiQuery,
} from "@/lib/api/router";
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

export const GET = createApiHandler(
  "communitySignals.read",
  async ({ query, requestId }) => {
    const payload = query as InferApiQuery<typeof communitySignalsQuerySchema>;
    const targetKind = normalizeTargetKind(payload.targetKind);
    const targetKey = normalizeTargetKey(payload.targetKey);

    if (!targetKind || !targetKey) {
      return apiError("invalid_payload", 400, {
        requestId,
        message:
          "Provide targetKind as entry/tool and targetKey as entry:<category>/<slug> or tool:<slug>.",
      });
    }

    const { available, counts } = await safeCounts(targetKind, targetKey);
    return apiJson({
      ok: true,
      available,
      targetKind,
      targetKey,
      counts,
    });
  },
);

export const POST = createApiHandler(
  "communitySignals.write",
  async ({ body, requestId }) => {
    const payload = body as InferApiBody<typeof communitySignalsBodySchema>;
    const targetKind = normalizeTargetKind(payload.targetKind);
    const targetKey = normalizeTargetKey(payload.targetKey);
    const signalType = normalizeSignalType(payload.signalType);
    const clientId = normalizeClientId(payload.clientId);

    if (!targetKind || !targetKey || !signalType || !clientId) {
      return apiError("invalid_payload", 400, {
        requestId,
        message: "Provide targetKind, targetKey, signalType, and clientId.",
      });
    }

    try {
      const db = await getSiteDb();
      if (!db) {
        return apiJson(
          {
            ok: true,
            stored: false,
            available: false,
            targetKind,
            targetKey,
            counts: { ...ZERO_COUNTS },
          },
          { status: 200 },
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

      return apiJson(
        {
          ok: true,
          stored: true,
          available: true,
          targetKind,
          targetKey,
          counts: await readCounts(db, targetKind, targetKey),
        },
        { status: 200 },
      );
    } catch (error) {
      if (!isExpectedUnavailableD1Error(error)) {
        console.warn("[community-signals] failed to store signal", error);
      }

      const { counts } = await safeCounts(targetKind, targetKey);
      return apiJson(
        {
          ok: true,
          stored: false,
          available: false,
          targetKind,
          targetKey,
          counts,
        },
        { status: 200 },
      );
    }
  },
);
