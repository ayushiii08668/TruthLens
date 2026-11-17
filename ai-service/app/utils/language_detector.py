import re
from typing import Tuple

class LanguageDetector:
    # Common function words for top languages
    STOPWORDS = {
        "en": {
            "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", 
            "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", 
            "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", 
            "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", 
            "about", "who", "get", "which", "go", "me", "when", "make", "can", "like"
        },
        "es": {
            "el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber", 
            "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "lo", 
            "todo", "pero", "más", "hacer", "o", "poder", "decir", "este", "ir", "otro"
        },
        "fr": {
            "le", "la", "les", "de", "des", "du", "un", "une", "et", "à", "en", "que", 
            "qui", "dans", "pour", "pas", "sur", "ce", "par", "avec", "sont", "est", 
            "plus", "ne", "se", "il", "elle", "nous", "vous", "ils", "comme", "mais"
        },
        "de": {
            "der", "die", "das", "und", "in", "zu", "den", "das", "nicht", "von", "sie", 
            "ist", "des", "sich", "mit", "dem", "dass", "er", "es", "ein", "ich", "auf", 
            "so", "eine", "auch", "als", "an", "nach", "wie", "im", "für", "man", "aber"
        }
    }

    @classmethod
    def detect(cls, text: str) -> Tuple[str, float]:
        if not text or not text.strip():
            return "en", 1.0

        words = re.findall(r"\b[a-zA-Z\u00C0-\u017F]+\b", text.lower())
        if not words:
            return "en", 0.5

        scores = {lang: 0 for lang in cls.STOPWORDS}
        for word in words:
            for lang, stopset in cls.STOPWORDS.items():
                if word in stopset:
                    scores[lang] += 1

        best_lang = max(scores, key=scores.get)
        best_count = scores[best_lang]

        if best_count == 0:
            return "en", 0.6  # Default fallback

        confidence = min(1.0, round(best_count / (len(words) * 0.3 + 1), 2))
        return best_lang, confidence

detect_language = LanguageDetector.detect

