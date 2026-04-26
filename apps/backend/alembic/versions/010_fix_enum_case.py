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
    op.execute("UPDATE assets SET type = 'stocks' WHERE type = 'STOCKS'")
    op.execute("UPDATE assets SET type = 'crypto' WHERE type = 'CRYPTO'")
    op.execute("UPDATE assets SET type = 'real_estate' WHERE type = 'REAL_ESTATE'")
    op.execute("UPDATE transactions SET type = 'buy' WHERE type = 'BUY'")
    op.execute("UPDATE transactions SET type = 'sell' WHERE type = 'SELL'")

def downgrade() -> None:
    op.execute("UPDATE assets SET type = 'STOCKS' WHERE type = 'stocks'")
    op.execute("UPDATE assets SET type = 'CRYPTO' WHERE type = 'crypto'")
    op.execute("UPDATE assets SET type = 'REAL_ESTATE' WHERE type = 'real_estate'")
    op.execute("UPDATE transactions SET type = 'BUY' WHERE type = 'buy'")
    op.execute("UPDATE transactions SET type = 'SELL' WHERE type = 'sell'")
