import { publicJobsQuerySchema } from "@/lib/api/contracts";
import { createApiHandler, type InferApiQuery } from "@/lib/api/router";
import { cachedJsonResponse } from "@/lib/http-cache";
import {
  buildPublicJobsIndex,
  getJobs,
  type PublicJobListing,
} from "@/lib/jobs";

function matchesQuery(job: PublicJobListing, query: string) {
  if (!query) return true;
  const haystack = [
    job.title,
    job.company,
    job.location,
    job.description,
    job.type,
    job.compensation,
    job.equity,
    job.bonus,
    job.sourceLabel,
    ...(job.labels ?? []),
    ...(job.benefits ?? []),
    ...(job.responsibilities ?? []),
    ...(job.requirements ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export const GET = createApiHandler(
  "jobs.list",
  async ({ request, query: parsedQuery }) => {
    const {
      q: query,
      tier,
      remote,
      limit,
    } = parsedQuery as InferApiQuery<typeof publicJobsQuerySchema>;
    const payload = buildPublicJobsIndex(
      await getJobs(),
      new URL(request.url).origin,
    );
    const entries = payload.entries
      .filter((job) => !tier || tier === "all" || job.tier === tier)
      .filter((job) => {
        if (!remote || remote === "all") return true;
        return remote === "true" ? Boolean(job.isRemote) : !job.isRemote;
      })
      .filter((job) => matchesQuery(job, query))
      .slice(0, limit);

    return cachedJsonResponse(
      request,
      {
        ...payload,
        query,
        tier: tier || "all",
        remote: remote || "all",
        count: entries.length,
        totalAvailable: payload.entries.length,
        entries,
      },
      {
        headers: {
          "cache-control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  },
);
