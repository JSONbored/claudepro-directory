import {
  apiError,
  createApiHandler,
  type InferApiParams,
} from "@/lib/api/router";
import { entryParamsSchema } from "@/lib/api/contracts";
import { getEntry, isSafeContentPathPart } from "@/lib/content";
import { cachedJsonResponse } from "@/lib/http-cache";

export const GET = createApiHandler(
  "registry.entry",
  async ({ request, params, requestId }) => {
    const { category, slug } = params as InferApiParams<
      typeof entryParamsSchema
    >;
    if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
      return apiError("not_found", 404, { requestId });
    }

    const entry = await getEntry(category, slug);
    if (!entry) {
      return apiError("not_found", 404, { requestId });
    }

    return cachedJsonResponse(request, {
      schemaVersion: 1,
      key: `${category}:${slug}`,
      entry,
    });
  },
);
