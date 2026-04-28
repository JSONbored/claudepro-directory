import { createApiHandler } from "@/lib/api/router";
import { getCategorySummaries, getRegistryManifest } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";
import { siteConfig } from "@/lib/site";

export const GET = createApiHandler("registry.feed", async ({ request }) => {
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
      atomFeed: "/atom.xml",
      distributionFeedIndex: "/data/feeds/index.json",
      categoryFeed: "/data/feeds/categories/{category}.json",
      platformFeed: "/data/feeds/platforms/{platform}.json",
      contentQuality: "/data/content-quality-report.json",
      raycastFeed: "/data/raycast-index.json",
    },
    contracts: {
      registryEntries:
        "Search results, sharded feeds, and entry details expose factual trustSignals when source/checksum/compatibility data exists.",
      writes:
        "Registry publishing is not exposed through the public API; submissions create reviewable GitHub issues only.",
    },
    artifacts: manifest.artifacts,
    artifactContracts: manifest.artifactContracts,
    qualitySummary: manifest.qualitySummary,
    categories,
  });
});
