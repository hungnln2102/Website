# Database Schema

Tài liệu cấu trúc và thay đổi schema database.

---

## 1. Bảng product

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | PK | |
| category_id | FK | |
| package_name | text | Tên gói (map sang `name` trong API) |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| is_active | boolean | Default true |

**Migration**: Thêm `created_at`, `updated_at`, `is_active` nếu chưa có.

---

## 2. Bảng variant

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | PK | |
| product_id | FK → product.id | |
| variant_name | text | |
| display_name | text | |
| form_id | text | |
| is_active | boolean | |
| updated_at | timestamptz | |

**Constraint**: UNIQUE(product_id, display_name)

**Migration**: Thêm `updated_at` nếu chưa có. Tạo UNIQUE(product_id, display_name) nếu chưa có.

---

## 3. Bảng product_desc

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | PK | |
| variant_id | FK | |
| description | text | |
| rules | text | |
| image_url | text | |
| short_desc | text | |
| updated_at | timestamptz | |

**Migration**: Thêm `updated_at` nếu chưa có.

---

## 4. Bảng supplier_cost

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | PK | |
| variant_id | FK | |
| supplier_id | FK | |
| price | numeric | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Migration**: Thêm `created_at`, `updated_at` nếu chưa có.

---

## 5. Chạy migrations

```bash
# Thêm package_name nếu thiếu (fix: column p.package_name does not exist)
npm run db:migrate:package-name -w @my-store/db

# Schema product, variant, product_desc, supplier_cost
npm run db:migrate:schema-updates -w @my-store/db
```

---

## 6. Config tham chiếu

Xem `apps/server/src/config/db.config.ts` cho mapping schema/table/column đầy đủ.
