import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.exception_handlers import http_exception_handler
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

from . import models  # noqa: E402, F401 — registers all models before create_all
from .database import Base, engine  # noqa: E402
from .messages import APP_TITLE, APP_VERSION, ERR_SERVER_ERROR  # noqa: E402
from .routers import admin, assets, masters, photos, search, stats  # noqa: E402

Base.metadata.create_all(bind=engine)

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

_cors_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    return response


@app.exception_handler(HTTPException)
async def log_http_exception(request: Request, exc: HTTPException) -> Response:
    logger.warning("HTTP %s: %s %s", exc.status_code, request.method, request.url.path)
    return await http_exception_handler(request, exc)


@app.exception_handler(Exception)
async def log_unhandled_exception(request: Request, exc: Exception) -> Response:
    logger.exception("%s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": ERR_SERVER_ERROR})


app.include_router(admin.router)
app.include_router(assets.router)
app.include_router(photos.router)
app.include_router(masters.router)
app.include_router(search.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
