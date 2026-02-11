# NeuralMemory – Tích hợp bộ nhớ cho dự án

Dự án dùng [NeuralMemory](https://github.com/nhadaututtheky/neural-memory) để lưu và truy vấn ký ức theo kiểu “lan truyền kích hoạt” (spreading activation), giúp AI và dev nhớ ngữ cảnh giữa các phiên làm việc.

## Yêu cầu

- Python 3.11+
- Đã cài: `pip install neural-memory`

## Cấu hình trong project

- **Brain mặc định**: Đã chạy `nmem init --skip-mcp` một lần (config tại `~/.neuralmemory/`).
- **MCP (Cursor)**: File `.cursor/mcp.json` ở thư mục gốc repo đã khai báo server `neural-memory` (command: `nmem-mcp`). Mở lại Cursor để MCP có hiệu lực; khi đó Agent có thể dùng tools nhớ/recall.

## Scripts npm (từ thư mục gốc Website)

| Script | Mô tả |
|--------|--------|
| `npm run memory:remember -- "nội dung"` | Lưu một ký ức (tự nhận loại nếu không chỉ định). |
| `npm run memory:recall -- "từ khóa"` | Truy vấn ký ức theo từ khóa. |
| `npm run memory:context` | Lấy ngữ cảnh gần đây (JSON, ~15 mục) để inject vào AI. |
| `npm run memory:todo -- "việc cần làm"` | Thêm TODO. |
| `npm run memory:status` | Xem trạng thái brain, gợi ý. |
| `npm run memory:init` | Khởi tạo lại (chỉ cần khi chưa từng init hoặc reset). |

Ví dụ:

```bash
npm run memory:remember -- "Chọn PostgreSQL cho my-store, dùng Prisma"
npm run memory:todo -- "Review PR auth" -- --priority 7
npm run memory:recall -- "database decision"
npm run memory:context
```

## Dùng trực tiếp CLI `nmem`

Từ bất kỳ thư mục nào (sau khi đã `nmem init`):

```bash
nmem remember "Nội dung ký ức" --type decision
nmem recall "từ khóa" --depth 2
nmem context --limit 10 --json
nmem brain list
nmem status
```

## Scoping theo project (tùy chọn)

Để tách ký ức theo project:

```bash
nmem project create "admin_store Website" --duration 90
nmem remember "Quyết định kiến trúc API" --project "admin_store Website"
nmem recall "API" --project "admin_store Website"
```

## Tích hợp với Cursor

- File **`.cursor/mcp.json`** đã cấu hình MCP server `neural-memory`.
- Restart Cursor để load MCP. Trong chat, Agent có thể dùng tools NeuralMemory (remember/recall/context) khi cần.
- Nếu Cursor không đọc MCP từ project, thêm thủ công vào **global** MCP:  
  `%USERPROFILE%\.cursor\config\mcp.json` (Windows) hoặc `~/.cursor/mcp.json` (macOS/Linux), với nội dung tương tự `.cursor/mcp.json` trong repo.

## Chia sẻ bộ nhớ giữa Cursor và client khác (ví dụ Antigravity)

Để client khác (Antigravity, Claude Code, VS Code + MCP, v.v.) **tiếp tục nhiệm vụ** với cùng ngữ cảnh đã dùng trong Cursor, có ba hướng:

### Cách 1: Cùng máy – dùng chung một brain (đơn giản nhất)

Trên **cùng một máy**, NeuralMemory mặc định dùng một brain tại `~/.neuralmemory/`. Cursor và client kia cùng đọc/ghi brain đó.

- **Antigravity** (hoặc IDE khác hỗ trợ MCP): thêm MCP server NeuralMemory giống Cursor.
  - Trong Antigravity: cấu hình MCP với `command: "nmem-mcp"`, `args: []` (giống `.cursor/mcp.json`).
  - Đảm bảo đã cài `pip install neural-memory` và chạy `nmem init` (một lần) trên máy đó.
- Mở **cùng repo** trong client kia → Agent sẽ dùng cùng brain, **recall** được những gì đã **remember** trong Cursor.

### Cách 2: Shared server – nhiều client, một brain trên server

Hữu ích khi dùng **nhiều máy** hoặc muốn một brain tập trung.

1. **Chạy NeuralMemory server** (một máy hoặc server chung):

   ```bash
   pip install "neural-memory[server]"
   nmem serve
   # hoặc: uvicorn neural_memory.server:app --host 0.0.0.0 --port 8000
   ```

2. **Trên mỗi client** (Cursor và Antigravity / máy khác):

   ```bash
   nmem shared enable http://<IP-hoặc-host>:8000
   ```

3. Dùng bình thường: `nmem remember ...`, `nmem recall ...` (và MCP) sẽ đọc/ghi qua server. Cả Cursor và client kia đều thấy cùng một brain.

4. (Tùy chọn) Đồng bộ local ↔ server: `nmem shared sync --direction push` hoặc `pull`.

### Cách 3: Export / Import – “chuyển brain” khi đổi client

Khi **chuyển từ Cursor sang client khác** (ví dụ Antigravity trên máy khác) và không chạy shared server:

1. **Trong Cursor (trước khi chuyển):**

   ```bash
   nmem brain export -o project-brain.json
   # hoặc: npm run memory:context > context.json   # chỉ context gần đây
   ```

2. Copy `project-brain.json` sang máy/môi trường của client kia.

3. **Trong môi trường client kia** (terminal có `nmem`):

   ```bash
   nmem init --skip-mcp   # nếu chưa có config
   nmem brain import project-brain.json
   ```

4. Cấu hình MCP NeuralMemory trong client đó (nếu có) → Agent có thể **recall** và tiếp tục nhiệm vụ từ brain vừa import.

### Gợi ý nhanh

| Tình huống | Nên dùng |
|------------|----------|
| Cursor và Antigravity trên **cùng một máy** | Cách 1 (cùng brain, chỉ cần cấu hình MCP cho Antigravity). |
| Nhiều máy hoặc muốn **một brain tập trung** | Cách 2 (shared server). |
| Chuyển client **một lần** (handoff) | Cách 3 (export → copy → import). |

## Tài liệu thêm

- [NeuralMemory – GitHub](https://github.com/nhadaututtheky/neural-memory)
- [So sánh RAG vs NeuralMemory](https://github.com/nhadaututtheky/neural-memory#why-not-rag--vector-search) (trong README)
