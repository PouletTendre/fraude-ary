"""Add price alerts, portfolio snapshots, and notifications

Revision ID: 003
Revises: 002
Create Date: 2026-04-23 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'price_alerts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_email', sa.String(), nullable=False, index=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('target_price', sa.Float(), nullable=False),
        sa.Column('condition', sa.Enum('ABOVE', 'BELOW', name='alertcondition'), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        'portfolio_snapshots',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_email', sa.String(), nullable=False, index=True),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_value', sa.Float(), nullable=False),
    )
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_email', sa.String(), nullable=False, index=True),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), default=False, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('portfolio_snapshots')
    op.drop_table('price_alerts')
    op.drop_enum('alertcondition')
