import os

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/photos", tags=["photos"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


@router.get("/{filename}")
def serve_photo(filename: str, v: int | None = Query(None)):
    """v is a cache-bust version param (file mtime); it is ignored server-side."""
    for sub in ("photos", "thumbnails"):
        path = os.path.join(UPLOAD_DIR, sub, filename)
        if os.path.exists(path):
            response = FileResponse(path)
            # Prevent browser from caching rotated/updated images
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            return response
    from fastapi import HTTPException

    raise HTTPException(404, "Photo not found")
