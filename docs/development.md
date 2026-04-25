# Development Guide

## Development Environment Setup

### Option 1: Docker (Recommended)

```bash
cd fraude-ary/infra
docker compose -f docker-compose.dev.yml up -d
```

Source directories mounted as volumes for hot reload.

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

- Strict TypeScript, explicit return types
- Functional components with hooks
- `cn()` for conditional classNames
- `formatCurrency(value, currency)` from `lib/utils.ts` — **never hardcode `$`**
- All API calls via `lib/api.ts` — **never raw `fetch`**
- Server state via TanStack Query, local state via `useState`

### Python / Backend

- PEP 8, type hints on all function signatures
- `async/await` for all I/O (DB, HTTP, Redis)
- Thin routers, business logic in `services/`
- Pydantic schemas for every request/response
- **DRY**: Use `_model_to_response()` helpers, never repeat ORM→schema mapping
- **DRY**: Use `model.type_value` property, never `model.type.value if hasattr(...)`
- **Enums**: Always use `values_callable=lambda x: [e.value for e in x]` on SQLAlchemy `Enum` columns
- **Datetimes**: Use `datetime.now(timezone.utc)`, never `datetime.utcnow()`
- **Logging**: Use `logging`, never `print()`
- **Secrets**: Never hardcode. `config.py` raises `RuntimeError` if missing/insecure
- **DB sessions**: Always use `async with async_session() as db:`, never manual create/close
- **Currency**: Use `formatCurrency(value, currency)`, never hardcode `$`

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

### Example: New API Endpoint

1. **Define schema** in `app/schemas/`:
```python
from pydantic import BaseModel

class MyFeatureCreate(BaseModel):
    name: str
    value: float
```

2. **Create router** in `app/routers/`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/my-feature")
async def create_feature(data: MyFeatureCreate):
    return {"status": "created"}
```

3. **Register router** in `app/main.py`:
```python
from app.routers import my_feature
app.include_router(my_feature.router, prefix="/api/v1/my-feature", tags=["my-feature"])
```

4. **Add frontend hook** in `hooks/`:
```typescript
export function useMyFeature() {
  return useQuery({
    queryKey: ["my-feature"],
    queryFn: () => fetchApi("/api/v1/my-feature"),
  });
}
```

5. **Create migration** if adding a model:
```bash
docker exec infra-backend-1 alembic revision --autogenerate -m "add my_feature table"
docker exec infra-backend-1 alembic upgrade head
```

## Testing

### E2E Tests (Playwright)

```bash
cd /root/fraude-ary
curl -s http://localhost:8000/health | grep ok || echo "App not running"
python3 -m pytest e2e/test_features.py --browser=chromium -v --base-url=http://localhost
```

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Token expires after 24h and redirects to login

**Assets:**
- [ ] Create asset with valid data
- [ ] Create asset with dot symbol (AIR.PA) — accepted
- [ ] Create asset with EUR currency — shows € symbol
- [ ] Delete asset — disappears immediately
- [ ] Bulk delete — multiple assets removed
- [ ] Dedup — merges duplicate symbol+type
- [ ] Import CSV — bulk asset creation
- [ ] Symbol search — Yahoo Finance results appear

**Portfolio:**
- [ ] Portfolio summary shows correct total value in EUR
- [ ] Charts render without errors
- [ ] Dark mode toggles correctly

**Multi-currency:**
- [ ] Non-EUR assets show `purchase_price_eur` conversion
- [ ] Historical exchange rates applied at purchase date

## Database Operations

### Connecting to PostgreSQL

```bash
docker exec -it infra-postgres-1 psql -U postgres -d fraudeary
```

### Common Queries

```sql
SELECT email, full_name, created_at FROM users;
SELECT symbol, type, quantity, purchase_price, purchase_price_eur, current_price, currency FROM assets;
SELECT SUM(quantity * current_price) as total_value FROM assets;
TRUNCATE assets, price_history, price_alerts, notifications CASCADE;
```

## Debugging

### Frontend
- DevTools → Network tab for API calls
- `localStorage` for token validity
- React DevTools for component state
- `docker logs infra-frontend-1 -f`

### Backend
- curl endpoints directly
- `docker logs infra-backend-1 -f`
- `docker exec infra-backend-1 python -c "from app.database import async_session; print('OK')"`

### Common Issues

**"Could not validate credentials"**
- Token expired → Re-login
- Wrong auth header → Must be `Bearer <token>`

**"Container name already in use"**
- `docker compose down --remove-orphans`
- Or `docker rm -f $(docker ps -aq --filter "name=infra-")`

**Frontend shows old code**
- Hard refresh (Ctrl+Shift+R)
- Or `docker compose build --no-cache frontend`

**Alembic migration fails**
- Check `down_revision` points to correct previous ID
- `grep "revision\|down_revision" alembic/versions/*.py`