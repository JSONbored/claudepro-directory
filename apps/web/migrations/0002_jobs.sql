CREATE TABLE IF NOT EXISTS jobs_listings (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location_text TEXT NOT NULL DEFAULT 'Remote',
  summary TEXT,
  description_md TEXT,
  employment_type TEXT,
  compensation_summary TEXT,
  responsibilities_json TEXT,
  requirements_json TEXT,
  apply_url TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'featured', 'sponsored')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'active', 'closed', 'archived')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'polar', 'email')),
  posted_by_email TEXT,
  posted_at TEXT,
  expires_at TEXT,
  is_remote INTEGER NOT NULL DEFAULT 1 CHECK (is_remote IN (0, 1)),
  is_worldwide INTEGER NOT NULL DEFAULT 0 CHECK (is_worldwide IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_listings_active_rank
  ON jobs_listings (status, expires_at, tier, posted_at, created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_listings_source
  ON jobs_listings (source, status);
