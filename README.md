# TruthLens

> **Tagline:** *"Don't Just Believe It. Verify It."*

TruthLens is a full-stack, production-grade AI information verification platform. Users can submit news headlines, public statements, social media claims, article URLs, and uploaded media images. The system extracts discrete factual propositions, queries authoritative evidence sources, performs stance and source comparison, and synthesizes evidence-grounded assessments with transparent citations, uncertainty markers, and sufficiency ratings.

---

## Architecture Overview

TruthLens is engineered across three decoupled, robust services:

1. **Frontend (`frontend/`)**: React 19 with Vite, Tailwind CSS, Framer Motion, Axios, and Recharts. Styled exclusively in a bright, professional editorial light theme inspired by top investigative journalism and intelligence platforms.
2. **Main Backend (`backend/`)**: Node.js & Express.js with MongoDB and Mongoose. Handles user identity, JWT authentication, rate-limiting, investigation lifecycle management, saved reports, public sharing tokens, and dossier serialization.
3. **AI Verification Engine (`ai-service/`)**: Python 3.11+ & FastAPI with Pydantic. Implements NLP claim extraction, automated web and fact-checking retrieval (Google Fact Check Tools API + primary web wires), stance detection, evidence sufficiency grading, and hallucination-resistant verdict generation.

```
React Frontend (Vite, Tailwind, Recharts) - Hosted on Vercel
       │
       ▼  REST /api (JWT Bearer Auth)
Node.js Express Backend & MongoDB Atlas (Investigations, Reports, Bookmarks, Sharing)
       │
       ▼  HTTP /verify/pipeline (Internal Secret Protected)
Python FastAPI AI Service (NLP Extraction, Evidence Retrieval, Stance Analysis, Verdict Synthesis)
       │
       ▼
Evidence Providers (Google Fact Check Tools API, Curated Wire Archives, Safe Page Fetcher)
```

---

## Directory Structure

```
TruthLens/
├── docs/                      # Architectural specifications & API contracts
│   ├── ARCHITECTURE.md        # System architecture & verification guidelines
│   ├── API_SPEC.md            # Frontend-Backend & Backend-AI REST specifications
│   └── DATABASE_SCHEMA.md     # MongoDB schemas & entity relationships
│
├── backend/                   # Node.js Express Backend
│   ├── src/
│   │   ├── config/            # DB, environment & Swagger OpenAPI setup
│   │   ├── controllers/       # Auth, investigations, reports, dashboard controllers
│   │   ├── middleware/        # JWT auth, validation, rateLimiter, upload, error handling
│   │   ├── models/            # Mongoose models (User, Investigation, VerificationReport, SavedReport)
│   │   ├── routes/            # Express routers (/auth, /investigations, /reports, /dashboard)
│   │   ├── services/          # Python AI microservice Axios client
│   │   ├── utils/             # Helper utilities, JWT helpers & response formatters
│   │   ├── app.js             # Express application configuration
│   │   └── server.js          # HTTP server bootstrap (0.0.0.0:$PORT)
│   ├── tests/                 # Jest & Supertest integration suite (50/50 tests passing)
│   ├── Dockerfile             # Production container definition
│   ├── .env.example
│   └── package.json
│
├── ai-service/                # Python FastAPI AI Microservice
│   ├── app/
│   │   ├── api/               # API endpoints (/analyze, /evidence, /verify, /media)
│   │   ├── core/              # Config, SSRF & redirect protection, upload security
│   │   ├── models/            # Pydantic schemas (Claim, EvidenceItem, VerificationResult, MediaSchemas)
│   │   ├── services/          # Claim extraction, evidence discovery, image forensics & OCR
│   │   ├── utils/             # Text cleaning, sentence segmenter, entity & temporal extraction
│   │   └── main.py            # FastAPI entry point
│   ├── tests/                 # Pytest test suite (40/40 tests passing)
│   ├── Dockerfile             # Production container definition
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/                  # React Vite Client
│   ├── public/                # Static assets, branding icons
│   ├── src/
│   │   ├── services/          # authService, investigationService, reportService, dashboardService, api
│   │   ├── context/           # AuthContext (JWT session & user state)
│   │   ├── components/        # UI Components
│   │   │   ├── common/        # Navbar, Footer, AuthModal, VerdictBadge, ConfidenceGauge, StatusProgress
│   │   │   ├── investigation/ # ClaimInputForm, PresetSelector, EvidenceCard, AnalyticalBriefing, VerificationDossier
│   │   │   ├── workspace/     # InvestigationWorkspace, ClaimBreakdownAccordion, EvidenceExplorer, ShareModal, PDFReportExporter, Timeline
│   │   │   └── dashboard/     # StatCard, VerdictDistributionChart
│   │   ├── pages/             # VerifyPage, DashboardPage, HistoryPage, SavedReportsPage, ReportDetailPage, PublicReportPage
│   │   ├── App.jsx            # Routing and global layout
│   │   ├── index.css          # Tailwind & typography directives with print styling
│   │   └── main.jsx           # React DOM root
│   ├── index.html
│   ├── tailwind.config.js     # Strict editorial light theme color palette
│   ├── vercel.json            # Vercel SPA routing and cache headers
│   ├── Dockerfile             # Multi-stage Nginx container definition
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml         # Full multi-container production orchestration
├── DEPLOYMENT.md              # Production deployment guide (Vercel, Render, Railway, Atlas)
├── TRUTHLENS_QA_SECURITY_AUDIT_REPORT.md # Full QA and security verification audit
├── .gitignore
└── README.md
```

---

## 8 Canonical Verdict Categories

1. **`SUPPORTED`**: Reliable and independent evidence directly substantiates this factual assertion.
2. **`MOSTLY SUPPORTED`**: The core assertion is corroborated, but minor details require qualification.
3. **`MISLEADING`**: The claim uses factual information but omits critical context or frames outdated data inaccurately.
4. **`MOSTLY FALSE`**: The central assertion is contradicted by evidence, though minor details may be accurate.
5. **`FALSE`**: Strong and relevant evidence directly contradicts the central assertion.
6. **`UNVERIFIED`**: Current public evidence is insufficient to reach a reliable conclusion (Default on data scarcity; never hallucinates false as refutation).
7. **`CONFLICTING EVIDENCE`**: Reputable sources directly contradict each other with no authoritative consensus.
8. **`NOT A FACTUAL CLAIM`**: Subjective opinion, prediction, emotional query, or non-verifiable belief.

---

## Design System & Theme Guidelines

TruthLens strictly enforces a bright, high-contrast, editorial **LIGHT THEME**:
- **Canvas / Background:** `#F7F9FC`
- **Card / Surface Background:** `#FFFFFF`
- **Primary Blue:** `#2457D6`
- **Secondary Teal:** `#12A88A`
- **Accent Orange:** `#F28A45`
- **Main Text:** `#172B4D`
- **Secondary Muted Text:** `#64748B`
- **Border:** `#E5EAF2`
- **Success:** `#16865D`
- **Warning:** `#D68A22`
- **Error / Danger:** `#D64B55`

**Typography:**
- Headings: *Plus Jakarta Sans*
- Body: *Inter*

---

## Running Automated Test Suites

### 1. Python AI Microservice Tests (40 Tests - 100% Passing)
```bash
cd ai-service
python -m pytest tests -v
```
*Coverage: Claim segmentation, opinion rejection, SSRF protection, redirect abuse defense, wire syndication grouping, stance classification, calibrated confidence, media forensics, OCR extraction, and context recycling analysis.*

### 2. Node.js Backend Tests (50 Tests - 100% Passing)
```bash
cd backend
npm test
```
*Coverage: Authentication, registration, JWT authorization, investigations lifecycle, URL investigation metadata, image upload buffer validation, reports, bookmarks, public opt-in sharing, dashboard aggregations, rate-limiting, and end-to-end production workflow.*

### 3. Frontend Production Build
```bash
cd frontend
npm run build
```
*Vite compiles the production bundle with 2,451 modules transformed and zero errors.*

---

## Deployment & Production Hosting

Comprehensive step-by-step instructions for deploying TruthLens to Vercel, Render, Railway, Fly.io, and MongoDB Atlas are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Multi-Container Docker Deployment:
```bash
docker compose up --build -d
```
- **Frontend App:** http://localhost:3000
- **Node.js Backend API:** http://localhost:5000/api
- **Swagger Documentation:** http://localhost:5000/api/docs
- **Python AI Microservice:** http://localhost:8000/docs
