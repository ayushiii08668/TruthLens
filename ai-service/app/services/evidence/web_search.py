import httpx
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse
from typing import List

from app.core.config import settings
from app.models.evidence_schemas import RawEvidenceSnippet
from app.services.evidence.base import BaseEvidenceProvider
from app.core.security import is_safe_url

logger = logging.getLogger("truthlens.evidence.web")

class GeneralWebSearchProvider(BaseEvidenceProvider):
    @property
    def provider_name(self) -> str:
        return "General Web Search Provider"

    @property
    def is_available(self) -> bool:
        return bool(settings.search_api_key and settings.search_api_key.strip())

    async def search(self, query: str, max_results: int = 5) -> List[RawEvidenceSnippet]:
        if not self.is_available:
            return []

        results: List[RawEvidenceSnippet] = []

        # Example integration for Serper / Tavily / Custom search API
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {
                    "X-API-KEY": settings.search_api_key,
                    "Content-Type": "application/json"
                }
                res = await client.post(
                    "https://google.serper.dev/search",
                    headers=headers,
                    json={"q": query, "num": max_results}
                )

                if res.status_code == 200:
                    data = res.json()
                    organic = data.get("organic", [])
                    for item in organic:
                        url = item.get("link", "")
                        if not url or not is_safe_url(url):
                            continue

                        domain = urlparse(url).netloc.replace("www.", "")
                        publisher = domain.split(".")[0].title()

                        results.append(
                            RawEvidenceSnippet(
                                title=item.get("title", ""),
                                url=url,
                                publisher=publisher,
                                domain=domain,
                                publication_date=item.get("date"),
                                retrieval_date=datetime.now(timezone.utc).isoformat(),
                                excerpt=item.get("snippet", ""),
                                source_type="news" if any(k in domain for k in ("reuters", "apnews", "bbc", "cnn")) else "general_web",
                                is_primary_source=False,
                                document_status="snippet_only",
                                access_limitations=[]
                            )
                        )
        except Exception as e:
            logger.warning("Web search provider error: %s", type(e).__name__)

        return results[:max_results]

