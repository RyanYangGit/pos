"""Put a company's vendor-less products (and their past sales) under one vendor.

Usage: python -m scripts.assign_default_vendor <company_name> <vendor_name> [--apply]
Without --apply it only prints what would change.
"""

import asyncio
import sys
import uuid

from sqlalchemy import select, update, func

from app.database import async_session
from app.models.company import Company
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.vendor import Vendor


async def main(company_name: str, vendor_name: str, apply: bool) -> None:
    async with async_session() as db:
        companies = (await db.execute(select(Company).where(Company.name == company_name))).scalars().all()
        if len(companies) != 1:
            sys.exit(f"找到 {len(companies)} 間名為「{company_name}」的公司，需要剛好 1 間")
        company = companies[0]

        vendor = (await db.execute(
            select(Vendor).where(Vendor.company_id == company.id, Vendor.name == vendor_name)
        )).scalar_one_or_none()
        if vendor is None:
            vendor = Vendor(id=str(uuid.uuid4()), company_id=company.id, name=vendor_name, sort_order=0)
            db.add(vendor)
            print(f"新增廠商「{vendor_name}」")
        else:
            print(f"沿用既有廠商「{vendor_name}」")

        n_products = (await db.execute(
            select(func.count()).select_from(Product)
            .where(Product.exhibition_id == company.id, Product.vendor_id.is_(None))
        )).scalar_one()
        company_orders = select(Order.id).where(Order.exhibition_id == company.id)
        n_items = (await db.execute(
            select(func.count()).select_from(OrderItem)
            .where(OrderItem.order_id.in_(company_orders), OrderItem.vendor_id.is_(None))
        )).scalar_one()
        print(f"未指定廠商的商品：{n_products} 筆；未指定廠商的銷售明細：{n_items} 筆")

        if not apply:
            await db.rollback()
            print("（試跑，未寫入。加 --apply 才會寫入）")
            return

        await db.flush()
        await db.execute(
            update(Product)
            .where(Product.exhibition_id == company.id, Product.vendor_id.is_(None))
            .values(vendor_id=vendor.id)
        )
        await db.execute(
            update(OrderItem)
            .where(OrderItem.order_id.in_(company_orders), OrderItem.vendor_id.is_(None))
            .values(vendor_id=vendor.id, vendor_name=vendor.name)
        )
        await db.commit()
        print("已寫入")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--apply"]
    if len(args) != 2:
        sys.exit(__doc__)
    asyncio.run(main(args[0], args[1], "--apply" in sys.argv))
