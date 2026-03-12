from fastapi import APIRouter, Depends, HTTPException, Query
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


@router.get("/sets/{set_id}/cards-with-progress")
async def get_set_cards_with_progress(
    set_id: str,
    user_id: int = Depends(get_current_user_id),
    search: str | None = Query(None),
    status: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    pool = await get_conn()

    # Build status filter clause
    status_clause = ""
    if status == "new":
        status_clause = "AND uc.id IS NULL"
    elif status == "learning":
        status_clause = "AND uc.state IN (0, 1, 3)"
    elif status == "review":
        status_clause = "AND uc.state = 2 AND uc.stability < 21"
    elif status == "mastered":
        status_clause = "AND uc.state = 2 AND uc.stability >= 21"

    search_clause = ""
    params: list = [user_id, set_id]
    param_idx = 3

    if search:
        search_clause = (
            f"AND (c.front ILIKE '%' || ${param_idx} || '%' "
            f"OR c.back ILIKE '%' || ${param_idx} || '%')"
        )
        params.append(search)
        param_idx += 1

    # Fetch cards with progress
    cards_query = f"""
        SELECT c.*, uc.state as user_state, uc.stability, uc.due, uc.reps, uc.lapses
        FROM cards c
        LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
        WHERE c.set_id = $2
        {search_clause}
        {status_clause}
        ORDER BY c.front
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    cards_rows = await pool.fetch(cards_query, *params)

    # Count total (with same filters) + breakdown + dueCount
    count_params: list = [user_id, set_id]
    count_search = ""
    if search:
        count_search = "AND (c.front ILIKE '%' || $3 || '%' OR c.back ILIKE '%' || $3 || '%')"
        count_params.append(search)

    # Filtered total
    total_query = f"""
        SELECT count(*) as total
        FROM cards c
        LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
        WHERE c.set_id = $2 {count_search} {status_clause}
    """
    total_row = await pool.fetchrow(total_query, *count_params)

    # Breakdown (always unfiltered by status, but respects search)
    breakdown_query = f"""
        SELECT
            count(*) FILTER (WHERE uc.id IS NULL) as new_count,
            count(*) FILTER (WHERE uc.state IN (0, 1, 3)) as learning_count,
            count(*) FILTER (WHERE uc.state = 2 AND uc.stability < 21) as review_count,
            count(*) FILTER (WHERE uc.state = 2 AND uc.stability >= 21) as mastered_count,
            count(*) FILTER (WHERE uc.due <= now()) as due_count
        FROM cards c
        LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
        WHERE c.set_id = $2 {count_search}
    """
    breakdown_row = await pool.fetchrow(breakdown_query, *count_params)

    return {
        "cards": [dict(r) for r in cards_rows],
        "total": total_row["total"],
        "breakdown": {
            "new": breakdown_row["new_count"],
            "learning": breakdown_row["learning_count"],
            "review": breakdown_row["review_count"],
            "mastered": breakdown_row["mastered_count"],
        },
        "dueCount": breakdown_row["due_count"],
    }


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


@router.delete("/sets/{set_id}")
async def delete_set(
    set_id: str,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()
    row = await pool.fetchrow("SELECT owner_id, is_system FROM sets WHERE id = $1", set_id)
    if not row:
        raise HTTPException(status_code=404, detail="Set not found")
    if row["is_system"]:
        raise HTTPException(status_code=403, detail="Cannot delete system set")
    if row["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not set owner")

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Delete review logs first (references user_cards)
            await conn.execute(
                """
                DELETE FROM review_logs
                WHERE user_card_id IN (
                    SELECT uc.id FROM user_cards uc
                    JOIN cards c ON c.id = uc.card_id
                    WHERE c.set_id = $1
                )
                """,
                set_id,
            )
            # Delete user_cards (references cards)
            await conn.execute(
                """
                DELETE FROM user_cards
                WHERE card_id IN (SELECT id FROM cards WHERE set_id = $1)
                """,
                set_id,
            )
            # Delete cards
            await conn.execute("DELETE FROM cards WHERE set_id = $1", set_id)
            # Delete subscriptions
            await conn.execute("DELETE FROM user_sets WHERE set_id = $1", set_id)
            # Delete the set
            await conn.execute("DELETE FROM sets WHERE id = $1", set_id)

    return {"ok": True}
