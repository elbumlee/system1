# F7: game-form — 게임 추가 폼 컨텍스트

## 모듈 책임
게임 추가 모달, 폼 필드, 장르 목록 상수. 장르 추가/제거, 폼 필드 변경 시 이 모듈만 수정.

## 파일
```
game-library-tracker/frontend/src/features/game-form/constants.ts
game-library-tracker/frontend/src/features/game-form/hooks/useGameForm.ts
game-library-tracker/frontend/src/features/game-form/components/GameForm.tsx
game-library-tracker/frontend/src/features/game-form/components/AddGameModal.tsx
game-library-tracker/frontend/src/features/game-form/index.ts
```

## 현재 코드

### constants.ts
```typescript
export const GENRES = [
  'RPG', 'MMORPG', 'FPS', '슈팅', '뱀서류', '온라인',
  '어드벤처', '전략', '시뮬레이션', '퍼즐', '스포츠',
  '액션', '플랫폼', '격투', '공포', '기타',
] as const;

export type Genre = typeof GENRES[number] | '';
```

### hooks/useGameForm.ts
```typescript
import { useState } from 'react';
import type { Game } from '../../../types';

interface GameFormFields {
  name: string; steam: boolean; epic: boolean; switch: boolean;
  genre: string; favorite: boolean; notes: string;
}

function buildInitial(initial?: Partial<Game>): GameFormFields {
  return {
    name: initial?.name ?? '',
    steam: initial?.steam ?? false,
    epic: initial?.epic ?? false,
    switch: initial?.switch ?? false,
    genre: initial?.genre ?? '',
    favorite: initial?.favorite ?? false,
    notes: initial?.notes ?? '',
  };
}

export function useGameForm(initial?: Partial<Game>) {
  const [fields, setFields] = useState<GameFormFields>(() => buildInitial(initial));

  const setName = (v: string) => setFields((f) => ({ ...f, name: v }));
  const setSteam = (v: boolean) => setFields((f) => ({ ...f, steam: v }));
  const setEpic = (v: boolean) => setFields((f) => ({ ...f, epic: v }));
  const setSwitchVal = (v: boolean) => setFields((f) => ({ ...f, switch: v }));
  const setGenre = (v: string) => setFields((f) => ({ ...f, genre: v }));
  const setFavorite = (v: boolean) => setFields((f) => ({ ...f, favorite: v }));
  const setNotes = (v: string) => setFields((f) => ({ ...f, notes: v }));

  const isValid = fields.name.trim().length > 0;

  function reset() { setFields(buildInitial(initial)); }

  function getPayload(): GameFormFields {
    return {
      name: fields.name.trim(), steam: fields.steam, epic: fields.epic,
      switch: fields.switch, genre: fields.genre,
      favorite: fields.favorite, notes: fields.notes.trim(),
    };
  }

  return {
    fields, setName, setSteam, setEpic,
    setSwitch: setSwitchVal,  // switch는 예약어라 내부에서 setSwitchVal 사용
    setGenre, setFavorite, setNotes,
    isValid, reset, getPayload,
  };
}
```

### components/GameForm.tsx (필드 목록)
```typescript
// 폼 필드 순서:
// 1. 게임 이름 (text input, 필수)
// 2. 보유 플랫폼 (checkbox: Steam / Epic Games / Nintendo Switch)
// 3. 장르 (select — GENRES 상수 사용)
// 4. 즐겨찾기 (checkbox)
// 5. 메모 (text input, 선택)
// 6. 에러 메시지 (있을 경우)
```

## 공개 인터페이스
```typescript
// index.ts에서 export
export { AddGameModal } from './components/AddGameModal';
export { GENRES } from './constants';  // F6-library의 GameRow.tsx에서도 사용
```

## 이 모듈의 의존성
```typescript
import type { Game } from '../../../types';  // F1만 참조
// store, api 직접 참조 없음 — 부모(LibraryPage)가 onAdd 콜백으로 처리
```

## 수정 규칙

### 장르 추가/제거
```typescript
// constants.ts의 GENRES 배열만 수정
export const GENRES = [
  'RPG', 'MMORPG', 'FPS', '슈팅', '뱀서류', '온라인',
  '어드벤처', '전략', '시뮬레이션', '퍼즐', '스포츠',
  '액션', '플랫폼', '격투', '공포', '기타',
  '리듬',  // ← 추가
] as const;
```
수정 대상: **constants.ts만**

### 새 폼 필드 추가 (예: 평점)
F1-types, B1-models에 rating 필드 추가 후:
```typescript
// useGameForm.ts GameFormFields에 추가
rating: number | null;

// buildInitial에 추가
rating: initial?.rating ?? null,

// setter 추가
const setRating = (v: number | null) => setFields((f) => ({ ...f, rating: v }));

// getPayload에 추가
rating: fields.rating,

// GameForm.tsx에 UI 추가
<label className="form-label">
  평점 (1-5)
  <input type="number" min={1} max={5} value={fields.rating ?? ''} onChange={...} />
</label>
```
수정 대상: **useGameForm.ts + GameForm.tsx**

## 격리 보장
- store(F3) import 금지
- api(F2) 직접 호출 금지 (부모 컴포넌트의 onAdd 콜백이 처리)
- F6(library), F8(scanner) import 금지
- GENRES 상수는 이 모듈 소유 — F6에서 import해서 사용 가능
