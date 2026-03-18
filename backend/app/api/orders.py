import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderItemResponse(BaseModel):
    id: str
    productId: str
    productName: str
    unitPrice: int
    quantity: int
    subtotal: int


class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    deviceId: str
    totalAmount: int
    paymentMethod: str
    note: Optional[str] = None
    items: list[OrderItemResponse]
    createdAt: int
    cancelledAt: Optional[int] = None


def _order_to_response(r: Order) -> OrderResponse:
    return OrderResponse(
        id=r.id,
        orderNumber=r.order_number,
        deviceId=r.device_id,
        totalAmount=r.total_amount,
        paymentMethod=r.payment_method,
        note=r.note,
        items=[
            OrderItemResponse(
                id=item.id,
                productId=item.product_id,
                productName=item.product_name,
                unitPrice=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            for item in r.items
        ],
        createdAt=r.created_at,
        cancelledAt=r.cancelled_at,
    )


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    company_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "super_admin":
        cid = company_id or current_user.company_id
    else:
        cid = current_user.company_id

    result = await db.execute(
        select(Order)
        .where(Order.exhibition_id == cid)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    rows = result.scalars().all()
    return [_order_to_response(r) for r in rows]


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = result.scalars().first()

    if not order:
        raise HTTPException(status_code=404, detail="訂單不存在")
    if current_user.role != "super_admin" and order.exhibition_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")
    if order.cancelled_at:
        raise HTTPException(status_code=400, detail="訂單已取消")

    # Mark as cancelled
    order.cancelled_at = int(time.time() * 1000)

    # Restore stock for each item
    for item in order.items:
        product = await db.get(Product, item.product_id)
        if product and product.stock is not None:
            product.stock = product.stock + item.quantity
            product.updated_at = int(time.time() * 1000)

    await db.commit()
    await db.refresh(order)
    return _order_to_response(order)
