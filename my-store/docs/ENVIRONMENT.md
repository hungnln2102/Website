# Environment Configuration

## Development (.env.development)

```bash
# Server
NODE_ENV=development
PORT=4001
DATABASE_URL=postgresql://user:password@localhost:5432/mystore_dev

# CORS
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=debug
```

## Staging (.env.staging)

```bash
# Server
NODE_ENV=staging
PORT=4001
DATABASE_URL=postgresql://user:password@staging-db:5432/mystore_staging

# CORS
CORS_ORIGIN=https://staging.yourapp.com

# Logging
LOG_LEVEL=info

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Production (.env.production)

```bash
# Server
NODE_ENV=production
PORT=4001
DATABASE_URL=postgresql://user:password@prod-db:5432/mystore_prod

# CORS
CORS_ORIGIN=https://yourapp.com

# Logging
LOG_LEVEL=warn

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment name |
| `PORT` | Yes | 4001 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `CORS_ORIGIN` | Yes | * | Allowed CORS origins |
| `LOG_LEVEL` | No | info | Logging level (debug, info, warn, error) |
| `SENTRY_DSN` | No | - | Sentry error tracking DSN |
| `RATE_LIMIT_MAX` | No | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW` | No | 15 | Rate limit window (minutes) |

## Setup Instructions

1. Copy example files:
```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

2. Update values for your environment

3. Never commit `.env` files to git

4. Use environment-specific files for deployments
