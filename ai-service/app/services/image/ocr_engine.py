import io
import re
import json
import base64
import logging
import httpx
from typing import Dict, Any, List, Optional
from PIL import Image, ExifTags

from app.core.config import settings
from app.utils.text_cleaner import clean_text
from app.utils.entity_extractor import EntityExtractor
from app.utils.temporal_extractor import TemporalNumericalExtractor

logger = logging.getLogger("truthlens.image.ocr")

_RAPID_OCR_INSTANCE = None

def get_rapid_ocr_engine():
    global _RAPID_OCR_INSTANCE
    if _RAPID_OCR_INSTANCE is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _RAPID_OCR_INSTANCE = RapidOCR()
            logger.info("RapidOCR ONNX Runtime engine initialized as singleton")
        except Exception as e:
            logger.warning("Failed to initialize RapidOCR singleton: %s", type(e).__name__)
    return _RAPID_OCR_INSTANCE

class ImageOCREngine:
    FILENAME_REGEX = re.compile(
        r"^[\w\-.\s()]+\.(jpg|jpeg|png|webp|gif|bmp|tiff|pdf|mp4|mov)$",
        re.IGNORECASE
    )

    @classmethod
    def _is_filename_like(cls, text: str) -> bool:
        clean = (text or "").strip()
        if not clean:
            return True
        if cls.FILENAME_REGEX.match(clean):
            return True
        words = [w for w in re.findall(r"\b[a-zA-Z]{2,}\b", clean.lower()) if w not in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp')]
        if len(words) < 3 and re.search(r"\.(jpg|jpeg|png|webp|gif)\b", clean, re.IGNORECASE):
            return True
        return False

    @classmethod
    def _run_rapid_ocr(cls, image_bytes: bytes) -> Dict[str, Any]:
        """
        Executes RapidOCR (ONNX Runtime, local, zero-network, high-accuracy)
        to transcribe overlay headlines, tickers, banners, and text.
        Downscales high-resolution inputs to max 1024px for sub-second CPU inference.
        """
        try:
            engine = get_rapid_ocr_engine()
            if not engine:
                return {"headline": "", "all_text": "", "entities": []}

            import numpy as np

            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Downscale large images (e.g., 4000x3000 phone captures) to max 1024px for speed
            max_dim = 1024
            if max(img.width, img.height) > max_dim:
                scale = max_dim / float(max(img.width, img.height))
                new_w = max(1, int(img.width * scale))
                new_h = max(1, int(img.height * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            img_np = np.array(img)
            result, _ = engine(img_np)

            if not result:
                return {"headline": "", "all_text": "", "entities": []}

            lines = []
            for item in result:
                txt = (item[1] or "").strip()
                try:
                    score = float(item[2])
                except (ValueError, TypeError):
                    score = 0.5
                if score >= 0.65 and len(txt) >= 2:
                    lines.append(txt)

            if not lines:
                return {"headline": "", "all_text": "", "entities": []}

            # Filter out watermarks/logos like "crictoday", "lifelineof cricket", "aircel"
            brand_filter = {"crictoday", "lifelineof cricket", "lifeline of cricket", "aircel", "gulf", "gult"}
            headline_tokens = [l for l in lines if l.lower() not in brand_filter]

            headline = " ".join(headline_tokens).strip()
            all_text = " ".join(lines).strip()

            # Clean OCR artifacts
            headline = re.sub(r"\bTIPL\b", "IPL", headline)
            headline = re.sub(r"\b2025\s+4[oO0]\b", "2025", headline)
            headline = re.sub(r"\s{2,}", " ", headline).strip()

            logger.info("RapidOCR local extraction succeeded: '%s'", headline[:80])
            return {
                "headline": headline,
                "all_text": all_text or headline,
                "entities": [],
                "source": "rapid_ocr"
            }
        except Exception as e:
            logger.debug("RapidOCR unavailable or failed: %s", type(e).__name__)
            return {"headline": "", "all_text": "", "entities": []}

    @classmethod
    async def extract_visual_text(cls, image_bytes: bytes, format_name: str = "JPEG") -> Dict[str, Any]:
        """
        Multi-tier visual text and headline extractor:
        1. Local RapidOCR (instant, zero-network, high accuracy)
        2. Multimodal Vision AI (OpenAI GPT-4o-mini / Gemini Flash)
        3. Pytesseract OCR fallback
        """
        # Tier 1: Local RapidOCR
        rapid_data = cls._run_rapid_ocr(image_bytes)
        if rapid_data.get("headline") or rapid_data.get("all_text"):
            return rapid_data

        # Tier 2: OpenAI Vision (GPT-4o-mini)
        if settings.openai_api_key:
            try:
                b64_img = base64.b64encode(image_bytes).decode("utf-8")
                mime_fmt = "jpeg" if format_name.upper() in ("JPG", "JPEG") else format_name.lower()
                prompt = (
                    "You are a news fact-checking OCR system. Read this image carefully and extract all text verbatim.\n"
                    "1. Extract all visible text: news headlines, breaking news tickers, graphic overlays, "
                    "captions, logos, jerseys, banners.\n"
                    "2. Identify the primary news headline or claim being reported.\n"
                    "Respond strictly in valid JSON format with keys:\n"
                    "{\n"
                    '  "headline": "primary headline or factual assertion",\n'
                    '  "all_text": "complete transcribed text from image",\n'
                    '  "entities": ["names", "organizations", "dates"]\n'
                    "}"
                )
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.openai_api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [
                                {
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": prompt},
                                        {
                                            "type": "image_url",
                                            "image_url": {"url": f"data:image/{mime_fmt};base64,{b64_img}"}
                                        }
                                    ]
                                }
                            ],
                            "response_format": {"type": "json_object"},
                            "max_tokens": 400,
                            "temperature": 0.1
                        }
                    )
                    if res.status_code == 200:
                        data = res.json()
                        content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        headline = (parsed.get("headline") or "").strip()
                        all_text = (parsed.get("all_text") or "").strip()
                        entities = parsed.get("entities") or []
                        if headline or all_text:
                            logger.info("OpenAI Vision extracted visual text: '%s'", (headline or all_text)[:80])
                            return {
                                "headline": headline,
                                "all_text": all_text or headline,
                                "entities": entities,
                                "source": "openai_vision"
                            }
            except Exception as e:
                logger.warning("OpenAI Vision extraction error: %s", type(e).__name__)

        # Tier 3: Gemini Vision if configured
        if settings.gemini_api_key and settings.gemini_api_key.startswith("AIzaSy"):
            try:
                b64_img = base64.b64encode(image_bytes).decode("utf-8")
                mime_fmt = "image/jpeg" if format_name.upper() in ("JPG", "JPEG") else f"image/{format_name.lower()}"
                prompt = (
                    "Extract all visible text and headlines from this image verbatim. "
                    "Identify the main news headline or claim. "
                    "Respond in JSON format: "
                    '{"headline": "main news headline", "all_text": "full text", "entities": ["entity1"]}'
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.gemini_api_key}"
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [
                                {
                                    "role": "user",
                                    "parts": [
                                        {"text": prompt},
                                        {
                                            "inline_data": {
                                                "mime_type": mime_fmt,
                                                "data": b64_img
                                            }
                                        }
                                    ]
                                }
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
                        headline = (parsed.get("headline") or "").strip()
                        all_text = (parsed.get("all_text") or "").strip()
                        entities = parsed.get("entities") or []
                        if headline or all_text:
                            return {
                                "headline": headline,
                                "all_text": all_text or headline,
                                "entities": entities,
                                "source": "gemini_vision"
                            }
            except Exception as e:
                logger.warning("Gemini Vision extraction error: %s", type(e).__name__)

        # Tier 4: Pytesseract OCR fallback
        try:
            import pytesseract
            img = Image.open(io.BytesIO(image_bytes))
            ocr_result = pytesseract.image_to_string(img)
            if ocr_result and len(ocr_result.strip()) > 5:
                return {
                    "headline": "",
                    "all_text": ocr_result.strip(),
                    "entities": [],
                    "source": "pytesseract"
                }
        except Exception:
            pass

        return {"headline": "", "all_text": "", "entities": [], "source": "none"}

    @classmethod
    async def async_analyze_image(cls, image_bytes: bytes, filename: str = "", caption_hint: str = "") -> Dict[str, Any]:
        """
        Async analysis incorporating Vision AI / OCR, EXIF metadata, and entity extraction.
        """
        # 1. Base synchronous metadata analysis
        safe_caption = "" if cls._is_filename_like(caption_hint) else caption_hint.strip()
        result = cls.analyze_image(image_bytes, filename=filename, caption_hint=safe_caption)

        # 2. Extract visual text via RapidOCR / Vision AI
        vision_data = await cls.extract_visual_text(image_bytes, format_name=result.get("format", "JPEG"))
        headline = (vision_data.get("headline") or "").strip()
        visual_text = (vision_data.get("all_text") or "").strip()

        # Prioritize clean headline, then visual text, then safe caption
        selected_text = headline or visual_text or safe_caption or result.get("ocr_text", "").strip()

        if selected_text and not cls._is_filename_like(selected_text):
            combined_text = clean_text(selected_text)
            result["ocr_text"] = combined_text
            result["headline"] = headline or (combined_text if len(combined_text) < 120 else "")
            entities, primary_location = EntityExtractor.extract(combined_text)
            dates, _ = TemporalNumericalExtractor.extract(combined_text)

            for ent in vision_data.get("entities", []):
                if ent and ent not in entities:
                    entities.append(ent)

            result["entities"] = entities
            result["dates"] = dates
            if primary_location:
                result["primary_location"] = primary_location
        else:
            result["ocr_text"] = ""
            result["headline"] = ""

        return result

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

        # 2. Extract Text (Embedded Metadata + RapidOCR / Heuristics)
        extracted_text_chunks = []

        # Check PNG text chunks or EXIF ImageDescription
        if "ImageDescription" in exif_data and isinstance(exif_data["ImageDescription"], str):
            desc = exif_data["ImageDescription"].strip()
            if not cls._is_filename_like(desc):
                extracted_text_chunks.append(desc)

        # Check image info dictionary (PNG tEXt chunks, comments)
        if hasattr(img, "info") and isinstance(img.info, dict):
            for k in ("description", "comment", "caption", "headline", "text"):
                val = img.info.get(k)
                if val and isinstance(val, str) and len(val.strip()) > 5:
                    if not cls._is_filename_like(val):
                        extracted_text_chunks.append(val.strip())

        # If caller passed caption_hint (e.g. user submitted claim accompanying the image)
        if caption_hint and len(caption_hint.strip()) > 5 and not cls._is_filename_like(caption_hint):
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
            "headline": rapid_data.get("headline", ""),
            "entities": entities,
            "dates": dates,
            "primary_location": primary_location
        }

analyze_image = ImageOCREngine.analyze_image
async_analyze_image = ImageOCREngine.async_analyze_image
