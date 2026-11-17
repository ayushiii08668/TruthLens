import httpx
import logging
import urllib.robotparser
from urllib.parse import urlparse, urljoin
from html.parser import HTMLParser
from typing import Tuple, List, Optional, Dict, Any

from app.core.security import is_safe_url, SSRFProtection
from app.utils.text_cleaner import clean_text

logger = logging.getLogger("truthlens.evidence.fetcher")

class RichArticleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title: str = ""
        self.publisher: str = ""
        self.publication_date: str = ""
        self.canonical_url: str = ""
        self.extracted_text: List[str] = []
        
        self.ignored_tags = {
            "script", "style", "nav", "header", "footer", "aside", "form", 
            "noscript", "svg", "button", "iframe"
        }
        self.current_tag_stack: List[str] = []
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        lower_tag = tag.lower()
        self.current_tag_stack.append(lower_tag)

        attrs_dict = {k.lower(): v for k, v in attrs if v is not None}

        if lower_tag == "title":
            self._in_title = True

        elif lower_tag == "meta":
            prop = attrs_dict.get("property", "").lower()
            name = attrs_dict.get("name", "").lower()
            content = attrs_dict.get("content", "").strip()

            if content:
                # Page Title
                if prop in ("og:title", "twitter:title") and not self.title:
                    self.title = content
                
                # Publisher / Site Name
                if prop in ("og:site_name",) and not self.publisher:
                    self.publisher = content
                elif name in ("publisher", "source", "author") and not self.publisher:
                    self.publisher = content

                # Publication Date
                if prop in ("article:published_time", "og:pubdate") and not self.publication_date:
                    self.publication_date = content.split("T")[0]
                elif name in ("date", "pubdate", "sailthru.date", "dc.date") and not self.publication_date:
                    self.publication_date = content.split("T")[0]

                # Canonical URL
                if prop == "og:url" and not self.canonical_url:
                    self.canonical_url = content

        elif lower_tag == "link":
            rel = attrs_dict.get("rel", "").lower()
            href = attrs_dict.get("href", "").strip()
            if rel == "canonical" and href:
                self.canonical_url = href

    def handle_endtag(self, tag):
        lower_tag = tag.lower()
        if lower_tag == "title":
            self._in_title = False
        if self.current_tag_stack and self.current_tag_stack[-1] == lower_tag:
            self.current_tag_stack.pop()

    def handle_data(self, data):
        if self._in_title and not self.title:
            self.title = data.strip()
            return

        # Ignore non-content structural tags
        if any(ignored in self.current_tag_stack for ignored in self.ignored_tags):
            return

        cleaned = data.strip()
        if len(cleaned) > 25:  # Significant sentence or paragraph chunk
            self.extracted_text.append(cleaned)


class PageFetcher:
    _robot_cache = {}

    @classmethod
    async def check_robots_txt(cls, url: str) -> bool:
        """Checks if URL crawling is allowed by the host robots.txt"""
        try:
            parsed = urlparse(url)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            robots_url = f"{base_url}/robots.txt"

            if base_url in cls._robot_cache:
                rp = cls._robot_cache[base_url]
                return rp.can_fetch("TruthLensVerificationBot", url)

            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)

            # Fast fetch robots.txt with timeout and security check
            if not is_safe_url(robots_url):
                return False

            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
                res = await client.get(robots_url)
                if res.status_code == 200:
                    rp.parse(res.text.splitlines())
                else:
                    rp.allow_all = True

            cls._robot_cache[base_url] = rp
            return rp.can_fetch("TruthLensVerificationBot", url)
        except Exception:
            return True

    @classmethod
    async def fetch_article(cls, url: str) -> Dict[str, Any]:
        """
        Safely fetches an article URL with SSRF protection, redirect abuse defense,
        size limit enforcement, and rich metadata extraction.
        """
        if not is_safe_url(url):
            return {
                "url": url,
                "canonical_url": url,
                "title": "",
                "publisher": "",
                "publication_date": None,
                "text": None,
                "status": "inaccessible",
                "limitations": ["URL blocked by SSRF security protection (private IP, loopback, or cloud metadata target)"]
            }

        # 1. Robots.txt policy compliance
        can_fetch = await cls.check_robots_txt(url)
        if not can_fetch:
            return {
                "url": url,
                "canonical_url": url,
                "title": "",
                "publisher": "",
                "publication_date": None,
                "text": None,
                "status": "snippet_only",
                "limitations": ["Full document retrieval disallowed by website robots.txt policy"]
            }

        # 2. Page fetch with redirect validation and size limits
        current_url = url
        headers = {
            "User-Agent": "TruthLensVerificationBot/1.0 (+https://truthlens.org/bot; factual evidence verification)",
            "Accept": "text/html,application/xhtml+xml,text/plain"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=False) as client:
                redirect_count = 0
                max_redirects = 5

                while redirect_count < max_redirects:
                    if not is_safe_url(current_url):
                        return {
                            "url": url,
                            "canonical_url": current_url,
                            "title": "",
                            "publisher": "",
                            "publication_date": None,
                            "text": None,
                            "status": "inaccessible",
                            "limitations": [f"Redirect hop to unsafe destination blocked by SSRF defense: {current_url}"]
                        }

                    res = await client.get(current_url, headers=headers)

                    if res.is_redirect:
                        location = res.headers.get("location")
                        if not location:
                            break
                        current_url = urljoin(current_url, location)
                        redirect_count += 1
                        continue
                    else:
                        break

                if res.status_code != 200:
                    status = "inaccessible" if res.status_code in (401, 403, 404, 410) else "snippet_only"
                    return {
                        "url": url,
                        "canonical_url": current_url,
                        "title": "",
                        "publisher": "",
                        "publication_date": None,
                        "text": None,
                        "status": status,
                        "limitations": [f"HTTP {res.status_code} returned when accessing original article"]
                    }

                # Verify Content-Type
                content_type = res.headers.get("content-type", "").lower()
                if not any(t in content_type for t in ("text/html", "application/xhtml+xml", "text/plain")):
                    return {
                        "url": url,
                        "canonical_url": current_url,
                        "title": "",
                        "publisher": "",
                        "publication_date": None,
                        "text": None,
                        "status": "inaccessible",
                        "limitations": [f"Unsupported media content-type '{content_type}'; only text/html articles supported"]
                    }

                # Enforce response length limit (5MB)
                raw_html = res.text[:SSRFProtection.MAX_RESPONSE_BYTES]

                # Parse document
                parser = RichArticleParser()
                parser.feed(raw_html)

                body_text = clean_text(" ".join(parser.extracted_text))
                if len(body_text) < 100:
                    return {
                        "url": url,
                        "canonical_url": parser.canonical_url or current_url,
                        "title": parser.title,
                        "publisher": parser.publisher or urlparse(current_url).netloc.replace("www.", ""),
                        "publication_date": parser.publication_date or None,
                        "text": None,
                        "status": "snippet_only",
                        "limitations": ["Insufficient textual content extracted from article body"]
                    }

                publisher = parser.publisher or urlparse(current_url).netloc.replace("www.", "")

                return {
                    "url": url,
                    "canonical_url": parser.canonical_url or current_url,
                    "title": parser.title or "Article",
                    "publisher": publisher,
                    "publication_date": parser.publication_date or None,
                    "text": body_text[:20000],
                    "status": "full_text",
                    "limitations": []
                }

        except httpx.TimeoutException:
            return {
                "url": url,
                "canonical_url": current_url,
                "title": "",
                "publisher": "",
                "publication_date": None,
                "text": None,
                "status": "snippet_only",
                "limitations": ["Connection timed out while retrieving article document"]
            }
        except Exception as e:
            logger.warning("Error fetching article from %s: %s", url, type(e).__name__)
            return {
                "url": url,
                "canonical_url": current_url,
                "title": "",
                "publisher": "",
                "publication_date": None,
                "text": None,
                "status": "snippet_only",
                "limitations": [f"Unable to access original document: {type(e).__name__}"]
            }

    @classmethod
    async def fetch_article_text(cls, url: str) -> Tuple[Optional[str], str, List[str]]:
        """Backwards compatible helper for existing evidence fetcher"""
        data = await cls.fetch_article(url)
        return data["text"], data["status"], data["limitations"]

fetch_article = PageFetcher.fetch_article
fetch_article_text = PageFetcher.fetch_article_text
