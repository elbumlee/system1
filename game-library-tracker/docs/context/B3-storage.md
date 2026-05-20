# B3: storage — 저장소 컨텍스트

## 모듈 책임
게임 데이터 영구 저장/조회/수정/삭제. Excel(openpyxl)과 Google Sheets(gspread) 구현.
저장소 교체 시 이 모듈만 수정하면 됨.

## 파일
```
game-library-tracker/backend/storage/__init__.py
game-library-tracker/backend/storage/base.py
game-library-tracker/backend/storage/excel_storage.py
game-library-tracker/backend/storage/sheets_storage.py
```

## 현재 코드

### storage/base.py
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from models import Game

class AbstractStorage(ABC):
    @abstractmethod
    def get_all_games(self) -> List[Game]: ...

    @abstractmethod
    def add_game(self, game: Game) -> Game: ...

    @abstractmethod
    def update_game(self, game_id: str, updates: dict) -> Optional[Game]: ...

    @abstractmethod
    def delete_game(self, game_id: str) -> bool: ...

    def get_game_by_id(self, game_id: str) -> Optional[Game]:
        return next((g for g in self.get_all_games() if g.id == game_id), None)
```

### storage/__init__.py (팩토리)
```python
from config import settings
from storage.base import AbstractStorage

def create_storage(
    storage_type: str | None = None,
    file_path: str | None = None,
    sheet_id: str | None = None,
    credentials_path: str | None = None,
) -> AbstractStorage:
    stype = storage_type or settings.storage_type
    if stype == "excel":
        from storage.excel_storage import ExcelStorage
        return ExcelStorage(file_path or settings.excel_file_path)
    elif stype in ("sheets", "google_sheets"):
        from storage.sheets_storage import SheetsStorage
        return SheetsStorage(
            sheet_id or settings.google_sheet_id,
            credentials_path or settings.google_credentials_path,
        )
    raise ValueError(f"Unknown storage type: {stype}")
```

### storage/excel_storage.py
```python
import os
from pathlib import Path
from typing import List, Optional
from datetime import date

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

from models import Game
from storage.base import AbstractStorage

HEADERS = ["ID", "Name", "Steam", "Epic", "Switch", "Added Date", "Notes", "Genre", "Favorite"]

class ExcelStorage(AbstractStorage):
    def __init__(self, file_path: Optional[str] = None):
        if file_path:
            self.file_path = Path(os.path.expanduser(file_path))
        else:
            self.file_path = Path.home() / "game_library.xlsx"
        self._ensure_file()

    def _ensure_file(self):
        if not self.file_path.exists():
            wb = Workbook()
            ws = wb.active
            ws.title = "Games"
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
            header_alignment = Alignment(horizontal="center", vertical="center")
            for col_idx, header in enumerate(HEADERS, start=1):
                cell = ws.cell(row=1, column=col_idx, value=header)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_alignment
            col_widths = [36, 40, 8, 8, 8, 15, 40, 20, 10]
            for col_idx, width in enumerate(col_widths, start=1):
                ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = width
            wb.save(self.file_path)

    def _load_workbook(self):
        return load_workbook(self.file_path)

    def get_all_games(self) -> List[Game]:
        wb = self._load_workbook()
        ws = wb.active
        games = []
        for row in ws.iter_rows(min_row=2, values_only=True):
            if row[0] is None:
                continue
            # 구버전 7컬럼 파일 호환 (len 체크)
            games.append(Game(
                id=str(row[0]),
                name=str(row[1]) if len(row) > 1 and row[1] else "",
                steam=bool(row[2]) if len(row) > 2 and row[2] is not None else False,
                epic=bool(row[3]) if len(row) > 3 and row[3] is not None else False,
                switch=bool(row[4]) if len(row) > 4 and row[4] is not None else False,
                added_date=str(row[5]) if len(row) > 5 and row[5] else date.today().isoformat(),
                notes=str(row[6]) if len(row) > 6 and row[6] else "",
                genre=str(row[7]) if len(row) > 7 and row[7] else "",
                favorite=bool(row[8]) if len(row) > 8 and row[8] is not None else False,
            ))
        return games

    def add_game(self, game: Game) -> Game:
        wb = self._load_workbook()
        ws = wb.active
        next_row = ws.max_row + 1
        ws.cell(row=next_row, column=1, value=game.id)
        ws.cell(row=next_row, column=2, value=game.name)
        ws.cell(row=next_row, column=3, value=game.steam)
        ws.cell(row=next_row, column=4, value=game.epic)
        ws.cell(row=next_row, column=5, value=game.switch)
        ws.cell(row=next_row, column=6, value=game.added_date)
        ws.cell(row=next_row, column=7, value=game.notes)
        ws.cell(row=next_row, column=8, value=game.genre)
        ws.cell(row=next_row, column=9, value=game.favorite)
        wb.save(self.file_path)
        return game

    def update_game(self, game_id: str, updates: dict) -> Optional[Game]:
        wb = self._load_workbook()
        ws = wb.active
        COL = {"name":2,"steam":3,"epic":4,"switch":5,"notes":7,"genre":8,"favorite":9}
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=False), start=2):
            if row[0].value == game_id:
                for field, col in COL.items():
                    if field in updates and updates[field] is not None:
                        ws.cell(row=row_idx, column=col, value=updates[field])
                wb.save(self.file_path)
                return self.get_game_by_id(game_id)
        return None

    def delete_game(self, game_id: str) -> bool:
        wb = self._load_workbook()
        ws = wb.active
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=False), start=2):
            if row[0].value == game_id:
                ws.delete_rows(row_idx)
                wb.save(self.file_path)
                return True
        return False

    def get_file_path(self) -> str:
        return str(self.file_path)
```

### storage/sheets_storage.py (요약 — 전체 구조)
```python
# SheetsStorage(AbstractStorage) — gspread 사용
# HEADERS = ["ID","Name","Steam","Epic","Switch","Added Date","Notes","Genre","Favorite"]
# 9컬럼 구조로 ExcelStorage와 동일한 순서 유지
# _row_to_game(row): 리스트를 9개 원소로 패딩 후 Game 반환
# add_game: append_row([id, name, str(steam), ...])
# update_game: row_values → 수정 → update(f"A{idx}:I{idx}", [row])
# delete_game: delete_rows(row_idx)
```

## 공개 인터페이스
```python
from storage.base import AbstractStorage   # B5, B6, B7에서 타입으로 사용
from storage import create_storage         # B6-deps에서 초기화 시 사용
```

## 이 모듈의 의존성
```python
from models import Game      # B1만 참조
from config import settings  # B2만 참조
```

## 컬럼 순서 (변경 금지)
| col | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|-----|---|---|---|---|---|---|---|---|---|
| 필드 | ID | Name | Steam | Epic | Switch | Added Date | Notes | Genre | Favorite |

## 수정 규칙

### 새 필드 저장 추가 (예: rating)
B1-models에서 Game.rating 추가 후:
```python
# HEADERS에 추가
HEADERS = [..., "Rating"]  # col 10

# add_game에 추가
ws.cell(row=next_row, column=10, value=game.rating)

# update_game의 COL dict에 추가
COL = {..., "rating": 10}

# get_all_games에 추가 (backward compat)
rating=int(row[9]) if len(row) > 9 and row[9] else None,
```
수정 대상: **이 파일만** (ExcelStorage + SheetsStorage 동시 수정)

### 새 저장소 백엔드 추가 (예: SQLite)
```python
# storage/sqlite_storage.py 생성 (AbstractStorage 구현)
# storage/__init__.py의 create_storage()에 elif 추가
elif stype == "sqlite":
    from storage.sqlite_storage import SQLiteStorage
    return SQLiteStorage(...)
```
수정 대상: **이 파일만** (B2-config에 sqlite_path 추가도 필요)

## 격리 보장
- services, routers, ocr import 금지
- id 생성, 날짜 생성 없음 (B5-services가 담당)
- HTTP 요청 없음
