# F-9: storage-settings — 저장소 설정 UI

## 책임 범위

- 현재 저장소 타입 표시
- Excel ↔ Google Sheets 전환 UI
- 각 저장소 연결 정보 입력 폼

## 파일

```
frontend/src/features/storage/
  components/
    StorageTypeSelector.tsx ← Excel/Sheets 선택 라디오
    ExcelConfig.tsx         ← Excel 파일 경로 입력
    SheetsConfig.tsx        ← Google Sheet ID, Credentials 입력
  hooks/
    useStorage.ts           ← 저장소 상태 조회/전환 로직
  index.ts
```

## 컴포넌트 인터페이스

```typescript
// StorageTypeSelector
interface StorageTypeSelectorProps {
  current: string                    // "excel"|"google_sheets"
  onChange: (type: string) => void
}

// ExcelConfig
interface ExcelConfigProps {
  filePath: string
  onChange: (path: string) => void
}

// SheetsConfig
interface SheetsConfigProps {
  sheetId: string
  credentialsPath: string
  onChange: (sheetId: string, credentialsPath: string) => void
}
```

## useStorage 구조

```typescript
function useStorage() {
  storageInfo: StorageType | null
  isLoading: boolean
  isSwitching: boolean
  error: string | null

  load(): Promise<void>
  switchTo(config: StorageConfig): Promise<void>
}
```

## 규칙

### 변경 규칙
1. **새 저장소 타입 추가 (예: SQLite)**: `StorageTypeSelector.tsx`에 옵션 추가 + 새 Config 컴포넌트 생성.
   영향: F-9 만 (백엔드 B-3, B-6는 별도로 추가)
2. **설정 항목 추가**: 해당 Config 컴포넌트만 수정.

### 금지 사항
- 이 모듈에서 게임 목록(F-6) import 금지.
- 저장소 전환 후 게임 목록 재로드는 페이지(F-10)가 처리. 이 모듈에서 `gameStore` 직접 호출 금지.

## 공개 인터페이스 (index.ts)

```typescript
export { StorageTypeSelector } from './components/StorageTypeSelector'
export { ExcelConfig } from './components/ExcelConfig'
export { SheetsConfig } from './components/SheetsConfig'
export { useStorage } from './hooks/useStorage'
```
