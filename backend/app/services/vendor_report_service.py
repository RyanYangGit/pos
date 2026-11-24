from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.vendor import Vendor

# The store operates in Taiwan; month boundaries follow local time.
TAIPEI = timezone(timedelta(hours=8))
UNASSIGNED = "未指定廠商"


def month_range_ms(month: str) -> tuple[int, int]:
    try:
        start = datetime.strptime(month, "%Y-%m").replace(tzinfo=TAIPEI)
    except ValueError:
        raise HTTPException(status_code=400, detail="月份格式應為 YYYY-MM")
    end = start.replace(year=start.year + 1, month=1) if start.month == 12 else start.replace(month=start.month + 1)
    return int(start.timestamp() * 1000), int(end.timestamp() * 1000)


async def get_vendor_monthly_report(
    db: AsyncSession,
    company_id: str,
    month: str,
    vendor_id: str | None = None,
) -> dict:
    start_ms, end_ms = month_range_ms(month)

    query = (
        select(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.exhibition_id == company_id,
            Order.created_at >= start_ms,
            Order.created_at < end_ms,
            Order.cancelled_at.is_(None),
        )
    )
    if vendor_id:
        query = query.where(OrderItem.vendor_id == vendor_id)
    items = (await db.execute(query)).scalars().all()

    # Current vendor names win over the sale-time snapshot, so a renamed vendor reports under one name.
    vendors = {
        v.id: v for v in (await db.execute(select(Vendor).where(Vendor.company_id == company_id))).scalars()
    }

    groups: dict[str | None, dict] = {}
    for it in items:
        vid = it.vendor_id
        g = groups.get(vid)
        if g is None:
            name = vendors[vid].name if vid in vendors else (it.vendor_name or UNASSIGNED)
            g = groups[vid] = {"vendor_id": vid, "vendor_name": name, "lines": {}, "sort": vendors[vid].sort_order if vid in vendors else 10**6}
        key = (it.product_name, it.unit_price)
        line = g["lines"].setdefault(key, {"name": it.product_name, "price": it.unit_price, "quantity": 0, "total": 0})
        line["quantity"] += it.quantity
        line["total"] += it.subtotal

    result = []
    for g in sorted(groups.values(), key=lambda g: (g["sort"], g["vendor_name"])):
        lines = sorted(g["lines"].values(), key=lambda l: (-l["quantity"], l["name"]))
        result.append({
            "vendor_id": g["vendor_id"],
            "vendor_name": g["vendor_name"],
            "items": lines,
            "total_quantity": sum(l["quantity"] for l in lines),
            "total_amount": sum(l["total"] for l in lines),
        })
    return {"month": month, "vendors": result}
