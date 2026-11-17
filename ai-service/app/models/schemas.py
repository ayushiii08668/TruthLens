from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

# Allowed categories for claims
ClaimCategory = Literal[
    "politics",
    "government",
    "health",
    "science",
    "technology",
    "business",
    "finance",
    "education",
    "environment",
    "general news"
]

SentenceClassification = Literal[
    "FACTUAL_CLAIM",
    "OPINION",
    "PREDICTION",
    "QUESTION",
    "UNSUPPORTED_ALLEGATION",
    "SUBJECTIVE_STATEMENT"
]

class ClaimItem(BaseModel):
    original_text: str = Field(..., description="Original sentence or statement from input")
    normalized_claim: str = Field(..., description="Self-contained, clear, disambiguated factual claim")
    category: str = Field(default="general news", description="One of the standard topic categories")
    entities: List[str] = Field(default_factory=list, description="Extracted named entities (people, orgs, etc.)")
    dates: List[str] = Field(default_factory=list, description="Extracted dates, years, or temporal markers")
    location: Optional[str] = Field(default=None, description="Extracted geographical location if present")
    verifiable: bool = Field(default=True, description="True if statement is an empirical, testable factual claim")
    relevant_context: Optional[str] = Field(default=None, description="Surrounding sentence or speaker attribution")

class ExtractClaimsRequest(BaseModel):
    text: str = Field(..., min_length=1, description="User submitted text, headline, article, or social media post")
    max_claims: Optional[int] = Field(default=30, ge=1, le=100, description="Max claims to return")

class ExtractClaimsResponse(BaseModel):
    claims: List[ClaimItem] = Field(default_factory=list)
    total_sentences: Optional[int] = Field(default=0, description="Total sentences analyzed")
    factual_claims_count: Optional[int] = Field(default=0, description="Number of factual claims identified")
    language: Optional[str] = Field(default="en", description="Detected language code")
    processing_time_ms: Optional[int] = Field(default=0, description="Latency in milliseconds")

# Models for existing pipeline endpoints (for full end-to-end compatibility)
VerdictType = Literal["TRUE", "MOSTLY_TRUE", "MIXED", "MOSTLY_FALSE", "FALSE", "UNVERIFIED"]
SufficiencyType = Literal["INSUFFICIENT", "PARTIAL", "SUFFICIENT"]
StanceType = Literal["SUPPORTS", "CONTRADICTS", "NEUTRAL"]
CredibilityTier = Literal["HIGH", "MEDIUM", "LOW", "UNKNOWN"]
InputType = Literal["text", "headline", "url", "image"]

class EvidenceItem(BaseModel):
    title: str
    quote: str
    source_name: str
    source_url: str
    publish_date: Optional[str] = None
    credibility_tier: CredibilityTier = "MEDIUM"
    stance: StanceType
    relevance_score: float = Field(default=0.5, ge=0.0, le=1.0)

class VerifiedClaim(BaseModel):
    claim_text: str
    claim_context: str = ""
    category: str = "general"
    verdict: VerdictType
    confidence_score: int = Field(ge=0, le=100)
    evidence_sufficiency: SufficiencyType
    explanation: str
    supporting_evidence: List[EvidenceItem] = Field(default_factory=list)
    contradicting_evidence: List[EvidenceItem] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    order_index: int = 0
