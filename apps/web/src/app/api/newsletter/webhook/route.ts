import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Webhook } from "svix";
import {
  hasBodyWithinLimit,
  hasJsonContentType,
  isRateLimited,
} from "@/lib/api-security";
import {
  logApiError,
  logApiInfo,
  logApiWarn,
  redactEmail,
} from "@/lib/api-logs";

type ResendEvent = {
  type?: string;
  data?: Record<string, unknown>;
};

function getEventEmail(data?: Record<string, unknown>) {
  const value = data?.email;
  return typeof value === "string" ? value : "unknown";
}

function shouldNotify(event: ResendEvent) {
  const type = String(event.type ?? "");
  return (
    type.startsWith("contact.") ||
    type === "email.delivered" ||
    type === "email.bounced"
  );
}

function toDiscordContent(event: ResendEvent) {
  const type = String(event.type ?? "unknown");
  const email = getEventEmail(event.data);

  if (type === "contact.created") {
    return `Newsletter subscriber added: \`${email}\``;
  }
  if (type === "contact.updated") {
    const unsubscribed = Boolean(event.data?.unsubscribed);
    return unsubscribed
      ? `Newsletter unsubscribe: \`${email}\``
      : `Newsletter subscriber updated: \`${email}\``;
  }
  if (type === "email.bounced") {
    return `Newsletter delivery bounced: \`${email}\``;
  }
  if (type === "email.delivered") {
    return `Newsletter delivered: \`${email}\``;
  }

  return `Resend event: \`${type}\` (\`${email}\`)`;
}

function verifyWebhookSignature(params: {
  rawBody: string;
  request: Request;
  secret: string;
}) {
  const { rawBody, request, secret } = params;
  if (!secret) return true;

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  try {
    const webhook = new Webhook(secret);
    webhook.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasBodyWithinLimit(request, 256 * 1024)) {
    logApiWarn(request, "newsletter.webhook.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "newsletter.webhook.invalid_content_type");
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415 },
    );
  }

  if (
    isRateLimited({
      request,
      scope: "newsletter-webhook",
      limit: 120,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "newsletter.webhook.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const rawBody = await request.text();

  const { env } = getCloudflareContext();
  const envRecord = env as unknown as Record<string, unknown>;
  const discordWebhookUrl = String(envRecord["DISCORD_WEBHOOK_URL"] ?? "");
  const resendWebhookSecret = String(envRecord["RESEND_WEBHOOK_SECRET"] ?? "");

  if (!resendWebhookSecret) {
    logApiError(request, "newsletter.webhook.not_configured");
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 503 },
    );
  }

  const verified = verifyWebhookSignature({
    rawBody,
    request,
    secret: resendWebhookSecret,
  });
  if (!verified) {
    logApiWarn(request, "newsletter.webhook.invalid_signature");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: ResendEvent = {};
  try {
    payload = JSON.parse(rawBody) as ResendEvent;
  } catch {
    logApiWarn(request, "newsletter.webhook.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!discordWebhookUrl || !shouldNotify(payload)) {
    logApiInfo(request, "newsletter.webhook.skipped", {
      eventType: String(payload.type ?? "unknown"),
    });
    return NextResponse.json({ ok: true, forwarded: false });
  }

  try {
    await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: toDiscordContent(payload),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    logApiError(request, "newsletter.webhook.notification_failed", {
      eventType: String(payload.type ?? "unknown"),
      email: redactEmail(getEventEmail(payload.data)),
    });
    return NextResponse.json({ error: "notification_failed" }, { status: 502 });
  }

  logApiInfo(request, "newsletter.webhook.forwarded", {
    eventType: String(payload.type ?? "unknown"),
    email: redactEmail(getEventEmail(payload.data)),
  });
  return NextResponse.json({ ok: true, forwarded: true });
}
