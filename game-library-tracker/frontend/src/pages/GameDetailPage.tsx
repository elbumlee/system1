import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useGameMutate } from '../features/library/hooks/useGameMutate';
import { useGameForm } from '../features/game-form/hooks/useGameForm';
import GameForm from '../features/game-form/components/GameForm';

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const game = useGameStore((s) => s.games.find((g) => g.id === id));
  const { editGame } = useGameMutate();

  const form = useGameForm(game);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!game) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <button className="icon-btn header-btn" onClick={() => navigate('/')} title="뒤로">
              <ArrowLeft size={18} />
            </button>
            <h1 className="app-title">게임 상세</h1>
          </div>
        </header>
        <main className="app-main">
          <div className="table-empty">게임을 찾을 수 없습니다.</div>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.isValid) {
      setError('게임 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await editGame(game.id, form.getPayload());
      setSuccess('저장되었습니다.');
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="icon-btn header-btn" onClick={() => navigate('/')} title="뒤로">
            <ArrowLeft size={18} />
          </button>
          <h1 className="app-title">{game.name}</h1>
        </div>
      </header>

      <main className="app-main">
        <div className="modal-body" style={{ maxWidth: 480, margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <GameForm form={form} error={error} />

            {success && <p className="form-success">{success}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                뒤로
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={15} /> {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
