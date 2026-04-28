import {
  adminJobsPatchBodySchema,
  adminJobsQuerySchema,
  adminJobsUpsertBodySchema,
} from "@/lib/api/contracts";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
  type InferApiQuery,
} from "@/lib/api/router";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { logApiError, logApiInfo, logApiWarn } from "@/lib/api-logs";
import { getSiteDb } from "@/lib/db";
import {
  checkJobsSchema,
  JobPublicationQualityError,
  queryAdminJobs,
  updateAdminJobState,
  upsertAdminJob,
} from "@/lib/job-admin";

async function requireReadyJobsDb(request: Request, requestId: string) {
  const db = getSiteDb();
  if (!db) {
    logApiError(request, "admin.jobs.db_not_configured");
    return {
      db: null,
      response: apiError("site_db_not_configured", 503, { requestId }),
    };
  }

  const schema = await checkJobsSchema(db);
  if (!schema.ok) {
    logApiError(request, "admin.jobs.schema_not_ready", {
      missingColumns: schema.missingColumns,
    });
    return {
      db: null,
      response: apiError("jobs_schema_not_ready", 503, {
        requestId,
        details: schema,
      }),
    };
  }

  return { db, response: null };
}

export const GET = createApiHandler(
  "adminJobs.list",
  async ({ request, query, requestId }) => {
    if (!isAdminAuthorized(request)) {
      logApiWarn(request, "admin.jobs.unauthorized");
      return apiError("unauthorized", 401, { requestId });
    }

    const ready = await requireReadyJobsDb(request, requestId);
    if (ready.response) return ready.response;

    const filters = query as InferApiQuery<typeof adminJobsQuerySchema>;
    const jobs = await queryAdminJobs(ready.db, filters);
    return apiJson(
      {
        schemaVersion: 1,
        count: jobs.length,
        entries: jobs,
      },
      { headers: { "cache-control": "no-store" } },
    );
  },
);

export const POST = createApiHandler(
  "adminJobs.upsert",
  async ({ request, body, requestId }) => {
    if (!isAdminAuthorized(request)) {
      logApiWarn(request, "admin.jobs.unauthorized");
      return apiError("unauthorized", 401, { requestId });
    }

    const ready = await requireReadyJobsDb(request, requestId);
    if (ready.response) return ready.response;

    const payload = body as InferApiBody<typeof adminJobsUpsertBodySchema>;
    try {
      await upsertAdminJob(ready.db, payload);
    } catch (caught) {
      if (caught instanceof JobPublicationQualityError) {
        logApiWarn(request, "admin.jobs.quality_gate_failed", {
          slug: payload.slug,
          errors: caught.errors,
        });
        return apiError("job_quality_gate_failed", 400, {
          requestId,
          details: caught.errors,
        });
      }
      throw caught;
    }
    logApiInfo(request, "admin.jobs.upserted", {
      slug: payload.slug,
      status: payload.status,
      tier: payload.tier,
      source: payload.source,
    });

    return apiJson(
      {
        ok: true,
        slug: payload.slug,
        status: payload.status,
      },
      { headers: { "cache-control": "no-store" } },
    );
  },
);

export const PATCH = createApiHandler(
  "adminJobs.update",
  async ({ request, body, requestId }) => {
    if (!isAdminAuthorized(request)) {
      logApiWarn(request, "admin.jobs.unauthorized");
      return apiError("unauthorized", 401, { requestId });
    }

    const ready = await requireReadyJobsDb(request, requestId);
    if (ready.response) return ready.response;

    const payload = body as InferApiBody<typeof adminJobsPatchBodySchema>;
    try {
      await updateAdminJobState(ready.db, payload);
    } catch (caught) {
      if (caught instanceof JobPublicationQualityError) {
        logApiWarn(request, "admin.jobs.quality_gate_failed", {
          slug: payload.slug,
          action: payload.action,
          errors: caught.errors,
        });
        return apiError("job_quality_gate_failed", 400, {
          requestId,
          details: caught.errors,
        });
      }
      throw caught;
    }
    logApiInfo(request, "admin.jobs.updated", {
      slug: payload.slug,
      action: payload.action,
    });

    return apiJson(
      {
        ok: true,
        slug: payload.slug,
        action: payload.action,
      },
      { headers: { "cache-control": "no-store" } },
    );
  },
);
