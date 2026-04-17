import csv
import io
import json
import math
import os
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

THUMB_SIZE = (320, 320)
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def make_thumbnail(src: bytes) -> bytes | None:
    try:
        buf = io.BytesIO()
        with Image.open(io.BytesIO(src)) as img:
            img.thumbnail(THUMB_SIZE)
            img.convert("RGB").save(buf, "JPEG", quality=88)
        return buf.getvalue()
    except Exception:
        return None


def build_photo(photo: AssetPhoto) -> PhotoResponse:
    return PhotoResponse(
        id=photo.id,
        file_name=photo.file_name,
        url=f"/api/photos/{photo.id}",
        thumb_url=f"/api/photos/{photo.id}/thumb" if photo.thumb_data else None,
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
        condition=asset.condition,
        asset_value=asset.asset_value,
        tags=asset.tags,
        description=asset.description,
        thumbnail_url=thumbnail_url,
        photos=photos,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


def _apply_filters(q, search, asset_category, hardware, genre):
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
    return q


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
    q = _apply_filters(q, search, asset_category, hardware, genre)

    sort_map = {
        "name": Asset.name,
        "created_at": Asset.created_at,
        "asset_value": Asset.asset_value,
    }
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
    "id",
    "name",
    "asset_category",
    "hardware",
    "maker",
    "genre",
    "edition",
    "official_url",
    "release_year",
    "condition",
    "asset_value",
    "tags",
    "description",
    "created_at",
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
    q = _apply_filters(q, search, asset_category, hardware, genre)
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
    condition: str | None = Form(None),
    asset_value: int | None = Form(None),
    tags: str | None = Form(None),
    description: str | None = Form(None),
    photos: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    for photo_file in photos:
        if not photo_file.filename:
            continue
        ext = os.path.splitext(photo_file.filename)[1].lower()
        if ext not in IMAGE_EXTS:
            raise HTTPException(422, f"サポートされていないファイル形式です: {ext}")

    asset = Asset(
        name=name,
        asset_category=asset_category,
        hardware=hardware or None,
        maker=maker or None,
        genre=genre or None,
        edition=edition or None,
        official_url=official_url or None,
        release_year=release_year or None,
        condition=condition or None,
        asset_value=asset_value,
        tags=tags or None,
        description=description or None,
    )
    db.add(asset)
    db.flush()

    try:
        for idx, photo_file in enumerate(photos):
            if not photo_file.filename:
                continue
            file_bytes = await photo_file.read()
            db.add(
                AssetPhoto(
                    asset_id=asset.id,
                    file_name=photo_file.filename,
                    file_data=file_bytes,
                    thumb_data=make_thumbnail(file_bytes),
                    sort_order=idx,
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        raise

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
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.deleted_at.is_(None)).first()
    if not asset:
        raise HTTPException(404, "Asset not found")

    for photo_file in photos:
        if not photo_file.filename:
            continue
        ext = os.path.splitext(photo_file.filename)[1].lower()
        if ext not in IMAGE_EXTS:
            raise HTTPException(422, f"サポートされていないファイル形式です: {ext}")

    current_max = max((p.sort_order for p in asset.photos), default=-1)
    try:
        for idx, photo_file in enumerate(photos):
            if not photo_file.filename:
                continue
            file_bytes = await photo_file.read()
            db.add(
                AssetPhoto(
                    asset_id=asset.id,
                    file_name=photo_file.filename,
                    file_data=file_bytes,
                    thumb_data=make_thumbnail(file_bytes),
                    sort_order=current_max + 1 + idx,
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        raise

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
        img = Image.open(io.BytesIO(photo.file_data))
        img.load()
        fmt = img.format or "JPEG"
        rotated = img.rotate(-degrees, expand=True)  # Pillow: negative = CW
        converted = rotated.convert("RGB" if fmt in ("JPEG", "JPG") else img.mode)

        buf = io.BytesIO()
        save_kwargs = {"quality": 92} if fmt in ("JPEG", "JPG") else {}
        converted.save(buf, "JPEG" if fmt in ("JPEG", "JPG") else fmt, **save_kwargs)
        photo.file_data = buf.getvalue()
        photo.thumb_data = make_thumbnail(photo.file_data)
    except Exception as e:
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
    db.delete(photo)
    db.commit()
