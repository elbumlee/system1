# F-2: api — HTTP 클라이언트

## 책임 범위

- 백엔드 API 호출 함수 모음
- fetch 설정 (base URL, headers, error handling)
- F-1(types)의 타입으로 입출력 정의

## 파일

```
frontend/src/api/
  client.ts       ← 공통 fetch 래퍼
  games.ts        ← /api/games 호출 함수
  ocr.ts          ← /api/ocr 호출 함수
  storage.ts      ← /api/storage 호출 함수
```

## 인터페이스

### client.ts
```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

async function request<T>(path: string, init?: RequestInit): Promise<T>
// 4xx/5xx 응답 시 throw Error(응답 메시지)
```

### games.ts
```typescript
export async function fetchGames(): Promise<Game[]>
export async function createGame(data: GameCreate): Promise<Game>
export async function updateGame(id: string, data: GameUpdate): Promise<Game>
export async function deleteGame(id: string): Promise<void>
```

### ocr.ts
```typescript
export async function uploadImage(file: File): Promise<OCRResult>
export async function confirmOCR(data: OCRConfirm): Promise<Game[]>
```

### storage.ts
```typescript
export async function getStorageType(): Promise<StorageType>
export async function switchStorage(config: StorageConfig): Promise<void>
```

## 규칙

### 변경 규칙
1. **새 엔드포인트 추가**: 해당 도메인 파일에 함수 추가.
   - `/api/games/search` → `games.ts`에 `searchGames()` 추가
2. **URL 변경**: `client.ts`의 `BASE_URL` 또는 각 함수의 경로만 수정.
3. **공통 헤더 추가 (예: 인증 토큰)**: `client.ts`의 `request()` 함수만 수정.

### 금지 사항
- API 함수에서 상태(store) 직접 업데이트 금지 → store의 action이 호출 후 처리.
- API 함수에서 UI 로직(toast, navigation) 금지.
- 파일 간 import 금지 (games.ts가 ocr.ts를 import 금지). 모두 client.ts만 공유.

### 에러 처리
- `client.ts`에서 HTTP 에러를 `Error` 객체로 throw.
- API 함수는 에러를 re-throw (잡지 않음).
- 에러 처리는 호출하는 store action 또는 hook에서 담당.

## 환경 변수

```
VITE_API_URL=http://localhost:8000   # 개발
VITE_API_URL=http://192.168.x.x:8000 # 모바일 접속
```

모바일에서 접속 시 `.env.local`에서 PC IP로 변경.
