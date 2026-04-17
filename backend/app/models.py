from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    asset_category = Column(String(20), nullable=False, default="consumer")
    hardware = Column(String(50), nullable=True, index=True)
    maker = Column(String(255), nullable=True)
    genre = Column(String(100), nullable=True, index=True)
    edition = Column(String(100), nullable=True)
    official_url = Column(String(500), nullable=True)
    release_year = Column(String(10), nullable=True)
    condition = Column(String(20), nullable=True)  # new | like_new | used
    asset_value = Column(Integer, nullable=True)
    tags = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None, index=True)

    photos = relationship(
        "AssetPhoto",
        back_populates="asset",
        order_by="AssetPhoto.sort_order",
        cascade="all, delete-orphan",
    )


class AssetPhoto(Base):
    __tablename__ = "asset_photos"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    thumb_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    asset = relationship("Asset", back_populates="photos")


class Master(Base):
    __tablename__ = "masters"
    __table_args__ = (UniqueConstraint("master_type", "value", name="uq_masters_type_value"),)

    id = Column(Integer, primary_key=True, index=True)
    master_type = Column(String(50), nullable=False, index=True)
    value = Column(String(100), nullable=False)
    label = Column(String(200), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
