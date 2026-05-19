# B-1: models — 데이터 계약

## 책임 범위

- 백엔드 전체에서 사용하는 Pydantic 모델 정의
- API 요청/응답의 스키마 역할 (FastAPI 자동 검증)
- 프론트엔드 `F-1: types`와 1:1 대응

## 파일

```
backend/models.py   ← 단일 파일. 모든 모델이 여기에.
```

## 현재 모델 구조

```python
# 저장된 게임 (읽기/응답)
Game:
    id: str              # UUID, 서버에서 생성
    name: str
    steam: bool
    epic: bool
    switch: bool
    added_date: str      # ISO 8601 (YYYY-MM-DD)
    genre: str
    favorite: bool
    notes: str

# 게임 생성 요청 (POST body)
GameCreate:
    name: str            # 필수
    steam/epic/switch: bool
    genre/favorite/notes: 선택

# 게임 수정 요청 (PUT body)
GameUpdate:
    모든 필드 Optional  # None이면 변경 안 함

# OCR 결과 후보
OCRCandidate:
    name: str
    confidence: float    # 0–100 (tesseract 단어 평균)

# OCR 처리 결과
OCRResult:
    image_id: str        # 임시 캐시 키
    candidates: List[OCRCandidate]
    platform_hint: str   # "steam"|"epic"|"switch"|"unknown"

# OCR 확정 요청
OCRConfirm:
    image_id: str
    selected_names: List[str]
    platform: Optional[str]

# 저장소 설정 (GET 응답)
StorageType:
    storage_type: str    # "excel"|"google_sheets"
    excel_file_path: Optional[str]
    google_sheet_id: Optional[str]

# 저장소 변경 요청 (POST body)
StorageConfig:
    storage_type: str
    excel_file_path: Optional[str]
    google_sheet_id: Optional[str]
    google_credentials_path: Optional[str]
```

## 규칙

### 변경 규칙
1. **Game 필드 추가**: `Game`, `GameCreate`, `GameUpdate` 세 곳 모두 수정해야 한다.
   - `Game`: 필드 추가 (기본값 필수)
   - `GameCreate`: 선택 필드로 추가
   - `GameUpdate`: `Optional[타입] = None` 으로 추가
   - 영향: B-3(storage), F-1(types), F-6(library), F-7(game-form)

2. **기존 필드 제거/이름 변경 금지**: 저장된 파일(Excel/Sheets)과의 호환성이 깨진다.
   - 삭제 대신 deprecated 처리 후 B-3에서 backward-compat 읽기 유지.

3. **id 생성은 모델 밖에서**: `Game.id`는 `services/game_service.py`에서 `str(uuid4())`로 생성.
   모델에 `@validator`나 `default_factory` 쓰지 않는다.

4. **날짜는 문자열**: `added_date: str` (ISO 8601). datetime 객체 쓰지 않는다.
   이유: Excel/Sheets 직렬화 단순화, 프론트에서 그대로 표시.

### 금지 사항
- 모델에 비즈니스 로직 메서드 추가 금지 (예: `to_row()`, `from_excel()`).
  → 변환 로직은 B-3(storage) 담당.
- 모델에 다른 모듈 import 금지 (순수 Pydantic + typing만 사용).
- `Config` 클래스 또는 커스텀 validator를 `models.py`에 추가 금지.
  → 필요시 별도 파일(`validators.py`)로 분리.

## 프론트엔드 대응 (F-1)

| Backend (models.py) | Frontend (types/index.ts) |
|---------------------|--------------------------|
| `Game` | `interface Game` |
| `GameCreate` | `interface GameCreate` |
| `GameUpdate` | `interface GameUpdate` |
| `OCRCandidate` | `interface OCRCandidate` |
| `OCRResult` | `interface OCRResult` |
| `OCRConfirm` | `interface OCRConfirm` |
| `StorageType` | `interface StorageType` |
| `StorageConfig` | `interface StorageConfig` |

**규칙**: 두 파일은 항상 동기화. 한 쪽 변경 시 다른 쪽도 반드시 수정.

## 확장 시나리오

### 플랫폼 추가 (예: Xbox)
```python
# Game, GameCreate, GameUpdate에 필드 추가
xbox: bool = False
```
영향: B-1, B-3, F-1, F-5(platform constants), F-6(GameRow/Table)

### 평점 필드 추가
```python
# Game, GameCreate, GameUpdate에 추가
rating: Optional[int] = None   # 1–5, None=미평가
```
영향: B-1, B-3, F-1, F-6(GameRow), F-7(GameForm)
