from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from deps import get_storage
from services.export_service import generate_excel
from storage.base import AbstractStorage

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/excel")
def export_excel(storage: AbstractStorage = Depends(get_storage)):
    """Download the current game library as an Excel file."""
    games = storage.get_all_games()
    buffer = generate_excel(games)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=game_library.xlsx"},
    )
