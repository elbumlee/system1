from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from deps import get_storage
from models import Game, OCRConfirm, OCRResult
from services.ocr_service import OCRService
from storage.base import AbstractStorage

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

_ocr_service = OCRService()


@router.post("/upload", response_model=OCRResult)
async def upload_image_for_ocr(file: UploadFile = File(...)):
    """Accept an image, run OCR, return candidate game names."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        result = _ocr_service.process_image(image_bytes)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {exc}")

    return result


@router.post("/confirm", response_model=list[Game])
def confirm_ocr_games(
    payload: OCRConfirm,
    storage: AbstractStorage = Depends(get_storage),
):
    """Confirm selected game names from an OCR result and add them to the library."""
    if _ocr_service.get_cached_result(payload.image_id) is None:
        raise HTTPException(
            status_code=404,
            detail="OCR result not found. Please re-upload the image.",
        )

    return _ocr_service.confirm_games(payload, storage)
