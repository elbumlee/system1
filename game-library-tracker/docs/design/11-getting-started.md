# 11. 실행 방법

> 문서 위치: `docs/design/11-getting-started.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

## 개발 환경
```bash
# 백엔드
cd backend && .venv/Scripts/uvicorn main:app --reload

# 프론트엔드
cd frontend && npm run dev
# → http://localhost:5173
```

## Portable .exe 빌드 (Windows)
```bat
cd game-library-tracker
.\build.bat
# → dist\GameLibrary\GameLibrary.exe 생성
```

## 필수 설치 항목 (개발 환경)
- Python 3.10 이상
- Node.js 18 이상
- Tesseract OCR (Korean 언어팩 포함)
