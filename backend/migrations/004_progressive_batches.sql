-- Progressive batch unlocking for system sets
ALTER TABLE user_sets ADD COLUMN IF NOT EXISTS unlocked_count INT NOT NULL DEFAULT 25;
