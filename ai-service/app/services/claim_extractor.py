import time
import logging
from typing import List

from app.core.config import settings
from app.models.schemas import ClaimItem, ExtractClaimsResponse
from app.utils.text_cleaner import clean_text
from app.utils.language_detector import detect_language
from app.utils.sentence_segmenter import segment_sentences
from app.utils.entity_extractor import extract_entities
from app.utils.temporal_extractor import extract_temporal
from app.utils.claim_classifier import classify_claim, categorize_claim
from app.utils.claim_normalizer import normalize_claim
from app.services.llm_provider import get_llm_provider

logger = logging.getLogger("truthlens.ai.extractor")

class ClaimExtractionEngine:
    @classmethod
    async def extract_claims(cls, raw_text: str, max_claims: int = 30) -> ExtractClaimsResponse:
        start_time = time.time()

        # 1. Validation & Input Sanitization
        if not raw_text or not isinstance(raw_text, str) or not raw_text.strip():
            return ExtractClaimsResponse(
                claims=[],
                total_sentences=0,
                factual_claims_count=0,
                language="en",
                processing_time_ms=0
            )

        # Handle long content cleanly
        if len(raw_text) > settings.max_input_length:
            raw_text = raw_text[:settings.max_input_length]

        # 2. Text Cleaning
        cleaned_text = clean_text(raw_text)

        # 3. Language Detection
        detected_lang, _ = detect_language(cleaned_text)

        # 4. Sentence Segmentation & Deduplication
        sentences = segment_sentences(cleaned_text, remove_duplicates=True)
        total_sentences = len(sentences)

        if total_sentences == 0:
            return ExtractClaimsResponse(
                claims=[],
                total_sentences=0,
                factual_claims_count=0,
                language=detected_lang,
                processing_time_ms=int((time.time() - start_time) * 1000)
            )

        # 5. Configurable LLM Extraction Attempt (if enabled)
        llm = get_llm_provider()
        if llm:
            try:
                llm_results = await llm.extract_claims(cleaned_text)
                if llm_results and isinstance(llm_results, list):
                    claims: List[ClaimItem] = []
                    for item in llm_results[:max_claims]:
                        category = item.get("category", "general news")
                        if category not in settings.allowed_categories:
                            category = "general news"

                        claim_item = ClaimItem(
                            original_text=item.get("original_text", ""),
                            normalized_claim=item.get("normalized_claim", ""),
                            category=category,
                            entities=item.get("entities", []),
                            dates=item.get("dates", []),
                            location=item.get("location"),
                            verifiable=bool(item.get("verifiable", True)),
                            relevant_context=item.get("relevant_context")
                        )
                        if claim_item.normalized_claim:
                            claims.append(claim_item)

                    if claims:
                        elapsed_ms = int((time.time() - start_time) * 1000)
                        return ExtractClaimsResponse(
                            claims=claims,
                            total_sentences=total_sentences,
                            factual_claims_count=len(claims),
                            language=detected_lang,
                            processing_time_ms=elapsed_ms
                        )
            except Exception as e:
                logger.warning("LLM extraction failed, falling back to deterministic NLP engine: %s", type(e).__name__)

        # 6. High-Accuracy Rule-Based NLP Pipeline
        extracted_claims: List[ClaimItem] = []

        for sentence in sentences:
            if len(extracted_claims) >= max_claims:
                break

            # Classify sentence type: Factual vs. Opinion vs. Prediction vs. Question etc.
            sentence_type, is_verifiable = classify_claim(sentence)

            # Do not treat every sentence as a factual claim
            if not is_verifiable or sentence_type != "FACTUAL_CLAIM":
                continue

            # Normalize claim statement
            normalized, context = normalize_claim(sentence)

            # Extract entities and locations
            entities, location = extract_entities(sentence)

            # Extract dates, years, and numerical statistics
            dates, numbers = extract_temporal(sentence)

            # Map to one of the 10 mandated categories
            category = categorize_claim(sentence)

            # Add numerical figures into context or entities if useful
            all_entities = list(entities)
            for num in numbers:
                if num not in all_entities:
                    all_entities.append(num)

            claim_obj = ClaimItem(
                original_text=sentence,
                normalized_claim=normalized,
                category=category,
                entities=all_entities,
                dates=dates,
                location=location,
                verifiable=True,
                relevant_context=context
            )
            extracted_claims.append(claim_obj)

        elapsed_ms = int((time.time() - start_time) * 1000)
        return ExtractClaimsResponse(
            claims=extracted_claims,
            total_sentences=total_sentences,
            factual_claims_count=len(extracted_claims),
            language=detected_lang,
            processing_time_ms=elapsed_ms
        )

extract_claims_from_text = ClaimExtractionEngine.extract_claims
