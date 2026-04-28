import { getSiteDb, type D1DatabaseLike } from "@/lib/db";

export type JobTier = "free" | "standard" | "featured" | "sponsored";
export type JobStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "stale_pending_review"
  | "closed"
  | "archived";
export type JobSource = "manual" | "polar" | "email" | "curated";
export type JobSourceKind =
  | "official_ats"
  | "employer_careers"
  | "employer_submitted";

export type JobListing = {
  slug: string;
  title: string;
  company: string;
  companyUrl?: string;
  location: string;
  description: string;
  type?: string;
  postedAt?: string;
  compensation?: string;
  responsibilities?: string[];
  requirements?: string[];
  featured: boolean;
  sponsored?: boolean;
  applyUrl: string;
  tier?: JobTier;
  status?: JobStatus;
  source?: JobSource;
  sourceKind?: JobSourceKind;
  sourceUrl?: string;
  firstSeenAt?: string;
  lastCheckedAt?: string;
  sourceCheckedAt?: string;
  staleCheckCount?: number;
  curationNote?: string;
  paidPlacementExpiresAt?: string;
  claimedEmployer?: boolean;
  postedByEmail?: string;
  expiresAt?: string;
  isRemote?: boolean;
  isWorldwide?: boolean;
};

export type JobListingRow = {
  slug: string;
  title: string;
  company_name: string;
  company_url: string | null;
  location_text: string;
  summary: string | null;
  description_md: string | null;
  employment_type: string | null;
  posted_at: string | null;
  compensation_summary: string | null;
  responsibilities_json: string | null;
  requirements_json: string | null;
  apply_url: string | null;
  tier: string | null;
  status: string | null;
  source: string | null;
  source_kind: string | null;
  source_url: string | null;
  first_seen_at: string | null;
  last_checked_at: string | null;
  source_checked_at: string | null;
  stale_check_count: number | null;
  curation_note: string | null;
  paid_placement_expires_at: string | null;
  claimed_employer: number | null;
  posted_by_email: string | null;
  expires_at: string | null;
  is_remote: number | null;
  is_worldwide: number | null;
};

function parseList(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    const cleaned = parsed
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  } catch {
    return undefined;
  }
}

function mapTier(tier: string | null | undefined): JobTier {
  if (tier === "free") return "free";
  if (tier === "sponsored" || tier === "featured") return tier;
  return "standard";
}

function mapStatus(status: string | null | undefined): JobStatus {
  if (
    status === "draft" ||
    status === "pending_review" ||
    status === "active" ||
    status === "stale_pending_review" ||
    status === "closed" ||
    status === "archived"
  ) {
    return status;
  }
  return "active";
}

function mapSource(source: string | null | undefined): JobSource {
  if (
    source === "manual" ||
    source === "polar" ||
    source === "email" ||
    source === "curated"
  ) {
    return source;
  }
  return "manual";
}

function mapSourceKind(value: string | null | undefined): JobSourceKind {
  if (
    value === "official_ats" ||
    value === "employer_careers" ||
    value === "employer_submitted"
  ) {
    return value;
  }
  return "employer_submitted";
}

export function mapJobListingRow(row: JobListingRow): JobListing {
  const tier = mapTier(row.tier);
  return {
    slug: row.slug,
    title: row.title,
    company: row.company_name,
    companyUrl: row.company_url || undefined,
    location: row.location_text || "Remote",
    description: row.summary || row.description_md || "",
    type: row.employment_type || undefined,
    postedAt: row.posted_at || undefined,
    compensation: row.compensation_summary || undefined,
    responsibilities: parseList(row.responsibilities_json),
    requirements: parseList(row.requirements_json),
    featured: tier === "featured" || tier === "sponsored",
    sponsored: tier === "sponsored",
    applyUrl: row.apply_url || "/jobs/post",
    tier,
    status: mapStatus(row.status),
    source: mapSource(row.source),
    sourceKind: mapSourceKind(row.source_kind),
    sourceUrl: row.source_url || row.apply_url || undefined,
    firstSeenAt: row.first_seen_at || row.posted_at || undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    sourceCheckedAt: row.source_checked_at || undefined,
    staleCheckCount: Number(row.stale_check_count ?? 0),
    curationNote: row.curation_note || undefined,
    paidPlacementExpiresAt: row.paid_placement_expires_at || undefined,
    claimedEmployer: Number(row.claimed_employer ?? 0) === 1,
    postedByEmail: row.posted_by_email || undefined,
    expiresAt: row.expires_at || undefined,
    isRemote: Number(row.is_remote ?? 1) === 1,
    isWorldwide: Number(row.is_worldwide ?? 0) === 1,
  };
}

export function sortJobs(jobs: JobListing[]): JobListing[] {
  return [...jobs].sort((left, right) => {
    const leftScore =
      Number(Boolean(left.sponsored)) * 3 +
      Number(Boolean(left.featured)) * 2 +
      Number(left.tier === "standard");
    const rightScore =
      Number(Boolean(right.sponsored)) * 3 +
      Number(Boolean(right.featured)) * 2 +
      Number(right.tier === "standard");
    if (rightScore !== leftScore) return rightScore - leftScore;
    return String(right.postedAt || "").localeCompare(
      String(left.postedAt || ""),
    );
  });
}

function getJobsDb(): D1DatabaseLike | null {
  return getSiteDb();
}

export async function queryActiveJobs(
  db: D1DatabaseLike,
): Promise<JobListing[]> {
  const { results } = await db
    .prepare(
      `SELECT
        slug,
        title,
        company_name,
        company_url,
        location_text,
        summary,
        description_md,
        employment_type,
        posted_at,
        compensation_summary,
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
        is_worldwide
      FROM jobs_listings
      WHERE status = 'active'
        AND (expires_at IS NULL OR datetime(expires_at) >= datetime('now'))
      ORDER BY
        CASE tier
          WHEN 'sponsored' THEN 3
          WHEN 'featured' THEN 2
          ELSE 1
        END DESC,
        datetime(posted_at) DESC,
        datetime(created_at) DESC`,
    )
    .bind()
    .all<JobListingRow>();

  return sortJobs(results.map((row) => mapJobListingRow(row)));
}

export async function getJobs(): Promise<JobListing[]> {
  const db = getJobsDb();
  if (!db) return [];

  try {
    return await queryActiveJobs(db);
  } catch (error) {
    console.warn(
      "[jobs] failed to query active D1 jobs",
      error instanceof Error ? error.message : "unknown error",
    );
    return [];
  }
}

export async function getJobBySlug(slug: string): Promise<JobListing | null> {
  const jobs = await getJobs();
  return jobs.find((item) => item.slug === slug) ?? null;
}
