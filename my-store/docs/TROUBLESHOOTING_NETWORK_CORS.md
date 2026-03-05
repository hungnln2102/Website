# Network không load / CORS / 503

Khi trang **www.mavrykpremium.store** không load được dữ liệu (products, categories, promotions) và Console báo **503** hoặc **CORS blocked**, kiểm tra lần lượt các bước sau.

---

## 1. API có đang chạy không? (503 Service Unavailable)

**503** thường có nghĩa:
- Ứng dụng Node (API) **không chạy** hoặc **crash**, hoặc
- **Proxy (Nginx, load balancer)** trả 503 vì không kết nối được upstream (Node down / timeout).

**Kiểm tra:**

```bash
# Gọi trực tiếp API (health)
curl -i https://api.mavrykpremium.store/health
```

- **200 OK** → API đang chạy. Nếu web vẫn lỗi thì chuyển sang mục 2 (CORS).
- **502 / 503 / timeout** → API không chạy hoặc proxy cấu hình sai. Cần:
  - Trên server: kiểm tra process Node (pm2, systemd, docker…), log lỗi, restart service.
  - Kiểm tra proxy: upstream trỏ đúng port Node, timeout đủ lớn.

---

## 2. CORS (No 'Access-Control-Allow-Origin' header)

Trình duyệt chặn request vì response **không có** header `Access-Control-Allow-Origin`. Thường gặp khi:

- Request từ **https://www.mavrykpremium.store** nhưng server chỉ cho phép **https://mavrykpremium.store** (thiếu www), hoặc
- Response **503 từ Nginx/proxy** (không đi qua Express) nên không có CORS.

**Cần làm:**

1. **Trên server API**, file `.env` có:
   ```env
   CORS_ORIGIN=https://mavrykpremium.store,http://localhost:4001
   ```
   Chỉ cần **một** trong hai `https://mavrykpremium.store` hoặc `https://www.mavrykpremium.store`; code đã tự thêm cả phiên bản www và non-www.

2. **Deploy bản code mới** (có hàm `withWwwVariants` trong `apps/server/src/index.ts`) rồi **restart** service API. Sau đó cả `https://mavrykpremium.store` và `https://www.mavrykpremium.store` đều được cho phép.

3. Nếu dùng **Nginx** trả 502/503 khi Node down, response đó **không** có CORS. Cách xử lý đúng là cho Node chạy ổn định (mục 1); không nên cấu hình CORS trên Nginx cho 502/503 thay cho việc sửa API.

4. **Nginx có đang strip header CORS không?** Nếu API (Node) đã trả `Access-Control-Allow-Origin` nhưng trình duyệt vẫn báo thiếu header, có thể Nginx đang xóa. Trong block `location` proxy tới API, **không** dùng `proxy_hide_header Access-Control-Allow-Origin`; nếu có `proxy_pass_header Access-Control-*` thì giữ. Sau khi sửa code (middleware fallback CORS cho mavrykpremium.store), rebuild image và deploy lại.

---

## 3. Checklist nhanh

| Bước | Việc cần làm |
|------|----------------|
| 1 | `curl -i https://api.mavrykpremium.store/health` → 200 OK |
| 2 | Trên server: `.env` có `CORS_ORIGIN=https://mavrykpremium.store` (hoặc có www) |
| 3 | Đã deploy code mới (withWwwVariants) và restart API |
| 4 | Mở https://www.mavrykpremium.store → F12 → Network: request `/products`, `/categories` trả 200, không còn 503 / CORS |

---

## 4. Nếu vẫn 503

- Xem log ứng dụng Node (pm2 logs, journalctl, docker logs…) để biết crash hay lỗi kết nối DB.
- Kiểm tra **DATABASE_URL** và kết nối DB (API có thể trả 503 khi DB không kết nối được lúc khởi động).
- Kiểm tra proxy: `proxy_pass` trỏ đúng port, `proxy_connect_timeout` / `proxy_read_timeout` đủ lớn (ví dụ 60s).
