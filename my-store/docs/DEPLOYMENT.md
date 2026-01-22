# Deployment Guide

## Overview

This guide covers deploying the my-store application to production environments.

## Prerequisites

- Node.js 18+ installed on server
- PostgreSQL database (managed service recommended)
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

### 1. Environment Variables

Create `.env` files for each environment:

**apps/server/.env.production**
```bash
NODE_ENV=production
PORT=4001
DATABASE_URL=postgresql://user:password@host:5432/mystore_prod
CORS_ORIGIN=https://yourapp.com
```

**apps/web/.env.production**
```bash
VITE_API_URL=https://api.yourapp.com
```

### 2. Database Setup

```bash
# Run migrations
npm run db:migrate

# Verify connection
npm run db:studio
```

## Deployment Options

### Option 1: Traditional Server (VPS)

#### 1. Install Dependencies

```bash
# On server
git clone <repository-url>
cd my-store
npm ci --production
```

#### 2. Build Applications

```bash
npm run build
```

#### 3. Setup Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
cd apps/server
pm2 start dist/index.js --name my-store-api

# Start with auto-restart
pm2 startup
pm2 save
```

#### 4. Setup Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/mystore

# API Server
server {
    listen 80;
    server_name api.yourapp.com;
    
    location / {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourapp.com;
    root /var/www/my-store/apps/web/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mystore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourapp.com -d api.yourapp.com
```

### Option 2: Docker Deployment

#### 1. Create Dockerfiles

**apps/server/Dockerfile**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
RUN npm ci
COPY . .
RUN npm run build --workspace server

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package*.json ./
RUN npm ci --production
EXPOSE 4001
CMD ["node", "dist/index.js"]
```

**apps/web/Dockerfile**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci
COPY . .
RUN npm run build --workspace web

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Docker Compose

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped
```

```bash
# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Cloud Platforms

#### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod
```

#### Railway/Render (Backend)

1. Connect GitHub repository
2. Set environment variables
3. Configure build command: `npm run build --workspace server`
4. Configure start command: `node apps/server/dist/index.js`

## Post-Deployment

### 1. Health Checks

```bash
# Check API health
curl https://api.yourapp.com/health

# Check database connection
curl https://api.yourapp.com/health/db

# Check readiness
curl https://api.yourapp.com/health/ready
```

### 2. Monitoring Setup

#### PM2 Monitoring

```bash
pm2 monit
pm2 logs my-store-api
```

#### Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to S3 or backup storage
```

## Rollback Procedure

### Quick Rollback

```bash
# With PM2
pm2 stop my-store-api
git checkout <previous-commit>
npm ci
npm run build --workspace server
pm2 restart my-store-api

# With Docker
docker-compose down
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Rollback

```bash
# Rollback last migration
npm run db:migrate:down

# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Performance Optimization

### 1. Enable Compression

```javascript
// In server
import compression from 'compression';
app.use(compression());
```

### 2. Setup CDN

- Use Cloudflare or similar CDN
- Configure caching rules
- Enable Brotli compression

### 3. Database Optimization

```bash
# Create indexes
npm run db:studio
# Add indexes in Prisma schema
```

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Database credentials rotated
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Backup strategy in place

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs my-store-api --lines 100

# Check environment variables
pm2 env 0

# Restart
pm2 restart my-store-api
```

### Database connection issues

```bash
# Test connection
psql $DATABASE_URL

# Check migrations
npm run db:migrate:status
```

### High memory usage

```bash
# Monitor
pm2 monit

# Restart with memory limit
pm2 start dist/index.js --name my-store-api --max-memory-restart 500M
```

## Maintenance

### Regular Tasks

- Weekly: Review logs and errors
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Review and optimize infrastructure

### Updates

```bash
# Update dependencies
npm update
npm audit fix

# Test in staging
npm test
npm run build

# Deploy to production
# Follow deployment steps above
```

## Support

For deployment issues:
1. Check logs first
2. Review health check endpoints
3. Consult documentation
4. Contact DevOps team
