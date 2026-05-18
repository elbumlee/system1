import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useStorage } from '../features/storage/hooks/useStorage';
import StorageTypeSelector from '../features/storage/components/StorageTypeSelector';
import ExcelConfig from '../features/storage/components/ExcelConfig';
import SheetsConfig from '../features/storage/components/SheetsConfig';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
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
  } = useStorage();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="icon-btn header-btn" onClick={() => navigate('/')} title="뒤로">
            <ArrowLeft size={18} />
          </button>
          <h1 className="app-title">저장소 설정</h1>
        </div>
      </header>

      <main className="app-main">
        <div className="modal-body" style={{ maxWidth: 480, margin: '0 auto' }}>
          <StorageTypeSelector value={storageType} onChange={setStorageType} />

          {storageType === 'excel' && (
            <ExcelConfig value={excelPath} onChange={setExcelPath} />
          )}

          {storageType === 'sheets' && (
            <SheetsConfig
              sheetId={googleSheetId}
              credPath={credentialsPath}
              onSheetIdChange={setGoogleSheetId}
              onCredPathChange={setCredentialsPath}
            />
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              닫기
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              <Save size={15} /> {saving ? '적용 중...' : '적용'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
