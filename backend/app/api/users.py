import uuid
from typing import Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.auth.jwt import get_current_user, require_role
from app.schemas.users import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    company_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "super_admin":
        # super_admin can filter by company or see all
        query = select(User)
        if company_id:
            query = query.where(User.company_id == company_id)
    else:
        # admin/cashier only see own company
        query = select(User).where(User.company_id == current_user.company_id)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=UserResponse)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
):
    # Check username uniqueness
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="帳號已存在")

    # Determine company_id
    if current_user.role == "super_admin":
        target_company_id = body.company_id
    else:
        target_company_id = current_user.company_id
        # admin cannot create super_admin
        if body.role == "super_admin":
            raise HTTPException(status_code=403, detail="權限不足")

    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        password_hash=password_hash,
        display_name=body.display_name,
        role=body.role,
        company_id=target_company_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="使用者不存在")

    # Non-super_admin can only edit users in same company
    if current_user.role != "super_admin" and user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")

    if body.display_name is not None:
        user.display_name = body.display_name
    if body.role is not None:
        if current_user.role != "super_admin" and body.role == "super_admin":
            raise HTTPException(status_code=403, detail="權限不足")
        user.role = body.role
    if body.password is not None:
        user.password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    if body.company_id is not None and current_user.role == "super_admin":
        user.company_id = body.company_id

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="使用者不存在")

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="不能刪除自己")

    if current_user.role != "super_admin" and user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="權限不足")

    await db.delete(user)
    await db.commit()
    return {"ok": True}
