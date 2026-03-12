import json
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..database import get_conn
from ..telegram_auth import get_current_user_id

router = APIRouter(tags=["study"])


class CardState(BaseModel):
    due: str
    stability: float
    difficulty: float
    elapsed_days: int
    scheduled_days: int
    reps: int
    lapses: int
    learning_steps: int
    state: int
    last_review: str | None = None


class ReviewItem(BaseModel):
    user_card_id: str | None = None
    card_id: str
    rating: int
    card_state: CardState
    prev_state: int
    prev_due: str
    prev_stability: float
    prev_difficulty: float
    prev_elapsed_days: int
    prev_scheduled_days: int


class RateBatchBody(BaseModel):
    reviews: list[ReviewItem]


@router.get("/study/due")
async def get_due_cards(
    user_id: int = Depends(get_current_user_id),
    set_id: str | None = Query(None),
    limit: int = Query(50),
):
    pool = await get_conn()

    if set_id:
        rows = await pool.fetch(
            """
            SELECT uc.*, row_to_json(c.*) as card
            FROM user_cards uc
            JOIN cards c ON c.id = uc.card_id
            WHERE uc.user_id = $1 AND uc.due <= now()
            AND c.set_id = $2
            ORDER BY uc.due ASC
            LIMIT $3
            """,
            user_id, set_id, limit,
        )
    else:
        rows = await pool.fetch(
            """
            SELECT uc.*, row_to_json(c.*) as card
            FROM user_cards uc
            JOIN cards c ON c.id = uc.card_id
            WHERE uc.user_id = $1 AND uc.due <= now()
            ORDER BY uc.due ASC
            LIMIT $2
            """,
            user_id, limit,
        )

    result = []
    for r in rows:
        d = dict(r)
        d["card"] = json.loads(d["card"]) if isinstance(d["card"], str) else d["card"]
        result.append(d)
    return result


@router.post("/study/rate")
async def rate_cards(
    body: RateBatchBody,
    user_id: int = Depends(get_current_user_id),
):
    pool = await get_conn()

    async with pool.acquire() as conn:
        async with conn.transaction():
            for r in body.reviews:
                cs = r.card_state
                if r.user_card_id:
                    await conn.execute(
                        """
                        UPDATE user_cards SET
                            due = $1, stability = $2, difficulty = $3,
                            elapsed_days = $4, scheduled_days = $5,
                            reps = $6, lapses = $7, learning_steps = $8,
                            state = $9, last_review = $10
                        WHERE id = $11 AND user_id = $12
                        """,
                        cs.due, cs.stability, cs.difficulty,
                        cs.elapsed_days, cs.scheduled_days,
                        cs.reps, cs.lapses, cs.learning_steps,
                        cs.state, cs.last_review,
                        r.user_card_id, user_id,
                    )
                    uc_id = r.user_card_id
                else:
                    row = await conn.fetchrow(
                        """
                        INSERT INTO user_cards (user_id, card_id, due, stability, difficulty,
                            elapsed_days, scheduled_days, reps, lapses, learning_steps, state, last_review)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        RETURNING id
                        """,
                        user_id, r.card_id,
                        cs.due, cs.stability, cs.difficulty,
                        cs.elapsed_days, cs.scheduled_days,
                        cs.reps, cs.lapses, cs.learning_steps,
                        cs.state, cs.last_review,
                    )
                    uc_id = str(row["id"])

                await conn.execute(
                    """
                    INSERT INTO review_logs (user_card_id, rating, state, due, stability,
                        difficulty, elapsed_days, scheduled_days)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """,
                    uc_id, r.rating, r.prev_state, r.prev_due,
                    r.prev_stability, r.prev_difficulty,
                    r.prev_elapsed_days, r.prev_scheduled_days,
                )

    return {"ok": True}


@router.get("/study/stats")
async def get_stats(user_id: int = Depends(get_current_user_id)):
    pool = await get_conn()

    due_today = await pool.fetchval(
        """
        SELECT count(*) FROM user_cards
        WHERE user_id = $1 AND due <= (now()::date + interval '1 day') AND reps > 0
        """,
        user_id,
    )
    total_reviewed = await pool.fetchval(
        "SELECT count(*) FROM user_cards WHERE user_id = $1 AND reps > 0",
        user_id,
    )

    new_available = await pool.fetchval(
        """
        SELECT count(*) FROM cards c
        JOIN user_sets us ON us.set_id = c.set_id AND us.user_id = $1
        LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
        WHERE uc.id IS NULL
        """,
        user_id,
    )

    # Today's reviewed count (for daily goal progress)
    reviewed_today = await pool.fetchval(
        """
        SELECT count(*) FROM review_logs rl
        JOIN user_cards uc ON uc.id = rl.user_card_id
        WHERE uc.user_id = $1
        AND rl.reviewed_at >= now()::date
        AND rl.reviewed_at < now()::date + interval '1 day'
        """,
        user_id,
    )

    # User preferences
    user_row = await pool.fetchrow(
        "SELECT daily_goal, streak_freezes FROM users WHERE telegram_id = $1",
        user_id,
    )
    daily_goal = user_row["daily_goal"] if user_row else 20
    streak_freezes = user_row["streak_freezes"] if user_row else 1

    # Streak: count consecutive days with reviews, with freeze support
    streak_days = await pool.fetch(
        """
        SELECT DISTINCT (reviewed_at AT TIME ZONE 'UTC')::date AS d
        FROM review_logs rl
        JOIN user_cards uc ON uc.id = rl.user_card_id
        WHERE uc.user_id = $1
        ORDER BY d DESC
        """,
        user_id,
    )
    review_dates = {row["d"] for row in streak_days}
    streak = 0
    freezes_used = 0
    today = date.today()
    check_date = today
    while True:
        if check_date in review_dates:
            streak += 1
            check_date -= timedelta(days=1)
        elif freezes_used < streak_freezes and check_date != today and streak > 0:
            # Use a freeze for a missed day (not today, and only if streak already started)
            freezes_used += 1
            check_date -= timedelta(days=1)
        else:
            break

    return {
        "dueToday": due_today or 0,
        "totalReviewed": total_reviewed or 0,
        "newAvailable": new_available or 0,
        "streak": streak,
        "dailyGoal": daily_goal,
        "reviewedToday": reviewed_today or 0,
        "streakFreezes": streak_freezes - freezes_used,
    }
