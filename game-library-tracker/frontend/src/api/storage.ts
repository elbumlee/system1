import api from './client';
import type { StorageInfo } from '../types';

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

export const downloadExcel = (): void => {
  window.open('/api/export/excel', '_blank');
};
