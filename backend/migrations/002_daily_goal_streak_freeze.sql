-- Add daily goal and streak freeze columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal INT NOT NULL DEFAULT 20;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freezes INT NOT NULL DEFAULT 1;

-- Index for faster review_logs date queries (streak calculation)
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(user_card_id, reviewed_at);
