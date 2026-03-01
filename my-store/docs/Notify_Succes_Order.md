# Notify Success Order – Đặc tả Final

Tài liệu mô tả luồng thông báo đơn hàng đã hoàn thành: thanh toán trên Website → ghi **order_list** khi thanh toán thành công → thông báo Telegram (topic 2733); Admin dùng Bot `/done` để bổ sung slot, note, NCC → Server cập nhật order_list và (tuỳ chọn) gửi "Đơn đã hoàn thành" lên Telegram.

---

## 1. Mục đích

- **Topic 2733** (Telegram): nhận thông báo đơn hàng mới khi thanh toán thành công và (tuỳ chọn) thông báo đơn đã hoàn thành khi Bot gửi `/done`.
- **Bot**: Lệnh `/done` + nút bấm để Admin gửi slot, note, NCC lên Server — Server **cập nhật** order_list theo id_order, không tạo mới.
- **order_list**: Có dòng **khi thanh toán thành công** (Mcoin: ngay lúc xác nhận; QR: khi user quét/thanh toán xong và frontend gọi confirmTransfer kèm items). Bot /done chỉ **note thêm** (slot, note, NCC, cost).

---

## 2. Tổng quan luồng

| Bước | Nơi | Hành động |
|------|-----|------------|
| 1 | Website | Thanh toán (Mcoin/QR) → ghi **order_customer**; khi **thanh toán thành công** ghi **order_list** (id_order, customer, order_date, variant, price, …) → gửi "đơn hàng mới" lên **Telegram topic 2733**. |
| 2 | Bot | Admin gửi `/done {mã đơn} TK\|Note\|Slot` → chọn NCC (InlineKeyboard) → Bot POST payload (id_order, slot, note, supply) lên Server. |
| 3 | Server | Nhận notify-done → tìm **order_list** theo id_order → **cập nhật** slot, note, supply, cost; (tuỳ chọn) gửi "Đơn đã hoàn thành" lên topic 2733. |

---

## 3. Bot (mavrykstore_bot)

### 3.1 Format lệnh `/done`

- **Chuẩn**: `/done {mã đơn} TK|Note|Slot`
  - `{mã đơn}`: MAVC / MAVL / MAVK... (bắt buộc).
  - Phần sau khoảng trắng: **TK | Note | Slot** — ba trường cách nhau bởi `|`; có thể để trống (vd. `||` hoặc `TK||`).
- **Ví dụ**:
  - `/done MAVL123456 TK|Ghi chú|Slot1`
  - `/done MAVC999999 ||` (không TK, không Note, không Slot).

### 3.2 Luồng sau khi gửi lệnh: chọn NCC

1. User gửi `/done {mã đơn} TK|Note|Slot`.
2. Bot parse → hiển thị **danh sách NCC** (InlineKeyboard).
3. User chọn một NCC → Bot gửi payload lên Server: **id_order**, **slot**, **note**, **supply** (id hoặc tên NCC).
4. Danh sách NCC: lấy từ API Server (vd. `GET /api/suppliers`) hoặc từ DB Bot (bảng supplier) nếu có.

### 3.3 Nút bấm (tránh quên)

- **Cách 1**: Trong màn hình đơn Chưa Thanh Toán (`View_order_unpaid.py`), thêm nút **"✅ Done – Gửi lên Server"** → gửi đơn đó + hiện chọn NCC → POST lên Server.
- **Cách 2**: `/done` không tham số → Bot hiện InlineKeyboard chọn đơn (unpaid/gần đây) → nhập TK|Note|Slot → chọn NCC → POST.
- **Đề xuất**: Làm cả hai cách.

### 3.4 Gửi lên Server

- **Config**: Env `NOTIFY_ORDER_DONE_URL`, `NOTIFY_ORDER_DONE_ENABLED` (và secret nếu cần).
- **HTTP**: POST body JSON (id_order, slot, note, supply). Price/Cost do Server tự tính từ variant + prefix + NCC.

---

## 4. Server (Website – my-store)

### 4.1 Ghi order_list khi thanh toán thành công

- **Mcoin**: Ngay khi xác nhận thanh toán (trừ ví) → ghi **order_customer** + **order_list** → gửi Telegram.
- **QR**: Khi user quét mã/chuyển khoản xong → frontend gọi **confirmTransfer** (orderId, amount, **items**) → Server ghi **order_customer** (paid) + **order_list** (từ items) → gửi Telegram. Không ghi tạm lúc tạo đơn; chỉ ghi khi thanh toán thành công.

Khi ghi order_list (cả Mcoin và QR):

1. Ghi **order_customer** (như hiện tại).
2. Ghi vào **order_list** cho từng id_order (mỗi item = 1 dòng):
   - **Có ngay**: id_order, customer (từ account), contact (mặc định Website), order_date, days (từ variant/duration), order_expired (order_date + days), id_product/variant, **variant_id**, information_order, **price** (từ item), status (vd. "Đang Tạo Đơn").
   - **Để trống (Bot điền sau)**: slot, note, supply (NCC), cost.
3. Gửi thông báo **đơn hàng mới** lên **Telegram topic 2733**.

**Lưu variant_id**: Khi tạo từng dòng order_customer, cần lưu **variant_id** (hoặc id_product) cho id_order tương ứng — dùng khi notify-done để tính price theo prefix và cost theo NCC. (Nếu order_list và order_customer dùng chung nguồn từ giỏ hàng, variant_id có thể lấy từ item; nếu order_customer chưa lưu variant_id thì cần thêm cột hoặc bảng chi tiết.)

### 4.2 Price: tính từ mã đơn (MAVC, MAVL, MAVK)

- Công thức (đồng bộ Bot `calculate_price.py` và Website):
  - **MAVC**: price = base_price × pct_ctv  
  - **MAVL**: price = base_price × pct_ctv × pct_khach  
  - **MAVK**: price = (base_price × pct_ctv × pct_khach) × (1 − pct_promo)
- **base_price**: từ `supplier_cost` (max price theo variant). **pct_ctv, pct_khach, pct_promo**: từ `price_config` theo variant.
- Price đã ghi vào order_list **lúc thanh toán** (từ item); khi notify-done có thể giữ nguyên hoặc tính lại từ variant_id + prefix nếu cần.

### 4.3 Cost: lấy qua id NCC

- **Cost** = giá nhập theo **variant + NCC**. Bảng **supplier_cost**: (variant_id, supplier_id) → price.
- Khi notify-done: từ payload có **supply** (supplier_id) + variant_id của đơn → tra supplier_cost → ghi **order_list.cost**.

### 4.4 API notify-done

- **Endpoint**: `POST /api/orders/notify-done` (hoặc `/api/telegram/order-done`).
- **Body (JSON)**: `id_order`, `slot`, `note`, `supply` (id hoặc tên NCC). Không bắt buộc: productName, informationOrder, customer, contact, orderDate, days, orderExpired, cost, price, status (Server có thể tự điền từ order_list/order_customer).
- **Bảo mật**: Xác thực API key/secret (header hoặc query).
- **Xử lý**: Tra order_list theo id_order → **UPDATE** slot, note, supply; điền cost từ supplier_cost(variant_id, supply); (tuỳ chọn) cập nhật status; (tuỳ chọn) gọi `notifyOrderDone` → gửi "Đơn đã hoàn thành" lên Telegram topic 2733.

### 4.5 Telegram topic 2733

- **Đơn hàng mới**: Đã có — gửi khi thanh toán thành công (từ order_list hoặc order_customer + items).
- **Đơn đã hoàn thành**: Thêm hàm (vd. `notifyOrderDone`) trong `telegram.service.ts`, build nội dung từ order_list (sau khi update), gửi với `message_thread_id: TELEGRAM_TOPIC_ID` (2733).

---

## 5. Checklist triển khai

### Bot

- [ ] Parse `/done {mã đơn} TK|Note|Slot` (mã đơn + space + TK|Note|Slot).
- [ ] Sau khi parse: hiển thị danh sách NCC (InlineKeyboard), user chọn 1 NCC.
- [ ] Handler `/done` không tham số: hiện InlineKeyboard chọn đơn → nhập TK|Note|Slot → chọn NCC → POST.
- [ ] Nút "Done – Gửi lên Server" trong màn hình Unpaid (gửi đơn đó + chọn NCC).
- [ ] Config: NOTIFY_ORDER_DONE_URL, NOTIFY_ORDER_DONE_ENABLED (và secret nếu dùng).
- [ ] POST JSON (id_order, slot, note, supply) + xử lý lỗi / retry.

### Server – Khi thanh toán (Mcoin/QR)

- [ ] **Mcoin**: Sau khi ghi order_customer + wallet_transaction → ghi từng dòng **order_list** → gửi Telegram.
- [ ] **QR**: Khi gọi **confirmTransfer** (thanh toán thành công), nhận body **items** (id_product, price, duration, quantity, extraInfo); nếu items.length === orderIds → ghi **order_list** + gửi Telegram. Frontend trang success gửi kèm `items` khi gọi API xác nhận thanh toán.
- [ ] Gửi thông báo "đơn hàng mới" lên Telegram (topic 2733).

### Server – notify-done (Bot gửi lên)

- [ ] Route `POST /api/orders/notify-done`; validate body; xác thực secret/API key.
- [ ] Tra order_list theo id_order → **cập nhật** slot, note, supply; điền cost từ supplier_cost(variant_id, supply); giữ hoặc cập nhật price/status.
- [ ] (Tuỳ chọn) Gọi notifyOrderDone → gửi "Đơn đã hoàn thành" lên topic 2733.
- [ ] API danh sách NCC (vd. `GET /api/suppliers`) cho Bot hiển thị nút chọn NCC.

### Chung

- [ ] Test E2E: Thanh toán → order_list có dòng + Telegram "đơn hàng mới"; Bot /done → order_list cập nhật + (nếu bật) Telegram "Đơn đã hoàn thành".
- [ ] Cập nhật doc/env với endpoint, env, format payload sau khi ổn định.

---

## 6. Tóm tắt luồng Mcoin vs QR

| Luồng | Các bước |
|-------|----------|
| **Mcoin** | Xác nhận thanh toán → Thanh toán thành công (trừ ví) → ghi **order_customer** + **order_list** → gửi thông báo Telegram. |
| **QR** | Tạo đơn (createPayment + items) → User quét QR/chuyển khoản → **Thanh toán thành công** → frontend gọi confirmTransfer(orderId, amount, **items**) → ghi **order_customer** (paid) + **order_list** + gửi thông báo Telegram. |

**Chung:** Cả hai đều ghi order_list **đúng lúc thanh toán thành công** (không ghi tạm). QR: frontend khi gọi confirmTransfer phải gửi kèm **items** (cùng format lúc tạo đơn) để Server ghi order_list và gửi Telegram.

*Mcoin = trừ ví; QR = nhận webhook/confirmTransfer. Từ thời điểm đó: thông báo thành công + ghi order_list (và order_customer) là đủ.*

---

## 7. Hỏi – Đáp

**1. Khi QR tới mục thanh toán quét QR, mọi thông tin đơn hàng vẫn đang ở cart_item đúng không?**

**Đúng.** Ở bước hiển thị mã QR để quét, frontend đã gọi `createPayment` với `items` từ giỏ hàng (cart). Dữ liệu đơn hàng vẫn có trong **cart_items** (và/hoặc trong state frontend) vì cart thường chỉ xóa sau khi thanh toán thành công. Vì vậy khi user thanh toán xong và trang success gọi **confirmTransfer**, frontend có thể lấy lại `items` từ cart hoặc state để gửi kèm (orderId, amount, **items**) cho Server ghi order_list và gửi Telegram.

**2. Khi nhận được webhook thanh toán thành công thì sẽ thông báo thành công, note database và gửi thông báo Telegram đúng không?**

**Đúng về mục tiêu;** cách làm tùy triển khai:

- **Cách hiện tại (confirmTransfer do frontend gọi):** Webhook từ ngân hàng/SePay thường chỉ báo “đã chuyển tiền” và redirect user về trang success. Phần **thông báo thành công + ghi order_list + gửi Telegram** nằm ở **confirmTransfer**: frontend gọi `confirmTransfer(orderId, amount, items)` → Server ghi order_customer (paid), order_list (từ items), gửi Telegram.  
  **→ Hiện tại không có bảng phụ, nên dùng đúng cách này:** frontend trang success gửi kèm **items** khi gọi confirmTransfer.

- **Cách dùng cart_items khi webhook (không cần bảng phụ):** Khi webhook “thanh toán thành công” tới, Server lấy **account_id** và danh sách **id_order** từ `order_customer` (theo payment_id/transaction_id), lấy **cart_items** của account đó (sort cố định, vd. theo id), map **orderIds[i]** với **cart_items[i]**, từ mỗi dòng cart (variant_id, quantity, extra_info) + variant để có price, duration → build danh sách items → ghi **order_list** và gửi Telegram. **order_customer** chỉ cần cập nhật status = paid. Đang ở trang thanh toán (quét QR) thì user không thể sửa giỏ nữa → cart_items khi webhook tới khớp đúng đơn, không cần bảng phụ.

- **Cách bảng phụ (chỉ khi cần chắc chắn đúng đơn):** Lưu snapshot items vào bảng phụ lúc createPayment; webhook đọc từ bảng phụ. Dùng khi không chấp nhận rủi ro cart bị đổi sau khi tạo đơn.

---

## 8. Luồng tóm tắt (note)

Khách hàng bấm mua sản phẩm và điền thông tin bổ sung => Được lưu vào cart_items. Vào giỏ hàng bấm thanh toán, chọn 1 trong 2 phương thức:

1. **Mcoin:** Xác nhận thanh toán => Thanh toán thành công => lấy thông tin từ cart_items note vào order_customer và order_list => gửi thông báo Telegram.
2. **QR:** Xác nhận thanh toán => Chuyển đến trang quét QR => Nhận webhook thanh toán thành công => Thanh toán thành công => lấy thông tin từ cart_items note vào order_customer và order_list => gửi thông báo Telegram.

---

## 9. Đối chiếu luồng note với hệ thống hiện tại

| Luồng | Luồng note | Code hiện tại | Khớp? |
|-------|------------|---------------|-------|
| **Mcoin** | Thanh toán thành công → lấy từ cart_items → ghi order_customer + order_list → Telegram | Frontend gửi **items trong body** khi gọi confirmBalance; Server **không** query cart_items. Server nhận payload → ghi order_customer + wallet_transaction → handlePaymentSuccess(items từ body) → ghi order_list + Telegram. | **Đúng** — dữ liệu từ cart do frontend gửi; Server dùng payload. |
| **QR** | Webhook thanh toán thành công → lấy từ cart_items → ghi order_customer + order_list → Telegram | **Webhook** (sepay processWebhook): chỉ cập nhật order_customer (paid) + wallet_tx + gửi Telegram. **Không** đọc cart_items, **không** ghi order_list. Ghi order_list chỉ khi **frontend gọi confirmTransfer** kèm body **items**. | **Chưa khớp** — webhook không lấy cart_items và không ghi order_list. |

**Kết luận:**

- **Mcoin:** Luồng note đúng với hệ thống (dữ liệu từ cart qua frontend; Server ghi order_customer + order_list + Telegram).
- **QR:** Luồng note (webhook → cart_items → order_customer + order_list + Telegram) **chưa đúng code**. Hiện tại webhook chỉ cập nhật paid + Telegram; order_list chỉ được ghi khi frontend gọi confirmTransfer với items. Muốn đúng như note cần bổ sung trong processWebhook: đọc cart_items theo account_id, map với orderIds, gọi insertOrderListFromPayment + notifyNewOrder.

---

## 10. Phương án tối ưu (QR)

| Phương án | Ưu | Nhược | Độ phức tạp |
|-----------|-----|--------|-------------|
| **A. confirmTransfer + items (hiện tại)** | Không đổi DB, đã có sẵn. Frontend gửi items từ cart/state. | Phụ thuộc user mở trang success và frontend gọi API. User đóng trình duyệt sau khi chuyển khoản → order_list có thể không có. Có thể trùng thông báo Telegram. | Thấp |
| **B. Webhook + đọc cart_items** | Một nơi xử lý (webhook): paid + order_list + Telegram. Không phụ thuộc frontend, không thêm bảng. **Đã vào trang thanh toán (quét QR) thì user không thể sửa giỏ nữa** → cart_items khi webhook tới khớp đúng đơn. | Không đáng kể trong luồng thực tế. | Trung bình |
| **C. Webhook + bảng phụ** | Snapshot đúng đơn lúc tạo; webhook đọc bảng phụ. | Cần migration + bảng mới, code lưu items lúc createPayment. | Cao |

**Đề xuất: Phương án B (Webhook + đọc cart_items)** — tối ưu nhất (đã triển khai):

1. **Đáng tin:** Thanh toán thành công xử lý tại một chỗ (webhook), không phụ thuộc frontend hay user mở trang success.
2. **Đơn giản:** Không thêm bảng, tận dụng cart_items; chỉ bổ sung logic trong processWebhook.
3. **An toàn:** Đang ở trang thanh toán rồi thì user không thể sửa đổi hạng mục nào nữa → khi webhook tới, cart_items phản ánh đúng đơn vừa thanh toán. Không cần bảng phụ.

**Triển khai:** Trong `sepay.service.ts` processWebhook: sau khi cập nhật paid, lấy orderIds (ORDER BY created_at ASC), gọi `buildOrderListItemsFromCart(accountId, orderIds)` từ `cart.service` → nếu trả về items (số lượng khớp) thì truyền `itemsForOrderList` vào `handlePaymentSuccess` → ghi order_list + gửi Telegram. Hàm `buildOrderListItemsFromCart` dùng `getCartItemsEnriched` (cart thứ tự created_at DESC) map với orderIds.