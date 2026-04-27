import { NextResponse } from "next/server";
import { validateListingLeadPayload } from "@heyclaude/registry/commercial";

import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
} from "@/lib/api-security";
import {
  logApiError,
  logApiInfo,
  logApiWarn,
  redactEmail,
} from "@/lib/api-logs";
import { getSiteDb } from "@/lib/db";

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "listing_leads.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 16 * 1024)) {
    logApiWarn(request, "listing_leads.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "listing_leads.invalid_content_type");
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415 },
    );
  }

  if (
    isRateLimited({
      request,
      scope: "listing-leads",
      limit: 12,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "listing_leads.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    logApiWarn(request, "listing_leads.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const report = validateListingLeadPayload(payload);
  if (!report.ok) {
    logApiWarn(request, "listing_leads.invalid_payload", {
      errors: report.errors,
    });
    return NextResponse.json(
      { error: "invalid_payload", errors: report.errors },
      { status: 400 },
    );
  }

  const db = getSiteDb();
  if (!db) {
    logApiError(request, "listing_leads.db_not_configured");
    return NextResponse.json(
      { error: "site_db_not_configured" },
      { status: 503 },
    );
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
    return NextResponse.json(
      { ok: true },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    logApiError(request, "listing_leads.insert_failed", {
      kind: data.kind,
      email: redactEmail(data.contactEmail),
    });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
