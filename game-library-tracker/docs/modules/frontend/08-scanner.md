# F-8: scanner — OCR 스캐너

## 책임 범위

- 이미지 업로드 (파일 선택 또는 드래그앤드롭)
- 이미지 미리보기
- OCR 결과 후보 표시 및 선택/편집
- 확정된 게임 라이브러리에 추가

## 파일

```
frontend/src/features/scanner/
  components/
    DropZone.tsx        ← 파일 드롭/선택 영역
    ImagePreview.tsx    ← 업로드된 이미지 미리보기
    CandidateList.tsx   ← OCR 후보 목록 (선택, 인라인 편집, 신뢰도 표시)
  hooks/
    useOCR.ts           ← OCR 업로드/확정 상태 관리
  index.ts
```

## 컴포넌트 인터페이스

```typescript
// DropZone
interface DropZoneProps {
  onFile: (file: File) => void
  isLoading: boolean
}

// ImagePreview
interface ImagePreviewProps {
  file: File | null
  onClear: () => void
}

// CandidateList
interface CandidateListProps {
  candidates: OCRCandidate[]
  selected: Set<string>           // 선택된 후보 이름 Set
  onToggle: (name: string) => void
  onToggleAll: (selectAll: boolean) => void
  onRename: (oldName: string, newName: string) => void
  onConfirm: (platform: string) => void
  isConfirming: boolean
}
```

## useOCR 구조

```typescript
function useOCR() {
  // 상태
  result: OCRResult | null
  selected: Set<string>
  isUploading: boolean
  isConfirming: boolean
  error: string | null

  // 액션
  upload(file: File): Promise<void>
  toggleCandidate(name: string): void
  toggleAll(selectAll: boolean): void
  rename(oldName: string, newName: string): void
  confirm(platform: string): Promise<void>
  reset(): void
}
```

## 신뢰도 표시 규칙

| 신뢰도 | 표시 방식 |
|--------|----------|
| ≥ 80 | 기본 텍스트 색상 + `conf-ok` 배지 |
| < 80 | 빨간 텍스트 + `conf-low` 배지 (사용자 직접 확인 필요) |

```typescript
// CandidateList.tsx 내부
const isLow = candidate.confidence < 80
```

## 인라인 이름 편집 규칙

- 더블클릭으로 편집 모드 진입
- Enter 또는 blur → 확정 (`onRename` 호출)
- Escape → 취소 (원래 이름 복원)
- 편집 중 빈 문자열은 저장 불가 (Enter 무시)

## 규칙

### 변경 규칙
1. **신뢰도 임계값 변경**: `CandidateList.tsx`의 `confidence < 80` 상수값만 변경.
   상수로 분리 권장:
   ```typescript
   const LOW_CONFIDENCE_THRESHOLD = 80
   ```
2. **파일 타입 제한 변경**: `DropZone.tsx`의 `accept` 속성만 변경.
3. **OCR 후 자동 전체 선택**: `useOCR.ts`의 `upload()` 성공 시 로직 변경.

### 금지 사항
- `CandidateList`에서 store(Zustand) 직접 호출 금지 → props 통신.
- `useOCR`에서 게임 추가 후 라우팅 금지 → 페이지 레벨에서 처리.
- 이미지를 브라우저에 영구 저장 금지 (단순 미리보기용 Object URL만 사용).

## 공개 인터페이스 (index.ts)

```typescript
export { DropZone } from './components/DropZone'
export { ImagePreview } from './components/ImagePreview'
export { CandidateList } from './components/CandidateList'
export { useOCR } from './hooks/useOCR'
```
