import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.company import Company
from app.models.exhibition import Exhibition
from app.models.user import User
from app.auth.jwt import get_current_user, require_role
from app.schemas.companies import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=list[CompanyResponse])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(Company).order_by(Company.created_at.desc()))
    return result.scalars().all()


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Any user can fetch their own company; super_admin can fetch any
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="權限不足")
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="公司不存在")
    return company


@router.post("", response_model=CompanyResponse)
async def create_company(
    body: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    company = Company(id=str(uuid.uuid4()), name=body.name)
    db.add(company)

    # Create a matching Exhibition so sync data FK constraints work
    exhibition = Exhibition(
        id=company.id,
        name=body.name,
        start_date=date.today(),
        end_date=date(2099, 12, 31),
    )
    db.add(exhibition)

    await db.commit()
    await db.refresh(company)
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    body: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="公司不存在")

    if body.name is not None:
        company.name = body.name
    if body.is_active is not None:
        company.is_active = body.is_active

    await db.commit()
    await db.refresh(company)
    return company


@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="公司不存在")

    await db.delete(company)
    await db.commit()
    return {"ok": True}
