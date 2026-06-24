const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const swPath = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "dist", "sw.js");
const distDir = path.dirname(swPath);
const versionPath = path.join(distDir, "version.json");
const packageJson = require(path.join(root, "package.json"));

const buildId =
  process.env.VITE_BUILD_ID ||
  process.env.BUILD_ID ||
  process.env.COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  `${packageJson.version || "0.0.0"}-${Date.now()}`;

const safeBuildId = String(buildId).replace(/[^a-zA-Z0-9._-]/g, "-");

if (!fs.existsSync(swPath)) {
  throw new Error(`Không tìm thấy service worker để stamp: ${swPath}`);
}

const source = fs.readFileSync(swPath, "utf8");
const next = source.replace(
  /const VERSION = ['"][^'"]+['"];?/,
  `const VERSION = 'build-${safeBuildId}';`,
);

if (next === source) {
  throw new Error("Không tìm thấy const VERSION trong sw.js để stamp build version.");
}

fs.writeFileSync(swPath, next, "utf8");
fs.writeFileSync(
  versionPath,
  `${JSON.stringify(
    {
      buildId: `build-${safeBuildId}`,
      version: packageJson.version || "0.0.0",
      builtAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);
console.log(`[stamp-sw-version] ${path.relative(root, swPath)} -> build-${safeBuildId}`);
console.log(`[stamp-sw-version] ${path.relative(root, versionPath)} -> build-${safeBuildId}`);
