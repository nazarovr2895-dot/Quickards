-- Schema for internal functions (not exposed via PostgREST API)
CREATE SCHEMA IF NOT EXISTS hidden;

-- URL decode helper
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

-- Validate Telegram initData and extract user info
-- The bot token must be stored in Supabase Vault as 'bot_token'
-- or you can hardcode it below (less secure but simpler)
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
  -- Get initData from request header
  init_data := current_setting('request.headers', true)::json->>'x-telegram-init-data';

  IF init_data IS NULL OR init_data = '' THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Get bot token from vault or environment
  -- Option 1: From vault (recommended)
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

  -- Parse pairs
  pairs := string_to_array(init_data, '&');

  -- Extract hash and build data-check-string
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

  -- Sort pairs alphabetically
  SELECT array_agg(s ORDER BY s) INTO sorted_pairs FROM unnest(sorted_pairs) AS s;

  -- Build data-check-string
  data_check_string := array_to_string(sorted_pairs, E'\n');

  -- Compute HMAC
  secret_key := hmac('WebAppData'::bytea, bot_token::bytea, 'sha256');
  computed_hash := encode(hmac(data_check_string::bytea, secret_key, 'sha256'), 'hex');

  IF computed_hash != provided_hash THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Extract user JSON
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

-- Convenience function to get current telegram user ID for RLS
CREATE OR REPLACE FUNCTION public.current_telegram_user_id()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (hidden.get_telegram_user()->>'id')::bigint;
$$;
