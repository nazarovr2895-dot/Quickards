import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["user_sets"])


class SubscribeBody(BaseModel):
    set_id: str


@router.get("/user-sets")
async def get_user_sets(user_id: int = Depends(get_current_user_id)):
    pool = await get_conn()
    rows = await pool.fetch(
        """
        SELECT us.*, row_to_json(s.*) as sets,
            (SELECT count(*) FROM user_cards uc
             JOIN cards c ON c.id = uc.card_id
             WHERE uc.user_id = us.user_id AND c.set_id = us.set_id AND uc.reps > 0
            ) AS learned_count
        FROM user_sets us
        JOIN sets s ON s.id = us.set_id
        WHERE us.user_id = $1
        """,
        user_id,
    )
    result = []
    for r in rows:
        d = dict(r)
        d["sets"] = json.loads(d["sets"]) if isinstance(d["sets"], str) else d["sets"]
        result.append(d)
    return result


@router.post("/user-sets")
async def subscribe(
    body: SubscribeBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    await pool.execute(
        "INSERT INTO user_sets (user_id, set_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user_id, body.set_id,
    )
    return {"ok": True}


@router.delete("/user-sets/{set_id}")
async def unsubscribe(
    set_id: str,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    await pool.execute(
        "DELETE FROM user_sets WHERE user_id = $1 AND set_id = $2",
        user_id, set_id,
    )
    return {"ok": True}
