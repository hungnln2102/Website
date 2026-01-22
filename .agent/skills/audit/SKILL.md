---
name: Code Audit & Quality Review
description: Comprehensive code audit skill for reviewing code quality, security, performance, and best practices
---

# Code Audit & Quality Review Skill

## Purpose
This skill provides a systematic approach to auditing codebases for quality, security, performance, maintainability, and adherence to best practices.

## When to Use This Skill
- Regular code quality reviews
- Pre-deployment audits
- Security assessments
- Performance optimization reviews
- Technical debt assessment
- Onboarding new team members to codebase standards

## Audit Methodology

### 1. Initial Assessment
**Objective**: Understand the codebase scope and goals

- **Codebase Overview**
  - Project structure and organization
  - Technology stack and dependencies
  - Lines of code and complexity metrics
  - Team size and development practices

- **Define Audit Scope**
  - Full codebase or specific modules?
  - Focus areas (security, performance, quality)?
  - Time constraints and priorities
  - Deliverables expected

### 2. Code Quality Audit
**Objective**: Assess code maintainability and readability

#### Code Organization
- [ ] **Project Structure**
  - Logical folder organization
  - Clear separation of concerns
  - Consistent naming conventions
  - Appropriate file sizes (<300 lines ideal)

- [ ] **Module Design**
  - Single Responsibility Principle followed
  - Proper encapsulation
  - Clear module boundaries
  - Minimal coupling, high cohesion

#### Code Readability
- [ ] **Naming**
  - Descriptive variable names
  - Consistent naming conventions (camelCase, PascalCase)
  - Avoid abbreviations and single letters (except loops)
  - Boolean names are questions (isActive, hasPermission)

- [ ] **Functions**
  - Small, focused functions (<50 lines)
  - Clear function names describing what they do
  - Minimal parameters (<5 ideal)
  - Single level of abstraction

- [ ] **Comments**
  - Code is self-documenting where possible
  - Complex logic explained
  - Why, not what (code shows what)
  - No commented-out code

#### Code Complexity
```bash
# Measure cyclomatic complexity
npx complexity-report src/

# Look for:
# - Functions with complexity > 10 (refactor needed)
# - Files with high average complexity
# - Deeply nested code (>3 levels)
```

- [ ] **Reduce Complexity**
  - Extract complex conditions to named functions
  - Use early returns to reduce nesting
  - Break down large functions
  - Simplify conditional logic

### 3. Security Audit
**Objective**: Identify and fix security vulnerabilities

#### Dependency Security
```bash
# Check for known vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Check for outdated packages
npm outdated

# Use tools like Snyk
npx snyk test
```

#### Common Security Issues

- [ ] **Authentication & Authorization**
  - Passwords hashed with strong algorithm (bcrypt, argon2)
  - JWT tokens properly signed and validated
  - Session management secure
  - Role-based access control implemented
  - No hardcoded credentials

- [ ] **Input Validation**
  - All user input validated
  - SQL injection prevention (parameterized queries)
  - XSS prevention (sanitize output)
  - CSRF protection enabled
  - File upload validation (type, size, content)

- [ ] **Data Protection**
  - Sensitive data encrypted at rest
  - HTTPS enforced
  - Secure headers configured (CSP, HSTS, X-Frame-Options)
  - No sensitive data in logs
  - PII properly handled

- [ ] **API Security**
  - Rate limiting implemented
  - API authentication required
  - Input validation on all endpoints
  - Error messages don't leak information
  - CORS properly configured

#### Security Checklist
```javascript
// ❌ Bad: SQL Injection vulnerable
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good: Parameterized query
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// ❌ Bad: XSS vulnerable
element.innerHTML = userInput;

// ✅ Good: Sanitized output
element.textContent = userInput;

// ❌ Bad: Hardcoded secret
const apiKey = 'sk_live_123456789';

// ✅ Good: Environment variable
const apiKey = process.env.API_KEY;
```

### 4. Performance Audit
**Objective**: Identify and fix performance bottlenecks

#### Frontend Performance
```bash
# Run Lighthouse audit
npx lighthouse https://yourapp.com --view

# Check bundle size
npx webpack-bundle-analyzer

# Measure Core Web Vitals
# - LCP (Largest Contentful Paint) < 2.5s
# - FID (First Input Delay) < 100ms
# - CLS (Cumulative Layout Shift) < 0.1
```

- [ ] **Loading Performance**
  - Code splitting implemented
  - Lazy loading for routes and components
  - Images optimized (WebP, lazy loading)
  - Fonts optimized (font-display: swap)
  - Critical CSS inlined
  - Assets compressed (gzip/brotli)

- [ ] **Runtime Performance**
  - Minimize re-renders (React.memo, useMemo)
  - Debounce/throttle expensive operations
  - Virtual scrolling for long lists
  - Avoid layout thrashing
  - Use Web Workers for heavy computation

- [ ] **Network Performance**
  - HTTP/2 or HTTP/3 enabled
  - CDN for static assets
  - API response caching
  - Request batching/deduplication
  - Prefetch critical resources

#### Backend Performance
```bash
# Profile Node.js application
node --prof app.js
node --prof-process isolate-*.log

# Monitor database queries
# - Slow query log
# - Query execution plans
# - Missing indexes
```

- [ ] **Database Performance**
  - Proper indexes on frequently queried columns
  - N+1 query problems resolved
  - Query optimization (avoid SELECT *)
  - Connection pooling configured
  - Database caching (Redis)

- [ ] **API Performance**
  - Response time < 200ms for simple queries
  - Pagination for large datasets
  - Field selection (GraphQL) or sparse fieldsets (REST)
  - Compression enabled
  - Caching headers set

### 5. Testing Audit
**Objective**: Assess test coverage and quality

#### Test Coverage
```bash
# Run tests with coverage
npm run test:coverage

# Target coverage:
# - Statements: >80%
# - Branches: >75%
# - Functions: >80%
# - Lines: >80%
```

- [ ] **Unit Tests**
  - Critical business logic covered
  - Edge cases tested
  - Error handling tested
  - Fast execution (<1s per test)
  - Isolated (no external dependencies)

- [ ] **Integration Tests**
  - API endpoints tested
  - Database interactions tested
  - Third-party integrations tested
  - Authentication/authorization tested

- [ ] **E2E Tests**
  - Critical user flows covered
  - Cross-browser testing
  - Mobile responsive testing
  - Accessibility testing

#### Test Quality
- [ ] Tests are readable and maintainable
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests are independent (can run in any order)
- [ ] Good use of test fixtures and factories
- [ ] Meaningful test descriptions

### 6. Accessibility Audit
**Objective**: Ensure application is accessible to all users

```bash
# Run automated accessibility tests
npx axe https://yourapp.com

# Run Lighthouse accessibility audit
npx lighthouse https://yourapp.com --only-categories=accessibility
```

- [ ] **Semantic HTML**
  - Proper heading hierarchy (h1 → h2 → h3)
  - Semantic elements used (nav, main, article, aside)
  - Forms have proper labels
  - Tables have proper structure

- [ ] **Keyboard Navigation**
  - All interactive elements keyboard accessible
  - Visible focus indicators
  - Logical tab order
  - Skip links provided

- [ ] **Screen Reader Support**
  - Alt text for images
  - ARIA labels for icon buttons
  - ARIA live regions for dynamic content
  - Form validation messages announced

- [ ] **Color & Contrast**
  - 4.5:1 contrast for normal text
  - 3:1 contrast for large text and UI components
  - Color not sole means of conveying information
  - Dark mode support (if applicable)

### 7. Dependency Audit
**Objective**: Review and optimize dependencies

```bash
# List all dependencies
npm list --depth=0

# Check for unused dependencies
npx depcheck

# Check bundle impact
npx bundlephobia <package-name>

# Check for duplicate dependencies
npm dedupe
```

- [ ] **Dependency Health**
  - All dependencies actively maintained
  - No deprecated packages
  - No packages with known vulnerabilities
  - Licenses compatible with project

- [ ] **Dependency Optimization**
  - Remove unused dependencies
  - Replace heavy dependencies with lighter alternatives
  - Use tree-shaking for large libraries
  - Consider bundling vs. CDN

### 8. Documentation Audit
**Objective**: Ensure adequate documentation

- [ ] **Code Documentation**
  - README.md with setup instructions
  - API documentation (Swagger/OpenAPI)
  - Complex functions documented
  - Architecture decisions documented (ADRs)

- [ ] **Developer Documentation**
  - Contributing guidelines
  - Code style guide
  - Development workflow
  - Deployment process

- [ ] **User Documentation**
  - User guides
  - API documentation for external users
  - Changelog maintained
  - Migration guides for breaking changes

## Audit Report Template

### Executive Summary
- Overall code quality rating (1-10)
- Critical issues found
- Recommendations summary
- Estimated effort to address issues

### Detailed Findings

#### Code Quality
- **Strengths**: What's done well
- **Issues**: Specific problems found
- **Recommendations**: How to improve
- **Priority**: High/Medium/Low

#### Security
- **Vulnerabilities**: List with severity
- **Recommendations**: How to fix
- **Priority**: Critical/High/Medium/Low

#### Performance
- **Bottlenecks**: Identified issues
- **Metrics**: Current vs. target
- **Recommendations**: Optimization strategies
- **Priority**: High/Medium/Low

#### Testing
- **Coverage**: Current coverage metrics
- **Gaps**: Areas lacking tests
- **Recommendations**: Testing strategy
- **Priority**: High/Medium/Low

### Action Items
1. [High Priority] Fix SQL injection vulnerability in user login
2. [High Priority] Add indexes to frequently queried database columns
3. [Medium Priority] Refactor complex functions with cyclomatic complexity >10
4. [Medium Priority] Increase test coverage to >80%
5. [Low Priority] Update outdated dependencies

## Automated Audit Tools

### Code Quality
```bash
# ESLint for JavaScript/TypeScript
npx eslint src/

# Prettier for code formatting
npx prettier --check src/

# SonarQube for comprehensive analysis
npx sonarqube-scanner
```

### Security
```bash
# npm audit for dependency vulnerabilities
npm audit

# Snyk for security scanning
npx snyk test

# OWASP ZAP for security testing
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourapp.com
```

### Performance
```bash
# Lighthouse for web performance
npx lighthouse https://yourapp.com

# webpack-bundle-analyzer for bundle size
npx webpack-bundle-analyzer

# Artillery for load testing
npx artillery quick --count 100 --num 10 https://api.yourapp.com
```

### Accessibility
```bash
# axe for accessibility testing
npx axe https://yourapp.com

# pa11y for automated accessibility testing
npx pa11y https://yourapp.com
```

## Best Practices

### Regular Audits
- Schedule quarterly comprehensive audits
- Run automated checks in CI/CD pipeline
- Address critical issues immediately
- Track technical debt over time

### Continuous Improvement
- Set quality gates in CI/CD
- Enforce code review standards
- Maintain coding standards document
- Regular team training on best practices

### Prioritization
- Fix critical security issues first
- Address high-impact performance issues
- Improve test coverage incrementally
- Refactor high-complexity code gradually

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web.dev Best Practices](https://web.dev/learn/)
- [Clean Code by Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [SonarQube Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)
