# id_order trong order_list: duy nhất & xử lý trùng khi note

Tài liệu mô tả quy tắc **id_order** (mỗi dòng riêng biệt, không trùng), luồng **note sau khi thanh toán**, và cách xử lý khi **note bị trùng id_order** (retry, webhook gọi 2 lần, v.v.).

---

## 1. Nguyên tắc id_order

- **Mỗi dòng trong `order_list` có đúng một `id_order` và **id_order không được trùng** giữa các dòng.
- **id_order do website sinh ra** (random/unique) trước hoặc tại bước tạo đơn, ví dụ: `MAVL...`, `MAVC...`.
- **Chỉ khi thanh toán thành công** mới ghi (note) vào bảng `order_list`.

Tóm lại: **id_order = mã duy nhất cho từng dòng đơn; thanh toán xong mới note vào order_list.**

---

## 2. Luồng tổng quát

1. **Website:** Sinh danh sách `id_order` (mỗi item trong giỏ = 1 id_order riêng, hoặc 1 đơn nhiều item = nhiều id_order), đảm bảo không trùng trong phiên/session.
2. **User thanh toán** (Mcoin hoặc QR).
3. **Backend xác nhận thanh toán xong** (order_customer + wallet_transaction đã ghi).
4. **Note vào order_list:** INSERT từng dòng tương ứng (id_order, id_product, customer, price, ...).

Nếu bước 4 bị gọi **hai lần** với cùng bộ id_order (retry, webhook trùng, double-submit) → sẽ **trùng id_order** khi INSERT.

---

## 3. Khi note bị trùng id_order — hướng xử lý

### 3.1 Mục tiêu

- **Không để chuỗi xử lý bị lỗi:** Trùng id_order không được làm request/flow fail.
- **Tránh duplicate dòng:** Không tạo thêm dòng mới khi đã có dòng với id_order đó.
- **Idempotent:** Gọi nhiều lần với cùng dữ liệu thì kết quả cuối giống gọi một lần.

### 3.2 Giải pháp: UNIQUE + ON CONFLICT

| Bước | Nội dung |
|------|----------|
| **Ràng buộc** | Bảng `order_list` có **UNIQUE(id_order)** (mỗi dòng ứng với một id_order duy nhất). |
| **Ghi dữ liệu** | Dùng **INSERT ... ON CONFLICT (id_order) DO UPDATE SET ...** (upsert). |
| **Lần đầu** | INSERT chạy → thêm dòng mới. |
| **Lần sau (trùng id_order)** | Conflict → thực hiện UPDATE trên đúng dòng đó (ghi lại customer, price, status, ...) → **không lỗi**, không tạo dòng trùng. |

Như vậy:

- **Có UNIQUE(id_order)** → đảm bảo “mỗi dòng chỉ 1 id_order riêng biệt, không trùng”.
- **Có ON CONFLICT** → khi note bị trùng id_order thì **không báo lỗi**, hệ thống vẫn chạy đúng; dữ liệu được cập nhật lại theo lần gọi mới nhất (hoặc giữ nguyên nếu dùng DO NOTHING).

### 3.3 Hai lựa chọn ON CONFLICT

- **DO UPDATE SET**  
  - Khi trùng: cập nhật lại các cột (customer, contact, price, status, ...) theo giá trị lần gọi hiện tại.  
  - Phù hợp khi muốn “lần gọi sau có thể refresh lại thông tin” (retry đúng dữ liệu).

- **DO NOTHING**  
  - Khi trùng: không làm gì, giữ nguyên dòng cũ.  
  - Phù hợp khi “chỉ cần đảm bảo có dòng, không cần ghi đè”.

Ưu tiên thường dùng: **DO UPDATE SET** để retry vẫn đồng bộ đúng dữ liệu mới nhất.

---

## 4. Schema & code gợi ý

### 4.1 Ràng buộc trên bảng

- **UNIQUE(id_order)** trên `orders.order_list`.  
- Nếu bảng đang có UNIQUE khác (hoặc chưa có), cần migration:

```sql
-- Đảm bảo mỗi dòng order_list có id_order duy nhất
ALTER TABLE orders.order_list
  ADD CONSTRAINT order_list_id_order_key UNIQUE (id_order);
-- Hoặc nếu đã có index:
CREATE UNIQUE INDEX IF NOT EXISTS order_list_id_order_key
  ON orders.order_list (id_order);
```

(Lưu ý: nếu một đơn có **nhiều dòng** (nhiều sản phẩm), thì mỗi dòng phải có **id_order khác nhau** — website cần sinh n id_order cho n item.)

### 4.2 INSERT khi note (sau thanh toán)

```sql
INSERT INTO orders.order_list (
  id_order, id_product, information_order, customer, contact,
  order_date, days, order_expired, price, status
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (id_order) DO UPDATE SET
  id_product      = EXCLUDED.id_product,
  information_order = EXCLUDED.information_order,
  customer         = EXCLUDED.customer,
  contact          = EXCLUDED.contact,
  order_date       = EXCLUDED.order_date,
  days             = EXCLUDED.days,
  order_expired    = EXCLUDED.order_expired,
  price            = EXCLUDED.price,
  status           = EXCLUDED.status;
```

- Lần đầu: insert bình thường.
- Lần sau (trùng `id_order`): update đúng dòng đó → không lỗi, không duplicate.

---

## 5. Tóm tắt

| Câu hỏi | Trả lời |
|--------|--------|
| id_order dùng thế nào? | Mỗi dòng `order_list` có một id_order **riêng biệt, không trùng**; do website sinh, note vào DB **sau khi thanh toán thành công**. |
| Note khi nào? | Sau khi đã ghi order_customer + wallet_transaction (thanh toán xong). |
| Nếu note bị trùng id_order? | Dùng **UNIQUE(id_order)** + **INSERT ... ON CONFLICT (id_order) DO UPDATE SET ...** → không lỗi, không tạo dòng trùng, flow vẫn đúng. |
| DO UPDATE hay DO NOTHING? | Nên dùng **DO UPDATE SET** để retry/ghi trùng vẫn cập nhật đúng dữ liệu mới nhất. |

*Tài liệu tham chiếu: ORDER_SYSTEM.md, ORDER_SYSTEM_TASKS.md.*

---

## 6. Rủi ro: hai user khác nhau trùng mã (ghi đè lịch sử)

**Vấn đề bạn note:**

- User A thanh toán thành công, mã đơn **MAVCAKIL** → đã note vào `order_list`.
- User B mua sau nhưng **website lại render trùng mã MAVCAKIL** → khi note dùng `ON CONFLICT (id_order) DO UPDATE` → dòng của User A bị **ghi đè** bởi dữ liệu User B → User A mất lịch sử đơn → **hệ thống lỗi**.

Vậy **ON CONFLICT DO UPDATE** chỉ xử lý đúng khi “cùng một đơn bị gọi lại” (retry), **không** được dùng để cho phép hai đơn khác nhau dùng chung một `id_order`. Cần đảm bảo **mã đơn / mã transaction khi web render không trùng với database**, hoặc **check trước khi render**.

---

## 7. Hướng giải quyết: không trùng DB hoặc check trước khi render

### 7.1 Mục tiêu

- Mã đơn (`id_order`) và mã giao dịch (transaction_id) **không được trùng** với bản ghi đã có trong DB (order_list / order_customer / wallet_transaction).
- Trước khi hiển thị mã cho user, phải đảm bảo mã đó **chưa tồn tại** trong DB, hoặc do server cấp nên đã đảm bảo duy nhất.

### 7.2 Các hướng có thể dùng

| Hướng | Mô tả | Ưu / Nhược |
|-------|--------|------------|
| **A. Backend sinh mã** | Khi tạo đơn / tạo thanh toán QR, **backend** sinh `id_order` và `transaction_id`, kiểm tra (hoặc dùng sequence/unique) rồi trả về cho frontend. Frontend **chỉ hiển thị** mã nhận được. | **Ưu:** Trùng gần như không xảy ra; một nguồn sự thật. **Nhược:** Cần API tạo đơn/payment trước khi hiển thị mã. |
| **B. Check trước khi render** | Frontend sinh mã (hoặc nhận từ API tạm). Trước khi **render** mã cho user, gọi API kiểu **check/reserve**: “Mã X đã tồn tại chưa?”. Nếu chưa → hiển thị và dùng mã đó; nếu rồi → sinh lại (hoặc gọi backend lấy mã mới) rồi check lại. | **Ưu:** Có thể giữ logic sinh mã ở frontend nhưng vẫn tránh trùng. **Nhược:** Thêm round-trip; cần API check (vd. `GET /api/orders/check-code?code=MAVCAKIL` → 200 available / 409 taken). |
| **C. Mã đủ dài + entropy cao** | Sinh mã với entropy cao (timestamp + userId + random, hoặc UUID), xác suất trùng cực thấp. **Kèm theo:** Khi INSERT nếu bị conflict (trùng) → **không** DO UPDATE mà coi là lỗi logic, log và trả lỗi; backend sinh lại mã mới và trả về cho client thử lại. | **Ưu:** Đơn giản, ít đụng DB. **Nhược:** Vẫn có thể trùng (rất hiếm); cần xử lý conflict phía server (sinh lại, không ghi đè). |

### 7.3 Khuyến nghị kết hợp

- **Ưu tiên:** **Backend sinh mã** (id_order, transaction_id) khi tạo đơn / tạo payment (Mcoin hoặc QR). Frontend chỉ gửi giỏ hàng / số tiền; server trả về mã để hiển thị. Như vậy không trùng DB vì server có thể dùng sequence, check tồn tại, hoặc format có prefix + unique id.
- **Nếu tạm thời vẫn sinh mã ở frontend:** Dùng **check trước khi render** — API check mã có tồn tại chưa; nếu có thì không dùng, sinh lại hoặc lấy mã mới từ backend rồi mới hiển thị.
- **ON CONFLICT:** Chỉ dùng khi **cùng một đơn** (retry, webhook trùng). Khi **khác user / khác đơn** mà trùng mã → **không** UPDATE; nên log lỗi và trả về “mã trùng, vui lòng thử lại” hoặc để backend cấp mã mới. Có thể tách: nếu conflict thì kiểm tra thêm (vd. customer / account_id) có cùng không; chỉ khi đúng cùng đơn mới DO UPDATE, còn không thì báo lỗi.

### 7.4 Tóm tắt

- **Render mã:** Đảm bảo mã **không trùng database** (backend sinh hoặc check trước khi render).
- **Khi note:** UNIQUE(id_order) + ON CONFLICT DO UPDATE dùng cho **retry cùng đơn**; nếu trùng mã mà **khác đơn** thì **không ghi đè** — báo lỗi hoặc backend cấp mã mới.

---

## 8. API tạo mã đơn & transaction + luồng Mcoin / QR (triển khai)

### 8.1 API: POST /api/payment/create-codes

- **Mục đích:** Backend sinh mã đơn (`orderIds`) và mã giao dịch (`transactionId`) một lần, dùng cho bước thanh toán sau.
- **Check trùng DB:** Trước khi trả về, backend kiểm tra:
  - **id_order:** Bất kỳ mã nào trong `orderIds` đã tồn tại trong **order_list**, **order_expired**, **order_canceled**, hoặc **order_customer** → sinh lại bộ mã và kiểm tra lại (tối đa 5 lần).
  - **transaction_id:** Đã tồn tại trong **wallet_transaction** → sinh lại và kiểm tra lại.
  Chỉ trả về khi tất cả mã **chưa có** trong các bảng trên.
- **Khi gọi:** Khi khách bấm **Thanh toán Mcoin** hoặc **Thanh toán QR** (bước chọn phương thức / trước khi xác nhận).
- **Request (body):** `{ itemCount: number, idOrderPrefix?: "MAVL" | "MAVC" | "MAVK" }`
- **Response:** `{ orderIds: string[], transactionId: string }`
- **Auth:** Bắt buộc đăng nhập.

### 8.2 Luồng Mcoin

1. Khách bấm **Thanh toán Mcoin** → frontend gọi **POST /api/payment/create-codes** với `itemCount = cartItems.length` → nhận `orderIds`, `transactionId`.
2. Hiển thị bước xác nhận (số tiền, nút **Xác nhận thanh toán**).
3. Khách bấm **Xác nhận thanh toán** → frontend gọi **POST /api/payment/balance/confirm** với `amount`, `items` và **gửi kèm** `orderIds`, `transactionId` (backend dùng đúng bộ mã này, không sinh lại).
4. Backend trừ ví, ghi `order_customer` + `wallet_transaction` với mã đã nhận → gọi `handlePaymentSuccess` (note `order_list` + Telegram) → trả về thành công.
5. Frontend hiển thị thông báo thanh toán thành công (có thể hiển thị `transactionId` hoặc `orderIds[0]`).

### 8.3 Luồng QR

1. Khách bấm **Thanh toán QR** (Mua Siêu Tốc Qua...) → frontend gọi **POST /api/payment/create-codes** với `itemCount = cartItems.length` → nhận `orderIds`, `transactionId`.
2. Frontend gọi **POST /api/payment/create** với `amount`, `items` và **gửi kèm** `orderIds`, `transactionId` (backend ghi `order_customer` + `wallet_transaction` với đúng mã này, tạo link/QR SePay theo `transactionId`).
3. Hiển thị bước quét QR (nội dung chuyển khoản = `transactionId`).
4. Khách chuyển khoản → SePay gửi **webhook** → backend xử lý (cập nhật paid, lấy thông tin đơn từ `order_customer` / `wallet_transaction` đã ghi ở bước 2) → note `order_list` + Telegram.

### 8.4 Tóm tắt triển khai

| Thành phần | Việc cần làm |
|------------|----------------|
| **Backend** | Thêm POST `/api/payment/create-codes` (auth, body `itemCount`, `idOrderPrefix`); trả về `orderIds`, `transactionId`. |
| **Backend** | `confirmBalance` (Mcoin): nhận body `orderIds`, `transactionId`; truyền vào `confirmBalancePayment` để dùng mã có sẵn thay vì sinh lại. |
| **Backend** | `createPayment` (QR): khi có `items`, nhận body `orderIds`, `transactionId`; truyền vào `createQrOrder` để ghi đơn với mã có sẵn. |
| **Frontend** | Khi chọn Mcoin: gọi create-codes trước bước xác nhận; khi bấm Xác nhận thanh toán gửi kèm `orderIds`, `transactionId` trong balance/confirm. |
| **Frontend** | Khi chọn QR: gọi create-codes, sau đó gọi create với `orderIds`, `transactionId`; hiển thị QR/theo `transactionId`; webhook nhận thì backend dùng đúng bản ghi đã tạo để note. |