---
name: Deploy & Release Management
description: Comprehensive deployment and release management skill for safely shipping code to production
---

# Deploy & Release Management Skill

## Purpose
This skill guides you through the complete deployment process, from pre-deployment checks to post-deployment monitoring, ensuring safe and reliable releases.

## When to Use This Skill
- Deploying new features to production
- Releasing hotfixes
- Setting up deployment pipelines
- Managing environment configurations
- Rolling back problematic deployments

## Deployment Workflow

### 1. Pre-Deployment Preparation
**Objective**: Ensure code is ready for deployment

#### Code Quality Checks
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] No linting errors
- [ ] TypeScript compilation successful
- [ ] Build process completes without errors

#### Documentation
- [ ] CHANGELOG.md updated with changes
- [ ] API documentation updated (if applicable)
- [ ] README.md updated (if needed)
- [ ] Migration scripts documented
- [ ] Rollback plan documented

#### Dependencies
- [ ] All dependencies up to date
- [ ] No known security vulnerabilities (npm audit)
- [ ] Lock files committed (package-lock.json, yarn.lock)
- [ ] Production dependencies only in production build

#### Environment Configuration
- [ ] Environment variables documented
- [ ] Secrets properly configured
- [ ] Database migrations ready
- [ ] Feature flags configured
- [ ] Third-party services configured

### 2. Build Process
**Objective**: Create production-ready artifacts

#### Frontend Build
```bash
# Install dependencies
npm ci --production

# Run build
npm run build

# Verify build output
ls -la dist/

# Check bundle size
npm run analyze-bundle

# Test production build locally
npm run preview
```

#### Backend Build
```bash
# Install dependencies
npm ci --production

# Compile TypeScript
npm run build

# Run database migrations (dry-run)
npm run migrate:dry-run

# Verify build
node dist/index.js --version
```

#### Build Optimization
- [ ] Minification enabled
- [ ] Source maps generated (for debugging)
- [ ] Assets optimized (images, fonts)
- [ ] Code splitting configured
- [ ] Tree shaking enabled
- [ ] Compression enabled (gzip/brotli)

### 3. Testing in Staging
**Objective**: Validate deployment in production-like environment

#### Deployment to Staging
```bash
# Deploy to staging
npm run deploy:staging

# Verify deployment
curl https://staging.yourapp.com/health

# Check version
curl https://staging.yourapp.com/version
```

#### Staging Tests
- [ ] Smoke tests pass
- [ ] Critical user flows work
- [ ] Database migrations successful
- [ ] API endpoints responding correctly
- [ ] Authentication/authorization working
- [ ] Third-party integrations working
- [ ] Performance acceptable

#### Load Testing (if applicable)
```bash
# Run load tests
npm run load-test:staging

# Check metrics
# - Response times
# - Error rates
# - Resource usage
```

### 4. Production Deployment
**Objective**: Deploy to production safely

#### Pre-Deployment Checklist
- [ ] Staging tests passed
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured
- [ ] Team available for support

#### Deployment Strategies

##### Blue-Green Deployment
```bash
# Deploy to green environment
npm run deploy:green

# Test green environment
npm run test:green

# Switch traffic to green
npm run switch:green

# Monitor for issues
npm run monitor

# If issues, switch back to blue
npm run switch:blue
```

##### Canary Deployment
```bash
# Deploy to canary (5% traffic)
npm run deploy:canary --traffic=5

# Monitor canary metrics
npm run monitor:canary

# Gradually increase traffic
npm run deploy:canary --traffic=25
npm run deploy:canary --traffic=50
npm run deploy:canary --traffic=100

# If issues, rollback
npm run rollback:canary
```

##### Rolling Deployment
```bash
# Deploy to instances one by one
npm run deploy:rolling

# Monitor each instance
# - Health checks
# - Error rates
# - Response times
```

#### Database Migrations
```bash
# Backup database
npm run db:backup

# Run migrations
npm run migrate:up

# Verify migrations
npm run migrate:status

# If issues, rollback migrations
npm run migrate:down
```

### 5. Post-Deployment Verification
**Objective**: Ensure deployment was successful

#### Health Checks
```bash
# Check application health
curl https://api.yourapp.com/health

# Check database connectivity
curl https://api.yourapp.com/health/db

# Check external services
curl https://api.yourapp.com/health/external
```

#### Smoke Tests
- [ ] Homepage loads
- [ ] User can login
- [ ] Critical features work
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] File uploads work
- [ ] Email sending works

#### Monitoring
- [ ] Error rates normal
- [ ] Response times acceptable
- [ ] CPU/Memory usage normal
- [ ] Database performance normal
- [ ] No spike in 4xx/5xx errors
- [ ] User sessions stable

### 6. Monitoring & Alerting
**Objective**: Detect and respond to issues quickly

#### Key Metrics to Monitor
- **Application Metrics**
  - Request rate
  - Error rate (4xx, 5xx)
  - Response time (p50, p95, p99)
  - Throughput

- **Infrastructure Metrics**
  - CPU usage
  - Memory usage
  - Disk usage
  - Network I/O

- **Business Metrics**
  - User signups
  - Transactions
  - Revenue
  - Active users

#### Alerting Rules
```yaml
# Example alert configuration
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: Slow Response Time
    condition: p95_response_time > 2s
    duration: 5m
    severity: warning
    
  - name: High CPU Usage
    condition: cpu_usage > 80%
    duration: 10m
    severity: warning
```

### 7. Rollback Procedure
**Objective**: Quickly revert to previous version if issues occur

#### When to Rollback
- Critical functionality broken
- High error rates (>5%)
- Severe performance degradation
- Data corruption detected
- Security vulnerability introduced

#### Rollback Steps
```bash
# 1. Identify last known good version
git log --oneline

# 2. Rollback application
npm run deploy:rollback --version=v1.2.3

# 3. Rollback database (if needed)
npm run migrate:down

# 4. Verify rollback
curl https://api.yourapp.com/version

# 5. Monitor metrics
npm run monitor

# 6. Notify stakeholders
echo "Rollback completed to version v1.2.3"
```

#### Post-Rollback
- [ ] Verify application working
- [ ] Check error rates normalized
- [ ] Notify users (if needed)
- [ ] Create incident report
- [ ] Plan fix for next deployment

## Deployment Environments

### Development
- **Purpose**: Local development
- **Data**: Fake/seed data
- **Updates**: Continuous (every code change)
- **Access**: Developers only

### Staging
- **Purpose**: Pre-production testing
- **Data**: Sanitized production data or realistic test data
- **Updates**: Before each production deployment
- **Access**: Team + stakeholders

### Production
- **Purpose**: Live application
- **Data**: Real user data
- **Updates**: Scheduled releases
- **Access**: All users

## Environment Configuration

### Environment Variables
```bash
# .env.development
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost/myapp_dev

# .env.staging
NODE_ENV=staging
API_URL=https://api-staging.yourapp.com
DATABASE_URL=postgresql://staging-db/myapp_staging

# .env.production
NODE_ENV=production
API_URL=https://api.yourapp.com
DATABASE_URL=postgresql://prod-db/myapp_prod
```

### Secrets Management
- Use environment variables for secrets
- Never commit secrets to git
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Use different secrets per environment

## CI/CD Pipeline

### Example GitHub Actions Workflow
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: npm run deploy:staging
      - name: Run smoke tests
        run: npm run test:smoke:staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: npm run deploy:production
      - name: Run smoke tests
        run: npm run test:smoke:production
      - name: Notify team
        run: echo "Deployment successful!"
```

## Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Changelog updated
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Staging tested
- [ ] Team notified

### During Deployment
- [ ] Build successful
- [ ] Deployment script completed
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] Monitoring active

### After Deployment
- [ ] Verify critical features
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify database migrations
- [ ] Update documentation
- [ ] Notify stakeholders

## Common Deployment Issues

### Build Failures
- **Cause**: Dependency issues, compilation errors
- **Fix**: Check build logs, verify dependencies, fix compilation errors

### Database Migration Failures
- **Cause**: Schema conflicts, data inconsistencies
- **Fix**: Test migrations in staging, have rollback plan

### Environment Variable Issues
- **Cause**: Missing or incorrect environment variables
- **Fix**: Verify all required variables set, check values

### Performance Degradation
- **Cause**: Inefficient code, database queries, resource constraints
- **Fix**: Profile application, optimize queries, scale resources

### Third-Party Service Issues
- **Cause**: API changes, rate limiting, service outages
- **Fix**: Check service status, verify API keys, implement retries

## Best Practices

### Version Control
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases in git
- Maintain changelog
- Use feature branches

### Testing
- Comprehensive test coverage
- Test in staging before production
- Automated smoke tests
- Load testing for high-traffic apps

### Monitoring
- Set up comprehensive monitoring
- Configure meaningful alerts
- Monitor business metrics
- Regular health checks

### Communication
- Notify team before deployments
- Document deployment process
- Create incident reports
- Share deployment status

### Security
- Scan for vulnerabilities
- Use HTTPS everywhere
- Implement rate limiting
- Regular security audits

## Resources

- [The Twelve-Factor App](https://12factor.net/)
- [Deployment Strategies](https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/deployment-strategies.html)
- [Database Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [CI/CD Best Practices](https://docs.github.com/en/actions/deployment/about-deployments/deploying-with-github-actions)
