# Kế Hoạch Hoàn Thiện Dự Án LMS WebRTC

**Mục tiêu:** Đưa dự án từ MVP (3.5/5) lên production-ready (5/5) với chất lượng code cao, bảo mật tốt, kiểm thử đầy đủ.

---

## GIAI ĐOẠN 1 — NỀN TẢNG (Foundation) — Ưu tiên cao nhất

> Dự kiến: 2-3 tuần

### 1.1 Chọn 1 ORM duy nhất — Chuyển raw SQL → Prisma

| ID | Task | Mô tả | File ảnh hưởng |
|---|---|---|---|
| 1.1.1 | Xoá toàn bộ raw SQL trong Repositories, thay bằng Prisma Client | `CourseRepository`, `EnrollmentRepository`, `LessonRepository`, `SectionRepository`, `SessionRepository`, `MaterialRepository`, `StatsRepository`, `UserRepository`, `AssignmentRepository`, `CategoryRepository`, `LiveClassRepository` | ~11 files |
| 1.1.2 | Xoá `backend/src/config/db.js` (pg Pool) | Không còn raw SQL | `db.js` |
| 1.1.3 | Đồng bộ Prisma schema với DB hiện tại | `prisma/schema.prisma` | Chạy `prisma db pull` |
| 1.1.4 | Thêm `@unique`, `@index`, `onDelete: Cascade` còn thiếu | Optimize schema | `schema.prisma` |

### 1.2 Thêm Input Validation (Zod)

| ID | Task | File ảnh hưởng |
|---|---|---|
| 1.2.1 | Tạo Zod schemas cho tất cả request bodies | `backend/src/validators/*.js` (new) |
| 1.2.2 | Tạo validation middleware | `backend/src/middlewares/validateMiddleware.js` |
| 1.2.3 | Gắn validation vào tất cả routes | ~20 route files |

### 1.3 Thêm TypeScript

| ID | Task | Phạm vi |
|---|---|---|
| 1.3.1 | Chuyển `backend/` sang TypeScript | Toàn bộ backend |
| 1.3.2 | Chuyển `frontend/` sang TypeScript | Toàn bộ frontend |
| 1.3.3 | Định nghĩa shared types (API contracts, DB models) | `shared/types/` (new) |
| 1.3.4 | Chuyển `.jsx` → `.tsx` | Tất cả components/pages |

> **Ghi chú:** Có thể làm song song 1.2 + 1.3 nếu team đông. Nếu ít người, làm tuần tự: 1.2 trước (dễ, ít rủi ro), 1.3 sau.

---

## GIAI ĐOẠN 2 — TESTING (Quality Assurance) — Ưu tiên cao

> Dự kiến: 2 tuần

### 2.1 Unit Tests

| ID | Task | Target coverage |
|---|---|---|
| 2.1.1 | Test tất cả Repositories (mock Prisma) | 90%+ |
| 2.1.2 | Test tất cả Services (business logic) | 90%+ |
| 2.1.3 | Test Middlewares (auth, ownership, error) | 95%+ |
| 2.1.4 | Test Validators (Zod schemas) | 100% |
| 2.1.5 | Test RoomManager (mediasoup logic) | 90%+ |
| 2.1.6 | Test `useWebRTC.js` logic (tách pure functions) | 80%+ |

### 2.2 Integration Tests

| ID | Task | Mô tả |
|---|---|---|
| 2.2.1 | API integration tests (supertest + test DB) | Tất cả endpoints, kể cả edge cases (401, 403, 404, 422) |
| 2.2.2 | WebSocket signaling flow tests | joinRoom → produce → consume → close |
| 2.2.3 | Database transaction tests | Enrollment + Payment + Certificate flow |

### 2.3 E2E Tests (Playwright)

| ID | Task | Flow |
|---|---|---|
| 2.3.1 | Guest flow | Landing → Register → Login |
| 2.3.2 | Student flow | Browse course → Enroll → Learn lesson → Take assignment → Get certificate |
| 2.3.3 | Instructor flow | Create course → Add sections/lessons → Publish → Schedule live session |
| 2.3.4 | Admin flow | Manage users → Verify instructors → Monitor live classes → Manage cert templates |
| 2.3.5 | Live classroom | Join room → Toggle cam/mic → Screen share → Chat → Leave |

---

## GIAI ĐOẠN 3 — BẢO MẬT (Security Hardening) — Ưu tiên cao

> Dự kiến: 1 tuần

| ID | Task | Mô tả |
|---|---|---|
| 3.1 | JWT refresh token mechanism | Không để user logout đột ngột khi token hết hạn |
| 3.2 | Rate limiting chi tiết theo endpoint | Auth endpoints: 5 req/min, API: 100 req/min |
| 3.3 | CSRF protection | Nếu dùng cookie-based auth |
| 3.4 | UUID thay cho auto-increment IDs | Chống enumeration |
| 3.5 | Input sanitization (XSS prevention) | Strip HTML tags từ user input |
| 3.6 | Audit logging | Log tất cả hành động nhạy cảm (create/delete user, publish course, payment) |
| 3.7 | TURN server config | Inject coturn credentials vào mediasoup config |

---

## GIAI ĐOẠN 4 — CẢI THIỆN WEBRTC — Trung bình

> Dự kiến: 1-2 tuần

| ID | Task | Mô tả |
|---|---|---|
| 4.1 | Multi-worker mediasoup | `numWorkers = os.cpus().length || 1` |
| 4.2 | Tách `useWebRTC.js` | Thành: `useSocket.js`, `useMediaDevice.js`, `useProducer.js`, `useConsumer.js`, `useChat.js` |
| 4.3 | Peer reconnection | Auto-retry khi socket mất kết nối, khôi phục producers/consumers |
| 4.4 | Simulcast / SVC | Adaptive quality theo bandwidth |
| 4.5 | Echo cancellation UI | Hiển thị peer nào đang nói (audio level indicator) |
| 4.6 | Recording (server-side) | Ghi lại buổi học dùng mediasoup-recording |

---

## GIAI ĐOẠN 5 — TỐI ƯU HIỆU NĂNG — Trung bình

> Dự kiến: 1 tuần

| ID | Task | Mô tả |
|---|---|---|
| 5.1 | Thêm DB indexes | `enrollments(student_id)`, `lessons(section_id)`, `notifications(user_id,is_read)`, `sessions(live_class_id,start_time)` |
| 5.2 | Redis caching | Cache course list, categories, user profile — TTL 5 phút |
| 5.3 | N+1 query optimization | Audit tất cả repository queries với Prisma `include`/`select` |
| 5.4 | Frontend code splitting | Lazy load tất cả admin pages, classroom |
| 5.5 | Image optimization | WebP format, lazy loading, blur placeholder |
| 5.6 | Bundle analysis | `vite build --report` + analyze |

---

## GIAI ĐOẠN 6 — TÍNH NĂNG CÒN THIẾU — Trung bình

> Dự kiến: 2-3 tuần

| ID | Task | Mô tả |
|---|---|---|
| 6.1 | Admin dashboard stats | Biểu đồ doanh thu, user growth, course popularity (Chart.js/Recharts) |
| 6.2 | Payment flow hoàn chỉnh | Confirm payment endpoint (đang bị disable), receipt generation |
| 6.3 | Assignment grading | Instructor review + score submissions |
| 6.4 | Email notifications | Xác nhận đăng ký, thông báo lớp học, certificate issued |
| 6.5 | Course search | Full-text search (PostgreSQL tsvector) |
| 6.6 | Course reviews/ratings | Student review + rating system |
| 6.7 | Instructor withdrawal | Instructor có thể rút tiền từ doanh thu khóa học |
| 6.8 | Certificate PDF generation | Server-side PDF render (Puppeteer/Playwright) |
| 6.9 | User profile settings | Avatar, change password, notification preferences |
| 6.10 | FAQ / Knowledge base | Course-level FAQ (đã có Q&A cơ bản, cần cải thiện) |

---

## GIAI ĐOẠN 7 — DEVOPS & CI/CD — Thấp nhưng quan trọng

> Dự kiến: 1 tuần

| ID | Task | Mô tả |
|---|---|---|
| 7.1 | GitHub Actions CI | `lint → test:unit → test:integration → build` cho mỗi PR |
| 7.2 | CD pipeline | Auto-deploy lên staging khi merge vào `develop`, production khi tag release |
| 7.3 | Docker Compose production | Thêm reverse proxy (Caddy/Nginx), SSL (Let's Encrypt) |
| 7.4 | Healthcheck API endpoint | `GET /health` — DB, Redis, mediasoup workers status |
| 7.5 | Monitoring | Log aggregation (ELK / Grafana Loki), error tracking (Sentry) |
| 7.6 | Database backup | Automatic pg_dump schedule |

---

## GIAI ĐOẠN 8 — DỌN DẸP & REFACTOR — Thấp

> Dự kiến: 1 tuần

| ID | Task | Mô tả |
|---|---|---|
| 8.1 | Xoá `scripts/legacy/` (15 files) | Rác, không còn dùng |
| 8.2 | Xoá `backend/src/models/courseModel.js` + `sessionModel.js` | Chuyển sang Prisma |
| 8.3 | Đồng nhất naming convention | Dùng `camelCase` toàn bộ codebase |
| 8.4 | Xoá `console.log` → thay bằng `logger` (Winston) | Tất cả backend code |
| 8.5 | Dọn `FLOW.md`, `SYSTEM_RULES.md` | Không phù hợp trong repo source |
| 8.6 | Cập nhật `README.md` | Hướng dẫn chi tiết + architecture diagram |

---

## TIẾN ĐỘ (Timeline)

```
Tuần 1-2  | ████████░░░░░░░░░░░░ | Giai đoạn 1 (Foundation)
Tuần 3-4  | ████████████░░░░░░░░ | Giai đoạn 2 (Testing)
Tuần 5    | ████████████████░░░░ | Giai đoạn 3 (Security)
Tuần 5-6  | ████████████████░░░░ | Giai đoạn 4 (WebRTC)
Tuần 7    | ██████████████████░░ | Giai đoạn 5 (Performance)
Tuần 7-9  | ██████████████████░░ | Giai đoạn 6 (Features)
Tuần 10   | ████████████████████ | Giai đoạn 7 (DevOps)
Tuần 10   | ████████████████████ | Giai đoạn 8 (Cleanup)
          └─────────────────────────
          10 tuần (2.5 tháng)
```

### Lộ trình song song (nếu có 2+ developers)

```
Dev A:    1.1 → 1.2 → 1.3 → 2.1 → 3.x → 6.x
Dev B:    2.3 → 4.x → 5.x → 7.x → 8.x
```

---

## METRICS MỤC TIÊU (Definition of Done)

| Metric | Hiện tại | Mục tiêu |
|---|---|---|
| Unit test coverage | <5% | >80% |
| TypeScript adoption | 0% | 100% |
| Prisma adoption | 0% (services) | 100% |
| E2E test flows | 1 flow | >10 flows |
| Bundle size (frontend) | ~2MB | <500KB (gzipped) |
| API response time (p95) | ? | <200ms |
| WebRTC connection success | 80% (no TURN) | 99% (with TURN) |
| Security audit pass | ? | >90% OWASP top 10 |
| Code duplication | Medium | Low |

---

## PRIORITY MATRIX

```
                  Impact
              Low    Medium    High
            ┌─────────────────────
    Easy    │  8.x    5.x      1.1, 2.3
    Medium  │  6.x    4.x      1.2, 3.x
    Hard    │  7.x    6.x      1.3, 2.1, 2.2
            └─────────────────────

Start với: 1.1 (dễ, high impact) → 2.3 (dễ, high impact)
           → 1.2 (medium, high impact) → 3.x (medium, high impact)
           → 1.3 (khó, high impact) → còn lại
```
