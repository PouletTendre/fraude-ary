"""add bank accounts and bank transactions tables

Revision ID: 012
Revises: 011
Create Date: 2026-06-11 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '012'
down_revision: Union[str, None] = '011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- bank_accounts table ---
    op.create_table(
        "bank_accounts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.Column("plaid_item_id", sa.String(), nullable=False),
        sa.Column("plaid_account_id", sa.String(), nullable=False),
        sa.Column("access_token_encrypted", sa.String(), nullable=False),
        sa.Column("institution_name", sa.String(), nullable=False),
        sa.Column("account_name", sa.String(), nullable=False),
        sa.Column("account_type", sa.String(), nullable=False),
        sa.Column("balance_current", sa.Float(), server_default="0.0"),
        sa.Column("balance_available", sa.Float(), server_default="0.0"),
        sa.Column("currency", sa.String(), server_default="EUR"),
        sa.Column("last_synced", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_email"], ["users.email"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_bank_accounts_user_email", "bank_accounts", ["user_email"])
    op.create_index("ix_bank_accounts_plaid_item_id", "bank_accounts", ["plaid_item_id"], unique=True)
    op.create_unique_constraint("uq_bank_accounts_plaid_account_id", "bank_accounts", ["plaid_account_id"])

    # --- bank_transactions table ---
    op.create_table(
        "bank_transactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("account_id", sa.String(), nullable=False),
        sa.Column("plaid_transaction_id", sa.String(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.JSON(), nullable=True),
        sa.Column("pending", sa.Boolean(), server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["account_id"], ["bank_accounts.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_bank_transactions_account_id", "bank_transactions", ["account_id"])
    op.create_unique_constraint(
        "uq_bank_transactions_plaid_transaction_id",
        "bank_transactions",
        ["plaid_transaction_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_bank_transactions_account_id", table_name="bank_transactions")
    op.drop_constraint("uq_bank_transactions_plaid_transaction_id", "bank_transactions", type_="unique")
    op.drop_table("bank_transactions")

    op.drop_index("ix_bank_accounts_plaid_item_id", table_name="bank_accounts")
    op.drop_index("ix_bank_accounts_user_email", table_name="bank_accounts")
    op.drop_constraint("uq_bank_accounts_plaid_account_id", "bank_accounts", type_="unique")
    op.drop_table("bank_accounts")
