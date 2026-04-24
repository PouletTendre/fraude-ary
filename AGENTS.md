# Fraude-Ary — Agent Context

> This file is the single source of truth for AI agents working on Fraude-Ary. Read it fully before making any change.

## Project Identity

**Name:** Fraude-Ary  
**Type:** Multi-asset portfolio tracking platform (Finary alternative)  
**Deployment:** Self-hosted via Docker + GitHub Actions (self-hosted runner)  
**URL:** http://localhost (production), http://localhost:3000 (frontend dev), http://localhost:8000 (backend dev)

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Nginx     │──────▶│  Frontend   │      │   Backend   │
│  (Port 80)  │      │  (Next.js)  │◀─────▶│  (FastAPI)  │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                     ┌─────────────┐      ┌────────┴────────┐
                     │    Redis    │◀─────▶│   PostgreSQL    │
                     │   (Cache)   │      │   (Database)    │
                     └─────────────┘      └─────────────────┘
```

**Request flow:**
1. User → Nginx (port 80)
2. Nginx routes `/api/*` and `/auth/*` → backend:8000
3. Nginx routes everything else → frontend:3000
4. Frontend SSR or client-side React
5. Browser API calls go through Nginx to backend

## Tech Stack

### Backend (`apps/backend/`)
- **FastAPI** 0.111 — Async web framework
- **SQLAlchemy 2.0** — Async ORM
- **Alembic** — Database migrations
- **Pydantic v2** — Validation
- **python-jose** — JWT
- **passlib** — Password hashing (bcrypt)
- **httpx** — Async HTTP client
- **yfinance** — Yahoo Finance fallback
- **apscheduler** — Background tasks (price refresh every 5min)
- **slowapi** — Rate limiting (100 req/min)
- **redis.asyncio** — Cache

### Frontend (`apps/frontend/`)
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript 5.4**
- **Tailwind CSS 3.4**
- **TanStack Query v5** — Server state
- **Recharts** — Charts
- **Lucide React** — Icons

### Infrastructure (`infra/`)
- **Docker & Docker Compose**
- **PostgreSQL 16**
- **Redis 7**
- **Nginx** — Reverse proxy
- **GitHub Actions** — Self-hosted runner CI/CD

## Directory Structure

```
fraude-ary/
├── AGENTS.md                  ← YOU ARE HERE
├── README.md                  ← Human-facing quick start
├── docs/                      ← Exhaustive documentation
│   ├── index.md
│   ├── architecture.md
│   ├── api-reference.md
│   ├── frontend.md
│   ├── backend.md
│   ├── ci-cd.md
│   ├── development.md
│   ├── troubleshooting.md
│   └── pricing.md
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app, lifespan, scheduler
│   │   │   ├── config.py            # Settings (JWT_SECRET, DB_URL, etc.)
│   │   │   ├── database.py          # AsyncSession, engine
│   │   │   ├── models/              # SQLAlchemy models
│   │   │   │   ├── user.py
│   │   │   │   ├── asset.py
│   │   │   │   └── transaction.py
│   │   │   ├── schemas/             # Pydantic schemas
│   │   │   │   ├── auth.py
│   │   │   │   ├── assets.py
│   │   │   │   └── transactions.py
│   │   │   ├── routers/             # API endpoints
│   │   │   │   ├── auth.py          # /auth/*
│   │   │   │   ├── assets.py        # /api/v1/assets/*
│   │   │   │   ├── portfolio.py     # /api/v1/portfolio/*
│   │   │   │   ├── prices.py        # /api/v1/prices/*
│   │   │   │   ├── transactions.py  # /api/v1/transactions/*
│   │   │   │   ├── alerts.py
│   │   │   │   ├── notifications.py
│   │   │   │   ├── exchange_rates.py
│   │   │   │   ├── cache.py
│   │   │   │   ├── monitoring.py
│   │   │   │   └── demo.py
│   │   │   └── services/            # Business logic
│   │   │       ├── price_service.py
│   │   │       └── cache_service.py
│   │   ├── alembic/
│   │   │   ├── versions/            # Migration files (numbered 001, 002...)
│   │   │   └── env.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── frontend/
│       ├── app/                     # Next.js App Router
│       │   ├── (auth)/              # Route group: login, register
│       │   ├── (dashboard)/         # Route group: protected pages
│       │   │   ├── assets/page.tsx
│       │   │   ├── portfolio/page.tsx
│       │   │   ├── journal/page.tsx
│       │   │   ├── alerts/page.tsx
│       │   │   ├── notifications/page.tsx
│       │   │   ├── settings/page.tsx
│       │   │   └── layout.tsx       # Sidebar + auth guard
│       │   ├── layout.tsx           # Root layout
│       │   ├── page.tsx             # Landing / redirect
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                  # Reusable UI primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── Toast.tsx
│       │   │   └── PageTransition.tsx
│       │   ├── Sidebar.tsx
│       │   ├── MobileNav.tsx
│       │   ├── SymbolSearch.tsx     # Yahoo Finance real-time search
│       │   ├── ThemeToggle.tsx
│       │   └── DonutChart.tsx
│       ├── hooks/
│       │   ├── useAssets.ts
│       │   ├── useAuth.ts
│       │   ├── usePortfolio.ts
│       │   ├── useSettings.ts
│       │   ├── useNotifications.ts
│       │   └── useTransactions.ts
│       ├── lib/
│       │   ├── api.ts               # fetchApi wrapper (JWT, 401 redirect, 204)
│       │   └── utils.ts
│       ├── types.ts                 # All TypeScript interfaces
│       ├── next.config.js
│       └── Dockerfile
├── infra/
│   ├── docker-compose.yml           # Production compose
│   ├── docker-compose.dev.yml       # Dev compose (volumes)
│   ├── nginx.conf                   # Reverse proxy rules
│   └── Dockerfile*
├── .github/workflows/deploy.yml     # CI/CD — self-hosted runner
├── e2e/
│   └── test_features.py             # Playwright E2E tests
└── scripts/
    └── continuous_loop.sh           # Monitoring loop
```

## Code Conventions

### Backend (Python)

1. **Use type hints everywhere.**
2. **Use async/await for ALL I/O** (DB, HTTP, Redis). Never block the event loop.
3. **Keep routers thin.** Business logic goes in `services/`.
4. **Pydantic schemas** for every request/response.
5. **Enum values** must match DB exactly. For SQLAlchemy `Enum`, use:
   ```python
   Column(Enum(MyEnum, values_callable=lambda x: [e.value for e in x]))
   ```
6. **JWT expiry:** 24 hours. Token stored in `localStorage` as `"token"`.
7. **Auth format:** `OAuth2PasswordRequestForm` for login (form-data, not JSON).
8. **Migrations:** Numbered sequentially (`001`, `002`, `003`...). `down_revision` must point to the previous revision ID exactly.

### Frontend (TypeScript/React)

1. **Strict TypeScript.** No `any` unless absolutely necessary.
2. **All API calls through `lib/api.ts`.** Never use raw `fetch`.
3. **Server state via TanStack Query.** Local state via `useState`.
4. **Dark mode classes:** Always pair light + dark classes:
   ```tsx
   className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
   ```
5. **Currency formatting:** Use `formatCurrency(value, currency)` helper. Never hardcode `$`.
6. **Component files:** PascalCase. Hooks: `useCamelCase.ts`.
7. **Symbol validation:** `^[A-Z0-9.\-]{1,20}$` (supports `AIR.PA`, `BRK.B`, etc.)

### API Patterns

- List: `GET /api/v1/assets`
- Create: `POST /api/v1/assets` → returns `AssetResponse`
- Update: `PUT /api/v1/assets/{id}` → returns `AssetResponse`
- Delete: `DELETE /api/v1/assets/{id}` → returns `204 No Content`
- Bulk delete: `POST /api/v1/assets/bulk-delete` with body `{"asset_ids": [...]}` → returns `204`
- Search: `GET /api/v1/assets/search/symbols?q={query}` → proxy to Yahoo Finance

### Database Schema (Key Tables)

**assets:** id (UUID PK), user_email (FK→users.email), type (enum), symbol, quantity, purchase_price, current_price, currency, purchase_date, created_at, updated_at

**transactions:** id (UUID PK), user_email (FK), asset_id (FK→assets.id, nullable), type (buy/sell enum), symbol, quantity, unit_price, currency, exchange_rate, fees, total_invested, date, created_at

**users:** email (PK), hashed_password, full_name, created_at

## Critical Implementation Details

### Price Fetching (NO FAKE PRICES)

- **Stocks:** Primary = Yahoo Finance Chart API (`query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}`). Fallback = `yfinance` Python lib. If both fail → return `None` (never generate random prices).
- **Crypto:** CryptoCompare API (`min-api.cryptocompare.com/data/price?fsym={SYM}&tsyms=USD`).
- **Real Estate:** Static fixed prices per city (EUR/m2).
- **Cache:** Redis. Stocks 5min, Crypto 1min, Exchange rates 1h.

### Symbol Search

- Real-time search via Yahoo Finance API: `query1.finance.yahoo.com/v1/finance/search?q={query}`
- Returns symbol, name, type, exchange.
- No local symbol list. Search is exhaustive worldwide.

### Authentication Flow

1. Login → `POST /auth/login` (form-data: username, password) → returns JWT
2. Frontend stores token in `localStorage.setItem("token", token)`
3. All API calls include `Authorization: Bearer {token}`
4. Backend validates via `get_current_user` dependency
5. On 401 → frontend clears token and redirects to `/login`

### Frontend API Client (`lib/api.ts`)

```typescript
// Handles:
// - JWT injection
// - 401 redirect
// - 204 No Content (returns undefined, does NOT parse JSON)
// - Error parsing (detail field)
const data = await fetchApi<Asset[]>("/api/v1/assets");
```

### CI/CD (GitHub Actions — Self-Hosted)

**File:** `.github/workflows/deploy.yml`

**Triggers:** Push to `main`

**Steps:**
1. Acquire lock (`/tmp/fraude-ary-deploy.lock`)
2. `docker compose down --remove-orphans`
3. Force remove all `infra-*` containers
4. `docker compose build --no-cache`
5. `docker compose up -d`
6. Retry health check up to 60s
7. Release lock

**Important:** Do NOT run `docker compose build` manually when CI/CD is active. They will conflict.

### Deployment Verification

```bash
curl -s http://localhost:8000/health          # {"status": "ok"}
curl -s http://localhost/api/v1/assets/search/symbols?q=AAPL  # returns JSON
curl -s http://localhost/login | head -c 20   # HTML page
```

## Agent Workflow (4 Agents)

The project uses a 4-agent orchestration system. When implementing features:

### Front-End Agent
- Owns: `apps/frontend/`
- Concerns: UI/UX, responsive design, dark mode, API integration
- Must: Use existing hooks pattern, follow Tailwind conventions

### Back-End Agent
- Owns: `apps/backend/`
- Concerns: API design, DB schema, migrations, business logic
- Must: Add Pydantic schemas, update models, create migration, register router

### Commits Agent
- Owns: Git workflow
- Concerns: Clean commit history, conventional commits, push to `main`
- Must: `git add -A`, `git commit -m "type: description"`, `git push`

### Testing Agent
- Owns: `e2e/`
- Concerns: Playwright E2E tests, verification
- Must: Test the actual deployed application at `http://localhost`
- Validates: Feature works end-to-end before marking complete

**Loop Rule:** If tests fail, loop back to Front-End or Back-End agent, fix, re-commit, re-test.

## Testing

### E2E Tests (Playwright)

```bash
cd /root/fraude-ary
curl -s http://localhost:8000/health | grep ok || echo "App not running"
python3 -m pytest e2e/test_features.py --browser=chromium -v --base-url=http://localhost
```

Requirements: `pip install playwright pytest pytest-playwright && playwright install chromium`

### Manual Testing Checklist

- [ ] Register / Login
- [ ] Create asset with EUR currency → shows € symbol
- [ ] Create asset with dot symbol (AIR.PA) → accepted
- [ ] Delete asset → disappears immediately
- [ ] Bulk delete → multiple assets removed
- [ ] Symbol search → Yahoo Finance results appear
- [ ] Journal page → shows transactions table
- [ ] Portfolio → charts render, total value correct
- [ ] Dark mode toggle → works
- [ ] Logout / Login again → token still valid (24h)

## Common Pitfalls & How to Avoid Them

### "Container name already in use"
**Why:** CI/CD and manual `docker compose up` conflict.  
**Fix:** Wait for CI/CD. Do NOT run manual builds. If stuck: `docker stop $(docker ps -aq --filter "name=infra-") && docker rm -f $(docker ps -aq --filter "name=infra-")`

### "Could not validate credentials"
**Why:** Token expired (24h), wrong format, or backend `JWT_SECRET` changed.  
**Fix:** Log out and log back in. Check `localStorage.getItem("token")`.

### "Invalid input value for enum"
**Why:** SQLAlchemy `Enum` stores Python enum names (`BUY`) instead of values (`buy`).  
**Fix:** Always use `values_callable=lambda x: [e.value for e in x]`.

### "Symbol must be 1-10 alphanumeric characters"
**Why:** Old regex rejected dots/hyphens.  
**Fix:** Use `^[A-Z0-9.\-]{1,20}$`.

### Prices showing as random/simulated
**Why:** Old code had `random.uniform()` fallback.  
**Fix:** Already removed. If still happening, check `price_service.py` has no simulation.

### Frontend shows old code after deploy
**Why:** Next.js build cache or browser cache.  
**Fix:** Hard refresh browser (Ctrl+Shift+R). Or rebuild: `docker compose build --no-cache frontend`.

### Alembic migration fails
**Why:** `down_revision` points to wrong ID, or duplicate revision numbers.  
**Fix:** Check `grep "revision\|down_revision" alembic/versions/*.py`. Ensure chain is correct.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `devpassword123` | **CHANGE IN PROD** |
| `JWT_SECRET` | `prodsecretchange123` | **CHANGE IN PROD** |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:...` | Postgres connection |
| `REDIS_URL` | `redis://redis:6379` | Redis connection |
| `ALLOWED_ORIGINS` | `*` | CORS origins |

## Quick Commands

```bash
# Start everything
cd infra && docker compose up -d --build

# Check logs
docker compose logs -f backend
docker compose logs -f frontend

# DB console
docker exec -it infra-postgres-1 psql -U postgres -d fraudeary

# Run migrations manually
docker exec infra-backend-1 alembic upgrade head

# Test backend directly
curl -s http://localhost:8000/health
curl -s http://localhost:8000/api/v1/assets/search/symbols?q=AAPL

# Run E2E tests
cd /root/fraude-ary && python3 -m pytest e2e/ --browser=chromium -v

# Force rebuild after manual changes (ONLY if CI/CD is NOT running)
cd infra
docker compose down --remove-orphans
docker ps -aq --filter "name=infra-" | xargs -r docker rm -f
docker compose up -d --build
```

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2024-04 | Self-hosted over SaaS | Financial data privacy |
| 2024-04 | Next.js App Router | SSR, nested layouts |
| 2024-04 | FastAPI + async SQLAlchemy | Native async, auto-docs |
| 2024-04 | Yahoo Finance for stocks | Most comprehensive symbol DB |
| 2024-04 | CryptoCompare for crypto | Generous free limits |
| 2024-04 | JWT 24h expiry | Balance security vs UX |
| 2024-04 | No simulated prices | User demands real market data |
| 2024-04 | 4-agent workflow | Parallel front/back dev + test loop |

## Communication Rules for Agents

1. **Read this file first** before any code change.
2. **Make minimal changes.** One feature per commit.
3. **Follow existing patterns.** If unsure, grep for similar code.
4. **Test before declaring done.** Backend tests via curl, frontend via Playwright.
5. **Never skip migrations** when changing models.
6. **Never manually build Docker** while CI/CD is running.
7. **Document new endpoints** in `docs/api-reference.md`.
8. **Use conventional commits:** `feat:`, `fix:`, `docs:`, `ci:`, `test:`.
9. **Currency matters.** Never hardcode `$`. Use `formatCurrency(value, asset.currency)`.
10. **No fake data.** Prices must come from real APIs.
11. **Orchestrator pattern is mandatory — 4-agent workflow.** The current agent is the orchestrator ONLY and must NEVER write significant code itself. For every non-trivial task (feature, bug fix, refactor spanning >2 files), you MUST spawn exactly 4 specialized sub-agents via the `task` tool:
    - **Front-End Agent** — owns `apps/frontend/`
    - **Back-End Agent** — owns `apps/backend/`
    - **Commits Agent** — owns `git add`, `git commit`, `git push`
    - **Testing Agent** — owns `e2e/` Playwright validation
    **If you have 2 tasks, that means 8 sub-agents total.** Parallelize Front-End and Back-End work for each task simultaneously. After both are done, the Commits Agent commits everything, then the Testing Agent runs E2E tests. If tests fail, loop back to Front-End or Back-End agent, fix, re-commit, re-test. Use `subagent_type: "general"` for all implementation work.

## Contact / Ownership

- **Repository:** https://github.com/PouletTendre/fraude-ary
- **Maintainer:** User (self-hosted)
- **License:** MIT
