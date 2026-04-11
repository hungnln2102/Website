import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ALLOWLIST_ENV = new Set([
  ".env.example",
  ".env.docker",
]);

const suspiciousPatterns = [
  { name: "JWT secret assignment", re: /^\s*JWT_(REFRESH_)?SECRET\s*=\s*(?!\s*$)/m },
  { name: "SePay key assignment", re: /^\s*SEPAY(_API)?_KEY\s*=\s*(?!\s*$)/m },
  { name: "Telegram token assignment", re: /^\s*TELEGRAM_BOT_TOKEN\s*=\s*(?!\s*$)/m },
  { name: "Resend key assignment", re: /^\s*RESEND_API_KEY\s*=\s*(?!\s*$)/m },
  { name: "Private key marker", re: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/ },
];

function run(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
}

function isAllowedEnvFile(file) {
  const base = path.basename(file);
  return ALLOWLIST_ENV.has(base);
}

function shouldSkip(file) {
  const norm = file.replace(/\\/g, "/");
  if (norm.includes("node_modules/")) return true;
  if (norm.startsWith("dist/")) return true;
  if (norm.startsWith("coverage/")) return true;
  return false;
}

const tracked = run("git ls-files");
const errors = [];

for (const rel of tracked) {
  if (shouldSkip(rel)) continue;
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;

  const base = path.basename(rel);
  const isEnvFile = base.startsWith(".env");

  if (isEnvFile && !isAllowedEnvFile(rel)) {
    errors.push(`[env-file] Tracked env file should not be committed: ${rel}`);
    continue;
  }

  const content = fs.readFileSync(abs, "utf8");
  for (const p of suspiciousPatterns) {
    if (p.re.test(content)) {
      // Allow secret names in docs/examples but still fail in normal source/config files.
      if (rel.endsWith(".md") || isAllowedEnvFile(rel)) continue;
      errors.push(`[secret-pattern] ${p.name} detected in ${rel}`);
    }
  }
}

if (errors.length > 0) {
  console.error("SECURITY CHECK FAILED:");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log("security-check-secrets: OK");

