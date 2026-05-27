# 게임 라이브러리 트래커 — 프로젝트 기획서

**버전**: 1.0  
**작성일**: 2026-05-27  
**저장소**: https://github.com/elbumlee/system1 (브랜치: `claude/game-library-tracker-WveNh`)

---

## 1. 프로젝트 개요

### 배경 및 목적
Steam, Epic Games, Nintendo Switch에 분산된 개인 게임 목록을 하나의 인터페이스에서 통합 관리한다.
OCR 스캐너로 게임 목록 이미지를 자동 인식하고, Excel 파일을 DB로 활용해 USB로 휴대하며 어디서든 사용할 수 있다.

### 핵심 가치
- **통합 관리**: 3개 플랫폼 게임을 한 화면에서 조회/편집
- **OCR 자동 인식**: 게임 목록 스크린샷 업로드 → 자동 추가
- **이식성**: 설치 없이 폴더 복사만으로 어느 PC에서든 실행
- **USB 휴대**: Excel 데이터 파일을 USB에 보관, 경로만 설정하면 동기화

---

## 2. 사용자 시나리오

| 시나리오 | 흐름 |
|----------|------|
| 게임 수동 추가 | + 버튼 → 이름/플랫폼/장르 입력 → 저장 |
| OCR 자동 등록 | 스캐너 탭 → 이미지 드래그앤드롭 → 후보 목록 확인 → 추가 |
| 게임 편집 | 목록에서 행 클릭 → 인라인 편집 → 저장 |
| 즐겨찾기 관리 | ★ 버튼 클릭 → 상단 고정 |
| 다른 PC에서 사용 | USB 꽂기 → .env에서 경로 확인 → GameLibrary.exe 실행 |
| 데이터 내보내기 | 설정 → Excel 다운로드 |

---

## 3. 기능 명세

### 3-1. 게임 목록 (Library)
- 테이블 뷰: 게임명 / Steam / Epic / Switch / 추가일 / 장르 / 메모 / 작업
- 인라인 편집: 행 더블클릭 → 직접 수정
- 즐겨찾기(★): 클릭 즉시 저장, 즐겨찾기 항목 항상 상단 고정
- 플랫폼 토글: Steam/Epic/Switch 체크박스 클릭 즉시 저장
- 삭제: 행 삭제 버튼

### 3-2. 검색 및 필터
- 게임명 실시간 검색 (debounce 적용)
- 플랫폼 필터: 전체 / Steam / Epic / Switch
- 정렬: 게임명 / 추가일 (오름/내림차순), 즐겨찾기 1순위 고정

### 3-3. 게임 추가 폼
| 필드 | 타입 | 비고 |
|------|------|------|
| 게임 이름 | 텍스트 | 필수 |
| 보유 플랫폼 | 체크박스 | Steam / Epic / Switch 중복 선택 |
| 장르 | 드롭다운 | 16종 (RPG/FPS/어드벤처 등) |
| 즐겨찾기 | 체크박스 | |
| 메모 | 텍스트 | 선택 |

### 3-4. OCR 스캐너
- 이미지 드래그앤드롭 또는 클릭 업로드
- pytesseract로 OCR 처리 (한국어 + 영어)
- **신뢰도 표시**:
  - 80% 이상 → 정상 (초록 배지)
  - 80% 미만 → 빨간 텍스트 + 경고 배지
- 후보 목록에서 개별 선택/해제, 이름 더블클릭 인라인 편집
- 플랫폼 힌트 자동 감지 (Steam/Epic/Switch)
- 확인 버튼으로 선택한 게임 일괄 추가

### 3-5. 저장소 설정
| 저장소 | 설정 항목 |
|--------|-----------|
| Excel (기본) | 파일 경로 (USB 경로 지정 가능) |
| Google Sheets | 스프레드시트 ID + 서비스 계정 credentials.json 경로 |

- 저장소 전환: 설정 페이지에서 즉시 전환
- Excel 내보내기: 현재 데이터를 .xlsx로 다운로드

---

## 4. 기술 스택

### 백엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | FastAPI |
| 서버 | Uvicorn |
| OCR | pytesseract + Pillow |
| Excel 저장 | openpyxl |
| Google Sheets | gspread + google-auth |
| 설정 관리 | pydantic-settings + python-dotenv |

### 프론트엔드
| 항목 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| PWA | vite-plugin-pwa |
| 아이콘 | lucide-react |

### 배포/패키징
| 항목 | 기술 |
|------|------|
| Portable .exe | PyInstaller (--onedir) |
| 빌드 자동화 | build.bat |
| 개발 실행 | start.bat / start.sh |

---

## 5. 시스템 아키텍처

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

---

## 6. 모듈 구조

### 백엔드 (12개 모듈)
| ID | 모듈 | 책임 |
|----|------|------|
| B1 | models | Pydantic 데이터 모델 (Game, OCRResult 등) |
| B2 | config | 환경 변수 관리 (.env) |
| B3 | storage | AbstractStorage + Excel/Sheets 구현체 |
| B4 | ocr | pytesseract 처리 + 신뢰도 필터 |
| B5 | services | 비즈니스 로직 (게임 CRUD, OCR, Export) |
| B6 | routers | FastAPI 라우터 (games/ocr/storage/export) |

### 프론트엔드 (14개 모듈)
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

---

## 7. 데이터 모델

### Game
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string (UUID) | 고유 식별자 |
| name | string | 게임 이름 (필수) |
| steam | boolean | Steam 보유 여부 |
| epic | boolean | Epic Games 보유 여부 |
| switch | boolean | Nintendo Switch 보유 여부 |
| added_date | string (YYYY-MM-DD) | 추가일 |
| genre | string | 장르 |
| favorite | boolean | 즐겨찾기 |
| notes | string | 메모 |

### 장르 목록 (16종)
RPG, MMORPG, FPS, 슈팅, 뱀서류, 온라인, 어드벤처, 전략, 시뮬레이션, 퍼즐, 스포츠, 액션, 플랫폼, 격투, 공포, 기타

---

## 8. API 명세

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

---

## 9. 테스트

### TDD 적용 현황 — 총 101개 테스트 (전체 GREEN ✅)

| 파일 | 개수 | 내용 |
|------|------|------|
| `backend/tests/test_game_service.py` | 16개 | 게임 CRUD, 즐겨찾기, ID 중복 |
| `backend/tests/test_ocr_filters.py` | 41개 | 신뢰도 필터, 텍스트 정제, 후보 병합 |
| `frontend/src/__tests__/useGameForm.test.ts` | 26개 | 초기화, 유효성 검사, setter, reset |
| `frontend/src/__tests__/useFilteredGames.test.ts` | 18개 | 검색, 플랫폼 필터, 정렬, 즐겨찾기 우선순위 |

### 테스트 실행
```bash
# 백엔드
cd backend && pip install -r test-requirements.txt
pytest tests/ -v

# 프론트엔드
cd frontend && npm test
```

---

## 10. 환경 설정 (.env)

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

---

## 11. 실행 방법

### 개발 환경
```bash
# 백엔드
cd backend && .venv/Scripts/uvicorn main:app --reload

# 프론트엔드
cd frontend && npm run dev
# → http://localhost:5173
```

### Portable .exe 빌드 (Windows)
```bat
cd game-library-tracker
.\build.bat
# → dist\GameLibrary\GameLibrary.exe 생성
```

### 필수 설치 항목 (개발 환경)
- Python 3.10 이상
- Node.js 18 이상
- Tesseract OCR (Korean 언어팩 포함)

---

## 12. 향후 개선 과제

| 우선순위 | 항목 |
|----------|------|
| 높음 | 게임 상세 페이지 플레이타임 입력 |
| 높음 | 게임 커버 이미지 (RAWG API 연동) |
| 중간 | 통계 대시보드 (플랫폼별 게임 수, 장르 분포) |
| 중간 | 다중 이미지 OCR (여러 장 한번에 업로드) |
| 낮음 | 클라우드 배포 (Railway/Render) |
| 낮음 | 모바일 앱 (React Native 또는 Capacitor) |
