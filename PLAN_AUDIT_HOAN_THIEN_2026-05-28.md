# Plan audit va hoan thien du an LMS WebRTC - 2026-05-28

## Skill da su dung

- Da chuan hoa skill `lms-webrtc-auditor` trong:
  - `C:/Users/nhocb/.codex/skills/lms-webrtc-auditor/SKILL.md`
  - `SKILLS/lms-webrtc-auditor/SKILL.md`
- Pham vi audit: frontend/backend contract, role, API response, Prisma schema, WebRTC, security, test va tinh nang con thieu.

## Ket qua kiem tra

| Lenh | Ket qua |
| --- | --- |
| `frontend: npm run build` | Pass |
| `frontend: npm run test` | Pass, 2 files, 5 tests |
| `frontend: npm run lint` | Fail, 1 error va 3 warnings |
| `frontend: npm run test:e2e` | Pass, 1 smoke test public |
| `backend: npx jest --runInBand` | Pass, 6 suites, 37 tests |
| `backend: npx prisma validate` | Pass |
| `backend: npm audit --omit=dev` | Fail, 9 prod vulnerabilities, 1 high |
| `frontend: npm audit --omit=dev` | Fail, 2 prod vulnerabilities, moderate |

## Tinh nang dang on

- Build frontend production thanh cong.
- Backend unit/integration tests hien co dang xanh.
- Prisma schema hop le.
- Public smoke e2e vao landing va course listing thanh cong.
- Auth response contract dang khop: backend tra `{ success, data: { user, token } }`, frontend `authService` unwrap qua `extractApiData`, login doc `result.data.user/token`.
- Course detail, course editor, enrollment, progress, certificate, live class, assignment da co module tu frontend den backend, khong phai chi la mock.
- WebRTC socket da co JWT auth, canonical room id, enrollment check cho student khi join session, va attendance recording.

## Van de da xac nhan

### P0 - Can sua truoc khi production

1. Webhook thanh toan co the chap nhan `Apikey undefined` neu thieu env
   - File: `backend/src/controllers/webhookController.js:6-8`
   - `SEPAY_WEBHOOK_API_KEY` khong duoc validate trong `backend/src/utils/validateEnv.js`.
   - Neu production thieu bien nay, request co header `Authorization: Apikey undefined` se qua check.
   - Fix: bat buoc validate `SEPAY_WEBHOOK_API_KEY`, reject neu env rong, them test webhook cho thieu key/sai key/dung key.

2. Assignment bi thieu gate enrollment/ownership o cac endpoint doc va submit
   - File: `backend/src/routes/assignmentRoutes.js:9-25`
   - File: `backend/src/controllers/assignmentController.js:82-213`
   - Bat ky user co token co the doc assignment theo lesson/section/final va submit assignment id bat ky. Payload MCQ da duoc sanitize khi doc, nhung van thieu check user co enroll course hay giao vien/admin co quyen course.
   - Fix: resolve course id cho assignment read/submit, yeu cau student da enroll, instructor/admin phai own/admin.

3. Ownership middleware fail-open khi khong resolve duoc course
   - File: `backend/src/middlewares/ownershipMiddleware.js:71-75`
   - File: `backend/src/controllers/assignmentController.js:67-70`
   - Khi khong tim duoc `courseId`, middleware/controller cho qua. Với resource nhay cam, fail-open la rui ro lon.
   - Fix: fail-closed cho update/delete/create resource can ownership; chi cho qua neu route duoc danh dau public ro rang.

4. Chuoi tieng Viet bi loi ma hoa tren UI va scripts
   - Vi du: `frontend/src/App.jsx:32-45`, `frontend/src/pages/auth/Login.jsx:24-68`, `frontend/src/components/ErrorBoundary.jsx:35-54`
   - Anh huong truc tiep den UX, SEO, do tin cay san pham.
   - Fix: chuan hoa file sang UTF-8, sua text UI chinh, them smoke test assert text Vietnamese hop le tren landing/login.

### P1 - Can sua trong dot hoan thien gan

5. Frontend lint fail
   - File: `frontend/src/components/ErrorBoundary.jsx:20`
   - Vite khong co global `process`; dung `import.meta.env.DEV` la du.
   - Can xu ly 3 warning: unused state trong `AdminDashboard.jsx`, dependency unstable trong `LessonLearning.jsx`.

6. Dependencies co advisory
   - Backend: `axios` high, `express`, `express-rate-limit`, `ws/socket.io` moderate.
   - Frontend: `ws` qua `engine.io-client` moderate.
   - Fix: nang axios len >= 1.15.2, update express/socket stack theo `npm audit fix` co kiem soat, chay lai build/test/e2e.

7. Test e2e qua mong
   - File: `frontend/e2e/student-smoke.spec.js`
   - Hien chi test landing va courses listing, chua test login, enroll, learn, admin course editor, payment callback, live session.
   - Fix: them smoke theo role: guest, student, instructor/admin; moi flow co seed data on dinh.

8. Payment flow chua co verification end-to-end
   - File: `backend/src/services/EnrollmentService.js:39-72`
   - File: `backend/src/controllers/webhookController.js:4-109`
   - Co logic tao transaction, polling status, webhook complete enrollment, nhung chua co test phu hop cho duong thanh toan that bai, webhook duplicate, amount mismatch, wrong account.

9. Role `teacher`/`instructor` van la legacy contract phuc tap
   - Backend normalize `teacher` thanh `instructor`, frontend van cho ca hai.
   - File: `backend/src/utils/roles.js:1-10`, `frontend/src/components/ProtectedRoute.jsx:23-32`
   - Fix: chon canonical role `instructor`, migrate UI/seed/tests, chi giu alias o boundary auth.

### P2 - Nen lam de san pham tot hon

10. Co 2 API client song song
    - File: `frontend/src/services/api.js`
    - File: `frontend/src/services/core/httpClient.js`
    - Fix: hop nhat ve `httpClient`, xoa client cu neu khong con dung.

11. WebRTC can test thuc te hon
    - File: `frontend/verify-webrtc.js`
    - Script hien dang headed, dung selector va text bi loi ma hoa, khong phu hop CI.
    - Fix: chuyen sang Playwright e2e headless voi fake media, verify 2 users join room, chat, mic/cam toggle, reconnect.

12. UI/UX can polish sau khi fix encoding
    - Landing hien la card lon trong trang, chua that su la product-first LMS experience.
    - Admin va teacher routes da co nhieu chuc nang, nhung can lam ro workflow tao khoa hoc -> them section/lesson -> publish -> hoc vien hoc -> cap chung chi.

## Plan hoan thien theo uu tien

### Phase 1 - Stabilize va security gate

- Sua `SEPAY_WEBHOOK_API_KEY` validation va webhook tests.
- Doi ownership/assignment access tu fail-open sang fail-closed.
- Them enrollment/ownership checks cho assignment read/submit.
- Sua lint error `process` trong Vite.
- Validation: backend Jest pass, frontend lint pass, them test assignment unauthorized va webhook unauthorized.

### Phase 2 - Khoi phuc chat luong UI va contract

- Sua encoding Vietnamese cho cac trang chinh: landing, login/register, dashboard, course list/detail, learn, admin, classroom.
- Hop nhat role canonical `instructor`, chi normalize alias tai boundary.
- Hop nhat frontend API client.
- Validation: build/test pass, e2e assert text Vietnamese dung va role redirect dung.

### Phase 3 - Hoan thien flow san pham

- E2E student: register/login, browse, enroll free/paid pending, learn lesson, mark complete, submit final assignment, xem certificate.
- E2E instructor/admin: tao course, them section/lesson/material/assignment/live session, publish, monitor.
- E2E WebRTC: 2 browser contexts, fake media, join session, chat, cam/mic/screen, leave/rejoin.
- Payment: test webhook completed/duplicate/wrong account/amount mismatch.
- Validation: Playwright suite chay duoc tren CI/local seed.

### Phase 4 - Production readiness

- Update dependencies theo audit, lockfile clean.
- Review Docker/env production: CORS, JWT, SePay key, mediasoup announced IP, TURN credentials.
- Them observability: structured error id, request id, payment audit log, socket join/leave metrics.
- Tao release checklist: migrate DB, seed admin, run tests, backup DB, verify health/live class.

## Tieu chi "du an on de demo/production"

- `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e`, backend Jest va Prisma validate deu pass.
- Khong con advisory high trong prod dependencies.
- Student khong the doc/submit assignment cua khoa hoc chua enroll.
- Webhook payment khong hoat dong neu thieu/sai secret.
- UI tieng Viet hien thi dung tren cac man hinh chinh.
- Co e2e cho 3 role: student, instructor/admin, public guest.
