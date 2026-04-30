import { apiError, apiJson, createApiHandler } from "@/lib/api/router";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { logApiError, logApiWarn } from "@/lib/api-logs";
import { getSiteDb } from "@/lib/db";
import { getJobsHealth } from "@/lib/job-admin";

export const GET = createApiHandler(
  "adminJobs.health",
  async ({ request, requestId }) => {
    if (!isAdminAuthorized(request)) {
      logApiWarn(request, "admin.jobs.health.unauthorized");
      return apiError("unauthorized", 401, { requestId });
    }

    const db = getSiteDb();
    if (!db) {
      logApiError(request, "admin.jobs.health.db_not_configured");
      return apiError("site_db_not_configured", 503, { requestId });
    }

    const health = await getJobsHealth(db);
    return apiJson(health, { headers: { "cache-control": "no-store" } });
  },
);
