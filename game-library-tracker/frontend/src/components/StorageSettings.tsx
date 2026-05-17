import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getStorageType, switchStorage } from '../api/client';

interface Props {
  onClose: () => void;
}

export default function StorageSettings({ onClose }: Props) {
  const [storageType, setStorageType] = useState<'excel' | 'sheets'>('excel');
  const [excelPath, setExcelPath] = useState('~/game_library.xlsx');
  const [sheetId, setSheetId] = useState('');
  const [credPath, setCredPath] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getStorageType().then((info) => {
      setStorageType(info.storage_type);
      if (info.excel_file_path) setExcelPath(info.excel_file_path);
      if (info.google_sheet_id) setSheetId(info.google_sheet_id);
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await switchStorage({
        storage_type: storageType,
        excel_file_path: excelPath || undefined,
        google_sheet_id: sheetId || undefined,
        google_credentials_path: credPath || undefined,
      });
      setMessage('저장소 설정이 변경되었습니다.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '설정 저장에 실패했습니다.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>저장소 설정</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-label">저장 방식</div>
          <div className="storage-radio-group">
            <label className="radio-label">
              <input type="radio" name="storage" value="excel" checked={storageType === 'excel'} onChange={() => setStorageType('excel')} />
              <span>Excel 파일 (.xlsx)</span>
              <span className="radio-desc">로컬에 파일로 저장</span>
            </label>
            <label className="radio-label">
              <input type="radio" name="storage" value="sheets" checked={storageType === 'sheets'} onChange={() => setStorageType('sheets')} />
              <span>Google Sheets</span>
              <span className="radio-desc">구글 드라이브에 저장</span>
            </label>
          </div>

          {storageType === 'excel' && (
            <label className="form-label">
              파일 경로
              <input
                className="form-input"
                value={excelPath}
                onChange={(e) => setExcelPath(e.target.value)}
                placeholder="~/game_library.xlsx"
              />
            </label>
          )}

          {storageType === 'sheets' && (
            <>
              <label className="form-label">
                Google Sheet ID
                <input
                  className="form-input"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  placeholder="스프레드시트 URL의 /d/ 뒤 ID"
                />
              </label>
              <label className="form-label">
                서비스 계정 JSON 경로
                <input
                  className="form-input"
                  value={credPath}
                  onChange={(e) => setCredPath(e.target.value)}
                  placeholder="~/credentials.json"
                />
              </label>
              <p className="form-hint">
                Google Cloud Console에서 서비스 계정을 생성하고, 해당 계정에 스프레드시트 편집 권한을 부여하세요.
              </p>
            </>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>닫기</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? '적용 중...' : '적용'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
