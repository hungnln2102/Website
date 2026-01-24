# Hướng dẫn Deploy & Chuyển đổi sang Unified Nginx

Tài liệu này hướng dẫn cách chuyển đổi từ việc dùng Nginx trong Docker sang dùng **Nginx trực tiếp trên Ubuntu (Host Nginx)** để chạy chung nhiều dự án trên cùng port 80/443.

## Bước 1: Chuẩn bị Host Nginx

### 1.1. Dừng các container Nginx đang chiếm port 80/443

Bạn cần tìm và dừng các container đang chiếm port 80/443 (ví dụ dự án `admin_orderlist`).

```bash
# Vào thư mục dự án cũ
cd /root/admin_orderlist
# Dừng container nginx (hoàn toàn hoặc chỉ service nginx)
docker compose stop nginx
```

### 1.2. Cài đặt các thành phần cần thiết trên Host

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

## Bước 2: Cấu hình Dự án

### 2.1. Cập nhật admin_orderlist (Dự án cũ)

Mở file `admin_orderlist/docker-compose.yml` và đảm bảo port 5000 được expose để Host Nginx có thể gọi vào:

```yaml
# admin_orderlist/docker-compose.yml
services:
  backend:
    ports:
      - "3001:3001"
      - "5000:5000" # Thêm dòng này
```

Sau đó restart dự án đó: `docker compose up -d`

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
