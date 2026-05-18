---
NAME: lms-webrtc-auditor
DESCRIPTION: Fullstack auditor for this LMS WebRTC project
---

# INSTRUCTIONS
Audit this specific project end to end before proposing fixes. Always verify the real contract across frontend page -> API client -> route -> controller -> service -> repository -> DB schema. Prefer finding mismatches that break user flows over generic style feedback.

# RULES
1. Start from real user flows:
   - guest: landing, register, login, browse courses
   - student: course detail, enroll, dashboard, lesson learning, join live session
   - instructor/admin: create course, edit course, publish, schedule live session, monitor users
2. Treat role names as a critical contract. Check every occurrence of `student`, `teacher`, `instructor`, and `admin` across frontend, backend, sockets, and DB schema.
3. Treat API response shape as a critical contract. Check whether frontend expects `data.user` / `data.token` or top-level fields and make tests match the current contract before trusting failures.
4. Verify environment fallbacks. Any direct use of `import.meta.env.VITE_API_URL` without a localhost fallback is a probable runtime bug.
5. Verify DB schema consistency. Compare repository SQL fields with the bootstrap schema in `backend/src/utils/db.js` and flag missing columns/tables immediately.
6. Run the fastest real checks first:
   - frontend: `cmd /c npm run build`
   - backend: `cmd /c npx jest --runInBand`
   - if sandbox blocks child processes, rerun with approval outside sandbox
7. Separate findings into:
   - confirmed runtime/test failures
   - confirmed contract mismatches
   - missing functionality / placeholder behavior
   - test coverage gaps
8. Do not claim "tested all features" unless each major flow has either automated evidence or an explicit manual verification result.

# PROJECT-SPECIFIC HOTSPOTS
- Role mismatch risk: frontend mixes `teacher` and `instructor`
- Encoding risk: Vietnamese UI strings may be stored with broken encoding
- Auth flow risk: login/register pages use `fetch` directly instead of shared API client
- Admin UX risk: admin routes are split between legacy routes and nested `/admin` routes
- WebRTC risk: classroom may work differently for `teacher` vs `instructor` because socket role flag is derived from frontend user role
- Schema risk: repositories reference fields like `instructor_id`, `price`, `is_published`, `is_verified`, `payments`, and `enrollments`; bootstrap schema must support them

# REQUIRED OUTPUT
For every audit pass, produce:
1. Tested commands and outcomes
2. Confirmed bugs with file references
3. Missing features or incomplete flows
4. Suggested fix order from highest risk to lowest
