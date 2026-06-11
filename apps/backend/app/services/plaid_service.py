import logging
import uuid
from typing import List, Dict, Any
from datetime import datetime, timezone

from sqlalchemy import select, delete

from app.config import settings
from app.database import async_session
from app.models.bank_account import BankAccount, BankTransaction

logger = logging.getLogger(__name__)


def _get_plaid_client():
    """Lazy-initialise Plaid client (only when Plaid is configured)."""
    import plaid
    from plaid.api import plaid_api
    from plaid.configuration import Configuration
    from plaid.api_client import ApiClient

    env_map = {
        "sandbox": plaid.Environment.Sandbox,
        "development": plaid.Environment.Development,
        "production": plaid.Environment.Production,
    }
    env = env_map.get(settings.PLAID_ENV, plaid.Environment.Sandbox)

    configuration = Configuration(
        host=env,
        api_key={
            "clientId": settings.PLAID_CLIENT_ID,
            "secret": settings.PLAID_SECRET,
        },
    )
    api_client = ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)


def _get_fernet():
    """Get Fernet instance for encrypting/decrypting access tokens."""
    from cryptography.fernet import Fernet

    key = settings.PLAID_ENCRYPTION_KEY
    if not key:
        raise RuntimeError(
            "PLAID_ENCRYPTION_KEY is required for Plaid integration. "
            "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
        )
    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def _encrypt_token(token: str) -> str:
    f = _get_fernet()
    return f.encrypt(token.encode()).decode()


def _decrypt_token(encrypted: str) -> str:
    f = _get_fernet()
    return f.decrypt(encrypted.encode()).decode()


class PlaidService:
    """Service for Plaid bank account integration."""

    async def create_link_token(self, user_email: str) -> Dict[str, str]:
        """Create a Plaid Link token for the frontend to initialise Plaid Link."""
        from plaid.model.link_token_create_request import LinkTokenCreateRequest
        from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
        from plaid.model.products import Products
        from plaid.model.country_code import CountryCode

        client = _get_plaid_client()
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(client_user_id=user_email),
            client_name="Fraude-Ary",
            products=[Products("transactions")],
            country_codes=[CountryCode("US"), CountryCode("GB"), CountryCode("FR"), CountryCode("DE")],
            language="en",
        )
        response = client.link_token_create(request)
        return {
            "link_token": response.link_token,
            "expiration": response.expiration,
        }

    async def exchange_public_token(
        self, public_token: str, user_email: str
    ) -> Dict[str, Any]:
        """Exchange a Plaid public_token for an access_token, store encrypted."""
        from plaid.model.item_public_token_exchange_request import (
            ItemPublicTokenExchangeRequest,
        )
        from plaid.model.accounts_get_request import AccountsGetRequest

        client = _get_plaid_client()

        # Exchange public token for access token
        exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
        exchange_response = client.item_public_token_exchange(exchange_request)
        access_token = exchange_response.access_token
        item_id = exchange_response.item_id

        # Get accounts for this item
        accounts_request = AccountsGetRequest(access_token=access_token)
        accounts_response = client.accounts_get(accounts_request)
        accounts = accounts_response.accounts

        encrypted_token = _encrypt_token(access_token)

        async with async_session() as db:
            for acct in accounts:
                # Check if account already exists
                existing = await db.execute(
                    select(BankAccount).where(
                        BankAccount.plaid_account_id == acct.account_id
                    )
                )
                if existing.scalar_one_or_none():
                    logger.info(f"Account {acct.account_id} already exists, skipping")
                    continue

                bank_account = BankAccount(
                    id=str(uuid.uuid4()),
                    user_email=user_email,
                    plaid_item_id=item_id,
                    plaid_account_id=acct.account_id,
                    access_token_encrypted=encrypted_token,
                    institution_name="Unknown",  # Will be enriched via institutions API
                    account_name=acct.name,
                    account_type=acct.type.value if hasattr(acct.type, "value") else str(acct.type),
                    balance_current=float(acct.balances.current or 0),
                    balance_available=float(acct.balances.available or 0),
                    currency=acct.balances.iso_currency_code or "USD",
                )
                db.add(bank_account)

            await db.commit()

        return {
            "item_id": item_id,
            "accounts_count": len(accounts),
        }

    async def get_accounts(self, user_email: str) -> List[BankAccount]:
        """Get all bank accounts for a user."""
        async with async_session() as db:
            result = await db.execute(
                select(BankAccount)
                .where(BankAccount.user_email == user_email)
                .order_by(BankAccount.created_at.desc())
            )
            return list(result.scalars().all())

    async def get_transactions(
        self, account_id: str, user_email: str, limit: int = 100, offset: int = 0
    ) -> List[BankTransaction]:
        """Get transactions for a specific account."""
        async with async_session() as db:
            # Verify ownership
            account = await db.get(BankAccount, account_id)
            if not account or account.user_email != user_email:
                return []

            result = await db.execute(
                select(BankTransaction)
                .where(BankTransaction.account_id == account_id)
                .order_by(BankTransaction.date.desc())
                .offset(offset)
                .limit(limit)
            )
            return list(result.scalars().all())

    async def sync_transactions(self, account_id: str) -> Dict[str, Any]:
        """Sync transactions from Plaid using cursor-based sync."""
        from plaid.model.transactions_sync_request import TransactionsSyncRequest

        async with async_session() as db:
            account = await db.get(BankAccount, account_id)
            if not account:
                raise ValueError(f"Account {account_id} not found")

            access_token = _decrypt_token(account.access_token_encrypted)
            client = _get_plaid_client()

            added_count = 0
            modified_count = 0
            removed_count = 0
            cursor = None
            has_more = True

            while has_more:
                request = TransactionsSyncRequest(
                    access_token=access_token,
                    cursor=cursor,
                    count=500,
                )
                response = client.transactions_sync(request)

                # Process added transactions
                for txn in response.added:
                    if txn.account_id != account.plaid_account_id:
                        continue
                    existing = await db.execute(
                        select(BankTransaction).where(
                            BankTransaction.plaid_transaction_id == txn.transaction_id
                        )
                    )
                    if not existing.scalar_one_or_none():
                        bank_txn = BankTransaction(
                            id=str(uuid.uuid4()),
                            account_id=account.id,
                            plaid_transaction_id=txn.transaction_id,
                            date=txn.date,
                            amount=float(txn.amount),
                            name=txn.name,
                            category=[c for c in (txn.personal_finance_category or {}).values()] if txn.personal_finance_category else None,
                            pending=txn.pending,
                        )
                        db.add(bank_txn)
                        added_count += 1

                # Process modified transactions
                for txn in response.modified:
                    if txn.account_id != account.plaid_account_id:
                        continue
                    result = await db.execute(
                        select(BankTransaction).where(
                            BankTransaction.plaid_transaction_id == txn.transaction_id
                        )
                    )
                    existing_txn = result.scalar_one_or_none()
                    if existing_txn:
                        existing_txn.amount = float(txn.amount)
                        existing_txn.name = txn.name
                        existing_txn.pending = txn.pending
                        existing_txn.date = txn.date
                        modified_count += 1

                # Process removed transactions
                for txn in response.removed:
                    if txn.account_id != account.plaid_account_id:
                        continue
                    await db.execute(
                        delete(BankTransaction).where(
                            BankTransaction.plaid_transaction_id == txn.transaction_id
                        )
                    )
                    removed_count += 1

                has_more = response.has_more
                cursor = response.next_cursor

            # Update account sync timestamp
            account.last_synced = datetime.now(timezone.utc)
            await db.commit()

        return {
            "added": added_count,
            "modified": modified_count,
            "removed": removed_count,
            "next_cursor": cursor,
        }

    async def delete_account(self, account_id: str, user_email: str) -> bool:
        """Delete a bank account and all its transactions."""
        from plaid.model.item_remove_request import ItemRemoveRequest

        async with async_session() as db:
            account = await db.get(BankAccount, account_id)
            if not account or account.user_email != user_email:
                return False

            # Check if this is the last account for this Plaid item
            # (multiple accounts can share one item/access token)
            same_item = await db.execute(
                select(BankAccount).where(
                    BankAccount.plaid_item_id == account.plaid_item_id,
                    BankAccount.id != account.id,
                )
            )
            other_accounts = same_item.scalars().all()

            # If no other accounts share this item, remove the Plaid item
            if not other_accounts:
                try:
                    access_token = _decrypt_token(account.access_token_encrypted)
                    client = _get_plaid_client()
                    client.item_remove(ItemRemoveRequest(access_token=access_token))
                except Exception as e:
                    logger.warning(f"Failed to remove Plaid item: {e}")

            # Delete all transactions for this account
            await db.execute(
                delete(BankTransaction).where(BankTransaction.account_id == account_id)
            )
            # Delete the account
            await db.delete(account)
            await db.commit()

        return True

    async def handle_webhook(self, webhook_type: str, webhook_code: str, payload: Dict[str, Any]) -> None:
        """Handle Plaid webhook events."""
        logger.info(f"Plaid webhook: type={webhook_type}, code={webhook_code}")

        if webhook_type == "TRANSACTIONS" and webhook_code == "SYNC_UPDATES_AVAILABLE":
            item_id = payload.get("item_id")
            if item_id:
                await self._sync_item_accounts(item_id)

        elif webhook_type == "ITEM" and webhook_code == "ERROR":
            item_id = payload.get("item_id")
            error = payload.get("error", {})
            logger.error(f"Plaid item error for {item_id}: {error}")

        elif webhook_type == "ITEM" and webhook_code == "PENDING_EXPIRATION":
            item_id = payload.get("item_id")
            logger.warning(f"Plaid item {item_id} pending expiration — user must re-authenticate")

    async def _sync_item_accounts(self, item_id: str) -> None:
        """Sync all accounts belonging to a Plaid item."""
        async with async_session() as db:
            result = await db.execute(
                select(BankAccount).where(BankAccount.plaid_item_id == item_id)
            )
            accounts = result.scalars().all()

        for account in accounts:
            try:
                await self.sync_transactions(account.id)
            except Exception as e:
                logger.error(f"Failed to sync account {account.id}: {e}")


plaid_service = PlaidService()
