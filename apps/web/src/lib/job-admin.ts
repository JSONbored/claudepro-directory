import type { D1DatabaseLike } from "@/lib/db";
import {
  type JobListing,
  type JobSource,
  type JobSourceKind,
  type JobStatus,
  type JobTier,
  mapJobListingRow,
  sortJobs,
} from "@/lib/jobs";
import { validateJobPublicationQuality } from "@heyclaude/registry/commercial";

export const REQUIRED_JOBS_MIGRATION = "0008_jobs_compensation_metadata.sql";

export const REQUIRED_JOB_COLUMNS = [
  "slug",
  "title",
  "company_name",
  "company_url",
  "location_text",
  "summary",
  "description_md",
  "employment_type",
  "compensation_summary",
  "equity_summary",
  "bonus_summary",
  "benefits_json",
  "responsibilities_json",
  "requirements_json",
  "apply_url",
  "tier",
  "status",
  "source",
  "source_kind",
  "source_url",
  "first_seen_at",
  "last_checked_at",
  "source_checked_at",
  "stale_check_count",
  "curation_note",
  "paid_placement_expires_at",
  "claimed_employer",
  "posted_by_email",
  "posted_at",
  "expires_at",
  "is_remote",
  "is_worldwide",
  "created_at",
  "updated_at",
] as const;

type JobsSchemaColumnRow = {
  name: string;
};

type JobStatusCountRow = {
  status: string;
  count: number;
};

type JobAdminRow = Parameters<typeof mapJobListingRow>[0];

const JOB_ADMIN_SELECT_FIELDS = `slug,
        title,
        company_name,
        company_url,
        location_text,
        summary,
        description_md,
        employment_type,
        posted_at,
        compensation_summary,
        equity_summary,
        bonus_summary,
        benefits_json,
        responsibilities_json,
        requirements_json,
        apply_url,
        tier,
        status,
        source,
        source_kind,
        source_url,
        first_seen_at,
        last_checked_at,
        source_checked_at,
        stale_check_count,
        curation_note,
        paid_placement_expires_at,
        claimed_employer,
        posted_by_email,
        expires_at,
        is_remote,
        is_worldwide`;

export type JobAdminListFilters = {
  status?: JobStatus | "";
  tier?: JobTier | "";
  source?: JobSource | "";
  sourceKind?: JobSourceKind | "";
  limit?: number;
};

export type JobAdminUpsertInput = {
  slug: string;
  title: string;
  companyName: string;
  companyUrl?: string;
  locationText?: string;
  summary: string;
  descriptionMd?: string;
  employmentType?: string;
  compensationSummary?: string;
  equitySummary?: string;
  bonusSummary?: string;
  benefits?: string[];
  responsibilities?: string[];
  requirements?: string[];
  applyUrl: string;
  tier: JobTier;
  status: JobStatus;
  source: JobSource;
  sourceKind: JobSourceKind;
  sourceUrl?: string;
  firstSeenAt?: string;
  lastCheckedAt?: string;
  sourceCheckedAt?: string;
  staleCheckCount?: number;
  curationNote?: string;
  paidPlacementExpiresAt?: string;
  claimedEmployer?: boolean;
  postedByEmail?: string;
  postedAt?: string;
  expiresAt?: string;
  isRemote?: boolean;
  isWorldwide?: boolean;
};

export type JobAdminAction =
  | "review"
  | "activate"
  | "stale"
  | "close"
  | "archive"
  | "reactivate"
  | "expire"
  | "revalidate";

export class JobPublicationQualityError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super("Job listing does not meet publication quality requirements");
    this.name = "JobPublicationQualityError";
    this.errors = errors;
  }
}

function assertJobPublicationQuality(job: Record<string, unknown>) {
  const report = validateJobPublicationQuality(job);
  if (!report.ok) {
    throw new JobPublicationQualityError(report.errors);
  }
}

function optionalText(value: string | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function optionalJsonList(value: string[] | undefined) {
  if (!value?.length) return null;
  const normalized = value.map((item) => String(item).trim()).filter(Boolean);
  return normalized.length ? JSON.stringify(normalized) : null;
}

export async function checkJobsSchema(db: D1DatabaseLike) {
  const { results } = await db
    .prepare("PRAGMA table_info(jobs_listings)")
    .bind()
    .all<JobsSchemaColumnRow>();

  const columns = results
    .map((row) => row.name)
    .filter(Boolean)
    .sort();
  const columnSet = new Set(columns);
  const missingColumns = REQUIRED_JOB_COLUMNS.filter(
    (column) => !columnSet.has(column),
  );

  return {
    ok: missingColumns.length === 0,
    checkedAt: new Date().toISOString(),
    requiredMigration: REQUIRED_JOBS_MIGRATION,
    columns,
    missingColumns,
  };
}

export async function getJobsHealth(db: D1DatabaseLike) {
  const schema = await checkJobsSchema(db);
  const counts = schema.ok
    ? await db
        .prepare(
          "SELECT status, COUNT(*) AS count FROM jobs_listings GROUP BY status ORDER BY status",
        )
        .bind()
        .all<JobStatusCountRow>()
        .then(({ results }) =>
          Object.fromEntries(
            results.map((row) => [row.status, Number(row.count ?? 0)]),
          ),
        )
    : {};

  return {
    ok: schema.ok,
    schema,
    counts,
  };
}

export async function queryAdminJobs(
  db: D1DatabaseLike,
  filters: JobAdminListFilters = {},
): Promise<JobListing[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    where.push("status = ?");
    values.push(filters.status);
  }
  if (filters.tier) {
    where.push("tier = ?");
    values.push(filters.tier);
  }
  if (filters.source) {
    where.push("source = ?");
    values.push(filters.source);
  }
  if (filters.sourceKind) {
    where.push("source_kind = ?");
    values.push(filters.sourceKind);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.max(1, Math.min(100, Math.trunc(filters.limit ?? 50)));
  const { results } = await db
    .prepare(
      `SELECT
        ${JOB_ADMIN_SELECT_FIELDS}
      FROM jobs_listings
      ${whereSql}
      ORDER BY
        CASE tier
          WHEN 'sponsored' THEN 3
          WHEN 'featured' THEN 2
          ELSE 1
        END DESC,
        datetime(updated_at) DESC,
        datetime(created_at) DESC
      LIMIT ?`,
    )
    .bind(...values, limit)
    .all<JobAdminRow>();

  return sortJobs(results.map((row) => mapJobListingRow(row)));
}

export async function queryAdminJobBySlug(
  db: D1DatabaseLike,
  slug: string,
): Promise<JobListing | null> {
  const row = await db
    .prepare(
      `SELECT
        ${JOB_ADMIN_SELECT_FIELDS}
      FROM jobs_listings
      WHERE slug = ?
      LIMIT 1`,
    )
    .bind(slug)
    .first<JobAdminRow>();

  return row ? mapJobListingRow(row) : null;
}

export async function upsertAdminJob(
  db: D1DatabaseLike,
  input: JobAdminUpsertInput,
) {
  assertJobPublicationQuality(input as Record<string, unknown>);

  await db
    .prepare(
      `INSERT INTO jobs_listings (
        slug,
        title,
        company_name,
        company_url,
        location_text,
        summary,
        description_md,
        employment_type,
        compensation_summary,
        equity_summary,
        bonus_summary,
        benefits_json,
        responsibilities_json,
        requirements_json,
        apply_url,
        tier,
        status,
        source,
        source_kind,
        source_url,
        first_seen_at,
        last_checked_at,
        source_checked_at,
        stale_check_count,
        curation_note,
        paid_placement_expires_at,
        claimed_employer,
        posted_by_email,
        posted_at,
        expires_at,
        is_remote,
        is_worldwide,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        company_name = excluded.company_name,
        company_url = excluded.company_url,
        location_text = excluded.location_text,
        summary = excluded.summary,
        description_md = excluded.description_md,
        employment_type = excluded.employment_type,
        compensation_summary = excluded.compensation_summary,
        equity_summary = excluded.equity_summary,
        bonus_summary = excluded.bonus_summary,
        benefits_json = excluded.benefits_json,
        responsibilities_json = excluded.responsibilities_json,
        requirements_json = excluded.requirements_json,
        apply_url = excluded.apply_url,
        tier = excluded.tier,
        status = excluded.status,
        source = excluded.source,
        source_kind = excluded.source_kind,
        source_url = excluded.source_url,
        first_seen_at = excluded.first_seen_at,
        last_checked_at = excluded.last_checked_at,
        source_checked_at = excluded.source_checked_at,
        stale_check_count = excluded.stale_check_count,
        curation_note = excluded.curation_note,
        paid_placement_expires_at = excluded.paid_placement_expires_at,
        claimed_employer = excluded.claimed_employer,
        posted_by_email = excluded.posted_by_email,
        posted_at = excluded.posted_at,
        expires_at = excluded.expires_at,
        is_remote = excluded.is_remote,
        is_worldwide = excluded.is_worldwide,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      input.slug,
      input.title,
      input.companyName,
      optionalText(input.companyUrl),
      optionalText(input.locationText) ?? "Remote",
      input.summary,
      optionalText(input.descriptionMd),
      optionalText(input.employmentType),
      optionalText(input.compensationSummary),
      optionalText(input.equitySummary),
      optionalText(input.bonusSummary),
      optionalJsonList(input.benefits),
      optionalJsonList(input.responsibilities),
      optionalJsonList(input.requirements),
      input.applyUrl,
      input.tier,
      input.status,
      input.source,
      input.sourceKind,
      optionalText(input.sourceUrl) ?? input.applyUrl,
      optionalText(input.firstSeenAt) ?? optionalText(input.postedAt),
      optionalText(input.lastCheckedAt),
      optionalText(input.sourceCheckedAt),
      Math.max(0, Math.trunc(input.staleCheckCount ?? 0)),
      optionalText(input.curationNote),
      optionalText(input.paidPlacementExpiresAt),
      input.claimedEmployer ? 1 : 0,
      optionalText(input.postedByEmail),
      optionalText(input.postedAt),
      optionalText(input.expiresAt),
      input.isRemote === false ? 0 : 1,
      input.isWorldwide ? 1 : 0,
    )
    .run();
}

export async function updateAdminJobState(
  db: D1DatabaseLike,
  input: {
    slug: string;
    action: JobAdminAction;
    checkedAt?: string;
    expiresAt?: string;
  },
) {
  const checkedAt = optionalText(input.checkedAt) ?? new Date().toISOString();
  const expiresAt = optionalText(input.expiresAt);

  if (input.action === "activate" || input.action === "reactivate") {
    const existing = await queryAdminJobBySlug(db, input.slug);
    if (existing) {
      assertJobPublicationQuality({
        ...existing,
        status: "active",
      } as Record<string, unknown>);
    }
  }

  if (input.action === "revalidate") {
    await db
      .prepare(
        `UPDATE jobs_listings
        SET
          source_checked_at = ?,
          last_checked_at = ?,
          stale_check_count = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?`,
      )
      .bind(checkedAt, checkedAt, input.slug)
      .run();
    return;
  }

  if (input.action === "stale") {
    await db
      .prepare(
        `UPDATE jobs_listings
        SET
          status = 'stale_pending_review',
          source_checked_at = ?,
          last_checked_at = ?,
          stale_check_count = stale_check_count + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?`,
      )
      .bind(checkedAt, checkedAt, input.slug)
      .run();
    return;
  }

  const nextStatusByAction: Record<
    Exclude<JobAdminAction, "revalidate" | "stale">,
    JobStatus
  > = {
    review: "pending_review",
    activate: "active",
    close: "closed",
    archive: "archived",
    reactivate: "active",
    expire: "closed",
  };
  const nextStatus = nextStatusByAction[input.action];

  await db
    .prepare(
      `UPDATE jobs_listings
      SET
        status = ?,
        expires_at = COALESCE(?, expires_at),
        source_checked_at = CASE WHEN ? IN ('activate', 'reactivate') THEN ? ELSE source_checked_at END,
        last_checked_at = CASE WHEN ? IN ('activate', 'reactivate') THEN ? ELSE last_checked_at END,
        stale_check_count = CASE WHEN ? IN ('activate', 'reactivate') THEN 0 ELSE stale_check_count END,
        updated_at = CURRENT_TIMESTAMP
      WHERE slug = ?`,
    )
    .bind(
      nextStatus,
      expiresAt,
      input.action,
      checkedAt,
      input.action,
      checkedAt,
      input.action,
      input.slug,
    )
    .run();
}
