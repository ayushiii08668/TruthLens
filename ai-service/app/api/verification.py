import logging
from fastapi import APIRouter, HTTPException, status
from app.models.verification_schemas import (
    VerifyClaimRequest,
    VerifyClaimResponse,
    PipelineVerifyRequest,
    PipelineVerifyResponse
)
from app.services.verification.engine import evaluate_claim, run_verification_pipeline

logger = logging.getLogger("truthlens.verification.api")
router = APIRouter(tags=["Verification Engine"])

@router.post(
    "/verify/evaluate-claim",
    response_model=VerifyClaimResponse,
    summary="Evaluate evidence for a factual claim and generate assessment",
    description="Synthesizes corroborating and contradicting evidence, assigns sufficiency rating, calibrated confidence, and structured explanation."
)
async def evaluate_claim_endpoint(request: VerifyClaimRequest):
    try:
        response = await evaluate_claim(
            claim=request.claim,
            evidence=request.evidence,
            is_opinion_or_prediction=request.is_opinion_or_prediction or False,
            statement_type=request.statement_type or "FACTUAL_CLAIM"
        )
        return response
    except Exception as e:
        logger.error("Verification evaluation error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate verification verdict for claim"
        )

@router.post(
    "/verify/pipeline",
    response_model=PipelineVerifyResponse,
    summary="End-to-end automated verification pipeline",
    description="Extracts claims from text, discovers evidence across providers, and synthesizes assessments."
)
async def pipeline_verify_endpoint(request: PipelineVerifyRequest):
    try:
        response = await run_verification_pipeline(
            raw_text=request.text,
            max_results_per_claim=request.max_results_per_claim or 5,
            include_full_text=request.include_full_text or False
        )
        return response
    except Exception as e:
        logger.error("End-to-end pipeline verification error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to execute end-to-end verification pipeline"
        )

# Internal microservice aliases
@router.post("/api/v1/verify-claim", response_model=VerifyClaimResponse, include_in_schema=False)
async def verify_claim_internal_alias(request: VerifyClaimRequest):
    return await evaluate_claim_endpoint(request)

@router.post("/api/v1/analyze-pipeline", response_model=PipelineVerifyResponse, include_in_schema=False)
async def analyze_pipeline_internal_alias(request: PipelineVerifyRequest):
    return await pipeline_verify_endpoint(request)

