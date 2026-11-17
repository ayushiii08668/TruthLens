import re
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.models.evidence_schemas import RawEvidenceSnippet
from app.services.evidence.base import BaseEvidenceProvider

class MockEvidenceProvider(BaseEvidenceProvider):
    @property
    def provider_name(self) -> str:
        return "TruthLens Curated Mock Intelligence Archive"

    @property
    def is_available(self) -> bool:
        return True

    # Real, curated evidence items representing authoritative news, government archives, and fact-checking records
    MOCK_DATABASE: List[Dict[str, Any]] = [
        {
            "keywords": ["europa", "clipper", "nasa", "jupiter", "spacecraft"],
            "title": "NASA Launches Europa Clipper to Investigate Habitability of Jupiter's Ocean Moon",
            "url": "https://www.nasa.gov/news-release/nasa-launches-europa-clipper-spacecraft/",
            "publisher": "NASA Official Press Office",
            "domain": "nasa.gov",
            "publication_date": "2024-10-14",
            "excerpt": "NASA's Europa Clipper spacecraft lifted off aboard a SpaceX Falcon Heavy rocket from Launch Complex 39A at NASA's Kennedy Space Center in Florida on a 1.8-billion-mile journey to Jupiter's ocean moon Europa.",
            "source_type": "government",
            "is_primary_source": True
        },
        {
            "keywords": ["europa", "clipper", "space", "jupiter", "launch"],
            "title": "Europa Clipper mission launches on 1.8 billion mile journey",
            "url": "https://apnews.com/article/nasa-europa-clipper-launch-jupiter-moon",
            "publisher": "Associated Press",
            "domain": "apnews.com",
            "publication_date": "2024-10-14",
            "excerpt": "A NASA spacecraft embarked on a long journey to an icy moon of Jupiter on Monday to scout its vast subsurface ocean for conditions suitable to life.",
            "source_type": "news",
            "is_primary_source": False
        },
        {
            "keywords": ["federal reserve", "interest rates", "basis points", "50", "lowered"],
            "title": "Federal Reserve lowers benchmark policy rate by 50 basis points",
            "url": "https://www.federalreserve.gov/newsevents/pressreleases/monetary20240918a.htm",
            "publisher": "Board of Governors of the Federal Reserve System",
            "domain": "federalreserve.gov",
            "publication_date": "2024-09-18",
            "excerpt": "In light of the progress on inflation and the balance of risks, the Committee decided to lower the target range for the federal funds rate by 1/2 percentage point to 4-3/4 to 5 percent.",
            "source_type": "government",
            "is_primary_source": True
        },
        {
            "keywords": ["federal reserve", "rates", "cut", "inflation"],
            "title": "Fed kicks off rate cuts with aggressive half-point reduction",
            "url": "https://www.reuters.com/markets/us/fed-poised-cut-rates-first-time-since-2020-2024-09-18/",
            "publisher": "Reuters",
            "domain": "reuters.com",
            "publication_date": "2024-09-18",
            "excerpt": "The Federal Reserve kicked off its monetary easing cycle on Wednesday with a larger-than-usual half-percentage-point reduction in borrowing costs.",
            "source_type": "news",
            "is_primary_source": False
        },
        {
            "keywords": ["ai act", "european union", "artificial intelligence", "passed", "adopted"],
            "title": "Artificial Intelligence Act: MEPs adopt landmark rules",
            "url": "https://www.europarl.europa.eu/news/en/press-room/20240308IPR19015/artificial-intelligence-act",
            "publisher": "European Parliament Press Room",
            "domain": "europarl.europa.eu",
            "publication_date": "2024-03-13",
            "excerpt": "On Wednesday, Parliament endorsed the Artificial Intelligence Act that ensures safety and fundamental rights while boosting innovation. The regulation was endorsed by MEPs with 523 votes in favour.",
            "source_type": "government",
            "is_primary_source": True
        },
        {
            "keywords": ["tax", "increase", "40%", "tuesday", "government"],
            "title": "Fact Check: False claims circulate regarding sudden 40 percent income tax hike",
            "url": "https://www.factcheck.org/2026/11/false-claims-income-tax-hike-rumor/",
            "publisher": "FactCheck.org",
            "domain": "factcheck.org",
            "publication_date": "2026-11-12",
            "excerpt": "Viral social media posts claiming parliament secretly passed a 40% income tax increase last Tuesday are completely fabricated. Official parliamentary voting records confirm no such legislation was considered or passed.",
            "source_type": "fact_check",
            "is_primary_source": False
        },
        {
            "keywords": ["greenhouse", "gas", "emissions", "fossil", "record", "37.4"],
            "title": "Global Carbon Budget: Fossil CO2 emissions hit record in 2023",
            "url": "https://www.globalcarbonproject.org/carbonbudget/23/publications.htm",
            "publisher": "Global Carbon Project",
            "domain": "globalcarbonproject.org",
            "publication_date": "2023-12-05",
            "excerpt": "Global emissions from fossil fuels increased by 1.1% in 2023 to reach a record 37.4 billion metric tons of CO2.",
            "source_type": "academic",
            "is_primary_source": True
        },
        {
            "keywords": ["who", "avian", "influenza", "france", "poultry"],
            "title": "Avian Influenza Outbreak in Domestic Poultry Facilities",
            "url": "https://www.who.int/emergencies/disease-outbreak-news/item/2025-DON502",
            "publisher": "World Health Organization",
            "domain": "who.int",
            "publication_date": "2025-02-10",
            "excerpt": "The Ministry of Agriculture in France confirmed an outbreak of high pathogenicity avian influenza in commercial poultry flocks.",
            "source_type": "government",
            "is_primary_source": True
        }
    ]

    async def search(self, query: str, max_results: int = 5) -> List[RawEvidenceSnippet]:
        query_words = set(re.findall(r"\b[a-z0-9]+\b", query.lower()))
        matched_results = []

        now_iso = datetime.now(timezone.utc).isoformat()

        for item in self.MOCK_DATABASE:
            keywords = item["keywords"]
            score = sum(1 for kw in keywords if kw.lower() in query.lower() or kw.lower() in query_words)
            if score >= 1:
                matched_results.append((score, item))

        # Sort by relevance score descending
        matched_results.sort(key=lambda x: x[0], reverse=True)

        snippets = []
        for score, item in matched_results[:max_results]:
            # Determine publisher identity classification
            source_type = item.get("source_type", "general_web")
            if source_type == "government":
                pub_identity = "Government Agency / Official Public Authority"
            elif source_type == "fact_check":
                pub_identity = "Independent Fact-Checking Organization"
            elif source_type == "academic":
                pub_identity = "Academic / Scientific Research Institute"
            elif "wire" in item.get("publisher", "").lower() or "associated press" in item.get("publisher", "").lower() or "reuters" in item.get("publisher", "").lower():
                pub_identity = "International News Wire Syndicate"
            else:
                pub_identity = "Commercial News / Media Organization"

            snippets.append(
                RawEvidenceSnippet(
                    title=item["title"],
                    url=item["url"],
                    publisher=item["publisher"],
                    publisher_identity=pub_identity,
                    domain=item["domain"],
                    publication_date=item["publication_date"],
                    event_date=item.get("event_date", item["publication_date"]),
                    retrieval_date=now_iso,
                    excerpt=item["excerpt"],
                    full_text=item.get("full_text"),
                    source_type=item["source_type"],
                    is_primary_source=item["is_primary_source"],
                    document_status="snippet_only",
                    original_document_availability="full_text" if item.get("full_text") else "snippet_only",
                    access_limitations=[]
                )
            )

        return snippets

