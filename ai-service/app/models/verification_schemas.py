from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from app.models.evidence_schemas import ProcessedEvidenceItem

VerdictCategory = Literal[
    "SUPPORTED",
    "MOSTLY SUPPORTED",
    "MISLEADING",
    "MOSTLY FALSE",
    "FALSE",
    "UNVERIFIED",
    "CONFLICTING EVIDENCE",
    "NOT A FACTUAL CLAIM"
]

EvidenceSufficiencyLevel = Literal[
    "Insufficient",
    "Limited",
    "Moderate",
    "Strong"
]

class EvidenceCitation(BaseModel):
    title: str = Field(..., description="Source title")
    url: str = Field(..., description="Direct citation URL")
    publisher: str = Field(..., description="Publisher name")
    domain: str = Field(..., description="Domain name")
    publication_date: Optional[str] = Field(default=None, description="Publication date")
    excerpt: str = Field(..., description="Verbatim cited text excerpt")
    stance: Literal["SUPPORTS", "CONTRADICTS", "NEUTRAL"] = "NEUTRAL"
    is_primary_source: bool = Field(default=False, description="Primary source flag")
    relevance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    syndication_group: Optional[str] = None
    is_syndicated_duplicate: bool = False

class SourceSummary(BaseModel):
    name: str
    url: str
    domain: str
    publisher_identity: Optional[str] = None
    is_primary_source: bool = False
    document_availability: str = "snippet_only"
    stance_observed: Literal["SUPPORTS", "CONTRADICTS", "NEUTRAL"]

class VerifyClaimRequest(BaseModel):
    original_input: Optional[str] = Field(default="", description="Original user submitted statement or text")
    claim: str = Field(..., min_length=3, description="Factual proposition to evaluate")
    evidence: List[ProcessedEvidenceItem] = Field(default_factory=list, description="Retrieved candidate evidence items")
    is_opinion_or_prediction: Optional[bool] = Field(default=False, description="Flag if upstream parser identified statement as opinion or prediction")
    statement_type: Optional[str] = Field(default="FACTUAL_CLAIM", description="Statement classification from Phase 3")

class VerifyClaimResponse(BaseModel):
    claim: str = Field(..., description="The factual claim evaluated")
    verdict: VerdictCategory = Field(..., description="One of the 8 canonical verdict categories")
    confidence: Optional[int] = Field(default=None, ge=0, le=100, description="System confidence in assessment (0-100)")
    evidence_sufficiency: EvidenceSufficiencyLevel = Field(..., description="Volume and quality of available evidence")
    explanation: str = Field(..., description="Full analytical explanation tracing verdict to retrieved evidence")
    supporting_evidence: List[EvidenceCitation] = Field(default_factory=list, description="Corroborating source excerpts")
    contradicting_evidence: List[EvidenceCitation] = Field(default_factory=list, description="Contradicting source excerpts")
    neutral_evidence: List[EvidenceCitation] = Field(default_factory=list, description="Contextual background source excerpts")
    limitations: List[str] = Field(default_factory=list, description="Epistemic caveats and bounds of current knowledge")
    sources: List[SourceSummary] = Field(default_factory=list, description="List of unique sources referenced")

class PipelineVerifyRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Raw statement, article, or headline to verify end-to-end")
    max_results_per_claim: Optional[int] = Field(default=5, ge=1, le=20)
    include_full_text: Optional[bool] = Field(default=False)

class PipelineVerifyResponse(BaseModel):
    original_text: str
    claims_verified: List[VerifyClaimResponse] = Field(default_factory=list)
    overall_verdict: VerdictCategory
    total_processing_time_ms: int

