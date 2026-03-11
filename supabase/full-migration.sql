-- ============================================
-- Quickards: Full Migration (all-in-one)
-- Скопируй и вставь в Supabase SQL Editor
-- ============================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Hidden schema + Telegram auth functions
CREATE SCHEMA IF NOT EXISTS hidden;

CREATE OR REPLACE FUNCTION hidden.url_decode(input text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result text := '';
  i int := 1;
  len int;
  ch text;
  hex text;
BEGIN
  len := length(input);
  WHILE i <= len LOOP
    ch := substring(input FROM i FOR 1);
    IF ch = '%' AND i + 2 <= len THEN
      hex := substring(input FROM i + 1 FOR 2);
      BEGIN
        result := result || chr(('x' || hex)::bit(8)::int);
        i := i + 3;
        CONTINUE;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    ELSIF ch = '+' THEN
      result := result || ' ';
    ELSE
      result := result || ch;
    END IF;
    i := i + 1;
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION hidden.get_telegram_user()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  init_data text;
  pairs text[];
  sorted_pairs text[];
  data_check_string text;
  pair text;
  key text;
  val text;
  provided_hash text;
  user_json jsonb;
  secret_key bytea;
  computed_hash text;
  bot_token text;
BEGIN
  init_data := current_setting('request.headers', true)::json->>'x-telegram-init-data';
  IF init_data IS NULL OR init_data = '' THEN
    RETURN '{}'::jsonb;
  END IF;
  BEGIN
    SELECT decrypted_secret INTO bot_token
    FROM vault.decrypted_secrets
    WHERE name = 'bot_token'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    bot_token := NULL;
  END;
  IF bot_token IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  pairs := string_to_array(init_data, '&');
  sorted_pairs := ARRAY[]::text[];
  FOREACH pair IN ARRAY pairs LOOP
    key := split_part(pair, '=', 1);
    val := substring(pair FROM length(key) + 2);
    IF key = 'hash' THEN
      provided_hash := val;
    ELSE
      sorted_pairs := array_append(sorted_pairs, key || '=' || hidden.url_decode(val));
    END IF;
  END LOOP;
  SELECT array_agg(s ORDER BY s) INTO sorted_pairs FROM unnest(sorted_pairs) AS s;
  data_check_string := array_to_string(sorted_pairs, E'\n');
  secret_key := hmac('WebAppData'::bytea, bot_token::bytea, 'sha256');
  computed_hash := encode(hmac(data_check_string::bytea, secret_key, 'sha256'), 'hex');
  IF computed_hash != provided_hash THEN
    RETURN '{}'::jsonb;
  END IF;
  FOREACH pair IN ARRAY pairs LOOP
    key := split_part(pair, '=', 1);
    val := substring(pair FROM length(key) + 2);
    IF key = 'user' THEN
      user_json := hidden.url_decode(val)::jsonb;
      RETURN user_json;
    END IF;
  END LOOP;
  RETURN '{}'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_telegram_user_id()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (hidden.get_telegram_user()->>'id')::bigint;
$$;

-- 3. Tables
CREATE TABLE users (
  telegram_id   BIGINT PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  username      TEXT,
  language_code TEXT DEFAULT 'ru',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sets (
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
CREATE INDEX idx_sets_system ON sets(is_system) WHERE is_system = true;
CREATE INDEX idx_sets_owner ON sets(owner_id) WHERE owner_id IS NOT NULL;

CREATE TABLE cards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id         UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  front          TEXT NOT NULL,
  back           TEXT NOT NULL,
  part_of_speech TEXT,
  phonetics      TEXT,
  example        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cards_set_id ON cards(set_id);

CREATE TABLE user_sets (
  user_id   BIGINT NOT NULL REFERENCES users(telegram_id),
  set_id    UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  added_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, set_id)
);

CREATE TABLE user_cards (
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
CREATE INDEX idx_user_cards_due ON user_cards(user_id, due);
CREATE INDEX idx_user_cards_state ON user_cards(user_id, state);

CREATE TABLE review_logs (
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
CREATE INDEX idx_review_logs_user_card ON review_logs(user_card_id);

-- 4. RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON users FOR SELECT
  USING (telegram_id = public.current_telegram_user_id());
CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (telegram_id = public.current_telegram_user_id());
CREATE POLICY users_update ON users FOR UPDATE
  USING (telegram_id = public.current_telegram_user_id())
  WITH CHECK (telegram_id = public.current_telegram_user_id());

CREATE POLICY sets_select ON sets FOR SELECT
  USING (is_system = true OR owner_id = public.current_telegram_user_id());
CREATE POLICY sets_insert ON sets FOR INSERT
  WITH CHECK (owner_id = public.current_telegram_user_id());
CREATE POLICY sets_update ON sets FOR UPDATE
  USING (owner_id = public.current_telegram_user_id());
CREATE POLICY sets_delete ON sets FOR DELETE
  USING (owner_id = public.current_telegram_user_id());

CREATE POLICY cards_select ON cards FOR SELECT
  USING (
    set_id IN (SELECT id FROM sets WHERE is_system = true)
    OR set_id IN (SELECT id FROM sets WHERE owner_id = public.current_telegram_user_id())
  );
CREATE POLICY cards_insert ON cards FOR INSERT
  WITH CHECK (set_id IN (SELECT id FROM sets WHERE owner_id = public.current_telegram_user_id()));
CREATE POLICY cards_update ON cards FOR UPDATE
  USING (set_id IN (SELECT id FROM sets WHERE owner_id = public.current_telegram_user_id()));
CREATE POLICY cards_delete ON cards FOR DELETE
  USING (set_id IN (SELECT id FROM sets WHERE owner_id = public.current_telegram_user_id()));

CREATE POLICY user_sets_select ON user_sets FOR SELECT
  USING (user_id = public.current_telegram_user_id());
CREATE POLICY user_sets_insert ON user_sets FOR INSERT
  WITH CHECK (user_id = public.current_telegram_user_id());
CREATE POLICY user_sets_delete ON user_sets FOR DELETE
  USING (user_id = public.current_telegram_user_id());

CREATE POLICY user_cards_select ON user_cards FOR SELECT
  USING (user_id = public.current_telegram_user_id());
CREATE POLICY user_cards_insert ON user_cards FOR INSERT
  WITH CHECK (user_id = public.current_telegram_user_id());
CREATE POLICY user_cards_update ON user_cards FOR UPDATE
  USING (user_id = public.current_telegram_user_id());

CREATE POLICY review_logs_select ON review_logs FOR SELECT
  USING (user_card_id IN (
    SELECT id FROM user_cards WHERE user_id = public.current_telegram_user_id()
  ));
CREATE POLICY review_logs_insert ON review_logs FOR INSERT
  WITH CHECK (user_card_id IN (
    SELECT id FROM user_cards WHERE user_id = public.current_telegram_user_id()
  ));

-- 5. RPC Functions
CREATE OR REPLACE FUNCTION get_new_cards(p_set_id UUID, p_limit INT DEFAULT 10)
RETURNS SETOF cards
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT c.* FROM cards c
  WHERE c.set_id = p_set_id
  AND NOT EXISTS (
    SELECT 1 FROM user_cards uc
    WHERE uc.card_id = c.id
    AND uc.user_id = public.current_telegram_user_id()
  )
  ORDER BY c.created_at
  LIMIT p_limit;
$$;
