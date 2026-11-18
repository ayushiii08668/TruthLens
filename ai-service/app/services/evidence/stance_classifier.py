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
        r"\b(?:named|cast|takes\s+over|taking\s+over|succeeds|succeeding|selected|appointed|next\s+james\s+bond)\b",
        r"\b(?:drops?|sinks?|falls?|tumbles?|plunges?|rebound(?:s|ed)?|rall(?:y|ies)|lift(?:s|ed)?|surges?|gains?|soars?|slide)\b",
        r"\bfact\s+check\s*:\s*(?:true|correct|accurate)\b"
    ]

    STOPWORDS = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "by", 
        "with", "is", "are", "was", "were", "it", "that", "this", "be", "has", "have",
        "but", "after", "before", "during", "when", "where", "two", "over", "into"
    }

    @classmethod
    def evaluate(cls, claim: str, title: str, excerpt: str) -> Tuple[ProvisionalStance, float]:
        claim_lower = claim.lower()
        combined_text = f"{title} {excerpt}".lower()

        # Normalize numbers with commas: 1,600 -> 1600
        clean_claim_num = re.sub(r"(\d+),(\d+)", r"\1\2", claim_lower)
        clean_text_num = re.sub(r"(\d+),(\d+)", r"\1\2", combined_text)

        # 1. Relevance Score calculation (excluding stopwords)
        claim_words = {w for w in re.findall(r"\b[a-z0-9]{3,}\b", clean_claim_num) if w not in cls.STOPWORDS}
        text_words = set(re.findall(r"\b[a-z0-9]{3,}\b", clean_text_num))

        if not claim_words:
            return "NEUTRAL", 0.1

        overlap = claim_words.intersection(text_words)
        
        # If fewer than 2 substantive terms match in a multi-term claim, it is incidental keyword noise
        if len(claim_words) >= 4 and len(overlap) < 2:
            return "NEUTRAL", 0.10

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

