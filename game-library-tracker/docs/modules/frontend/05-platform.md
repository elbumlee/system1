# F-5: platform — 플랫폼 표시 및 필터

## 책임 범위

- 플랫폼(Steam, Epic, Switch) 배지/아이콘 컴포넌트
- 플랫폼 필터 바
- 플랫폼 토글 (게임 편집 시 체크박스)
- 플랫폼 관련 상수/설정

## 파일

```
frontend/src/features/platform/
  components/
    PlatformBadge.tsx       ← 플랫폼 아이콘+이름 배지
    PlatformFilterBar.tsx   ← 전체/스팀/에픽/스위치 필터 버튼
    PlatformToggle.tsx      ← 게임 폼의 체크박스 그룹
  constants.ts              ← 플랫폼 목록, 색상, 레이블
  index.ts                  ← 공개 인터페이스
```

## constants.ts 구조

```typescript
export const PLATFORMS = [
  { key: 'steam',  label: 'Steam',         color: '#1b2838' },
  { key: 'epic',   label: 'Epic Games',    color: '#313131' },
  { key: 'switch', label: 'Nintendo Switch', color: '#e4000f' },
] as const

export type PlatformKey = typeof PLATFORMS[number]['key']
// → 'steam' | 'epic' | 'switch'
```

## 컴포넌트 인터페이스

```typescript
// PlatformBadge: 게임 행에서 보유 플랫폼 표시
interface PlatformBadgeProps {
  platform: PlatformKey
  active: boolean    // 보유 여부 (회색/컬러)
}

// PlatformFilterBar: 라이브러리 페이지 상단 필터
interface PlatformFilterBarProps {
  current: string          // "all"|PlatformKey
  onChange: (v: string) => void
}

// PlatformToggle: 게임 추가/수정 폼의 플랫폼 선택
interface PlatformToggleProps {
  value: Record<PlatformKey, boolean>
  onChange: (key: PlatformKey, checked: boolean) => void
}
```

## 규칙

### 플랫폼 추가 (예: Xbox)

```typescript
// constants.ts에 추가
{ key: 'xbox', label: 'Xbox', color: '#107c10' }
```

추가 시 영향:
- **F-5 만**: constants.ts에 항목 추가 → PlatformBadge/FilterBar/Toggle 자동 반영
- **F-1**: `Game` 인터페이스에 `xbox: boolean` 추가
- **B-1**: `Game`, `GameCreate`, `GameUpdate` 모델에 필드 추가
- **B-3**: 저장소 컬럼 추가 (excel/sheets)
- **F-6**: GameRow/GameTable에서 xbox 필드 렌더링

### 금지 사항
- 이 모듈에서 F-3(store)를 직접 import하지 않는다.
  `PlatformFilterBar`는 `current`/`onChange` props로만 동작.
- 플랫폼 상수를 constants.ts 외부에 하드코딩 금지.
  예) `game.steam ? 'Steam' : ''` 직접 작성 금지 → PLATFORMS 배열 참조.

## 공개 인터페이스 (index.ts)

```typescript
export { PlatformBadge } from './components/PlatformBadge'
export { PlatformFilterBar } from './components/PlatformFilterBar'
export { PlatformToggle } from './components/PlatformToggle'
export { PLATFORMS, type PlatformKey } from './constants'
```
