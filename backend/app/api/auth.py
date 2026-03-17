import uuid

from fastapi import APIRouter, Depends, HTTPException
import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.device import Device
from app.models.user import User
from app.auth.jwt import create_token
from app.schemas.auth import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    LoginRequest,
    LoginResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/device", response_model=DeviceRegisterResponse)
async def register_device(
    body: DeviceRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    device = Device(
        id=str(uuid.uuid4()),
        exhibition_id=body.exhibition_id,
        name=body.device_name,
    )
    db.add(device)
    await db.commit()

    return DeviceRegisterResponse(
        device_id=device.id,
        exhibition_id=device.exhibition_id,
        device_name=device.name,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if not user or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")

    token = create_token(user.id, user.role, user.company_id)

    return LoginResponse(
        token=token,
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        role=user.role,
        company_id=user.company_id,
    )
