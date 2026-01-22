---
name: Implementation Planning
description: Create detailed implementation plans for features and projects
---

# Implementation Planning Skill

## Purpose
Create structured implementation plans that break down complex work into manageable tasks.

## When to Use
- Starting new features
- Planning refactoring work
- Organizing large projects
- Before major code changes

## Planning Process

### 1. Understand Requirements
- Review user stories
- Clarify acceptance criteria
- Identify constraints
- List dependencies

### 2. Break Down Work
- Divide into logical components
- Identify tasks and subtasks
- Estimate effort
- Determine order

### 3. Create Plan Document

```markdown
# Implementation Plan: [Feature Name]

## Goal
What we're building and why

## Requirements Review
- [ ] Functional requirements understood
- [ ] Non-functional requirements clear
- [ ] Dependencies identified
- [ ] Constraints documented

## Proposed Changes

### Component 1: [Name]
**Files to modify:**
- `path/to/file1.ts` - Add new function
- `path/to/file2.ts` - Update logic

**Tasks:**
1. Create data model
2. Implement business logic
3. Add validation
4. Write tests

---

### Component 2: [Name]
**Files to create:**
- `path/to/new-file.ts` - New component

**Tasks:**
1. Design component structure
2. Implement UI
3. Add interactions
4. Style component

## Testing Plan
- Unit tests for business logic
- Integration tests for API
- E2E tests for user flows

## Risks & Mitigation
- **Risk**: Database migration might fail
  - **Mitigation**: Test in staging, have rollback plan

## Timeline
- Planning: 1 day
- Implementation: 3 days
- Testing: 1 day
- **Total**: 5 days
```

## Task Breakdown Template

```markdown
# Task List

## Phase 1: Setup
- [ ] Review requirements
- [ ] Set up development environment
- [ ] Create feature branch

## Phase 2: Backend
- [ ] Design database schema
- [ ] Create migrations
- [ ] Implement API endpoints
- [ ] Add validation
- [ ] Write unit tests

## Phase 3: Frontend
- [ ] Create components
- [ ] Implement UI
- [ ] Add state management
- [ ] Connect to API
- [ ] Add error handling

## Phase 4: Testing
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Manual testing
- [ ] Fix bugs

## Phase 5: Deployment
- [ ] Update documentation
- [ ] Create PR
- [ ] Code review
- [ ] Deploy to staging
- [ ] Deploy to production
```

## Best Practices

### Planning
- Start with high-level overview
- Break down into small tasks (<4 hours)
- Identify dependencies early
- Consider edge cases

### Documentation
- Be specific about changes
- Link to related files
- Document decisions
- Update as you progress

### Estimation
- Add buffer for unknowns (20-30%)
- Account for testing time
- Include code review time
- Consider deployment time

### Communication
- Share plan with team
- Get feedback early
- Update stakeholders
- Document changes

## Checklist

### Before Starting
- [ ] Requirements clear
- [ ] Plan documented
- [ ] Team reviewed plan
- [ ] Dependencies identified
- [ ] Timeline estimated

### During Implementation
- [ ] Follow plan
- [ ] Update progress
- [ ] Document changes
- [ ] Communicate blockers

### After Completion
- [ ] All tasks done
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Code reviewed
