from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.verification_schemas import VerifyClaimResponse

class URLInvestigateRequest(BaseModel):
    url: str = Field(..., description="Public article URL to inspect and verify")
    max_claims: Optional[int] = Field(default=5, ge=1, le=10)

class URLInvestigateResponse(BaseModel):
    url: str
    canonical_url: str
    page_title: str
    publisher: str
    publication_date: Optional[str] = None
    article_summary: str
    claims_verified: List[VerifyClaimResponse]
    document_status: str
    limitations: List[str] = Field(default_factory=list)

class ArticleInvestigateRequest(BaseModel):
    text: str = Field(..., min_length=20, description="Long-form article text content")
    title: Optional[str] = Field(default=None, description="Optional article headline")
    max_claims: Optional[int] = Field(default=8, ge=1, le=15)

class ArticleInvestigateResponse(BaseModel):
    title: Optional[str] = None
    total_claims_identified: int
    article_summary: str
    claims_verified: List[VerifyClaimResponse]
    missing_context: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

class ImageContextDetail(BaseModel):
    is_reused: bool = False
    verdict: str
    explanation: str
    user_caption: Optional[str] = None

class ImageInvestigateResponse(BaseModel):
    filename: str
    format: str
    dimensions: str
    file_size_bytes: int
    camera: Optional[str] = None
    software: Optional[str] = None
    capture_date: Optional[str] = None
    ocr_text: str
    detected_entities: List[str] = Field(default_factory=list)
    detected_dates: List[str] = Field(default_factory=list)
    primary_location: Optional[str] = None
    authenticity: Dict[str, Any]
    manipulation: Dict[str, Any]
    origin: Dict[str, Any]
    context: ImageContextDetail
    claims_verified: List[VerifyClaimResponse] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)

