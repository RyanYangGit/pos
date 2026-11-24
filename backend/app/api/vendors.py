import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.models.vendor import Vendor
from app.auth.jwt import get_current_user
from app.api.products import resolve_company_id

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


class VendorCreate(BaseModel):
    name: str
    company_id: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class VendorResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    sort_order: int
    company_id: str
    product_count: int = 0


def _require_manager(user: User):
    if user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="權限不足")


async def _get_owned(db: AsyncSession, vendor_id: str, user: User) -> Vendor:
    vendor = await db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="廠商不存在")
    if user.role != "super_admin" and vendor.company_id != user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")
    return vendor


async def _name_taken(db: AsyncSession, company_id: str, name: str, exclude_id: str | None = None) -> bool:
    q = select(Vendor.id).where(Vendor.company_id == company_id, Vendor.name == name)
    if exclude_id:
        q = q.where(Vendor.id != exclude_id)
    return (await db.execute(q)).first() is not None


async def _product_count(db: AsyncSession, vendor_id: str) -> int:
    return (await db.execute(select(func.count()).select_from(Product).where(Product.vendor_id == vendor_id))).scalar_one()


def _resp(v: Vendor, count: int = 0) -> VendorResponse:
    return VendorResponse(
        id=v.id, name=v.name, is_active=v.is_active, sort_order=v.sort_order,
        company_id=v.company_id, product_count=count,
    )


@router.get("", response_model=list[VendorResponse])
async def list_vendors(
    company_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = resolve_company_id(current_user, company_id)
    rows = (await db.execute(
        select(Vendor).where(Vendor.company_id == cid).order_by(Vendor.sort_order, Vendor.created_at)
    )).scalars().all()
    counts = dict((await db.execute(
        select(Product.vendor_id, func.count())
        .where(Product.exhibition_id == cid, Product.vendor_id.is_not(None))
        .group_by(Product.vendor_id)
    )).all())
    return [_resp(v, counts.get(v.id, 0)) for v in rows]


@router.post("", response_model=VendorResponse)
async def create_vendor(
    body: VendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    cid = resolve_company_id(current_user, body.company_id)
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="廠商名稱不能空白")
    if await _name_taken(db, cid, name):
        raise HTTPException(status_code=400, detail="廠商名稱已存在")
    count = (await db.execute(select(func.count()).select_from(Vendor).where(Vendor.company_id == cid))).scalar_one()
    vendor = Vendor(id=str(uuid.uuid4()), company_id=cid, name=name, sort_order=count)
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return _resp(vendor)


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: str,
    body: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    vendor = await _get_owned(db, vendor_id, current_user)
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="廠商名稱不能空白")
        if await _name_taken(db, vendor.company_id, name, exclude_id=vendor.id):
            raise HTTPException(status_code=400, detail="廠商名稱已存在")
        vendor.name = name
    if body.is_active is not None:
        vendor.is_active = body.is_active
    await db.commit()
    await db.refresh(vendor)
    return _resp(vendor, await _product_count(db, vendor.id))


@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_manager(current_user)
    vendor = await _get_owned(db, vendor_id, current_user)
    if await _product_count(db, vendor.id) > 0:
        raise HTTPException(status_code=400, detail="此廠商還有商品，請先把商品改到其他廠商")
    await db.delete(vendor)
    await db.commit()
    return {"ok": True}
