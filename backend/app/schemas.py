from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    degrees: int = Field(..., ge=0, le=359)


class AssetUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    asset_category: str | None = Field(None, max_length=50)
    hardware: str | None = Field(None, max_length=100)
    maker: str | None = Field(None, max_length=255)
    genre: str | None = Field(None, max_length=100)
    edition: str | None = Field(None, max_length=100)
    official_url: str | None = Field(None, max_length=2048)
    release_year: str | None = Field(None, max_length=10)
    condition: str | None = Field(None, max_length=50)
    asset_value: int | None = Field(None, ge=0, le=2_000_000_000)
    tags: str | None = Field(None, max_length=1000)
    description: str | None = Field(None, max_length=5000)


class PhotoReorderRequest(BaseModel):
    photo_ids: list[int] = Field(..., max_length=200)


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
