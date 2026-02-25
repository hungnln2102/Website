# Verify API (chạy test)

Trên **PowerShell** (Windows) không dùng được `&&`. Dùng `;` hoặc chạy từng lệnh.

## 1. Chạy server

**Từ thư mục gốc monorepo** (`my-store`):
```powershell
cd D:\Desktop\Personal\Project\admin_store\Website\my-store
npm run dev:server
```

**Khi đã ở trong `apps/server`** (script trong package.json server là `dev`, không có `dev:server`):
```powershell
cd D:\Desktop\Personal\Project\admin_store\Website\my-store\apps\server
npm run dev
```

## 2. Integration test (Vitest)

Mở terminal mới, server đang chạy ở port 4000:

```powershell
cd D:\Desktop\Personal\Project\admin_store\Website\my-store\apps\server
npm run test:integration
```

## 3. Security test (tsx)

Server đang chạy:

```powershell
cd D:\Desktop\Personal\Project\admin_store\Website\my-store\apps\server
npx tsx src/tests/security.test.ts
```

---

**Lưu ý:** Nếu dùng CMD hoặc Git Bash, có thể dùng `&&` (vd. `cd my-store && npm run dev:server`).
