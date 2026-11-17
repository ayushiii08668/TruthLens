import re
from typing import List, Tuple

class TemporalNumericalExtractor:
    MONTHS = (
        r"January|February|March|April|May|June|July|August|September|October|November|December|"
        r"Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
    )

    DATE_PATTERNS = [
        # Explicit full date: November 12, 2026 or 12 November 2026
        rf"\b(?:{MONTHS})\s+\d{{1,2}}(?:st|nd|rd|th)?(?:,?\s+\d{{4}})?\b",
        rf"\b\d{{1,2}}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:{MONTHS})(?:,?\s+\d{{4}})?\b",
        # ISO date or numeric: 2026-11-12 or 11/12/2026 or 12/11/2026
        r"\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b",
        r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
        # Year alone: 1900-2099
        r"\b(?:19|20)\d{2}\b",
        # Quarters: Q1 2026, third quarter of 2025
        r"\b(?:Q[1-4]|first|second|third|fourth\s+quarter)(?:\s+(?:of\s+)?(?:19|20)\d{2})?\b",
        # Relative time phrases: yesterday, last week, last Thursday, in 2026
        r"\b(?:yesterday|last\s+(?:week|month|year|Tuesday|Monday|Wednesday|Thursday|Friday|Saturday|Sunday))\b",
        r"\b(?:in|since|by)\s+(?:19|20)\d{2}\b"
    ]

    NUMBER_PATTERNS = [
        # Currency: $5.4 billion, €200M, £1.2 trillion
        r"[\$€£¥]\s*\d+(?:\.\d+)?\s*(?:trillion|billion|million|thousand|k|m|b)?\b",
        # Percentages: 45%, 3.5 percent, 12 percentage points
        r"\b\d+(?:\.\d+)?\s*(?:%|percent|percentage\s+points?)\b",
        # Large figures (with optional hyphen or space): 1.8-billion, 5.4 million, 300 thousand
        r"\b\d+(?:\.\d+)?(?:[\s\-]+)?(?:trillion|billion|million|thousand)\b",
        # Standard formatted integers or decimals: 450,000 or 1,200
        r"\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b"
    ]

    @classmethod
    def extract(cls, text: str) -> Tuple[List[str], List[str]]:
        if not text:
            return [], []

        dates = []
        numbers = []

        # Extract dates
        for pattern in cls.DATE_PATTERNS:
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            for m in matches:
                clean_m = m.strip()
                if clean_m and clean_m not in dates:
                    dates.append(clean_m)

        # Extract numbers / statistics
        for pattern in cls.NUMBER_PATTERNS:
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            for m in matches:
                clean_m = m.strip()
                if clean_m and clean_m not in numbers:
                    numbers.append(clean_m)

        return dates, numbers

extract_temporal = TemporalNumericalExtractor.extract
