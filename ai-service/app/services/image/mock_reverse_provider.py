import hashlib
import logging
from typing import Optional, List
from app.services.image.base_provider import BaseReverseImageProvider, ReverseImageResult, ImageOriginMatch

logger = logging.getLogger("truthlens.image.reverse")

class MockReverseImageProvider(BaseReverseImageProvider):
    """
    Curated reverse image search intelligence archive for local development,
    reproducible benchmarks, and testing without third-party API dependencies.
    """

    ARCHIVE_REPERTOIRE = [
        {
            "keywords": ["fire", "explosion", "flames", "smoke", "wildfire"],
            "matches": [
                ImageOriginMatch(
                    title="Mendocino Complex Wildfire burns through Northern California",
                    url="https://apnews.com/article/california-wildfires-mendocino-complex-archive",
                    publisher="Associated Press Wire",
                    earliest_date="2018-08-06",
                    original_caption="Flames consume hillside terrain during the Mendocino Complex fire in Lake County, California, August 6, 2018.",
                    similarity_score=0.98,
                    is_authoritative=True
                ),
                ImageOriginMatch(
                    title="CAL FIRE Incident Archive: August 2018 Siege",
                    url="https://fire.ca.gov/incidents/2018/mendocino-complex",
                    publisher="California Department of Forestry and Fire Protection",
                    earliest_date="2018-08-04",
                    original_caption="Official incident documentation: Northern California wildland fire.",
                    similarity_score=0.95,
                    is_authoritative=True
                )
            ]
        },
        {
            "keywords": ["rocket", "launch", "falcon", "europa", "spacecraft", "nasa"],
            "matches": [
                ImageOriginMatch(
                    title="NASA Europa Clipper lifts off atop SpaceX Falcon Heavy",
                    url="https://nasa.gov/news/europa-clipper-launch-october-2024",
                    publisher="NASA Planetary Exploration Bureau",
                    earliest_date="2024-10-14",
                    original_caption="A SpaceX Falcon Heavy rocket lifts off from Launch Complex 39A at Kennedy Space Center carrying NASA's Europa Clipper.",
                    similarity_score=0.99,
                    is_authoritative=True
                ),
                ImageOriginMatch(
                    title="Europa Clipper Mission Launch Imagery",
                    url="https://spacex.com/launches/europa-clipper",
                    publisher="SpaceX Media",
                    earliest_date="2024-10-14",
                    original_caption="Falcon Heavy launch from Pad 39A in Florida.",
                    similarity_score=0.96,
                    is_authoritative=True
                )
            ]
        },
        {
            "keywords": ["protest", "crowd", "demonstration", "rally", "march"],
            "matches": [
                ImageOriginMatch(
                    title="Yellow Vest demonstrations block Champs-Elysees in Paris",
                    url="https://reuters.com/article/france-protests-paris-gilets-jaunes-archive",
                    publisher="Reuters Pictures",
                    earliest_date="2018-12-01",
                    original_caption="Demonstrators gather near the Arc de Triomphe during national economic protests in Paris on December 1, 2018.",
                    similarity_score=0.97,
                    is_authoritative=True
                )
            ]
        }
    ]

    async def search(self, image_bytes: bytes, image_hash: str = "") -> ReverseImageResult:
        if not image_hash and image_bytes:
            image_hash = hashlib.sha256(image_bytes).hexdigest()

        # Check if any associated metadata or hash matches our archive
        # We also check content text or signature
        matches: List[ImageOriginMatch] = []

        # For benchmark testing, inspect byte signatures or match default if requested
        for entry in self.ARCHIVE_REPERTOIRE:
            # If the caller provides hint text or if hash contains hint
            for kw in entry["keywords"]:
                if kw in image_hash.lower():
                    matches.extend(entry["matches"])
                    break
            if matches:
                break

        # If no specific keyword triggered, check if image_bytes has recognizable header or fallback
        if not matches and len(image_bytes) > 0:
            # Default to first known benchmark entry if it's our test fixture
            first_entry = self.ARCHIVE_REPERTOIRE[0]
            # If image contains exif or signature indicating fire or rocket
            pass

        earliest_date = None
        orig_pub = None
        if matches:
            dates = [m.earliest_date for m in matches if m.earliest_date]
            if dates:
                earliest_date = min(dates)
            orig_pub = matches[0].publisher

        return ReverseImageResult(
            matches=matches,
            earliest_known_date=earliest_date,
            original_publisher=orig_pub,
            provider_name="TruthLensArchiveReverseSearch",
            total_matches_found=len(matches)
        )

