---
name: Testing & Quality Assurance
description: Comprehensive testing strategy for ensuring code quality and reliability
---

# Testing & Quality Assurance Skill

## Purpose
Ensure code quality through comprehensive testing at all levels.

## When to Use
- Writing new features
- Fixing bugs
- Refactoring code
- Before deployment
- Continuous integration

## Testing Pyramid

```
       /\
      /E2E\        Few, slow, expensive
     /------\
    / Integ  \     Some, medium speed
   /----------\
  /   Unit     \   Many, fast, cheap
 /--------------\
```

## Test Types

### 1. Unit Tests
**Purpose**: Test individual functions/components in isolation

```javascript
// Example: Testing a utility function
describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.1)).toBe(10);
  });

  it('should handle zero price', () => {
    expect(calculateTax(0, 0.1)).toBe(0);
  });

  it('should handle zero tax rate', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });

  it('should throw on negative values', () => {
    expect(() => calculateTax(-100, 0.1)).toThrow();
  });
});
```

**Best Practices:**
- Test one thing per test
- Use descriptive test names
- Cover edge cases
- Keep tests fast (<1s)
- Mock external dependencies

### 2. Integration Tests
**Purpose**: Test multiple components working together

```javascript
// Example: Testing API endpoint
describe('POST /api/users', () => {
  it('should create user successfully', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@example.com');
  });

  it('should reject invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'invalid-email',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('email');
  });
});
```

### 3. E2E Tests
**Purpose**: Test complete user flows

```javascript
// Example: Playwright E2E test
test('user can login and view dashboard', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://app.example.com/login');

  // Fill login form
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Testing Strategy

### Coverage Goals
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

### What to Test

#### ✅ Always Test
- Business logic
- Edge cases
- Error handling
- Input validation
- Critical user flows
- Security features

#### ⚠️ Consider Testing
- UI components (critical ones)
- Utility functions
- Data transformations
- API integrations

#### ❌ Don't Test
- Third-party libraries
- Framework code
- Simple getters/setters
- Configuration files

## Test Organization

### File Structure
```
src/
  components/
    Button.tsx
    Button.test.tsx
  utils/
    validation.ts
    validation.test.ts
  api/
    users.ts
    users.test.ts
```

### Naming Convention
- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## Testing Tools

### Unit & Integration
```bash
# Jest (JavaScript/TypeScript)
npm install --save-dev jest @types/jest

# Vitest (Vite projects)
npm install --save-dev vitest

# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### E2E Testing
```bash
# Playwright
npm install --save-dev @playwright/test

# Cypress
npm install --save-dev cypress

# Run E2E tests
npm run test:e2e
```

### Mocking
```javascript
// Mock API calls
jest.mock('./api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ id: 1, name: 'Test' }))
}));

// Mock modules
jest.mock('axios');

// Spy on functions
const spy = jest.spyOn(object, 'method');
expect(spy).toHaveBeenCalledWith(arg);
```

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle
1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code quality

```javascript
// 1. Red: Write test first
test('should add two numbers', () => {
  expect(add(2, 3)).toBe(5);
});

// 2. Green: Implement function
function add(a, b) {
  return a + b;
}

// 3. Refactor: Improve if needed
function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Arguments must be numbers');
  }
  return a + b;
}
```

## Quality Checks

### Linting
```bash
# ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Type Checking
```bash
# TypeScript
npm run type-check
```

### Code Formatting
```bash
# Prettier
npm run format

# Check formatting
npm run format:check
```

## CI/CD Integration

```yaml
# GitHub Actions example
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage
      - run: npm run test:e2e
```

## Testing Checklist

### Before Writing Tests
- [ ] Understand requirements
- [ ] Identify test cases
- [ ] Set up test environment
- [ ] Prepare test data

### Writing Tests
- [ ] Test happy path
- [ ] Test edge cases
- [ ] Test error cases
- [ ] Use descriptive names
- [ ] Keep tests independent

### After Writing Tests
- [ ] All tests pass
- [ ] Coverage meets goals
- [ ] Tests are maintainable
- [ ] CI/CD passing

## Best Practices

### Test Quality
- **Arrange-Act-Assert** pattern
- One assertion per test (when possible)
- Descriptive test names
- Independent tests
- Fast execution

### Maintainability
- DRY principle (use helpers)
- Clear test data
- Avoid test interdependence
- Regular test cleanup
- Update tests with code

### Performance
- Run unit tests frequently
- Run integration tests before commit
- Run E2E tests in CI/CD
- Parallelize test execution
- Use test databases

## Common Patterns

### Test Fixtures
```javascript
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User'
};
```

### Test Factories
```javascript
function createUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    ...overrides
  };
}
```

### Setup/Teardown
```javascript
beforeEach(() => {
  // Setup before each test
  database.clear();
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});
```

## Resources
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
