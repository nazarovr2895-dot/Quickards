"""
Seed the database with Oxford word sets.

Usage: python -m seed (run from backend/ directory)
Requires DB env vars and data files in ../scripts/data/
"""
import asyncio
import json
import os
from pathlib import Path

import asyncpg

DATA_DIR = Path(__file__).parent.parent / "scripts" / "data"

SETS = [
    {"file": "oxford-3000-a1.json", "name": "Oxford 3000 — A1", "desc": "Beginner vocabulary (A1)", "level": "A1", "source": "oxford3000"},
    {"file": "oxford-3000-a2.json", "name": "Oxford 3000 — A2", "desc": "Elementary vocabulary (A2)", "level": "A2", "source": "oxford3000"},
    {"file": "oxford-3000-b1.json", "name": "Oxford 3000 — B1", "desc": "Intermediate vocabulary (B1)", "level": "B1", "source": "oxford3000"},
    {"file": "oxford-3000-b2.json", "name": "Oxford 3000 — B2", "desc": "Upper-intermediate vocabulary (B2)", "level": "B2", "source": "oxford3000"},
    {"file": "oxford-5000-b2.json", "name": "Oxford 5000 — B2", "desc": "Advanced vocabulary (B2)", "level": "B2", "source": "oxford5000"},
    {"file": "oxford-5000-c1.json", "name": "Oxford 5000 — C1", "desc": "Proficiency vocabulary (C1)", "level": "C1", "source": "oxford5000"},
]


async def main():
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "quickards"),
        password=os.getenv("DB_PASSWORD", "quickards"),
        database=os.getenv("DB_NAME", "quickards"),
    )

    print("Seeding Oxford word sets...\n")

    for s in SETS:
        filepath = DATA_DIR / s["file"]
        if not filepath.exists():
            print(f"  Skipping {s['file']} (not found)")
            continue

        words = json.loads(filepath.read_text())

        # Create set
        set_id = await conn.fetchval(
            """
            INSERT INTO sets (name, description, cefr_level, source, card_count, is_system, owner_id)
            VALUES ($1, $2, $3, $4, $5, true, NULL)
            RETURNING id
            """,
            s["name"], s["desc"], s["level"], s["source"], len(words),
        )
        print(f"Created set: {s['name']} ({len(words)} words)")

        # Insert cards in batches
        batch_size = 200
        for i in range(0, len(words), batch_size):
            batch = words[i:i + batch_size]
            await conn.executemany(
                """
                INSERT INTO cards (set_id, front, back, part_of_speech, phonetics, example)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                [
                    (set_id, w["word"], w.get("translation", w["word"]),
                     w.get("part_of_speech"), w.get("phonetics"), w.get("example"))
                    for w in batch
                ],
            )

        print(f"  Inserted {len(words)} cards\n")

    await conn.close()
    print("Seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())
