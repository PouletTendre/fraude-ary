"""add currency and transactions

Revision ID: 005
Revises: 004_add_exchange_rates_and_indexes
Create Date: 2026-04-24 08:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004_add_exchange_rates_and_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add currency column to assets
    op.add_column('assets', sa.Column('currency', sa.String(), nullable=True))
    
    # Create transactions table
    op.create_table('transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_email', sa.String(), nullable=False),
        sa.Column('asset_id', sa.String(), nullable=True),
        sa.Column('type', sa.Enum('buy', 'sell', name='transactiontype'), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=True),
        sa.Column('exchange_rate', sa.Float(), nullable=True),
        sa.Column('fees', sa.Float(), nullable=True),
        sa.Column('total_invested', sa.Float(), nullable=False),
        sa.Column('date', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_asset_id'), 'transactions', ['asset_id'], unique=False)
    op.create_index(op.f('ix_transactions_user_email'), 'transactions', ['user_email'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_transactions_user_email'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_asset_id'), table_name='transactions')
    op.drop_table('transactions')
    op.drop_column('assets', 'currency')
