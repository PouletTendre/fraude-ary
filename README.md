# Fraude-Ary

Multi-asset portfolio tracking platform. Track crypto, stocks, real estate with real-time prices, analytics, and responsive UI.

## Features

- **Multi-Asset**: Crypto, stocks, real estate in one dashboard
- **Real-Time Prices**: Yahoo Finance (stocks) + CryptoCompare (crypto)
- **Symbol Search**: Worldwide search via Yahoo Finance API
- **Portfolio Analytics**: Total value, P&L, allocation, volatility, Sharpe ratio
- **Multi-Currency**: EUR, USD, GBP, JPY, CHF with auto conversion
- **Price Alerts**: Target price notifications
- **Dark Mode**: Full dark/light theme
- **CSV Import/Export**: Bulk operations
- **Responsive**: Desktop, tablet, mobile

## Quick Start

### Prerequisites
- Docker & Docker Compose v2
- Git

### Production

```bash
git clone https://github.com/PouletTendre/fraude-ary.git
cd fraude-ary/infra
docker compose up -d --build
```

Access at **http://localhost**

### Development

```bash
cd fraude-ary/infra
docker compose -f docker-compose.dev.yml up -d
```

### Default Credentials

- **Email**: `demo@fraude-ary.com`
- **Password**: `demo123456`

> **Warning**: Change `JWT_SECRET`, `POSTGRES_PASSWORD`, and `DATABASE_URL` in production. The app refuses to start if `JWT_SECRET` is a known default.

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, configuration |
| [Architecture](docs/architecture.md) | System design, DB schema |
| [API Reference](docs/api-reference.md) | REST API docs |
| [Frontend Guide](docs/frontend.md) | Components, hooks, state |
| [Backend Guide](docs/backend.md) | Services, models, auth |
| [CI/CD & Deployment](docs/ci-cd.md) | GitHub Actions, Docker |
| [Development Guide](docs/development.md) | Conventions, testing |
| [Troubleshooting](docs/troubleshooting.md) | Common issues |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Python 3.12 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Proxy | Nginx |
| CI/CD | GitHub Actions + Self-hosted runner |
| Containers | Docker & Docker Compose |

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

## Recent Changes

### v0.2.0 — Security & Quality Refactor

- **Security**: Removed hardcoded secrets from `config.py`. App fails fast if `JWT_SECRET` is default/empty
- **Security**: Connection pool (20 connections, overflow 10) — prevents exhaustion under load
- **DRY**: `type_value` property on models replaces 24× `hasattr(.type, 'value')` pattern
- **DRY**: Extracted `_asset_to_response`, `_alert_to_response`, `_notification_to_response`, `_tx_to_response` helpers
- **DRY**: Centralized `formatCurrency` in frontend `lib/utils.ts`
- **Robustness**: Fixed DB session leak in `exchange_rates.py` (manual open/close → `async with`)
- **Robustness**: Replaced 11× `datetime.utcnow()` with `datetime.now(timezone.utc)` (deprecated in Python 3.12+)
- **Robustness**: `print()` → `logging` in production code
- **Robustness**: SQLAlchemy `Enum` columns now use `values_callable` for proper DB storage
- **Config**: `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 1440 (24h), matching actual JWT expiry
- **Config**: `echo=True` only in development, not production

## API Overview

Auto-generated docs at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Key endpoints:
- `POST /auth/login` — Authentication
- `GET /api/v1/assets` — List assets
- `POST /api/v1/assets` — Create asset
- `POST /api/v1/assets/bulk-delete` — Delete multiple assets
- `POST /api/v1/assets/dedup` — Merge duplicate assets
- `POST /api/v1/assets/import` — CSV import
- `GET /api/v1/assets/search/symbols?q={query}` — Symbol search
- `GET /api/v1/portfolio/summary` — Portfolio overview
- `GET /api/v1/portfolio/statistics` — Volatility, Sharpe ratio

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make changes following [Development Guide](docs/development.md)
3. Commit with conventional commits: `git commit -m "feat: add new feature"`
4. Push and create a pull request

## License

MIT License — see LICENSE file.