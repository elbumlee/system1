import { useEffect, useState } from 'react';
import { getStorageType, switchStorage } from '../../../api/storage';
import { useSettingsStore } from '../../../store/settingsStore';

export function useStorage() {
  const storageType = useSettingsStore((s) => s.storageType);
  const excelPath = useSettingsStore((s) => s.excelPath);
  const googleSheetId = useSettingsStore((s) => s.googleSheetId);
  const credentialsPath = useSettingsStore((s) => s.credentialsPath);
  const setStorageType = useSettingsStore((s) => s.setStorageType);
  const setExcelPath = useSettingsStore((s) => s.setExcelPath);
  const setGoogleSheetId = useSettingsStore((s) => s.setGoogleSheetId);
  const setCredentialsPath = useSettingsStore((s) => s.setCredentialsPath);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getStorageType()
      .then((info) => {
        setStorageType(info.storage_type);
        if (info.excel_file_path) setExcelPath(info.excel_file_path);
        if (info.google_sheet_id) setGoogleSheetId(info.google_sheet_id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await switchStorage({
        storage_type: storageType,
        excel_file_path: excelPath || undefined,
        google_sheet_id: googleSheetId || undefined,
        google_credentials_path: credentialsPath || undefined,
      });
      setMessage('저장소 설정이 변경되었습니다.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '설정 저장에 실패했습니다.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return {
    storageType,
    excelPath,
    googleSheetId,
    credentialsPath,
    setStorageType,
    setExcelPath,
    setGoogleSheetId,
    setCredentialsPath,
    saving,
    message,
    error,
    save,
  };
}
