import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  nextLeadStatus,
  normalizeCommercialStatus,
} from "@heyclaude/registry/commercial";

import {
  adminListingLeadsPatchBodySchema,
  adminListingLeadsQuerySchema,
} from "@/lib/api/contracts";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
  type InferApiQuery,
} from "@/lib/api/router";
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

export const GET = createApiHandler(
  "adminListingLeads.list",
  async ({ request, query: parsedQuery, requestId }) => {
    if (!isAuthorized(request)) {
      logApiWarn(request, "admin.listing_leads.unauthorized");
      return apiError("unauthorized", 401, { requestId });
    }

    const db = getSiteDb();
    if (!db) {
      logApiError(request, "admin.listing_leads.db_not_configured");
      return apiError("site_db_not_configured", 503, { requestId });
    }

    const query = parsedQuery as InferApiQuery<
      typeof adminListingLeadsQuerySchema
    >;
    const kind = normalizeKind(query.kind);
    const status = normalizeCommercialStatus(query.status);
    const limit = Math.max(1, Math.min(MAX_LIMIT, Math.trunc(query.limit)));
    const format = query.format;

    const where = [];
    const values: unknown[] = [];
    if (kind) {
      where.push("kind = ?");
      values.push(kind);
    }
    if (query.status) {
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

    return apiJson(
      {
        schemaVersion: 1,
        count: results.length,
        entries: results,
      },
      { headers: { "cache-control": "no-store" } },
    );
  },
);

export const PATCH = createApiHandler(
  "adminListingLeads.update",
  async ({ request, body, requestId }) => {
    if (!isAuthorized(request)) {
      logApiWarn(request, "admin.listing_leads.unauthorized");
      return apiError("unauthorized", 401, { requestId });
    }

    const db = getSiteDb();
    if (!db) {
      logApiError(request, "admin.listing_leads.db_not_configured");
      return apiError("site_db_not_configured", 503, { requestId });
    }

    const payload = body as InferApiBody<
      typeof adminListingLeadsPatchBodySchema
    >;
    const id = payload.id;
    const action = payload.action;
    if (!Number.isInteger(id) || id <= 0 || !action) {
      logApiWarn(request, "admin.listing_leads.invalid_payload");
      return apiError("invalid_payload", 400, { requestId });
    }

    const current = await db
      .prepare("SELECT id, status FROM listing_leads WHERE id = ?")
      .bind(id)
      .first<{ id: number; status: string }>();
    if (!current) {
      return apiError("not_found", 404, { requestId });
    }

    const nextStatus = nextLeadStatus(current.status, action);
    if (nextStatus === current.status) {
      return apiError("invalid_transition", 400, { requestId });
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

    return apiJson(
      {
        ok: true,
        id,
        status: nextStatus,
      },
      { headers: { "cache-control": "no-store" } },
    );
  },
);
