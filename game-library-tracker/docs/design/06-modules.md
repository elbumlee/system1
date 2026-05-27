# 6. 모듈 구조

> 문서 위치: `docs/design/06-modules.md`  
> 전체 기획서: [`docs/PROJECT.md`](../PROJECT.md)  
> 최종 수정: 2026-05-27

## 백엔드 (12개 모듈)
| ID | 모듈 | 책임 |
|----|------|------|
| B1 | models | Pydantic 데이터 모델 (Game, OCRResult 등) |
| B2 | config | 환경 변수 관리 (.env) |
| B3 | storage | AbstractStorage + Excel/Sheets 구현체 |
| B4 | ocr | pytesseract 처리 + 신뢰도 필터 |
| B5 | services | 비즈니스 로직 (게임 CRUD, OCR, Export) |
| B6 | routers | FastAPI 라우터 (games/ocr/storage/export) |

## 프론트엔드 (14개 모듈)
| ID | 모듈 | 책임 |
|----|------|------|
| F1 | types | TypeScript 타입 정의 |
| F2 | api | Axios HTTP 클라이언트 함수 |
| F3 | store | Zustand 전역 상태 (게임 목록, 필터, 정렬) |
| F4 | shared | 공통 컴포넌트 (Modal, SearchInput 등) |
| F5 | platform | 플랫폼 배지/토글/필터 컴포넌트 |
| F6 | library | 게임 목록 테이블 + 인라인 편집 |
| F7 | game-form | 게임 추가/편집 폼 + 장르 상수 |
| F8 | scanner | OCR 스캐너 UI (DropZone, CandidateList) |
| F9 | storage | 저장소 설정 UI |
| F10 | pages | 페이지 컴포넌트 (Library/Scanner/Settings/Detail) |
