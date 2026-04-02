import uuid
from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CashCount(Base):
    __tablename__ = "cash_counts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    user_display_name: Mapped[str] = mapped_column(String(255))
    company_id: Mapped[str] = mapped_column(String(36))
    bill_1000: Mapped[int] = mapped_column(Integer, default=0)
    bill_500: Mapped[int] = mapped_column(Integer, default=0)
    bill_100: Mapped[int] = mapped_column(Integer, default=0)
    coin_50: Mapped[int] = mapped_column(Integer, default=0)
    coin_10: Mapped[int] = mapped_column(Integer, default=0)
    coin_5: Mapped[int] = mapped_column(Integer, default=0)
    coin_1: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
