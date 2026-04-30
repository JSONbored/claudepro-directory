CREATE INDEX IF NOT EXISTS idx_jobs_listings_review_queue
  ON jobs_listings (status, updated_at, created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_listings_expiry
  ON jobs_listings (status, expires_at, updated_at);

CREATE INDEX IF NOT EXISTS idx_jobs_listings_paid_placement
  ON jobs_listings (paid_placement_expires_at, status, tier);

CREATE INDEX IF NOT EXISTS idx_listing_leads_status_tier
  ON listing_leads (kind, status, tier_interest, created_at);
