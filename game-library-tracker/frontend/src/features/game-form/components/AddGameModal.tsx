import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import GameForm from './GameForm';
import { useGameForm } from '../hooks/useGameForm';
import { useGameMutate } from '../../library/hooks/useGameMutate';

interface Props {
  onClose: () => void;
}

export default function AddGameModal({ onClose }: Props) {
  const form = useGameForm();
  const { addGame } = useGameMutate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.isValid) {
      setError('게임 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addGame(form.getPayload());
      onClose();
    } catch {
      setError('게임 추가에 실패했습니다.');
      setSaving(false);
    }
  }

  return (
    <Modal title="게임 추가" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <GameForm form={form} error={error} />
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
