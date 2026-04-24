# Development Guide

## Development Environment Setup

### Option 1: Docker (Recommended)

```bash
cd fraude-ary/infra
docker compose -f docker-compose.dev.yml up -d
```

This mounts source directories as volumes for hot reload.

### Option 2: Local Development

**Backend:**
```bash
cd apps/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd apps/frontend
npm install
npm run dev
```

## Code Conventions

### TypeScript / Frontend

- Use strict TypeScript with explicit return types
- Prefer functional components with hooks
- Use `cn()` utility for conditional class names
- Follow the existing component structure in `components/ui/`
- All API calls go through `lib/api.ts`

### Python / Backend

- Follow PEP 8 style guide
- Use type hints on all function signatures
- Use async/await for I/O operations
- Keep routers thin, put business logic in services
- Use Pydantic schemas for request/response validation

### Git Workflow

**Branch naming:**
- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation
- `refactor/description` — Code refactoring

**Commit messages (Conventional Commits):**
```
feat: add price alert notifications
fix: handle 204 responses in delete operations
docs: update API reference
ci: add container cleanup step
refactor: extract price fetching logic
```

## Adding a New Feature

### Example: Adding a New API Endpoint

1. **Define the schema** in `app/schemas/`:
```python
from pydantic import BaseModel

class MyFeatureCreate(BaseModel):
    name: str
    value: float
```

2. **Create the router** in `app/routers/`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/my-feature")
async def create_feature(data: MyFeatureCreate):
    return {"status": "created"}
```

3. **Register the router** in `app/main.py`:
```python
from app.routers import my_feature
app.include_router(my_feature.router, prefix="/api/v1/my-feature", tags=["my-feature"])
```

4. **Add frontend integration** in a new hook:
```typescript
export function useMyFeature() {
  return useQuery({
    queryKey: ["my-feature"],
    queryFn: () => fetchApi("/api/v1/my-feature"),
  });
}
```

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Token expires after 24h and redirects to login

**Assets:**
- [ ] Create asset with valid data
- [ ] Create asset with invalid symbol shows error
- [ ] Create asset with dot symbol (e.g., `AIR.PA`)
- [ ] Delete asset removes it from list
- [ ] Symbol search finds Yahoo Finance results
- [ ] Custom symbol works when no search results

**Portfolio:**
- [ ] Portfolio summary shows correct total
- [ ] Charts render without errors
- [ ] Dark mode toggles correctly

**Prices:**
- [ ] Real prices fetched for stocks (AAPL, TSLA)
- [ ] Real prices fetched for crypto (BTC, ETH)
- [ ] Price refresh updates current prices

## Database Operations

### Connecting to PostgreSQL

```bash
docker exec -it infra-postgres-1 psql -U postgres -d fraudeary
```

### Common Queries

```sql
-- List all users
SELECT email, full_name, created_at FROM users;

-- List all assets
SELECT symbol, type, quantity, purchase_price, current_price FROM assets;

-- Portfolio value
SELECT SUM(quantity * current_price) as total_value FROM assets;

-- Clear all data (careful!)
TRUNCATE assets, price_history, price_alerts, notifications CASCADE;
```

## Debugging Tips

### Frontend

- Open browser DevTools → Network tab to inspect API calls
- Check `localStorage` for token validity
- Use React DevTools to inspect component state
- Check Docker logs: `docker logs infra-frontend-1 -f`

### Backend

- Check API response in browser Network tab
- Test endpoints directly with curl
- Check backend logs: `docker logs infra-backend-1 -f`
- Verify database connection: `docker exec infra-backend-1 python -c "from app.database import async_session; print('OK')"`

### Common Issues

**"Could not validate credentials"**
- Token expired → Re-login
- Wrong auth header format → Must be `Bearer <token>`

**"Container name already in use"**
- Run `docker compose down --remove-orphans`
- Or `docker rm -f <container-id>`

**Frontend shows old code**
- Next.js caches pages aggressively
- Force rebuild: `docker compose build --no-cache frontend`
- Or clear browser cache (Ctrl+Shift+R)
