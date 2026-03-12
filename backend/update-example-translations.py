"""
Update existing cards in the database with example_translation data from JSON files.

Usage: python -m update-example-translations (run from backend/ directory)
Requires DB env vars and data files in ../scripts/data/
"""
import asyncio
import json
import os
from pathlib import Path

import asyncpg

DATA_DIR = Path(__file__).parent.parent / "scripts" / "data"

SETS = [
    {"file": "oxford-3000-a1.json", "name": "Oxford 3000 — A1"},
    {"file": "oxford-3000-a2.json", "name": "Oxford 3000 — A2"},
    {"file": "oxford-3000-b1.json", "name": "Oxford 3000 — B1"},
    {"file": "oxford-3000-b2.json", "name": "Oxford 3000 — B2"},
    {"file": "oxford-5000-b2.json", "name": "Oxford 5000 — B2"},
    {"file": "oxford-5000-c1.json", "name": "Oxford 5000 — C1"},
]


async def main():
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "quickards"),
        password=os.getenv("DB_PASSWORD", "quickards"),
        database=os.getenv("DB_NAME", "quickards"),
    )

    print("Updating example translations...\n")

    total_updated = 0

    for s in SETS:
        filepath = DATA_DIR / s["file"]
        if not filepath.exists():
            print(f"  Skipping {s['file']} (not found)")
            continue

        words = json.loads(filepath.read_text())

        # Find the set ID by name
        set_id = await conn.fetchval(
            "SELECT id FROM sets WHERE name = $1 AND is_system = true",
            s["name"],
        )
        if not set_id:
            print(f"  Set '{s['name']}' not found in DB, skipping")
            continue

        updated = 0
        for w in words:
            example_tr = w.get("example_translation")
            if not example_tr:
                continue

            # Match by set_id + front word + part_of_speech
            result = await conn.execute(
                """
                UPDATE cards
                SET example_translation = $1
                WHERE set_id = $2 AND front = $3
                AND (part_of_speech = $4 OR (part_of_speech IS NULL AND $4 IS NULL))
                AND example_translation IS NULL
                """,
                example_tr, set_id, w["word"], w.get("part_of_speech"),
            )
            count = int(result.split()[-1])
            updated += count

        print(f"  {s['name']}: updated {updated} cards")
        total_updated += updated

    await conn.close()
    print(f"\nDone! Total updated: {total_updated}")


if __name__ == "__main__":
    asyncio.run(main())
