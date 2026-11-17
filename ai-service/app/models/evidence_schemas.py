from typing import List, Optional, Literal
from pydantic import BaseModel, Field

SourceType = Literal["fact_check", "news", "academic", "government", "general_web"]
ProvisionalStance = Literal["SUPPORTS", "CONTRADICTS", "NEUTRAL"]
DocumentStatus = Literal["full_text", "snippet_only", "inaccessible"]

class RawEvidenceSnippet(BaseModel):
    title: str
    url: str
    publisher: str
    publisher_identity: Optional[str] = None
    domain: str
    publication_date: Optional[str] = None
    event_date: Optional[str] = None
    retrieval_date: str
    excerpt: str
    full_text: Optional[str] = None
    source_type: SourceType = "general_web"
    is_primary_source: bool = False
    document_status: DocumentStatus = "snippet_only"
    original_document_availability: DocumentStatus = "snippet_only"
    access_limitations: List[str] = Field(default_factory=list)

class ProcessedEvidenceItem(BaseModel):
    title: str = Field(..., description="Article headline or document title")
    url: str = Field(..., description="Original authentic source URL")
    publisher: str = Field(..., description="Publisher name")
    publisher_identity: Optional[str] = Field(default=None, description="Publisher organization classification")
    domain: str = Field(..., description="Normalized domain name (e.g. reuters.com)")
    publication_date: Optional[str] = Field(default=None, description="Original publication date")
    event_date: Optional[str] = Field(default=None, description="Date when the stated event occurred")
    retrieval_date: str = Field(..., description="ISO timestamp of when evidence was collected")
    excerpt: str = Field(..., description="Verbatim quote or relevant excerpt")
    full_text: Optional[str] = Field(default=None, description="Full article text if permitted and retrieved")
    source_type: SourceType = Field(default="news", description="Classification of source entity")
    provisional_stance: ProvisionalStance = Field(default="NEUTRAL", description="Initial stance relative to claim")
    relevance_score: float = Field(default=0.5, ge=0.0, le=1.0, description="Relevance to investigated claim")
    is_primary_source: bool = Field(default=False, description="Primary vs. secondary source classification")
    document_status: DocumentStatus = Field(default="snippet_only", description="Access status of source text")
    original_document_availability: DocumentStatus = Field(default="snippet_only", description="Availability of original document")
    syndication_group: Optional[str] = Field(default=None, description="Identifier for grouped syndicated wire reports")
    is_syndicated_duplicate: bool = Field(default=False, description="True if identical report is already present from original wire")
    access_limitations: List[str] = Field(default_factory=list, description="Any retrieval or access limitations")

class EvidenceSearchRequest(BaseModel):
    claim: str = Field(..., min_length=3, description="Factual claim proposition to investigate")
    max_results: Optional[int] = Field(default=10, ge=1, le=50, description="Maximum evidence items to return")
    include_full_text: Optional[bool] = Field(default=False, description="Attempt retrieving full page text where permitted")

class EvidenceSearchResponse(BaseModel):
    claim: str
    evidence: List[ProcessedEvidenceItem] = Field(default_factory=list)
    search_status: str = Field(default="completed", description="Execution status: completed | partial | no_results")
    queries_used: List[str] = Field(default_factory=list, description="Search queries generated for claim")
    limitations: List[str] = Field(default_factory=list, description="Epistemic and retrieval caveats")
    retrieval_time_ms: int = Field(default=0, description="Execution duration in milliseconds")
