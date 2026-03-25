import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ProductAuditLog(Base):
    __tablename__ = "product_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36))
    product_name: Mapped[str] = mapped_column(String(255))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    user_display_name: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(20))  # "update" | "create" | "delete" | "toggle"
    changes: Mapped[str] = mapped_column(Text)  # JSON string of changes
    company_id: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
