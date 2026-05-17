import { useState, useRef } from 'react';
import { Upload, Camera, X, CheckSquare, Square } from 'lucide-react';
import { uploadImageForOCR, confirmOCRGames } from '../api/client';
import type { OCRResult, Platform, Game } from '../types';

interface Props {
  onClose: () => void;
  onAdded: (games: Game[]) => void;
}

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'steam', label: 'Steam' },
  { value: 'epic', label: 'Epic Games' },
  { value: 'switch', label: 'Nintendo Switch' },
];

export default function OCRUpload({ onClose, onAdded }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState<Platform>('steam');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    setResult(null);
    setSelected(new Set());
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const ocr = await uploadImageForOCR(file);
      setResult(ocr);
      setSelected(new Set(ocr.candidates));
      if (ocr.platform_hint !== 'unknown') {
        setPlatform(ocr.platform_hint as Platform);
      }
    } catch {
      setError('OCR 처리에 실패했습니다. 다른 이미지를 시도해 주세요.');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }

  function toggleCandidate(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    if (selected.size === result.candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.candidates));
    }
  }

  async function handleConfirm() {
    if (!result || selected.size === 0) return;
    setConfirming(true);
    setError('');
    try {
      const games = await confirmOCRGames({
        image_id: result.image_id,
        selected_names: Array.from(selected),
        platform,
      });
      onAdded(games);
      onClose();
    } catch {
      setError('게임 추가에 실패했습니다.');
      setConfirming(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>스크린샷으로 게임 추가</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Upload zone */}
          {!result && (
            <div
              className={`drop-zone ${uploading ? 'loading' : ''}`}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {preview ? (
                <img src={preview} alt="업로드된 이미지" className="preview-img" />
              ) : (
                <>
                  <div className="drop-icons">
                    <Upload size={32} />
                    <Camera size={32} />
                  </div>
                  <p>클릭하여 이미지 선택 또는 드래그</p>
                  <p className="drop-sub">스팀 라이브러리, 에픽 스토어, 닌텐도 스위치 화면 등</p>
                </>
              )}
              {uploading && <p className="loading-text">OCR 분석 중...</p>}
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <div className="ocr-preview-row">
                <img src={preview!} alt="업로드" className="preview-thumb" />
                <button className="btn btn-secondary btn-sm" onClick={() => { setResult(null); setPreview(null); }}>
                  다시 업로드
                </button>
              </div>

              <div className="form-label">플랫폼 선택</div>
              <div className="platform-checks">
                {PLATFORM_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`check-label ${opt.value}-check`}>
                    <input type="radio" name="platform" value={opt.value} checked={platform === opt.value} onChange={() => setPlatform(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="ocr-results-header">
                <span className="form-label">추출된 게임 목록 ({result.candidates.length}개)</span>
                <button className="btn-link" onClick={toggleAll}>
                  {selected.size === result.candidates.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>

              {result.candidates.length === 0 ? (
                <p className="ocr-no-results">게임 이름을 찾을 수 없었습니다. 더 선명한 이미지를 시도해 주세요.</p>
              ) : (
                <ul className="candidate-list">
                  {result.candidates.map((name) => (
                    <li key={name} className={`candidate-item ${selected.has(name) ? 'selected' : ''}`} onClick={() => toggleCandidate(name)}>
                      {selected.has(name) ? <CheckSquare size={16} className="check-icon active" /> : <Square size={16} className="check-icon" />}
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>취소</button>
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
      </div>
    </div>
  );
}
