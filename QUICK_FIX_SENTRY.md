# 🔧 Quick Fix: Sentry bị Ad Blocker chặn

## ⚠️ Vấn đề
Bạn thấy lỗi `net::ERR_BLOCKED_BY_CLIENT` trong console khi test Sentry.

## ✅ Giải pháp nhanh nhất

### Option 1: Dùng Incognito Mode (Khuyến nghị - 30 giây)

1. **Chrome/Edge**: Nhấn `Ctrl + Shift + N` (Windows) hoặc `Cmd + Shift + N` (Mac)
2. **Firefox**: Nhấn `Ctrl + Shift + P` (Windows) hoặc `Cmd + Shift + P` (Mac)
3. Mở `http://localhost:4001` trong cửa sổ Incognito
4. Click button "Break the world"
5. ✅ Sentry sẽ hoạt động!

### Option 2: Tắt Ad Blocker cho localhost (1 phút)

#### uBlock Origin:
1. Click icon uBlock Origin trên thanh công cụ
2. Click icon **⚙️ Settings** (bánh răng)
3. Vào tab **Filter lists**
4. Scroll xuống tìm **"AdGuard"** hoặc **"EasyList"**
5. Tắt tạm thời
6. Hoặc thêm vào **My filters**: `@@||localhost^$all`

#### AdBlock Plus:
1. Click icon AdBlock Plus
2. Click **Settings** (⚙️)
3. Vào **Advanced** > **My filter list**
4. Thêm: `@@||localhost^$all`
5. Save

#### Brave Browser:
1. Click icon **Brave Shields** (🛡️)
2. Click **Advanced controls**
3. Tắt **Shields** cho `localhost`

### Option 3: Whitelist Sentry Domains (2 phút)

Thêm vào whitelist của Ad Blocker:
```
*.sentry.io
*.ingest.sentry.io
*.ingest.us.sentry.io
browser.sentry.io
o4510767167635456.ingest.us.sentry.io
```

## 🧪 Test sau khi fix

1. Restart dev server (nếu cần)
2. Mở browser (Incognito hoặc đã tắt Ad Blocker)
3. Mở DevTools (F12) > Console tab
4. Click button **"Break the world"** (màu đỏ ở header)
5. Kiểm tra:
   - ✅ Không còn lỗi `ERR_BLOCKED_BY_CLIENT`
   - ✅ Có log `[Sentry] Attempting to send event:`
   - ✅ Vào Sentry Dashboard > Issues > Thấy error mới

## 📊 Kiểm tra Sentry Dashboard

1. Vào: https://sentry.io
2. Chọn project của bạn
3. Vào tab **Issues**
4. Tìm error: **"This is your first error!"**
5. ✅ Nếu thấy = Sentry đã hoạt động!

## 💡 Lưu ý

- **Không cần deploy** để test Sentry trên localhost
- Trong **production**, Ad Blockers ít khi chặn Sentry
- **Replay** đã được tắt trong dev để tránh lỗi

## 🆘 Vẫn không work?

1. Kiểm tra `.env` có `VITE_SENTRY_DSN` đúng không
2. Thử browser khác (Chrome, Firefox, Edge)
3. Kiểm tra Firewall/Antivirus có block không
4. Xem Network tab trong DevTools có request đến `*.sentry.io` không
