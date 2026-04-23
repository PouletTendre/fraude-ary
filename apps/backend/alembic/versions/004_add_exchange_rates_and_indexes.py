"""Add exchange rates and indexes

Revision ID: 004
Revises: 003
Create Date: 2026-04-23 22:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'exchange_rates',
        sa.Column('currency', sa.String(), primary_key=True),
        sa.Column('rate_vs_usd', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_assets_user_email', 'assets', ['user_email'])
    op.create_index('ix_assets_symbol', 'assets', ['symbol'])
    op.create_index('ix_assets_type', 'assets', ['type'])
    op.create_index('ix_price_history_asset_id', 'price_history', ['asset_id'])
    op.create_index('ix_price_history_timestamp', 'price_history', ['timestamp'])
    op.create_index('ix_price_alerts_symbol', 'price_alerts', ['symbol'])
    op.create_index('ix_portfolio_snapshots_date', 'portfolio_snapshots', ['date'])


def downgrade() -> None:
    op.drop_index('ix_portfolio_snapshots_date', table_name='portfolio_snapshots')
    op.drop_index('ix_price_alerts_symbol', table_name='price_alerts')
    op.drop_index('ix_price_history_timestamp', table_name='price_history')
    op.drop_index('ix_price_history_asset_id', table_name='price_history')
    op.drop_index('ix_assets_type', table_name='assets')
    op.drop_index('ix_assets_symbol', table_name='assets')
    op.drop_index('ix_assets_user_email', table_name='assets')
    op.drop_table('exchange_rates')
