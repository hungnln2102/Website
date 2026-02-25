# Cấu hình nhận mail (Inbound) – support@mavrykpremium.store

Theo [Resend Docs – Receiving Emails](https://resend.com/docs/dashboard/inbound/introduction) và [Custom Receiving Domains](https://resend.com/docs/dashboard/receiving/custom-domains).

---

## Vì sao bị "554 Relay access denied"?

Khi Gmail (hoặc máy chủ khác) gửi tới **support@mavrykpremium.store**, nó tra cứu **MX record** của domain. Nếu:

- Chưa có MX trỏ tới Resend, hoặc  
- MX đang trỏ sang hòm thư khác (Google, hosting…) và máy đó **không** chấp nhận relay cho `mavrykpremium.store`  

→ sẽ trả **554 5.7.1 Relay access denied**.

Để nhận mail qua Resend, domain (hoặc subdomain) phải **verify** và thêm **MX record nhận mail** do Resend cung cấp.

---

## Các bước cấu hình (trên Resend Dashboard)

### Bước 1: Domain trong Resend

1. Vào **[Domains](https://resend.com/domains)**.
2. Nếu chưa có **mavrykpremium.store**: **Add Domain** → nhập `mavrykpremium.store` (hoặc subdomain, xem bước 2).
3. Verify domain (SPF + DKIM) theo hướng dẫn trên dashboard. Chỉ khi domain **Verified** mới bật được Receiving.

### Bước 2: Dùng root domain hay subdomain?

- **Đang dùng Gmail/Google Workspace (hoặc MX khác) cho `@mavrykpremium.store`?**  
  → Nên dùng **subdomain** cho Resend Inbound để tránh đụng MX, ví dụ: **mail.mavrykpremium.store**.  
  Khi đó bạn nhận mail tại **support@mail.mavrykpremium.store** (hoặc địa chỉ Resend gợi ý trên subdomain đó).  
  Nếu muốn **support@mavrykpremium.store** (root domain) nhận qua Resend thì phải **đổi MX root** sang Resend (sẽ không còn nhận qua Gmail ở root).

- **Chưa dùng MX nào cho mavrykpremium.store**  
  → Có thể thêm domain root **mavrykpremium.store** trong Resend và thêm MX nhận mail cho root → nhận được **support@mavrykpremium.store**.

Tóm lại: quyết định dùng **root** hay **subdomain** trước, rồi add đúng tên đó trong Resend.

### Bước 3: Bật Receiving và lấy MX record

1. Vào **[Domains](https://resend.com/domains)** → chọn domain (ví dụ `mavrykpremium.store` hoặc `mail.mavrykpremium.store`).
2. Trong phần **Receiving** (Inbound): bật **Enable receiving** (toggle).
3. Resend hiển thị **MX record** cần thêm (host + giá trị + priority). Ví dụ dạng:
   - **Type:** MX  
   - **Name/Host:** `@` (hoặc `mail` nếu dùng subdomain)  
   - **Value:** `inbound-smtp.xx-x-x.amazonaws.com` (hoặc host Resend đưa)  
   - **Priority:** số Resend ghi (thường 10).

**Quan trọng:** Với root domain đã có MX (vd Gmail), MX của Resend phải có **priority thấp hơn** (số nhỏ hơn) mới nhận mail qua Resend; nếu không sẽ vẫn vào Gmail và dễ conflict. Khi dùng subdomain thì chỉ cần một MX cho subdomain đó.

### Bước 4: Thêm MX vào DNS

1. Vào nhà cung cấp DNS (Cloudflare, GoDaddy, v.v.).
2. Thêm bản ghi **MX** đúng **Name**, **Value**, **Priority** như Resend hiển thị.
3. Nếu Resend yêu cầu thêm bản ghi khác (TXT/CNAME) cho receiving thì thêm đủ.
4. Trở lại Resend → **"I've added the record"** → chờ trạng thái receiving **Verified**.

Tài liệu tham khảo: [How do I avoid conflicts with my MX records?](https://resend.com/docs/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records)

### Bước 5: Webhook `email.received`

1. Vào **[Webhooks](https://resend.com/webhooks)**.
2. **Add** → Event: **email.received**.
3. **Endpoint URL:** `https://api.mavrykpremium.store/webhook/mail` (đúng URL server đang lắng).
4. Lưu **Signing secret** (whsec_...) → ghi vào `.env` là **SIGNING_SECRET**.

Server đã có route `POST /webhook/mail` và verify chữ ký Svix; chỉ cần URL và secret khớp.

### Bước 6: Biến môi trường (server)

Trong `.env` của server:

```env
SEND_MAIL_API_KEY=re_xxxx
MAIL_WEBHOOK_URL=https://api.mavrykpremium.store/webhook/mail
SIGNING_SECRET=whsec_xxxx
```

---

## Kiểm tra nhanh

1. **MX:** `dig MX mavrykpremium.store` (hoặc subdomain) → thấy host Resend, priority đúng.
2. **Gửi thử:** Gửi một mail từ Gmail (hoặc hộp khác) tới **support@mavrykpremium.store** (hoặc support@mail.mavrykpremium.store nếu dùng subdomain).
3. **Resend:** Vào [Emails → Receiving](https://resend.com/emails/receiving) xem có bản ghi nhận.
4. **Webhook:** Xem [Webhooks](https://resend.com/webhooks) có event `email.received` và response 200.

---

## Tài liệu Resend

- [Receiving Emails (Inbound)](https://resend.com/docs/dashboard/inbound/introduction)
- [Custom Receiving Domains](https://resend.com/docs/dashboard/receiving/custom-domains)
- [Verify webhook requests](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Avoid MX conflicts](https://resend.com/docs/knowledge-base/how-do-i-avoid-conflicting-with-my-mx-records)
