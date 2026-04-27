# Getting Started

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- Git
- 2GB RAM minimum, 4GB recommended
- Linux/macOS (Windows with WSL2)

## Quick Start (Production)

1. Clone the repository:
```bash
git clone https://github.com/PouletTendre/fraude-ary.git
cd fraude-ary
```

2. Start all services:
```bash
cd infra
docker compose up -d --build
```

3. Wait for services to be healthy (10-15 seconds):
```bash
docker compose ps
```

4. Access the application:
- **Web App**: http://localhost
- **API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

## Development Setup

For local development with hot reload:

```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
```

This mounts local directories as volumes for live code changes.

## Default Credentials

A demo account is available for testing:
- **Email**: `demo@fraude-ary.com`
- **Password**: `demo1234`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `devpassword123` |
| `JWT_SECRET` | Secret for JWT tokens | `prodsecretchange123` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql+asyncpg://postgres:...` |
| `ALLOWED_ORIGINS` | CORS origins | `*` |

**Important**: Change `JWT_SECRET` and `POSTGRES_PASSWORD` in production.

## First Steps

1. Register a new account at `/register`
2. Log in at `/login`
3. Add your first asset at `/assets`:
   - Select type (crypto, stocks, real estate)
   - Search for the symbol (e.g., `AAPL`, `BTC`, `AIR.PA`)
   - Enter quantity and purchase price
   - Set purchase date
4. View your portfolio summary at `/portfolio`
5. Set price alerts at `/alerts`

## Updating the Application

```bash
cd infra
docker compose down --remove-orphans
docker compose up -d --build
```

Or simply push to the `main` branch — the CI/CD pipeline handles the rest.
