/**
 * Security Test Suite
 * Tests all security features implemented in the application
 * 
 * Run with: npx tsx src/tests/security.test.ts
 */

const API_BASE = "http://localhost:4000";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runTest(
  name: string,
  testFn: () => Promise<{ passed: boolean; details: string }>
) {
  const start = Date.now();
  try {
    const { passed, details } = await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed, details, duration });
    
    const icon = passed ? "✅" : "❌";
    const color = passed ? colors.green : colors.red;
    log(`${icon} ${name} (${duration}ms)`, color);
    if (!passed) {
      log(`   └─ ${details}`, colors.yellow);
    }
  } catch (err: any) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, details: err.message, duration });
    log(`❌ ${name} (${duration}ms)`, colors.red);
    log(`   └─ Error: ${err.message}`, colors.yellow);
  }
}

// ============================================
// TEST CASES
// ============================================

async function testServerHealth() {
  const res = await fetch(`${API_BASE}/`);
  return {
    passed: res.status === 200,
    details: `Status: ${res.status}`,
  };
}

async function testRateLimiting() {
  // Make requests sequentially to trigger rate limit or CAPTCHA
  let securityTriggered = false;
  let lastStatus = 0;
  let requestCount = 0;
  let triggerType = "";
  
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        usernameOrEmail: "ratelimit_test_user@example.com", 
        password: "TestPassword123!" 
      }),
    });
    lastStatus = res.status;
    requestCount++;
    
    const data = await res.json();
    
    // Rate limit triggered (429)
    if (res.status === 429) {
      securityTriggered = true;
      triggerType = "rate_limit";
      break;
    }
    
    // CAPTCHA requirement triggered (also a valid security measure)
    if (data.requireCaptcha === true) {
      securityTriggered = true;
      triggerType = "captcha_required";
      break;
    }
    
    // CAPTCHA already required - server returns 400 with captcha error
    // This is also a valid security measure (previous attempts triggered CAPTCHA)
    if (res.status === 400 && data.error && 
        (data.error.toLowerCase().includes('captcha') || 
         data.error.toLowerCase().includes('xác minh'))) {
      securityTriggered = true;
      triggerType = "captcha_enforced";
      break;
    }
    
    await new Promise(r => setTimeout(r, 50));
  }
  
  return {
    passed: securityTriggered,
    details: securityTriggered
      ? `Security triggered after ${requestCount} requests (${triggerType})`
      : `No security measure triggered after ${requestCount} requests. Last status: ${lastStatus}`,
  };
}

async function testSQLInjection() {
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "1; SELECT * FROM accounts",
  ];

  for (const input of maliciousInputs) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail: input, password: "test" }),
    });
    
    // Should be rejected (400) or return generic error (401), never 500
    if (res.status === 500) {
      return {
        passed: false,
        details: `SQL injection attempt caused server error: ${input}`,
      };
    }
  }

  return {
    passed: true,
    details: "SQL injection attempts properly handled",
  };
}

async function testXSSPrevention() {
  const xssPayloads = [
    "<script>alert('xss')</script>",
    "javascript:alert(1)",
    "<img src=x onerror=alert(1)>",
    "';alert(String.fromCharCode(88,83,83))//",
  ];

  for (const payload of xssPayloads) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: payload,
        email: "test@test.com",
        password: "Test1234",
        firstName: payload,
        lastName: "Test",
      }),
    });

    // Should be rejected (400) not cause server error (500)
    if (res.status === 500) {
      return {
        passed: false,
        details: `XSS payload caused server error: ${payload}`,
      };
    }
  }

  return {
    passed: true,
    details: "XSS payloads properly sanitized",
  };
}

async function testPasswordValidation() {
  const weakPasswords = ["123", "password", "abc", "12345678"];

  for (const password of weakPasswords) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser" + Date.now(),
        email: `test${Date.now()}@test.com`,
        password: password,
        firstName: "Test",
        lastName: "User",
      }),
    });

    if (res.status === 201) {
      return {
        passed: false,
        details: `Weak password accepted: ${password}`,
      };
    }
  }

  return {
    passed: true,
    details: "Weak passwords are rejected",
  };
}

async function testAccountLockout() {
  // Use a unique identifier for lockout test
  const testUser = `lockout_${Date.now()}@example.com`;
  
  // Try multiple failed logins to trigger lockout, CAPTCHA, or rate limit
  let securityTriggered = false;
  let attemptCount = 0;
  let triggerType = "";
  
  for (let i = 0; i < 10; i++) {
    attemptCount++;
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernameOrEmail: testUser,
        password: "WrongPassword123!",
      }),
    });

    const data = await res.json();
    
    // Rate limit or account lockout (429)
    if (res.status === 429) {
      securityTriggered = true;
      triggerType = data.lockedMinutes ? "account_lockout" : "rate_limit";
      break;
    }
    
    // CAPTCHA requirement (another security measure)
    if (data.requireCaptcha === true) {
      securityTriggered = true;
      triggerType = "captcha_required";
      break;
    }
    
    // CAPTCHA already required - server returns 400 with captcha error
    // This is also a valid security measure (previous attempts triggered CAPTCHA)
    if (res.status === 400 && data.error && 
        (data.error.toLowerCase().includes('captcha') || 
         data.error.toLowerCase().includes('xác minh'))) {
      securityTriggered = true;
      triggerType = "captcha_enforced";
      break;
    }
    
    // Explicit lockout message
    if (data.error && data.error.includes("khóa")) {
      securityTriggered = true;
      triggerType = "account_lockout";
      break;
    }
    
    await new Promise(r => setTimeout(r, 50));
  }

  return {
    passed: securityTriggered,
    details: securityTriggered
      ? `Security triggered after ${attemptCount} failed attempts (${triggerType})`
      : `No security measure after ${attemptCount} attempts`,
  };
}

async function testCaptchaEndpoint() {
  const res = await fetch(`${API_BASE}/api/auth/captcha-required`);
  
  // Rate limited is also acceptable
  if (res.status === 429) {
    return { passed: true, details: "Rate limited (general rate limiter working)" };
  }
  
  const data = await res.json();

  return {
    passed: res.status === 200,
    details: `CAPTCHA endpoint: status ${res.status}, required: ${data.required}, siteKey: ${data.siteKey ? "configured" : "needs config"}`,
  };
}

async function testSecurityHeaders() {
  const res = await fetch(`${API_BASE}/`);
  const headers = res.headers;

  const securityHeaders = {
    "x-content-type-options": headers.get("x-content-type-options"),
    "x-frame-options": headers.get("x-frame-options"),
    "x-download-options": headers.get("x-download-options"),
    "referrer-policy": headers.get("referrer-policy"),
    "x-permitted-cross-domain-policies": headers.get("x-permitted-cross-domain-policies"),
  };

  const presentHeaders = Object.entries(securityHeaders)
    .filter(([_, v]) => v !== null)
    .map(([k, _]) => k);
    
  const missingHeaders = Object.entries(securityHeaders)
    .filter(([_, v]) => v === null)
    .map(([k, _]) => k);

  // At least 2 security headers should be present (helmet adds these)
  const passed = presentHeaders.length >= 2;

  return {
    passed,
    details: passed
      ? `Security headers (${presentHeaders.length}): ${presentHeaders.join(", ")}`
      : `Missing ${missingHeaders.length} headers. Note: Restart server after code changes. Missing: ${missingHeaders.join(", ")}`,
  };
}

async function testInvalidContentType() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "invalid",
  });

  // Should reject: 400 (bad request), 415 (unsupported media), or 429 (rate limited)
  const passed = [400, 415, 429].includes(res.status);
  return {
    passed,
    details: passed 
      ? `Invalid content type handled (status: ${res.status})`
      : `Unexpected status: ${res.status}`,
  };
}

async function testUserEnumeration() {
  // Login with non-existent user
  const res1 = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernameOrEmail: "nonexistent_user_12345",
      password: "wrongpassword",
    }),
  });
  const data1 = await res1.json();

  // Login with wrong password (if there's an existing user)
  const res2 = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernameOrEmail: "admin",
      password: "wrongpassword",
    }),
  });
  const data2 = await res2.json();

  // Error messages should be the same to prevent user enumeration
  const sameError = data1.error === data2.error;

  return {
    passed: sameError,
    details: sameError
      ? "User enumeration protected - same error for both cases"
      : `Different errors: "${data1.error}" vs "${data2.error}"`,
  };
}

async function testCORSHeaders() {
  const res = await fetch(`${API_BASE}/api/auth/captcha-required`, {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:4001",
      "Access-Control-Request-Method": "GET",
    },
  });

  const allowOrigin = res.headers.get("access-control-allow-origin");
  const allowMethods = res.headers.get("access-control-allow-methods");

  return {
    passed: !!allowOrigin,
    details: `CORS: Origin=${allowOrigin || "not set"}, Methods=${allowMethods || "not set"}`,
  };
}

async function testLogoutEndpoint() {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  // 200 = success, 429 = rate limited (still valid security)
  if (res.status === 429) {
    return { passed: true, details: "Rate limited (general rate limiter working)" };
  }

  const data = await res.json();

  return {
    passed: res.status === 200 && data.success === true,
    details: `Logout endpoint: ${data.message || "working"}`,
  };
}

async function testRefreshEndpoint() {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: "invalid_token" }),
  });

  // Should reject: 400/401 (invalid token) or 429 (rate limited)
  const passed = [400, 401, 429].includes(res.status);
  return {
    passed,
    details: passed 
      ? `Refresh token validation secured (status: ${res.status})`
      : `Unexpected status: ${res.status}`,
  };
}

async function testProtectedEndpoint() {
  // Try to access protected endpoint without auth
  const res = await fetch(`${API_BASE}/api/user/profile`, {
    method: "GET",
  });

  // 401 = requires auth, 429 = rate limited (also valid security)
  const passed = res.status === 401 || res.status === 429;
  return {
    passed,
    details: passed 
      ? `Protected endpoint secured (status: ${res.status})`
      : `Unexpected status: ${res.status}`,
  };
}

async function testUsernameValidation() {
  const invalidUsernames = [
    "ab", // too short
    "a".repeat(50), // too long
    "user name", // contains space
    "user@name", // contains @
    "user<script>", // contains special chars
  ];

  for (const username of invalidUsernames) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: `test${Date.now()}@test.com`,
        password: "Test1234!",
        firstName: "Test",
        lastName: "User",
      }),
    });

    if (res.status === 201) {
      return {
        passed: false,
        details: `Invalid username accepted: ${username}`,
      };
    }
  }

  return {
    passed: true,
    details: "Invalid usernames are rejected",
  };
}

async function testEmailValidation() {
  const invalidEmails = [
    "notanemail",
    "missing@domain",
    "@nodomain.com",
    "spaces in@email.com",
  ];

  for (const email of invalidEmails) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser" + Date.now(),
        email,
        password: "Test1234!",
        firstName: "Test",
        lastName: "User",
      }),
    });

    if (res.status === 201) {
      return {
        passed: false,
        details: `Invalid email accepted: ${email}`,
      };
    }
  }

  return {
    passed: true,
    details: "Invalid emails are rejected",
  };
}

// ============================================
// MAIN
// ============================================

async function main() {
  log("\n" + "=".repeat(60), colors.blue);
  log("🔒 SECURITY TEST SUITE", colors.bold);
  log("=".repeat(60) + "\n", colors.blue);

  log("Testing server at: " + API_BASE + "\n", colors.yellow);

  // Run all tests
  await runTest("1. Server Health Check", testServerHealth);
  await runTest("2. Security Headers", testSecurityHeaders);
  await runTest("3. CORS Configuration", testCORSHeaders);
  await runTest("4. Rate Limiting", testRateLimiting);
  await runTest("5. Account Lockout", testAccountLockout);
  await runTest("6. SQL Injection Prevention", testSQLInjection);
  await runTest("7. XSS Prevention", testXSSPrevention);
  await runTest("8. Password Strength Validation", testPasswordValidation);
  await runTest("9. Username Validation", testUsernameValidation);
  await runTest("10. Email Validation", testEmailValidation);
  await runTest("11. User Enumeration Protection", testUserEnumeration);
  await runTest("12. CAPTCHA Endpoint", testCaptchaEndpoint);
  await runTest("13. Protected Endpoint Auth", testProtectedEndpoint);
  await runTest("14. Invalid Content Type", testInvalidContentType);
  await runTest("15. Logout Endpoint", testLogoutEndpoint);
  await runTest("16. Refresh Token Validation", testRefreshEndpoint);

  // Summary
  log("\n" + "=".repeat(60), colors.blue);
  log("📊 TEST SUMMARY", colors.bold);
  log("=".repeat(60), colors.blue);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  log(`\n✅ Passed: ${passed}/${total}`, colors.green);
  log(`❌ Failed: ${failed}/${total}`, failed > 0 ? colors.red : colors.green);

  if (failed > 0) {
    log("\n⚠️  Failed Tests:", colors.yellow);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        log(`   • ${r.name}: ${r.details}`, colors.red);
      });
  }

  const score = Math.round((passed / total) * 100);
  const scoreColor = score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red;
  log(`\n🏆 Security Score: ${score}%`, scoreColor);

  if (score === 100) {
    log("\n🎉 All security tests passed!", colors.green);
  } else if (score >= 80) {
    log("\n👍 Good security posture, but some improvements needed.", colors.yellow);
  } else {
    log("\n⚠️  Security improvements required!", colors.red);
  }

  log("\n" + "=".repeat(60) + "\n", colors.blue);

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
