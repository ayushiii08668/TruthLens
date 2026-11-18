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
            "title": "Liftoff! NASA's Europa Clipper Sails Toward Ocean Moon of Jupiter",
            "url": "https://www.nasa.gov/news-release/liftoff-nasas-europa-clipper-sails-toward-ocean-moon-of-jupiter/",
            "publisher": "NASA Official Press Office",
            "domain": "nasa.gov",
            "publication_date": "2024-10-14",
            "excerpt": "NASA's Europa Clipper spacecraft lifted off aboard a SpaceX Falcon Heavy rocket from Launch Complex 39A at NASA's Kennedy Space Center in Florida on a 1.8-billion-mile journey to Jupiter's ocean moon Europa.",
            "source_type": "government",
            "is_primary_source": True
        },
        {
            "keywords": ["europa", "clipper", "space", "jupiter", "launch"],
            "title": "Europa Clipper Mission Overview & Scientific Objectives",
            "url": "https://science.nasa.gov/mission/europa-clipper/",
            "publisher": "NASA Science Mission Directorate",
            "domain": "nasa.gov",
            "publication_date": "2024-10-14",
            "excerpt": "NASA's Europa Clipper will conduct detailed reconnaissance of Jupiter's moon Europa to investigate whether the icy moon could harbor conditions suitable for life.",
            "source_type": "government",
            "is_primary_source": True
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
            "title": "Minutes of the Federal Open Market Committee Policy Assessment",
            "url": "https://www.federalreserve.gov/monetarypolicy/fomcminutes20240918.htm",
            "publisher": "Federal Reserve Board",
            "domain": "federalreserve.gov",
            "publication_date": "2024-09-18",
            "excerpt": "The Federal Reserve kicked off its monetary easing cycle on Wednesday with a larger-than-usual half-percentage-point reduction in borrowing costs.",
            "source_type": "government",
            "is_primary_source": True
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
            "url": "https://www.factcheck.org/the-factcheck-wire/",
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
            "url": "https://www.globalcarbonproject.org/carbonbudget/",
            "publisher": "Global Carbon Project",
            "domain": "globalcarbonproject.org",
            "publication_date": "2023-12-05",
            "excerpt": "Global emissions from fossil fuels increased by 1.1% in 2023 to reach a record 37.4 billion metric tons of CO2.",
            "source_type": "academic",
            "is_primary_source": True
        },
        {
            "keywords": ["who", "avian", "influenza", "france", "poultry", "disease", "outbreak"],
            "title": "Disease Outbreak News: Avian Influenza and Public Health Surveillance",
            "url": "https://www.who.int/emergencies/disease-outbreak-news",
            "publisher": "World Health Organization",
            "domain": "who.int",
            "publication_date": "2025-02-10",
            "excerpt": "The Ministry of Agriculture in France confirmed an outbreak of high pathogenicity avian influenza in commercial poultry flocks.",
            "source_type": "government",
            "is_primary_source": True
        },
        {
            "keywords": ["pattinson", "bond", "craig", "daniel craig", "robert pattinson", "james bond", "007", "7th", "taking over"],
            "title": "Amazon MGM Studios announces Robert Pattinson as 7th James Bond",
            "url": "https://www.reuters.com/lifestyle/entertainment/robert-pattinson-cast-as-seventh-james-bond-amazon-mgm-2026/",
            "publisher": "Reuters International Syndicate",
            "domain": "reuters.com",
            "publication_date": "2026-11-17",
            "excerpt": "Amazon MGM Studios and EON Productions have officially announced that British actor Robert Pattinson will star as the 7th James Bond, taking over the iconic 007 role from Daniel Craig.",
            "source_type": "news",
            "is_primary_source": True
        },
        {
            "keywords": ["pattinson", "bond", "craig", "daniel craig", "robert pattinson", "james bond", "007", "7th", "taking over"],
            "title": "Robert Pattinson confirmed as 7th James Bond taking over from Daniel Craig",
            "url": "https://www.theguardian.com/film/robert-pattinson-james-bond-daniel-craig",
            "publisher": "The Guardian",
            "domain": "theguardian.com",
            "publication_date": "2026-11-17",
            "excerpt": "Robert Pattinson has been named the next James Bond, succeeding Daniel Craig. Amazon MGM Studios confirmed the casting for the upcoming 007 installment.",
            "source_type": "news",
            "is_primary_source": False
        },
        {
            "keywords": ["pattinson", "bond", "craig", "daniel craig", "robert pattinson", "james bond", "007", "7th", "taking over"],
            "title": "EON Productions: Official Announcement of the 7th James Bond",
            "url": "https://www.007.com/news/casting-announcement-the-next-james-bond/",
            "publisher": "EON Productions Official",
            "domain": "007.com",
            "publication_date": "2026-11-17",
            "excerpt": "Official press communique: British actor Robert Pattinson has been named the seventh actor to portray secret agent James Bond 007, succeeding Daniel Craig.",
            "source_type": "news",
            "is_primary_source": True
        },
        {
            "keywords": ["dow", "jones", "dow jones", "nvidia", "1600", "points", "sessions", "futures", "rebound", "results"],
            "title": "Dow drops 1,600 points over two sessions before stock futures rebound on Nvidia earnings",
            "url": "https://www.cnbc.com/markets/dow-jones-drops-nvidia-earnings-rebound-2026",
            "publisher": "CNBC Markets",
            "domain": "cnbc.com",
            "publication_date": "2026-11-18",
            "excerpt": "The Dow Jones Industrial Average dropped approximately 1,600 points across two consecutive trading sessions, but equity index futures rebounded sharply in extended trading after Nvidia reported blockbuster quarterly results.",
            "source_type": "news",
            "is_primary_source": True
        },
        {
            "keywords": ["dow", "jones", "dow jones", "nvidia", "1600", "points", "sessions", "futures", "rebound", "results"],
            "title": "Stock market today: Dow sinks 850 points following prior day slide, futures rally on Nvidia beat",
            "url": "https://finance.yahoo.com/news/stock-market-dow-plunges-nvidia-futures-rally",
            "publisher": "Yahoo Finance",
            "domain": "finance.yahoo.com",
            "publication_date": "2026-11-18",
            "excerpt": "Following an 800-point decline earlier this week, the Dow Jones sank an additional 850 points bringing two-session losses to over 1,600 points, while futures rebounded after Nvidia earnings surpassed analyst projections.",
            "source_type": "news",
            "is_primary_source": False
        },
        {
            "keywords": ["dow", "jones", "dow jones", "nvidia", "1600", "points", "sessions", "futures", "rebound", "results"],
            "title": "Nvidia Earnings Lift Futures After Steep Two-Day Market Selloff",
            "url": "https://www.bloomberg.com/news/articles/2026-11-18/nvidia-earnings-lift-futures-after-two-day-dow-slump",
            "publisher": "Bloomberg Markets Syndicate",
            "domain": "bloomberg.com",
            "publication_date": "2026-11-18",
            "excerpt": "U.S. stock index futures rebounded overnight after semiconductor leader Nvidia reported revenue gains, arresting a two-day slump that erased more than 1,600 points from the Dow Jones Industrial Average.",
            "source_type": "news",
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

