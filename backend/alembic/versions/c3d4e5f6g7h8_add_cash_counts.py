"""add cash_counts table

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-04-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6g7h8"
down_revision: Union[str, None] = "b2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cash_counts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user_display_name", sa.String(255), nullable=False),
        sa.Column("company_id", sa.String(36), nullable=False),
        sa.Column("bill_1000", sa.Integer, nullable=False, server_default="0"),
        sa.Column("bill_500", sa.Integer, nullable=False, server_default="0"),
        sa.Column("bill_100", sa.Integer, nullable=False, server_default="0"),
        sa.Column("coin_50", sa.Integer, nullable=False, server_default="0"),
        sa.Column("coin_10", sa.Integer, nullable=False, server_default="0"),
        sa.Column("coin_5", sa.Integer, nullable=False, server_default="0"),
        sa.Column("coin_1", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total", sa.Integer, nullable=False),
        sa.Column("note", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("cash_counts")
