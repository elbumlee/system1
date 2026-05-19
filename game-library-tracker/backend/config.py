from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    storage_type: str = "excel"
    excel_file_path: str = "~/game_library.xlsx"
    google_sheet_id: str = ""
    google_credentials_path: str = ""
    tesseract_cmd: str = ""  # Windows: C:/Program Files/Tesseract-OCR/tesseract.exe

    class Config:
        env_file = ".env"


settings = Settings()
