from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
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
        raise HTTPException(404, "Thumbnail not found")
    return _no_cache(Response(content=photo.thumb_data, media_type="image/jpeg"))


@router.get("/{photo_id}")
def serve_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(AssetPhoto).filter(AssetPhoto.id == photo_id).first()
    if not photo or not photo.file_data:
        raise HTTPException(404, "Photo not found")
    ext = photo.file_name.rsplit(".", 1)[-1].lower() if "." in photo.file_name else "jpeg"
    media_type = _EXT_TO_MIME.get(ext, "image/jpeg")
    return _no_cache(Response(content=photo.file_data, media_type=media_type))
