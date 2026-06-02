# Plan fix lỗi và hoàn thiện dự án LMS WebRTC

Ngày kiểm tra: 2026-05-30

## Kết quả test hiện tại

- Frontend build: `cmd /c npm run build` trong `frontend` - pass.
- Frontend unit tests: `cmd /c npm test -- --run` trong `frontend` - 5 tests pass.
- Backend tests: `cmd /c npx jest --runInBand` trong `backend` - 45 tests pass.
- Lưu ý: PowerShell có thể hiển thị sai UTF-8 thành mojibake. Kiểm tra bằng Node cho thấy source UTF-8 vẫn đúng; không nên sửa encoding bằng chuyển mã cơ học nếu chưa xác nhận bằng byte/source parser.

## Lỗi đã xác nhận và fix

### P0 - Mở lớp bị Forbidden

- Triệu chứng: giáo viên bấm mở lớp trong khu vực giáo viên bị lỗi `Forbidden: You do not own this course`.
- Nguyên nhân: route `/api/sessions/:id/open` bị `requireCourseOwnership('session')` chặn trước khi tới `SessionService.openSession`. Service đã cho phép `teacher_id`, nhưng middleware chỉ xét `course.instructor_id`.
- Fix:
  - Middleware cho phép giáo viên được gán `teacher_id` mở/kết thúc session ở endpoint `/open` và `/end`.
  - Test mới xác nhận giáo viên được gán session có thể mở lớp dù không phải owner course.

### P0 - Mở lớp phải tự xuất bản khóa học

- Triệu chứng mong muốn: khi tạo/lên lịch khóa học live, bấm mở lớp thì lớp mở ngay và khóa học được xuất bản luôn.
- Fix:
  - `SessionService.openSession` tự cập nhật course liên quan sang `{ is_published: true, status: 'published' }` trước khi mở lớp.
  - Frontend toast ở admin course editor và teacher dashboard báo rõ khóa học đã được xuất bản tự động.
  - Test backend xác nhận `course.update` được gọi khi mở session của course chưa publish.

## Rủi ro và lỗi có thể xảy ra tiếp

### P1 - Luồng text tiếng Việt

- Source hiện tại là UTF-8 đúng khi đọc bằng Node, nhưng terminal PowerShell render sai. Nếu browser vẫn hiển thị lỗi, cần kiểm tra response header của dev/prod server, CDN/proxy, hoặc file build cũ đang được cache.
- Validation cần làm thêm: mở app bằng browser thật, chụp màn hình login/register/admin/teacher dashboard sau deploy hoặc preview.

### P1 - Role `teacher` và `instructor`

- Backend có normalize role `teacher -> instructor`, frontend vẫn dùng cả hai role.
- Cần chuẩn hóa dần role canonical là `instructor`, chỉ giữ alias `teacher` tại boundary auth/migration.

### P1 - Luồng live session đầy đủ

- Cần e2e thực tế cho instructor/admin: tạo course live/hybrid, tạo live class, tạo session, mở lớp, vào phòng WebRTC, kết thúc lớp.
- Cần e2e cho assigned teacher: được gán `teacher_id`, thấy lớp trong dashboard, mở lớp thành công.

### P2 - Deploy readiness

- Bổ sung `.env.example` đầy đủ cho backend/frontend.
- Kiểm tra migration/schema bootstrap khớp Prisma schema.
- Bổ sung healthcheck DB/Redis/WebRTC TURN/STUN.
- Ghi rõ lệnh build/start production và seed admin trong README deploy.

## Thứ tự hoàn thiện đề xuất

1. P0: khóa lại flow mở lớp/publish bằng unit tests backend và build frontend.
2. P1: chạy Playwright smoke bằng browser thật cho login, teacher dashboard, admin course editor.
3. P1: chuẩn hóa role `instructor` và audit các query theo `teacher_id`/`instructor_id`.
4. P1: kiểm tra encoding trên bản preview/deploy, không dựa vào output PowerShell.
5. P2: bổ sung tài liệu deploy, env mẫu, healthcheck và checklist release.

## Tiêu chí hoàn thành

- Giáo viên được gán session mở được lớp mà không gặp `Forbidden`.
- Khi session được mở, course live/hybrid liên quan tự chuyển sang published.
- Login/register và các màn chính hiển thị tiếng Việt đúng trên browser thật.
- `frontend build`, `frontend test`, `backend jest` đều pass.
- Có smoke test hoặc checklist rõ cho deploy production.
