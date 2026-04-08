import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type SubscribePayload = {
  email?: string;
  source?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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
  const resendAudienceId = String(envRecord["RESEND_AUDIENCE_ID"] ?? "");

  if (!resendApiKey || !resendAudienceId) {
    return NextResponse.json({ error: "newsletter_not_configured" }, { status: 503 });
  }

  const response = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
      audience_id: resendAudienceId,
      first_name: "",
      last_name: "",
      metadata: {
        source
      }
    })
  });

  if (response.ok) {
    return NextResponse.json({ ok: true });
  }

  if (response.status === 409) {
    // Treat duplicate as success to keep UX simple and avoid account enumeration.
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "provider_error" }, { status: 502 });
}
