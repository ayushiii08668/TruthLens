import time
import logging
from typing import List, Optional

from app.models.evidence_schemas import ProcessedEvidenceItem
from app.models.verification_schemas import (
    VerifyClaimRequest,
    VerifyClaimResponse,
    PipelineVerifyRequest,
    PipelineVerifyResponse
)
from app.services.verification.source_evaluator import evaluate_sources
from app.services.verification.verdict_synthesizer import synthesize_verdict
from app.services.verification.explanation_generator import generate_explanation
from app.services.claim_extractor import extract_claims_from_text
from app.services.evidence.discovery_engine import search_evidence

logger = logging.getLogger("truthlens.verification.engine")

class VerificationEngine:
    @classmethod
    async def evaluate_claim(
        cls,
        claim: str,
        evidence: List[ProcessedEvidenceItem],
        is_opinion_or_prediction: bool = False,
        statement_type: str = "FACTUAL_CLAIM"
    ) -> VerifyClaimResponse:
        # 1. Evaluate sources, independent reporting, and primary records
        evaluation = evaluate_sources(claim, evidence)

        # 2. Synthesize verdict, sufficiency, calibrated confidence, and limitations
        verdict, sufficiency, confidence, limitations = synthesize_verdict(
            claim=claim,
            evaluation=evaluation,
            is_opinion_or_prediction=is_opinion_or_prediction,
            statement_type=statement_type
        )

        # 3. Generate structured editorial explanation
        explanation = generate_explanation(
            claim=claim,
            verdict=verdict,
            sufficiency=sufficiency,
            confidence=confidence,
            supporting=evaluation["supporting_evidence"],
            contradicting=evaluation["contradicting_evidence"],
            neutral=evaluation["neutral_evidence"],
            limitations=limitations
        )

        return VerifyClaimResponse(
            claim=claim,
            verdict=verdict,
            confidence=confidence,
            evidence_sufficiency=sufficiency,
            explanation=explanation,
            supporting_evidence=evaluation["supporting_evidence"],
            contradicting_evidence=evaluation["contradicting_evidence"],
            neutral_evidence=evaluation["neutral_evidence"],
            limitations=limitations,
            sources=evaluation["sources"]
        )

    @classmethod
    async def run_pipeline(
        cls,
        raw_text: str,
        max_results_per_claim: int = 5,
        include_full_text: bool = False
    ) -> PipelineVerifyResponse:
        start_time = time.time()

        # Step 1: Extract claims
        extracted = await extract_claims_from_text(raw_text, max_claims=5)
        verified_claims: List[VerifyClaimResponse] = []

        # If no factual claims found (e.g. text was purely an opinion)
        if not extracted.claims:
            opinion_res = await cls.evaluate_claim(
                claim=raw_text,
                evidence=[],
                is_opinion_or_prediction=True,
                statement_type="OPINION"
            )
            elapsed_ms = int((time.time() - start_time) * 1000)
            return PipelineVerifyResponse(
                original_text=raw_text,
                claims_verified=[opinion_res],
                overall_verdict="NOT A FACTUAL CLAIM",
                total_processing_time_ms=elapsed_ms
            )

        # Step 2: For each claim, retrieve evidence & verify
        for claim_item in extracted.claims:
            evidence_res = await search_evidence(
                claim=claim_item.normalized_claim,
                max_results=max_results_per_claim,
                include_full_text=include_full_text
            )

            verified = await cls.evaluate_claim(
                claim=claim_item.normalized_claim,
                evidence=evidence_res.evidence,
                is_opinion_or_prediction=not claim_item.verifiable,
                statement_type="FACTUAL_CLAIM" if claim_item.verifiable else "OPINION"
            )
            verified_claims.append(verified)

        # Determine overall verdict
        verdicts = [v.verdict for v in verified_claims]
        if "FALSE" in verdicts:
            overall = "FALSE"
        elif "MOSTLY FALSE" in verdicts:
            overall = "MOSTLY FALSE"
        elif "MISLEADING" in verdicts:
            overall = "MISLEADING"
        elif "CONFLICTING EVIDENCE" in verdicts:
            overall = "CONFLICTING EVIDENCE"
        elif all(v == "SUPPORTED" for v in verdicts):
            overall = "SUPPORTED"
        elif any(v in ("SUPPORTED", "MOSTLY SUPPORTED") for v in verdicts):
            overall = "MOSTLY SUPPORTED"
        else:
            overall = "UNVERIFIED"

        elapsed_ms = int((time.time() - start_time) * 1000)
        return PipelineVerifyResponse(
            original_text=raw_text,
            claims_verified=verified_claims,
            overall_verdict=overall,
            total_processing_time_ms=elapsed_ms
        )

evaluate_claim = VerificationEngine.evaluate_claim
run_verification_pipeline = VerificationEngine.run_pipeline

