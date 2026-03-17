import uuid
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.category import Category
from app.models.user import User
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])


def resolve_company_id(current_user: User, company_id: Optional[str]) -> str:
    if current_user.role == "super_admin":
        if not company_id:
            raise HTTPException(status_code=400, detail="super_admin 需要指定 company_id")
        return company_id
    return current_user.company_id


class CategoryCreate(BaseModel):
    name: str
    company_id: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: str


class CategoryResponse(BaseModel):
    id: str
    name: str
    sort_order: int
    company_id: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    company_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = resolve_company_id(current_user, company_id)
    result = await db.execute(
        select(Category).where(Category.exhibition_id == cid).order_by(Category.sort_order)
    )
    rows = result.scalars().all()
    return [CategoryResponse(id=r.id, name=r.name, sort_order=r.sort_order, company_id=r.exhibition_id) for r in rows]


@router.post("", response_model=CategoryResponse)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cid = resolve_company_id(current_user, body.company_id)
    count_result = await db.execute(
        select(Category).where(Category.exhibition_id == cid)
    )
    sort_order = len(count_result.scalars().all())
    now = int(time.time() * 1000)
    cat = Category(
        id=str(uuid.uuid4()),
        exhibition_id=cid,
        name=body.name,
        sort_order=sort_order,
        created_at=now,
        updated_at=now,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryResponse(id=cat.id, name=cat.name, sort_order=cat.sort_order, company_id=cat.exhibition_id)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="分類不存在")
    if current_user.role != "super_admin" and cat.exhibition_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")
    cat.name = body.name
    cat.updated_at = int(time.time() * 1000)
    await db.commit()
    return CategoryResponse(id=cat.id, name=cat.name, sort_order=cat.sort_order, company_id=cat.exhibition_id)


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="分類不存在")
    if current_user.role != "super_admin" and cat.exhibition_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")
    await db.delete(cat)
    await db.commit()
    return {"ok": True}
