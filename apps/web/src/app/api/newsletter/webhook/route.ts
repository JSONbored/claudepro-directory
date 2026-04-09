import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Webhook } from "svix";
import { hasBodyWithinLimit } from "@/lib/api-security";

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
      "svix-signature": svixSignature
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasBodyWithinLimit(request, 256 * 1024)) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rawBody = await request.text();
  let payload: ResendEvent = {};

  try {
    payload = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const envRecord = env as unknown as Record<string, unknown>;
  const discordWebhookUrl = String(envRecord["DISCORD_WEBHOOK_URL"] ?? "");
  const resendWebhookSecret = String(envRecord["RESEND_WEBHOOK_SECRET"] ?? "");

  const verified = verifyWebhookSignature({
    rawBody,
    request,
    secret: resendWebhookSecret
  });
  if (!verified) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (!discordWebhookUrl || !shouldNotify(payload)) {
    return NextResponse.json({ ok: true, forwarded: false });
  }

  await fetch(discordWebhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: toDiscordContent(payload)
    })
  });

  return NextResponse.json({ ok: true, forwarded: true });
}
