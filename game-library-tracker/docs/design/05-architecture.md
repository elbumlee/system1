# 5. 시스템 아키텍처

> 문서 위치: `docs/design/05-architecture.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

```
[브라우저]
    ↕ HTTP (localhost:8000)
[GameLibrary.exe]
 ├── FastAPI (백엔드 API)
 │    ├── /api/games       게임 CRUD
 │    ├── /api/ocr         이미지 OCR
 │    ├── /api/storage     저장소 전환
 │    └── /api/export      Excel 내보내기
 ├── StaticFiles (빌드된 React 앱 서빙)
 └── Storage Layer
      ├── ExcelStorage     game_library.xlsx
      └── SheetsStorage    Google Sheets API
```

**Portable 실행 구조 (배포 시)**
```
GameLibrary/
├── GameLibrary.exe    ← 더블클릭 실행, 브라우저 자동 오픈
├── .env               ← 설정 (Excel 경로, Tesseract 경로 등)
├── game_library.xlsx  ← 데이터 파일 (USB에 보관 가능)
└── _internal/         ← PyInstaller 런타임
```
