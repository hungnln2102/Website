---
name: Vietnamese Encoding Safety
description: Quy tắc bắt buộc khi sửa code chứa text tiếng Việt — tránh lỗi encoding do PowerShell và các công cụ command-line trên Windows
---

# Vietnamese Encoding Safety Skill

## Mục đích
Đảm bảo text tiếng Việt (có dấu) trong source code **KHÔNG BAO GIỜ** bị lỗi encoding (mojibake) khi agent hoặc developer thực hiện sửa file.

## Khi nào áp dụng
- **LUÔN LUÔN** khi file chứa ký tự tiếng Việt (hoặc bất kỳ ký tự Unicode ngoài ASCII)
- Khi tạo file mới có nội dung tiếng Việt
- Khi sửa string, comment, message, hoặc template có tiếng Việt
- Khi chạy script tạo/ghi file chứa tiếng Việt

## Vấn đề gốc rễ

### Tại sao PowerShell gây lỗi encoding?
PowerShell trên Windows có các vấn đề nghiêm trọng với Unicode:

1. **PowerShell 5.x** (Windows PowerShell mặc định):
   - `Out-File` / `>` / `>>` mặc định dùng **UTF-16 LE BOM** — không tương thích với hầu hết công cụ dev
   - `Set-Content` mặc định dùng **ANSI (Windows-1252)** — mất hoàn toàn ký tự tiếng Việt
   - Pipe (`|`) và redirection (`>`) thay đổi encoding không dự đoán được

2. **PowerShell 7.x** (pwsh):
   - Mặc định dùng **UTF-8 no BOM** — tốt hơn, nhưng không phải lúc nào cũng có sẵn
   - Vẫn có edge case khi pipe qua nhiều command

3. **Hậu quả thực tế**:
   ```
   // Mong muốn:
   "Không tìm thấy đường dẫn"

   // Kết quả sau khi PowerShell ghi file:
   "KhÃ´ng tÃ¬m thấy Ä'Æ°á»ng dáº«n"    ← UTF-8 bytes hiển thị sai
   "Không tìm th?y du?ng d?n"              ← Mất ký tự (ANSI fallback)
   ```

## QUY TẮC BẮT BUỘC

### ❌ TUYỆT ĐỐI KHÔNG LÀM

1. **KHÔNG dùng PowerShell để ghi/sửa file chứa tiếng Việt:**
   ```powershell
   # ❌ CẤMMM — Tất cả các cách sau đều có thể gây lỗi encoding:
   echo "Xin chào" > file.js
   "Xin chào" | Out-File file.js
   Set-Content -Path file.js -Value "Xin chào"
   Add-Content -Path file.js -Value "Xin chào"
   [System.IO.File]::WriteAllText("file.js", "Xin chào")
   ```

2. **KHÔNG dùng PowerShell heredoc/string để tạo nội dung tiếng Việt:**
   ```powershell
   # ❌ CẤM — Heredoc trong PowerShell KHÔNG an toàn cho Unicode:
   $content = @"
   const message = "Đơn hàng thành công";
   "@
   $content | Out-File file.js
   ```

3. **KHÔNG dùng `sed`, `awk`, hoặc các text processing tools qua PowerShell pipe cho file tiếng Việt:**
   ```powershell
   # ❌ CẤM:
   (Get-Content file.js) -replace 'old', 'mới' | Set-Content file.js
   ```

### ✅ PHẢI LÀM — Các phương pháp an toàn

#### Phương pháp 1: Dùng tool `write_to_file` (Ưu tiên cho file mới)
```
Sử dụng tool write_to_file với CodeContent chứa nội dung tiếng Việt.
Tool này ghi trực tiếp với encoding UTF-8 no BOM — AN TOÀN 100%.
```

#### Phương pháp 2: Dùng tool `replace_file_content` (Ưu tiên cho sửa file)
```
Sử dụng tool replace_file_content với TargetContent và ReplacementContent.
Tool này thao tác trực tiếp trên file — AN TOÀN 100%.
```

#### Phương pháp 3: Dùng tool `multi_replace_file_content` (Cho nhiều chỗ sửa)
```
Sử dụng tool multi_replace_file_content với nhiều ReplacementChunks.
Tool này thao tác trực tiếp trên file — AN TOÀN 100%.
```

#### Phương pháp 4: Dùng Node.js script (khi cần logic phức tạp)
```javascript
// ✅ AN TOÀN — Node.js mặc định dùng UTF-8
const fs = require('fs');

// Đọc file
const content = fs.readFileSync('file.js', 'utf8');

// Sửa nội dung
const updated = content.replace('old text', 'Nội dung tiếng Việt mới');

// Ghi lại
fs.writeFileSync('file.js', updated, 'utf8');
```

Chạy bằng:
```powershell
# ✅ AN TOÀN — Node.js xử lý encoding, không phải PowerShell:
node script.js
```

#### Phương pháp 5: Dùng Python script (khi cần logic phức tạp)
```python
# ✅ AN TOÀN — Python 3 mặc định dùng UTF-8
with open('file.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('old text', 'Nội dung tiếng Việt mới')

with open('file.js', 'w', encoding='utf-8') as f:
    f.write(content)
```

Chạy bằng:
```powershell
# ✅ AN TOÀN — Python xử lý encoding, không phải PowerShell:
python script.py
```

## PowerShell CHỈ dùng cho các việc SAU

PowerShell vẫn an toàn cho các tác vụ **KHÔNG liên quan đến nội dung file tiếng Việt**:

```powershell
# ✅ AN TOÀN — Chạy dev server:
npm run dev

# ✅ AN TOÀN — Cài package:
npm install express

# ✅ AN TOÀN — Git commands:
git add .
git commit -m "fix bug"

# ✅ AN TOÀN — Liệt kê file:
dir
Get-ChildItem

# ✅ AN TOÀN — Chạy Node/Python script (encoding do Node/Python xử lý):
node migrate.js
python generate.py

# ✅ AN TOÀN — Đọc file để xem (không ghi):
Get-Content file.js

# ✅ AN TOÀN — Tìm kiếm text (grep):
Select-String -Path "src/*.js" -Pattern "TODO"
```

## Kiểm tra encoding file

### Cách kiểm tra file có đúng UTF-8 không:
```powershell
# Dùng Node.js để kiểm tra:
node -e "const fs=require('fs'); const buf=fs.readFileSync('file.js'); console.log('BOM:', buf[0]===0xEF && buf[1]===0xBB && buf[2]===0xBF ? 'Yes (UTF-8 BOM)' : 'No'); console.log('Valid UTF-8:', Buffer.isBuffer(buf))"
```

### Cách sửa file đã bị lỗi encoding:
```javascript
// fix-encoding.js — Chạy bằng: node fix-encoding.js <filepath>
const fs = require('fs');
const path = process.argv[2];

if (!path) { console.error('Usage: node fix-encoding.js <filepath>'); process.exit(1); }

const buf = fs.readFileSync(path);

// Xóa BOM nếu có
let content;
if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
  content = buf.slice(3).toString('utf8');
  console.log('Removed UTF-8 BOM');
} else if (buf[0] === 0xFF && buf[1] === 0xFE) {
  content = buf.slice(2).toString('utf16le');
  console.log('Converted from UTF-16 LE');
} else {
  content = buf.toString('utf8');
}

fs.writeFileSync(path, content, 'utf8');
console.log('File saved as UTF-8 (no BOM)');
```

## Checklist nhanh

Trước khi sửa bất kỳ file nào chứa tiếng Việt:

- [ ] **KHÔNG** dùng PowerShell operators (`>`, `>>`, `|`) để ghi file
- [ ] **KHÔNG** dùng `Set-Content`, `Out-File`, `Add-Content`
- [ ] **DÙNG** tool `write_to_file` hoặc `replace_file_content` hoặc `multi_replace_file_content`
- [ ] **HOẶC** dùng Node.js/Python script nếu cần logic phức tạp
- [ ] **KIỂM TRA** file sau khi sửa vẫn hiển thị đúng tiếng Việt

## Tóm tắt một dòng

> **Mọi thao tác ghi/sửa file chứa tiếng Việt → Dùng tool IDE (write_to_file, replace_file_content) hoặc Node.js/Python script. KHÔNG BAO GIỜ dùng PowerShell để ghi nội dung file.**
