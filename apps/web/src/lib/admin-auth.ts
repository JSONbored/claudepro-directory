import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getAdminToken() {
  try {
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as Record<string, unknown>;
    return String(
      envRecord["ADMIN_API_TOKEN"] ||
        envRecord["LEADS_ADMIN_TOKEN"] ||
        envRecord["ADMIN_LEADS_TOKEN"] ||
        process.env.ADMIN_API_TOKEN ||
        process.env.LEADS_ADMIN_TOKEN ||
        process.env.ADMIN_LEADS_TOKEN ||
        "",
    ).trim();
  } catch {
    return String(
      process.env.ADMIN_API_TOKEN ||
        process.env.LEADS_ADMIN_TOKEN ||
        process.env.ADMIN_LEADS_TOKEN ||
        "",
    ).trim();
  }
}

export function isAdminAuthorized(request: Request) {
  const token = getAdminToken();
  if (!token) return false;

  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const headerToken = request.headers.get("x-admin-token")?.trim();
  return bearer === token || headerToken === token;
}
