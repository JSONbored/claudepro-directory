import { createApiHandler } from "@/lib/api/router";
import { getCategorySummaries, getRegistryManifest } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

export const GET = createApiHandler(
  "registry.categories",
  async ({ request }) => {
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
  },
);
