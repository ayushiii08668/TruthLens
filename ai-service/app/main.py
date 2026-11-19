import time
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.api.claims import router as claims_router
from app.api.evidence import router as evidence_router
from app.api.verification import router as verification_router
from app.api.media import router as media_router

# Configure logging without leaking credentials
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("truthlens.ai")

app = FastAPI(
    title=settings.app_name,
    description="TruthLens AI Microservice for Factual Claim Extraction and Verification.",
    version=settings.version
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "message": "Input validation failed",
                "details": exc.errors()
            }
        }
    )

# Include Routers
app.include_router(claims_router)
app.include_router(evidence_router)
app.include_router(verification_router)
app.include_router(media_router)

@app.on_event("startup")
async def startup_warmup():
    """Pre-initializes the RapidOCR ONNX inference sessions on server boot so user requests experience zero cold-start delay."""
    try:
        from app.services.image.ocr_engine import get_rapid_ocr_engine
        engine = get_rapid_ocr_engine()
        if engine:
            logger.info("RapidOCR ONNX models pre-loaded and ready for immediate inference.")
    except Exception as e:
        logger.warning("RapidOCR pre-warmup warning: %s", type(e).__name__)

@app.get("/", tags=["System"])
def root():
    return {
        "service": settings.app_name,
        "tagline": settings.tagline,
        "status": "operational",
        "version": settings.version,
        "endpoints": [
            "POST /analyze/extract-claims",
            "POST /evidence/search",
            "POST /verify/evaluate-claim",
            "POST /verify/pipeline",
            "GET /api/v1/health"
        ]
    }

@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
        "llm_provider": settings.llm_provider,
        "model": settings.llm_model,
        "timestamp": time.time()
    }
