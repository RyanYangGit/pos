"""add vendors, product.vendor_id, order_items vendor snapshot

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-11-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6g7h8i9"
down_revision: Union[str, None] = "c3d4e5f6g7h8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vendors",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_vendors_company_id", "vendors", ["company_id"])
    op.add_column("products", sa.Column("vendor_id", sa.String(36), sa.ForeignKey("vendors.id"), nullable=True))
    op.add_column("order_items", sa.Column("vendor_id", sa.String(36), nullable=True))
    op.add_column("order_items", sa.Column("vendor_name", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("order_items", "vendor_name")
    op.drop_column("order_items", "vendor_id")
    op.drop_column("products", "vendor_id")
    op.drop_index("ix_vendors_company_id", table_name="vendors")
    op.drop_table("vendors")
