PRAGMA foreign_keys = off;

ALTER TABLE jobs_listings RENAME TO jobs_listings_0006_old;

CREATE TABLE jobs_listings (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_url TEXT,
  location_text TEXT NOT NULL DEFAULT 'Remote',
  summary TEXT,
  description_md TEXT,
  employment_type TEXT,
  compensation_summary TEXT,
  responsibilities_json TEXT,
  requirements_json TEXT,
  apply_url TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('free', 'standard', 'featured', 'sponsored')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'active', 'stale_pending_review', 'closed', 'archived')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'polar', 'email', 'curated')),
  source_kind TEXT NOT NULL DEFAULT 'employer_submitted' CHECK (source_kind IN ('official_ats', 'employer_careers', 'employer_submitted')),
  source_url TEXT,
  first_seen_at TEXT,
  last_checked_at TEXT,
  source_checked_at TEXT,
  stale_check_count INTEGER NOT NULL DEFAULT 0 CHECK (stale_check_count >= 0),
  curation_note TEXT,
  paid_placement_expires_at TEXT,
  claimed_employer INTEGER NOT NULL DEFAULT 0 CHECK (claimed_employer IN (0, 1)),
  posted_by_email TEXT,
  posted_at TEXT,
  expires_at TEXT,
  is_remote INTEGER NOT NULL DEFAULT 1 CHECK (is_remote IN (0, 1)),
  is_worldwide INTEGER NOT NULL DEFAULT 0 CHECK (is_worldwide IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO jobs_listings (
  slug,
  title,
  company_name,
  location_text,
  summary,
  description_md,
  employment_type,
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
  posted_at,
  expires_at,
  is_remote,
  is_worldwide,
  created_at,
  updated_at
)
SELECT
  slug,
  title,
  company_name,
  location_text,
  summary,
  description_md,
  employment_type,
  compensation_summary,
  responsibilities_json,
  requirements_json,
  apply_url,
  CASE WHEN tier IN ('free', 'standard', 'featured', 'sponsored') THEN tier ELSE 'standard' END,
  CASE WHEN status IN ('draft', 'pending_review', 'active', 'stale_pending_review', 'closed', 'archived') THEN status ELSE 'pending_review' END,
  CASE WHEN source IN ('manual', 'polar', 'email', 'curated') THEN source ELSE 'manual' END,
  'employer_submitted',
  apply_url,
  posted_at,
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  0,
  posted_by_email,
  posted_at,
  expires_at,
  is_remote,
  is_worldwide,
  created_at,
  updated_at
FROM jobs_listings_0006_old;

DROP TABLE jobs_listings_0006_old;

CREATE INDEX IF NOT EXISTS idx_jobs_listings_active_rank
  ON jobs_listings (status, expires_at, tier, posted_at, created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_listings_source
  ON jobs_listings (source, status);

CREATE INDEX IF NOT EXISTS idx_jobs_listings_source_freshness
  ON jobs_listings (source_kind, status, source_checked_at, stale_check_count);

ALTER TABLE listing_leads RENAME TO listing_leads_0006_old;

CREATE TABLE listing_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('job', 'tool', 'claim')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived')),
  tier_interest TEXT NOT NULL DEFAULT 'free' CHECK (tier_interest IN ('free', 'standard', 'featured', 'sponsored')),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  listing_title TEXT NOT NULL,
  website_url TEXT,
  apply_url TEXT,
  message TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO listing_leads (
  id,
  kind,
  status,
  tier_interest,
  contact_name,
  contact_email,
  company_name,
  listing_title,
  website_url,
  apply_url,
  message,
  payload_json,
  created_at,
  updated_at
)
SELECT
  id,
  CASE WHEN kind IN ('job', 'tool', 'claim') THEN kind ELSE 'tool' END,
  status,
  tier_interest,
  contact_name,
  contact_email,
  company_name,
  listing_title,
  website_url,
  apply_url,
  message,
  payload_json,
  created_at,
  updated_at
FROM listing_leads_0006_old;

DROP TABLE listing_leads_0006_old;

CREATE INDEX IF NOT EXISTS idx_listing_leads_review
  ON listing_leads (kind, status, created_at);

CREATE INDEX IF NOT EXISTS idx_listing_leads_contact
  ON listing_leads (contact_email, created_at);

PRAGMA foreign_keys = on;
