import csv
import io
import json
import math
import os
import shutil
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from PIL import Image
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset, AssetPhoto
from ..schemas import (
    AssetListResponse,
    AssetResponse,
    AssetUpdate,
    PhotoReorderRequest,
    PhotoResponse,
    PhotoRotateRequest,
)

router = APIRouter(prefix="/api/assets", tags=["assets"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
PHOTO_DIR = os.path.join(UPLOAD_DIR, "photos")
THUMB_DIR = os.path.join(UPLOAD_DIR, "thumbnails")
THUMB_SIZE = (320, 320)
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def ensure_dirs():
    os.makedirs(PHOTO_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)


def make_thumbnail(src: str, dest: str | None = None) -> str | None:
    ext = os.path.splitext(src)[1].lower()
    if ext not in IMAGE_EXTS:
        return None
    try:
        out_path = dest or os.path.join(THUMB_DIR, f"thumb_{uuid.uuid4().hex}.jpg")
        with Image.open(src) as img:
            img.thumbnail(THUMB_SIZE)
            img.convert("RGB").save(out_path, "JPEG", quality=88)
        return out_path
    except Exception:
        return None


def photo_url(file_path: str) -> str:
    """Return API URL with mtime version to bust browser cache after rotation."""
    fname = os.path.basename(file_path)
    try:
        mtime = int(os.path.getmtime(file_path))
    except OSError:
        mtime = 0
    return f"/api/photos/{fname}?v={mtime}"


def build_photo(photo: AssetPhoto) -> PhotoResponse:
    return PhotoResponse(
        id=photo.id,
        file_name=photo.file_name,
        url=photo_url(photo.file_path),
        thumb_url=photo_url(photo.thumb_path) if photo.thumb_path else None,
        sort_order=photo.sort_order,
    )


def build_asset(asset: Asset) -> AssetResponse:
    photos = [build_photo(p) for p in asset.photos]
    thumbnail_url = (photos[0].thumb_url or photos[0].url) if photos else None
    return AssetResponse(
        id=asset.id,
        name=asset.name,
        asset_category=asset.asset_category,
        hardware=asset.hardware,
        maker=asset.maker,
        genre=asset.genre,
        edition=asset.edition,
        official_url=asset.official_url,
        release_year=asset.release_year,
        asset_value=asset.asset_value,
        tags=asset.tags,
        description=asset.description,
        thumbnail_url=thumbnail_url,
        photos=photos,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


# ── list ────────────────────────────────────────────────
@router.get("", response_model=AssetListResponse)
def list_assets(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    asset_category: str | None = Query(None),
    hardware: str | None = Query(None),
    genre: str | None = Query(None),
    sort_by: str | None = Query("name"),
    sort_dir: str | None = Query("asc"),
    db: Session = Depends(get_db),
):
    q = db.query(Asset).filter(Asset.deleted_at.is_(None))
    if search:
        q = q.filter(
            or_(
                Asset.name.ilike(f"%{search}%"),
                Asset.maker.ilike(f"%{search}%"),
                Asset.tags.ilike(f"%{search}%"),
                Asset.description.ilike(f"%{search}%"),
            )
        )
    if asset_category:
        q = q.filter(Asset.asset_category == asset_category)
    if hardware:
        q = q.filter(Asset.hardware == hardware)
    if genre:
        q = q.filter(Asset.genre == genre)

    sort_map = {"name": Asset.name, "created_at": Asset.created_at}
    sort_col = sort_map.get(sort_by or "name", Asset.name)
    order = sort_col.asc() if sort_dir != "desc" else sort_col.desc()

    total = q.count()
    total_pages = max(1, math.ceil(total / limit))
    items = q.order_by(order).offset((page - 1) * limit).limit(limit).all()
    return AssetListResponse(
        items=[build_asset(a) for a in items],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


# ── download (CSV / JSON) ────────────────────────────────
DOWNLOAD_FIELDS = [
    "id", "name", "asset_category", "hardware", "maker", "genre", "edition",
    "official_url", "release_year", "asset_value", "tags", "description", "created_at",
]


@router.get("/download")
def download_assets(
    format: str = Query("csv"),
    search: str | None = Query(None),
    asset_category: str | None = Query(None),
    hardware: str | None = Query(None),
    genre: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Asset).filter(Asset.deleted_at.is_(None))
    if search:
        q = q.filter(
            or_(
                Asset.name.ilike(f"%{search}%"),
                Asset.maker.ilike(f"%{search}%"),
                Asset.tags.ilike(f"%{search}%"),
                Asset.description.ilike(f"%{search}%"),
            )
        )
    if asset_category:
        q = q.filter(Asset.asset_category == asset_category)
    if hardware:
        q = q.filter(Asset.hardware == hardware)
    if genre:
        q = q.filter(Asset.genre == genre)
    if format not in ("csv", "json"):
        raise HTTPException(400, "format は 'csv' または 'json' を指定してください")

    assets = q.order_by(Asset.name.asc()).all()

    if format == "json":
        rows = [{f: getattr(a, f, None) for f in DOWNLOAD_FIELDS} for a in assets]
        content = json.dumps(rows, ensure_ascii=False, default=str)
        return Response(
            content=content.encode("utf-8"),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=assets.json"},
        )

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=DOWNLOAD_FIELDS)
    writer.writeheader()
    for a in assets:
        writer.writerow({f: (getattr(a, f, "") or "") for f in DOWNLOAD_FIELDS})
    return Response(
        content=buf.getvalue().encode("utf-8-sig"),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=assets.csv"},
    )


# ── single ───────────────────────────────────────────────
@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    return build_asset(asset)


# ── create ───────────────────────────────────────────────
@router.post("", response_model=AssetResponse, status_code=201)
async def create_asset(
    name: str = Form(...),
    asset_category: str = Form("consumer"),
    hardware: str | None = Form(None),
    maker: str | None = Form(None),
    genre: str | None = Form(None),
    edition: str | None = Form(None),
    official_url: str | None = Form(None),
    release_year: str | None = Form(None),
    asset_value: int | None = Form(None),
    tags: str | None = Form(None),
    description: str | None = Form(None),
    photos: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    ensure_dirs()
    asset = Asset(
        name=name,
        asset_category=asset_category,
        hardware=hardware or None,
        maker=maker or None,
        genre=genre or None,
        edition=edition or None,
        official_url=official_url or None,
        release_year=release_year or None,
        asset_value=asset_value,
        tags=tags or None,
        description=description or None,
    )
    db.add(asset)
    db.flush()

    for idx, photo_file in enumerate(photos):
        if not photo_file.filename:
            continue
        ext = os.path.splitext(photo_file.filename)[1] or ".jpg"
        unique = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(PHOTO_DIR, unique)
        with open(path, "wb") as f:
            shutil.copyfileobj(photo_file.file, f)
        thumb = make_thumbnail(path)
        db.add(
            AssetPhoto(
                asset_id=asset.id,
                file_path=path,
                file_name=photo_file.filename,
                thumb_path=thumb,
                sort_order=idx,
            )
        )

    db.commit()
    db.refresh(asset)
    return build_asset(asset)


# ── update ───────────────────────────────────────────────
@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: int, data: AssetUpdate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(asset, k, v)
    db.commit()
    db.refresh(asset)
    return build_asset(asset)


# ── delete asset (soft delete) ───────────────────────────
@router.delete("/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    asset.deleted_at = datetime.now(UTC)
    db.commit()


# ── add photos ───────────────────────────────────────────
@router.post("/{asset_id}/photos", response_model=AssetResponse)
async def add_photos(
    asset_id: int,
    photos: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    ensure_dirs()
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    current_max = max((p.sort_order for p in asset.photos), default=-1)
    for idx, photo_file in enumerate(photos):
        if not photo_file.filename:
            continue
        ext = os.path.splitext(photo_file.filename)[1] or ".jpg"
        unique = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(PHOTO_DIR, unique)
        with open(path, "wb") as f:
            shutil.copyfileobj(photo_file.file, f)
        thumb = make_thumbnail(path)
        db.add(
            AssetPhoto(
                asset_id=asset.id,
                file_path=path,
                file_name=photo_file.filename,
                thumb_path=thumb,
                sort_order=current_max + 1 + idx,
            )
        )
    db.commit()
    db.refresh(asset)
    return build_asset(asset)


# ── rotate photo ─────────────────────────────────────────
@router.post("/{asset_id}/photos/{photo_id}/rotate", response_model=PhotoResponse)
def rotate_photo(
    asset_id: int,
    photo_id: int,
    body: PhotoRotateRequest,
    db: Session = Depends(get_db),
):
    photo = (
        db.query(AssetPhoto)
        .filter(AssetPhoto.id == photo_id, AssetPhoto.asset_id == asset_id)
        .first()
    )
    if not photo:
        raise HTTPException(404, "Photo not found")

    degrees = body.degrees % 360
    if degrees == 0:
        return build_photo(photo)

    try:
        # Read image fully into memory before closing (avoids Windows file lock on overwrite)
        img = Image.open(photo.file_path)
        img.load()
        fmt = img.format or "JPEG"
        rotated = img.rotate(-degrees, expand=True)  # Pillow: negative = CW
        converted = rotated.convert("RGB" if fmt in ("JPEG", "JPG") else img.mode)
        img.close()

        # Write to a temp file, then atomically replace the original
        tmp_path = photo.file_path + ".tmp"
        save_kwargs = {"quality": 92} if fmt in ("JPEG", "JPG") else {}
        converted.save(tmp_path, "JPEG" if fmt in ("JPEG", "JPG") else fmt, **save_kwargs)
        os.replace(tmp_path, photo.file_path)

        # Regenerate thumbnail in-place
        if photo.thumb_path:
            make_thumbnail(photo.file_path, dest=photo.thumb_path)
        else:
            photo.thumb_path = make_thumbnail(photo.file_path)
    except Exception as e:
        if os.path.exists(photo.file_path + ".tmp"):
            os.remove(photo.file_path + ".tmp")
        raise HTTPException(500, f"Rotation failed: {e}") from e

    db.commit()
    return build_photo(photo)


# ── reorder photos ───────────────────────────────────────
@router.put("/{asset_id}/photos/reorder", response_model=AssetResponse)
def reorder_photos(asset_id: int, body: PhotoReorderRequest, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    photo_map = {p.id: p for p in asset.photos}
    for order, pid in enumerate(body.photo_ids):
        if pid in photo_map:
            photo_map[pid].sort_order = order
    db.commit()
    db.refresh(asset)
    return build_asset(asset)


# ── delete photo ─────────────────────────────────────────
@router.delete("/{asset_id}/photos/{photo_id}", status_code=204)
def delete_photo(asset_id: int, photo_id: int, db: Session = Depends(get_db)):
    photo = (
        db.query(AssetPhoto)
        .filter(AssetPhoto.id == photo_id, AssetPhoto.asset_id == asset_id)
        .first()
    )
    if not photo:
        raise HTTPException(404, "Photo not found")
    for fp in [photo.file_path, photo.thumb_path]:
        if fp and os.path.exists(fp):
            os.remove(fp)
    db.delete(photo)
    db.commit()
