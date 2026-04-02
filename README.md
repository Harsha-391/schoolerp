# School ERP Prototype

A full-stack School ERP system with React frontend and Node.js backend.

## Project Structure

```
school-erp-prototype/
├── client/          # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── server/          # Node.js + Express backend
    ├── index.js
    └── package.json
```

## Quick Start

### 1. Start the Backend Server

```bash
cd server
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on: http://localhost:3001

### 2. Start the Frontend (in a new terminal)

```bash
cd client
npm run dev
```

Client runs on: http://localhost:5173

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/students` - List students
- `GET /api/teachers` - List teachers
- `GET /api/courses` - List courses

## Tech Stack

**Frontend:**
- React 18
- Vite (fast build tool)
- Modern ES6+ JavaScript

**Backend:**
- Node.js
- Express.js
- CORS enabled for frontend communication

## Development

- Frontend hot-reloads on changes
- Backend auto-restarts with `npm run dev`
- API calls from client should use: `http://localhost:3001/api/...`
