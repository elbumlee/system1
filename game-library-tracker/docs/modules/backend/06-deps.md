# B-6: deps — 의존성 주입

## 책임 범위

- 저장소 인스턴스의 생성과 수명 관리
- FastAPI `Depends()`로 라우터에 저장소 제공
- 런타임 저장소 전환 지원

## 파일

```
backend/deps.py     ← 단일 파일
```

## 현재 구조

```python
from typing import Optional
from storage.base import AbstractStorage

_storage: Optional[AbstractStorage] = None

def get_storage() -> AbstractStorage:
    global _storage
    if _storage is None:
        # config.settings.storage_type 기반으로 초기화
        _storage = _init_storage()
    return _storage

def reset_storage(new_storage: AbstractStorage) -> None:
    global _storage
    _storage = new_storage

def _init_storage() -> AbstractStorage:
    from config import settings
    if settings.storage_type == "excel":
        from storage.excel_storage import ExcelStorage
        return ExcelStorage(settings.excel_file_path)
    elif settings.storage_type == "google_sheets":
        from storage.sheets_storage import SheetsStorage
        return SheetsStorage(settings.google_sheet_id, settings.google_credentials_path)
    raise ValueError(f"Unknown storage type: {settings.storage_type}")
```

## 규칙

### 변경 규칙
1. **새 저장소 추가**: `_init_storage()` 분기에 `elif` 추가.
   ```python
   elif settings.storage_type == "sqlite":
       from storage.sqlite_storage import SQLiteStorage
       return SQLiteStorage(settings.sqlite_path)
   ```
   영향: **B-6(deps.py) 만** (+ B-2, B-3 각각 설정/구현 추가)

2. **`get_storage`는 Depends 전용**: 라우터 함수 인자로만 사용.
   서비스나 다른 모듈에서 직접 `get_storage()` 호출 금지.

### 금지 사항
- `deps.py`에서 라우터, 서비스 import 금지.
- 저장소 이외의 싱글톤 관리 금지 (OCR 캐시는 B-5가 관리).
- 테스트에서 `_storage` 전역 변수 직접 접근 금지 → `reset_storage(mock)`으로 교체.

## 테스트에서의 사용

```python
# test_games.py
from deps import reset_storage
from unittest.mock import MagicMock

def test_list_games(client):
    mock = MagicMock()
    mock.get_all_games.return_value = [...]
    reset_storage(mock)
    ...
```
