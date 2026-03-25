"""add product_audit_logs table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6g7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), nullable=False),
        sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_display_name", sa.String(255), nullable=False),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("changes", sa.Text, nullable=False),
        sa.Column("company_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("product_audit_logs")
