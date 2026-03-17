"""Seed default super_admin, and a demo company with admin/cashier accounts."""

import asyncio
import uuid
from datetime import date, datetime

import bcrypt

from app.database import async_session
from app.models.company import Company
from app.models.exhibition import Exhibition
from app.models.user import User

from sqlalchemy import select

SUPER_ADMIN = {
    "username": "superadmin",
    "password": "j2002303",
    "display_name": "平台管理員",
    "role": "super_admin",
    "company_id": None,
}

DEMO_COMPANY = {
    "id": "demo-company-0000-0000-000000000001",
    "name": "示範公司",
}

DEMO_USERS = [
    {
        "username": "admin",
        "password": "admin1234",
        "display_name": "管理員",
        "role": "admin",
    },
    {
        "username": "cashier",
        "password": "cashier1234",
        "display_name": "收銀員",
        "role": "cashier",
    },
]


async def seed():
    async with async_session() as session:
        # 1. Create super_admin
        exists = await session.execute(select(User).where(User.username == SUPER_ADMIN["username"]))
        if not exists.scalar_one_or_none():
            user = User(
                id=str(uuid.uuid4()),
                username=SUPER_ADMIN["username"],
                password_hash=bcrypt.hashpw(SUPER_ADMIN["password"].encode(), bcrypt.gensalt()).decode(),
                display_name=SUPER_ADMIN["display_name"],
                role=SUPER_ADMIN["role"],
                company_id=None,
            )
            session.add(user)
            print(f"Created super_admin '{SUPER_ADMIN['username']}'")
        else:
            print(f"super_admin '{SUPER_ADMIN['username']}' already exists, skipping.")

        # 2. Create demo company + exhibition (same id for FK compat)
        company_exists = await session.execute(select(Company).where(Company.id == DEMO_COMPANY["id"]))
        if not company_exists.scalar_one_or_none():
            company = Company(
                id=DEMO_COMPANY["id"],
                name=DEMO_COMPANY["name"],
                created_at=datetime.utcnow(),
            )
            session.add(company)

            exhibition = Exhibition(
                id=DEMO_COMPANY["id"],
                name=DEMO_COMPANY["name"],
                start_date=date.today(),
                end_date=date(2099, 12, 31),
            )
            session.add(exhibition)
            print(f"Created demo company '{DEMO_COMPANY['name']}'")
        else:
            print(f"Demo company already exists, skipping.")

        # 3. Create demo company users
        for u in DEMO_USERS:
            exists = await session.execute(select(User).where(User.username == u["username"]))
            if exists.scalar_one_or_none():
                print(f"User '{u['username']}' already exists, skipping.")
                continue

            user = User(
                id=str(uuid.uuid4()),
                username=u["username"],
                password_hash=bcrypt.hashpw(u["password"].encode(), bcrypt.gensalt()).decode(),
                display_name=u["display_name"],
                role=u["role"],
                company_id=DEMO_COMPANY["id"],
            )
            session.add(user)
            print(f"Created user '{u['username']}' ({u['role']})")

        await session.commit()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
