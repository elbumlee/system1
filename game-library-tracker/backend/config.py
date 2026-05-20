import sys
import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# PyInstaller frozen 환경에서 exe 옆 .env 파일 로드
if getattr(sys, 'frozen', False):
    _base = os.path.dirname(sys.executable)
    _env_path = os.path.join(_base, '.env')
    if os.path.exists(_env_path):
        load_dotenv(_env_path)
    # exe 옆 폴더 기준 기본 Excel 경로
    _default_excel = os.path.join(_base, 'game_library.xlsx')
else:
    _default_excel = "~/game_library.xlsx"


class Settings(BaseSettings):
    storage_type: str = "excel"
    excel_file_path: str = _default_excel
    google_sheet_id: str = ""
    google_credentials_path: str = ""
    tesseract_cmd: str = ""  # Windows: C:/Program Files/Tesseract-OCR/tesseract.exe

    class Config:
        env_file = ".env"


settings = Settings()
