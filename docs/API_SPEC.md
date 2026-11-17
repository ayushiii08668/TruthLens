# TruthLens – API Specification & Service Contracts

This document specifies the complete REST communication protocol between the React Frontend and Node.js Main Backend, as well as the internal contract between the Node.js Main Backend and the Python FastAPI AI Service.

---

## 1. Authentication & Security Policy

- **Frontend → Backend:** Stateless JWT authentication delivered via the `Authorization: Bearer <token>` header. Refresh tokens or short-lived access tokens with user claims (`userId`, `role`).
- **Backend → AI Service:** Secured via an internal service authorization header `X-Internal-Secret: <SERVICE_SECRET>`. The AI service rejects requests without this valid header.
- **Data Validation:** Strict schema validation via Express-Validator / Joi on Node.js, and Pydantic models on FastAPI.

---

## 2. Main Backend API (Node.js Express)
Base URL: `/api`

### 2.1. Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user with name, email, password | No |
| `POST` | `/api/auth/login` | Authenticate with credentials and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Yes |
| `PUT` | `/api/auth/profile` | Update user profile and preferences | Yes |
| `POST` | `/api/auth/logout` | Clear session / invalidate refresh tokens | Yes |

### 2.2. Investigation Routes (`/api/investigations`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/investigations` | Start a new verification investigation | Optional (Guest/User) |
| `GET` | `/api/investigations` | List investigations for user (paginated, filterable) | Yes |
| `GET` | `/api/investigations/public` | Public feed of verified claims & reports | No |
| `GET` | `/api/investigations/:id` | Fetch complete investigation dossier & claims | Optional (Public/Owner) |
| `DELETE` | `/api/investigations/:id` | Delete investigation and associated claims | Yes (Owner/Admin) |

#### Investigation Submission Body:
```json
{
  "inputType": "text" | "headline" | "url" | "image",
  "content": "String containing claim text, headline, or article URL",
  "imageFile": "(Multipart file upload if inputType is image)",
  "title": "Optional custom investigation title",
  "tags": ["economy", "inflation"]
}
```

### 2.3. Saved Reports & Dossier Routes (`/api/reports`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports` | List all bookmarked/saved reports for user | Yes |
| `POST` | `/api/reports` | Save/bookmark an investigation with analyst notes | Yes |
| `PUT` | `/api/reports/:id` | Update notes or custom tags on saved report | Yes |
| `DELETE` | `/api/reports/:id` | Remove from saved reports | Yes |
| `GET` | `/api/reports/:id/pdf` | Stream or download generated PDF dossier | Optional (Public/Owner) |

### 2.4. Metrics & Analyst Dashboard (`/api/analytics`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/analytics/summary` | Global fact-checking stats, verdict distribution | No |
| `GET` | `/api/analytics/user-stats` | User personal activity stats & credibility accuracy | Yes |

---

## 3. Python AI Microservice API (FastAPI)
Base URL: `/api/v1`
Protected by header: `X-Internal-Secret: <SECRET>`

### 3.1. Unified Full Pipeline
`POST /api/v1/analyze-pipeline`

Orchestrates input ingestion (URL scraping / OCR), claim decomposition, multi-source evidence retrieval, stance classification, and synthesis into a complete verified dossier.

#### Request Schema:
```json
{
  "input_type": "text" | "headline" | "url" | "image",
  "content": "Full claim text, headline, or target URL",
  "image_base64": "Optional base64-encoded image string if input_type == 'image'",
  "max_claims": 5,
  "preferred_language": "en"
}
```

#### Response Schema:
```json
{
  "success": true,
  "extracted_text": "Normalized input text or extracted article body",
  "source_metadata": {
    "title": "Article headline if URL",
    "author": "Jane Doe",
    "domain": "reuters.com",
    "publish_date": "2026-11-10T14:30:00Z"
  },
  "overall_verdict": "MOSTLY_FALSE",
  "overall_credibility_score": 35,
  "summary": "The statement combines accurate employment statistics with false claims regarding tax policy changes.",
  "claims": [
    {
      "claim_text": "The government passed a 40% income tax increase last Tuesday.",
      "claim_context": "Spoken during a press briefing in London.",
      "category": "economy",
      "verdict": "FALSE",
      "confidence_score": 94,
      "evidence_sufficiency": "SUFFICIENT",
      "explanation": "Official parliamentary records and treasury documentation confirm no vote or bill on income tax increases took place.",
      "supporting_evidence": [],
      "contradicting_evidence": [
        {
          "title": "Hansard Official Parliamentary Record: Nov 10",
          "quote": "The order paper for Tuesday contained debate on transportation infrastructure...",
          "source_name": "UK Parliament Official Records",
          "source_url": "https://hansard.parliament.uk/commons/...",
          "publish_date": "2026-11-10",
          "credibility_tier": "HIGH",
          "stance": "CONTRADICTS",
          "relevance_score": 0.98
        }
      ],
      "uncertainties": [
        "Future legislative proposals may be introduced in the upcoming budget session."
      ]
    }
  ],
  "processing_time_ms": 1420
}
```

### 3.2. Granular AI Endpoints & Media Verification (Phase 7)
- `POST /analyze/extract-claims`: Extracts atomic verifiable claims from input text.
- `POST /evidence/search`: Dual search over Fact Check API and web wire archives.
- `POST /verify/evaluate-claim`: Synthesizes evidence, calibrated confidence, sufficiency, and 7-part explanation.
- `POST /verify/pipeline`: Full end-to-end extraction, search, stance scoring, and verdict synthesis.
- `POST /media/url-investigate`: Public article URL verification with SSRF protection, redirect abuse defense, metadata extraction, and independent claim verification.
- `POST /media/article-investigate`: Long-form multi-paragraph article verification with independent claim assessments and missing context detection.
- `POST /media/image-investigate`: Uploaded image forensics (JPG, PNG, WebP up to 10MB) with in-memory validation, EXIF metadata extraction, OCR text parsing, reverse image discovery, and contextual recycling analysis.
- `GET /health` and `GET /api/v1/health`: Returns service health status and provider connectivity.

