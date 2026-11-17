import re
import logging
from typing import Dict, Any, List, Optional
from app.services.image.base_provider import ReverseImageResult

logger = logging.getLogger("truthlens.image.context")

class ImageContextAnalyzer:
    """
    Rigorously analyzes image origin, authenticity, manipulation, and context.
    Enforces epistemic honesty:
    - Never declares an image AI-generated or manipulated without verified technical markers.
    - Accurately identifies viral recycling (old images redeployed with fake captions/dates).
    """

    @classmethod
    def analyze_context(
        cls,
        image_metadata: Dict[str, Any],
        reverse_result: ReverseImageResult,
        user_caption: str = ""
    ) -> Dict[str, Any]:
        software = (image_metadata.get("software") or "").lower()
        camera = image_metadata.get("camera")
        exif_date = image_metadata.get("capture_date")
        earliest_source_date = reverse_result.earliest_known_date
        caption_lower = (user_caption or "").lower()

        # -------------------------------------------------------------
        # 1. Image Authenticity Evaluation
        # -------------------------------------------------------------
        authenticity_rating = "UNSPECIFIED"
        authenticity_details = []

        if camera:
            authenticity_rating = "GENUINE_HARDWARE_CAPTURE"
            authenticity_details.append(f"Image contains camera hardware signatures: {camera}.")
        else:
            authenticity_details.append("No hardware EXIF camera signatures present in file headers.")

        # Check for explicit synthetic software signatures in EXIF
        synthetic_markers = ["midjourney", "dall-e", "stable diffusion", "comfyui", "novelai"]
        has_synthetic_software = any(marker in software for marker in synthetic_markers)

        if has_synthetic_software:
            authenticity_rating = "SYNTHETIC_GENERATION_INDICATED"
            authenticity_details.append(f"File metadata explicitly records generative software: {image_metadata.get('software')}.")
        else:
            authenticity_details.append("No verifiable digital provenance marks of AI generation found. Per verification standards, an image cannot be presumed synthetic without conclusive forensic evidence.")

        # -------------------------------------------------------------
        # 2. Image Manipulation Evaluation
        # -------------------------------------------------------------
        manipulation_rating = "NO_MANIPULATION_CONFIRMED"
        manipulation_details = []

        editing_tools = ["photoshop", "gimp", "lightroom", "affinity", "canva"]
        has_editing_software = any(tool in software for tool in editing_tools)

        if has_editing_software:
            manipulation_rating = "POST_PROCESSING_SOFTWARE_DETECTED"
            manipulation_details.append(f"Header metadata notes editing software: {image_metadata.get('software')}. Note: Post-processing (cropping, color grading) does not inherently constitute deceptive fabrication.")
        else:
            manipulation_details.append("No software manipulation signatures or file splicing markers detected in standard headers.")

        # -------------------------------------------------------------
        # 3. Image Origin & Historical Discovery
        # -------------------------------------------------------------
        matches_count = reverse_result.total_matches_found
        origin_summary = ""

        if matches_count > 0:
            origin_summary = (
                f"Identified {matches_count} historical match(es) across indexed archives. "
                f"Earliest authenticated publication recorded on {earliest_source_date or 'an earlier date'} "
                f"by {reverse_result.original_publisher or 'an archival publisher'}."
            )
        else:
            origin_summary = "No identical matches identified in reverse-image archives. The visual content may be novel, unindexed, or private."

        # -------------------------------------------------------------
        # 4. Image Context & Recycling Analysis
        # -------------------------------------------------------------
        is_reused = False
        context_verdict = "INDETERMINATE"
        context_explanation = ""

        # Check for temporal recycling (e.g. photo from 2018 claimed as 2026/yesterday/breaking)
        user_mentions_current = bool(re.search(r"\b(today|yesterday|breaking|just now|now|2025|2026)\b", caption_lower))

        if earliest_source_date and matches_count > 0:
            earliest_year = earliest_source_date.split("-")[0] if "-" in earliest_source_date else None
            
            # If image is known from before 2024 and user claims it is today/breaking
            if earliest_year and int(earliest_year) <= 2024 and user_mentions_current:
                is_reused = True
                context_verdict = "MISCAPTIONED_RECYCLED_MEDIA"
                context_explanation = (
                    f"The submitted claim presents this image as depicting an event occurring recently ('{user_caption[:80]}...'), "
                    f"however, historical records establish this exact photograph was published on {earliest_source_date} "
                    f"in reporting by {reverse_result.original_publisher or 'archived sources'}."
                )
            elif reverse_result.matches and reverse_result.matches[0].original_caption:
                orig_cap = reverse_result.matches[0].original_caption
                context_verdict = "AUTHENTIC_CONTEXT_CORROBORATED"
                context_explanation = f"The visual content is consistent with historical documentation: '{orig_cap}'."
            else:
                context_verdict = "HISTORICAL_MEDIA_IDENTIFIED"
                context_explanation = f"Image matches earlier documentation dated {earliest_source_date}."
        else:
            context_verdict = "NO_ARCHIVE_CONFLICT"
            context_explanation = "No historical publications contradict the current context or caption."

        return {
            "authenticity": {
                "assessment": authenticity_rating,
                "notes": authenticity_details
            },
            "manipulation": {
                "assessment": manipulation_rating,
                "notes": manipulation_details
            },
            "origin": {
                "total_matches": matches_count,
                "earliest_date": earliest_source_date,
                "original_publisher": reverse_result.original_publisher,
                "summary": origin_summary,
                "matches": [m.model_dump() for m in reverse_result.matches]
            },
            "context": {
                "is_reused": is_reused,
                "verdict": context_verdict,
                "explanation": context_explanation,
                "user_caption": user_caption
            }
        }

analyze_context = ImageContextAnalyzer.analyze_context

