import uuid
from datetime import date, datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.cash_count import CashCount
from app.models.user import User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/cash-counts", tags=["cash-counts"])


class CashCountCreate(BaseModel):
    bill_1000: int = 0
    bill_500: int = 0
    bill_100: int = 0
    coin_50: int = 0
    coin_10: int = 0
    coin_5: int = 0
    coin_1: int = 0
    note: Optional[str] = None


class CashCountResponse(BaseModel):
    id: str
    user_display_name: str
    bill_1000: int
    bill_500: int
    bill_100: int
    coin_50: int
    coin_10: int
    coin_5: int
    coin_1: int
    total: int
    note: Optional[str]
    created_at: str


@router.post("")
async def create_cash_count(
    body: CashCountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = (
        body.bill_1000 * 1000
        + body.bill_500 * 500
        + body.bill_100 * 100
        + body.coin_50 * 50
        + body.coin_10 * 10
        + body.coin_5 * 5
        + body.coin_1 * 1
    )
    entry = CashCount(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        user_display_name=current_user.display_name,
        company_id=current_user.company_id or "",
        bill_1000=body.bill_1000,
        bill_500=body.bill_500,
        bill_100=body.bill_100,
        coin_50=body.coin_50,
        coin_10=body.coin_10,
        coin_5=body.coin_5,
        coin_1=body.coin_1,
        total=total,
        note=body.note,
    )
    db.add(entry)
    await db.commit()
    return {"ok": True, "total": total}


@router.get("", response_model=list[CashCountResponse])
async def list_cash_counts(
    limit: int = Query(default=50, le=200),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = current_user.company_id
    query = select(CashCount).where(
        CashCount.company_id == cid
    )
    if start_date:
        query = query.where(CashCount.created_at >= datetime.combine(start_date, time.min))
    if end_date:
        query = query.where(CashCount.created_at <= datetime.combine(end_date, time.max))
    query = query.order_by(CashCount.created_at.desc()).limit(limit)

    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        CashCountResponse(
            id=r.id,
            user_display_name=r.user_display_name,
            bill_1000=r.bill_1000,
            bill_500=r.bill_500,
            bill_100=r.bill_100,
            coin_50=r.coin_50,
            coin_10=r.coin_10,
            coin_5=r.coin_5,
            coin_1=r.coin_1,
            total=r.total,
            note=r.note,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]
