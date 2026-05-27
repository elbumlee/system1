# 8. API 명세

> 문서 위치: `docs/design/08-api.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/games | 게임 목록 조회 |
| POST | /api/games | 게임 추가 |
| PUT | /api/games/{id} | 게임 수정 |
| DELETE | /api/games/{id} | 게임 삭제 |
| POST | /api/ocr/upload | 이미지 OCR 처리 |
| POST | /api/ocr/confirm | OCR 결과 확정 (게임 추가) |
| GET | /api/storage/type | 현재 저장소 조회 |
| POST | /api/storage/switch | 저장소 전환 |
| GET | /api/export/excel | Excel 파일 다운로드 |
