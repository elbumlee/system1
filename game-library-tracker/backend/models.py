from pydantic import BaseModel
from typing import List, Optional


class Game(BaseModel):
    id: str
    name: str
    steam: bool = False
    epic: bool = False
    switch: bool = False
    added_date: str
    genre: str = ""
    favorite: bool = False
    notes: str = ""


class GameCreate(BaseModel):
    name: str
    steam: bool = False
    epic: bool = False
    switch: bool = False
    genre: str = ""
    favorite: bool = False
    notes: str = ""


class GameUpdate(BaseModel):
    name: Optional[str] = None
    steam: Optional[bool] = None
    epic: Optional[bool] = None
    switch: Optional[bool] = None
    genre: Optional[str] = None
    favorite: Optional[bool] = None
    notes: Optional[str] = None


class OCRCandidate(BaseModel):
    name: str
    confidence: float  # 0-100, tesseract word-level average


class OCRResult(BaseModel):
    image_id: str
    candidates: List[OCRCandidate]
    platform_hint: str  # "steam", "epic", "switch", "unknown"


class OCRConfirm(BaseModel):
    image_id: str
    selected_names: List[str]  # final (possibly user-edited) names
    platform: Optional[str] = None


class StorageConfig(BaseModel):
    storage_type: str
    excel_file_path: Optional[str] = None
    google_sheet_id: Optional[str] = None
    google_credentials_path: Optional[str] = None


class StorageType(BaseModel):
    storage_type: str
    excel_file_path: Optional[str] = None
    google_sheet_id: Optional[str] = None
