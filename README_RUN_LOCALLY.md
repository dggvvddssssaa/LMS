# Hướng Dẫn Chạy Dự Án LMS WebRTC (Không dùng Docker)

Bạn đã yêu cầu chạy dự án trực tiếp (natively) thay vì dùng Docker. Dưới đây là các bước chi tiết để thiết lập môi trường và chạy dự án.

## 1. Yêu cầu hệ thống (Prerequisites)

Bạn cần cài đặt các phần mềm sau trên máy tính của mình:

*   **Node.js**: (Đã có sẵn)
*   **PostgreSQL**: Cơ sở dữ liệu chính.
    *   Tải về và cài đặt tại: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
    *   Khi cài đặt, hãy ghi nhớ mật khẩu của user `postgres` (mặc định thường là `postgres` hoặc bạn tự đặt).
*   **Redis**: Dùng để quản lý hàng đợi và cache.
    *   Tải về và chạy Redis trên Windows (có thể dùng bản port hoặc WSL): [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases) (Bản cũ của MS) hoặc dùng WSL (khuyên dùng).
    *   Hoặc tải bản Memurai (Redis cho Windows): [https://www.memurai.com/get-memurai](https://www.memurai.com/get-memurai) (Bản Developer miễn phí).

## 2. Cấu hình Cơ sở dữ liệu

1.  Mở pgAdmin (đi kèm khi cài Postgres) hoặc dùng dòng lệnh.
2.  Tạo một database mới tên là `lms_db`.
3.  Đảm bảo user `postgres` có quyền truy cập.

## 3. Cấu hình Môi trường (.env)

Tôi đã tự động tạo sẵn 2 file cấu hình `.env` cho bạn trong thư mục `backend` và `frontend`.

**Backend (`backend/.env`):**
```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lms_db
REDIS_URL=redis://localhost:6379
...
```
*Lưu ý:* Nếu mật khẩu Postgres của bạn không phải là `postgres`, hãy mở file `backend/.env` và sửa lại phần `postgres:postgres` thành `postgres:MẬT_KHẨU_CỦA_BẠN`.

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:4000
```

## 4. Cài đặt và Chạy

Mở 2 cửa sổ Terminal (hoặc Command Prompt/PowerShell).

### Terminal 1: Chạy Backend

```bash
cd backend
npm install
npm run dev
```

*   Hệ thống sẽ tự động tạo các bảng (User, Course, Session) khi chạy lần đầu.
*   Nếu thấy thông báo `Server running on port 4000` và `Connected to PostgreSQL` là thành công.

### Terminal 2: Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

*   Truy cập vào đường dẫn hiện ra (thường là `http://localhost:5173`) để sử dụng ứng dụng.

## Lưu ý về Mediasoup (WebRTC)

Thư viện `mediasoup` ở backend cần biên dịch native module.
*   Thông thường nó sẽ tự tải prebuilt binary.
*   Nếu gặp lỗi khi `npm install` ở backend liên quan đến `python` hay `Visual Studio`, bạn cần cài đặt thêm **Windows Build Tools**:
    ```bash
    npm install --global --production windows-build-tools
    ```
    (Chạy PowerShell với quyên Admin).
