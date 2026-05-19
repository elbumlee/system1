# F-3: store — 전역 상태 관리

## 책임 범위

- 게임 목록의 전역 상태 (Zustand)
- 서버 동기화 (API 호출 + 상태 업데이트)
- 필터링/정렬 로직
- 설정 상태 (저장소 타입 등)

## 파일

```
frontend/src/store/
  gameStore.ts        ← 게임 목록, 필터, 정렬 상태
  settingsStore.ts    ← 저장소 설정 상태
```

## gameStore.ts 구조

```typescript
interface GameState {
  // 서버 상태
  games: Game[]
  isLoading: boolean
  error: string | null

  // UI 상태
  searchQuery: string
  platformFilter: string   // "all"|"steam"|"epic"|"switch"
  sortConfig: { key: keyof Game; direction: 'asc'|'desc' }

  // Actions
  loadGames(): Promise<void>
  addGame(data: GameCreate): Promise<void>
  editGame(id: string, data: GameUpdate): Promise<void>
  removeGame(id: string): Promise<void>
  setSearch(q: string): void
  setPlatformFilter(f: string): void
  setSortConfig(key: keyof Game, direction: 'asc'|'desc'): void
}

// 파생 훅 (컴포넌트가 직접 쓰는 것)
export function useFilteredGames(): Game[]
```

## 정렬/필터 규칙 (useFilteredGames)

```
1. games 배열 복사
2. searchQuery 적용: name 포함 여부 (대소문자 무시)
3. platformFilter 적용: steam/epic/switch === true 인 것만
4. 정렬:
   - 1순위: favorite (true가 항상 위)
   - 2순위: sortConfig.key 기준 localeCompare('ko') 정렬
```

## 규칙

### 변경 규칙
1. **새 필터 추가 (예: genre 필터)**: `gameStore.ts`에 상태 + setter + `useFilteredGames` 로직 추가.
   영향: F-3(store) + 필터 UI를 보여주는 feature
2. **정렬 로직 변경**: `useFilteredGames()`만 수정.
3. **새 서버 액션 추가**: store에 action 추가 + F-2(api) 함수 호출.

### 금지 사항
- store에서 JSX/컴포넌트 import 금지.
- store에서 직접 `fetch` 호출 금지 → 반드시 F-2(api) 함수 경유.
- `gameStore`가 `settingsStore` import 금지 (단방향).
- store 액션에서 UI 라우팅 금지 (navigate 등).

### 낙관적 업데이트(Optimistic Update)
현재 구현: 서버 응답 후 상태 업데이트 (단순).
필요 시 낙관적 업데이트로 전환: `editGame` 호출 전 store를 먼저 업데이트, 실패 시 롤백.
→ UX 개선이 필요할 때만 적용.

## settingsStore.ts 구조

```typescript
interface SettingsState {
  storageType: string
  excelFilePath: string
  googleSheetId: string

  loadStorageType(): Promise<void>
  switchStorage(config: StorageConfig): Promise<void>
}
```

두 store는 서로 독립. `gameStore`가 `settingsStore`를 import하지 않는다.
