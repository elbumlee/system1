import axios from 'axios';
import type { Game, OCRResult, StorageInfo } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Games
export const getGames = async (): Promise<Game[]> => {
  const res = await api.get<Game[]>('/games');
  return res.data;
};

export const createGame = async (payload: {
  name: string;
  steam: boolean;
  epic: boolean;
  switch: boolean;
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
    notes: string;
  }>
): Promise<Game> => {
  const res = await api.put<Game>(`/games/${id}`, payload);
  return res.data;
};

export const deleteGame = async (id: string): Promise<void> => {
  await api.delete(`/games/${id}`);
};

// Storage
export const getStorageType = async (): Promise<StorageInfo> => {
  const res = await api.get<StorageInfo>('/storage/type');
  return res.data;
};

export const switchStorage = async (config: {
  storage_type: string;
  excel_file_path?: string;
  google_sheet_id?: string;
  google_credentials_path?: string;
}): Promise<{ status: string; storage_type: string }> => {
  const res = await api.post('/storage/switch', config);
  return res.data;
};

// OCR
export const uploadImageForOCR = async (file: File): Promise<OCRResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<OCRResult>('/ocr/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const confirmOCRGames = async (payload: {
  image_id: string;
  selected_names: string[];
  platform?: string;
}): Promise<Game[]> => {
  const res = await api.post<Game[]>('/ocr/confirm', payload);
  return res.data;
};

// Export
export const downloadExcel = (): void => {
  window.open('/api/export/excel', '_blank');
};

export default api;
