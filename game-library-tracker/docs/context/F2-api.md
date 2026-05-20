# F2: api — HTTP 클라이언트 컨텍스트

## 모듈 책임
백엔드 API 호출 함수 모음. 새 API 엔드포인트 추가 시 이 모듈만 수정.

## 파일
```
game-library-tracker/frontend/src/api/client.ts
game-library-tracker/frontend/src/api/games.ts
game-library-tracker/frontend/src/api/ocr.ts
game-library-tracker/frontend/src/api/storage.ts
```

## 현재 코드

### api/client.ts
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export default api;
```

### api/games.ts
```typescript
import api from './client';
import type { Game } from '../types';

export const getGames = async (): Promise<Game[]> => {
  const res = await api.get<Game[]>('/games');
  return res.data;
};

export const createGame = async (payload: {
  name: string;
  steam: boolean;
  epic: boolean;
  switch: boolean;
  genre: string;
  favorite: boolean;
  notes: string;
}): Promise<Game> => {
  const res = await api.post<Game>('/games', payload);
  return res.data;
};

export const updateGame = async (
  id: string,
  payload: Partial<{
    name: string;
    steam: boolean;
    epic: boolean;
    switch: boolean;
    genre: string;
    favorite: boolean;
    notes: string;
  }>
): Promise<Game> => {
  const res = await api.put<Game>(`/games/${id}`, payload);
  return res.data;
};

export const deleteGame = async (id: string): Promise<void> => {
  await api.delete(`/games/${id}`);
};
```

### api/ocr.ts
```typescript
import api from './client';
import type { OCRResult, Game } from '../types';

export const uploadImage = async (file: File): Promise<OCRResult> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<OCRResult>('/ocr/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const confirmOCR = async (payload: {
  image_id: string;
  selected_names: string[];
  platform?: string;
}): Promise<Game[]> => {
  const res = await api.post<Game[]>('/ocr/confirm', payload);
  return res.data;
};
```

### api/storage.ts
```typescript
import api from './client';
import type { StorageInfo } from '../types';

export const getStorageType = async (): Promise<StorageInfo> => {
  const res = await api.get<StorageInfo>('/storage/type');
  return res.data;
};

export const switchStorage = async (payload: {
  storage_type: string;
  excel_file_path?: string;
  google_sheet_id?: string;
  google_credentials_path?: string;
}): Promise<void> => {
  await api.post('/storage/switch', payload);
};

export const downloadExcel = () => {
  window.open('/api/export/excel', '_blank');
};
```

## 이 모듈의 의존성
```typescript
import type { Game, OCRResult, StorageInfo } from '../types';  // F1만 참조
```

## 수정 규칙

### 새 API 함수 추가 (예: 게임 검색)
```typescript
// api/games.ts에 추가
export const searchGames = async (q: string): Promise<Game[]> => {
  const res = await api.get<Game[]>('/games/search', { params: { q } });
  return res.data;
};
```
수정 대상: **api/games.ts만**

### 새 필드 전송 추가 (예: rating)
```typescript
// createGame payload에 추가
rating?: number;
```
수정 대상: **api/games.ts만**

## 격리 보장
- store(Zustand) import 금지
- UI 로직 (toast, navigate) 금지
- api 파일끼리 서로 import 금지 (모두 client.ts만 공유)
- 에러 처리 없음 → 호출한 store/hook이 처리
