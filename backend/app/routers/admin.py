import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class PasswordVerifyRequest(BaseModel):
    password: str = Field(..., max_length=200)


@router.post("/api/admin/verify")
def verify_admin(req: PasswordVerifyRequest):
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_password:
        raise HTTPException(status_code=500, detail="管理者パスワードが設定されていません")
    if req.password != admin_password:
        raise HTTPException(status_code=401, detail="パスワードが正しくありません")
    return {"ok": True}
