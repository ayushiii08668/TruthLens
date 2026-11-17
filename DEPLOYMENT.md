# TruthLens – Production Deployment Guide

> **Tagline:** *"Don't Just Believe It. Verify It."*  
> **Target Release:** Production 1.0  
> **Architecture:** Decoupled Full-Stack Multi-Service (Vercel + Node.js / Express + Python FastAPI + MongoDB Atlas)

---

## 1. System Architecture Overview

TruthLens is deployed as a resilient, decoupled three-tier microservice architecture:

```
┌────────────────────────────────────────────────────────┐
│               Frontend Web Application                 │
│         React 19 + Vite + Tailwind CSS (SPA)           │
│             Hosted on Vercel Edge Network              │
│       Production URL: https://truthlens.vercel.app     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JWT Auth
                            ▼
┌────────────────────────────────────────────────────────┐
│             Node.js Main Backend Service               │
│          Express.js REST API + Helmet + JWT            │
│         Hosted on Render / Railway / Fly.io            │
│       Production URL: https://api.truthlens.ai         │
└─────────────┬────────────────────────────┬─────────────┘
              │ Mongoose (TLS)             │ HTTP Internal (Secret Protected)
              ▼                            ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     Managed Database      │  │  Python AI Microservice │
│       MongoDB Atlas       │  │   FastAPI + NLP Engines │
│  Multi-Region Replication │  │ Host: Render / Railway  │
└───────────────────────────┘  └─────────────────────────┘
```

---

## 2. Frontend Deployment (React + Vite on Vercel)

### Method A: Vercel Web Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub/GitLab.
2. Click **"Add New..."** &rarr; **"Project"** &rarr; select the `TruthLens` repository.
3. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   ```env
   VITE_API_URL=https://api.truthlens.ai
   ```
   *(Replace with your deployed Node.js backend domain)*
5. Click **"Deploy"**.

### Method B: Vercel CLI
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### SPA Routing & Cache Configuration
The repository includes `frontend/vercel.json` configured for single-page routing without 404s:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## 3. Node.js Backend Deployment (Render / Railway / Fly.io / Container)

### Host Options:
- **Render.com Web Service:** Native Node runtime or Docker.
- **Railway.app Service:** Automatic Dockerfile detection.
- **Fly.io:** Deploy via `fly launch` using `backend/Dockerfile`.

### Configuration Settings:
- **Root Directory:** `backend`
- **Build Command:** `npm ci --omit=dev`
- **Start Command:** `npm start` (executes `node src/server.js`)
- **Port:** Bind to `0.0.0.0:$PORT` (automatically managed by `src/server.js`)
- **Health Check Path:** `/api/health`

### Environment Variables:
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://truthlens.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.truthlens.mongodb.net/truthlens?retryWrites=true&w=majority
JWT_SECRET=generate_a_secure_64_character_hex_key_here
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=https://ai.truthlens.ai
AI_SERVICE_SECRET=internal_truthlens_ai_microservice_secret_2026
```

---

## 4. Python AI Microservice Deployment (FastAPI on Render / Railway / Container)

### Host Options:
- **Render.com Web Service:** Python 3.11 runtime or Docker (`ai-service/Dockerfile`).
- **Railway.app Service:** Docker deployment via `ai-service/Dockerfile`.

### Configuration Settings:
- **Root Directory:** `ai-service`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health` (or `/api/v1/health`)

### Environment Variables:
```env
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
INTERNAL_SERVICE_SECRET=internal_truthlens_ai_microservice_secret_2026

# AI Model Provider Credentials
LLM_PROVIDER=rule_based # Options: rule_based, gemini, openai
LLM_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Evidence Discovery API Keys (Optional Live Integrations)
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_key_here
SEARCH_API_KEY=your_web_search_key_here
```

---

## 5. Managed Database Setup (MongoDB Atlas)

1. **Create an Atlas Account & Cluster:**
   - Sign up at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free **M0 Sandbox** or dedicated **M10+** cluster in your preferred cloud region (e.g. AWS `us-east-1` or `eu-central-1`).
2. **Database User Authentication:**
   - Under **Database Access**, create a user (e.g., `truthlens_app_user`) with `readWriteAnyDatabase` privileges.
   - Use a strong generated password.
3. **Network Access / Firewall Configuration:**
   - Under **Network Access**, add IP whitelist rules:
     - For Render / Railway / Vercel cloud backends with dynamic outbound IPs: add `0.0.0.0/0` (Allow Access from Anywhere) with password auth enabled.
4. **Connection String:**
   - Click **Connect** &rarr; **Drivers** (Node.js 6.7+).
   - Copy URI into backend `MONGODB_URI`:
     `mongodb+srv://<username>:<password>@cluster0.mongodb.net/truthlens?retryWrites=true&w=majority`
5. **Database Indexes:**
   The Mongoose schemas automatically build required high-performance compound indexes upon startup:
   - `Investigation`: `{ userId: 1, createdAt: -1 }`, `{ status: 1 }`, `{ shareId: 1 }`
   - `VerificationReport`: `{ investigationId: 1, userId: 1 }`, `{ verdict: 1 }`, `{ isPublic: 1, shareId: 1 }`
   - `SavedReport`: `{ userId: 1, reportId: 1 }` (unique constraint)
   - `User`: `{ email: 1 }` (unique constraint)

---

## 6. One-Command Full Stack Docker Orchestration

To run the complete production environment locally or on a virtual private server (VPS):

```bash
# 1. Clone repository
git clone https://github.com/your-username/TruthLens.git
cd TruthLens

# 2. Build and start all 4 services (MongoDB + Python AI + Node.js + Frontend Nginx)
docker compose up --build -d

# 3. Access Services:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000/api
# - Swagger Docs: http://localhost:5000/api/docs
# - Python AI Microservice: http://localhost:8000/docs
```

---

## 7. Security Hardening Checklist

- [x] **No Plaintext Passwords:** Passwords hashed with bcrypt (salt 10). Excluded from queries via `select: false`.
- [x] **Zero Frontend Secrets:** No API keys or service secrets are bundled in the Vite client.
- [x] **SSRF Defense:** Strict blocklist of loopback (`127.0.0.1`), link-local metadata endpoints (`169.254.169.254`, `metadata.google.internal`), and private IPv4/IPv6 blocks on all URL ingestions.
- [x] **File Upload Protection:** MIME checking, extension filtering (JPG, PNG, WebP only), 10MB limit, and in-memory buffer handling.
- [x] **Rate Limiting:** Global IP rate limiter (300 req/15m) and authentication rate limiter (50 req/15m).
- [x] **Authorization Checks:** User B cannot view, save, or edit User A's private dossiers (`403 Forbidden`).
- [x] **Opt-In Public Sharing:** Anonymous, sanitized public endpoint exposing evidence without personal user details.
- [x] **Light-Theme UI:** 100% compliant bright editorial light theme (`#F7F9FC` canvas, `#FFFFFF` cards, `#2457D6` royal blue, `#12A88A` teal).
