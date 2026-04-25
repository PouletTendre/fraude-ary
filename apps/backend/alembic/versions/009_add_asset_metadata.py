"""add asset metadata fields

Revision ID: 009
Revises: 008
Create Date: 2026-04-25 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '009'
down_revision: Union[str, None] = '008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('assets', sa.Column('sector', sa.String(), nullable=True))
    op.add_column('assets', sa.Column('country', sa.String(), nullable=True))
    op.add_column('assets', sa.Column('industry', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('assets', 'industry')
    op.drop_column('assets', 'country')
    op.drop_column('assets', 'sector')
