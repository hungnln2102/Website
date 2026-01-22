---
name: Debug & Troubleshooting
description: Systematic debugging methodology for identifying and fixing bugs in frontend, backend, and full-stack applications
---

# Debug & Troubleshooting Skill

## Purpose
This skill provides a systematic approach to debugging issues across the entire stack, from frontend UI bugs to backend API errors and database issues.

## When to Use This Skill
- Investigating reported bugs
- Troubleshooting unexpected behavior
- Fixing failing tests
- Resolving performance issues
- Debugging production incidents

## Debugging Methodology

### 1. Reproduce the Issue
**Objective**: Confirm and understand the bug

- **Gather Information**
  - Get exact steps to reproduce
  - Identify affected browsers/devices
  - Check error messages and stack traces
  - Review user reports or bug tickets
  - Note when the issue started occurring

- **Reproduce Locally**
  - Follow reproduction steps exactly
  - Try different scenarios and edge cases
  - Document what works vs. what doesn't
  - Capture screenshots/recordings of the issue

- **Verify Scope**
  - Is it affecting all users or specific users?
  - Does it happen in all environments or just production?
  - Is it consistent or intermittent?

### 2. Isolate the Problem
**Objective**: Narrow down the root cause

- **Check Recent Changes**
  - Review recent commits (git log)
  - Check deployment history
  - Review recent PRs and changes
  - Look for related configuration changes

- **Binary Search**
  - Comment out code sections to isolate the issue
  - Use git bisect for regression bugs
  - Test with minimal reproduction case
  - Remove variables one by one

- **Layer Analysis**
  - Frontend: Check browser console, network tab, React DevTools
  - Backend: Check server logs, API responses, database queries
  - Infrastructure: Check environment variables, network, permissions

### 3. Gather Evidence
**Objective**: Collect diagnostic information

#### Frontend Debugging

- **Browser DevTools**
  - Console: Check for JavaScript errors
  - Network: Inspect API calls, response codes, payloads
  - Elements: Inspect DOM and CSS
  - Sources: Set breakpoints and step through code
  - Performance: Profile rendering and JavaScript execution
  - Application: Check localStorage, sessionStorage, cookies

- **React/Vue DevTools**
  - Inspect component tree
  - Check props and state
  - Monitor component re-renders
  - Profile component performance

- **Common Frontend Issues**
  - State not updating: Check state management logic
  - Infinite loops: Check useEffect dependencies
  - Memory leaks: Check event listener cleanup
  - Styling issues: Check CSS specificity and inheritance
  - API errors: Check network requests and error handling

#### Backend Debugging

- **Logging**
  - Add strategic console.log/logger statements
  - Log function inputs and outputs
  - Log database queries and results
  - Log error stack traces

- **API Testing**
  - Test endpoints with Postman/curl
  - Verify request/response formats
  - Check authentication/authorization
  - Test with different payloads

- **Database Debugging**
  - Check query syntax and performance
  - Verify data integrity
  - Check indexes and constraints
  - Review transaction logs

- **Common Backend Issues**
  - 500 errors: Check server logs for exceptions
  - 404 errors: Verify route configuration
  - 401/403 errors: Check authentication/authorization
  - Slow responses: Profile database queries
  - Data inconsistency: Check transaction handling

### 4. Form Hypothesis
**Objective**: Develop theories about the cause

- **Ask Questions**
  - What changed recently?
  - What assumptions am I making?
  - What could cause this behavior?
  - Are there similar issues in the codebase?

- **Create Hypotheses**
  - List possible causes (most likely first)
  - For each hypothesis, identify how to test it
  - Prioritize based on likelihood and impact

### 5. Test Hypothesis
**Objective**: Verify or disprove theories

- **Controlled Testing**
  - Test one hypothesis at a time
  - Make minimal changes
  - Document results
  - Revert changes if hypothesis is wrong

- **Add Debugging Code**
  - Add console.log statements
  - Use debugger statements
  - Add temporary UI indicators
  - Log intermediate values

- **Use Debugging Tools**
  - Set breakpoints
  - Step through code execution
  - Watch variables
  - Evaluate expressions

### 6. Fix the Issue
**Objective**: Implement the solution

- **Root Cause Fix**
  - Fix the underlying cause, not just symptoms
  - Consider edge cases
  - Ensure fix doesn't break other functionality
  - Add defensive programming where appropriate

- **Code Quality**
  - Write clean, readable code
  - Add comments explaining complex logic
  - Follow project coding standards
  - Keep changes minimal and focused

- **Add Safeguards**
  - Add error handling
  - Add input validation
  - Add null checks
  - Add type checking (TypeScript)

### 7. Verify the Fix
**Objective**: Ensure the issue is resolved

- **Test Original Issue**
  - Verify bug is fixed with original reproduction steps
  - Test edge cases
  - Test in multiple browsers/devices
  - Test in different environments

- **Regression Testing**
  - Run existing test suite
  - Test related functionality
  - Check for unintended side effects
  - Verify performance hasn't degraded

- **Add Tests**
  - Write unit test for the bug
  - Add integration test if applicable
  - Update E2E tests if needed
  - Document test cases

### 8. Document & Learn
**Objective**: Prevent future occurrences

- **Document the Fix**
  - Write clear commit message
  - Update issue tracker
  - Add code comments if needed
  - Update documentation

- **Post-Mortem (for major bugs)**
  - What happened?
  - What was the root cause?
  - How was it fixed?
  - How can we prevent it in the future?
  - What did we learn?

## Debugging Tools & Techniques

### Console Debugging
```javascript
// Strategic logging
console.log('Function called with:', { param1, param2 });
console.table(arrayOfObjects); // Nice table view
console.group('Processing items'); // Group related logs
console.time('operation'); // Measure performance
console.trace(); // Show call stack

// Conditional breakpoints
if (userId === '123') debugger;
```

### Network Debugging
```javascript
// Log all fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args);
  return originalFetch.apply(this, args);
};
```

### React Debugging
```javascript
// Debug re-renders
useEffect(() => {
  console.log('Component rendered');
});

// Debug state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

### Error Boundaries (React)
```javascript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Common Bug Patterns

### Race Conditions
- **Symptom**: Intermittent failures, data inconsistency
- **Cause**: Async operations completing in unexpected order
- **Fix**: Use proper async/await, locks, or queues

### Memory Leaks
- **Symptom**: Increasing memory usage, slowdown over time
- **Cause**: Event listeners not cleaned up, closures holding references
- **Fix**: Clean up in useEffect return, remove event listeners

### State Management Issues
- **Symptom**: UI not updating, stale data
- **Cause**: Mutating state directly, missing dependencies
- **Fix**: Use immutable updates, add missing dependencies

### API Integration Issues
- **Symptom**: Failed requests, incorrect data
- **Cause**: Wrong endpoint, incorrect payload, CORS issues
- **Fix**: Verify API contract, check network tab, configure CORS

### CSS Specificity Issues
- **Symptom**: Styles not applying
- **Cause**: CSS specificity conflicts
- **Fix**: Use more specific selectors or !important (last resort)

## Debugging Checklist

### Before You Start
- [ ] Can you reproduce the issue consistently?
- [ ] Do you have the error message and stack trace?
- [ ] Do you know which version introduced the bug?
- [ ] Have you checked recent changes?

### During Debugging
- [ ] Are you testing one hypothesis at a time?
- [ ] Are you documenting your findings?
- [ ] Have you checked the browser console?
- [ ] Have you checked the network tab?
- [ ] Have you checked server logs?

### After Fixing
- [ ] Does the fix address the root cause?
- [ ] Have you tested the original reproduction steps?
- [ ] Have you tested edge cases?
- [ ] Have you added tests to prevent regression?
- [ ] Have you documented the fix?

## Emergency Debugging (Production Issues)

### Immediate Actions
1. **Assess Impact**: How many users affected?
2. **Communicate**: Notify stakeholders
3. **Mitigate**: Can you rollback or apply hotfix?
4. **Gather Data**: Collect logs, error reports, user feedback

### Investigation
1. **Check Monitoring**: Review error tracking, logs, metrics
2. **Compare Environments**: What's different in production?
3. **Review Recent Deploys**: What changed recently?
4. **Reproduce**: Try to reproduce in staging/local

### Resolution
1. **Quick Fix**: Apply minimal fix to restore service
2. **Verify**: Test fix in staging before deploying
3. **Deploy**: Deploy fix to production
4. **Monitor**: Watch metrics and error rates
5. **Follow Up**: Plan proper fix if quick fix was temporary

## Resources

- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [SQL Debugging Techniques](https://use-the-index-luke.com/)
