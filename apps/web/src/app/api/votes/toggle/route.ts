import { votesToggleBodySchema } from "@/lib/api/contracts";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
} from "@/lib/api/router";
import { logApiError, logApiInfo, logApiWarn, sample } from "@/lib/api-logs";
import { getVotesDb, isValidEntryKey, toggleVote } from "@/lib/votes";

export const POST = createApiHandler(
  "votes.toggle",
  async ({ request, body, requestId }) => {
    const payload = body as InferApiBody<typeof votesToggleBodySchema>;
    const key = String(payload.key ?? "").trim();
    const clientId = String(payload.clientId ?? "").trim();
    const vote = Boolean(payload.vote);

    if (!isValidEntryKey(key) || !clientId) {
      logApiWarn(request, "votes.toggle.invalid_payload");
      return apiError("invalid_payload", 400, { requestId });
    }

    if (clientId.length < 8 || clientId.length > 128) {
      logApiWarn(request, "votes.toggle.invalid_client_id", {
        clientIdLength: clientId.length,
      });
      return apiError("invalid_client_id", 400, { requestId });
    }

    const db = getVotesDb();
    if (!db) {
      logApiError(request, "votes.toggle.db_not_configured");
      return apiError("votes_db_not_configured", 503, { requestId });
    }

    try {
      const result = await toggleVote({
        db,
        entryKey: key,
        clientId,
        vote,
      });

      if (sample(0.05)) {
        logApiInfo(request, "votes.toggle.sample", {
          key,
          vote,
          voted: result.voted,
          count: result.count,
        });
      }
      return apiJson(
        {
          key,
          count: result.count,
          voted: result.voted,
        },
        {
          headers: {
            "cache-control": "no-store",
          },
        },
      );
    } catch {
      logApiError(request, "votes.toggle.internal_error", { key });
      return apiError("internal_error", 500, { requestId });
    }
  },
);
