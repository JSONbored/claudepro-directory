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
      search:
        "/api/registry/search?q={query}&category={category}&platform={platform}&limit=20",
      diff: "/api/registry/diff?since={hash-or-date}&limit=100",
      entry: "/api/registry/entries/{category}/{slug}",
      entryLlms: "/api/registry/entries/{category}/{slug}/llms",
      ecosystemFeed: "/data/ecosystem-feed.json",
      mcpRegistryFeed: "/data/mcp-registry-feed.json",
      pluginExportFeed: "/data/plugin-export-feed.json",
      changelogFeed: "/data/registry-changelog.json",
      rssFeed: "/feed.xml",
      distributionFeedIndex: "/data/feeds/index.json",
      categoryFeed: "/data/feeds/categories/{category}.json",
      platformFeed: "/data/feeds/platforms/{platform}.json",
      contentQuality: "/data/content-quality-report.json",
      raycastFeed: "/data/raycast-index.json",
    },
    artifacts: manifest.artifacts,
    artifactContracts: manifest.artifactContracts,
    qualitySummary: manifest.qualitySummary,
    categories,
  });
}
