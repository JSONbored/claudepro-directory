CREATE TABLE IF NOT EXISTS listing_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('job', 'tool')),
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

CREATE INDEX IF NOT EXISTS idx_listing_leads_review
  ON listing_leads (kind, status, created_at);

CREATE INDEX IF NOT EXISTS idx_listing_leads_contact
  ON listing_leads (contact_email, created_at);

CREATE TABLE IF NOT EXISTS commercial_placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('job', 'tool', 'entry')),
  target_key TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('standard', 'featured', 'sponsored')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('new', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived')),
  disclosure TEXT NOT NULL DEFAULT 'sponsored' CHECK (disclosure IN ('editorial', 'affiliate', 'sponsored')),
  checkout_provider TEXT,
  checkout_ref TEXT,
  starts_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commercial_placements_active
  ON commercial_placements (target_kind, status, expires_at, tier);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commercial_placements_target_active
  ON commercial_placements (target_kind, target_key, status)
  WHERE status = 'active';
