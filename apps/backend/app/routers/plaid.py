import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.plaid import (
    LinkTokenResponse,
    ExchangeTokenRequest,
    ExchangeTokenResponse,
    BankAccountResponse,
    BankTransactionResponse,
    SyncResponse,
)
from app.services.plaid_service import plaid_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/link-token", response_model=LinkTokenResponse)
async def create_link_token(
    current_user: User = Depends(get_current_user),
):
    """Create a Plaid Link token for the frontend."""
    try:
        result = await plaid_service.create_link_token(current_user.email)
        return LinkTokenResponse(
            link_token=result["link_token"],
            expiration=result["expiration"],
        )
    except Exception as e:
        logger.error(f"Failed to create link token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create Plaid Link token. Ensure Plaid is configured.",
        )


@router.post("/exchange-token", response_model=ExchangeTokenResponse)
async def exchange_public_token(
    request: ExchangeTokenRequest,
    current_user: User = Depends(get_current_user),
):
    """Exchange a Plaid public_token for an access_token and store accounts."""
    try:
        result = await plaid_service.exchange_public_token(
            request.public_token, current_user.email
        )
        return ExchangeTokenResponse(
            item_id=result["item_id"],
            accounts_count=result["accounts_count"],
        )
    except Exception as e:
        logger.error(f"Failed to exchange public token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to exchange Plaid token.",
        )


@router.get("/accounts", response_model=List[BankAccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
):
    """List all bank accounts for the authenticated user."""
    accounts = await plaid_service.get_accounts(current_user.email)
    return [
        BankAccountResponse(
            id=acct.id,
            institution_name=acct.institution_name,
            account_name=acct.account_name,
            account_type=acct.account_type,
            balance_current=acct.balance_current or 0.0,
            balance_available=acct.balance_available or 0.0,
            currency=acct.currency or "EUR",
            last_synced=acct.last_synced,
        )
        for acct in accounts
    ]


@router.get(
    "/accounts/{account_id}/transactions",
    response_model=List[BankTransactionResponse],
)
async def list_transactions(
    account_id: str,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
):
    """List transactions for a specific bank account."""
    transactions = await plaid_service.get_transactions(
        account_id, current_user.email, limit=limit, offset=offset
    )
    return [
        BankTransactionResponse(
            id=txn.id,
            account_id=txn.account_id,
            date=txn.date,
            amount=txn.amount,
            name=txn.name,
            category=txn.category,
            pending=txn.pending,
        )
        for txn in transactions
    ]


@router.post("/sync/{account_id}", response_model=SyncResponse)
async def sync_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
):
    """Trigger a transaction sync for a specific account from Plaid."""
    try:
        result = await plaid_service.sync_transactions(account_id)
        return SyncResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to sync transactions for {account_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync transactions from Plaid.",
        )


@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a bank account and all its transactions."""
    success = await plaid_service.delete_account(account_id, current_user.email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or not owned by user.",
        )
    return {"detail": "Account deleted successfully"}


@router.post("/webhook")
async def plaid_webhook(request: Request):
    """Handle Plaid webhook events. No authentication required."""
    try:
        body = await request.json()
        webhook_type = body.get("webhook_type", "")
        webhook_code = body.get("webhook_code", "")

        await plaid_service.handle_webhook(webhook_type, webhook_code, body)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing error",
        )
