# B-2: config — 설정/환경변수

## 책임 범위

- `.env` 파일 및 환경변수를 읽어 앱 전체 설정 제공
- 저장소 타입과 연결 정보 관리
- 이 모듈은 **B-3(storage)와 B-6(deps)만** 참조

## 파일

```
backend/config.py       ← pydantic-settings Settings 클래스
backend/.env.example    ← 설정 템플릿 (커밋 포함)
backend/.env            ← 실제 설정 (커밋 제외, .gitignore)
```

## 현재 구조

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    storage_type: str = "excel"              # "excel" | "google_sheets"
    excel_file_path: str = "games.xlsx"
    google_sheet_id: str = ""
    google_credentials_path: str = ""

    class Config:
        env_file = ".env"

settings = Settings()   # 모듈 수준 싱글톤
```

```ini
# .env.example
STORAGE_TYPE=excel
EXCEL_FILE_PATH=games.xlsx
GOOGLE_SHEET_ID=
GOOGLE_CREDENTIALS_PATH=
```

## 규칙

### 변경 규칙
1. **새 설정 추가**: `Settings` 클래스에 필드 추가 + `.env.example`에 항목 추가.
2. **기본값 필수**: 모든 필드는 기본값을 가져야 한다. 기본값 없는 필드는 앱 시작 실패 원인.
3. **런타임 변경 없음**: `settings` 객체는 읽기 전용으로 사용.
   저장소 전환은 `B-6(deps).reset_storage()`로 처리, config를 직접 수정하지 않는다.

### 금지 사항
- `config.py`에서 B-3, B-4, B-5 등 다른 모듈 import 금지.
- 비밀 키(API key, credentials)를 `.env.example`에 실제 값으로 기재 금지.
- `settings` 객체를 라우터나 서비스에서 직접 import 금지.
  → 반드시 `B-6(deps)`를 통해서만 사용.

## 설정 항목 추가 시나리오

### 새 저장소 백엔드 추가 (예: MongoDB)
```python
mongodb_uri: str = ""
mongodb_db_name: str = "game_library"
```
영향: B-2(config), B-3(storage) 만
