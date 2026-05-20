# F1: types — TypeScript 타입 컨텍스트

## 모듈 책임
프론트엔드 전체의 타입 계약. B1-models와 1:1 대응. 변경 시 항상 B1도 함께 수정.

## 파일
```
game-library-tracker/frontend/src/types/index.ts
```

## 현재 코드

```typescript
// game-library-tracker/frontend/src/types/index.ts

export interface Game {
  id: string;
  name: string;
  steam: boolean;
  epic: boolean;
  switch: boolean;
  added_date: string;
  genre: string;
  favorite: boolean;
  notes: string;
}

export type Platform = 'steam' | 'epic' | 'switch';

export interface OCRCandidate {
  name: string;
  confidence: number; // 0-100
}

export interface OCRResult {
  image_id: string;
  candidates: OCRCandidate[];
  platform_hint: string;
}

export interface StorageInfo {
  storage_type: 'excel' | 'sheets';
  excel_file_path?: string;
  google_sheet_id?: string;
}

export type SortField = 'name' | 'added_date';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
```

## 공개 인터페이스
```typescript
// 모든 프론트엔드 파일에서 import
import type { Game, Platform, OCRCandidate, OCRResult, SortConfig } from '../types';
```

## 이 모듈의 의존성
없음. 순수 TypeScript 타입만 정의.

## 수정 규칙

### 게임 필드 추가 (예: rating)
B1-models에서 Game.rating 추가 후 동시에 수정:
```typescript
export interface Game {
  // ...기존 필드
  rating?: number;  // 1-5, undefined=미평가
}
```
수정 대상: **이 파일** + B1-models.py (동시 수정 필수)

### 플랫폼 추가 (예: xbox)
```typescript
export type Platform = 'steam' | 'epic' | 'switch' | 'xbox';

export interface Game {
  // ...
  xbox: boolean;
}
```
수정 대상: **이 파일** + B1-models.py + F5-platform constants

## 격리 보장
- 다른 프론트엔드 모듈 import 금지
- 함수, 클래스, 상수 정의 금지 (타입/interface만)
- 컴포넌트 내부용 타입은 각 컴포넌트 파일에서 정의
