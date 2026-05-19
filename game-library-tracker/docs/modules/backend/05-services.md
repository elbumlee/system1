# B-5: services — 비즈니스 로직

## 책임 범위

- 라우터와 저장소/OCR 사이의 비즈니스 로직
- 도메인 규칙 적용 (ID 생성, 날짜 추가, OCR 캐시 관리)
- 라우터는 서비스를 호출하고, 서비스는 저장소/OCR을 호출

## 파일

```
backend/services/
  __init__.py           ← GameService, OCRService, generate_excel export
  game_service.py       ← 게임 CRUD 비즈니스 로직
  ocr_service.py        ← OCR 처리 및 캐시 관리
  export_service.py     ← Excel 내보내기 생성
```

## 인터페이스

### game_service.py

```python
class GameService:
    def __init__(self, storage: AbstractStorage): ...

    def list_games(self) -> List[Game]: ...
    def get_game(self, game_id: str) -> Game: ...         # 없으면 raise HTTPException(404)
    def create_game(self, data: GameCreate) -> Game: ...  # uuid + today 날짜 추가
    def update_game(self, game_id: str, data: GameUpdate) -> Game: ...
    def delete_game(self, game_id: str) -> None: ...
```

### ocr_service.py

```python
class OCRService:
    _cache: ClassVar[Dict[str, OCRResult]] = {}  # image_id → OCRResult

    def process_image(self, image_bytes: bytes) -> OCRResult: ...
    # image_id(uuid) 생성, processor 호출, 결과 캐시 저장

    def confirm_games(self, confirm: OCRConfirm, storage: AbstractStorage) -> List[Game]: ...
    # 캐시에서 image_id 조회, selected_names로 게임 생성, 캐시 삭제
```

### export_service.py

```python
def generate_excel(games: List[Game]) -> io.BytesIO:
    # openpyxl로 Excel 생성, BytesIO 반환 (파일에 쓰지 않음)
```

## 규칙

### 변경 규칙
1. **비즈니스 규칙 추가**: 해당 서비스 파일만 수정.
   예) 게임 이름 중복 검사 → `game_service.create_game()`에 추가.

2. **의존성 주입**: `GameService`는 `AbstractStorage`를 생성자로 받는다.
   서비스 내부에서 저장소 인스턴스 직접 생성 금지 (B-6 deps가 주입).

3. **HTTP 예외**: 서비스는 `fastapi.HTTPException`을 raise할 수 있다.
   이유: 서비스가 "존재하지 않는 게임" 같은 도메인 에러를 가장 잘 알기 때문.

### OCR 캐시 규칙
- 캐시는 클래스 변수(`_cache`). 프로세스 재시작 시 초기화됨 (의도적).
- 캐시 키: `image_id` (UUID 문자열).
- `confirm_games()` 호출 후 해당 캐시 항목 즉시 삭제.
- 캐시 TTL 없음 (단일 사용자 앱, 용량 문제 없음).
- 캐시가 커질 수 있다면 `maxlen=50` deque로 교체 검토.

### 금지 사항
- 서비스가 다른 서비스를 import 금지 (game_service ↔ ocr_service 참조 금지).
- 서비스에서 HTTP 요청 금지.
- `export_service.py`가 저장소를 직접 참조 금지. 라우터가 리스트를 전달.

## 확장 시나리오

### 게임 이름 중복 검사 추가
```python
def create_game(self, data: GameCreate) -> Game:
    existing = self.storage.get_all_games()
    if any(g.name.lower() == data.name.lower() for g in existing):
        raise HTTPException(409, "이미 존재하는 게임명입니다")
    ...
```
영향: **B-5(services/game_service.py) 만**
