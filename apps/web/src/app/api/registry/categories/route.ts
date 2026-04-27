import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getCategorySummaries, getRegistryManifest } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.categories.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-categories",
      limit: 120,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.categories.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const [manifest, categories] = await Promise.all([
    getRegistryManifest(),
    getCategorySummaries(),
  ]);

  return cachedJsonResponse(request, {
    schemaVersion: 1,
    generatedAt: manifest.generatedAt,
    count: categories.length,
    entries: categories,
  });
}
