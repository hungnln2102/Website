# Hướng dẫn Deploy & Chuyển đổi sang Unified Nginx

Tài liệu này hướng dẫn cách chuyển đổi từ việc dùng Nginx trong Docker sang dùng **Nginx trực tiếp trên Ubuntu (Host Nginx)** để chạy chung nhiều dự án trên cùng port 80/443.

## Bước 1: Chuẩn bị Host Nginx

### 1.1. Dừng các container Nginx đang chiếm port 80/443

`admin_orderlist` **không còn chạy Nginx trong Docker**. Nếu vẫn còn container `admin_orderlist-nginx` cũ, cần dừng/xóa:

```bash
docker stop admin_orderlist-nginx 2>/dev/null || true
docker rm admin_orderlist-nginx 2>/dev/null || true
```

Hoặc chạy `./deploy.sh` trong `admin_orderlist` — script sẽ tự dừng container nginx cũ.

### 1.2. Cài đặt các thành phần cần thiết trên Host

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

## Bước 2: Cấu hình Dự án

### 2.1. admin_orderlist (không dùng Nginx trong Docker)

- `admin_orderlist` chỉ chạy **postgres, backend, frontend**. Backend expose **3001** (API) và **5000** (webhook Sepay).
- Host Nginx (`nginx-server.conf`) proxy:
  - `admin.mavrykpremium.store` → frontend **8081**, `/api/` → **3001**, `/image/` → **3001**
  - `/webhook`, `/bot/payment_sepay/` → **5000**

Deploy: `cd admin_orderlist && ./deploy.sh`

### 2.2. Deploy dự án mới này

```bash
# Vào thư mục dự án mới
cd /root/Website
./deploy.sh
```

## Bước 3: Setup Unified Nginx

### 3.1. Copy cấu hình vào Nginx Host

**Lưu ý:** File `nginx-server.conf` hiện tại chỉ có port 80 để giúp Nginx khởi động được khi chưa có SSL.

```bash
# Tạo file proxy_params nếu chưa có
sudo bash -c 'cat > /etc/nginx/proxy_params << EOF
proxy_set_header Host \$host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
EOF'

# Copy file cấu hình (đã được sửa thành port 80 tạm thời)
sudo cp nginx-server.conf /etc/nginx/sites-available/mavryk-unified.conf
sudo ln -s /etc/nginx/sites-available/mavryk-unified.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null

# Restart Nginx để nhận domain mới
sudo systemctl restart nginx
```

### 3.2. Chạy Certbot để tạo SSL và tự động cấu hình HTTPS

```bash
sudo certbot --nginx -d mavrykpremium.store -d api.mavrykpremium.store -d admin.mavrykpremium.store
```

### 3.3. Restart Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Bước 4: Kiểm tra

Bây giờ bạn có thể truy cập:
1. https://mavrykpremium.store (Dự án mới - Web)
2. https://api.mavrykpremium.store (Dự án mới - API)
3. https://admin.mavrykpremium.store (Dự án cũ)

Tất cả đều chạy chung qua Nginx Host và có HTTPS! 🚀

---

## Các lệnh quản lý sau này

- **Xem log Nginx Host:** `sudo tail -f /var/log/nginx/*.log`
- **Restart Nginx Host:** `sudo systemctl restart nginx`
- **Renew SSL:** Certbot tự làm, nhưng có thể test bằng `sudo certbot renew --dry-run`

### Đồng bộ lại Nginx sau khi sửa `nginx-server.conf`

Mỗi khi cập nhật `nginx-server.conf` (vd. thêm route, đổi upstream), cần copy lên Host và reload:

```bash
# Cách 1: Dùng deploy script (trong thư mục Website)
SYNC_NGINX=1 ./deploy.sh

# Cách 2: Làm tay
sudo cp nginx-server.conf /etc/nginx/sites-available/mavryk-unified.conf
sudo nginx -t && sudo systemctl reload nginx
```
