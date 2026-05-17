import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onAdd: (payload: { name: string; steam: boolean; epic: boolean; switch: boolean; notes: string }) => Promise<void>;
}

export default function AddGameModal({ onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [steam, setSteam] = useState(false);
  const [epic, setEpic] = useState(false);
  const [sw, setSw] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('게임 이름을 입력하세요.'); return; }
    setSaving(true);
    setError('');
    try {
      await onAdd({ name: name.trim(), steam, epic, switch: sw, notes: notes.trim() });
      onClose();
    } catch {
      setError('게임 추가에 실패했습니다.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>게임 추가</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="form-label">
            게임 이름 *
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) Cyberpunk 2077"
              autoFocus
            />
          </label>

          <div className="form-label">보유 플랫폼</div>
          <div className="platform-checks">
            <label className="check-label steam-check">
              <input type="checkbox" checked={steam} onChange={(e) => setSteam(e.target.checked)} />
              Steam
            </label>
            <label className="check-label epic-check">
              <input type="checkbox" checked={epic} onChange={(e) => setEpic(e.target.checked)} />
              Epic Games
            </label>
            <label className="check-label switch-check">
              <input type="checkbox" checked={sw} onChange={(e) => setSw(e.target.checked)} />
              Nintendo Switch
            </label>
          </div>

          <label className="form-label">
            메모
            <input
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="선택 사항"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
