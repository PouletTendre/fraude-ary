"""add alert currency

Revision ID: 007
Revises: 006
Create Date: 2026-04-25 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('price_alerts', sa.Column('currency', sa.String(), nullable=True))
    op.execute("UPDATE price_alerts SET currency = 'EUR'")
    op.alter_column('price_alerts', 'currency', nullable=False)


def downgrade() -> None:
    op.drop_column('price_alerts', 'currency')
