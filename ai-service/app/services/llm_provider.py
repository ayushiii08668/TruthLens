import json
import logging
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger("truthlens.ai.provider")

class BaseLLMProvider(ABC):
    @abstractmethod
    async def extract_claims(self, text: str) -> Optional[List[Dict[str, Any]]]:
        """Extract factual claims from text using LLM."""
        pass


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", timeout: int = 15):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    async def extract_claims(self, text: str) -> Optional[List[Dict[str, Any]]]:
        if not self.api_key:
            return None

        prompt = (
            "You are a factual claim extraction system for an intelligence verification platform.\n"
            "Analyze the text and extract only falsifiable, objective factual claims.\n"
            "Do NOT include opinions, questions, or predictions.\n"
            "Return JSON matching this schema:\n"
            '{"claims": [{"original_text": "...", "normalized_claim": "...", "category": "politics|government|health|science|technology|business|finance|education|environment|general news", "entities": ["..."], "dates": ["..."], "location": "...", "verifiable": true, "relevant_context": "..."}]}'
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": prompt},
                            {"role": "user", "content": text}
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.1
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return parsed.get("claims", [])
                else:
                    logger.warning("OpenAI extraction failed with HTTP status %s", res.status_code)
                    return None
        except Exception as e:
            logger.warning("OpenAI extraction error: %s", type(e).__name__)
            return None


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash", timeout: int = 15):
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    async def extract_claims(self, text: str) -> Optional[List[Dict[str, Any]]]:
        if not self.api_key:
            return None

        prompt = (
            "Extract only falsifiable, objective factual claims from the following text. "
            "Do not include opinions, predictions, or questions. "
            "Respond in JSON format: "
            '{"claims": [{"original_text": "...", "normalized_claim": "...", "category": "science", "entities": [], "dates": [], "location": null, "verifiable": true, "relevant_context": null}]}'
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [
                            {"role": "user", "parts": [{"text": f"{prompt}\n\nText:\n{text}"}]}
                        ],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "temperature": 0.1
                        }
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(content)
                    return parsed.get("claims", [])
                else:
                    logger.warning("Gemini extraction failed with HTTP status %s", res.status_code)
                    return None
        except Exception as e:
            logger.warning("Gemini extraction error: %s", type(e).__name__)
            return None


def get_llm_provider() -> Optional[BaseLLMProvider]:
    provider = settings.llm_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        return OpenAIProvider(settings.openai_api_key, model=settings.llm_model, timeout=settings.llm_timeout_seconds)

    if provider == "gemini" and settings.gemini_api_key:
        return GeminiProvider(settings.gemini_api_key, model=settings.llm_model, timeout=settings.llm_timeout_seconds)

    return None

