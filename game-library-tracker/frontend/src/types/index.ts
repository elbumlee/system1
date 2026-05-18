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
