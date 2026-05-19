# B-8: main — 앱 진입점

## 책임 범위

- FastAPI 앱 인스턴스 생성
- 미들웨어 등록 (CORS)
- 라우터 등록
- 헬스체크 엔드포인트
- uvicorn 실행 진입점

## 파일

```
backend/main.py     ← 단일 파일, ~40줄 이하 유지
```

## 현재 구조

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import games, ocr, storage, export

app = FastAPI(title="Game Library API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

app.include_router(games.router)
app.include_router(ocr.router)
app.include_router(storage.router)
app.include_router(export.router)

@app.get("/health")
def health(): return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

## 규칙

1. **40줄 이하 유지**: 비즈니스 로직이 들어오면 잘못된 것.
2. **새 라우터 추가**: `app.include_router(new_router.router)` 한 줄만 추가.
3. **CORS 설정**: 개발 환경은 `allow_origins=["*"]`. 운영 배포 시 프론트엔드 도메인으로 교체.
4. **startup 이벤트 금지**: 저장소 초기화는 lazy(B-6 deps). `@app.on_event("startup")` 사용 금지.

## 금지 사항
- `main.py`에서 서비스, 저장소 직접 import 금지.
- 라우터 로직을 `main.py`에 작성 금지.
