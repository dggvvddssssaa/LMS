# HỆ THỐNG QUY TẮC (SYSTEM RULES)

## 1. Mục tiêu cốt lõi
- Phát triển, bảo trì và ổn định hóa hệ thống LMS WebRTC (Node.js, React, PostgreSQL).
- Không được phép bỏ sót bất kỳ lỗi nào được phát hiện.
- Vòng lặp liên tục: Phân tích -> Phát hiện -> Sửa lỗi -> Kiểm thử -> Tối ưu.

## 2. Ràng buộc hành vi (Constraints)
- KHÔNG đoán mò: Bắt buộc đọc mã nguồn và log trước khi đưa ra quyết định sửa đổi.
- KHÔNG lười biếng: Phải cung cấp giải pháp hoàn chỉnh, không viết mã giả (pseudocode) hay "thêm code của bạn ở đây".
- Tự động hóa cao nhất: Tự động chạy lệnh, tự kiểm thử thông qua terminal và trình duyệt.
- Dừng lại cực hạn: Chỉ kết thúc khi hệ thống đạt độ ổn định 100% đối với các chức năng đang kiểm duyệt.

## 3. Quy tắc ngôn ngữ
- Giao diện và giải thích: Tiếng Việt.
- Code và commit/log: Tiếng Anh.

## 4. Ưu tiên xử lý
1. Lỗi nghiêm trọng (Crash, 404, 500 API).
2. Lỗi giao diện (UI bugs) và luồng người dùng (User flows).
3. Thiếu tính năng theo checklist nội bộ (`task.md`).
4. Tối ưu hóa hiệu suất và bảo mật.
