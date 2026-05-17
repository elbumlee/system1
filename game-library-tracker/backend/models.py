from pydantic import BaseModel
from typing import List, Optional


class Game(BaseModel):
    id: str  # UUID
    name: str
    steam: bool = False
    epic: bool = False
    switch: bool = False
    added_date: str  # ISO date string
    notes: str = ""


class GameCreate(BaseModel):
    name: str
    steam: bool = False
    epic: bool = False
    switch: bool = False
    notes: str = ""


class GameUpdate(BaseModel):
    name: Optional[str] = None
    steam: Optional[bool] = None
    epic: Optional[bool] = None
    switch: Optional[bool] = None
    notes: Optional[str] = None


class OCRResult(BaseModel):
    image_id: str
    candidates: List[str]  # extracted game name candidates
    platform_hint: str  # "steam", "epic", "switch", "unknown"


class OCRConfirm(BaseModel):
    image_id: str
    selected_names: List[str]
    platform: Optional[str] = None  # "steam", "epic", "switch"


class StorageConfig(BaseModel):
    storage_type: str  # "excel" or "sheets"
    excel_file_path: Optional[str] = None
    google_sheet_id: Optional[str] = None
    google_credentials_path: Optional[str] = None


class StorageType(BaseModel):
    storage_type: str
    excel_file_path: Optional[str] = None
    google_sheet_id: Optional[str] = None
