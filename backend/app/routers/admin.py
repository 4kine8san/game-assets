import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..messages import ERR_ADMIN_PASSWORD_NOT_SET, ERR_ADMIN_WRONG_PASSWORD

router = APIRouter()


class PasswordVerifyRequest(BaseModel):
    password: str = Field(..., max_length=200)


@router.post("/api/admin/verify")
def verify_admin(req: PasswordVerifyRequest):
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_password:
        raise HTTPException(status_code=500, detail=ERR_ADMIN_PASSWORD_NOT_SET)
    if req.password != admin_password:
        raise HTTPException(status_code=401, detail=ERR_ADMIN_WRONG_PASSWORD)
    return {"ok": True}
