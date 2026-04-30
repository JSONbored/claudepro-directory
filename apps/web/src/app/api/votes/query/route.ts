import { votesQueryBodySchema } from "@/lib/api/contracts";
import { apiJson, createApiHandler, type InferApiBody } from "@/lib/api/router";
import { logApiInfo, logApiWarn, sample } from "@/lib/api-logs";
import {
  getFallbackClientVotes,
  getFallbackVoteCounts,
  getVotesDb,
  isValidEntryKey,
  queryVoteCounts,
  queryVotesByClient,
} from "@/lib/votes";

export const POST = createApiHandler(
  "votes.query",
  async ({ request, body }) => {
    const payload = body as InferApiBody<typeof votesQueryBodySchema>;
    const rawKeys = Array.isArray(payload.keys) ? payload.keys : [];
    const keys = [...new Set(rawKeys.map((key) => String(key).trim()))].filter(
      isValidEntryKey,
    );
    const clientId = String(payload.clientId ?? "").trim();

    if (keys.length === 0) {
      return apiJson({ counts: {}, voted: {}, available: true });
    }

    if (keys.length > 1000) {
      logApiWarn(request, "votes.query.too_many_keys", {
        keyCount: keys.length,
      });
      return apiJson(
        {
          ok: false,
          error: { code: "too_many_keys", message: "Too many keys" },
        },
        { status: 400 },
      );
    }

    const db = getVotesDb();
    if (!db) {
      return apiJson({
        counts: getFallbackVoteCounts(keys),
        voted: getFallbackClientVotes(keys),
        available: false,
      });
    }

    try {
      const [counts, voted] = await Promise.all([
        queryVoteCounts(db, keys),
        clientId ? queryVotesByClient(db, keys, clientId) : Promise.resolve({}),
      ]);

      if (sample(0.02)) {
        logApiInfo(request, "votes.query.sample", {
          keyCount: keys.length,
          hasClient: Boolean(clientId),
        });
      }
      return apiJson(
        {
          counts,
          voted,
          available: true,
        },
        {
          headers: {
            "cache-control": "no-store",
          },
        },
      );
    } catch {
      logApiWarn(request, "votes.query.unavailable", { keyCount: keys.length });
      return apiJson(
        {
          counts: getFallbackVoteCounts(keys),
          voted: getFallbackClientVotes(keys),
          available: false,
        },
        {
          headers: {
            "cache-control": "no-store",
          },
        },
      );
    }
  },
);
