from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["sets"])


class CreateSetBody(BaseModel):
    name: str
    description: str | None = None


@router.get("/sets/system")
async def system_sets():
    pool = await get_conn()
    rows = await pool.fetch(
        "SELECT * FROM sets WHERE is_system = true ORDER BY cefr_level"
    )
    return [dict(r) for r in rows]


@router.get("/sets/user")
async def user_sets(user_id: int = Depends(get_current_user_id)):
    pool = await get_conn()
    rows = await pool.fetch(
        "SELECT * FROM sets WHERE owner_id = $1 ORDER BY created_at DESC",
        user_id,
    )
    return [dict(r) for r in rows]


@router.get("/sets/{set_id}")
async def get_set(set_id: str):
    pool = await get_conn()
    row = await pool.fetchrow("SELECT * FROM sets WHERE id = $1", set_id)
    if not row:
        return None
    return dict(row)


@router.get("/sets/{set_id}/cards")
async def get_set_cards(set_id: str, limit: int = 100):
    pool = await get_conn()
    rows = await pool.fetch(
        "SELECT * FROM cards WHERE set_id = $1 ORDER BY front LIMIT $2",
        set_id, limit,
    )
    return [dict(r) for r in rows]


@router.post("/sets")
async def create_set(
    body: CreateSetBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    row = await pool.fetchrow(
        """
        INSERT INTO sets (owner_id, name, description, source, is_system)
        VALUES ($1, $2, $3, 'user', false)
        RETURNING id
        """,
        user_id, body.name, body.description,
    )
    set_id = str(row["id"])
    # Auto-subscribe
    await pool.execute(
        "INSERT INTO user_sets (user_id, set_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user_id, row["id"],
    )
    return {"id": set_id}
