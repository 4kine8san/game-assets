from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..messages import ERR_INVALID_PARAMETER, X_AXIS_LABELS, Y_AXIS_LABELS
from ..models import Asset

router = APIRouter(prefix="/api/stats", tags=["stats"])

X_AXIS_COLS = {
    "hardware": Asset.hardware,
    "genre": Asset.genre,
    "asset_category": Asset.asset_category,
    "edition": Asset.edition,
    "release_year": Asset.release_year,
}


class StatItem(BaseModel):
    label: str
    value: float


class StatsResponse(BaseModel):
    x_label: str
    y_label: str
    items: list[StatItem]


@router.get("/aggregate", response_model=StatsResponse)
def aggregate(
    x_axis: str = "hardware",
    y_axis: str = "count",
    db: Session = Depends(get_db),
):
    if x_axis not in X_AXIS_COLS:
        raise HTTPException(400, ERR_INVALID_PARAMETER)
    if y_axis not in Y_AXIS_LABELS:
        raise HTTPException(400, ERR_INVALID_PARAMETER)

    col = X_AXIS_COLS[x_axis]

    if y_axis == "count":
        expr = func.count(Asset.id)
    elif y_axis == "total_value":
        expr = func.coalesce(func.sum(Asset.asset_value), 0)
    else:  # avg_value
        expr = func.coalesce(func.avg(Asset.asset_value), 0)

    rows = (
        db.query(col, expr)
        .filter(Asset.deleted_at.is_(None), col.isnot(None), col != "")
        .group_by(col)
        .order_by(expr.desc())
        .all()
    )

    items = [StatItem(label=str(row[0]), value=float(row[1])) for row in rows]

    return StatsResponse(
        x_label=X_AXIS_LABELS[x_axis],
        y_label=Y_AXIS_LABELS[y_axis],
        items=items,
    )
