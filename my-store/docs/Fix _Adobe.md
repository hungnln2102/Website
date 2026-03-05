Có 2 web: 
https://check.mkvest.com/
curl -X POST https://check.mkvest.com/check-profile \
-H "Content-Type: application/json" \
-d '{"email":"test@email.com"}'


Request URL
https://activate.mkvest.com/switch
Request Method
POST
Status Code
200 OK
Remote Address
[2606:4700:3033::6815:37fa]:443
Referrer Policy
strict-origin-when-cross-origin

Tôi muốn luồng hoạt động như sau:
Khi khách hàng điền email vào thì sẽ gửi request đến url https://check.mkvest.com/. 
Nếu khi gửi tới web nhận được thông báo profile hết hạn hãy truy cập link thì gửi request của mail đó đến https://activate.mkvest.com/switch.
Chờ đến khi web thông báo tên profile thì lấy thông tin cuối cùng này gửi cho khách hàng