# F-7: game-form — 게임 추가/수정 폼

## 책임 범위

- 게임 추가 모달 (AddGameModal)
- 폼 필드 렌더링 및 유효성 검사
- 장르 드롭다운 상수 관리

## 파일

```
frontend/src/features/game-form/
  components/
    AddGameModal.tsx    ← 모달 래퍼 + GameForm 조합
    GameForm.tsx        ← 실제 폼 필드 (이름, 플랫폼, 장르, 메모)
  hooks/
    useGameForm.ts      ← 폼 상태, 유효성, 제출 로직
  constants.ts          ← GENRES 배열
  index.ts
```

## 인터페이스

```typescript
// AddGameModal
interface AddGameModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: GameCreate) => Promise<void>
}

// GameForm (모달 내부에서만 사용)
interface GameFormProps {
  value: GameCreate
  onChange: (data: GameCreate) => void
  onSubmit: () => void
  isSubmitting: boolean
}
```

## constants.ts

```typescript
export const GENRES = [
  'RPG', 'MMORPG', 'FPS', '슈팅', '뱀서류', '온라인',
  '어드벤처', '전략', '시뮬레이션', '퍼즐',
  '스포츠', '액션', '플랫폼', '격투', '공포', '기타',
]
```

## 규칙

### 변경 규칙
1. **장르 추가/삭제**: `constants.ts`의 `GENRES` 배열만 수정.
   영향: F-7 만
2. **새 폼 필드 추가 (예: 평점)**: `GameForm.tsx`에 필드 추가 + `useGameForm.ts` 상태 추가.
   전제: F-1(types), B-1(models)에 필드가 먼저 추가되어 있어야 함.
3. **유효성 검사 변경**: `useGameForm.ts`만 수정.

### 유효성 검사 규칙
- 게임 이름: 필수, 1자 이상
- 플랫폼: 최소 1개 선택
- 나머지 필드: 선택사항
- 유효성 실패 시 저장 버튼 비활성화

### 금지 사항
- `AddGameModal`에서 store(Zustand) 직접 호출 금지 → `onAdd` prop을 통해서.
  (store 호출은 페이지 레벨에서 처리)
- `GameForm`이 F-6(library) 또는 F-8(scanner) import 금지.
- `constants.ts`를 이 모듈 밖에서 import 금지 → 장르 목록은 이 모듈만 소유.
  F-6의 GameRow에서 편집 드롭다운이 필요하다면 `game-form` index.ts에서 `GENRES` export.

## 공개 인터페이스 (index.ts)

```typescript
export { AddGameModal } from './components/AddGameModal'
export { GENRES } from './constants'
```
