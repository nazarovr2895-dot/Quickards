import hashlib
import hmac
import json
import time
from urllib.parse import quote, urlencode

import pytest

from app.telegram_auth import validate_init_data
from app import config


TEST_BOT_TOKEN = "1234567890:ABCDefGhIJKlmnOPQRstUVwxyz"


def make_init_data(user_id: int = 12345, bot_token: str = TEST_BOT_TOKEN, auth_date: int | None = None) -> str:
    """Build a valid Telegram initData string with correct HMAC."""
    user_data = json.dumps({"id": user_id, "first_name": "Test", "username": "testuser"})
    if auth_date is None:
        auth_date = int(time.time())

    params = {
        "user": user_data,
        "auth_date": str(auth_date),
        "query_id": "test_query",
    }

    # Build data-check-string
    data_check_string = "\n".join(f"{k}={params[k]}" for k in sorted(params))

    # Compute HMAC
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    params["hash"] = computed_hash
    return urlencode(params)


@pytest.fixture(autouse=True)
def set_bot_token(monkeypatch):
    monkeypatch.setattr(config, "BOT_TOKEN", TEST_BOT_TOKEN)


class TestValidateInitData:
    def test_valid_data_returns_user_id(self):
        init_data = make_init_data(user_id=99999)
        result = validate_init_data(init_data)
        assert result == 99999

    def test_invalid_hash_returns_none(self):
        init_data = make_init_data() + "&hash=invalid_hash"
        # The hash param will be overridden by the last one in parse_qs
        # Actually parse_qs takes last value, so let's tamper differently
        init_data = make_init_data().replace("hash=", "hash=tampered")
        result = validate_init_data(init_data)
        assert result is None

    def test_empty_string_returns_none(self):
        assert validate_init_data("") is None

    def test_no_bot_token_returns_none(self, monkeypatch):
        monkeypatch.setattr(config, "BOT_TOKEN", "")
        init_data = make_init_data()
        assert validate_init_data(init_data) is None

    def test_missing_user_returns_none(self):
        auth_date = str(int(time.time()))
        params = {"auth_date": auth_date, "query_id": "test"}
        data_check_string = "\n".join(f"{k}={params[k]}" for k in sorted(params))
        secret_key = hmac.new(b"WebAppData", TEST_BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        params["hash"] = computed_hash
        init_data = urlencode(params)
        assert validate_init_data(init_data) is None

    def test_expired_auth_date_returns_none(self):
        old_date = int(time.time()) - 90000  # > 24 hours ago
        init_data = make_init_data(auth_date=old_date)
        result = validate_init_data(init_data)
        assert result is None

    def test_recent_auth_date_passes(self):
        recent_date = int(time.time()) - 3600  # 1 hour ago
        init_data = make_init_data(auth_date=recent_date)
        result = validate_init_data(init_data)
        assert result == 12345
