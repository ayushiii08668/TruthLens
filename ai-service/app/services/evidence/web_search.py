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

import httpx
import logging
import re
import html
import email.utils
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.parse import urlparse, quote_plus
from typing import List

from app.core.config import settings
from app.models.evidence_schemas import RawEvidenceSnippet
from app.services.evidence.base import BaseEvidenceProvider
from app.core.security import is_safe_url

logger = logging.getLogger("truthlens.evidence.web")

class GeneralWebSearchProvider(BaseEvidenceProvider):
    @property
    def provider_name(self) -> str:
        return "Live Web & News Syndicate Search Provider"

    @property
    def is_available(self) -> bool:
        # Always available for real-time live retrieval via news wire syndicates
        return True

    async def search(self, query: str, max_results: int = 5) -> List[RawEvidenceSnippet]:
        results: List[RawEvidenceSnippet] = []

        # 1. If commercial Search API key is configured (Serper / Tavily), use it first
        if settings.search_api_key and settings.search_api_key.strip():
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
                                    source_type="news" if any(k in domain for k in ("reuters", "apnews", "bbc", "cnn", "cnbc", "bloomberg")) else "general_web",
                                    is_primary_source=False,
                                    document_status="snippet_only",
                                    access_limitations=[]
                                )
                            )
            except Exception as e:
                logger.info("Commercial search provider unavailable: %s", type(e).__name__)

        # 2. If results are empty or no paid API key, use Live News Syndicate RSS Search
        if not results:
            try:
                rss_url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-US&gl=US&ceid=US:en"
                async with httpx.AsyncClient(timeout=4.5, follow_redirects=True) as client:
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 TruthLens/1.0"
                    }
                    res = await client.get(rss_url, headers=headers)

                    if res.status_code == 200 and res.text:
                        root = ET.fromstring(res.text)
                        items = root.findall(".//item")

                        now_iso = datetime.now(timezone.utc).isoformat()

                        for item in items[:max_results]:
                            title_el = item.find("title")
                            raw_title = title_el.text if title_el is not None else ""
                            # Remove trailing source name from title (e.g., "... - CNBC")
                            title = re.sub(r"\s+-\s+[^-]+$", "", raw_title).strip() or raw_title

                            link_el = item.find("link")
                            link = link_el.text.strip() if link_el is not None and link_el.text else ""

                            source_el = item.find("source")
                            publisher = source_el.text.strip() if source_el is not None and source_el.text else "News Syndicate"
                            source_home_url = source_el.get("url", "").strip() if source_el is not None else ""

                            # Prefer source home URL if direct link is empty
                            target_url = link if is_safe_url(link) else source_home_url if is_safe_url(source_home_url) else "https://news.google.com"

                            domain = urlparse(source_home_url or link).netloc.replace("www.", "") or "news.google.com"

                            # Parse publication date
                            pub_date = None
                            pub_el = item.find("pubDate")
                            if pub_el is not None and pub_el.text:
                                try:
                                    dt = email.utils.parsedate_to_datetime(pub_el.text.strip())
                                    pub_date = dt.strftime("%Y-%m-%d")
                                except Exception:
                                    pub_date = None

                            desc_el = item.find("description")
                            desc_raw = desc_el.text if desc_el is not None and desc_el.text else ""
                            clean_excerpt = html.unescape(re.sub(r"<[^>]+>", " ", desc_raw)).strip()

                            # Categorize source authority
                            domain_lower = domain.lower()
                            pub_lower = publisher.lower()
                            is_wire = any(k in domain_lower or k in pub_lower for k in ("reuters", "associated press", "ap news", "bloomberg", "dow jones"))
                            is_major_finance = any(k in domain_lower or k in pub_lower for k in ("cnbc", "wsj", "wall street journal", "yahoo finance", "financial times", "investopedia", "marketwatch"))

                            if is_wire:
                                pub_identity = "International News Wire Syndicate"
                                source_type = "news"
                                is_primary = True
                            elif is_major_finance:
                                pub_identity = "Major Financial News Organization"
                                source_type = "news"
                                is_primary = False
                            else:
                                pub_identity = "Commercial News / Media Organization"
                                source_type = "news"
                                is_primary = False

                            results.append(
                                RawEvidenceSnippet(
                                    title=title,
                                    url=target_url,
                                    publisher=publisher,
                                    publisher_identity=pub_identity,
                                    domain=domain,
                                    publication_date=pub_date,
                                    event_date=pub_date,
                                    retrieval_date=now_iso,
                                    excerpt=clean_excerpt or title,
                                    source_type=source_type,
                                    is_primary_source=is_primary,
                                    document_status="snippet_only",
                                    original_document_availability="snippet_only",
                                    access_limitations=[]
                                )
                            )
            except Exception as e:
                logger.info("Live news search provider error: %s", type(e).__name__)

        return results[:max_results]

