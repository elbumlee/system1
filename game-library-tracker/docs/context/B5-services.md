# B5: services — 비즈니스 로직 컨텍스트

## 모듈 책임
라우터와 저장소/OCR 사이의 비즈니스 로직. UUID 생성, 날짜 부여, OCR 캐시 관리.

## 파일
```
game-library-tracker/backend/services/game_service.py
game-library-tracker/backend/services/ocr_service.py
game-library-tracker/backend/services/export_service.py
```

## 현재 코드

### services/game_service.py
```python
import uuid
from datetime import date
from typing import List, Optional

from models import Game, GameCreate, GameUpdate
from storage.base import AbstractStorage


class GameService:
    def __init__(self, storage: AbstractStorage):
        self.storage = storage

    def list_games(self) -> List[Game]:
        return self.storage.get_all_games()

    def create_game(self, payload: GameCreate) -> Game:
        game = Game(
            id=str(uuid.uuid4()),
            name=payload.name,
            steam=payload.steam,
            epic=payload.epic,
            switch=payload.switch,
            added_date=date.today().isoformat(),
            genre=payload.genre,
            favorite=payload.favorite,
            notes=payload.notes,
        )
        return self.storage.add_game(game)

    def update_game(self, game_id: str, payload: GameUpdate) -> Optional[Game]:
        updates = payload.model_dump(exclude_none=True)
        return self.storage.update_game(game_id, updates)

    def delete_game(self, game_id: str) -> bool:
        return self.storage.delete_game(game_id)
```

### services/ocr_service.py
```python
import uuid
from datetime import date
from typing import Dict, List

from models import Game, OCRResult, OCRConfirm
from storage.base import AbstractStorage


class OCRService:
    _cache: Dict[str, OCRResult] = {}  # image_id → OCRResult (프로세스 수명과 동일)

    def process_image(self, image_bytes: bytes) -> OCRResult:
        from ocr.processor import OCRProcessor
        processor = OCRProcessor()
        candidates, platform_hint = processor.process(image_bytes)
        image_id = str(uuid.uuid4())
        result = OCRResult(image_id=image_id, candidates=candidates, platform_hint=platform_hint)
        OCRService._cache[image_id] = result
        return result

    def get_cached_result(self, image_id: str) -> OCRResult | None:
        return OCRService._cache.get(image_id)

    def confirm_games(self, payload: OCRConfirm, storage: AbstractStorage) -> List[Game]:
        cached = OCRService._cache.get(payload.image_id)
        if cached is None:
            return []
        today = date.today().isoformat()
        added_games: List[Game] = []
        for name in payload.selected_names:
            name = name.strip()
            if not name:
                continue
            game = Game(
                id=str(uuid.uuid4()),
                name=name,
                steam=payload.platform == "steam",
                epic=payload.platform == "epic",
                switch=payload.platform == "switch",
                added_date=today,
                genre="",
                favorite=False,
                notes="OCR 추가",
            )
            storage.add_game(game)
            added_games.append(game)
        del OCRService._cache[payload.image_id]
        return added_games
```

### services/export_service.py
```python
import io
from typing import List

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

from models import Game


def generate_excel(games: List[Game]) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Games"

    headers = ["ID", "Name", "Steam", "Epic", "Switch", "Added Date", "Notes", "Genre", "Favorite"]
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")

    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment

    col_widths = [36, 40, 8, 8, 8, 15, 40, 20, 10]
    for col_idx, width in enumerate(col_widths, start=1):
        ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = width

    for row_idx, game in enumerate(games, start=2):
        ws.cell(row=row_idx, column=1, value=game.id)
        ws.cell(row=row_idx, column=2, value=game.name)
        ws.cell(row=row_idx, column=3, value=game.steam)
        ws.cell(row=row_idx, column=4, value=game.epic)
        ws.cell(row=row_idx, column=5, value=game.switch)
        ws.cell(row=row_idx, column=6, value=game.added_date)
        ws.cell(row=row_idx, column=7, value=game.notes)
        ws.cell(row=row_idx, column=8, value=game.genre)
        ws.cell(row=row_idx, column=9, value="TRUE" if game.favorite else "FALSE")

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
```

## 공개 인터페이스
```python
from services.game_service import GameService    # B6-routers/games.py
from services.ocr_service import OCRService      # B6-routers/ocr.py
from services.export_service import generate_excel  # B6-routers/export.py
```

## 이 모듈의 의존성
```python
from models import Game, GameCreate, GameUpdate, OCRResult, OCRConfirm  # B1
from storage.base import AbstractStorage  # B3 (타입만, 인스턴스는 주입받음)
from ocr.processor import OCRProcessor    # B4 (ocr_service에서만)
```

## 수정 규칙

### 게임 생성 규칙 변경 (예: 중복 이름 검사)
```python
# game_service.py create_game()에 추가
def create_game(self, payload: GameCreate) -> Game:
    existing = self.storage.get_all_games()
    if any(g.name.lower() == payload.name.lower() for g in existing):
        from fastapi import HTTPException
        raise HTTPException(409, "이미 존재하는 게임명입니다")
    ...
```
수정 대상: **game_service.py만**

### OCR 확정 시 기본 장르 지정
```python
# ocr_service.py confirm_games()에서 genre 수정
game = Game(..., genre=payload.genre or "", ...)
```
수정 대상: **ocr_service.py만**

### 내보내기에 새 필드 추가 (예: rating)
B3-storage, B1-models에 rating 추가 후:
```python
# export_service.py headers, col_widths, 데이터 행에 추가
headers = [..., "Rating"]
ws.cell(row=row_idx, column=10, value=game.rating)
```
수정 대상: **export_service.py만**

## 격리 보장
- 서비스끼리 서로 import 금지 (game_service ↔ ocr_service 금지)
- routers import 금지
- HTTP 요청 없음
