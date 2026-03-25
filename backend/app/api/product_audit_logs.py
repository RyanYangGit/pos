import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product_audit_log import ProductAuditLog
from app.models.user import User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/product-audit-logs", tags=["product-audit-logs"])


class AuditLogCreate(BaseModel):
    product_id: str
    product_name: str
    action: str
    changes: str  # JSON string


class AuditLogResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    user_id: str
    user_display_name: str
    action: str
    changes: str
    created_at: str


@router.post("")
async def create_audit_log(
    body: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = ProductAuditLog(
        id=str(uuid.uuid4()),
        product_id=body.product_id,
        product_name=body.product_name,
        user_id=current_user.id,
        user_display_name=current_user.display_name,
        action=body.action,
        changes=body.changes,
        company_id=current_user.company_id or "",
    )
    db.add(log)
    await db.commit()
    return {"ok": True}


@router.get("", response_model=list[AuditLogResponse])
async def list_audit_logs(
    company_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="權限不足")

    cid = company_id if current_user.role == "super_admin" and company_id else current_user.company_id
    query = select(ProductAuditLog).where(
        ProductAuditLog.company_id == cid
    ).order_by(ProductAuditLog.created_at.desc()).limit(limit)

    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        AuditLogResponse(
            id=r.id,
            product_id=r.product_id,
            product_name=r.product_name,
            user_id=r.user_id,
            user_display_name=r.user_display_name,
            action=r.action,
            changes=r.changes,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]
