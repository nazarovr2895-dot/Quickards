import hashlib
import hmac
import json
import time
from urllib.parse import unquote, parse_qs

from fastapi import Header, HTTPException

from . import config

# Maximum age of auth data (24 hours)
AUTH_MAX_AGE_SECONDS = 86400


def validate_init_data(init_data: str) -> int | None:
    """Validate Telegram initData and return user_id."""
    if not init_data or not config.BOT_TOKEN:
        return None

    parsed = parse_qs(init_data, keep_blank_values=True)
    provided_hash = parsed.pop("hash", [None])[0]
    if not provided_hash:
        return None

    # Build data-check-string
    pairs = []
    for key in sorted(parsed):
        val = parsed[key][0]
        pairs.append(f"{key}={val}")
    data_check_string = "\n".join(pairs)

    # HMAC-SHA256 validation
    secret_key = hmac.new(b"WebAppData", config.BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if computed_hash != provided_hash:
        return None

    # Validate auth_date freshness
    auth_date_str = parsed.get("auth_date", [None])[0]
    if auth_date_str:
        try:
            auth_date = int(auth_date_str)
            if time.time() - auth_date > AUTH_MAX_AGE_SECONDS:
                return None
        except (ValueError, TypeError):
            return None

    # Extract user_id
    user_str = parsed.get("user", [None])[0]
    if not user_str:
        return None
    try:
        user_data = json.loads(unquote(user_str))
        return int(user_data["id"])
    except (json.JSONDecodeError, KeyError, ValueError):
        return None


async def get_current_user_id(
    x_telegram_init_data: str = Header("", alias="X-Telegram-Init-Data"),
) -> int:
    """FastAPI dependency: extract and validate Telegram user ID."""
    user_id = validate_init_data(x_telegram_init_data)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid Telegram auth")
    return user_id
