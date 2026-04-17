from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Master
from ..schemas import MasterItem

VALID_TYPES = {"category", "hardware", "genre", "edition"}

router = APIRouter(prefix="/api/masters", tags=["masters"])


@router.get("/{master_type}", response_model=list[MasterItem])
def get_masters(master_type: str, db: Session = Depends(get_db)):
    if master_type not in VALID_TYPES:
        raise HTTPException(404, f"Unknown master type: {master_type}")
    return (
        db.query(Master).filter(Master.master_type == master_type).order_by(Master.sort_order).all()
    )
