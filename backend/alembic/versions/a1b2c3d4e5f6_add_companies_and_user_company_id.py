"""add companies and user company_id

Revision ID: a1b2c3d4e5f6
Revises: 5ed40f2ee7bf
Create Date: 2026-02-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '5ed40f2ee7bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'companies',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.add_column('users',
        sa.Column('company_id', sa.String(length=36), sa.ForeignKey('companies.id'), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'company_id')
    op.drop_table('companies')
