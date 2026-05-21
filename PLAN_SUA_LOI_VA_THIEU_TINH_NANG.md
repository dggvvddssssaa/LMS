# Plan sửa lỗi và bổ sung tính năng LMS WebRTC

Ngày tạo: 2026-05-20

## Phạm vi quét

Đã dùng các skill phù hợp:
- `bug-fixer`: truy nguyên lỗi runtime theo luồng controller -> service -> repository -> DB.
- `prisma-db-architect`: phân tích lỗi Prisma/PostgreSQL và hướng sửa schema/query.
- `lms-webrtc-auditor`: kiểm tra contract frontend -> API -> backend -> DB theo user flow LMS.

Đã chạy kiểm tra nhanh:
- Frontend: `cmd /c npm run build` trong `frontend` -> pass.
- Backend: `cmd /c npx jest --runInBand` trong `backend` -> pass, 5 test suites, 25 tests.

Lưu ý: test hiện tại chưa bao phủ các flow certificate template editor, lesson video sidebar, và assignment builder nên các lỗi dưới đây cần thêm test sau khi sửa.

## P0 - Lỗi không thiết kế được mẫu chứng chỉ

### Hiện tượng

Khi mở/sửa/nhân bản/xóa mẫu chứng chỉ có lỗi:

```text
Invalid `prisma.$queryRawUnsafe()` invocation:
Raw query failed. Code: `42883`.
ERROR: operator does not exist: integer = text
HINT: No operator matches the given name and argument types. You might need to add explicit type casts.
```

### Nguyên nhân đã xác định

Backend đang dùng wrapper `backend/src/config/db.js` để gọi:

```js
prisma.$queryRawUnsafe(text, ...(params || []))
```

Các route nhận `req.params.id` từ Express là string, nhưng SQL lại so sánh với cột integer:

- `backend/src/controllers/certificateTemplateController.js`
  - `SELECT * FROM certificate_templates WHERE id = $1`
  - `UPDATE certificate_templates ... WHERE id = $13`
  - `DELETE FROM certificate_templates WHERE id = $1`
  - `SELECT * FROM certificate_templates WHERE id = $1` khi duplicate

Với Prisma raw query, parameter string không được tự cast như kỳ vọng, dẫn tới PostgreSQL so sánh `integer = text`.

### Hướng sửa đề xuất

Ưu tiên sửa theo hướng an toàn và nhất quán:

1. Chuyển `certificateTemplateController` sang Prisma Client model `prisma.certificate_templates` thay vì raw SQL.
2. Validate `id` bằng `Number(req.params.id)` và trả `400` nếu không phải số nguyên dương.
3. Với `layout_json`, không `JSON.stringify` thủ công nếu dùng Prisma Json field, truyền object trực tiếp.
4. Thêm test backend cho:
   - `GET /api/certificate-templates/:id`
   - `PUT /api/certificate-templates/:id`
   - `DELETE /api/certificate-templates/:id`
   - `POST /api/certificate-templates/:id/duplicate`
5. Quét tiếp toàn bộ `db.query(... WHERE id = $1, [id])` trong:
   - `assignmentController`
   - `ownershipMiddleware`
   - `certificateController`
   - `sessionReminderJob`
   để tránh cùng lỗi ở các flow khác.

### SQL an toàn nếu cần xử lý tạm trước khi refactor

Không cần ALTER TABLE cho lỗi này vì schema đã đúng kiểu `Int`. Nếu cần hotfix raw SQL trước khi đổi sang Prisma, cast parameter trong SQL:

```sql
WHERE id = $1::int
```

Nhưng đây chỉ là bản vá tạm; hướng bền hơn là bỏ raw SQL ở controller này.

## P0 - Bấm xem video nhưng sidebar nội dung không thấy list video khác

### Hiện trạng code

Trang học nằm ở `frontend/src/pages/course/LessonLearning.jsx`.

Sidebar chỉ render danh sách bài học khi:

```js
(course?.type === 'recorded' || course?.type === 'hybrid' || !course?.type)
```

Rủi ro contract hiện tại:
- Backend/service có normalize type `recorded -> video` ở một số nơi.
- Schema course mặc định `type = recorded`, nhưng service valid type lại có `video`, `live`, `hybrid`.
- Frontend có chỗ coi course video là `recorded`, chỗ khác coi là `video`.

Nếu khóa học được trả về `type = "video"`, sidebar nội dung không render danh sách bài học, dù video chính vẫn có thể hiển thị.

### Hướng sửa đề xuất

1. Chuẩn hóa contract course type toàn hệ thống: chọn một trong hai:
   - Khuyến nghị: dùng `video`, `live`, `hybrid` ở API/frontend.
   - Map dữ liệu cũ `recorded` -> `video` tại service boundary.
2. Sửa điều kiện sidebar trong `LessonLearning.jsx` để hiển thị nội dung cho cả `video` và `recorded` trong giai đoạn tương thích.
3. Khi bấm lesson/session/final assignment, reset state đầy đủ:
   - Chọn lesson: clear session + assignment.
   - Chọn live session: clear lesson + assignment.
   - Chọn assignment: clear lesson + session.
4. Thêm empty state rõ ràng nếu course không có sections hoặc sections rỗng, tránh cảm giác "mất list".
5. Thêm test component hoặc Playwright smoke cho flow:
   - Mở khóa video.
   - Sidebar hiển thị toàn bộ sections/lessons.
   - Click lesson khác thì video/content đổi đúng.

## P1 - Bài tập: bỏ deadline, thay bằng thời gian làm bài

### Hiện trạng

`frontend/src/pages/admin/components/CourseEditor/AssignmentBuilder.jsx` đang có:
- `deadline` state.
- Input `datetime-local` label `Hạn chót (Deadline)`.
- Payload gửi `deadline`.

DB schema `assignments` hiện có `deadline DateTime?`, chưa có field thời gian làm bài.

### Phân tích tính năng trước khi làm

Tính năng "thời gian làm bài" cần xác định contract:
- Đơn vị lưu: phút, nên dùng `time_limit_minutes Int?`.
- Áp dụng cho MCQ và essay hay chỉ MCQ: nên áp dụng cả hai, null nghĩa là không giới hạn.
- Khi student bắt đầu làm bài, cần lưu thời điểm bắt đầu nếu muốn enforce nghiêm túc. Hiện `assignment_submissions` chỉ lưu khi nộp, chưa có attempt/session.
- Nếu chỉ hiển thị thời lượng mà không enforce server-side thì dễ gian lận; nên chia làm 2 bước:
  - Bước 1: thêm cấu hình và hiển thị thời lượng.
  - Bước 2: thêm assignment attempts để enforce thời gian.

### Hướng sửa đề xuất

1. Thêm field DB:

```sql
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS time_limit_minutes integer;
```

2. Cập nhật Prisma schema:
   - `assignments.time_limit_minutes Int?`
3. Cập nhật validation:
   - bỏ hoặc deprecate `deadline`.
   - thêm `time_limit_minutes: number.int().min(1).nullable().optional()`.
4. Cập nhật `AssignmentRepository.create/update` để lưu `time_limit_minutes`.
5. Cập nhật `AssignmentBuilder`:
   - bỏ UI deadline.
   - thêm input "Thời gian làm bài (phút)".
6. Cập nhật `AssignmentViewer`:
   - hiển thị thời gian làm bài.
   - nếu làm bước enforce, thêm countdown dựa trên attempt start time.

## P1 - Bài tập: bỏ điểm tối đa nhập tay, tự tổng hợp từ điểm từng câu

### Hiện trạng

`AssignmentBuilder.jsx` đang có:
- `scoreMax` state mặc định 100.
- Input "Điểm tối đa".
- Khi lưu gửi `score_max: Number(scoreMax)`.

Backend chấm MCQ hiện tính:

```js
score = Math.round((correctCount / questions.length) * (assignment.score_max || 100))
```

Điều này không hỗ trợ điểm riêng từng câu.

### Phân tích tính năng trước khi làm

Mô hình mới nên là:
- Mỗi câu có `points`.
- Tổng điểm tối đa = tổng `points` của tất cả câu.
- Không cho nhập `score_max` thủ công ở cấp bài tập.
- Với essay, cần rubric/criteria có points hoặc vẫn cần một trường tổng điểm. Vì yêu cầu nói "câu 1 điền bao nhiêu điểm", ưu tiên triển khai cho MCQ trước, essay cần phân tích riêng.

Payload đề xuất:

```json
{
  "questions": [
    {
      "id": "q-1",
      "question": "...",
      "points": 2,
      "options": [],
      "correctOptionId": "..."
    }
  ]
}
```

### Hướng sửa đề xuất

1. Cập nhật `AssignmentBuilder`:
   - bỏ input `scoreMax`.
   - thêm input `points` ở từng câu.
   - hiển thị summary: số câu và tổng điểm.
   - khi lưu, tính `score_max = sum(question.points)`.
2. Cập nhật backend submit:
   - thay logic đúng/sai chia đều bằng cộng điểm từng câu đúng.
   - giữ fallback cho bài cũ chưa có `points`: chia đều theo `score_max`.
3. Cập nhật `AssignmentViewer`:
   - hiển thị điểm từng câu nếu có.
   - hiển thị tổng điểm theo `assignment.score_max`.
4. Thêm test backend cho chấm điểm:
   - 3 câu có điểm 1, 2, 3.
   - đúng câu 1 và 3 -> score 4/6.
   - bài cũ không có points vẫn chấm được.

## P1 - Thiếu quy trình phân tích trước khi thêm tính năng

Trước khi thêm bất kỳ tính năng nào, áp dụng checklist sau:

1. Xác định user flow: ai dùng, vào từ màn nào, kết quả mong muốn là gì.
2. Xác định data contract: frontend payload, API response, DB schema, validation.
3. Xác định backward compatibility: dữ liệu cũ có bị hỏng không, cần fallback không.
4. Xác định rule nghiệp vụ: quyền truy cập, role, trạng thái, edge cases.
5. Xác định test cần thêm: unit, integration, component, Playwright nếu là flow UI.
6. Chỉ sau checklist này mới sửa code.

## P2 - Các vấn đề phụ phát hiện khi quét

1. Encoding tiếng Việt trong nhiều file frontend và plan cũ đang bị mojibake, ví dụ `BÃ i táº­p`. Cần một pass riêng để chuẩn hóa UTF-8, tránh sửa chung với logic.
2. `backend/src/config/db.js` vẫn là wrapper raw SQL trên Prisma, làm mất lợi thế type-safe của Prisma và gây lỗi kiểu dữ liệu. Nên đưa vào roadmap P0/P1.
3. Test pass nhưng chưa kiểm tra flow certificate template, course learning sidebar, assignment scoring mới. Cần bổ sung trước hoặc cùng lúc sửa.
4. Worktree hiện đang có nhiều thay đổi/deleted/untracked file. Khi sửa nên tách branch hoặc commit theo từng nhóm P0/P1 để tránh trộn thay đổi.

## Thứ tự thực hiện đề xuất

1. P0.1: Sửa certificate template controller sang Prisma + test endpoint.
2. P0.2: Sửa contract course type và sidebar video lesson list + test UI tối thiểu.
3. P0.3: Quét và xử lý các raw query integer id còn lại có rủi ro `integer = text`.
4. P1.1: Thiết kế và migrate `time_limit_minutes` cho assignment.
5. P1.2: Thiết kế điểm từng câu, tự tính `score_max`, cập nhật chấm điểm backend.
6. P1.3: Cập nhật AssignmentViewer để hiển thị thời gian làm bài, tổng câu, tổng điểm.
7. P2.1: Chuẩn hóa UTF-8 tiếng Việt.
8. P2.2: Mở rộng Playwright E2E cho student learning + admin certificate + assignment builder.

