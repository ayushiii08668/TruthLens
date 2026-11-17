import re
from typing import List

class SentenceSegmenter:
    # Common abbreviations that should NOT trigger a sentence break
    ABBREVIATIONS = [
        r"Mr\.", r"Mrs\.", r"Ms\.", r"Dr\.", r"Prof\.", r"Sr\.", r"Jr\.",
        r"Gov\.", r"Sen\.", r"Rep\.", r"Gen\.", r"Col\.", r"Capt\.", r"Lt\.",
        r"U\.S\.", r"U\.K\.", r"E\.U\.", r"U\.N\.", r"D\.C\.",
        r"e\.g\.", r"i\.e\.", r"vs\.", r"approx\.", r"est\.", r"etc\.",
        r"Jan\.", r"Feb\.", r"Mar\.", r"Apr\.", r"Jun\.", r"Jul\.", r"Aug\.",
        r"Sep\.", r"Sept\.", r"Oct\.", r"Nov\.", r"Dec\.",
        r"Inc\.", r"Corp\.", r"Ltd\.", r"Co\.", r"No\.", r"Vol\.", r"p\.", r"pp\."
    ]

    ABBREV_PATTERN = re.compile(
        r"\b(" + "|".join(ABBREVIATIONS) + r")\s*$",
        re.IGNORECASE
    )

    @classmethod
    def segment(cls, text: str, remove_duplicates: bool = True) -> List[str]:
        if not text or not text.strip():
            return []

        # First protect abbreviations and decimals with temporary tokens
        protected = text

        # Protect decimals like 3.14 or $5.5B
        protected = re.sub(r"(\d+)\.(\d+)", r"\1__DECIMAL__\2", protected)

        # Protect ellipsis
        protected = re.sub(r"\.{3,}", "__ELLIPSIS__", protected)

        # Protect abbreviations
        for idx, abbrev in enumerate(cls.ABBREVIATIONS):
            clean_abbrev = abbrev.replace(r"\.", ".").replace(r"\\", "")
            escaped = re.escape(clean_abbrev)
            token = f"__ABBREV_{idx}__"
            protected = re.sub(r"\b" + escaped, token, protected, flags=re.IGNORECASE)

        # Split on sentence boundaries: period, exclamation, question mark followed by space or newline, or paragraph breaks
        raw_splits = re.split(r"(?<=[.!?])(?:\s+|\n+)|(?:\n\s*\n)+", protected)

        sentences = []
        seen_signatures = set()

        for raw_s in raw_splits:
            # Restore tokens
            s = raw_s.replace("__DECIMAL__", ".").replace("__ELLIPSIS__", "...")
            for idx, abbrev in enumerate(cls.ABBREVIATIONS):
                clean_abbrev = abbrev.replace(r"\.", ".").replace(r"\\", "")
                token = f"__ABBREV_{idx}__"
                s = s.replace(token, clean_abbrev)

            cleaned_s = s.strip()
            # Remove leading bullet points, numbers, or dashes
            cleaned_s = re.sub(r"^(?:[\d]+[.)]|\*|-|•)\s*", "", cleaned_s)

            if len(cleaned_s) < 5:
                continue

            if remove_duplicates:
                # Signature is alphanumeric lowercase
                sig = re.sub(r"[^a-z0-9]", "", cleaned_s.lower())
                if sig in seen_signatures:
                    continue
                seen_signatures.add(sig)

            sentences.append(cleaned_s)

        return sentences

segment_sentences = SentenceSegmenter.segment

