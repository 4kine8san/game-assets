import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..messages import ERR_PHOTO_NOT_FOUND, ERR_THUMBNAIL_NOT_FOUND
from ..models import AssetPhoto

router = APIRouter(prefix="/api/photos", tags=["photos"])

_EXT_TO_MIME = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "png": "image/png", "gif": "image/gif",
    "webp": "image/webp", "bmp": "image/bmp",
}


def _no_cache(response: Response) -> Response:
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    return response


@router.get("/{photo_id}/thumb")
def serve_thumb(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(AssetPhoto).filter(AssetPhoto.id == photo_id).first()
    if not photo or not photo.thumb_data:
        raise HTTPException(404, ERR_THUMBNAIL_NOT_FOUND)
    return _no_cache(Response(content=photo.thumb_data, media_type="image/jpeg"))


@router.get("/{photo_id}")
def serve_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(AssetPhoto).filter(AssetPhoto.id == photo_id).first()
    if not photo or not photo.file_data:
        raise HTTPException(404, ERR_PHOTO_NOT_FOUND)
    safe_name = os.path.basename(photo.file_name)
    ext = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else "jpeg"
    media_type = _EXT_TO_MIME.get(ext, "image/jpeg")
    return _no_cache(Response(content=photo.file_data, media_type=media_type))
