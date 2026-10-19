CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('prediction', 'survey')),
  section TEXT NOT NULL,
  period TEXT,
  claim_id TEXT,
  calibration_version INTEGER,
  choice TEXT,
  answers_json TEXT,
  comment TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_type_created_at
  ON feedback_submissions (feedback_type, created_at);

CREATE INDEX IF NOT EXISTS idx_feedback_section_created_at
  ON feedback_submissions (section, created_at);
