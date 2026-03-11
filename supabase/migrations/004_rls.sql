-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

-- Users: can read/write only own row
CREATE POLICY users_select ON users FOR SELECT
  USING (telegram_id = public.current_telegram_user_id());
CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (telegram_id = public.current_telegram_user_id());
CREATE POLICY users_update ON users FOR UPDATE
  USING (telegram_id = public.current_telegram_user_id())
  WITH CHECK (telegram_id = public.current_telegram_user_id());

-- Sets: system sets readable by all; user sets only by owner
CREATE POLICY sets_select ON sets FOR SELECT
  USING (is_system = true OR owner_id = public.current_telegram_user_id());
CREATE POLICY sets_insert ON sets FOR INSERT
  WITH CHECK (owner_id = public.current_telegram_user_id());
CREATE POLICY sets_update ON sets FOR UPDATE
  USING (owner_id = public.current_telegram_user_id());
CREATE POLICY sets_delete ON sets FOR DELETE
  USING (owner_id = public.current_telegram_user_id());

-- Cards: system set cards readable by all; user set cards only by owner
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

-- User sets: only own rows
CREATE POLICY user_sets_select ON user_sets FOR SELECT
  USING (user_id = public.current_telegram_user_id());
CREATE POLICY user_sets_insert ON user_sets FOR INSERT
  WITH CHECK (user_id = public.current_telegram_user_id());
CREATE POLICY user_sets_delete ON user_sets FOR DELETE
  USING (user_id = public.current_telegram_user_id());

-- User cards: only own rows
CREATE POLICY user_cards_select ON user_cards FOR SELECT
  USING (user_id = public.current_telegram_user_id());
CREATE POLICY user_cards_insert ON user_cards FOR INSERT
  WITH CHECK (user_id = public.current_telegram_user_id());
CREATE POLICY user_cards_update ON user_cards FOR UPDATE
  USING (user_id = public.current_telegram_user_id());

-- Review logs: only for own user_cards
CREATE POLICY review_logs_select ON review_logs FOR SELECT
  USING (user_card_id IN (
    SELECT id FROM user_cards WHERE user_id = public.current_telegram_user_id()
  ));
CREATE POLICY review_logs_insert ON review_logs FOR INSERT
  WITH CHECK (user_card_id IN (
    SELECT id FROM user_cards WHERE user_id = public.current_telegram_user_id()
  ));
