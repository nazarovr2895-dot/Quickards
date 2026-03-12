from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["cards"])


class CreateCardBody(BaseModel):
    set_id: str
    front: str
    back: str
    part_of_speech: str | None = None


@router.post("/cards")
async def create_card(
    body: CreateCardBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    await pool.execute(
        """
        INSERT INTO cards (set_id, front, back, part_of_speech)
        VALUES ($1, $2, $3, $4)
        """,
        body.set_id, body.front, body.back, body.part_of_speech,
    )
    # Update card count
    count = await pool.fetchval(
        "SELECT count(*) FROM cards WHERE set_id = $1", body.set_id,
    )
    await pool.execute(
        "UPDATE sets SET card_count = $1 WHERE id = $2", count, body.set_id,
    )
    return {"ok": True}


@router.get("/cards/new")
async def get_new_cards(
    user_id: int = Depends(get_current_user_id),
    set_id: str | None = Query(None),
    set_ids: str | None = Query(None),
    limit: int = Query(10),
):
    pool = await get_conn()

    if set_id:
        # Get new cards from specific set
        rows = await pool.fetch(
            """
            SELECT c.* FROM cards c
            WHERE c.set_id = $1
            AND NOT EXISTS (
                SELECT 1 FROM user_cards uc
                WHERE uc.card_id = c.id AND uc.user_id = $2
            )
            ORDER BY c.created_at
            LIMIT $3
            """,
            set_id, user_id, limit,
        )
    elif set_ids:
        # Get new cards from multiple sets
        ids = set_ids.split(",")
        rows = await pool.fetch(
            """
            SELECT c.* FROM cards c
            WHERE c.set_id = ANY($1::uuid[])
            AND NOT EXISTS (
                SELECT 1 FROM user_cards uc
                WHERE uc.card_id = c.id AND uc.user_id = $2
            )
            ORDER BY c.created_at
            LIMIT $3
            """,
            ids, user_id, limit,
        )
    else:
        rows = []

    return [dict(r) for r in rows]
