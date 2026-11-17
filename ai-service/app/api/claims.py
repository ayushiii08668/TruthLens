import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ExtractClaimsRequest, ExtractClaimsResponse
from app.services.claim_extractor import extract_claims_from_text

logger = logging.getLogger("truthlens.ai.api")
router = APIRouter(tags=["Claim Extraction"])

@router.post(
    "/analyze/extract-claims",
    response_model=ExtractClaimsResponse,
    summary="Extract verifiable factual claims from text",
    description="Processes raw text, headlines, articles, or social media statements, removing opinions and questions to extract atomic factual claims."
)
async def extract_claims_endpoint(request: ExtractClaimsRequest):
    try:
        if not request.text or not request.text.strip():
            return ExtractClaimsResponse(
                claims=[],
                total_sentences=0,
                factual_claims_count=0,
                language="en",
                processing_time_ms=0
            )

        response = await extract_claims_from_text(
            raw_text=request.text,
            max_claims=request.max_claims or 30
        )
        return response
    except Exception as e:
        logger.error("Claim extraction error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract claims from provided input"
        )

# Also expose under /api/v1 for internal Node.js backend integration
@router.post("/api/v1/extract-claims", response_model=ExtractClaimsResponse, include_in_schema=False)
async def extract_claims_internal_alias(request: ExtractClaimsRequest):
    return await extract_claims_endpoint(request)

