# Fraude-Ary

Fraude-Ary is a multi-asset portfolio tracking platform inspired by Finary. It allows users to track their investments across cryptocurrencies, stocks, and real estate with real-time price updates and performance analytics.

## Features

- **Multi-Asset Support**: Track cryptocurrencies, stocks, and real estate investments
- **Real-Time Price Updates**: Automatic price fetching via CoinGecko (crypto) and Yahoo Finance (stocks) with fallback simulation
- **Portfolio Analytics**: View total value, gain/loss, allocation by asset type, and performance metrics
- **Interactive Charts**: Area charts, pie charts, and price history visualizations using Recharts
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Native dark mode support
- **Export**: Export portfolio data in JSON or CSV format

## Tech Stack

### Backend
- **FastAPI** (Python 3.12) - High-performance API framework
- **SQLAlchemy 2.0** (async) - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Price caching (TTL: 60s crypto, 300s stocks)
- **Alembic** - Database migrations
- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - 100 requests/minute per IP

### Frontend
- **Next.js 14** (App Router) - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization
- **TanStack Query v5** - Server state management
- **TypeScript** - Type safety

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD with self-hosted runner

## Quick Start

### Prerequisites
- Docker & Docker Compose v2
- Git

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/PouletTendre/fraude-ary.git
cd fraude-ary
```

2. Start the development environment:
```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
```

3. Run database migrations:
```bash
docker exec infra-backend-1 alembic upgrade head
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Production Deployment

1. Start production containers:
```bash
cd infra
docker compose up -d --build
```

2. The application will be available at http://localhost (via Nginx)

## Default Credentials

For testing purposes:
- **Email**: demo@fraude-ary.com
- **Password**: demo123456

## API Endpoints

### Authentication
- `POST /auth/login` - Login with OAuth2 form-data (username, password)
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user

### Assets
- `GET /api/v1/assets` - List all assets
- `GET /api/v1/assets/{type}` - List assets by type (crypto, stocks, real_estate)
- `POST /api/v1/assets` - Create new asset
- `PUT /api/v1/assets/{id}` - Update asset
- `DELETE /api/v1/assets/{id}` - Delete asset
- `GET /api/v1/assets/{id}/history` - Get asset price history

### Portfolio
- `GET /api/v1/portfolio/summary` - Get portfolio summary
- `GET /api/v1/portfolio/statistics` - Get portfolio statistics (volatility, Sharpe ratio, best/worst assets)
- `GET /api/v1/portfolio/export?format=json|csv` - Export portfolio data

### Prices
- `POST /api/v1/prices/refresh` - Refresh all asset prices

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

1. **Front-End Agent**: Develops and improves the Next.js frontend
2. **Back-End Agent**: Develops and improves the FastAPI backend
3. **Tester Agent**: Continuously tests the application and reports bugs/features
4. **Commits Agent**: Validates commits and manages the Git workflow

### CI/CD Pipeline

- **Continuous Integration**: Linting and testing on pull requests
- **Continuous Deployment**: Automatic deployment on push to main branch
- **Self-Hosted Runner**: Runs on the deployment VM

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Commit with conventional commits: `git commit -m "feat: add new feature"`
4. Push and create a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Inspired by [Finary](https://finary.com)
- Price data provided by CoinGecko and Yahoo Finance