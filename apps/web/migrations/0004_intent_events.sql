CREATE TABLE IF NOT EXISTS intent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('copy', 'open', 'install', 'download', 'vote')),
  entry_key TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  session_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_intent_events_type_created
  ON intent_events (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_intent_events_entry_created
  ON intent_events (entry_key, created_at);
