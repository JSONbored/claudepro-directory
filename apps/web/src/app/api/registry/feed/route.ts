import { NextResponse } from "next/server";

import { isAllowedOrigin, isRateLimited } from "@/lib/api-security";
import { logApiWarn } from "@/lib/api-logs";
import { getCategorySummaries, getRegistryManifest } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";
import { siteConfig } from "@/lib/site";

export async function GET(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "registry.feed.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (
    isRateLimited({
      request,
      scope: "registry-feed",
      limit: 120,
      windowMs: 60_000,
    })
  ) {
    logApiWarn(request, "registry.feed.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const [manifest, categories] = await Promise.all([
    getRegistryManifest(),
    getCategorySummaries(),
  ]);

  return cachedJsonResponse(request, {
    schemaVersion: 1,
    kind: "registry-feed",
    generatedAt: manifest.generatedAt,
    site: {
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
    },
    endpoints: {
      manifest: "/api/registry/manifest",
      categories: "/api/registry/categories",
      search: "/api/registry/search?q={query}&category={category}&limit=20",
      entry: "/api/registry/entries/{category}/{slug}",
      entryLlms: "/api/registry/entries/{category}/{slug}/llms",
    },
    artifacts: manifest.artifacts,
    categories,
  });
}
