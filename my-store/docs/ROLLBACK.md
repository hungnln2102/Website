# Rollback Procedures

## Overview

This document outlines procedures for rolling back deployments and recovering from production issues.

## When to Rollback

Rollback immediately if:
- ✅ Critical functionality is broken
- ✅ Error rate exceeds 5%
- ✅ Severe performance degradation (>50% slower)
- ✅ Data corruption is occurring
- ✅ Security vulnerability discovered
- ✅ Cannot fix forward within 30 minutes

## Rollback Procedures

### Application Rollback

#### Option 1: Git-based Rollback

```bash
# 1. Identify last known good version
git log --oneline -10

# 2. Checkout previous version
git checkout <commit-hash>

# 3. Rebuild
npm ci
npm run build

# 4. Restart services
pm2 restart my-store-api
```

#### Option 2: PM2 Rollback

```bash
# If you have previous version saved
pm2 stop my-store-api
cd /path/to/previous/version
pm2 start dist/index.js --name my-store-api
```

#### Option 3: Docker Rollback

```bash
# Rollback to previous image
docker-compose down
docker-compose up -d my-store-api:previous-tag
```

### Database Rollback

#### Migration Rollback

```bash
# Check current migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:down

# Verify
npm run db:migrate:status
```

#### Database Restore from Backup

```bash
# 1. Stop application (prevent writes)
pm2 stop my-store-api

# 2. Backup current state (safety)
pg_dump $DATABASE_URL > backup_before_restore_$(date +%Y%m%d_%H%M%S).sql

# 3. Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 4. Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 5. Restart application
pm2 start my-store-api
```

## Verification After Rollback

### Health Checks

```bash
# 1. Basic health
curl https://api.yourapp.com/health

# 2. Database health
curl https://api.yourapp.com/health/db

# 3. Readiness
curl https://api.yourapp.com/health/ready
```

### Smoke Tests

```bash
# Test critical endpoints
curl https://api.yourapp.com/products
curl https://api.yourapp.com/categories
```

### Monitoring

- Check error rates (should be <1%)
- Verify response times are normal
- Confirm no spike in 5xx errors
- Monitor user sessions

## Communication

### Incident Notification Template

```markdown
🚨 INCIDENT ALERT

**Status**: Rollback in progress
**Severity**: Critical
**Impact**: [Description of impact]
**Action**: Rolling back to version [version]
**ETA**: [Estimated time]

**Timeline:**
- [Time] - Issue detected
- [Time] - Rollback initiated
- [Time] - Rollback complete (estimated)

**Next Update**: [Time]
```

### Resolution Notification

```markdown
✅ INCIDENT RESOLVED

**Status**: Resolved
**Resolution**: Rolled back to version [version]
**Duration**: [Duration]
**Impact**: [Description]

**Next Steps:**
- Root cause analysis scheduled
- Fix planned for next deployment
- Post-mortem meeting scheduled

Thank you for your patience.
```

## Post-Rollback Actions

### 1. Incident Report

Create incident report documenting:
- What happened
- When it was detected
- How it was resolved
- Impact assessment
- Root cause
- Prevention measures

### 2. Root Cause Analysis

Schedule meeting to discuss:
- Timeline of events
- What went wrong
- Why it wasn't caught earlier
- How to prevent in future

### 3. Update Procedures

- Add tests to prevent regression
- Update deployment checklist
- Improve monitoring/alerting
- Enhance staging environment

## Rollback Checklist

### Pre-Rollback
- [ ] Severity confirmed
- [ ] Impact assessed
- [ ] Team notified
- [ ] Rollback version identified
- [ ] Communication prepared

### During Rollback
- [ ] Application stopped/rolled back
- [ ] Database rolled back (if needed)
- [ ] Cache cleared (if needed)
- [ ] Services restarted
- [ ] Team updated

### Post-Rollback
- [ ] Service verified working
- [ ] Metrics normalized
- [ ] Users notified
- [ ] Incident documented
- [ ] Post-mortem scheduled

## Emergency Contacts

```
On-Call Engineer: [Phone/Email]
DevOps Lead: [Phone/Email]
CTO: [Phone/Email]
Status Page: https://status.yourapp.com
```

## Prevention

### Before Deployment
- Comprehensive testing in staging
- Code review by 2+ engineers
- Automated tests passing
- Performance testing completed
- Rollback plan documented

### Monitoring
- Set up alerts for error rates
- Monitor response times
- Track user sessions
- Database performance monitoring

### Regular Drills
- Practice rollback procedures quarterly
- Update documentation
- Train new team members
- Review and improve process
