from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ImageOriginMatch(BaseModel):
    title: str = Field(..., description="Title or headline of the page where the image appeared")
    url: str = Field(..., description="Source URL where the matching image was published")
    publisher: str = Field(..., description="Name of the publisher, wire agency or photographer")
    earliest_date: Optional[str] = Field(None, description="Earliest known publication date of this image (YYYY-MM-DD)")
    original_caption: Optional[str] = Field(None, description="Original archival caption describing the true event")
    similarity_score: float = Field(default=0.9, ge=0.0, le=1.0)
    is_authoritative: bool = Field(default=True)

class ReverseImageResult(BaseModel):
    matches: List[ImageOriginMatch] = Field(default_factory=list)
    earliest_known_date: Optional[str] = None
    original_publisher: Optional[str] = None
    provider_name: str = "MockReverseImageSearch"
    total_matches_found: int = 0

class BaseReverseImageProvider(ABC):
    @abstractmethod
    async def search(self, image_bytes: bytes, image_hash: str = "") -> ReverseImageResult:
        """Search for historical appearances and original source citations of the image"""
        pass

