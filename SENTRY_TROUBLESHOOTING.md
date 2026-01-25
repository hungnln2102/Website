# Sentry Troubleshooting Guide

## Vấn đề: `net::ERR_BLOCKED_BY_CLIENT`

Lỗi này xảy ra khi trình duyệt hoặc extension (như Ad Blocker) chặn kết nối đến Sentry.

## Giải pháp

### 1. Tắt Ad Blocker (Khuyến nghị cho Testing)

**Các Ad Blocker phổ biến:**
- uBlock Origin
- AdBlock Plus
- Privacy Badger
- Brave Browser's built-in blocker

**Cách tắt:**
1. Click vào icon Ad Blocker trên thanh công cụ
2. Tắt cho domain hiện tại (localhost hoặc domain của bạn)
3. Hoặc whitelist domain Sentry: `*.sentry.io`

### 2. Sử dụng Incognito/Private Mode

Incognito mode thường không có Ad Blocker:
- **Chrome/Edge**: `Ctrl+Shift+N` (Windows) hoặc `Cmd+Shift+N` (Mac)
- **Firefox**: `Ctrl+Shift+P` (Windows) hoặc `Cmd+Shift+P` (Mac)

### 3. Whitelist Sentry Domains trong Ad Blocker

Thêm các domain sau vào whitelist:
```
*.sentry.io
*.ingest.sentry.io
*.ingest.us.sentry.io
browser.sentry.io
```

### 4. Kiểm tra Browser Extensions

1. Mở `chrome://extensions/` (Chrome) hoặc `about:addons` (Firefox)
2. Tắt từng extension một để tìm extension nào đang block
3. Các extension thường gây vấn đề:
   - Privacy extensions
   - Security extensions
   - Network blocking extensions

### 5. Kiểm tra Network Tab

1. Mở DevTools (F12)
2. Vào tab **Network**
3. Click button "Break the world"
4. Tìm request đến `*.sentry.io`
5. Xem status code và error message

### 6. Kiểm tra CSP (Content Security Policy)

Đảm bảo `index.html` có CSP cho phép Sentry:
```html
<meta http-equiv="Content-Security-Policy" content="... connect-src ... https://*.ingest.sentry.io ..." />
```

### 7. Test trên Production

Nếu vẫn không work trên localhost, thử deploy lên server:
- Ad Blockers ít khi block trên production domains
- Network security ít strict hơn

## Debug Mode

Trong development, Sentry đã được cấu hình với `debug: true`. Bạn sẽ thấy logs trong console:
- `[Error Tracker] Sentry initialized successfully`
- `[Sentry] Attempting to send event: ...`

## Replay Disabled in Development

Session Replay đã được tắt trong development mode để tránh lỗi với Ad Blockers. Replay chỉ hoạt động trong production.

## Kiểm tra Sentry Dashboard

Sau khi fix, kiểm tra:
1. Vào Sentry Dashboard
2. Vào project của bạn
3. Vào tab **Issues**
4. Bạn sẽ thấy error "This is your first error!" nếu đã gửi thành công

## Vẫn không work?

1. **Kiểm tra DSN**: Đảm bảo `VITE_SENTRY_DSN` trong `.env` đúng
2. **Kiểm tra Network**: Đảm bảo không có firewall block
3. **Thử browser khác**: Chrome, Firefox, Edge
4. **Deploy lên server**: Test trên production environment
