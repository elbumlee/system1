import { create } from 'zustand';

interface SettingsStore {
  storageType: 'excel' | 'sheets';
  excelPath: string;
  googleSheetId: string;
  credentialsPath: string;
  setStorageType: (t: 'excel' | 'sheets') => void;
  setExcelPath: (p: string) => void;
  setGoogleSheetId: (id: string) => void;
  setCredentialsPath: (p: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  storageType: 'excel',
  excelPath: '~/game_library.xlsx',
  googleSheetId: '',
  credentialsPath: '',
  setStorageType: (t) => set({ storageType: t }),
  setExcelPath: (p) => set({ excelPath: p }),
  setGoogleSheetId: (id) => set({ googleSheetId: id }),
  setCredentialsPath: (p) => set({ credentialsPath: p }),
}));
