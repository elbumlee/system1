# B6: routers + deps + main — HTTP 레이어 컨텍스트

## 모듈 책임
HTTP 요청/응답 처리. 의존성 주입(deps). 앱 진입점(main).
새 API 엔드포인트 추가, 저장소 전환 시 이 모듈 수정.

## 파일
```
game-library-tracker/backend/deps.py
game-library-tracker/backend/main.py
game-library-tracker/backend/routers/games.py
game-library-tracker/backend/routers/ocr.py
game-library-tracker/backend/routers/storage.py
game-library-tracker/backend/routers/export.py
```

## 현재 코드

### deps.py
```python
from storage.base import AbstractStorage
from storage import create_storage

_storage: AbstractStorage | None = None

def get_storage() -> AbstractStorage:
    global _storage
    if _storage is None:
        _storage = create_storage()
    return _storage

def reset_storage(new_storage: AbstractStorage) -> None:
    global _storage
    _storage = new_storage
```

### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import games, ocr, storage, export

app = FastAPI(title="Game Library Tracker API", version="1.0.0")

origins = [
    "http://localhost", "http://localhost:3000",
    "http://localhost:5173", "http://localhost:4173",
    "http://127.0.0.1:5173", "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://192\.168\.\d+\.\d+(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(games.router)
app.include_router(ocr.router)
app.include_router(storage.router)
app.include_router(export.router)

@app.get("/api/health")
def health():
    from config import settings
    return {"status": "ok", "storage_type": settings.storage_type}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### routers/games.py — 엔드포인트 목록
```
GET    /api/games          → svc.list_games()
POST   /api/games          → svc.create_game(payload)
PUT    /api/games/{id}     → svc.update_game(id, payload)
DELETE /api/games/{id}     → svc.delete_game(id)
```

### routers/ocr.py — 엔드포인트 목록
```
POST /api/ocr/upload   → _ocr_service.process_image(bytes) → OCRResult
POST /api/ocr/confirm  → _ocr_service.confirm_games(payload, storage) → List[Game]
```

### routers/storage.py — 엔드포인트 목록
```
GET  /api/storage/type   → StorageType (현재 저장소 정보)
POST /api/storage/switch → create_storage() + deps.reset_storage()
```

### routers/export.py — 엔드포인트 목록
```
GET /api/export/excel → StreamingResponse (xlsx 파일 다운로드)
```

## 이 모듈의 의존성
```python
from models import ...          # B1
from services.game_service import GameService    # B5
from services.ocr_service import OCRService      # B5
from services.export_service import generate_excel  # B5
from storage.base import AbstractStorage         # B3 (타입)
from storage import create_storage               # B3 (팩토리)
from config import settings                      # B2
from deps import get_storage, reset_storage      # 내부
```

## 수정 규칙

### 새 게임 엔드포인트 추가 (예: 검색)
```python
# routers/games.py에 추가
@router.get("/search", response_model=list[Game])
def search_games(q: str, svc: GameService = Depends(_service)):
    return [g for g in svc.list_games() if q.lower() in g.name.lower()]
```
수정 대상: **routers/games.py만** (서비스에 검색 로직 있으면 B5도)

### 새 라우터 파일 추가
```python
# main.py에 1줄 추가
from routers import games, ocr, storage, export, new_module
app.include_router(new_module.router)
```
수정 대상: **routers/new_module.py 생성 + main.py 1줄**

## 격리 보장
- routers끼리 서로 import 금지
- 비즈니스 로직을 router에 구현 금지 (서비스에 위임)
- main.py는 40줄 이하 유지
