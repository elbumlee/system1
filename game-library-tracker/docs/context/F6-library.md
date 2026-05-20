# F6: library — 게임 목록 UI 컨텍스트

## 모듈 책임
게임 목록 테이블 렌더링, 인라인 편집, 즐겨찾기 토글.
테이블 컬럼 추가/변경 시 이 모듈만 수정.

## 파일
```
game-library-tracker/frontend/src/features/library/components/GameTable.tsx
game-library-tracker/frontend/src/features/library/components/GameRow.tsx
game-library-tracker/frontend/src/features/library/components/EmptyState.tsx
game-library-tracker/frontend/src/features/library/hooks/useGameList.ts
game-library-tracker/frontend/src/features/library/hooks/useGameMutate.ts
game-library-tracker/frontend/src/features/library/index.ts
```

## 현재 컬럼 구조
| 열 | 헤더 | 편집 방식 |
|----|------|----------|
| 1 | ★ | 버튼 클릭 (즉시 저장) |
| 2 | 게임명 | 텍스트 input |
| 3 | Steam | PlatformToggle (즉시 저장) |
| 4 | Epic | PlatformToggle (즉시 저장) |
| 5 | Switch | PlatformToggle (즉시 저장) |
| 6 | 추가일 | 읽기 전용 |
| 7 | 장르 | select 드롭다운 |
| 8 | 메모 | 텍스트 input |
| 9 | 작업 | 저장/취소/삭제 버튼 |

## 현재 코드

### hooks/useGameMutate.ts
```typescript
import { useGameStore } from '../../../store/gameStore';
import { createGame, updateGame, deleteGame } from '../../../api/games';
import type { Game, Platform } from '../../../types';

export function useGameMutate() {
  const upsertGame = useGameStore((s) => s.upsertGame);
  const removeGameFromStore = useGameStore((s) => s.removeGame);

  async function addGame(payload: {
    name: string; steam: boolean; epic: boolean; switch: boolean;
    genre: string; favorite: boolean; notes: string;
  }): Promise<Game> {
    const newGame = await createGame(payload);
    upsertGame(newGame);
    return newGame;
  }

  async function editGame(id: string, payload: Partial<Game>): Promise<Game> {
    const updated = await updateGame(id, payload);
    upsertGame(updated);
    return updated;
  }

  async function removeGame(id: string): Promise<void> {
    await deleteGame(id);
    removeGameFromStore(id);
  }

  async function togglePlatform(id: string, platform: Platform, current: boolean): Promise<void> {
    const updated = await updateGame(id, { [platform]: !current });
    upsertGame(updated);
  }

  return { addGame, editGame, removeGame, togglePlatform };
}
```

### hooks/useGameList.ts
```typescript
import { useEffect } from 'react';
import { useGameStore, useFilteredGames } from '../../../store/gameStore';
import { getGames } from '../../../api/games';
import type { Game } from '../../../types';

export function useGameList() {
  const setGames = useGameStore((s) => s.setGames);
  const setLoading = useGameStore((s) => s.setLoading);
  const setError = useGameStore((s) => s.setError);
  const isLoading = useGameStore((s) => s.isLoading);
  const error = useGameStore((s) => s.error);
  const filteredGames = useFilteredGames();

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await getGames();
      setGames(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '게임 목록을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);
  return { filteredGames, isLoading, error, refresh };
}
```

### components/GameTable.tsx (Props 요약)
```typescript
interface Props {
  games: Game[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSort: (field: SortConfig['field']) => void;
  onToggle: (id: string, platform: Platform, current: boolean) => void;
  onEdit: (id: string, payload: Partial<Game>) => void;
  onDelete: (id: string) => void;
  onFavoriteToggle: (id: string, current: boolean) => void;
}
// 렌더: thead(★/게임명/Steam/Epic/Switch/추가일/장르/메모/작업) + GameRow 목록
```

### components/GameRow.tsx (편집 상태)
```typescript
// editing=false: 텍스트 표시, 편집/삭제 버튼
// editing=true: name/notes input, genre select, 저장/취소 버튼
// 즐겨찾기: 별표 버튼 → onFavoriteToggle() 즉시 호출
// 플랫폼: PlatformToggle → onToggle() 즉시 호출 (편집 모드 불필요)
```

## 이 모듈의 의존성
```typescript
import { useGameStore, useFilteredGames } from '../../../store/gameStore';  // F3
import { createGame, updateGame, deleteGame, getGames } from '../../../api/games';  // F2
import type { Game, Platform, SortConfig } from '../../../types';  // F1
import PlatformToggle from '../../platform/components/PlatformToggle';  // F5
import { GENRES } from '../../game-form/constants';  // F7의 constants (상수만)
```

## 수정 규칙

### 새 컬럼 추가 (예: 평점)
```typescript
// GameTable.tsx thead에 추가
<th className="th-rating">평점</th>

// GameRow.tsx에 추가
<td className="rating-cell">
  {editing ? (
    <select value={editRating} onChange={...}>...</select>
  ) : (
    <span>{game.rating ?? '-'}</span>
  )}
</td>

// saveEdit()에 추가
onEdit(game.id, { name, notes, genre, rating: editRating });
```
수정 대상: **GameTable.tsx + GameRow.tsx** (F1-types, B1-models에 필드 추가 후)

### 장르 목록 변경
GENRES 상수는 F7-game-form/constants.ts 에 있음.
`docs/context/F7-game-form.md` 참조.

## 격리 보장
- store(F3)를 GameRow에서 직접 import 금지 (props로만 통신)
- F8(scanner), F9(storage-settings) import 금지
- API 함수를 GameRow에서 직접 호출 금지 (useGameMutate 경유)
