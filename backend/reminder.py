"""
Daily reminder bot — sends Telegram messages to users with due cards.
Run as a cron job: 0 9 * * * cd /path/to/quickards && python -m backend.reminder
"""

import asyncio
import os
import httpx
import asyncpg


async def main():
    bot_token = os.environ.get("BOT_TOKEN")
    if not bot_token:
        print("BOT_TOKEN not set")
        return

    pool = await asyncpg.create_pool(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "5432")),
        user=os.environ.get("DB_USER", "quickards"),
        password=os.environ.get("DB_PASSWORD", ""),
        database=os.environ.get("DB_NAME", "quickards"),
    )

    # Find users with due cards
    rows = await pool.fetch(
        """
        SELECT u.telegram_id, u.first_name,
            (SELECT count(*) FROM user_cards uc
             WHERE uc.user_id = u.telegram_id
             AND uc.due <= (now()::date + interval '1 day')
             AND uc.reps > 0) AS due_count,
            (SELECT count(DISTINCT (rl.reviewed_at AT TIME ZONE 'UTC')::date)
             FROM review_logs rl
             JOIN user_cards uc2 ON uc2.id = rl.user_card_id
             WHERE uc2.user_id = u.telegram_id
             AND rl.reviewed_at >= now()::date - interval '30 days'
            ) AS recent_days
        FROM users u
        JOIN user_sets us ON us.user_id = u.telegram_id
        GROUP BY u.telegram_id, u.first_name
        HAVING count(us.set_id) > 0
        """
    )

    api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    sent = 0

    async with httpx.AsyncClient() as client:
        for row in rows:
            due = row["due_count"]
            if due == 0:
                continue

            name = row["first_name"]
            text = f"Hey {name}! You have {due} card{'s' if due != 1 else ''} to review today. Keep your streak going! 🔥"

            try:
                # Open the mini app directly
                webapp_url = os.environ.get("WEBAPP_URL", "https://quickards.flurai.ru")
                resp = await client.post(api_url, json={
                    "chat_id": row["telegram_id"],
                    "text": text,
                    "reply_markup": {
                        "inline_keyboard": [[{
                            "text": "📖 Study Now",
                            "web_app": {"url": webapp_url},
                        }]]
                    },
                })
                if resp.status_code == 200:
                    sent += 1
                else:
                    print(f"Failed to send to {row['telegram_id']}: {resp.text}")
            except Exception as e:
                print(f"Error sending to {row['telegram_id']}: {e}")

    await pool.close()
    print(f"Sent {sent} reminders")


if __name__ == "__main__":
    asyncio.run(main())
