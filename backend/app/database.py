import asyncpg
from . import config

pool: asyncpg.Pool | None = None


async def init_pool():
    global pool
    pool = await asyncpg.create_pool(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        min_size=2,
        max_size=10,
    )


async def close_pool():
    global pool
    if pool:
        await pool.close()
        pool = None


async def get_conn():
    return pool
