# Contributing to my-store

Thank you for your interest in contributing to my-store! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project

## Development Workflow

### 1. Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd my-store

# Install dependencies
npm install

# Start development servers
npm run dev
```

### 2. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Your Changes

- Write clean, readable code
- Follow the project's code style
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run linting
npm run lint

# Run type checking
npm run check-types

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 5. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(products): add product filtering"
git commit -m "fix(cart): resolve checkout calculation bug"
git commit -m "docs(readme): update installation instructions"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 6. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Use type aliases for unions/intersections

```typescript
// ✅ Good
interface Product {
  id: number;
  name: string;
  price: number;
}

// ❌ Bad
const product: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Naming Conventions

- **Components**: PascalCase (`ProductCard`, `UserProfile`)
- **Functions**: camelCase (`fetchProducts`, `calculateTotal`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_ITEMS`)
- **Files**: kebab-case for utilities, PascalCase for components

### File Organization

```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── pages/       # Page components
├── lib/             # Utilities and helpers
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Cover edge cases
- Aim for >80% coverage

```typescript
describe('calculateDiscount', () => {
  it('should calculate discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it('should handle zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });
});
```

### Integration Tests

- Test API endpoints
- Test component interactions
- Use realistic test data

### E2E Tests

- Test critical user flows
- Test across different browsers
- Keep tests stable and maintainable

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Commit messages follow conventions

### PR Description

Include:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots (for UI changes)
- Breaking changes (if any)

### Code Review Process

1. Automated checks must pass (CI/CD)
2. At least one approval required
3. Address review comments
4. Squash commits before merging

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots/error messages
- Environment details (browser, OS)

### Feature Requests

Include:
- Clear description of the feature
- Use case and benefits
- Proposed implementation (optional)

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in pull request comments
- Contact the maintainers

Thank you for contributing! 🎉
