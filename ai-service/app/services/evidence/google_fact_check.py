import httpx
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse
from typing import List

from app.core.config import settings
from app.models.evidence_schemas import RawEvidenceSnippet
from app.services.evidence.base import BaseEvidenceProvider
from app.core.security import is_safe_url

logger = logging.getLogger("truthlens.evidence.google")

class GoogleFactCheckProvider(BaseEvidenceProvider):
    BASE_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

    @property
    def provider_name(self) -> str:
        return "Google Fact Check Tools API"

    @property
    def is_available(self) -> bool:
        return bool(settings.google_fact_check_api_key and settings.google_fact_check_api_key.strip())

    async def search(self, query: str, max_results: int = 5) -> List[RawEvidenceSnippet]:
        if not self.is_available:
            return []

        evidence: List[RawEvidenceSnippet] = []
        params = {
            "query": query,
            "key": settings.google_fact_check_api_key,
            "pageSize": max_results,
            "languageCode": "en"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(self.BASE_URL, params=params)
                if res.status_code != 200:
                    logger.warning("Google Fact Check API returned %s", res.status_code)
                    return []

                data = res.json()
                claims_list = data.get("claims", [])

                for claim_obj in claims_list:
                    reviews = claim_obj.get("claimReview", [])
                    for rev in reviews:
                        url = rev.get("url", "")
                        if not url or not is_safe_url(url):
                            continue

                        publisher_info = rev.get("publisher", {})
                        publisher_name = publisher_info.get("name", "Fact Checker")
                        parsed_domain = urlparse(url).netloc.replace("www.", "")

                        title = rev.get("title") or claim_obj.get("text", "Fact Check Report")
                        textual_rating = rev.get("textualRating", "")
                        review_date = rev.get("reviewDate")

                        excerpt = f"Fact Check Rating: [{textual_rating}]. Claim reviewed: \"{claim_obj.get('text', '')}\""

                        evidence.append(
                            RawEvidenceSnippet(
                                title=title,
                                url=url,
                                publisher=publisher_name,
                                domain=parsed_domain,
                                publication_date=review_date,
                                retrieval_date=datetime.now(timezone.utc).isoformat(),
                                excerpt=excerpt,
                                source_type="fact_check",
                                is_primary_source=False,
                                document_status="snippet_only",
                                access_limitations=["Google Fact Check Tools aggregation"]
                            )
                        )

            return evidence[:max_results]
        except Exception as e:
            logger.warning("Google Fact Check API query failed: %s", type(e).__name__)
            return []

