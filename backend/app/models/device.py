import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exhibition_id: Mapped[str] = mapped_column(String(36), ForeignKey("exhibitions.id"))
    name: Mapped[str] = mapped_column(String(255))
    last_sync_at: Mapped[datetime | None] = mapped_column(default=None)
