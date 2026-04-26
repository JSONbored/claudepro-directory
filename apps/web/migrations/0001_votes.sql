CREATE TABLE IF NOT EXISTS votes_entries (
  entry_key TEXT PRIMARY KEY,
  upvote_count INTEGER NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes_by_client (
  entry_key TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_key, client_id),
  FOREIGN KEY (entry_key) REFERENCES votes_entries(entry_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_votes_by_client_client_id
  ON votes_by_client (client_id);
