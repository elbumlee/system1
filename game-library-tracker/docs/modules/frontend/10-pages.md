# F-10: pages — 라우팅 페이지

## 책임 범위

- URL 라우팅과 페이지 레이아웃
- feature 모듈을 조합하여 완성된 화면 구성
- store 액션 호출 및 feature간 데이터 흐름 조율

## 파일

```
frontend/src/pages/
  LibraryPage.tsx       ← "/" 메인 라이브러리
  ScannerPage.tsx       ← "/scanner" OCR 스캐너
  SettingsPage.tsx      ← "/settings" 저장소 설정
  GameDetailPage.tsx    ← "/game/:id" 게임 상세 (현재 미사용 수준)
```

## 페이지별 책임

### LibraryPage (/)
- `gameStore`에서 게임 목록 로드 (`loadGames`)
- `useFilteredGames()`로 필터된 목록 전달
- `PlatformFilterBar` + `SearchInput` + `GameTable` 조합
- `AddGameModal` 표시/숨김 상태 관리
- 게임 추가/편집/삭제/즐겨찾기 store 액션 호출

### ScannerPage (/scanner)
- `useOCR` hook 사용
- `DropZone` + `ImagePreview` + `CandidateList` 조합
- OCR 확정 후 `gameStore.loadGames()` 호출하여 목록 갱신

### SettingsPage (/settings)
- `useStorage` hook 사용
- `StorageTypeSelector` + `ExcelConfig`/`SheetsConfig` 조합
- 저장소 전환 후 `gameStore.loadGames()` 호출 (저장소 변경 반영)

### GameDetailPage (/game/:id)
- `useParams`로 id 획득
- `gameStore`에서 단건 게임 조회
- 상세 정보 표시

## 규칙

### 변경 규칙
1. **새 페이지 추가**: `pages/` 에 컴포넌트 추가 + `App.tsx`에 `<Route>` 1줄 추가.
2. **페이지 레이아웃 변경**: 해당 Page 파일만 수정.

### feature 조합 규칙
- 페이지는 feature의 index.ts 공개 인터페이스만 import.
  ```typescript
  // 올바름
  import { GameTable } from '../features/library'
  // 금지: 내부 파일 직접 접근
  import { GameTable } from '../features/library/components/GameTable'
  ```
- 페이지 간 직접 import 금지.
- 페이지가 다른 페이지를 렌더링 금지 (라우터가 처리).

### store 호출 위치
- store 액션 호출은 페이지에서 담당.
- feature 컴포넌트/훅은 props/콜백으로만 데이터 수신.
- 예외: `useFilteredGames()` 같이 store 읽기용 파생 훅은 feature 내부에서 사용 가능.

### 금지 사항
- 페이지에서 API 함수 직접 호출 금지 → store action 경유.
- 비즈니스 로직을 페이지에 구현 금지 → feature hook 또는 store로 이동.
