import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional

from app.models.media_schemas import (
    URLInvestigateRequest,
    URLInvestigateResponse,
    ArticleInvestigateRequest,
    ArticleInvestigateResponse,
    ImageInvestigateResponse
)
from app.core.security import SSRFProtection, sanitize_filename
from app.services.media_investigator import (
    investigate_url,
    investigate_article,
    investigate_image
)

logger = logging.getLogger("truthlens.media.api")
router = APIRouter(prefix="/media", tags=["Advanced Media Investigation"])

@router.post(
    "/url-investigate",
    response_model=URLInvestigateResponse,
    summary="Investigate public article URL with SSRF defense",
    description="Fetches public article safely, parses metadata, extracts multiple factual claims, and verifies each independently."
)
async def investigate_url_endpoint(request: URLInvestigateRequest):
    try:
        response = await investigate_url(request.url, max_claims=request.max_claims or 5)
        return response
    except Exception as e:
        logger.error("URL investigation error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to investigate URL: {type(e).__name__}"
        )

@router.post(
    "/article-investigate",
    response_model=ArticleInvestigateResponse,
    summary="Investigate long-form pasted article",
    description="Segments long articles, extracts multiple factual propositions, and provides independent claim verdicts without blanket collapsing."
)
async def investigate_article_endpoint(request: ArticleInvestigateRequest):
    try:
        response = await investigate_article(
            text=request.text,
            title=request.title,
            max_claims=request.max_claims or 8
        )
        return response
    except Exception as e:
        logger.error("Article investigation error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to investigate article: {type(e).__name__}"
        )

@router.post(
    "/image-investigate",
    response_model=ImageInvestigateResponse,
    summary="Investigate uploaded image (OCR, EXIF, reverse image search, recycling detection)",
    description="Accepts JPG, JPEG, PNG, or WebP up to 10MB. Validates integrity, extracts OCR text, inspects origin matches, and distinguishes authenticity from manipulation."
)
async def investigate_image_endpoint(
    file: UploadFile = File(...),
    caption: Optional[str] = Form("")
):
    # 1. Validate file extension and MIME type
    clean_name = sanitize_filename(file.filename or "upload.jpg")
    content_type = (file.content_type or "").lower()

    if content_type not in SSRFProtection.ALLOWED_IMAGE_MIMES:
        # Check by extension if mime was generic
        ext = clean_name[clean_name.rfind("."):].lower() if "." in clean_name else ""
        if ext not in SSRFProtection.ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image file format '{content_type or ext}'. Only JPG, PNG, and WebP images are permitted."
            )

    # 2. Read bytes with size limit enforcement (10MB max)
    try:
        image_bytes = await file.read(SSRFProtection.MAX_UPLOAD_BYTES + 1024)
        if len(image_bytes) > SSRFProtection.MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Uploaded image exceeds maximum allowable limit of 10MB."
            )

        response = await investigate_image(
            image_bytes=image_bytes,
            filename=clean_name,
            caption=caption or ""
        )
        return response
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image: {str(ve)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Image investigation error: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete image investigation: {type(e).__name__}"
        )
    finally:
        await file.close()

