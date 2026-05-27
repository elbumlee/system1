# 10. 환경 설정

> 문서 위치: `docs/design/10-configuration.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

```ini
# 저장소 타입 (excel 또는 sheets)
STORAGE_TYPE=excel

# Excel 파일 경로 (USB 사용 시 드라이브 경로 지정)
EXCEL_FILE_PATH=~/game_library.xlsx
# EXCEL_FILE_PATH=E:/game_library.xlsx  ← USB 예시

# Google Sheets (STORAGE_TYPE=sheets 일 때 사용)
# GOOGLE_SHEET_ID=your_sheet_id
# GOOGLE_CREDENTIALS_PATH=./credentials.json

# Tesseract OCR 경로 (Windows)
# TESSERACT_CMD=C:/Program Files/Tesseract-OCR/tesseract.exe
```
