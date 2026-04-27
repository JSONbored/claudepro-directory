import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getRegistryManifest } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.manifest.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-manifest",
      limit: 120,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.manifest.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  return cachedJsonResponse(request, await getRegistryManifest());
}
