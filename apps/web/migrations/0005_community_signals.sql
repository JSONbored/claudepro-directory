CREATE TABLE IF NOT EXISTS community_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('entry', 'tool')),
  target_key TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('used', 'works', 'broken')),
  client_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (target_kind, target_key, signal_type, client_id)
);

CREATE INDEX IF NOT EXISTS idx_community_signals_target
  ON community_signals (target_kind, target_key);

CREATE INDEX IF NOT EXISTS idx_community_signals_type
  ON community_signals (signal_type, updated_at);
