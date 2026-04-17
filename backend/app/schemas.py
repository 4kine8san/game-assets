from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_name: str
    url: str
    thumb_url: str | None = None
    sort_order: int


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    asset_category: str
    hardware: str | None = None
    maker: str | None = None
    genre: str | None = None
    edition: str | None = None
    official_url: str | None = None
    release_year: str | None = None
    condition: str | None = None
    asset_value: int | None = None
    tags: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    photos: list[PhotoResponse] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PhotoRotateRequest(BaseModel):
    degrees: int  # 90, 180, 270


class AssetUpdate(BaseModel):
    name: str | None = None
    asset_category: str | None = None
    hardware: str | None = None
    maker: str | None = None
    genre: str | None = None
    edition: str | None = None
    official_url: str | None = None
    release_year: str | None = None
    condition: str | None = None
    asset_value: int | None = None
    tags: str | None = None
    description: str | None = None


class PhotoReorderRequest(BaseModel):
    photo_ids: list[int]


class MasterItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    value: str
    label: str


class AssetListResponse(BaseModel):
    items: list[AssetResponse]
    total: int
    page: int
    limit: int
    total_pages: int
