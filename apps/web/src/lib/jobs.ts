import { getSiteDb, type D1DatabaseLike } from "@/lib/db";

export type JobTier = "standard" | "featured" | "sponsored";
export type JobStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "closed"
  | "archived";

export type JobListing = {
  slug: string;
  title: string;
  company: string;
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
  source?: "manual" | "polar" | "email";
  postedByEmail?: string;
  expiresAt?: string;
  isRemote?: boolean;
  isWorldwide?: boolean;
};

type JobListingRow = {
  slug: string;
  title: string;
  company_name: string;
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
  if (tier === "sponsored" || tier === "featured") return tier;
  return "standard";
}

function toJobListing(row: JobListingRow): JobListing {
  const tier = mapTier(row.tier);
  return {
    slug: row.slug,
    title: row.title,
    company: row.company_name,
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
    status: (row.status ?? "active") as JobStatus,
    source: (row.source ?? "manual") as "manual" | "polar" | "email",
    postedByEmail: row.posted_by_email || undefined,
    expiresAt: row.expires_at || undefined,
    isRemote: Number(row.is_remote ?? 1) === 1,
    isWorldwide: Number(row.is_worldwide ?? 0) === 1,
  };
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

  return results.map((row) => toJobListing(row));
}

export async function getJobs(): Promise<JobListing[]> {
  const db = getJobsDb();
  if (!db) return [];

  try {
    return await queryActiveJobs(db);
  } catch {
    return [];
  }
}

export async function getJobBySlug(slug: string): Promise<JobListing | null> {
  const jobs = await getJobs();
  return jobs.find((item) => item.slug === slug) ?? null;
}
