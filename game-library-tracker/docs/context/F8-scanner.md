# F8: scanner — OCR 스캐너 UI 컨텍스트

## 모듈 책임
이미지 업로드 → OCR 후보 표시 → 선택/편집 → 게임 추가.
신뢰도 임계값, OCR 흐름 변경 시 이 모듈만 수정.

## 파일
```
game-library-tracker/frontend/src/features/scanner/components/DropZone.tsx
game-library-tracker/frontend/src/features/scanner/components/ImagePreview.tsx
game-library-tracker/frontend/src/features/scanner/components/CandidateList.tsx
game-library-tracker/frontend/src/features/scanner/hooks/useOCR.ts
game-library-tracker/frontend/src/features/scanner/index.ts
```

## 신뢰도 표시 규칙
```
confidence >= 80  → 정상 텍스트 + conf-ok 배지 (초록)
confidence < 80   → low-confidence 클래스 (빨간 텍스트) + conf-low 배지 (빨강)
```
**임계값 변경**: `CandidateList.tsx`의 `const isLow = confidence < 80;` 숫자만 수정.

## 현재 코드

### hooks/useOCR.ts
```typescript
import { useState } from 'react';
import { uploadImageForOCR, confirmOCRGames } from '../../../api/ocr';
import { useGameStore } from '../../../store/gameStore';
import type { OCRResult, Platform } from '../../../types';

export function useOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState<Platform>('steam');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const upsertGame = useGameStore((s) => s.upsertGame);

  async function handleFile(f: File) {
    setError(''); setResult(null); setSelected(new Set());
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploading(true);
    try {
      const ocr = await uploadImageForOCR(f);
      setResult(ocr);
      setSelected(new Set(ocr.candidates.map((c) => c.name)));  // 전체 선택
      if (ocr.platform_hint !== 'unknown') {
        setPlatform(ocr.platform_hint as Platform);
      }
    } catch {
      setError('OCR 처리에 실패했습니다. 다른 이미지를 시도해 주세요.');
    } finally {
      setUploading(false);
    }
  }

  function toggleCandidate(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    if (selected.size === result.candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.candidates.map((c) => c.name)));
    }
  }

  function rename(oldName: string, newName: string) {
    if (!result || !newName.trim() || oldName === newName.trim()) return;
    const trimmed = newName.trim();
    setResult((prev) =>
      prev ? {
        ...prev,
        candidates: prev.candidates.map((c) =>
          c.name === oldName ? { ...c, name: trimmed } : c
        ),
      } : null
    );
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(oldName)) { next.delete(oldName); next.add(trimmed); }
      return next;
    });
  }

  function reset() {
    setFile(null); setPreview(null); setResult(null);
    setSelected(new Set()); setError('');
  }

  async function confirm(): Promise<boolean> {
    if (!result || selected.size === 0) return false;
    setConfirming(true);
    setError('');
    try {
      const games = await confirmOCRGames({
        image_id: result.image_id,
        selected_names: Array.from(selected),
        platform,
      });
      games.forEach((g) => upsertGame(g));
      return true;
    } catch {
      setError('게임 추가에 실패했습니다.');
      return false;
    } finally {
      setConfirming(false);
    }
  }

  return {
    file, preview, uploading, result, selected, platform,
    confirming, error,
    handleFile, toggleCandidate, toggleAll, rename,
    setPlatform, reset, confirm,
  };
}
```

### components/CandidateList.tsx (핵심 부분)
```typescript
// Props
interface Props {
  candidates: OCRCandidate[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onToggleAll: () => void;
  onRename: (oldName: string, newName: string) => void;
}

// 신뢰도 표시 로직
const isLow = confidence < 80;  // ← 임계값 변경 위치

// 렌더: isLow ? 'low-confidence' class (빨강) : 정상
// 더블클릭 → input으로 인라인 편집 → Enter/blur 확정, Escape 취소
```

## 이 모듈의 의존성
```typescript
import { uploadImageForOCR, confirmOCRGames } from '../../../api/ocr';  // F2
import { useGameStore } from '../../../store/gameStore';                 // F3
import type { OCRResult, Platform } from '../../../types';               // F1
```

## 수정 규칙

### 신뢰도 임계값 변경 (예: 70%로 낮춤)
```typescript
// CandidateList.tsx
const isLow = confidence < 70;  // 80 → 70
```
수정 대상: **CandidateList.tsx만**

### OCR 업로드 후 자동 전체 선택 해제
```typescript
// useOCR.ts handleFile()에서
setSelected(new Set());  // 전체 선택 → 빈 Set으로 변경
```
수정 대상: **useOCR.ts만**

### 업로드 파일 형식 제한
```typescript
// DropZone.tsx
<input type="file" accept="image/*" />  // 또는 "image/png,image/jpeg"
```
수정 대상: **DropZone.tsx만**

## 격리 보장
- CandidateList에서 store 직접 호출 금지 (props 통신만)
- useOCR에서 라우팅(navigate) 금지 — 페이지가 처리
- 이미지 서버 저장 없음 (Object URL로 로컬 미리보기만)
