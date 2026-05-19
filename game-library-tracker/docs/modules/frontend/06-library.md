# F-6: library — 게임 목록 테이블

## 책임 범위

- 게임 목록 테이블 렌더링
- 인라인 편집 (행 클릭 → 편집 모드)
- 즐겨찾기 토글
- 빈 목록 안내

## 파일

```
frontend/src/features/library/
  components/
    GameTable.tsx       ← 테이블 헤더 + GameRow 목록
    GameRow.tsx         ← 게임 한 행 (보기/편집 모드)
    EmptyState.tsx      ← 게임 없을 때 안내 UI
  hooks/
    useGameList.ts      ← 필터된 게임 목록 + 로딩 상태
    useGameMutate.ts    ← 편집/삭제/즐겨찾기 액션
  index.ts
```

## 컴포넌트 인터페이스

```typescript
// GameTable: 페이지에서 사용하는 최상위 컴포넌트
interface GameTableProps {
  games: Game[]
  onEdit: (id: string, data: GameUpdate) => void
  onDelete: (id: string) => void
  onFavoriteToggle: (id: string) => void
}

// GameRow: GameTable 내부에서만 사용
interface GameRowProps {
  game: Game
  isEditing: boolean
  onEditStart: () => void
  onEditSave: (data: GameUpdate) => void
  onEditCancel: () => void
  onDelete: () => void
  onFavoriteToggle: () => void
}

// EmptyState: 외부 props 없음
```

## 컬럼 구조 (GameTable)

| 열 | 헤더 | 설명 |
|----|------|------|
| 1 | ★ | 즐겨찾기 토글 버튼 |
| 2 | 게임명 | 이름 (인라인 편집) |
| 3 | Steam | 플랫폼 배지/체크박스 |
| 4 | Epic | 플랫폼 배지/체크박스 |
| 5 | Switch | 플랫폼 배지/체크박스 |
| 6 | 장르 | 배지 표시 / 드롭다운 편집 |
| 7 | 추가일 | YYYY-MM-DD (읽기 전용) |
| 8 | 메모 | 텍스트 (인라인 편집) |
| 9 | 작업 | 저장/취소/삭제 버튼 |

## 규칙

### 변경 규칙
1. **새 컬럼 추가 (예: 평점)**: `GameTable.tsx` 헤더 + `GameRow.tsx` td 추가.
   영향: F-6 만 (데이터 필드가 이미 Game 타입에 있을 경우)
2. **정렬 헤더 클릭 추가**: `GameTable.tsx`에 헤더 클릭 핸들러 추가.
   store의 `setSortConfig` 호출.

### 편집 모드 규칙
- 한 번에 하나의 행만 편집 가능 (행 클릭으로 편집 시작, 다른 행 클릭 시 취소)
- 편집 중인 행 ID는 `useGameMutate.ts`의 `editingId` 상태로 관리
- 저장: PUT API 호출 성공 후 편집 모드 종료
- 취소: ESC 또는 취소 버튼, 변경사항 버림

### 금지 사항
- `GameRow`에서 store(Zustand) 직접 접근 금지 → props로만 통신.
- `GameTable`이 F-8(scanner) 또는 F-7(game-form) import 금지.
- 즐겨찾기 토글 로직을 컴포넌트 안에 구현 금지 → `onFavoriteToggle` prop 사용.

## 공개 인터페이스 (index.ts)

```typescript
export { GameTable } from './components/GameTable'
export { useGameList } from './hooks/useGameList'
export { useGameMutate } from './hooks/useGameMutate'
```
