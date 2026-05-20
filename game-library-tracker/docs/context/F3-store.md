# F3: store — 전역 상태 컨텍스트

## 모듈 책임
Zustand 전역 상태. 게임 목록, 필터, 정렬. 정렬/필터 로직 변경 시 이 모듈만 수정.

## 파일
```
game-library-tracker/frontend/src/store/gameStore.ts
game-library-tracker/frontend/src/store/settingsStore.ts
```

## 현재 코드

### store/gameStore.ts
```typescript
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Game, Platform, SortConfig } from '../types';

interface GameStore {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  platformFilter: Platform | 'all';
  sortConfig: SortConfig;
  setGames: (games: Game[]) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setSearchQuery: (q: string) => void;
  setPlatformFilter: (p: Platform | 'all') => void;
  setSortConfig: (s: SortConfig) => void;
  upsertGame: (game: Game) => void;
  removeGame: (id: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  games: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  platformFilter: 'all',
  sortConfig: { field: 'name', direction: 'asc' },

  setGames: (games) => set({ games }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPlatformFilter: (p) => set({ platformFilter: p }),
  setSortConfig: (s) => set({ sortConfig: s }),
  upsertGame: (game) =>
    set((state) => {
      const exists = state.games.some((g) => g.id === game.id);
      return {
        games: exists
          ? state.games.map((g) => (g.id === game.id ? game : g))
          : [...state.games, game],
      };
    }),
  removeGame: (id) =>
    set((state) => ({ games: state.games.filter((g) => g.id !== id) })),
}));

// 파생 훅 — 필터+정렬 적용된 게임 목록 반환
export function useFilteredGames(): Game[] {
  return useGameStore(
    useShallow((state) => {
      let result = [...state.games];

      // 검색 필터
      if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        result = result.filter((g) => g.name.toLowerCase().includes(q));
      }

      // 플랫폼 필터
      if (state.platformFilter !== 'all') {
        result = result.filter((g) => g[state.platformFilter as Platform] === true);
      }

      // 정렬: 즐겨찾기 1순위 고정, sortConfig 2순위
      result.sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        const aVal = a[state.sortConfig.field] ?? '';
        const bVal = b[state.sortConfig.field] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal), 'ko');
        return state.sortConfig.direction === 'asc' ? cmp : -cmp;
      });

      return result;
    })
  );
}
```

### store/settingsStore.ts
```typescript
import { create } from 'zustand';

interface SettingsStore {
  storageType: 'excel' | 'sheets';
  excelPath: string;
  googleSheetId: string;
  credentialsPath: string;
  setStorageType: (t: 'excel' | 'sheets') => void;
  setExcelPath: (p: string) => void;
  setGoogleSheetId: (id: string) => void;
  setCredentialsPath: (p: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  storageType: 'excel',
  excelPath: '~/game_library.xlsx',
  googleSheetId: '',
  credentialsPath: '',
  setStorageType: (t) => set({ storageType: t }),
  setExcelPath: (p) => set({ excelPath: p }),
  setGoogleSheetId: (id) => set({ googleSheetId: id }),
  setCredentialsPath: (p) => set({ credentialsPath: p }),
}));
```

## 공개 인터페이스
```typescript
// 다른 모듈에서 사용하는 것
import { useGameStore } from '../store/gameStore';
import { useFilteredGames } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
```

## 이 모듈의 의존성
```typescript
import type { Game, Platform, SortConfig } from '../types';  // F1만 참조
// F2(api)를 직접 import하지 않음 — 페이지/훅에서 API 호출 후 setGames/upsertGame 사용
```

## 정렬 로직 구조
```
즐겨찾기(favorite) → 항상 상단
  └─ sortConfig.field('name'|'added_date') → localeCompare('ko')
       └─ sortConfig.direction('asc'|'desc')
```

## 수정 규칙

### 새 필터 추가 (예: 장르 필터)
```typescript
// GameStore 인터페이스에 추가
genreFilter: string;
setGenreFilter: (g: string) => void;

// create()에 추가
genreFilter: '',
setGenreFilter: (g) => set({ genreFilter: g }),

// useFilteredGames()에 추가
if (state.genreFilter) {
  result = result.filter((g) => g.genre === state.genreFilter);
}
```
수정 대상: **gameStore.ts만**

### 정렬 기준 추가 (예: genre 정렬)
```typescript
// types/index.ts
export type SortField = 'name' | 'added_date' | 'genre';
```
수정 대상: **gameStore.ts + F1-types.ts**

## 격리 보장
- JSX/컴포넌트 import 금지
- F2(api) 직접 호출 금지 (페이지가 API 호출 후 store 업데이트)
- gameStore ↔ settingsStore 서로 import 금지
