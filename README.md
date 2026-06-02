# LMS WebRTC - Real-time Learning Platform

A comprehensive LMS with integrated WebRTC capabilities for real-time classrooms.

## 🚀 Quick Start (Local Development)

1. **Prerequisites**: Docker & Docker Compose installed, Node.js 20+.
2. **Environment Variables**:
   - Backend: Copy `backend/.env.example` to `backend/.env`
   - Frontend: Copy `frontend/.env.example` to `frontend/.env`
3. **Run via Docker**:
   ```bash
   docker compose up -d --build
   ```
4. **Access**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:4000`

## 📦 Deployment Guide (Production)

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   # Serve the `dist` folder using Nginx or Vercel/Netlify.
   ```
2. **Setup Backend**:
   - Ensure PostgreSQL, Redis, and optionally CoTURN are running.
   - Set production `.env` variables carefully:
     - `MEDIASOUP_LISTEN_IP=0.0.0.0`
     - `MEDIASOUP_ANNOUNCED_IP=<your-public-server-ip>`
     - `CORS_ORIGIN=https://yourdomain.com`
   - Run migrations and start server:
     ```bash
     cd backend
     npx prisma migrate deploy
     npm start
     ```
3. **Seed Admin User**:
   You can seed an initial admin using Prisma studio or direct DB access:
   ```bash
   npx prisma studio
   ```

## 🏥 Healthcheck & Monitoring

Backend provides a comprehensive healthcheck endpoint to verify connections to Database, Redis, and WebRTC configuration:

**Endpoint**: `GET /api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-05-30T00:00:00.000Z",
  "uptime": 1234.56,
  "db": "connected",
  "redis": "connected",
  "webrtc": {
    "listenIp": "0.0.0.0",
    "announcedIp": "123.45.67.89"
  }
}
```

## ✅ Release Checklist

Before releasing a new version to production, verify the following:

- [ ] `.env` configurations are set correctly for production (CORS, URLs, IPs).
- [ ] Database migrations (`npx prisma migrate deploy`) are applied.
- [ ] Redis server is accessible and secured.
- [ ] Mediasoup ports (`MEDIASOUP_MIN_PORT` to `MEDIASOUP_MAX_PORT`, e.g., 40000-40100) are open for UDP/TCP in the firewall.
- [ ] Frontend build (`npm run build`) is successful and deployed to CDN/Static host.
- [ ] Healthcheck (`/api/health`) returns `ok` and shows `db` and `redis` as connected.
- [ ] E2E Playwright Smoke Tests are passing in the CI pipeline.
- [ ] Role `instructor` is consistently used instead of `teacher`.

## 🏗 Architecture

- **Frontend**: React, Vite, Tailwind, Zustand, Mediasoup Client
- **Backend**: Node.js, Express, Socket.io, Mediasoup (SFU), PostgreSQL, Redis
- **Infra**: Docker Compose, CoTURN

## 🔑 Default Roles

- **Admin**: Has full access.
- **Instructor** (formerly Teacher): Can create/manage courses and live sessions.
- **Student**: Can view and enroll in courses.
