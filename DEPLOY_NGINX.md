# Hướng dẫn Deploy với Nginx

Tài liệu này hướng dẫn cách deploy dự án lên server sử dụng Nginx thay vì Caddy.

## Yêu cầu

- Server đã cài đặt:
  - Docker và Docker Compose
  - Nginx
  - Certbot (cho SSL)
- Domains đã trỏ về IP server:
  - `mavrykpremium.store`
  - `api.mavrykpremium.store`

## Bước 1: Chuẩn bị Server

### 1.1. Kiểm tra Nginx

```bash
# Kiểm tra Nginx đã cài đặt
nginx -v

# Kiểm tra status
sudo systemctl status nginx

# Nếu chưa cài, cài đặt Nginx
sudo apt update
sudo apt install nginx -y
```

### 1.2. Cài đặt Certbot (nếu chưa có)

```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx -y
```

## Bước 2: Deploy Docker Containers

### 2.1. Clone hoặc pull code mới nhất

```bash
cd /path/to/project
git pull origin main
```

### 2.2. Tạo file .env (nếu chưa có)

```bash
# Tạo file .env với các biến môi trường cần thiết
cat > .env << 'EOF'
# Database
POSTGRES_DB=my-store
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5433

# API URLs
VITE_SERVER_URL=https://api.mavrykpremium.store
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/my-store

# CORS
CORS_ORIGIN=https://mavrykpremium.store
FRONTEND_URL=https://mavrykpremium.store

# Logging
LOG_LEVEL=info
EOF
```

**Lưu ý:** Thay `your_secure_password_here` bằng mật khẩu thực tế của bạn.

### 2.3. Chạy deploy script

```bash
# Deploy containers
./deploy.sh

# Kiểm tra containers đang chạy
docker ps
```

Bạn sẽ thấy 3 containers:
- `website-postgres` - Database
- `website-api` - Backend API (port 4000)
- `website-web` - Frontend (port 4001)

## Bước 3: Cấu hình Nginx

### 3.1. Copy file cấu hình Nginx

```bash
# Copy file cấu hình
sudo cp nginx-server.conf /etc/nginx/sites-available/mavrykpremium.store

# Tạo symlink
sudo ln -s /etc/nginx/sites-available/mavrykpremium.store /etc/nginx/sites-enabled/

# Xóa default config nếu không dùng
sudo rm /etc/nginx/sites-enabled/default
```

### 3.2. Test cấu hình Nginx

```bash
# Kiểm tra syntax
sudo nginx -t

# Nếu OK, reload Nginx
sudo systemctl reload nginx
```

## Bước 4: Cấu hình SSL với Let's Encrypt

### 4.1. Lấy SSL certificates

```bash
# Chạy certbot để lấy SSL cho cả 2 domains
sudo certbot --nginx -d mavrykpremium.store -d api.mavrykpremium.store

# Certbot sẽ tự động:
# 1. Lấy certificates từ Let's Encrypt
# 2. Cập nhật Nginx config
# 3. Reload Nginx
```

### 4.2. Kiểm tra auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot sẽ tự động renew certificates trước khi hết hạn
```

## Bước 5: Kiểm tra Deployment

### 5.1. Kiểm tra Docker containers

```bash
# Xem logs
docker logs website-web
docker logs website-api
docker logs website-postgres

# Kiểm tra health
docker ps
```

### 5.2. Kiểm tra websites

Truy cập các URLs sau:

1. **Frontend**: https://mavrykpremium.store
2. **API**: https://api.mavrykpremium.store/health (hoặc endpoint test khác)

### 5.3. Kiểm tra SSL

```bash
# Kiểm tra SSL certificate
curl -vI https://mavrykpremium.store 2>&1 | grep -i ssl

# Hoặc dùng online tool: https://www.ssllabs.com/ssltest/
```

## Troubleshooting

### Lỗi: 502 Bad Gateway

**Nguyên nhân:** Nginx không kết nối được với Docker containers

**Giải pháp:**
```bash
# 1. Kiểm tra containers đang chạy
docker ps

# 2. Kiểm tra logs
docker logs website-web
docker logs website-api

# 3. Kiểm tra ports
sudo netstat -tlnp | grep -E '4000|4001'

# 4. Restart containers
docker compose -f docker-compose.deploy.yml restart
```

### Lỗi: SSL certificate không hoạt động

**Giải pháp:**
```bash
# 1. Kiểm tra certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# 2. Chạy lại certbot
sudo certbot --nginx -d mavrykpremium.store -d admin.mavrykpremium.store -d api.mavrykpremium.store --force-renewal

# 3. Reload Nginx
sudo systemctl reload nginx
```

### Lỗi: CORS errors

**Nguyên nhân:** CORS_ORIGIN không đúng trong .env

**Giải pháp:**
```bash
# 1. Kiểm tra .env
cat .env | grep CORS

# 2. Cập nhật CORS_ORIGIN
# Đảm bảo có domain chính xác
CORS_ORIGIN=https://mavrykpremium.store

# 3. Restart API container
docker compose -f docker-compose.deploy.yml restart api
```

### Lỗi: Database connection failed

**Giải pháp:**
```bash
# 1. Kiểm tra postgres container
docker logs website-postgres

# 2. Kiểm tra DATABASE_URL trong .env
cat .env | grep DATABASE_URL

# 3. Test kết nối database
docker exec -it website-postgres psql -U postgres -d my-store -c "SELECT 1;"

# 4. Restart containers theo thứ tự
docker compose -f docker-compose.deploy.yml restart postgres
docker compose -f docker-compose.deploy.yml restart api
docker compose -f docker-compose.deploy.yml restart web
```

## Maintenance

### Update code mới

```bash
cd /path/to/project
./deploy.sh
# Script sẽ tự động pull code và rebuild containers
```

### Xem logs

```bash
# Logs realtime
docker logs -f website-web
docker logs -f website-api

# Nginx logs
sudo tail -f /var/log/nginx/mavrykpremium.store.access.log
sudo tail -f /var/log/nginx/mavrykpremium.store.error.log
```

### Backup database

```bash
# Backup
docker exec website-postgres pg_dump -U postgres my-store > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i website-postgres psql -U postgres my-store < backup_file.sql
```

### Restart services

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart containers
docker compose -f docker-compose.deploy.yml restart

# Restart specific container
docker restart website-api
```

## Security Checklist

- [ ] SSL certificates được cài đặt và auto-renew
- [ ] Firewall chỉ mở ports cần thiết (80, 443, 22)
- [ ] Database password mạnh và không public
- [ ] CORS_ORIGIN chỉ cho phép domains cần thiết
- [ ] Nginx security headers được cấu hình
- [ ] Regular backups được thiết lập
- [ ] Logs được monitor thường xuyên

## Tham khảo

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
