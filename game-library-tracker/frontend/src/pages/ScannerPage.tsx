import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOCR } from '../features/scanner/hooks/useOCR';
import DropZone from '../features/scanner/components/DropZone';
import ImagePreview from '../features/scanner/components/ImagePreview';
import CandidateList from '../features/scanner/components/CandidateList';
import { PLATFORMS } from '../features/platform/constants';
import type { Platform } from '../types';

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'steam', label: PLATFORMS.steam.label },
  { value: 'epic', label: PLATFORMS.epic.label },
  { value: 'switch', label: PLATFORMS.switch.label },
];

export default function ScannerPage() {
  const navigate = useNavigate();
  const {
    preview,
    uploading,
    result,
    selected,
    platform,
    confirming,
    error,
    handleFile,
    toggleCandidate,
    toggleAll,
    rename,
    setPlatform,
    reset,
    confirm,
  } = useOCR();

  async function handleConfirm() {
    const ok = await confirm();
    if (ok) {
      navigate('/');
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="icon-btn header-btn" onClick={() => navigate('/')} title="뒤로">
            <ArrowLeft size={18} />
          </button>
          <h1 className="app-title">스크린샷으로 게임 추가</h1>
        </div>
      </header>

      <main className="app-main">
        <div className="modal-body" style={{ maxWidth: 640, margin: '0 auto' }}>
          {!result ? (
            <DropZone onFile={handleFile} loading={uploading} />
          ) : (
            <>
              <ImagePreview src={preview!} onReset={reset} />

              <div className="form-label">플랫폼 선택</div>
              <div className="platform-checks">
                {PLATFORM_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`check-label ${opt.value}-check`}>
                    <input
                      type="radio"
                      name="platform"
                      value={opt.value}
                      checked={platform === opt.value}
                      onChange={() => setPlatform(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <CandidateList
                candidates={result.candidates}
                selected={selected}
                onToggle={toggleCandidate}
                onToggleAll={toggleAll}
                onRename={rename}
              />
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              취소
            </button>
            {result && (
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={selected.size === 0 || confirming}
              >
                {confirming ? '추가 중...' : `${selected.size}개 추가`}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
