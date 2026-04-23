"""Add purchase_date to assets

Revision ID: 002
Revises: 001_initial
Create Date: 2026-04-23 20:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('assets', sa.Column('purchase_date', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('assets', 'purchase_date')
