from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .database import init_pool, close_pool
from .routes import users, sets, cards, study, user_sets


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="Quickards API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")
app.include_router(sets.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(study.router, prefix="/api")
app.include_router(user_sets.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
