# B-3: storage — 저장소 추상화

## 책임 범위

- 게임 데이터의 영구 저장/조회/수정/삭제
- 저장소 백엔드(Excel, Google Sheets, 미래의 DB)를 교체해도 위 레이어가 변경되지 않도록 추상화
- B-1(models)의 `Game` 객체로만 입출력

## 파일

```
backend/storage/
  __init__.py           ← AbstractStorage export
  base.py               ← AbstractStorage ABC 정의
  excel_storage.py      ← Excel(openpyxl) 구현
  sheets_storage.py     ← Google Sheets(gspread) 구현
```

## 인터페이스 (base.py)

```python
from abc import ABC, abstractmethod
from typing import List, Optional
from models import Game, GameCreate, GameUpdate

class AbstractStorage(ABC):

    @abstractmethod
    def get_all_games(self) -> List[Game]: ...

    @abstractmethod
    def add_game(self, game: GameCreate, game_id: str, added_date: str) -> Game: ...

    @abstractmethod
    def update_game(self, game_id: str, update: GameUpdate) -> Optional[Game]: ...

    @abstractmethod
    def delete_game(self, game_id: str) -> bool: ...

    def get_game_by_id(self, game_id: str) -> Optional[Game]:
        # 기본 구현: get_all_games()에서 선형 탐색
        return next((g for g in self.get_all_games() if g.id == game_id), None)
```

## 구현체 규칙

### 공통 규칙
1. **반환 타입 고정**: 항상 `Game` / `List[Game]` / `Optional[Game]` / `bool` 반환.
   구현체 고유 타입(Row, dict 등) 노출 금지.

2. **id, added_date는 인자로 받음**: 저장소가 생성하지 않는다.
   ```python
   # 올바른 시그니처
   def add_game(self, game: GameCreate, game_id: str, added_date: str) -> Game:
   ```

3. **예외 처리**: 파일 없음, 네트워크 오류 등은 `StorageError`로 래핑 후 raise.
   라우터에서 `except StorageError`로 처리.

4. **backward compatibility (Excel/Sheets)**: 컬럼이 추가되더라도 기존 파일을 읽을 수 있어야 한다.
   ```python
   genre = row[7] if len(row) > 7 else ""
   favorite = row[8] == "TRUE" if len(row) > 8 else False
   ```

### Excel (excel_storage.py)
- 헤더 행: `["ID", "Name", "Steam", "Epic", "Switch", "Added Date", "Notes", "Genre", "Favorite"]`
- 컬럼 순서 변경 금지 (기존 파일 호환성)
- 파일 없으면 시작 시 자동 생성
- bool → `"TRUE"/"FALSE"` 문자열로 저장

### Google Sheets (sheets_storage.py)
- 동일한 9컬럼 순서 유지
- `_row_to_game()`: 리스트를 9개 원소로 패딩 후 파싱
- API rate limit 고려: 쓰기 연속 호출 자제

## 새 저장소 백엔드 추가

```python
# backend/storage/sqlite_storage.py
from .base import AbstractStorage

class SQLiteStorage(AbstractStorage):
    def get_all_games(self) -> List[Game]: ...
    def add_game(self, ...) -> Game: ...
    def update_game(self, ...) -> Optional[Game]: ...
    def delete_game(self, ...) -> bool: ...
```

영향 범위: **B-3(storage) 만**
- `deps.py`에서 `storage_type == "sqlite"` 분기 추가 (B-6에서 1줄 추가)
- `StorageConfig` 모델에 sqlite_path 추가 (B-1에서 선택 필드 추가)
- 나머지 모듈 무변경

## 금지 사항
- 저장소 내부에서 `uuid` 생성 금지 → B-5(services)가 생성해서 전달
- 저장소에서 HTTP 요청 금지
- 구현체가 다른 구현체를 import 금지
