import re
import html

class TextCleaner:
    @staticmethod
    def clean(text: str) -> str:
        if not text or not isinstance(text, str):
            return ""

        # Decode HTML entities (e.g., &amp; -> &, &quot; -> ")
        cleaned = html.unescape(text)

        # Remove HTML tags
        cleaned = re.sub(r"<[^>]+>", " ", cleaned)

        # Remove common social media prefixes like "RT @username:"
        cleaned = re.sub(r"^RT\s+@[\w_]+:\s*", "", cleaned, flags=re.IGNORECASE)

        # Normalize Twitter-style handles "@username"
        cleaned = re.sub(r"@[\w_]+", "", cleaned)

        # Convert hashtags "#climateChange" -> "climateChange"
        cleaned = re.sub(r"#(\w+)", r"\1", cleaned)

        # Normalize unicode quotes and dashes
        cleaned = cleaned.replace("“", '"').replace("”", '"')
        cleaned = cleaned.replace("‘", "'").replace("’", "'")
        cleaned = cleaned.replace("`", "'").replace("´", "'")
        cleaned = cleaned.replace("—", " - ").replace("–", " - ")
        cleaned = cleaned.replace("…", "...")

        # Remove zero-width spaces and control characters except \n
        cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]", "", cleaned)

        # Normalize horizontal whitespace
        cleaned = re.sub(r"[ \t\f\v]+", " ", cleaned)

        # Normalize vertical whitespace (no more than two consecutive newlines)
        cleaned = re.sub(r"\n\s*\n", "\n\n", cleaned)

        return cleaned.strip()

clean_text = TextCleaner.clean

