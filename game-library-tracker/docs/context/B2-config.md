# B2: config — 설정/환경변수 컨텍스트

## 모듈 책임
`.env` 파일에서 환경변수를 읽어 앱 전체 설정 제공. B3-storage와 B4-ocr만 참조.

## 파일
```
game-library-tracker/backend/config.py
game-library-tracker/backend/.env.example
```

## 현재 코드

```python
# game-library-tracker/backend/config.py
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
```

```ini
# game-library-tracker/backend/.env.example
STORAGE_TYPE=excel
EXCEL_FILE_PATH=~/game_library.xlsx
GOOGLE_SHEET_ID=
GOOGLE_CREDENTIALS_PATH=
# Windows 전용: Tesseract 실행 파일 경로 (Linux/Mac은 비워두세요)
# TESSERACT_CMD=C:/Program Files/Tesseract-OCR/tesseract.exe
```

## 공개 인터페이스
```python
from config import settings  # storage/__init__.py, ocr/processor.py에서 사용
# settings.storage_type
# settings.excel_file_path
# settings.google_sheet_id
# settings.google_credentials_path
# settings.tesseract_cmd
```

## 이 모듈의 의존성
없음. `pydantic_settings`만 사용.

## 수정 규칙

### 새 환경변수 추가
수정 대상: **이 파일만** (+ .env.example에 항목 추가)
```python
# Settings 클래스에 필드 추가 (기본값 필수)
new_setting: str = "default_value"
```

## 격리 보장
- storage, services, routers import 금지
- 런타임에 settings 객체 수정 금지 (읽기 전용)
- 저장소 전환은 B6-deps의 reset_storage()가 처리
