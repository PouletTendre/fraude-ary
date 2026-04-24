# Fraude-Ary

Fraude-Ary is a multi-asset portfolio tracking platform inspired by Finary. Track your investments across cryptocurrencies, stocks, and real estate with real-time price updates, performance analytics, and a modern responsive interface.

## Features

- **Multi-Asset Support**: Crypto, stocks, and real estate in one dashboard
- **Real-Time Prices**: Live market data via Yahoo Finance (stocks) and CryptoCompare (crypto)
- **Exhaustive Symbol Search**: Search any stock or crypto worldwide via Yahoo Finance API
- **Portfolio Analytics**: Total value, P&L, allocation charts, volatility, Sharpe ratio
- **Price Alerts**: Get notified when assets hit target prices
- **Dark Mode**: Full dark/light theme support
- **CSV Import/Export**: Bulk import assets or export your portfolio
- **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites
- Docker & Docker Compose v2
- Git

### Production Deployment

```bash
git clone https://github.com/PouletTendre/fraude-ary.git
cd fraude-ary/infra
docker compose up -d --build
```

Access the app at **http://localhost**

### Development Setup

```bash
cd fraude-ary/infra
docker compose -f docker-compose.dev.yml up -d
```

## Default Credentials

- **Email**: `demo@fraude-ary.com`
- **Password**: `demo123456`

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, configuration, and first steps |
| [Architecture](docs/architecture.md) | System architecture, tech stack, and database schema |
| [API Reference](docs/api-reference.md) | Complete REST API documentation |
| [Frontend Guide](docs/frontend.md) | Components, hooks, pages, and state management |
| [Backend Guide](docs/backend.md) | Services, models, authentication, and background tasks |
| [CI/CD & Deployment](docs/ci-cd.md) | GitHub Actions, Docker, and deployment pipeline |
| [Development Guide](docs/development.md) | Coding conventions, testing, and contribution guidelines |
| [Troubleshooting](docs/troubleshooting.md) | Common issues, FAQ, and debugging tips |
| [Pricing & Data Sources](docs/pricing.md) | Price fetching strategy and external APIs |

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

## API Overview

All API documentation is auto-generated via FastAPI and available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Key endpoints:
- `POST /auth/login` — Authentication
- `GET /api/v1/assets` — List assets
- `POST /api/v1/assets` — Create asset
- `DELETE /api/v1/assets/{id}` — Delete asset
- `GET /api/v1/assets/search/symbols?q={query}` — Search symbols via Yahoo Finance
- `GET /api/v1/portfolio/summary` — Portfolio overview
- `POST /api/v1/prices/refresh` — Refresh all prices

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

## Development Workflow

The project uses a 4-agent orchestration system:

1. **Front-End Agent**: Develops the Next.js frontend
2. **Back-End Agent**: Develops the FastAPI backend
3. **Tester Agent**: Tests the application and reports issues
4. **Commits Agent**: Validates commits and manages the Git workflow

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes following the [Development Guide](docs/development.md)
3. Commit with conventional commits: `git commit -m "feat: add new feature"`
4. Push and create a pull request

## License

MIT License — see LICENSE file for details.

## Acknowledgments

- Inspired by [Finary](https://finary.com)
- Price data provided by Yahoo Finance and CryptoCompare
