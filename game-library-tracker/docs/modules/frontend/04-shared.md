# F-4: shared — 공유 컴포넌트 및 훅

## 책임 범위

- 여러 feature에서 재사용되는 범용 UI 컴포넌트
- 범용 커스텀 훅
- 특정 도메인(게임, OCR 등)에 의존하지 않음

## 파일

```
frontend/src/shared/
  components/
    ErrorBanner.tsx     ← 에러 메시지 배너
    LoadingSpinner.tsx  ← 로딩 인디케이터
    Modal.tsx           ← 범용 모달 래퍼
    SearchInput.tsx     ← 검색 입력 필드
  hooks/
    useDebounce.ts      ← 디바운스 훅
```

## 컴포넌트 인터페이스

```typescript
// ErrorBanner
interface ErrorBannerProps { message: string; onDismiss?: () => void }

// LoadingSpinner
interface LoadingSpinnerProps { size?: 'sm'|'md'|'lg' }

// Modal
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// SearchInput
interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}
```

## useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T
// value가 변경되면 delay ms 후에 반환값 업데이트
// 검색 입력에서 API 호출 빈도 제어용
```

## 규칙

### 포함 기준
이 디렉토리에 들어갈 수 있는 조건:
- **2개 이상의 feature/page에서 사용**
- **도메인 타입(Game, OCRResult 등)을 props로 받지 않음**
- **store(Zustand)를 직접 import하지 않음**

위 조건 중 하나라도 어긋나면 해당 feature 안에 위치.

### 금지 사항
- `shared` 컴포넌트에서 F-3(store) import 금지.
- `shared` 컴포넌트에서 `Game`, `OCRResult` 등 도메인 타입 직접 사용 금지.
  → props는 string, number, ReactNode 등 범용 타입만.
- 게임 라이브러리 전용 로직 포함 금지.

### 새 shared 컴포넌트 추가
1. 2곳 이상에서 사용됨을 확인
2. `shared/components/` 에 추가
3. 도메인 타입 의존 없는지 확인
