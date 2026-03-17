import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.order import Order
from app.models.user import User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/export", tags=["export"])

PAYMENT_LABELS = {
    "cash": "現金",
    "line_pay": "LINE Pay",
    "transfer": "轉帳",
}


@router.get("/csv")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Order)
        .where(Order.exhibition_id == current_user.company_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(query)
    orders = result.scalars().all()

    output = io.StringIO()
    output.write("\ufeff")  # BOM for Excel Chinese display
    writer = csv.writer(output)
    writer.writerow(["單號", "時間", "商品名稱", "單價", "數量", "小計", "付款方式", "訂單總額", "備註"])

    for order in orders:
        time_str = datetime.fromtimestamp(order.created_at / 1000).strftime("%Y/%m/%d %H:%M")
        for item in order.items:
            writer.writerow([
                order.order_number,
                time_str,
                item.product_name,
                item.unit_price,
                item.quantity,
                item.subtotal,
                PAYMENT_LABELS.get(order.payment_method, order.payment_method),
                order.total_amount,
                order.note or "",
            ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )
