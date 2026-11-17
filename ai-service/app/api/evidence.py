import logging
from fastapi import APIRouter, HTTPException, status
from app.models.evidence_schemas import EvidenceSearchRequest, EvidenceSearchResponse
from app.services.evidence.discovery_engine import search_evidence

logger = logging.getLogger("truthlens.evidence.api")
router = APIRouter(tags=["Evidence Discovery"])

@router.post(
    "/evidence/search",
    response_model=EvidenceSearchResponse,
    summary="Search and discover corroborating/contradicting evidence for a claim",
    description="Queries multi-source search providers, deduplicates URLs, groups syndications, and provisionally classifies stance."
)
async def search_evidence_endpoint(request: EvidenceSearchRequest):
    try:
        if not request.claim or not request.claim.strip():
            return EvidenceSearchResponse(
                claim="",
                evidence=[],
                search_status="no_results",
                queries_used=[],
                limitations=["Claim statement is empty."],
                retrieval_time_ms=0
            )

        response = await search_evidence(
            claim=request.claim,
            max_results=request.max_results or 10,
            include_full_text=request.include_full_text or False
        )
        return response
    except Exception as e:
        logger.error("Evidence discovery endpoint error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve evidence for the provided claim"
        )

# Also expose under /api/v1 for internal Node.js backend integration
@router.post("/api/v1/retrieve-evidence", response_model=EvidenceSearchResponse, include_in_schema=False)
async def search_evidence_internal_alias(request: EvidenceSearchRequest):
    return await search_evidence_endpoint(request)

