# SEO Critical Fix Plan

Tai lieu nay tap trung xu ly 2 loi Critical ban vua gap:

1. `404 page` -> trang loi dang tra ve `200 OK`
2. `Accessible index page` -> redirect `/index.html` (va co the `/index.php`) chua dung

---

## 1) Muc tieu sau khi fix

- URL khong ton tai phai tra dung `404` (khong tra `200`).
- `/index.html` va `/index.php` phai `301` ve URL chuan `/`.
- Co 1 URL canonical duy nhat cho trang chu (`https://mavrykpremium.store/`).
- Khong de duplicate content do index pages.

---

## 2) Nguyen nhan thuong gap

### 2.1 404 dang tra 200

- Reverse proxy (Nginx/Apache/CDN) dang fallback moi request ve `index.html`.
- App SPA render trang "khong tim thay" o frontend nhung response HTTP van la `200`.

### 2.2 Index redirect sai

- Server van cho truy cap truc tiep `/index.html` (hoac `/index.php`) ma khong redirect.
- Redirect co the dang la `302` tam thoi, redirect chain, hoac redirect ve sai host/protocol.

---

## 3) Huong fix khuyen nghi

## 3.1 Redirect index pages (bat buoc)

Canh web server/proxy, them redirect `301`:

- `/index.html` -> `/`
- `/index.php` -> `/`

Yeu cau:

- Dung `301` (permanent)
- Khong tao redirect chain
- Khong doi host/protocol sai (giu https + domain canonical)

Vi du Nginx:

```nginx
location = /index.html {
  return 301 https://mavrykpremium.store/;
}

location = /index.php {
  return 301 https://mavrykpremium.store/;
}
```

Neu dung www la canonical thi doi URL dich cho dong bo.

## 3.2 Fix status code cho 404

Canh server/proxy, tach 2 nhom route:

- Route ung dung hop le (SPA routes): fallback `index.html` voi `200`
- URL khong hop le: tra trang 404 + status `404`

Neu hien tai khong co danh sach route ro rang, cach nhanh:

- Giu fallback cho nhom route da biet (`/`, `/cart`, `/adobe`, ...).
- Route la file khong ton tai (`/abcxyz-404-test`, `/foo/bar/not-found`) tra `404`.

Trang 404 nen co:

- Title rieng (`404 - Not Found`)
- Meta robots `noindex, follow`
- Link ve trang chu

---

## 4) Canonical + robots lien quan

- Home page:
  - `<link rel="canonical" href="https://mavrykpremium.store/" />`
- Trang 404:
  - `<meta name="robots" content="noindex, follow" />`
- Khong de canonical tro den `/index.html`.

---

## 5) Checklist verify sau deploy

Chay tren production:

```bash
curl -I https://mavrykpremium.store/index.html
curl -I https://mavrykpremium.store/index.php
curl -I https://mavrykpremium.store/duong-dan-khong-ton-tai-123
curl -I https://mavrykpremium.store/
```

Ket qua mong doi:

- `/index.html` -> `301` ve `/`
- `/index.php` -> `301` ve `/`
- URL random khong ton tai -> `404`
- `/` -> `200`

Test them bang browser va tool SEO:

- Khong con bao:
  - `404 page responded 200 status code`
  - `Redirect from index pages configured incorrectly`

---

## 6) Uu tien thuc hien

P0 (lam ngay):

1. Redirect 301 cho `/index.html`, `/index.php`
2. Tra dung status `404` cho URL khong ton tai
3. Deploy + verify bang `curl -I`

P1:

1. Bo sung test tu dong (smoke SEO):
   - assert `/index.html` la 301
   - assert route random la 404
2. Add monitor canh bao neu 2 endpoint nay bi sai sau deploy.

---

## 7) Ghi chu van hanh

- Neu dang dung CDN (Cloudflare, Vercel, Netlify), can check ca rule o CDN layer.
- Neu backend/API va web cung domain, dam bao rule redirect/404 chi ap dung dung scope web page.
- Sau khi fix, re-submit URL trong Google Search Console de recrawl nhanh.
