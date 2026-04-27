"""add foreign key constraints, date columns, and indices

Revision ID: 011
Revises: 010
Create Date: 2026-04-27 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '011'
down_revision: Union[str, None] = '010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Clean up orphaned records before adding FK constraints ---
    # Delete child records whose parent doesn't exist
    op.execute("DELETE FROM price_history WHERE asset_id IS NOT NULL AND asset_id NOT IN (SELECT id FROM assets)")
    op.execute("DELETE FROM transactions WHERE asset_id IS NOT NULL AND asset_id NOT IN (SELECT id FROM assets)")
    op.execute("DELETE FROM transactions WHERE user_email NOT IN (SELECT email FROM users)")
    op.execute("DELETE FROM dividends WHERE user_email NOT IN (SELECT email FROM users)")
    op.execute("DELETE FROM price_alerts WHERE user_email NOT IN (SELECT email FROM users)")
    op.execute("DELETE FROM portfolio_snapshots WHERE user_email NOT IN (SELECT email FROM users)")
    op.execute("DELETE FROM notifications WHERE user_email NOT IN (SELECT email FROM users)")
    op.execute("DELETE FROM assets WHERE user_email NOT IN (SELECT email FROM users)")

    # --- Foreign key constraints ---
    # assets → users
    op.create_foreign_key(
        "fk_assets_user_email",
        "assets", "users",
        ["user_email"], ["email"],
        ondelete="CASCADE"
    )

    # price_history → assets
    op.create_foreign_key(
        "fk_price_history_asset_id",
        "price_history", "assets",
        ["asset_id"], ["id"],
        ondelete="CASCADE"
    )

    # transactions → users
    op.create_foreign_key(
        "fk_transactions_user_email",
        "transactions", "users",
        ["user_email"], ["email"],
        ondelete="CASCADE"
    )

    # transactions → assets
    op.create_foreign_key(
        "fk_transactions_asset_id",
        "transactions", "assets",
        ["asset_id"], ["id"],
        ondelete="CASCADE"
    )

    # dividends → users
    op.create_foreign_key(
        "fk_dividends_user_email",
        "dividends", "users",
        ["user_email"], ["email"],
        ondelete="CASCADE"
    )

    # price_alerts → users
    op.create_foreign_key(
        "fk_price_alerts_user_email",
        "price_alerts", "users",
        ["user_email"], ["email"],
        ondelete="CASCADE"
    )

    # portfolio_snapshots → users
    op.create_foreign_key(
        "fk_portfolio_snapshots_user_email",
        "portfolio_snapshots", "users",
        ["user_email"], ["email"],
        ondelete="CASCADE"
    )

    # notifications → users
    op.create_foreign_key(
        "fk_notifications_user_email",
        "notifications", "users",
        ["user_email"], ["email"],
        ondelete="CASCADE"
    )

    # --- Date column type changes ---
    # Convert purchase_date from String to Date
    op.execute("ALTER TABLE assets ALTER COLUMN purchase_date TYPE date USING purchase_date::date")
    # Convert date from String to Date in transactions
    op.execute("ALTER TABLE transactions ALTER COLUMN date TYPE date USING date::date")
    # Convert date from String to Date in dividends
    op.execute("ALTER TABLE dividends ALTER COLUMN date TYPE date USING date::date")

    # --- Indices ---
    op.create_index("ix_assets_created_at", "assets", ["created_at"])
    op.create_index("ix_transactions_created_at", "transactions", ["created_at"])


def downgrade() -> None:
    # Indices
    op.drop_index("ix_transactions_created_at", table_name="transactions")
    op.drop_index("ix_assets_created_at", table_name="assets")

    # Date columns — revert to String
    op.execute("ALTER TABLE dividends ALTER COLUMN date TYPE varchar USING date::text")
    op.execute("ALTER TABLE transactions ALTER COLUMN date TYPE varchar USING date::text")
    op.execute("ALTER TABLE assets ALTER COLUMN purchase_date TYPE varchar USING purchase_date::text")

    # Foreign keys
    op.drop_constraint("fk_notifications_user_email", "notifications", type_="foreignkey")
    op.drop_constraint("fk_portfolio_snapshots_user_email", "portfolio_snapshots", type_="foreignkey")
    op.drop_constraint("fk_price_alerts_user_email", "price_alerts", type_="foreignkey")
    op.drop_constraint("fk_dividends_user_email", "dividends", type_="foreignkey")
    op.drop_constraint("fk_transactions_asset_id", "transactions", type_="foreignkey")
    op.drop_constraint("fk_transactions_user_email", "transactions", type_="foreignkey")
    op.drop_constraint("fk_price_history_asset_id", "price_history", type_="foreignkey")
    op.drop_constraint("fk_assets_user_email", "assets", type_="foreignkey")
