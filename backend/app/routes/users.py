from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["users"])


class UserBody(BaseModel):
    first_name: str
    last_name: str | None = None
    username: str | None = None
    language_code: str = "ru"


class DailyGoalBody(BaseModel):
    daily_goal: int


@router.post("/users")
async def upsert_user(
    body: UserBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    # Check if user already exists
    existing = await pool.fetchval(
        "SELECT telegram_id FROM users WHERE telegram_id = $1", user_id
    )
    await pool.execute(
        """
        INSERT INTO users (telegram_id, first_name, last_name, username, language_code, updated_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (telegram_id) DO UPDATE SET
            first_name = $2, last_name = $3, username = $4,
            language_code = $5, updated_at = now()
        """,
        user_id, body.first_name, body.last_name, body.username, body.language_code,
    )
    # Auto-subscribe new users to all system sets
    if existing is None:
        await pool.execute(
            """
            INSERT INTO user_sets (user_id, set_id)
            SELECT $1, id FROM sets WHERE is_system = true
            ON CONFLICT DO NOTHING
            """,
            user_id,
        )
    return {"ok": True}


@router.put("/users/daily-goal")
async def update_daily_goal(
    body: DailyGoalBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    await pool.execute(
        "UPDATE users SET daily_goal = $1, updated_at = now() WHERE telegram_id = $2",
        body.daily_goal, user_id,
    )
    return {"ok": True}
