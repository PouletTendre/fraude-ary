# Fraude-Ary — Agent Context

<!-- CAVEMAN MODE — ACTIVE EVERY RESPONSE -->
<!-- Terse like caveman. Technical substance exact. Only fluff die. -->

> Single source of truth for agents. Read fully before any change.

## Architecture

```
User → Nginx :80 → Frontend (Next.js :3000) or Backend (FastAPI :8000)
                          ↕
Backend → PostgreSQL :5432, Redis :6379
```

Nginx routes: `/api/*` and `/auth/*` → backend, everything else → frontend.

## Tech Stack (versions matter)

| Layer | Tech | Version |
|-------|------|---------|
| Backend | FastAPI (async) | 0.115.6 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Migrations | Alembic | 1.14.1 |
| Frontend | Next.js App Router | 14.2.29 |
| UI | React | 18 |
| Styling | Tailwind CSS + CSS custom properties (`next-themes`) | 3.4 |
| Server state | TanStack Query | v5 |
| Auth | JWT (24h expiry) | — |
| Rate limit | slowapi | 100 req/min |
| Scheduler | apscheduler | price refresh every 5min |
| Linter (Python) | ruff | 0.8.6 |
| E2E | Playwright + pytest | — |

## Key Files (entrypoints)

```
apps/backend/app/main.py          # FastAPI app, all router registration, lifespan, scheduler
apps/backend/app/config.py        # Settings + JWT_SECRET validation (rejects known defaults)
apps/backend/app/database.py      # AsyncSession factory
apps/frontend/lib/api.ts          # fetchApi wrapper (JWT inject, 401→redirect, 204 handling)
apps/frontend/app/(dashboard)/layout.tsx  # Sidebar (inline), auth guard, theme
apps/frontend/app/globals.css     # CSS custom properties for theming (dark + .light)
infra/docker-compose.yml          # Production compose — all services defined here
infra/nginx.conf                  # Reverse proxy + rate limits + security headers
.github/workflows/deploy.yml      # CI/CD on push to main
e2e/test_features.py              # Playwright E2E tests
```

## Routers (full list)

| File | Prefix | Purpose |
|------|--------|---------|
| `auth.py` | `/auth` | Login (form-data), register, JWT |
| `assets.py` | `/api/v1/assets` | CRUD + symbol search (Yahoo Finance) |
| `transactions.py` | `/api/v1/transactions` | Buy/sell journal |
| `portfolio.py` | `/api/v1/portfolio` | Aggregated portfolio data |
| `prices.py` | `/api/v1/prices` | Price refresh + history |
| `alerts.py` | `/api/v1/alerts` | Price alerts |
| `notifications.py` | `/api/v1/notifications` | User notifications |
| `exchange_rates.py` | `/api/v1/exchange-rates` | Currency conversion |
| `dividends.py` | `/api/v1/dividends` | Dividend tracking |
| `simulator.py` | `/api/v1/simulator` | Investment simulations |
| `demo.py` | `/api/v1/demo` | Demo/test endpoints |
| `cache.py` | `/api/v1/cache` | Cache management |
| `monitoring.py` | `/api/v1/health` | Health + metrics |
| `technical.py` | `/api/v1` | Technical analysis endpoints |
| `analytics.py` | `/api/v1` | Portfolio analytics |
| `news.py` | `/api/v1` | Market news |
| `valuation.py` | `/api/v1` | Asset valuation (DCF, etc.) |

## Critical Gotchas

### Auth
- Login endpoint expects **form-data** (`OAuth2PasswordRequestForm`), NOT JSON.
- Token stored in `localStorage` key `"token"`. All API calls inject `Authorization: Bearer {token}`.
- On 401, `fetchApi` clears token + user from localStorage, redirects to `/login`.
- `JWT_SECRET` must be ≥32 chars. Config explicitly rejects known defaults (`devsecretchangeinprod`, `ci-cd-fallback-...`).

### API Client (`lib/api.ts`)
- `204 No Content` returns `undefined` (does NOT parse JSON). Callers must handle this.
- Never use raw `fetch`. Always use `fetchApi<T>(endpoint, options)`.

### Enums (SQLAlchemy)
```python
Column(Enum(MyEnum, values_callable=lambda x: [e.value for e in x]))
```
Without `values_callable`, SQLAlchemy stores Python enum names (`BUY`) instead of values (`buy`), causing validation errors.

### Symbol validation
Regex: `^[A-Z0-9.\-]{1,20}$` — supports `AIR.PA`, `BRK.B`, `BTC-USD`.

### Prices — NO FAKE DATA
- Stocks: Yahoo Finance Chart API (`query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}`). Fallback: `yfinance` lib.
- Crypto: CryptoCompare (`min-api.cryptocompare.com/data/price?fsym={SYM}&tsyms=USD`).
- Real Estate: Static fixed prices per city (EUR/m²).
- If both fail → return `None`. Never generate random/simulated prices.
- Cache: Redis. Stocks 5min, Crypto 1min, Exchange rates 1h.

### Currency
Never hardcode `$`. Use `formatCurrency(value, currency)` from `lib/utils.ts`.

### Theme / Styling
- Primary theme: CSS custom properties (`var(--bg)`, `var(--text-primary)`, `var(--border)`, etc.) defined in `globals.css`.
- `html.light` class (toggled via `next-themes`) overrides variables for light mode.
- Tailwind `dark:` classes supplement for edge cases. Prefer CSS variables for new code.
- Border radius: use CSS variables (`var(--r-md)`, `var(--r-lg)`) not Tailwind `rounded-md`.

### Migrations
- Numbered sequentially: `001_initial.py` through `011_add_foreign_keys.py`.
- `down_revision` MUST point to the previous file's `revision` exactly.
- Never skip a migration when changing models.
- Run: `docker exec infra-backend-1 alembic upgrade head`

### CI/CD (Self-hosted GitHub Actions)
- **Trigger:** Push to `main`.
- Uses deployment lock at `/tmp/fraude-ary-deploy.lock`.
- **Do NOT run `docker compose build` manually while CI/CD is active.** They conflict.
- All containers are named `infra-*`.
- Health check: curls `http://localhost/api/v1/assets/search/symbols?q=AAPL` up to 60s.

### Docker Commands
```bash
# Start (dev)
cd infra && docker compose -f docker-compose.dev.yml up -d --build

# Start (prod)
cd infra && docker compose up -d --build

# Force clean (ONLY if CI/CD is NOT running)
cd infra
docker compose down --remove-orphans
docker stop $(docker ps -aq --filter "name=infra-") 2>/dev/null || true
docker rm -f $(docker ps -aq --filter "name=infra-") 2>/dev/null || true
docker compose up -d --build
```

### DB Access
```bash
docker exec -it infra-postgres-1 psql -U app -d fraudeary
```
Note: DB user is `app` (not `postgres`).

### Deployment Verification
```bash
curl -s http://localhost:8000/health                    # {"status":"ok","database":"ok","redis":"ok"}
curl -s http://localhost/api/v1/assets/search/symbols?q=AAPL  # returns JSON results
```

### E2E Tests
```bash
cd /root/fraude-ary
curl -s http://localhost:8000/health | grep ok || echo "App not running"
python3 -m pytest e2e/test_features.py --browser=chromium -v --base-url=http://localhost
```

### Backend dev commands
```bash
# Lint
cd apps/backend && ruff check --fix .

# Run pytest
cd apps/backend && python -m pytest -v

# Run single test file
cd apps/backend && python -m pytest tests/ -k "test_name"
```

### Frontend dev commands
```bash
# Dev server
cd apps/frontend && npm run dev

# Lint
cd apps/frontend && npm run lint

# Build
cd apps/frontend && npm run build
```

## Environment Variables

| Variable | Purpose | Default (dev) |
|----------|---------|---------------|
| `POSTGRES_PASSWORD` | DB password | `devpassword123` |
| `REDIS_PASSWORD` | Redis auth | `changeme` |
| `JWT_SECRET` | JWT signing (≥32 chars) | **(must override)** |
| `DATABASE_URL` | asyncpg connection | `postgresql+asyncpg://app:...@postgres:5432/fraudeary` |
| `REDIS_URL` | Redis connection | `redis://:changeme@redis:6379/0` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost` |
| `TIINGO_API_KEY` | Tiingo data source (optional) | — |
| `TWELVE_DATA_API_KEY` | Twelve Data source (optional) | — |
| `FRED_API_KEY` | FRED macro data (optional) | — |

## Skill System

MemPalace (memory retrieval): Use `/mempalace:search <query>` before non-trivial tasks.
ECC skills available at `/root/fraude-ary/.opencode/skills/ecc/`. Load via `skill` tool.

## Branch + Orchestrator Workflow

1. Create branch: `git checkout main && git pull && git checkout -b feat/short-desc`
2. Stay on the branch until committed + pushed.
3. Spawn 4 sub-agents: frontend, backend, commits, testing.
4. Sub-agents MUST NOT run git commands. Must verify branch with `git branch --show-current`.
5. Commit on feature branch: `git add -A && git commit -m "type: description" && git push -u origin feat/short-desc`
6. Merge only after push: `gh pr create` or `git checkout main && git merge feat/short-desc --no-edit && git push origin main`

**Critical:** Never push directly to `main`. Never let sub-agents write to main.

## Hermes Agent Orchestration

Fraude-Ary is managed by **Hermes**, an autonomous AI orchestrator that coordinates 9 specialized sub-agents:

| Agent | Role | Model |
|-------|------|-------|
| **orchestrator** (Hermes) | Central coordinator, CEO interface | `deepseek-v4-pro` |
| **manager** | Sprint planning, task breakdown, GitHub issues | `MiniMax-M2.5` |
| **dev-backend** | FastAPI, PostgreSQL, API development | `deepseek-v4-pro` |
| **dev-frontend** | React, Next.js, TypeScript | `deepseek-v4-pro` |
| **dev-devops** | CI/CD, Docker, monitoring | `deepseek-v4-pro` |
| **code-reviewer** | PR review, code quality (ruff, radon) | `deepseek-v4-pro` |
| **security-expert** | OWASP audit, vulnerability scanning | `deepseek-v4-pro` |
| **tester** | pytest, Playwright E2E, smoke tests | `MiniMax-M2.5` |
| **documentation** | Tech docs, API reference | `MiniMax-M2.5` |
| **communication** | Daily standups, CEO briefings, changelogs | `MiniMax-M2.5` |

**Architecture:** Hermes runs 24/7 on Hermes Agent platform. Sub-agents are invoked via `delegate_task` with dedicated skill prompts. Shared state at `~/fraude-ary-company/shared/state/`.

**Cron schedule:**
- Daily Standup: Mon-Fri 08:00
- Weekly CEO Briefing: Friday 17:00

**Setup date:** 2026-04-28
