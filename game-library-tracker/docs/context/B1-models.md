# B1: models — 데이터 모델 컨텍스트

## 모듈 책임
백엔드 전체의 데이터 계약. Pydantic 모델 정의. 변경 시 F1-types.md도 함께 수정 필요.

## 파일
```
game-library-tracker/backend/models.py
```

## 현재 코드

```python
# game-library-tracker/backend/models.py
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
    selected_names: List[str]
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
```

## 공개 인터페이스 (다른 모듈이 import하는 것)
```python
from models import Game, GameCreate, GameUpdate          # B5, B6, B7
from models import OCRCandidate, OCRResult, OCRConfirm  # B5, B7
from models import StorageConfig, StorageType            # B7
```

## 이 모듈의 의존성
없음. 오직 `pydantic`, `typing` 표준 라이브러리만 사용.

## 수정 규칙

### Game 필드 추가 (예: rating)
수정 대상: **이 파일만** + F1-types.md + B3-storage.md + F6-library.md + F7-game-form.md
```python
# Game에 추가
rating: Optional[int] = None  # 1-5, None=미평가

# GameCreate에 추가
rating: Optional[int] = None

# GameUpdate에 추가
rating: Optional[int] = None
```

### 플랫폼 추가 (예: xbox)
수정 대상: **이 파일** + F1-types.md + B3-storage.md + F5-platform(frontend)
```python
# Game, GameCreate, GameUpdate 모두에 추가
xbox: bool = False
```

## 격리 보장
- 이 파일은 다른 백엔드 모듈(services, storage, routers)을 import하지 않음
- 비즈니스 로직 없음 (순수 데이터 구조만)
- id 생성, 날짜 처리 없음 (B5-services가 담당)
