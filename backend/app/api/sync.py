from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.auth.jwt import get_current_user
from app.schemas.sync import PullRequest, PullResponse, PushRequest, PushResponse
from app.services.sync_service import (
    pull_categories,
    push_categories,
    pull_products,
    push_products,
    push_orders,
)

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/categories/pull", response_model=PullResponse)
async def categories_pull(
    body: PullRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents, checkpoint = await pull_categories(
        db, current_user.company_id, body.checkpoint, body.limit
    )
    return PullResponse(documents=documents, checkpoint=checkpoint)


@router.post("/categories/push", response_model=PushResponse)
async def categories_push(
    body: PushRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_rows = [row.model_dump() for row in body.changeRows]
    conflicts = await push_categories(db, current_user.company_id, change_rows)
    return PushResponse(conflicts=conflicts)


@router.post("/products/pull", response_model=PullResponse)
async def products_pull(
    body: PullRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents, checkpoint = await pull_products(
        db, current_user.company_id, body.checkpoint, body.limit
    )
    return PullResponse(documents=documents, checkpoint=checkpoint)


@router.post("/products/push", response_model=PushResponse)
async def products_push(
    body: PushRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_rows = [row.model_dump() for row in body.changeRows]
    conflicts = await push_products(db, current_user.company_id, change_rows)
    return PushResponse(conflicts=conflicts)


@router.post("/orders/push", response_model=PushResponse)
async def orders_push(
    body: PushRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_rows = [row.model_dump() for row in body.changeRows]
    conflicts = await push_orders(db, current_user.company_id, change_rows)
    return PushResponse(conflicts=conflicts)
