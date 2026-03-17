from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.auth.jwt import get_current_user
from app.schemas.reports import DailyReportResponse
from app.services.report_service import get_daily_report

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/daily", response_model=DailyReportResponse)
async def daily_report(
    date: str = Query(..., description="Date in YYYYMMDD format"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_daily_report(db, current_user.company_id, date)
