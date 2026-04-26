"""fix enum case - lowercase asset types

Revision ID: 010
Revises: 009
Create Date: 2026-04-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'stocks'")
    op.execute("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'crypto'")
    op.execute("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'real_estate'")
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'buy'")
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'sell'")

def downgrade() -> None:
    pass
