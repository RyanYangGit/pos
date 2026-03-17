"""Change a user's password. Usage: python change_password.py <username> <new_password>"""

import asyncio
import sys

import bcrypt
from sqlalchemy import select

from app.database import async_session
from app.models.user import User


async def change_password(username: str, new_password: str):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            print(f"找不到使用者 '{username}'")
            return
        user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        await session.commit()
        print(f"已更新 '{username}' 的密碼")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("用法: python change_password.py <username> <new_password>")
        sys.exit(1)
    asyncio.run(change_password(sys.argv[1], sys.argv[2]))
