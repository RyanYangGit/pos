import uuid
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.models.vendor import Vendor
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])


def resolve_company_id(current_user: User, company_id: Optional[str]) -> str:
    if current_user.role == "super_admin":
        if not company_id:
            raise HTTPException(status_code=400, detail="super_admin 需要指定 company_id")
        return company_id
    return current_user.company_id


class ProductCreate(BaseModel):
    name: str
    price: int
    stock: Optional[int] = None
    barcode: Optional[str] = None
    category_id: str
    vendor_id: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    company_id: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    stock: Optional[int] = None
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    vendor_id: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    price: int
    stock: Optional[int]
    barcode: Optional[str]
    category_id: str
    vendor_id: Optional[str] = None
    is_active: bool
    sort_order: int
    company_id: str


def _resp(r: Product) -> ProductResponse:
    return ProductResponse(
        id=r.id, name=r.name, price=r.price, stock=r.stock, barcode=r.barcode,
        category_id=r.category_id, vendor_id=r.vendor_id, is_active=r.is_active,
        sort_order=r.sort_order, company_id=r.exhibition_id,
    )


async def _check_vendor(db: AsyncSession, vendor_id: Optional[str], company_id: str) -> None:
    if vendor_id is None:
        return
    vendor = await db.get(Vendor, vendor_id)
    if not vendor or vendor.company_id != company_id:
        raise HTTPException(status_code=400, detail="廠商不存在")


@router.get("", response_model=list[ProductResponse])
async def list_products(
    company_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = resolve_company_id(current_user, company_id)
    result = await db.execute(
        select(Product).where(Product.exhibition_id == cid).order_by(Product.sort_order)
    )
    rows = result.scalars().all()
    return [_resp(r) for r in rows]


@router.post("", response_model=ProductResponse)
async def create_product(
    body: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = resolve_company_id(current_user, body.company_id)
    await _check_vendor(db, body.vendor_id, cid)
    now = int(time.time() * 1000)
    prod = Product(
        id=str(uuid.uuid4()),
        exhibition_id=cid,
        category_id=body.category_id,
        vendor_id=body.vendor_id,
        name=body.name,
        price=body.price,
        stock=body.stock,
        barcode=body.barcode,
        is_active=body.is_active,
        sort_order=body.sort_order,
        created_at=now,
        updated_at=now,
    )
    db.add(prod)
    await db.commit()
    await db.refresh(prod)
    return _resp(prod)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prod = await db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="商品不存在")
    if current_user.role != "super_admin" and prod.exhibition_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")

    if body.name is not None and body.name != prod.name:
        if current_user.role == "cashier":
            raise HTTPException(status_code=403, detail="收銀員無法修改商品名稱")
        prod.name = body.name
    if body.price is not None: prod.price = body.price
    if body.stock is not None: prod.stock = body.stock
    if body.barcode is not None: prod.barcode = body.barcode
    if body.category_id is not None: prod.category_id = body.category_id
    if "vendor_id" in body.model_fields_set and body.vendor_id != prod.vendor_id:
        await _check_vendor(db, body.vendor_id, prod.exhibition_id)
        prod.vendor_id = body.vendor_id
    if body.is_active is not None: prod.is_active = body.is_active
    if body.sort_order is not None: prod.sort_order = body.sort_order
    prod.updated_at = int(time.time() * 1000)

    await db.commit()
    return _resp(prod)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "cashier":
        raise HTTPException(status_code=403, detail="收銀員無法刪除商品")
    prod = await db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="商品不存在")
    if current_user.role != "super_admin" and prod.exhibition_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")
    await db.delete(prod)
    await db.commit()
    return {"ok": True}
