import api from './client';
import type { Game, OCRResult } from '../types';

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
