import hashlib
import hmac
import json
from urllib.parse import unquote, parse_qs

from fastapi import Header, HTTPException

from . import config


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
