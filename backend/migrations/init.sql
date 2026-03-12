-- Quickards: Database Schema (self-hosted, no RLS)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  telegram_id   BIGINT PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  username      TEXT,
  language_code TEXT DEFAULT 'ru',
  daily_goal    INT NOT NULL DEFAULT 20,
  streak_freezes INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      BIGINT REFERENCES users(telegram_id),
  name          TEXT NOT NULL,
  description   TEXT,
  cefr_level    TEXT,
  source        TEXT,
  card_count    INT DEFAULT 0,
  is_system     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sets_system ON sets(is_system) WHERE is_system = true;
CREATE INDEX IF NOT EXISTS idx_sets_owner ON sets(owner_id) WHERE owner_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS cards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id         UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  front          TEXT NOT NULL,
  back           TEXT NOT NULL,
  part_of_speech TEXT,
  phonetics      TEXT,
  example        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);

CREATE TABLE IF NOT EXISTS user_sets (
  user_id   BIGINT NOT NULL REFERENCES users(telegram_id),
  set_id    UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, set_id)
);

CREATE TABLE IF NOT EXISTS user_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         BIGINT NOT NULL REFERENCES users(telegram_id),
  card_id         UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  due             TIMESTAMPTZ NOT NULL DEFAULT now(),
  stability       REAL NOT NULL DEFAULT 0,
  difficulty      REAL NOT NULL DEFAULT 0,
  elapsed_days    INT NOT NULL DEFAULT 0,
  scheduled_days  INT NOT NULL DEFAULT 0,
  reps            INT NOT NULL DEFAULT 0,
  lapses          INT NOT NULL DEFAULT 0,
  learning_steps  INT NOT NULL DEFAULT 0,
  state           SMALLINT NOT NULL DEFAULT 0,
  last_review     TIMESTAMPTZ,
  UNIQUE (user_id, card_id)
);
CREATE INDEX IF NOT EXISTS idx_user_cards_due ON user_cards(user_id, due);
CREATE INDEX IF NOT EXISTS idx_user_cards_state ON user_cards(user_id, state);

CREATE TABLE IF NOT EXISTS review_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_card_id    UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  rating          SMALLINT NOT NULL,
  state           SMALLINT NOT NULL,
  due             TIMESTAMPTZ NOT NULL,
  stability       REAL NOT NULL,
  difficulty      REAL NOT NULL,
  elapsed_days    INT NOT NULL,
  scheduled_days  INT NOT NULL,
  reviewed_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_logs_user_card ON review_logs(user_card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(user_card_id, reviewed_at);
