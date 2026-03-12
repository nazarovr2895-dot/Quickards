import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "quickards")
DB_PASSWORD = os.getenv("DB_PASSWORD", "quickards")
DB_NAME = os.getenv("DB_NAME", "quickards")
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
