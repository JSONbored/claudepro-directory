import { validateListingLeadPayload } from "@heyclaude/registry/commercial";

import { listingLeadBodySchema } from "@/lib/api/contracts";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
} from "@/lib/api/router";
import {
  logApiError,
  logApiInfo,
  logApiWarn,
  redactEmail,
} from "@/lib/api-logs";
import { getSiteDb } from "@/lib/db";

export const POST = createApiHandler(
  "listingLeads.create",
  async ({ request, body, requestId }) => {
    const payload = body as InferApiBody<typeof listingLeadBodySchema>;
    const report = validateListingLeadPayload(payload);
    if (!report.ok) {
      logApiWarn(request, "listing_leads.invalid_payload", {
        errors: report.errors,
      });
      return apiError("invalid_payload", 400, {
        requestId,
        details: { errors: report.errors },
      });
    }

    const db = getSiteDb();
    if (!db) {
      logApiError(request, "listing_leads.db_not_configured");
      return apiError("site_db_not_configured", 503, { requestId });
    }

    const data = report.data;
    const payloadJson = JSON.stringify({
      websiteUrl: data.websiteUrl,
      applyUrl: data.applyUrl,
      message: data.message,
    });

    try {
      await db
        .prepare(
          `INSERT INTO listing_leads (
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
          payload_json,
          created_at,
          updated_at
        ) VALUES (?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        )
        .bind(
          data.kind,
          data.tierInterest,
          data.contactName,
          data.contactEmail,
          data.companyName,
          data.listingTitle,
          data.websiteUrl,
          data.applyUrl,
          data.message,
          payloadJson,
        )
        .run();

      logApiInfo(request, "listing_leads.created", {
        kind: data.kind,
        tier: data.tierInterest,
        email: redactEmail(data.contactEmail),
      });
      return apiJson(
        { ok: true },
        { headers: { "cache-control": "no-store" } },
      );
    } catch {
      logApiError(request, "listing_leads.insert_failed", {
        kind: data.kind,
        email: redactEmail(data.contactEmail),
      });
      return apiError("internal_error", 500, { requestId });
    }
  },
);
