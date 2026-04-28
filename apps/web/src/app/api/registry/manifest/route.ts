import { createApiHandler } from "@/lib/api/router";
import { getRegistryManifest } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

export const GET = createApiHandler(
  "registry.manifest",
  async ({ request }) => {
    return cachedJsonResponse(request, await getRegistryManifest());
  },
);
