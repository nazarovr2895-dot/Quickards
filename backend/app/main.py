import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from . import config
from .database import init_pool, close_pool, get_conn
from .routes import users, sets, cards, study, user_sets

# Structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.BoundLogger,
)
logger = structlog.get_logger()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    logger.info("app_started")
    yield
    await close_pool()
    logger.info("app_stopped")


app = FastAPI(title="Quickards API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    if request.url.path != "/api/health":
        logger.info("request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration,
        )
    return response


app.include_router(users.router, prefix="/api")
app.include_router(sets.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(study.router, prefix="/api")
app.include_router(user_sets.router, prefix="/api")


@app.get("/api/health")
async def health():
    pool = await get_conn()
    try:
        await pool.fetchval("SELECT 1")
        return {"status": "ok", "db": "connected"}
    except Exception:
        return JSONResponse(
            {"status": "degraded", "db": "disconnected"},
            status_code=503,
        )
