import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  nextLeadStatus,
  normalizeCommercialStatus,
} from "@heyclaude/registry/commercial";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
} from "@/lib/api-security";
import { logApiError, logApiInfo, logApiWarn } from "@/lib/api-logs";
import { getSiteDb } from "@/lib/db";

const ALLOWED_KINDS = new Set(["job", "tool", "claim"]);
const MAX_LIMIT = 100;
const CSV_COLUMNS = [
  "id",
  "kind",
  "status",
  "tier_interest",
  "contact_name",
  "contact_email",
  "company_name",
  "listing_title",
  "website_url",
  "apply_url",
  "message",
  "created_at",
  "updated_at",
] as const;

function getAdminToken() {
  try {
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as Record<string, unknown>;
    return String(
      envRecord["LEADS_ADMIN_TOKEN"] ||
        envRecord["ADMIN_LEADS_TOKEN"] ||
        process.env.LEADS_ADMIN_TOKEN ||
        process.env.ADMIN_LEADS_TOKEN ||
        "",
    ).trim();
  } catch {
    return String(
      process.env.LEADS_ADMIN_TOKEN || process.env.ADMIN_LEADS_TOKEN || "",
    ).trim();
  }
}

function isAuthorized(request: Request) {
  const token = getAdminToken();
  if (!token) return false;

  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const headerToken = request.headers.get("x-admin-token")?.trim();
  return bearer === token || headerToken === token;
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(parsed)));
}

function normalizeKind(value: string | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return ALLOWED_KINDS.has(normalized) ? normalized : "";
}

function csvEscape(value: unknown) {
  const normalized = String(value ?? "");
  return /[",\n\r]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

function leadsToCsv(rows: Record<string, unknown>[]) {
  return [
    CSV_COLUMNS.join(","),
    ...rows.map((row) =>
      CSV_COLUMNS.map((column) => csvEscape(row[column])).join(","),
    ),
  ].join("\n");
}

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "admin.listing_leads.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!isAuthorized(request)) {
    logApiWarn(request, "admin.listing_leads.unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (
    isRateLimited({
      request,
      scope: "admin-listing-leads",
      limit: 60,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "admin.listing_leads.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const db = getSiteDb();
  if (!db) {
    logApiError(request, "admin.listing_leads.db_not_configured");
    return NextResponse.json(
      { error: "site_db_not_configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const kind = normalizeKind(url.searchParams.get("kind"));
  const status = normalizeCommercialStatus(url.searchParams.get("status"));
  const limit = normalizeLimit(url.searchParams.get("limit"));
  const format = String(url.searchParams.get("format") ?? "")
    .trim()
    .toLowerCase();

  const where = [];
  const values: unknown[] = [];
  if (kind) {
    where.push("kind = ?");
    values.push(kind);
  }
  if (url.searchParams.has("status")) {
    where.push("status = ?");
    values.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const { results } = await db
    .prepare(
      `SELECT
        id,
        kind,
        status,
        tier_interest,
        contact_name,
        contact_email,
        company_name,
        listing_title,
        website_url,
        apply_url,
        message,
        created_at,
        updated_at
      FROM listing_leads
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ?`,
    )
    .bind(...values, limit)
    .all();

  if (format === "csv") {
    return new Response(
      `${leadsToCsv(results as Record<string, unknown>[])}\n`,
      {
        headers: {
          "cache-control": "no-store",
          "content-disposition":
            'attachment; filename="heyclaude-listing-leads.csv"',
          "content-type": "text/csv; charset=utf-8",
        },
      },
    );
  }

  return NextResponse.json(
    {
      schemaVersion: 1,
      count: results.length,
      entries: results,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "admin.listing_leads.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!isAuthorized(request)) {
    logApiWarn(request, "admin.listing_leads.unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasBodyWithinLimit(request, 4 * 1024)) {
    logApiWarn(request, "admin.listing_leads.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "admin.listing_leads.invalid_content_type");
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415 },
    );
  }

  const db = getSiteDb();
  if (!db) {
    logApiError(request, "admin.listing_leads.db_not_configured");
    return NextResponse.json(
      { error: "site_db_not_configured" },
      { status: 503 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    logApiWarn(request, "admin.listing_leads.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = Number(payload.id);
  const action = String(payload.action ?? "")
    .trim()
    .toLowerCase();
  if (!Number.isInteger(id) || id <= 0 || !action) {
    logApiWarn(request, "admin.listing_leads.invalid_payload");
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const current = await db
    .prepare("SELECT id, status FROM listing_leads WHERE id = ?")
    .bind(id)
    .first<{ id: number; status: string }>();
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const nextStatus = nextLeadStatus(current.status, action);
  if (nextStatus === current.status) {
    return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
  }

  await db
    .prepare(
      "UPDATE listing_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(nextStatus, id)
    .run();

  logApiInfo(request, "admin.listing_leads.status_updated", {
    id,
    from: current.status,
    to: nextStatus,
  });

  return NextResponse.json(
    {
      ok: true,
      id,
      status: nextStatus,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
