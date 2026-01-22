---
name: Code Refactoring
description: Systematic approach to improving code quality without changing functionality
---

# Code Refactoring Skill

## Purpose
Improve code structure, readability, and maintainability while preserving functionality.

## When to Use
- Code is hard to understand
- Duplicated code exists
- Functions are too long/complex
- Technical debt accumulating
- Before adding new features

## Refactoring Process

### 1. Identify Refactoring Needs
- Code smells (duplicated code, long functions, large classes)
- Low test coverage areas
- High complexity (cyclomatic complexity >10)
- Performance bottlenecks
- Hard-to-maintain code

### 2. Ensure Test Coverage
```bash
# Check current coverage
npm run test:coverage

# Add tests if coverage < 80%
# Tests ensure refactoring doesn't break functionality
```

### 3. Make Small Changes
- One refactoring at a time
- Run tests after each change
- Commit frequently
- Keep changes focused

### 4. Common Refactoring Patterns

#### Extract Function
```javascript
// Before: Long function
function processOrder(order) {
  // Validate order (20 lines)
  // Calculate total (15 lines)
  // Apply discount (10 lines)
  // Save to database (5 lines)
}

// After: Extracted functions
function processOrder(order) {
  validateOrder(order);
  const total = calculateTotal(order);
  const finalTotal = applyDiscount(total, order.coupon);
  saveOrder(order, finalTotal);
}

function validateOrder(order) { /* ... */ }
function calculateTotal(order) { /* ... */ }
function applyDiscount(total, coupon) { /* ... */ }
function saveOrder(order, total) { /* ... */ }
```

#### Remove Duplication
```javascript
// Before: Duplicated code
function getUserById(id) {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) throw new Error('User not found');
  return user;
}

function getPostById(id) {
  const post = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw new Error('Post not found');
  return post;
}

// After: Generic function
async function findById(table, id, entityName) {
  const result = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  if (!result) throw new Error(`${entityName} not found`);
  return result;
}

const getUserById = (id) => findById('users', id, 'User');
const getPostById = (id) => findById('posts', id, 'Post');
```

#### Simplify Conditionals
```javascript
// Before: Complex nested conditions
function getDiscount(user) {
  if (user) {
    if (user.isPremium) {
      if (user.loyaltyPoints > 1000) {
        return 0.3;
      } else {
        return 0.2;
      }
    } else {
      return 0.1;
    }
  } else {
    return 0;
  }
}

// After: Early returns
function getDiscount(user) {
  if (!user) return 0;
  if (!user.isPremium) return 0.1;
  if (user.loyaltyPoints > 1000) return 0.3;
  return 0.2;
}
```

#### Replace Magic Numbers
```javascript
// Before: Magic numbers
if (user.age >= 18 && user.age <= 65) {
  // eligible
}

// After: Named constants
const MIN_ELIGIBLE_AGE = 18;
const MAX_ELIGIBLE_AGE = 65;

if (user.age >= MIN_ELIGIBLE_AGE && user.age <= MAX_ELIGIBLE_AGE) {
  // eligible
}
```

#### Improve Naming
```javascript
// Before: Unclear names
function calc(a, b) {
  return a * b * 0.1;
}

// After: Descriptive names
function calculateTax(price, quantity) {
  const TAX_RATE = 0.1;
  return price * quantity * TAX_RATE;
}
```

## Refactoring Checklist

### Before Refactoring
- [ ] Tests exist and pass
- [ ] Coverage is adequate (>80%)
- [ ] Understand current code
- [ ] Identify specific improvements
- [ ] Create feature branch

### During Refactoring
- [ ] Make one change at a time
- [ ] Run tests after each change
- [ ] Commit frequently
- [ ] Keep functionality unchanged
- [ ] Update comments/docs

### After Refactoring
- [ ] All tests still pass
- [ ] Code is more readable
- [ ] Complexity reduced
- [ ] No new bugs introduced
- [ ] Documentation updated

## Code Smells to Fix

### Long Function
- **Smell**: Function >50 lines
- **Fix**: Extract smaller functions

### Large Class
- **Smell**: Class with too many responsibilities
- **Fix**: Split into smaller classes

### Long Parameter List
- **Smell**: Function with >5 parameters
- **Fix**: Use object parameter or builder pattern

### Duplicated Code
- **Smell**: Same code in multiple places
- **Fix**: Extract to shared function

### Dead Code
- **Smell**: Unused code
- **Fix**: Delete it

### Comments Explaining Code
- **Smell**: Comments needed to understand code
- **Fix**: Refactor code to be self-explanatory

## Refactoring Strategies

### Boy Scout Rule
"Leave code better than you found it"
- Fix small issues when you see them
- Improve naming
- Add missing tests
- Remove dead code

### Strangler Fig Pattern
For large refactoring:
1. Create new implementation alongside old
2. Gradually migrate to new implementation
3. Remove old implementation when done

### Feature Flags
For risky refactoring:
1. Implement new code behind feature flag
2. Test thoroughly
3. Gradually roll out
4. Remove old code when stable

## Tools

```bash
# Find complex code
npx complexity-report src/

# Find duplicated code
npx jscpd src/

# Automated refactoring (with caution)
npx jscodeshift -t transform.js src/
```

## Best Practices

- **Test First**: Ensure tests before refactoring
- **Small Steps**: Make incremental changes
- **Commit Often**: Easy to revert if needed
- **Review**: Get code review on refactoring
- **Document**: Explain why refactoring was done
