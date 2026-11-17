import io
import re
import logging
from typing import Dict, Any, List, Optional
from PIL import Image, ExifTags

from app.utils.text_cleaner import clean_text
from app.utils.entity_extractor import EntityExtractor
from app.utils.temporal_extractor import TemporalNumericalExtractor

logger = logging.getLogger("truthlens.image.ocr")

class ImageOCREngine:
    @classmethod
    def analyze_image(cls, image_bytes: bytes, filename: str = "", caption_hint: str = "") -> Dict[str, Any]:
        """
        Safely validates an uploaded image binary, parses EXIF metadata,
        extracts embedded and visual textual content, and identifies entities/dates.
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()  # Verifies file integrity
            
            # Reopen after verify because verify closes/invalidates the stream
            img = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise ValueError(f"Corrupted or invalid image format: {type(e).__name__} - {str(e)}")

        format_name = img.format or "UNKNOWN"
        width, height = img.size
        mode = img.mode

        # 1. Extract EXIF metadata
        exif_data = {}
        capture_date = None
        camera_info = None
        software_info = None

        try:
            raw_exif = img.getexif()
            if raw_exif:
                for tag_id, value in raw_exif.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Avoid binary blobs in json output
                    if isinstance(value, (str, int, float)):
                        exif_data[tag_name] = value

                capture_date = exif_data.get("DateTimeOriginal") or exif_data.get("DateTime")
                make = exif_data.get("Make", "")
                model = exif_data.get("Model", "")
                if make or model:
                    camera_info = f"{make} {model}".strip()
                software_info = exif_data.get("Software")
        except Exception as e:
            logger.debug("EXIF extraction skipped: %s", type(e).__name__)

        # 2. Extract Text (Embedded Metadata + OCR / Heuristics)
        extracted_text_chunks = []

        # Check PNG text chunks or EXIF ImageDescription
        if "ImageDescription" in exif_data and isinstance(exif_data["ImageDescription"], str):
            extracted_text_chunks.append(exif_data["ImageDescription"])

        # Check image info dictionary (PNG tEXt chunks, comments)
        if hasattr(img, "info") and isinstance(img.info, dict):
            for k in ("description", "comment", "caption", "headline", "text"):
                val = img.info.get(k)
                if val and isinstance(val, str) and len(val.strip()) > 5:
                    extracted_text_chunks.append(val.strip())

        # If pytesseract is installed on host, execute OCR
        try:
            import pytesseract
            ocr_result = pytesseract.image_to_string(img)
            if ocr_result and len(ocr_result.strip()) > 5:
                extracted_text_chunks.append(ocr_result.strip())
        except Exception:
            # Pytesseract not installed or tesseract binary unavailable on host
            pass

        # If caller passed caption_hint (e.g. user submitted claim accompanying the image)
        if caption_hint and len(caption_hint.strip()) > 5:
            extracted_text_chunks.append(caption_hint.strip())

        combined_text = clean_text(" ".join(extracted_text_chunks))

        # 3. Extract dates, names/entities, locations
        entities, primary_location = EntityExtractor.extract(combined_text)
        dates, numbers = TemporalNumericalExtractor.extract(combined_text)

        return {
            "format": format_name,
            "dimensions": f"{width}x{height}",
            "width": width,
            "height": height,
            "color_mode": mode,
            "file_size": len(image_bytes),
            "camera": camera_info,
            "software": software_info,
            "capture_date": capture_date,
            "ocr_text": combined_text,
            "entities": entities,
            "dates": dates,
            "primary_location": primary_location
        }

analyze_image = ImageOCREngine.analyze_image
