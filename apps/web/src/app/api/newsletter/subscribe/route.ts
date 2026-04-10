import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited
} from "@/lib/api-security";

type SubscribePayload = {
  email?: string;
  source?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (isRateLimited({ request, scope: "newsletter-subscribe", limit: 15, windowMs: 60_000 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: SubscribePayload = {};

  try {
    payload = (await request.json()) as SubscribePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  const source = String(payload.source ?? "site").trim().slice(0, 64);

  if (!emailRegex.test(email) || email.length > 320) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const envRecord = env as unknown as Record<string, unknown>;
  const resendApiKey = String(envRecord["RESEND_API_KEY"] ?? "");
  const resendSegmentId = String(envRecord["RESEND_SEGMENT_ID"] ?? "");
  const resendAudienceId = String(envRecord["RESEND_AUDIENCE_ID"] ?? "");

  if (!resendApiKey || (!resendSegmentId && !resendAudienceId)) {
    return NextResponse.json({ error: "newsletter_not_configured" }, { status: 503 });
  }

  const requestBody: Record<string, unknown> = {
    email,
    unsubscribed: false,
    first_name: "",
    last_name: "",
    metadata: {
      source
    }
  };

  // Prefer the current Resend contacts+segments model.
  if (resendSegmentId) {
    requestBody.segments = [{ id: resendSegmentId }];
  } else if (resendAudienceId) {
    // Backward-compatible fallback for older audience-based setups.
    requestBody.audience_id = resendAudienceId;
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    return NextResponse.json({ error: "provider_unavailable" }, { status: 502 });
  }

  if (response.ok) {
    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  }

  if (response.status === 409) {
    // Treat duplicate as success to keep UX simple and avoid account enumeration.
    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  }

  return NextResponse.json({ error: "provider_error" }, { status: 502 });
}
