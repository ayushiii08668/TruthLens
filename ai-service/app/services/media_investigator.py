import asyncio
import logging
from typing import Optional, List, Dict, Any

from app.models.media_schemas import (
    URLInvestigateResponse,
    ArticleInvestigateResponse,
    ImageInvestigateResponse,
    ImageContextDetail
)
from app.services.evidence.page_fetcher import PageFetcher
from app.services.claim_extractor import extract_claims_from_text
from app.services.evidence.discovery_engine import search_evidence
from app.services.verification.engine import evaluate_claim
from app.services.image.ocr_engine import ImageOCREngine
from app.services.image.mock_reverse_provider import MockReverseImageProvider
from app.services.image.context_analyzer import ImageContextAnalyzer

logger = logging.getLogger("truthlens.media.investigator")

class MediaInvestigator:
    reverse_provider = MockReverseImageProvider()

    @classmethod
    async def investigate_url(cls, url: str, max_claims: int = 5) -> URLInvestigateResponse:
        """
        Safely inspects a public article URL, extracts text & metadata,
        extracts discrete claims, and verifies them independently.
        """
        article = await PageFetcher.fetch_article(url)

        if not article["text"]:
            return URLInvestigateResponse(
                url=url,
                canonical_url=article.get("canonical_url", url),
                page_title=article.get("title", ""),
                publisher=article.get("publisher", ""),
                publication_date=article.get("publication_date"),
                article_summary=f"Unable to retrieve full article text for verification ({article.get('status', 'inaccessible')}).",
                claims_verified=[],
                document_status=article.get("status", "inaccessible"),
                limitations=article.get("limitations", ["Article content could not be retrieved safely."])
            )

        # Extract claims from article text
        extracted = await extract_claims_from_text(article["text"], max_claims=max_claims)
        
        async def verify_single_claim(claim_item):
            try:
                evidence_res = await asyncio.wait_for(
                    search_evidence(
                        claim=claim_item.normalized_claim,
                        max_results=3,
                        include_full_text=False
                    ),
                    timeout=4.0
                )
                evidence_list = evidence_res.evidence
            except Exception as e:
                logger.warning("Claim search timed out or failed: %s", type(e).__name__)
                evidence_list = []

            return await evaluate_claim(
                claim=claim_item.normalized_claim,
                evidence=evidence_list,
                is_opinion_or_prediction=not claim_item.verifiable,
                statement_type="FACTUAL_CLAIM" if claim_item.verifiable else "OPINION"
            )

        verified_claims = list(await asyncio.gather(*[verify_single_claim(c) for c in extracted.claims[:4]]))

        # Synthesize Article Summary
        verdicts = [v.verdict for v in verified_claims]
        supported_count = sum(1 for v in verdicts if v in ("SUPPORTED", "MOSTLY SUPPORTED"))
        false_count = sum(1 for v in verdicts if v in ("FALSE", "MOSTLY FALSE"))
        misleading_count = sum(1 for v in verdicts if v == "MISLEADING")
        unverified_count = sum(1 for v in verdicts if v == "UNVERIFIED")

        summary_parts = [
            f"Article from {article['publisher'] or 'web source'} titled '{article['title']}' was audited across {len(verified_claims)} distinct claim(s)."
        ]
        if supported_count:
            summary_parts.append(f"{supported_count} assertion(s) corroborated by primary evidence.")
        if misleading_count:
            summary_parts.append(f"{misleading_count} assertion(s) found to omit key contextual information.")
        if false_count:
            summary_parts.append(f"{false_count} assertion(s) directly contradicted by reliable sources.")
        if unverified_count:
            summary_parts.append(f"{unverified_count} assertion(s) lacked sufficient public evidence to confirm.")

        article_summary = " ".join(summary_parts)

        return URLInvestigateResponse(
            url=url,
            canonical_url=article["canonical_url"],
            page_title=article["title"],
            publisher=article["publisher"],
            publication_date=article["publication_date"],
            article_summary=article_summary,
            claims_verified=verified_claims,
            document_status=article["status"],
            limitations=article["limitations"]
        )

    @classmethod
    async def investigate_article(
        cls,
        text: str,
        title: Optional[str] = None,
        max_claims: int = 8
    ) -> ArticleInvestigateResponse:
        """
        Investigates a long-form article pasted directly by user.
        Evaluates claims separately and highlights missing context without giving a blanket verdict.
        """
        extracted = await extract_claims_from_text(text, max_claims=max_claims)

        async def verify_single_claim(claim_item):
            try:
                evidence_res = await asyncio.wait_for(
                    search_evidence(
                        claim=claim_item.normalized_claim,
                        max_results=3,
                        include_full_text=False
                    ),
                    timeout=4.0
                )
                evidence_list = evidence_res.evidence
            except Exception as e:
                logger.warning("Article claim search timed out or failed: %s", type(e).__name__)
                evidence_list = []

            return await evaluate_claim(
                claim=claim_item.normalized_claim,
                evidence=evidence_list,
                is_opinion_or_prediction=not claim_item.verifiable,
                statement_type="FACTUAL_CLAIM" if claim_item.verifiable else "OPINION"
            )

        verified_claims = list(await asyncio.gather(*[verify_single_claim(c) for c in extracted.claims[:4]]))

        # Identify missing context across claims
        missing_context = []
        for v in verified_claims:
            if v.verdict == "MISLEADING":
                missing_context.append(f"Assertion '{v.claim[:60]}...': Omitted critical temporal or qualification context.")
            elif v.verdict == "UNVERIFIED":
                missing_context.append(f"Assertion '{v.claim[:60]}...': Lacks corroborating documentation in public archives.")

        verdicts = [v.verdict for v in verified_claims]
        summary = (
            f"Long-form document audit evaluated {len(verified_claims)} factual assertions independently. "
            f"Breakdown: {verdicts.count('SUPPORTED')} Supported, "
            f"{verdicts.count('MOSTLY SUPPORTED')} Mostly Supported, "
            f"{verdicts.count('MISLEADING')} Misleading, "
            f"{verdicts.count('FALSE') + verdicts.count('MOSTLY FALSE')} False/Mostly False, "
            f"{verdicts.count('UNVERIFIED')} Unverified. "
            f"Claims are assessed independently as individual assertions differ in evidentiary support."
        )

        return ArticleInvestigateResponse(
            title=title or "Pasted Long-Form Article",
            total_claims_identified=len(verified_claims),
            article_summary=summary,
            claims_verified=verified_claims,
            missing_context=missing_context,
            limitations=[] if verified_claims else ["No distinct verifiable factual propositions could be extracted from input."]
        )

    @classmethod
    async def investigate_image(
        cls,
        image_bytes: bytes,
        filename: str = "",
        caption: str = ""
    ) -> ImageInvestigateResponse:
        """
        Investigates an uploaded image for text OCR, EXIF metadata,
        reverse-image discovery, and contextual integrity (recycling/miscaptioning).
        """
        clean_caption = ""
        if caption and not ImageOCREngine._is_filename_like(caption):
            clean_caption = caption.strip()

        # 1. OCR and image metadata using multimodal Vision AI & EXIF
        image_data = await ImageOCREngine.async_analyze_image(
            image_bytes,
            filename=filename,
            caption_hint=clean_caption
        )

        headline = (image_data.get("headline") or "").strip()
        ocr_text = (image_data.get("ocr_text") or "").strip()

        # 2. Reverse Image Search Discovery
        # Guide archive discovery using headline, caption, or OCR text
        query_parts = []
        if headline:
            query_parts.append(headline)
        elif clean_caption:
            query_parts.append(clean_caption)
        elif ocr_text:
            query_parts.append(ocr_text[:120])
        else:
            query_parts.append(filename)
        query_hint = " ".join(query_parts).strip()
        reverse_result = await cls.reverse_provider.search(image_bytes, image_hash=query_hint)

        # 3. Contextual Evaluation (Authenticity, Manipulation, Origin, Recycling)
        context_eval = ImageContextAnalyzer.analyze_context(
            image_metadata=image_data,
            reverse_result=reverse_result,
            user_caption=clean_caption
        )

        # 4. Verify extracted claims from image / caption
        text_to_extract = (headline or clean_caption or ocr_text).strip()
        claims_to_verify = []
        limitations = []

        if text_to_extract and not ImageOCREngine._is_filename_like(text_to_extract):
            extracted = await extract_claims_from_text(text_to_extract, max_claims=4)
            claims_to_verify = extracted.claims

            # If rule-based segmentation filtered out short headline format, construct claim directly
            if not claims_to_verify and len(text_to_extract.split()) >= 3:
                from app.utils.claim_normalizer import normalize_claim
                from app.models.schemas import ClaimItem
                norm_claim, ctx = normalize_claim(text_to_extract)
                claims_to_verify = [ClaimItem(
                    original_text=text_to_extract,
                    normalized_claim=norm_claim,
                    category="sports" if any(w in text_to_extract.lower() for w in ("ipl", "csk", "dhoni", "cricket", "wickets", "siraj", "ashwin", "match")) else "general news",
                    entities=image_data.get("entities", []),
                    dates=image_data.get("dates", []),
                    verifiable=True,
                    relevant_context=ctx
                )]

        if not claims_to_verify:
            if not text_to_extract or ImageOCREngine._is_filename_like(text_to_extract):
                limitations.append(
                    "No textual news headlines or factual claims could be extracted from this image. "
                    "Please provide a headline or claim caption alongside the image to verify."
                )

        verified_claims = []

        for claim_item in claims_to_verify[:1]:
            try:
                evidence_res = await asyncio.wait_for(
                    search_evidence(
                        claim=claim_item.normalized_claim,
                        max_results=3,
                        include_full_text=False
                    ),
                    timeout=4.0
                )
                evidence_list = evidence_res.evidence
            except Exception as e:
                logger.warning("Image claim search timed out or failed: %s", type(e).__name__)
                evidence_list = []

            verified = await evaluate_claim(
                claim=claim_item.normalized_claim,
                evidence=evidence_list,
                is_opinion_or_prediction=not claim_item.verifiable,
                statement_type="FACTUAL_CLAIM" if claim_item.verifiable else "OPINION"
            )
            verified_claims.append(verified)

        return ImageInvestigateResponse(
            filename=filename or "uploaded_media.jpg",
            format=image_data["format"],
            dimensions=image_data["dimensions"],
            file_size_bytes=image_data["file_size"],
            camera=image_data["camera"],
            software=image_data["software"],
            capture_date=image_data["capture_date"],
            ocr_text=image_data["ocr_text"],
            detected_entities=image_data["entities"],
            detected_dates=image_data["dates"],
            primary_location=image_data["primary_location"],
            authenticity=context_eval["authenticity"],
            manipulation=context_eval["manipulation"],
            origin=context_eval["origin"],
            context=ImageContextDetail(**context_eval["context"]),
            claims_verified=verified_claims,
            limitations=limitations
        )

investigate_url = MediaInvestigator.investigate_url
investigate_article = MediaInvestigator.investigate_article
investigate_image = MediaInvestigator.investigate_image
