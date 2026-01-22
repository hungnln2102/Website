---
name: Rollback & Recovery
description: Safely rollback deployments and recover from production issues
---

# Rollback & Recovery Skill

## Purpose
Quickly and safely revert problematic deployments and recover from production incidents.

## When to Use
- Critical bugs in production
- Performance degradation
- Data corruption detected
- Security vulnerability found
- High error rates

## Rollback Decision Matrix

### When to Rollback
- ✅ Critical functionality broken
- ✅ Error rate >5%
- ✅ Severe performance degradation (>50% slower)
- ✅ Data corruption occurring
- ✅ Security vulnerability introduced
- ✅ Cannot fix forward quickly (<30 min)

### When to Fix Forward
- ✅ Minor bug with workaround
- ✅ Quick fix available (<15 min)
- ✅ Issue affects <1% of users
- ✅ Rollback would cause data loss

## Rollback Procedures

### 1. Immediate Assessment
```bash
# Check current status
curl https://api.yourapp.com/health

# Check error rates
# Review monitoring dashboard
# Check user reports
```

**Quick Checklist:**
- [ ] Severity confirmed (critical/high/medium)
- [ ] Impact assessed (% users affected)
- [ ] Rollback decision made
- [ ] Team notified

### 2. Application Rollback

#### Git-based Rollback
```bash
# 1. Identify last good version
git log --oneline -10

# 2. Create rollback branch
git checkout -b rollback/v1.2.3

# 3. Revert to last good commit
git reset --hard abc123

# 4. Force push (if needed)
git push origin rollback/v1.2.3 --force

# 5. Deploy previous version
npm run deploy:production -- --version=v1.2.3
```

#### Docker Rollback
```bash
# 1. List recent images
docker images | grep myapp

# 2. Rollback to previous image
docker service update --image myapp:v1.2.3 myapp-service

# 3. Verify rollback
docker service ps myapp-service
```

#### Kubernetes Rollback
```bash
# 1. Check rollout history
kubectl rollout history deployment/myapp

# 2. Rollback to previous revision
kubectl rollout undo deployment/myapp

# 3. Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=3

# 4. Check rollout status
kubectl rollout status deployment/myapp
```

### 3. Database Rollback

#### Migration Rollback
```bash
# 1. Check current migration version
npm run migrate:status

# 2. Rollback last migration
npm run migrate:down

# 3. Verify database state
npm run migrate:status

# 4. Test application
npm run test:integration
```

#### Database Restore
```bash
# 1. Stop application (prevent writes)
kubectl scale deployment/myapp --replicas=0

# 2. Backup current state (just in case)
pg_dump -h localhost -U user myapp > backup_before_restore.sql

# 3. Restore from backup
pg_restore -h localhost -U user -d myapp backup_20240101.dump

# 4. Verify data
psql -h localhost -U user -d myapp -c "SELECT COUNT(*) FROM users;"

# 5. Restart application
kubectl scale deployment/myapp --replicas=3
```

### 4. Verification

```bash
# Health check
curl https://api.yourapp.com/health

# Version check
curl https://api.yourapp.com/version

# Smoke tests
npm run test:smoke:production

# Monitor metrics
# - Error rate should be <1%
# - Response time normal
# - No spike in 5xx errors
```

**Verification Checklist:**
- [ ] Application responding
- [ ] Health checks passing
- [ ] Error rate normalized
- [ ] Performance acceptable
- [ ] Critical features working
- [ ] No data corruption

### 5. Communication

#### Incident Notification Template
```markdown
🚨 INCIDENT ALERT

**Status**: Rollback in progress
**Severity**: Critical
**Impact**: 30% of users unable to login
**Action**: Rolling back to v1.2.3
**ETA**: 10 minutes

**Timeline:**
- 14:30 - Issue detected
- 14:35 - Rollback initiated
- 14:40 - Rollback complete (estimated)

**Updates:** Will provide updates every 5 minutes
```

#### Resolution Notification
```markdown
✅ INCIDENT RESOLVED

**Status**: Resolved
**Resolution**: Rolled back to v1.2.3
**Duration**: 15 minutes
**Impact**: Login functionality restored

**Next Steps:**
- Root cause analysis scheduled
- Fix planned for next deployment
- Post-mortem on Friday

**Apologies** for the disruption.
```

## Recovery Procedures

### Data Recovery

#### Point-in-Time Recovery
```bash
# Restore database to specific timestamp
pg_restore --time "2024-01-01 14:30:00" backup.dump
```

#### Selective Data Recovery
```sql
-- Restore specific records from backup
INSERT INTO users 
SELECT * FROM backup_users 
WHERE id IN (123, 456, 789);
```

### Service Recovery

#### Restart Services
```bash
# Kubernetes
kubectl rollout restart deployment/myapp

# Docker
docker-compose restart

# PM2
pm2 restart myapp
```

#### Clear Cache
```bash
# Redis
redis-cli FLUSHALL

# Application cache
curl -X POST https://api.yourapp.com/admin/cache/clear
```

## Post-Rollback Actions

### 1. Incident Report
```markdown
# Incident Report - [Date]

## Summary
Brief description of what happened

## Timeline
- 14:30 - Issue detected
- 14:35 - Rollback initiated
- 14:45 - Service restored

## Root Cause
What caused the issue

## Impact
- Duration: 15 minutes
- Users affected: 30%
- Revenue impact: $500 estimated

## Resolution
How it was fixed (rollback to v1.2.3)

## Prevention
- Add integration test for this scenario
- Improve staging testing
- Add monitoring alert

## Action Items
- [ ] Fix bug in v1.2.4
- [ ] Add test coverage
- [ ] Update deployment checklist
```

### 2. Root Cause Analysis
- What happened?
- Why did it happen?
- How was it detected?
- How was it resolved?
- How can we prevent it?

### 3. Preventive Measures
- Add tests to prevent regression
- Improve monitoring/alerting
- Update deployment checklist
- Enhance staging environment
- Conduct team retrospective

## Rollback Checklist

### Pre-Rollback
- [ ] Severity confirmed
- [ ] Impact assessed
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Communication prepared

### During Rollback
- [ ] Application rolled back
- [ ] Database rolled back (if needed)
- [ ] Cache cleared (if needed)
- [ ] Services restarted
- [ ] Updates communicated

### Post-Rollback
- [ ] Service verified working
- [ ] Metrics normalized
- [ ] Users notified
- [ ] Incident documented
- [ ] Post-mortem scheduled

## Best Practices

### Preparation
- Maintain rollback procedures
- Test rollback in staging
- Keep recent backups
- Document recovery steps
- Practice incident response

### Execution
- Act quickly but carefully
- Communicate frequently
- Verify each step
- Monitor metrics
- Document actions

### Learning
- Conduct post-mortems
- Share lessons learned
- Update procedures
- Improve prevention
- Train team

## Emergency Contacts
```markdown
**On-Call Engineer**: [Phone]
**DevOps Lead**: [Phone]
**CTO**: [Phone]
**Status Page**: https://status.yourapp.com
```
