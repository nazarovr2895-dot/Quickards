from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["cards"])


async def verify_set_ownership(pool, set_id: str, user_id: int):
    owner = await pool.fetchval("SELECT owner_id FROM sets WHERE id = $1", set_id)
    if owner != user_id:
        raise HTTPException(status_code=403, detail="Not set owner")


class CreateCardBody(BaseModel):
    set_id: str
    front: str
    back: str
    part_of_speech: str | None = None


class BatchCardItem(BaseModel):
    front: str
    back: str
    part_of_speech: str | None = None


class BatchCreateBody(BaseModel):
    set_id: str
    cards: list[BatchCardItem]


class UpdateCardBody(BaseModel):
    front: str | None = None
    back: str | None = None
    part_of_speech: str | None = None


@router.post("/cards")
async def create_card(
    body: CreateCardBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    await verify_set_ownership(pool, body.set_id, user_id)
    row = await pool.fetchrow(
        """
        INSERT INTO cards (set_id, front, back, part_of_speech)
        VALUES ($1, $2, $3, $4)
        RETURNING *
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
    return dict(row)


@router.post("/cards/batch")
async def create_cards_batch(
    body: BatchCreateBody,
    user_id: int = Depends(get_current_user_id),
):
    if len(body.cards) > 200:
        raise HTTPException(status_code=400, detail="Max 200 cards per batch")
    if not body.cards:
        return {"ok": True, "count": 0}

    pool = await get_conn()
    await verify_set_ownership(pool, body.set_id, user_id)

    # Batch insert
    values = [(body.set_id, c.front, c.back, c.part_of_speech) for c in body.cards]
    await pool.executemany(
        """
        INSERT INTO cards (set_id, front, back, part_of_speech)
        VALUES ($1, $2, $3, $4)
        """,
        values,
    )
    # Update card count
    count = await pool.fetchval(
        "SELECT count(*) FROM cards WHERE set_id = $1", body.set_id,
    )
    await pool.execute(
        "UPDATE sets SET card_count = $1 WHERE id = $2", count, body.set_id,
    )
    return {"ok": True, "count": len(body.cards)}


@router.put("/cards/{card_id}")
async def update_card(
    card_id: str,
    body: UpdateCardBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    # Get card's set_id for ownership check
    card = await pool.fetchrow("SELECT * FROM cards WHERE id = $1", card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    await verify_set_ownership(pool, str(card["set_id"]), user_id)

    updates = {}
    if body.front is not None:
        updates["front"] = body.front
    if body.back is not None:
        updates["back"] = body.back
    if body.part_of_speech is not None:
        updates["part_of_speech"] = body.part_of_speech

    if not updates:
        return {"ok": True}

    set_clauses = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    await pool.execute(
        f"UPDATE cards SET {set_clauses} WHERE id = $1",
        card_id, *updates.values(),
    )
    return {"ok": True}


@router.delete("/cards/{card_id}")
async def delete_card(
    card_id: str,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    card = await pool.fetchrow("SELECT * FROM cards WHERE id = $1", card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    await verify_set_ownership(pool, str(card["set_id"]), user_id)

    await pool.execute("DELETE FROM cards WHERE id = $1", card_id)
    # Update card count
    count = await pool.fetchval(
        "SELECT count(*) FROM cards WHERE set_id = $1", card["set_id"],
    )
    await pool.execute(
        "UPDATE sets SET card_count = $1 WHERE id = $2", count, card["set_id"],
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
