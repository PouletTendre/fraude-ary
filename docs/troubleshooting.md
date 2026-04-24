# Troubleshooting & FAQ

## Common Issues

### Asset Deletion Not Working

**Symptom:** Clicking "Delete" does nothing or shows an error.

**Cause:** The backend returns `204 No Content`, but the frontend tried to parse an empty JSON body.

**Fix:** Already fixed in `lib/api.ts`. The client now handles 204 responses correctly by returning `undefined`.

**Verification:**
```bash
curl -X DELETE http://localhost:8000/api/v1/assets/<id> \
  -H "Authorization: Bearer <token>" \
  -w "\nHTTP Code: %{http_code}\n"
# Should return HTTP Code: 204
```

### Prices Are Not Real

**Symptom:** Prices look random or don't match market prices.

**Cause:** Earlier versions used `random.uniform()` as a fallback when APIs failed.

**Fix:** The fallback simulation has been completely removed. Now the system only returns real prices from:
- Yahoo Finance Chart API (stocks)
- CryptoCompare API (crypto)
- Fixed static prices (real estate)

**Verification:**
```bash
curl -s "http://localhost:8000/api/v1/prices/current/AAPL"
# Should return a real market price like 273.43
```

### Symbol Search Shows No Results

**Symptom:** Typing a symbol shows no dropdown results.

**Possible causes:**
1. **Network error** — Check browser DevTools Network tab
2. **CORS blocked** — Verify `ALLOWED_ORIGINS` includes your domain
3. **Backend down** — Check `http://localhost:8000/health`
4. **Yahoo Finance API down** — Try again in a few minutes

**Verification:**
```bash
curl "http://localhost/api/v1/assets/search/symbols?q=AAPL"
```

### Symbol Validation Rejects Valid Symbols

**Symptom:** Error "Symbol must be 1-10 alphanumeric characters" for symbols like `AIR.PA`.

**Cause:** The regex only allowed `A-Z0-9`.

**Fix:** Updated regex to `^[A-Z0-9.\-]{1,20}$` which allows dots and hyphens.

### "Container Name Already in Use" Error

**Symptom:** CI/CD fails with container conflict.

**Cause:** Old containers weren't cleaned up before the new build.

**Fix:** The CI/CD workflow now includes a cleanup step before building. If it still happens locally:
```bash
docker compose down --remove-orphans
docker ps -aq --filter "name=infra-" | xargs -r docker rm -f
docker compose up -d --build
```

### 401 Unauthorized on API Calls

**Symptom:** All API calls fail with "Could not validate credentials".

**Causes:**
1. **Token expired** — JWT tokens expire after 24 hours. Re-login.
2. **Missing token** — Check `localStorage.getItem("token")` in browser console
3. **Wrong format** — Token must be sent as `Authorization: Bearer <token>`
4. **Backend secret changed** — If `JWT_SECRET` was rotated, old tokens become invalid

**Fix:** Log out and log back in to get a fresh token.

### Frontend Shows Blank Page After Deploy

**Symptom:** White screen or 404 errors after deployment.

**Causes:**
1. **Next.js build cache** — Old pages cached by the browser or Next.js
2. **Container not rebuilt** — The frontend image wasn't rebuilt with new code

**Fix:**
```bash
# Force rebuild without cache
cd infra
docker compose build --no-cache frontend
docker compose up -d frontend

# Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Database Connection Errors

**Symptom:** Backend logs show `Connection refused` to PostgreSQL.

**Cause:** PostgreSQL container isn't ready when backend starts.

**Fix:** The docker-compose has `depends_on` with `condition: service_healthy`. If it still fails:
```bash
docker compose restart backend
```

## FAQ

### Can I use this without Docker?

Yes, but not recommended. You need PostgreSQL and Redis running locally, plus Python 3.12 and Node 20. See [Development Guide](development.md) for local setup.

### How do I change the JWT token expiry?

Edit `apps/backend/app/routers/auth.py`:
```python
expire = datetime.utcnow() + timedelta(hours=24)  # Change this
```

### Can I add more asset types?

Yes. Add the new type to:
1. `AssetType` enum in `apps/backend/app/models/asset.py`
2. Frontend type definitions in `apps/frontend/types.ts`
3. Frontend dropdown options in `apps/frontend/app/(dashboard)/assets/page.tsx`
4. Price fetching logic in `apps/backend/app/services/price_service.py`

### How do I back up my data?

```bash
# Export PostgreSQL database
docker exec infra-postgres-1 pg_dump -U postgres fraudeary > backup.sql

# Import
docker exec -i infra-postgres-1 psql -U postgres -d fraudeary < backup.sql
```

### Can I host this on a VPS?

Yes. The CI/CD is designed for a self-hosted runner. Just:
1. Install Docker on your VPS
2. Add the VPS as a self-hosted runner in GitHub Settings
3. Push to `main` — it deploys automatically

### How do I update the real estate prices?

Edit `REAL_ESTATE_PRICES` dictionary in `apps/backend/app/services/price_service.py`:
```python
REAL_ESTATE_PRICES = {
    "paris": 12500,    # EUR/m2
    "lyon": 5500,
    # Add your cities here
}
```

### Why is the symbol search powered by Yahoo Finance?

Yahoo Finance has the most comprehensive symbol database, covering:
- US stocks (NYSE, NASDAQ)
- European stocks (Euronext, Xetra, LSE)
- Asian stocks
- Cryptocurrencies
- ETFs, mutual funds, futures

This allows users to search any tradable asset worldwide without maintaining a local database.

### The app is slow. How do I speed it up?

1. **Enable caching** — Redis is already configured, ensure it's running
2. **Reduce API calls** — Prices are cached for 60s (crypto) / 300s (stocks)
3. **Check network** — If self-hosted, ensure good bandwidth to Yahoo Finance / CryptoCompare
4. **Database indexing** — Ensure asset indexes exist:
   ```sql
   CREATE INDEX idx_assets_user_email ON assets(user_email);
   CREATE INDEX idx_assets_symbol ON assets(symbol);
   ```
