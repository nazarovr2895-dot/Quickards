import json
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

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
            ORDER BY uc.stability ASC, uc.due ASC
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
            ORDER BY uc.stability ASC, uc.due ASC
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
@limiter.limit("30/minute")
async def rate_cards(
    request: Request,
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


BATCH_SIZE = 25
MASTERY_THRESHOLD = 0.7


@router.post("/study/check-unlock")
async def check_unlock(user_id: int = Depends(get_current_user_id)):
    """Check system sets and unlock next batch if 70%+ mastered."""
    pool = await get_conn()
    rows = await pool.fetch(
        """
        SELECT us.set_id, us.unlocked_count, s.card_count,
            (SELECT count(*) FROM user_cards uc
             JOIN cards c ON c.id = uc.card_id
             WHERE uc.user_id = us.user_id AND c.set_id = us.set_id
             AND uc.state = 2 AND uc.stability >= 5
            ) AS mastered_in_set,
            (SELECT count(*) FROM user_cards uc
             JOIN cards c ON c.id = uc.card_id
             WHERE uc.user_id = us.user_id AND c.set_id = us.set_id
            ) AS started_in_set
        FROM user_sets us
        JOIN sets s ON s.id = us.set_id
        WHERE us.user_id = $1 AND s.is_system = true
        """,
        user_id,
    )

    unlocked = []
    for r in rows:
        started = r["started_in_set"]
        mastered = r["mastered_in_set"]
        current_unlocked = r["unlocked_count"]
        card_count = r["card_count"]

        if (started >= current_unlocked
            and mastered >= current_unlocked * MASTERY_THRESHOLD
            and current_unlocked < card_count):
            new_unlocked = min(current_unlocked + BATCH_SIZE, card_count)
            await pool.execute(
                "UPDATE user_sets SET unlocked_count = $1 WHERE user_id = $2 AND set_id = $3",
                new_unlocked, user_id, r["set_id"],
            )
            unlocked.append({"set_id": str(r["set_id"]), "new_unlocked": new_unlocked})

    return {"unlocked": unlocked}


@router.get("/study/analytics")
async def get_analytics(
    period: str = Query("week"),
    user_id: int = Depends(get_current_user_id),
):
    """Analytics data for bar charts: day (hourly), week (daily), month (daily)."""
    pool = await get_conn()

    if period == "day":
        bucket_query = """
            SELECT extract(hour FROM rl.reviewed_at)::int AS bucket,
                   count(*) FILTER (WHERE rl.state = 0) AS new_count,
                   count(*) FILTER (WHERE rl.state != 0) AS review_count
            FROM review_logs rl
            JOIN user_cards uc ON uc.id = rl.user_card_id
            WHERE uc.user_id = $1
              AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date
              AND rl.reviewed_at < (now() AT TIME ZONE 'UTC')::date + interval '1 day'
            GROUP BY bucket ORDER BY bucket
        """
        summary_filter = "AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date AND rl.reviewed_at < (now() AT TIME ZONE 'UTC')::date + interval '1 day'"
        days_in_period = 1
    elif period == "month":
        bucket_query = """
            SELECT rl.reviewed_at::date AS bucket,
                   count(*) FILTER (WHERE rl.state = 0) AS new_count,
                   count(*) FILTER (WHERE rl.state != 0) AS review_count
            FROM review_logs rl
            JOIN user_cards uc ON uc.id = rl.user_card_id
            WHERE uc.user_id = $1
              AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date - interval '29 days'
            GROUP BY bucket ORDER BY bucket
        """
        summary_filter = "AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date - interval '29 days'"
        days_in_period = 30
    else:  # week
        bucket_query = """
            SELECT rl.reviewed_at::date AS bucket,
                   count(*) FILTER (WHERE rl.state = 0) AS new_count,
                   count(*) FILTER (WHERE rl.state != 0) AS review_count
            FROM review_logs rl
            JOIN user_cards uc ON uc.id = rl.user_card_id
            WHERE uc.user_id = $1
              AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date - interval '6 days'
            GROUP BY bucket ORDER BY bucket
        """
        summary_filter = "AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date - interval '6 days'"
        days_in_period = 7

    bucket_rows = await pool.fetch(bucket_query, user_id)

    buckets = []
    for r in bucket_rows:
        b = r["bucket"]
        label = str(b) if period == "day" else str(b)
        buckets.append({
            "label": label,
            "new": r["new_count"] or 0,
            "review": r["review_count"] or 0,
        })

    # Summary stats
    summary_row = await pool.fetchrow(
        f"""
        SELECT
            count(*) AS total_reviews,
            count(*) FILTER (WHERE rl.state = 0) AS words_learned,
            CASE WHEN count(*) > 0
                THEN round(count(*) FILTER (WHERE rl.rating >= 2)::numeric / count(*)::numeric, 2)
                ELSE 0 END AS accuracy
        FROM review_logs rl
        JOIN user_cards uc ON uc.id = rl.user_card_id
        WHERE uc.user_id = $1 {summary_filter}
        """,
        user_id,
    )

    total = summary_row["total_reviews"] or 0
    return {
        "period": period,
        "buckets": buckets,
        "summary": {
            "totalReviews": total,
            "wordsLearned": summary_row["words_learned"] or 0,
            "accuracy": float(summary_row["accuracy"] or 0),
            "avgPerDay": round(total / days_in_period, 1) if days_in_period > 0 else 0,
        },
    }


@router.get("/study/calendar")
async def get_calendar(user_id: int = Depends(get_current_user_id)):
    """Review activity for last 90 days (for streak heatmap)."""
    pool = await get_conn()
    rows = await pool.fetch(
        """
        SELECT (rl.reviewed_at AT TIME ZONE 'UTC')::date AS d,
               count(*) AS review_count
        FROM review_logs rl
        JOIN user_cards uc ON uc.id = rl.user_card_id
        WHERE uc.user_id = $1 AND rl.reviewed_at >= now() - interval '90 days'
        GROUP BY d ORDER BY d
        """,
        user_id,
    )
    return {"dates": [{"date": str(r["d"]), "count": r["review_count"]} for r in rows]}


@router.get("/study/progress")
async def get_progress(user_id: int = Depends(get_current_user_id)):
    """Get card distribution across learning states."""
    pool = await get_conn()
    row = await pool.fetchrow(
        """
        SELECT
            count(*) FILTER (WHERE uc.id IS NULL) AS new_count,
            count(*) FILTER (WHERE uc.state IN (0, 1, 3)) AS learning_count,
            count(*) FILTER (WHERE uc.state = 2 AND uc.stability < 21) AS review_count,
            count(*) FILTER (WHERE uc.state = 2 AND uc.stability >= 21) AS mastered_count
        FROM cards c
        JOIN user_sets us ON us.set_id = c.set_id AND us.user_id = $1
        LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
        """,
        user_id,
    )
    return {
        "new": row["new_count"] or 0,
        "learning": row["learning_count"] or 0,
        "review": row["review_count"] or 0,
        "mastered": row["mastered_count"] or 0,
    }


@router.get("/study/stats")
async def get_stats(user_id: int = Depends(get_current_user_id)):
    pool = await get_conn()

    # Combined stats query (4 queries → 1)
    stats_row = await pool.fetchrow(
        """
        WITH user_card_stats AS (
            SELECT
                count(*) FILTER (WHERE due <= (now() AT TIME ZONE 'UTC')::date + interval '1 day' AND reps > 0) AS due_today,
                count(*) FILTER (WHERE reps > 0) AS total_reviewed
            FROM user_cards WHERE user_id = $1
        ),
        new_available AS (
            SELECT count(*) AS cnt FROM cards c
            JOIN user_sets us ON us.set_id = c.set_id AND us.user_id = $1
            LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = $1
            WHERE uc.id IS NULL
        ),
        reviewed_today AS (
            SELECT count(*) AS cnt FROM review_logs rl
            JOIN user_cards uc ON uc.id = rl.user_card_id
            WHERE uc.user_id = $1
            AND rl.reviewed_at >= (now() AT TIME ZONE 'UTC')::date
            AND rl.reviewed_at < (now() AT TIME ZONE 'UTC')::date + interval '1 day'
        )
        SELECT ucs.due_today, ucs.total_reviewed,
               na.cnt AS new_available, rt.cnt AS reviewed_today
        FROM user_card_stats ucs, new_available na, reviewed_today rt
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

    # Streak: count consecutive days with reviews (limited to 90 days)
    streak_days = await pool.fetch(
        """
        SELECT DISTINCT (reviewed_at AT TIME ZONE 'UTC')::date AS d
        FROM review_logs rl
        JOIN user_cards uc ON uc.id = rl.user_card_id
        WHERE uc.user_id = $1
          AND rl.reviewed_at >= now() - interval '90 days'
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
            freezes_used += 1
            check_date -= timedelta(days=1)
        else:
            break

    return {
        "dueToday": stats_row["due_today"] or 0,
        "totalReviewed": stats_row["total_reviewed"] or 0,
        "newAvailable": stats_row["new_available"] or 0,
        "streak": streak,
        "dailyGoal": daily_goal,
        "reviewedToday": stats_row["reviewed_today"] or 0,
        "streakFreezes": streak_freezes - freezes_used,
    }
