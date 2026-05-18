from fastapi import APIRouter, Depends, HTTPException

import deps
from config import settings
from models import StorageConfig, StorageType
from storage import create_storage

router = APIRouter(prefix="/api/storage", tags=["storage"])


@router.get("/type", response_model=StorageType)
def get_storage_type():
    """Return the current storage backend and its configuration."""
    current = deps.get_storage()
    storage_type = settings.storage_type

    # Detect actual type from the singleton in case it was switched at runtime
    from storage.excel_storage import ExcelStorage
    from storage.sheets_storage import SheetsStorage

    if isinstance(current, SheetsStorage):
        storage_type = "sheets"
        return StorageType(
            storage_type=storage_type,
            google_sheet_id=current.sheet_id,
        )
    elif isinstance(current, ExcelStorage):
        storage_type = "excel"
        return StorageType(
            storage_type=storage_type,
            excel_file_path=current.get_file_path(),
        )

    return StorageType(storage_type=storage_type)


@router.post("/switch")
def switch_storage(config: StorageConfig):
    """Switch the storage backend (excel <-> sheets)."""
    try:
        new_storage = create_storage(
            storage_type=config.storage_type,
            file_path=config.excel_file_path,
            sheet_id=config.google_sheet_id,
            credentials_path=config.google_credentials_path,
        )
        # Eagerly test the connection
        new_storage.get_all_games()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    deps.reset_storage(new_storage)
    return {"status": "ok", "storage_type": config.storage_type}
