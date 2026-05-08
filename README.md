# LMS WebRTC - Real-time Learning Platform

A comprehensive LMS with integrated WebRTC capabilities for real-time classrooms.

## 🚀 Quick Start

1. **Prerequisites**: Docker & Docker Compose installed.
2. **Run**:
   ```bash
   docker compose up -d --build
   ```
3. **Access**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## 🏗 Architecture

- **Frontend**: React, Vite, Tailwind, Zustand, Mediasoup Client
- **Backend**: Node.js, Express, Socket.io, Mediasoup (SFU), PostgreSQL, Redis
- **Infra**: Docker Compose, CoTURN

## 🔑 Default Credentials (Seeded)

- **Student**: Register via UI
- **Teacher**: Register via UI with role 'Teacher'

## 📹 Features

- **Auth**: JWT based access control.
- **Courses**: Create, view, and manage courses (Teacher only).
- **Sessions**: Schedule live sessions.
- **Classroom**: Real-time video/audio conference using SFU architecture.
