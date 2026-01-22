---
name: Work Recap & Documentation
description: Document completed work and create comprehensive summaries
---

# Work Recap & Documentation Skill

## Purpose
Create clear documentation of completed work for team communication and future reference.

## When to Use
- After completing features
- End of sprint/milestone
- Before handoff to team
- Creating release notes

## Recap Document Template

```markdown
# Work Recap: [Feature/Sprint Name]

## Summary
Brief overview of what was accomplished

## Completed Work

### Feature 1: [Name]
**What was done:**
- Implemented user authentication
- Added password reset flow
- Created email templates

**Files changed:**
- `src/auth/login.ts` - New login logic
- `src/auth/reset.ts` - Password reset
- `templates/email.html` - Email template

**Testing:**
- ✅ Unit tests added (15 tests)
- ✅ Integration tests passing
- ✅ Manual testing completed

---

### Feature 2: [Name]
**What was done:**
- Description of work

**Impact:**
- Performance improved by 30%
- User experience enhanced
- Bug fixed

## Metrics
- Lines of code: +500, -200
- Tests added: 25
- Bugs fixed: 8
- Performance: 30% faster

## Challenges & Solutions
**Challenge:** Database migration failed in staging
**Solution:** Added rollback script, tested thoroughly

## Lessons Learned
- Always test migrations in staging first
- Add more logging for debugging
- Consider edge cases earlier

## Next Steps
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Gather user feedback
- [ ] Plan next iteration
```

## Release Notes Template

```markdown
# Release Notes - v1.2.0

## 🎉 New Features
- **User Profiles**: Users can now customize their profiles
- **Dark Mode**: Added dark mode support
- **Export Data**: Export data to CSV/JSON

## 🐛 Bug Fixes
- Fixed login redirect issue (#123)
- Resolved memory leak in dashboard (#145)
- Corrected date formatting (#167)

## ⚡ Performance
- Reduced page load time by 40%
- Optimized database queries
- Implemented caching layer

## 🔒 Security
- Updated dependencies with security patches
- Added rate limiting to API
- Improved password validation

## 📝 Documentation
- Updated API documentation
- Added user guide
- Improved README

## 🔄 Breaking Changes
- API endpoint `/api/v1/users` changed to `/api/v2/users`
- Migration required: Run `npm run migrate`

## 📦 Dependencies
- Updated React to v18.2.0
- Updated Node.js to v18.0.0
- Added new dependency: `zod` for validation
```

## Sprint Summary Template

```markdown
# Sprint Summary - Sprint 12

## Goals
- ✅ Implement user authentication
- ✅ Add payment integration
- ⚠️ Refactor dashboard (partial)

## Completed Stories
1. **User Login** (8 points) - Completed
2. **Password Reset** (5 points) - Completed
3. **Payment Gateway** (13 points) - Completed

## Metrics
- Velocity: 26 points (target: 25)
- Bugs fixed: 12
- Code coverage: 85% (↑ from 78%)

## Highlights
- Successfully integrated Stripe payment
- Improved test coverage significantly
- Reduced technical debt

## Challenges
- Third-party API downtime delayed testing
- Database performance issues required optimization

## Action Items
- [ ] Complete dashboard refactoring next sprint
- [ ] Investigate database performance
- [ ] Schedule security audit
```

## Best Practices

### Documentation
- Write clearly and concisely
- Use bullet points for readability
- Include code examples where helpful
- Add screenshots/recordings for UI changes

### Metrics
- Track meaningful metrics
- Compare to previous periods
- Highlight improvements
- Note areas for improvement

### Communication
- Focus on impact, not just tasks
- Explain technical decisions
- Share lessons learned
- Acknowledge team contributions

### Organization
- Group related items together
- Use consistent formatting
- Link to relevant resources
- Keep it scannable

## Checklist

### Before Writing Recap
- [ ] All work completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Metrics collected

### Recap Content
- [ ] Summary of work
- [ ] Files changed listed
- [ ] Testing documented
- [ ] Challenges noted
- [ ] Next steps identified

### After Writing
- [ ] Team reviewed
- [ ] Stakeholders notified
- [ ] Documentation published
- [ ] Feedback incorporated
