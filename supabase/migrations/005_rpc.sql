-- Get new cards from a set (cards not yet in user_cards for current user)
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
