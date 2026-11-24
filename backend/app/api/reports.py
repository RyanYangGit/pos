from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.auth.jwt import get_current_user
from app.api.products import resolve_company_id
from app.schemas.reports import DailyReportResponse
from app.services.report_service import get_daily_report
from app.services.vendor_report_service import get_vendor_monthly_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/daily", response_model=DailyReportResponse)
async def daily_report(
    date: str = Query(..., description="Date in YYYYMMDD format"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_daily_report(db, current_user.company_id, date)


@router.get("/vendor-monthly")
async def vendor_monthly_report(
    month: str = Query(..., description="Month in YYYY-MM format (Asia/Taipei)"),
    vendor_id: Optional[str] = Query(default=None),
    company_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="權限不足")
    cid = resolve_company_id(current_user, company_id)
    return await get_vendor_monthly_report(db, cid, month, vendor_id)
