import re
from typing import Tuple, Optional

class ClaimNormalizer:
    # Common news broadcast or conversational prefixes to remove for a clean factual proposition
    PREFIX_STRIPPERS = [
        r"^(?:BREAKING|BREAKING\s+NEWS|ALERT|JUST\s+IN|FACT\s+CHECK|EXCLUSIVE|UPDATE)\s*[:\-–—]\s*",
        r"^(?:Did\s+you\s+know\s+(?:that)?|It\s+turns\s+out\s+(?:that)?)\s*",
        r"^(?:Reports\s+(?:confirm|indicate|state)\s+that|Sources\s+say\s+that)\s*",
        r"^(?:It\s+(?:was\s+announced|is\s+reported)\s+that)\s*",
        r"^(?:According\s+to\s+[^,]+,\s*)"
    ]

    @classmethod
    def normalize(cls, sentence: str) -> Tuple[str, Optional[str]]:
        if not sentence:
            return "", None

        raw = sentence.strip()
        context = None

        # Check if there is an attribution clause at the beginning (e.g. "According to the WHO, ...")
        attrib_match = re.match(r"^(According\s+to\s+[^,]+),\s*(.*)$", raw, flags=re.IGNORECASE)
        if attrib_match:
            context = attrib_match.group(1).strip()
            raw = attrib_match.group(2).strip()

        # Strip news headline noise prefixes
        for prefix in cls.PREFIX_STRIPPERS:
            raw = re.sub(prefix, "", raw, flags=re.IGNORECASE)

        # Capitalize first letter
        if raw and raw[0].islower():
            raw = raw[0].upper() + raw[1:]

        # Ensure sentence ends with a period if it doesn't have terminal punctuation
        if raw and raw[-1] not in {".", "!", "?"}:
            raw += "."

        return raw, context

normalize_claim = ClaimNormalizer.normalize

