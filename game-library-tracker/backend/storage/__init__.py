from storage.base import AbstractStorage
from storage.excel_storage import ExcelStorage
from storage.sheets_storage import SheetsStorage


def create_storage(storage_type: str = None, **kwargs) -> AbstractStorage:
    from config import settings

    t = storage_type or settings.storage_type
    if t == "sheets":
        return SheetsStorage(
            sheet_id=kwargs.get("sheet_id") or settings.google_sheet_id,
            credentials_path=kwargs.get("credentials_path") or settings.google_credentials_path or None,
        )
    return ExcelStorage(file_path=kwargs.get("file_path") or settings.excel_file_path or None)


__all__ = ["AbstractStorage", "ExcelStorage", "SheetsStorage", "create_storage"]
