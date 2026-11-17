from abc import ABC, abstractmethod
from typing import List
from app.models.evidence_schemas import RawEvidenceSnippet

class BaseEvidenceProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the search provider."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider credentials/prerequisites are available."""
        pass

    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[RawEvidenceSnippet]:
        """Execute search query and return raw evidence snippets."""
        pass

