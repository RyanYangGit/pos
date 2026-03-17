from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem


async def get_daily_report(
    db: AsyncSession,
    exhibition_id: str,
    date_str: str,
) -> dict:
    # Parse date to get timestamp range
    target_date = datetime.strptime(date_str, "%Y%m%d")
    start_ts = int(target_date.timestamp() * 1000)
    end_ts = start_ts + 86400000  # +24h in ms

    # Get orders for the day
    query = select(Order).where(
        Order.exhibition_id == exhibition_id,
        Order.created_at >= start_ts,
        Order.created_at < end_ts,
    )
    result = await db.execute(query)
    orders = result.scalars().all()

    total_revenue = sum(o.total_amount for o in orders)
    total_transactions = len(orders)
    avg_transaction = total_revenue // total_transactions if total_transactions > 0 else 0

    # Payment breakdown
    payment_map: dict[str, int] = {}
    for o in orders:
        payment_map[o.payment_method] = payment_map.get(o.payment_method, 0) + o.total_amount

    payment_breakdown = [
        {
            "method": method,
            "amount": amount,
            "percentage": round(amount / total_revenue * 100) if total_revenue > 0 else 0,
        }
        for method, amount in payment_map.items()
    ]

    # Top products
    order_ids = [o.id for o in orders]
    if order_ids:
        items_query = select(OrderItem).where(OrderItem.order_id.in_(order_ids))
        items_result = await db.execute(items_query)
        items = items_result.scalars().all()

        product_map: dict[str, dict] = {}
        for item in items:
            if item.product_id not in product_map:
                product_map[item.product_id] = {
                    "name": item.product_name,
                    "quantity": 0,
                    "revenue": 0,
                }
            product_map[item.product_id]["quantity"] += item.quantity
            product_map[item.product_id]["revenue"] += item.subtotal

        top_products = sorted(product_map.values(), key=lambda x: x["revenue"], reverse=True)[:10]
    else:
        top_products = []

    return {
        "date": date_str,
        "total_revenue": total_revenue,
        "total_transactions": total_transactions,
        "avg_transaction": avg_transaction,
        "payment_breakdown": payment_breakdown,
        "top_products": top_products,
    }
