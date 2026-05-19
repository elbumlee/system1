# F-1: types — TypeScript 타입 계약

## 책임 범위

- 프론트엔드 전체에서 사용하는 TypeScript interface/type 정의
- 백엔드 `B-1: models`의 Pydantic 모델과 1:1 대응
- 이 모듈이 변경되면 전체 프론트엔드에 영향

## 파일

```
frontend/src/types/
  index.ts    ← 단일 파일. 모든 타입이 여기에.
```

## 현재 타입 구조

```typescript
// 저장된 게임 (API 응답)
interface Game {
  id: string
  name: string
  steam: boolean
  epic: boolean
  switch: boolean
  added_date: string    // ISO 8601 (YYYY-MM-DD)
  genre: string
  favorite: boolean
  notes: string
}

// 게임 생성 요청
interface GameCreate {
  name: string
  steam?: boolean
  epic?: boolean
  switch?: boolean
  genre?: string
  favorite?: boolean
  notes?: string
}

// 게임 수정 요청 (부분 업데이트)
interface GameUpdate {
  name?: string
  steam?: boolean
  epic?: boolean
  switch?: boolean
  genre?: string
  favorite?: boolean
  notes?: string
}

// OCR 결과 후보
interface OCRCandidate {
  name: string
  confidence: number    // 0–100
}

// OCR 처리 결과
interface OCRResult {
  image_id: string
  candidates: OCRCandidate[]
  platform_hint: string   // "steam"|"epic"|"switch"|"unknown"
}

// OCR 확정 요청
interface OCRConfirm {
  image_id: string
  selected_names: string[]
  platform?: string
}

// 저장소 현재 상태 (GET 응답)
interface StorageType {
  storage_type: string
  excel_file_path?: string
  google_sheet_id?: string
}

// 저장소 변경 요청 (POST body)
interface StorageConfig {
  storage_type: string
  excel_file_path?: string
  google_sheet_id?: string
  google_credentials_path?: string
}
```

## 규칙

### 변경 규칙
1. **B-1과 동기화 필수**: 백엔드 `models.py` 변경 시 이 파일도 반드시 함께 수정.
2. **단일 파일 유지**: 타입이 많지 않으므로 파일 분리하지 않는다.
   - 50개 이상이 될 경우에만 분리 검토.
3. **Partial<T> 활용**: 비슷한 업데이트 타입은 중복 정의 대신 `Partial<Game>`처럼 활용 가능.
   단, API 명세와 다를 경우 명시적으로 별도 interface 작성.

### 금지 사항
- 이 파일에서 다른 프론트엔드 모듈을 import 금지.
- 클래스, 함수, 상수 정의 금지 (타입/interface만).
- 컴포넌트 전용 내부 타입을 여기에 추가 금지.
  → 컴포넌트 내부 상태 타입은 해당 컴포넌트 파일 안에서 정의.

### 네이밍 규칙
- 모델 타입: `PascalCase` interface (`Game`, `OCRResult`)
- 유니언 타입: `type Platform = 'steam' | 'epic' | 'switch'`
- 타입 가드 함수가 필요하면 `shared/utils.ts`에 위치

## 확장 시나리오

### 플랫폼 추가 (예: Xbox)
```typescript
interface Game {
  // ...기존 필드
  xbox: boolean
}
interface GameCreate {
  xbox?: boolean
}
interface GameUpdate {
  xbox?: boolean
}
```

### Platform 유니언 타입 추가 (선택)
```typescript
export type Platform = 'steam' | 'epic' | 'switch'
// GameCreate.platform?: Platform 처럼 사용 가능
```
