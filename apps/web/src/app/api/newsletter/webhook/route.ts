import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

function verifyWebhookIfConfigured(request: Request, secret: string) {
  if (!secret) return true;
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key");
  const headerKey = request.headers.get("x-webhook-secret");
  const authBearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return queryKey === secret || headerKey === secret || authBearer === secret;
}

export async function POST(request: Request) {
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

  const verified = verifyWebhookIfConfigured(request, resendWebhookSecret);
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
