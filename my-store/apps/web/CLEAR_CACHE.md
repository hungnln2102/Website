# 🔧 HƯỚNG DẪN CLEAR CACHE VITE

## Vấn đề
Vite có thể đang cache các module cũ, gây ra lỗi load file không tồn tại.

## Giải pháp

### 1. Dừng dev server
- Nhấn `Ctrl+C` trong terminal đang chạy Vite

### 2. Xóa cache và node_modules/.vite
```bash
cd my-store/apps/web
rm -rf node_modules/.vite
# Hoặc trên Windows PowerShell:
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
```

### 3. Restart dev server
```bash
npm run dev
```

## Đã sửa
- ✅ Tạo lại `components/seo/index.ts`
- ✅ Xóa `components/SEO/index.ts` (chữ hoa)
- ✅ Tất cả imports đều dùng `@/components/seo` (chữ thường)

## Kiểm tra
Sau khi clear cache và restart, web sẽ hoạt động bình thường.
