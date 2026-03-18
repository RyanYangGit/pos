import uuid

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.sync import PullCheckpoint


async def pull_categories(
    db: AsyncSession,
    exhibition_id: str,
    checkpoint: PullCheckpoint | None,
    limit: int,
) -> tuple[list[dict], PullCheckpoint]:
    query = select(Category).where(Category.exhibition_id == exhibition_id)

    if checkpoint and checkpoint.updated_at:
        query = query.where(
            (Category.updated_at > checkpoint.updated_at)
            | (
                and_(
                    Category.updated_at == checkpoint.updated_at,
                    Category.id > checkpoint.id,
                )
            )
        )

    query = query.order_by(Category.updated_at, Category.id).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()

    documents = [
        {
            "id": r.id,
            "name": r.name,
            "sortOrder": r.sort_order,
            "createdAt": r.created_at,
            "updatedAt": r.updated_at,
        }
        for r in rows
    ]

    new_checkpoint = PullCheckpoint(
        updated_at=rows[-1].updated_at if rows else (checkpoint.updated_at if checkpoint else 0),
        id=rows[-1].id if rows else (checkpoint.id if checkpoint else ""),
    )

    return documents, new_checkpoint


async def push_categories(
    db: AsyncSession,
    exhibition_id: str,
    change_rows: list[dict],
) -> list[dict]:
    conflicts = []

    for row in change_rows:
        doc = row["newDocumentState"]
        existing = await db.get(Category, doc["id"])

        if existing:
            existing.name = doc.get("name", existing.name)
            existing.sort_order = doc.get("sortOrder", existing.sort_order)
            existing.updated_at = doc.get("updatedAt", existing.updated_at)
        else:
            new_cat = Category(
                id=doc["id"],
                exhibition_id=exhibition_id,
                name=doc["name"],
                sort_order=doc.get("sortOrder", 0),
                created_at=doc.get("createdAt", 0),
                updated_at=doc.get("updatedAt", 0),
            )
            db.add(new_cat)

    await db.commit()
    return conflicts


async def pull_products(
    db: AsyncSession,
    exhibition_id: str,
    checkpoint: PullCheckpoint | None,
    limit: int,
) -> tuple[list[dict], PullCheckpoint]:
    query = select(Product).where(Product.exhibition_id == exhibition_id)

    if checkpoint and checkpoint.updated_at:
        query = query.where(
            (Product.updated_at > checkpoint.updated_at)
            | (
                and_(
                    Product.updated_at == checkpoint.updated_at,
                    Product.id > checkpoint.id,
                )
            )
        )

    query = query.order_by(Product.updated_at, Product.id).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()

    documents = [
        {
            "id": r.id,
            "categoryId": r.category_id,
            "name": r.name,
            "price": r.price,
            "stock": r.stock,
            "imageDataUrl": None,
            "isActive": r.is_active,
            "sortOrder": r.sort_order,
            "createdAt": r.created_at,
            "updatedAt": r.updated_at,
        }
        for r in rows
    ]

    new_checkpoint = PullCheckpoint(
        updated_at=rows[-1].updated_at if rows else (checkpoint.updated_at if checkpoint else 0),
        id=rows[-1].id if rows else (checkpoint.id if checkpoint else ""),
    )

    return documents, new_checkpoint


async def push_products(
    db: AsyncSession,
    exhibition_id: str,
    change_rows: list[dict],
) -> list[dict]:
    conflicts = []

    for row in change_rows:
        doc = row["newDocumentState"]
        existing = await db.get(Product, doc["id"])

        if existing:
            existing.category_id = doc.get("categoryId", existing.category_id)
            existing.name = doc.get("name", existing.name)
            existing.price = doc.get("price", existing.price)
            existing.stock = doc.get("stock", existing.stock)
            existing.is_active = doc.get("isActive", existing.is_active)
            existing.sort_order = doc.get("sortOrder", existing.sort_order)
            existing.updated_at = doc.get("updatedAt", existing.updated_at)
        else:
            new_prod = Product(
                id=doc["id"],
                exhibition_id=exhibition_id,
                category_id=doc["categoryId"],
                name=doc["name"],
                price=doc["price"],
                stock=doc.get("stock"),
                is_active=doc.get("isActive", True),
                sort_order=doc.get("sortOrder", 0),
                created_at=doc.get("createdAt", 0),
                updated_at=doc.get("updatedAt", 0),
            )
            db.add(new_prod)

    await db.commit()
    return conflicts


async def push_orders(
    db: AsyncSession,
    exhibition_id: str,
    change_rows: list[dict],
) -> list[dict]:
    conflicts = []

    for row in change_rows:
        doc = row["newDocumentState"]
        existing = await db.get(Order, doc["id"])

        if existing:
            continue  # Orders are immutable

        new_order = Order(
            id=doc["id"],
            exhibition_id=exhibition_id,
            device_id=doc.get("deviceId", doc.get("device_id", "")),
            order_number=doc.get("orderNumber", doc.get("order_number", "")),
            total_amount=doc.get("totalAmount", doc.get("total_amount", 0)),
            payment_method=doc.get("paymentMethod", doc.get("payment_method", "")),
            note=doc.get("note"),
            created_at=doc.get("createdAt", doc.get("created_at", 0)),
        )
        db.add(new_order)

        for item in doc.get("items", []):
            new_item = OrderItem(
                id=str(uuid.uuid4()),
                order_id=doc["id"],
                product_id=item.get("productId", item.get("product_id", "")),
                product_name=item.get("productName", item.get("product_name", "")),
                unit_price=item.get("unitPrice", item.get("unit_price", 0)),
                quantity=item.get("quantity", 0),
                subtotal=item.get("subtotal", 0),
            )
            db.add(new_item)

    await db.commit()
    return conflicts
