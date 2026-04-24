"""add purchase_price_eur

Revision ID: 006
Revises: 005
Create Date: 2026-04-24 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('assets', sa.Column('purchase_price_eur', sa.Float(), nullable=True))

    # Backfill existing assets using the first associated BUY transaction's exchange_rate.
    # purchase_price_eur = purchase_price * exchange_rate (converts native currency to EUR).
    # If no BUY transaction exists, assume EUR and use purchase_price as-is.
    op.execute("""
        UPDATE assets
        SET purchase_price_eur = COALESCE(
            (SELECT t.exchange_rate * assets.purchase_price
             FROM transactions t
             WHERE t.asset_id = assets.id AND t.type = 'buy'
             ORDER BY t.date ASC, t.created_at ASC
             LIMIT 1),
            assets.purchase_price
        )
    """)


def downgrade() -> None:
    op.drop_column('assets', 'purchase_price_eur')
