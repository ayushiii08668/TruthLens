import re
from typing import Tuple
from app.models.evidence_schemas import ProvisionalStance

class ProvisionalStanceClassifier:
    DEBUNK_PATTERNS = [
        r"\b(?:false|fabricated|debunked|hoax|misleading|inaccurate|untrue|refuted|disproven)\b",
        r"\b(?:no\s+evidence|contrary\s+to\s+claims|denied\s+that|denies\s+having)\b",
        r"\b(?:did\s+not|never|has\s+not\s+passed|failed\s+to\s+find)\b",
        r"\bfact\s+check\s*:\s*(?:false|pants\s+on\s+fire|mostly\s+false)\b"
    ]

    SUPPORT_PATTERNS = [
        r"\b(?:confirmed|officially\s+announced|approved|launch|launches|launched|lifted\s+off|embarked)\b",
        r"\b(?:enacted|signed\s+into\s+law|unveiled|revealed|published|reported|decided|voted)\b",
        r"\b(?:records\s+show|data\s+indicates|evidence\s+demonstrates|verified\s+that)\b",
        r"\b(?:agreed\s+to|voted\s+in\s+favor|adopted|lowered|raised|increased|decreased)\b",
        r"\bfact\s+check\s*:\s*(?:true|correct|accurate)\b"
    ]

    @classmethod
    def evaluate(cls, claim: str, title: str, excerpt: str) -> Tuple[ProvisionalStance, float]:
        combined_text = f"{title} {excerpt}".lower()
        claim_lower = claim.lower()

        # 1. Relevance Score calculation
        claim_words = set(re.findall(r"\b[a-z0-9]{3,}\b", claim_lower))
        text_words = set(re.findall(r"\b[a-z0-9]{3,}\b", combined_text))

        if not claim_words:
            return "NEUTRAL", 0.1

        overlap = claim_words.intersection(text_words)
        relevance_score = min(1.0, round(len(overlap) / max(3, len(claim_words) * 0.5), 2))

        # If overlap is very low, mark as NEUTRAL with low relevance
        if relevance_score < 0.25:
            return "NEUTRAL", max(0.1, relevance_score)

        # 2. Check for Contradicting markers
        for pattern in cls.DEBUNK_PATTERNS:
            if re.search(pattern, combined_text):
                return "CONTRADICTS", relevance_score

        # 3. Check for Supporting markers
        for pattern in cls.SUPPORT_PATTERNS:
            if re.search(pattern, combined_text):
                return "SUPPORTS", relevance_score

        # 4. If relevance is exceptionally high and no debunking terms exist, it provisionally supports the factual assertion
        if relevance_score >= 0.70:
            return "SUPPORTS", relevance_score

        # Default to contextual / Neutral
        return "NEUTRAL", relevance_score

classify_stance = ProvisionalStanceClassifier.evaluate

