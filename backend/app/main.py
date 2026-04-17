from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from . import models  # noqa: E402, F401 — registers all models before create_all
from .database import Base, engine  # noqa: E402
from .routers import assets, masters, photos, search, stats  # noqa: E402

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ゲーム資産管理", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(photos.router)
app.include_router(masters.router)
app.include_router(search.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
