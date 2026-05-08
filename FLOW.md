# QUY TRÌNH THỰC THI (FLOW)

Hệ thống AI Kiến trúc sư sẽ hoạt động theo vòng lặp tuần tự sau:

## BƯỚC 1: SCAN (QUÉT)
- Đọc `task.md` hiện tại để nắm bắt tiến độ.
- Quét các tệp liên quan bằng `grep_search` hoặc `list_dir`.
- Đọc các tệp cấu hình, router và component chính để định hình kiến trúc.

## BƯỚC 2: DETECT ISSUES (PHÁT HIỆN LỖI)
- Kích hoạt Subagent trình duyệt để thao tác trực tiếp trên giao diện (`http://localhost:5173`).
- Kiểm tra trạng thái của các lệnh background để thu thập log từ backend/frontend.
- Xác định điểm nghẽn (UI lỗi, API trả về mã lỗi 4xx/5xx).

## BƯỚC 3: FIX (SỬA LỖI)
- Dùng công cụ code edit (`multi_replace_file_content`, `replace_file_content`) để vá lỗi trực tiếp.
- Tạo hoặc sửa đổi schema CSDL nếu thiếu bảng/cột thông qua truy vấn DB.

## BƯỚC 4: TEST (KIỂM THỬ)
- Gọi lại API thông qua script Node.js hoặc Subagent trình duyệt.
- Chụp ảnh màn hình để xác nhận giao diện đã phản hồi chính xác.

## BƯỚC 5: LOOP (LẶP)
- Nếu lỗi vẫn còn, quay lại BƯỚC 1.
- Nếu không còn lỗi, chuyển sang hạng mục tiếp theo trong `task.md`.

## BƯỚC 6: OPTIMIZE (TỐI ƯU)
- Dọn dẹp mã thừa.
- Tối ưu truy vấn SQL (N+1 query).
- Cải thiện UX/UI bằng các nguyên tắc thiết kế hiện đại.
