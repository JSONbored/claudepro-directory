ALTER TABLE jobs_listings ADD COLUMN equity_summary TEXT;
ALTER TABLE jobs_listings ADD COLUMN bonus_summary TEXT;
ALTER TABLE jobs_listings ADD COLUMN benefits_json TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_listings_compensation_metadata
  ON jobs_listings (status, compensation_summary, equity_summary, bonus_summary);
