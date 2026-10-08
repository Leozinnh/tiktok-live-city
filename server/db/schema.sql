CREATE TABLE IF NOT EXISTS viewers (
  username TEXT PRIMARY KEY,
  nickname TEXT,
  likes_count INTEGER DEFAULT 0,
  gifts_value INTEGER DEFAULT 0,
  is_follower INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  viewer_username TEXT,
  name TEXT NOT NULL,
  personality TEXT DEFAULT 'Worker',
  job TEXT DEFAULT 'Civil',
  money INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  hunger INTEGER DEFAULT 0,
  mood INTEGER DEFAULT 100,
  home_id TEXT,
  work_id TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (viewer_username) REFERENCES viewers (username)
);

CREATE TABLE IF NOT EXISTS events_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  trigger_user TEXT,
  payload_json TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS city_economy (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_money INTEGER DEFAULT 100000,
  population INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_viewers_gifts ON viewers (gifts_value DESC);
CREATE INDEX IF NOT EXISTS idx_npcs_viewer ON npcs (viewer_username);
CREATE INDEX IF NOT EXISTS idx_events_time ON events_history (created_at DESC);
