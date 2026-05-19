# 모듈 설계 개요

## 모듈 목록 및 의존 관계

```
[Backend]
  B-1: models      ← 데이터 계약 (Pydantic). 모든 모듈이 참조. 변경 시 전체 영향.
  B-2: config      ← 환경변수/설정. B-3만 참조.
  B-3: storage     ← 영구 저장소 추상화. B-1 참조. B-5가 사용.
  B-4: ocr         ← 이미지→텍스트 변환. B-1 참조. B-5가 사용.
  B-5: services    ← 비즈니스 로직. B-1, B-3, B-4 참조. B-7이 사용.
  B-6: deps        ← 의존성 주입. B-2, B-3 참조. B-7이 사용.
  B-7: routers     ← HTTP 라우터. B-1, B-5, B-6 참조. B-8이 등록.
  B-8: main        ← 앱 진입점. B-7 참조.

[Frontend]
  F-1: types       ← TypeScript 타입 계약. 모든 프론트엔드 모듈이 참조.
  F-2: api         ← HTTP 클라이언트. F-1 참조. F-3, features가 사용.
  F-3: store       ← Zustand 전역 상태. F-1, F-2 참조. pages, features가 사용.
  F-4: shared      ← 재사용 UI 컴포넌트/훅. F-1만 참조.
  F-5: platform    ← 플랫폼 배지/필터. F-1, F-4 참조.
  F-6: library     ← 게임 목록 테이블. F-1, F-3, F-4, F-5 참조.
  F-7: game-form   ← 게임 추가/수정 폼. F-1, F-3, F-4 참조.
  F-8: scanner     ← OCR 스캐너. F-1, F-2, F-3, F-4 참조.
  F-9: storage-settings ← 저장소 설정 UI. F-1, F-2, F-4 참조.
  F-10: pages      ← 라우팅 페이지. features 조합.
```

## 의존성 규칙

1. **단방향 의존**: 아래 레이어는 위 레이어를 참조할 수 없다.
   - `types → api → store → features → pages`
   - `models → config/storage/ocr → services → deps → routers → main`

2. **순환 참조 금지**: 같은 레이어 내 모듈 간 import 금지.
   - `library`가 `scanner`를 import하거나 그 반대 금지.
   - `game_service`가 `ocr_service`를 import 금지.

3. **공개 인터페이스(barrel export)**: 각 모듈은 `index.ts` / `__init__.py`를 통해서만 외부에 노출.

## 파일 구조 원칙

```
features/<name>/
  components/   ← UI 컴포넌트 (이 모듈 안에서만 사용)
  hooks/        ← 로직 훅 (이 모듈 안에서만 사용)
  constants.ts  ← 이 모듈에서만 쓰이는 상수
  index.ts      ← 공개 인터페이스 (외부에 노출할 것만 export)

backend/<layer>/
  <name>.py     ← 구현
  __init__.py   ← 공개 인터페이스
```

## 변경 영향 범위

| 변경 항목 | 영향 모듈 |
|-----------|----------|
| Game 필드 추가 | B-1, B-3(storage), F-1, F-6(GameRow/Table), F-7(GameForm) |
| 플랫폼 추가 (Xbox 등) | B-1, F-1, F-5(platform) |
| 저장소 백엔드 추가 | B-3(storage) 만 |
| OCR 엔진 교체 | B-4(ocr) 만 |
| 정렬/필터 로직 변경 | F-3(store) 만 |
| UI 컴포넌트 스타일 | 해당 feature 만 |

## 문서 목록

| 파일 | 모듈 |
|------|------|
| `backend/01-models.md` | B-1: 데이터 모델 |
| `backend/02-config.md` | B-2: 설정 |
| `backend/03-storage.md` | B-3: 저장소 추상화 |
| `backend/04-ocr.md` | B-4: OCR |
| `backend/05-services.md` | B-5: 서비스 |
| `backend/06-deps.md` | B-6: 의존성 주입 |
| `backend/07-routers.md` | B-7: HTTP 라우터 |
| `backend/08-main.md` | B-8: 앱 진입점 |
| `frontend/01-types.md` | F-1: 타입 계약 |
| `frontend/02-api.md` | F-2: API 클라이언트 |
| `frontend/03-store.md` | F-3: 전역 상태 |
| `frontend/04-shared.md` | F-4: 공유 컴포넌트 |
| `frontend/05-platform.md` | F-5: 플랫폼 |
| `frontend/06-library.md` | F-6: 라이브러리 |
| `frontend/07-game-form.md` | F-7: 게임 폼 |
| `frontend/08-scanner.md` | F-8: 스캐너 |
| `frontend/09-storage-settings.md` | F-9: 저장소 설정 |
| `frontend/10-pages.md` | F-10: 페이지 |
