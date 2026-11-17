import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "TruthLens AI Verification Service"
    tagline: str = "Don't Just Believe It. Verify It."
    version: str = "1.0.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    internal_service_secret: str = os.getenv(
        "INTERNAL_SERVICE_SECRET", "internal_truthlens_ai_microservice_secret_2026"
    )

    # LLM Settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "rule_based")  # 'rule_based', 'gemini', 'openai', 'anthropic'
    llm_model: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    llm_timeout_seconds: int = int(os.getenv("LLM_TIMEOUT_SECONDS", "15"))

    # Search & Evidence APIs
    google_fact_check_api_key: str = os.getenv("GOOGLE_FACT_CHECK_API_KEY", "")
    search_api_key: str = os.getenv("SEARCH_API_KEY", "")

    # Processing Constraints
    max_input_length: int = int(os.getenv("MAX_INPUT_LENGTH", "100000"))
    max_claims_to_extract: int = int(os.getenv("MAX_CLAIMS_TO_EXTRACT", "50"))

    # Allowed categories
    allowed_categories: List[str] = [
        "politics",
        "government",
        "health",
        "science",
        "technology",
        "business",
        "finance",
        "education",
        "environment",
        "general news"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
