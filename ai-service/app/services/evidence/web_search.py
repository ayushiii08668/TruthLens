import httpx
import logging
import re
import html
import base64
import email.utils
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.parse import urlparse, quote_plus
from typing import List, Optional

from app.core.config import settings
from app.models.evidence_schemas import RawEvidenceSnippet
from app.services.evidence.base import BaseEvidenceProvider
from app.core.security import is_safe_url

logger = logging.getLogger("truthlens.evidence.web")

def resolve_evidence_url(link: str, title: str, publisher: str, source_home_url: str) -> str:
    """
    Guarantees a functional, direct destination URL for news evidence citations.
    Extracts canonical publisher links from Google News tokens if possible;
    otherwise provides a direct, precise title-and-publisher story search.
    """
    if link and "news.google.com" in link:
        match = re.search(r'/articles/([A-Za-z0-9_-]+)', link)
        if match:
            token = match.group(1)
            for offset in range(0, 10):
                sub = token[offset:]
                padded = sub + '=' * (-len(sub) % 4)
                try:
                    decoded = base64.b64decode(padded)
                    url_match = re.search(rb'https?://[a-zA-Z0-9\-\._~:/\?#\[\]@!$&\'\(\)\*\+,;=%]+', decoded)
                    if url_match:
                        extracted = url_match.group(0).decode('utf-8', errors='ignore')
                        clean_url = re.split(r'[\x00-\x1f\x7f]', extracted)[0]
                        if '.' in urlparse(clean_url).netloc and is_safe_url(clean_url):
                            return clean_url
                except Exception:
                    continue

    if link and "news.google.com" not in link and is_safe_url(link):
        return link

    clean_title = re.sub(r'[^\w\s\-]', ' ', title).strip()
    query = quote_plus(f"{clean_title} {publisher}".strip())
    return f"https://www.google.com/search?q={query}"

def resolve_domain(source_home_url: str, link: str, publisher: str) -> str:
    if source_home_url and is_safe_url(source_home_url):
        d = urlparse(source_home_url).netloc.replace("www.", "")
        if d:
            return d
    if link and "news.google.com" not in link and is_safe_url(link):
        d = urlparse(link).netloc.replace("www.", "")
        if d:
            return d
    pub_clean = re.sub(r'[^a-zA-Z0-9]', '', publisher).lower()
    return f"{pub_clean}.com" if pub_clean else "news.media"


class GeneralWebSearchProvider(BaseEvidenceProvider):
    @property
    def provider_name(self) -> str:
        return "Live Web & News Syndicate Search Provider"

    @property
    def is_available(self) -> bool:
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
                                    source_type="news" if any(k in domain for k in ("reuters", "apnews", "bbc", "cnn", "cnbc", "bloomberg", "cricbuzz", "cricinfo", "thehindu")) else "general_web",
                                    is_primary_source=False,
                                    document_status="snippet_only",
                                    access_limitations=[]
                                )
                            )
            except Exception as e:
                logger.info("Commercial search provider unavailable: %s", type(e).__name__)

        # 2. Live News Syndicate RSS Search
        if not results:
            try:
                rss_url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-US&gl=US&ceid=US:en"
                async with httpx.AsyncClient(timeout=3.5, follow_redirects=True) as client:
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
                            raw_title = title_el.text if title_el is not None and title_el.text else ""
                            # Remove trailing source name from title (e.g., "... - CNBC")
                            title = re.sub(r"\s+-\s+[^-]+$", "", raw_title).strip() or raw_title

                            link_el = item.find("link")
                            link = link_el.text.strip() if link_el is not None and link_el.text else ""

                            source_el = item.find("source")
                            publisher = source_el.text.strip() if source_el is not None and source_el.text else ""
                            source_home_url = source_el.get("url", "").strip() if source_el is not None else ""

                            if not publisher:
                                # Extract publisher from raw_title suffix if missing from source tag
                                suffix_match = re.search(r"\s+-\s+([^-]+)$", raw_title)
                                publisher = suffix_match.group(1).strip() if suffix_match else "Verified News Wire"

                            target_url = resolve_evidence_url(link, title, publisher, source_home_url)
                            domain = resolve_domain(source_home_url, link, publisher)

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
                            is_major_sports = any(k in domain_lower or k in pub_lower for k in ("cricinfo", "cricbuzz", "sportstar", "olympics", "espn", "bbc sport", "icc-cricket", "rediff"))
                            is_major_finance = any(k in domain_lower or k in pub_lower for k in ("cnbc", "wsj", "wall street journal", "yahoo finance", "financial times", "investopedia", "marketwatch"))

                            if is_wire:
                                pub_identity = "International News Wire Syndicate"
                                source_type = "news"
                                is_primary = True
                            elif is_major_sports:
                                pub_identity = "Major Sports Journalism Authority"
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
