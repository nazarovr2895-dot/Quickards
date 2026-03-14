import asyncio

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["cards"])

DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en"
LINGVA_INSTANCES = [
    "https://lingva.ml",
    "https://lingva.lunar.icu",
    "https://translate.plausibility.cloud",
]


async def verify_set_ownership(pool, set_id: str, user_id: int):
    owner = await pool.fetchval("SELECT owner_id FROM sets WHERE id = $1", set_id)
    if owner != user_id:
        raise HTTPException(status_code=403, detail="Not set owner")


class CreateCardBody(BaseModel):
    set_id: str
    front: str = Field(max_length=500)
    back: str = Field(max_length=1000)
    part_of_speech: str | None = Field(None, max_length=50)
    phonetics: str | None = Field(None, max_length=100)


class BatchCardItem(BaseModel):
    front: str = Field(max_length=500)
    back: str = Field(max_length=1000)
    part_of_speech: str | None = Field(None, max_length=50)


class BatchCreateBody(BaseModel):
    set_id: str
    cards: list[BatchCardItem]


class UpdateCardBody(BaseModel):
    front: str | None = Field(None, max_length=500)
    back: str | None = Field(None, max_length=1000)
    part_of_speech: str | None = Field(None, max_length=50)


@router.get("/dictionary/lookup")
@limiter.limit("20/minute")
async def dictionary_lookup(request: Request, word: str = Query(..., min_length=1)):
    word = word.strip().lower()

    async def fetch_dictionary():
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{DICT_API}/{word}")
                if resp.status_code != 200:
                    return None
                data = resp.json()
                if not data or not isinstance(data, list):
                    return None
                entry = data[0]
                phonetics = ""
                for p in entry.get("phonetics", []):
                    if p.get("text"):
                        phonetics = p["text"]
                        break
                pos = ""
                example = ""
                for m in entry.get("meanings", []):
                    if not pos and m.get("partOfSpeech"):
                        pos = m["partOfSpeech"]
                    for d in m.get("definitions", []):
                        if not example and d.get("example"):
                            example = d["example"]
                            break
                    if pos and example:
                        break
                return {"phonetics": phonetics, "part_of_speech": pos, "example": example}
        except Exception:
            return None

    async def fetch_translation():
        for instance in LINGVA_INSTANCES:
            try:
                url = f"{instance}/api/v1/en/ru/{word}"
                async with httpx.AsyncClient(timeout=5) as client:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    translation = data.get("translation", "")
                    if translation and translation.lower() != word and len(translation) < 100:
                        return translation.lower()
            except Exception:
                continue
        return ""

    dict_result, translation = await asyncio.gather(
        fetch_dictionary(), fetch_translation()
    )

    if dict_result is None:
        return {"valid": False}

    return {
        "valid": True,
        "phonetics": dict_result.get("phonetics", ""),
        "part_of_speech": dict_result.get("part_of_speech", ""),
        "example": dict_result.get("example", ""),
        "translation": translation,
    }


@router.post("/cards")
async def create_card(
    body: CreateCardBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    await verify_set_ownership(pool, body.set_id, user_id)
    row = await pool.fetchrow(
        """
        INSERT INTO cards (set_id, front, back, part_of_speech, phonetics)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        body.set_id, body.front, body.back, body.part_of_speech, body.phonetics,
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
@limiter.limit("10/minute")
async def create_cards_batch(
    request: Request,
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
        # Get new cards from specific set (deterministic shuffle per user)
        rows = await pool.fetch(
            """
            SELECT c.* FROM cards c
            WHERE c.set_id = $1
            AND NOT EXISTS (
                SELECT 1 FROM user_cards uc
                WHERE uc.card_id = c.id AND uc.user_id = $2
            )
            ORDER BY md5(c.id::text || $2::text)
            LIMIT $3
            """,
            set_id, user_id, limit,
        )
    elif set_ids:
        # Get new cards from multiple sets (deterministic shuffle per user)
        ids = set_ids.split(",")
        rows = await pool.fetch(
            """
            SELECT c.* FROM cards c
            WHERE c.set_id = ANY($1::uuid[])
            AND NOT EXISTS (
                SELECT 1 FROM user_cards uc
                WHERE uc.card_id = c.id AND uc.user_id = $2
            )
            ORDER BY md5(c.id::text || $2::text)
            LIMIT $3
            """,
            ids, user_id, limit,
        )
    else:
        rows = []

    return [dict(r) for r in rows]
