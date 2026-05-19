# B-7: routers — HTTP 라우터

## 책임 범위

- HTTP 요청/응답 처리 (입력 검증은 FastAPI/Pydantic 자동 처리)
- 서비스 호출 후 결과를 HTTP 응답으로 변환
- 비즈니스 로직 금지 (서비스에 위임)

## 파일

```
backend/routers/
  __init__.py       ← router 객체들 export
  games.py          ← /api/games CRUD
  ocr.py            ← /api/ocr/upload, /api/ocr/confirm
  storage.py        ← /api/storage/type, /api/storage/switch
  export.py         ← /api/export/excel
```

## 엔드포인트 목록

| 메서드 | 경로 | 파일 | 설명 |
|--------|------|------|------|
| GET | /api/games | games.py | 전체 게임 목록 |
| POST | /api/games | games.py | 게임 추가 |
| PUT | /api/games/{id} | games.py | 게임 수정 |
| DELETE | /api/games/{id} | games.py | 게임 삭제 |
| POST | /api/ocr/upload | ocr.py | 이미지 업로드 → OCR |
| POST | /api/ocr/confirm | ocr.py | OCR 결과 확정 |
| GET | /api/storage/type | storage.py | 현재 저장소 정보 |
| POST | /api/storage/switch | storage.py | 저장소 전환 |
| GET | /api/export/excel | export.py | Excel 다운로드 |

## 라우터 작성 규칙

### 구조 패턴
```python
# games.py
from fastapi import APIRouter, Depends, HTTPException
from models import Game, GameCreate, GameUpdate
from services.game_service import GameService
from deps import get_storage

router = APIRouter(prefix="/api/games", tags=["games"])

@router.get("/", response_model=List[Game])
def list_games(storage=Depends(get_storage)):
    return GameService(storage).list_games()

@router.post("/", response_model=Game, status_code=201)
def add_game(data: GameCreate, storage=Depends(get_storage)):
    return GameService(storage).create_game(data)
```

### 규칙
1. **라우터는 얇게(thin)**: 요청 파싱 → 서비스 호출 → 응답 반환. 로직 없음.
2. **각 라우터 파일은 하나의 도메인**: games, ocr, storage, export 파일 혼합 금지.
3. **response_model 명시**: 모든 엔드포인트에 `response_model` 지정.
4. **새 엔드포인트 추가**: 해당 라우터 파일에 함수 추가. `main.py` 수정 불필요.
   단, 완전히 새 도메인이면 새 파일 + `main.py` router 등록 1줄 추가.

### 금지 사항
- 라우터에서 직접 저장소 메서드 호출 금지 → 반드시 서비스를 통해서.
- 라우터에서 비즈니스 규칙 구현 금지 (중복 검사, 날짜 생성 등).
- 라우터 간 import 금지.

## 새 엔드포인트 추가 시나리오

### 게임 검색 추가
```python
# games.py에 추가
@router.get("/search", response_model=List[Game])
def search_games(q: str, storage=Depends(get_storage)):
    return GameService(storage).search_games(q)
```
영향: **B-7(routers/games.py) + B-5(services/game_service.py)**
