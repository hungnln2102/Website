/**
 * Đồng bộ logo từ src/assets → public/assets/images (URL /assets/images/*).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src", "assets");
const dstDir = path.join(root, "public", "assets", "images");
const files = ["logo-transparent.png", "logo-192.jpg", "logo-512.jpg"];

fs.mkdirSync(dstDir, { recursive: true });
for (const name of files) {
  const from = path.join(srcDir, name);
  const to = path.join(dstDir, name);
  if (!fs.existsSync(from)) continue;
  fs.copyFileSync(from, to);
  console.log("[copy-branding]", name, "→ public/assets/images/");
}
