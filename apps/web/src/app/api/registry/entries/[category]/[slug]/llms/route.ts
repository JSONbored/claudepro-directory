import { entryParamsSchema } from "@/lib/api/contracts";
import {
  apiError,
  createApiHandler,
  type InferApiParams,
} from "@/lib/api/router";
import { getEntryLlmsText, isSafeContentPathPart } from "@/lib/content";
import { cachedTextResponse } from "@/lib/http-cache";

export const GET = createApiHandler(
  "registry.entryLlms",
  async ({ request, params, requestId }) => {
    const { category, slug } = params as InferApiParams<
      typeof entryParamsSchema
    >;
    if (!isSafeContentPathPart(category) || !isSafeContentPathPart(slug)) {
      return apiError("not_found", 404, { requestId });
    }

    const text = await getEntryLlmsText(category, slug);
    if (!text) {
      return apiError("not_found", 404, { requestId });
    }

    return cachedTextResponse(request, text);
  },
);
