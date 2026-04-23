"""initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('email', sa.String(), primary_key=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'assets',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_email', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('CRYPTO', 'STOCKS', 'REAL_ESTATE', name='assettype'), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('purchase_price', sa.Float(), nullable=False),
        sa.Column('current_price', sa.Float(), default=0.0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_table(
        'price_history',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('asset_id', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_assets_user_email', 'assets', ['user_email'])
    op.create_index('ix_price_history_asset_id', 'price_history', ['asset_id'])

def downgrade() -> None:
    op.drop_index('ix_price_history_asset_id', table_name='price_history')
    op.drop_index('ix_assets_user_email', table_name='assets')
    op.drop_table('price_history')
    op.drop_table('assets')
    op.drop_table('users')