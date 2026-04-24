# Fraude-Ary Documentation

Welcome to the Fraude-Ary documentation. Fraude-Ary is a multi-asset portfolio tracking platform inspired by Finary, allowing users to track investments across cryptocurrencies, stocks, and real estate with real-time price updates and performance analytics.

## Documentation Structure

| Document | Description |
|----------|-------------|
| [Getting Started](getting-started.md) | Installation, configuration, and first steps |
| [Architecture](architecture.md) | System architecture, tech stack, and design decisions |
| [API Reference](api-reference.md) | Complete REST API documentation |
| [Frontend Guide](frontend.md) | Frontend components, hooks, and pages |
| [Backend Guide](backend.md) | Backend services, models, and database schema |
| [CI/CD & Deployment](ci-cd.md) | Deployment pipeline, GitHub Actions, and infrastructure |
| [Development Guide](development.md) | Coding conventions, testing, and contribution guidelines |
| [Troubleshooting](troubleshooting.md) | Common issues, FAQ, and debugging tips |
| [Pricing & Data Sources](pricing.md) | Price fetching strategy and external APIs |

## Project Overview

### What is Fraude-Ary?

Fraude-Ary is a self-hosted portfolio tracker that gives you full control over your financial data. Unlike SaaS alternatives, your data stays on your own infrastructure.

### Key Features

- **Multi-Asset Support**: Crypto, stocks, and real estate in one place
- **Real-Time Prices**: Live prices via Yahoo Finance (stocks) and CryptoCompare (crypto)
- **Exhaustive Symbol Search**: Search any stock or crypto symbol worldwide via Yahoo Finance API
- **Portfolio Analytics**: Total value, P&L, allocation charts, volatility, Sharpe ratio
- **Price Alerts**: Set target prices and get notified
- **Dark Mode**: Full dark mode support
- **CSV Import/Export**: Import bulk assets or export your portfolio
- **Responsive Design**: Works on desktop, tablet, and mobile

### Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, TypeScript |
| Backend | FastAPI, SQLAlchemy 2.0 (async), Python 3.12 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Proxy | Nginx |
| CI/CD | GitHub Actions + Self-hosted runner |
| Containers | Docker & Docker Compose |
